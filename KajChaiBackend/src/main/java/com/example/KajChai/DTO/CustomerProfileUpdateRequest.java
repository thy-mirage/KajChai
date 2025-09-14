package com.example.KajChai.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerProfileUpdateRequest {
    @NotBlank(message = "Name is required")
    private String customerName;
    
    private String photo;
    
    @NotBlank(message = "Phone is required")
    private String phone;
    
    @NotBlank(message = "Gender is required")
    private String gender;
    
    // Location coordinates (required)
    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;
    
    @NotBlank(message = "City is required")
    private String city;
    
    @NotBlank(message = "Upazila is required")
    private String upazila;
    
    @NotBlank(message = "District is required")
    private String district;
    
    // Full address for display
    private String fullAddress;
}
