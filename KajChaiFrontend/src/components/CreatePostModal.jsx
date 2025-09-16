import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import forumAPI from '../services/forumService';
import './CreatePostModal.css';

const CreatePostModal = ({ section, categories, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    photoUrls: []
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadingImages, setUploadingImages] = useState(false);

  const formatCategory = (category) => {
    const categoryKey = category.toLowerCase().replace(/_/g, '');
    // Try to get translation, fallback to formatted string if not found
    const translationKey = `forum.categories.${categoryKey}`;
    const translated = t(translationKey);
    // If translation key is returned as-is, it means translation doesn't exist
    if (translated === translationKey) {
      return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }
    return translated;
  };

  const getSectionTitle = () => {
    switch (section) {
      case 'CUSTOMER_QA':
        return t('forum.askQuestion');
      case 'WORKER_TIPS_PROJECTS':
        return t('forum.shareTipsOrProjects');
      case 'CUSTOMER_EXPERIENCE':
        return t('forum.shareExperience');
      default:
        return t('forum.createPost');
    }
  };

  const getSectionPlaceholder = () => {
    switch (section) {
      case 'CUSTOMER_QA':
        return {
          title: t('forum.questionPlaceholderTitle'),
          content: t('forum.questionPlaceholderContent')
        };
      case 'WORKER_TIPS_PROJECTS':
        return {
          title: t('forum.tipsPlaceholderTitle'),
          content: t('forum.tipsPlaceholderContent')
        };
      case 'CUSTOMER_EXPERIENCE':
        return {
          title: t('forum.experiencePlaceholderTitle'),
          content: t('forum.experiencePlaceholderContent')
        };
      default:
        return {
          title: t('forum.defaultTitlePlaceholder'),
          content: t('forum.defaultContentPlaceholder')
        };
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = t('forum.titleRequired');
    } else if (formData.title.length < 10) {
      newErrors.title = t('forum.titleMinLength');
    }

    if (!formData.content.trim()) {
      newErrors.content = t('forum.contentRequired');
    }

    if (!formData.category) {
      newErrors.category = t('forum.categoryRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        section: section,
        category: formData.category,
        photoUrls: formData.photoUrls.filter(url => url.trim())
      };

      await forumAPI.createPost(postData);
      
      // Show success message about review process
      alert(t('forum.postSubmittedSuccess'));
      
      onSuccess();
    } catch (error) {
      console.error('Error creating post:', error);
      setErrors({ submit: t('forum.postSubmitError') });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      
      if (!isValidType) {
        setErrors(prev => ({ ...prev, images: t('forum.onlyImagesAllowed') }));
        return false;
      }
      
      if (!isValidSize) {
        setErrors(prev => ({ ...prev, images: t('forum.imageSizeLimit') }));
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    // Limit total images to 5
    const totalImages = formData.photoUrls.length + validFiles.length;
    if (totalImages > 5) {
      setErrors(prev => ({ ...prev, images: t('forum.maxImagesAllowed') }));
      return;
    }

    setUploadingImages(true);
    setErrors(prev => ({ ...prev, images: '' }));

    try {
      const base64Images = await Promise.all(
        validFiles.map(file => convertFileToBase64(file))
      );

      setFormData(prev => ({
        ...prev,
        photoUrls: [...prev.photoUrls, ...base64Images]
      }));

      setSelectedFiles(prev => [...prev, ...validFiles]);
    } catch (error) {
      setErrors(prev => ({ ...prev, images: t('forum.imageProcessError') }));
    } finally {
      setUploadingImages(false);
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      photoUrls: prev.photoUrls.filter((_, i) => i !== index)
    }));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const placeholders = getSectionPlaceholder();

  return (
    <div className="modal-overlay">
      <div className="create-post-modal">
        <div className="modal-header">
          <h2>{getSectionTitle()}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="post-form">
          {/* Category Selection */}
          <div className="form-group">
            <label htmlFor="category">{t('forum.category')} *</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={errors.category ? 'error' : ''}
            >
              <option value="">{t('forum.selectCategory')}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {formatCategory(category)}
                </option>
              ))}
            </select>
            {errors.category && <span className="error-text">{errors.category}</span>}
          </div>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">{t('forum.postTitle')} *</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder={placeholders.title}
              className={errors.title ? 'error' : ''}
              maxLength={200}
            />
            <div className="char-count">{formData.title.length}/200</div>
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          {/* Content */}
          <div className="form-group">
            <label htmlFor="content">{t('forum.postContent')} *</label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder={placeholders.content}
              className={errors.content ? 'error' : ''}
              rows={8}
              maxLength={2000}
            />
            <div className="char-count">{formData.content.length}/2000</div>
            {errors.content && <span className="error-text">{errors.content}</span>}
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label>{t('forum.imagesOptional')}</label>
            <div className="image-input-section">
              <div className="file-input-container">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="file-input"
                  id="image-upload"
                  disabled={uploadingImages || formData.photoUrls.length >= 5}
                />
                <label htmlFor="image-upload" className="file-input-label">
                  {uploadingImages ? (
                    <>
                      <span className="upload-spinner">⏳</span>
                      {t('forum.uploading')}
                    </>
                  ) : (
                    <>
                      <span className="upload-icon">📁</span>
                      {t('forum.chooseImages')}
                    </>
                  )}
                </label>
                <div className="file-input-info">
                  {formData.photoUrls.length}/5 {t('forum.images')} • {t('forum.maxSize')}
                </div>
              </div>
              
              {errors.images && <span className="error-text">{errors.images}</span>}
              
              {formData.photoUrls.length > 0 && (
                <div className="added-images">
                  {formData.photoUrls.map((imageData, index) => (
                    <div key={index} className="image-item">
                      <img src={imageData} alt={`Preview ${index + 1}`} className="image-preview" />
                      <button 
                        type="button"
                        onClick={() => removeImage(index)}
                        className="remove-image-btn"
                        title={t('forum.removeImage')}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="form-group">
              <span className="error-text">{errors.submit}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              onClick={onClose}
              className="cancel-btn"
              disabled={loading}
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? t('forum.creating') : t('forum.createPost')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;