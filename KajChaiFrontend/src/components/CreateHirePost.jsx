import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import hirePostService from '../services/hirePostService';
import './HirePost.css';

const CreateHirePost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      setError('You can upload maximum 5 images');
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
      setSuccess('Hire post created successfully!');
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
      setError(err.response?.data?.message || 'Failed to create hire post');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'CUSTOMER') {
    return (
      <div className="access-denied">
        <p>Only customers can create hire posts.</p>
      </div>
    );
  }

  return (
    <div className="create-hire-post">
      <h3>Create New Hire Post</h3>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="hire-post-form">
        <div className="form-group">
          <label htmlFor="field">Job Field *</label>
          <select
            id="field"
            name="field"
            value={formData.field}
            onChange={handleChange}
            required
          >
            <option value="">Select a job field</option>
            {hirePostService.JOB_FIELDS.map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Job Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your job requirements in detail..."
            rows={4}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="estimatedPayment">Estimated Payment (BDT) *</label>
          <input
            type="number"
            id="estimatedPayment"
            name="estimatedPayment"
            value={formData.estimatedPayment}
            onChange={handleChange}
            placeholder="Enter estimated payment"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="deadline">Deadline (Optional)</label>
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
          <label htmlFor="images">Upload Images (Optional)</label>
          <input
            type="file"
            id="images"
            name="images"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="file-input"
          />
          <small className="help-text">You can upload up to 5 images to help describe your job</small>
          
          {formData.images.length > 0 && (
            <div className="image-preview">
              {formData.images.map((image, index) => (
                <div key={index} className="image-preview-item">
                  <img src={image} alt={`Preview ${index + 1}`} />
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
          {loading ? 'Creating...' : 'Create Hire Post'}
        </button>
      </form>
    </div>
  );
};

export default CreateHirePost;
