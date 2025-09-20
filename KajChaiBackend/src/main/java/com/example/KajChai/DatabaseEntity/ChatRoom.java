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
    @Column(name = "room_id")@GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long roomId;

    @Column(name = "room_name", nullable = false, unique = true)
    private String roomName; // Format: "customer_{customerId}_worker_{workerId}"

    @Column(name = "customer_id",nullable = false)
    private Integer customerId;

    @Column(name = "worker_id", nullable = false)
    private Integer workerId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "last_activity")
    private LocalDateTime lastActivity;

    @PrePersist
    @PreUpdate
    protected void updateLastActivity() {
        lastActivity = LocalDateTime.now();
    }
}
