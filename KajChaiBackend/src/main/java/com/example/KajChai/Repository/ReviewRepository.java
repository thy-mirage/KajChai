package com.example.KajChai.Repository;

import com.example.KajChai.DatabaseEntity.Customer;
import com.example.KajChai.DatabaseEntity.Review;
import com.example.KajChai.DatabaseEntity.Worker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {
    
    // Find all reviews for a specific worker
    List<Review> findByWorker(Worker worker);
    
    // Find all reviews by a specific customer
    List<Review> findByCustomer(Customer customer);
    
    // Find reviews for a worker ordered by review time
    @Query("SELECT r FROM Review r WHERE r.worker = :worker ORDER BY r.reviewTime DESC")
    List<Review> findReviewsByWorkerOrderByTime(@Param("worker") Worker worker);
    
    // Calculate average rating for a worker
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.worker = :worker")
    Double findAverageRatingByWorker(@Param("worker") Worker worker);
    
    // Count total reviews for a worker
    @Query("SELECT COUNT(r) FROM Review r WHERE r.worker = :worker")
    Long countReviewsByWorker(@Param("worker") Worker worker);
    
    // Count total reviews given by a customer
    @Query("SELECT COUNT(r) FROM Review r WHERE r.customer = :customer")
    Long countReviewsByCustomer(@Param("customer") Customer customer);
    
    // Find reviews by worker and minimum rating
    @Query("SELECT r FROM Review r WHERE r.worker = :worker AND r.rating >= :minRating ORDER BY r.reviewTime DESC")
    List<Review> findReviewsByWorkerAndMinRating(@Param("worker") Worker worker, @Param("minRating") Integer minRating);
}
