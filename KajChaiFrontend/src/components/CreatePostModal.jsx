import React, { useState } from 'react';
import forumAPI from '../services/forumService';
import './CreatePostModal.css';

const CreatePostModal = ({ section, categories, onClose, onSuccess }) => {
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
    return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getSectionTitle = () => {
    switch (section) {
      case 'CUSTOMER_QA':
        return 'Ask a Question';
      case 'WORKER_TIPS_PROJECTS':
        return 'Share Tips or Projects';
      case 'CUSTOMER_EXPERIENCE':
        return 'Share Your Experience';
      default:
        return 'Create Post';
    }
  };

  const getSectionPlaceholder = () => {
    switch (section) {
      case 'CUSTOMER_QA':
        return {
          title: 'What service-related question do you have?',
          content: 'Describe your question in detail. Include any relevant information that might help others provide better answers...'
        };
      case 'WORKER_TIPS_PROJECTS':
        return {
          title: 'Share your expertise or showcase your work',
          content: 'Share useful tips, step-by-step guides, or showcase your completed projects. Help others learn from your experience...'
        };
      case 'CUSTOMER_EXPERIENCE':
        return {
          title: 'What did you learn from your service experience?',
          content: 'Share your experience to help other customers. What went well? What would you do differently? Any tips for future customers?'
        };
      default:
        return {
          title: 'Enter your post title',
          content: 'Write your post content here...'
        };
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters long';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
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
      onSuccess();
    } catch (error) {
      console.error('Error creating post:', error);
      setErrors({ submit: 'Failed to create post. Please try again.' });
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
        setErrors(prev => ({ ...prev, images: 'Only image files are allowed' }));
        return false;
      }
      
      if (!isValidSize) {
        setErrors(prev => ({ ...prev, images: 'Image size must be less than 5MB' }));
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    // Limit total images to 5
    const totalImages = formData.photoUrls.length + validFiles.length;
    if (totalImages > 5) {
      setErrors(prev => ({ ...prev, images: 'Maximum 5 images allowed' }));
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
      setErrors(prev => ({ ...prev, images: 'Failed to process images' }));
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
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={errors.category ? 'error' : ''}
            >
              <option value="">Select a category</option>
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
            <label htmlFor="title">Title *</label>
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
            <label htmlFor="content">Content *</label>
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
            <label>Images (Optional)</label>
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
                      Uploading...
                    </>
                  ) : (
                    <>
                      <span className="upload-icon">📁</span>
                      Choose Images
                    </>
                  )}
                </label>
                <div className="file-input-info">
                  {formData.photoUrls.length}/5 images • Max 5MB each
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
                        title="Remove image"
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
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;