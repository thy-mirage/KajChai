import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Dashboard from './Dashboard';

const DashboardRouter = () => {
  const { user } = useAuth();

  // If user is an admin, redirect to admin dashboard
  if (user && user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // For regular users (WORKER, CUSTOMER), show regular dashboard
  return <Dashboard />;
};

export default DashboardRouter;