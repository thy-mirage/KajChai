package com.example.KajChai.Repository;

import com.example.KajChai.DatabaseEntity.Customer;
import com.example.KajChai.DatabaseEntity.HirePost;
import com.example.KajChai.Enum.HirePostStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HirePostRepository extends JpaRepository<HirePost, Integer> {
    
    // Find all posts by customer
    List<HirePost> findByCustomerOrderByPostTimeDesc(Customer customer);
    
    // Find all posts by customer and status
    List<HirePost> findByCustomerAndStatusOrderByPostTimeDesc(Customer customer, HirePostStatus status);
    
    // Find all available posts by field
    List<HirePost> findByFieldAndStatusOrderByPostTimeDesc(String field, HirePostStatus status);
    
    // Find all available posts
    List<HirePost> findByStatusOrderByPostTimeDesc(HirePostStatus status);
    
    // Find posts by field
    List<HirePost> findByField(String field);
    
    // Find available posts by field (for workers to browse)
    @Query("SELECT hp FROM HirePost hp WHERE hp.field = :field AND hp.status = 'AVAILABLE' ORDER BY hp.postTime DESC")
    List<HirePost> findAvailablePostsByField(@Param("field") String field);
    
    // Find all available posts ordered by post time
    @Query("SELECT hp FROM HirePost hp WHERE hp.status = 'AVAILABLE' ORDER BY hp.postTime DESC")
    List<HirePost> findAllAvailablePosts();
    
    // Count hire posts by customer and status
    Long countByCustomerCustomerIdAndStatus(Integer customerId, HirePostStatus status);
}
