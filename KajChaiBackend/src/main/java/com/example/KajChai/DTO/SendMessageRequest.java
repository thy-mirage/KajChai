package com.example.KajChai.DTO;

import com.example.KajChai.Enum.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {
    private Integer receiverId;
    private UserRole receiverRole; // Explicitly specify receiver role to avoid ambiguity
    private String content;
}
