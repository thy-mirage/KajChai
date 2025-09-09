package com.example.KajChai.Controller;

import com.example.KajChai.DatabaseEntity.Customer;
import com.example.KajChai.DatabaseEntity.Worker;
import com.example.KajChai.DTO.*;
import com.example.KajChai.Enum.UserRole;
import com.example.KajChai.Repository.CustomerRepository;
import com.example.KajChai.Repository.WorkerRepository;
import com.example.KajChai.Service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ChatController {

    private final ChatService chatService;
    private final CustomerRepository customerRepository;
    private final WorkerRepository workerRepository;

    @GetMapping("/rooms")
    public ResponseEntity<Map<String, Object>> getUserChatRooms() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("Authentication: " + (auth != null ? auth.getName() : "null"));
            System.out.println("Authorities: " + (auth != null ? auth.getAuthorities() : "null"));
            
            // Get user ID and role from authentication
            UserContextInfo userInfo = getUserContextFromAuth(auth);
            System.out.println("User Info - ID: " + userInfo.userId + ", Role: " + userInfo.role);
            
            List<ChatRoomResponse> chatRooms = chatService.getUserChatRooms(userInfo.userId, userInfo.role);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("chatRooms", chatRooms);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error in getUserChatRooms: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to fetch chat rooms: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/rooms")
    public ResponseEntity<Map<String, Object>> createOrGetChatRoom(@RequestParam Integer otherUserId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserContextInfo userInfo = getUserContextFromAuth(auth);
            
            ChatRoomResponse chatRoom = chatService.createOrGetChatRoom(userInfo.userId, userInfo.role, otherUserId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("chatRoom", chatRoom);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to create/get chat room: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<Map<String, Object>> getChatMessages(@PathVariable Long roomId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserContextInfo userInfo = getUserContextFromAuth(auth);
            
            List<ChatMessageResponse> messages = chatService.getChatMessages(roomId, userInfo.userId);
            
            // Mark messages as read
            chatService.markMessagesAsRead(roomId, userInfo.userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("messages", messages);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to fetch messages: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendMessage(@RequestBody SendMessageRequest request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserContextInfo userInfo = getUserContextFromAuth(auth);
            
            ChatMessageResponse message = chatService.sendMessage(userInfo.userId, userInfo.role, request);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", message);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to send message: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getAvailableUsers() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserContextInfo userInfo = getUserContextFromAuth(auth);
            
            List<UserListResponse> users = chatService.getAvailableUsers(userInfo.userId, userInfo.role);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("users", users);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to fetch users: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/rooms/{roomId}/read")
    public ResponseEntity<Map<String, Object>> markMessagesAsRead(@PathVariable Long roomId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserContextInfo userInfo = getUserContextFromAuth(auth);
            
            chatService.markMessagesAsRead(roomId, userInfo.userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Messages marked as read");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to mark messages as read: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Helper method to extract user context from authentication
    private UserContextInfo getUserContextFromAuth(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = auth.getName();
        if (email == null || email.isEmpty()) {
            throw new RuntimeException("User email not found in authentication");
        }
        
        // Get user role from authorities
        UserRole role = auth.getAuthorities().stream()
            .filter(authority -> authority.getAuthority().startsWith("ROLE_"))
            .map(authority -> {
                try {
                    return UserRole.valueOf(authority.getAuthority().substring(5));
                } catch (IllegalArgumentException e) {
                    return null;
                }
            })
            .filter(r -> r != null)
            .findFirst()
            .orElseThrow(() -> new RuntimeException("User role not found in authorities"));
            
        // For this implementation, we'll need to fetch user ID based on email and role
        Integer userId = getUserIdFromEmailAndRole(email, role);
        
        return new UserContextInfo(userId, role);
    }
    
    private Integer getUserIdFromEmailAndRole(String email, UserRole role) {
        try {
            if (role == UserRole.CUSTOMER) {
                Optional<Customer> customer = customerRepository.findByGmail(email);
                return customer.map(Customer::getCustomerId)
                        .orElseThrow(() -> new RuntimeException("Customer not found with email: " + email));
            } else if (role == UserRole.WORKER) {
                Optional<Worker> worker = workerRepository.findByGmail(email);
                return worker.map(Worker::getWorkerId)
                        .orElseThrow(() -> new RuntimeException("Worker not found with email: " + email));
            } else {
                throw new RuntimeException("Invalid user role: " + role);
            }
        } catch (Exception e) {
            System.err.println("Error finding user ID for email: " + email + ", role: " + role + " - " + e.getMessage());
            throw new RuntimeException("Error finding user ID for email: " + email + ", role: " + role, e);
        }
    }
    
    // Helper class for user context
    private static class UserContextInfo {
        final Integer userId;
        final UserRole role;
        
        UserContextInfo(Integer userId, UserRole role) {
            this.userId = userId;
            this.role = role;
        }
    }
}
