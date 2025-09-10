package com.example.KajChai.Repository;

import com.example.KajChai.DatabaseEntity.Worker;
import com.example.KajChai.DatabaseEntity.WorkerNotification;
import com.example.KajChai.Enum.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkerNotificationRepository extends JpaRepository<WorkerNotification, Integer> {
    List<WorkerNotification> findByWorkerOrderByNotificationTimeDesc(Worker worker);
    List<WorkerNotification> findByWorkerAndStatusOrderByNotificationTimeDesc(Worker worker, NotificationStatus status);
    long countByWorkerAndStatus(Worker worker, NotificationStatus status);
}
