import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      throw error;
    } else if (error.request) {
      throw new Error('Network error - please check your connection');
    } else {
      throw new Error('Request failed');
    }
  }
);

export const chatAPI = {
  // Get user's chat rooms
  getChatRooms: () => {
    return apiClient.get('/chat/rooms');
  },

  // Create or get chat room with another user
  createOrGetChatRoom: (otherUserId) => {
    return apiClient.post(`/chat/rooms?otherUserId=${otherUserId}`);
  },

  // Get messages for a chat room
  getChatMessages: (roomId) => {
    return apiClient.get(`/chat/rooms/${roomId}/messages`);
  },

  // Send a message
  sendMessage: (messageData) => {
    return apiClient.post('/chat/send', messageData);
  },

  // Get available users to chat with
  getAvailableUsers: () => {
    return apiClient.get('/chat/users');
  },

  // Mark messages as read
  markMessagesAsRead: (roomId) => {
    return apiClient.put(`/chat/rooms/${roomId}/read`);
  },
};

const chatService = {
  getChatRooms: chatAPI.getChatRooms,
  createOrGetChatRoom: chatAPI.createOrGetChatRoom,
  getChatMessages: chatAPI.getChatMessages,
  sendMessage: chatAPI.sendMessage,
  getAvailableUsers: chatAPI.getAvailableUsers,
  markMessagesAsRead: chatAPI.markMessagesAsRead,
};

export default chatService;
