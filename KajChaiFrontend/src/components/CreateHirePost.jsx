import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import hirePostService from '../services/hirePostService';
import './HirePost.css';

const CreateHirePost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    description: '',
    field: '',
    estimatedPayment: '',
    deadline: '',
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      setError(t('jobs.maxImagesError'));
      return;
    }
    
    // Convert images to base64 or URLs for preview
    const imagePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target.result);
        };
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(imagePromises).then(images => {
      setFormData(prev => ({
        ...prev,
        images: images
      }));
    });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const postData = {
        ...formData,
        estimatedPayment: parseFloat(formData.estimatedPayment),
        deadline: formData.deadline || null
      };

      await hirePostService.createHirePost(postData);
      setSuccess(t('jobs.hirePostCreatedSuccessfully'));
      setFormData({
        description: '',
        field: '',
        estimatedPayment: '',
        deadline: '',
        images: []
      });
      
      if (onPostCreated) {
        onPostCreated();
      }
      
      // Navigate to My Posts page after successful creation
      setTimeout(() => {
        navigate('/jobs');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || t('jobs.failedToCreateHirePost'));
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'CUSTOMER') {
    return (
      <div className="access-denied">
        <p>{t('jobs.onlyCustomersCanCreate')}</p>
      </div>
    );
  }

  return (
    <div className="create-hire-post">
      <h3>{t('jobs.createNewHirePost')}</h3>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="hire-post-form">
        <div className="form-group">
          <label htmlFor="field">{t('jobs.jobField')} *</label>
          <select
            id="field"
            name="field"
            value={formData.field}
            onChange={handleChange}
            required
          >
            <option value="">{t('jobs.selectJobField')}</option>
            {hirePostService.JOB_FIELDS.map(field => (
              <option key={field} value={field}>{t(`workers.${field.toLowerCase()}`)}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">{t('jobs.jobDescription')} *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={t('jobs.descriptionPlaceholder')}
            rows={4}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="estimatedPayment">{t('jobs.estimatedPayment')} *</label>
          <input
            type="number"
            id="estimatedPayment"
            name="estimatedPayment"
            value={formData.estimatedPayment}
            onChange={handleChange}
            placeholder={t('jobs.paymentPlaceholder')}
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="deadline">{t('jobs.deadline')}</label>
          <input
            type="date"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="form-group">
          <label>{t('jobs.uploadImages')}</label>
          <div className="image-upload-section">
            <div className="file-input-container">
              <input
                type="file"
                id="images"
                name="images"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="file-input-hidden"
                disabled={formData.images.length >= 5}
              />
              <label htmlFor="images" className="file-upload-button">
                <span className="upload-icon">📁</span>
                {t('jobs.chooseImages')}
              </label>
              <div className="file-input-info">
                {formData.images.length}/5 {t('jobs.images')} • {t('jobs.maxFileSize')}
              </div>
            </div>
          </div>
          <small className="help-text">{t('jobs.imageUploadHelp')}</small>
          
          {formData.images.length > 0 && (
            <div className="image-preview">
              {formData.images.map((image, index) => (
                <div key={index} className="image-preview-item">
                  <img src={image} alt={`${t('jobs.preview')} ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={loading}
        >
          {loading ? t('jobs.creating') : t('jobs.createHirePost')}
        </button>
      </form>
    </div>
  );
};

export default CreateHirePost;
