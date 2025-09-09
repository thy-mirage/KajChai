package com.example.KajChai.DTO;

import com.example.KajChai.Enum.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {
    private boolean success;
    private String message;
    private UserRole role;
    private Object data;
}
