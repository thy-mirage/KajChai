package com.example.KajChai.Repository;

import com.example.KajChai.DatabaseEntity.ForumLike;
import com.example.KajChai.DatabaseEntity.ForumPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ForumLikeRepository extends JpaRepository<ForumLike, Long> {
    
    // Find like/dislike by user and post
    Optional<ForumLike> findByUserIdAndForumPost_PostId(Integer userId, Long postId);
    
    // Count likes for a specific post
    @Query("SELECT COUNT(l) FROM ForumLike l WHERE l.forumPost.postId = :postId AND l.isLike = true")
    Long countLikesByPostId(@Param("postId") Long postId);
    
    // Count dislikes for a specific post
    @Query("SELECT COUNT(l) FROM ForumLike l WHERE l.forumPost.postId = :postId AND l.isLike = false")
    Long countDislikesByPostId(@Param("postId") Long postId);
    
    // Check if user has liked a post
    @Query("SELECT CASE WHEN COUNT(l) > 0 THEN true ELSE false END FROM ForumLike l WHERE l.userId = :userId AND l.forumPost.postId = :postId AND l.isLike = true")
    Boolean hasUserLikedPost(@Param("userId") Integer userId, @Param("postId") Long postId);
    
    // Check if user has disliked a post
    @Query("SELECT CASE WHEN COUNT(l) > 0 THEN true ELSE false END FROM ForumLike l WHERE l.userId = :userId AND l.forumPost.postId = :postId AND l.isLike = false")
    Boolean hasUserDislikedPost(@Param("userId") Integer userId, @Param("postId") Long postId);
    
    // Delete likes/dislikes by post
    void deleteByForumPost(ForumPost post);
}