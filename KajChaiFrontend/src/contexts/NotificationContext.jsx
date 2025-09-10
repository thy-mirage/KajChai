import React, { createContext, useContext, useState, useEffect } from 'react';
import NotificationPopup from '../components/NotificationPopup';
import hirePostService from '../services/hirePostService';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [popups, setPopups] = useState([]);
  const [lastNotificationCount, setLastNotificationCount] = useState(-1); // Start with -1 to indicate uninitialized
  const [unreadCount, setUnreadCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to show a popup notification
  const showNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const popup = { id, message, type, duration };
    
    console.log('NotificationContext: Showing popup:', popup);
    setPopups(prev => [...prev, popup]);
  };

  // Function to remove a popup
  const removePopup = (id) => {
    setPopups(prev => prev.filter(popup => popup.id !== id));
  };

  // Function to get unread count (for navbar)
  const getUnreadCount = () => {
    console.log('NotificationContext: Getting unread count:', unreadCount);
    return unreadCount;
  };

  // Poll for new notifications and show popup when count increases
  useEffect(() => {
    console.log('NotificationContext: Setting up polling effect');
    
    const checkForNewNotifications = async () => {
      try {
        console.log('NotificationContext: Starting notification check...');
    
    // Get unread count using hirePostService
    const countResponse = await hirePostService.getUnreadNotificationsCount();
    console.log('NotificationContext: API Response:', countResponse);
    
    // Extract count from the response object
    const currentCount = (countResponse && typeof countResponse.count !== 'undefined') 
      ? countResponse.count 
      : 0;
    
    console.log('NotificationContext: Current count:', currentCount, 'Last count:', lastNotificationCount, 'Is initialized:', isInitialized);
        
        // Update unread count
        setUnreadCount(currentCount);
        
        // Only show popup if we have established a baseline and count has increased
        if (isInitialized && currentCount > lastNotificationCount && lastNotificationCount >= 0) {
          const newNotificationsCount = currentCount - lastNotificationCount;
          console.log('NotificationContext: Detected new notifications:', newNotificationsCount);
          
          showNotification(
            `You have ${newNotificationsCount} new notification${newNotificationsCount > 1 ? 's' : ''}!`,
            'success',
            5000
          );
        }
        
        // Update last count and mark as initialized
        setLastNotificationCount(currentCount);
        if (!isInitialized) {
          setIsInitialized(true);
          console.log('NotificationContext: Initialized with count:', currentCount);
        }
        
      } catch (error) {
        console.error('NotificationContext: Failed to check notifications:', error);
      }
    };

    // Initialize immediately
    checkForNewNotifications();

    // Set up polling every 5 seconds for testing
    const interval = setInterval(checkForNewNotifications, 5000);

    return () => {
      console.log('NotificationContext: Cleaning up polling interval');
      clearInterval(interval);
    };
  }, [lastNotificationCount, isInitialized]);

  const value = {
    showNotification,
    getUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Render all popup notifications */}
      <div className="notification-container">
        {popups.map((popup, index) => (
          <div 
            key={popup.id} 
            style={{ 
              position: 'fixed', 
              top: `${20 + index * 80}px`, 
              right: '20px',
              zIndex: 9999
            }}
          >
            <NotificationPopup
              message={popup.message}
              type={popup.type}
              duration={popup.duration}
              onClose={() => removePopup(popup.id)}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
