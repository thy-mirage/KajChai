package com.example.KajChai.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class QuestionSearchRequest {
    private String query;
    
    @Builder.Default
    private int limit = 10; // Maximum number of suggestions to return
}