package com.example.KajChai.Repository;

import com.example.KajChai.DatabaseEntity.Customer;
import com.example.KajChai.DatabaseEntity.CustomerNotification;
import com.example.KajChai.Enum.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerNotificationRepository extends JpaRepository<CustomerNotification, Integer> {
    List<CustomerNotification> findByCustomerOrderByNotificationTimeDesc(Customer customer);
    List<CustomerNotification> findByCustomerAndStatusOrderByNotificationTimeDesc(Customer customer, NotificationStatus status);
    long countByCustomerAndStatus(Customer customer, NotificationStatus status);
}
