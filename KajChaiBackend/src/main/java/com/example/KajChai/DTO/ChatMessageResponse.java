package com.example.KajChai.DTO;

import com.example.KajChai.Enum.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {
    private Long messageId;
    private Long roomId;
    private Integer senderId;
    private UserRole senderRole;
    private String senderName;
    private String content;
    private Boolean isRead;
    private LocalDateTime sentAt;
}
