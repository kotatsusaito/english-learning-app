import { SpeechServiceFactory } from './SpeechServiceFactory';
import { OpenAITTSService, MockSpeechService } from './SpeechService';

describe('SpeechServiceFactory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('create', () => {
    it('should create OpenAI TTS service when API key is available', () => {
      process.env.OPENAI_API_KEY = 'test-api-key';
      process.env.OPENAI_TTS_MODEL = 'tts-1';
      process.env.OPENAI_TTS_VOICE = 'alloy';

      const service = SpeechServiceFactory.create();

      expect(service).toBeInstanceOf(OpenAITTSService);
      expect(service.isAvailable()).toBe(true);
    });

    it('should create mock service when no API key is available', () => {
      delete process.env.OPENAI_API_KEY;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const service = SpeechServiceFactory.create();

      expect(service).toBeInstanceOf(MockSpeechService);
      expect(service.isAvailable()).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'No OpenAI API key found. Using mock speech service.'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('createOpenAI', () => {
    it('should create OpenAI TTS service with provided configuration', () => {
      const service = SpeechServiceFactory.createOpenAI(
        'test-api-key',
        'tts-1',
        'nova',
        './test-audio'
      );

      expect(service).toBeInstanceOf(OpenAITTSService);
      expect(service.isAvailable()).toBe(true);
    });

    it('should create OpenAI TTS service with minimal configuration', () => {
      const service = SpeechServiceFactory.createOpenAI('test-api-key');

      expect(service).toBeInstanceOf(OpenAITTSService);
      expect(service.isAvailable()).toBe(true);
    });
  });

  describe('createMock', () => {
    it('should create mock speech service', () => {
      const service = SpeechServiceFactory.createMock();

      expect(service).toBeInstanceOf(MockSpeechService);
      expect(service.isAvailable()).toBe(true);
    });
  });
});
