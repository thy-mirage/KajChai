import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';

const ProtectedRoute = ({ children, requiredRole = null, showBackButton = true, title = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <div className="loading-spinner" style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }}></div>
        <p style={{ color: '#666', fontSize: '1.1rem', fontWeight: '500' }}>Loading...</p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // User doesn't have the required role
    return (
      <Layout showBackButton={false} title="Access Denied">
        <div className="access-denied" style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>Access Denied</h2>
          <p style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>You don't have permission to access this page.</p>
          <p style={{ marginBottom: '0.5rem', color: '#666' }}>Required role: <strong>{requiredRole}</strong></p>
          <p style={{ color: '#666' }}>Your role: <strong>{user?.role}</strong></p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton={showBackButton} title={title}>
      {children}
    </Layout>
  );
};

export default ProtectedRoute;
