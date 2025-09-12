import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import forumAPI from '../services/forumService';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import './Forum.css';

const Forum = () => {
  const { user } = useAuth();
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

  // Forum sections based on user role
  const getAvailableSections = () => {
    const sections = [
      { key: 'CUSTOMER_QA', name: 'Customer Q&A', description: 'Ask service-related questions' },
      { key: 'WORKER_TIPS_PROJECTS', name: 'Worker Tips & Projects', description: 'Share expertise and showcase work' },
      { key: 'CUSTOMER_EXPERIENCE', name: 'Customer Experience', description: 'Share your service experiences' }
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
      const response = await forumAPI.getPosts(
        currentSection,
        selectedCategory,
        sortBy,
        showMyPosts,
        currentPage,
        10
      );

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
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category);
    setPage(0);
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setPage(0);
  };

  const handleMyPostsToggle = () => {
    setShowMyPosts(!showMyPosts);
    setPage(0);
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
      { key: 'recent', name: 'Recent' },
      { key: 'popular', name: 'Most Popular' }
    ];

    if (canShowMyPosts()) {
      return options;
    }

    return options;
  };

  const refreshPosts = () => {
    fetchPosts(true);
  };

  return (
    <div className="forum-container">
      {/* Header */}
      <div className="forum-header">
        <h1>🗨️ KajChai Forum</h1>
        <p>Connect, share knowledge, and learn from the community</p>
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
            <label>Category:</label>
            <select 
              value={selectedCategory || ''} 
              onChange={(e) => handleCategoryChange(e.target.value || null)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div className="sort-filter">
            <label>Sort by:</label>
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
                My {currentSection === 'CUSTOMER_QA' ? 'Q&As' : 
                     currentSection === 'CUSTOMER_EXPERIENCE' ? 'Experiences' : 
                     'Tips & Projects'}
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
              + Create Post
            </button>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="forum-posts">
        {loading && posts.length === 0 ? (
          <div className="loading">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="no-posts">
            <p>No posts found in this section.</p>
            {canCreatePost() && (
              <button 
                className="create-first-post-btn"
                onClick={() => setShowCreateModal(true)}
              >
                Create the first post!
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
                  {loading ? 'Loading...' : 'Load More'}
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