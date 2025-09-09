package com.example.KajChai.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomResponse {
    private Long roomId;
    private String roomName;
    private Integer customerId;
    private String customerName;
    private Integer workerId;
    private String workerName;
    private String lastMessage;
    private LocalDateTime lastActivity;
    private Integer unreadCount;
    private String otherUserPhoto;
}
