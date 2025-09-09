package com.example.KajChai.DatabaseEntity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@Table(name = "Forum_post")
public class ForumPost {
    @Id
    @GeneratedValue
    private Integer forumId;

    private String description;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "images")
    private List<String> images = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "post_time", nullable = false, updatable = false)
    private LocalDateTime postTime;

}
