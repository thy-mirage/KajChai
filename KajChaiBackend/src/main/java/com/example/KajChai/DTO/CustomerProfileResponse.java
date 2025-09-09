package com.example.KajChai.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerProfileResponse {
    private Integer customerId;
    private String customerName;
    private String photo;
    private String gmail;
    private String phone;
    private String gender;
    private String city;
    private String upazila;
    private String district;
    private String division;
}
