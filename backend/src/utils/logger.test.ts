import { Logger, LogLevel, logger } from './logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should export a singleton instance', () => {
      expect(logger).toBe(Logger.getInstance());
    });
  });

  describe('Error Logging', () => {
    it('should log error with message and error object', () => {
      const testError = new Error('Test error');
      logger.error('Error occurred', testError);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

      expect(logOutput.level).toBe(LogLevel.ERROR);
      expect(logOutput.message).toBe('Error occurred');
      expect(logOutput.error.name).toBe('Error');
      expect(logOutput.error.message).toBe('Test error');
      expect(logOutput.error.stack).toBeDefined();
      expect(logOutput.timestamp).toBeDefined();
    });

    it('should log error with additional context', () => {
      const testError = new Error('Test error');
      const context = { userId: '123', action: 'test' };
      logger.error('Error with context', testError, context);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

      expect(logOutput.context).toEqual(context);
    });
  });

  describe('Warning Logging', () => {
    it('should log warning message', () => {
      logger.warn('Warning message');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleWarnSpy.mock.calls[0][0]);

      expect(logOutput.level).toBe(LogLevel.WARN);
      expect(logOutput.message).toBe('Warning message');
      expect(logOutput.timestamp).toBeDefined();
    });

    it('should log warning with context', () => {
      const context = { reason: 'test' };
      logger.warn('Warning with context', context);

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleWarnSpy.mock.calls[0][0]);

      expect(logOutput.context).toEqual(context);
    });
  });

  describe('Info Logging', () => {
    it('should log info message', () => {
      logger.info('Info message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput.level).toBe(LogLevel.INFO);
      expect(logOutput.message).toBe('Info message');
      expect(logOutput.timestamp).toBeDefined();
    });

    it('should log info with context', () => {
      const context = { data: 'test' };
      logger.info('Info with context', context);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput.context).toEqual(context);
    });
  });

  describe('Debug Logging', () => {
    it('should log debug message in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      logger.debug('Debug message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput.level).toBe(LogLevel.DEBUG);
      expect(logOutput.message).toBe('Debug message');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not log debug message in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      logger.debug('Debug message');

      expect(consoleLogSpy).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Request Logging', () => {
    it('should log HTTP request with all details', () => {
      const headers = { 'content-type': 'application/json' };
      const body = { test: 'data' };
      const query = { page: '1' };

      logger.logRequest('POST', '/api/test', headers, body, query);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput.level).toBe(LogLevel.INFO);
      expect(logOutput.message).toContain('POST /api/test');
      expect(logOutput.request.method).toBe('POST');
      expect(logOutput.request.path).toBe('/api/test');
      expect(logOutput.request.headers).toEqual(headers);
      expect(logOutput.request.body).toEqual(body);
      expect(logOutput.request.query).toEqual(query);
    });

    it('should sanitize sensitive headers', () => {
      const headers = {
        'content-type': 'application/json',
        authorization: 'Bearer secret-token',
        cookie: 'session=abc123',
      };

      logger.logRequest('GET', '/api/test', headers);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput.request.headers.authorization).toBe('[REDACTED]');
      expect(logOutput.request.headers.cookie).toBe('[REDACTED]');
      expect(logOutput.request.headers['content-type']).toBe(
        'application/json'
      );
    });

    it('should truncate large request bodies', () => {
      const largeBody = { data: 'x'.repeat(2000) };

      logger.logRequest('POST', '/api/test', undefined, largeBody);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput.request.body).toBe('[BODY TOO LARGE]');
    });
  });

  describe('Response Logging', () => {
    it('should log HTTP response with status and duration', () => {
      logger.logResponse('GET', '/api/test', 200, 150);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput.level).toBe(LogLevel.INFO);
      expect(logOutput.message).toContain('GET /api/test - 200 (150ms)');
      expect(logOutput.response.statusCode).toBe(200);
      expect(logOutput.response.duration).toBe(150);
      expect(logOutput.request.method).toBe('GET');
      expect(logOutput.request.path).toBe('/api/test');
    });

    it('should log error responses', () => {
      logger.logResponse('POST', '/api/test', 500, 250);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput.response.statusCode).toBe(500);
      expect(logOutput.response.duration).toBe(250);
    });
  });

  describe('Timestamp Format', () => {
    it('should use ISO 8601 format for timestamps', () => {
      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(logOutput.timestamp).toMatch(isoRegex);
    });
  });

  describe('JSON Output Format', () => {
    it('should output valid JSON', () => {
      logger.info('Test message', { key: 'value' });

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const output = consoleLogSpy.mock.calls[0][0];

      // Should not throw when parsing
      expect(() => JSON.parse(output)).not.toThrow();
    });
  });
});
