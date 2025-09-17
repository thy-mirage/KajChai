package com.example.KajChai.Controller;

import com.example.KajChai.DTO.*;
import com.example.KajChai.DatabaseEntity.User;
import com.example.KajChai.Service.ProfileService;
import com.example.KajChai.CloudinaryConfiguration.CloudinaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowCredentials = "false")
public class ProfileController {

    private final ProfileService profileService;
    private final CloudinaryService cloudinaryService;

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

    @PutMapping(value = "/customer-with-photo", consumes = "multipart/form-data")
    public ResponseEntity<ProfileResponse> updateCustomerProfileWithPhoto(
            @RequestParam("customerName") String customerName,
            @RequestParam("phone") String phone,
            @RequestParam("gender") String gender,
            @RequestParam("latitude") Double latitude,
            @RequestParam("longitude") Double longitude,
            @RequestParam("city") String city,
            @RequestParam("upazila") String upazila,
            @RequestParam("district") String district,
            @RequestParam(value = "fullAddress", required = false) String fullAddress,
            @RequestParam(value = "photo", required = false) MultipartFile photo) {
        
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
            String photoUrl = null;
            
            // Upload photo to Cloudinary if provided
            if (photo != null && !photo.isEmpty()) {
                photoUrl = cloudinaryService.uploadFile(photo, "kajchai/profile-photos");
            }
            
            // Create update request
            CustomerProfileUpdateRequest request = CustomerProfileUpdateRequest.builder()
                    .customerName(customerName)
                    .photo(photoUrl) // This will be null if no photo uploaded, which is fine
                    .phone(phone)
                    .gender(gender)
                    .latitude(latitude)
                    .longitude(longitude)
                    .city(city)
                    .upazila(upazila)
                    .district(district)
                    .fullAddress(fullAddress)
                    .build();
            
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

    @PutMapping(value = "/worker-with-photo", consumes = "multipart/form-data")
    public ResponseEntity<ProfileResponse> updateWorkerProfileWithPhoto(
            @RequestParam("name") String name,
            @RequestParam("phone") String phone,
            @RequestParam("gender") String gender,
            @RequestParam("latitude") Double latitude,
            @RequestParam("longitude") Double longitude,
            @RequestParam("city") String city,
            @RequestParam("upazila") String upazila,
            @RequestParam("district") String district,
            @RequestParam(value = "fullAddress", required = false) String fullAddress,
            @RequestParam("field") String field,
            @RequestParam(value = "experience", required = false) Float experience,
            @RequestParam(value = "photo", required = false) MultipartFile photo) {
        
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
            String photoUrl = null;
            
            // Upload photo to Cloudinary if provided
            if (photo != null && !photo.isEmpty()) {
                photoUrl = cloudinaryService.uploadFile(photo, "kajchai/profile-photos");
            }
            
            // Create update request
            WorkerProfileUpdateRequest request = WorkerProfileUpdateRequest.builder()
                    .name(name)
                    .photo(photoUrl)
                    .phone(phone)
                    .gender(gender)
                    .latitude(latitude)
                    .longitude(longitude)
                    .city(city)
                    .upazila(upazila)
                    .district(district)
                    .fullAddress(fullAddress)
                    .field(field)
                    .experience(experience)
                    .build();
            
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

    @GetMapping("/workers")
    public ResponseEntity<?> getAllWorkers(
            @RequestParam(required = false) String field,
            @RequestParam(required = false, defaultValue = "false") Boolean sortByLocation,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            // Create pageable
            Pageable pageable = PageRequest.of(page, size);
            Page<WorkerProfileResponse> workersPage = profileService.getAllWorkersPaginated(field, pageable);
            
            List<WorkerProfileResponse> workers = workersPage.getContent();
            
            // Apply location-based sorting if requested and user is a customer
            if (sortByLocation && authentication != null && authentication.isAuthenticated()) {
                try {
                    User user = (User) authentication.getPrincipal();
                    if (user.getRole().name().equals("CUSTOMER")) {
                        workers = profileService.sortWorkersByLocationForCustomer(workers, user.getEmail());
                    }
                } catch (Exception e) {
                    // If there's any error with location sorting, just return unsorted results
                    System.err.println("Error sorting workers by location: " + e.getMessage());
                }
            }
            
            // Create paginated response
            Map<String, Object> response = new HashMap<>();
            response.put("workers", workers);
            response.put("currentPage", workersPage.getNumber());
            response.put("totalPages", workersPage.getTotalPages());
            response.put("totalElements", workersPage.getTotalElements());
            response.put("size", workersPage.getSize());
            response.put("hasNext", workersPage.hasNext());
            response.put("hasPrevious", workersPage.hasPrevious());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ProfileResponse.builder()
                            .success(false)
                            .message("Failed to get workers: " + e.getMessage())
                            .build());
        }
    }
    
    @GetMapping("/search-workers")
    public ResponseEntity<?> searchWorkers(
            @RequestParam String query,
            @RequestParam(required = false) String field,
            @RequestParam(defaultValue = "5") int limit) {
        try {
            // Build search request
            WorkerSearchRequest searchRequest = WorkerSearchRequest.builder()
                    .query(query)
                    .field(field)
                    .limit(limit)
                    .build();
            
            // Perform search
            List<WorkerSearchResult> results = profileService.searchWorkers(searchRequest);
            
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ProfileResponse.builder()
                            .success(false)
                            .message("Failed to search workers: " + e.getMessage())
                            .build());
        }
    }
}
