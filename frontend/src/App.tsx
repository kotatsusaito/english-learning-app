import React, { useState, useEffect, useCallback } from 'react';
import { Session, Correction, AudioData } from '@english-learning-app/shared';
import QuestionDisplay from './components/QuestionDisplay';
import ResponseInput from './components/ResponseInput';
import CorrectionDisplay from './components/CorrectionDisplay';
import AudioPlayer from './components/AudioPlayer';
import apiClient from './services/apiClient';
import { config } from './config';
import './App.css';

/**
 * Main Application Component
 * 
 * Integrates all components and manages the learning session workflow:
 * - Session lifecycle management
 * - Question generation and display
 * - User response submission
 * - Correction display and audio playback
 * 
 * Requirements: 6.1, 6.2
 */
function App() {
  // Session state
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [cefrLevel, setCefrLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('B1');

  // Question state
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  // Response state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastSubmittedResponse, setLastSubmittedResponse] = useState<string | null>(null);

  // Correction and audio state
  const [currentCorrection, setCurrentCorrection] = useState<Correction | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [audioError, setAudioError] = useState<string | null>(null);

  /**
   * Start a new learning session
   * Requirements: 6.1, 6.4
   */
  const startSession = useCallback(async () => {
    setIsSessionLoading(true);
    setSessionError(null);
    setCurrentQuestion('');
    setCurrentCorrection(null);
    setAudioUrl(undefined);

    try {
      // Create session with CEFR level
      const response = await fetch(`${config.apiBaseUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cefrLevel }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const newSession = data.data;
      setSession(newSession);
      
      // Generate first question
      await generateQuestion(newSession.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start session';
      setSessionError(errorMessage);
      console.error('Failed to start session:', error);
    } finally {
      setIsSessionLoading(false);
    }
  }, [cefrLevel]);

  /**
   * End the current learning session
   * Requirements: 6.3
   */
  const endSession = useCallback(async () => {
    if (!session) return;

    try {
      await apiClient.session.endSession(session.id);
      setSession(null);
      setCurrentQuestion('');
      setCurrentCorrection(null);
      setAudioUrl(undefined);
      setSessionError(null);
      setQuestionError(null);
      setSubmitError(null);
    } catch (error) {
      console.error('Failed to end session:', error);
      // Still clear local state even if API call fails
      setSession(null);
      setCurrentQuestion('');
      setCurrentCorrection(null);
      setAudioUrl(undefined);
    }
  }, [session]);

  /**
   * Generate a new question
   * Requirements: 1.1, 1.2
   */
  const generateQuestion = useCallback(async (sessionId: string) => {
    setIsQuestionLoading(true);
    setQuestionError(null);
    setCurrentCorrection(null);
    setAudioUrl(undefined);

    try {
      const { question } = await apiClient.question.generateQuestion(sessionId);
      setCurrentQuestion(question);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate question';
      setQuestionError(errorMessage);
      console.error('Failed to generate question:', error);
    } finally {
      setIsQuestionLoading(false);
    }
  }, []);

  /**
   * Submit user response and get correction
   * Requirements: 2.3, 4.1, 4.2, 6.2
   */
  const handleSubmitResponse = useCallback(async (responseText: string) => {
    if (!session) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setAudioError(null);
    setLastSubmittedResponse(responseText);

    try {
      // Submit response and get correction
      const { correction, turn } = await apiClient.response.submitResponse(
        session.id,
        responseText
      );

      // Update conversation history in session state
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          conversationHistory: [...prev.conversationHistory, turn]
        };
      });

      // Display correction
      setCurrentCorrection(correction);

      // Generate audio for corrected text
      // Requirements: 5.1
      try {
        const audioData = await apiClient.speech.synthesize(correction.correctedText);
        setAudioUrl(audioData.url);
      } catch (audioError) {
        // Graceful degradation: continue without audio
        // Requirements: 7.3
        const audioErrorMessage = audioError instanceof Error 
          ? audioError.message 
          : 'Audio synthesis failed';
        setAudioError(audioErrorMessage);
        console.error('Failed to synthesize speech:', audioError);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit response';
      setSubmitError(errorMessage);
      console.error('Failed to submit response:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [session]);

  /**
   * Retry submitting the last response
   * Requirements: 7.1, 7.2
   */
  const retrySubmitResponse = useCallback(() => {
    if (lastSubmittedResponse) {
      handleSubmitResponse(lastSubmittedResponse);
    }
  }, [lastSubmittedResponse, handleSubmitResponse]);

  /**
   * Retry generating a question
   * Requirements: 7.1
   */
  const retryGenerateQuestion = useCallback(() => {
    if (session) {
      generateQuestion(session.id);
    }
  }, [session, generateQuestion]);

  /**
   * Handle audio playback errors
   * Requirements: 5.5, 7.3
   */
  const handleAudioError = useCallback((error: string) => {
    setAudioError(error);
    console.error('Audio playback error:', error);
  }, []);

  /**
   * Initialize session on mount - removed auto-start to allow level selection
   */
  // useEffect(() => {
  //   startSession();
  // }, [startSession]);

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">English Learning App</h1>
        <p className="app__subtitle">Practice English with AI-powered conversations</p>
      </header>

      <main className="app__main">
        {sessionError ? (
          <div className="app__error" role="alert">
            <h2>Session Error</h2>
            <p>{sessionError}</p>
            <button onClick={startSession} className="app__retry-btn">
              Retry
            </button>
          </div>
        ) : !session && !isSessionLoading ? (
          <div className="app__start-screen">
            {/* CEFR Level Selector */}
            <div className="app__level-selector">
              <label htmlFor="cefr-level" className="app__level-label">
                Select your English level:
              </label>
              <select
                id="cefr-level"
                value={cefrLevel}
                onChange={(e) => setCefrLevel(e.target.value as any)}
                className="app__level-select"
              >
                <option value="A1">A1 - Beginner</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper Intermediate</option>
                <option value="C1">C1 - Advanced</option>
                <option value="C2">C2 - Proficiency</option>
              </select>
            </div>
            <button onClick={startSession} className="app__start-btn">
              Start Learning Session
            </button>
          </div>
        ) : isSessionLoading ? (
          <div className="app__loading">
            <div className="spinner-large" aria-label="Starting session"></div>
            <p>Starting your learning session...</p>
          </div>
        ) : session ? (
          <div className="app__content">
            {/* Session info */}
            <div className="app__session-info">
              <span className="app__level-badge">Level: {session.cefrLevel || 'B1'}</span>
            </div>
            
            {/* Session controls */}
            <div className="app__session-controls">
              <button 
                onClick={endSession} 
                className="app__end-session-btn"
                disabled={isSessionLoading || isSubmitting}
              >
                End Session
              </button>
              <button 
                onClick={startSession} 
                className="app__new-session-btn"
                disabled={isSessionLoading || isSubmitting}
              >
                New Session
              </button>
            </div>

            {/* Question display */}
            <QuestionDisplay
              question={currentQuestion}
              isLoading={isQuestionLoading}
              error={questionError}
              onRetry={retryGenerateQuestion}
            />

            {/* Response input */}
            <ResponseInput
              onSubmit={handleSubmitResponse}
              disabled={isSubmitting || isQuestionLoading || !currentQuestion}
              placeholder={
                !currentQuestion 
                  ? 'Waiting for question...' 
                  : 'Type your response in English...'
              }
            />

            {/* Submit error display */}
            {submitError && (
              <div className="app__submit-error" role="alert">
                <div>
                  <span className="error-icon">⚠️</span>
                  <p>{submitError}</p>
                </div>
                <button 
                  onClick={retrySubmitResponse} 
                  className="app__retry-btn"
                  disabled={isSubmitting}
                  aria-label="Retry submitting response"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Correction display */}
            {currentCorrection && (
              <div className="app__feedback-section">
                <CorrectionDisplay correction={currentCorrection} />
                
                {/* Audio player */}
                <AudioPlayer 
                  audioUrl={audioUrl} 
                  text={currentCorrection.correctedText}
                  onError={handleAudioError}
                />
                
                {/* Audio error display */}
                {audioError && !audioUrl && (
                  <div className="app__audio-error" role="alert">
                    <span className="error-icon-small">⚠️</span>
                    <p>{audioError} (Text correction is still available)</p>
                  </div>
                )}
              </div>
            )}

            {/* Conversation history indicator */}
            {session.conversationHistory.length > 0 && (
              <div className="app__history-indicator">
                <p>Conversation turns: {session.conversationHistory.length}</p>
              </div>
            )}
          </div>
        ) : null}
      </main>

      <footer className="app__footer">
        <p>Practice makes perfect! Keep learning and improving your English.</p>
      </footer>
    </div>
  );
}

export default App;
