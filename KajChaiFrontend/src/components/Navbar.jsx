import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) return null;

  const customerNavItems = [
    { path: '/my-profile', label: 'My Profile', icon: '👤' },
    { path: '/notifications', label: 'Notifications', icon: '🔔' },
    { path: '/reviews', label: 'Reviews', icon: '⭐' },
    { path: '/hire-posts', label: 'HirePost', icon: '💼' },
    { path: '/forum', label: 'Forum', icon: '💬' },
    { path: '/work-history', label: 'Work History', icon: '📋' },
    { path: '/chat', label: 'Chat', icon: '💬' },
  ];

  const workerNavItems = [
    { path: '/my-profile', label: 'My Profile', icon: '👤' },
    { path: '/notifications', label: 'Notifications', icon: '🔔' },
    { path: '/hire-posts', label: 'HirePost', icon: '💼' },
    { path: '/forum', label: 'Forum', icon: '💬' },
    { path: '/working-history', label: 'Working History', icon: '📈' },
    { path: '/chat', label: 'Chat', icon: '💬' },
  ];

  const navItems = user.role === 'CUSTOMER' ? customerNavItems : workerNavItems;

  return (
    <nav className="navbar">
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
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* User Profile & Logout */}
        <div className="navbar-user">
          <div className="user-info">
            <div className="user-avatar">
              <span className="avatar-text">
                {user.email?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="user-details">
              <span className="user-role">{user.role?.toLowerCase()}</span>
              <span className="user-email">{user.email}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <span className="logout-icon">🚪</span>
            <span className="logout-text">Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
