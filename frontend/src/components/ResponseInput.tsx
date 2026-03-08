import React, { useState, useRef, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import './ResponseInput.css';

interface ResponseInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * ResponseInput component manages user response input
 * Provides text input field with voice input and submit functionality
 * 
 * Requirements: 2.1, 2.2, 2.3
 */
const ResponseInput: React.FC<ResponseInputProps> = ({
  onSubmit,
  disabled = false,
  placeholder = 'Type your response in English...'
}) => {
  const [value, setValue] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Speech recognition hook
  const {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    lang: 'en-US',
    continuous: true,
    interimResults: true,
    onError: (error) => {
      setSpeechError(error);
      setTimeout(() => setSpeechError(null), 5000); // Clear error after 5 seconds
    },
  });

  // Update value when transcript changes
  useEffect(() => {
    if (transcript) {
      setValue(transcript);
    }
  }, [transcript]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // If user types manually, reset speech transcript
    if (transcript) {
      resetTranscript();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (value.trim()) {
      // Stop listening if active
      if (isListening) {
        stopListening();
      }

      onSubmit(value.trim());
      setValue('');
      resetTranscript();

      // Reset textarea height after submission
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaInput = () => {
    // Auto-resize textarea based on content
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const toggleListening = () => {
    console.log('toggleListening called, isSupported:', isSupported, 'isListening:', isListening);
    
    if (!isSupported) {
      setSpeechError('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      setTimeout(() => setSpeechError(null), 5000);
      return;
    }

    if (isListening) {
      console.log('Stopping listening');
      stopListening();
    } else {
      console.log('Starting listening');
      // Clear transcript when starting fresh
      if (!value) {
        resetTranscript();
      }
      startListening();
    }
  };

  return (
    <div className="response-input">
      <h2 className="response-input__title">Your Response</h2>

      <form onSubmit={handleSubmit} className="response-input__form">
        <div className="response-input__field">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onInput={handleTextareaInput}
            disabled={disabled}
            placeholder={placeholder}
            className="response-input__textarea"
            rows={3}
            aria-label="Response input"
          />

          {value && (
            <div className="response-input__char-count" aria-live="polite">
              {value.length} characters
            </div>
          )}
        </div>

        {speechError && (
          <div className="response-input__error" role="alert">
            <span className="error-icon">⚠️</span>
            {speechError}
          </div>
        )}

        <div className="response-input__actions">
          <button
            type="button"
            onClick={toggleListening}
            disabled={disabled}
            className={`response-input__mic-btn ${isListening ? 'response-input__mic-btn--active' : ''}`}
            aria-label={isListening ? 'Stop recording' : 'Start recording'}
            title={!isSupported ? 'Speech recognition not supported' : undefined}
          >
            {isListening ? '🎤 Recording...' : '🎤 Voice Input'}
          </button>

          <button
            type="submit"
            disabled={disabled || !value.trim()}
            className="response-input__submit-btn"
          >
            Submit Response
          </button>

          <div className="response-input__hint">
            Press Ctrl+Enter to submit
          </div>
        </div>
      </form>
    </div>
  );
};

export default ResponseInput;
