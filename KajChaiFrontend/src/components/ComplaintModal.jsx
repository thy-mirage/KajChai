import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import complaintService from '../services/complaintService';
import './ComplaintModal.css';

const ComplaintModal = ({ isOpen, onClose, post, onComplaintSubmitted }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    evidenceImages: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [error, setError] = useState('');

  const complaintReasons = [
    { value: 'SPAM_OR_SCAM', label: t('forum.reportModal.reasons.SPAM_OR_SCAM') },
    { value: 'INAPPROPRIATE_CONTENT', label: t('forum.reportModal.reasons.INAPPROPRIATE_CONTENT') },
    { value: 'HARASSMENT', label: t('forum.reportModal.reasons.HARASSMENT') },
    { value: 'FALSE_INFORMATION', label: t('forum.reportModal.reasons.FALSE_INFORMATION') },
    { value: 'COPYRIGHT_VIOLATION', label: t('forum.reportModal.reasons.COPYRIGHT_VIOLATION') },
    { value: 'OFFENSIVE_LANGUAGE', label: t('forum.reportModal.reasons.OFFENSIVE_LANGUAGE') },
    { value: 'OTHER', label: t('forum.reportModal.reasons.OTHER') }
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
      alert(t('forum.reportModal.complaintSubmitted'));
      
    } catch (err) {
      setError(err.response?.data?.message || t('forum.reportModal.submitError'));
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
          <h2>{t('forum.reportModal.title')}</h2>
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
            <h3>{t('forum.reportModal.postBeingReported')}</h3>
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
              <label htmlFor="reason">{t('forum.reportModal.reasonForReporting')} *</label>
              <select
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                disabled={isSubmitting || isUploadingImages}
              >
                <option value="">{t('forum.reportModal.selectReason')}</option>
                {complaintReasons.map(reason => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">{t('forum.reportModal.detailedDescription')} *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder={t('forum.reportModal.descriptionPlaceholder')}
                required
                rows={4}
                disabled={isSubmitting || isUploadingImages}
              />
            </div>

            <div className="form-group">
              <label htmlFor="evidenceImages">{t('forum.reportModal.evidenceImages')}</label>
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
                  ? t('forum.reportModal.uploadingImages')
                  : t('forum.reportModal.uploadImagesHelp')
                }
              </small>
            </div>

            {formData.evidenceImages.length > 0 && (
              <div className="evidence-preview">
                <h4>{t('forum.reportModal.uploadedEvidence')}</h4>
                <div className="evidence-grid">
                  {formData.evidenceImages.map((image, index) => (
                    <div key={index} className="evidence-item">
                      <img src={image} alt={`${t('forum.reportModal.evidenceAlt')} ${index + 1}`} />
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
                {t('forum.reportModal.cancel')}
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting || isUploadingImages}
              >
                {isSubmitting ? t('forum.reportModal.submitting') : t('forum.reportModal.submitComplaint')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ComplaintModal;