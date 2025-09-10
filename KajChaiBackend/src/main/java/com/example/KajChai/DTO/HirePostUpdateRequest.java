package com.example.KajChai.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HirePostUpdateRequest {
    
    private String description;
    private Float estimatedPayment;
    private java.time.LocalDate deadline;
}
