package com.example.KajChai.Controller;

import com.example.KajChai.DTO.ReviewRequestDTO;
import com.example.KajChai.DTO.ReviewResponseDTO;
import com.example.KajChai.DTO.WorkerSummaryDTO;
import com.example.KajChai.Service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/review")
@RequiredArgsConstructor
@CrossOrigin(origins = {
    "http://localhost:5173", 
    "http://localhost:5174", 
    "https://kaj-chai.vercel.app",
    "https://*.vercel.app"
}, allowCredentials = "true")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/fields")
    public ResponseEntity<Map<String, Object>> getAllFields() {
        List<String> fields = reviewService.getAllFields();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", fields);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/workers/by-field")
    public ResponseEntity<Map<String, Object>> getWorkersByField(@RequestParam String field) {
        try {
            List<WorkerSummaryDTO> workers = reviewService.getWorkersByField(field);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", workers);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to fetch workers: " + e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/workers/by-name")
    public ResponseEntity<Map<String, Object>> getWorkersByName(@RequestParam String name) {
        try {
            List<WorkerSummaryDTO> workers = reviewService.getWorkersByName(name);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", workers);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to fetch workers: " + e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/workers/completed")
    public ResponseEntity<Map<String, Object>> getCompletedWorkers(Authentication authentication) {
        try {
            // Get customer ID from the authenticated user
            Integer customerId = reviewService.getCustomerIdFromAuthentication(authentication);
            List<WorkerSummaryDTO> workers = reviewService.getCompletedWorkers(customerId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", workers);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to fetch completed workers: " + e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/worker/{workerId}")
    public ResponseEntity<Map<String, Object>> getWorkerReviews(@PathVariable Integer workerId) {
        try {
            List<ReviewResponseDTO> reviews = reviewService.getWorkerReviews(workerId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", reviews);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to fetch reviews: " + e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitReview(
            Authentication authentication,
            @RequestParam("workerId") Integer workerId,
            @RequestParam("message") String message,
            @RequestParam("stars") Integer stars,
            @RequestParam(value = "images", required = false) List<MultipartFile> images) {
        try {
            System.out.println("=== Review Submission Debug ===");
            System.out.println("Authentication: " + (authentication != null ? authentication.getName() : "null"));
            System.out.println("WorkerId: " + workerId);
            System.out.println("Message: " + message);
            System.out.println("Stars: " + stars);
            System.out.println("Images count: " + (images != null ? images.size() : 0));
            
            Integer customerId = reviewService.getCustomerIdFromAuthentication(authentication);
            System.out.println("Customer ID resolved: " + customerId);

            ReviewRequestDTO reviewRequest = ReviewRequestDTO.builder()
                    .workerId(workerId)
                    .message(message)
                    .stars(stars)
                    .build();

            ReviewResponseDTO review = reviewService.submitReview(customerId, reviewRequest, images);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", review);
            response.put("message", "Review submitted successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Review submission error: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to submit review: " + e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/can-review/{workerId}")
    public ResponseEntity<Map<String, Object>> canReviewWorker(
            Authentication authentication,
            @PathVariable Integer workerId) {
        try {
            Integer customerId = reviewService.getCustomerIdFromAuthentication(authentication);
            boolean canReview = reviewService.canCustomerReviewWorker(customerId, workerId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", canReview);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to check review permission: " + e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/customer/given-reviews-count")
    public ResponseEntity<Integer> getCustomerGivenReviewsCount(Authentication authentication) {
        try {
            Integer customerId = reviewService.getCustomerIdFromAuthentication(authentication);
            Integer reviewsCount = reviewService.getCustomerGivenReviewsCount(customerId);
            return ResponseEntity.ok(reviewsCount);
        } catch (Exception e) {
            System.err.println("Error fetching customer reviews count: " + e.getMessage());
            return ResponseEntity.ok(0); // Return 0 if there's an error
        }
    }
}
