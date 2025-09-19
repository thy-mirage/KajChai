package com.example.KajChai.Repository;

import com.example.KajChai.DatabaseEntity.Booking;
import com.example.KajChai.DatabaseEntity.HirePost;
import com.example.KajChai.DatabaseEntity.Worker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Integer> {
    
    // Find booking by hire post
    Optional<Booking> findByHirePost(HirePost hirePost);
    
    // Find all bookings for a customer (through hire posts)
    @Query("SELECT b FROM Booking b WHERE b.hirePost.customer.customerId = :customerId")
    List<Booking> findByCustomerId(@Param("customerId") Integer customerId);
    
    // Find all bookings for a worker
    List<Booking> findByWorker(Worker worker);
    
    // Find all bookings for a worker by worker ID
    @Query("SELECT b FROM Booking b WHERE b.worker.workerId = :workerId")
    List<Booking> findByWorkerId(@Param("workerId") Integer workerId);
    
    // Check if a hire post is already booked
    boolean existsByHirePost(HirePost hirePost);
    
    // Get total earnings for a worker (from completed hire posts)
    @Query("SELECT COALESCE(SUM(hp.payment), 0) FROM Booking b JOIN b.hirePost hp WHERE b.worker.workerId = :workerId AND hp.status = 'COMPLETED'")
    Double getTotalEarningsByWorkerId(@Param("workerId") Integer workerId);
    
    // Get total spent by a customer (from completed hire posts)
    @Query("SELECT COALESCE(SUM(hp.payment), 0) FROM Booking b JOIN b.hirePost hp WHERE hp.customer.customerId = :customerId AND hp.status = 'COMPLETED'")
    Double getTotalSpentByCustomerId(@Param("customerId") Integer customerId);
    
    // Count completed jobs for a worker
    @Query("SELECT COUNT(b) FROM Booking b JOIN b.hirePost hp WHERE b.worker.workerId = :workerId AND hp.status = 'COMPLETED'")
    Long countCompletedJobsByWorkerId(@Param("workerId") Integer workerId);
}
