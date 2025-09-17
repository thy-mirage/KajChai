import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import hirePostService from '../services/hirePostService';
import './HirePost.css';

const HirePostList = ({ viewMode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [sortByLocation, setSortByLocation] = useState(false); // Location sorting toggle
  const [applicationStatus, setApplicationStatus] = useState({}); // Track which posts worker has applied to
  const [expandedPosts, setExpandedPosts] = useState(new Set()); // Track expanded descriptions

  // Automatically determine viewMode based on user role if not explicitly provided
  const effectiveViewMode = viewMode || (user?.role === 'CUSTOMER' ? 'customer' : 'worker');

  useEffect(() => {
    loadPosts();
  }, [effectiveViewMode, selectedField, sortByLocation]);

  const loadPosts = async () => {
    setLoading(true);
    setError('');

    try {
      let data;
      if (effectiveViewMode === 'customer') {
        data = await hirePostService.getMyHirePosts();
      } else if (effectiveViewMode === 'worker') {
        data = await hirePostService.getAvailableHirePosts(selectedField || null, sortByLocation);
        // Check application status for each post
        await checkApplicationStatus(data);
      } else {
        data = await hirePostService.getAvailableHirePosts();
      }
      setPosts(data);
    } catch (err) {
      setError(err.response?.data?.message || t('jobs.failedToLoadPosts'));
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async (posts) => {
    if (effectiveViewMode !== 'worker') return;
    
    const statusMap = {};
    for (const post of posts) {
      try {
        const response = await hirePostService.hasWorkerAppliedToPost(post.postId);
        statusMap[post.postId] = response.hasApplied;
      } catch (error) {
        console.error(`Error checking application status for post ${post.postId}:`, error);
        statusMap[post.postId] = false;
      }
    }
    setApplicationStatus(statusMap);
  };

  const handleApplyToPost = async (postId) => {
    try {
      await hirePostService.applyToHirePost(postId);
      alert(t('jobs.successfullyApplied'));
      // Update application status for this post
      setApplicationStatus(prev => ({ ...prev, [postId]: true }));
      loadPosts(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || t('jobs.failedToApply'));
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm(t('jobs.confirmDeletePost'))) {
      try {
        await hirePostService.deleteHirePost(postId);
        loadPosts(); // Refresh the list
      } catch (err) {
        alert(err.response?.data?.message || t('jobs.failedToDeletePost'));
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusClass = {
      'AVAILABLE': 'status-available',
      'BOOKED': 'status-booked',
      'COMPLETED': 'status-completed'
    };
    const statusText = {
      'AVAILABLE': t('jobs.status.available'),
      'BOOKED': t('jobs.status.booked'),
      'COMPLETED': t('jobs.status.completed')
    };
    return <span className={`status-badge ${statusClass[status]}`}>{statusText[status]}</span>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return `৳${amount.toLocaleString()}`;
  };

  const handleToggleDescription = (postId) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const getFieldTranslation = (field) => {
    const fieldKey = field.toLowerCase();
    return t(`workers.${fieldKey}`, field); // Fallback to original if no translation
  };

  if (loading) {
    return <div className="loading">{t('jobs.loadingPosts')}</div>;
  }

  return (
    <div className="hire-post-list">
      <div className="list-header">
        <h3>
          {effectiveViewMode === 'customer' ? t('jobs.myHirePosts') : 
           effectiveViewMode === 'worker' ? t('jobs.availableJobs') : t('jobs.allAvailableJobs')}
        </h3>
        
        {effectiveViewMode === 'worker' && (
          <div className="filter-section">
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="field-filter"
            >
              <option value="">{t('jobs.allFields')}</option>
              {hirePostService.JOB_FIELDS.map(field => (
                <option key={field} value={field}>{t(`workers.${field.toLowerCase()}`)}</option>
              ))}
            </select>
            
            <div className="location-sort-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={sortByLocation}
                  onChange={(e) => setSortByLocation(e.target.checked)}
                  className="location-checkbox"
                />
                <span className="checkmark">📍</span>
                {t('jobs.sortByNearestLocation')}
              </label>
            </div>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {posts.length === 0 ? (
        <div className="no-posts">
          {viewMode === 'customer' ? 
            t('jobs.noHirePostsCreated') : 
            t('jobs.noAvailableJobs')}
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map(post => (
            <div key={post.postId} className="hire-post-card">
              <div className="card-header">
                <div className="field-badge">{getFieldTranslation(post.field)}</div>
                {getStatusBadge(post.status)}
              </div>
              
              <div className="card-content">
                {post.images && post.images.length > 0 && (
                  <div className="post-images">
                    {post.images.slice(0, 3).map((image, index) => (
                      <img 
                        key={index} 
                        src={image} 
                        alt={`Post image ${index + 1}`}
                        className="post-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ))}
                    {post.images.length > 3 && (
                      <div className="more-images">
                        +{post.images.length - 3} {t('jobs.moreImages')}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="description-container">
                  <p className="description">
                    {post.description.length > 150 ? (
                      <>
                        {expandedPosts.has(post.postId) 
                          ? post.description 
                          : `${post.description.substring(0, 150)}...`}
                        <button 
                          className="toggle-description"
                          onClick={() => handleToggleDescription(post.postId)}
                        >
                          {expandedPosts.has(post.postId) 
                            ? t('jobs.seeLess') 
                            : t('jobs.seeMore')}
                        </button>
                      </>
                    ) : (
                      post.description
                    )}
                  </p>
                </div>
                
                <div className="post-details">
                  <div className="detail-item">
                    <strong>{t('jobs.payment')}:</strong> {formatCurrency(post.estimatedPayment)}
                  </div>
                  
                  {post.deadline && (
                    <div className="detail-item">
                      <strong>{t('jobs.deadline')}:</strong> {formatDate(post.deadline)}
                    </div>
                  )}
                  
                  <div className="detail-item">
                    <strong>{t('jobs.posted')}:</strong> {formatDate(post.postTime)}
                  </div>
                  
                  {effectiveViewMode !== 'customer' && (
                    <div className="customer-info">
                      <strong>{t('jobs.customer')}:</strong> {post.customerName} ({post.customerUpazila})
                    </div>
                  )}
                  
                  {effectiveViewMode === 'customer' && (
                    <div className="detail-item">
                      <strong>{t('jobs.applications')}:</strong> {post.applicationsCount}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="card-actions">
                {effectiveViewMode === 'customer' ? (
                  <>
                    {(post.status === 'AVAILABLE' || post.status === 'BOOKED') && (
                      <button 
                        className="btn-primary"
                        onClick={() => navigate(`/my-posts/${post.postId}/applications`)}
                      >
                        {t('jobs.viewApplications')} ({post.applicationsCount})
                      </button>
                    )}
                    
                    {post.status === 'AVAILABLE' && (
                      <button 
                        className="btn-danger"
                        onClick={() => handleDeletePost(post.postId)}
                      >
                        {t('jobs.delete')}
                      </button>
                    )}
                    
                    {post.status === 'BOOKED' && (
                      <button 
                        className="btn-success"
                        onClick={() => {
                          // Mark as completed
                          hirePostService.markPostAsCompleted(post.postId)
                            .then(() => loadPosts())
                            .catch(err => alert(err.response?.data?.message || t('jobs.failedToMarkCompleted')));
                        }}
                      >
                        {t('jobs.markAsCompleted')}
                      </button>
                    )}
                  </>
                ) : (
                  effectiveViewMode === 'worker' && post.status === 'AVAILABLE' && (
                    applicationStatus[post.postId] ? (
                      <div className="application-status">
                        <span className="applied-badge">✓ {t('jobs.alreadyApplied')}</span>
                        <small className="applied-text">{t('jobs.applicationSubmitted')}</small>
                      </div>
                    ) : (
                      <button 
                        className="btn-primary"
                        onClick={() => handleApplyToPost(post.postId)}
                      >
                        {t('jobs.applyForJob')}
                      </button>
                    )
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HirePostList;
