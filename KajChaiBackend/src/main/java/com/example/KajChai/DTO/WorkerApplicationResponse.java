package com.example.KajChai.DTO;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkerApplicationResponse {
    
    private Integer applicationId;
    private LocalDateTime applicationTime;
    
    // Worker information
    private Integer workerId;
    private String workerName;
    private String workerPhoto;
    private String workerPhone;
    private String workerCity;
    private String workerUpazila;
    private String workerDistrict;
    private String workerField;
    private Float workerRating;
    private Float workerExperience;
    
    // Additional calculated fields
    private Integer totalReviews;
    private Double averageRating;
    private Boolean isSelected;
}
