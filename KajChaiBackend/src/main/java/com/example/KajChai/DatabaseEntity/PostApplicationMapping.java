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
@Table(name = "Post_application_mapping")
public class PostApplicationMapping {
    @Id
    @GeneratedValue
    private Integer applicationId;

    @ManyToOne
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    @ManyToOne
    @JoinColumn(name = "post_id", nullable = false)
    private HirePost hirePost;

    @CreationTimestamp
    @Column(name = "application_time", nullable = false, updatable = false)
    private LocalDateTime applicationTime;
}
