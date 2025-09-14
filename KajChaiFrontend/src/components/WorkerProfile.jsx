import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import LocationSelector from './LocationSelector';
import './Profile.css';

const WorkerProfile = () => {
  const { user, checkAuthStatus } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    photo: '',
    phone: '',
    gender: '',
    city: '',
    upazila: '',
    district: '',
    latitude: null,
    longitude: null,
    field: '',
    experience: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const jobFields = [
    'Electrician',
    'Plumber', 
    'Carpenter',
    'Painter',
    'Maid',
    'Chef',
    'Driver',
    'Photographer'
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authService.getWorkerProfile();
      if (response.success) {
        setProfile(response.data);
        setFormData({
          name: response.data.name || '',
          photo: response.data.photo || '',
          phone: response.data.phone || '',
          gender: response.data.gender || '',
          city: response.data.city || '',
          upazila: response.data.upazila || '',
          district: response.data.district || '',
          latitude: response.data.latitude || null,
          longitude: response.data.longitude || null,
          field: response.data.field || '',
          experience: response.data.experience ? response.data.experience.toString() : ''
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

  const handleLocationSelect = (locationData) => {
    setFormData(prev => ({
      ...prev,
      city: locationData.city || '',
      upazila: locationData.upazila || '',
      district: locationData.district || '',
      latitude: locationData.latitude,
      longitude: locationData.longitude
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

    // Validation for location
    if (!formData.latitude || !formData.longitude) {
      setError('Please select a valid location on the map');
      setLoading(false);
      return;
    }

    try {
      let response;
      
      if (photoFile) {
        // Use multipart form data for photo upload
        const uploadFormData = new FormData();
        uploadFormData.append('name', formData.name);
        uploadFormData.append('phone', formData.phone);
        uploadFormData.append('gender', formData.gender);
        uploadFormData.append('city', formData.city);
        uploadFormData.append('upazila', formData.upazila);
        uploadFormData.append('district', formData.district);
        uploadFormData.append('latitude', formData.latitude);
        uploadFormData.append('longitude', formData.longitude);
        uploadFormData.append('field', formData.field);
        if (formData.experience) {
          uploadFormData.append('experience', parseFloat(formData.experience));
        }
        uploadFormData.append('photo', photoFile);
        
        response = await authService.updateWorkerProfileWithPhoto(uploadFormData);
      } else {
        // Use regular JSON payload if no photo
        const submitData = {
          name: formData.name,
          phone: formData.phone,
          gender: formData.gender,
          city: formData.city,
          upazila: formData.upazila,
          district: formData.district,
          latitude: formData.latitude,
          longitude: formData.longitude,
          field: formData.field,
          experience: formData.experience ? parseFloat(formData.experience) : null
        };
        response = await authService.updateWorkerProfile(submitData);
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
        name: profile.name || '',
        photo: profile.photo || '',
        phone: profile.phone || '',
        gender: profile.gender || '',
        city: profile.city || '',
        upazila: profile.upazila || '',
        district: profile.district || '',
        latitude: profile.latitude || null,
        longitude: profile.longitude || null,
        field: profile.field || '',
        experience: profile.experience ? profile.experience.toString() : ''
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
        <div className="user-type-badge worker">Worker</div>
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
                  {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>

            <div className="profile-info">
              <div className="info-group">
                <label>Name:</label>
                <span>{profile.name}</span>
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
                <label>Location:</label>
                <span>{[profile.city, profile.upazila, profile.district].filter(Boolean).join(', ')}</span>
              </div>
              <div className="info-group">
                <label>Field of Work:</label>
                <span>{profile.field}</span>
              </div>
              <div className="info-group">
                <label>Experience:</label>
                <span>{profile.experience} years</span>
              </div>
              <div className="info-group">
                <label>Rating:</label>
                <span className="rating">
                  {profile.rating ? `${profile.rating}/5 ⭐` : 'Not rated yet'}
                </span>
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
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
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
                <label>Update Location *</label>
                <LocationSelector
                  onLocationSelect={handleLocationSelect}
                  isEditMode={true}
                  initialLocation={{
                    city: formData.city,
                    upazila: formData.upazila,
                    district: formData.district,
                    latitude: formData.latitude && typeof formData.latitude === 'number' ? formData.latitude : null,
                    longitude: formData.longitude && typeof formData.longitude === 'number' ? formData.longitude : null
                  }}
                />
                <small className="location-help">
                  Click on the map to select your location. This will auto-fill your address details.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="field">Field of Work *</label>
                <select
                  id="field"
                  name="field"
                  value={formData.field}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Field</option>
                  {jobFields.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="experience">Experience (years)</label>
                <input
                  type="number"
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
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

export default WorkerProfile;
