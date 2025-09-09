package com.example.KajChai.Repository;

import com.example.KajChai.DatabaseEntity.PasswordReset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetRepository extends JpaRepository<PasswordReset, Integer> {
    
    Optional<PasswordReset> findByEmailAndResetCodeAndUsedFalse(String email, String resetCode);
    
    Optional<PasswordReset> findTopByEmailAndUsedFalseOrderByCreatedAtDesc(String email);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM PasswordReset p WHERE p.email = :email")
    int deleteByEmail(@Param("email") String email);
    
    @Modifying
    @Transactional
    @Query("UPDATE PasswordReset p SET p.used = true WHERE p.email = :email")
    int markAllAsUsedByEmail(@Param("email") String email);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM PasswordReset p WHERE p.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM PasswordReset p WHERE p.used = true AND p.createdAt < :cutoffDate")
    int deleteUsedTokensOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    boolean existsByEmailAndUsedFalseAndExpiresAtAfter(String email, LocalDateTime now);
}
