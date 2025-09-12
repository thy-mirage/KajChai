package com.example.KajChai.Repository;

import com.example.KajChai.DatabaseEntity.ForumPost;
import com.example.KajChai.Enum.ForumSection;
import com.example.KajChai.Enum.ForumCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {
    
    // Find posts by section
    Page<ForumPost> findBySection(ForumSection section, Pageable pageable);
    
    // Find posts by section and category
    Page<ForumPost> findBySectionAndCategory(ForumSection section, ForumCategory category, Pageable pageable);
    
    // Find posts by author (for "my posts" functionality)
    Page<ForumPost> findByAuthorId(Integer authorId, Pageable pageable);
    
    // Find posts by author and section
    Page<ForumPost> findByAuthorIdAndSection(Integer authorId, ForumSection section, Pageable pageable);
    
    // Find posts by author, section and category
    Page<ForumPost> findByAuthorIdAndSectionAndCategory(Integer authorId, ForumSection section, ForumCategory category, Pageable pageable);
    
    // Custom query to find posts ordered by popularity (likes count)
    @Query("SELECT p FROM ForumPost p WHERE p.section = :section ORDER BY p.likesCount DESC")
    Page<ForumPost> findBySectionOrderByPopularity(@Param("section") ForumSection section, Pageable pageable);
    
    // Custom query to find posts by section and category ordered by popularity
    @Query("SELECT p FROM ForumPost p WHERE p.section = :section AND p.category = :category ORDER BY p.likesCount DESC")
    Page<ForumPost> findBySectionAndCategoryOrderByPopularity(@Param("section") ForumSection section, @Param("category") ForumCategory category, Pageable pageable);
    
    // Custom query to find user's posts by section ordered by popularity
    @Query("SELECT p FROM ForumPost p WHERE p.authorId = :authorId AND p.section = :section ORDER BY p.likesCount DESC")
    Page<ForumPost> findByAuthorIdAndSectionOrderByPopularity(@Param("authorId") Integer authorId, @Param("section") ForumSection section, Pageable pageable);
    
    // Custom query to find user's posts by section and category ordered by popularity
    @Query("SELECT p FROM ForumPost p WHERE p.authorId = :authorId AND p.section = :section AND p.category = :category ORDER BY p.likesCount DESC")
    Page<ForumPost> findByAuthorIdAndSectionAndCategoryOrderByPopularity(@Param("authorId") Integer authorId, @Param("section") ForumSection section, @Param("category") ForumCategory category, Pageable pageable);
    
    // Search posts by title or content
    @Query("SELECT p FROM ForumPost p WHERE p.section = :section AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<ForumPost> searchPostsByKeyword(@Param("section") ForumSection section, @Param("keyword") String keyword, Pageable pageable);
}