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
    private Float payment;
    private java.time.LocalDate deadline;
}
