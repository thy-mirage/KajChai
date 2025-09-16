package com.example.KajChai.Service;

import com.example.KajChai.DatabaseEntity.ForumPost;
import com.example.KajChai.Enum.PostStatus;
import com.example.KajChai.Repository.ForumPostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigrationService implements ApplicationRunner {

    private final ForumPostRepository forumPostRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        log.info("Starting database migration for forum posts...");
        
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
            log.error("Error during database migration: ", e);
        }
    }
}