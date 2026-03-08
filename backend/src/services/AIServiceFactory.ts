import { AIServiceAdapter, OpenAIAdapter, ClaudeAdapter, MockAIAdapter } from './AIServiceAdapter';

/**
 * Configuration for AI service factory
 */
export interface AIServiceConfig {
  provider: 'openai' | 'claude' | 'mock';
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Factory class for creating AI service adapters
 */
export class AIServiceFactory {
  /**
   * Creates an AI service adapter based on the provided configuration
   * @param config - Configuration for the AI service
   * @returns An instance of AIServiceAdapter
   * @throws Error if the provider is not supported
   */
  static createAdapter(config: AIServiceConfig): AIServiceAdapter {
    switch (config.provider) {
      case 'openai':
        return new OpenAIAdapter({
          apiKey: config.apiKey,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        });
      
      case 'claude':
        return new ClaudeAdapter({
          apiKey: config.apiKey,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        });
      
      case 'mock':
        return new MockAIAdapter();
      
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  /**
   * Creates an AI service adapter from environment variables
   * @returns An instance of AIServiceAdapter
   * @throws Error if required environment variables are missing
   */
  static createFromEnv(): AIServiceAdapter {
    const provider = (process.env.AI_SERVICE || 'mock') as 'openai' | 'claude' | 'mock';
    
    // Use mock adapter if no API keys are configured
    if (provider === 'mock' || (!process.env.OPENAI_API_KEY && !process.env.CLAUDE_API_KEY)) {
      console.log('Using mock AI service (no API keys configured)');
      return new MockAIAdapter();
    }
    
    let apiKey: string;
    let model: string | undefined;
    
    if (provider === 'openai') {
      apiKey = process.env.OPENAI_API_KEY || '';
      model = process.env.OPENAI_MODEL;
    } else if (provider === 'claude') {
      apiKey = process.env.CLAUDE_API_KEY || '';
      model = process.env.CLAUDE_MODEL;
    } else {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }
    
    if (!apiKey) {
      console.log(`No API key found for ${provider}, using mock AI service`);
      return new MockAIAdapter();
    }
    
    const temperature = process.env.AI_TEMPERATURE 
      ? parseFloat(process.env.AI_TEMPERATURE) 
      : undefined;
    
    const maxTokens = process.env.AI_MAX_TOKENS 
      ? parseInt(process.env.AI_MAX_TOKENS, 10) 
      : undefined;
    
    return AIServiceFactory.createAdapter({
      provider,
      apiKey,
      model,
      temperature,
      maxTokens,
    });
  }
}
