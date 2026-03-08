import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler, requestLogger } from './middleware';
import { SessionManager } from './services/SessionManager';
import { AIServiceFactory } from './services/AIServiceFactory';
import { SpeechServiceFactory } from './services/SpeechServiceFactory';
import { createSessionRouter, createSpeechRouter } from './routes';

// Load environment variables
dotenv.config();

/**
 * Create and configure Express application
 */
function createApp(): Express {
  const app = express();

  // Initialize services
  const sessionManager = new SessionManager();
  const aiService = AIServiceFactory.createFromEnv();
  const speechService = SpeechServiceFactory.createFromEnv();

  // Middleware: Request logging
  app.use(requestLogger);

  // Middleware: CORS configuration
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // Default Vite dev server
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Middleware: JSON body parser
  app.use(express.json({ limit: '10mb' }));

  // Middleware: URL-encoded body parser
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'english-learning-app-backend',
    });
  });

  // API routes
  app.use('/api/sessions', createSessionRouter(sessionManager, aiService));
  app.use('/api/speech', createSpeechRouter(speechService));

  // Middleware: 404 handler (must be after all routes)
  app.use(notFoundHandler);

  // Middleware: Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
function startServer(): void {
  const app = createApp();
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('English Learning App - Backend Server');
    console.log('='.repeat(50));
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`AI Service: ${process.env.AI_SERVICE || 'not configured'}`);
    console.log('='.repeat(50));
  });
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

// Export for testing
export { createApp, startServer };

