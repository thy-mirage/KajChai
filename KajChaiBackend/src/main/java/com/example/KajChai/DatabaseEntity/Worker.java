package com.example.KajChai.DatabaseEntity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@Table(name = "Worker")
public class Worker {
    @Id
    @Column(name = "worker_id")@GeneratedValue(strategy = GenerationType.IDENTITY)
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
    @Column(name = "full_address")
    private String fullAddress;

    @Column(nullable = false)
    private String field;

    private float rating;

    @Column(nullable = false)
    private float experience;

    // Account status fields for user management
    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @Builder.Default
    @Column(name = "is_banned")
    private Boolean isBanned = false;

    @Builder.Default
    @Column(name = "is_restricted")
    private Boolean isRestricted = false;

    @Column(name = "restriction_reason", columnDefinition = "TEXT")
    private String restrictionReason;

    @Column(name = "banned_at")
    private LocalDateTime bannedAt;

    @Column(name = "restricted_at")
    private LocalDateTime restrictedAt;

    // Helper methods to get names
    public String getFirstName() {
        if (name != null && name.contains(" ")) {
            return name.substring(0, name.indexOf(" "));
        }
        return name;
    }

    public String getLastName() {
        if (name != null && name.contains(" ")) {
            return name.substring(name.indexOf(" ") + 1);
        }
        return "";
    }
}
