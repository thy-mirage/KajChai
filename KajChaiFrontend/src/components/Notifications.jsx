import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import hirePostService from '../services/hirePostService';
import './Notifications.css';

const Notifications = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
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
      setError(err.response?.data?.message || t('notifications.failedToLoadNotifications'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await hirePostService.markNotificationAsRead(notificationId);
      loadNotifications(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || t('notifications.failedToMarkAsRead'));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await hirePostService.markAllNotificationsAsRead();
      loadNotifications(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || t('notifications.failedToMarkAllAsRead'));
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (window.confirm(t('notifications.confirmDeleteNotification'))) {
      try {
        await hirePostService.deleteNotification(notificationId);
        loadNotifications(); // Refresh the list
      } catch (err) {
        alert(err.response?.data?.message || t('notifications.failedToDeleteNotification'));
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
      return `${t('notifications.justNow')} • ${timeStr}`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}${t('notifications.minutesAgo')} • ${timeStr}`;
    } else if (diffHours < 24) {
      return `${diffHours}${t('notifications.hoursAgo')} • ${timeStr}`;
    } else if (diffDays === 1) {
      return `${t('notifications.today')} • ${timeStr}`;
    } else if (diffDays === 2) {
      return `${t('notifications.yesterday')} • ${timeStr}`;
    } else if (diffDays <= 7) {
      return `${diffDays - 1} ${t('notifications.daysAgo')} • ${timeStr}`;
    } else {
      return `${date.toLocaleDateString()} • ${timeStr}`;
    }
  };

  if (!user || (user.role !== 'CUSTOMER' && user.role !== 'WORKER')) {
    return (
      <div className="access-denied">
        <p>{t('notifications.pleaseLoginToView')}</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">{t('notifications.loadingNotifications')}</div>;
  }

  return (
    <div className="notifications">
      <div className="notifications-header">
        <h2>{t('notifications.yourNotifications')}</h2>
        
        <div className="notifications-actions">
          <div className="filter-tabs">
            <button 
              className={`tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              {t('notifications.all')}
            </button>
            <button 
              className={`tab ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              {t('notifications.unread')}
            </button>
          </div>
          
          {notifications.some(n => n.status === 'UNREAD') && (
            <button 
              className="mark-all-read-btn"
              onClick={handleMarkAllAsRead}
            >
              {t('notifications.markAllAsRead')}
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {notifications.length === 0 ? (
        <div className="no-notifications">
          <div className="no-notifications-icon">🔔</div>
          <h3>{filter === 'unread' ? t('notifications.noUnreadNotifications') : t('notifications.noNotificationsYet')}</h3>
          <p>{t('notifications.allCaughtUp')}</p>
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
                    title={t('notifications.markAsRead')}
                  >
                    ✓
                  </button>
                )}
                
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteNotification(notification.notificationId)}
                  title={t('notifications.deleteNotification')}
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
