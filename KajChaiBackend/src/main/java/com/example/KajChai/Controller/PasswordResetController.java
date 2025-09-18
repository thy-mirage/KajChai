package com.example.KajChai.Controller;

import com.example.KajChai.DTO.AuthResponse;
import com.example.KajChai.DTO.ForgotPasswordRequest;
import com.example.KajChai.DTO.ResetPasswordRequest;
import com.example.KajChai.Service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = {
    "http://localhost:5173", 
    "http://localhost:5174", 
    "https://kaj-chai.vercel.app",
    "https://*.vercel.app"
}, allowCredentials = "true")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @PostMapping("/forgot-password")
    public ResponseEntity<AuthResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            log.info("Forgot password request for email: {}", request.getEmail());

            boolean success = passwordResetService.initiatePasswordReset(request.getEmail());

            if (success) {
                return ResponseEntity.ok(AuthResponse.builder()
                        .success(true)
                        .message("If an account with this email exists, a reset code has been sent to your email")
                        .email(request.getEmail())
                        .build());
            } else {
                return ResponseEntity.badRequest().body(AuthResponse.builder()
                        .success(false)
                        .message("Failed to send reset code. Please try again later.")
                        .build());
            }

        } catch (Exception e) {
            log.error("Error processing forgot password request", e);
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .success(false)
                    .message("An error occurred while processing your request")
                    .build());
        }
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<AuthResponse> verifyResetCode(@RequestBody ResetPasswordRequest request) {
        try {
            log.info("Verifying reset code for email: {}", request.getEmail());

            boolean isValid = passwordResetService.verifyResetCode(request.getEmail(), request.getResetCode());

            if (isValid) {
                return ResponseEntity.ok(AuthResponse.builder()
                        .success(true)
                        .message("Reset code verified successfully")
                        .email(request.getEmail())
                        .build());
            } else {
                return ResponseEntity.badRequest().body(AuthResponse.builder()
                        .success(false)
                        .message("Invalid or expired reset code")
                        .build());
            }

        } catch (Exception e) {
            log.error("Error verifying reset code", e);
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .success(false)
                    .message("An error occurred while verifying the code")
                    .build());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<AuthResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            log.info("Password reset request for email: {}", request.getEmail());

            // Validate password confirmation
            if (!request.isPasswordMatching()) {
                return ResponseEntity.badRequest().body(AuthResponse.builder()
                        .success(false)
                        .message("Passwords do not match")
                        .build());
            }

            boolean success = passwordResetService.resetPassword(
                    request.getEmail(),
                    request.getResetCode(),
                    request.getNewPassword()
            );

            if (success) {
                return ResponseEntity.ok(AuthResponse.builder()
                        .success(true)
                        .message("Password reset successfully. You can now login with your new password.")
                        .email(request.getEmail())
                        .build());
            } else {
                return ResponseEntity.badRequest().body(AuthResponse.builder()
                        .success(false)
                        .message("Invalid or expired reset code")
                        .build());
            }

        } catch (Exception e) {
            log.error("Error resetting password", e);
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .success(false)
                    .message("An error occurred while resetting password")
                    .build());
        }
    }
}
