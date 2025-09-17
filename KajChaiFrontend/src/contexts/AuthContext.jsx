import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/authService';

const AuthContext = createContext();

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Helper function to get user-specific token key
  const getTokenKey = (email) => {
    return email ? `jwt_token_${email}` : 'jwt_token';
  };

  // Helper function to clear authentication state
  const clearAuthState = (userEmail = null) => {
    const currentUserEmail = userEmail || (user && user.email);
    setUser(null);
    setIsAuthenticated(false);
    
    // Clear user-specific token from localStorage if email is available
    if (currentUserEmail) {
      localStorage.removeItem(getTokenKey(currentUserEmail));
    } else {
      // Fallback: remove generic token
      localStorage.removeItem('jwt_token');
    }
    
    sessionStorage.clear();
    // Also clean up any logout event data
    localStorage.removeItem('auth_logout_user');
  };

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Listen for storage changes across tabs (for logout synchronization only)
  useEffect(() => {
    const handleStorageChange = (event) => {
      // Handle user-specific token removal or generic token removal
      if (event.key && (event.key.startsWith('jwt_token_') || event.key === 'jwt_token') && event.newValue === null && isAuthenticated) {
        console.log('Token removed in another tab, checking if same user...');
        
        // If it's a user-specific token, extract the email
        let tokenUserEmail = null;
        if (event.key.startsWith('jwt_token_')) {
          tokenUserEmail = event.key.replace('jwt_token_', '');
        }
        
        // Check if there's a logout event with user info
        const logoutEvent = localStorage.getItem('auth_logout_user');
        if (logoutEvent) {
          try {
            const logoutData = JSON.parse(logoutEvent);
            // Only logout if it's the same user
            if (user && (logoutData.email === user.email || (tokenUserEmail && tokenUserEmail === user.email))) {
              console.log('Same user logged out in another tab, logging out...');
              setUser(null);
              setIsAuthenticated(false);
              sessionStorage.clear();
            }
          } catch (error) {
            console.error('Error parsing logout data:', error);
          }
        }
      }
      // If a logout event was triggered in another tab
      else if (event.key === 'auth_logout_user' && event.newValue) {
        try {
          const logoutData = JSON.parse(event.newValue);
          // Only logout if it's the same user who logged out in the other tab
          if (user && logoutData.email === user.email) {
            console.log('Same user logout event detected in another tab, logging out...');
            clearAuthState();
            sessionStorage.removeItem('current_user_email');
          }
        } catch (error) {
          console.error('Error parsing logout event data:', error);
        }
      }
      // Removed auto login synchronization to prevent account switching between tabs
    };

    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated, user]); // Add user as dependency

  // Cleanup logout events when page is unloaded
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clean up any logout event data when the page is closed
      localStorage.removeItem('auth_logout_user');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      // First, try to get user-specific tokens from localStorage
      let token = null;
      let userEmail = null;
      
      // Check if there's session storage data to identify the current user
      const sessionUser = sessionStorage.getItem('current_user_email');
      if (sessionUser) {
        userEmail = sessionUser;
        token = localStorage.getItem(getTokenKey(userEmail));
      }
      
      // If no session user or token, check for generic token
      if (!token) {
        token = localStorage.getItem('jwt_token');
      }
      
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await authAPI.getCurrentUser();
      if (response.success) {
        // Get detailed profile to fetch user ID and photo
        const profileResponse = await authAPI.getProfile();
        let userId = null;
        let userName = null;
        let userPhoto = null;
        
        if (profileResponse.success && profileResponse.data) {
          if (response.role === 'CUSTOMER') {
            userId = profileResponse.data.customerId;
            userName = profileResponse.data.customerName;
            userPhoto = profileResponse.data.photo;
          } else if (response.role === 'WORKER') {
            userId = profileResponse.data.workerId;
            userName = profileResponse.data.name;
            userPhoto = profileResponse.data.photo;
          }
        }
        
        const newUserData = {
          email: response.email,
          role: response.role,
          userId: userId,
          name: userName,
          photo: userPhoto
        };
        
        // Additional safety check: If there's already a user and it's different,
        // don't auto-switch accounts unless explicitly requested
        if (user && user.email && user.email !== newUserData.email) {
          console.log('Different user detected, not auto-switching accounts');
          // Clear the token as it belongs to a different user
          clearAuthState();
          setLoading(false);
          return;
        }
        
        // Store current user email in sessionStorage for this tab
        sessionStorage.setItem('current_user_email', response.email);
        
        // Migrate generic token to user-specific token if needed
        if (localStorage.getItem('jwt_token') && !localStorage.getItem(getTokenKey(response.email))) {
          localStorage.setItem(getTokenKey(response.email), token);
          localStorage.removeItem('jwt_token');
        }
        
        setUser(newUserData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log('Not authenticated');
      // Clear invalid token
      clearAuthState();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      if (response.success) {
        // Clear any previous authentication state for this tab
        clearAuthState();
        
        // Store JWT token with user-specific key in localStorage
        if (response.token) {
          localStorage.setItem(getTokenKey(response.email), response.token);
          // Also store in sessionStorage for this specific tab
          sessionStorage.setItem('current_user_email', response.email);
        }
        
        // Get detailed profile to fetch user ID and photo
        const profileResponse = await authAPI.getProfile();
        let userId = null;
        let userName = null;
        let userPhoto = null;
        
        if (profileResponse.success && profileResponse.data) {
          if (response.role === 'CUSTOMER') {
            userId = profileResponse.data.customerId;
            userName = profileResponse.data.customerName;
            userPhoto = profileResponse.data.photo;
          } else if (response.role === 'WORKER') {
            userId = profileResponse.data.workerId;
            userName = profileResponse.data.name;
            userPhoto = profileResponse.data.photo;
          }
        }
        
        const newUserData = {
          email: response.email,
          role: response.role,
          userId: userId,
          name: userName,
          photo: userPhoto
        };
        
        setUser(newUserData);
        setIsAuthenticated(true);
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if server logout fails, we still clear local state
    } finally {
      // Store user info before clearing state for cross-tab synchronization
      const currentUser = user;
      
      // Clear authentication state (will remove user-specific token)
      clearAuthState();
      
      // Clear session storage for this tab
      sessionStorage.removeItem('current_user_email');
      
      // Trigger a user-specific storage event for cross-tab synchronization
      if (currentUser && currentUser.email) {
        const logoutData = {
          email: currentUser.email,
          timestamp: Date.now()
        };
        
        localStorage.setItem('auth_logout_user', JSON.stringify(logoutData));
        
        // Remove the logout event after a short delay to allow other tabs to process it
        setTimeout(() => {
          localStorage.removeItem('auth_logout_user');
        }, 1000);
        
        // Also dispatch a custom storage event for immediate synchronization in the same browser
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'auth_logout_user',
          newValue: JSON.stringify(logoutData),
          storageArea: localStorage
        }));
      }
      
      return { success: true, message: 'Logged out successfully' };
    }
  };

  const initiateSignup = async (signupData) => {
    try {
      const response = await authAPI.initiateSignup(signupData);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Signup failed'
      };
    }
  };

  const initiateSignupWithPhoto = async (formData) => {
    try {
      const response = await authAPI.initiateSignupWithPhoto(formData);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Signup with photo failed'
      };
    }
  };

  const completeSignup = async (signupData, verificationCode) => {
    try {
      const response = await authAPI.completeSignup(signupData, verificationCode);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Verification failed'
      };
    }
  };

  const completeSignupWithPhoto = async (formData, verificationCode) => {
    try {
      const response = await authAPI.completeSignupWithPhoto(formData, verificationCode);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Verification with photo failed'
      };
    }
  };

  const resendVerificationCode = async (email) => {
    try {
      const response = await authAPI.resendVerificationCode(email);
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to resend code'
      };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    initiateSignup,
    initiateSignupWithPhoto,
    completeSignup,
    completeSignupWithPhoto,
    resendVerificationCode,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
