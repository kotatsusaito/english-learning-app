/**
 * API Client for communicating with the backend
 * 
 * Provides methods to interact with all backend endpoints:
 * - Session management
 * - Question generation
 * - Response submission and correction
 * - Speech synthesis
 */

import type {
  Session,
  ConversationTurn,
  Correction,
  AudioData,
} from '@english-learning-app/shared';
import { config } from '../config';

/**
 * Base API configuration
 */
const API_BASE_URL = config.apiBaseUrl;
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_MAX_RETRIES = 3;

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Timeout error class
 */
export class TimeoutError extends ApiError {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Retry configuration options
 */
interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  shouldRetry?: (error: ApiError) => boolean;
}

/**
 * Check if an error is retryable (network errors or 5xx server errors)
 */
function isRetryableError(error: ApiError): boolean {
  // Retry on network errors (no status code)
  if (!error.statusCode) {
    return true;
  }
  
  // Retry on 5xx server errors
  if (error.statusCode >= 500 && error.statusCode < 600) {
    return true;
  }
  
  // Retry on 429 (rate limit)
  if (error.statusCode === 429) {
    return true;
  }
  
  return false;
}

/**
 * Delay helper for retry logic
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generic fetch wrapper with error handling, timeout, and retry logic
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelay = 1000,
    shouldRetry = isRetryableError,
  } = retryOptions;

  const url = `${API_BASE_URL}${endpoint}`;
  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return await response.json();
    } catch (error) {
      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new TimeoutError('Request timeout');
      } else if (error instanceof ApiError) {
        lastError = error;
      } else {
        // Network or other errors
        lastError = new ApiError(
          error instanceof Error ? error.message : 'Unknown error occurred',
          undefined,
          error
        );
      }

      // Check if we should retry
      if (attempt < maxRetries && shouldRetry(lastError)) {
        // Exponential backoff: 1s, 2s, 4s
        const backoffDelay = retryDelay * Math.pow(2, attempt);
        await delay(backoffDelay);
        continue;
      }

      // No more retries or non-retryable error
      throw lastError;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new ApiError('Unknown error occurred');
}

/**
 * Session API methods
 */
export const sessionApi = {
  /**
   * Create a new learning session
   */
  async createSession(): Promise<Session> {
    const response = await fetchApi<{ success: boolean; data: Session }>('/sessions', {
      method: 'POST',
    });
    return response.data;
  },

  /**
   * Get session details by ID
   */
  async getSession(sessionId: string): Promise<Session> {
    const response = await fetchApi<{ success: boolean; data: Session }>(`/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * End a learning session
   */
  async endSession(sessionId: string): Promise<void> {
    await fetchApi<{ success: boolean; message: string }>(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Question API methods
 */
export const questionApi = {
  /**
   * Generate a new question for the session
   */
  async generateQuestion(sessionId: string): Promise<{ question: string }> {
    const response = await fetchApi<{ success: boolean; data: { question: string; sessionId: string } }>(
      `/sessions/${sessionId}/question`,
      {
        method: 'POST',
      }
    );
    return { question: response.data.question };
  },
};

/**
 * Response API methods
 */
export const responseApi = {
  /**
   * Submit user response and get correction
   */
  async submitResponse(
    sessionId: string,
    responseText: string
  ): Promise<{ correction: Correction; turn: ConversationTurn }> {
    const response = await fetchApi<{
      success: boolean;
      data: {
        originalText: string;
        correction: Correction;
        sessionId: string;
      };
    }>(
      `/sessions/${sessionId}/response`,
      {
        method: 'POST',
        body: JSON.stringify({ text: responseText }),
      }
    );
    
    // Create a conversation turn from the response
    const turn: ConversationTurn = {
      question: '', // Will be filled by the app
      userResponse: response.data.originalText,
      correction: response.data.correction,
      timestamp: new Date(),
    };
    
    return {
      correction: response.data.correction,
      turn,
    };
  },
};

/**
 * Speech API methods
 */
export const speechApi = {
  /**
   * Synthesize text to speech
   */
  async synthesize(
    text: string,
    options?: { language?: string; voice?: string; speed?: number }
  ): Promise<AudioData> {
    return fetchApi<AudioData>('/speech/synthesize', {
      method: 'POST',
      body: JSON.stringify({ text, options }),
    });
  },
};

/**
 * Combined API client export
 */
export const apiClient = {
  session: sessionApi,
  question: questionApi,
  response: responseApi,
  speech: speechApi,
};

export default apiClient;
