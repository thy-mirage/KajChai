import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import LocationSelector from './LocationSelector';
import LanguageSwitcher from './LanguageSwitcher';
import './Auth.css';

const Signup = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: signup form, 2: verification
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'CUSTOMER',
    name: '',
    phone: '',
    gender: '',
    // Location data
    latitude: null,
    longitude: null,
    city: '',
    upazila: '',
    district: '',
    fullAddress: '',
    // Worker specific fields
    field: '',
    experience: '',
    // Photo upload
    photo: null
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [locationSelected, setLocationSelected] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { initiateSignup, initiateSignupWithPhoto, completeSignup, completeSignupWithPhoto, resendVerificationCode } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        photo: file
      });
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData({
        ...formData,
        photo: null
      });
      setPhotoPreview(null);
    }
    if (error) setError('');
  };

  const removePhoto = () => {
    setFormData({
      ...formData,
      photo: null
    });
    setPhotoPreview(null);
  };

  const handleLocationSelect = (locationData) => {
    setFormData({
      ...formData,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      city: locationData.city,
      upazila: locationData.upazila,
      district: locationData.district,
      fullAddress: locationData.fullAddress
    });
    setLocationSelected(true);
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.name || !formData.phone || 
        !formData.gender) {
      setError('Please fill in all required fields');
      return false;
    }

    // Location is required for new signups
    if (!formData.latitude || !formData.longitude || !formData.city || !formData.district) {
      setError('Please select your location on the map');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.role === 'WORKER' && (!formData.field || !formData.experience)) {
      setError('Please fill in field and experience for worker account');
      return false;
    }

    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      let result;
      
      if (formData.photo) {
        // Use multipart form data for photo upload
        const uploadFormData = new FormData();
        uploadFormData.append('email', formData.email);
        uploadFormData.append('password', formData.password);
        uploadFormData.append('role', formData.role);
        uploadFormData.append('name', formData.name);
        uploadFormData.append('phone', formData.phone);
        uploadFormData.append('gender', formData.gender);
        
        // Add location data only if provided
        if (formData.latitude && formData.longitude) {
          uploadFormData.append('latitude', formData.latitude);
          uploadFormData.append('longitude', formData.longitude);
          uploadFormData.append('city', formData.city);
          uploadFormData.append('upazila', formData.upazila);
          uploadFormData.append('district', formData.district);
          uploadFormData.append('fullAddress', formData.fullAddress);
        }
        uploadFormData.append('photo', formData.photo);
        
        // Add worker-specific fields if role is WORKER
        if (formData.role === 'WORKER') {
          uploadFormData.append('field', formData.field);
          uploadFormData.append('experience', parseFloat(formData.experience));
        }
        
        result = await initiateSignupWithPhoto(uploadFormData);
      } else {
        // Use regular JSON payload for signup without photo
        const signupPayload = {
          email: formData.email,
          password: formData.password,
          role: formData.role,
          name: formData.name,
          phone: formData.phone,
          gender: formData.gender
        };

        // Add location data only if provided
        if (formData.latitude && formData.longitude) {
          signupPayload.latitude = formData.latitude;
          signupPayload.longitude = formData.longitude;
          signupPayload.city = formData.city;
          signupPayload.upazila = formData.upazila;
          signupPayload.district = formData.district;
          signupPayload.fullAddress = formData.fullAddress;
        }

        // Add worker-specific fields if role is WORKER
        if (formData.role === 'WORKER') {
          signupPayload.field = formData.field;
          signupPayload.experience = parseFloat(formData.experience);
        }

        result = await initiateSignup(signupPayload);
      }
      
      if (result.success) {
        setStep(2);
        setSuccess('Verification code sent to your email!');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to initiate signup. Please try again.');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let result;
      
      if (formData.photo) {
        // Use multipart form data for photo upload
        const uploadFormData = new FormData();
        uploadFormData.append('email', formData.email);
        uploadFormData.append('password', formData.password);
        uploadFormData.append('role', formData.role);
        uploadFormData.append('name', formData.name);
        uploadFormData.append('phone', formData.phone);
        uploadFormData.append('gender', formData.gender);
        uploadFormData.append('city', formData.city);
        uploadFormData.append('upazila', formData.upazila);
        uploadFormData.append('district', formData.district);
        uploadFormData.append('photo', formData.photo);
        
        if (formData.role === 'WORKER') {
          uploadFormData.append('field', formData.field);
          uploadFormData.append('experience', parseFloat(formData.experience));
        }
        
        result = await completeSignupWithPhoto(uploadFormData, verificationCode);
      } else {
        // Use regular JSON payload for signup without photo
        const signupPayload = {
          email: formData.email,
          password: formData.password,
          role: formData.role,
          name: formData.name,
          phone: formData.phone,
          gender: formData.gender,
          city: formData.city,
          upazila: formData.upazila,
          district: formData.district
        };

        if (formData.role === 'WORKER') {
          signupPayload.field = formData.field;
          signupPayload.experience = parseFloat(formData.experience);
        }

        result = await completeSignup(signupPayload, verificationCode);
      }
      
      if (result.success) {
        setSuccess('Account created successfully! You can now login.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to verify account. Please try again.');
      console.error('Verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    const result = await resendVerificationCode(formData.email);
    
    if (result.success) {
      setSuccess('Verification code sent again!');
      setError('');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  if (step === 2) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-header-content">
              <h1>{t('auth.verifyEmail')}</h1>
              <p>{t('auth.verifyEmailDescription', { email: formData.email })}</p>
            </div>
            <div className="auth-language-switcher">
              <LanguageSwitcher />
            </div>
          </div>

          <form onSubmit={handleVerification} className="auth-form">
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <label htmlFor="verificationCode">{t('auth.verificationCode')}</label>
              <input
                type="text"
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
                maxLength="6"
                placeholder={t('auth.verificationCodePlaceholder')}
                disabled={loading}
                className="verification-input"
              />
            </div>

            <button
              type="submit"
              className={`auth-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Account'}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              className="resend-button"
              disabled={loading}
            >
              Resend Code
            </button>
          </form>

          <div className="auth-footer">
            <button 
              onClick={() => setStep(1)}
              className="back-button"
            >
              ← Back to Signup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-header-content">
            <h1>{t('auth.joinKajChai')}</h1>
            <p>{t('auth.signupDescription')}</p>
          </div>
          <div className="auth-language-switcher">
            <LanguageSwitcher />
          </div>
        </div>

        <form onSubmit={handleSignup} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Role Selection */}
          <div className="form-group">
            <label htmlFor="role">{t('auth.accountType')}</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="CUSTOMER">{t('auth.customer')}</option>
              <option value="WORKER">{t('auth.worker')}</option>
            </select>
          </div>

          {/* Basic Information */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">{t('auth.fullName')} *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder={t('auth.fullNamePlaceholder')}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">{t('auth.emailAddress')} *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder={t('auth.emailPlaceholder')}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">{t('auth.password')} *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder={t('auth.passwordPlaceholder')}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">{t('auth.confirmPassword')} *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder={t('auth.confirmPasswordPlaceholder')}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">{t('auth.phoneNumber')} *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder={t('auth.phonePlaceholder')}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="gender">{t('auth.gender')} *</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">{t('auth.selectGender')}</option>
                <option value="Male">{t('auth.male')}</option>
                <option value="Female">{t('auth.female')}</option>
                <option value="Other">{t('auth.other')}</option>
              </select>
            </div>
          </div>

          {/* Location Selection */}
          <div className="form-group location-section">
            <label>Select Your Location *</label>
            <p className="location-helper">
              {locationSelected ? 
                `📍 Location selected: ${formData.city}, ${formData.district}` : 
                "Please select your precise location on the map below"
              }
            </p>
            <LocationSelector 
              onLocationSelect={handleLocationSelect}
              showCurrentLocationButton={true}
            />
          </div>

          {/* Profile Photo Upload */}
          <div className="form-group">
            <label htmlFor="photo">Profile Photo (Optional)</label>
            <input
              type="file"
              id="photo"
              name="photo"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={loading}
              className="photo-input"
            />
            {photoPreview && (
              <div className="photo-preview">
                <img src={photoPreview} alt="Profile Preview" className="preview-image" />
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
              Upload a profile photo (JPG, PNG, GIF) - Optional
            </small>
          </div>

          {/* Worker-specific fields */}
          {formData.role === 'WORKER' && (
            <>
              <div className="worker-section">
                <h3>Worker Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="field">Field of Work *</label>
                    <input
                      type="text"
                      id="field"
                      name="field"
                      value={formData.field}
                      onChange={handleChange}
                      required={formData.role === 'WORKER'}
                      placeholder="e.g., Plumbing, Electrical, Carpentry"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="experience">Experience (Years) *</label>
                    <input
                      type="number"
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      required={formData.role === 'WORKER'}
                      placeholder="Years of experience"
                      min="0"
                      step="0.5"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className={`auth-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
