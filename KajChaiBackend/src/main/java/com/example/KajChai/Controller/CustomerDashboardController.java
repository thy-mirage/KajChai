package com.example.KajChai.Controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.KajChai.DatabaseEntity.Customer;
import com.example.KajChai.Enum.UserRole;
import com.example.KajChai.Repository.CustomerRepository;
import com.example.KajChai.Service.ChatService;
import com.example.KajChai.Service.NotificationService;
import com.example.KajChai.Service.HirePostService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/customer/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = {
    "http://localhost:5173", 
    "http://localhost:5174", 
    "https://kaj-chai.vercel.app",
    "https://*.vercel.app"
}, allowCredentials = "true")
public class CustomerDashboardController {
    
    private final ChatService chatService;
    private final NotificationService notificationService;
    private final HirePostService hirePostService;
    private final CustomerRepository customerRepository;
    
    @GetMapping("/reminders")
    public ResponseEntity<?> getCustomerReminders() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Integer customerId = getCustomerIdFromAuth(auth);
            
            // Get unread chat messages count
            Long unreadChatCount = chatService.getUnreadChatMessageCount(customerId);
            
            // Get unread notifications count
            Long unreadNotificationCount = notificationService.getUnreadNotificationsCountForCustomer(customerId);
            
            // Get pending bookings count (hire posts with status BOOKED for this customer)
            Long pendingBookingsCount = hirePostService.getPendingBookingsCountForCustomer(customerId);
            
            Map<String, Object> reminders = new HashMap<>();
            reminders.put("unreadChatCount", unreadChatCount);
            reminders.put("unreadNotificationCount", unreadNotificationCount);
            reminders.put("pendingBookingsCount", pendingBookingsCount);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("reminders", reminders);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to fetch reminders: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    private Integer getCustomerIdFromAuth(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        
        String email = auth.getName();
        if (email == null || email.isEmpty()) {
            throw new RuntimeException("User email not found in authentication");
        }
        
        // Verify user is a customer
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
        
        if (role != UserRole.CUSTOMER) {
            throw new RuntimeException("Access denied: Only customers can access this endpoint");
        }
        
        Optional<Customer> customer = customerRepository.findByGmail(email);
        return customer.map(Customer::getCustomerId)
                .orElseThrow(() -> new RuntimeException("Customer not found with email: " + email));
    }
}