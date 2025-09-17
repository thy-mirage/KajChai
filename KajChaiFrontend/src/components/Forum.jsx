import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import forumAPI from '../services/forumService';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import QuestionSearch from './QuestionSearch';
import './Forum.css';

const Forum = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  // Helper function to translate category names
  const translateCategory = (category) => {
    const categoryKey = category.toLowerCase().replace(/_/g, '');
    // Try to get translation, fallback to formatted string if not found
    const translationKey = `forum.categories.${categoryKey}`;
    const translated = t(translationKey);
    // If translation key is returned as-is, it means translation doesn't exist
    if (translated === translationKey) {
      return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }
    return translated;
  };
  const [currentSection, setCurrentSection] = useState('CUSTOMER_QA');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('recent');
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null); // For showing specific post
  const [isLoadingPost, setIsLoadingPost] = useState(false);

  // Forum sections based on user role
  const getAvailableSections = () => {
    const sections = [
      { key: 'CUSTOMER_QA', name: t('forum.customerQA'), description: t('forum.customerQADesc') },
      { key: 'WORKER_TIPS_PROJECTS', name: t('forum.workerTips'), description: t('forum.workerTipsDesc') },
      { key: 'CUSTOMER_EXPERIENCE', name: t('forum.customerExperience'), description: t('forum.customerExperienceDesc') }
    ];

    return sections;
  };

  // Get categories for current section
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await forumAPI.getCategories(currentSection);
        setCategories(response);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [currentSection]);

  // Fetch posts when filters change
  useEffect(() => {
    fetchPosts(true); // Reset pagination
  }, [currentSection, selectedCategory, sortBy, showMyPosts]);

  const fetchPosts = async (reset = false) => {
    setLoading(true);
    try {
      const currentPage = reset ? 0 : page;
      let response;
      
      if (showMyPosts) {
        response = await forumAPI.getMyPosts(
          currentSection,
          selectedCategory,
          sortBy,
          currentPage,
          10
        );
      } else {
        response = await forumAPI.getPosts(
          currentSection,
          selectedCategory,
          sortBy,
          currentPage,
          10
        );
      }

      if (reset) {
        setPosts(response.content);
        setPage(1);
      } else {
        setPosts(prev => [...prev, ...response.content]);
        setPage(prev => prev + 1);
      }

      setHasMore(!response.last);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (section) => {
    setCurrentSection(section);
    setSelectedCategory(null);
    setShowMyPosts(false);
    setPage(0);
    setSelectedPost(null); // Clear selected post when switching sections
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category);
    setPage(0);
    setSelectedPost(null); // Clear selected post when changing category
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setPage(0);
    setSelectedPost(null); // Clear selected post when changing sort
  };

  const handleMyPostsToggle = () => {
    setShowMyPosts(!showMyPosts);
    setPage(0);
    setSelectedPost(null); // Clear selected post when toggling my posts
  };

  const canCreatePost = () => {
    if (!user) return false;
    
    switch (currentSection) {
      case 'CUSTOMER_QA':
      case 'CUSTOMER_EXPERIENCE':
        return user.role === 'CUSTOMER';
      case 'WORKER_TIPS_PROJECTS':
        return user.role === 'WORKER';
      default:
        return false;
    }
  };

  const canShowMyPosts = () => {
    return user && (
      (currentSection === 'CUSTOMER_QA' && user.role === 'CUSTOMER') ||
      (currentSection === 'CUSTOMER_EXPERIENCE' && user.role === 'CUSTOMER') ||
      (currentSection === 'WORKER_TIPS_PROJECTS' && user.role === 'WORKER')
    );
  };

  const getSortOptions = () => {
    const options = [
      { key: 'recent', name: t('forum.recent') },
      { key: 'popular', name: t('forum.mostPopular') }
    ];

    if (canShowMyPosts()) {
      return options;
    }

    return options;
  };

  const refreshPosts = () => {
    fetchPosts(true);
  };

  // Handle question selection from search
  const handleQuestionSelect = async (question) => {
    console.log('Selected question:', question);
    
    try {
      setIsLoadingPost(true);
      
      // Fetch the complete post details
      const postDetails = await forumAPI.getPost(question.postId);
      
      // Set the selected post to show only this post
      setSelectedPost(postDetails);
      
      // Ensure we're in the Customer Q&A section for context
      if (currentSection !== 'CUSTOMER_QA') {
        setCurrentSection('CUSTOMER_QA');
      }
      
    } catch (error) {
      console.error('Error fetching selected question:', error);
      // Fallback to original behavior if there's an error
      alert('Could not load the selected question. Please try again.');
    } finally {
      setIsLoadingPost(false);
    }
  };

  // Handle going back to full forum view
  const handleBackToForum = () => {
    setSelectedPost(null);
    refreshPosts(); // Refresh the posts when going back
  };

  return (
    <div className="forum-container">
      {/* Header */}
      <div className="forum-header">
        <h1>🗨️ {t('forum.kajChaiForum')}</h1>
        <p>{t('forum.forumDescription')}</p>
      </div>

      {/* Section Tabs */}
      <div className="forum-sections">
        {getAvailableSections().map((section) => (
          <button
            key={section.key}
            className={`section-tab ${currentSection === section.key ? 'active' : ''}`}
            onClick={() => handleSectionChange(section.key)}
          >
            <div className="section-name">{section.name}</div>
            <div className="section-description">{section.description}</div>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="forum-controls">
        <div className="controls-left">
          {/* Category Filter */}
          <div className="category-filter">
            <label>{t('forum.category')}:</label>
            <select 
              value={selectedCategory || ''} 
              onChange={(e) => handleCategoryChange(e.target.value || null)}
            >
              <option value="">{t('forum.allCategories')}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {translateCategory(category)}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div className="sort-filter">
            <label>{t('forum.sortBy')}:</label>
            <select value={sortBy} onChange={(e) => handleSortChange(e.target.value)}>
              {getSortOptions().map((option) => (
                <option key={option.key} value={option.key}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* My Posts Toggle */}
          {canShowMyPosts() && (
            <div className="my-posts-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={showMyPosts}
                  onChange={handleMyPostsToggle}
                />
                {t('forum.myPosts')} {currentSection === 'CUSTOMER_QA' ? t('forum.qAndA') : 
                     currentSection === 'CUSTOMER_EXPERIENCE' ? t('forum.experiences') : 
                     t('forum.tipsAndProjects')}
              </label>
            </div>
          )}
        </div>

        <div className="controls-right">
          {canCreatePost() && (
            <button 
              className="create-post-btn"
              onClick={() => setShowCreateModal(true)}
            >
              + {t('forum.createPost')}
            </button>
          )}
        </div>
      </div>

      {/* Question Search - Only for Customer Q&A section */}
      {currentSection === 'CUSTOMER_QA' && (
        <div className="question-search-section">
          <div className="search-header">
            <h3>{t('forum.searchSimilarQuestions', 'Search Similar Questions')}</h3>
            <p>{t('forum.searchDescription', 'Find answers from previous questions before asking a new one')}</p>
          </div>
          <QuestionSearch 
            onQuestionSelect={handleQuestionSelect} 
            selectedCategory={selectedCategory}
          />
        </div>
      )}

      {/* Posts */}
      <div className="forum-posts">
        {/* Show selected post if one is selected */}
        {selectedPost ? (
          <div className="selected-post-view">
            <div className="back-to-forum">
              <button onClick={handleBackToForum} className="back-btn">
                ← {t('common.back', 'Back to Forum')}
              </button>
              <p className="selected-post-info">
                {t('forum.viewingSelectedQuestion', 'Viewing selected question')}
              </p>
            </div>
            <PostCard 
              post={selectedPost} 
              onUpdate={() => {
                // Refresh the selected post
                handleQuestionSelect({ postId: selectedPost.postId });
              }}
            />
          </div>
        ) : isLoadingPost ? (
          <div className="loading">{t('common.loading')}</div>
        ) : loading && posts.length === 0 ? (
          <div className="loading">{t('common.loading')}</div>
        ) : posts.length === 0 ? (
          <div className="no-posts">
            <p>{t('forum.noPostsFound')}</p>
            {canCreatePost() && (
              <button 
                className="create-first-post-btn"
                onClick={() => setShowCreateModal(true)}
              >
                {t('forum.createFirstPost')}
              </button>
            )}
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard 
                key={post.postId} 
                post={post} 
                onUpdate={refreshPosts}
              />
            ))}
            
            {hasMore && (
              <div className="load-more">
                <button 
                  onClick={() => fetchPosts(false)}
                  disabled={loading}
                  className="load-more-btn"
                >
                  {loading ? t('common.loading') : t('forum.loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          section={currentSection}
          categories={categories}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refreshPosts();
          }}
        />
      )}
    </div>
  );
};

export default Forum;