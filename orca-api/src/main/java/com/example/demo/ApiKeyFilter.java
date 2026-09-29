package com.example.demo;

import com.example.demo.repositories.TenantProjectRepository;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Component
public class ApiKeyFilter implements WebFilter {

    private final TenantProjectRepository tenantRepository;

    public ApiKeyFilter(TenantProjectRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getPath().value();

        // 1. THE BYPASS: Let metrics, surgeries, auth, projects, AND orca stats skip the API key check!
        if (path.startsWith("/api/metrics") || 
            path.startsWith("/api/surgeries") || 
            path.startsWith("/api/auth/") ||
            path.startsWith("/api/projects") ||
            path.startsWith("/api/orca") || 
            path.equals("/actuator/health") ||
            path.startsWith("/actuator/health/") ||
            exchange.getRequest().getMethod() == HttpMethod.OPTIONS) {
            return chain.filter(exchange);
        }

        // 2. Extract the header for all other routes
        String providedKey = exchange.getRequest().getHeaders().getFirst("x-api-key");

        // 3. Reject if no key is provided
        if (providedKey == null || providedKey.isBlank()) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        // 4. Safely check the database
        return Mono.fromCallable(() -> tenantRepository.findByApiKey(providedKey))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(tenantOpt -> {
                    if (tenantOpt.isEmpty()) {
                        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                        return exchange.getResponse().setComplete();
                    }
                    
                    exchange.getAttributes().put("AUTHORIZED_PROJECT", tenantOpt.get());
                    
                    return chain.filter(exchange);
                });
    }
}
