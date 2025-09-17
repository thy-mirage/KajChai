package com.example.KajChai.DTO;

import com.example.KajChai.Enum.ComplaintReason;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateComplaintRequest {
    
    // PostId will be set from path parameter, so no validation needed here
    private Long postId;
    
    @NotNull(message = "Complaint reason is required")
    private ComplaintReason reason;
    
    @NotBlank(message = "Description is required")
    private String description;
    
    // Optional evidence images
    private List<String> evidenceImages;
    
    // Setters for fields
    public void setPostId(Long postId) {
        this.postId = postId;
    }
    
    public void setReason(ComplaintReason reason) {
        this.reason = reason;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public void setEvidenceImages(List<String> evidenceImages) {
        this.evidenceImages = evidenceImages;
    }
    
    // Getters for fields
    public Long getPostId() {
        return postId;
    }
    
    public ComplaintReason getReason() {
        return reason;
    }
    
    public String getDescription() {
        return description;
    }
    
    public List<String> getEvidenceImages() {
        return evidenceImages;
    }
}