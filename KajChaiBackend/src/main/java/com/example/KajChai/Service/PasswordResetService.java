package com.example.KajChai.Service;

import com.example.KajChai.DatabaseEntity.PasswordReset;
import com.example.KajChai.DatabaseEntity.User;
import com.example.KajChai.Repository.PasswordResetRepository;
import com.example.KajChai.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final PasswordResetRepository passwordResetRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public boolean initiatePasswordReset(String email) {
        try {
            // Check if user exists
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                log.warn("Password reset requested for non-existent email: {}", email);
                // Return true for security reasons (don't reveal if email exists)
                return true;
            }

            // Clean up any existing codes for this email (both expired and valid)
            // This prevents accumulation of codes and ensures only one active code per user
            int deletedCount = passwordResetRepository.deleteByEmail(email);
            if (deletedCount > 0) {
                log.info("Deleted {} existing password reset codes for email: {}", deletedCount, email);
            }

            // Generate 6-digit reset code
            String resetCode = generateResetCode();

            // Create new password reset record
            PasswordReset passwordReset = PasswordReset.builder()
                    .email(email)
                    .resetCode(resetCode)
                    .expiresAt(LocalDateTime.now().plusMinutes(15)) // 15-minute expiry
                    .used(false)
                    .build();

            passwordResetRepository.save(passwordReset);

            // Send reset email
            String subject = "Password Reset Code - KajChai";
            String body = String.format(
                "Hello,\n\n" +
                "You have requested to reset your password for your KajChai account.\n\n" +
                "Your password reset code is: %s\n\n" +
                "This code will expire in 15 minutes.\n\n" +
                "If you did not request this password reset, please ignore this email.\n\n" +
                "Best regards,\n" +
                "KajChai Team",
                resetCode
            );

            emailService.sendEmail(email, subject, body);
            log.info("Password reset code sent successfully to: {}", email);
            return true;

        } catch (Exception e) {
            log.error("Failed to initiate password reset for email: {}", email, e);
            return false;
        }
    }

    @Transactional
    public boolean resetPassword(String email, String resetCode, String newPassword) {
        try {
            // Find valid reset record
            Optional<PasswordReset> resetOpt = passwordResetRepository
                    .findByEmailAndResetCodeAndUsedFalse(email, resetCode);

            if (resetOpt.isEmpty()) {
                log.warn("Invalid reset code provided for email: {}", email);
                return false;
            }

            PasswordReset passwordReset = resetOpt.get();

            // Check if code is expired
            if (passwordReset.isExpired()) {
                log.warn("Expired reset code used for email: {}", email);
                return false;
            }

            // Find user
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                log.error("User not found for email during password reset: {}", email);
                return false;
            }

            User user = userOpt.get();

            // Update user password
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            // Clean up ALL password reset codes for this email after successful reset
            // This prevents any other codes from being used
            int deletedCount = passwordResetRepository.deleteByEmail(email);
            log.info("Cleaned up {} password reset codes for email after successful reset: {}", deletedCount, email);

            // Send confirmation email
            String subject = "Password Successfully Reset - KajChai";
            String body = String.format(
                "Hello,\n\n" +
                "Your password has been successfully reset for your KajChai account.\n\n" +
                "If you did not perform this action, please contact our support team immediately.\n\n" +
                "Best regards,\n" +
                "KajChai Team"
            );

            emailService.sendEmail(email, subject, body);
            log.info("Password reset completed successfully for: {}", email);
            return true;

        } catch (Exception e) {
            log.error("Failed to reset password for email: {}", email, e);
            return false;
        }
    }

    public boolean verifyResetCode(String email, String resetCode) {
        Optional<PasswordReset> resetOpt = passwordResetRepository
                .findByEmailAndResetCodeAndUsedFalse(email, resetCode);

        if (resetOpt.isEmpty()) {
            return false;
        }

        PasswordReset passwordReset = resetOpt.get();
        return passwordReset.isValid();
    }

    private String generateResetCode() {
        Random random = new Random();
        return String.format("%06d", random.nextInt(1000000));
    }

    @Transactional
    @Scheduled(fixedRate = 1800000) // Run every 30 minutes
    public void cleanupExpiredTokens() {
        try {
            // Clean up expired tokens
            int expiredCount = passwordResetRepository.deleteExpiredTokens(LocalDateTime.now());
            if (expiredCount > 0) {
                log.info("Cleaned up {} expired password reset tokens", expiredCount);
            }
        } catch (Exception e) {
            log.error("Failed to cleanup expired password reset tokens", e);
        }
    }

    @Transactional
    @Scheduled(fixedRate = 86400000) // Run daily
    public void cleanupOldUsedTokens() {
        try {
            // Clean up used tokens older than 24 hours
            LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
            int usedCount = passwordResetRepository.deleteUsedTokensOlderThan(cutoff);
            if (usedCount > 0) {
                log.info("Cleaned up {} old used password reset tokens", usedCount);
            }
        } catch (Exception e) {
            log.error("Failed to cleanup old used password reset tokens", e);
        }
    }

    @Transactional
    public void cleanupAllTokensForEmail(String email) {
        try {
            // Clean up all tokens for a specific email
            int deletedCount = passwordResetRepository.deleteByEmail(email);
            if (deletedCount > 0) {
                log.info("Cleaned up {} password reset tokens for email: {}", deletedCount, email);
            }
        } catch (Exception e) {
            log.error("Failed to cleanup tokens for email: {}", email, e);
        }
    }
}
