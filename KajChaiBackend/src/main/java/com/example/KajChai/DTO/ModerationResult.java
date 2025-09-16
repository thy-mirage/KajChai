package com.example.KajChai.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModerationResult {
    private boolean isSpam;
    private boolean isRelevant;
    private double confidenceScore;
    private String reason;
    private String action; // APPROVE, REJECT_SPAM, REJECT_IRRELEVANT
}