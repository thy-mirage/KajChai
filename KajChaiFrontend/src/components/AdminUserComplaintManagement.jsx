import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_CONFIG } from '../config/api';
import './AdminUserComplaintManagement.css';

const AdminUserComplaintManagement = ({ embedded = false }) => {
    const { user, getToken } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [stats, setStats] = useState({});
    const [processingComplaint, setProcessingComplaint] = useState(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [actionType, setActionType] = useState(''); // 'ban', 'restrict', 'clarify', 'reject'
    const [actionReason, setActionReason] = useState('');
    const [clarificationRequest, setClarificationRequest] = useState('');

    const complaintStatuses = [
        { value: '', label: t('admin.allStatuses') },
        { value: 'PENDING', label: t('admin.pending') },
        { value: 'UNDER_INVESTIGATION', label: t('admin.investigating') },
        { value: 'RESOLVED', label: t('admin.resolved') },
        { value: 'REJECTED', label: t('admin.rejected') }
    ];

    const getCurrentUserToken = () => {
        const currentUserEmail = sessionStorage.getItem('current_user_email');
        if (currentUserEmail) {
            const userToken = localStorage.getItem(`jwt_token_${currentUserEmail}`);
            if (userToken) {
                return userToken;
            }
        }
        return localStorage.getItem('jwt_token');
    };

    useEffect(() => {
        if (user && user.role === 'ADMIN') {
            fetchComplaints();
            fetchStats();
        }
    }, [user, currentPage, filterStatus]);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const token = getCurrentUserToken();
            
            let url = `${API_CONFIG.BASE_URL}/api/admin/user-complaints`;
            if (filterStatus) {
                url = `${API_CONFIG.BASE_URL}/api/admin/user-complaints/status/${filterStatus}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch complaints: ${response.status}`);
            }

            const data = await response.json();
            setComplaints(Array.isArray(data) ? data : []);
            
        } catch (error) {
            console.error('Error fetching complaints:', error);
            setComplaints([]);
            alert(t('admin.failedToFetchComplaints'));
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const complaints = await fetch(`${API_CONFIG.BASE_URL}/api/admin/user-complaints`, {
                headers: {
                    'Authorization': `Bearer ${getCurrentUserToken()}`,
                    'Content-Type': 'application/json'
                }
            }).then(res => res.json());

            // Calculate stats from complaints
            const stats = {
                totalComplaints: complaints.length,
                pendingComplaints: complaints.filter(c => c.status === 'PENDING').length,
                underInvestigationComplaints: complaints.filter(c => c.status === 'UNDER_INVESTIGATION').length,
                resolvedComplaints: complaints.filter(c => c.status === 'RESOLVED').length,
                rejectedComplaints: complaints.filter(c => c.status === 'REJECTED').length
            };
            
            setStats(stats);
        } catch (error) {
            console.error('Error fetching complaint stats:', error);
        }
    };

    const handleStatusFilter = (status) => {
        setFilterStatus(status);
        setCurrentPage(0);
    };

    const openActionModal = (complaint, action) => {
        setSelectedComplaint(complaint);
        setActionType(action);
        setActionReason('');
        setClarificationRequest('');
        setShowActionModal(true);
    };

    const closeActionModal = () => {
        setShowActionModal(false);
        setSelectedComplaint(null);
        setActionReason('');
        setClarificationRequest('');
        setActionType('');
    };

    const handleSubmitAction = async () => {
        if (!selectedComplaint) return;

        try {
            setProcessingComplaint(selectedComplaint.complaintId);
            const token = getCurrentUserToken();
            let url;
            let body;

            switch (actionType) {
                case 'ban':
                    if (!actionReason.trim()) {
                        alert(t('admin.provideBanReason'));
                        return;
                    }
                    url = `${API_CONFIG.BASE_URL}/api/admin/user-complaints/${selectedComplaint.complaintId}/ban-worker`;
                    body = { reason: actionReason.trim() };
                    break;

                case 'restrict':
                    if (!actionReason.trim()) {
                        alert(t('admin.provideRestrictReason'));
                        return;
                    }
                    url = `${API_CONFIG.BASE_URL}/api/admin/user-complaints/${selectedComplaint.complaintId}/restrict-worker`;
                    body = { reason: actionReason.trim() };
                    break;

                case 'clarify':
                    if (!clarificationRequest.trim()) {
                        alert(t('admin.provideClarificationRequest'));
                        return;
                    }
                    url = `${API_CONFIG.BASE_URL}/api/admin/user-complaints/${selectedComplaint.complaintId}/request-clarification`;
                    body = { clarificationRequest: clarificationRequest.trim() };
                    break;

                case 'reject':
                    if (!actionReason.trim()) {
                        alert(t('admin.provideRejectReason'));
                        return;
                    }
                    url = `${API_CONFIG.BASE_URL}/api/admin/user-complaints/${selectedComplaint.complaintId}/status`;
                    body = { status: 'REJECTED', adminResponse: actionReason.trim() };
                    break;

                default:
                    alert(t('admin.invalidAction'));
                    return;
            }

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${actionType} complaint`);
            }

            // Success message based on action type
            let successMessage;
            switch (actionType) {
                case 'ban':
                    successMessage = t('admin.banSuccess');
                    break;
                case 'restrict':
                    successMessage = t('admin.restrictSuccess');
                    break;
                case 'clarify':
                    successMessage = t('admin.clarifySuccess');
                    break;
                case 'reject':
                    successMessage = t('admin.rejectSuccess');
                    break;
                default:
                    successMessage = 'Action completed successfully!';
            }
            
            alert(successMessage);
            fetchComplaints();
            fetchStats();
            closeActionModal();

        } catch (error) {
            console.error(`Error ${actionType}ing complaint:`, error);
            alert(`${t('admin.actionFailed')}: ${error.message}`);
        } finally {
            setProcessingComplaint(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'PENDING': return 'status-pending';
            case 'UNDER_INVESTIGATION': return 'status-investigating';
            case 'RESOLVED': return 'status-resolved';
            case 'REJECTED': return 'status-rejected';
            default: return 'status-default';
        }
    };

    const getReasonDisplayName = (reason) => {
        return reason.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    const parseEvidenceUrls = (evidenceUrls) => {
        if (!evidenceUrls) return [];
        try {
            return JSON.parse(evidenceUrls);
        } catch (e) {
            // If it's not JSON, try to split by comma
            return evidenceUrls.split(',').map(url => url.trim()).filter(url => url);
        }
    };

    if (!user || user.role !== 'ADMIN') {
        return <div className="access-denied">{t('admin.accessDenied')}</div>;
    }

    return (
        <div className={`admin-user-complaint-management ${embedded ? 'embedded' : ''}`}>
            {!embedded && (
                <div className="complaint-header">
                    <div className="header-top">
                        <button 
                            onClick={() => navigate('/admin/dashboard')} 
                            className="back-btn"
                            title={t('admin.backToDashboard')}
                        >
                            ← {t('admin.backToDashboard')}
                        </button>
                    </div>
                    <div className="header-content">
                        <h1>{t('admin.workerComplaintManagement')}</h1>
                        <p>{t('admin.manageCustomerComplaintsAgainstWorkers')}</p>
                    </div>
                </div>
            )}
            
            {embedded && (
                <div className="page-header">
                    <h1 className="page-title">{t('admin.workerComplaintManagement')}</h1>
                    <p className="page-subtitle">{t('admin.manageCustomerComplaintsAgainstWorkers')}</p>
                </div>
            )}

            {/* Statistics */}
            <div className="complaint-stats">
                <div className="stat-card">
                    <h3>{t('admin.totalComplaints')}</h3>
                    <div className="stat-number">{stats.totalComplaints || 0}</div>
                </div>
                <div className="stat-card pending">
                    <h3>{t('admin.pending')}</h3>
                    <div className="stat-number">{stats.pendingComplaints || 0}</div>
                </div>
                <div className="stat-card investigating">
                    <h3>{t('admin.investigating')}</h3>
                    <div className="stat-number">{stats.underInvestigationComplaints || 0}</div>
                </div>
                <div className="stat-card resolved">
                    <h3>{t('admin.resolved')}</h3>
                    <div className="stat-number">{stats.resolvedComplaints || 0}</div>
                </div>
                <div className="stat-card rejected">
                    <h3>{t('admin.rejected')}</h3>
                    <div className="stat-number">{stats.rejectedComplaints || 0}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="complaint-controls">
                <div className="filter-section">
                    <select
                        value={filterStatus}
                        onChange={(e) => handleStatusFilter(e.target.value)}
                        className="status-filter"
                    >
                        {complaintStatuses.map(status => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Complaints List */}
            <div className="complaints-list">
                {loading ? (
                    <div className="loading-container">
                        <div className="loading-header">
                            <div className="pulse-animation">
                                <div className="loading-icon">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
                                              fill="currentColor" className="star"/>
                                    </svg>
                                </div>
                                <h3>{t('admin.loadingComplaints')}</h3>
                                <p>Please wait while we fetch the latest complaints...</p>
                            </div>
                        </div>
                        
                        {/* Skeleton Cards */}
                        <div className="skeleton-cards">
                            {[1, 2, 3].map(index => (
                                <div key={index} className="skeleton-complaint-card">
                                    <div className="skeleton-header">
                                        <div className="skeleton-badge"></div>
                                        <div className="skeleton-id"></div>
                                        <div className="skeleton-date"></div>
                                    </div>
                                    <div className="skeleton-content">
                                        <div className="skeleton-title"></div>
                                        <div className="skeleton-line long"></div>
                                        <div className="skeleton-line medium"></div>
                                        <div className="skeleton-line short"></div>
                                    </div>
                                    <div className="skeleton-actions">
                                        <div className="skeleton-button"></div>
                                        <div className="skeleton-button"></div>
                                        <div className="skeleton-button"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (!complaints || complaints.length === 0) ? (
                    <div className="no-complaints">{t('admin.noComplaintsFound')}</div>
                ) : (
                    complaints.map(complaint => (
                        <div key={complaint.complaintId} className="complaint-card">
                            <div className="complaint-header-info">
                                <div className="complaint-meta">
                                    <span className={`status-badge ${getStatusBadgeClass(complaint.status)}`}>
                                        {complaint.status.replace('_', ' ')}
                                    </span>
                                    <span className="complaint-id">ID: {complaint.complaintId}</span>
                                    <span className="complaint-date">{formatDate(complaint.createdAt)}</span>
                                </div>
                                
                                {(complaint.status === 'PENDING' || complaint.status === 'UNDER_INVESTIGATION') && (
                                    <div className="complaint-actions">
                                        <button 
                                            onClick={() => openActionModal(complaint, 'ban')}
                                            className="ban-btn"
                                            disabled={processingComplaint === complaint.complaintId}
                                            title={t('admin.banWorkerTitle')}
                                        >
                                            🚫 {t('admin.ban')}
                                        </button>
                                        <button 
                                            onClick={() => openActionModal(complaint, 'restrict')}
                                            className="restrict-btn"
                                            disabled={processingComplaint === complaint.complaintId}
                                            title={t('admin.restrictWorkerTitle')}
                                        >
                                            ⚠️ {t('admin.restrict')}
                                        </button>
                                        <button 
                                            onClick={() => openActionModal(complaint, 'clarify')}
                                            className="clarify-btn"
                                            disabled={processingComplaint === complaint.complaintId}
                                            title={t('admin.requestClarificationTitle')}
                                        >
                                            ❓ {t('admin.clarify')}
                                        </button>
                                        <button 
                                            onClick={() => openActionModal(complaint, 'reject')}
                                            className="reject-btn"
                                            disabled={processingComplaint === complaint.complaintId}
                                            title={t('admin.rejectComplaintTitle')}
                                        >
                                            ❌ {t('admin.reject')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="complaint-content">
                                <div className="complaint-details">
                                    <h3>{t('admin.complaintDetails')}</h3>
                                    <div className="detail-row">
                                        <strong>{t('admin.reason')}:</strong> {getReasonDisplayName(complaint.reason)}
                                    </div>
                                    <div className="detail-row">
                                        <strong>{t('admin.reportedWorker')}:</strong> {complaint.reportedWorkerName}
                                    </div>
                                    <div className="detail-row">
                                        <strong>{t('admin.reportedBy')}:</strong> {complaint.reportedByCustomerName}
                                    </div>
                                    <div className="detail-row">
                                        <strong>{t('admin.description')}:</strong>
                                        <p>{complaint.description}</p>
                                    </div>
                                    
                                    {complaint.evidenceUrls && (
                                        <div className="detail-row">
                                            <strong>{t('admin.evidence')}:</strong>
                                            <div className="evidence-images">
                                                {parseEvidenceUrls(complaint.evidenceUrls).map((imageUrl, index) => (
                                                    <div key={index} className="evidence-image-container">
                                                        <img 
                                                            src={imageUrl} 
                                                            alt={`Evidence ${index + 1}`}
                                                            className="evidence-image"
                                                            onClick={() => window.open(imageUrl, '_blank')}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                        <div className="image-error-placeholder" style={{display: 'none'}}>
                                                            <span>📷</span>
                                                            <small>{t('admin.imageUnavailable')}</small>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {complaint.clarificationDeadline && (
                                        <div className="detail-row">
                                            <strong>{t('admin.clarificationDeadline')}:</strong> {formatDate(complaint.clarificationDeadline)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {complaint.adminResponse && (
                                <div className="admin-response">
                                    <h4>{t('admin.adminResponse')}</h4>
                                    <p>{complaint.adminResponse}</p>
                                    {complaint.resolvedAt && (
                                        <small>
                                            {t('admin.resolvedOn')} {formatDate(complaint.resolvedAt)}
                                        </small>
                                    )}
                                </div>
                            )}

                            {complaint.adminAction && (
                                <div className="admin-action">
                                    <span className={`action-badge action-${complaint.adminAction.toLowerCase()}`}>
                                        {t('admin.actionTaken')}: {complaint.adminAction}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Action Modal */}
            {showActionModal && (
                <div className="modal-overlay" onClick={closeActionModal}>
                    <div className="action-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                {actionType === 'ban' && `🚫 ${t('admin.banWorker')}`}
                                {actionType === 'restrict' && `⚠️ ${t('admin.restrictWorker')}`}
                                {actionType === 'clarify' && `❓ ${t('admin.requestClarification')}`}
                                {actionType === 'reject' && `❌ ${t('admin.rejectComplaint')}`}
                            </h2>
                            <button className="close-btn" onClick={closeActionModal}>×</button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="complaint-summary">
                                <h3>{t('admin.complaintSummary')}</h3>
                                <p><strong>{t('admin.worker')}:</strong> {selectedComplaint?.reportedWorkerName}</p>
                                <p><strong>{t('admin.reason')}:</strong> {selectedComplaint && getReasonDisplayName(selectedComplaint.reason)}</p>
                                <p><strong>{t('admin.customer')}:</strong> {selectedComplaint?.reportedByCustomerName}</p>
                            </div>
                            
                            <div className="action-form">
                                {actionType === 'clarify' ? (
                                    <>
                                        <label htmlFor="clarificationRequest">
                                            {t('admin.clarificationRequest')} *
                                            <span className="help-text">{t('admin.clarificationHelpText')}</span>
                                        </label>
                                        <textarea
                                            id="clarificationRequest"
                                            value={clarificationRequest}
                                            onChange={(e) => setClarificationRequest(e.target.value)}
                                            placeholder={t('admin.whatAdditionalInfo')}
                                            rows={4}
                                            required
                                        />
                                    </>
                                ) : (
                                    <>
                                        <label htmlFor="actionReason">
                                            {actionType === 'ban' && `${t('admin.banReason')} *`}
                                            {actionType === 'restrict' && `${t('admin.restrictionReason')} *`}
                                            {actionType === 'reject' && `${t('admin.rejectionReason')} *`}
                                        </label>
                                        <textarea
                                            id="actionReason"
                                            value={actionReason}
                                            onChange={(e) => setActionReason(e.target.value)}
                                            placeholder={
                                                actionType === 'ban' ? t('admin.explainBanWorker') :
                                                actionType === 'restrict' ? t('admin.explainRestrictWorker') :
                                                t('admin.explainRejectComplaint')
                                            }
                                            rows={4}
                                            required
                                        />
                                    </>
                                )}

                                {actionType === 'ban' && (
                                    <div className="warning-box">
                                        <p><strong>⚠️ {t('admin.warning')}:</strong> {t('admin.banningWorkerWill')}</p>
                                        <ul>
                                            <li>{t('admin.permanentlyDeleteAccount')}</li>
                                            <li>{t('admin.sendEmailNotification')}</li>
                                            <li>{t('admin.preventNewAccounts')}</li>
                                        </ul>
                                    </div>
                                )}

                                {actionType === 'restrict' && (
                                    <div className="info-box">
                                        <p><strong>ℹ️ {t('admin.info')}:</strong> {t('admin.restrictingWorkerWill')}</p>
                                        <ul>
                                            <li>{t('admin.preventApplyingJobs')}</li>
                                            <li>{t('admin.preventForumActivity')}</li>
                                            <li>{t('admin.sendRestrictionNotification')}</li>
                                        </ul>
                                    </div>
                                )}

                                {actionType === 'clarify' && (
                                    <div className="info-box">
                                        <p><strong>ℹ️ {t('admin.info')}:</strong> {t('admin.requestingClarificationWill')}</p>
                                        <ul>
                                            <li>{t('admin.sendNotificationToCustomer')}</li>
                                            <li>{t('admin.give24HoursToRespond')}</li>
                                            <li>{t('admin.autoDismissIfNoResponse')}</li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                className="cancel-btn" 
                                onClick={closeActionModal}
                                disabled={processingComplaint}
                            >
                                {t('admin.cancel')}
                            </button>
                            <button 
                                className={`submit-btn ${actionType}`} 
                                onClick={handleSubmitAction}
                                disabled={processingComplaint || 
                                    (actionType === 'clarify' ? !clarificationRequest.trim() : !actionReason.trim())}
                            >
                                {processingComplaint ? t('admin.processing') : 
                                 (actionType === 'ban' ? t('admin.banWorker') :
                                  actionType === 'restrict' ? t('admin.restrictWorker') :
                                  actionType === 'clarify' ? t('admin.requestClarification') :
                                  t('admin.rejectComplaint'))}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserComplaintManagement;