package com.example.KajChai.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkerProfileUpdateRequest {
    @NotBlank(message = "Name is required")
    private String name;
    
    private String photo;
    
    @NotBlank(message = "Phone is required")
    private String phone;
    
    @NotBlank(message = "Gender is required")
    private String gender;
    
    @NotBlank(message = "City is required")
    private String city;
    
    @NotBlank(message = "Upazila is required")
    private String upazila;
    
    @NotBlank(message = "District is required")
    private String district;
    
    @NotBlank(message = "Division is required")
    private String division;
    
    @NotBlank(message = "Field is required")
    private String field;
    
    private Float experience;
}
