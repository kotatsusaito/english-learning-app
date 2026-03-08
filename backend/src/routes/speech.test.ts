import request from 'supertest';
import express, { Express } from 'express';
import { SpeechService } from '../services/SpeechService';
import { AudioData, SpeechOptions } from '@english-learning-app/shared';
import { createSpeechRouter } from './speech';
import { errorHandler } from '../middleware';

/**
 * Mock Speech Service for testing
 */
class MockSpeechService implements SpeechService {
  private available: boolean;

  constructor(available: boolean = true) {
    this.available = available;
  }

  async synthesize(text: string, options: SpeechOptions): Promise<AudioData> {
    if (!this.available) {
      throw new Error('Speech service unavailable');
    }

    // Calculate approximate duration based on word count
    const wordCount = text.split(/\s+/).length;
    const duration = Math.ceil((wordCount / 150) * 60);

    return {
      url: `/audio/mock-${Date.now()}.mp3`,
      format: 'mp3',
      duration: duration,
    };
  }

  isAvailable(): boolean {
    return this.available;
  }

  setAvailable(available: boolean): void {
    this.available = available;
  }
}

/**
 * Test suite for speech synthesis endpoint
 */
describe('Speech Routes', () => {
  let app: Express;
  let speechService: MockSpeechService;

  beforeEach(() => {
    // Create fresh instances for each test
    speechService = new MockSpeechService();
    app = express();
    app.use(express.json());
    app.use('/api/speech', createSpeechRouter(speechService));
    app.use(errorHandler);
  });

  describe('POST /api/speech/synthesize', () => {
    it('should synthesize text to speech', async () => {
      const response = await request(app)
        .post('/api/speech/synthesize')
        .send({
          text: 'Hello, this is a test.',
          language: 'en-US',
        })
        .expect(200);

      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('format');
      expect(response.body).toHaveProperty('duration');
      expect(response.body.format).toBe('mp3');
      expect(response.body.url).toMatch(/^\/audio\/mock-\d+\.mp3$/);
    });

    it('should use default language if not specified', async () => {
      const response = await request(app)
        .post('/api/speech/synthesize')
        .send({
          text: 'Hello, world!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('url');
      expect(response.body.format).toBe('mp3');
    });

    it('should accept optional voice parameter', async () => {
      const response = await request(app)
        .post('/api/speech/synthesize')
        .send({
          text: 'Testing voice parameter.',
          language: 'en-US',
          voice: 'alloy',
        })
        .expect(200);

      expect(response.body).toHaveProperty('url');
    });

    it('should accept optional speed parameter', async () => {
      const response = await request(app)
        .post('/api/speech/synthesize')
        .send({
          text: 'Testing speed parameter.',
          language: 'en-US',
          speed: 1.5,
        })
        .expect(200);

      expect(response.body).toHaveProperty('url');
    });

    it('should return 400 if text is missing', async () => {
      const response = await request(app)
        .post('/api/speech/synthesize')
        .send({
          language: 'en-US',
        })
        .expect(400);

      expect(response.body.error.type).toBe('ValidationError');
      expect(response.body.error.message).toContain('text');
      expect(response.body.error.statusCode).toBe(400);
    });

    it('should return 400 if text is not a string', async () => {
      const response = await request(app)
        .post('/api/speech/synthesize')
        .send({
          text: 123,
          language: 'en-US',
        })
        .expect(400);

      expect(response.body.error.type).toBe('ValidationError');
      expect(response.body.error.message).toContain('string');
      expect(response.body.error.statusCode).toBe(400);
    });

    it('should return 400 if text is empty', async () => {
      const response = await request(app)
        .post('/api/speech/synthesize')
        .send({
          text: '   ',
          language: 'en-US',
        })
        .expect(400);

      expect(response.body.error.type).toBe('ValidationError');
      expect(response.body.error.message).toContain('empty');
      expect(response.body.error.statusCode).toBe(400);
    });

    it('should return 400 if speed is invalid (too low)', async () => {
      const response = await request(app)
        .post('/api/speech/synthesize')
        .send({
          text: 'Testing speed validation.',
          speed: 0,
        })
        .expect(400);

      expect(response.body.error.type).toBe('ValidationError');
      expect(response.body.error.message).toContain('speed');
      expect(response.body.error.statusCode).toBe(400);
    });

    it('should return 400 if speed is invalid (too high)', async () => {
      const response = await request(app)
        .post('/api/speech/synthesize')
        .send({
          text: 'Testing speed validation.',
          speed: 5,
        })
        .expect(400);

      expect(response.body.error.type).toBe('ValidationError');
      expect(response.body.error.message).toContain('speed');
      expect(response.body.error.statusCode).toBe(400);
    });

    it('should return 400 if speed is not a number', async () => {
      const response = await request(app)
        .post('/api/speech/synthesize')
        .send({
          text: 'Testing speed validation.',
          speed: 'fast',
        })
        .expect(400);

      expect(response.body.error.type).toBe('ValidationError');
      expect(response.body.error.message).toContain('speed');
      expect(response.body.error.statusCode).toBe(400);
    });

    it('should return 503 if speech service is unavailable', async () => {
      // Make service unavailable
      speechService.setAvailable(false);

      const response = await request(app)
        .post('/api/speech/synthesize')
        .send({
          text: 'This should fail.',
          language: 'en-US',
        })
        .expect(503);

      expect(response.body.error.type).toBe('SpeechServiceError');
      expect(response.body.error.message).toContain('unavailable');
      expect(response.body.error.statusCode).toBe(503);
    });

    it('should handle long text', async () => {
      const longText = 'This is a very long sentence. '.repeat(50);
      
      const response = await request(app)
        .post('/api/speech/synthesize')
        .send({
          text: longText,
          language: 'en-US',
        })
        .expect(200);

      expect(response.body).toHaveProperty('url');
      expect(response.body.duration).toBeGreaterThan(0);
    });

    it('should handle different languages', async () => {
      const languages = ['en-US', 'en-GB', 'en-AU'];

      for (const language of languages) {
        const response = await request(app)
          .post('/api/speech/synthesize')
          .send({
            text: 'Testing different languages.',
            language,
          })
          .expect(200);

        expect(response.body).toHaveProperty('url');
      }
    });

    it('should calculate duration based on text length', async () => {
      const shortText = 'Hello.';
      const longText = 'This is a much longer sentence with many more words to speak.';

      const shortResponse = await request(app)
        .post('/api/speech/synthesize')
        .send({ text: shortText })
        .expect(200);

      const longResponse = await request(app)
        .post('/api/speech/synthesize')
        .send({ text: longText })
        .expect(200);

      expect(longResponse.body.duration).toBeGreaterThan(shortResponse.body.duration);
    });
  });

  describe('Error handling', () => {
    it('should handle synthesis errors gracefully', async () => {
      // Create a service that throws errors
      const errorService: SpeechService = {
        async synthesize() {
          throw new Error('Synthesis failed');
        },
        isAvailable() {
          return true;
        },
      };

      const errorApp = express();
      errorApp.use(express.json());
      errorApp.use('/api/speech', createSpeechRouter(errorService));
      errorApp.use(errorHandler);

      const response = await request(errorApp)
        .post('/api/speech/synthesize')
        .send({
          text: 'This will fail.',
        })
        .expect(503);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.type).toBe('SpeechServiceError');
      expect(response.body.error.statusCode).toBe(503);
    });
  });
});
