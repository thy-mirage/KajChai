package com.example.KajChai.DatabaseEntity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    @Column(columnDefinition = "TEXT")
    private String comment;

    private String role;

    private Integer userId;

    @CreationTimestamp
    @Column(name = "post_time", nullable = false, updatable = false)
    private LocalDateTime postTime;
}
