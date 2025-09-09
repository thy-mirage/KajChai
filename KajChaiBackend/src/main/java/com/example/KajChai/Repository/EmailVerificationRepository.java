package com.example.KajChai.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.example.KajChai.DatabaseEntity.EmailVerification;

@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Integer> {
    
    Optional<EmailVerification> findByEmailAndVerificationCodeAndVerifiedFalse(String email, String verificationCode);
    Optional<EmailVerification> findByEmailAndVerifiedFalse(String email);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM EmailVerification e WHERE e.email = :email")
    int deleteByEmail(@Param("email") String email);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM EmailVerification e WHERE e.expiryDate < :cutoffDate")
    int deleteByExpiryDateBefore(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM EmailVerification e WHERE e.verified = true AND e.expiryDate < :cutoffDate")
    int deleteByVerifiedTrueAndExpiryDateBefore(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    // Helper method to check if valid code exists
    boolean existsByEmailAndVerifiedFalseAndExpiryDateAfter(String email, LocalDateTime now);
}
