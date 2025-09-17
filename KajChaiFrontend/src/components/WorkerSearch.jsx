import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './WorkerSearch.css';

const WorkerSearch = ({ onWorkerSelect, selectedField }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState('');
  
  const searchRef = useRef(null);
  const suggestionRefs = useRef([]);
  const debounceTimeout = useRef(null);

  // Clear search and suggestions
  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setError('');
  };

  // Debounced search function
  const performSearch = async (query, field) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // Import searchService dynamically to avoid circular dependencies
      const { default: searchService } = await import('../services/searchService');
      const results = await searchService.searchWorkers(query.trim(), field, 5);
      
      setSuggestions(results || []);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (err) {
      console.error('Search error:', err);
      setError(t('common.error'));
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search button click
  const handleSearchClick = () => {
    performSearch(searchQuery, selectedField);
  };

  // Handle input change with debouncing
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Set new timeout for debounced search
    debounceTimeout.current = setTimeout(() => {
      performSearch(value, selectedField);
    }, 300);
  };

  // Handle suggestion click
  const handleSuggestionClick = (worker) => {
    setSearchQuery(worker.name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onWorkerSelect(worker);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
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

  // Format worker info for display
  const formatWorkerInfo = (worker) => {
    const parts = [];
    
    if (worker.field) {
      parts.push(worker.field);
    }
    
    if (worker.rating !== null && worker.rating !== undefined) {
      parts.push(`${worker.rating.toFixed(1)} ⭐`);
    }
    
    if (worker.upazila || worker.district) {
      const location = worker.upazila && worker.district && worker.upazila !== worker.district 
        ? `${worker.upazila}, ${worker.district}`
        : worker.upazila || worker.district;
      parts.push(location);
    }
    
    return parts.join(' • ');
  };

  // Update suggestion refs when suggestions change
  useEffect(() => {
    suggestionRefs.current = suggestionRefs.current.slice(0, suggestions.length);
  }, [suggestions]);

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedIndex]);

  // Clear search when field changes
  useEffect(() => {
    clearSearch();
  }, [selectedField]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="worker-search-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={t('workers.searchWorkerPlaceholder')}
          className="worker-search-input"
          autoComplete="off"
        />
        
        {/* Search Button */}
        <button
          type="button"
          onClick={handleSearchClick}
          className="search-btn"
          disabled={isLoading || !searchQuery.trim()}
        >
          {isLoading ? (t('common.searching') || 'Searching...') : t('common.search')}
        </button>
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="search-loading">
            <div className="loading-spinner"></div>
          </div>
        )}
        
        {/* Clear button */}
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="search-clear-btn"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="search-error">
          {error}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="worker-suggestions-dropdown">
          {suggestions.map((worker, index) => (
            <div
              key={worker.workerId}
              ref={el => suggestionRefs.current[index] = el}
              className={`worker-suggestion-item ${
                index === selectedIndex ? 'selected' : ''
              }`}
              onClick={() => handleSuggestionClick(worker)}
            >
              <div className="worker-suggestion-content">
                <div className="worker-suggestion-main">
                  <div className="worker-avatar">
                    {worker.photo ? (
                      <img 
                        src={worker.photo} 
                        alt={worker.name}
                        className="worker-avatar-img"
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
                  
                  <div className="worker-suggestion-text">
                    <div className="worker-name">{worker.name}</div>
                    <div className="worker-info">{formatWorkerInfo(worker)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && suggestions.length === 0 && searchQuery.trim().length >= 2 && !isLoading && (
        <div className="worker-suggestions-dropdown">
          <div className="no-suggestions">
            {t('workers.noSearchResults')}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerSearch;