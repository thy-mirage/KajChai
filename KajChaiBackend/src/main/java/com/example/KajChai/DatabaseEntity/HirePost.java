package com.example.KajChai.DatabaseEntity;

import com.example.KajChai.Enum.HirePostStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@Table(name = "hire_post")
public class HirePost {
    @Id
    @GeneratedValue
    private Integer postId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String field;

    @Column(nullable = false)
    private float estimatedPayment;

    private LocalDate deadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HirePostStatus status;

    @Column(name = "images")
    private List<String> images = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @CreationTimestamp
    @Column(name = "post_time", nullable = false, updatable = false)
    private LocalDateTime postTime;
}
