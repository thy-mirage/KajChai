package com.example.KajChai.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponseDTO {
    private Integer reviewId;
    private String message;
    private Integer stars;
    private List<String> images;
    private LocalDateTime reviewTime;
    private CustomerInfo customer;
    private WorkerInfo worker;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerInfo {
        private Integer customerId;
        private String customerName;
        private String photo;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkerInfo {
        private Integer workerId;
        private String name;
        private String photo;
        private String field;
        private Float rating;
        private String phone;
        private String division;
        private String district;
        private String upazila;
        private String city;
        private Float experience;
    }
}
