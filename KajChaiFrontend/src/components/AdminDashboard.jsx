import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import adminService from '../services/adminService';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

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

      // Fetch recent activity
      const activityResponse = await adminService.getRecentActivity();
      
      if (activityResponse.success) {
        const activities = activityResponse.data || [];
        setRecentActivity(activities.map(activity => ({
          action: activity.action,
          time: activity.time,
          icon: activity.icon || '📝'
        })));
      } else {
        // Fallback to translated mock data if API fails
        setRecentActivity([
          {
            action: t('adminDashboard.recentActivities.newCustomerJoined'),
            time: '2 hours ago',
            icon: '👤'
          },
          {
            action: t('adminDashboard.recentActivities.newHirePostCreated'),
            time: '4 hours ago',
            icon: '📝'
          },
          {
            action: t('adminDashboard.recentActivities.newForumPost'),
            time: '6 hours ago',
            icon: '💬'
          },
          {
            action: t('adminDashboard.recentActivities.workerVerified'),
            time: '8 hours ago',
            icon: '✅'
          },
          {
            action: t('adminDashboard.recentActivities.customerExperienceShared'),
            time: '1 day ago',
            icon: '⭐'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      // Keep default values on error and set fallback recent activity
      setRecentActivity([
        {
          action: t('adminDashboard.recentActivities.newCustomerJoined'),
          time: '2 hours ago',
          icon: '👤'
        },
        {
          action: t('adminDashboard.recentActivities.newHirePostCreated'),
          time: '4 hours ago',
          icon: '📝'
        },
        {
          action: t('adminDashboard.recentActivities.newForumPost'),
          time: '6 hours ago',
          icon: '💬'
        }
      ]);
    }
  };

  const adminStatsArray = [
    {
      label: t('adminDashboard.totalCustomers'),
      value: adminStats.totalCustomers,
      icon: '�',
      color: '#3498db'
    },
    {
      label: t('adminDashboard.totalWorkers'),
      value: adminStats.totalWorkers,
      icon: '�',
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
    },
    {
      title: t('adminDashboard.quickActions.systemReports'),
      description: t('adminDashboard.quickActions.systemReportsDesc'),
      icon: '📊',
      action: () => console.log('System reports coming soon')
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

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2 className="section-title">{t('adminDashboard.recentActivity.title')}</h2>
        <div className="activity-list">
          {recentActivity.map((activity, index) => (
            <div key={index} className="activity-item">
              <span className="activity-icon">{activity.icon}</span>
              <div className="activity-content">
                <div className="activity-action">{activity.action}</div>
                <div className="activity-time">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;