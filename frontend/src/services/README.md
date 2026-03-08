# API Client

This directory contains the API client for communicating with the backend server.

## Usage

### Import the API client

```typescript
import apiClient from './services/apiClient';
```

### Session Management

```typescript
// Create a new session
const session = await apiClient.session.createSession();

// Get session details
const sessionData = await apiClient.session.getSession(sessionId);

// End a session
await apiClient.session.endSession(sessionId);
```

### Question Generation

```typescript
// Generate a new question
const { question } = await apiClient.question.generateQuestion(sessionId);
```

### Response Submission

```typescript
// Submit user response and get correction
const { correction, turn } = await apiClient.response.submitResponse(
  sessionId,
  'My response text'
);
```

### Speech Synthesis

```typescript
// Synthesize text to speech
const audioData = await apiClient.speech.synthesize('Hello world', {
  language: 'en-US',
  speed: 1.0
});
```

## Error Handling

All API methods throw `ApiError` on failure:

```typescript
import { ApiError } from './services/apiClient';

try {
  const session = await apiClient.session.createSession();
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message);
    console.error('Status Code:', error.statusCode);
    console.error('Details:', error.details);
  }
}
```

## Configuration

The API base URL can be configured via environment variable:

```
VITE_API_BASE_URL=/api
```

Default: `/api` (uses Vite proxy in development)
