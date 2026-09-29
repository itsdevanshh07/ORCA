package com.example.demo.controllers;

import com.example.demo.models.TenantProject;
import com.example.demo.models.User;
import com.example.demo.repositories.TenantProjectRepository;
import com.example.demo.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private TenantProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    public static class CreateProjectRequest {
        private String name;
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    public static class ProjectResponse {
        public String id;
        public String name;
        public String status;
        public String dateCreated;
        public String apiKey;

        public ProjectResponse(String id, String name, String status, String dateCreated, String apiKey) {
            this.id = id;
            this.name = name;
            this.status = status;
            this.dateCreated = dateCreated;
            this.apiKey = apiKey;
        }
    }

    // ==========================================
    // GET: Fetch all projects for the logged-in user
    // ==========================================
    @GetMapping
    public Mono<ResponseEntity<?>> getUserProjects() {
        return ReactiveSecurityContextHolder.getContext()
            .map(ctx -> ctx.getAuthentication().getName())
            .flatMap(username -> Mono.<ResponseEntity<?>>fromCallable(() -> {
                
                System.out.println("Fetching projects for user: " + username);
                
                User user = userRepository.findByUsername(username).orElseThrow();
                List<TenantProject> rawProjects = projectRepository.findByUserId(user.getId());

                List<ProjectResponse> formattedProjects = rawProjects.stream().map(p -> new ProjectResponse(
                        p.getId().toString(),
                        p.getProjectName(),
                        p.isActive() ? "Active" : "Paused",
                        p.getCreatedAt() != null ? p.getCreatedAt().toString().split("T")[0] : "Just now",
                        p.getApiKey()
                )).collect(Collectors.toList());

                return ResponseEntity.ok(Map.of("data", formattedProjects));

            }).subscribeOn(Schedulers.boundedElastic()));
    }

    // ==========================================
    // POST: Create a brand new project
    // ==========================================
    @PostMapping
    public Mono<ResponseEntity<?>> createProject(@RequestBody CreateProjectRequest request) {
        return ReactiveSecurityContextHolder.getContext()
            .map(ctx -> ctx.getAuthentication().getName())
            .flatMap(username -> Mono.<ResponseEntity<?>>fromCallable(() -> {
                
                User user = userRepository.findByUsername(username)
                        .orElseThrow(() -> new RuntimeException("User not found"));

                TenantProject newProject = new TenantProject();
                
                newProject.setProjectName(request.getName());
                newProject.setUserId(user.getId());
                newProject.setApiKey("orca_" + UUID.randomUUID().toString().replace("-", ""));
                newProject.setActive(true);
                newProject.setCreatedAt(LocalDateTime.now());

                
                TenantProject savedProject = projectRepository.saveAndFlush(newProject);

                ProjectResponse projectData = new ProjectResponse(
                        savedProject.getId().toString(),
                        savedProject.getProjectName(),
                        "Active",
                        savedProject.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
                        savedProject.getApiKey()
                );

                return ResponseEntity.ok(Map.of("data", projectData));
            }).subscribeOn(Schedulers.boundedElastic()));
    }
}
