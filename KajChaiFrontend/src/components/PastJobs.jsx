import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import workerDashboardService from '../services/workerDashboardService';
import './HirePost.css'; // Reuse existing styles

const PastJobs = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [pastJobs, setPastJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'WORKER') {
      loadPastJobs();
    }
  }, [user]);

  const loadPastJobs = async () => {
    try {
      setLoading(true);
      setError('');
      const jobs = await workerDashboardService.getPastJobs();
      setPastJobs(jobs);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFieldTranslation = (field) => {
    if (!field) return '';
    const fieldKey = field.toLowerCase();
    return t(`workers.${fieldKey}`, field);
  };

  const calculateTotalEarnings = () => {
    return pastJobs.reduce((total, job) => total + (job.payment || 0), 0);
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
        <h3>{t('dashboard.pastJobs', 'Past Jobs')}</h3>
        <p>{t('dashboard.pastJobsSubtext', 'Your completed jobs and payment history')}</p>
        
        {pastJobs.length > 0 && (
          <div className="earnings-summary">
            <div className="summary-card">
              <div className="summary-item">
                <span className="summary-label">{t('dashboard.totalCompleted', 'Total Completed')}:</span>
                <span className="summary-value">{pastJobs.length} {t('dashboard.jobs', 'jobs')}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">{t('dashboard.totalEarned', 'Total Earned')}:</span>
                <span className="summary-value earnings">${calculateTotalEarnings().toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {pastJobs.length === 0 ? (
        <div className="no-posts">
          <div className="no-posts-icon">📋</div>
          <h4>{t('dashboard.noPastJobs', 'No Past Jobs')}</h4>
          <p>{t('dashboard.noPastJobsDesc', 'You haven\'t completed any jobs yet.')}</p>
        </div>
      ) : (
        <div className="posts-grid">
          {pastJobs.map(job => (
            <div key={job.postId} className="hire-post-card">
              <div className="card-header">
                <div className="field-badge">{getFieldTranslation(job.field)}</div>
                <div className="status-badge completed">
                  {t('jobs.completed', 'Completed')}
                </div>
                {job.payment && (
                  <div className="payment-badge">
                    ${job.payment.toFixed(2)}
                  </div>
                )}
              </div>
              
              <div className="card-content">
                <div className="post-description">
                  <h4>{t('jobs.jobDescription', 'Job Description')}</h4>
                  <p>{job.description}</p>
                </div>
                
                <div className="post-details">
                  <div className="detail-item">
                    <span className="detail-label">{t('jobs.deadline', 'Deadline')}:</span>
                    <span className="detail-value">{formatDate(job.deadline)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t('jobs.postedOn', 'Posted On')}:</span>
                    <span className="detail-value">{formatDate(job.postTime)}</span>
                  </div>
                  {job.payment && (
                    <div className="detail-item">
                      <span className="detail-label">{t('jobs.payment', 'Payment')}:</span>
                      <span className="detail-value payment-amount">${job.payment.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Customer Information */}
                <div className="customer-info">
                  <h5>{t('jobs.customerInfo', 'Customer Information')}</h5>
                  <div className="customer-details">
                    <div className="customer-avatar">
                      {job.customerPhoto ? (
                        <img 
                          src={job.customerPhoto} 
                          alt={job.customerName}
                          className="customer-photo"
                        />
                      ) : (
                        <div className="customer-avatar-fallback">
                          {job.customerName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div className="customer-text">
                      <p className="customer-name">{job.customerName}</p>
                      <p className="customer-location">
                        📍 {job.customerUpazila && job.customerDistrict && job.customerUpazila !== job.customerDistrict 
                          ? `${job.customerUpazila}, ${job.customerDistrict}`
                          : job.customerUpazila || job.customerDistrict || job.customerCity}
                      </p>
                      <p className="customer-phone">📞 {job.customerPhone}</p>
                    </div>
                  </div>
                </div>

                {/* Images if available */}
                {job.images && job.images.length > 0 && (
                  <div className="post-images">
                    <h5>{t('jobs.attachedImages', 'Attached Images')}</h5>
                    <div className="images-grid">
                      {job.images.map((image, index) => (
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

export default PastJobs;