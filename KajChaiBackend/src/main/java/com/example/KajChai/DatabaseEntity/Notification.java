package com.example.KajChai.DatabaseEntity;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.example.KajChai.Enum.NotificationStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "Notification")
public class Notification {
    @Id
    @GeneratedValue
    private Integer notificationId;

    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationStatus status;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "worker_id")
    private Worker worker;

    @CreationTimestamp
    @Column(name = "notification_time", nullable = false, updatable = false)
    private LocalDateTime notificationTime;
}
