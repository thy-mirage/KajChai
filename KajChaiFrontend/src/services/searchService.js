import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

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

const searchAPI = {
  // Search questions in real-time for Customer Q&A
  searchQuestions: async (query, limit = 10, category = null) => {
    try {
      const params = new URLSearchParams({
        query: query.toString(),
        limit: limit.toString(),
      });
      
      // Add category filter if specified
      if (category) {
        params.append('category', category);
      }
      
      const response = await apiClient.get(`/forum/search-questions?${params}`);
      return response;
    } catch (error) {
      console.error('Error searching questions:', error);
      throw error;
    }
  },
  
  // Search workers in real-time for Find Workers page
  searchWorkers: async (query, field = null, limit = 5) => {
    try {
      const params = new URLSearchParams({
        query: query.toString(),
        limit: limit.toString(),
      });
      
      // Add field filter if specified
      if (field) {
        params.append('field', field);
      }
      
      const response = await apiClient.get(`/profile/search-workers?${params}`);
      return response;
    } catch (error) {
      console.error('Error searching workers:', error);
      throw error;
    }
  }
};

export default searchAPI;