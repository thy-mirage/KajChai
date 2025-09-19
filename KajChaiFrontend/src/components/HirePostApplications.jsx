import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import hirePostService from '../services/hirePostService';
import reviewService from '../services/reviewService';
import './HirePost.css';

const HirePostApplications = () => {
  const { postId } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedWorkerReviews, setSelectedWorkerReviews] = useState([]);
  const [selectedWorkerName, setSelectedWorkerName] = useState('');
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    loadPostAndApplications();
  }, [postId]);

  const loadPostAndApplications = async () => {
    setLoading(true);
    setError('');

    try {
      const [postData, applicationsData] = await Promise.all([
        hirePostService.getHirePostById(postId),
        hirePostService.getApplicationsForPost(postId)
      ]);
      
      setPost(postData);
      setApplications(applicationsData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorker = async (workerId) => {
    if (window.confirm('Are you sure you want to select this worker? This will change the post status to BOOKED.')) {
      try {
        await hirePostService.selectWorkerForPost(postId, workerId);
        alert('Worker selected successfully!');
        loadPostAndApplications(); // Refresh data
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to select worker');
      }
    }
  };

  const handleOpenReviews = async (workerId, workerName) => {
    setLoadingReviews(true);
    setSelectedWorkerName(workerName);
    setShowReviewsModal(true);
    
    try {
      console.log('Fetching reviews for worker ID:', workerId);
      console.log('Worker ID type:', typeof workerId);
      
      const response = await reviewService.getWorkerReviews(workerId);
      console.log('Reviews API response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      
      if (response && response.data && response.data.success) {
        console.log('Reviews data:', response.data.data);
        console.log('Reviews data type:', typeof response.data.data);
        console.log('Reviews data length:', response.data.data ? response.data.data.length : 'undefined');
        setSelectedWorkerReviews(response.data.data || []);
      } else {
        console.log('API returned success: false or no response');
        console.log('Full response structure:', JSON.stringify(response, null, 2));
        setSelectedWorkerReviews([]);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
      console.error('Error details:', err.message);
      console.error('Error response:', err.response);
      setSelectedWorkerReviews([]);
      alert('Failed to load reviews');
    } finally {
      setLoadingReviews(false);
    }
  };

  const closeReviewsModal = () => {
    setShowReviewsModal(false);
    setSelectedWorkerReviews([]);
    setSelectedWorkerName('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) {
      return t('jobs.paymentNotSet');
    }
    return `৳${amount.toLocaleString()}`;
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span 
          key={i} 
          className={`star ${i <= rating ? 'filled' : ''}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  if (user?.role !== 'CUSTOMER') {
    return (
      <div className="access-denied">
        <p>Only customers can view hire post applications.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading applications...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="hire-post-applications">
      {post && (
        <div className="post-summary">
          <h2>Applications for: {post.field} Job</h2>
          <div className="post-info">
            <p><strong>Description:</strong> {post.description}</p>
            <p><strong>Payment:</strong> {formatCurrency(post.payment)}</p>
            <p><strong>Status:</strong> <span className={`status-${post.status.toLowerCase()}`}>{post.status}</span></p>
            {post.deadline && <p><strong>Deadline:</strong> {formatDate(post.deadline)}</p>}
          </div>
        </div>
      )}

      <div className="applications-section">
        <h3>Worker Applications ({applications.length})</h3>
        
        {applications.length === 0 ? (
          <div className="no-applications">
            No workers have applied to this job yet.
          </div>
        ) : (
          <div className="applications-list">
            {applications.map(application => (
              <div key={application.applicationId} className={`application-card ${application.isSelected ? 'selected-worker' : ''}`}>
                <div className="worker-header">
                  <div className="worker-basic-info">
                    {application.workerPhoto && (
                      <img 
                        src={application.workerPhoto} 
                        alt={application.workerName}
                        className="worker-photo"
                      />
                    )}
                    <div className="worker-name-rating">
                      <div className="worker-name-section">
                        <h4>{application.workerName}</h4>
                        {application.isSelected && (
                          <span className="selected-badge">✓ Selected</span>
                        )}
                      </div>
                      <div className="rating">
                        {renderStars(Math.round(application.averageRating))}
                        <span className="rating-text">
                          {application.averageRating.toFixed(1)} ({application.totalReviews} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="application-date">
                    Applied: {formatDate(application.applicationTime)}
                  </div>
                </div>

                <div className="worker-details">
                  <div className="detail-row">
                    <div className="detail-item">
                      <strong>Experience:</strong> {application.workerExperience} years
                    </div>
                    <div className="detail-item">
                      <strong>Field:</strong> {application.workerField}
                    </div>
                  </div>
                  
                  <div className="detail-row">
                    <div className="detail-item">
                      <strong>Location:</strong> {application.workerCity}, {application.workerUpazila}, {application.workerDistrict}
                    </div>
                    <div className="detail-item">
                      <strong>Phone:</strong> {application.workerPhone}
                    </div>
                  </div>
                </div>

                <div className="worker-stats">
                  <div className="stat">
                    <span className="stat-value">{application.totalReviews}</span>
                    <span className="stat-label">Total Reviews</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{application.averageRating.toFixed(1)}</span>
                    <span className="stat-label">{t('jobs.averageRating')}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{application.workerExperience}</span>
                    <span className="stat-label">{t('jobs.yearsExperience')}</span>
                  </div>
                </div>

                <div className="application-actions">
                  {post?.status === 'AVAILABLE' && (
                    <button 
                      className="btn-primary select-worker-btn"
                      onClick={() => handleSelectWorker(application.workerId)}
                    >
                      Select This Worker
                    </button>
                  )}
                  
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      // Navigate to chat with the worker
                      navigate(`/chat?workerId=${application.workerId}&workerName=${application.workerName}`);
                    }}
                  >
                    Contact Worker
                  </button>
                  
                  <button 
                    className="btn-secondary"
                    onClick={() => handleOpenReviews(application.workerId, application.workerName)}
                  >
                    {t('jobs.openReviews')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="back-to-posts">
        <button 
          className="btn-secondary"
          onClick={() => navigate('/jobs')}
        >
          Back to My Posts
        </button>
      </div>

      {/* Reviews Modal */}
      {showReviewsModal && (
        <div className="modal-overlay" onClick={closeReviewsModal}>
          <div className="modal-content reviews-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('jobs.reviewsFor')} {selectedWorkerName}</h3>
              <button className="modal-close" onClick={closeReviewsModal}>&times;</button>
            </div>
            
            <div className="modal-body">
              {loadingReviews ? (
                <div className="loading-reviews">{t('jobs.loadingReviews')}</div>
              ) : selectedWorkerReviews.length === 0 ? (
                <div className="no-reviews">
                  <p>{t('jobs.noReviewsAvailable')}</p>
                </div>
              ) : (
                <div className="reviews-list">
                  {selectedWorkerReviews.map((review, index) => (
                    <div key={review.reviewId || index} className="review-item">
                      <div className="review-header">
                        <div className="review-rating">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`star ${i < review.stars ? 'filled' : ''}`}>
                              ⭐
                            </span>
                          ))}
                          <span className="rating-text">({review.stars}/5)</span>
                        </div>
                        <div className="review-date">
                          {formatDate(review.reviewTime)}
                        </div>
                      </div>
                      
                      <div className="review-content">
                        <p>{review.message}</p>
                      </div>
                      
                      {review.customer && (
                        <div className="review-customer">
                          <small>By: {review.customer.customerName}</small>
                        </div>
                      )}
                      
                      {review.images && review.images.length > 0 && (
                        <div className="review-images">
                          {review.images.map((image, imgIndex) => (
                            <img 
                              key={imgIndex} 
                              src={image} 
                              alt={`Review image ${imgIndex + 1}`}
                              className="review-image"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HirePostApplications;
