package com.example.KajChai.Controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.KajChai.DTO.NotificationResponse;
import com.example.KajChai.DatabaseEntity.Customer;
import com.example.KajChai.DatabaseEntity.Worker;
import com.example.KajChai.Enum.UserRole;
import com.example.KajChai.Repository.CustomerRepository;
import com.example.KajChai.Repository.WorkerRepository;
import com.example.KajChai.Service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = {
    "http://localhost:5173", 
    "http://localhost:5174", 
    "https://kaj-chai.vercel.app",
    "https://*.vercel.app"
}, allowCredentials = "true")
public class NotificationController {
    
    private final NotificationService notificationService;
    private final CustomerRepository customerRepository;
    private final WorkerRepository workerRepository;
    
    @GetMapping
    public ResponseEntity<?> getNotifications() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserInfo userInfo = getUserInfoFromAuth(auth);
            
            List<NotificationResponse> notifications;
            if ("CUSTOMER".equals(userInfo.role)) {
                notifications = notificationService.getNotificationsByCustomer(userInfo.userId);
            } else {
                notifications = notificationService.getNotificationsByWorker(userInfo.userId);
            }
            
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to fetch notifications", e.getMessage()));
        }
    }
    
    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadNotifications() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserInfo userInfo = getUserInfoFromAuth(auth);
            
            List<NotificationResponse> notifications;
            if ("CUSTOMER".equals(userInfo.role)) {
                notifications = notificationService.getUnreadNotificationsByCustomer(userInfo.userId);
            } else {
                notifications = notificationService.getUnreadNotificationsByWorker(userInfo.userId);
            }
            
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to fetch unread notifications", e.getMessage()));
        }
    }
    
    @GetMapping("/unread/count")
    public ResponseEntity<?> getUnreadNotificationsCount() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserInfo userInfo = getUserInfoFromAuth(auth);
            
            Long count;
            if ("CUSTOMER".equals(userInfo.role)) {
                count = notificationService.getUnreadNotificationsCountForCustomer(userInfo.userId);
            } else {
                count = notificationService.getUnreadNotificationsCountForWorker(userInfo.userId);
            }
            
            return ResponseEntity.ok(new CountResponse(count));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to fetch unread notifications count", e.getMessage()));
        }
    }
    
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<?> markNotificationAsRead(@PathVariable Integer notificationId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserInfo userInfo = getUserInfoFromAuth(auth);
            
            notificationService.markNotificationAsRead(notificationId, userInfo.userId, userInfo.role);
            return ResponseEntity.ok(new SuccessResponse("Notification marked as read"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to mark notification as read", e.getMessage()));
        }
    }
    
    @PutMapping("/read-all")
    public ResponseEntity<?> markAllNotificationsAsRead() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserInfo userInfo = getUserInfoFromAuth(auth);
            
            notificationService.markAllNotificationsAsRead(userInfo.userId, userInfo.role);
            return ResponseEntity.ok(new SuccessResponse("All notifications marked as read"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to mark all notifications as read", e.getMessage()));
        }
    }
    
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<?> deleteNotification(@PathVariable Integer notificationId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserInfo userInfo = getUserInfoFromAuth(auth);
            
            notificationService.deleteNotification(notificationId, userInfo.userId, userInfo.role);
            return ResponseEntity.ok(new SuccessResponse("Notification deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to delete notification", e.getMessage()));
        }
    }
    
    private UserInfo getUserInfoFromAuth(Authentication auth) {
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
        
        Integer userId;
        String roleString;
        
        if (role == UserRole.CUSTOMER) {
            Optional<Customer> customer = customerRepository.findByGmail(email);
            userId = customer.map(Customer::getCustomerId)
                    .orElseThrow(() -> new RuntimeException("Customer not found with email: " + email));
            roleString = "CUSTOMER";
        } else if (role == UserRole.WORKER) {
            Optional<Worker> worker = workerRepository.findByGmail(email);
            userId = worker.map(Worker::getWorkerId)
                    .orElseThrow(() -> new RuntimeException("Worker not found with email: " + email));
            roleString = "WORKER";
        } else {
            throw new RuntimeException("Invalid user role: " + role);
        }
        
        return new UserInfo(userId, roleString);
    }
    
    // Helper classes
    private static class UserInfo {
        Integer userId;
        String role;
        
        UserInfo(Integer userId, String role) {
            this.userId = userId;
            this.role = role;
        }
    }
    
    @lombok.Data
    @lombok.AllArgsConstructor
    private static class ErrorResponse {
        private String error;
        private String message;
    }
    
    @lombok.Data
    @lombok.AllArgsConstructor
    private static class SuccessResponse {
        private String message;
    }
    
    @lombok.Data
    @lombok.AllArgsConstructor
    private static class CountResponse {
        private Long count;
    }
}
