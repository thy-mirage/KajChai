package com.example.KajChai.Service;

import com.example.KajChai.DatabaseEntity.ForumPost;
import com.example.KajChai.Enum.PostStatus;
import com.example.KajChai.Repository.ForumPostRepository;
import com.example.KajChai.Repository.WorkerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigrationService implements ApplicationRunner {

    private final ForumPostRepository forumPostRepository;
    private final WorkerRepository workerRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        log.info("Starting database migration...");
        
        // Migrate forum posts
        migrateForumPosts();
        
        // Migrate worker account status fields
        migrateWorkerAccountStatus();
        
        // Migrate user complaint evidence_urls column
        migrateUserComplaintEvidenceUrls();
        
        // Migrate complaint status from AWAITING_CLARIFICATION to UNDER_INVESTIGATION
        migrateComplaintStatus();
    }
    
    private void migrateForumPosts() {
        log.info("Starting forum posts migration...");
        
        try {
            // Find all posts with null status and set them to APPROVED
            List<ForumPost> postsWithNullStatus = forumPostRepository.findByStatusIsNull();
            
            if (!postsWithNullStatus.isEmpty()) {
                log.info("Found {} posts with null status. Updating to APPROVED...", postsWithNullStatus.size());
                
                for (ForumPost post : postsWithNullStatus) {
                    post.setStatus(PostStatus.APPROVED);
                    post.setModerationReason("Auto-approved during migration");
                    post.setModeratedAt(LocalDateTime.now());
                }
                
                forumPostRepository.saveAll(postsWithNullStatus);
                log.info("Successfully updated {} posts to APPROVED status", postsWithNullStatus.size());
            } else {
                log.info("No posts with null status found. Migration not needed.");
            }
            
        } catch (Exception e) {
            log.error("Error during forum posts migration: ", e);
        }
    }
    
    private void migrateWorkerAccountStatus() {
        log.info("Starting worker account status migration...");
        
        try {
            // Update existing worker records to set default values for new account status fields
            int updatedRows = jdbcTemplate.update(
                "UPDATE worker SET " +
                "is_active = COALESCE(is_active, true), " +
                "is_banned = COALESCE(is_banned, false), " +
                "is_restricted = COALESCE(is_restricted, false) " +
                "WHERE is_active IS NULL OR is_banned IS NULL OR is_restricted IS NULL"
            );
            
            if (updatedRows > 0) {
                log.info("Updated {} worker records with default account status values", updatedRows);
            } else {
                log.info("No worker records needed account status migration.");
            }
            
        } catch (Exception e) {
            log.error("Error during worker account status migration: {}", e.getMessage());
            // Don't throw exception here as it might prevent application startup
        }
    }
    
    private void migrateUserComplaintEvidenceUrls() {
        log.info("Starting user complaint evidence_urls column migration...");
        
        try {
            // Check if evidence_urls column exists and is JSON type
            String checkColumnQuery = "SELECT data_type FROM information_schema.columns " +
                    "WHERE table_name = 'user_complaint' AND column_name = 'evidence_urls'";
            
            String dataType = jdbcTemplate.queryForObject(checkColumnQuery, String.class);
            
            if ("json".equals(dataType)) {
                log.info("Converting evidence_urls column from JSON to TEXT...");
                
                // Convert JSON column to TEXT
                jdbcTemplate.execute("ALTER TABLE user_complaint ALTER COLUMN evidence_urls TYPE TEXT");
                
                log.info("Successfully converted evidence_urls column to TEXT type");
            } else {
                log.info("evidence_urls column is already TEXT type or doesn't exist");
            }
            
        } catch (Exception e) {
            log.error("Error during user complaint evidence_urls migration: {}", e.getMessage());
            // Don't throw exception here as it might prevent application startup
        }
    }
    
    private void migrateComplaintStatus() {
        log.info("Starting complaint status migration...");
        
        try {
            // Update any AWAITING_CLARIFICATION status to UNDER_INVESTIGATION
            int updatedRows = jdbcTemplate.update(
                "UPDATE user_complaint SET status = 'UNDER_INVESTIGATION' WHERE status = 'AWAITING_CLARIFICATION'"
            );
            
            if (updatedRows > 0) {
                log.info("Migrated {} complaints from AWAITING_CLARIFICATION to UNDER_INVESTIGATION", updatedRows);
            } else {
                log.info("No complaints with AWAITING_CLARIFICATION status found");
            }
            
        } catch (Exception e) {
            log.error("Error during complaint status migration: {}", e.getMessage());
            // Don't throw exception here as it might prevent application startup
        }
    }
}