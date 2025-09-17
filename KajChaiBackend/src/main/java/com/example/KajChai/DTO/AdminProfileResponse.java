package com.example.KajChai.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminProfileResponse {
    private Integer adminId;
    private String name;
    private String email;
    private String photo;
    private LocalDateTime createdAt;
    private Boolean isActive;
}