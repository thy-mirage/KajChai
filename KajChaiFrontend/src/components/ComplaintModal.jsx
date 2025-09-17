import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import complaintService from '../services/complaintService';
import './ComplaintModal.css';

const ComplaintModal = ({ isOpen, onClose, post, onComplaintSubmitted }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    evidenceImages: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [error, setError] = useState('');

  const complaintReasons = [
    { value: 'SPAM_OR_SCAM', label: 'Spam or Scam' },
    { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Content' },
    { value: 'HARASSMENT', label: 'Harassment' },
    { value: 'FALSE_INFORMATION', label: 'False Information' },
    { value: 'COPYRIGHT_VIOLATION', label: 'Copyright Violation' },
    { value: 'OFFENSIVE_LANGUAGE', label: 'Offensive Language' },
    { value: 'OTHER', label: 'Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploadingImages(true);
    setError('');

    try {
      const uploadResult = await complaintService.uploadEvidenceImages(files);
      
      if (uploadResult.success) {
        setFormData(prev => ({
          ...prev,
          evidenceImages: [...prev.evidenceImages, ...uploadResult.imageUrls]
        }));
      } else {
        setError(uploadResult.error || 'Failed to upload images');
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Failed to upload images. Please try again.');
    } finally {
      setIsUploadingImages(false);
      // Clear the file input
      e.target.value = '';
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      evidenceImages: prev.evidenceImages.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to submit a complaint');
      return;
    }

    if (!formData.reason || !formData.description.trim()) {
      setError('Please select a reason and provide a description');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const complaintData = {
        reason: formData.reason,
        description: formData.description.trim(),
        evidenceImages: formData.evidenceImages
      };

      await complaintService.submitComplaint(post.postId, complaintData);
      
      // Reset form
      setFormData({
        reason: '',
        description: '',
        evidenceImages: []
      });
      
      if (onComplaintSubmitted) {
        onComplaintSubmitted();
      }
      
      onClose();
      alert('Complaint submitted successfully! We will review it shortly.');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      reason: '',
      description: '',
      evidenceImages: []
    });
    setError('');
    onClose();
  };

  if (!isOpen || !post) return null;

  return (
    <div className="complaint-modal-overlay" onClick={handleClose}>
      <div className="complaint-modal" onClick={(e) => e.stopPropagation()}>
        <div className="complaint-modal-header">
          <h2>Report Post</h2>
          <button 
            className="close-btn"
            onClick={handleClose}
            disabled={isSubmitting || isUploadingImages}
          >
            ×
          </button>
        </div>

        <div className="complaint-modal-body">
          <div className="post-preview">
            <h3>Post being reported:</h3>
            <div className="post-preview-content">
              <h4>{post.title}</h4>
              <p>{post.content.substring(0, 150)}{post.content.length > 150 ? '...' : ''}</p>
              <small>By: {post.authorName}</small>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="complaint-form">
            <div className="form-group">
              <label htmlFor="reason">Reason for reporting *</label>
              <select
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                disabled={isSubmitting || isUploadingImages}
              >
                <option value="">Select a reason</option>
                {complaintReasons.map(reason => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Detailed description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Please provide specific details about why you're reporting this post..."
                required
                rows={4}
                disabled={isSubmitting || isUploadingImages}
              />
            </div>

            <div className="form-group">
              <label htmlFor="evidenceImages">Evidence images (optional)</label>
              <input
                type="file"
                id="evidenceImages"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={isSubmitting || isUploadingImages}
              />
              <small>
                {isUploadingImages 
                  ? 'Uploading images...' 
                  : 'You can upload images to support your complaint'
                }
              </small>
            </div>

            {formData.evidenceImages.length > 0 && (
              <div className="evidence-preview">
                <h4>Uploaded Evidence:</h4>
                <div className="evidence-grid">
                  {formData.evidenceImages.map((image, index) => (
                    <div key={index} className="evidence-item">
                      <img src={image} alt={`Evidence ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-evidence"
                        onClick={() => removeImage(index)}
                        disabled={isSubmitting || isUploadingImages}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={handleClose}
                className="cancel-btn"
                disabled={isSubmitting || isUploadingImages}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting || isUploadingImages}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ComplaintModal;