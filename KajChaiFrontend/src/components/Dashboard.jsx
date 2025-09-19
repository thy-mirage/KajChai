import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import workerDashboardService from '../services/workerDashboardService';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [workerStatsData, setWorkerStatsData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'WORKER') {
      loadWorkerStats();
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

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning', 'Good Morning');
    if (hour < 17) return t('dashboard.goodAfternoon', 'Good Afternoon');
    return t('dashboard.goodEvening', 'Good Evening');
  };

  const customerStats = [
    { label: t('dashboard.activePosts', 'Active Posts'), value: '3', icon: '📝', color: '#3498db' },
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
      {loading && user?.role === 'WORKER' ? (
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
              <Link to="/create-post" className="action-card">
                <div className="action-icon">📝</div>
                <h3>{t('dashboard.postJob', 'Post a Job')}</h3>
                <p>{t('dashboard.postJobDesc', 'Create a new job posting and find skilled workers')}</p>
                <button className="action-btn">{t('jobs.createJob')}</button>
              </Link>
              <Link to="/jobs" className="action-card">
                <div className="action-icon">👥</div>
                <h3>{t('dashboard.browseWorkers', 'Browse Workers')}</h3>
                <p>{t('dashboard.browseWorkersDesc', 'Find and hire professional workers for your needs')}</p>
                <button className="action-btn">{t('common.browse', 'Browse')}</button>
              </Link>
              <Link to="/my-hire-posts" className="action-card">
                <div className="action-icon">📄</div>
                <h3>{t('jobs.myHirePosts')}</h3>
                <p>{t('dashboard.myHirePostsDesc', 'View and manage your created job posts')}</p>
                <button className="action-btn">{t('common.view', 'View')}</button>
              </Link>
              <Link to="/my-profile" className="action-card">
                <div className="action-icon">📋</div>
                <h3>{t('workers.viewProfile')}</h3>
                <p>{t('dashboard.viewProfileDesc', 'Check your profile and account information')}</p>
                <button className="action-btn">{t('workers.viewProfile')}</button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/current-works" className="action-card">
                <div className="action-icon">�</div>
                <h3>{t('dashboard.currentWorks', 'Current Works')}</h3>
                <p>{t('dashboard.currentWorksDesc', 'View your ongoing booked jobs and their details')}</p>
                <button className="action-btn">{t('dashboard.viewCurrentWorks', 'View Works')}</button>
              </Link>
              <Link to="/my-reviews" className="action-card">
                <div className="action-icon">⭐</div>
                <h3>{t('dashboard.myReviews', 'My Reviews')}</h3>
                <p>{t('dashboard.myReviewsDesc', 'See what customers are saying about your work')}</p>
                <button className="action-btn">{t('dashboard.viewReviews', 'View Reviews')}</button>
              </Link>
              <Link to="/past-jobs" className="action-card">
                <div className="action-icon">�</div>
                <h3>{t('dashboard.pastJobs', 'Past Jobs')}</h3>
                <p>{t('dashboard.pastJobsDesc', 'View your completed jobs and payment history')}</p>
                <button className="action-btn">{t('dashboard.viewPastJobs', 'View History')}</button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2 className="section-title">{t('dashboard.recentActivity')}</h2>
        <div className="activity-list">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">{activity.icon}</div>
              <div className="activity-content">
                <p className="activity-action">{activity.action}</p>
                <span className="activity-time">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
