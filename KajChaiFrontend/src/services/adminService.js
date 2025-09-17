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

// Helper function to get the current user's token
const getCurrentUserToken = () => {
  // First check if there's a current user email in session storage
  const currentUserEmail = sessionStorage.getItem('current_user_email');
  if (currentUserEmail) {
    const userToken = localStorage.getItem(`jwt_token_${currentUserEmail}`);
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

export const adminAPI = {
  // Get admin statistics
  getAdminStats: () => {
    return apiClient.get('/admin/stats');
  },

  // Forum management
  getAllForumPosts: (params = {}) => {
    const searchParams = new URLSearchParams();
    
    if (params.page !== undefined) searchParams.append('page', params.page);
    if (params.size !== undefined) searchParams.append('size', params.size);
    if (params.search) searchParams.append('search', params.search);
    if (params.section && params.section !== 'ALL') searchParams.append('section', params.section);
    
    return apiClient.get(`/admin/forum/posts?${searchParams}`);
  },

  deleteForumPost: (postId) => {
    return apiClient.delete(`/admin/forum/posts/${postId}`);
  },

  deleteForumComment: (commentId) => {
    return apiClient.delete(`/admin/forum/comments/${commentId}`);
  },

  // User management (future feature)
  getAllUsers: (params = {}) => {
    const searchParams = new URLSearchParams();
    
    if (params.page !== undefined) searchParams.append('page', params.page);
    if (params.size !== undefined) searchParams.append('size', params.size);
    if (params.search) searchParams.append('search', params.search);
    if (params.role) searchParams.append('role', params.role);
    
    return apiClient.get(`/admin/users?${searchParams}`);
  },

  // Complaints management
  getAllComplaints: (page = 0, size = 10, status = null, search = null) => {
    const searchParams = new URLSearchParams();
    
    searchParams.append('page', page);
    searchParams.append('size', size);
    if (status) searchParams.append('status', status);
    if (search) searchParams.append('search', search);
    
    return apiClient.get(`/admin/complaints?${searchParams}`);
  },

  getComplaintStats: () => {
    return apiClient.get('/admin/complaints/stats');
  },

  resolveComplaint: (complaintId, adminResponse, deletePost = false) => {
    return apiClient.put(`/admin/complaints/${complaintId}/resolve`, {
      adminResponse,
      deletePost
    });
  },

  rejectComplaint: (complaintId, adminResponse) => {
    return apiClient.put(`/admin/complaints/${complaintId}/reject`, {
      adminResponse
    });
  },
};

// Simplified service object for components
const adminService = {
  // Statistics
  getAdminStats: adminAPI.getAdminStats,

  // Forum management
  getAllForumPosts: adminAPI.getAllForumPosts,
  deleteForumPost: adminAPI.deleteForumPost,
  deleteForumComment: adminAPI.deleteForumComment,

  // User management
  getAllUsers: adminAPI.getAllUsers,

  // Complaints management
  getAllComplaints: adminAPI.getAllComplaints,
  getComplaintStats: adminAPI.getComplaintStats,
  resolveComplaint: adminAPI.resolveComplaint,
  rejectComplaint: adminAPI.rejectComplaint,
};

export default adminService;