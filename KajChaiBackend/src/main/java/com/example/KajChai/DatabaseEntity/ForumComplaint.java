package com.example.KajChai.DatabaseEntity;

import com.example.KajChai.Enum.ComplaintStatus;
import com.example.KajChai.Enum.ComplaintReason;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@Table(name = "forum_complaints")
public class ForumComplaint {
    @Id
    @Column(name = "complaint_id")@GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long complaintId;

    // Reference to the complained post
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private ForumPost forumPost;

    // Complainant information
    @Column(name = "complainant_id",nullable = false)
    private Integer complainantId;

    @Column(name = "complainant_name",nullable = false)
    private String complainantName;

    @Column(name = "complainant_email")
    private String complainantEmail;

    // Complaint details
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintReason reason;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    // Evidence images (JSON array of image URLs)
    @Column(name = "evidence_images", columnDefinition = "TEXT")
    private String evidenceImages;

    // Complaint status
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private ComplaintStatus status = ComplaintStatus.PENDING;

    // Admin response
    @Column(name = "admin_response",columnDefinition = "TEXT")
    private String adminResponse;

    @Column(name = "reviewed_by")
    private Integer reviewedBy; // Admin ID who reviewed the complaint

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @CreationTimestamp
    @Column(name = "created_at",nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name="updated_at", nullable = false)
    private LocalDateTime updatedAt;
}