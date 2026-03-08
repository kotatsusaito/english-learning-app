import express, { Express } from 'express';
import request from 'supertest';
import { requestLogger } from './requestLogger';

describe('Request Logger Middleware', () => {
  let app: Express;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(requestLogger);
    
    // Spy on console.log to verify logging
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('Request Logging', () => {
    it('should log incoming GET requests', async () => {
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      await request(app).get('/test');

      // Should log request
      expect(consoleLogSpy).toHaveBeenCalled();
      const requestLog = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      
      expect(requestLog.level).toBe('INFO');
      expect(requestLog.message).toContain('GET /test');
      expect(requestLog.request.method).toBe('GET');
      expect(requestLog.request.path).toBe('/test');
      expect(requestLog.timestamp).toBeDefined();
    });

    it('should log incoming POST requests with body', async () => {
      app.post('/test', (req, res) => {
        res.json({ success: true });
      });

      await request(app)
        .post('/test')
        .send({ data: 'test' });

      // Should log request
      expect(consoleLogSpy).toHaveBeenCalled();
      const requestLog = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      
      expect(requestLog.level).toBe('INFO');
      expect(requestLog.message).toContain('POST /test');
      expect(requestLog.request.method).toBe('POST');
      expect(requestLog.request.path).toBe('/test');
      expect(requestLog.request.body).toEqual({ data: 'test' });
    });

    it('should log requests with query parameters', async () => {
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      await request(app).get('/test?page=1&limit=10');

      // Should log request
      expect(consoleLogSpy).toHaveBeenCalled();
      const requestLog = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      
      expect(requestLog.request.query).toEqual({ page: '1', limit: '10' });
    });
  });

  describe('Response Logging', () => {
    it('should log successful responses with status code and duration', async () => {
      app.get('/test', (req, res) => {
        res.status(200).json({ success: true });
      });

      await request(app).get('/test');

      // Should log both request and response
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      
      const responseLog = JSON.parse(consoleLogSpy.mock.calls[1][0]);
      expect(responseLog.level).toBe('INFO');
      expect(responseLog.message).toContain('GET /test - 200');
      expect(responseLog.response.statusCode).toBe(200);
      expect(responseLog.response.duration).toBeGreaterThanOrEqual(0);
      expect(typeof responseLog.response.duration).toBe('number');
    });

    it('should log error responses', async () => {
      app.get('/test', (req, res) => {
        res.status(500).json({ error: 'Internal error' });
      });

      await request(app).get('/test');

      // Should log both request and response
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      
      const responseLog = JSON.parse(consoleLogSpy.mock.calls[1][0]);
      expect(responseLog.response.statusCode).toBe(500);
    });

    it('should log 404 responses', async () => {
      // No route defined, should return 404
      await request(app).get('/nonexistent');

      // Should log both request and response
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      
      const responseLog = JSON.parse(consoleLogSpy.mock.calls[1][0]);
      expect(responseLog.response.statusCode).toBe(404);
    });

    it('should measure response duration accurately', async () => {
      app.get('/test', async (req, res) => {
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 10));
        res.json({ success: true });
      });

      await request(app).get('/test');

      const responseLog = JSON.parse(consoleLogSpy.mock.calls[1][0]);
      expect(responseLog.response.duration).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Header Sanitization', () => {
    it('should sanitize sensitive headers in logs', async () => {
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      await request(app)
        .get('/test')
        .set('Authorization', 'Bearer secret-token')
        .set('Cookie', 'session=abc123');

      const requestLog = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      
      // Sensitive headers should be redacted
      expect(requestLog.request.headers.authorization).toBe('[REDACTED]');
      expect(requestLog.request.headers.cookie).toBe('[REDACTED]');
    });

    it('should preserve non-sensitive headers', async () => {
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      await request(app)
        .get('/test')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json');

      const requestLog = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      
      // Non-sensitive headers should be preserved
      expect(requestLog.request.headers['content-type']).toBe('application/json');
      expect(requestLog.request.headers.accept).toBe('application/json');
    });
  });

  describe('Large Body Handling', () => {
    it('should truncate large request bodies', async () => {
      app.post('/test', (req, res) => {
        res.json({ success: true });
      });

      // Create a large body (> 1000 characters)
      const largeBody = { data: 'x'.repeat(2000) };

      await request(app)
        .post('/test')
        .send(largeBody);

      const requestLog = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      
      // Large body should be truncated
      expect(requestLog.request.body).toBe('[BODY TOO LARGE]');
    });

    it('should log small request bodies normally', async () => {
      app.post('/test', (req, res) => {
        res.json({ success: true });
      });

      const smallBody = { data: 'test' };

      await request(app)
        .post('/test')
        .send(smallBody);

      const requestLog = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      
      // Small body should be logged normally
      expect(requestLog.request.body).toEqual(smallBody);
    });
  });

  describe('Multiple Requests', () => {
    it('should log each request independently', async () => {
      app.get('/test1', (req, res) => res.json({ route: 1 }));
      app.get('/test2', (req, res) => res.json({ route: 2 }));

      await request(app).get('/test1');
      await request(app).get('/test2');

      // Should have 4 log calls (2 requests + 2 responses)
      expect(consoleLogSpy).toHaveBeenCalledTimes(4);

      const request1Log = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      const request2Log = JSON.parse(consoleLogSpy.mock.calls[2][0]);

      expect(request1Log.request.path).toBe('/test1');
      expect(request2Log.request.path).toBe('/test2');
    });
  });

  describe('JSON Format', () => {
    it('should output valid JSON for all logs', async () => {
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      await request(app).get('/test');

      // All log outputs should be valid JSON
      consoleLogSpy.mock.calls.forEach(call => {
        expect(() => JSON.parse(call[0])).not.toThrow();
      });
    });
  });
});
