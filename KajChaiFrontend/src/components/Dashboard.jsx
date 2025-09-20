import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import workerDashboardService from '../services/workerDashboardService';
import customerDashboardService from '../services/customerDashboardService';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [workerStatsData, setWorkerStatsData] = useState(null);
  const [customerStatsData, setCustomerStatsData] = useState(null);
  const [reminderData, setReminderData] = useState({
    unreadChatCount: 0,
    unreadNotificationCount: 0,
    pendingBookingsCount: 0,
    pendingBookedWorksCount: 0,
    loading: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'WORKER') {
      loadWorkerStats();
      loadWorkerReminders();
    } else if (user?.role === 'CUSTOMER') {
      loadCustomerStats();
      loadCustomerReminders();
    }
  }, [user]);

  const loadWorkerStats = async () => {
    try {
      setLoading(true);
      const stats = await workerDashboardService.getWorkerDashboardStats();
      setWorkerStatsData(stats);
    } catch (error) {
      console.error('Error loading worker stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerStats = async () => {
    try {
      setLoading(true);
      const stats = await customerDashboardService.getCustomerDashboardStats();
      setCustomerStatsData(stats);
    } catch (error) {
      console.error('Error loading customer stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerReminders = async () => {
    try {
      setReminderData(prev => ({ ...prev, loading: true }));
      const reminders = await customerDashboardService.getCustomerReminders();
      setReminderData({
        unreadChatCount: reminders.unreadChatCount || 0,
        unreadNotificationCount: reminders.unreadNotificationCount || 0,
        pendingBookingsCount: reminders.pendingBookingsCount || 0,
        loading: false
      });
    } catch (error) {
      console.error('Error loading customer reminders:', error);
      setReminderData(prev => ({ ...prev, loading: false }));
    }
  };

  const loadWorkerReminders = async () => {
    try {
      setReminderData(prev => ({ ...prev, loading: true }));
      const reminders = await workerDashboardService.getWorkerReminders();
      setReminderData({
        unreadChatCount: reminders.unreadChatCount || 0,
        unreadNotificationCount: reminders.unreadNotificationCount || 0,
        pendingBookedWorksCount: reminders.pendingBookedWorksCount || 0,
        loading: false
      });
    } catch (error) {
      console.error('Error loading worker reminders:', error);
      setReminderData(prev => ({ ...prev, loading: false }));
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning', 'Good Morning');
    if (hour < 17) return t('dashboard.goodAfternoon', 'Good Afternoon');
    return t('dashboard.goodEvening', 'Good Evening');
  };

  const customerStats = customerStatsData ? [
    { label: t('dashboard.activeHirePosts', 'Active Hire Posts'), value: customerStatsData.activeHirePosts?.toString() || '0', icon: '📝', color: '#3498db' },
    { label: t('dashboard.completedJobs', 'Completed Jobs'), value: customerStatsData.completedJobs?.toString() || '0', icon: '✅', color: '#27ae60' },
    { label: t('dashboard.totalSpent', 'Total Spent'), value: `$${customerStatsData.totalSpent?.toFixed(2) || '0.00'}`, icon: '💰', color: '#f39c12' },
    { label: t('dashboard.reviewsGiven', 'Reviews Given'), value: customerStatsData.reviewsGiven?.toString() || '0', icon: '⭐', color: '#e74c3c' },
  ] : [
    { label: t('dashboard.activeHirePosts', 'Active Hire Posts'), value: '3', icon: '📝', color: '#3498db' },
    { label: t('dashboard.completedJobs', 'Completed Jobs'), value: '12', icon: '✅', color: '#27ae60' },
    { label: t('dashboard.totalSpent', 'Total Spent'), value: '$1,250', icon: '💰', color: '#f39c12' },
    { label: t('dashboard.reviewsGiven', 'Reviews Given'), value: '8', icon: '⭐', color: '#e74c3c' },
  ];

  const workerStats = workerStatsData ? [
    { label: t('dashboard.jobsCompleted', 'Jobs Completed'), value: workerStatsData.jobsCompleted?.toString() || '0', icon: '🔧', color: '#27ae60' },
    { label: t('dashboard.currentRating', 'Current Rating'), value: workerStatsData.currentRating?.toFixed(1) || '0.0', icon: '⭐', color: '#f39c12' },
    { label: t('dashboard.totalEarned', 'Total Earned'), value: `$${workerStatsData.totalEarned?.toFixed(2) || '0.00'}`, icon: '💰', color: '#3498db' },
    { label: t('dashboard.activeJobs', 'Active Jobs'), value: workerStatsData.activeJobs?.toString() || '0', icon: '📋', color: '#9b59b6' },
  ] : [
    { label: t('dashboard.jobsCompleted', 'Jobs Completed'), value: '27', icon: '🔧', color: '#27ae60' },
    { label: t('dashboard.currentRating', 'Current Rating'), value: '4.8', icon: '⭐', color: '#f39c12' },
    { label: t('dashboard.totalEarned', 'Total Earned'), value: '$3,450', icon: '💰', color: '#3498db' },
    { label: t('dashboard.activeJobs', 'Active Jobs'), value: '5', icon: '📋', color: '#9b59b6' },
  ];

  const stats = user?.role === 'CUSTOMER' ? customerStats : workerStats;

  const recentActivities = [
    { id: 1, action: t('dashboard.newJobApplication', 'New job application received'), time: t('dashboard.hoursAgo', '2 hours ago'), icon: '📩' },
    { id: 2, action: t('dashboard.paymentCompleted', 'Payment completed for plumbing work'), time: t('dashboard.dayAgo', '1 day ago'), icon: '💳' },
    { id: 3, action: t('dashboard.reviewSubmitted', 'Review submitted'), time: t('dashboard.daysAgo', '3 days ago'), icon: '⭐' },
    { id: 4, action: t('dashboard.profileUpdated', 'Profile updated'), time: t('dashboard.daysAgo5', '5 days ago'), icon: '👤' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1 className="welcome-title">
            {getWelcomeMessage()}, {user?.role === 'CUSTOMER' ? t('auth.customer') : t('auth.worker')}!
          </h1>
          <p className="welcome-subtitle">
            {t('dashboard.welcomeBack')} {user?.role === 'CUSTOMER' ? t('dashboard.customerDashboard') : t('dashboard.workerDashboard')}
          </p>
        </div>
        <div className="user-badge">
          <div className={`role-badge ${user?.role?.toLowerCase()}`}>
            {user?.role === 'CUSTOMER' ? '👤' : '🔧'} {user?.role}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="stats-grid">
          <div className="loading">{t('common.loading', 'Loading...')}</div>
        </div>
      ) : (
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stat.value}</h3>
                <p className="stat-label">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">{t('dashboard.quickActions')}</h2>
        <div className="actions-grid">
          {user?.role === 'CUSTOMER' ? (
            <>
              <div className="action-card">
                <div className="action-icon">📄</div>
                <h3>{t('jobs.myHirePosts')}</h3>
                <p>{t('dashboard.myHirePostsDesc', 'View and manage your created job posts')}</p>
                <Link to="/my-hire-posts" className="action-btn">{t('common.view', 'View')}</Link>
              </div>
              <div className="action-card">
                <div className="action-icon">
                  💬
                  {reminderData.unreadChatCount > 0 && (
                    <span className="unread-badge">{reminderData.unreadChatCount}</span>
                  )}
                </div>
                <h3>{t('dashboard.messages', 'Messages')}</h3>
                <p>{t('dashboard.messagesDesc', 'View and manage your conversations')}</p>
                <Link to="/chat" className="action-btn">{t('common.view', 'View')}</Link>
              </div>
            </>
          ) : (
            <>
              <div className="action-card">
                <div className="action-icon">📝</div>
                <h3>{t('dashboard.currentWorks', 'Current Works')}</h3>
                <p>{t('dashboard.currentWorksDesc', 'View your ongoing booked jobs and their details')}</p>
                <Link to="/current-works" className="action-btn">{t('dashboard.viewCurrentWorks', 'View Works')}</Link>
              </div>
              <div className="action-card">
                <div className="action-icon">⭐</div>
                <h3>{t('dashboard.myReviews', 'My Reviews')}</h3>
                <p>{t('dashboard.myReviewsDesc', 'See what customers are saying about your work')}</p>
                <Link to="/my-reviews" className="action-btn">{t('dashboard.viewReviews', 'View Reviews')}</Link>
              </div>
              <div className="action-card">
                <div className="action-icon">📜</div>
                <h3>{t('dashboard.pastJobs', 'Past Jobs')}</h3>
                <p>{t('dashboard.pastJobsDesc', 'View your completed jobs and payment history')}</p>
                <Link to="/past-jobs" className="action-btn">{t('dashboard.viewPastJobs', 'View History')}</Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity / Reminders */}
      {user?.role === 'CUSTOMER' ? (
        <div className="recent-activity">
          <h2 className="section-title">{t('dashboard.reminders', 'Reminders')}</h2>
          {reminderData.loading ? (
            <div className="loading">{t('common.loading', 'Loading...')}</div>
          ) : (
            <div className="reminder-list">
              <div className="reminder-item">
                <div className="reminder-icon">💬</div>
                <div className="reminder-content">
                  <p className="reminder-text">
                    {reminderData.unreadChatCount > 0 
                      ? t('dashboard.unreadMessages', {
                          count: reminderData.unreadChatCount,
                          defaultValue: `${reminderData.unreadChatCount} unread chat messages`
                        })
                      : t('dashboard.noUnreadMessages', 'No unread messages')
                    }
                  </p>
                  {reminderData.unreadChatCount > 0 && (
                    <Link to="/chat" className="action-btn">
                      {t('common.view', 'View')}
                    </Link>
                  )}
                  {reminderData.unreadChatCount === 0 && <span className="reminder-check">✅</span>}
                </div>
              </div>
              
              <div className="reminder-item">
                <div className="reminder-icon">🔔</div>
                <div className="reminder-content">
                  <p className="reminder-text">
                    {reminderData.unreadNotificationCount > 0 
                      ? t('dashboard.unreadNotifications', {
                          count: reminderData.unreadNotificationCount,
                          defaultValue: `${reminderData.unreadNotificationCount} unread notifications`
                        })
                      : t('dashboard.noNewNotifications', 'No new notifications')
                    }
                  </p>
                  {reminderData.unreadNotificationCount > 0 && (
                    <Link to="/notifications" className="action-btn">
                      {t('common.view', 'View')}
                    </Link>
                  )}
                  {reminderData.unreadNotificationCount === 0 && <span className="reminder-check">✅</span>}
                </div>
              </div>
              
              <div className="reminder-item">
                <div className="reminder-icon">📌</div>
                <div className="reminder-content">
                  <p className="reminder-text">
                    {reminderData.pendingBookingsCount > 0 
                      ? t('dashboard.pendingBookings', {
                          count: reminderData.pendingBookingsCount,
                          defaultValue: `${reminderData.pendingBookingsCount} bookings pending completion & payment`
                        })
                      : t('dashboard.allBookingsCompleted', 'All bookings are completed')
                    }
                  </p>
                  {reminderData.pendingBookingsCount > 0 && (
                    <Link to="/my-hire-posts" className="action-btn">
                      {t('common.view', 'View')}
                    </Link>
                  )}
                  {reminderData.pendingBookingsCount === 0 && <span className="reminder-check">✅</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="recent-activity">
          <h2 className="section-title">{t('dashboard.reminders', 'Reminders')}</h2>
          {reminderData.loading ? (
            <div className="loading">{t('common.loading', 'Loading...')}</div>
          ) : (
            <div className="reminder-list">
              <div className="reminder-item">
                <div className="reminder-icon">💬</div>
                <div className="reminder-content">
                  <p className="reminder-text">
                    {reminderData.unreadChatCount > 0 
                      ? t('dashboard.unreadMessages', {
                          count: reminderData.unreadChatCount,
                          defaultValue: `${reminderData.unreadChatCount} unread chat messages`
                        })
                      : t('dashboard.noUnreadMessages', 'No unread messages')
                    }
                  </p>
                  {reminderData.unreadChatCount > 0 && (
                    <Link to="/chat" className="action-btn">
                      {t('common.view', 'View')}
                    </Link>
                  )}
                  {reminderData.unreadChatCount === 0 && <span className="reminder-check">✅</span>}
                </div>
              </div>
              
              <div className="reminder-item">
                <div className="reminder-icon">🔔</div>
                <div className="reminder-content">
                  <p className="reminder-text">
                    {reminderData.unreadNotificationCount > 0 
                      ? t('dashboard.unreadNotifications', {
                          count: reminderData.unreadNotificationCount,
                          defaultValue: `${reminderData.unreadNotificationCount} unread notifications`
                        })
                      : t('dashboard.noNewNotifications', 'No new notifications')
                    }
                  </p>
                  {reminderData.unreadNotificationCount > 0 && (
                    <Link to="/notifications" className="action-btn">
                      {t('common.view', 'View')}
                    </Link>
                  )}
                  {reminderData.unreadNotificationCount === 0 && <span className="reminder-check">✅</span>}
                </div>
              </div>
              
              <div className="reminder-item">
                <div className="reminder-icon">📌</div>
                <div className="reminder-content">
                  <p className="reminder-text">
                    {reminderData.pendingBookedWorksCount > 0 
                      ? t('dashboard.pendingBookedWorks', {
                          count: reminderData.pendingBookedWorksCount,
                          defaultValue: `${reminderData.pendingBookedWorksCount} booked works pending completion`
                        })
                      : t('dashboard.allBookedWorksCompleted', 'All booked works are completed')
                    }
                  </p>
                  {reminderData.pendingBookedWorksCount > 0 && (
                    <Link to="/current-works" className="action-btn">
                      {t('common.view', 'View')}
                    </Link>
                  )}
                  {reminderData.pendingBookedWorksCount === 0 && <span className="reminder-check">✅</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
