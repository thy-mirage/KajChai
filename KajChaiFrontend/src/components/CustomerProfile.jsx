import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import './Profile.css';

const CustomerProfile = () => {
  const { user, checkAuthStatus } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    photo: '',
    phone: '',
    gender: '',
    city: '',
    upazila: '',
    district: '',
    division: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authService.getCustomerProfile();
      if (response.success) {
        setProfile(response.data);
        setFormData({
          customerName: response.data.customerName || '',
          photo: response.data.photo || '',
          phone: response.data.phone || '',
          gender: response.data.gender || '',
          city: response.data.city || '',
          upazila: response.data.upazila || '',
          district: response.data.district || '',
          division: response.data.division || ''
        });
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let response;
      
      if (photoFile) {
        // Use multipart form data for photo upload
        const uploadFormData = new FormData();
        uploadFormData.append('customerName', formData.customerName);
        uploadFormData.append('phone', formData.phone);
        uploadFormData.append('gender', formData.gender);
        uploadFormData.append('city', formData.city);
        uploadFormData.append('upazila', formData.upazila);
        uploadFormData.append('district', formData.district);
        uploadFormData.append('division', formData.division);
        uploadFormData.append('photo', photoFile);
        
        response = await authService.updateCustomerProfileWithPhoto(uploadFormData);
      } else {
        // Use regular JSON payload if no photo
        response = await authService.updateCustomerProfile(formData);
      }
      
      if (response.success) {
        setProfile(response.data);
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        // Clear photo states
        setPhotoFile(null);
        setPhotoPreview(null);
        // Refresh user data in AuthContext to update navbar
        await checkAuthStatus();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
    setPhotoFile(null);
    setPhotoPreview(null);
    // Reset form data to current profile
    if (profile) {
      setFormData({
        customerName: profile.customerName || '',
        photo: profile.photo || '',
        phone: profile.phone || '',
        gender: profile.gender || '',
        city: profile.city || '',
        upazila: profile.upazila || '',
        district: profile.district || '',
        division: profile.division || ''
      });
    }
  };

  if (loading && !profile) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="error">Profile not found</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <div className="user-type-badge customer">Customer</div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="profile-content">
        {!isEditing ? (
          <div className="profile-view">
            <div className="profile-photo">
              {profile.photo ? (
                <img src={profile.photo} alt="Profile" />
              ) : (
                <div className="photo-placeholder">
                  {profile.customerName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>

            <div className="profile-info">
              <div className="info-group">
                <label>Name:</label>
                <span>{profile.customerName}</span>
              </div>
              <div className="info-group">
                <label>Email:</label>
                <span>{profile.gmail}</span>
              </div>
              <div className="info-group">
                <label>Phone:</label>
                <span>{profile.phone}</span>
              </div>
              <div className="info-group">
                <label>Gender:</label>
                <span>{profile.gender}</span>
              </div>
              <div className="info-group">
                <label>City:</label>
                <span>{profile.city}</span>
              </div>
              <div className="info-group">
                <label>Upazila:</label>
                <span>{profile.upazila}</span>
              </div>
              <div className="info-group">
                <label>District:</label>
                <span>{profile.district}</span>
              </div>
              <div className="info-group">
                <label>Division:</label>
                <span>{profile.division}</span>
              </div>
            </div>

            <button 
              className="edit-btn" 
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <div className="profile-edit">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="customerName">Name *</label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="photo">Profile Photo</label>
                <input
                  type="file"
                  id="photo"
                  name="photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={loading}
                  className="photo-input"
                />
                {(photoPreview || formData.photo) && (
                  <div className="photo-preview">
                    <img 
                      src={photoPreview || formData.photo} 
                      alt="Profile Preview" 
                      className="preview-image" 
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="remove-photo-btn"
                      disabled={loading}
                    >
                      Remove Photo
                    </button>
                  </div>
                )}
                <small className="photo-help">
                  Upload a new profile photo (JPG, PNG, GIF) - Optional
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender *</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="upazila">Upazila *</label>
                <input
                  type="text"
                  id="upazila"
                  name="upazila"
                  value={formData.upazila}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="district">District *</label>
                <input
                  type="text"
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="division">Division *</label>
                <input
                  type="text"
                  id="division"
                  name="division"
                  value={formData.division}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="save-btn" 
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerProfile;
