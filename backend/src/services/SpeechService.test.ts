import { OpenAITTSService, MockSpeechService } from './SpeechService';
import { SpeechOptions } from '@english-learning-app/shared';
import { mkdir, rm } from 'fs/promises';
import { join } from 'path';

describe('SpeechService', () => {
  describe('MockSpeechService', () => {
    let service: MockSpeechService;

    beforeEach(() => {
      service = new MockSpeechService();
    });

    it('should be available', () => {
      expect(service.isAvailable()).toBe(true);
    });

    it('should synthesize text and return audio data', async () => {
      const text = 'Hello, this is a test.';
      const options: SpeechOptions = {
        language: 'en-US',
      };

      const result = await service.synthesize(text, options);

      expect(result).toBeDefined();
      expect(result.url).toBe('/audio/mock.mp3');
      expect(result.format).toBe('mp3');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should calculate duration based on word count', async () => {
      const shortText = 'Hello world';
      const longText = 'This is a much longer text with many more words to test the duration calculation';
      const options: SpeechOptions = { language: 'en-US' };

      const shortResult = await service.synthesize(shortText, options);
      const longResult = await service.synthesize(longText, options);

      expect(longResult.duration).toBeGreaterThan(shortResult.duration);
    });
  });

  describe('OpenAITTSService', () => {
    const testAudioDir = join(process.cwd(), 'test-audio');
    let service: OpenAITTSService;

    beforeEach(async () => {
      // Create test audio directory
      await mkdir(testAudioDir, { recursive: true });

      service = new OpenAITTSService({
        apiKey: 'test-api-key',
        model: 'tts-1',
        voice: 'alloy',
        audioDir: testAudioDir,
      });
    });

    afterEach(async () => {
      // Clean up test audio directory
      try {
        await rm(testAudioDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    it('should be available when API key is provided', () => {
      expect(service.isAvailable()).toBe(true);
    });

    it('should not be available without API key', () => {
      const serviceWithoutKey = new OpenAITTSService({
        apiKey: '',
        audioDir: testAudioDir,
      });
      expect(serviceWithoutKey.isAvailable()).toBe(false);
    });

    it('should throw error for empty text', async () => {
      const options: SpeechOptions = { language: 'en-US' };

      await expect(service.synthesize('', options)).rejects.toThrow('Text cannot be empty');
      await expect(service.synthesize('   ', options)).rejects.toThrow('Text cannot be empty');
    });

    it('should handle API errors gracefully', async () => {
      const text = 'Test text';
      const options: SpeechOptions = { language: 'en-US' };

      // Mock fetch to simulate API error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(service.synthesize(text, options)).rejects.toThrow('OpenAI TTS API error: 401 Unauthorized');
    });

    it('should use default voice when not specified', async () => {
      const text = 'Test text';
      const options: SpeechOptions = { language: 'en-US' };

      // Mock successful API response
      const mockAudioBuffer = new ArrayBuffer(100);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer),
      });

      await service.synthesize(text, options);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"voice":"alloy"'),
        })
      );
    });

    it('should use custom voice when specified', async () => {
      const text = 'Test text';
      const options: SpeechOptions = {
        language: 'en-US',
        voice: 'nova',
      };

      // Mock successful API response
      const mockAudioBuffer = new ArrayBuffer(100);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer),
      });

      await service.synthesize(text, options);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"voice":"nova"'),
        })
      );
    });

    it('should use custom speed when specified', async () => {
      const text = 'Test text';
      const options: SpeechOptions = {
        language: 'en-US',
        speed: 1.5,
      };

      // Mock successful API response
      const mockAudioBuffer = new ArrayBuffer(100);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer),
      });

      await service.synthesize(text, options);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"speed":1.5'),
        })
      );
    });

    it('should map language codes to appropriate voices', async () => {
      const text = 'Test text';
      
      // Mock successful API response
      const mockAudioBuffer = new ArrayBuffer(100);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockAudioBuffer),
      });

      // Test en-GB mapping
      await service.synthesize(text, { language: 'en-GB' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"voice":"echo"'),
        })
      );

      // Test en-AU mapping
      await service.synthesize(text, { language: 'en-AU' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"voice":"nova"'),
        })
      );
    });
  });
});
