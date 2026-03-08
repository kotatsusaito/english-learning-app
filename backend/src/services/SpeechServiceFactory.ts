import { SpeechService, OpenAITTSService, MockSpeechService } from './SpeechService';

/**
 * Factory for creating SpeechService instances based on configuration
 */
export class SpeechServiceFactory {
  /**
   * Creates a SpeechService instance based on environment configuration
   * @returns A configured SpeechService instance
   */
  static createFromEnv(): SpeechService {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_TTS_MODEL;
    const voice = process.env.OPENAI_TTS_VOICE;
    const audioDir = process.env.AUDIO_DIR;

    // If OpenAI API key is available, use OpenAI TTS
    if (apiKey) {
      return new OpenAITTSService({
        apiKey,
        model,
        voice,
        audioDir,
      });
    }

    // Fallback to mock service if no API key is configured
    console.warn('No OpenAI API key found. Using mock speech service.');
    return new MockSpeechService();
  }

  /**
   * Creates a SpeechService instance based on environment configuration
   * @deprecated Use createFromEnv() instead
   * @returns A configured SpeechService instance
   */
  static create(): SpeechService {
    return SpeechServiceFactory.createFromEnv();
  }

  /**
   * Creates an OpenAI TTS service with explicit configuration
   * @param apiKey - OpenAI API key
   * @param model - TTS model (optional)
   * @param voice - Default voice (optional)
   * @param audioDir - Directory for audio files (optional)
   * @returns A configured OpenAI TTS service
   */
  static createOpenAI(
    apiKey: string,
    model?: string,
    voice?: string,
    audioDir?: string
  ): SpeechService {
    return new OpenAITTSService({
      apiKey,
      model,
      voice,
      audioDir,
    });
  }

  /**
   * Creates a mock speech service for testing
   * @returns A mock speech service
   */
  static createMock(): SpeechService {
    return new MockSpeechService();
  }
}
