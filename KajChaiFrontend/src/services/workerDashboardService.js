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
    }
    throw new Error('Network error occurred');
  }
);

const workerDashboardService = {
  async getWorkerDashboardStats() {
    try {
      return await apiClient.get('/worker-dashboard/stats');
    } catch (error) {
      console.error('Error fetching worker dashboard stats:', error);
      throw error;
    }
  },

  async getCurrentWorks() {
    try {
      return await apiClient.get('/worker-dashboard/current-works');
    } catch (error) {
      console.error('Error fetching current works:', error);
      throw error;
    }
  },

  async getMyReviews() {
    try {
      return await apiClient.get('/worker-dashboard/my-reviews');
    } catch (error) {
      console.error('Error fetching worker reviews:', error);
      throw error;
    }
  },

  async getPastJobs() {
    try {
      return await apiClient.get('/worker-dashboard/past-jobs');
    } catch (error) {
      console.error('Error fetching past jobs:', error);
      throw error;
    }
  },
};

export default workerDashboardService;