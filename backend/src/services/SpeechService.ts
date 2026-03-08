import { AudioData, SpeechOptions } from '@english-learning-app/shared';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Interface for speech synthesis services
 * Abstracts text-to-speech API communication
 */
export interface SpeechService {
  /**
   * Converts text to speech audio
   * @param text - The text to synthesize
   * @param options - Speech synthesis options
   * @returns A promise that resolves to audio data
   */
  synthesize(text: string, options: SpeechOptions): Promise<AudioData>;

  /**
   * Checks if the speech service is available
   * @returns True if the service is available, false otherwise
   */
  isAvailable(): boolean;
}

/**
 * Configuration for OpenAI TTS API
 */
export interface OpenAITTSConfig {
  apiKey: string;
  model?: string;
  voice?: string;
  audioDir?: string;
}

/**
 * OpenAI TTS API implementation of SpeechService
 */
export class OpenAITTSService implements SpeechService {
  private apiKey: string;
  private model: string;
  private defaultVoice: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  private audioDir: string;

  constructor(config: OpenAITTSConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'tts-1';
    this.defaultVoice = config.voice || 'alloy';
    this.audioDir = config.audioDir || join(process.cwd(), 'audio');
  }

  /**
   * Initializes the audio directory
   */
  private async ensureAudioDir(): Promise<void> {
    try {
      await mkdir(this.audioDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create audio directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async synthesize(text: string, options: SpeechOptions): Promise<AudioData> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    try {
      // Ensure audio directory exists
      await this.ensureAudioDir();

      // Determine voice based on language and options
      const voice = options.voice || this.getVoiceForLanguage(options.language);

      // Call OpenAI TTS API
      const response = await fetch(`${this.baseUrl}/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: text,
          voice: voice,
          speed: options.speed || 1.0,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS API error: ${response.status} ${response.statusText}`);
      }

      // Get audio data as buffer
      const audioBuffer = await response.arrayBuffer();
      
      // Generate unique filename
      const filename = `${randomUUID()}.mp3`;
      const filepath = join(this.audioDir, filename);

      // Save audio file
      await writeFile(filepath, Buffer.from(audioBuffer));

      // Calculate approximate duration (rough estimate based on text length)
      // OpenAI TTS typically speaks at ~150 words per minute
      const wordCount = text.split(/\s+/).length;
      const duration = Math.ceil((wordCount / 150) * 60);

      return {
        url: `/audio/${filename}`,
        format: 'mp3',
        duration: duration,
      };
    } catch (error) {
      throw new Error(`Failed to synthesize speech: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Maps language codes to appropriate OpenAI TTS voices
   * @param language - Language code (e.g., 'en-US', 'en-GB')
   * @returns Voice name
   */
  private getVoiceForLanguage(language: string): string {
    // OpenAI TTS voices: alloy, echo, fable, onyx, nova, shimmer
    // All voices support multiple languages, but we can choose based on preference
    const languageMap: Record<string, string> = {
      'en-US': 'alloy',
      'en-GB': 'echo',
      'en-AU': 'nova',
    };

    return languageMap[language] || this.defaultVoice;
  }
}

/**
 * Mock implementation for testing or when TTS is unavailable
 */
export class MockSpeechService implements SpeechService {
  async synthesize(text: string, options: SpeechOptions): Promise<AudioData> {
    // Return mock audio data
    const wordCount = text.split(/\s+/).length;
    const duration = Math.ceil((wordCount / 150) * 60);

    return {
      url: '/audio/mock.mp3',
      format: 'mp3',
      duration: duration,
    };
  }

  isAvailable(): boolean {
    return true;
  }
}
