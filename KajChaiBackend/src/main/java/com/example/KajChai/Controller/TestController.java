package com.example.KajChai.Controller;

import com.example.KajChai.DTO.AuthResponse;
import com.example.KajChai.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {

    private final UserRepository userRepository;

    @GetMapping("/public")
    public ResponseEntity<String> publicEndpoint() {
        return ResponseEntity.ok("This is a public endpoint");
    }

    @GetMapping("/database")
    public ResponseEntity<AuthResponse> testDatabase() {
        try {
            long userCount = userRepository.count();
            return ResponseEntity.ok(AuthResponse.builder()
                    .success(true)
                    .message("Database connection successful! Users count: " + userCount)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.ok(AuthResponse.builder()
                    .success(false)
                    .message("Database connection failed: " + e.getMessage())
                    .build());
        }
    }

    @GetMapping("/customer")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<AuthResponse> customerEndpoint() {
        return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("Welcome Customer!")
                .build());
    }

    @GetMapping("/worker")
    @PreAuthorize("hasRole('WORKER')")
    public ResponseEntity<AuthResponse> workerEndpoint() {
        return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("Welcome Worker!")
                .build());
    }

    @GetMapping("/protected")
    public ResponseEntity<AuthResponse> protectedEndpoint() {
        return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("This is a protected endpoint - you are authenticated!")
                .build());
    }
}
