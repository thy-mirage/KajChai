package com.example.KajChai.Controller;

import com.example.KajChai.DTO.*;
import com.example.KajChai.Service.HirePostService;
import com.example.KajChai.DatabaseEntity.Customer;
import com.example.KajChai.DatabaseEntity.Worker;
import com.example.KajChai.DatabaseEntity.User;
import com.example.KajChai.Repository.CustomerRepository;
import com.example.KajChai.Repository.WorkerRepository;
import com.example.KajChai.Enum.UserRole;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/hireposts")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class HirePostController {
    
    private final HirePostService hirePostService;
    private final CustomerRepository customerRepository;
    private final WorkerRepository workerRepository;
    
    @PostMapping
    public ResponseEntity<?> createHirePost(@Valid @RequestBody HirePostCreateRequest request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer customerId = getUserIdFromAuth(auth, "CUSTOMER");
            
            HirePostResponse response = hirePostService.createHirePost(request, customerId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to create hire post", e.getMessage()));
        }
    }
    
    @GetMapping("/my-posts")
    public ResponseEntity<?> getMyHirePosts() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer customerId = getUserIdFromAuth(auth, "CUSTOMER");
            
            List<HirePostResponse> posts = hirePostService.getHirePostsByCustomer(customerId);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to fetch hire posts", e.getMessage()));
        }
    }
    
    @GetMapping("/available")
    public ResponseEntity<?> getAvailableHirePosts(@RequestParam(required = false) String field) {
        try {
            List<HirePostResponse> posts;
            if (field != null && !field.trim().isEmpty()) {
                posts = hirePostService.getAvailableHirePostsByField(field);
            } else {
                posts = hirePostService.getAllAvailableHirePosts();
            }
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to fetch available hire posts", e.getMessage()));
        }
    }
    
    @GetMapping("/{postId}")
    public ResponseEntity<?> getHirePostById(@PathVariable Integer postId) {
        try {
            HirePostResponse post = hirePostService.getHirePostById(postId);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Hire post not found", e.getMessage()));
        }
    }
    
    @PutMapping("/{postId}")
    public ResponseEntity<?> updateHirePost(
            @PathVariable Integer postId,
            @Valid @RequestBody HirePostUpdateRequest request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer customerId = getUserIdFromAuth(auth, "CUSTOMER");
            
            HirePostResponse response = hirePostService.updateHirePost(postId, request, customerId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to update hire post", e.getMessage()));
        }
    }
    
    @DeleteMapping("/{postId}")
    public ResponseEntity<?> deleteHirePost(@PathVariable Integer postId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer customerId = getUserIdFromAuth(auth, "CUSTOMER");
            
            hirePostService.deleteHirePost(postId, customerId);
            return ResponseEntity.ok(new SuccessResponse("Hire post deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to delete hire post", e.getMessage()));
        }
    }
    
    @PostMapping("/{postId}/apply")
    public ResponseEntity<?> applyToHirePost(@PathVariable Integer postId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer workerId = getUserIdFromAuth(auth, "WORKER");
            
            hirePostService.applyToHirePost(postId, workerId);
            return ResponseEntity.ok(new SuccessResponse("Successfully applied to hire post"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to apply to hire post", e.getMessage()));
        }
    }
    
    @GetMapping("/{postId}/applications")
    public ResponseEntity<?> getApplicationsForPost(@PathVariable Integer postId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer customerId = getUserIdFromAuth(auth, "CUSTOMER");
            
            List<WorkerApplicationResponse> applications = hirePostService.getApplicationsForPost(postId, customerId);
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to fetch applications", e.getMessage()));
        }
    }
    
    @PostMapping("/{postId}/select-worker/{workerId}")
    public ResponseEntity<?> selectWorkerForPost(
            @PathVariable Integer postId,
            @PathVariable Integer workerId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer customerId = getUserIdFromAuth(auth, "CUSTOMER");
            
            hirePostService.selectWorkerForPost(postId, workerId, customerId);
            return ResponseEntity.ok(new SuccessResponse("Worker selected successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to select worker", e.getMessage()));
        }
    }
    
    @PostMapping("/{postId}/complete")
    public ResponseEntity<?> markPostAsCompleted(@PathVariable Integer postId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer customerId = getUserIdFromAuth(auth, "CUSTOMER");
            
            hirePostService.markPostAsCompleted(postId, customerId);
            return ResponseEntity.ok(new SuccessResponse("Post marked as completed"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to complete post", e.getMessage()));
        }
    }
    
    private Integer getUserIdFromAuth(Authentication auth, String expectedRole) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = auth.getName();
        if (email == null || email.isEmpty()) {
            throw new RuntimeException("User email not found in authentication");
        }
        
        // Get user role from authorities
        UserRole role = auth.getAuthorities().stream()
            .filter(authority -> authority.getAuthority().startsWith("ROLE_"))
            .map(authority -> {
                try {
                    return UserRole.valueOf(authority.getAuthority().substring(5));
                } catch (IllegalArgumentException e) {
                    return null;
                }
            })
            .filter(r -> r != null)
            .findFirst()
            .orElseThrow(() -> new RuntimeException("User role not found in authorities"));
        
        if (!role.name().equals(expectedRole)) {
            throw new RuntimeException("Unauthorized: Expected " + expectedRole + " role");
        }
        
        // Get user ID based on email and role
        return getUserIdFromEmailAndRole(email, role);
    }
    
    private Integer getUserIdFromEmailAndRole(String email, UserRole role) {
        try {
            if (role == UserRole.CUSTOMER) {
                Optional<Customer> customer = customerRepository.findByGmail(email);
                return customer.map(Customer::getCustomerId)
                        .orElseThrow(() -> new RuntimeException("Customer not found with email: " + email));
            } else if (role == UserRole.WORKER) {
                Optional<Worker> worker = workerRepository.findByGmail(email);
                return worker.map(Worker::getWorkerId)
                        .orElseThrow(() -> new RuntimeException("Worker not found with email: " + email));
            } else {
                throw new RuntimeException("Invalid user role: " + role);
            }
        } catch (Exception e) {
            System.err.println("Error finding user ID for email: " + email + ", role: " + role + " - " + e.getMessage());
            throw new RuntimeException("Error finding user ID for email: " + email + ", role: " + role, e);
        }
    }

    @GetMapping("/{postId}/has-applied")
    public ResponseEntity<?> hasWorkerAppliedToPost(@PathVariable Integer postId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User user = (User) auth.getPrincipal();
            
            if (!UserRole.WORKER.equals(user.getRole())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Forbidden", "Only workers can check application status"));
            }
            
            Integer workerId = getUserIdFromEmailAndRole(user.getEmail(), user.getRole());
            boolean hasApplied = hirePostService.hasWorkerAppliedToPost(postId, workerId);
            
            return ResponseEntity.ok(Map.of("hasApplied", hasApplied));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to check application status", e.getMessage()));
        }
    }
    
    // Helper response classes
    @lombok.Data
    @lombok.AllArgsConstructor
    private static class ErrorResponse {
        private String error;
        private String message;
    }
    
    @lombok.Data
    @lombok.AllArgsConstructor
    private static class SuccessResponse {
        private String message;
    }
}
