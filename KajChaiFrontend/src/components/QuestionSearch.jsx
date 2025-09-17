import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import searchAPI from '../services/searchService';
import './QuestionSearch.css';

const QuestionSearch = ({ onQuestionSelect, selectedCategory }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Debounced search function
  const performSearch = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      // Only pass category if it's not "All Categories" (null)
      const categoryFilter = selectedCategory || null;
      const results = await searchAPI.searchQuestions(query.trim(), 10, categoryFilter);
      setSuggestions(results);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300); // 300ms debounce
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(''); // Clear the search input
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    
    if (onQuestionSelect) {
      onQuestionSelect(suggestion);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Truncate text for display
  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  // Format creation date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="question-search-container">
      <div className="search-input-wrapper">
        <input
          ref={searchInputRef}
          type="text"
          className="search-input"
          placeholder={t('forum.searchQuestions', 'Search similar questions...')}
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
        />
        
        {loading && (
          <div className="search-loading">
            <div className="loading-spinner"></div>
          </div>
        )}

        <div className="search-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="suggestions-dropdown">
          <div className="suggestions-header">
            <span>{suggestions.length} {t('forum.foundQuestions', 'similar questions found')}</span>
          </div>
          
          <div className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.postId}
                className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="suggestion-content">
                  <h4 className="suggestion-title">
                    {truncateText(suggestion.title, 80)}
                  </h4>
                  <p className="suggestion-text">
                    {truncateText(suggestion.content, 120)}
                  </p>
                  <div className="suggestion-meta">
                    <span className="suggestion-author">
                      {t('forum.by', 'by')} {suggestion.authorName}
                    </span>
                    <span className="suggestion-date">
                      {formatDate(suggestion.createdAt)}
                    </span>
                    <div className="suggestion-stats">
                      <span className="likes">{suggestion.likesCount} 👍</span>
                      <span className="comments">{suggestion.commentsCount} 💬</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSuggestions && searchQuery.trim() && suggestions.length === 0 && !loading && (
        <div ref={suggestionsRef} className="suggestions-dropdown">
          <div className="no-suggestions">
            <p>{t('forum.noSimilarQuestions', 'No similar questions found. You can ask a new question!')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionSearch;