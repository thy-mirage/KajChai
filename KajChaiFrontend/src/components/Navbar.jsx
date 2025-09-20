import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import LanguageSwitcher from './LanguageSwitcher';
import hirePostService from '../services/hirePostService';
import workerDashboardService from '../services/workerDashboardService';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getUnreadCount } = useNotification();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const userInfoRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get unread count from NotificationContext
  useEffect(() => {
    if (user) {
      const updateCount = () => {
        const count = getUnreadCount();
        setUnreadCount(count);
      };
      
      updateCount(); // Initial update
      
      // Update every 2 seconds to sync with context
      const interval = setInterval(updateCount, 2000);
      
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [user, getUnreadCount]);

  // Get unread chat count for workers
  useEffect(() => {
    if (user?.role === 'WORKER') {
      const updateChatCount = async () => {
        try {
          const count = await workerDashboardService.getUnreadChatCount();
          setUnreadChatCount(count);
        } catch (error) {
          console.error('Error fetching unread chat count:', error);
          setUnreadChatCount(0);
        }
      };
      
      updateChatCount(); // Initial update
      
      // Update every 5 seconds
      const interval = setInterval(updateChatCount, 5000);
      
      return () => clearInterval(interval);
    } else {
      setUnreadChatCount(0);
    }
  }, [user]);

  // Adjust dropdown position to stay within viewport
  useEffect(() => {
    if (showUserMenu && dropdownRef.current && userInfoRef.current) {
      const dropdown = dropdownRef.current;
      const userInfo = userInfoRef.current;
      const rect = userInfo.getBoundingClientRect();
      const dropdownRect = dropdown.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      
      // If dropdown extends beyond right edge, adjust position
      if (rect.right + dropdownRect.width > viewportWidth - 20) {
        dropdown.style.right = '0px';
        dropdown.style.transform = `translateX(-${Math.min(50, (rect.right + dropdownRect.width) - viewportWidth + 20)}px)`;
      } else {
        dropdown.style.right = '0px';
        dropdown.style.transform = 'translateX(-10px)';
      }
    }
  }, [showUserMenu]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setShowUserMenu(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) return null;

  const customerNavItems = [
    { path: '/dashboard', label: t('navigation.dashboard'), icon: '🏠', description: 'Overview & Stats' },
    { path: '/create-post', label: t('navigation.createJob'), icon: '➕', description: 'Post a new job' },
    { path: '/jobs', label: t('navigation.findWorkers'), icon: '🔍', description: 'Browse available workers' },
    { path: '/forum', label: t('navigation.forum'), icon: '👥', description: 'Community forum' },
    { path: '/notifications', label: t('navigation.notifications'), icon: '🔔', description: 'View your notifications' },
    { path: '/reviews', label: t('navigation.reviews'), icon: '⭐', description: 'View and manage reviews' },
  ];

  const workerNavItems = [
    { path: '/dashboard', label: t('navigation.dashboard'), icon: '🏠', description: 'Overview & Stats' },
    { path: '/jobs', label: t('navigation.jobs'), icon: '💼', description: 'Find work opportunities' },
    { path: '/forum', label: t('navigation.forum'), icon: '👥', description: 'Community forum' },
    { path: '/notifications', label: t('navigation.notifications'), icon: '🔔', description: 'View your notifications' },
    { path: '/chat', label: t('navigation.messages'), icon: '💬', description: 'Chat with customers' },
  ];

  const navItems = user.role === 'CUSTOMER' ? customerNavItems : workerNavItems;

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo/Brand */}
        <div className="navbar-brand">
          <Link to="/dashboard" className="brand-link">
            <span className="brand-logo">🔧</span>
            <span className="brand-text">KajChai</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="navbar-menu">
          <ul className="navbar-nav">
            {navItems.map((item) => (
              <li key={item.path} className="nav-item">
                <Link
                  to={item.path}
                  className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  title={item.description}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.label}</span>
                  {item.path === '/notifications' && unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                  {item.path === '/chat' && user?.role === 'WORKER' && unreadChatCount > 0 && (
                    <span className="notification-badge">{unreadChatCount > 99 ? '99+' : unreadChatCount}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* User Profile & Language Switcher & Logout */}
        <div className="navbar-user">
          <LanguageSwitcher />
          <div className="user-info" ref={userInfoRef} onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="user-avatar">
              {user.photo ? (
                <img src={user.photo} alt={user.name || user.email} className="avatar-image" />
              ) : (
                <span className="avatar-text">
                  {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
              <div className="user-status-dot"></div>
            </div>
            <div className="user-details">
              <span className="user-role">{user.role?.toLowerCase()}</span>
              <span className="user-email">{user.name || user.email}</span>
            </div>
            <div className="dropdown-arrow">▼</div>
          </div>
          
          {showUserMenu && (
            <div className="user-dropdown" ref={dropdownRef}>
              <div className="dropdown-header">
                <div className="dropdown-avatar">
                  {user.photo ? (
                    <img src={user.photo} alt={user.name || user.email} className="dropdown-avatar-image" />
                  ) : (
                    <span>{user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className="dropdown-info">
                  <div className="dropdown-email">{user.email}</div>
                  <div className="dropdown-role">{user.role?.toLowerCase()}</div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <Link to="/my-profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                <span className="dropdown-icon">👤</span>
                <span>{t('navigation.profile')}</span>
              </Link>
              <button className="dropdown-item logout-item" onClick={handleLogout}>
                <span className="dropdown-icon">🚪</span>
                <span>{t('navigation.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showUserMenu && (
        <div className="dropdown-overlay" onClick={() => setShowUserMenu(false)}></div>
      )}
    </nav>
  );
};

export default Navbar;
