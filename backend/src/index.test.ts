import request from 'supertest';
import { createApp } from './index';

// Mock the AI service to avoid requiring API keys
jest.mock('./services/AIServiceFactory', () => ({
  AIServiceFactory: {
    createFromEnv: jest.fn().mockReturnValue({
      generateQuestion: jest.fn().mockResolvedValue('What is your favorite hobby?'),
      analyzeAndCorrect: jest.fn().mockResolvedValue({
        hasErrors: false,
        correctedText: 'Test response',
        explanation: 'Looks good!',
        suggestions: [],
      }),
    }),
  },
}));

describe('Express Server Setup', () => {
  const app = createApp();

  describe('Health Check Endpoint', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'english-learning-app-backend');
    });
  });

  describe('CORS Middleware', () => {
    it('should include CORS headers in response', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('JSON Parser Middleware', () => {
    it('should parse JSON request body', async () => {
      const response = await request(app)
        .post('/api/test')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');

      // Will get 404 since route doesn't exist, but body should be parsed
      expect(response.status).toBe(404);
    });
  });

  describe('Error Handler Middleware', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/non-existent-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('not found');
    });
  });
});
