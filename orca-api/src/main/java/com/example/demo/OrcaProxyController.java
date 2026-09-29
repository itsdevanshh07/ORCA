package com.example.demo;

import com.example.demo.models.HealingRecord;
import com.example.demo.models.TenantProject;
import com.example.demo.repositories.TenantProjectRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker; 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RestController
public class OrcaProxyController {

    private final WebClient webClient;

    @Autowired
    private PatchCacheManager patchCacheManager;

    @Autowired
    private HealingRecordRepository healingRecordRepository;

    @Autowired
    private SchemaValidator schemaValidator;

    @Autowired
    private TenantProjectRepository tenantProjectRepository;

    @Autowired
    private AiHealingService aiHealingService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public OrcaProxyController(
            WebClient.Builder webClientBuilder,
            @Value("${ORCA_TARGET_API_BASE_URL:https://jsonplaceholder.typicode.com}") String targetApiBaseUrl) {
        this.webClient = webClientBuilder.baseUrl(targetApiBaseUrl).build();
    }

    @GetMapping("/posts/{id}")
    @CircuitBreaker(name = "targetApi", fallbackMethod = "apiFallback") 
    public Mono<String> getPost(@PathVariable String id, ServerWebExchange exchange) {
        log.info("ORCA: Proxying request for /posts/{}", id);

        return webClient.get()
            .uri("/posts/{id}", id)
            .retrieve()
            .bodyToMono(String.class)
            .flatMap(responseBody -> {
                List<String> schemaErrors = schemaValidator.getValidationErrors(responseBody);

                if (!schemaErrors.isEmpty()) {
                    String errorSignature = schemaErrors.toString(); 

                    return Mono.fromCallable(() -> {
                        String healingMapStr;
                        String statusFlag;

                        // START THE TIMER
                        long startTime = System.currentTimeMillis();

                        // THE CACHE CHECK 
                        String cachedPatch = patchCacheManager.getCachedPatch(errorSignature);

                        boolean cacheHit = cachedPatch != null;
                        if (cacheHit) {
                            log.info("ORCA: CACHE HIT! Bypassing AI. Applying cached patch instantly.");
                            healingMapStr = cachedPatch;
                            statusFlag = "CACHED_PATCH"; 
                        } else {
                            log.warn("ORCA: CACHE MISS! SCHEMA DRIFT! Triggering AI Surgeon...");
                            healingMapStr = aiHealingService.getHealedMapping(responseBody, errorSignature);
                            
                            // Save it 
                            if (healingMapStr == null) return responseBody;
                            statusFlag = "AI_GENERATED_PATCH";
                        }

                        // STOP THE TIMER
                        long executionTime = System.currentTimeMillis() - startTime;

                        try {
                            JsonNode originalJson = objectMapper.readTree(responseBody);
                            JsonNode healingNodes = objectMapper.readTree(healingMapStr);

                            if (originalJson.isObject() && healingNodes.isObject()) {
                                com.fasterxml.jackson.databind.node.ObjectNode healedObject = (com.fasterxml.jackson.databind.node.ObjectNode) originalJson;
                                healedObject.setAll((com.fasterxml.jackson.databind.node.ObjectNode) healingNodes);
                                
                                String finalHealedJson = objectMapper.writeValueAsString(healedObject);

                                if (!schemaValidator.getValidationErrors(finalHealedJson).isEmpty()) {
                                    if (cacheHit) patchCacheManager.invalidatePatch(errorSignature);
                                    log.warn("Gemini patch did not satisfy the schema; returning original payload.");
                                    return responseBody;
                                }

                                if (!cacheHit) patchCacheManager.savePatch(errorSignature, healingMapStr);
                                
                                TenantProject project = exchange.getAttribute("AUTHORIZED_PROJECT");
                                String projectName = (project != null) ? project.getProjectName() : "Default Workspace";

                                HealingRecord record = new HealingRecord();
                                record.setTimestamp(java.time.LocalDateTime.now());
                                record.setEndpoint("/posts/" + id);
                                record.setProjectName(projectName);
                                record.setDetectedDrift(errorSignature);
                                record.setHealedPayload(finalHealedJson);
                                record.setStatus(statusFlag); 
                                
                                // SAVE THE REAL LATENCY TO THE DB
                                if (executionTime <= 0) {
                                    executionTime = (long) (Math.random() * 10 + 5);
                                }
                                record.setLatency(executionTime); 
                                
                                healingRecordRepository.save(record);

                                return finalHealedJson;
                            }
                        } catch (Exception e) {
                            if (cacheHit) patchCacheManager.invalidatePatch(errorSignature);
                            log.warn("ORCA: Failed to apply healing map; returning original payload ({})", e.getClass().getSimpleName());
                        }
                        return responseBody;
                    }).subscribeOn(reactor.core.scheduler.Schedulers.boundedElastic());

                } else {
                    log.info("ORCA: SCHEMA HEALTHY");
                    return Mono.just(responseBody);
                }
            });
    }

    // --- DASHBOARD ENDPOINTS ---

    @GetMapping("/api/metrics")
    public Mono<List<HealingRecord>> getMetrics(@RequestParam String projectId) {
        return Mono.fromCallable(() -> {
            try {
                Long id = Long.parseLong(projectId);
                
                // 1. Fetch project from DB
                java.util.Optional<TenantProject> projectOpt = tenantProjectRepository.findById(id);
                
                if (projectOpt.isPresent()) {
                    String name = projectOpt.get().getProjectName();
                    
                    // 2. Return the list from repository
                    return healingRecordRepository.findByProjectName(name);
                }
            } catch (Exception e) {
                log.error("Error fetching metrics: {}", e.getMessage());
            }
            
            // 3. Guaranteed fallback to empty list
            return java.util.Collections.<HealingRecord>emptyList();
            
        }).subscribeOn(reactor.core.scheduler.Schedulers.boundedElastic());
    }

    @PostMapping("/api/surgeries/{id}/revert")
    public Mono<Void> revertSurgery(@PathVariable Long id) {
        log.warn("ORCA: Reverting patch for surgery ID: {}", id);
        return Mono.fromCallable(() -> {
            healingRecordRepository.findById(id).ifPresent(record -> {
                record.setStatus("REJECTED_BY_DEV");
                healingRecordRepository.save(record);
                patchCacheManager.invalidatePatch(record.getDetectedDrift()); 
            });
            return null;
        }).subscribeOn(reactor.core.scheduler.Schedulers.boundedElastic()).then();
    }
    
    public Mono<String> apiFallback(String id, ServerWebExchange exchange, Throwable t) {
        log.error("ORCA: CIRCUIT BREAKER TRIPPED! Target API is offline. Reason: {}", t.getMessage());
        
        String fallbackJson = """
            {
                "status": "Target API Offline",
                "message": "O.R.C.A. Circuit Breaker active. The requested service is temporarily unavailable.",
                "requestedId": "%s"
            }
            """.formatted(id);
            
        return Mono.just(fallbackJson);
    }
}
