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

export const authAPI = {
  // Initiate signup process
  initiateSignup: (signupData) => {
    return apiClient.post('/auth/signup/initiate', signupData);
  },

  // Initiate signup with photo
  initiateSignupWithPhoto: (formData) => {
    return apiClient.post('/auth/signup/initiate-with-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Complete signup with verification
  completeSignup: (signupData, verificationCode) => {
    return apiClient.post(`/auth/signup/verify?verificationCode=${verificationCode}`, signupData);
  },

  // Complete signup with photo and verification
  completeSignupWithPhoto: (formData, verificationCode) => {
    // Add verification code to form data
    formData.append('verificationCode', verificationCode);
    return apiClient.post('/auth/signup/verify-with-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Login
  login: (loginData) => {
    return apiClient.post('/auth/login', loginData);
  },

  // Admin Login
  adminLogin: (loginData) => {
    return apiClient.post('/auth/admin/login', loginData);
  },

  // Admin Login
  adminLogin: (loginData) => {
    return apiClient.post('/auth/admin/login', loginData);
  },

  // Logout
  logout: () => {
    return apiClient.post('/auth/logout');
  },

  // Get current user
  getCurrentUser: () => {
    return apiClient.get('/auth/me');
  },

  // Resend verification code
  resendVerificationCode: (email) => {
    return apiClient.post(`/auth/resend-verification?email=${email}`);
  },

  // Password reset methods
  forgotPassword: (email) => {
    return apiClient.post('/auth/forgot-password', { email });
  },

  verifyResetCode: (email, resetCode) => {
    return apiClient.post('/auth/verify-reset-code', { email, resetCode });
  },

  resetPassword: (resetData) => {
    return apiClient.post('/auth/reset-password', resetData);
  },

  // Test endpoints
  getPublicData: () => {
    return apiClient.get('/test/public');
  },

  getProtectedData: () => {
    return apiClient.get('/test/protected');
  },

  getCustomerData: () => {
    return apiClient.get('/test/customer');
  },

  getWorkerData: () => {
    return apiClient.get('/test/worker');
  },

  // Profile endpoints
  getProfile: () => {
    return apiClient.get('/profile');
  },

  getCustomerProfile: () => {
    return apiClient.get('/profile/customer');
  },

  getWorkerProfile: () => {
    return apiClient.get('/profile/worker');
  },

  updateCustomerProfile: (profileData) => {
    return apiClient.put('/profile/customer', profileData);
  },

  updateCustomerProfileWithPhoto: (formData) => {
    return apiClient.put('/profile/customer-with-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  updateWorkerProfile: (profileData) => {
    return apiClient.put('/profile/worker', profileData);
  },

  updateWorkerProfileWithPhoto: (formData) => {
    return apiClient.put('/profile/worker-with-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Simplified service object for components
const authService = {
  // Authentication
  login: authAPI.login,
  adminLogin: authAPI.adminLogin,
  logout: authAPI.logout,
  getCurrentUser: authAPI.getCurrentUser,

  // Registration
  initiateSignup: authAPI.initiateSignup,
  initiateSignupWithPhoto: authAPI.initiateSignupWithPhoto,
  completeSignup: authAPI.completeSignup,
  completeSignupWithPhoto: authAPI.completeSignupWithPhoto,
  resendVerificationCode: authAPI.resendVerificationCode,

  // Password reset
  forgotPassword: authAPI.forgotPassword,
  verifyResetCode: authAPI.verifyResetCode,
  resetPassword: authAPI.resetPassword,

  // Profile
  getProfile: authAPI.getProfile,
  getCustomerProfile: authAPI.getCustomerProfile,
  getWorkerProfile: authAPI.getWorkerProfile,
  updateCustomerProfile: authAPI.updateCustomerProfile,
  updateCustomerProfileWithPhoto: authAPI.updateCustomerProfileWithPhoto,
  updateWorkerProfile: authAPI.updateWorkerProfile,
  updateWorkerProfileWithPhoto: authAPI.updateWorkerProfileWithPhoto,

  // Test endpoints
  getPublicData: authAPI.getPublicData,
  getProtectedData: authAPI.getProtectedData,
  getCustomerData: authAPI.getCustomerData,
  getWorkerData: authAPI.getWorkerData,
};

export default authService;
