import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import profileService from '../services/profileService';
import chatService from '../services/chatService';
import WorkerSearch from './WorkerSearch';
import ReportWorkerModal from './ReportWorkerModal';
import './HirePost.css'; // Use the same CSS as HirePostList

const WorkerList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [sortByLocation, setSortByLocation] = useState(false);
  const [contactingWorker, setContactingWorker] = useState(null);
  
  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedWorkerToReport, setSelectedWorkerToReport] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalWorkers, setTotalWorkers] = useState(0);
  const workersPerPage = 10;
  
  // Get selected worker from URL params
  const urlParams = new URLSearchParams(location.search);
  const selectedWorkerId = urlParams.get('worker');
  const selectedWorker = workers.find(w => w.workerId === parseInt(selectedWorkerId));
  const showAllWorkers = !selectedWorkerId;

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
  }, [selectedField, sortByLocation, currentPage, user]);

  // Load selected worker if it's not in the current workers list
  useEffect(() => {
    if (selectedWorkerId && !selectedWorker) {
      loadSelectedWorker(selectedWorkerId);
    }
  }, [selectedWorkerId, selectedWorker]);

  const loadWorkers = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await profileService.getAllWorkers(
        selectedField || null, 
        sortByLocation, 
        currentPage, 
        workersPerPage
      );
      
      // Handle both old format (array) and new format (paginated object)
      if (Array.isArray(data)) {
        // Old format - just a list
        setWorkers(data);
        setTotalPages(1);
        setTotalWorkers(data.length);
      } else {
        // New format - paginated response
        setWorkers(data.workers || []);
        setTotalPages(data.totalPages || 1);
        setTotalWorkers(data.totalElements || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedWorker = async (workerId) => {
    try {
      const workerProfile = await profileService.getWorkerProfile(workerId);
      // Add the selected worker to the workers list if it's not already there
      setWorkers(prev => {
        const exists = prev.find(w => w.workerId === parseInt(workerId));
        if (!exists) {
          return [workerProfile, ...prev];
        }
        return prev;
      });
    } catch (err) {
      console.error('Error loading selected worker:', err);
      // If we can't load the worker, redirect back to the list
      const params = new URLSearchParams(location.search);
      params.delete('worker');
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
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

  const handleReportWorker = (worker) => {
    setSelectedWorkerToReport(worker);
    setShowReportModal(true);
  };

  const handleReportModalClose = () => {
    setShowReportModal(false);
    setSelectedWorkerToReport(null);
  };

  const handleReportSubmit = async (reportData) => {
    // The report submission will be handled in the ReportWorkerModal
    handleReportModalClose();
  };

  // Handle worker selection from search
  const handleWorkerSelect = (searchResult) => {
    // Navigate to the worker detail view using URL params
    const params = new URLSearchParams(location.search);
    params.set('worker', searchResult.workerId.toString());
    navigate(`${location.pathname}?${params.toString()}`);
  };

  // Remove the handleBackToWorkers function since browser back will handle it

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0); // Scroll to top when changing pages
  };

  // Handle field change - reset to first page and clear worker selection
  const handleFieldChange = (newField) => {
    setSelectedField(newField);
    setCurrentPage(1);
    
    // Clear worker selection if any
    const params = new URLSearchParams(location.search);
    params.delete('worker');
    if (params.toString()) {
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    } else {
      navigate(location.pathname, { replace: true });
    }
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);
      
      // Adjust if we're near the beginning or end
      if (currentPage <= 3) {
        endPage = Math.min(totalPages, 5);
      }
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
      }
      
      // Add first page and ellipsis if needed
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('...');
        }
      }
      
      // Add page range
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add last page and ellipsis if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
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
        
        {/* Search component */}
        {showAllWorkers && (
          <div style={{ marginBottom: '20px' }}>
            <WorkerSearch 
              onWorkerSelect={handleWorkerSelect}
              selectedField={selectedField}
            />
          </div>
        )}
        
        {/* Filter section - only show when viewing all workers */}
        {showAllWorkers && (
          <div className="filter-section">
            <select
              value={selectedField}
              onChange={(e) => handleFieldChange(e.target.value)}
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
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Selected worker view */}
      {selectedWorker && (
        <div className="posts-grid">
          <div key={selectedWorker.workerId} className="hire-post-card">
            <div className="card-header">
              <div className="field-badge">{getFieldTranslation(selectedWorker.field)}</div>
              <div className="worker-rating">
                {formatRating(selectedWorker.rating)}
              </div>
            </div>
            
            <div className="card-content">
              <div className="worker-photo-section">
                {selectedWorker.photo ? (
                  <img 
                    src={selectedWorker.photo} 
                    alt={selectedWorker.name}
                    className="worker-photo-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="worker-avatar-fallback"
                  style={{ display: selectedWorker.photo ? 'none' : 'flex' }}
                >
                  {selectedWorker.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              </div>
              
              <div className="worker-info-section">
                <h4 className="worker-name">{selectedWorker.name}</h4>
                
                <div className="post-details">
                  <div className="detail-item">
                    <strong>{t('workers.experience')}:</strong> {selectedWorker.experience || t('common.noData')}
                  </div>
                  
                  <div className="detail-item">
                    <strong>{t('jobs.location')}:</strong> {formatLocation(selectedWorker.upazila, selectedWorker.district)}
                  </div>
                  
                  <div className="detail-item">
                    <strong>{t('profile.phone')}:</strong> {selectedWorker.phone}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card-actions">
              <button 
                className="btn-primary"
                onClick={() => handleContactWorker(selectedWorker)}
                disabled={contactingWorker === selectedWorker.workerId}
              >
                {contactingWorker === selectedWorker.workerId ? t('workers.startingChat') : t('workers.contactWorker')}
              </button>
              <button 
                className="btn-secondary"
                onClick={() => handleReportWorker(selectedWorker)}
                style={{ marginLeft: '10px' }}
              >
                {t('workers.reportWorker')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All workers view */}
      {showAllWorkers && (
        <>
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
                    <button 
                      className="btn-secondary"
                      onClick={() => handleReportWorker(worker)}
                      style={{ marginLeft: '10px' }}
                    >
                      {t('workers.reportWorker')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                {t('common.showing')} {((currentPage - 1) * workersPerPage) + 1}-{Math.min(currentPage * workersPerPage, totalWorkers)} {t('common.of')} {totalWorkers} {t('workers.workers')}
              </div>
              
              {/* Previous button */}
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ‹ {t('common.previous')}
              </button>
              
              {/* Page numbers */}
              {generatePageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="pagination-ellipsis">...</span>
                  ) : (
                    <button
                      className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}
              
              {/* Next button */}
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                {t('common.next')} ›
              </button>
            </div>
          )}
        </>
      )}
      
      {/* Report Worker Modal */}
      {showReportModal && selectedWorkerToReport && (
        <ReportWorkerModal
          worker={selectedWorkerToReport}
          onClose={handleReportModalClose}
          onSubmit={handleReportSubmit}
        />
      )}
    </div>
  );
};

export default WorkerList;