package com.example.KajChai.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserComplaintRequest {
    
    private Integer reportedWorkerId;
    private Integer reportedByCustomerId;
    private String reason;
    private String description;
    private String evidenceUrls; // JSON string array
}