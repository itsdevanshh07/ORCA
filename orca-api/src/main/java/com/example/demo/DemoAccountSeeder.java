package com.example.demo;

import com.example.demo.models.TenantProject;
import com.example.demo.models.User;
import com.example.demo.repositories.TenantProjectRepository;
import com.example.demo.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DemoAccountSeeder implements CommandLineRunner {
    private final UserRepository users;
    private final TenantProjectRepository projects;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String email;
    private final String password;
    private final String apiKey;

    public DemoAccountSeeder(
            UserRepository users,
            TenantProjectRepository projects,
            PasswordEncoder passwordEncoder,
            @Value("${DEMO_USERNAME:}") String username,
            @Value("${DEMO_EMAIL:}") String email,
            @Value("${DEMO_PASSWORD:}") String password,
            @Value("${DEMO_API_KEY:}") String apiKey) {
        this.users = users;
        this.projects = projects;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.email = email;
        this.password = password;
        this.apiKey = apiKey;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (blank(username) || blank(email) || blank(password) || blank(apiKey)) {
            return;
        }

        User user = users.findByUsername(username).orElseGet(() -> {
            User created = new User();
            created.setUsername(username);
            created.setEmail(email);
            created.setFullName("ORCA Demo");
            created.setPassword(passwordEncoder.encode(password));
            created.setRole("ADMIN");
            return users.save(created);
        });

        if (projects.findByApiKey(apiKey).isEmpty()) {
            TenantProject project = new TenantProject();
            project.setUserId(user.getId());
            project.setProjectName("ORCA Demo Project");
            project.setApiKey(apiKey);
            project.setActive(true);
            projects.save(project);
        }
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
