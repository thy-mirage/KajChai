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
@Table(name = "chat_rooms")
public class ChatRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long roomId;

    @Column(nullable = false, unique = true)
    private String roomName; // Format: "customer_{customerId}_worker_{workerId}"

    @Column(nullable = false)
    private Integer customerId;

    @Column(nullable = false)
    private Integer workerId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime lastActivity;

    @PrePersist
    @PreUpdate
    protected void updateLastActivity() {
        lastActivity = LocalDateTime.now();
    }
}
