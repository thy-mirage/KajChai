package com.example.KajChai.Service;

import com.example.KajChai.DatabaseEntity.EmailVerification;
import com.example.KajChai.Repository.EmailVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailVerificationRepository verificationRepository;
    private final EmailService emailService;

    @Value("${app.verification.code.expiry}")
    private Long verificationCodeExpiry;

    private static final SecureRandom random = new SecureRandom();

    @Transactional
    public void sendVerificationCode(String email) {
        try {
            // Delete ALL existing verification codes for this email (used and unused)
            // This ensures no old codes can be reused
            int deletedCount = verificationRepository.deleteByEmail(email);
            if (deletedCount > 0) {
                log.info("Deleted {} existing verification codes for email: {}", deletedCount, email);
            }

            // Generate new verification code
            String verificationCode = generateVerificationCode();
            
            // Save verification code with expiry
            EmailVerification verification = EmailVerification.builder()
                    .email(email)
                    .verificationCode(verificationCode)
                    .expiryDate(LocalDateTime.now().plusSeconds(verificationCodeExpiry / 1000))
                    .verified(false)
                    .build();
            
            verificationRepository.save(verification);
            
            // Send email
            emailService.sendVerificationEmail(email, verificationCode);
            log.info("New verification code sent to: {}", email);
            
        } catch (Exception e) {
            log.error("Failed to send verification code to: {}", email, e);
            throw new RuntimeException("Failed to send verification code", e);
        }
    }

    @Transactional
    public boolean verifyCode(String email, String code) {
        try {
            Optional<EmailVerification> verificationOpt = verificationRepository
                    .findByEmailAndVerificationCodeAndVerifiedFalse(email, code);
            
            if (verificationOpt.isEmpty()) {
                log.warn("Invalid verification code provided for email: {}", email);
                return false;
            }
            
            EmailVerification verification = verificationOpt.get();
            
            if (verification.isExpired()) {
                log.warn("Expired verification code used for email: {}", email);
                return false;
            }
            
            // Mark as verified and used
            verification.setVerified(true);
            verificationRepository.save(verification);
            
            // Clean up ALL verification codes for this email after successful verification
            // This prevents any other codes from being used
            cleanupAllCodesForEmail(email);
            
            log.info("Email verification completed successfully for: {}", email);
            return true;
            
        } catch (Exception e) {
            log.error("Failed to verify code for email: {}", email, e);
            return false;
        }
    }

    @Transactional
    public void cleanupAllCodesForEmail(String email) {
        try {
            // Delete all verification codes for this email after successful verification
            int deletedCount = verificationRepository.deleteByEmail(email);
            if (deletedCount > 0) {
                log.info("Cleaned up {} verification codes for email after successful verification: {}", deletedCount, email);
            }
        } catch (Exception e) {
            log.error("Failed to cleanup codes for email: {}", email, e);
        }
    }

    private String generateVerificationCode() {
        return String.format("%06d", random.nextInt(999999));
    }

    @Transactional
    @Scheduled(fixedRate = 1800000) // Run every 30 minutes
    public void cleanupExpiredCodes() {
        try {
            // Clean up all expired verification codes
            LocalDateTime now = LocalDateTime.now();
            int deletedCount = verificationRepository.deleteByExpiryDateBefore(now);
            
            if (deletedCount > 0) {
                log.info("Cleaned up {} expired email verification codes", deletedCount);
            }
        } catch (Exception e) {
            log.error("Failed to cleanup expired verification codes", e);
        }
    }

    @Transactional
    @Scheduled(fixedRate = 86400000) // Run daily
    public void cleanupOldVerifiedCodes() {
        try {
            // Clean up verified codes older than 24 hours
            LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
            int deletedCount = verificationRepository.deleteByVerifiedTrueAndExpiryDateBefore(cutoff);
            
            if (deletedCount > 0) {
                log.info("Cleaned up {} old verified email codes", deletedCount);
            }
        } catch (Exception e) {
            log.error("Failed to cleanup old verified codes", e);
        }
    }
}
