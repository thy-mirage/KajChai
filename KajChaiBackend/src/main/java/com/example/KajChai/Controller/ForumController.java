package com.example.KajChai.Controller;

import com.example.KajChai.DTO.*;
import com.example.KajChai.Enum.ForumSection;
import com.example.KajChai.Enum.ForumCategory;
import com.example.KajChai.Service.ForumService;
import com.example.KajChai.DatabaseEntity.User;
import com.example.KajChai.Repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/forum")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowCredentials = "false")
public class ForumController {
    
    private final ForumService forumService;
    private final UserRepository userRepository;

    // Create a new forum post
    @PostMapping("/posts")
    public ResponseEntity<ForumPostResponse> createPost(@Valid @RequestBody CreateForumPostRequest request) {
        Integer userId = getCurrentUserId();
        ForumPostResponse response = forumService.createPost(request, userId);
        return ResponseEntity.ok(response);
    }

    // Get posts with filtering and sorting (only approved posts for public view)
    @GetMapping("/posts")
    public ResponseEntity<Page<ForumPostResponse>> getPosts(
            @RequestParam ForumSection section,
            @RequestParam(required = false) ForumCategory category,
            @RequestParam(defaultValue = "recent") String sortBy, // "recent" or "popular"
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Integer userId = getCurrentUserId();
        Page<ForumPostResponse> posts = forumService.getPosts(section, category, sortBy, userId, false, page, size);
        return ResponseEntity.ok(posts);
    }

    // Get user's own posts including pending ones
    @GetMapping("/my-posts")
    public ResponseEntity<Page<ForumPostResponse>> getMyPosts(
            @RequestParam ForumSection section,
            @RequestParam(required = false) ForumCategory category,
            @RequestParam(defaultValue = "recent") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Integer userId = getCurrentUserId();
        Page<ForumPostResponse> posts = forumService.getMyPosts(section, category, sortBy, userId, page, size);
        return ResponseEntity.ok(posts);
    }

    // Get single post by ID
    @GetMapping("/posts/{postId}")
    public ResponseEntity<ForumPostResponse> getPost(@PathVariable Long postId) {
        Integer userId = getCurrentUserId();
        ForumPostResponse post = forumService.getPostById(postId, userId);
        return ResponseEntity.ok(post);
    }

    // Add comment to a post
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<ForumCommentResponse> addComment(
            @PathVariable Long postId,
            @Valid @RequestBody CreateCommentRequest request) {
        Integer userId = getCurrentUserId();
        ForumCommentResponse comment = forumService.addComment(postId, request, userId);
        return ResponseEntity.ok(comment);
    }

    // Get comments for a post
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<List<ForumCommentResponse>> getComments(@PathVariable Long postId) {
        List<ForumCommentResponse> comments = forumService.getPostComments(postId);
        return ResponseEntity.ok(comments);
    }

    // Like a post
    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<String> likePost(@PathVariable Long postId) {
        Integer userId = getCurrentUserId();
        forumService.toggleLike(postId, userId, true);
        return ResponseEntity.ok("Post liked successfully");
    }

    // Dislike a post
    @PostMapping("/posts/{postId}/dislike")
    public ResponseEntity<String> dislikePost(@PathVariable Long postId) {
        Integer userId = getCurrentUserId();
        forumService.toggleLike(postId, userId, false);
        return ResponseEntity.ok("Post disliked successfully");
    }

    // Remove like/dislike from a post
    @DeleteMapping("/posts/{postId}/like")
    public ResponseEntity<String> removeLike(@PathVariable Long postId) {
        Integer userId = getCurrentUserId();
        // This will be handled in the service by checking if the same action exists
        return ResponseEntity.ok("Like/dislike removed successfully");
    }

    // Delete a post (only post owner can delete)
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<String> deletePost(@PathVariable Long postId) {
        Integer userId = getCurrentUserId();
        forumService.deletePost(postId, userId);
        return ResponseEntity.ok("Post deleted successfully");
    }

    // Get forum categories for a specific section
    @GetMapping("/categories")
    public ResponseEntity<List<ForumCategory>> getCategories(@RequestParam ForumSection section) {
        List<ForumCategory> categories = getAvailableCategories(section);
        return ResponseEntity.ok(categories);
    }

    // Helper method to get current user ID from authentication context
    private Integer getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && 
            !authentication.getPrincipal().equals("anonymousUser")) {
            
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found for email: " + email));
            return user.getUserId();
        }
        throw new RuntimeException("User not authenticated");
    }

    // Helper method to get available categories for a section
    private List<ForumCategory> getAvailableCategories(ForumSection section) {
        return switch (section) {
            case CUSTOMER_QA, CUSTOMER_EXPERIENCE -> List.of(
                ForumCategory.ELECTRICAL_WORK,
                ForumCategory.PLUMBING,
                ForumCategory.CARPENTRY,
                ForumCategory.PAINTING,
                ForumCategory.CLEANING_SERVICES,
                ForumCategory.COOKING_CATERING,
                ForumCategory.DRIVING_SERVICES,
                ForumCategory.PHOTOGRAPHY
            );
            case WORKER_TIPS_PROJECTS -> List.of(
                ForumCategory.ELECTRICAL_WORK_TIPS,
                ForumCategory.PLUMBING_TIPS,
                ForumCategory.CARPENTRY_TIPS,
                ForumCategory.PAINTING_TECHNIQUES,
                ForumCategory.CLEANING_MAID_TIPS,
                ForumCategory.COOKING_CATERING_TIPS,
                ForumCategory.DRIVING_SKILLS_ADVICE,
                ForumCategory.PHOTOGRAPHY_TIPS_PROJECTS
            );
        };
    }
}