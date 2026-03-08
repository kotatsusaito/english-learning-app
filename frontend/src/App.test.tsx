/**
 * Unit tests for the main App component
 * 
 * Tests:
 * - Session initialization on mount
 * - Session lifecycle management
 * - Component integration
 * - Error handling
 * - Workflow management
 * 
 * Requirements: 6.1, 6.2
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import apiClient from './services/apiClient';
import type { Session, Correction, AudioData } from '@english-learning-app/shared';

// Mock the config module
jest.mock('./config', () => ({
  config: {
    apiBaseUrl: 'http://localhost:3000/api',
  },
}));

// Mock the API client
jest.mock('./services/apiClient');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('App Component', () => {
  const mockSession: Session = {
    id: 'test-session-123',
    startTime: new Date(),
    conversationHistory: [],
    isActive: true,
  };

  const mockQuestion = { question: 'What is your favorite hobby?' };

  const mockCorrection: Correction = {
    hasErrors: false,
    originalText: 'I like reading books',
    correctedText: 'I like reading books',
    explanation: 'Your response is correct!',
    suggestions: [],
  };

  const mockAudioData: AudioData = {
    url: 'https://example.com/audio.mp3',
    format: 'mp3',
    duration: 3.5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockApiClient.session.createSession.mockResolvedValue(mockSession);
    mockApiClient.question.generateQuestion.mockResolvedValue(mockQuestion);
    mockApiClient.response.submitResponse.mockResolvedValue({
      correction: mockCorrection,
      turn: {
        question: mockQuestion.question,
        userResponse: 'I like reading books',
        correction: mockCorrection,
        timestamp: new Date(),
      },
    });
    mockApiClient.speech.synthesize.mockResolvedValue(mockAudioData);
  });

  describe('Session Initialization', () => {
    it('should create a session on mount', async () => {
      render(<App />);

      await waitFor(() => {
        expect(mockApiClient.session.createSession).toHaveBeenCalledTimes(1);
      });
    });

    it('should generate first question after session creation', async () => {
      render(<App />);

      await waitFor(() => {
        expect(mockApiClient.question.generateQuestion).toHaveBeenCalledWith(
          mockSession.id
        );
      });
    });

    it('should display the generated question', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
      });
    });

    it('should show loading state during session initialization', () => {
      render(<App />);

      expect(screen.getByText(/starting your learning session/i)).toBeInTheDocument();
    });
  });

  describe('Session Management', () => {
    it('should display session controls after session starts', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('End Session')).toBeInTheDocument();
        expect(screen.getByText('New Session')).toBeInTheDocument();
      });
    });

    it('should end session when End Session button is clicked', async () => {
      mockApiClient.session.endSession.mockResolvedValue();
      
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('End Session')).toBeInTheDocument();
      });

      const endButton = screen.getByText('End Session');
      fireEvent.click(endButton);

      await waitFor(() => {
        expect(mockApiClient.session.endSession).toHaveBeenCalledWith(mockSession.id);
      });
    });

    it('should start new session when New Session button is clicked', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('New Session')).toBeInTheDocument();
      });

      // Clear previous calls
      jest.clearAllMocks();
      mockApiClient.session.createSession.mockResolvedValue({
        ...mockSession,
        id: 'new-session-456',
      });

      const newSessionButton = screen.getByText('New Session');
      fireEvent.click(newSessionButton);

      await waitFor(() => {
        expect(mockApiClient.session.createSession).toHaveBeenCalled();
      });
    });
  });

  describe('Response Submission Workflow', () => {
    it('should submit response and display correction', async () => {
      render(<App />);

      // Wait for question to load
      await waitFor(() => {
        expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
      });

      // Find and fill the textarea
      const textarea = screen.getByRole('textbox', { name: /response input/i });
      fireEvent.change(textarea, { target: { value: 'I like reading books' } });

      // Submit the response
      const submitButton = screen.getByText('Submit Response');
      fireEvent.click(submitButton);

      // Verify API was called
      await waitFor(() => {
        expect(mockApiClient.response.submitResponse).toHaveBeenCalledWith(
          mockSession.id,
          'I like reading books'
        );
      });

      // Verify correction is displayed - check for the feedback section
      await waitFor(() => {
        expect(screen.getByText('Feedback')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should generate audio after receiving correction', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox', { name: /response input/i });
      fireEvent.change(textarea, { target: { value: 'I like reading books' } });

      const submitButton = screen.getByText('Submit Response');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockApiClient.speech.synthesize).toHaveBeenCalledWith(
          mockCorrection.correctedText
        );
      });
    });

    it('should update conversation history after response submission', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox', { name: /response input/i });
      fireEvent.change(textarea, { target: { value: 'I like reading books' } });

      const submitButton = screen.getByText('Submit Response');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/conversation turns: 1/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error when session creation fails', async () => {
      mockApiClient.session.createSession.mockRejectedValue(
        new Error('Failed to create session')
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/failed to create session/i)).toBeInTheDocument();
      });
    });

    it('should display retry button on session error', async () => {
      mockApiClient.session.createSession.mockRejectedValue(
        new Error('Network error')
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should display error when question generation fails', async () => {
      mockApiClient.question.generateQuestion.mockRejectedValue(
        new Error('Failed to generate question')
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/failed to generate question/i)).toBeInTheDocument();
      });
    });

    it('should continue without audio when speech synthesis fails', async () => {
      mockApiClient.speech.synthesize.mockRejectedValue(
        new Error('Audio synthesis failed')
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox', { name: /response input/i });
      fireEvent.change(textarea, { target: { value: 'I like reading books' } });

      const submitButton = screen.getByText('Submit Response');
      fireEvent.click(submitButton);

      // Correction should still be displayed - check for the feedback section
      await waitFor(() => {
        expect(screen.getByText('Feedback')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Audio error message should be shown
      await waitFor(() => {
        expect(screen.getByText(/audio synthesis failed/i)).toBeInTheDocument();
      });
    });

    it('should display error when response submission fails', async () => {
      mockApiClient.response.submitResponse.mockRejectedValue(
        new Error('Failed to submit response')
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox', { name: /response input/i });
      fireEvent.change(textarea, { target: { value: 'Test response' } });

      const submitButton = screen.getByText('Submit Response');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to submit response/i)).toBeInTheDocument();
      });
    });

    it('should retry question generation when retry button is clicked', async () => {
      // First call fails
      mockApiClient.question.generateQuestion
        .mockRejectedValueOnce(new Error('Failed to generate question'))
        .mockResolvedValueOnce({ question: 'Retry successful question' });

      render(<App />);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/failed to generate question/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry generating question/i });
      fireEvent.click(retryButton);

      // Wait for successful question
      await waitFor(() => {
        expect(screen.getByText('Retry successful question')).toBeInTheDocument();
      });
    });

    it('should retry response submission when retry button is clicked', async () => {
      // First call fails, second succeeds
      mockApiClient.response.submitResponse
        .mockRejectedValueOnce(new Error('Failed to submit response'))
        .mockResolvedValueOnce({
          correction: mockCorrection,
          turn: {
            question: mockQuestion.question,
            userResponse: 'Test response',
            correction: mockCorrection,
            timestamp: new Date(),
          },
        });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox', { name: /response input/i });
      fireEvent.change(textarea, { target: { value: 'Test response' } });

      const submitButton = screen.getByText('Submit Response');
      fireEvent.click(submitButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/failed to submit response/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry submitting response/i });
      fireEvent.click(retryButton);

      // Wait for successful submission
      await waitFor(() => {
        expect(screen.getByText('Feedback')).toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    it('should render all main components', async () => {
      render(<App />);

      await waitFor(() => {
        // Header
        expect(screen.getByText('English Learning App')).toBeInTheDocument();
        
        // Question display
        expect(screen.getByText('Question')).toBeInTheDocument();
        
        // Response input
        expect(screen.getByText('Your Response')).toBeInTheDocument();
        
        // Footer
        expect(screen.getByText(/practice makes perfect/i)).toBeInTheDocument();
      });
    });

    it('should disable response input while submitting', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox', { name: /response input/i });
      fireEvent.change(textarea, { target: { value: 'Test response' } });

      const submitButton = screen.getByText('Submit Response');
      fireEvent.click(submitButton);

      // Input should be disabled during submission
      expect(textarea).toBeDisabled();
    });

    it('should disable response input when no question is available', async () => {
      mockApiClient.question.generateQuestion.mockResolvedValue({ question: '' });

      render(<App />);

      await waitFor(() => {
        const textarea = screen.getByRole('textbox', { name: /response input/i });
        expect(textarea).toBeDisabled();
      });
    });
  });

  describe('Conversation Context Preservation', () => {
    it('should maintain conversation history across multiple turns', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
      });

      // First turn
      const textarea = screen.getByRole('textbox', { name: /response input/i });
      fireEvent.change(textarea, { target: { value: 'First response' } });
      fireEvent.click(screen.getByText('Submit Response'));

      await waitFor(() => {
        expect(screen.getByText(/conversation turns: 1/i)).toBeInTheDocument();
      });

      // Second turn
      mockApiClient.response.submitResponse.mockResolvedValue({
        correction: mockCorrection,
        turn: {
          question: 'Second question',
          userResponse: 'Second response',
          correction: mockCorrection,
          timestamp: new Date(),
        },
      });

      await waitFor(() => {
        const textareaAgain = screen.getByRole('textbox', { name: /response input/i });
        fireEvent.change(textareaAgain, { target: { value: 'Second response' } });
      });

      fireEvent.click(screen.getByText('Submit Response'));

      await waitFor(() => {
        expect(screen.getByText(/conversation turns: 2/i)).toBeInTheDocument();
      });
    });
  });
});
