import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import HirePostList from './HirePostList';
import WorkerList from './WorkerList';

const JobsPage = () => {
  const { user } = useAuth();

  // Show different components based on user role
  if (user?.role === 'CUSTOMER') {
    return <WorkerList />;
  } else if (user?.role === 'WORKER') {
    return <HirePostList />;
  } else {
    return (
      <div className="loading">
        Loading...
      </div>
    );
  }
};

export default JobsPage;