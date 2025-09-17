package com.example.KajChai.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkerSearchResult {
    private Integer workerId;
    private String name;
    private String field;
    private Float rating;
    private Float experience;
    private String upazila;
    private String district;
    private String photo;
}