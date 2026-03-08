import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request logging middleware
 * Logs all incoming requests and responses for debugging and monitoring
 * Implements Requirement 7.4: Request/Response logging
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  // Log incoming request
  logger.logRequest(
    req.method,
    req.path,
    req.headers as Record<string, string>,
    req.body,
    req.query
  );

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.logResponse(req.method, req.path, res.statusCode, duration);
  });

  next();
}
