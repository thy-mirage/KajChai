import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import hirePostService from '../services/hirePostService';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getUnreadCount } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
    { path: '/dashboard', label: 'Dashboard', icon: '🏠', description: 'Overview & Stats' },
    { path: '/create-post', label: 'Create Job', icon: '➕', description: 'Post a new job' },
    { path: '/jobs', label: 'Find Workers', icon: '🔍', description: 'Browse available workers' },
    { path: '/notifications', label: 'Notifications', icon: '🔔', description: 'View your notifications' },
    { path: '/chat', label: 'Messages', icon: '💬', description: 'Chat with workers' },
    { path: '/reviews', label: 'Reviews', icon: '💬', description: 'View and manage reviews' },
  ];

  const workerNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠', description: 'Overview & Stats' },
    { path: '/jobs', label: 'Available Jobs', icon: '💼', description: 'Find work opportunities' },
    { path: '/notifications', label: 'Notifications', icon: '🔔', description: 'View your notifications' },
    { path: '/chat', label: 'Messages', icon: '💬', description: 'Chat with customers' },
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
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* User Profile & Logout */}
        <div className="navbar-user">
          <div className="user-info" onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="user-avatar">
              <span className="avatar-text">
                {user.email?.charAt(0)?.toUpperCase() || 'U'}
              </span>
              <div className="user-status-dot"></div>
            </div>
            <div className="user-details">
              <span className="user-role">{user.role?.toLowerCase()}</span>
              <span className="user-email">{user.email}</span>
            </div>
            <div className="dropdown-arrow">▼</div>
          </div>
          
          {showUserMenu && (
            <div className="user-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-avatar">
                  <span>{user.email?.charAt(0)?.toUpperCase() || 'U'}</span>
                </div>
                <div className="dropdown-info">
                  <div className="dropdown-email">{user.email}</div>
                  <div className="dropdown-role">{user.role?.toLowerCase()}</div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <Link to="/my-profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                <span className="dropdown-icon">👤</span>
                <span>My Profile</span>
              </Link>
              <button className="dropdown-item logout-item" onClick={handleLogout}>
                <span className="dropdown-icon">🚪</span>
                <span>Sign Out</span>
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
