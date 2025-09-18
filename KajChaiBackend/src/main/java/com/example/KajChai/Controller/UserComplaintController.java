package com.example.KajChai.Controller;

import com.example.KajChai.DTO.CreateUserComplaintRequest;
import com.example.KajChai.DTO.ErrorResponse;
import com.example.KajChai.DTO.UserComplaintResponse;
import com.example.KajChai.DatabaseEntity.Customer;
import com.example.KajChai.DatabaseEntity.User;
import com.example.KajChai.DatabaseEntity.UserComplaint;
import com.example.KajChai.Enum.ComplaintStatus;
import com.example.KajChai.Enum.UserRole;
import com.example.KajChai.Repository.CustomerRepository;
import com.example.KajChai.Repository.UserRepository;
import com.example.KajChai.Service.UserComplaintService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = {
    "http://localhost:5173", 
    "http://localhost:5174", 
    "https://kaj-chai.vercel.app",
    "https://*.vercel.app"
}, allowCredentials = "true")
@Slf4j
public class UserComplaintController {
    
    private final UserComplaintService userComplaintService;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    
    // Customer endpoint to create complaint
    @PostMapping("/user-complaints")
    public ResponseEntity<?> createComplaint(@RequestBody CreateUserComplaintRequest request) {
        try {
            // Get authenticated customer
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            
            // Verify user is a customer
            if (!auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_CUSTOMER"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Only customers can create complaints", "Unauthorized"));
            }
            
            // Get customer ID
            Customer customer = customerRepository.findByGmail(email)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
            
            request.setReportedByCustomerId(customer.getCustomerId());
            
            UserComplaint complaint = userComplaintService.createComplaint(request);
            
            return ResponseEntity.ok(Map.of(
                    "message", "Complaint created successfully",
                    "complaintId", complaint.getComplaintId()
            ));
            
        } catch (Exception e) {
            log.error("Error creating complaint: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to create complaint", e.getMessage()));
        }
    }
    
    // Admin endpoint to get all complaints
    @GetMapping("/admin/user-complaints")
    public ResponseEntity<?> getAllComplaints() {
        try {
            // Verify admin access
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (!auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Admin access required", "Unauthorized"));
            }
            
            List<UserComplaintResponse> complaints = userComplaintService.getAllComplaints();
            return ResponseEntity.ok(complaints);
            
        } catch (Exception e) {
            log.error("Error fetching complaints: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to fetch complaints", e.getMessage()));
        }
    }
    
    // Admin endpoint to get complaints by status
    @GetMapping("/admin/user-complaints/status/{status}")
    public ResponseEntity<?> getComplaintsByStatus(@PathVariable String status) {
        try {
            // Verify admin access
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (!auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Admin access required", "Unauthorized"));
            }
            
            ComplaintStatus complaintStatus = ComplaintStatus.valueOf(status.toUpperCase());
            List<UserComplaintResponse> complaints = userComplaintService.getComplaintsByStatus(complaintStatus);
            return ResponseEntity.ok(complaints);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Invalid status", "Valid statuses: PENDING, INVESTIGATING, AWAITING_CLARIFICATION, RESOLVED, REJECTED, DISMISSED"));
        } catch (Exception e) {
            log.error("Error fetching complaints by status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to fetch complaints", e.getMessage()));
        }
    }
    
    // Admin endpoint to get specific complaint
    @GetMapping("/admin/user-complaints/{complaintId}")
    public ResponseEntity<?> getComplaint(@PathVariable Integer complaintId) {
        try {
            // Verify admin access
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (!auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Admin access required", "Unauthorized"));
            }
            
            UserComplaintResponse complaint = userComplaintService.getComplaintById(complaintId);
            return ResponseEntity.ok(complaint);
            
        } catch (Exception e) {
            log.error("Error fetching complaint: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to fetch complaint", e.getMessage()));
        }
    }
    
    // Admin endpoint to update complaint status
    @PutMapping("/admin/user-complaints/{complaintId}/status")
    public ResponseEntity<?> updateComplaintStatus(
            @PathVariable Integer complaintId,
            @RequestBody Map<String, String> request) {
        try {
            // Verify admin access
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (!auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Admin access required", "Unauthorized"));
            }
            
            String statusStr = request.get("status");
            String adminResponse = request.get("adminResponse");
            
            ComplaintStatus status = ComplaintStatus.valueOf(statusStr.toUpperCase());
            
            userComplaintService.updateComplaintStatus(complaintId, status, adminResponse);
            
            return ResponseEntity.ok(Map.of("message", "Complaint status updated successfully"));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Invalid status", e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating complaint status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to update complaint status", e.getMessage()));
        }
    }
    
    // Admin endpoint to ban worker
    @PutMapping("/admin/user-complaints/{complaintId}/ban-worker")
    public ResponseEntity<?> banWorker(
            @PathVariable Integer complaintId,
            @RequestBody Map<String, String> request) {
        try {
            // Verify admin access
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (!auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Admin access required", "Unauthorized"));
            }
            
            String reason = request.get("reason");
            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse("Reason is required", "Ban reason cannot be empty"));
            }
            
            userComplaintService.banWorker(complaintId, reason);
            
            return ResponseEntity.ok(Map.of("message", "Worker banned successfully"));
            
        } catch (Exception e) {
            log.error("Error banning worker: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to ban worker", e.getMessage()));
        }
    }
    
    // Admin endpoint to restrict worker
    @PutMapping("/admin/user-complaints/{complaintId}/restrict-worker")
    public ResponseEntity<?> restrictWorker(
            @PathVariable Integer complaintId,
            @RequestBody Map<String, String> request) {
        try {
            // Verify admin access
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (!auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Admin access required", "Unauthorized"));
            }
            
            String reason = request.get("reason");
            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse("Reason is required", "Restriction reason cannot be empty"));
            }
            
            userComplaintService.restrictWorker(complaintId, reason);
            
            return ResponseEntity.ok(Map.of("message", "Worker restricted successfully"));
            
        } catch (Exception e) {
            log.error("Error restricting worker: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to restrict worker", e.getMessage()));
        }
    }
    
    // Admin endpoint to request clarification
    @PutMapping("/admin/user-complaints/{complaintId}/request-clarification")
    public ResponseEntity<?> requestClarification(
            @PathVariable Integer complaintId,
            @RequestBody Map<String, String> request) {
        try {
            // Verify admin access
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (!auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Admin access required", "Unauthorized"));
            }
            
            String clarificationRequest = request.get("clarificationRequest");
            if (clarificationRequest == null || clarificationRequest.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse("Clarification request is required", "Request cannot be empty"));
            }
            
            userComplaintService.requestClarification(complaintId, clarificationRequest);
            
            return ResponseEntity.ok(Map.of("message", "Clarification requested successfully"));
            
        } catch (Exception e) {
            log.error("Error requesting clarification: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to request clarification", e.getMessage()));
        }
    }
}