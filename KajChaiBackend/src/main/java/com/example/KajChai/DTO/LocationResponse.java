package com.example.KajChai.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationResponse {
    private Double latitude;
    private Double longitude;
    private String city;
    private String upazila;
    private String district;
    private String fullAddress;
    private Double distanceFromUser; // For nearby results
}