package com.example.KajChai.Repository;

import com.example.KajChai.DatabaseEntity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    
    Optional<ChatRoom> findByCustomerIdAndWorkerId(Integer customerId, Integer workerId);
    
    List<ChatRoom> findByCustomerIdOrderByLastActivityDesc(Integer customerId);
    
    List<ChatRoom> findByWorkerIdOrderByLastActivityDesc(Integer workerId);
    
    @Query("SELECT cr FROM ChatRoom cr WHERE cr.customerId = :userId OR cr.workerId = :userId ORDER BY cr.lastActivity DESC")
    List<ChatRoom> findByUserIdOrderByLastActivityDesc(Integer userId);
}
