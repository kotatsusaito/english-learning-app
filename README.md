# English Learning App

AI-powered English learning application with conversation practice and grammar correction.

## Project Structure

This is a monorepo using npm workspaces with three packages:

```
english-learning-app/
├── shared/          # Shared types and utilities
├── backend/         # Express API server
├── frontend/        # React frontend
└── package.json     # Root workspace configuration
```

## Setup

Install all dependencies:

```bash
npm install
```

## Development

Run backend server:
```bash
npm run dev:backend
```

Run frontend development server:
```bash
npm run dev:frontend
```

## Testing

Run all tests:
```bash
npm test
```

Run tests for a specific workspace:
```bash
npm test -w shared
npm test -w backend
npm test -w frontend
```

## Build

Build all packages:
```bash
npm run build
```

## Technology Stack

- **Language**: TypeScript
- **Frontend**: React + Vite
- **Backend**: Express.js
- **Testing**: Jest + fast-check (property-based testing)
- **AI**: OpenAI/Anthropic Claude (to be configured)
- **Speech**: Web Speech API / OpenAI TTS

## Core Types

All shared types are defined in `shared/src/types/index.ts`:

- `Session` - Learning session with conversation history
- `ConversationTurn` - Single Q&A turn
- `Correction` - Grammar correction and suggestions
- `UserResponse` - User's answer to a question
- `AudioData` - Speech synthesis audio data
- `ConversationContext` - Context for AI question generation
- `CorrectionResult` - AI correction analysis result
- `SpeechOptions` - Speech synthesis configuration

## Next Steps

See `.kiro/specs/english-learning-app/tasks.md` for the implementation plan.
