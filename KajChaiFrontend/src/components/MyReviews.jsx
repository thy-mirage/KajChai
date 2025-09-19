import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import workerDashboardService from '../services/workerDashboardService';
import './Review.css'; // Reuse existing review styles

const MyReviews = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'WORKER') {
      loadMyReviews();
    }
  }, [user]);

  const loadMyReviews = async () => {
    try {
      setLoading(true);
      setError('');
      const reviewsData = await workerDashboardService.getMyReviews();
      setReviews(reviewsData);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
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
    return <div className="stars-container">{stars}</div>;
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
    <div className="reviews-page">
      <div className="reviews-header">
        <h2>{t('dashboard.myReviews', 'My Reviews')}</h2>
        <p>{t('dashboard.myReviewsSubtext', 'See what customers are saying about your work')}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {reviews.length === 0 ? (
        <div className="no-reviews">
          <div className="no-reviews-icon">⭐</div>
          <h3>{t('reviews.noReviewsYet', 'No Reviews Yet')}</h3>
          <p>{t('dashboard.noReviewsDesc', 'You haven\'t received any reviews yet. Complete more jobs to get your first review!')}</p>
        </div>
      ) : (
        <div className="reviews-grid">
          {reviews.map(review => (
            <div key={review.reviewId} className="review-card">
              <div className="review-header">
                <div className="customer-info">
                  <div className="customer-avatar">
                    {review.customer?.photo ? (
                      <img 
                        src={review.customer.photo} 
                        alt={review.customer.customerName}
                        className="customer-photo"
                      />
                    ) : (
                      <div className="customer-avatar-fallback">
                        {review.customer?.customerName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="customer-details">
                    <h4 className="customer-name">{review.customer?.customerName || 'Anonymous'}</h4>
                    <p className="review-date">{formatDate(review.reviewTime)}</p>
                  </div>
                </div>
                <div className="review-rating">
                  {renderStars(review.stars)}
                  <span className="rating-number">({review.stars}/5)</span>
                </div>
              </div>
              
              <div className="review-content">
                <p className="review-message">{review.message}</p>
              </div>

              {/* Review images if available */}
              {review.images && review.images.length > 0 && (
                <div className="review-images">
                  <div className="images-grid">
                    {review.images.map((image, index) => (
                      <img 
                        key={index}
                        src={image} 
                        alt={`Review image ${index + 1}`}
                        className="review-image"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {reviews.length > 0 && (
        <div className="reviews-summary">
          <div className="summary-card">
            <h3>{t('reviews.reviewsSummary', 'Reviews Summary')}</h3>
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-number">{reviews.length}</span>
                <span className="stat-label">{t('reviews.totalReviews', 'Total Reviews')}</span>
              </div>
              <div className="stat">
                <span className="stat-number">
                  {(reviews.reduce((sum, review) => sum + review.stars, 0) / reviews.length).toFixed(1)}
                </span>
                <span className="stat-label">{t('reviews.averageRating', 'Average Rating')}</span>
              </div>
              <div className="stat">
                <span className="stat-number">
                  {Math.round((reviews.filter(review => review.stars >= 4).length / reviews.length) * 100)}%
                </span>
                <span className="stat-label">{t('reviews.positiveReviews', 'Positive Reviews')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReviews;