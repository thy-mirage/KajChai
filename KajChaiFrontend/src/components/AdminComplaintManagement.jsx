import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import complaintService from '../services/complaintService';
import './AdminComplaintManagement.css';

const AdminComplaintManagement = ({ embedded = false }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
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
        { value: '', label: 'All Statuses' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'UNDER_REVIEW', label: 'Under Review' },
        { value: 'RESOLVED', label: 'Resolved' },
        { value: 'REJECTED', label: 'Rejected' },
        { value: 'DISMISSED', label: 'Dismissed' }
    ];

    useEffect(() => {
        if (user && user.role === 'ADMIN') {
            fetchComplaints();
            fetchStats();
        }
    }, [user, currentPage, filterStatus]);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await complaintService.admin.getComplaintStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error fetching complaint stats:', error);
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
            case 'UNDER_REVIEW': return 'status-under-review';
            case 'RESOLVED': return 'status-resolved';
            case 'REJECTED': return 'status-rejected';
            case 'DISMISSED': return 'status-dismissed';
            default: return 'status-default';
        }
    };

    const getReasonDisplayName = (reason) => {
        return reason.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    if (!user || user.role !== 'ADMIN') {
        return <div className="access-denied">Access denied. Admin privileges required.</div>;
    }

    return (
        <div className={`admin-complaint-management ${embedded ? 'embedded' : ''}`}>
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
                        <h1>Forum Complaint Management</h1>
                        <p>Manage and review forum post complaints from users</p>
                    </div>
                </div>
            )}
            
            {embedded && (
                <div className="page-header">
                    <h1 className="page-title">Forum Complaint Management</h1>
                    <p className="page-subtitle">Manage and review forum post complaints from users</p>
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
                                            onClick={() => openResponseModal(complaint, 'resolve')}
                                            className="resolve-btn"
                                            disabled={processingComplaint === complaint.complaintId}
                                        >
                                            Resolve
                                        </button>
                                        <button 
                                            onClick={() => openResponseModal(complaint, 'reject')}
                                            className="reject-btn"
                                            disabled={processingComplaint === complaint.complaintId}
                                        >
                                            Reject
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
                            <h2>{actionType === 'resolve' ? 'Resolve' : 'Reject'} Complaint</h2>
                            <button className="close-btn" onClick={closeResponseModal}>×</button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="complaint-summary">
                                <h3>Complaint Summary</h3>
                                <p><strong>Reason:</strong> {selectedComplaint && getReasonDisplayName(selectedComplaint.reason)}</p>
                                <p><strong>Post:</strong> {selectedComplaint && selectedComplaint.postTitle}</p>
                            </div>
                            
                            <div className="response-form">
                                <label htmlFor="adminResponse">Admin Response *</label>
                                <textarea
                                    id="adminResponse"
                                    value={adminResponse}
                                    onChange={(e) => setAdminResponse(e.target.value)}
                                    placeholder={`Explain why you are ${actionType}ing this complaint...`}
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
                                            Delete the reported post
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
                                Cancel
                            </button>
                            <button 
                                className={`submit-btn ${actionType}`} 
                                onClick={handleSubmitResponse}
                                disabled={processingComplaint || !adminResponse.trim()}
                            >
                                {processingComplaint ? 'Processing...' : (actionType === 'resolve' ? 'Resolve' : 'Reject')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminComplaintManagement;