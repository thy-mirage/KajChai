package com.example.KajChai.Repository;

import com.example.KajChai.DatabaseEntity.ForumComplaint;
import com.example.KajChai.Enum.ComplaintStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ForumComplaintRepository extends JpaRepository<ForumComplaint, Long> {
    
    // Find complaints by status
    Page<ForumComplaint> findByStatus(ComplaintStatus status, Pageable pageable);
    
    // Find complaints by post ID
    List<ForumComplaint> findByForumPost_PostId(Long postId);
    
    // Delete complaints by post ID
    void deleteByForumPost_PostId(Long postId);
    
    // Find complaints by complainant
    Page<ForumComplaint> findByComplainantId(Integer complainantId, Pageable pageable);
    
    // Find complaints by status and creation date range
    Page<ForumComplaint> findByStatusAndCreatedAtBetween(
            ComplaintStatus status, 
            LocalDateTime startDate, 
            LocalDateTime endDate, 
            Pageable pageable
    );
    
    // Check if user has already complained about a specific post
    boolean existsByForumPost_PostIdAndComplainantId(Long postId, Integer complainantId);
    
    // Count complaints by status
    long countByStatus(ComplaintStatus status);
    
    // Get complaints with specific statuses
    Page<ForumComplaint> findByStatusIn(List<ComplaintStatus> statuses, Pageable pageable);
    
    // Find complaints for a specific post section
    @Query("SELECT c FROM ForumComplaint c WHERE c.forumPost.section = :section")
    Page<ForumComplaint> findByPostSection(@Param("section") String section, Pageable pageable);
    
    // Search complaints by description or reason
    @Query("SELECT c FROM ForumComplaint c WHERE " +
           "LOWER(c.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.reason) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.forumPost.title) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<ForumComplaint> searchComplaints(@Param("query") String query, Pageable pageable);
    
    // Get recent complaints (last 7 days)
    @Query("SELECT c FROM ForumComplaint c WHERE c.createdAt >= :date ORDER BY c.createdAt DESC")
    List<ForumComplaint> findRecentComplaints(@Param("date") LocalDateTime date);
}