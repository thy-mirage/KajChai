package com.example.KajChai.Repository;

import com.example.KajChai.DatabaseEntity.Customer;
import com.example.KajChai.DatabaseEntity.UserComplaint;
import com.example.KajChai.DatabaseEntity.Worker;
import com.example.KajChai.Enum.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserComplaintRepository extends JpaRepository<UserComplaint, Integer> {
    
    // Find complaints by reported worker
    List<UserComplaint> findByReportedWorkerOrderByCreatedAtDesc(Worker worker);
    
    // Find complaints by customer who reported
    List<UserComplaint> findByReportedByCustomerOrderByCreatedAtDesc(Customer customer);
    
    // Find complaints by status
    List<UserComplaint> findByStatusOrderByCreatedAtDesc(ComplaintStatus status);
    
    // Find all complaints ordered by creation date
    List<UserComplaint> findAllByOrderByCreatedAtDesc();
    
    // Count complaints by status
    Long countByStatus(ComplaintStatus status);
    
    // Count complaints by reported worker
    Long countByReportedWorker(Worker worker);
    
    // Find complaints awaiting clarification that are past deadline
    @Query("SELECT uc FROM UserComplaint uc WHERE uc.status = :status AND uc.clarificationDeadline < :currentTime")
    List<UserComplaint> findExpiredClarificationRequests(@Param("status") ComplaintStatus status, @Param("currentTime") LocalDateTime currentTime);
    
    // Find complaints by worker and status
    List<UserComplaint> findByReportedWorkerAndStatusOrderByCreatedAtDesc(Worker worker, ComplaintStatus status);
}