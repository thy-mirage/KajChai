import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const Signup = () => {
  const [step, setStep] = useState(1); // 1: signup form, 2: verification
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'CUSTOMER',
    name: '',
    phone: '',
    gender: '',
    city: '',
    upazila: '',
    district: '',
    division: '',
    // Worker specific fields
    field: '',
    experience: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { initiateSignup, completeSignup, resendVerificationCode } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.name || !formData.phone || 
        !formData.gender || !formData.city || !formData.upazila || !formData.district || !formData.division) {
      setError('Please fill in all required fields');
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

    const signupPayload = {
      email: formData.email,
      password: formData.password,
      role: formData.role,
      name: formData.name,
      phone: formData.phone,
      gender: formData.gender,
      city: formData.city,
      upazila: formData.upazila,
      district: formData.district,
      division: formData.division
    };

    // Add worker-specific fields if role is WORKER
    if (formData.role === 'WORKER') {
      signupPayload.field = formData.field;
      signupPayload.experience = parseFloat(formData.experience);
    }

    const result = await initiateSignup(signupPayload);
    
    if (result.success) {
      setStep(2);
      setSuccess('Verification code sent to your email!');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');

    const signupPayload = {
      email: formData.email,
      password: formData.password,
      role: formData.role,
      name: formData.name,
      phone: formData.phone,
      gender: formData.gender,
      city: formData.city,
      upazila: formData.upazila,
      district: formData.district,
      division: formData.division
    };

    if (formData.role === 'WORKER') {
      signupPayload.field = formData.field;
      signupPayload.experience = parseFloat(formData.experience);
    }

    const result = await completeSignup(signupPayload, verificationCode);
    
    if (result.success) {
      setSuccess('Account created successfully! You can now login.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.message);
    }
    
    setLoading(false);
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
            <h1>Verify Your Email</h1>
            <p>Enter the 6-digit code sent to {formData.email}</p>
          </div>

          <form onSubmit={handleVerification} className="auth-form">
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <label htmlFor="verificationCode">Verification Code</label>
              <input
                type="text"
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
                maxLength="6"
                placeholder="Enter 6-digit code"
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
          <h1>Join KajChai</h1>
          <p>Create your account to get started</p>
        </div>

        <form onSubmit={handleSignup} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Role Selection */}
          <div className="form-group">
            <label htmlFor="role">Account Type</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="CUSTOMER">Customer</option>
              <option value="WORKER">Worker</option>
            </select>
          </div>

          {/* Basic Information */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter password (min 6 chars)"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="+8801234567890"
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
          </div>

          {/* Address Information */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City *</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                placeholder="Enter your city"
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
                placeholder="Enter your upazila"
                disabled={loading}
              />
            </div>
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
              placeholder="Enter your district"
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
              placeholder="Enter your division"
              disabled={loading}
            />
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
