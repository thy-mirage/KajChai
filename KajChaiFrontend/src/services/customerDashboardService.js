import axios from 'axios';
import { API_CONFIG } from '../config/api.js';
import hirePostService from './hirePostService.js';
import reviewService from './reviewService.js';

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

const customerDashboardService = {
  // Get customer dashboard statistics
  getCustomerDashboardStats: async () => {
    try {
      // Get all hire posts for the customer
      const hirePosts = await hirePostService.getMyHirePosts();
      
      // Calculate statistics
      const activeHirePosts = hirePosts.filter(post => 
        post.status === 'AVAILABLE' || post.status === 'BOOKED'
      ).length;
      
      const completedJobs = hirePosts.filter(post => 
        post.status === 'COMPLETED'
      ).length;
      
      // Calculate total spent from completed jobs
      const totalSpent = hirePosts
        .filter(post => post.status === 'COMPLETED' && post.payment)
        .reduce((sum, post) => sum + (post.payment || 0), 0);
      
      // Get reviews given by this customer
      let reviewsGiven = 0;
      try {
        const reviewsResponse = await apiClient.get('/review/customer/given-reviews-count');
        reviewsGiven = reviewsResponse || 0;
      } catch (error) {
        console.warn('Could not fetch reviews given count:', error);
        // For now, we'll estimate based on completed jobs
        reviewsGiven = Math.min(completedJobs, completedJobs); // Each completed job could have a review
      }
      
      return {
        activeHirePosts,
        completedJobs,
        totalSpent,
        reviewsGiven
      };
    } catch (error) {
      console.error('Error fetching customer dashboard stats:', error);
      throw error;
    }
  },

  // Get recent activities for the customer
  getRecentActivities: async () => {
    try {
      // This would typically come from a dedicated endpoint
      // For now, we'll return empty array and implement later
      return [];
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }
};

export default customerDashboardService;