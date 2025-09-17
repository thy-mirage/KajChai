import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import LanguageSwitcher from './LanguageSwitcher';
import './Auth.css';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      setMessage(t('auth.enterEmailAddress'));
      setIsSuccess(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage(t('auth.enterValidEmail'));
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    
    try {
      const response = await authService.forgotPassword(formData.email);
      
      if (response.success) {
        setMessage(response.message);
        setIsSuccess(true);
        // Clear form after success
        setFormData({ email: '' });
        // Navigate to reset password page with email parameter
        setTimeout(() => {
          navigate(`/reset-password?email=${encodeURIComponent(formData.email)}`);
        }, 2000);
      } else {
        setMessage(response.message || t('auth.failedToSendResetCode'));
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setMessage(t('auth.networkError'));
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-header-content">
            <h1>{t('auth.resetPassword')}</h1>
            <p>{t('auth.resetPasswordDescription')}</p>
          </div>
          <div className="auth-language-switcher">
            <LanguageSwitcher />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">{t('auth.emailAddress')} *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('auth.enterEmailPlaceholder')}
              disabled={loading}
              autoComplete="email"
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
            {loading ? t('auth.sending') : t('auth.sendResetCode')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {t('auth.rememberPassword')} <Link to="/login" className="auth-link">{t('auth.signInHere')}</Link>
          </p>
          <p>
            {t('auth.dontHaveAccount')} <Link to="/signup" className="auth-link">{t('auth.signupHere')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
