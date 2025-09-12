package com.example.KajChai.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ForumCommentResponse {
    private Long commentId;
    private String content;
    private Integer authorId;
    private String authorName;
    private String authorPhoto;
    private LocalDateTime createdAt;
}