import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import chatService from '../services/chatService';
import webSocketService from '../services/websocketService';
import './Chat.css';

const Chat = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [chatRooms, setChatRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [availableUsers, setAvailableUsers] = useState([]);
    const [showUserList, setShowUserList] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const [allRoomsSubscribed, setAllRoomsSubscribed] = useState(false);
    const messagesEndRef = useRef(null);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load chat rooms on component mount and setup WebSocket
    useEffect(() => {
        loadChatRooms();
        loadAvailableUsers();
        setupWebSocket();
        
        // Cleanup WebSocket on unmount
        return () => {
            webSocketService.disconnect();
        };
    }, []);

    // Subscribe to all rooms when chat rooms are loaded and WebSocket is connected
    useEffect(() => {
        if (chatRooms.length > 0 && wsConnected && !allRoomsSubscribed) {
            console.log('🌐 Setting up real-time subscriptions for all chat rooms');
            setupAllRoomSubscriptions();
        }
    }, [chatRooms, wsConnected, allRoomsSubscribed]);

    // Handle navigation state to automatically open a specific room
    useEffect(() => {
        if (location.state?.openRoomId && chatRooms.length > 0 && !selectedRoom) {
            const targetRoom = chatRooms.find(room => room.roomId === location.state.openRoomId);
            if (targetRoom) {
                console.log('🎯 Auto-opening room from navigation:', targetRoom);
                handleRoomSelect(targetRoom);
                // Clear the state to prevent re-triggering
                window.history.replaceState({}, document.title);
            }
        }
    }, [location.state, chatRooms, selectedRoom]);

    // Setup WebSocket connection
    const setupWebSocket = async () => {
        if (user && user.userId) {
            try {
                console.log('🔌 Setting up WebSocket for user:', user.userId, 'role:', user.role);
                await webSocketService.connect(user.userId, user.role);
                setWsConnected(true);
                console.log('✅ WebSocket connected successfully');
            } catch (error) {
                console.error('❌ Failed to connect to WebSocket:', error);
                setWsConnected(false);
            }
        } else {
            console.error('❌ Cannot setup WebSocket: user or userId is missing', user);
        }
    };

    // Setup real-time subscriptions for all chat rooms
    const setupAllRoomSubscriptions = () => {
        const roomIds = chatRooms.map(room => room.roomId);
        
        // Global message handler for all rooms
        const globalMessageHandler = (message, roomId) => {
            console.log('🌍 Global message received for room', roomId, ':', message);
            
            // Update chat rooms list to reflect new message
            setChatRooms(prevRooms => {
                return prevRooms.map(room => {
                    if (room.roomId === roomId) {
                        // Only increment unread count if:
                        // 1. The message is NOT from the current user
                        // 2. The room is NOT currently selected
                        console.log('🔍 Checking unread logic:', {
                            messageSenderId: message.senderId, 
                            currentUserId: user.userId, 
                            messageFromCurrentUser: message.senderId == user.userId,
                            isCurrentRoom: selectedRoom?.roomId === roomId,
                            roomId: roomId
                        });
                        
                        const shouldIncrementUnread = message.senderId != user.userId && 
                                                    selectedRoom?.roomId !== roomId;
                        
                        return {
                            ...room,
                            lastMessage: message.content,
                            lastActivity: message.sentAt,
                            unreadCount: selectedRoom?.roomId === roomId ? 0 : 
                                       shouldIncrementUnread ? (room.unreadCount || 0) + 1 : room.unreadCount
                        };
                    }
                    return room;
                });
            });

            // If message is for the currently selected room, add it to messages
            if (selectedRoom && selectedRoom.roomId === roomId) {
                setMessages(prevMessages => {
                    console.log('🔍 Checking for optimistic message replacement. Received message:', message);
                    console.log('🔍 Current messages:', prevMessages.map(m => ({id: m.messageId, content: m.content, isPending: m.isPending, senderId: m.senderId})));
                    
                    // Check if this is replacing an optimistic message from the same sender
                    const optimisticMessageIndex = prevMessages.findIndex(msg => 
                        msg.isPending && 
                        msg.senderId === message.senderId && 
                        msg.content.trim() === message.content.trim()
                    );
                    
                    if (optimisticMessageIndex !== -1) {
                        console.log('🔄 Replacing optimistic message with real message at index:', optimisticMessageIndex);
                        // Replace optimistic message with real message
                        const updatedMessages = [...prevMessages];
                        updatedMessages[optimisticMessageIndex] = { ...message, isPending: false };
                        return updatedMessages;
                    } else {
                        // Check if message already exists to prevent duplicates
                        const messageExists = prevMessages.some(msg => msg.messageId === message.messageId);
                        if (!messageExists) {
                            console.log('➕ Adding new message to current room (no optimistic message found)');
                            return [...prevMessages, { ...message, isPending: false }];
                        } else {
                            console.log('🔄 Message already exists in current room, skipping');
                            return prevMessages;
                        }
                    }
                });
                
                // Mark as read if it's the current room and not sent by current user
                if (message.senderId !== user.userId) {
                    setTimeout(() => {
                        chatService.markMessagesAsRead(roomId);
                    }, 1000);
                }
            }
        };

        // Subscribe to all rooms
        webSocketService.subscribeToAllRooms(roomIds, globalMessageHandler);
        setAllRoomsSubscribed(true);
        console.log('✅ Subscribed to all chat rooms for real-time updates');
    };

    // Update handler for selected room (no longer need to subscribe/unsubscribe)
    useEffect(() => {
        if (selectedRoom && wsConnected && allRoomsSubscribed) {
            console.log('🎯 Updating handler for selected room:', selectedRoom.roomId);
            
            const handleRoomMessage = (message) => {
                console.log('📨 Handling message for selected room:', message);
                // This is now handled by the global handler, but we keep this for any room-specific logic
            };

            // Update the handler for this specific room
            webSocketService.updateRoomHandler(selectedRoom.roomId, handleRoomMessage);
        }
    }, [selectedRoom, wsConnected, allRoomsSubscribed]);

    const loadChatRooms = async () => {
        try {
            const response = await chatService.getChatRooms();
            if (response.success) {
                setChatRooms(response.chatRooms || []);
            }
        } catch (error) {
            console.error('Failed to load chat rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableUsers = async () => {
        try {
            const response = await chatService.getAvailableUsers();
            if (response.success) {
                setAvailableUsers(response.users || []);
            }
        } catch (error) {
            console.error('Failed to load available users:', error);
        }
    };

    const loadMessages = async (roomId) => {
        try {
            const response = await chatService.getChatMessages(roomId);
            if (response.success) {
                setMessages(response.messages || []);
                // Mark messages as read
                await chatService.markMessagesAsRead(roomId);
                // Refresh chat rooms to update unread count
                loadChatRooms();
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const handleRoomSelect = async (room) => {
        setSelectedRoom(room);
        loadMessages(room.roomId);
        setShowUserList(false);
        
        // Reset unread count for this room
        setChatRooms(prevRooms => 
            prevRooms.map(r => 
                r.roomId === room.roomId ? { ...r, unreadCount: 0 } : r
            )
        );
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedRoom || sendingMessage) return;

        setSendingMessage(true);
        const messageContent = newMessage.trim();
        
        // Clear input immediately for better UX
        setNewMessage('');
        
        // Create optimistic message for immediate UI feedback
        const optimisticMessage = {
            messageId: `temp-${Date.now()}`, // Temporary ID
            senderId: user.userId,
            senderRole: user.role,
            content: messageContent,
            sentAt: new Date().toISOString(),
            isRead: false,
            isPending: true // Flag to indicate this is a pending message
        };

        console.log('✨ Creating optimistic message:', optimisticMessage);

        // Add optimistic message to UI immediately
        setMessages(prevMessages => [...prevMessages, optimisticMessage]);

        try {
            // Get receiver ID based on current user role
            const receiverId = user.role === 'CUSTOMER' ? selectedRoom.workerId : selectedRoom.customerId;
            const receiverRole = user.role === 'CUSTOMER' ? 'WORKER' : 'CUSTOMER';
            
            const messageData = {
                receiverId: receiverId,
                receiverRole: receiverRole,
                content: messageContent
            };

            // Try WebSocket first, fallback to HTTP
            let messageSent = false;
            
            // Send message via HTTP API (more reliable)
            console.log('📤 Sending message via HTTP API');
            const response = await chatService.sendMessage(messageData);
            if (response.success) {
                console.log('✅ Message sent via HTTP successfully:', response.message);
                // Replace optimistic message with real message
                const realMessage = response.message;
                setMessages(prevMessages => 
                    prevMessages.map(msg => 
                        msg.messageId === optimisticMessage.messageId ? 
                        { ...realMessage, isPending: false } : msg
                    )
                );
                
                // Update the chat rooms list immediately
                setChatRooms(prevRooms => {
                    return prevRooms.map(room => {
                        if (room.roomId == realMessage.roomId) {
                            return {
                                ...room,
                                lastMessage: realMessage.content,
                                lastActivity: realMessage.sentAt,
                                // Don't increment unread count for sent messages
                            };
                        }
                        return room;
                    });
                });
            } else {
                throw new Error('Failed to send message via HTTP');
            }
            
        } catch (error) {
            console.error('❌ Failed to send message:', error);
            // Remove optimistic message on error
            setMessages(prevMessages => 
                prevMessages.filter(msg => msg.messageId !== optimisticMessage.messageId)
            );
            alert('Failed to send message. Please try again.');
        } finally {
            setSendingMessage(false);
        }
    };

    const startChatWithUser = async (userId) => {
        try {
            const response = await chatService.createOrGetChatRoom(userId);
            if (response.success) {
                const newRoom = response.chatRoom;
                setSelectedRoom(newRoom);
                loadMessages(newRoom.roomId);
                setShowUserList(false);
                // Refresh chat rooms list and subscribe to new room if created
                await loadChatRooms();
                
                // Subscribe to the new room if not already subscribed
                if (wsConnected && !webSocketService.subscriptions.has(newRoom.roomId)) {
                    webSocketService.subscribeToRoom(newRoom.roomId, null);
                }
            }
        } catch (error) {
            console.error('Failed to create chat room:', error);
            alert('Failed to start chat. Please try again.');
        }
    };

    const formatMessageTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const oneDay = 24 * 60 * 60 * 1000;

        if (diff < oneDay && date.getDate() === now.getDate()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString();
        }
    };

    const getCurrentUserId = () => {
        return user.userId;
    };

    if (loading) {
        return (
            <div className="chat-container">
                <div className="loading">Loading chats...</div>
            </div>
        );
    }

    return (
        <div className="chat-container">
        {/* Sidebar */}
        <div className="chat-sidebar">
            <div className="sidebar-header">
                <h3>Messages</h3>
                <div className="header-actions">
                        <div className={`connection-status ${wsConnected ? 'connected' : 'disconnected'}`} 
                             title={wsConnected ? 'Real-time messaging active' : 'Real-time messaging offline'}>
                            <span className="status-dot"></span>
                        </div>
                        <button 
                            className="new-chat-btn"
                            onClick={() => setShowUserList(!showUserList)}
                            title="Start new chat"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* User List Modal */}
                {showUserList && (
                    <div className="user-list-modal">
                        <div className="user-list-header">
                            <h4>Start New Chat</h4>
                            <button onClick={() => setShowUserList(false)}>×</button>
                        </div>
                        <div className="user-list">
                            {availableUsers.map(user => (
                                <div 
                                    key={user.userId} 
                                    className="user-item"
                                    onClick={() => startChatWithUser(user.userId)}
                                >
                                    <div className="user-avatar">
                                        {user.photo ? (
                                            <img src={user.photo} alt={user.name} />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="user-info">
                                        <div className="user-name">{user.name}</div>
                                        <div className="user-role">
                                            {user.role === 'WORKER' && user.field && (
                                                <span className="worker-field">{user.field}</span>
                                            )}
                                            {user.role === 'WORKER' && user.rating && (
                                                <span className="worker-rating">★ {user.rating.toFixed(1)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Chat Rooms List */}
                <div className="chat-rooms-list">
                    {chatRooms.length === 0 ? (
                        <div className="no-chats">
                            <p>No conversations yet</p>
                            <p>Click + to start a new chat</p>
                        </div>
                    ) : (
                        chatRooms.map(room => (
                            <div 
                                key={room.roomId}
                                className={`chat-room-item ${selectedRoom?.roomId === room.roomId ? 'active' : ''} ${room.unreadCount > 0 ? 'has-unread' : ''}`}
                                onClick={() => handleRoomSelect(room)}
                            >
                                <div className="room-avatar">
                                    {room.otherUserPhoto ? (
                                        <img src={room.otherUserPhoto} alt="User" />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {(user.role === 'CUSTOMER' ? room.workerName : room.customerName)?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="room-info">
                                    <div className="room-name">
                                        {user.role === 'CUSTOMER' ? room.workerName : room.customerName}
                                    </div>
                                    <div className="last-message">
                                        {room.lastMessage || 'No messages yet'}
                                    </div>
                                </div>
                                <div className="room-meta">
                                    {room.lastActivity && (
                                        <div className="last-time">
                                            {formatMessageTime(room.lastActivity)}
                                        </div>
                                    )}
                                    {room.unreadCount > 0 && (
                                        <div className="unread-badge">{room.unreadCount}</div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="chat-main">
                {selectedRoom ? (
                    <>
                        {/* Chat Header */}
                        <div className="chat-header">
                            <div className="chat-user-info">
                                <div className="chat-avatar">
                                    {selectedRoom.otherUserPhoto ? (
                                        <img src={selectedRoom.otherUserPhoto} alt="User" />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {(user.role === 'CUSTOMER' ? selectedRoom.workerName : selectedRoom.customerName)?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3>{user.role === 'CUSTOMER' ? selectedRoom.workerName : selectedRoom.customerName}</h3>
                                    <p className="user-role-text">
                                        {user.role === 'CUSTOMER' ? 'Worker' : 'Customer'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="messages-container">
                            <div className="messages-list">
                                {messages.map(message => (
                                    <div 
                                        key={message.messageId}
                                        className={`message ${message.senderId === getCurrentUserId() ? 'sent' : 'received'} ${message.isPending ? 'pending' : ''}`}
                                    >
                                        <div className="message-content">
                                            {message.content}
                                        </div>
                                        <div className="message-time">
                                            {formatMessageTime(message.sentAt)}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Message Input */}
                        <form className="message-input-form" onSubmit={handleSendMessage}>
                            <div className="message-input-container">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="message-input"
                                    disabled={sendingMessage}
                                />
                                <button 
                                    type="submit" 
                                    className="send-button"
                                    disabled={!newMessage.trim() || sendingMessage}
                                >
                                    {sendingMessage ? '...' : '→'}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <div className="welcome-message">
                            <h2>Welcome to KajChai Chat</h2>
                            <p>Select a conversation from the sidebar or start a new chat</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;