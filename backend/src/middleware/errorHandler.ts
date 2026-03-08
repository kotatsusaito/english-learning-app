import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * AI Service specific errors (Requirements 7.1, 7.2)
 */
export class AIServiceError extends AppError {
  constructor(message: string, public originalError?: Error) {
    super(503, message, true);
    this.name = 'AIServiceError';
  }
}

/**
 * Speech Synthesis specific errors (Requirement 7.3)
 */
export class SpeechServiceError extends AppError {
  constructor(message: string, public originalError?: Error) {
    super(503, message, true);
    this.name = 'SpeechServiceError';
  }
}

/**
 * Session related errors (Requirement 6.x)
 */
export class SessionError extends AppError {
  constructor(message: string, statusCode: number = 404) {
    super(statusCode, message, true);
    this.name = 'SessionError';
  }
}

/**
 * Input validation errors
 */
export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(400, message, true);
    this.name = 'ValidationError';
  }
}

/**
 * Global error handling middleware
 * Handles all errors thrown in the application
 * Implements Requirements 7.1, 7.2, 7.3, 7.4
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Default to 500 server error
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;
  let errorType = 'Error';

  // Check if it's our custom AppError or its subclasses
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
    errorType = err.name;
  } else if (err.message) {
    message = err.message;
  }

  // Log error details for debugging (Requirement 7.4)
  logger.error(
    'Error occurred during request processing',
    err,
    {
      type: errorType,
      statusCode,
      isOperational,
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
    }
  );

  // Send formatted error response to client
  res.status(statusCode).json({
    error: {
      type: errorType,
      message,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

/**
 * Middleware to handle 404 Not Found errors
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error = new AppError(404, `Route ${req.originalUrl} not found`);
  next(error);
}
