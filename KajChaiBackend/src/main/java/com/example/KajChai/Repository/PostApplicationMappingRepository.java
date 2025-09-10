package com.example.KajChai.Repository;

import com.example.KajChai.DatabaseEntity.HirePost;
import com.example.KajChai.DatabaseEntity.PostApplicationMapping;
import com.example.KajChai.DatabaseEntity.Worker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostApplicationMappingRepository extends JpaRepository<PostApplicationMapping, Integer> {
    
    // Find all applications for a specific hire post
    List<PostApplicationMapping> findByHirePost(HirePost hirePost);
    
    // Find all applications by a specific worker
    List<PostApplicationMapping> findByWorker(Worker worker);
    
    // Check if a worker has already applied to a specific post
    Optional<PostApplicationMapping> findByWorkerAndHirePost(Worker worker, HirePost hirePost);
    
    // Check if a worker has already applied to a specific post (returns boolean)
    boolean existsByWorkerAndHirePost(Worker worker, HirePost hirePost);
    
    // Count applications for a specific hire post
    @Query("SELECT COUNT(pam) FROM PostApplicationMapping pam WHERE pam.hirePost = :hirePost")
    Long countApplicationsByHirePost(@Param("hirePost") HirePost hirePost);
    
    // Find applications for hire posts by customer
    @Query("SELECT pam FROM PostApplicationMapping pam WHERE pam.hirePost.customer.customerId = :customerId ORDER BY pam.applicationTime DESC")
    List<PostApplicationMapping> findApplicationsByCustomerId(@Param("customerId") Integer customerId);
}
