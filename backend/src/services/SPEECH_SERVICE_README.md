# SpeechService Documentation

## Overview

The `SpeechService` provides text-to-speech (TTS) functionality for the English Learning App. It converts corrected text responses into natural-sounding audio that users can listen to for pronunciation practice.

## Architecture

### Interface

```typescript
interface SpeechService {
  synthesize(text: string, options: SpeechOptions): Promise<AudioData>;
  isAvailable(): boolean;
}
```

### Implementations

1. **OpenAITTSService**: Production implementation using OpenAI's TTS API
2. **MockSpeechService**: Testing/fallback implementation

## OpenAI TTS Service

### Configuration

The service requires the following environment variables:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_TTS_MODEL=tts-1              # Optional, defaults to 'tts-1'
OPENAI_TTS_VOICE=alloy              # Optional, defaults to 'alloy'
AUDIO_DIR=./audio                   # Optional, defaults to './audio'
```

### Available Voices

OpenAI TTS provides six voices:
- **alloy**: Neutral, balanced voice (default for en-US)
- **echo**: Clear, articulate voice (default for en-GB)
- **fable**: Warm, expressive voice
- **onyx**: Deep, authoritative voice
- **nova**: Friendly, energetic voice (default for en-AU)
- **shimmer**: Soft, gentle voice

### Language Mapping

The service automatically maps language codes to appropriate voices:
- `en-US` → alloy
- `en-GB` → echo
- `en-AU` → nova
- Other languages → default voice (alloy)

### Usage Example

```typescript
import { SpeechServiceFactory } from './services';

// Create service from environment configuration
const speechService = SpeechServiceFactory.create();

// Synthesize text
const audioData = await speechService.synthesize(
  'Your corrected sentence goes here.',
  {
    language: 'en-US',
    speed: 1.0,  // Optional: 0.25 to 4.0
    voice: 'nova'  // Optional: override default voice
  }
);

// audioData contains:
// {
//   url: '/audio/uuid.mp3',
//   format: 'mp3',
//   duration: 5  // estimated duration in seconds
// }
```

### Audio File Management

- Audio files are saved to the directory specified by `AUDIO_DIR`
- Files are named with UUIDs to prevent collisions
- Format: MP3 (OpenAI TTS default)
- The service automatically creates the audio directory if it doesn't exist

### Error Handling

The service handles several error scenarios:

1. **Empty Text**: Throws error if text is empty or whitespace-only
2. **API Errors**: Throws descriptive error with status code
3. **File System Errors**: Throws error if audio directory cannot be created
4. **Network Errors**: Throws error with network failure details

Example error handling:

```typescript
try {
  const audio = await speechService.synthesize(text, options);
  // Use audio data
} catch (error) {
  console.error('Speech synthesis failed:', error.message);
  // Fallback: continue without audio
}
```

## Mock Speech Service

The `MockSpeechService` is used for:
- Testing without API calls
- Development without API keys
- Fallback when OpenAI API is unavailable

It returns mock audio data without making actual API calls:

```typescript
{
  url: '/audio/mock.mp3',
  format: 'mp3',
  duration: <calculated from text length>
}
```

## Factory Pattern

Use `SpeechServiceFactory` to create service instances:

```typescript
// Auto-detect from environment
const service = SpeechServiceFactory.create();

// Explicit OpenAI configuration
const service = SpeechServiceFactory.createOpenAI(
  'api-key',
  'tts-1',
  'nova',
  './audio'
);

// Mock service for testing
const service = SpeechServiceFactory.createMock();
```

## Integration with Application

### In API Endpoints

```typescript
import { SpeechServiceFactory } from './services';

const speechService = SpeechServiceFactory.create();

app.post('/api/speech/synthesize', async (req, res) => {
  try {
    const { text, language, voice, speed } = req.body;
    
    const audioData = await speechService.synthesize(text, {
      language: language || 'en-US',
      voice,
      speed,
    });
    
    res.json(audioData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### With Correction Flow

```typescript
// After generating correction
const correction = await aiService.analyzeAndCorrect(response, question);

// Generate audio for corrected text
try {
  const audio = await speechService.synthesize(
    correction.correctedText,
    { language: 'en-US' }
  );
  
  // Return both correction and audio
  res.json({
    correction,
    audio,
  });
} catch (error) {
  // Graceful degradation: return correction without audio
  console.error('Audio synthesis failed:', error);
  res.json({
    correction,
    audio: null,
  });
}
```

## Performance Considerations

1. **API Latency**: OpenAI TTS typically takes 1-3 seconds
2. **File Size**: MP3 files are typically 50-200KB for short sentences
3. **Caching**: Consider caching frequently used phrases
4. **Cleanup**: Implement periodic cleanup of old audio files

## Testing

Run tests with:

```bash
npm test -- SpeechService
```

Tests cover:
- Service availability checks
- Text synthesis with various options
- Error handling scenarios
- Voice and language mapping
- Factory creation patterns

## Requirements Validation

This implementation satisfies:
- **Requirement 5.1**: Text-to-speech conversion for corrected responses
- **Requirement 5.2**: Clear, natural-sounding English pronunciation
- **Requirement 5.5**: Error handling when speech synthesis fails

## Future Enhancements

Potential improvements:
1. Audio file caching to reduce API calls
2. Automatic cleanup of old audio files
3. Support for additional TTS providers (Google, Azure)
4. Streaming audio for faster playback
5. Voice preference persistence per user
