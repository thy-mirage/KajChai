import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import adminService from '../services/adminService';
import complaintService from '../services/complaintService';
import { API_CONFIG } from '../config/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, getToken } = useAuth();
  const { t } = useTranslation();
  const [adminStats, setAdminStats] = useState({
    totalCustomers: 0,
    totalWorkers: 0,
    totalHirePosts: 0,
    totalForumPosts: 0,
    customerQA: 0,
    tipsAndProjects: 0,
    customerExperiences: 0
  });
  const [reminderData, setReminderData] = useState({
    forumComplaints: 0,
    userComplaints: 0,
    loading: true
  });

  useEffect(() => {
    fetchAdminData();
    fetchReminderData();
  }, []);

  const getCurrentUserToken = () => {
    return getToken ? getToken() : localStorage.getItem('token');
  };

  const fetchReminderData = async () => {
    try {
      setReminderData(prev => ({ ...prev, loading: true }));
      
      // Fetch forum complaint stats
      const forumResponse = await complaintService.admin.getComplaintStats();
      let forumPendingCount = 0;
      if (forumResponse && forumResponse.success) {
        forumPendingCount = forumResponse.data.pendingComplaints || 0;
      }

      // Fetch user complaint stats
      const userResponse = await fetch(`${API_CONFIG.BASE_URL}/api/admin/user-complaints`, {
        headers: {
          'Authorization': `Bearer ${getCurrentUserToken()}`,
          'Content-Type': 'application/json'
        }
      }).then(res => res.json());

      let userPendingCount = 0;
      if (userResponse && Array.isArray(userResponse)) {
        userPendingCount = userResponse.filter(c => c.status === 'PENDING').length;
      }

      setReminderData({
        forumComplaints: forumPendingCount,
        userComplaints: userPendingCount,
        loading: false
      });

    } catch (error) {
      console.error('Error fetching reminder data:', error);
      setReminderData({
        forumComplaints: 0,
        userComplaints: 0,
        loading: false
      });
    }
  };

  const fetchAdminData = async () => {
    try {
      // Fetch admin statistics
      const statsResponse = await adminService.getAdminStats();
      
      if (statsResponse.success) {
        const data = statsResponse.data;
        const postsBySection = data.postsBySection || {};
        
        setAdminStats({
          totalCustomers: data.totalCustomers || 0,
          totalWorkers: data.totalWorkers || 0,
          totalHirePosts: data.totalHirePosts || 0,
          totalForumPosts: data.totalPosts || 0,
          customerQA: postsBySection.CUSTOMER_QA || 0,
          tipsAndProjects: postsBySection.WORKER_TIPS_PROJECTS || 0,
          customerExperiences: postsBySection.CUSTOMER_EXPERIENCE || 0
        });
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const adminStatsArray = [
    {
      label: t('adminDashboard.totalCustomers'),
      value: adminStats.totalCustomers,
      icon: '🧑',
      color: '#3498db'
    },
    {
      label: t('adminDashboard.totalWorkers'),
      value: adminStats.totalWorkers,
      icon: '👷',
      color: '#f39c12'
    },
    {
      label: t('adminDashboard.totalHirePosts'),
      value: adminStats.totalHirePosts,
      icon: '📝',
      color: '#e74c3c'
    },
    {
      label: t('adminDashboard.totalForumPosts'),
      value: adminStats.totalForumPosts,
      icon: '💬',
      color: '#27ae60'
    }
  ];

  const forumStatsArray = [
    {
      label: t('adminDashboard.customerQA'),
      value: adminStats.customerQA,
      icon: '❓',
      color: '#9b59b6'
    },
    {
      label: t('adminDashboard.tipsAndProjects'),
      value: adminStats.tipsAndProjects,
      icon: '💡',
      color: '#34495e'
    },
    {
      label: t('adminDashboard.customerExperiences'),
      value: adminStats.customerExperiences,
      icon: '⭐',
      color: '#16a085'
    }
  ];

  const quickActions = [
    {
      title: t('adminDashboard.quickActions.manageForumComplaints'),
      description: t('adminDashboard.quickActions.manageForumComplaintsDesc'),
      icon: '💬',
      action: () => navigate('/admin/complaints')
    },
    {
      title: t('adminDashboard.quickActions.workerComplaintManagement'),
      description: t('adminDashboard.quickActions.workerComplaintManagementDesc'),
      icon: '👤',
      action: () => navigate('/admin/user-complaints')
    }
  ];

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1 className="page-title">{t('adminDashboard.title')}</h1>
        <p className="page-subtitle">{t('adminDashboard.subtitle')}</p>
      </div>

      {/* Stats Section */}
      <div className="stats-grid">
        {adminStatsArray.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Forum Stats Breakdown */}
      <div className="forum-stats">
        <h2 className="section-title">{t('adminDashboard.forumStats.title')}</h2>
        <div className="stats-grid">
          {forumStatsArray.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">{t('adminDashboard.quickActions.title')}</h2>
        <div className="actions-grid">
          {quickActions.map((action, index) => (
            <div key={index} className="action-card" onClick={action.action}>
              <div className="action-icon">{action.icon}</div>
              <h3>{action.title}</h3>
              <p>{action.description}</p>
              <button className="action-btn">
                {t('adminDashboard.quickActions.getStarted')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Reminder Section */}
      <div className="reminder-section">
        <h2 className="section-title">{t('adminDashboard.reminder.title')}</h2>
        <div className="reminder-list">
          {reminderData.loading ? (
            <div className="reminder-loading">
              <div className="loading-spinner"></div>
              <p>{t('common.loading')}</p>
            </div>
          ) : (
            <>
              {/* Forum Complaints Reminder */}
              <div className="reminder-item">
                <span className="reminder-icon">💬</span>
                <div className="reminder-content">
                  <div className="reminder-message">
                    {reminderData.forumComplaints > 0 ? (
                      t('adminDashboard.reminder.forumComplaintsPending', { count: reminderData.forumComplaints })
                    ) : (
                      t('adminDashboard.reminder.noForumComplaints')
                    )}
                  </div>
                  {reminderData.forumComplaints > 0 && (
                    <button 
                      className="reminder-action-btn"
                      onClick={() => navigate('/admin/complaints')}
                    >
                      {t('common.view')}
                    </button>
                  )}
                </div>
              </div>

              {/* User Complaints Reminder */}
              <div className="reminder-item">
                <span className="reminder-icon">👤</span>
                <div className="reminder-content">
                  <div className="reminder-message">
                    {reminderData.userComplaints > 0 ? (
                      t('adminDashboard.reminder.userComplaintsPending', { count: reminderData.userComplaints })
                    ) : (
                      t('adminDashboard.reminder.noUserComplaints')
                    )}
                  </div>
                  {reminderData.userComplaints > 0 && (
                    <button 
                      className="reminder-action-btn"
                      onClick={() => navigate('/admin/user-complaints')}
                    >
                      {t('common.view')}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;