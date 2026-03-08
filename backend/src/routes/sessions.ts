import { Router, Request, Response, NextFunction } from 'express';
import { SessionManager } from '../services/SessionManager';
import { AIServiceAdapter } from '../services/AIServiceAdapter';
import { ConversationContext, UserResponse, Correction, CEFRLevel } from '@english-learning-app/shared';
import { SessionError, ValidationError, AIServiceError } from '../middleware';

/**
 * Session management routes
 * Handles session creation, retrieval, and termination
 */
export function createSessionRouter(
  sessionManager: SessionManager,
  aiService: AIServiceAdapter
): Router {
  const router = Router();

  /**
   * POST /api/sessions
   * Create a new learning session
   */
  router.post('/', (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cefrLevel } = req.body;
      
      // Validate CEFR level if provided
      const validLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      if (cefrLevel && !validLevels.includes(cefrLevel)) {
        throw new ValidationError(`Invalid CEFR level: ${cefrLevel}`);
      }
      
      const session = sessionManager.createSession(cefrLevel);
      
      res.status(201).json({
        success: true,
        data: {
          id: session.id,
          startTime: session.startTime,
          conversationHistory: session.conversationHistory,
          isActive: session.isActive,
          cefrLevel: session.cefrLevel,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/sessions/:id
   * Retrieve a session by ID
   */
  router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const session = sessionManager.getSession(id);

      if (!session) {
        throw new SessionError(`Session not found: ${id}`);
      }

      res.status(200).json({
        success: true,
        data: {
          id: session.id,
          startTime: session.startTime,
          conversationHistory: session.conversationHistory,
          isActive: session.isActive,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE /api/sessions/:id
   * End an active session
   */
  router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const session = sessionManager.getSession(id);

      if (!session) {
        throw new SessionError(`Session not found: ${id}`);
      }

      sessionManager.endSession(id);

      res.status(200).json({
        success: true,
        message: 'Session ended successfully',
        data: {
          id: session.id,
          isActive: false,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/sessions/:id/question
   * Generate a new question for the session
   */
  router.post('/:id/question', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const session = sessionManager.getSession(id);

      if (!session) {
        throw new SessionError(`Session not found: ${id}`);
      }

      if (!session.isActive) {
        throw new SessionError('Cannot generate question for inactive session', 400);
      }

      // Build conversation context
      const context: ConversationContext = {
        sessionId: id,
        previousTurns: session.conversationHistory,
        cefrLevel: session.cefrLevel,
      };

      // Generate question using AI service (Requirement 7.1)
      try {
        const question = await aiService.generateQuestion(context);

        // Add question to session
        sessionManager.addQuestion(id, question);

        res.status(200).json({
          success: true,
          data: {
            question,
            sessionId: id,
          },
        });
      } catch (aiError) {
        throw new AIServiceError('Failed to generate question. Please try again.', aiError as Error);
      }
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/sessions/:id/response
   * Submit user response and get correction
   */
  router.post('/:id/response', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { text } = req.body;

      // Validate request body
      if (!text || typeof text !== 'string') {
        throw new ValidationError('Response text is required and must be a string', 'text');
      }

      const session = sessionManager.getSession(id);

      if (!session) {
        throw new SessionError(`Session not found: ${id}`);
      }

      if (!session.isActive) {
        throw new SessionError('Cannot submit response for inactive session', 400);
      }

      if (session.conversationHistory.length === 0) {
        throw new ValidationError('No question exists to respond to');
      }

      // Get the last question
      const lastTurn = session.conversationHistory[session.conversationHistory.length - 1];
      
      if (lastTurn.userResponse) {
        throw new ValidationError('Response already submitted for this question');
      }

      // Create user response
      const userResponse: UserResponse = {
        text,
        submittedAt: new Date(),
      };

      // Add response to session
      sessionManager.addResponse(id, userResponse);

      // Analyze and correct the response (Requirement 7.2)
      try {
        const correctionResult = await aiService.analyzeAndCorrect(text, lastTurn.question);

        // Create correction object
        const correction: Correction = {
          hasErrors: correctionResult.hasErrors,
          originalText: text,
          correctedText: correctionResult.correctedText,
          explanation: correctionResult.explanation,
          suggestions: correctionResult.suggestions,
        };

        // Update the conversation turn with correction
        lastTurn.correction = correction;

        res.status(200).json({
          success: true,
          data: {
            originalText: text,
            correction: {
              hasErrors: correction.hasErrors,
              correctedText: correction.correctedText,
              explanation: correction.explanation,
              suggestions: correction.suggestions,
            },
            sessionId: id,
          },
        });
      } catch (aiError) {
        throw new AIServiceError('Failed to analyze response. Please try again.', aiError as Error);
      }
    } catch (error) {
      next(error);
    }
  });

  return router;
}
