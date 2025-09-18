package com.example.KajChai.DatabaseEntity;

import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

import com.example.KajChai.Enum.ComplaintStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
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
@Table(name = "user_complaint")
public class UserComplaint {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer complaintId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_worker_id", nullable = false)
    private Worker reportedWorker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by_customer_id", nullable = false)
    private Customer reportedByCustomer;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "evidence_urls", columnDefinition = "TEXT")
    private String evidenceUrls; // Store as JSON string array

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ComplaintStatus status = ComplaintStatus.PENDING;

    @Column(name = "admin_response", columnDefinition = "TEXT")
    private String adminResponse;

    @Column(name = "admin_action")
    private String adminAction; // BAN, RESTRICT, CLARIFY, REJECT

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "clarification_deadline")
    private LocalDateTime clarificationDeadline;

    @Column(name = "clarification_response", columnDefinition = "TEXT")
    private String clarificationResponse;

    // Helper method to get service type from reason
    public String getServiceType() {
        // Extract service type from reason or return the reason itself
        return this.reason != null ? this.reason : "General Service";
    }
}