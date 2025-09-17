import axios from 'axios';
import { API_CONFIG } from '../config/api.js';

const API_BASE_URL = `${API_CONFIG.BASE_URL}/api`;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to get user-specific token key
const getTokenKey = (email) => {
  return email ? `jwt_token_${email}` : 'jwt_token';
};

// Helper function to get the current user's token
const getCurrentUserToken = () => {
  // First check if there's a current user email in session storage
  const currentUserEmail = sessionStorage.getItem('current_user_email');
  if (currentUserEmail) {
    const userToken = localStorage.getItem(getTokenKey(currentUserEmail));
    if (userToken) {
      return userToken;
    }
  }
  
  // Fallback to generic token
  return localStorage.getItem('jwt_token');
};

// Request interceptor to add JWT token to headers
apiClient.interceptors.request.use(
  (config) => {
    const token = getCurrentUserToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common response patterns
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

export const hirePostAPI = {
  // Create a new hire post (Customer only)
  createHirePost: (hirePostData) => {
    return apiClient.post('/hireposts', hirePostData);
  },

  // Get my hire posts (Customer only)
  getMyHirePosts: () => {
    return apiClient.get('/hireposts/my-posts');
  },

  // Get available hire posts (for workers to browse)
  getAvailableHirePosts: (field = null, sortByLocation = false) => {
    const params = {};
    if (field) params.field = field;
    if (sortByLocation) params.sortByLocation = true;
    return apiClient.get('/hireposts/available', { params });
  },

  // Get a specific hire post by ID
  getHirePostById: (postId) => {
    return apiClient.get(`/hireposts/${postId}`);
  },

  // Update a hire post (Customer only)
  updateHirePost: (postId, updateData) => {
    return apiClient.put(`/hireposts/${postId}`, updateData);
  },

  // Delete a hire post (Customer only)
  deleteHirePost: (postId) => {
    return apiClient.delete(`/hireposts/${postId}`);
  },

  // Apply to a hire post (Worker only)
  applyToHirePost: (postId) => {
    return apiClient.post(`/hireposts/${postId}/apply`);
  },

  // Get applications for a hire post (Customer only)
  getApplicationsForPost: (postId) => {
    return apiClient.get(`/hireposts/${postId}/applications`);
  },

  // Select a worker for a hire post (Customer only)
  selectWorkerForPost: (postId, workerId) => {
    return apiClient.post(`/hireposts/${postId}/select-worker/${workerId}`);
  },

  // Mark post as completed (Customer only)
  markPostAsCompleted: (postId) => {
    return apiClient.post(`/hireposts/${postId}/complete`);
  },

  // Check if worker has applied to a post (Worker only)
  hasWorkerAppliedToPost: (postId) => {
    return apiClient.get(`/hireposts/${postId}/has-applied`);
  },
};

export const notificationAPI = {
  // Get all notifications (Customer & Worker)
  getNotifications: () => {
    return apiClient.get('/notifications');
  },

  // Get unread notifications (Customer & Worker)
  getUnreadNotifications: () => {
    return apiClient.get('/notifications/unread');
  },

  // Get unread notifications count (Customer & Worker)
  getUnreadNotificationsCount: () => {
    return apiClient.get('/notifications/unread/count');
  },

  // Mark notification as read (Customer & Worker)
  markNotificationAsRead: (notificationId) => {
    return apiClient.put(`/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read (Customer & Worker)
  markAllNotificationsAsRead: () => {
    return apiClient.put('/notifications/read-all');
  },

  // Delete a notification (Customer & Worker)
  deleteNotification: (notificationId) => {
    return apiClient.delete(`/notifications/${notificationId}`);
  },
};

// Job fields enum (should match backend)
export const JOB_FIELDS = [
  'Electrician',
  'Plumber',
  'Carpenter',
  'Painter',
  'Maid',
  'Chef',
  'Driver',
  'Photographer'
];

// Hire post statuses
export const HIRE_POST_STATUS = {
  AVAILABLE: 'AVAILABLE',
  BOOKED: 'BOOKED',
  COMPLETED: 'COMPLETED'
};

// Notification statuses
export const NOTIFICATION_STATUS = {
  READ: 'READ',
  UNREAD: 'UNREAD'
};

const hirePostService = {
  // Hire Post functions
  createHirePost: hirePostAPI.createHirePost,
  getMyHirePosts: hirePostAPI.getMyHirePosts,
  getAvailableHirePosts: hirePostAPI.getAvailableHirePosts,
  getHirePostById: hirePostAPI.getHirePostById,
  updateHirePost: hirePostAPI.updateHirePost,
  deleteHirePost: hirePostAPI.deleteHirePost,
  applyToHirePost: hirePostAPI.applyToHirePost,
  getApplicationsForPost: hirePostAPI.getApplicationsForPost,
  selectWorkerForPost: hirePostAPI.selectWorkerForPost,
  markPostAsCompleted: hirePostAPI.markPostAsCompleted,
  hasWorkerAppliedToPost: hirePostAPI.hasWorkerAppliedToPost,

  // Notification functions
  getNotifications: notificationAPI.getNotifications,
  getUnreadNotifications: notificationAPI.getUnreadNotifications,
  getUnreadNotificationsCount: notificationAPI.getUnreadNotificationsCount,
  markNotificationAsRead: notificationAPI.markNotificationAsRead,
  markAllNotificationsAsRead: notificationAPI.markAllNotificationsAsRead,
  deleteNotification: notificationAPI.deleteNotification,

  // Constants
  JOB_FIELDS,
  HIRE_POST_STATUS,
  NOTIFICATION_STATUS,
};

export default hirePostService;
