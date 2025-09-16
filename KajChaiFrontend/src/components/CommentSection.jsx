import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import forumAPI from '../services/forumService';
import './CommentSection.css';

const CommentSection = ({ postId, onCommentAdded }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await forumAPI.getComments(postId);
      setComments(response);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await forumAPI.addComment(postId, {
        content: newComment.trim()
      });
      
      setComments(prev => [...prev, response]);
      setNewComment('');
      
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} ${diffInMinutes === 1 ? t('forum.minute') : t('forum.minutes')} ${t('forum.ago')}`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} ${hours === 1 ? t('forum.hour') : t('forum.hours')} ${t('forum.ago')}`;
    } else {
      return date.toLocaleDateString() + ' ' + t('forum.at') + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="comment-section">
      <div className="comments-header">
        <h4>{t('forum.comments')} ({comments.length})</h4>
      </div>

      {/* Add Comment Form */}
      {user && (
        <form onSubmit={handleSubmitComment} className="add-comment-form">
          <div className="comment-input-section">
            {user.photo && (
              <img 
                src={user.photo} 
                alt={user.name}
                className="commenter-avatar"
              />
            )}
            <div className="comment-input-container">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('forum.writeComment')}
                className="comment-input"
                rows={3}
                maxLength={500}
                disabled={submitting}
              />
              <div className="comment-input-footer">
                <div className="char-count">{newComment.length}/500</div>
                <button 
                  type="submit" 
                  className="submit-comment-btn"
                  disabled={!newComment.trim() || submitting}
                >
                  {submitting ? t('forum.posting') : t('forum.postComment')}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="comments-list">
        {loading ? (
          <div className="loading-comments">{t('forum.loadingComments')}</div>
        ) : comments.length === 0 ? (
          <div className="no-comments">
            <p>{t('forum.noCommentsYet')}</p>
            {user && <p>{t('forum.beFirstToComment')}</p>}
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.commentId} className="comment-item">
              <div className="comment-header">
                {comment.authorPhoto && (
                  <img 
                    src={comment.authorPhoto} 
                    alt={comment.authorName}
                    className="comment-author-avatar"
                  />
                )}
                <div className="comment-author-info">
                  <div className="comment-author-name">{comment.authorName}</div>
                  <div className="comment-date">{formatDate(comment.createdAt)}</div>
                </div>
              </div>
              
              <div className="comment-content">
                {comment.content.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {!user && (
        <div className="login-prompt">
          <p>{t('forum.pleaseLoginToComment')}</p>
        </div>
      )}
    </div>
  );
};

export default CommentSection;