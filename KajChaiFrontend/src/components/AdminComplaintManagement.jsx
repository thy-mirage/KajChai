import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import complaintService from '../services/complaintService';
import './AdminComplaintManagement.css';

const AdminComplaintManagement = ({ embedded = false }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [stats, setStats] = useState({});
    const [processingComplaint, setProcessingComplaint] = useState(null);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [adminResponse, setAdminResponse] = useState('');
    const [actionType, setActionType] = useState(''); // 'resolve' or 'reject'
    const [deletePost, setDeletePost] = useState(false);

    const complaintStatuses = [
        { value: '', label: t('forumAdmin.allStatuses') },
        { value: 'PENDING', label: t('forumAdmin.pending') },
        { value: 'RESOLVED', label: t('forumAdmin.resolved') },
        { value: 'REJECTED', label: t('forumAdmin.rejected') }
    ];

    useEffect(() => {
        if (user && user.role === 'ADMIN') {
            fetchComplaints();
            fetchStats();
        }
    }, [user, currentPage, filterStatus]);

    const fetchComplaints = async () => {
        try {
            const response = await complaintService.admin.getAllComplaints(
                currentPage,
                10,
                filterStatus || null,
                null
            );            if (response.success) {
                setComplaints(response.data || []);
                setTotalPages(response.totalPages || 0);
            } else {
                setComplaints([]);
                setTotalPages(0);
            }
        } catch (error) {
            console.error('Error fetching complaints:', error);
            setComplaints([]);
            setTotalPages(0);
            alert('Failed to fetch complaints');
        }
    };

    const fetchStats = async () => {
        try {
            setStatsLoading(true);
            console.log('=== FETCHING STATS FROM FRONTEND ===');
            const response = await complaintService.admin.getComplaintStats();
            console.log('Raw API Response:', response);
            console.log('Response type:', typeof response);
            console.log('Response keys:', Object.keys(response || {}));
            if (response && response.success) {
                console.log('Stats Data from API:', response.data);
                console.log('Data type:', typeof response.data);
                console.log('Data keys:', Object.keys(response.data || {}));
                setStats(response.data);
                console.log('Stats set in state:', response.data);
            } else {
                console.error('Stats API failed or success is false:', response);
            }
        } catch (error) {
            console.error('Error fetching complaint stats:', error);
            console.error('Error details:', error.message, error.stack);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleStatusFilter = (status) => {
        setFilterStatus(status);
        setCurrentPage(0);
    };

    const openResponseModal = (complaint, action) => {
        setSelectedComplaint(complaint);
        setActionType(action);
        setAdminResponse('');
        setDeletePost(false);
        setShowResponseModal(true);
    };

    const closeResponseModal = () => {
        setShowResponseModal(false);
        setSelectedComplaint(null);
        setAdminResponse('');
        setDeletePost(false);
        setActionType('');
    };

    const handleSubmitResponse = async () => {
        if (!adminResponse.trim()) {
            alert('Please provide a response');
            return;
        }

        try {
            setProcessingComplaint(selectedComplaint.complaintId);
            
            let response;
            if (actionType === 'resolve') {
                response = await complaintService.admin.resolveComplaint(
                    selectedComplaint.complaintId,
                    adminResponse.trim(),
                    deletePost
                );
            } else {
                response = await complaintService.admin.rejectComplaint(
                    selectedComplaint.complaintId,
                    adminResponse.trim()
                );
            }

            if (response.success) {
                alert(`Complaint ${actionType}d successfully!`);
                fetchComplaints();
                fetchStats();
                closeResponseModal();
            }
        } catch (error) {
            console.error(`Error ${actionType}ing complaint:`, error);
            alert(`Failed to ${actionType} complaint`);
        } finally {
            setProcessingComplaint(null);
        }
    };

    const formatDate = (dateString) => {
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
            case 'RESOLVED': return 'status-resolved';
            case 'REJECTED': return 'status-rejected';
            default: return 'status-default';
        }
    };

    const getReasonDisplayName = (reason) => {
        return reason.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    if (!user || user.role !== 'ADMIN') {
        return <div className="access-denied">{t('forumAdmin.accessDenied')}</div>;
    }

    return (
        <div className={`admin-complaint-management ${embedded ? 'embedded' : ''}`}>
            {!embedded && (
                <div className="complaint-header">
                    <div className="header-top">
                        <button 
                            onClick={() => navigate('/admin/dashboard')} 
                            className="back-btn"
                            title={t('forumAdmin.backToDashboard')}
                        >
                            ← {t('forumAdmin.backToDashboard')}
                        </button>
                    </div>
                    <div className="header-content">
                        <h1>{t('forumAdmin.title')}</h1>
                        <p>{t('forumAdmin.subtitle')}</p>
                    </div>
                </div>
            )}
            
            {embedded && (
                <div className="page-header">
                    <h1 className="page-title">{t('forumAdmin.title')}</h1>
                    <p className="page-subtitle">{t('forumAdmin.subtitle')}</p>
                </div>
            )}

            {/* Statistics */}
            <div className="complaint-stats">
                {statsLoading ? (
                    <div className="stats-loading">
                        <div className="loading">{t('common.loading', 'Loading...')}</div>
                    </div>
                ) : (
                    <>
                        <div className="stat-card">
                            <h3>{t('forumAdmin.totalComplaints')}</h3>
                            <div className="stat-number">{stats.totalComplaints || 0}</div>
                        </div>
                        <div className="stat-card pending">
                            <h3>{t('forumAdmin.pending')}</h3>
                            <div className="stat-number">{stats.pendingComplaints || 0}</div>
                        </div>
                        <div className="stat-card resolved">
                            <h3>{t('forumAdmin.resolved')}</h3>
                            <div className="stat-number">{stats.resolvedComplaints || 0}</div>
                        </div>
                        <div className="stat-card rejected">
                            <h3>{t('forumAdmin.rejected')}</h3>
                            <div className="stat-number">{stats.rejectedComplaints || 0}</div>
                        </div>
                    </>
                )}
            </div>

            {/* Filters and Search */}
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
                {(!complaints || complaints.length === 0) ? (
                    <div className="no-complaints">{t('forumAdmin.noComplaints')}</div>
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
                                            onClick={() => openResponseModal(complaint, 'resolve')}
                                            className="resolve-btn"
                                            disabled={processingComplaint === complaint.complaintId}
                                        >
                                            {t('forumAdmin.resolve')}
                                        </button>
                                        <button 
                                            onClick={() => openResponseModal(complaint, 'reject')}
                                            className="reject-btn"
                                            disabled={processingComplaint === complaint.complaintId}
                                        >
                                            {t('forumAdmin.reject')}
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
                                        <strong>From:</strong> {complaint.complainantName} ({complaint.complainantEmail})
                                    </div>
                                    <div className="detail-row">
                                        <strong>Description:</strong>
                                        <p>{complaint.description}</p>
                                    </div>
                                    
                                    {complaint.evidenceImages && complaint.evidenceImages.length > 0 && (
                                        <div className="detail-row">
                                            <strong>Evidence:</strong>
                                            <div className="evidence-images">
                                                {complaint.evidenceImages.map((image, index) => (
                                                    <div key={index} className="evidence-image-container">
                                                        <img 
                                                            src={image} 
                                                            alt={`Evidence ${index + 1}`}
                                                            className="evidence-image"
                                                            onClick={() => window.open(image, '_blank')}
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
                                </div>

                                <div className="reported-post">
                                    <h3>Reported Post</h3>
                                    <div className="post-preview">
                                        <h4>{complaint.postTitle}</h4>
                                        <p>{complaint.postContent.substring(0, 200)}{complaint.postContent.length > 200 ? '...' : ''}</p>
                                        <small>By: {complaint.postAuthorName} | Section: {complaint.postSection}</small>
                                    </div>
                                </div>
                            </div>

                            {complaint.adminResponse && (
                                <div className="admin-response">
                                    <h4>Admin Response</h4>
                                    <p>{complaint.adminResponse}</p>
                                    {complaint.reviewedByName && (
                                        <small>
                                            Reviewed by {complaint.reviewedByName} on {formatDate(complaint.reviewedAt)}
                                        </small>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                        className="page-btn"
                    >
                        Previous
                    </button>
                    <span className="page-info">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={currentPage === totalPages - 1}
                        className="page-btn"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Response Modal */}
            {showResponseModal && (
                <div className="modal-overlay" onClick={closeResponseModal}>
                    <div className="response-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{actionType === 'resolve' ? t('forumAdmin.resolveComplaint') : t('forumAdmin.rejectComplaint')}</h2>
                            <button className="close-btn" onClick={closeResponseModal}>×</button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="complaint-summary">
                                <h3>{t('forumAdmin.complaintSummary')}</h3>
                                <p><strong>{t('forumAdmin.reason')}:</strong> {selectedComplaint && getReasonDisplayName(selectedComplaint.reason)}</p>
                                <p><strong>{t('forumAdmin.post')}:</strong> {selectedComplaint && selectedComplaint.postTitle}</p>
                            </div>
                            
                            <div className="response-form">
                                <label htmlFor="adminResponse">{t('forumAdmin.adminResponse')} *</label>
                                <textarea
                                    id="adminResponse"
                                    value={adminResponse}
                                    onChange={(e) => setAdminResponse(e.target.value)}
                                    placeholder={actionType === 'resolve' ? t('forumAdmin.adminResponsePlaceholder') : t('forumAdmin.adminResponsePlaceholderReject')}
                                    rows={4}
                                    required
                                />
                                
                                {actionType === 'resolve' && (
                                    <div className="delete-post-option">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={deletePost}
                                                onChange={(e) => setDeletePost(e.target.checked)}
                                            />
                                            {t('forumAdmin.deleteReportedPost')}
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                className="cancel-btn" 
                                onClick={closeResponseModal}
                                disabled={processingComplaint}
                            >
                                {t('forumAdmin.cancel')}
                            </button>
                            <button 
                                className={`submit-btn ${actionType}`} 
                                onClick={handleSubmitResponse}
                                disabled={processingComplaint || !adminResponse.trim()}
                            >
                                {processingComplaint ? t('forumAdmin.processing') : (actionType === 'resolve' ? t('forumAdmin.resolve') : t('forumAdmin.reject'))}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminComplaintManagement;