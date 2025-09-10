package com.example.KajChai.Service;

import com.example.KajChai.DatabaseEntity.Customer;
import com.example.KajChai.DatabaseEntity.CustomerNotification;
import com.example.KajChai.DatabaseEntity.Worker;
import com.example.KajChai.DatabaseEntity.WorkerNotification;
import com.example.KajChai.DTO.NotificationResponse;
import com.example.KajChai.Enum.NotificationStatus;
import com.example.KajChai.Repository.CustomerNotificationRepository;
import com.example.KajChai.Repository.CustomerRepository;
import com.example.KajChai.Repository.WorkerNotificationRepository;
import com.example.KajChai.Repository.WorkerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {
    
    private final CustomerNotificationRepository customerNotificationRepository;
    private final WorkerNotificationRepository workerNotificationRepository;
    private final CustomerRepository customerRepository;
    private final WorkerRepository workerRepository;
    
    // Customer notification methods
    public CustomerNotification createCustomerNotification(Customer customer, String message) {
        CustomerNotification notification = CustomerNotification.builder()
                .customer(customer)
                .message(message)
                .status(NotificationStatus.UNREAD)
                .build();
        return customerNotificationRepository.save(notification);
    }
    
    public List<NotificationResponse> getNotificationsByCustomer(Integer customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        
        List<CustomerNotification> notifications = customerNotificationRepository.findByCustomerOrderByNotificationTimeDesc(customer);
        return notifications.stream()
                .map(this::convertCustomerNotificationToResponse)
                .collect(Collectors.toList());
    }
    
    public List<NotificationResponse> getUnreadNotificationsByCustomer(Integer customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        
        List<CustomerNotification> notifications = customerNotificationRepository.findByCustomerAndStatusOrderByNotificationTimeDesc(customer, NotificationStatus.UNREAD);
        return notifications.stream()
                .map(this::convertCustomerNotificationToResponse)
                .collect(Collectors.toList());
    }
    
    public Long getUnreadNotificationsCountForCustomer(Integer customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        
        return customerNotificationRepository.countByCustomerAndStatus(customer, NotificationStatus.UNREAD);
    }
    
    // Worker notification methods
    public WorkerNotification createWorkerNotification(Worker worker, String message) {
        WorkerNotification notification = WorkerNotification.builder()
                .worker(worker)
                .message(message)
                .status(NotificationStatus.UNREAD)
                .build();
        return workerNotificationRepository.save(notification);
    }
    
    public List<NotificationResponse> getNotificationsByWorker(Integer workerId) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));
        
        List<WorkerNotification> notifications = workerNotificationRepository.findByWorkerOrderByNotificationTimeDesc(worker);
        return notifications.stream()
                .map(this::convertWorkerNotificationToResponse)
                .collect(Collectors.toList());
    }
    
    public List<NotificationResponse> getUnreadNotificationsByWorker(Integer workerId) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));
        
        List<WorkerNotification> notifications = workerNotificationRepository.findByWorkerAndStatusOrderByNotificationTimeDesc(worker, NotificationStatus.UNREAD);
        return notifications.stream()
                .map(this::convertWorkerNotificationToResponse)
                .collect(Collectors.toList());
    }
    
    public Long getUnreadNotificationsCountForWorker(Integer workerId) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));
        
        return workerNotificationRepository.countByWorkerAndStatus(worker, NotificationStatus.UNREAD);
    }
    
    @Transactional
    public void markNotificationAsRead(Integer notificationId, Integer userId, String userRole) {
        if ("CUSTOMER".equals(userRole)) {
            CustomerNotification notification = customerNotificationRepository.findById(notificationId)
                    .orElseThrow(() -> new RuntimeException("Customer notification not found"));
            
            if (!notification.getCustomer().getCustomerId().equals(userId)) {
                throw new RuntimeException("Unauthorized to access this notification");
            }
            
            notification.setStatus(NotificationStatus.READ);
            customerNotificationRepository.save(notification);
        } else if ("WORKER".equals(userRole)) {
            WorkerNotification notification = workerNotificationRepository.findById(notificationId)
                    .orElseThrow(() -> new RuntimeException("Worker notification not found"));
            
            if (!notification.getWorker().getWorkerId().equals(userId)) {
                throw new RuntimeException("Unauthorized to access this notification");
            }
            
            notification.setStatus(NotificationStatus.READ);
            workerNotificationRepository.save(notification);
        } else {
            throw new RuntimeException("Invalid user role");
        }
    }
    
    @Transactional
    public void markAllNotificationsAsRead(Integer userId, String userRole) {
        if ("CUSTOMER".equals(userRole)) {
            Customer customer = customerRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
            List<CustomerNotification> unreadNotifications = customerNotificationRepository.findByCustomerAndStatusOrderByNotificationTimeDesc(customer, NotificationStatus.UNREAD);
            unreadNotifications.forEach(notification -> notification.setStatus(NotificationStatus.READ));
            customerNotificationRepository.saveAll(unreadNotifications);
        } else if ("WORKER".equals(userRole)) {
            Worker worker = workerRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Worker not found"));
            List<WorkerNotification> unreadNotifications = workerNotificationRepository.findByWorkerAndStatusOrderByNotificationTimeDesc(worker, NotificationStatus.UNREAD);
            unreadNotifications.forEach(notification -> notification.setStatus(NotificationStatus.READ));
            workerNotificationRepository.saveAll(unreadNotifications);
        } else {
            throw new RuntimeException("Invalid user role");
        }
    }
    
    @Transactional
    public void deleteNotification(Integer notificationId, Integer userId, String userRole) {
        if ("CUSTOMER".equals(userRole)) {
            CustomerNotification notification = customerNotificationRepository.findById(notificationId)
                    .orElseThrow(() -> new RuntimeException("Customer notification not found"));
            
            if (!notification.getCustomer().getCustomerId().equals(userId)) {
                throw new RuntimeException("Unauthorized to delete this notification");
            }
            
            customerNotificationRepository.delete(notification);
        } else if ("WORKER".equals(userRole)) {
            WorkerNotification notification = workerNotificationRepository.findById(notificationId)
                    .orElseThrow(() -> new RuntimeException("Worker notification not found"));
            
            if (!notification.getWorker().getWorkerId().equals(userId)) {
                throw new RuntimeException("Unauthorized to delete this notification");
            }
            
            workerNotificationRepository.delete(notification);
        } else {
            throw new RuntimeException("Invalid user role");
        }
    }
    
    private NotificationResponse convertCustomerNotificationToResponse(CustomerNotification notification) {
        return NotificationResponse.builder()
                .notificationId(notification.getNotificationId())
                .message(notification.getMessage())
                .status(notification.getStatus())
                .notificationTime(notification.getNotificationTime())
                .build();
    }
    
    private NotificationResponse convertWorkerNotificationToResponse(WorkerNotification notification) {
        return NotificationResponse.builder()
                .notificationId(notification.getNotificationId())
                .message(notification.getMessage())
                .status(notification.getStatus())
                .notificationTime(notification.getNotificationTime())
                .build();
    }
}
