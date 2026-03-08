import request from 'supertest';
import express, { Express } from 'express';
import { SessionManager } from '../services/SessionManager';
import { AIServiceAdapter } from '../services/AIServiceAdapter';
import { ConversationContext, CorrectionResult } from '@english-learning-app/shared';
import { createSessionRouter } from './sessions';
import { errorHandler } from '../middleware';

/**
 * Mock AI Service for testing
 */
class MockAIService implements AIServiceAdapter {
  async generateQuestion(context: ConversationContext): Promise<string> {
    return 'What is your favorite hobby?';
  }

  async analyzeAndCorrect(response: string, question: string): Promise<CorrectionResult> {
    // Simple mock: if response contains "goed", it has errors
    const hasErrors = response.includes('goed');
    
    return {
      hasErrors,
      correctedText: hasErrors ? response.replace('goed', 'went') : response,
      explanation: hasErrors 
        ? 'The past tense of "go" is "went", not "goed".' 
        : 'Your response is grammatically correct!',
      suggestions: hasErrors 
        ? ['Use "went" instead of "goed"'] 
        : [],
    };
  }
}

/**
 * Test suite for session management endpoints
 */
describe('Session Routes', () => {
  let app: Express;
  let sessionManager: SessionManager;
  let aiService: AIServiceAdapter;

  beforeEach(() => {
    // Create fresh instances for each test
    sessionManager = new SessionManager();
    aiService = new MockAIService();
    app = express();
    app.use(express.json());
    app.use('/api/sessions', createSessionRouter(sessionManager, aiService));
    app.use(errorHandler);
  });

  describe('POST /api/sessions', () => {
    it('should create a new session', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('startTime');
      expect(response.body.data.conversationHistory).toEqual([]);
      expect(response.body.data.isActive).toBe(true);
    });

    it('should create unique session IDs', async () => {
      const response1 = await request(app)
        .post('/api/sessions')
        .expect(201);

      const response2 = await request(app)
        .post('/api/sessions')
        .expect(201);

      expect(response1.body.data.id).not.toBe(response2.body.data.id);
    });
  });

  describe('GET /api/sessions/:id', () => {
    it('should retrieve an existing session', async () => {
      // Create a session first
      const createResponse = await request(app)
        .post('/api/sessions')
        .expect(201);

      const sessionId = createResponse.body.data.id;

      // Retrieve the session
      const getResponse = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.id).toBe(sessionId);
      expect(getResponse.body.data.isActive).toBe(true);
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .get('/api/sessions/non-existent-id')
        .expect(404);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('SessionError');
      expect(response.body.error.message).toContain('not found');
      expect(response.body.error.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/sessions/:id', () => {
    it('should end an active session', async () => {
      // Create a session first
      const createResponse = await request(app)
        .post('/api/sessions')
        .expect(201);

      const sessionId = createResponse.body.data.id;

      // End the session
      const deleteResponse = await request(app)
        .delete(`/api/sessions/${sessionId}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
      expect(deleteResponse.body.data.isActive).toBe(false);

      // Verify session is no longer active
      const getResponse = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .expect(200);

      expect(getResponse.body.data.isActive).toBe(false);
    });

    it('should return 404 when ending non-existent session', async () => {
      const response = await request(app)
        .delete('/api/sessions/non-existent-id')
        .expect(404);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('SessionError');
      expect(response.body.error.message).toContain('not found');
      expect(response.body.error.statusCode).toBe(404);
    });
  });

  describe('Session lifecycle', () => {
    it('should support complete session lifecycle', async () => {
      // 1. Create session
      const createResponse = await request(app)
        .post('/api/sessions')
        .expect(201);

      const sessionId = createResponse.body.data.id;
      expect(createResponse.body.data.isActive).toBe(true);

      // 2. Retrieve session
      const getResponse = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .expect(200);

      expect(getResponse.body.data.id).toBe(sessionId);
      expect(getResponse.body.data.isActive).toBe(true);

      // 3. End session
      const deleteResponse = await request(app)
        .delete(`/api/sessions/${sessionId}`)
        .expect(200);

      expect(deleteResponse.body.data.isActive).toBe(false);

      // 4. Verify session is ended
      const finalGetResponse = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .expect(200);

      expect(finalGetResponse.body.data.isActive).toBe(false);
    });
  });

  describe('POST /api/sessions/:id/question', () => {
    it('should generate a question for an active session', async () => {
      // Create a session first
      const createResponse = await request(app)
        .post('/api/sessions')
        .expect(201);

      const sessionId = createResponse.body.data.id;

      // Generate a question
      const questionResponse = await request(app)
        .post(`/api/sessions/${sessionId}/question`)
        .expect(200);

      expect(questionResponse.body.success).toBe(true);
      expect(questionResponse.body.data.question).toBe('What is your favorite hobby?');
      expect(questionResponse.body.data.sessionId).toBe(sessionId);
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .post('/api/sessions/non-existent-id/question')
        .expect(404);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('SessionError');
      expect(response.body.error.message).toContain('not found');
      expect(response.body.error.statusCode).toBe(404);
    });

    it('should return 400 for inactive session', async () => {
      // Create and end a session
      const createResponse = await request(app)
        .post('/api/sessions')
        .expect(201);

      const sessionId = createResponse.body.data.id;

      await request(app)
        .delete(`/api/sessions/${sessionId}`)
        .expect(200);

      // Try to generate question for inactive session
      const response = await request(app)
        .post(`/api/sessions/${sessionId}/question`)
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('SessionError');
      expect(response.body.error.message).toContain('inactive');
      expect(response.body.error.statusCode).toBe(400);
    });

    it('should add question to conversation history', async () => {
      // Create a session
      const createResponse = await request(app)
        .post('/api/sessions')
        .expect(201);

      const sessionId = createResponse.body.data.id;

      // Generate a question
      await request(app)
        .post(`/api/sessions/${sessionId}/question`)
        .expect(200);

      // Verify question was added to history
      const getResponse = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .expect(200);

      expect(getResponse.body.data.conversationHistory).toHaveLength(1);
      expect(getResponse.body.data.conversationHistory[0].question).toBe('What is your favorite hobby?');
    });
  });

  describe('POST /api/sessions/:id/response', () => {
    it('should submit response and get correction', async () => {
      // Create a session and generate a question
      const createResponse = await request(app)
        .post('/api/sessions')
        .expect(201);

      const sessionId = createResponse.body.data.id;

      await request(app)
        .post(`/api/sessions/${sessionId}/question`)
        .expect(200);

      // Submit a response
      const responseText = 'I like reading books.';
      const submitResponse = await request(app)
        .post(`/api/sessions/${sessionId}/response`)
        .send({ text: responseText })
        .expect(200);

      expect(submitResponse.body.success).toBe(true);
      expect(submitResponse.body.data.originalText).toBe(responseText);
      expect(submitResponse.body.data.correction).toBeDefined();
      expect(submitResponse.body.data.correction.hasErrors).toBe(false);
      expect(submitResponse.body.data.sessionId).toBe(sessionId);
    });

    it('should detect and correct grammatical errors', async () => {
      // Create a session and generate a question
      const createResponse = await request(app)
        .post('/api/sessions')
        .expect(201);

      const sessionId = createResponse.body.data.id;

      await request(app)
        .post(`/api/sessions/${sessionId}/question`)
        .expect(200);

      // Submit a response with error
      const responseText = 'I goed to the store.';
      const submitResponse = await request(app)
        .post(`/api/sessions/${sessionId}/response`)
        .send({ text: responseText })
        .expect(200);

      expect(submitResponse.body.success).toBe(true);
      expect(submitResponse.body.data.correction.hasErrors).toBe(true);
      expect(submitResponse.body.data.correction.correctedText).toBe('I went to the store.');
      expect(submitResponse.body.data.correction.explanation).toContain('went');
    });

    it('should return 400 if text is missing', async () => {
      // Create a session and generate a question
      const createResponse = await request(app)
        .post('/api/sessions')
        .expect(201);

      const sessionId = createResponse.body.data.id;

      await request(app)
        .post(`/api/sessions/${sessionId}/question`)
        .expect(200);

      // Submit without text
      const response = await request(app)
        .post(`/api/sessions/${sessionId}/response`)
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('ValidationError');
      expect(response.body.error.message).toContain('text');
      expect(response.body.error.statusCode).toBe(400);
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .post('/api/sessions/non-existent-id/response')
        .send({ text: 'Hello' })
        .expect(404);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('SessionError');
      expect(response.body.error.message).toContain('not found');
      expect(response.body.error.statusCode).toBe(404);
    });

    it('should return 400 for inactive session', async () => {
      // Create, generate question, and end session
      const createResponse = await request(app)
        .post('/api/sessions')
        .expect(201);

      const sessionId = createResponse.body.data.id;

      await request(app)
        .post(`/api/sessions/${sessionId}/question`)
        .expect(200);

      await request(app)
        .delete(`/api/sessions/${sessionId}`)
        .expect(200);

      // Try to submit response for inactive session
      const response = await request(app)
        .post(`/api/sessions/${sessionId}/response`)
        .send({ text: 'Hello' })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('SessionError');
      expect(response.body.error.message).toContain('inactive');
      expect(response.body.error.statusCode).toBe(400);
    });

    it('should return 400 if no question exists', async () => {
      // Create a session without generating a question
      const createResponse = await request(app)
        .post('/api/sessions')
        .expect(201);

      const sessionId = createResponse.body.data.id;

      // Try to submit response without question
      const response = await request(app)
        .post(`/api/sessions/${sessionId}/response`)
        .send({ text: 'Hello' })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('ValidationError');
      expect(response.body.error.message).toContain('question');
      expect(response.body.error.statusCode).toBe(400);
    });

    it('should return 400 if response already submitted', async () => {
      // Create a session and generate a question
      const createResponse = await request(app)
        .post('/api/sessions')
        .expect(201);

      const sessionId = createResponse.body.data.id;

      await request(app)
        .post(`/api/sessions/${sessionId}/question`)
        .expect(200);

      // Submit first response
      await request(app)
        .post(`/api/sessions/${sessionId}/response`)
        .send({ text: 'First response' })
        .expect(200);

      // Try to submit second response to same question
      const response = await request(app)
        .post(`/api/sessions/${sessionId}/response`)
        .send({ text: 'Second response' })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('ValidationError');
      expect(response.body.error.message).toContain('already submitted');
      expect(response.body.error.statusCode).toBe(400);
    });

    it('should update conversation history with response and correction', async () => {
      // Create a session and generate a question
      const createResponse = await request(app)
        .post('/api/sessions')
        .expect(201);

      const sessionId = createResponse.body.data.id;

      await request(app)
        .post(`/api/sessions/${sessionId}/question`)
        .expect(200);

      // Submit a response
      const responseText = 'I like swimming.';
      await request(app)
        .post(`/api/sessions/${sessionId}/response`)
        .send({ text: responseText })
        .expect(200);

      // Verify conversation history was updated
      const getResponse = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .expect(200);

      expect(getResponse.body.data.conversationHistory).toHaveLength(1);
      expect(getResponse.body.data.conversationHistory[0].userResponse).toBe(responseText);
      expect(getResponse.body.data.conversationHistory[0].correction).toBeDefined();
    });
  });

  describe('Complete conversation flow', () => {
    it('should support multiple question-response cycles', async () => {
      // Create a session
      const createResponse = await request(app)
        .post('/api/sessions')
        .expect(201);

      const sessionId = createResponse.body.data.id;

      // First cycle
      await request(app)
        .post(`/api/sessions/${sessionId}/question`)
        .expect(200);

      await request(app)
        .post(`/api/sessions/${sessionId}/response`)
        .send({ text: 'I like reading.' })
        .expect(200);

      // Second cycle
      await request(app)
        .post(`/api/sessions/${sessionId}/question`)
        .expect(200);

      await request(app)
        .post(`/api/sessions/${sessionId}/response`)
        .send({ text: 'I goed to the park.' })
        .expect(200);

      // Verify conversation history
      const getResponse = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .expect(200);

      expect(getResponse.body.data.conversationHistory).toHaveLength(2);
      expect(getResponse.body.data.conversationHistory[0].userResponse).toBe('I like reading.');
      expect(getResponse.body.data.conversationHistory[1].userResponse).toBe('I goed to the park.');
      expect(getResponse.body.data.conversationHistory[1].correction.hasErrors).toBe(true);
    });
  });
});

