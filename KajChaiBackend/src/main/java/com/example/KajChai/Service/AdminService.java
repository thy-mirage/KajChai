package com.example.KajChai.Service;

import com.example.KajChai.DatabaseEntity.ForumComment;
import com.example.KajChai.DatabaseEntity.ForumPost;
import com.example.KajChai.DTO.ForumCommentResponse;
import com.example.KajChai.DTO.ForumPostResponse;
import com.example.KajChai.Enum.ForumSection;
import com.example.KajChai.Repository.ForumCommentRepository;
import com.example.KajChai.Repository.ForumPostRepository;
import com.example.KajChai.Repository.CustomerRepository;
import com.example.KajChai.Repository.WorkerRepository;
import com.example.KajChai.Repository.HirePostRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final ForumPostRepository forumPostRepository;
    private final ForumCommentRepository forumCommentRepository;
    private final CustomerRepository customerRepository;
    private final WorkerRepository workerRepository;
    private final HirePostRepository hirePostRepository;
    private final ObjectMapper objectMapper;

    public Page<ForumPostResponse> getAllForumPosts(int page, int size, String section, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ForumPost> posts;

        if (section != null && !section.isEmpty()) {
            ForumSection forumSection = ForumSection.valueOf(section.toUpperCase());
            if (search != null && !search.isEmpty()) {
                posts = forumPostRepository.findBySectionAndTitleContainingIgnoreCaseOrContentContainingIgnoreCase(
                        forumSection, search, search, pageable);
            } else {
                posts = forumPostRepository.findBySection(forumSection, pageable);
            }
        } else {
            if (search != null && !search.isEmpty()) {
                posts = forumPostRepository.findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(
                        search, search, pageable);
            } else {
                posts = forumPostRepository.findAll(pageable);
            }
        }

        return posts.map(this::convertToForumPostResponse);
    }

    @Transactional
    public void deleteForumPost(Long postId) {
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Forum post not found"));

        // Delete all comments first
        forumCommentRepository.deleteByForumPost(post);
        
        // Delete the post
        forumPostRepository.delete(post);
        
        log.info("Admin deleted forum post: {} (ID: {})", post.getTitle(), postId);
    }

    public Object getAllForumComments(int page, int size, Long postId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ForumComment> comments;

        if (postId != null) {
            comments = forumCommentRepository.findByForumPost_PostId(postId, pageable);
        } else {
            comments = forumCommentRepository.findAll(pageable);
        }

        Page<ForumCommentResponse> commentResponses = comments.map(this::convertToForumCommentResponse);
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", commentResponses.getContent());
        response.put("currentPage", commentResponses.getNumber());
        response.put("totalPages", commentResponses.getTotalPages());
        response.put("totalElements", commentResponses.getTotalElements());
        
        return response;
    }

    @Transactional
    public void deleteForumComment(Long commentId) {
        ForumComment comment = forumCommentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Forum comment not found"));

        // Update post comment count
        ForumPost post = comment.getForumPost();
        if (post != null) {
            post.setCommentsCount(Math.max(0, post.getCommentsCount() - 1));
            forumPostRepository.save(post);
        }
        
        forumCommentRepository.delete(comment);
        
        log.info("Admin deleted forum comment: {} (ID: {})", 
                comment.getContent().substring(0, Math.min(50, comment.getContent().length())), commentId);
    }

    public Map<String, Object> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Forum statistics
        long totalPosts = forumPostRepository.count();
        long totalComments = forumCommentRepository.count();
        long totalCustomers = customerRepository.count();
        long totalWorkers = workerRepository.count();
        long totalHirePosts = hirePostRepository.count();
        
        // Posts by section
        Map<String, Long> postsBySection = new HashMap<>();
        for (ForumSection section : ForumSection.values()) {
            long count = forumPostRepository.countBySection(section);
            postsBySection.put(section.name(), count);
        }
        
        stats.put("totalPosts", totalPosts);
        stats.put("totalComments", totalComments);
        stats.put("totalCustomers", totalCustomers);
        stats.put("totalWorkers", totalWorkers);
        stats.put("totalHirePosts", totalHirePosts);
        stats.put("postsBySection", postsBySection);
        
        return stats;
    }

    public List<Map<String, Object>> getRecentActivity() {
        List<Map<String, Object>> activities = new ArrayList<>();
        
        // Get recent forum posts (last 5)
        Pageable recentPostsPageable = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ForumPost> recentPosts = forumPostRepository.findAll(recentPostsPageable);
        
        for (ForumPost post : recentPosts.getContent()) {
            Map<String, Object> activity = new HashMap<>();
            activity.put("type", "forum_post");
            activity.put("action", "New forum post published");
            activity.put("details", post.getTitle());
            activity.put("time", formatRelativeTime(post.getCreatedAt()));
            activity.put("icon", "💬");
            activities.add(activity);
        }
        
        // Get recent comments (last 3)
        Pageable recentCommentsPageable = PageRequest.of(0, 3, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ForumComment> recentComments = forumCommentRepository.findAll(recentCommentsPageable);
        
        for (ForumComment comment : recentComments.getContent()) {
            Map<String, Object> activity = new HashMap<>();
            activity.put("type", "forum_comment");
            activity.put("action", "New comment posted");
            activity.put("details", comment.getContent().substring(0, Math.min(50, comment.getContent().length())) + "...");
            activity.put("time", formatRelativeTime(comment.getCreatedAt()));
            activity.put("icon", "💭");
            activities.add(activity);
        }
        
        // Sort all activities by time (most recent first)
        activities.sort((a, b) -> {
            // Simple comparison by time string - in a real app, you'd sort by actual timestamps
            return 0; // For now, keep the order as is
        });
        
        return activities.stream().limit(5).collect(java.util.stream.Collectors.toList());
    }
    
    private String formatRelativeTime(java.time.LocalDateTime dateTime) {
        if (dateTime == null) {
            return "Unknown time";
        }
        
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.Duration duration = java.time.Duration.between(dateTime, now);
        
        long hours = duration.toHours();
        long days = duration.toDays();
        
        if (days > 0) {
            return days == 1 ? "1 day ago" : days + " days ago";
        } else if (hours > 0) {
            return hours == 1 ? "1 hour ago" : hours + " hours ago";
        } else {
            long minutes = duration.toMinutes();
            return minutes <= 1 ? "Just now" : minutes + " minutes ago";
        }
    }

    private ForumPostResponse convertToForumPostResponse(ForumPost post) {
        List<String> photoUrls = new ArrayList<>();
        if (post.getPhotoUrls() != null) {
            try {
                photoUrls = objectMapper.readValue(post.getPhotoUrls(), new TypeReference<List<String>>() {});
            } catch (Exception e) {
                log.warn("Failed to parse photo URLs for post {}: {}", post.getPostId(), e.getMessage());
            }
        }

        return ForumPostResponse.builder()
                .postId(post.getPostId())
                .title(post.getTitle())
                .content(post.getContent())
                .photoUrls(photoUrls)
                .section(post.getSection())
                .category(post.getCategory())
                .authorId(post.getAuthorId())
                .authorName(post.getAuthorName())
                .authorPhoto(post.getAuthorPhoto())
                .likesCount(post.getLikesCount())
                .dislikesCount(post.getDislikesCount())
                .commentsCount(post.getCommentsCount())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .status(post.getStatus().toString())
                .moderationReason(post.getModerationReason())
                .build();
    }

    private ForumCommentResponse convertToForumCommentResponse(ForumComment comment) {
        return ForumCommentResponse.builder()
                .commentId(comment.getCommentId())
                .content(comment.getContent())
                .authorId(comment.getAuthorId())
                .authorName(comment.getAuthorName())
                .authorPhoto(comment.getAuthorPhoto())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}