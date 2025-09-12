package com.example.KajChai.Repository;

import com.example.KajChai.DatabaseEntity.ForumComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForumCommentRepository extends JpaRepository<ForumComment, Long> {
    
    // Find comments by post ID
    List<ForumComment> findByForumPost_PostIdOrderByCreatedAtAsc(Long postId);
    
    // Find comments by post ID with pagination
    Page<ForumComment> findByForumPost_PostId(Long postId, Pageable pageable);
    
    // Find comments by author
    Page<ForumComment> findByAuthorId(Integer authorId, Pageable pageable);
    
    // Count comments for a specific post
    @Query("SELECT COUNT(c) FROM ForumComment c WHERE c.forumPost.postId = :postId")
    Long countByPostId(@Param("postId") Long postId);
}