package com.example.KajChai.DTO;

import com.example.KajChai.Enum.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String message;
    private String email;
    private UserRole role;
    private boolean success;
    private String token; // JWT token for client-side storage
    private Integer userId; // User ID for frontend
    private String name; // User name
    private String photo; // User photo URL
}
