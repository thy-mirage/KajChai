import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import hirePostService from '../services/hirePostService';
import './Notifications.css';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    setLoading(true);
    setError('');

    try {
      let data;
      if (filter === 'unread') {
        data = await hirePostService.getUnreadNotifications();
      } else {
        data = await hirePostService.getNotifications();
      }
      setNotifications(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await hirePostService.markNotificationAsRead(notificationId);
      loadNotifications(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await hirePostService.markAllNotificationsAsRead();
      loadNotifications(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await hirePostService.deleteNotification(notificationId);
        loadNotifications(); // Refresh the list
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete notification');
      }
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (diffMinutes < 1) {
      return `Just now • ${timeStr}`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago • ${timeStr}`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago • ${timeStr}`;
    } else if (diffDays === 1) {
      return `Today • ${timeStr}`;
    } else if (diffDays === 2) {
      return `Yesterday • ${timeStr}`;
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago • ${timeStr}`;
    } else {
      return `${date.toLocaleDateString()} • ${timeStr}`;
    }
  };

  if (!user || (user.role !== 'CUSTOMER' && user.role !== 'WORKER')) {
    return (
      <div className="access-denied">
        <p>Please log in to view notifications.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading notifications...</div>;
  }

  return (
    <div className="notifications">
      <div className="notifications-header">
        <h2>Your Notifications</h2>
        
        <div className="notifications-actions">
          <div className="filter-tabs">
            <button 
              className={`tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`tab ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread
            </button>
          </div>
          
          {notifications.some(n => n.status === 'UNREAD') && (
            <button 
              className="mark-all-read-btn"
              onClick={handleMarkAllAsRead}
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {notifications.length === 0 ? (
        <div className="no-notifications">
          <div className="no-notifications-icon">🔔</div>
          <h3>{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</h3>
          <p>You're all caught up! New notifications will appear here.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notification => (
            <div 
              key={notification.notificationId} 
              className={`notification-card ${notification.status === 'UNREAD' ? 'unread' : 'read'}`}
            >
              <div className="notification-content">
                <div className="notification-message">
                  {notification.message}
                </div>
                <div className="notification-time">
                  {formatDateTime(notification.notificationTime)}
                </div>
              </div>
              
              <div className="notification-actions">
                {notification.status === 'UNREAD' && (
                  <button 
                    className="mark-read-btn"
                    onClick={() => handleMarkAsRead(notification.notificationId)}
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteNotification(notification.notificationId)}
                  title="Delete notification"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
