import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/authService';

const AuthContext = createContext();

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

  // Helper function to clear authentication state
  const clearAuthState = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('jwt_token');
    sessionStorage.clear();
  };

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Listen for storage changes across tabs (for logout synchronization)
  useEffect(() => {
    const handleStorageChange = (event) => {
      // If JWT token was removed in another tab, logout this tab too
      if (event.key === 'jwt_token' && event.newValue === null) {
        console.log('Token removed in another tab, logging out...');
        setUser(null);
        setIsAuthenticated(false);
        sessionStorage.clear();
      }
      // If a logout event was triggered in another tab
      else if (event.key === 'auth_logout') {
        console.log('Logout event detected in another tab, logging out...');
        clearAuthState();
      }
      // If a new token was added in another tab, check auth status
      else if (event.key === 'jwt_token' && event.newValue !== null && !isAuthenticated) {
        console.log('New token detected in another tab, checking auth status...');
        checkAuthStatus();
      }
    };

    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      // Check if we have a token in localStorage
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await authAPI.getCurrentUser();
      if (response.success) {
        // Get detailed profile to fetch user ID
        const profileResponse = await authAPI.getProfile();
        let userId = null;
        let userName = null;
        
        if (profileResponse.success && profileResponse.data) {
          if (response.role === 'CUSTOMER') {
            userId = profileResponse.data.customerId;
            userName = profileResponse.data.customerName;
          } else if (response.role === 'WORKER') {
            userId = profileResponse.data.workerId;
            userName = profileResponse.data.name;
          }
        }
        
        setUser({
          email: response.email,
          role: response.role,
          userId: userId,
          name: userName
        });
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
        // Store JWT token in localStorage
        if (response.token) {
          localStorage.setItem('jwt_token', response.token);
        }
        
        // Get detailed profile to fetch user ID
        const profileResponse = await authAPI.getProfile();
        let userId = null;
        let userName = null;
        
        if (profileResponse.success && profileResponse.data) {
          if (response.role === 'CUSTOMER') {
            userId = profileResponse.data.customerId;
            userName = profileResponse.data.customerName;
          } else if (response.role === 'WORKER') {
            userId = profileResponse.data.workerId;
            userName = profileResponse.data.name;
          }
        }
        
        setUser({
          email: response.email,
          role: response.role,
          userId: userId,
          name: userName
        });
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
      // Clear authentication state
      clearAuthState();
      
      // Trigger a custom storage event for immediate cross-tab synchronization
      // This is needed because storage event doesn't fire in the same tab that made the change
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'auth_logout',
        newValue: Date.now().toString(),
        storageArea: localStorage
      }));
      
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
    completeSignup,
    resendVerificationCode,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
