package com.example.KajChai.Service;

import com.example.KajChai.DatabaseEntity.*;
import com.example.KajChai.DTO.CreateComplaintRequest;
import com.example.KajChai.DTO.ForumComplaintResponse;
import com.example.KajChai.Enum.ComplaintStatus;
import com.example.KajChai.Enum.UserRole;
import com.example.KajChai.Repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ForumComplaintService {
    
    private final ForumComplaintRepository forumComplaintRepository;
    private final ForumPostRepository forumPostRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final WorkerRepository workerRepository;
    private final AdminRepository adminRepository;
    private final ObjectMapper objectMapper;
    
    // Submit a new complaint
    public ForumComplaintResponse submitComplaint(CreateComplaintRequest request, Integer userId) {
        // Validate postId is provided
        if (request.getPostId() == null) {
            throw new RuntimeException("Post ID is required");
        }
        
        // Validate the post exists
        ForumPost post = forumPostRepository.findById(request.getPostId())
                .orElseThrow(() -> new RuntimeException("Post not found"));
        
        // Check if user has already complained about this post
        if (forumComplaintRepository.existsByForumPost_PostIdAndComplainantId(request.getPostId(), userId)) {
            throw new RuntimeException("You have already submitted a complaint for this post");
        }
        
        // Get user details
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String complainantName;
        String complainantEmail = user.getEmail();
        
        if (user.getRole() == UserRole.CUSTOMER) {
            Customer customer = customerRepository.findByGmail(user.getEmail())
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
            complainantName = customer.getCustomerName();
        } else if (user.getRole() == UserRole.WORKER) {
            Worker worker = workerRepository.findByGmail(user.getEmail())
                    .orElseThrow(() -> new RuntimeException("Worker not found"));
            complainantName = worker.getName();
        } else {
            throw new RuntimeException("Invalid user role for submitting complaints");
        }
        
        // Convert evidence images to JSON
        String evidenceImagesJson = null;
        if (request.getEvidenceImages() != null && !request.getEvidenceImages().isEmpty()) {
            try {
                evidenceImagesJson = objectMapper.writeValueAsString(request.getEvidenceImages());
            } catch (JsonProcessingException e) {
                log.error("Error converting evidence images to JSON", e);
            }
        }
        
        // Create complaint
        ForumComplaint complaint = ForumComplaint.builder()
                .forumPost(post)
                .complainantId(userId)
                .complainantName(complainantName)
                .complainantEmail(complainantEmail)
                .reason(request.getReason())
                .description(request.getDescription())
                .evidenceImages(evidenceImagesJson)
                .status(ComplaintStatus.PENDING)
                .build();
        
        ForumComplaint savedComplaint = forumComplaintRepository.save(complaint);
        
        log.info("New complaint submitted for post {} by user {}", request.getPostId(), userId);
        
        return convertToComplaintResponse(savedComplaint);
    }
    
    // Get all complaints for admin with pagination and filtering
    public Page<ForumComplaintResponse> getAllComplaints(
            ComplaintStatus status, String search, int page, int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ForumComplaint> complaints;
        
        if (search != null && !search.trim().isEmpty()) {
            complaints = forumComplaintRepository.searchComplaints(search.trim(), pageable);
        } else if (status != null) {
            complaints = forumComplaintRepository.findByStatus(status, pageable);
        } else {
            complaints = forumComplaintRepository.findAll(pageable);
        }
        
        return complaints.map(this::convertToComplaintResponse);
    }
    
    // Get complaints by status for admin
    public Page<ForumComplaintResponse> getComplaintsByStatus(
            ComplaintStatus status, int page, int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ForumComplaint> complaints = forumComplaintRepository.findByStatus(status, pageable);
        
        return complaints.map(this::convertToComplaintResponse);
    }
    
    // Get user's complaints
    public Page<ForumComplaintResponse> getUserComplaints(Integer userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ForumComplaint> complaints = forumComplaintRepository.findByComplainantId(userId, pageable);
        
        return complaints.map(this::convertToComplaintResponse);
    }
    
    // Resolve complaint and optionally delete the post
    @Transactional
    public ForumComplaintResponse resolveComplaint(Long complaintId, Integer adminId, 
                                                 String adminResponse, boolean deletePost) {
        
        ForumComplaint complaint = forumComplaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        
        // Get admin details
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        // Get the post reference before updating the complaint
        ForumPost post = complaint.getForumPost();
        
        // Update complaint status
        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaint.setAdminResponse(adminResponse);
        complaint.setReviewedBy(adminId);
        complaint.setReviewedAt(LocalDateTime.now());
        
        ForumComplaint savedComplaint = forumComplaintRepository.save(complaint);
        
        // Delete the post if requested
        if (deletePost && post != null) {
            try {
                // First delete all complaints related to this post to avoid foreign key constraint
                forumComplaintRepository.deleteByForumPost_PostId(post.getPostId());
                
                // Then delete the post
                forumPostRepository.delete(post);
                log.info("Post {} deleted by admin {} due to complaint {}", 
                        post.getPostId(), adminId, complaintId);
            } catch (Exception e) {
                log.error("Error deleting post {}: {}", post.getPostId(), e.getMessage());
                throw new RuntimeException("Failed to delete post: " + e.getMessage());
            }
        }
        
        log.info("Complaint {} resolved by admin {}", complaintId, adminId);
        
        return convertToComplaintResponse(savedComplaint);
    }
    
    // Reject complaint
    @Transactional
    public ForumComplaintResponse rejectComplaint(Long complaintId, Integer adminId, String adminResponse) {
        ForumComplaint complaint = forumComplaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        
        // Get admin details
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        
        // Update complaint status
        complaint.setStatus(ComplaintStatus.REJECTED);
        complaint.setAdminResponse(adminResponse);
        complaint.setReviewedBy(adminId);
        complaint.setReviewedAt(LocalDateTime.now());
        
        ForumComplaint savedComplaint = forumComplaintRepository.save(complaint);
        
        log.info("Complaint {} rejected by admin {}", complaintId, adminId);
        
        return convertToComplaintResponse(savedComplaint);
    }
    
    // Get complaint statistics for admin dashboard
    public ComplaintStats getComplaintStats() {
        long totalComplaints = forumComplaintRepository.count();
        long pendingComplaints = forumComplaintRepository.countByStatus(ComplaintStatus.PENDING);
        long resolvedComplaints = forumComplaintRepository.countByStatus(ComplaintStatus.RESOLVED);
        long rejectedComplaints = forumComplaintRepository.countByStatus(ComplaintStatus.REJECTED);
        
        // Get recent complaints (last 7 days)
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        List<ForumComplaint> recentComplaints = forumComplaintRepository.findRecentComplaints(weekAgo);
        
        return ComplaintStats.builder()
                .totalComplaints(totalComplaints)
                .pendingComplaints(pendingComplaints)
                .resolvedComplaints(resolvedComplaints)
                .rejectedComplaints(rejectedComplaints)
                .recentComplaintsCount(recentComplaints.size())
                .build();
    }
    
    // Helper method to convert ForumComplaint to ForumComplaintResponse
    private ForumComplaintResponse convertToComplaintResponse(ForumComplaint complaint) {
        ForumPost post = complaint.getForumPost();
        
        // Parse evidence images
        List<String> evidenceImages = Collections.emptyList();
        if (complaint.getEvidenceImages() != null) {
            try {
                evidenceImages = objectMapper.readValue(complaint.getEvidenceImages(), List.class);
            } catch (JsonProcessingException e) {
                log.error("Error parsing evidence images for complaint {}", complaint.getComplaintId());
            }
        }
        
        // Get reviewer name if available
        String reviewedByName = null;
        if (complaint.getReviewedBy() != null) {
            try {
                Admin admin = adminRepository.findById(complaint.getReviewedBy()).orElse(null);
                if (admin != null) {
                    reviewedByName = admin.getName();
                }
            } catch (Exception e) {
                log.error("Error getting reviewer name for complaint {}", complaint.getComplaintId());
            }
        }
        
        return ForumComplaintResponse.builder()
                .complaintId(complaint.getComplaintId())
                .postId(post.getPostId())
                .postTitle(post.getTitle())
                .postContent(post.getContent())
                .postAuthorName(post.getAuthorName())
                .postSection(post.getSection().toString())
                .complainantId(complaint.getComplainantId())
                .complainantName(complaint.getComplainantName())
                .complainantEmail(complaint.getComplainantEmail())
                .reason(complaint.getReason())
                .description(complaint.getDescription())
                .evidenceImages(evidenceImages)
                .status(complaint.getStatus())
                .adminResponse(complaint.getAdminResponse())
                .reviewedBy(complaint.getReviewedBy())
                .reviewedByName(reviewedByName)
                .reviewedAt(complaint.getReviewedAt())
                .createdAt(complaint.getCreatedAt())
                .updatedAt(complaint.getUpdatedAt())
                .build();
    }
    
    // Inner class for complaint statistics
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ComplaintStats {
        private long totalComplaints;
        private long pendingComplaints;
        private long resolvedComplaints;
        private long rejectedComplaints;
        private long recentComplaintsCount;
    }
}