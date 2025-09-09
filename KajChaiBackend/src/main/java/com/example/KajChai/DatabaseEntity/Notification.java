package com.example.KajChai.DatabaseEntity;
import com.example.KajChai.Enum.NotificationStatus;
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
@Table(name = "Notification")
public class Notification {
    @Id
    @GeneratedValue
    private Integer notificationId;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationStatus status;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @CreationTimestamp
    @Column(name = "notification_time", nullable = false, updatable = false)
    private LocalDateTime notificationTime;
}
