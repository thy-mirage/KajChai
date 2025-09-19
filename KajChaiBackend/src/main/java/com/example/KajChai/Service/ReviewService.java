package com.example.KajChai.Service;

import com.example.KajChai.CloudinaryConfiguration.CloudinaryService;
import com.example.KajChai.DatabaseEntity.Customer;
import com.example.KajChai.DatabaseEntity.Review;
import com.example.KajChai.DatabaseEntity.Worker;
import com.example.KajChai.DTO.ReviewRequestDTO;
import com.example.KajChai.DTO.ReviewResponseDTO;
import com.example.KajChai.DTO.WorkerSummaryDTO;
import com.example.KajChai.Enum.JobField;
import com.example.KajChai.Repository.CustomerRepository;
import com.example.KajChai.Repository.ReviewRepository;
import com.example.KajChai.Repository.WorkerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {
    
    private final ReviewRepository reviewRepository;
    private final WorkerRepository workerRepository;
    private final CustomerRepository customerRepository;
    private final CloudinaryService cloudinaryService;
    private final NotificationService notificationService;
    
    public List<String> getAllFields() {
        return Arrays.stream(JobField.values()).map(JobField::name).toList();
    }
    
    public List<WorkerSummaryDTO> getWorkersByField(String field) {
        List<Worker> workers = workerRepository.findByFieldIgnoreCase(field);
        return workers.stream()
                .map(this::convertToWorkerSummaryDTO)
                .collect(Collectors.toList());
    }
    
    public List<WorkerSummaryDTO> getWorkersByName(String name) {
        List<Worker> workers = workerRepository.findByNameContainingIgnoreCase(name);
        return workers.stream()
                .map(this::convertToWorkerSummaryDTO)
                .collect(Collectors.toList());
    }
    
    public List<WorkerSummaryDTO> getCompletedWorkers(Integer customerId) {
        List<Worker> workers = workerRepository.findWorkersByCompletedTasksForCustomer(customerId);
        return workers.stream()
                .map(this::convertToWorkerSummaryDTO)
                .collect(Collectors.toList());
    }
    
    public List<ReviewResponseDTO> getWorkerReviews(Integer workerId) {
        Optional<Worker> workerOpt = workerRepository.findById(workerId);
        if (workerOpt.isPresent()) {
            List<Review> reviews = reviewRepository.findReviewsByWorkerOrderByTime(workerOpt.get());
            return reviews.stream()
                    .map(this::convertToReviewResponseDTO)
                    .collect(Collectors.toList());
        }
        return List.of();
    }
    
    public ReviewResponseDTO submitReview(Integer customerId, ReviewRequestDTO reviewRequest, List<MultipartFile> images) {
        try {
            // Find customer and worker
            Optional<Customer> customerOpt = customerRepository.findById(customerId);
            Optional<Worker> workerOpt = workerRepository.findById(reviewRequest.getWorkerId());
            
            if (customerOpt.isEmpty() || workerOpt.isEmpty()) {
                throw new RuntimeException("Customer or Worker not found");
            }
            
            Customer customer = customerOpt.get();
            Worker worker = workerOpt.get();
            
            // Upload images to Cloudinary
            List<String> imageUrls = List.of();
            if (images != null && !images.isEmpty()) {
                try {
                    imageUrls = cloudinaryService.uploadMultipleFiles(images);
                    System.out.println("Successfully uploaded " + imageUrls.size() + " images to Cloudinary");
                } catch (Exception e) {
                    // Log the error but continue without images
                    System.err.println("Failed to upload images to Cloudinary: " + e.getMessage());
                    System.out.println("Continuing review submission without images...");
                    // Keep imageUrls as empty list
                }
            }
            
            // Create review
            Review review = Review.builder()
                    .message(reviewRequest.getMessage())
                    .rating(reviewRequest.getStars())
                    .customer(customer)
                    .worker(worker)
                    .images(imageUrls)
                    .build();
            
            Review savedReview = reviewRepository.save(review);
            
            // Update worker's average rating
            updateWorkerRating(worker);
            
            // Send notification to worker about new review
            String notificationMessage = String.format(
                "You received a new %d-star review from %s: \"%s\"",
                reviewRequest.getStars(),
                customer.getCustomerName(),
                reviewRequest.getMessage().length() > 50 
                    ? reviewRequest.getMessage().substring(0, 50) + "..." 
                    : reviewRequest.getMessage()
            );
            notificationService.createWorkerNotification(worker, notificationMessage);
            
            return convertToReviewResponseDTO(savedReview);
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to submit review: " + e.getMessage());
        }
    }
    
    public boolean canCustomerReviewWorker(Integer customerId, Integer workerId) {
        // Check if customer has had completed tasks with this worker
        List<Worker> completedWorkers = workerRepository.findWorkersByCompletedTasksForCustomer(customerId);
        return completedWorkers.stream().anyMatch(w -> w.getWorkerId().equals(workerId));
    }
    
    public Integer getCustomerGivenReviewsCount(Integer customerId) {
        try {
            Optional<Customer> customerOpt = customerRepository.findById(customerId);
            if (customerOpt.isPresent()) {
                Customer customer = customerOpt.get();
                Long count = reviewRepository.countReviewsByCustomer(customer);
                return count.intValue();
            }
            return 0;
        } catch (Exception e) {
            System.err.println("Error getting customer reviews count: " + e.getMessage());
            return 0;
        }
    }
    
    private void updateWorkerRating(Worker worker) {
        Double avgRating = reviewRepository.findAverageRatingByWorker(worker);
        if (avgRating != null) {
            worker.setRating(avgRating.floatValue());
            workerRepository.save(worker);
        }
    }
    
    private WorkerSummaryDTO convertToWorkerSummaryDTO(Worker worker) {
        Long totalReviews = reviewRepository.countReviewsByWorker(worker);
        
        return WorkerSummaryDTO.builder()
                .workerId(worker.getWorkerId())
                .firstName(getFirstName(worker.getName()))
                .lastName(getLastName(worker.getName()))
                .name(worker.getName())
                .photo(worker.getPhoto())
                .field(worker.getField())
                .rating(worker.getRating())
                .totalReviews(totalReviews)
                .phoneNumber(worker.getPhone())
                .phone(worker.getPhone())
                .district(worker.getDistrict())
                .upazila(worker.getUpazila())
                .city(worker.getCity())
                .experience(worker.getExperience())
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
                .worker(ReviewResponseDTO.WorkerInfo.builder()
                        .workerId(review.getWorker().getWorkerId())
                        .name(review.getWorker().getName())
                        .photo(review.getWorker().getPhoto())
                        .field(review.getWorker().getField())
                        .rating(review.getWorker().getRating())
                        .phone(review.getWorker().getPhone())
                        .district(review.getWorker().getDistrict())
                        .upazila(review.getWorker().getUpazila())
                        .city(review.getWorker().getCity())
                        .experience(review.getWorker().getExperience())
                        .build())
                .build();
    }
    
    private String getFirstName(String fullName) {
        String[] parts = fullName.split(" ");
        return parts.length > 0 ? parts[0] : fullName;
    }
    
    private String getLastName(String fullName) {
        String[] parts = fullName.split(" ");
        return parts.length > 1 ? parts[parts.length - 1] : "";
    }
    
    public Integer getCustomerIdFromAuthentication(org.springframework.security.core.Authentication authentication) {
        String email = authentication.getName();
        Optional<Customer> customerOpt = customerRepository.findByGmail(email);
        if (customerOpt.isPresent()) {
            return customerOpt.get().getCustomerId();
        }
        throw new RuntimeException("Customer not found for email: " + email);
    }
}
