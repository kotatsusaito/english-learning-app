import { OpenAIAdapter, ClaudeAdapter, PromptTemplates } from './AIServiceAdapter';
import { ConversationContext, ConversationTurn } from '@english-learning-app/shared';

// Mock fetch globally
global.fetch = jest.fn();

describe('PromptTemplates', () => {
  describe('questionGeneration', () => {
    it('should generate prompt for new session without context', () => {
      const context: ConversationContext = {
        sessionId: 'test-session',
        previousTurns: [],
      };

      const prompt = PromptTemplates.questionGeneration(context);

      expect(prompt).toContain('English conversation teacher');
      expect(prompt).toContain('ONE question');
      expect(prompt).not.toContain('Previous conversation');
    });

    it('should include previous conversation in prompt', () => {
      const turns: ConversationTurn[] = [
        {
          question: 'What is your favorite hobby?',
          userResponse: 'I like reading books.',
          correction: null,
          timestamp: new Date(),
        },
      ];

      const context: ConversationContext = {
        sessionId: 'test-session',
        previousTurns: turns,
      };

      const prompt = PromptTemplates.questionGeneration(context);

      expect(prompt).toContain('Previous conversation');
      expect(prompt).toContain('What is your favorite hobby?');
      expect(prompt).toContain('I like reading books');
    });
  });

  describe('grammarCorrection', () => {
    it('should generate correction prompt with question and response', () => {
      const question = 'What did you do yesterday?';
      const response = 'I go to the park.';

      const prompt = PromptTemplates.grammarCorrection(question, response);

      expect(prompt).toContain('grammar expert');
      expect(prompt).toContain(question);
      expect(prompt).toContain(response);
      expect(prompt).toContain('JSON');
    });
  });
});

describe('OpenAIAdapter', () => {
  let adapter: OpenAIAdapter;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    adapter = new OpenAIAdapter({
      apiKey: 'test-api-key',
      model: 'gpt-4',
    });
    mockFetch.mockClear();
  });

  describe('generateQuestion', () => {
    it('should successfully generate a question', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'What is your favorite food?',
              },
            },
          ],
        }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const context: ConversationContext = {
        sessionId: 'test-session',
        previousTurns: [],
      };

      const question = await adapter.generateQuestion(context);

      expect(question).toBe('What is your favorite food?');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as any);

      const context: ConversationContext = {
        sessionId: 'test-session',
        previousTurns: [],
      };

      await expect(adapter.generateQuestion(context)).rejects.toThrow(
        'Failed to generate question'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const context: ConversationContext = {
        sessionId: 'test-session',
        previousTurns: [],
      };

      await expect(adapter.generateQuestion(context)).rejects.toThrow(
        'Failed to generate question'
      );
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '',
              },
            },
          ],
        }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const context: ConversationContext = {
        sessionId: 'test-session',
        previousTurns: [],
      };

      await expect(adapter.generateQuestion(context)).rejects.toThrow(
        'No question generated'
      );
    });
  });

  describe('analyzeAndCorrect', () => {
    it('should successfully analyze and correct response', async () => {
      const mockCorrectionResult = {
        hasErrors: true,
        correctedText: 'I went to the park.',
        explanation: 'Changed "go" to "went" for past tense.',
        suggestions: ['Consider adding more details about what you did at the park.'],
      };

      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(mockCorrectionResult),
              },
            },
          ],
        }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const result = await adapter.analyzeAndCorrect(
        'I go to the park.',
        'What did you do yesterday?'
      );

      expect(result).toEqual(mockCorrectionResult);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle API errors during correction', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      } as any);

      await expect(
        adapter.analyzeAndCorrect('I go to the park.', 'What did you do yesterday?')
      ).rejects.toThrow('Failed to analyze and correct');
    });

    it('should handle invalid JSON response', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Invalid JSON',
              },
            },
          ],
        }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      await expect(
        adapter.analyzeAndCorrect('I go to the park.', 'What did you do yesterday?')
      ).rejects.toThrow('Failed to analyze and correct');
    });
  });
});

describe('ClaudeAdapter', () => {
  let adapter: ClaudeAdapter;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    adapter = new ClaudeAdapter({
      apiKey: 'test-api-key',
      model: 'claude-3-5-sonnet-20241022',
    });
    mockFetch.mockClear();
  });

  describe('generateQuestion', () => {
    it('should successfully generate a question', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          content: [
            {
              text: 'What is your favorite movie?',
            },
          ],
        }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const context: ConversationContext = {
        sessionId: 'test-session',
        previousTurns: [],
      };

      const question = await adapter.generateQuestion(context);

      expect(question).toBe('What is your favorite movie?');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-api-key',
            'anthropic-version': '2023-06-01',
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as any);

      const context: ConversationContext = {
        sessionId: 'test-session',
        previousTurns: [],
      };

      await expect(adapter.generateQuestion(context)).rejects.toThrow(
        'Failed to generate question'
      );
    });
  });

  describe('analyzeAndCorrect', () => {
    it('should successfully analyze and correct response', async () => {
      const mockCorrectionResult = {
        hasErrors: false,
        correctedText: 'I went to the park yesterday.',
        explanation: 'Your response is grammatically correct!',
        suggestions: [],
      };

      const mockResponse = {
        ok: true,
        json: async () => ({
          content: [
            {
              text: JSON.stringify(mockCorrectionResult),
            },
          ],
        }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      const result = await adapter.analyzeAndCorrect(
        'I went to the park yesterday.',
        'What did you do yesterday?'
      );

      expect(result).toEqual(mockCorrectionResult);
    });

    it('should handle API errors during correction', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as any);

      await expect(
        adapter.analyzeAndCorrect('I go to the park.', 'What did you do yesterday?')
      ).rejects.toThrow('Failed to analyze and correct');
    });
  });
});
