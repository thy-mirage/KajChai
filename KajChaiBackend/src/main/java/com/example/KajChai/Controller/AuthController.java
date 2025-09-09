package com.example.KajChai.Controller;

import com.example.KajChai.DTO.*;
import com.example.KajChai.Service.AuthService;
import com.example.KajChai.Service.EmailVerificationService;
import com.example.KajChai.Security.JwtUtil;
import com.example.KajChai.DatabaseEntity.User;
import com.example.KajChai.Service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowCredentials = "false")
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService verificationService;
    private final JwtUtil jwtUtil;
    private final UserService userService;

    @PostMapping("/signup/initiate")
    public ResponseEntity<AuthResponse> initiateSignup(@Valid @RequestBody SignupRequest request) {
        AuthResponse response = authService.initiateSignup(request);
        return ResponseEntity.status(response.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @PostMapping("/signup/verify")
    public ResponseEntity<AuthResponse> verifyAndCompleteSignup(
            @Valid @RequestBody SignupRequest request,
            @RequestParam String verificationCode) {
        AuthResponse response = authService.completeSignup(request, verificationCode);
        return ResponseEntity.status(response.isSuccess() ? HttpStatus.CREATED : HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);
        
        if (authResponse.isSuccess()) {
            // Generate JWT token for successful login
            try {
                User user = userService.findByEmail(request.getEmail());
                Map<String, Object> extraClaims = new HashMap<>();
                extraClaims.put("role", user.getRole().name());
                extraClaims.put("userId", user.getUserId());
                
                String token = jwtUtil.generateToken(user, extraClaims);
                
                // Create HTTP-only secure cookie
                Cookie jwtCookie = new Cookie("jwt", token);
                jwtCookie.setHttpOnly(true);
                jwtCookie.setPath("/");
                jwtCookie.setMaxAge(30 * 60); // 30 minutes
                // jwtCookie.setSecure(true); // Enable for HTTPS
                
                response.addCookie(jwtCookie);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(AuthResponse.builder()
                                .success(false)
                                .message("Login successful but token generation failed")
                                .build());
            }
        }
        
        return ResponseEntity.status(authResponse.isSuccess() ? HttpStatus.OK : HttpStatus.UNAUTHORIZED)
                .body(authResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout(HttpServletResponse response) {
        // Clear the JWT cookie
        Cookie jwtCookie = new Cookie("jwt", null);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(0);
        
        response.addCookie(jwtCookie);
        
        return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("Logged out successfully")
                .build());
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<AuthResponse> resendVerificationCode(@RequestParam String email) {
        try {
            verificationService.sendVerificationCode(email);
            return ResponseEntity.ok(AuthResponse.builder()
                    .success(true)
                    .message("Verification code sent successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(AuthResponse.builder()
                            .success(false)
                            .message("Failed to send verification code: " + e.getMessage())
                            .build());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(AuthResponse.builder()
                                .success(false)
                                .message("Not authenticated")
                                .build());
            }
            
            User user = (User) authentication.getPrincipal();
            
            return ResponseEntity.ok(AuthResponse.builder()
                    .success(true)
                    .message("User information retrieved successfully")
                    .email(user.getEmail())
                    .role(user.getRole())
                    .build());
                    
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(AuthResponse.builder()
                            .success(false)
                            .message("Failed to get user information: " + e.getMessage())
                            .build());
        }
    }
}
