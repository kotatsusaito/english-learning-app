/**
 * Logging utility for structured logging
 * Implements Requirement 7.4: Error logging and request/response logging
 */

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

export interface ErrorLogEntry extends LogEntry {
  level: LogLevel.ERROR;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  request?: {
    method: string;
    path: string;
    body?: any;
    query?: any;
  };
}

export interface RequestLogEntry extends LogEntry {
  level: LogLevel.INFO;
  request: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: any;
    query?: any;
  };
}

export interface ResponseLogEntry extends LogEntry {
  level: LogLevel.INFO;
  response: {
    statusCode: number;
    duration: number;
  };
  request: {
    method: string;
    path: string;
  };
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private static instance: Logger;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log an error with context
   * Requirement 7.4: Error logging
   */
  error(message: string, error: Error, context?: Record<string, any>): void {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
    };

    this.write(logEntry);
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: Record<string, any>): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      context,
    };

    this.write(logEntry);
  }

  /**
   * Log an informational message
   */
  info(message: string, context?: Record<string, any>): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context,
    };

    this.write(logEntry);
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: LogLevel.DEBUG,
        message,
        context,
      };

      this.write(logEntry);
    }
  }

  /**
   * Log an HTTP request
   * Requirement 7.4: Request logging
   */
  logRequest(
    method: string,
    path: string,
    headers?: Record<string, string>,
    body?: any,
    query?: any
  ): void {
    const logEntry: RequestLogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message: `Incoming request: ${method} ${path}`,
      request: {
        method,
        path,
        headers: this.sanitizeHeaders(headers),
        body: this.sanitizeBody(body),
        query,
      },
    };

    this.write(logEntry);
  }

  /**
   * Log an HTTP response
   * Requirement 7.4: Response logging
   */
  logResponse(
    method: string,
    path: string,
    statusCode: number,
    duration: number
  ): void {
    const logEntry: ResponseLogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message: `Response sent: ${method} ${path} - ${statusCode} (${duration}ms)`,
      response: {
        statusCode,
        duration,
      },
      request: {
        method,
        path,
      },
    };

    this.write(logEntry);
  }

  /**
   * Write log entry to output
   * In production, this could write to a file, external logging service, etc.
   */
  private write(logEntry: LogEntry): void {
    const output = JSON.stringify(logEntry);

    switch (logEntry.level) {
      case LogLevel.ERROR:
        console.error(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.INFO:
      case LogLevel.DEBUG:
        console.log(output);
        break;
    }
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(
    headers?: Record<string, string>
  ): Record<string, string> | undefined {
    if (!headers) return undefined;

    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    for (const key of sensitiveHeaders) {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize request body to remove sensitive information
   */
  private sanitizeBody(body?: any): any {
    if (!body) return undefined;

    // Don't log large bodies
    const bodyStr = JSON.stringify(body);
    if (bodyStr.length > 1000) {
      return '[BODY TOO LARGE]';
    }

    return body;
  }
}

/**
 * Export singleton instance
 */
export const logger = Logger.getInstance();
