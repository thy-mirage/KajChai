package com.example.KajChai.Repository;

import com.example.KajChai.DatabaseEntity.BannedEmail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BannedEmailRepository extends JpaRepository<BannedEmail, Integer> {
    boolean existsByEmail(String email);
    Optional<BannedEmail> findByEmail(String email);
}