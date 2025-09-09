package com.example.KajChai.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.KajChai.DatabaseEntity.Worker;

@Repository
public interface WorkerRepository extends JpaRepository<Worker, Integer> {
    Optional<Worker> findByGmail(String gmail);
    boolean existsByGmail(String gmail);
}
