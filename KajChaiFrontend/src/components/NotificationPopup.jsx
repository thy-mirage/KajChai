import React, { useState, useEffect } from 'react';
import './NotificationPopup.css';

const NotificationPopup = ({ message, type = 'info', duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Wait for animation to complete
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '🔔';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`notification-popup ${isVisible ? 'show' : 'hide'} ${type}`}>
      <div className="popup-content">
        <span className="popup-icon">{getIcon()}</span>
        <span className="popup-message">{message}</span>
        <button className="popup-close" onClick={handleClose}>×</button>
      </div>
    </div>
  );
};

export default NotificationPopup;
