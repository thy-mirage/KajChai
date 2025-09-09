import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import chatService from '../services/chatService';
import Layout from './Layout';
import './Chat.css';

const Chat = () => {
    const { user } = useAuth();
    const [chatRooms, setChatRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [availableUsers, setAvailableUsers] = useState([]);
    const [showUserList, setShowUserList] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
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

    // Load chat rooms on component mount
    useEffect(() => {
        loadChatRooms();
        loadAvailableUsers();
    }, []);

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

    const handleRoomSelect = (room) => {
        setSelectedRoom(room);
        loadMessages(room.roomId);
        setShowUserList(false);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedRoom || sendingMessage) return;

        setSendingMessage(true);
        try {
            // Get receiver ID based on current user role
            const receiverId = user.role === 'CUSTOMER' ? selectedRoom.workerId : selectedRoom.customerId;
            const receiverRole = user.role === 'CUSTOMER' ? 'WORKER' : 'CUSTOMER';
            
            const messageData = {
                receiverId: receiverId,
                receiverRole: receiverRole,
                content: newMessage.trim()
            };

            const response = await chatService.sendMessage(messageData);
            if (response.success) {
                setNewMessage('');
                // Reload messages to show the new message
                loadMessages(selectedRoom.roomId);
                // Refresh chat rooms to update last message
                loadChatRooms();
            }
        } catch (error) {
            console.error('Failed to send message:', error);
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
                // Refresh chat rooms list
                loadChatRooms();
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
            <Layout>
                <div className="chat-container">
                    <div className="loading">Loading chats...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="chat-container">
            {/* Sidebar */}
            <div className="chat-sidebar">
                <div className="sidebar-header">
                    <h3>Messages</h3>
                    <div className="header-actions">
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
                                className={`chat-room-item ${selectedRoom?.roomId === room.roomId ? 'active' : ''}`}
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
                                        className={`message ${message.senderId === getCurrentUserId() ? 'sent' : 'received'}`}
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
        </Layout>
    );
};

export default Chat;