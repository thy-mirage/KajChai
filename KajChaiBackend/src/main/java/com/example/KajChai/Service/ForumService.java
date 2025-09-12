package com.example.KajChai.Service;

import com.example.KajChai.DatabaseEntity.*;
import com.example.KajChai.DTO.*;
import com.example.KajChai.Enum.ForumSection;
import com.example.KajChai.Enum.ForumCategory;
import com.example.KajChai.Enum.UserRole;
import com.example.KajChai.Repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ForumService {
    
    private final ForumPostRepository forumPostRepository;
    private final ForumCommentRepository forumCommentRepository;
    private final ForumLikeRepository forumLikeRepository;
    private final CustomerRepository customerRepository;
    private final WorkerRepository workerRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    // Create a new forum post
    public ForumPostResponse createPost(CreateForumPostRequest request, Integer userId) {
        // Get user details
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Validate section and category permissions
        validatePostPermissions(request.getSection(), user.getRole());
        
        // Get author details based on role
        String authorName;
        String authorPhoto = null;
        
        if (user.getRole() == UserRole.CUSTOMER) {
            Customer customer = customerRepository.findByGmail(user.getEmail())
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
            authorName = customer.getCustomerName();
            authorPhoto = customer.getPhoto();
        } else {
            Worker worker = workerRepository.findByGmail(user.getEmail())
                    .orElseThrow(() -> new RuntimeException("Worker not found"));
            authorName = worker.getName();
            authorPhoto = worker.getPhoto();
        }

        // Convert photo URLs list to JSON string
        String photoUrlsJson = null;
        if (request.getPhotoUrls() != null && !request.getPhotoUrls().isEmpty()) {
            try {
                photoUrlsJson = objectMapper.writeValueAsString(request.getPhotoUrls());
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Error processing photo URLs", e);
            }
        }

        // Create forum post
        ForumPost post = ForumPost.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .photoUrls(photoUrlsJson)
                .section(request.getSection())
                .category(request.getCategory())
                .authorId(userId)
                .authorName(authorName)
                .authorPhoto(authorPhoto)
                .build();

        ForumPost savedPost = forumPostRepository.save(post);
        return convertToPostResponse(savedPost, userId);
    }

    // Get posts with filtering and sorting
    public Page<ForumPostResponse> getPosts(ForumSection section, ForumCategory category, 
            String sortBy, Integer userId, Boolean myPosts, int page, int size) {
        
        Pageable pageable;
        Page<ForumPost> posts;
        
        // Determine sorting
        if ("popular".equals(sortBy)) {
            pageable = PageRequest.of(page, size);
            if (myPosts != null && myPosts) {
                if (category != null) {
                    posts = forumPostRepository.findByAuthorIdAndSectionAndCategoryOrderByPopularity(userId, section, category, pageable);
                } else {
                    posts = forumPostRepository.findByAuthorIdAndSectionOrderByPopularity(userId, section, pageable);
                }
            } else {
                if (category != null) {
                    posts = forumPostRepository.findBySectionAndCategoryOrderByPopularity(section, category, pageable);
                } else {
                    posts = forumPostRepository.findBySectionOrderByPopularity(section, pageable);
                }
            }
        } else {
            // Default to recent (by creation date)
            pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            if (myPosts != null && myPosts) {
                if (category != null) {
                    posts = forumPostRepository.findByAuthorIdAndSectionAndCategory(userId, section, category, pageable);
                } else {
                    posts = forumPostRepository.findByAuthorIdAndSection(userId, section, pageable);
                }
            } else {
                if (category != null) {
                    posts = forumPostRepository.findBySectionAndCategory(section, category, pageable);
                } else {
                    posts = forumPostRepository.findBySection(section, pageable);
                }
            }
        }

        return posts.map(post -> convertToPostResponse(post, userId));
    }

    // Get single post by ID
    public ForumPostResponse getPostById(Long postId, Integer userId) {
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return convertToPostResponse(post, userId);
    }

    // Add comment to a post
    public ForumCommentResponse addComment(Long postId, CreateCommentRequest request, Integer userId) {
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        
        // Get user details
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String authorName;
        String authorPhoto = null;
        
        if (user.getRole() == UserRole.CUSTOMER) {
            Customer customer = customerRepository.findByGmail(user.getEmail())
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
            authorName = customer.getCustomerName();
            authorPhoto = customer.getPhoto();
        } else {
            Worker worker = workerRepository.findByGmail(user.getEmail())
                    .orElseThrow(() -> new RuntimeException("Worker not found"));
            authorName = worker.getName();
            authorPhoto = worker.getPhoto();
        }

        ForumComment comment = ForumComment.builder()
                .content(request.getContent())
                .authorId(userId)
                .authorName(authorName)
                .authorPhoto(authorPhoto)
                .forumPost(post)
                .build();

        ForumComment savedComment = forumCommentRepository.save(comment);
        
        // Update comment count
        updatePostCommentCount(postId);
        
        // Send notification to post author if it's not their own comment
        if (!post.getAuthorId().equals(userId)) {
            sendCommentNotification(post, authorName, userId);
        }
        
        return convertToCommentResponse(savedComment);
    }

    // Like or dislike a post
    public void toggleLike(Long postId, Integer userId, Boolean isLike) {
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        // Check if user already has a like/dislike for this post
        forumLikeRepository.findByUserIdAndForumPost_PostId(userId, postId)
                .ifPresentOrElse(
                    existingLike -> {
                        if (existingLike.getIsLike().equals(isLike)) {
                            // Remove the like/dislike if it's the same
                            forumLikeRepository.delete(existingLike);
                        } else {
                            // Update the like/dislike if it's different
                            existingLike.setIsLike(isLike);
                            forumLikeRepository.save(existingLike);
                        }
                    },
                    () -> {
                        // Create new like/dislike
                        ForumLike newLike = ForumLike.builder()
                                .userId(userId)
                                .isLike(isLike)
                                .forumPost(post)
                                .build();
                        forumLikeRepository.save(newLike);
                    }
                );

        // Update like/dislike counts
        updatePostLikeCounts(postId);
        
        // Send notification to post author if it's not their own like/dislike
        if (!post.getAuthorId().equals(userId)) {
            sendLikeNotification(post, userId, isLike);
        }
    }

    // Get comments for a post
    public List<ForumCommentResponse> getPostComments(Long postId) {
        List<ForumComment> comments = forumCommentRepository.findByForumPost_PostIdOrderByCreatedAtAsc(postId);
        return comments.stream()
                .map(this::convertToCommentResponse)
                .collect(Collectors.toList());
    }

    // Helper method to validate post permissions
    private void validatePostPermissions(ForumSection section, UserRole userRole) {
        switch (section) {
            case CUSTOMER_QA:
            case CUSTOMER_EXPERIENCE:
                if (userRole != UserRole.CUSTOMER) {
                    throw new RuntimeException("Only customers can post in this section");
                }
                break;
            case WORKER_TIPS_PROJECTS:
                if (userRole != UserRole.WORKER) {
                    throw new RuntimeException("Only workers can post in this section");
                }
                break;
        }
    }

    // Helper method to update post comment count
    private void updatePostCommentCount(Long postId) {
        Long commentCount = forumCommentRepository.countByPostId(postId);
        forumPostRepository.findById(postId).ifPresent(post -> {
            post.setCommentsCount(commentCount.intValue());
            forumPostRepository.save(post);
        });
    }

    // Helper method to update post like counts
    private void updatePostLikeCounts(Long postId) {
        Long likeCount = forumLikeRepository.countLikesByPostId(postId);
        Long dislikeCount = forumLikeRepository.countDislikesByPostId(postId);
        
        forumPostRepository.findById(postId).ifPresent(post -> {
            post.setLikesCount(likeCount.intValue());
            post.setDislikesCount(dislikeCount.intValue());
            forumPostRepository.save(post);
        });
    }

    // Delete a forum post (only post owner can delete)
    public void deletePost(Long postId, Integer userId) {
        // Get the post
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        
        // Check if the current user is the author of the post
        if (!post.getAuthorId().equals(userId)) {
            throw new RuntimeException("You can only delete your own posts");
        }
        
        // Delete all associated comments first (cascade should handle this, but being explicit)
        forumCommentRepository.deleteByForumPost(post);
        
        // Delete all associated likes/dislikes
        forumLikeRepository.deleteByForumPost(post);
        
        // Delete the post
        forumPostRepository.delete(post);
    }

    // Helper method to send comment notification
    private void sendCommentNotification(ForumPost post, String commenterName, Integer commenterId) {
        try {
            // Get post author details
            User postAuthor = userRepository.findById(post.getAuthorId())
                    .orElse(null);
            
            if (postAuthor != null) {
                String message = String.format("%s commented on your post: \"%s\"", 
                    commenterName, post.getTitle());
                
                if (postAuthor.getRole() == UserRole.CUSTOMER) {
                    Customer customer = customerRepository.findByGmail(postAuthor.getEmail())
                            .orElse(null);
                    if (customer != null) {
                        notificationService.createCustomerNotification(customer, message);
                    }
                } else if (postAuthor.getRole() == UserRole.WORKER) {
                    Worker worker = workerRepository.findByGmail(postAuthor.getEmail())
                            .orElse(null);
                    if (worker != null) {
                        notificationService.createWorkerNotification(worker, message);
                    }
                }
            }
        } catch (Exception e) {
            // Log error but don't fail the main operation
            System.err.println("Failed to send comment notification: " + e.getMessage());
        }
    }

    // Helper method to send like/dislike notification
    private void sendLikeNotification(ForumPost post, Integer likerId, Boolean isLike) {
        try {
            // Get post author details
            User postAuthor = userRepository.findById(post.getAuthorId())
                    .orElse(null);
            
            // Get liker details
            User liker = userRepository.findById(likerId)
                    .orElse(null);
            
            if (postAuthor != null && liker != null) {
                String likerName;
                if (liker.getRole() == UserRole.CUSTOMER) {
                    Customer customer = customerRepository.findByGmail(liker.getEmail())
                            .orElse(null);
                    likerName = customer != null ? customer.getCustomerName() : "Someone";
                } else {
                    Worker worker = workerRepository.findByGmail(liker.getEmail())
                            .orElse(null);
                    likerName = worker != null ? worker.getName() : "Someone";
                }
                
                String action = isLike ? "liked" : "disliked";
                String message = String.format("%s %s your post: \"%s\"", 
                    likerName, action, post.getTitle());
                
                if (postAuthor.getRole() == UserRole.CUSTOMER) {
                    Customer customer = customerRepository.findByGmail(postAuthor.getEmail())
                            .orElse(null);
                    if (customer != null) {
                        notificationService.createCustomerNotification(customer, message);
                    }
                } else if (postAuthor.getRole() == UserRole.WORKER) {
                    Worker worker = workerRepository.findByGmail(postAuthor.getEmail())
                            .orElse(null);
                    if (worker != null) {
                        notificationService.createWorkerNotification(worker, message);
                    }
                }
            }
        } catch (Exception e) {
            // Log error but don't fail the main operation
            System.err.println("Failed to send like notification: " + e.getMessage());
        }
    }

    // Helper method to convert ForumPost to ForumPostResponse
    private ForumPostResponse convertToPostResponse(ForumPost post, Integer currentUserId) {
        List<String> photoUrls = new ArrayList<>();
        if (post.getPhotoUrls() != null) {
            try {
                photoUrls = objectMapper.readValue(post.getPhotoUrls(), new TypeReference<List<String>>() {});
            } catch (JsonProcessingException e) {
                // Log error and continue with empty list
            }
        }

        // Check if current user has liked/disliked this post
        Boolean isLikedByCurrentUser = currentUserId != null ? 
                forumLikeRepository.hasUserLikedPost(currentUserId, post.getPostId()) : false;
        Boolean isDislikedByCurrentUser = currentUserId != null ? 
                forumLikeRepository.hasUserDislikedPost(currentUserId, post.getPostId()) : false;
        Boolean canEdit = currentUserId != null && currentUserId.equals(post.getAuthorId());

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
                .isLikedByCurrentUser(isLikedByCurrentUser)
                .isDislikedByCurrentUser(isDislikedByCurrentUser)
                .canEdit(canEdit)
                .build();
    }

    // Helper method to convert ForumComment to ForumCommentResponse
    private ForumCommentResponse convertToCommentResponse(ForumComment comment) {
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