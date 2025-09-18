import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0
  });

  useEffect(() => {
    // Mock data - replace with actual API calls
    setAdminStats({
      totalUsers: 1250,
      totalComplaints: 45,
      pendingComplaints: 12,
      resolvedComplaints: 33
    });
  }, []);

  const adminStatsArray = [
    {
      label: 'Total Users',
      value: adminStats.totalUsers,
      icon: '👥',
      color: '#3498db'
    },
    {
      label: 'Total Complaints',
      value: adminStats.totalComplaints,
      icon: '📋',
      color: '#f39c12'
    },
    {
      label: 'Pending Complaints',
      value: adminStats.pendingComplaints,
      icon: '⏳',
      color: '#e74c3c'
    },
    {
      label: 'Resolved Complaints',
      value: adminStats.resolvedComplaints,
      icon: '✅',
      color: '#27ae60'
    }
  ];

  const quickActions = [
    {
      title: 'Manage Forum Complaints',
      description: 'View and manage forum-related complaints from users',
      icon: '💬',
      action: () => navigate('/admin/complaints')
    },
    {
      title: 'Worker Complaint Management',
      description: 'Manage customer complaints against workers, ban/restrict workers',
      icon: '👤',
      action: () => navigate('/admin/user-complaints')
    },
    {
      title: 'System Reports',
      description: 'View system analytics, reports and platform statistics',
      icon: '📊',
      action: () => console.log('System reports coming soon')
    }
  ];

  const recentActivity = [
    {
      action: 'New forum complaint received',
      time: '2 hours ago',
      icon: '📝'
    },
    {
      action: 'Complaint #123 resolved',
      time: '5 hours ago',
      icon: '✅'
    },
    {
      action: 'New user registered',
      time: '1 day ago',
      icon: '👤'
    },
    {
      action: 'Forum post reported',
      time: '2 days ago',
      icon: '⚠️'
    }
  ];

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Manage the KajChai platform and monitor system activities</p>
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

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          {quickActions.map((action, index) => (
            <div key={index} className="action-card" onClick={action.action}>
              <div className="action-icon">{action.icon}</div>
              <h3>{action.title}</h3>
              <p>{action.description}</p>
              <button className="action-btn">
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2 className="section-title">Recent Activity</h2>
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