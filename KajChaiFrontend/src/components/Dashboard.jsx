import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const customerStats = [
    { label: 'Active Posts', value: '3', icon: '📝', color: '#3498db' },
    { label: 'Completed Jobs', value: '12', icon: '✅', color: '#27ae60' },
    { label: 'Total Spent', value: '$1,250', icon: '💰', color: '#f39c12' },
    { label: 'Reviews Given', value: '8', icon: '⭐', color: '#e74c3c' },
  ];

  const workerStats = [
    { label: 'Jobs Completed', value: '27', icon: '🔧', color: '#27ae60' },
    { label: 'Current Rating', value: '4.8', icon: '⭐', color: '#f39c12' },
    { label: 'Total Earned', value: '$3,450', icon: '💰', color: '#3498db' },
    { label: 'Active Bids', value: '5', icon: '📋', color: '#9b59b6' },
  ];

  const stats = user?.role === 'CUSTOMER' ? customerStats : workerStats;

  const recentActivities = [
    { id: 1, action: 'New job application received', time: '2 hours ago', icon: '📩' },
    { id: 2, action: 'Payment completed for plumbing work', time: '1 day ago', icon: '💳' },
    { id: 3, action: 'Review submitted', time: '3 days ago', icon: '⭐' },
    { id: 4, action: 'Profile updated', time: '5 days ago', icon: '👤' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1 className="welcome-title">
            {getWelcomeMessage()}, {user?.role === 'CUSTOMER' ? 'Customer' : 'Worker'}!
          </h1>
          <p className="welcome-subtitle">
            Welcome back to your {user?.role === 'CUSTOMER' ? 'KajChai customer' : 'KajChai worker'} dashboard
          </p>
        </div>
        <div className="user-badge">
          <div className={`role-badge ${user?.role?.toLowerCase()}`}>
            {user?.role === 'CUSTOMER' ? '👤' : '🔧'} {user?.role}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          {user?.role === 'CUSTOMER' ? (
            <>
              <Link to="/create-post" className="action-card">
                <div className="action-icon">📝</div>
                <h3>Post a Job</h3>
                <p>Create a new job posting and find skilled workers</p>
                <button className="action-btn">Create Post</button>
              </Link>
              <Link to="/jobs" className="action-card">
                <div className="action-icon">👥</div>
                <h3>Browse Workers</h3>
                <p>Find and hire professional workers for your needs</p>
                <button className="action-btn">Browse</button>
              </Link>
              <Link to="/my-profile" className="action-card">
                <div className="action-icon">📋</div>
                <h3>View Profile</h3>
                <p>Check your profile and account information</p>
                <button className="action-btn">View Profile</button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/jobs" className="action-card">
                <div className="action-icon">🔍</div>
                <h3>Find Jobs</h3>
                <p>Browse available jobs that match your skills</p>
                <button className="action-btn">Find Jobs</button>
              </Link>
              <Link to="/my-profile" className="action-card">
                <div className="action-icon">📊</div>
                <h3>My Profile</h3>
                <p>Track your ratings, earnings and job completion</p>
                <button className="action-btn">View Profile</button>
              </Link>
              <Link to="/notifications" className="action-card">
                <div className="action-icon">💼</div>
                <h3>Notifications</h3>
                <p>View your latest notifications and updates</p>
                <button className="action-btn">View Notifications</button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2 className="section-title">Recent Activity</h2>
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
