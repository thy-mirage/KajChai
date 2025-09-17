import axios from 'axios';
import { adminAPI } from './adminService';

const API_BASE_URL = 'http://localhost:8080/api';

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

const complaintService = {
  // Upload evidence images for complaints
  uploadEvidenceImages: async (files) => {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await axios.post(
        `${API_BASE_URL}/forum/complaints/upload-evidence`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${getCurrentUserToken()}`
          }
        }
      );

      return {
        success: true,
        imageUrls: response.data.imageUrls,
        message: response.data.message || 'Images uploaded successfully'
      };
    } catch (error) {
      console.error('Error uploading evidence images:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload images';
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  // Submit a complaint about a forum post
  submitComplaint: async (postId, complaintData) => {
    try {
      const response = await apiClient.post(`/forum/posts/${postId}/complaint`, complaintData);
      return {
        success: true,
        data: response,
        message: 'Complaint submitted successfully'
      };
    } catch (error) {
      console.error('Error submitting complaint:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit complaint';
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  // Get user's own complaints
  getUserComplaints: async (page = 0, size = 10) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      });
      const response = await apiClient.get(`/forum/complaints?${params}`);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error fetching user complaints:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch complaints';
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  // Admin endpoints
  admin: {
    // Get all complaints for admin
    getAllComplaints: async (page = 0, size = 10, status = null, search = null) => {
      try {
        const response = await adminAPI.getAllComplaints(page, size, status, search);
        return {
          success: true,
          data: response.data,
          totalPages: response.totalPages,
          totalElements: response.totalElements
        };
      } catch (error) {
        console.error('Error fetching complaints:', error);
        const errorMessage = error.response?.data?.message || 'Failed to fetch complaints';
        return {
          success: false,
          error: errorMessage
        };
      }
    },

    // Get complaint statistics
    getComplaintStats: async () => {
      try {
        const response = await adminAPI.getComplaintStats();
        return {
          success: true,
          data: response
        };
      } catch (error) {
        console.error('Error fetching complaint stats:', error);
        const errorMessage = error.response?.data?.message || 'Failed to fetch complaint statistics';
        return {
          success: false,
          error: errorMessage
        };
      }
    },

    // Resolve a complaint
    resolveComplaint: async (complaintId, adminResponse, deletePost = false) => {
      try {
        const response = await adminAPI.resolveComplaint(complaintId, adminResponse, deletePost);
        return {
          success: true,
          data: response,
          message: 'Complaint resolved successfully'
        };
      } catch (error) {
        console.error('Error resolving complaint:', error);
        const errorMessage = error.response?.data?.message || 'Failed to resolve complaint';
        return {
          success: false,
          error: errorMessage
        };
      }
    },

    // Reject a complaint
    rejectComplaint: async (complaintId, adminResponse) => {
      try {
        const response = await adminAPI.rejectComplaint(complaintId, adminResponse);
        return {
          success: true,
          data: response,
          message: 'Complaint rejected successfully'
        };
      } catch (error) {
        console.error('Error rejecting complaint:', error);
        const errorMessage = error.response?.data?.message || 'Failed to reject complaint';
        return {
          success: false,
          error: errorMessage
        };
      }
    }
  }
};

export default complaintService;