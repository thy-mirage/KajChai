import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logout();
        navigate('/admin/login');
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/admin/dashboard',
      icon: '🏠'
    },
    {
      label: 'Forum Complaints',
      path: '/admin/complaints',
      icon: '📋'
    },
    {
      label: 'User Management',
      path: '/admin/users',
      icon: '👥'
    },
    {
      label: 'System Reports',
      path: '/admin/reports',
      icon: '📊'
    }
  ];

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="admin-layout">
      {/* Admin Navbar */}
      <nav className="admin-navbar">
        <div className="navbar-content">
          {/* Logo/Brand */}
          <div className="navbar-brand">
            <span className="brand-logo">⚡</span>
            <span className="brand-text">KajChai Admin</span>
          </div>

          {/* Navigation Links */}
          <div className="navbar-nav">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`nav-item ${isActivePath(item.path) ? 'active' : ''}`}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </div>

          {/* User Info & Logout */}
          <div className="navbar-user">
            <div className="user-info">
              <span className="user-role">Administrator</span>
              <span className="user-name">{user?.name || 'Admin'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="logout-btn"
              title="Sign Out"
            >
              <span className="logout-icon">🚪</span>
              <span className="logout-text">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;