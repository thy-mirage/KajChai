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
@Table(name = "Customer", uniqueConstraints = @UniqueConstraint(columnNames = "gmail"))
public class Customer {
    @Id
    @GeneratedValue
    private Integer customerId;

    @Column(nullable = false)
    private String customerName;

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
}
