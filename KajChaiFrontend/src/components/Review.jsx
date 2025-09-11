import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';
import './Review.css';
import reviewService from '../services/reviewService';

const Review = () => {
    const { user } = useAuth();
    const [searchType, setSearchType] = useState('field');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedField, setSelectedField] = useState('');
    const [workers, setWorkers] = useState([]);
    const [expandedWorker, setExpandedWorker] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddReview, setShowAddReview] = useState(false);
    const [canAddReview, setCanAddReview] = useState(false);
    const [workerFields, setWorkerFields] = useState([]);
    const [completedWorkers, setCompletedWorkers] = useState([]);

    
    // New review form state
    const [newReview, setNewReview] = useState({
        message: '',
        rating: 0,
        images: []
    });
    const [previewImages, setPreviewImages] = useState([]);

    // Worker fields list
    useEffect(() => {
        // Fetch worker fields from API
        const fetchFields = async () => {
            try {
                const response = await reviewService.getAllFields();
                if (response.data && response.data.success && Array.isArray(response.data.data)) {
                    setWorkerFields(response.data.data);
                } else {
                    console.warn('Unexpected fields response structure:', response.data);
                }
            } catch (error) {
                console.error('Failed to fetch worker fields:', error);     
            }
        };

        fetchFields();
    }, []);

    // Redirect if not customer
    if (!user || user.role !== 'CUSTOMER') {
        return <Navigate to="/dashboard" replace />;
    }

    useEffect(() => {
        if (searchType === 'completed') {
            loadCompletedWorkers();
        } else {
            setWorkers([]);
        }
    }, [searchType]);

    const loadCompletedWorkers = async () => {
        setLoading(true);
        try {
            try {
                const response = await reviewService.getCompletedWorkers();
                setCompletedWorkers(response.data.data || []);
                setWorkers(response.data.data || []);
            } catch (error) {
                console.error('API failed');
            }
        } catch (error) {
            console.error('Failed to load completed workers:', error);
            setWorkers([]);
        } finally {
            setLoading(false);
        }
    };

    const searchWorkers = async () => {
        setLoading(true);
        setExpandedWorker(null);
        try {
            if (searchType === 'field' && selectedField) {
                try {
                    const response = await reviewService.getWorkersByField(selectedField);
                    setWorkers(response.data.data || []);
                } catch (error) {
                    console.error('API failed');
                }
            } else if (searchType === 'name' && searchQuery) {
                try {
                    const response = await reviewService.getWorkersByName(searchQuery);
                    setWorkers(response.data.data || []);
                    console.log('Searching workers by name:', searchQuery);
                } catch (error) {
                    console.error('API failed');
                }
            }
        } catch (error) {
            console.error('Failed to search workers:', error);
            setWorkers([]);
        } finally {
            setLoading(false);
        }
    };

    const loadWorkerReviews = async (workerId) => {
        setLoading(true);
        try {
            try {
                // Load reviews for the worker
                const reviewsResponse = await reviewService.getWorkerReviews(workerId);
                setReviews(reviewsResponse.data.data || []);

                // Check if customer can add review for this worker
                const canReviewResponse = await reviewService.canReviewWorker(workerId);
                setCanAddReview(canReviewResponse.data.data || false);
                
                console.log('Loading reviews for worker:', workerId);
            } catch (error) {
                console.error('API failed');
            }
        } catch (error) {
            console.error('Failed to load worker reviews:', error);
            setReviews([]);
            setCanAddReview(false);
        } finally {
            setLoading(false);
        }
    };

    const handleWorkerClick = (worker) => {
        if (expandedWorker?.workerId === worker.workerId) {
            setExpandedWorker(null);
            setReviews([]);
            setShowAddReview(false);
        } else {
            setExpandedWorker(worker);
            loadWorkerReviews(worker.workerId);
            
            // Scroll to the worker card after a short delay to allow for expansion
            setTimeout(() => {
                const workerCard = document.getElementById(`worker-card-${worker.workerId}`);
                if (workerCard) {
                    workerCard.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                }
            }, 300);
        }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const imageUrls = files.map(file => URL.createObjectURL(file));
        setPreviewImages([...previewImages, ...imageUrls]);
        setNewReview(prev => ({ ...prev, images: [...prev.images, ...files] }));
    };

    const removeImage = (index) => {
        const updatedPreviews = previewImages.filter((_, i) => i !== index);
        const updatedImages = newReview.images.filter((_, i) => i !== index);
        setPreviewImages(updatedPreviews);
        setNewReview(prev => ({ ...prev, images: updatedImages }));
    };

    const submitReview = async () => {
        if (!newReview.message.trim() || newReview.rating === 0) {
            alert('Please provide a message and rating');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('workerId', expandedWorker.workerId);
            formData.append('message', newReview.message);
            formData.append('stars', newReview.rating);
            newReview.images.forEach((image, index) => {
                formData.append(`images`, image);
            });
            
            const response = await reviewService.submitReview(formData);
            alert('Review submitted successfully');

            // Reset form and reload reviews
            setNewReview({ message: '', rating: 0, images: [] });
            setPreviewImages([]);
            setShowAddReview(false);
            loadWorkerReviews(expandedWorker.workerId);
        } catch (error) {
            console.error('Failed to submit review:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            console.error('Full error:', error);
            alert(`Failed to submit review: ${error.response?.data?.message || error.message}`);
        }
    };

    const renderStars = (rating, interactive = false, onRatingChange = null) => {
        return (
            <div className="stars-container">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={`star ${star <= rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
                        onClick={() => interactive && onRatingChange && onRatingChange(star)}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Layout>
            <div className="review-container">
                <div className="review-header">
                    <h1>Worker Reviews</h1>
                    <p>Search and review workers based on their services</p>
                </div>

                {/* Search Controls */}
                <div className="search-controls">
                    <div className="search-type-tabs">
                        <button
                            className={`tab ${searchType === 'field' ? 'active' : ''}`}
                            onClick={() => setSearchType('field')}
                        >
                            By Field
                        </button>
                        <button
                            className={`tab ${searchType === 'completed' ? 'active' : ''}`}
                            onClick={() => setSearchType('completed')}
                        >
                            Completed Tasks
                        </button>
                        <button
                            className={`tab ${searchType === 'name' ? 'active' : ''}`}
                            onClick={() => setSearchType('name')}
                        >
                            By Name
                        </button>
                    </div>

                    <div className="search-inputs">
                        {searchType === 'field' && (
                            <div className="field-search">
                                <select
                                    value={selectedField}
                                    onChange={(e) => setSelectedField(e.target.value)}
                                    className="field-select"
                                >
                                    <option value="">Select a field</option>
                                    {(Array.isArray(workerFields) ? workerFields : []).map(field => (
                                        <option key={field} value={field}>{field}</option>
                                    ))}
                                </select>
                                <button 
                                    onClick={searchWorkers}
                                    disabled={!selectedField}
                                    className="search-btn"
                                >
                                    Search Workers
                                </button>
                            </div>
                        )}

                        {searchType === 'name' && (
                            <div className="name-search">
                                <input
                                    type="text"
                                    placeholder="Enter worker's name"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="name-input"
                                />
                                <button 
                                    onClick={searchWorkers}
                                    disabled={!searchQuery.trim()}
                                    className="search-btn"
                                >
                                    Search Workers
                                </button>
                            </div>
                        )}

                        {searchType === 'completed' && (
                            <div className="completed-info">
                                <p>Showing workers who have completed tasks for you</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Workers List */}
                <div className="workers-section">
                    {loading ? (
                        <div className="loading">Loading workers...</div>
                    ) : (
                        <div className="workers-grid">
                            {(Array.isArray(workers) ? workers : []).map(worker => (
                                <div key={worker.workerId} id={`worker-card-${worker.workerId}`} className="worker-card">
                                    <div 
                                        className="worker-summary"
                                        onClick={() => handleWorkerClick(worker)}
                                    >
                                        <div className="worker-avatar">
                                            {worker.profilePicture ? (
                                                <img src={worker.photo} alt={worker.name} />
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    {worker.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="worker-info">
                                            <h3>{worker.name}</h3>
                                            <p className="worker-field">{worker.field}</p>
                                            <div className="worker-rating">
                                                {renderStars(Math.round(worker.rating))}
                                                <span className="rating-text">
                                                    ({worker.rating?.toFixed(2)} ★)
                                                </span>
                                            </div>
                                            <p className="worker-phone">📞 {worker.phone}</p>
                                            <p className="worker-address">📍 {worker.city}, {worker.upazila}, {worker.district}</p>
                                            <p className="worker-experience">⏱️ {worker.experience} experience</p>
                                        </div>
                                        <div className="expand-icon">
                                            {expandedWorker?.workerId === worker.workerId ? '▼' : '▶'}
                                        </div>
                                    </div>

                                    {/* Expanded Reviews Section */}
                                    {expandedWorker?.workerId === worker.workerId && (
                                        <div className="reviews-section">
                                            <div className="reviews-header">
                                                <h4>Reviews ({Array.isArray(reviews) ? reviews.length : 0})</h4>
                                                {canAddReview && !showAddReview && (
                                                    <button
                                                        className="add-review-btn"
                                                        onClick={() => setShowAddReview(true)}
                                                    >
                                                        Add Review
                                                    </button>
                                                )}
                                            </div>

                                            {/* Add Review Form */}
                                            {showAddReview && (
                                                <div className="add-review-form">
                                                    <h5>Add Your Review</h5>
                                                    <div className="rating-input">
                                                        <label>Rating:</label>
                                                        {renderStars(newReview.rating, true, (rating) => 
                                                            setNewReview(prev => ({ ...prev, rating }))
                                                        )}
                                                    </div>
                                                    <textarea
                                                        placeholder="Write your review..."
                                                        value={newReview.message}
                                                        onChange={(e) => setNewReview(prev => ({ ...prev, message: e.target.value }))}
                                                        className="review-textarea"
                                                        rows="4"
                                                    />
                                                    <div className="image-upload-section">
                                                        <label htmlFor="review-images" className="upload-label">
                                                            📷 Add Photos (Optional)
                                                        </label>
                                                        <input
                                                            id="review-images"
                                                            type="file"
                                                            multiple
                                                            accept="image/*"
                                                            onChange={handleImageUpload}
                                                            className="image-input"
                                                        />
                                                        {previewImages.length > 0 && (
                                                            <div className="image-previews">
                                                                {previewImages.map((img, index) => (
                                                                    <div key={index} className="image-preview">
                                                                        <img src={img} alt={`Preview ${index + 1}`} />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeImage(index)}
                                                                            className="remove-image"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="form-actions">
                                                        <button
                                                            onClick={() => setShowAddReview(false)}
                                                            className="cancel-btn"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={submitReview}
                                                            className="submit-btn"
                                                            disabled={!newReview.message.trim() || newReview.rating === 0}
                                                        >
                                                            Submit Review
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Reviews List */}
                                            <div className="reviews-list">
                                                {(!Array.isArray(reviews) || reviews.length === 0) ? (
                                                    <p className="no-reviews">No reviews yet</p>
                                                ) : (
                                                    (Array.isArray(reviews) ? reviews : []).map(review => (
                                                        <div key={review.reviewId} className="review-item">
                                                            <div className="review-header">
                                                                <div className="reviewer-profile">
                                                                    <div className="reviewer-avatar">
                                                                        {review.customer.photo ? (
                                                                            <img 
                                                                                src={review.customer.photo} 
                                                                                alt={review.customer.customerName}
                                                                                className="reviewer-photo"
                                                                            />
                                                                        ) : (
                                                                            <div className="reviewer-placeholder">
                                                                                {review.customer.customerName.charAt(0).toUpperCase()}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="reviewer-name">
                                                                        <strong>{review.customer.customerName}</strong>
                                                                    </div>
                                                                </div>
                                                                <div className="review-meta">
                                                                    <div className="review-rating">
                                                                        {renderStars(review.stars)}
                                                                    </div>
                                                                    <div className="review-date">
                                                                        {formatDate(review.reviewTime)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="review-content">
                                                                <p className="review-message">{review.message}</p>
                                                                {review.images && review.images.length > 0 && (
                                                                    <div className="review-images">
                                                                        {review.images.map((img, index) => (
                                                                            <img
                                                                                key={index}
                                                                                src={img}
                                                                                alt={`Review ${index + 1}`}
                                                                                className="review-image"
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Review;
