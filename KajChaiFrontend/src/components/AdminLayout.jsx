import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const handleLogout = async () => {
    if (window.confirm(t('adminNavigation.logoutConfirm'))) {
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
      label: t('adminNavigation.dashboard'),
      path: '/admin/dashboard',
      icon: '🏠'
    },
    {
      label: t('adminNavigation.forumComplaints'),
      path: '/admin/complaints',
      icon: '📋'
    },
    {
      label: t('adminNavigation.userManagement'),
      path: '/admin/user-complaints',
      icon: '👥'
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
            {/* Language Switcher */}
            <div className="navbar-language">
              <LanguageSwitcher />
            </div>
            
            <div className="user-info">
              <span className="user-role">{t('adminNavigation.administrator')}</span>
              <span className="user-name">{user?.name || 'Admin'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="logout-btn"
              title={t('adminNavigation.signOut')}
            >
              <span className="logout-icon">🚪</span>
              <span className="logout-text">{t('adminNavigation.signOut')}</span>
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