import React, { useState, useRef, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';
import './ChatBot.css';

const ChatBot = () => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const inputRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [conversationContext, setConversationContext] = useState(null);
    const messagesEndRef = useRef(null);

    // Helper function to get the current user's token (same logic as authService)
    const getCurrentUserToken = () => {
        // First check if there's a current user email in session storage
        const currentUserEmail = sessionStorage.getItem('current_user_email');
        if (currentUserEmail) {
            const userToken = localStorage.getItem(`jwt_token_${currentUserEmail}`);
            if (userToken) {
                return userToken;
            }
        }
        
        // Fallback to generic token
        return localStorage.getItem('jwt_token');
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            // Add welcome message when chatbot opens
            const welcomeMessage = {
                id: Date.now(),
                text: t('chatbot.welcome'),
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages([welcomeMessage]);
        }
    }, [isOpen, t]);

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            text: inputMessage,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setInputMessage('');

        try {
            const endpoint = conversationContext ? '/api/chatbot/follow-up' : '/api/chatbot/ask';
            
            const requestBody = conversationContext
                ? {
                    originalQuestion: conversationContext.originalQuestion,
                    followUpResponse: inputMessage,
                    conversationContext: {
                        ...conversationContext.conversationContext,
                        followUpPrompt: conversationContext.followUpPrompt
                    },
                    userId: user?.id
                }
                : {
                    question: inputMessage,
                    userId: user?.id
                };            const response = await fetch(`http://localhost:8080${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCurrentUserToken()}`
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (response.ok) {
                const botMessage = {
                    id: Date.now() + 1,
                    text: data.response,
                    sender: 'bot',
                    timestamp: new Date(),
                    category: data.category,
                    additionalData: data.additionalData
                };

                setMessages(prev => [...prev, botMessage]);

                // Handle follow-up conversations
                if (data.needsFollowUp) {
                    setConversationContext({
                        originalQuestion: conversationContext?.originalQuestion || inputMessage,
                        followUpPrompt: data.followUpPrompt,
                        conversationContext: data.conversationContext
                    });
                } else {
                    setConversationContext(null);
                }
            } else {
                const errorMessage = {
                    id: Date.now() + 1,
                    text: data.error || t('chatbot.error'),
                    sender: 'bot',
                    timestamp: new Date(),
                    isError: true
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error('ChatBot error:', error);
            const errorMessage = {
                id: Date.now() + 1,
                text: t('chatbot.networkError'),
                sender: 'bot',
                timestamp: new Date(),
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            // Focus the input field after sending the message
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 100);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([]);
        setConversationContext(null);
        // Add welcome message
        const welcomeMessage = {
            id: Date.now(),
            text: t('chatbot.welcome'),
            sender: 'bot',
            timestamp: new Date()
        };
        setMessages([welcomeMessage]);
    };

    const formatMessage = (text) => {
        // Convert markdown-like formatting to HTML
        let formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br/>');
        
        return { __html: formattedText };
    };

    const getCategoryIcon = (category) => {
        const icons = {
            customer_queries: '🏠',
            worker_summary: '👷',
            nearby_workers: '📍',
            nearby_jobs: '💼',
            website_howto: '❓',
            payment_estimation: '💰',
            error: '❌'
        };
        return icons[category] || '🤖';
    };

    const getSuggestions = () => {
        return [
            t('chatbot.suggestions.howToPost'),
            t('chatbot.suggestions.findWorker'),
            t('chatbot.suggestions.contactWorker'),
            t('chatbot.suggestions.estimateCost'),
            t('chatbot.suggestions.nearbyJobs'),
            t('chatbot.suggestions.writeReview')
        ];
    };

    return (
        <>
            {/* ChatBot Toggle Button */}
            <div 
                className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title={t('chatbot.title')}
            >
                <span className="chatbot-icon">🤖</span>
                {!isOpen && <span className="chatbot-pulse"></span>}
            </div>

            {/* ChatBot Window */}
            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <div className="chatbot-title">
                            <span className="chatbot-avatar">🤖</span>
                            <div>
                                <h3>{t('chatbot.title')}</h3>
                                <span className="chatbot-status">{t('chatbot.online')}</span>
                            </div>
                        </div>
                        <div className="chatbot-actions">
                            <button 
                                className="chatbot-action-btn"
                                onClick={clearChat}
                                title={t('chatbot.clearChat')}
                            >
                                🗑️
                            </button>
                            <button 
                                className="chatbot-action-btn"
                                onClick={() => setIsOpen(false)}
                                title={t('chatbot.close')}
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((message) => (
                            <div 
                                key={message.id} 
                                className={`message ${message.sender} ${message.isError ? 'error' : ''}`}
                            >
                                <div className="message-content">
                                    {message.sender === 'bot' && (
                                        <span className="message-icon">
                                            {getCategoryIcon(message.category)}
                                        </span>
                                    )}
                                    <div 
                                        className="message-text"
                                        dangerouslySetInnerHTML={formatMessage(message.text)}
                                    />
                                </div>
                                <div className="message-timestamp">
                                    {message.timestamp.toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    })}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="message bot">
                                <div className="message-content">
                                    <span className="message-icon">🤖</span>
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Suggestions */}
                    {messages.length <= 1 && !isLoading && (
                        <div className="chatbot-suggestions">
                            <p className="suggestions-title">{t('chatbot.suggestionsTitle')}</p>
                            <div className="suggestions-grid">
                                {getSuggestions().map((suggestion, index) => (
                                    <button
                                        key={index}
                                        className="suggestion-btn"
                                        onClick={() => setInputMessage(suggestion)}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="chatbot-input">
                        <div className="input-container">
                            <textarea
                                ref={inputRef}
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={t('chatbot.inputPlaceholder')}
                                rows="1"
                                disabled={isLoading}
                                className="message-input"
                            />
                            <button 
                                onClick={sendMessage}
                                disabled={!inputMessage.trim() || isLoading}
                                className="send-btn"
                            >
                                <span className="send-icon">📤</span>
                            </button>
                        </div>
                        <div className="chatbot-footer">
                            <small>{t('chatbot.disclaimer')}</small>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatBot;