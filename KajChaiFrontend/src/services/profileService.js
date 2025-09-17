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

export const profileAPI = {
  // Get current user's profile
  getMyProfile: () => {
    return apiClient.get('/profile');
  },

  // Update customer profile
  updateCustomerProfile: (profileData) => {
    return apiClient.put('/profile/customer', profileData);
  },

  // Update worker profile
  updateWorkerProfile: (profileData) => {
    return apiClient.put('/profile/worker', profileData);
  },

  // Get all workers (for customers to browse)
  getAllWorkers: (field = null, sortByLocation = false, page = 1, size = 10) => {
    const params = {
      page: page - 1, // Spring Boot uses 0-based indexing
      size: size
    };
    if (field) params.field = field;
    if (sortByLocation) params.sortByLocation = true;
    return apiClient.get('/profile/workers', { params });
  },

  // Get worker profile by ID
  getWorkerProfile: (workerId) => {
    return apiClient.get(`/profile/worker/${workerId}`);
  },

  // Get customer profile by ID
  getCustomerProfile: (customerId) => {
    return apiClient.get(`/profile/customer/${customerId}`);
  },
};

const profileService = {
  // Profile functions
  getMyProfile: profileAPI.getMyProfile,
  updateCustomerProfile: profileAPI.updateCustomerProfile,
  updateWorkerProfile: profileAPI.updateWorkerProfile,
  getAllWorkers: profileAPI.getAllWorkers,
  getWorkerProfile: profileAPI.getWorkerProfile,
  getCustomerProfile: profileAPI.getCustomerProfile,
};

export default profileService;