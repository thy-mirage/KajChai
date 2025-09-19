import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import forumAPI from '../services/forumService';
import CommentSection from './CommentSection';
import ComplaintModal from './ComplaintModal';
import { isUserRestrictedFromForum, getRestrictionMessage } from '../utils/userRestrictions';
import './PostCard.css';

const PostCard = ({ post, onUpdate }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [showFullContent, setShowFullContent] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  const CONTENT_PREVIEW_LENGTH = 300;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatCategory = (category) => {
    return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleLike = async () => {
    if (!user || isLiking) return;
    
    setIsLiking(true);
    try {
      if (localPost.isLikedByCurrentUser) {
        // Remove like
        await forumAPI.toggleLike(localPost.postId, true);
        setLocalPost(prev => ({
          ...prev,
          isLikedByCurrentUser: false,
          likesCount: prev.likesCount - 1
        }));
      } else {
        // Add like
        await forumAPI.toggleLike(localPost.postId, true);
        setLocalPost(prev => ({
          ...prev,
          isLikedByCurrentUser: true,
          isDislikedByCurrentUser: false,
          likesCount: prev.likesCount + 1,
          dislikesCount: prev.isDislikedByCurrentUser ? prev.dislikesCount - 1 : prev.dislikesCount
        }));
      }
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error handling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDislike = async () => {
    if (!user || isLiking) return;
    
    setIsLiking(true);
    try {
      if (localPost.isDislikedByCurrentUser) {
        // Remove dislike
        await forumAPI.toggleLike(localPost.postId, false);
        setLocalPost(prev => ({
          ...prev,
          isDislikedByCurrentUser: false,
          dislikesCount: prev.dislikesCount - 1
        }));
      } else {
        // Add dislike
        await forumAPI.toggleLike(localPost.postId, false);
        setLocalPost(prev => ({
          ...prev,
          isDislikedByCurrentUser: true,
          isLikedByCurrentUser: false,
          dislikesCount: prev.dislikesCount + 1,
          likesCount: prev.isLikedByCurrentUser ? prev.likesCount - 1 : prev.likesCount
        }));
      }
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error handling dislike:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentAdded = () => {
    setLocalPost(prev => ({
      ...prev,
      commentsCount: prev.commentsCount + 1
    }));
    if (onUpdate) onUpdate();
  };

  const handleDeletePost = async () => {
    if (!user || !localPost.canEdit) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this post? This action cannot be undone.');
    if (!confirmDelete) return;
    
    try {
      setIsDeleting(true);
      await forumAPI.deletePost(localPost.postId);
      
      // Call onUpdate to refresh the post list
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="post-card" data-post-id={localPost.postId}>
      {/* Post Status Banner (for pending/rejected posts) */}
      {localPost.status && localPost.status !== 'APPROVED' && (
        <div className={`post-status-banner ${localPost.status.toLowerCase()}`}>
          {localPost.status === 'PENDING_REVIEW' && (
            <span>⏳ Post is under review - it will appear publicly once approved</span>
          )}
          {localPost.status === 'REJECTED_SPAM' && (
            <span>❌ Post rejected as spam: {localPost.moderationReason}</span>
          )}
          {localPost.status === 'REJECTED_IRRELEVANT' && (
            <span>❌ Post rejected as irrelevant: {localPost.moderationReason}</span>
          )}
        </div>
      )}

      {/* Post Header */}
      <div className="post-header">
        <div className="post-author">
          {localPost.authorPhoto && (
            <img 
              src={localPost.authorPhoto} 
              alt={localPost.authorName}
              className="author-avatar"
            />
          )}
          <div className="author-info">
            <div className="author-name">{localPost.authorName}</div>
            <div className="post-meta">
              <span className="post-category">{formatCategory(localPost.category)}</span>
              <span className="post-date">{formatDate(localPost.createdAt)}</span>
            </div>
          </div>
        </div>
        
        {localPost.canEdit && (
          <div className="post-actions">
            <button 
              className="delete-btn" 
              onClick={handleDeletePost}
              disabled={isDeleting}
              title="Delete Post"
            >
              {isDeleting ? '⏳' : '🗑️'}
            </button>
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="post-content">
        <h3 className="post-title">{localPost.title}</h3>
        <div className="post-text">
          {localPost.content.length > CONTENT_PREVIEW_LENGTH && !showFullContent ? (
            <>
              {localPost.content.substring(0, CONTENT_PREVIEW_LENGTH).split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
              <button 
                className="see-more-btn" 
                onClick={() => setShowFullContent(true)}
              >
                ... See More
              </button>
            </>
          ) : (
            <>
              {localPost.content.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
              {localPost.content.length > CONTENT_PREVIEW_LENGTH && (
                <button 
                  className="see-less-btn" 
                  onClick={() => setShowFullContent(false)}
                >
                  See Less
                </button>
              )}
            </>
          )}
        </div>

        {/* Post Images */}
        {localPost.photoUrls && localPost.photoUrls.length > 0 && (
          <div className="post-images">
            {localPost.photoUrls.map((url, index) => (
              <img 
                key={index} 
                src={url} 
                alt={`Post image ${index + 1}`}
                className="post-image"
                onClick={() => window.open(url, '_blank')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Post Footer */}
      <div className="post-footer">
        <div className="post-stats">
          <div className="likes-dislikes">
            <button 
              className={`like-btn ${localPost.isLikedByCurrentUser ? 'active' : ''}`}
              onClick={handleLike}
              disabled={!user || isLiking}
              title="Like this post"
            >
              👍 {localPost.likesCount}
            </button>
            
            <button 
              className={`dislike-btn ${localPost.isDislikedByCurrentUser ? 'active' : ''}`}
              onClick={handleDislike}
              disabled={!user || isLiking}
              title="Dislike this post"
            >
              👎 {localPost.dislikesCount}
            </button>
          </div>

          <button 
            className="comments-btn"
            onClick={() => setShowComments(!showComments)}
            title={t('forum.viewComments')}
          >
            💬 {localPost.commentsCount} {localPost.commentsCount === 1 ? t('forum.comment') : t('forum.comments')}
          </button>
        </div>

        {user && (
          <div className="post-interactions">
            <button 
              className="comment-toggle-btn"
              onClick={() => setShowComments(!showComments)}
              disabled={isUserRestrictedFromForum(user)}
              title={isUserRestrictedFromForum(user) ? getRestrictionMessage(user) : undefined}
            >
              {showComments ? t('forum.hideComments') : t('forum.addComment')}
            </button>
            
            {/* Report Button - Don't allow users to report their own posts or if they're restricted */}
            {user.userId !== localPost.authorId && !isUserRestrictedFromForum(user) && (
              <button 
                className="report-btn"
                onClick={() => setShowComplaintModal(true)}
                title={t('forum.reportPost')}
              >
                🚩 {t('forum.reportPostButton')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection 
          postId={localPost.postId}
          onCommentAdded={handleCommentAdded}
        />
      )}
      
      {/* Complaint Modal */}
      <ComplaintModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        post={localPost}
        onComplaintSubmitted={() => {
          // Optionally refresh the post or show a success message
          if (onUpdate) onUpdate();
        }}
      />
    </div>
  );
};

export default PostCard;