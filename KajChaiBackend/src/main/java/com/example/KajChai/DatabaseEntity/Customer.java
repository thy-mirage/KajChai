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
    @Column(name = "customer_id")@GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer customerId;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

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
    @Column(name = "full_address")
    private String fullAddress;

    // Helper methods to get names
    public String getFirstName() {
        if (customerName != null && customerName.contains(" ")) {
            return customerName.substring(0, customerName.indexOf(" "));
        }
        return customerName;
    }

    public String getLastName() {
        if (customerName != null && customerName.contains(" ")) {
            return customerName.substring(customerName.indexOf(" ") + 1);
        }
        return "";
    }
}
