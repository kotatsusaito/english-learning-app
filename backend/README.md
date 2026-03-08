# English Learning App - Backend

Backend API server for the English Learning App.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
   - Set your OpenAI or Claude API key
   - Choose which AI service to use
   - Configure other settings as needed

## Development

Start the development server:
```bash
npm run dev
```

The server will start on port 3000 (or the port specified in your `.env` file).

## Build

Build the TypeScript code:
```bash
npm run build
```

## Production

Run the production server:
```bash
npm start
```

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## API Endpoints

### Health Check
- `GET /health` - Returns server health status

### Session Management (Coming in Task 6.2)
- `POST /api/sessions` - Create a new learning session
- `GET /api/sessions/:id` - Get session details
- `DELETE /api/sessions/:id` - End a session

### Questions and Responses (Coming in Task 6.3)
- `POST /api/sessions/:id/question` - Generate a new question
- `POST /api/sessions/:id/response` - Submit a response and get corrections

### Speech Synthesis (Coming in Task 6.4)
- `POST /api/speech/synthesize` - Convert text to speech

## Middleware

The server includes the following middleware:

1. **Request Logger** - Logs all incoming requests and responses
2. **CORS** - Configured for cross-origin requests from the frontend
3. **JSON Parser** - Parses JSON request bodies (10MB limit)
4. **URL-encoded Parser** - Parses URL-encoded request bodies
5. **Error Handler** - Global error handling with logging
6. **404 Handler** - Handles requests to non-existent routes

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `PORT` - Server port (default: 3000)
- `CORS_ORIGIN` - Allowed CORS origin (default: http://localhost:5173)
- `AI_SERVICE` - AI service to use ('openai' or 'claude')
- `OPENAI_API_KEY` - OpenAI API key
- `CLAUDE_API_KEY` - Claude API key
- `NODE_ENV` - Environment ('development' or 'production')
