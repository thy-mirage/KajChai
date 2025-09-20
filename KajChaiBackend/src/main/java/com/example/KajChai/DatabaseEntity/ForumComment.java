package com.example.KajChai.DatabaseEntity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@Table(name = "forum_comments")
public class ForumComment {
    @Id
    @Column(name = "comment_id")@GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long commentId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // Comment author information
    @Column(name = "author_id", nullable = false)
    private Integer authorId;

    @Column(name = "author_name", nullable = false)
    private String authorName;

    @Column(name = "author_photo")
    private String authorPhoto;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Foreign key relationship with ForumPost
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private ForumPost forumPost;
}