import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import LocationSelector from './LocationSelector';
import './Profile.css';

const CustomerProfile = () => {
  const { t } = useTranslation();
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
    latitude: null,
    longitude: null
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
          latitude: response.data.latitude || null,
          longitude: response.data.longitude || null
        });
      }
    } catch (err) {
      setError(t('profile.profileLoadError'));
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
    console.log('CustomerProfile: Received location data:', locationData);
    setFormData(prev => ({
      ...prev,
      city: locationData.city || '',
      upazila: locationData.upazila || '',
      district: locationData.district || '',
      latitude: locationData.latitude,
      longitude: locationData.longitude
    }));
    console.log('CustomerProfile: Updated form data with location');
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      
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

    if (!formData.latitude || !formData.longitude) {
      setError(t('profile.selectValidLocation'));
      setLoading(false);
      return;
    }

    try {
      let response;
      
      if (photoFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('customerName', formData.customerName);
        uploadFormData.append('phone', formData.phone);
        uploadFormData.append('gender', formData.gender);
        uploadFormData.append('city', formData.city);
        uploadFormData.append('upazila', formData.upazila);
        uploadFormData.append('district', formData.district);
        uploadFormData.append('latitude', formData.latitude);
        uploadFormData.append('longitude', formData.longitude);
        uploadFormData.append('photo', photoFile);
        
        response = await authService.updateCustomerProfileWithPhoto(uploadFormData);
      } else {
        const submitData = {
          customerName: formData.customerName,
          phone: formData.phone,
          gender: formData.gender,
          city: formData.city,
          upazila: formData.upazila,
          district: formData.district,
          latitude: formData.latitude,
          longitude: formData.longitude
        };
        response = await authService.updateCustomerProfile(submitData);
      }
      
      if (response.success) {
        setProfile(response.data);
        setSuccess(t('profile.profileUpdated'));
        setIsEditing(false);
        setPhotoFile(null);
        setPhotoPreview(null);
        await checkAuthStatus();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || t('profile.profileUpdateError');
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
    if (profile) {
      setFormData({
        customerName: profile.customerName || '',
        photo: profile.photo || '',
        phone: profile.phone || '',
        gender: profile.gender || '',
        city: profile.city || '',
        upazila: profile.upazila || '',
        district: profile.district || '',
        latitude: profile.latitude || null,
        longitude: profile.longitude || null
      });
    }
  };

  if (loading && !profile) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  if (!profile) {
    return <div className="error">{t('profile.profileNotFound')}</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>{t('profile.myProfile')}</h1>
        <div className="user-type-badge customer">{t('auth.customer')}</div>
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
                <label>{t('profile.name')}:</label>
                <span>{profile.customerName}</span>
              </div>
              <div className="info-group">
                <label>{t('auth.email')}:</label>
                <span>{profile.gmail}</span>
              </div>
              <div className="info-group">
                <label>{t('profile.phone')}:</label>
                <span>{profile.phone}</span>
              </div>
              <div className="info-group">
                <label>{t('profile.gender')}:</label>
                <span>{profile.gender}</span>
              </div>
              <div className="info-group">
                <label>{t('location.location')}:</label>
                <span>{[profile.city, profile.upazila, profile.district].filter(Boolean).join(', ')}</span>
              </div>
            </div>

            <button 
              className="edit-btn" 
              onClick={() => setIsEditing(true)}
            >
              {t('profile.editProfile')}
            </button>
          </div>
        ) : (
          <div className="profile-edit">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="customerName">{t('profile.name')} *</label>
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
                <label htmlFor="photo">{t('profile.profilePhoto')}</label>
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
                      {t('profile.removePhoto')}
                    </button>
                  </div>
                )}
                <small className="photo-help">
                  {t('profile.uploadPhotoHelp')}
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="phone">{t('profile.phone')} *</label>
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
                <label htmlFor="gender">{t('profile.gender')} *</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">{t('profile.selectGender')}</option>
                  <option value="Male">{t('profile.male')}</option>
                  <option value="Female">{t('profile.female')}</option>
                  <option value="Other">{t('profile.other')}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t('profile.updateLocation')} *</label>
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
                  {t('profile.locationHelp')}
                </small>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="save-btn" 
                  disabled={loading}
                >
                  {loading ? t('profile.saving') : t('profile.saveChanges')}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={handleCancel}
                  disabled={loading}
                >
                  {t('common.cancel')}
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