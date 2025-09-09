package com.example.KajChai.Controller;

import com.example.KajChai.DTO.SendMessageRequest;
import com.example.KajChai.DTO.ChatMessageResponse;
import com.example.KajChai.Service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.security.core.Authentication;
import java.util.Objects;

@Controller
@RequiredArgsConstructor
public class WebSocketChatController {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;
    
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload SendMessageRequest messageRequest, 
                           SimpMessageHeaderAccessor headerAccessor,
                           Authentication authentication) {
        try {
            // For WebSocket, we'll need to get sender info from session or authentication
            // For now, let's assume we have sender info in the session
            Object userIdObj = Objects.requireNonNull(headerAccessor.getSessionAttributes()).get("userId");
            Object userRoleObj = Objects.requireNonNull(headerAccessor.getSessionAttributes()).get("userRole");
            
            if (userIdObj == null || userRoleObj == null) {
                System.err.println("User info not found in WebSocket session");
                return;
            }
            
            Integer senderId = (Integer) userIdObj;
            String roleStr = (String) userRoleObj;
            
            // Convert string to UserRole enum
            com.example.KajChai.Enum.UserRole senderRole;
            try {
                senderRole = com.example.KajChai.Enum.UserRole.valueOf(roleStr);
            } catch (IllegalArgumentException e) {
                System.err.println("Invalid user role: " + roleStr);
                return;
            }
            
            // Send the message through the chat service
            ChatMessageResponse message = chatService.sendMessage(senderId, senderRole, messageRequest);
            
            if (message != null) {
                // Send message to the specific chat room
                // We need to get the room ID from the message response
                messagingTemplate.convertAndSend(
                    "/topic/chat/" + message.getRoomId(), 
                    message
                );
            }
        } catch (Exception e) {
            // Handle errors - could send error message back to client
            System.err.println("Error sending message: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    @MessageMapping("/chat.addUser")
    public void addUser(@Payload String username, 
                       SimpMessageHeaderAccessor headerAccessor) {
        // Store username in web socket session
        var sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes != null) {
            sessionAttributes.put("username", username);
        }
        
        // You can implement user join notifications here if needed
    }
}
