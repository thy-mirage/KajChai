import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { API_CONFIG } from '../config/api';
import './ReportWorkerModal.css'; // Create dedicated CSS file

const ReportWorkerModal = ({ worker, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const { user, getToken } = useAuth(); // Use getToken from auth context
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    evidenceFiles: [],
    evidencePreviews: [] // Add preview URLs
  });

  // Helper function to get the current user's token (same logic as authService)
  const getCurrentUserToken = () => {
    // First check if there's a current user email in session storage
    const currentUserEmail = sessionStorage.getItem('current_user_email');
    if (currentUserEmail) {
      const userToken = localStorage.getItem(`jwt_token_${currentUserEmail}`);
      if (userToken) {
        return userToken;
      }
    }
    
    // Fallback to generic token
    return localStorage.getItem('jwt_token');
  };

  // Predefined complaint reasons
  const COMPLAINT_REASONS = [
    'unprofessional_behavior',
    'poor_work_quality', 
    'unreliable',
    'inappropriate_communication',
    'overcharging',
    'safety_concerns',
    'harassment',
    'fraud',
    'other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const selectedFiles = files.slice(0, 5); // Limit to 5 files
    
    // Create preview URLs for the selected files
    const previews = [];
    for (const file of selectedFiles) {
      try {
        const previewUrl = await convertFileToBase64(file);
        previews.push(previewUrl);
      } catch (error) {
        console.error('Error creating preview:', error);
        previews.push(null);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      evidenceFiles: selectedFiles,
      evidencePreviews: previews
    }));
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      evidenceFiles: prev.evidenceFiles.filter((_, index) => index !== indexToRemove),
      evidencePreviews: prev.evidencePreviews.filter((_, index) => index !== indexToRemove)
    }));
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('files', file); // Use 'files' to match the backend parameter
    
    try {
      const token = getCurrentUserToken(); // Use the correct token retrieval method
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/forum/complaints/upload-evidence`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      if (data.success && data.imageUrls && data.imageUrls.length > 0) {
        return data.imageUrls[0]; // Return the first uploaded URL
      } else {
        throw new Error('Upload failed: No URL returned');
      }
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason) {
      setError(t('reports.reasonRequired'));
      return;
    }
    
    if (!formData.description.trim()) {
      setError(t('reports.descriptionRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload evidence files to Cloudinary
      const evidenceUrls = [];
      
      for (const file of formData.evidenceFiles) {
        try {
          const uploadedUrl = await uploadToCloudinary(file);
          evidenceUrls.push(uploadedUrl);
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          // Continue with other files if one fails
        }
      }

      // Create complaint request
      const complainRequest = {
        reportedWorkerId: worker.workerId,
        reason: formData.reason,
        description: formData.description.trim(),
        evidenceUrls: JSON.stringify(evidenceUrls) // Store as JSON string
      };

      // Submit complaint
      const token = getCurrentUserToken(); // Use the correct token retrieval method
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/user-complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(complainRequest)
      });

      if (!response.ok) {
        let errorMessage = t('common.error');
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Show success message
      alert(t('reports.complaintSubmitted'));
      
      // Call onSubmit callback
      onSubmit(result);

    } catch (error) {
      console.error('Error submitting complaint:', error);
      setError(error.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const getReasonTranslation = (reason) => {
    return t(`reports.reasons.${reason}`, reason.replace('_', ' '));
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <h3>{t('reports.reportWorker')}: {worker.name}</h3>
          <button className="report-close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="report-modal-form">
          {error && <div className="report-error-message">{error}</div>}

          <div className="report-form-group">
            <label htmlFor="reason">{t('reports.reason')} *</label>
            <select
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              required
              className="report-form-control"
            >
              <option value="">{t('reports.selectReason')}</option>
              {COMPLAINT_REASONS.map(reason => (
                <option key={reason} value={reason}>
                  {getReasonTranslation(reason)}
                </option>
              ))}
            </select>
          </div>

          <div className="report-form-group">
            <label htmlFor="description">{t('reports.description')} *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={t('reports.descriptionPlaceholder')}
              required
              rows={4}
              className="report-form-control textarea"
              maxLength={2000}
            />
            <div className="report-char-count">
              {formData.description.length}/2000 {t('common.characters')}
            </div>
          </div>

          <div className="report-form-group">
            <label htmlFor="evidence">{t('reports.evidence')} ({t('common.optional')})</label>
            <div className="file-upload-container">
              <input
                type="file"
                id="evidence"
                name="evidence"
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="file-input-hidden"
              />
              <label htmlFor="evidence" className="file-upload-button">
                📎 Choose Files
              </label>
              <span className="file-upload-text">
                {formData.evidenceFiles.length > 0 
                  ? `${formData.evidenceFiles.length} file(s) selected`
                  : 'No files selected'
                }
              </span>
            </div>
            <div className="report-text-muted">
              {t('reports.evidenceHelp')}
            </div>
          </div>

          {/* Show selected files with previews */}
          {formData.evidenceFiles.length > 0 && (
            <div className="report-selected-files">
              <h4>{t('reports.selectedFiles')}:</h4>
              <div className="report-files-grid">
                {formData.evidenceFiles.map((file, index) => (
                  <div key={index} className="report-file-item">
                    {formData.evidencePreviews[index] && (
                      <div className="report-image-preview">
                        <img 
                          src={formData.evidencePreviews[index]} 
                          alt={`Preview ${index + 1}`} 
                          className="report-preview-image"
                        />
                      </div>
                    )}
                    <div className="report-file-info">
                      <span className="report-file-name">{file.name}</span>
                      <button 
                        type="button" 
                        onClick={() => removeFile(index)}
                        className="report-remove-file-btn"
                        title="Remove file"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="report-modal-actions">
            <button 
              type="button" 
              onClick={onClose} 
              className="report-btn-secondary"
              disabled={loading}
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit" 
              className="report-btn-primary"
              disabled={loading}
            >
              {loading ? t('reports.submitting') : t('reports.submitComplaint')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportWorkerModal;