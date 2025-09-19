package com.example.KajChai.Controller;

import com.example.KajChai.DTO.*;
import com.example.KajChai.DatabaseEntity.Customer;
import com.example.KajChai.DatabaseEntity.Worker;
import com.example.KajChai.Enum.UserRole;
import com.example.KajChai.Repository.CustomerRepository;
import com.example.KajChai.Repository.WorkerRepository;
import com.example.KajChai.Service.WorkerDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/worker-dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = {
    "http://localhost:5173", 
    "http://localhost:5174", 
    "https://kaj-chai.vercel.app",
    "https://*.vercel.app"
}, allowCredentials = "true")
public class WorkerDashboardController {
    
    private final WorkerDashboardService workerDashboardService;
    private final CustomerRepository customerRepository;
    private final WorkerRepository workerRepository;
    
    @GetMapping("/stats")
    public ResponseEntity<?> getWorkerDashboardStats() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer workerId = getUserIdFromAuth(auth, "WORKER");
            
            WorkerDashboardStatsResponse stats = workerDashboardService.getWorkerDashboardStats(workerId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Failed to fetch dashboard stats", e.getMessage()));
        }
    }
    
    @GetMapping("/current-works")
    public ResponseEntity<?> getCurrentWorks() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer workerId = getUserIdFromAuth(auth, "WORKER");
            
            List<HirePostResponse> currentWorks = workerDashboardService.getCurrentWorks(workerId);
            return ResponseEntity.ok(currentWorks);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Failed to fetch current works", e.getMessage()));
        }
    }
    
    @GetMapping("/my-reviews")
    public ResponseEntity<?> getMyReviews() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer workerId = getUserIdFromAuth(auth, "WORKER");
            
            List<ReviewResponseDTO> reviews = workerDashboardService.getWorkerReviews(workerId);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Failed to fetch reviews", e.getMessage()));
        }
    }
    
    @GetMapping("/past-jobs")
    public ResponseEntity<?> getPastJobs() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer workerId = getUserIdFromAuth(auth, "WORKER");
            
            List<HirePostResponse> pastJobs = workerDashboardService.getPastJobs(workerId);
            return ResponseEntity.ok(pastJobs);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Failed to fetch past jobs", e.getMessage()));
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
    
    // Helper response classes
    @lombok.Data
    @lombok.AllArgsConstructor
    private static class ErrorResponse {
        private String error;
        private String message;
    }
}