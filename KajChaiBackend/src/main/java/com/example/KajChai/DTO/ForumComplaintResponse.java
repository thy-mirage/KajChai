package com.example.KajChai.DTO;

import com.example.KajChai.Enum.ComplaintReason;
import com.example.KajChai.Enum.ComplaintStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForumComplaintResponse {
    
    private Long complaintId;
    private Long postId;
    private String postTitle;
    private String postContent;
    private String postAuthorName;
    private String postSection;
    
    private Integer complainantId;
    private String complainantName;
    private String complainantEmail;
    
    private ComplaintReason reason;
    private String description;
    private List<String> evidenceImages;
    
    private ComplaintStatus status;
    private String adminResponse;
    private Integer reviewedBy;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}