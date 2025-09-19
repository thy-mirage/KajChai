package com.example.KajChai.Service;

import com.example.KajChai.DTO.*;
import com.example.KajChai.DatabaseEntity.*;
import com.example.KajChai.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkerDashboardService {
    
    private final WorkerRepository workerRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    
    public WorkerDashboardStatsResponse getWorkerDashboardStats(Integer workerId) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));
        
        // Get jobs completed count
        Long jobsCompleted = bookingRepository.countCompletedJobsByWorkerId(workerId);
        
        // Get current rating from worker table
        Float currentRating = worker.getRating();
        
        // Get total earned
        Double totalEarned = bookingRepository.getTotalEarningsByWorkerId(workerId);
        
        // Get active jobs count (booked but not completed)
        Long activeJobs = bookingRepository.countActiveJobsByWorkerId(workerId);
        
        return WorkerDashboardStatsResponse.builder()
                .jobsCompleted(jobsCompleted != null ? jobsCompleted : 0L)
                .currentRating(currentRating != null ? currentRating : 0.0f)
                .totalEarned(totalEarned != null ? totalEarned : 0.0)
                .activeJobs(activeJobs != null ? activeJobs : 0L)
                .build();
    }
    
    public List<HirePostResponse> getCurrentWorks(Integer workerId) {
        List<Booking> currentBookings = bookingRepository.findCurrentWorksByWorkerId(workerId);
        
        return currentBookings.stream()
                .map(booking -> convertToHirePostResponse(booking.getHirePost()))
                .collect(Collectors.toList());
    }
    
    public List<ReviewResponseDTO> getWorkerReviews(Integer workerId) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));
        
        List<Review> reviews = reviewRepository.findReviewsByWorkerOrderByTime(worker);
        
        return reviews.stream()
                .map(this::convertToReviewResponseDTO)
                .collect(Collectors.toList());
    }
    
    public List<HirePostResponse> getPastJobs(Integer workerId) {
        List<Booking> pastBookings = bookingRepository.findPastJobsByWorkerId(workerId);
        
        return pastBookings.stream()
                .map(booking -> convertToHirePostResponse(booking.getHirePost()))
                .collect(Collectors.toList());
    }
    
    private HirePostResponse convertToHirePostResponse(HirePost post) {
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
                .build();
    }
    
    private ReviewResponseDTO convertToReviewResponseDTO(Review review) {
        return ReviewResponseDTO.builder()
                .reviewId(review.getReviewId())
                .message(review.getMessage())
                .stars(review.getRating())
                .images(review.getImages())
                .reviewTime(review.getReviewTime())
                .customer(ReviewResponseDTO.CustomerInfo.builder()
                        .customerId(review.getCustomer().getCustomerId())
                        .customerName(review.getCustomer().getCustomerName())
                        .photo(review.getCustomer().getPhoto())
                        .build())
                .build();
    }
}