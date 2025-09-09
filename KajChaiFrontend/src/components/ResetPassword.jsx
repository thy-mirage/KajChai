import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import './Auth.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: searchParams.get('email') || '',
    resetCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [currentStep, setCurrentStep] = useState(1); // 1: Enter code, 2: Set new password
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // If no email in URL params, redirect to forgot password
    if (!formData.email) {
      navigate('/forgot-password');
    }
  }, [formData.email, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear messages when user starts typing
    if (message) {
      setMessage('');
      setIsSuccess(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!formData.resetCode) {
      setMessage('Please enter the reset code');
      setIsSuccess(false);
      return;
    }

    if (formData.resetCode.length !== 6) {
      setMessage('Reset code must be 6 digits');
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    
    try {
      const response = await authService.verifyResetCode(formData.email, formData.resetCode);
      
      if (response.success) {
        setMessage('Code verified successfully!');
        setIsSuccess(true);
        setTimeout(() => {
          setCurrentStep(2);
          setMessage('');
          setIsSuccess(false);
        }, 1500);
      } else {
        setMessage(response.message || 'Invalid reset code');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Verify code error:', error);
      setMessage('Network error. Please try again.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!formData.newPassword) {
      setMessage('Please enter a new password');
      setIsSuccess(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setIsSuccess(false);
      return;
    }

    if (!formData.confirmPassword) {
      setMessage('Please confirm your password');
      setIsSuccess(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    
    try {
      const response = await authService.resetPassword({
        email: formData.email,
        resetCode: formData.resetCode,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });
      
      if (response.success) {
        setMessage('Password reset successfully! Redirecting to login...');
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage(response.message || 'Failed to reset password');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setMessage('Network error. Please try again.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCode = () => {
    setCurrentStep(1);
    setMessage('');
    setIsSuccess(false);
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const response = await authService.forgotPassword(formData.email);
      if (response.success) {
        setMessage('New reset code sent to your email');
        setIsSuccess(true);
      } else {
        setMessage('Failed to resend code. Please try again.');
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage('Failed to resend code. Please try again.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (currentStep === 1) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Enter Reset Code</h1>
            <p>We sent a 6-digit code to {formData.email}</p>
          </div>

          <form onSubmit={handleVerifyCode} className="auth-form">
            <div className="form-group">
              <label htmlFor="resetCode">Reset Code *</label>
              <input
                type="text"
                id="resetCode"
                name="resetCode"
                value={formData.resetCode}
                onChange={handleChange}
                placeholder="Enter 6-digit code"
                disabled={loading}
                maxLength="6"
                className="verification-input"
                autoComplete="one-time-code"
              />
            </div>

            {message && (
              <div className={isSuccess ? 'success-message' : 'error-message'}>
                {message}
              </div>
            )}

            <button
              type="submit"
              className={`auth-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              type="button"
              className="resend-button"
              onClick={handleResendCode}
              disabled={loading}
            >
              Resend Code
            </button>
          </form>

          <div className="auth-footer">
            <p>
              <Link to="/forgot-password" className="auth-link">Back to email entry</Link>
            </p>
            <p>
              Remember your password? <Link to="/login" className="auth-link">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Set New Password</h1>
          <p>Enter your new password for {formData.email}</p>
        </div>

        <form onSubmit={handleResetPassword} className="auth-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password *</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter new password (min 6 characters)"
              disabled={loading}
              autoComplete="new-password"
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
              placeholder="Confirm your new password"
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          {message && (
            <div className={isSuccess ? 'success-message' : 'error-message'}>
              {message}
            </div>
          )}

          <button
            type="submit"
            className={`auth-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <button
            type="button"
            className="back-button"
            onClick={handleBackToCode}
            disabled={loading}
          >
            ← Back to Code Entry
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Remember your password? <Link to="/login" className="auth-link">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
