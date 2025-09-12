package com.example.KajChai.DTO;

import com.example.KajChai.Enum.ForumSection;
import com.example.KajChai.Enum.ForumCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ForumPostResponse {
    private Long postId;
    private String title;
    private String content;
    private List<String> photoUrls;
    private ForumSection section;
    private ForumCategory category;
    private Integer authorId;
    private String authorName;
    private String authorPhoto;
    private Integer likesCount;
    private Integer dislikesCount;
    private Integer commentsCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ForumCommentResponse> comments;
    
    // Additional fields for UI
    private Boolean isLikedByCurrentUser;
    private Boolean isDislikedByCurrentUser;
    private Boolean canEdit; // true if current user is the author
}