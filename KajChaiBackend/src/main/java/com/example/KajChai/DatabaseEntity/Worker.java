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

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String upazila;

    @Column(nullable = false)
    private String district;

    @Column(nullable = false)
    private String division;

    @Column(nullable = false)
    private String field;

    private float rating;

    @Column(nullable = false)
    private float experience;
}
