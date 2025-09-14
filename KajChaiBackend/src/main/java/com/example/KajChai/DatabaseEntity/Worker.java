package com.example.KajChai.DatabaseEntity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@Table(name = "Worker")
public class Worker {
    @Id
    @GeneratedValue
    private Integer workerId;

    @Column(nullable = false)
    private String name;

    private String photo;

    @Column(nullable = false)
    private String gmail;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String gender;

    // Precise location coordinates
    private Double latitude;

    private Double longitude;

    // Address components extracted from coordinates
    private String city;

    private String upazila; // Can be upazila or ward or city corporation

    private String district;

    // Full formatted address for display
    private String fullAddress;

    @Column(nullable = false)
    private String field;

    private float rating;

    @Column(nullable = false)
    private float experience;
}
