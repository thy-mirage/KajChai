import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import profileService from '../services/profileService';
import chatService from '../services/chatService';
import './HirePost.css'; // Use the same CSS as HirePostList

const WorkerList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [sortByLocation, setSortByLocation] = useState(false);
  const [contactingWorker, setContactingWorker] = useState(null);

  // Job fields from the backend
  const JOB_FIELDS = [
    'Electrician',
    'Plumber',
    'Carpenter',
    'Painter',
    'Maid',
    'Chef',
    'Driver',
    'Photographer'
  ];

  // Function to get translated field names
  const getFieldTranslation = (field) => {
    const fieldKey = field.toLowerCase();
    return t(`workers.${fieldKey}`, field); // Fallback to original if no translation
  };

  useEffect(() => {
    if (user?.role === 'CUSTOMER') {
      loadWorkers();
    }
  }, [selectedField, sortByLocation, user]);

  const loadWorkers = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await profileService.getAllWorkers(selectedField || null, sortByLocation);
      setWorkers(data);
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const formatRating = (rating) => {
    if (rating === null || rating === undefined) return t('workers.notRated');
    return `${rating.toFixed(1)} ⭐`;
  };

  const formatLocation = (upazila, district) => {
    if (!upazila && !district) return t('location.locationNotSpecified');
    if (!upazila) return district;
    if (!district) return upazila;
    if (upazila === district) return upazila;
    return `${upazila}, ${district}`;
  };

  const handleContactWorker = async (worker) => {
    setContactingWorker(worker.workerId);
    
    try {
      // Create or get existing chat room with the worker
      const response = await chatService.createOrGetChatRoom(worker.workerId);
      
      if (response.success) {
        // Navigate to chat page
        navigate('/chat', { 
          state: { 
            openRoomId: response.chatRoom.roomId,
            workerName: worker.name 
          }
        });
      } else {
        throw new Error('Failed to create chat room');
      }
    } catch (error) {
      console.error('Error creating chat room:', error);
      alert(t('common.error'));
    } finally {
      setContactingWorker(null);
    }
  };

  if (user?.role !== 'CUSTOMER') {
    return (
      <div className="access-denied">
        <h3>{t('common.error')}</h3>
        <p>Only customers can view this page.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="hire-post-list">
      <div className="list-header">
        <h3>{t('workers.findWorkers')}</h3>
        
        <div className="filter-section">
          <select
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            className="field-filter"
          >
            <option value="">{t('workers.allFields')}</option>
            {JOB_FIELDS.map(field => (
              <option key={field} value={field}>{getFieldTranslation(field)}</option>
            ))}
          </select>
          
          <div className="location-sort-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={sortByLocation}
                onChange={(e) => setSortByLocation(e.target.checked)}
                className="location-checkbox"
              />
              <span className="checkmark">📍</span>
              {t('jobs.sortByLocation')}
            </label>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {workers.length === 0 ? (
        <div className="no-posts">
          {t('workers.noWorkers')}
        </div>
      ) : (
        <div className="posts-grid">
          {workers.map(worker => (
            <div key={worker.workerId} className="hire-post-card">
              <div className="card-header">
                <div className="field-badge">{getFieldTranslation(worker.field)}</div>
                <div className="worker-rating">
                  {formatRating(worker.rating)}
                </div>
              </div>
              
              <div className="card-content">
                <div className="worker-photo-section">
                  {worker.photo ? (
                    <img 
                      src={worker.photo} 
                      alt={worker.name}
                      className="worker-photo-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="worker-avatar-fallback"
                    style={{ display: worker.photo ? 'none' : 'flex' }}
                  >
                    {worker.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                </div>
                
                <div className="worker-info-section">
                  <h4 className="worker-name">{worker.name}</h4>
                  
                  <div className="post-details">
                    <div className="detail-item">
                      <strong>{t('workers.experience')}:</strong> {worker.experience || t('common.noData')}
                    </div>
                    
                    <div className="detail-item">
                      <strong>{t('jobs.location')}:</strong> {formatLocation(worker.upazila, worker.district)}
                    </div>
                    
                    <div className="detail-item">
                      <strong>{t('profile.phone')}:</strong> {worker.phone}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card-actions">
                <button 
                  className="btn-primary"
                  onClick={() => handleContactWorker(worker)}
                  disabled={contactingWorker === worker.workerId}
                >
                  {contactingWorker === worker.workerId ? t('workers.startingChat') : t('workers.contactWorker')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkerList;