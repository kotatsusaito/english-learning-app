import { Router, Request, Response, NextFunction } from 'express';
import { SpeechService } from '../services/SpeechService';
import { SpeechOptions } from '@english-learning-app/shared';
import { ValidationError, SpeechServiceError } from '../middleware';

/**
 * Request body for speech synthesis
 */
interface SynthesizeRequestBody {
  text: string;
  language?: string;
  voice?: string;
  speed?: number;
}

/**
 * Creates the speech router with the given speech service
 * @param speechService - The speech service instance
 * @returns Express router for speech endpoints
 */
export function createSpeechRouter(speechService: SpeechService): Router {
  const router = Router();

  /**
   * POST /api/speech/synthesize
   * Synthesizes text to speech audio
   * 
   * Request body:
   * - text: string (required) - The text to synthesize
   * - language: string (optional) - Language code (default: 'en-US')
   * - voice: string (optional) - Voice name
   * - speed: number (optional) - Speech speed (default: 1.0)
   * 
   * Response:
   * - 200: AudioData object with url, format, and duration
   * - 400: Invalid request (missing text, empty text)
   * - 500: Speech synthesis failed
   * - 503: Speech service unavailable
   */
  router.post(
    '/synthesize',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Check if speech service is available (Requirement 7.3)
        if (!speechService.isAvailable()) {
          throw new SpeechServiceError('The speech synthesis service is not configured or unavailable');
        }

        // Validate request body
        const { text, language, voice, speed } = req.body as SynthesizeRequestBody;

        if (!text) {
          throw new ValidationError('The "text" field is required', 'text');
        }

        if (typeof text !== 'string') {
          throw new ValidationError('The "text" field must be a string', 'text');
        }

        if (text.trim().length === 0) {
          throw new ValidationError('The "text" field cannot be empty', 'text');
        }

        // Validate optional fields
        if (speed !== undefined && (typeof speed !== 'number' || speed <= 0 || speed > 4)) {
          throw new ValidationError('The "speed" field must be a number between 0 and 4', 'speed');
        }

        // Prepare speech options
        const options: SpeechOptions = {
          language: language || 'en-US',
          voice,
          speed,
        };

        // Synthesize speech (Requirement 7.3)
        try {
          const audioData = await speechService.synthesize(text, options);

          // Return audio data
          res.status(200).json(audioData);
        } catch (speechError) {
          throw new SpeechServiceError('Failed to synthesize speech', speechError as Error);
        }
      } catch (error) {
        // Pass error to error handler middleware
        next(error);
      }
    }
  );

  return router;
}
