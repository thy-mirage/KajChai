package com.example.KajChai.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserListResponse {
    private Integer userId;
    private String name;
    private String email;
    private String photo;
    private String role;
    private String field; // Only for workers
    private Float rating; // Only for workers
}
