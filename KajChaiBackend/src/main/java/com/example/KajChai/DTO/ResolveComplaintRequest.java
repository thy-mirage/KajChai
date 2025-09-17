package com.example.KajChai.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResolveComplaintRequest {
    private String adminResponse;
    private boolean deletePost;
    
    public String getAdminResponse() {
        return adminResponse;
    }
    
    public void setAdminResponse(String adminResponse) {
        this.adminResponse = adminResponse;
    }
    
    public boolean isDeletePost() {
        return deletePost;
    }
    
    public void setDeletePost(boolean deletePost) {
        this.deletePost = deletePost;
    }
}