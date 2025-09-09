import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import CustomerProfile from './CustomerProfile';
import WorkerProfile from './WorkerProfile';

const MyProfile = () => {
  const { user } = useAuth();

  if (!user) {
    return <div className="error">Please log in to view your profile.</div>;
  }

  // Render the appropriate profile component based on user role
  if (user.role === 'CUSTOMER') {
    return <CustomerProfile />;
  } else if (user.role === 'WORKER') {
    return <WorkerProfile />;
  } else {
    return <div className="error">Invalid user role.</div>;
  }
};

export default MyProfile;
