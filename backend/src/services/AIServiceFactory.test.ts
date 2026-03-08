import { AIServiceFactory } from './AIServiceFactory';
import { OpenAIAdapter, ClaudeAdapter } from './AIServiceAdapter';

describe('AIServiceFactory', () => {
  describe('createAdapter', () => {
    it('should create OpenAI adapter', () => {
      const adapter = AIServiceFactory.createAdapter({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      });

      expect(adapter).toBeInstanceOf(OpenAIAdapter);
    });

    it('should create Claude adapter', () => {
      const adapter = AIServiceFactory.createAdapter({
        provider: 'claude',
        apiKey: 'test-key',
        model: 'claude-3-5-sonnet-20241022',
      });

      expect(adapter).toBeInstanceOf(ClaudeAdapter);
    });

    it('should throw error for unsupported provider', () => {
      expect(() => {
        AIServiceFactory.createAdapter({
          provider: 'unsupported' as any,
          apiKey: 'test-key',
        });
      }).toThrow('Unsupported AI provider');
    });
  });

  describe('createFromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should create OpenAI adapter from environment variables', () => {
      process.env.AI_SERVICE = 'openai';
      process.env.OPENAI_API_KEY = 'test-openai-key';
      process.env.OPENAI_MODEL = 'gpt-4';

      const adapter = AIServiceFactory.createFromEnv();

      expect(adapter).toBeInstanceOf(OpenAIAdapter);
    });

    it('should create Claude adapter from environment variables', () => {
      process.env.AI_SERVICE = 'claude';
      process.env.CLAUDE_API_KEY = 'test-claude-key';
      process.env.CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

      const adapter = AIServiceFactory.createFromEnv();

      expect(adapter).toBeInstanceOf(ClaudeAdapter);
    });

    it('should default to OpenAI if AI_SERVICE is not set', () => {
      delete process.env.AI_SERVICE;
      process.env.OPENAI_API_KEY = 'test-openai-key';

      const adapter = AIServiceFactory.createFromEnv();

      expect(adapter).toBeInstanceOf(OpenAIAdapter);
    });

    it('should throw error if API key is missing', () => {
      process.env.AI_SERVICE = 'openai';
      delete process.env.OPENAI_API_KEY;

      expect(() => {
        AIServiceFactory.createFromEnv();
      }).toThrow('API key not found');
    });

    it('should parse temperature and maxTokens from environment', () => {
      process.env.AI_SERVICE = 'openai';
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.AI_TEMPERATURE = '0.5';
      process.env.AI_MAX_TOKENS = '1000';

      const adapter = AIServiceFactory.createFromEnv();

      expect(adapter).toBeInstanceOf(OpenAIAdapter);
    });
  });
});
