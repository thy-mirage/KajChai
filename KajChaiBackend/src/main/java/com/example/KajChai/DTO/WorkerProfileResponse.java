package com.example.KajChai.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkerProfileResponse {
    private Integer workerId;
    private String name;
    private String photo;
    private String gmail;
    private String phone;
    private String gender;
    
    // Location data
    private Double latitude;
    private Double longitude;
    private String city;
    private String upazila;
    private String district;
    private String fullAddress;
    
    private String field;
    private Float rating;
    private Float experience;
}
