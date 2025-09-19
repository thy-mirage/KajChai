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
@Table(name = "banned_emails")
public class BannedEmail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String reason;

    @Column(name = "banned_worker_id")
    private Integer bannedWorkerId;

    @Column(name = "banned_worker_name")
    private String bannedWorkerName;

    @CreationTimestamp
    @Column(name = "banned_at")
    private LocalDateTime bannedAt;

    @Column(name = "banned_by_admin_id")
    private Integer bannedByAdminId;
}