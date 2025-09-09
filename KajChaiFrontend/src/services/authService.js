import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for sending cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

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

  // Complete signup with verification
  completeSignup: (signupData, verificationCode) => {
    return apiClient.post(`/auth/signup/verify?verificationCode=${verificationCode}`, signupData);
  },

  // Login
  login: (loginData) => {
    return apiClient.post('/auth/login', loginData);
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
};

// Simplified service object for components
const authService = {
  // Authentication
  login: authAPI.login,
  logout: authAPI.logout,
  getCurrentUser: authAPI.getCurrentUser,

  // Registration
  initiateSignup: authAPI.initiateSignup,
  completeSignup: authAPI.completeSignup,
  resendVerificationCode: authAPI.resendVerificationCode,

  // Password reset
  forgotPassword: authAPI.forgotPassword,
  verifyResetCode: authAPI.verifyResetCode,
  resetPassword: authAPI.resetPassword,

  // Test endpoints
  getPublicData: authAPI.getPublicData,
  getProtectedData: authAPI.getProtectedData,
  getCustomerData: authAPI.getCustomerData,
  getWorkerData: authAPI.getWorkerData,
};

export default authService;
