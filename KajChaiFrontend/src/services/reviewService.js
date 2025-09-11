import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add request interceptor to handle authentication
apiClient.interceptors.request.use(
  (config) => {
    // Try to get token using the same logic as AuthContext
    let token = null;
    
    // Check if there's session storage data to identify the current user
    const sessionUser = sessionStorage.getItem('current_user_email');
    if (sessionUser) {
      token = localStorage.getItem(`jwt_token_${sessionUser}`);
    }
    
    // If no session user or token, check for generic token
    if (!token) {
      token = localStorage.getItem('jwt_token');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const reviewAPI = {
    // Get all worker fields
    getAllFields: () =>  {
        return apiClient.get('/review/fields');
    },

    // Load workers who completed jobs with the user
    getCompletedWorkers: () => {
        return apiClient.get('/review/workers/completed');
    },

    getWorkersByField: (field) => {
        return apiClient.get(`/review/workers/by-field?field=${encodeURIComponent(field)}`);
    },

    getWorkersByName: (name) => {
        return apiClient.get(`/review/workers/by-name?name=${encodeURIComponent(name)}`);
    },

    getWorkerReviews: (workerId) => {
        return apiClient.get(`/review/worker/${workerId}`);
    },

    submitReview: (reviewData) => {
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        };
        return apiClient.post('/review/submit', reviewData, config);
    },

    canReviewWorker: (workerId) => {
        return apiClient.get(`/review/can-review/${workerId}`);
    }
};

const reviewService = {
    getAllFields: reviewAPI.getAllFields,
    getCompletedWorkers: reviewAPI.getCompletedWorkers,
    getWorkersByField: reviewAPI.getWorkersByField,
    getWorkersByName: reviewAPI.getWorkersByName,
    getWorkerReviews: reviewAPI.getWorkerReviews,
    submitReview: reviewAPI.submitReview,
    canReviewWorker: reviewAPI.canReviewWorker
};

export default reviewService;