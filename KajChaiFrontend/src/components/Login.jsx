import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import './Auth.css';

const Login = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-header-content">
            <h1>{t('dashboard.welcome')}</h1>
            <p>{t('auth.loginDescription', 'Sign in to your account')}</p>
          </div>
          <div className="auth-language-switcher">
            <LanguageSwitcher />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder={t('auth.emailPlaceholder', 'Enter your email')}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={`auth-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? t('auth.signingIn', 'Signing In...') : t('auth.login')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <Link to="/forgot-password" className="auth-link">
              {t('auth.forgotPassword')}
            </Link>
          </p>
          <p>
            {t('auth.noAccount', "Don't have an account?")}{' '}
            <Link to="/signup" className="auth-link">
              {t('auth.signupHere', 'Sign up here')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
