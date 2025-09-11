import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import hirePostService from '../services/hirePostService';
import './HirePost.css';

const HirePostApplications = () => {
  const { postId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
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
            <p><strong>Payment:</strong> {formatCurrency(post.estimatedPayment)}</p>
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
                    <span className="stat-label">Average Rating</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{application.workerExperience}</span>
                    <span className="stat-label">Years Experience</span>
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
    </div>
  );
};

export default HirePostApplications;
