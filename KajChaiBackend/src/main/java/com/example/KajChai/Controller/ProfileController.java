package com.example.KajChai.Controller;

import com.example.KajChai.DTO.*;
import com.example.KajChai.DatabaseEntity.User;
import com.example.KajChai.Service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowCredentials = "false")
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ProfileResponse.builder()
                                .success(false)
                                .message("Not authenticated")
                                .build());
            }
            
            User user = (User) authentication.getPrincipal();
            Object profileData = profileService.getProfile(user);
            
            return ResponseEntity.ok(ProfileResponse.builder()
                    .success(true)
                    .message("Profile retrieved successfully")
                    .role(user.getRole())
                    .data(profileData)
                    .build());
                    
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ProfileResponse.builder()
                            .success(false)
                            .message("Failed to get profile: " + e.getMessage())
                            .build());
        }
    }

    @GetMapping("/customer")
    public ResponseEntity<ProfileResponse> getCustomerProfile() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ProfileResponse.builder()
                                .success(false)
                                .message("Not authenticated")
                                .build());
            }
            
            User user = (User) authentication.getPrincipal();
            CustomerProfileResponse profileData = profileService.getCustomerProfile(user.getEmail());
            
            return ResponseEntity.ok(ProfileResponse.builder()
                    .success(true)
                    .message("Customer profile retrieved successfully")
                    .role(user.getRole())
                    .data(profileData)
                    .build());
                    
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ProfileResponse.builder()
                            .success(false)
                            .message("Failed to get customer profile: " + e.getMessage())
                            .build());
        }
    }

    @GetMapping("/worker")
    public ResponseEntity<ProfileResponse> getWorkerProfile() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ProfileResponse.builder()
                                .success(false)
                                .message("Not authenticated")
                                .build());
            }
            
            User user = (User) authentication.getPrincipal();
            WorkerProfileResponse profileData = profileService.getWorkerProfile(user.getEmail());
            
            return ResponseEntity.ok(ProfileResponse.builder()
                    .success(true)
                    .message("Worker profile retrieved successfully")
                    .role(user.getRole())
                    .data(profileData)
                    .build());
                    
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ProfileResponse.builder()
                            .success(false)
                            .message("Failed to get worker profile: " + e.getMessage())
                            .build());
        }
    }

    @PutMapping("/customer")
    public ResponseEntity<ProfileResponse> updateCustomerProfile(@Valid @RequestBody CustomerProfileUpdateRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ProfileResponse.builder()
                                .success(false)
                                .message("Not authenticated")
                                .build());
            }
            
            User user = (User) authentication.getPrincipal();
            CustomerProfileResponse profileData = profileService.updateCustomerProfile(user.getEmail(), request);
            
            return ResponseEntity.ok(ProfileResponse.builder()
                    .success(true)
                    .message("Customer profile updated successfully")
                    .role(user.getRole())
                    .data(profileData)
                    .build());
                    
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ProfileResponse.builder()
                            .success(false)
                            .message("Failed to update customer profile: " + e.getMessage())
                            .build());
        }
    }

    @PutMapping("/worker")
    public ResponseEntity<ProfileResponse> updateWorkerProfile(@Valid @RequestBody WorkerProfileUpdateRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ProfileResponse.builder()
                                .success(false)
                                .message("Not authenticated")
                                .build());
            }
            
            User user = (User) authentication.getPrincipal();
            WorkerProfileResponse profileData = profileService.updateWorkerProfile(user.getEmail(), request);
            
            return ResponseEntity.ok(ProfileResponse.builder()
                    .success(true)
                    .message("Worker profile updated successfully")
                    .role(user.getRole())
                    .data(profileData)
                    .build());
                    
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ProfileResponse.builder()
                            .success(false)
                            .message("Failed to update worker profile: " + e.getMessage())
                            .build());
        }
    }
}
