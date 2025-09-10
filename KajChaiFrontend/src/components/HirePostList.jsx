import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import hirePostService from '../services/hirePostService';
import './HirePost.css';

const HirePostList = ({ viewMode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [applicationStatus, setApplicationStatus] = useState({}); // Track which posts worker has applied to
  const [expandedPosts, setExpandedPosts] = useState(new Set()); // Track expanded descriptions

  // Automatically determine viewMode based on user role if not explicitly provided
  const effectiveViewMode = viewMode || (user?.role === 'CUSTOMER' ? 'customer' : 'worker');

  useEffect(() => {
    loadPosts();
  }, [effectiveViewMode, selectedField]);

  const loadPosts = async () => {
    setLoading(true);
    setError('');

    try {
      let data;
      if (effectiveViewMode === 'customer') {
        data = await hirePostService.getMyHirePosts();
      } else if (effectiveViewMode === 'worker') {
        data = await hirePostService.getAvailableHirePosts(selectedField || null);
        // Check application status for each post
        await checkApplicationStatus(data);
      } else {
        data = await hirePostService.getAvailableHirePosts();
      }
      setPosts(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load hire posts');
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
      alert('Successfully applied to the job!');
      // Update application status for this post
      setApplicationStatus(prev => ({ ...prev, [postId]: true }));
      loadPosts(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply to job');
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await hirePostService.deleteHirePost(postId);
        loadPosts(); // Refresh the list
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete post');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusClass = {
      'AVAILABLE': 'status-available',
      'BOOKED': 'status-booked',
      'COMPLETED': 'status-completed'
    };
    return <span className={`status-badge ${statusClass[status]}`}>{status}</span>;
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

  if (loading) {
    return <div className="loading">Loading hire posts...</div>;
  }

  return (
    <div className="hire-post-list">
      <div className="list-header">
        <h3>
          {effectiveViewMode === 'customer' ? 'My Hire Posts' : 
           effectiveViewMode === 'worker' ? 'Available Jobs' : 'All Available Jobs'}
        </h3>
        
        {effectiveViewMode === 'worker' && (
          <div className="filter-section">
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="field-filter"
            >
              <option value="">All Fields</option>
              {hirePostService.JOB_FIELDS.map(field => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {posts.length === 0 ? (
        <div className="no-posts">
          {viewMode === 'customer' ? 
            'You haven\'t created any hire posts yet.' : 
            'No available jobs found.'}
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map(post => (
            <div key={post.postId} className="hire-post-card">
              <div className="card-header">
                <div className="field-badge">{post.field}</div>
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
                        +{post.images.length - 3} more
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
                            ? ' See Less' 
                            : ' See More'}
                        </button>
                      </>
                    ) : (
                      post.description
                    )}
                  </p>
                </div>
                
                <div className="post-details">
                  <div className="detail-item">
                    <strong>Payment:</strong> {formatCurrency(post.estimatedPayment)}
                  </div>
                  
                  {post.deadline && (
                    <div className="detail-item">
                      <strong>Deadline:</strong> {formatDate(post.deadline)}
                    </div>
                  )}
                  
                  <div className="detail-item">
                    <strong>Posted:</strong> {formatDate(post.postTime)}
                  </div>
                  
                  {effectiveViewMode !== 'customer' && (
                    <div className="customer-info">
                      <strong>Customer:</strong> {post.customerName} ({post.customerCity})
                    </div>
                  )}
                  
                  {effectiveViewMode === 'customer' && (
                    <div className="detail-item">
                      <strong>Applications:</strong> {post.applicationsCount}
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
                        View Applications ({post.applicationsCount})
                      </button>
                    )}
                    
                    {post.status === 'AVAILABLE' && (
                      <button 
                        className="btn-danger"
                        onClick={() => handleDeletePost(post.postId)}
                      >
                        Delete
                      </button>
                    )}
                    
                    {post.status === 'BOOKED' && (
                      <button 
                        className="btn-success"
                        onClick={() => {
                          // Mark as completed
                          hirePostService.markPostAsCompleted(post.postId)
                            .then(() => loadPosts())
                            .catch(err => alert(err.response?.data?.message || 'Failed to mark as completed'));
                        }}
                      >
                        Mark as Completed
                      </button>
                    )}
                  </>
                ) : (
                  effectiveViewMode === 'worker' && post.status === 'AVAILABLE' && (
                    applicationStatus[post.postId] ? (
                      <div className="application-status">
                        <span className="applied-badge">✓ Already Applied</span>
                        <small className="applied-text">Your application has been submitted</small>
                      </div>
                    ) : (
                      <button 
                        className="btn-primary"
                        onClick={() => handleApplyToPost(post.postId)}
                      >
                        Apply for this Job
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
