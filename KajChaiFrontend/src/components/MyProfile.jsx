import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import CustomerProfile from './CustomerProfile';
import WorkerProfile from './WorkerProfile';

const MyProfile = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (!user) {
    return <div className="error">{t('profile.pleaseLogin')}</div>;
  }

  // Render the appropriate profile component based on user role
  if (user.role === 'CUSTOMER') {
    return <CustomerProfile />;
  } else if (user.role === 'WORKER') {
    return <WorkerProfile />;
  } else {
    return <div className="error">{t('profile.invalidUserRole')}</div>;
  }
};

export default MyProfile;
