package com.example.KajChai.Repository;

import com.example.KajChai.DatabaseEntity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    List<ChatMessage> findByChatRoom_RoomIdOrderBySentAtAsc(Long roomId);
    
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.chatRoom.roomId = :roomId AND cm.senderId != :userId AND cm.isRead = false")
    List<ChatMessage> findUnreadMessagesByRoomAndReceiver(Long roomId, Integer userId);
    
    @Query("SELECT COUNT(cm) FROM ChatMessage cm WHERE cm.chatRoom.roomId = :roomId AND cm.senderId != :userId AND cm.isRead = false")
    Long countUnreadMessagesByRoomAndReceiver(Long roomId, Integer userId);
    
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.chatRoom.roomId = :roomId ORDER BY cm.sentAt DESC LIMIT 1")
    ChatMessage findLastMessageByRoomId(Long roomId);
}
