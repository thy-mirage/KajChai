package com.example.KajChai.DTO;

import com.example.KajChai.Enum.HirePostStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HirePostResponse {
    
    private Integer postId;
    private String description;
    private String field;
    private Float estimatedPayment;
    private LocalDate deadline;
    private HirePostStatus status;
    private List<String> images;
    private LocalDateTime postTime;
    
    // Customer information
    private Integer customerId;
    private String customerName;
    private String customerPhoto;
    private String customerCity;
    private String customerDistrict;
    private String customerUpazila;
    private String customerPhone;
    private Double customerLatitude;
    private Double customerLongitude;
    
    // Additional fields for listing view
    private Integer applicationsCount;
}
