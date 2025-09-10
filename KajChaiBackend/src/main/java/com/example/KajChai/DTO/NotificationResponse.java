package com.example.KajChai.DTO;

import com.example.KajChai.Enum.NotificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    
    private Integer notificationId;
    private String message;
    private NotificationStatus status;
    private LocalDateTime notificationTime;
}
