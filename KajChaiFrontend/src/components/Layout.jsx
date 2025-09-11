import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import './Layout.css';

const Layout = ({ children, showBackButton = true, title = null }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const getPageTitle = () => {
    if (title) return title;
    
    const path = location.pathname;
    const titleMap = {
      '/dashboard': 'Dashboard',
      '/my-profile': 'My Profile',
      '/chat': 'Messages',
      '/create-post': 'Create Job Post',
      '/jobs': 'Available Jobs',
      '/notifications': 'Notifications',
    };
    
    return titleMap[path] || 'KajChai';
  };

  const shouldShowBackButton = showBackButton && location.pathname !== '/dashboard';

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <div className="content-wrapper">
          {(shouldShowBackButton || title) && (
            <div className="page-header">
              {shouldShowBackButton && (
                <button className="back-button" onClick={handleGoBack}>
                  <span className="back-icon">←</span>
                  <span className="back-text">Back</span>
                </button>
              )}
              {title && <h1 className="page-title">{getPageTitle()}</h1>}
            </div>
          )}
          <div className="page-content">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
