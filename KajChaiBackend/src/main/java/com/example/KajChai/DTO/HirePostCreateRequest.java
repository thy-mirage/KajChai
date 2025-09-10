package com.example.KajChai.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HirePostCreateRequest {
    
    @NotBlank(message = "Description is required")
    private String description;
    
    @NotBlank(message = "Field is required")
    private String field;
    
    @NotNull(message = "Estimated payment is required")
    @Positive(message = "Estimated payment must be positive")
    private Float estimatedPayment;
    
    private LocalDate deadline;
    
    private List<String> images;
}
