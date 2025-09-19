package com.example.KajChai.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkerDashboardStatsResponse {
    private Long jobsCompleted;
    private Float currentRating;
    private Double totalEarned;
    private Long activeJobs;
}