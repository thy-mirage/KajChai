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

export const forumAPI = {
  // Create a new forum post
  createPost: (postData) => {
    return apiClient.post('/forum/posts', postData);
  },

  // Get posts with filtering and sorting
  getPosts: (section, category = null, sortBy = 'recent', myPosts = false, page = 0, size = 10) => {
    const params = new URLSearchParams({
      section,
      sortBy,
      myPosts: myPosts.toString(),
      page: page.toString(),
      size: size.toString(),
    });
    
    if (category) {
      params.append('category', category);
    }
    
    return apiClient.get(`/forum/posts?${params}`);
  },

  // Get single post by ID
  getPost: (postId) => {
    return apiClient.get(`/forum/posts/${postId}`);
  },

  // Add comment to a post
  addComment: (postId, commentData) => {
    return apiClient.post(`/forum/posts/${postId}/comments`, commentData);
  },

  // Get comments for a post
  getComments: (postId) => {
    return apiClient.get(`/forum/posts/${postId}/comments`);
  },

  // Like a post
  toggleLike: (postId, isLike) => {
    return apiClient.post(`/forum/posts/${postId}/like`, { isLike });
  },

  // Get available categories for a section
  getCategories: (section) => {
    return apiClient.get(`/forum/categories?section=${section}`);
  },
};

export default forumAPI;