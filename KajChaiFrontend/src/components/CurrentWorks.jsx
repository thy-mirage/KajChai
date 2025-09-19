import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import workerDashboardService from '../services/workerDashboardService';
import './HirePost.css'; // Reuse existing styles

const CurrentWorks = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [currentWorks, setCurrentWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'WORKER') {
      loadCurrentWorks();
    }
  }, [user]);

  const loadCurrentWorks = async () => {
    try {
      setLoading(true);
      setError('');
      const works = await workerDashboardService.getCurrentWorks();
      setCurrentWorks(works);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getFieldTranslation = (field) => {
    if (!field) return '';
    const fieldKey = field.toLowerCase();
    return t(`workers.${fieldKey}`, field);
  };

  if (user?.role !== 'WORKER') {
    return (
      <div className="access-denied">
        <h3>{t('common.error')}</h3>
        <p>Only workers can view this page.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="hire-post-list">
      <div className="list-header">
        <h3>{t('dashboard.currentWorks', 'Current Works')}</h3>
        <p>{t('dashboard.currentWorksSubtext', 'Your ongoing booked jobs')}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {currentWorks.length === 0 ? (
        <div className="no-posts">
          <div className="no-posts-icon">💼</div>
          <h4>{t('dashboard.noCurrentWorks', 'No Current Works')}</h4>
          <p>{t('dashboard.noCurrentWorksDesc', 'You don\'t have any ongoing jobs at the moment.')}</p>
        </div>
      ) : (
        <div className="posts-grid">
          {currentWorks.map(work => (
            <div key={work.postId} className="hire-post-card">
              <div className="card-header">
                <div className="field-badge">{getFieldTranslation(work.field)}</div>
                <div className="status-badge booked">
                  {t('jobs.booked', 'Booked')}
                </div>
              </div>
              
              <div className="card-content">
                <div className="post-description">
                  <h4>{t('jobs.jobDescription', 'Job Description')}</h4>
                  <p>{work.description}</p>
                </div>
                
                <div className="post-details">
                  <div className="detail-item">
                    <span className="detail-label">{t('jobs.deadline', 'Deadline')}:</span>
                    <span className="detail-value">{formatDate(work.deadline)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t('jobs.postedOn', 'Posted On')}:</span>
                    <span className="detail-value">{formatDate(work.postTime)}</span>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="customer-info">
                  <h5>{t('jobs.customerInfo', 'Customer Information')}</h5>
                  <div className="customer-details">
                    <div className="customer-avatar">
                      {work.customerPhoto ? (
                        <img 
                          src={work.customerPhoto} 
                          alt={work.customerName}
                          className="customer-photo"
                        />
                      ) : (
                        <div className="customer-avatar-fallback">
                          {work.customerName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div className="customer-text">
                      <p className="customer-name">{work.customerName}</p>
                      <p className="customer-location">
                        📍 {work.customerUpazila && work.customerDistrict && work.customerUpazila !== work.customerDistrict 
                          ? `${work.customerUpazila}, ${work.customerDistrict}`
                          : work.customerUpazila || work.customerDistrict || work.customerCity}
                      </p>
                      <p className="customer-phone">📞 {work.customerPhone}</p>
                    </div>
                  </div>
                </div>

                {/* Images if available */}
                {work.images && work.images.length > 0 && (
                  <div className="post-images">
                    <h5>{t('jobs.attachedImages', 'Attached Images')}</h5>
                    <div className="images-grid">
                      {work.images.map((image, index) => (
                        <img 
                          key={index}
                          src={image} 
                          alt={`Job image ${index + 1}`}
                          className="post-image"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CurrentWorks;