# Services Layer

This directory contains the core business logic services for the English Learning App.

## AIServiceAdapter

The `AIServiceAdapter` provides an abstraction layer for AI service providers (OpenAI and Claude). It handles question generation and grammar correction functionality.

### Features

- **Multiple AI Providers**: Support for both OpenAI (GPT-4) and Claude (Anthropic)
- **Question Generation**: Generate contextual English questions for learners
- **Grammar Correction**: Analyze user responses and provide corrections
- **Prompt Templates**: Pre-built prompts optimized for language learning
- **Error Handling**: Robust error handling for API failures

### Usage

#### Using the Factory (Recommended)

```typescript
import { AIServiceFactory } from './services';

// Create from environment variables
const aiService = AIServiceFactory.createFromEnv();

// Or create with explicit configuration
const aiService = AIServiceFactory.createAdapter({
  provider: 'openai',
  apiKey: 'your-api-key',
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 500,
});
```

#### Direct Instantiation

```typescript
import { OpenAIAdapter, ClaudeAdapter } from './services';

// OpenAI
const openai = new OpenAIAdapter({
  apiKey: 'your-openai-key',
  model: 'gpt-4',
});

// Claude
const claude = new ClaudeAdapter({
  apiKey: 'your-claude-key',
  model: 'claude-3-5-sonnet-20241022',
});
```

#### Generating Questions

```typescript
const context = {
  sessionId: 'session-123',
  previousTurns: [
    {
      question: 'What is your favorite hobby?',
      userResponse: 'I like reading books.',
      correction: null,
      timestamp: new Date(),
    },
  ],
};

const question = await aiService.generateQuestion(context);
console.log(question); // "What kind of books do you enjoy reading?"
```

#### Analyzing and Correcting Responses

```typescript
const result = await aiService.analyzeAndCorrect(
  'I go to the park yesterday.',
  'What did you do yesterday?'
);

console.log(result);
// {
//   hasErrors: true,
//   correctedText: 'I went to the park yesterday.',
//   explanation: 'Changed "go" to "went" for past tense.',
//   suggestions: ['Consider adding more details about what you did.']
// }
```

### Environment Variables

Create a `.env` file in the backend directory:

```bash
# Choose AI provider
AI_SERVICE=openai  # or 'claude'

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=500

# Claude Configuration
CLAUDE_API_KEY=your_claude_api_key
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_TEMPERATURE=0.7
CLAUDE_MAX_TOKENS=500
```

### Prompt Templates

The `PromptTemplates` class provides optimized prompts for:

- **Question Generation**: Creates engaging, contextual questions for language learners
- **Grammar Correction**: Analyzes responses and provides detailed corrections

You can customize these templates by extending the `PromptTemplates` class or creating your own.

### Error Handling

All methods throw descriptive errors that can be caught and handled:

```typescript
try {
  const question = await aiService.generateQuestion(context);
} catch (error) {
  console.error('Failed to generate question:', error.message);
  // Handle error (show user message, retry, etc.)
}
```

Common error scenarios:
- API key invalid or missing
- Network connectivity issues
- Rate limiting
- Invalid API responses
- Service unavailability

## SessionManager

The `SessionManager` handles learning session lifecycle and conversation history management.

### Features

- Create and manage learning sessions
- Track conversation history
- Add questions and responses to sessions
- End sessions

### Usage

```typescript
import { SessionManager } from './services';

const sessionManager = new SessionManager();

// Create a new session
const session = sessionManager.createSession();

// Add a question
sessionManager.addQuestion(session.id, 'What is your favorite food?');

// Add a user response
sessionManager.addResponse(session.id, {
  text: 'I like pizza.',
  submittedAt: new Date(),
});

// Get session
const retrievedSession = sessionManager.getSession(session.id);

// End session
sessionManager.endSession(session.id);
```

## Testing

All services include comprehensive unit tests:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- AIServiceAdapter.test.ts

# Run tests in watch mode
npm test:watch
```

## Requirements Mapping

This implementation satisfies the following requirements:

- **Requirement 1.1, 1.2**: AI question generation
- **Requirement 1.3**: Grammatically correct questions
- **Requirement 4.1**: Grammar analysis
- **Requirement 4.2**: Correction generation
- **Requirement 4.3**: Improvement suggestions
