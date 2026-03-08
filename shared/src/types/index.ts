/**
 * Core type definitions for the English Learning App
 */

/**
 * CEFR (Common European Framework of Reference) levels for language proficiency
 */
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/**
 * Represents a learning session with conversation history
 */
export type Session = {
  id: string;
  startTime: Date;
  conversationHistory: ConversationTurn[];
  isActive: boolean;
  cefrLevel?: CEFRLevel; // User's proficiency level
};

/**
 * Represents a single turn in the conversation
 */
export type ConversationTurn = {
  question: string;
  userResponse: string;
  correction: Correction | null;
  timestamp: Date;
};

/**
 * Represents grammar correction and improvement suggestions
 */
export type Correction = {
  hasErrors: boolean;
  originalText: string;
  correctedText: string;
  explanation: string;
  suggestions: string[];
};

/**
 * Represents a user's response to a question
 */
export type UserResponse = {
  text: string;
  submittedAt: Date;
};

/**
 * Represents audio data for speech synthesis
 */
export type AudioData = {
  url: string;
  format: string;  // 'mp3', 'wav', 'ogg'
  duration: number;  // seconds
};

/**
 * Context for AI question generation
 */
export type ConversationContext = {
  previousTurns: ConversationTurn[];
  sessionId: string;
  cefrLevel?: CEFRLevel; // Target difficulty level
};

/**
 * Result of AI correction analysis
 */
export type CorrectionResult = {
  hasErrors: boolean;
  correctedText: string;
  explanation: string;
  suggestions: string[];
};

/**
 * Options for speech synthesis
 */
export type SpeechOptions = {
  language: string;  // 'en-US', 'en-GB', etc.
  voice?: string;
  speed?: number;
};
