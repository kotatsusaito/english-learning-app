import { Session, ConversationTurn, UserResponse, CEFRLevel } from '@english-learning-app/shared';
import { randomUUID } from 'crypto';

/**
 * SessionManager manages learning session lifecycle and conversation history
 * Implements in-memory storage for sessions
 */
export class SessionManager {
  private sessions: Map<string, Session>;

  constructor() {
    this.sessions = new Map();
  }

  /**
   * Creates a new learning session
   * @param cefrLevel - Optional CEFR level for the session
   * @returns The newly created session
   */
  createSession(cefrLevel?: CEFRLevel): Session {
    const session: Session = {
      id: randomUUID(),
      startTime: new Date(),
      conversationHistory: [],
      isActive: true,
      cefrLevel,
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Updates the CEFR level for a session
   * @param sessionId - The ID of the session
   * @param cefrLevel - The new CEFR level
   */
  updateCEFRLevel(sessionId: string, cefrLevel: CEFRLevel): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    session.cefrLevel = cefrLevel;
  }

  /**
   * Retrieves a session by ID
   * @param sessionId - The ID of the session to retrieve
   * @returns The session if found, null otherwise
   */
  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    return session || null;
  }

  /**
   * Ends an active session
   * @param sessionId - The ID of the session to end
   */
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
    }
  }

  /**
   * Adds a question to a session's conversation history
   * @param sessionId - The ID of the session
   * @param question - The question text to add
   */
  addQuestion(sessionId: string, question: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const turn: ConversationTurn = {
      question,
      userResponse: '',
      correction: null,
      timestamp: new Date(),
    };

    session.conversationHistory.push(turn);
  }

  /**
   * Adds a user response to the most recent conversation turn
   * @param sessionId - The ID of the session
   * @param response - The user's response
   */
  addResponse(sessionId: string, response: UserResponse): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.conversationHistory.length === 0) {
      throw new Error('No question exists to respond to');
    }

    const lastTurn = session.conversationHistory[session.conversationHistory.length - 1];
    lastTurn.userResponse = response.text;
    lastTurn.timestamp = response.submittedAt;
  }
}
