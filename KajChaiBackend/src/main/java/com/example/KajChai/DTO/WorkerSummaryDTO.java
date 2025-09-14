package com.example.KajChai.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkerSummaryDTO {
    private Integer workerId;
    private String firstName;
    private String lastName;
    private String name;
    private String photo;
    private String field;
    private Float rating;
    private Long totalReviews;
    private String phoneNumber;
    private String phone;
    private String district;
    private String upazila;
    private String city;
    private Float experience;
}
