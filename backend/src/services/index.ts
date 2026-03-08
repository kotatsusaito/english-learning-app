/**
 * Service layer exports
 */

export { SessionManager } from './SessionManager';
export {
  AIServiceAdapter,
  OpenAIAdapter,
  ClaudeAdapter,
  OpenAIConfig,
  ClaudeConfig,
  PromptTemplates,
} from './AIServiceAdapter';
export { AIServiceFactory, AIServiceConfig } from './AIServiceFactory';
export {
  SpeechService,
  OpenAITTSService,
  MockSpeechService,
  OpenAITTSConfig,
} from './SpeechService';
export { SpeechServiceFactory } from './SpeechServiceFactory';
