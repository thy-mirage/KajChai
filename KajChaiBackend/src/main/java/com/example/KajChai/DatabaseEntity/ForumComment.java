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
@Table(name = "Forum_comment")
public class ForumComment {
    @Id
    @GeneratedValue
    private Integer commentId;

    @ManyToOne
    @JoinColumn(name = "forum_id", nullable = false)
    private ForumPost forumPost;

    private String comment;

    private String role;

    private Integer userId;

    @CreationTimestamp
    @Column(name = "post_time", nullable = false, updatable = false)
    private LocalDateTime postTime;
}
