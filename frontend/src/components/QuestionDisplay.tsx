import React from 'react';
import AudioPlayer from './AudioPlayer';
import './QuestionDisplay.css';

interface QuestionDisplayProps {
  question?: string;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

/**
 * QuestionDisplay component displays AI-generated questions to the user
 * Handles loading states and error messages with retry capability
 * 
 * Requirements: 1.1, 1.2, 7.1
 */
const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  isLoading = false,
  error,
  onRetry
}) => {
  return (
    <div className="question-display">
      <h2 className="question-display__title">Question</h2>
      
      <div className="question-display__content">
        {isLoading ? (
          <div className="question-display__loading">
            <div className="spinner" aria-label="Loading question"></div>
            <p>Generating question...</p>
          </div>
        ) : error ? (
          <div className="question-display__error" role="alert">
            <div>
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
            </div>
            {onRetry && (
              <button 
                onClick={onRetry} 
                className="question-display__retry-btn"
                aria-label="Retry generating question"
              >
                Retry
              </button>
            )}
          </div>
        ) : question ? (
          <div className="question-display__text">
            <p>{question}</p>
            <AudioPlayer text={question} />
          </div>
        ) : (
          <div className="question-display__empty">
            <p>No question yet. Start a session to begin!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDisplay;
