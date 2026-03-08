/**
 * Unit tests for API Client
 */

// Mock the config module before importing apiClient
jest.mock('../config', () => ({
  config: {
    apiBaseUrl: '/api',
  },
}));

import { apiClient, ApiError } from './apiClient';

// Mock fetch globally
const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sessionApi', () => {
    it('should create a new session', async () => {
      const mockSession = {
        id: 'test-session-id',
        startTime: new Date(),
        conversationHistory: [],
        isActive: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSession,
      });

      const result = await apiClient.session.createSession();
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sessions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockSession);
    });

    it('should get session by ID', async () => {
      const mockSession = {
        id: 'test-session-id',
        startTime: new Date(),
        conversationHistory: [],
        isActive: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSession,
      });

      const result = await apiClient.session.getSession('test-session-id');
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sessions/test-session-id',
        expect.any(Object)
      );
      expect(result).toEqual(mockSession);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Session not found' }),
      });

      await expect(
        apiClient.session.getSession('invalid-id')
      ).rejects.toThrow(ApiError);
    });
  });

  describe('questionApi', () => {
    it('should generate a question', async () => {
      const mockResponse = { question: 'What is your favorite hobby?' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.question.generateQuestion('session-id');
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sessions/session-id/question',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('responseApi', () => {
    it('should submit response and get correction', async () => {
      const mockResponse = {
        correction: {
          hasErrors: false,
          originalText: 'I like reading',
          correctedText: 'I like reading',
          explanation: 'Your response is correct!',
          suggestions: [],
        },
        turn: {
          question: 'What is your hobby?',
          userResponse: 'I like reading',
          correction: null,
          timestamp: new Date(),
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.response.submitResponse(
        'session-id',
        'I like reading'
      );
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/sessions/session-id/response',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ text: 'I like reading' }),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('speechApi', () => {
    it('should synthesize text to speech', async () => {
      const mockAudio = {
        url: 'https://example.com/audio.mp3',
        format: 'mp3',
        duration: 3.5,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAudio,
      });

      const result = await apiClient.speech.synthesize('Hello world');
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/speech/synthesize',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ text: 'Hello world', options: undefined }),
        })
      );
      expect(result).toEqual(mockAudio);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors after retries', async () => {
      // Mock all 4 attempts (initial + 3 retries)
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      await expect(
        apiClient.session.createSession()
      ).rejects.toThrow(ApiError);
      
      // Should have tried 4 times
      expect(mockFetch).toHaveBeenCalledTimes(4);
    }, 10000); // 10 second timeout

    it('should handle non-JSON error responses after retries', async () => {
      // Mock all 4 attempts (initial + 3 retries) since 500 errors are retryable
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => {
            throw new Error('Invalid JSON');
          },
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => {
            throw new Error('Invalid JSON');
          },
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => {
            throw new Error('Invalid JSON');
          },
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => {
            throw new Error('Invalid JSON');
          },
        });

      await expect(
        apiClient.session.createSession()
      ).rejects.toThrow('HTTP 500: Internal Server Error');
      
      // Should have tried 4 times
      expect(mockFetch).toHaveBeenCalledTimes(4);
    }, 10000); // 10 second timeout

    it('should retry on network errors with exponential backoff', async () => {
      // Fail twice, then succeed (need 4 mocks because of timeout retries)
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'test-session',
            startTime: new Date(),
            conversationHistory: [],
            isActive: true,
          }),
        });

      const result = await apiClient.session.createSession();
      
      expect(mockFetch).toHaveBeenCalledTimes(4);
      expect(result.id).toBe('test-session');
    }, 10000); // 10 second timeout

    it('should retry on 5xx server errors', async () => {
      // Fail with 500, then succeed
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ message: 'Server error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'test-session',
            startTime: new Date(),
            conversationHistory: [],
            isActive: true,
          }),
        });

      const result = await apiClient.session.createSession();
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.id).toBe('test-session');
    }, 10000); // 10 second timeout

    it('should not retry on 4xx client errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Not found' }),
      });

      await expect(
        apiClient.session.getSession('invalid-id')
      ).rejects.toThrow('Not found');
      
      // Should only try once for 4xx errors
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should give up after max retries', async () => {
      // Fail 4 times (initial + 3 retries)
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      await expect(
        apiClient.session.createSession()
      ).rejects.toThrow('Network error');
      
      // Should try 4 times total (initial + 3 retries)
      expect(mockFetch).toHaveBeenCalledTimes(4);
    }, 10000); // 10 second timeout
  });
});
