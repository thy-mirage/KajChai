import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/authService';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [testResults, setTestResults] = useState({
    public: '',
    protected: '',
    roleSpecific: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Test API calls when component mounts
    testAPIEndpoints();
  }, [user]);

  const testAPIEndpoints = async () => {
    setLoading(true);
    
    try {
      // Test public endpoint
      const publicResult = await authAPI.getPublicData();
      setTestResults(prev => ({
        ...prev,
        public: publicResult || 'Success'
      }));

      // Test protected endpoint
      const protectedResult = await authAPI.getProtectedData();
      setTestResults(prev => ({
        ...prev,
        protected: protectedResult.message || 'Success'
      }));

      // Test role-specific endpoint
      if (user?.role === 'CUSTOMER') {
        const customerResult = await authAPI.getCustomerData();
        setTestResults(prev => ({
          ...prev,
          roleSpecific: customerResult.message || 'Customer access successful'
        }));
      } else if (user?.role === 'WORKER') {
        const workerResult = await authAPI.getWorkerData();
        setTestResults(prev => ({
          ...prev,
          roleSpecific: workerResult.message || 'Worker access successful'
        }));
      }
    } catch (error) {
      console.error('API Test Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome to KajChai Dashboard</h1>
          <p>You are successfully logged in!</p>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="user-info-card">
          <h2>Your Account Information</h2>
          <div className="user-details">
            <div className="detail-item">
              <strong>Email:</strong> {user?.email}
            </div>
            <div className="detail-item">
              <strong>Role:</strong> 
              <span className={`role-badge ${user?.role?.toLowerCase()}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        <div className="api-test-card">
          <h2>API Connectivity Test</h2>
          {loading ? (
            <div className="loading">Testing API endpoints...</div>
          ) : (
            <div className="test-results">
              <div className="test-item">
                <strong>Public Endpoint:</strong>
                <span className="test-result success">
                  {testResults.public || 'Not tested'}
                </span>
              </div>
              <div className="test-item">
                <strong>Protected Endpoint:</strong>
                <span className="test-result success">
                  {testResults.protected || 'Not tested'}
                </span>
              </div>
              <div className="test-item">
                <strong>{user?.role} Specific Endpoint:</strong>
                <span className="test-result success">
                  {testResults.roleSpecific || 'Not tested'}
                </span>
              </div>
            </div>
          )}
          <button onClick={testAPIEndpoints} className="test-button" disabled={loading}>
            {loading ? 'Testing...' : 'Retest APIs'}
          </button>
        </div>

        <div className="features-card">
          <h2>Available Features</h2>
          <div className="features-grid">
            <div className="feature-item">
              <h3>🔐 Secure Authentication</h3>
              <p>JWT-based authentication with HTTP-only cookies</p>
            </div>
            <div className="feature-item">
              <h3>✉️ Email Verification</h3>
              <p>Account verification through email codes</p>
            </div>
            <div className="feature-item">
              <h3>👥 Role-Based Access</h3>
              <p>Different access levels for Customers and Workers</p>
            </div>
            <div className="feature-item">
              <h3>🔄 Session Management</h3>
              <p>Automatic session handling and token refresh</p>
            </div>
          </div>
        </div>

        {user?.role === 'WORKER' && (
          <div className="worker-info-card">
            <h2>Worker Dashboard</h2>
            <p>Welcome to your worker dashboard! Here you can:</p>
            <ul>
              <li>Manage your job applications</li>
              <li>Update your skills and experience</li>
              <li>View customer requests</li>
              <li>Track your earnings</li>
            </ul>
          </div>
        )}

        {user?.role === 'CUSTOMER' && (
          <div className="customer-info-card">
            <h2>Customer Dashboard</h2>
            <p>Welcome to your customer dashboard! Here you can:</p>
            <ul>
              <li>Post job requirements</li>
              <li>Browse available workers</li>
              <li>Manage your bookings</li>
              <li>Rate and review workers</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
