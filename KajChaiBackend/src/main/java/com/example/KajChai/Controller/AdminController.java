package com.example.KajChai.Controller;

import com.example.KajChai.DTO.ForumPostResponse;
import com.example.KajChai.DTO.ForumComplaintResponse;
import com.example.KajChai.DTO.ResolveComplaintRequest;
import com.example.KajChai.DTO.RejectComplaintRequest;
import com.example.KajChai.Enum.ComplaintStatus;
import com.example.KajChai.Service.AdminService;
import com.example.KajChai.Service.ForumComplaintService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = {
    "http://localhost:5173", 
    "http://localhost:5174", 
    "https://kaj-chai.vercel.app",
    "https://*.vercel.app"
}, allowCredentials = "true")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final ForumComplaintService forumComplaintService;

    @GetMapping("/forum/posts")
    public ResponseEntity<Map<String, Object>> getAllForumPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) String search) {
        
        try {
            Page<ForumPostResponse> posts = adminService.getAllForumPosts(page, size, section, search);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", posts.getContent());
            response.put("currentPage", posts.getNumber());
            response.put("totalPages", posts.getTotalPages());
            response.put("totalElements", posts.getTotalElements());
            response.put("message", "Forum posts retrieved successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to retrieve forum posts: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping("/forum/posts/{postId}")
    public ResponseEntity<Map<String, Object>> deleteForumPost(@PathVariable Long postId) {
        try {
            adminService.deleteForumPost(postId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Forum post deleted successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to delete forum post: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/forum/comments")
    public ResponseEntity<Map<String, Object>> getAllForumComments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long postId) {
        
        try {
            Object comments = adminService.getAllForumComments(page, size, postId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", comments);
            response.put("message", "Forum comments retrieved successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to retrieve forum comments: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping("/forum/comments/{commentId}")
    public ResponseEntity<Map<String, Object>> deleteForumComment(@PathVariable Long commentId) {
        try {
            adminService.deleteForumComment(commentId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Forum comment deleted successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to delete forum comment: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAdminStats() {
        try {
            Map<String, Object> stats = adminService.getAdminStats();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", stats);
            response.put("message", "Admin statistics retrieved successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to retrieve admin statistics: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Complaint Management Endpoints

    @GetMapping("/complaints")
    public ResponseEntity<Map<String, Object>> getAllComplaints(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) String search) {
        
        try {
            Page<ForumComplaintResponse> complaints = forumComplaintService.getAllComplaints(status, search, page, size);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", complaints.getContent());
            response.put("currentPage", complaints.getNumber());
            response.put("totalPages", complaints.getTotalPages());
            response.put("totalElements", complaints.getTotalElements());
            response.put("message", "Forum complaints retrieved successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to retrieve complaints: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PutMapping("/complaints/{complaintId}/resolve")
    public ResponseEntity<Map<String, Object>> resolveComplaint(
            @PathVariable Long complaintId,
            @RequestBody ResolveComplaintRequest request) {
        
        try {
            // Get current admin ID from authentication
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String adminEmail = authentication.getName();
            // For now, assume admin ID = 1 (this should be fetched from admin repository)
            Integer adminId = 1;
            
            ForumComplaintResponse complaint = forumComplaintService.resolveComplaint(
                    complaintId, adminId, request.getAdminResponse(), request.isDeletePost());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", complaint);
            response.put("message", "Complaint resolved successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to resolve complaint: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PutMapping("/complaints/{complaintId}/reject")
    public ResponseEntity<Map<String, Object>> rejectComplaint(
            @PathVariable Long complaintId,
            @RequestBody RejectComplaintRequest request) {
        
        try {
            // Get current admin ID from authentication
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String adminEmail = authentication.getName();
            // For now, assume admin ID = 1 (this should be fetched from admin repository)
            Integer adminId = 1;
            
            ForumComplaintResponse complaint = forumComplaintService.rejectComplaint(
                    complaintId, adminId, request.getAdminResponse());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", complaint);
            response.put("message", "Complaint rejected successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to reject complaint: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/complaints/stats")
    public ResponseEntity<Map<String, Object>> getComplaintStats() {
        try {
            ForumComplaintService.ComplaintStats stats = forumComplaintService.getComplaintStats();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", stats);
            response.put("message", "Complaint statistics retrieved successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to retrieve complaint statistics: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}