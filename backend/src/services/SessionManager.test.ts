import { SessionManager } from './SessionManager';
import { UserResponse } from '@english-learning-app/shared';

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  describe('createSession', () => {
    it('should create a new session with unique ID', () => {
      const session = sessionManager.createSession();

      expect(session.id).toBeDefined();
      expect(typeof session.id).toBe('string');
      expect(session.startTime).toBeInstanceOf(Date);
      expect(session.conversationHistory).toEqual([]);
      expect(session.isActive).toBe(true);
    });

    it('should create sessions with different IDs', () => {
      const session1 = sessionManager.createSession();
      const session2 = sessionManager.createSession();

      expect(session1.id).not.toBe(session2.id);
    });

    it('should store the created session', () => {
      const session = sessionManager.createSession();
      const retrieved = sessionManager.getSession(session.id);

      expect(retrieved).toEqual(session);
    });
  });

  describe('getSession', () => {
    it('should return the session if it exists', () => {
      const session = sessionManager.createSession();
      const retrieved = sessionManager.getSession(session.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(session.id);
    });

    it('should return null for non-existent session ID', () => {
      const retrieved = sessionManager.getSession('non-existent-id');

      expect(retrieved).toBeNull();
    });
  });

  describe('endSession', () => {
    it('should mark session as inactive', () => {
      const session = sessionManager.createSession();
      expect(session.isActive).toBe(true);

      sessionManager.endSession(session.id);

      const retrieved = sessionManager.getSession(session.id);
      expect(retrieved?.isActive).toBe(false);
    });

    it('should not throw error for non-existent session', () => {
      expect(() => {
        sessionManager.endSession('non-existent-id');
      }).not.toThrow();
    });
  });

  describe('addQuestion', () => {
    it('should add a question to the conversation history', () => {
      const session = sessionManager.createSession();
      const question = 'What is your favorite hobby?';

      sessionManager.addQuestion(session.id, question);

      const retrieved = sessionManager.getSession(session.id);
      expect(retrieved?.conversationHistory).toHaveLength(1);
      expect(retrieved?.conversationHistory[0].question).toBe(question);
      expect(retrieved?.conversationHistory[0].userResponse).toBe('');
      expect(retrieved?.conversationHistory[0].correction).toBeNull();
      expect(retrieved?.conversationHistory[0].timestamp).toBeInstanceOf(Date);
    });

    it('should add multiple questions to the conversation history', () => {
      const session = sessionManager.createSession();
      const question1 = 'What is your name?';
      const question2 = 'Where are you from?';

      sessionManager.addQuestion(session.id, question1);
      sessionManager.addQuestion(session.id, question2);

      const retrieved = sessionManager.getSession(session.id);
      expect(retrieved?.conversationHistory).toHaveLength(2);
      expect(retrieved?.conversationHistory[0].question).toBe(question1);
      expect(retrieved?.conversationHistory[1].question).toBe(question2);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        sessionManager.addQuestion('non-existent-id', 'Test question');
      }).toThrow('Session not found: non-existent-id');
    });
  });

  describe('addResponse', () => {
    it('should add a response to the most recent conversation turn', () => {
      const session = sessionManager.createSession();
      const question = 'What is your favorite color?';
      const responseText = 'My favorite color is blue.';
      const submittedAt = new Date();

      sessionManager.addQuestion(session.id, question);

      const userResponse: UserResponse = {
        text: responseText,
        submittedAt,
      };

      sessionManager.addResponse(session.id, userResponse);

      const retrieved = sessionManager.getSession(session.id);
      expect(retrieved?.conversationHistory).toHaveLength(1);
      expect(retrieved?.conversationHistory[0].userResponse).toBe(responseText);
      expect(retrieved?.conversationHistory[0].timestamp).toBe(submittedAt);
    });

    it('should throw error for non-existent session', () => {
      const userResponse: UserResponse = {
        text: 'Test response',
        submittedAt: new Date(),
      };

      expect(() => {
        sessionManager.addResponse('non-existent-id', userResponse);
      }).toThrow('Session not found: non-existent-id');
    });

    it('should throw error when no question exists', () => {
      const session = sessionManager.createSession();
      const userResponse: UserResponse = {
        text: 'Test response',
        submittedAt: new Date(),
      };

      expect(() => {
        sessionManager.addResponse(session.id, userResponse);
      }).toThrow('No question exists to respond to');
    });

    it('should update the most recent turn when multiple questions exist', () => {
      const session = sessionManager.createSession();
      const question1 = 'First question?';
      const question2 = 'Second question?';
      const responseText = 'Response to second question';

      sessionManager.addQuestion(session.id, question1);
      sessionManager.addQuestion(session.id, question2);

      const userResponse: UserResponse = {
        text: responseText,
        submittedAt: new Date(),
      };

      sessionManager.addResponse(session.id, userResponse);

      const retrieved = sessionManager.getSession(session.id);
      expect(retrieved?.conversationHistory).toHaveLength(2);
      expect(retrieved?.conversationHistory[0].userResponse).toBe('');
      expect(retrieved?.conversationHistory[1].userResponse).toBe(responseText);
    });
  });

  describe('conversation flow', () => {
    it('should handle a complete conversation flow', () => {
      const session = sessionManager.createSession();

      // First turn
      sessionManager.addQuestion(session.id, 'What is your name?');
      sessionManager.addResponse(session.id, {
        text: 'My name is John.',
        submittedAt: new Date(),
      });

      // Second turn
      sessionManager.addQuestion(session.id, 'Where do you live?');
      sessionManager.addResponse(session.id, {
        text: 'I live in Tokyo.',
        submittedAt: new Date(),
      });

      const retrieved = sessionManager.getSession(session.id);
      expect(retrieved?.conversationHistory).toHaveLength(2);
      expect(retrieved?.conversationHistory[0].question).toBe('What is your name?');
      expect(retrieved?.conversationHistory[0].userResponse).toBe('My name is John.');
      expect(retrieved?.conversationHistory[1].question).toBe('Where do you live?');
      expect(retrieved?.conversationHistory[1].userResponse).toBe('I live in Tokyo.');
    });
  });
});
