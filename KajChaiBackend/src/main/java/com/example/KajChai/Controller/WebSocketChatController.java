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
        System.out.println("📨 WebSocket message received: " + messageRequest);
        
        try {
            // Get sender info from WebSocket session
            var sessionAttributes = headerAccessor.getSessionAttributes();
            if (sessionAttributes == null) {
                System.err.println("❌ No session attributes found in WebSocket");
                return;
            }
            
            Object userIdObj = sessionAttributes.get("userId");
            Object userRoleObj = sessionAttributes.get("userRole");
            
            System.out.println("🔍 Session userId: " + userIdObj + ", userRole: " + userRoleObj);
            
            if (userIdObj == null || userRoleObj == null) {
                System.err.println("❌ User info not found in WebSocket session. Available keys: " + sessionAttributes.keySet());
                return;
            }
            
            Integer senderId = (Integer) userIdObj;
            String roleStr = (String) userRoleObj;
            
            // Convert string to UserRole enum
            com.example.KajChai.Enum.UserRole senderRole;
            try {
                senderRole = com.example.KajChai.Enum.UserRole.valueOf(roleStr);
            } catch (IllegalArgumentException e) {
                System.err.println("❌ Invalid user role: " + roleStr);
                return;
            }
            
            System.out.println("📤 Sending message from user " + senderId + " (" + senderRole + ")");
            
            // Send the message through the chat service
            ChatMessageResponse message = chatService.sendMessage(senderId, senderRole, messageRequest);
            
            if (message != null) {
                System.out.println("✅ Message created with ID: " + message.getMessageId() + " for room: " + message.getRoomId());
                
                // Send message to the specific chat room
                String destination = "/topic/chat/" + message.getRoomId();
                System.out.println("📡 Broadcasting message to: " + destination);
                
                messagingTemplate.convertAndSend(destination, message);
                
                System.out.println("✅ Message broadcasted successfully");
            } else {
                System.err.println("❌ Failed to create message");
            }
        } catch (Exception e) {
            System.err.println("❌ Error in WebSocket sendMessage: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    @MessageMapping("/chat.addUser")
    public void addUser(@Payload String userInfoJson, 
                       SimpMessageHeaderAccessor headerAccessor) {
        System.out.println("📝 Received user info: " + userInfoJson);
        
        try {
            // Parse user info from JSON
            var objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
            var userInfo = objectMapper.readTree(userInfoJson);
            
            Integer userId = userInfo.get("userId").asInt();
            String userRole = userInfo.get("userRole").asText();
            
            System.out.println("🔍 Parsed user info - ID: " + userId + ", Role: " + userRole);
            
            // Store user info in WebSocket session
            var sessionAttributes = headerAccessor.getSessionAttributes();
            if (sessionAttributes != null) {
                sessionAttributes.put("userId", userId);
                sessionAttributes.put("userRole", userRole);
                System.out.println("✅ WebSocket session established for user: " + userId + ", role: " + userRole);
                System.out.println("📋 Session attributes now contain: " + sessionAttributes.keySet());
            } else {
                System.err.println("❌ No session attributes available!");
            }
        } catch (Exception e) {
            System.err.println("❌ Error parsing user info: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
