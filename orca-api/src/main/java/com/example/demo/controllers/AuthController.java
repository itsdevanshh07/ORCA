package com.example.demo.controllers;

import com.example.demo.models.User;
import com.example.demo.repositories.UserRepository;
import com.example.demo.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ==========================================
    // 1. LOGIN LOGIC
    // ==========================================
    public static class LoginRequest {
        private String username;
        private String password;
        
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    @PostMapping("/login")
    public Mono<ResponseEntity<Map<String, String>>> login(@RequestBody LoginRequest request) {
        return Mono.fromCallable(() -> {
            String loginInput = request.getUsername(); 
            
            Optional<User> userOpt = userRepository.findByUsernameOrEmail(loginInput, loginInput);

            if (userOpt.isEmpty()) {
                System.out.println("REJECTED: No account found for '" + loginInput + "'");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid Credentials"));
            }

            User dbUser = userOpt.get();

            if (!passwordEncoder.matches(request.getPassword(), dbUser.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid Credentials"));
            }

            String token = jwtUtil.generateToken(dbUser.getUsername()); 
            return ResponseEntity.ok(Map.<String, String>of("token", token));
            
        }).subscribeOn(Schedulers.boundedElastic());
    }

    // ==========================================
    // 2. SIGNUP LOGIC
    // ==========================================
    public static class SignupRequest {
        private String fullName;
        private String email;
        private String password;
        
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    @PostMapping("/signup")
    public Mono<ResponseEntity<Map<String, String>>> signup(@RequestBody SignupRequest request) {
        return Mono.fromCallable(() -> {
            
            // 1. Check if email is already used
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email is already registered"));
            }

            // 2. Auto-generate a username from the email
            String generatedUsername = request.getEmail().split("@")[0];
            
            // Ensure the generated username isn't taken (add random numbers if it is)
            if (userRepository.findByUsername(generatedUsername).isPresent()) {
                generatedUsername = generatedUsername + (int)(Math.random() * 1000);
            }

            // 3. Create the clean user object
            User newUser = new User();
            newUser.setFullName(request.getFullName());
            newUser.setEmail(request.getEmail());
            newUser.setUsername(generatedUsername); 
            newUser.setPassword(passwordEncoder.encode(request.getPassword()));
            newUser.setRole("ADMIN"); 

            userRepository.save(newUser);
            String token = jwtUtil.generateToken(newUser.getUsername());
            return ResponseEntity.ok(Map.of("token", token));
            
        }).subscribeOn(Schedulers.boundedElastic());
    }
}
