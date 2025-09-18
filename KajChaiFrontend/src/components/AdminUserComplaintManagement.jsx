import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
        { value: '', label: 'All Statuses' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'INVESTIGATING', label: 'Investigating' },
        { value: 'AWAITING_CLARIFICATION', label: 'Awaiting Clarification' },
        { value: 'RESOLVED', label: 'Resolved' },
        { value: 'REJECTED', label: 'Rejected' },
        { value: 'DISMISSED', label: 'Dismissed' }
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
            
            let url = `http://localhost:8080/api/admin/user-complaints`;
            if (filterStatus) {
                url = `http://localhost:8080/api/admin/user-complaints/status/${filterStatus}`;
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
            alert('Failed to fetch complaints');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const complaints = await fetch('http://localhost:8080/api/admin/user-complaints', {
                headers: {
                    'Authorization': `Bearer ${getCurrentUserToken()}`,
                    'Content-Type': 'application/json'
                }
            }).then(res => res.json());

            // Calculate stats from complaints
            const stats = {
                totalComplaints: complaints.length,
                pendingComplaints: complaints.filter(c => c.status === 'PENDING').length,
                resolvedComplaints: complaints.filter(c => c.status === 'RESOLVED').length,
                rejectedComplaints: complaints.filter(c => c.status === 'REJECTED').length,
                awaitingClarification: complaints.filter(c => c.status === 'AWAITING_CLARIFICATION').length
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
                        alert('Please provide a reason for banning the worker');
                        return;
                    }
                    url = `http://localhost:8080/api/admin/user-complaints/${selectedComplaint.complaintId}/ban-worker`;
                    body = { reason: actionReason.trim() };
                    break;

                case 'restrict':
                    if (!actionReason.trim()) {
                        alert('Please provide a reason for restricting the worker');
                        return;
                    }
                    url = `http://localhost:8080/api/admin/user-complaints/${selectedComplaint.complaintId}/restrict-worker`;
                    body = { reason: actionReason.trim() };
                    break;

                case 'clarify':
                    if (!clarificationRequest.trim()) {
                        alert('Please provide a clarification request');
                        return;
                    }
                    url = `http://localhost:8080/api/admin/user-complaints/${selectedComplaint.complaintId}/request-clarification`;
                    body = { clarificationRequest: clarificationRequest.trim() };
                    break;

                case 'reject':
                    if (!actionReason.trim()) {
                        alert('Please provide a reason for rejecting the complaint');
                        return;
                    }
                    url = `http://localhost:8080/api/admin/user-complaints/${selectedComplaint.complaintId}/status`;
                    body = { status: 'REJECTED', adminResponse: actionReason.trim() };
                    break;

                default:
                    alert('Invalid action');
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

            alert(`Complaint ${actionType}ed successfully!`);
            fetchComplaints();
            fetchStats();
            closeActionModal();

        } catch (error) {
            console.error(`Error ${actionType}ing complaint:`, error);
            alert(`Failed to ${actionType} complaint: ${error.message}`);
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
            case 'INVESTIGATING': return 'status-investigating';
            case 'AWAITING_CLARIFICATION': return 'status-awaiting-clarification';
            case 'RESOLVED': return 'status-resolved';
            case 'REJECTED': return 'status-rejected';
            case 'DISMISSED': return 'status-dismissed';
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
        return <div className="access-denied">Access denied. Admin privileges required.</div>;
    }

    return (
        <div className={`admin-user-complaint-management ${embedded ? 'embedded' : ''}`}>
            {!embedded && (
                <div className="complaint-header">
                    <div className="header-top">
                        <button 
                            onClick={() => navigate('/admin/dashboard')} 
                            className="back-btn"
                            title="Back to Dashboard"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                    <div className="header-content">
                        <h1>Worker Complaint Management</h1>
                        <p>Manage customer complaints against workers</p>
                    </div>
                </div>
            )}
            
            {embedded && (
                <div className="page-header">
                    <h1 className="page-title">Worker Complaint Management</h1>
                    <p className="page-subtitle">Manage customer complaints against workers</p>
                </div>
            )}

            {/* Statistics */}
            <div className="complaint-stats">
                <div className="stat-card">
                    <h3>Total Complaints</h3>
                    <div className="stat-number">{stats.totalComplaints || 0}</div>
                </div>
                <div className="stat-card pending">
                    <h3>Pending</h3>
                    <div className="stat-number">{stats.pendingComplaints || 0}</div>
                </div>
                <div className="stat-card resolved">
                    <h3>Resolved</h3>
                    <div className="stat-number">{stats.resolvedComplaints || 0}</div>
                </div>
                <div className="stat-card rejected">
                    <h3>Rejected</h3>
                    <div className="stat-number">{stats.rejectedComplaints || 0}</div>
                </div>
                <div className="stat-card clarification">
                    <h3>Awaiting Clarification</h3>
                    <div className="stat-number">{stats.awaitingClarification || 0}</div>
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
                    <div className="loading-spinner">Loading complaints...</div>
                ) : (!complaints || complaints.length === 0) ? (
                    <div className="no-complaints">No complaints found.</div>
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
                                
                                {complaint.status === 'PENDING' && (
                                    <div className="complaint-actions">
                                        <button 
                                            onClick={() => openActionModal(complaint, 'ban')}
                                            className="ban-btn"
                                            disabled={processingComplaint === complaint.complaintId}
                                            title="Ban Worker"
                                        >
                                            🚫 Ban
                                        </button>
                                        <button 
                                            onClick={() => openActionModal(complaint, 'restrict')}
                                            className="restrict-btn"
                                            disabled={processingComplaint === complaint.complaintId}
                                            title="Restrict Worker"
                                        >
                                            ⚠️ Restrict
                                        </button>
                                        <button 
                                            onClick={() => openActionModal(complaint, 'clarify')}
                                            className="clarify-btn"
                                            disabled={processingComplaint === complaint.complaintId}
                                            title="Request Clarification"
                                        >
                                            ❓ Clarify
                                        </button>
                                        <button 
                                            onClick={() => openActionModal(complaint, 'reject')}
                                            className="reject-btn"
                                            disabled={processingComplaint === complaint.complaintId}
                                            title="Reject Complaint"
                                        >
                                            ❌ Reject
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="complaint-content">
                                <div className="complaint-details">
                                    <h3>Complaint Details</h3>
                                    <div className="detail-row">
                                        <strong>Reason:</strong> {getReasonDisplayName(complaint.reason)}
                                    </div>
                                    <div className="detail-row">
                                        <strong>Reported Worker:</strong> {complaint.reportedWorkerName}
                                    </div>
                                    <div className="detail-row">
                                        <strong>Reported By:</strong> {complaint.reportedByCustomerName}
                                    </div>
                                    <div className="detail-row">
                                        <strong>Description:</strong>
                                        <p>{complaint.description}</p>
                                    </div>
                                    
                                    {complaint.evidenceUrls && (
                                        <div className="detail-row">
                                            <strong>Evidence:</strong>
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
                                                            <small>Image unavailable</small>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {complaint.clarificationDeadline && (
                                        <div className="detail-row">
                                            <strong>Clarification Deadline:</strong> {formatDate(complaint.clarificationDeadline)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {complaint.adminResponse && (
                                <div className="admin-response">
                                    <h4>Admin Response</h4>
                                    <p>{complaint.adminResponse}</p>
                                    {complaint.resolvedAt && (
                                        <small>
                                            Resolved on {formatDate(complaint.resolvedAt)}
                                        </small>
                                    )}
                                </div>
                            )}

                            {complaint.adminAction && (
                                <div className="admin-action">
                                    <span className={`action-badge action-${complaint.adminAction.toLowerCase()}`}>
                                        Action Taken: {complaint.adminAction}
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
                                {actionType === 'ban' && '🚫 Ban Worker'}
                                {actionType === 'restrict' && '⚠️ Restrict Worker'}
                                {actionType === 'clarify' && '❓ Request Clarification'}
                                {actionType === 'reject' && '❌ Reject Complaint'}
                            </h2>
                            <button className="close-btn" onClick={closeActionModal}>×</button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="complaint-summary">
                                <h3>Complaint Summary</h3>
                                <p><strong>Worker:</strong> {selectedComplaint?.reportedWorkerName}</p>
                                <p><strong>Reason:</strong> {selectedComplaint && getReasonDisplayName(selectedComplaint.reason)}</p>
                                <p><strong>Customer:</strong> {selectedComplaint?.reportedByCustomerName}</p>
                            </div>
                            
                            <div className="action-form">
                                {actionType === 'clarify' ? (
                                    <>
                                        <label htmlFor="clarificationRequest">
                                            Clarification Request *
                                            <span className="help-text">Ask the customer for additional information</span>
                                        </label>
                                        <textarea
                                            id="clarificationRequest"
                                            value={clarificationRequest}
                                            onChange={(e) => setClarificationRequest(e.target.value)}
                                            placeholder="What additional information do you need from the customer?"
                                            rows={4}
                                            required
                                        />
                                    </>
                                ) : (
                                    <>
                                        <label htmlFor="actionReason">
                                            {actionType === 'ban' && 'Ban Reason *'}
                                            {actionType === 'restrict' && 'Restriction Reason *'}
                                            {actionType === 'reject' && 'Rejection Reason *'}
                                        </label>
                                        <textarea
                                            id="actionReason"
                                            value={actionReason}
                                            onChange={(e) => setActionReason(e.target.value)}
                                            placeholder={
                                                actionType === 'ban' ? 'Explain why you are banning this worker...' :
                                                actionType === 'restrict' ? 'Explain why you are restricting this worker...' :
                                                'Explain why you are rejecting this complaint...'
                                            }
                                            rows={4}
                                            required
                                        />
                                    </>
                                )}

                                {actionType === 'ban' && (
                                    <div className="warning-box">
                                        <p><strong>⚠️ Warning:</strong> Banning a worker will:</p>
                                        <ul>
                                            <li>Permanently delete their account</li>
                                            <li>Send them an email notification</li>
                                            <li>Prevent them from creating new accounts with this email</li>
                                        </ul>
                                    </div>
                                )}

                                {actionType === 'restrict' && (
                                    <div className="info-box">
                                        <p><strong>ℹ️ Info:</strong> Restricting a worker will:</p>
                                        <ul>
                                            <li>Prevent them from applying to hire posts for 3 days</li>
                                            <li>Prevent them from posting/commenting in forums for 3 days</li>
                                            <li>Send them a notification about the restriction</li>
                                        </ul>
                                    </div>
                                )}

                                {actionType === 'clarify' && (
                                    <div className="info-box">
                                        <p><strong>ℹ️ Info:</strong> Requesting clarification will:</p>
                                        <ul>
                                            <li>Send a notification to the customer</li>
                                            <li>Give them 24 hours to respond</li>
                                            <li>Auto-dismiss if no response within deadline</li>
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
                                Cancel
                            </button>
                            <button 
                                className={`submit-btn ${actionType}`} 
                                onClick={handleSubmitAction}
                                disabled={processingComplaint || 
                                    (actionType === 'clarify' ? !clarificationRequest.trim() : !actionReason.trim())}
                            >
                                {processingComplaint ? 'Processing...' : 
                                 (actionType === 'ban' ? 'Ban Worker' :
                                  actionType === 'restrict' ? 'Restrict Worker' :
                                  actionType === 'clarify' ? 'Request Clarification' :
                                  'Reject Complaint')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserComplaintManagement;