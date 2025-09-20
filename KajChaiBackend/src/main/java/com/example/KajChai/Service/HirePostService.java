package com.example.KajChai.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.KajChai.DTO.HirePostCreateRequest;
import com.example.KajChai.DTO.HirePostResponse;
import com.example.KajChai.DTO.HirePostUpdateRequest;
import com.example.KajChai.DTO.WorkerApplicationResponse;
import com.example.KajChai.DatabaseEntity.Booking;
import com.example.KajChai.DatabaseEntity.Customer;
import com.example.KajChai.DatabaseEntity.HirePost;
import com.example.KajChai.DatabaseEntity.PostApplicationMapping;
import com.example.KajChai.DatabaseEntity.Worker;
import com.example.KajChai.Enum.HirePostStatus;
import com.example.KajChai.Repository.BookingRepository;
import com.example.KajChai.Repository.CustomerRepository;
import com.example.KajChai.Repository.HirePostRepository;
import com.example.KajChai.Repository.PostApplicationMappingRepository;
import com.example.KajChai.Repository.ReviewRepository;
import com.example.KajChai.Repository.WorkerRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class HirePostService {
    
    private final HirePostRepository hirePostRepository;
    private final PostApplicationMappingRepository applicationRepository;
    private final NotificationService notificationService;
    private final ReviewRepository reviewRepository;
    private final CustomerRepository customerRepository;
    private final WorkerRepository workerRepository;
    private final BookingRepository bookingRepository;
    
    @Transactional
    public HirePostResponse createHirePost(HirePostCreateRequest request, Integer customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        
        HirePost hirePost = HirePost.builder()
                .description(request.getDescription())
                .field(request.getField())
                .payment(null)
                .deadline(request.getDeadline())
                .status(HirePostStatus.AVAILABLE)
                .images(request.getImages() != null ? request.getImages() : new ArrayList<>())
                .customer(customer)
                .build();
        
        HirePost savedPost = hirePostRepository.save(hirePost);
        return convertToResponse(savedPost);
    }
    
    public List<HirePostResponse> getHirePostsByCustomer(Integer customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        
        List<HirePost> posts = hirePostRepository.findByCustomerOrderByPostTimeDesc(customer);
        return posts.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    public List<HirePostResponse> getAvailableHirePostsByField(String field) {
        List<HirePost> posts = hirePostRepository.findAvailablePostsByField(field);
        return posts.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    public List<HirePostResponse> getAllAvailableHirePosts() {
        List<HirePost> posts = hirePostRepository.findAllAvailablePosts();
        return posts.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    public HirePostResponse getHirePostById(Integer postId) {
        HirePost post = hirePostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Hire post not found"));
        return convertToResponse(post);
    }
    
    @Transactional
    public HirePostResponse updateHirePost(Integer postId, HirePostUpdateRequest request, Integer customerId) {
        HirePost post = hirePostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Hire post not found"));
        
        // Verify that the post belongs to the customer
        if (!post.getCustomer().getCustomerId().equals(customerId)) {
            throw new RuntimeException("Unauthorized to update this post");
        }
        
        // Only allow updates if post is still available
        if (post.getStatus() != HirePostStatus.AVAILABLE) {
            throw new RuntimeException("Cannot update post that is not available");
        }
        
        if (request.getDescription() != null) {
            post.setDescription(request.getDescription());
        }
        if (request.getPayment() != null) {
            post.setPayment(request.getPayment());
        }
        if (request.getDeadline() != null) {
            post.setDeadline(request.getDeadline());
        }
        
        HirePost updatedPost = hirePostRepository.save(post);
        return convertToResponse(updatedPost);
    }
    
    @Transactional
    public void deleteHirePost(Integer postId, Integer customerId) {
        HirePost post = hirePostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Hire post not found"));
        
        // Verify that the post belongs to the customer
        if (!post.getCustomer().getCustomerId().equals(customerId)) {
            throw new RuntimeException("Unauthorized to delete this post");
        }
        
        // Only allow deletion if post is still available
        if (post.getStatus() != HirePostStatus.AVAILABLE) {
            throw new RuntimeException("Cannot delete post that is not available");
        }
        
        hirePostRepository.delete(post);
    }
    
    @Transactional
    public void applyToHirePost(Integer postId, Integer workerId) {
        HirePost post = hirePostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Hire post not found"));
        
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));
        
        log.info("HirePost Application - Checking restrictions for worker {}: isBanned={}, isRestricted={}, restrictedAt={}", 
                worker.getWorkerId(), worker.getIsBanned(), worker.getIsRestricted(), worker.getRestrictedAt());
        
        // Check if worker is banned
        if (Boolean.TRUE.equals(worker.getIsBanned())) {
            log.warn("Worker {} is banned, denying hire post application", worker.getWorkerId());
            throw new RuntimeException("Your account has been banned. You cannot apply to hire posts.");
        }
        
        // Check if worker is currently restricted
        if (Boolean.TRUE.equals(worker.getIsRestricted())) {
            log.info("Worker {} is restricted, checking expiry for hire post application", worker.getWorkerId());
            // Check if restriction has expired (3 days)
            if (worker.getRestrictedAt() != null) {
                LocalDateTime restrictionExpiry = worker.getRestrictedAt().plusDays(3);
                LocalDateTime now = LocalDateTime.now();
                
                log.info("HirePost Application restriction expiry check: now={}, expiry={}, isExpired={}", 
                        now, restrictionExpiry, now.isAfter(restrictionExpiry));
                
                if (now.isAfter(restrictionExpiry)) {
                    // Auto-lift expired restriction
                    log.info("Auto-lifting expired restriction for worker {} in hire post application", worker.getWorkerId());
                    worker.setIsRestricted(false);
                    worker.setRestrictedAt(null);
                    worker.setRestrictionReason(null);
                    workerRepository.save(worker);
                } else {
                    // Still under restriction
                    String expiryDate = restrictionExpiry.toLocalDate().toString();
                    log.warn("Worker {} is still under restriction until {}, denying hire post application", worker.getWorkerId(), expiryDate);
                    throw new RuntimeException("Your account is restricted from applying to hire posts until " + expiryDate + 
                        ". Reason: " + (worker.getRestrictionReason() != null ? worker.getRestrictionReason() : "Policy violation"));
                }
            } else {
                log.warn("Worker {} has restriction flag but no restrictedAt date, denying hire post application", worker.getWorkerId());
                throw new RuntimeException("Your account is restricted from applying to hire posts. Please contact support.");
            }
        }
        
        // Check if post is available
        if (post.getStatus() != HirePostStatus.AVAILABLE) {
            throw new RuntimeException("This post is no longer available for applications");
        }
        
        // Check if worker's field matches the post field
        if (!worker.getField().equals(post.getField())) {
            throw new RuntimeException("Worker field does not match the post requirements");
        }
        
        // Check if worker has already applied
        if (applicationRepository.existsByWorkerAndHirePost(worker, post)) {
            throw new RuntimeException("Worker has already applied to this post");
        }
        
        // Create application
        PostApplicationMapping application = PostApplicationMapping.builder()
                .worker(worker)
                .hirePost(post)
                .build();
        
        applicationRepository.save(application);
        
        // Create notification for customer
        String notificationMessage = String.format(
            "%s has applied for your %s job post: \"%s\"",
            worker.getName(),
            post.getField(),
            post.getDescription().length() > 50 ? 
                post.getDescription().substring(0, 50) + "..." : 
                post.getDescription()
        );
        
        notificationService.createCustomerNotification(post.getCustomer(), notificationMessage);
    }
    
    public List<WorkerApplicationResponse> getApplicationsForPost(Integer postId, Integer customerId) {
        HirePost post = hirePostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Hire post not found"));
        
        // Verify that the post belongs to the customer
        if (!post.getCustomer().getCustomerId().equals(customerId)) {
            throw new RuntimeException("Unauthorized to view applications for this post");
        }
        
        // Check if there's a booking for this post (to identify selected worker)
        Optional<Booking> booking = bookingRepository.findByHirePost(post);
        Integer selectedWorkerId = booking.map(b -> b.getWorker().getWorkerId()).orElse(null);
        
        List<PostApplicationMapping> applications = applicationRepository.findByHirePost(post);
        return applications.stream()
                .map(app -> convertToWorkerApplicationResponse(app, selectedWorkerId))
                .collect(Collectors.toList());
    }
    
    @Transactional
    public void selectWorkerForPost(Integer postId, Integer workerId, Integer customerId) {
        HirePost post = hirePostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Hire post not found"));
        
        // Verify that the post belongs to the customer
        if (!post.getCustomer().getCustomerId().equals(customerId)) {
            throw new RuntimeException("Unauthorized to select worker for this post");
        }
        
        // Check if post is available
        if (post.getStatus() != HirePostStatus.AVAILABLE) {
            throw new RuntimeException("This post is no longer available");
        }
        
        Worker selectedWorker = workerRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));
        
        // Verify that the worker has applied to this post
        Optional<PostApplicationMapping> application = applicationRepository.findByWorkerAndHirePost(selectedWorker, post);
        
        if (application.isEmpty()) {
            throw new RuntimeException("Worker has not applied to this post");
        }
        
        // Update post status to BOOKED 
        post.setStatus(HirePostStatus.BOOKED);
        hirePostRepository.save(post);
        
        // Create booking entry
        Booking booking = Booking.builder()
                .hirePost(post)
                .worker(selectedWorker)
                .build();
        bookingRepository.save(booking);
        
        // Get all applicants for this post
        List<PostApplicationMapping> allApplications = applicationRepository.findByHirePost(post);
        
        // Send notifications to all applicants
        for (PostApplicationMapping app : allApplications) {
            Worker applicantWorker = app.getWorker();
            String notificationMessage;
            
            if (applicantWorker.getWorkerId().equals(workerId)) {
                // Selected worker gets acceptance notification
                notificationMessage = String.format(
                    "Congratulations! You have been selected for the job: %s. The customer will contact you soon.",
                    post.getDescription().length() > 50 ? post.getDescription().substring(0, 50) + "..." : post.getDescription()
                );
            } else {
                // Rejected workers get rejection notification
                notificationMessage = String.format(
                    "Thank you for applying to the job: %s. Unfortunately, another worker has been selected for this position.",
                    post.getDescription().length() > 50 ? post.getDescription().substring(0, 50) + "..." : post.getDescription()
                );
            }
            
            // Create notification
            notificationService.createWorkerNotification(applicantWorker, notificationMessage);
        }
    }
    
    @Transactional
    public void markPostAsCompleted(Integer postId, Integer customerId, Float paymentAmount) {
        HirePost post = hirePostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Hire post not found"));
        
        // Verify that the post belongs to the customer
        if (!post.getCustomer().getCustomerId().equals(customerId)) {
            throw new RuntimeException("Unauthorized to complete this post");
        }
        
        // Check if post is booked
        if (post.getStatus() != HirePostStatus.BOOKED) {
            throw new RuntimeException("Only booked posts can be marked as completed");
        }
        
        // Validate payment amount
        if (paymentAmount == null || paymentAmount <= 0) {
            throw new RuntimeException("Payment amount must be positive");
        }
        
        // Update post status to COMPLETED and set payment
        post.setStatus(HirePostStatus.COMPLETED);
        post.setPayment(paymentAmount);
        hirePostRepository.save(post);
    }
    
    private HirePostResponse convertToResponse(HirePost post) {
        Long applicationsCount = applicationRepository.countApplicationsByHirePost(post);
        
        return HirePostResponse.builder()
                .postId(post.getPostId())
                .description(post.getDescription())
                .field(post.getField())
                .payment(post.getPayment())
                .deadline(post.getDeadline())
                .status(post.getStatus())
                .images(post.getImages())
                .postTime(post.getPostTime())
                .customerId(post.getCustomer().getCustomerId())
                .customerName(post.getCustomer().getCustomerName())
                .customerPhoto(post.getCustomer().getPhoto())
                .customerCity(post.getCustomer().getCity())
                .customerDistrict(post.getCustomer().getDistrict())
                .customerUpazila(post.getCustomer().getUpazila())
                .customerPhone(post.getCustomer().getPhone())
                .customerLatitude(post.getCustomer().getLatitude())
                .customerLongitude(post.getCustomer().getLongitude())
                .applicationsCount(applicationsCount.intValue())
                .build();
    }
    
    private WorkerApplicationResponse convertToWorkerApplicationResponse(PostApplicationMapping application, Integer selectedWorkerId) {
        Worker worker = application.getWorker();
        
        // Get additional worker statistics
        Long totalReviews = reviewRepository.countReviewsByWorker(worker);
        Double averageRating = reviewRepository.findAverageRatingByWorker(worker);
        
        // Check if this worker is selected
        boolean isSelected = selectedWorkerId != null && selectedWorkerId.equals(worker.getWorkerId());
    
        return WorkerApplicationResponse.builder()
                .applicationId(application.getApplicationId())
                .applicationTime(application.getApplicationTime())
                .workerId(worker.getWorkerId())
                .workerName(worker.getName())
                .workerPhoto(worker.getPhoto())
                .workerPhone(worker.getPhone())
                .workerCity(worker.getCity())
                .workerUpazila(worker.getUpazila())
                .workerDistrict(worker.getDistrict())
                .workerField(worker.getField())
                .workerRating(worker.getRating())
                .workerExperience(worker.getExperience())
                .totalReviews(totalReviews.intValue())
                .averageRating(averageRating != null ? averageRating : 0.0)
                .isSelected(isSelected)
                .build();
    }

    public boolean hasWorkerAppliedToPost(Integer postId, Integer workerId) {
        HirePost post = hirePostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Hire post not found"));
        
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));
        
        return applicationRepository.existsByWorkerAndHirePost(worker, post);
    }
    
    // Location-based sorting method for hire posts
    public List<HirePostResponse> sortHirePostsByLocationForWorker(List<HirePostResponse> posts, Integer workerId) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));
        
        // If worker doesn't have location coordinates, return unsorted list
        if (worker.getLatitude() == null || worker.getLongitude() == null) {
            return posts;
        }
        
        return posts.stream()
                .sorted((post1, post2) -> {
                    double distance1 = calculateDistance(
                        worker.getLatitude(), worker.getLongitude(),
                        post1.getCustomerLatitude(), post1.getCustomerLongitude()
                    );
                    double distance2 = calculateDistance(
                        worker.getLatitude(), worker.getLongitude(),
                        post2.getCustomerLatitude(), post2.getCustomerLongitude()
                    );
                    return Double.compare(distance1, distance2);
                })
                .collect(Collectors.toList());
    }
    
    // Calculate distance between two coordinates using Haversine formula
    private double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        final int R = 6371; // Radius of the earth in km
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c; // Distance in km
        
        return distance;
    }
    
    // Get count of pending bookings for a customer (hire posts with BOOKED status)
    public Long getPendingBookingsCountForCustomer(Integer customerId) {
        return hirePostRepository.countByCustomerCustomerIdAndStatus(customerId, HirePostStatus.BOOKED);
    }
}
