package com.example.KajChai.DTO;

import com.example.KajChai.Enum.ComplaintStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserComplaintResponse {
    
    private Integer complaintId;
    private String reportedWorkerName;
    private Integer reportedWorkerId;
    private String reportedByCustomerName;
    private Integer reportedByCustomerId;
    private String reason;
    private String description;
    private String evidenceUrls;
    private ComplaintStatus status;
    private String adminResponse;
    private String adminAction;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime clarificationDeadline;
    private String clarificationResponse;
}