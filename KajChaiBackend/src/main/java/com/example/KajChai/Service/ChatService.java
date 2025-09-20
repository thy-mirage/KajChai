package com.example.KajChai.Service;

import com.example.KajChai.DatabaseEntity.*;
import com.example.KajChai.DTO.*;
import com.example.KajChai.Enum.UserRole;
import com.example.KajChai.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final CustomerRepository customerRepository;
    private final WorkerRepository workerRepository;

    @Transactional
    public ChatRoomResponse createOrGetChatRoom(Integer currentUserId, UserRole currentUserRole, Integer otherUserId) {
        Integer customerId, workerId;
        
        if (currentUserRole == UserRole.CUSTOMER) {
            customerId = currentUserId;
            workerId = otherUserId;
        } else {
            customerId = otherUserId;
            workerId = currentUserId;
        }

        // Check if chat room already exists
        Optional<ChatRoom> existingRoom = chatRoomRepository.findByCustomerIdAndWorkerId(customerId, workerId);
        
        ChatRoom chatRoom;
        if (existingRoom.isPresent()) {
            chatRoom = existingRoom.get();
        } else {
            // Create new chat room
            String roomName = "customer_" + customerId + "_worker_" + workerId;
            chatRoom = ChatRoom.builder()
                    .roomName(roomName)
                    .customerId(customerId)
                    .workerId(workerId)
                    .lastActivity(LocalDateTime.now())
                    .build();
            chatRoom = chatRoomRepository.save(chatRoom);
        }

        return buildChatRoomResponse(chatRoom, currentUserId, currentUserRole);
    }

    public List<ChatRoomResponse> getUserChatRooms(Integer userId, UserRole userRole) {
        List<ChatRoom> chatRooms = chatRoomRepository.findByUserIdOrderByLastActivityDesc(userId);
        List<ChatRoomResponse> responses = new ArrayList<>();

        for (ChatRoom room : chatRooms) {
            responses.add(buildChatRoomResponse(room, userId, userRole));
        }

        return responses;
    }

    public List<ChatMessageResponse> getChatMessages(Long roomId, Integer userId) {
        List<ChatMessage> messages = chatMessageRepository.findByChatRoom_RoomIdOrderBySentAtAsc(roomId);
        List<ChatMessageResponse> responses = new ArrayList<>();

        for (ChatMessage message : messages) {
            responses.add(buildChatMessageResponse(message));
        }

        return responses;
    }

    @Transactional
    public ChatMessageResponse sendMessage(Integer senderId, UserRole senderRole, SendMessageRequest request) {
        // Validate input
        if (request.getReceiverRole() == null) {
            // If receiverRole is not provided, determine it based on sender role
            request.setReceiverRole((senderRole == UserRole.CUSTOMER) ? UserRole.WORKER : UserRole.CUSTOMER);
        }
        
        // Validate that customer can only message worker and vice versa
        if (senderRole == request.getReceiverRole()) {
            throw new IllegalArgumentException("Users of the same type cannot message each other");
        }
        
        // Validate that the receiver actually exists with the expected role
        if (!validateUserExistsWithRole(request.getReceiverId(), request.getReceiverRole())) {
            throw new IllegalArgumentException("Receiver not found or invalid user type for chat");
        }

        // Create or get chat room
        ChatRoomResponse roomResponse = createOrGetChatRoom(senderId, senderRole, request.getReceiverId());
        
        Optional<ChatRoom> chatRoomOpt = chatRoomRepository.findById(roomResponse.getRoomId());
        if (chatRoomOpt.isEmpty()) {
            throw new RuntimeException("Chat room not found");
        }

        ChatRoom chatRoom = chatRoomOpt.get();

        // Create message
        ChatMessage message = ChatMessage.builder()
                .chatRoom(chatRoom)
                .senderId(senderId)
                .senderRole(senderRole)
                .content(request.getContent())
                .isRead(false)
                .build();

        message = chatMessageRepository.save(message);

        // Update room last activity
        chatRoom.setLastActivity(LocalDateTime.now());
        chatRoomRepository.save(chatRoom);

        return buildChatMessageResponse(message);
    }

    @Transactional
    public void markMessagesAsRead(Long roomId, Integer userId) {
        List<ChatMessage> unreadMessages = chatMessageRepository.findUnreadMessagesByRoomAndReceiver(roomId, userId);
        for (ChatMessage message : unreadMessages) {
            message.setIsRead(true);
        }
        chatMessageRepository.saveAll(unreadMessages);
    }

    public List<UserListResponse> getAvailableUsers(Integer currentUserId, UserRole currentUserRole) {
        List<UserListResponse> users = new ArrayList<>();

        if (currentUserRole == UserRole.CUSTOMER) {
            // Customer can see all workers
            List<Worker> workers = workerRepository.findAll();
            for (Worker worker : workers) {
                users.add(UserListResponse.builder()
                        .userId(worker.getWorkerId())
                        .name(worker.getName())
                        .email(worker.getGmail())
                        .photo(worker.getPhoto())
                        .role("WORKER")
                        .field(worker.getField())
                        .rating(worker.getRating())
                        .build());
            }
        } else {
            // Worker can see all customers
            List<Customer> customers = customerRepository.findAll();
            for (Customer customer : customers) {
                users.add(UserListResponse.builder()
                        .userId(customer.getCustomerId())
                        .name(customer.getCustomerName())
                        .email(customer.getGmail())
                        .photo(customer.getPhoto())
                        .role("CUSTOMER")
                        .build());
            }
        }

        return users;
    }

    private ChatRoomResponse buildChatRoomResponse(ChatRoom room, Integer currentUserId, UserRole currentUserRole) {
        String otherUserName;
        String otherUserPhoto;

        if (currentUserRole == UserRole.CUSTOMER) {
            // Current user is customer, get worker details
            Optional<Worker> worker = workerRepository.findById(room.getWorkerId());
            otherUserName = worker.map(Worker::getName).orElse("Unknown Worker");
            otherUserPhoto = worker.map(Worker::getPhoto).orElse(null);
        } else {
            // Current user is worker, get customer details
            Optional<Customer> customer = customerRepository.findById(room.getCustomerId());
            otherUserName = customer.map(Customer::getCustomerName).orElse("Unknown Customer");
            otherUserPhoto = customer.map(Customer::getPhoto).orElse(null);
        }

        // Get last message
        ChatMessage lastMessage = chatMessageRepository.findLastMessageByRoomId(room.getRoomId());
        String lastMessageContent = lastMessage != null ? lastMessage.getContent() : "No messages yet";

        // Get unread count
        Long unreadCount = chatMessageRepository.countUnreadMessagesByRoomAndReceiver(room.getRoomId(), currentUserId);

        return ChatRoomResponse.builder()
                .roomId(room.getRoomId())
                .roomName(room.getRoomName())
                .customerId(room.getCustomerId())
                .customerName(currentUserRole == UserRole.WORKER ? otherUserName : getCurrentUserName(currentUserId, currentUserRole))
                .workerId(room.getWorkerId())
                .workerName(currentUserRole == UserRole.CUSTOMER ? otherUserName : getCurrentUserName(currentUserId, currentUserRole))
                .lastMessage(lastMessageContent)
                .lastActivity(room.getLastActivity())
                .unreadCount(unreadCount.intValue())
                .otherUserPhoto(otherUserPhoto)
                .build();
    }

    private ChatMessageResponse buildChatMessageResponse(ChatMessage message) {
        String senderName = getSenderName(message.getSenderId(), message.getSenderRole());
        
        return ChatMessageResponse.builder()
                .messageId(message.getMessageId())
                .roomId(message.getChatRoom().getRoomId())
                .senderId(message.getSenderId())
                .senderRole(message.getSenderRole())
                .senderName(senderName)
                .content(message.getContent())
                .isRead(message.getIsRead())
                .sentAt(message.getSentAt())
                .build();
    }

    private String getSenderName(Integer senderId, UserRole senderRole) {
        if (senderRole == UserRole.CUSTOMER) {
            Optional<Customer> customer = customerRepository.findById(senderId);
            return customer.map(Customer::getCustomerName).orElse("Unknown Customer");
        } else {
            Optional<Worker> worker = workerRepository.findById(senderId);
            return worker.map(Worker::getName).orElse("Unknown Worker");
        }
    }

    private String getCurrentUserName(Integer userId, UserRole userRole) {
        if (userRole == UserRole.CUSTOMER) {
            Optional<Customer> customer = customerRepository.findById(userId);
            return customer.map(Customer::getCustomerName).orElse("Unknown Customer");
        } else {
            Optional<Worker> worker = workerRepository.findById(userId);
            return worker.map(Worker::getName).orElse("Unknown Worker");
        }
    }

    private boolean validateUserExistsWithRole(Integer userId, UserRole expectedRole) {
        if (expectedRole == UserRole.CUSTOMER) {
            return customerRepository.findById(userId).isPresent();
        } else if (expectedRole == UserRole.WORKER) {
            return workerRepository.findById(userId).isPresent();
        }
        return false;
    }
    
    // Get unread chat message count for a customer
    public Long getUnreadChatMessageCount(Integer customerId) {
        // Count unread messages in all chat rooms where this customer is a participant
        return chatMessageRepository.countUnreadMessagesByCustomerId(customerId);
    }
}
