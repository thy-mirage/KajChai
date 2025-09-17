import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import LanguageSwitcher from './LanguageSwitcher';
import './Auth.css';

const ResetPassword = () => {
  const { t } = useTranslation();
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
      setMessage(t('auth.enterResetCode'));
      setIsSuccess(false);
      return;
    }

    if (formData.resetCode.length !== 6) {
      setMessage(t('auth.resetCode6Digits'));
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    
    try {
      const response = await authService.verifyResetCode(formData.email, formData.resetCode);
      
      if (response.success) {
        setMessage(t('auth.codeVerifiedSuccessfully'));
        setIsSuccess(true);
        setTimeout(() => {
          setCurrentStep(2);
          setMessage('');
          setIsSuccess(false);
        }, 1500);
      } else {
        setMessage(response.message || t('auth.invalidResetCode'));
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Verify code error:', error);
      setMessage(t('auth.networkError'));
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!formData.newPassword) {
      setMessage(t('auth.enterNewPassword'));
      setIsSuccess(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage(t('auth.passwordMinLength'));
      setIsSuccess(false);
      return;
    }

    if (!formData.confirmPassword) {
      setMessage(t('auth.pleaseConfirmPassword'));
      setIsSuccess(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage(t('auth.passwordsDoNotMatch'));
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
        setMessage(t('auth.passwordResetSuccess'));
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage(response.message || t('auth.failedToResetPassword'));
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setMessage(t('auth.networkError'));
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
        setMessage(t('auth.newResetCodeSent'));
        setIsSuccess(true);
      } else {
        setMessage(t('auth.failedToResendCode'));
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage(t('auth.failedToResendCode'));
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
            <div className="auth-header-content">
              <h1>{t('auth.enterResetCode')}</h1>
              <p>{t('auth.resetCodeSentTo', { email: formData.email })}</p>
            </div>
            <div className="auth-language-switcher">
              <LanguageSwitcher />
            </div>
          </div>

          <form onSubmit={handleVerifyCode} className="auth-form">
            <div className="form-group">
              <label htmlFor="resetCode">{t('auth.resetCode')} *</label>
              <input
                type="text"
                id="resetCode"
                name="resetCode"
                value={formData.resetCode}
                onChange={handleChange}
                placeholder={t('auth.enter6DigitCode')}
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
              {loading ? t('auth.verifying') : t('auth.verifyCode')}
            </button>

            <button
              type="button"
              className="resend-button"
              onClick={handleResendCode}
              disabled={loading}
            >
              {t('auth.resendCode')}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              <Link to="/forgot-password" className="auth-link">{t('auth.backToEmailEntry')}</Link>
            </p>
            <p>
              {t('auth.rememberPassword')} <Link to="/login" className="auth-link">{t('auth.signInHere')}</Link>
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
          <div className="auth-header-content">
            <h1>{t('auth.setNewPassword')}</h1>
            <p>{t('auth.enterNewPasswordFor', { email: formData.email })}</p>
          </div>
          <div className="auth-language-switcher">
            <LanguageSwitcher />
          </div>
        </div>

        <form onSubmit={handleResetPassword} className="auth-form">
          <div className="form-group">
            <label htmlFor="newPassword">{t('auth.newPassword')} *</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder={t('auth.newPasswordPlaceholder')}
              disabled={loading}
              autoComplete="new-password"
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
              placeholder={t('auth.confirmNewPasswordPlaceholder')}
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
            {loading ? t('auth.resetting') : t('auth.resetPassword')}
          </button>

          <button
            type="button"
            className="back-button"
            onClick={handleBackToCode}
            disabled={loading}
          >
            ← {t('auth.backToCodeEntry')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {t('auth.rememberPassword')} <Link to="/login" className="auth-link">{t('auth.signInHere')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
