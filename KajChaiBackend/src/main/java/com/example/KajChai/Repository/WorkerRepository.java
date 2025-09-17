package com.example.KajChai.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.KajChai.DatabaseEntity.Worker;

@Repository
public interface WorkerRepository extends JpaRepository<Worker, Integer> {
    Optional<Worker> findByGmail(String gmail);
    boolean existsByGmail(String gmail);
    
    // Find workers by field
    List<Worker> findByFieldIgnoreCase(String field);
    
    // Find workers by field with pagination
    Page<Worker> findByFieldIgnoreCase(String field, Pageable pageable);
    
    // Find workers by name (contains search)
    @Query("SELECT w FROM Worker w WHERE LOWER(w.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Worker> findByNameContainingIgnoreCase(@Param("name") String name);
    
    // Find workers who have completed tasks for a specific customer
    @Query("SELECT DISTINCT w FROM Worker w " +
           "JOIN Booking b ON w.workerId = b.worker.workerId " +
           "JOIN HirePost hp ON b.hirePost.postId = hp.postId " +
           "WHERE hp.customer.customerId = :customerId " +
           "AND hp.status = 'COMPLETED'")
    List<Worker> findWorkersByCompletedTasksForCustomer(@Param("customerId") Integer customerId);
    
    // Search for worker suggestions with optional field filter
    @Query("SELECT w FROM Worker w WHERE " +
           "w.name ILIKE CONCAT('%', :query, '%') " +
           "AND (:field IS NULL OR w.field = :field) " +
           "ORDER BY w.rating DESC, w.name ASC")
    List<Worker> searchWorkerSuggestions(@Param("query") String query, 
                                        @Param("field") String field, 
                                        Pageable pageable);
}
