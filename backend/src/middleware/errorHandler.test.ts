import express, { Express, Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { 
  errorHandler, 
  notFoundHandler, 
  AppError,
  AIServiceError,
  SpeechServiceError,
  SessionError,
  ValidationError
} from './errorHandler';

describe('Error Handler Middleware', () => {
  let app: Express;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Spy on console.error to verify logging
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('AppError class', () => {
    it('should create an operational error with correct properties', () => {
      const error = new AppError(400, 'Bad Request');
      
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad Request');
      expect(error.isOperational).toBe(true);
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });

    it('should create a non-operational error when specified', () => {
      const error = new AppError(500, 'Critical Error', false);
      
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Critical Error');
      expect(error.isOperational).toBe(false);
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError with correct status code and message', async () => {
      app.get('/test', (req, res, next) => {
        next(new AppError(400, 'Invalid input'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe('Invalid input');
      expect(response.body.error.statusCode).toBe(400);
    });

    it('should handle generic Error with 500 status code', async () => {
      app.get('/test', (req, res, next) => {
        next(new Error('Something went wrong'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(500);
      expect(response.body.error.message).toBe('Something went wrong');
      expect(response.body.error.statusCode).toBe(500);
    });

    it('should log error details for debugging (Requirement 7.4)', async () => {
      const testError = new AppError(404, 'Resource not found');
      
      app.get('/test', (req, res, next) => {
        next(testError);
      });
      app.use(errorHandler);

      await request(app).get('/test');

      // Verify error was logged in JSON format
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      
      expect(logOutput.level).toBe('ERROR');
      expect(logOutput.message).toBe('Error occurred during request processing');
      expect(logOutput.error.message).toBe('Resource not found');
      expect(logOutput.context.statusCode).toBe(404);
      expect(logOutput.context.path).toBe('/test');
      expect(logOutput.context.method).toBe('GET');
      expect(logOutput.timestamp).toBeDefined();
    });

    it('should include stack trace in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      app.get('/test', (req, res, next) => {
        next(new Error('Dev error'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.body.error.stack).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      app.get('/test', (req, res, next) => {
        next(new Error('Prod error'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.body.error.stack).toBeUndefined();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle AI service errors (Requirement 7.1)', async () => {
      app.post('/test/question', (req, res, next) => {
        next(new AppError(503, 'AI service unavailable. Please try again.'));
      });
      app.use(errorHandler);

      const response = await request(app).post('/test/question');

      expect(response.status).toBe(503);
      expect(response.body.error.message).toBe('AI service unavailable. Please try again.');
    });

    it('should handle speech synthesis errors gracefully (Requirement 7.3)', async () => {
      app.post('/test/speech', (req, res, next) => {
        next(new AppError(503, 'Speech synthesis unavailable'));
      });
      app.use(errorHandler);

      const response = await request(app).post('/test/speech');

      expect(response.status).toBe(503);
      expect(response.body.error.message).toBe('Speech synthesis unavailable');
    });

    it('should handle errors without message', async () => {
      app.get('/test', (req, res, next) => {
        const error = new Error();
        error.message = '';
        next(error);
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(500);
      expect(response.body.error.message).toBe('Internal Server Error');
    });
  });

  describe('notFoundHandler', () => {
    it('should handle 404 errors for non-existent routes', async () => {
      app.use(notFoundHandler);
      app.use(errorHandler);

      const response = await request(app).get('/non-existent-route');

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe('Route /non-existent-route not found');
      expect(response.body.error.statusCode).toBe(404);
    });

    it('should log 404 errors (Requirement 7.4)', async () => {
      app.use(notFoundHandler);
      app.use(errorHandler);

      await request(app).get('/missing');

      // Verify error was logged in JSON format
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      
      expect(logOutput.level).toBe('ERROR');
      expect(logOutput.error.message).toBe('Route /missing not found');
      expect(logOutput.context.statusCode).toBe(404);
    });
  });

  describe('Error message formatting', () => {
    it('should format error response with consistent structure', async () => {
      app.get('/test', (req, res, next) => {
        next(new AppError(422, 'Validation failed'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test');

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('statusCode');
      expect(response.body.error).toHaveProperty('type');
      expect(typeof response.body.error.message).toBe('string');
      expect(typeof response.body.error.statusCode).toBe('number');
    });

    it('should handle multiple error types with consistent format', async () => {
      const errors = [
        { code: 400, msg: 'Bad Request' },
        { code: 401, msg: 'Unauthorized' },
        { code: 403, msg: 'Forbidden' },
        { code: 500, msg: 'Internal Server Error' },
      ];

      for (const err of errors) {
        const testApp = express();
        testApp.get('/test', (req, res, next) => {
          next(new AppError(err.code, err.msg));
        });
        testApp.use(errorHandler);

        const response = await request(testApp).get('/test');

        expect(response.status).toBe(err.code);
        expect(response.body.error.message).toBe(err.msg);
        expect(response.body.error.statusCode).toBe(err.code);
      }
    });
  });

  describe('Specific Error Types', () => {
    it('should handle AIServiceError (Requirement 7.1, 7.2)', async () => {
      app.post('/test/ai', (req, res, next) => {
        next(new AIServiceError('Failed to generate question'));
      });
      app.use(errorHandler);

      const response = await request(app).post('/test/ai');

      expect(response.status).toBe(503);
      expect(response.body.error.type).toBe('AIServiceError');
      expect(response.body.error.message).toBe('Failed to generate question');
    });

    it('should handle SpeechServiceError (Requirement 7.3)', async () => {
      app.post('/test/speech', (req, res, next) => {
        next(new SpeechServiceError('Speech synthesis unavailable'));
      });
      app.use(errorHandler);

      const response = await request(app).post('/test/speech');

      expect(response.status).toBe(503);
      expect(response.body.error.type).toBe('SpeechServiceError');
      expect(response.body.error.message).toBe('Speech synthesis unavailable');
    });

    it('should handle SessionError', async () => {
      app.get('/test/session', (req, res, next) => {
        next(new SessionError('Session not found'));
      });
      app.use(errorHandler);

      const response = await request(app).get('/test/session');

      expect(response.status).toBe(404);
      expect(response.body.error.type).toBe('SessionError');
      expect(response.body.error.message).toBe('Session not found');
    });

    it('should handle ValidationError', async () => {
      app.post('/test/validate', (req, res, next) => {
        next(new ValidationError('Invalid input', 'email'));
      });
      app.use(errorHandler);

      const response = await request(app).post('/test/validate');

      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe('ValidationError');
      expect(response.body.error.message).toBe('Invalid input');
    });

    it('should log error type in error details (Requirement 7.4)', async () => {
      app.post('/test', (req, res, next) => {
        next(new AIServiceError('AI timeout'));
      });
      app.use(errorHandler);

      await request(app).post('/test');

      // Verify error was logged in JSON format
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      
      expect(logOutput.level).toBe('ERROR');
      expect(logOutput.error.name).toBe('AIServiceError');
      expect(logOutput.error.message).toBe('AI timeout');
      expect(logOutput.context.type).toBe('AIServiceError');
      expect(logOutput.context.statusCode).toBe(503);
    });
  });
});
