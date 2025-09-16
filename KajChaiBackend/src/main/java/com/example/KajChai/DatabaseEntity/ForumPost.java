package com.example.KajChai.DatabaseEntity;

import com.example.KajChai.Enum.ForumSection;
import com.example.KajChai.Enum.ForumCategory;
import com.example.KajChai.Enum.PostStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@Table(name = "forum_posts")
public class ForumPost {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long postId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "photo_urls", columnDefinition = "TEXT")
    private String photoUrls; // JSON array of photo URLs

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ForumSection section;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ForumCategory category;

    // Author information - references User entity
    @Column(nullable = false)
    private Integer authorId;

    @Column(nullable = false)
    private String authorName;

    @Column
    private String authorPhoto;

    @Builder.Default
    @Column(nullable = false)
    private Integer likesCount = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer dislikesCount = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer commentsCount = 0;

    // Moderation fields
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = true) // Allow null for existing records
    private PostStatus status = PostStatus.PENDING_REVIEW;

    @Column(columnDefinition = "TEXT")
    private String moderationReason;

    @Column
    private LocalDateTime moderatedAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // For managing relationships
    @OneToMany(mappedBy = "forumPost", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ForumComment> comments;

    @OneToMany(mappedBy = "forumPost", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ForumLike> likes;
}