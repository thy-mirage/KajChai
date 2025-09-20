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
@Table(name = "forum_likes", uniqueConstraints = @UniqueConstraint(columnNames = {"post_id", "user_id"}))
public class ForumLike {
    @Id
    @Column(name = "like_id")@GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long likeId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "is_like", nullable = false)
    private Boolean isLike; // true for like, false for dislike

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Foreign key relationship with ForumPost
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private ForumPost forumPost;
}