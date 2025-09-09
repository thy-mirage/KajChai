package com.example.KajChai.Controller;

import com.example.KajChai.DTO.AuthResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/public")
    public ResponseEntity<String> publicEndpoint() {
        return ResponseEntity.ok("This is a public endpoint");
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
