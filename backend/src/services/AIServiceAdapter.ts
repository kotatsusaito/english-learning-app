import { ConversationContext, CorrectionResult } from '@english-learning-app/shared';

/**
 * Interface for AI service providers (OpenAI, Claude, etc.)
 * Abstracts AI API communication for question generation and response analysis
 */
export interface AIServiceAdapter {
  /**
   * Generates a question based on conversation context
   * @param context - The conversation context including previous turns
   * @returns A promise that resolves to the generated question text
   */
  generateQuestion(context: ConversationContext): Promise<string>;

  /**
   * Analyzes a user response and generates corrections/suggestions
   * @param response - The user's response text
   * @param question - The original question
   * @returns A promise that resolves to the correction result
   */
  analyzeAndCorrect(response: string, question: string): Promise<CorrectionResult>;
}

/**
 * Prompt templates for AI interactions
 */
export class PromptTemplates {
  /**
   * Get CEFR level description for prompts
   */
  private static getCEFRDescription(level?: string): string {
    const descriptions: Record<string, string> = {
      'A1': 'beginner level (A1 - basic phrases and simple sentences)',
      'A2': 'elementary level (A2 - simple everyday topics)',
      'B1': 'intermediate level (B1 - familiar matters and personal interests)',
      'B2': 'upper-intermediate level (B2 - complex topics and abstract ideas)',
      'C1': 'advanced level (C1 - sophisticated language and nuanced expression)',
      'C2': 'proficiency level (C2 - native-like fluency and precision)',
    };
    return level ? descriptions[level] || 'intermediate level' : 'intermediate level';
  }

  /**
   * Generates a prompt for question generation
   * @param context - The conversation context
   * @returns The formatted prompt
   */
  static questionGeneration(context: ConversationContext): string {
    const previousConversation = context.previousTurns
      .map((turn, index) => {
        return `Turn ${index + 1}:\nQ: ${turn.question}\nA: ${turn.userResponse}`;
      })
      .join('\n\n');

    const contextSection = previousConversation
      ? `\nPrevious conversation:\n${previousConversation}\n`
      : '';

    const levelDescription = this.getCEFRDescription(context.cefrLevel);

    return `You are an English conversation teacher. Generate a natural, engaging question in English for a language learner to practice responding.

Target proficiency level: ${levelDescription}
${contextSection}
Requirements:
- Ask only ONE question
- Use clear, grammatically correct English
- Adjust vocabulary and grammar complexity to match the ${levelDescription}
- Vary question types (open-ended, opinion, experience-based)
- Make questions engaging and relevant to everyday life
- For lower levels (A1-A2), use simple present/past tense and basic vocabulary
- For higher levels (C1-C2), use complex structures and sophisticated vocabulary

Question:`;
  }

  /**
   * Generates a prompt for grammar correction
   * @param question - The original question
   * @param response - The user's response
   * @returns The formatted prompt
   */
  static grammarCorrection(question: string, response: string): string {
    return `You are an English grammar expert. Analyze the following response and provide corrections.

Question: ${question}
User Response: ${response}

Tasks:
1. Identify grammatical errors
2. Provide corrected version
3. Explain the corrections briefly
4. Suggest better expressions if applicable

Format your response as JSON:
{
  "hasErrors": boolean,
  "correctedText": string,
  "explanation": string,
  "suggestions": string[]
}`;
  }
}

/**
 * Configuration for OpenAI API
 */
export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * OpenAI API response types
 */
interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Claude API response types
 */
interface ClaudeResponse {
  content: Array<{
    text: string;
  }>;
}

/**
 * OpenAI implementation of AIServiceAdapter
 */
export class OpenAIAdapter implements AIServiceAdapter {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private baseUrl: string = 'https://api.openai.com/v1';

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 500;
  }

  async generateQuestion(context: ConversationContext): Promise<string> {
    const prompt = PromptTemplates.questionGeneration(context);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: this.temperature,
          max_tokens: this.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OpenAIResponse;
      const question = data.choices[0]?.message?.content?.trim();

      if (!question) {
        throw new Error('No question generated from OpenAI API');
      }

      return question;
    } catch (error) {
      throw new Error(`Failed to generate question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeAndCorrect(response: string, question: string): Promise<CorrectionResult> {
    const prompt = PromptTemplates.grammarCorrection(question, response);

    try {
      const apiResponse = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3, // Lower temperature for more consistent corrections
          max_tokens: this.maxTokens,
        }),
      });

      if (!apiResponse.ok) {
        throw new Error(`OpenAI API error: ${apiResponse.status} ${apiResponse.statusText}`);
      }

      const data = await apiResponse.json() as OpenAIResponse;
      const content = data.choices[0]?.message?.content?.trim();

      if (!content) {
        throw new Error('No correction generated from OpenAI API');
      }

      // Parse JSON response
      const result = JSON.parse(content) as CorrectionResult;

      return result;
    } catch (error) {
      throw new Error(`Failed to analyze and correct: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Configuration for Claude API
 */
export interface ClaudeConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Mock implementation of AIServiceAdapter for testing
 */
export class MockAIAdapter implements AIServiceAdapter {
  async generateQuestion(context: ConversationContext): Promise<string> {
    // Generate simple mock questions
    const questions = [
      "What did you do today?",
      "What's your favorite hobby?",
      "Tell me about your weekend plans.",
      "What kind of music do you like?",
      "Have you traveled anywhere interesting recently?",
      "What's your favorite food?",
      "Do you have any pets?",
      "What do you like to do in your free time?",
    ];
    
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  }

  async analyzeAndCorrect(response: string, question: string): Promise<CorrectionResult> {
    // Simple mock correction logic
    const hasErrors = response.toLowerCase().includes('i is') || 
                     response.toLowerCase().includes('he go') ||
                     response.toLowerCase().includes('she have');
    
    if (hasErrors) {
      const correctedText = response
        .replace(/i is/gi, 'I am')
        .replace(/he go/gi, 'he goes')
        .replace(/she have/gi, 'she has');
      
      return {
        hasErrors: true,
        correctedText,
        explanation: 'Fixed subject-verb agreement errors.',
        suggestions: ['Remember to use correct verb forms with different subjects.'],
      };
    }
    
    return {
      hasErrors: false,
      correctedText: response,
      explanation: 'Great job! Your response looks good.',
      suggestions: [],
    };
  }
}

export class ClaudeAdapter implements AIServiceAdapter {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private baseUrl: string = 'https://api.anthropic.com/v1';

  constructor(config: ClaudeConfig) {
    this.apiKey = config.apiKey;
    // Try Claude 3 Haiku (most widely available model)
    this.model = config.model || 'claude-3-haiku-20240307';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 1024;
  }

  async generateQuestion(context: ConversationContext): Promise<string> {
    const prompt = PromptTemplates.questionGeneration(context);

    try {
      console.log('Calling Claude API for question generation...');
      console.log('Model:', this.model);
      
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: this.temperature,
          max_tokens: this.maxTokens,
        }),
      });

      const responseText = await response.text();
      console.log('Claude API response status:', response.status);
      console.log('Claude API response:', responseText.substring(0, 200));

      if (!response.ok) {
        console.error('Claude API error response:', responseText);
        
        // Try to parse error details
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(`Claude API error: ${errorData.error?.type || 'unknown'} - ${errorData.error?.message || responseText}`);
        } catch (parseError) {
          throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${responseText}`);
        }
      }

      const data = JSON.parse(responseText) as ClaudeResponse;
      const question = data.content[0]?.text?.trim();

      if (!question) {
        throw new Error('No question generated from Claude API');
      }

      console.log('Generated question:', question);
      return question;
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error(`Failed to generate question: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeAndCorrect(response: string, question: string): Promise<CorrectionResult> {
    const prompt = PromptTemplates.grammarCorrection(question, response);

    try {
      console.log('Calling Claude API for grammar correction...');
      
      const apiResponse = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3, // Lower temperature for more consistent corrections
          max_tokens: this.maxTokens,
        }),
      });

      const responseText = await apiResponse.text();
      console.log('Claude API correction response status:', apiResponse.status);

      if (!apiResponse.ok) {
        console.error('Claude API error response:', responseText);
        throw new Error(`Claude API error: ${apiResponse.status} ${apiResponse.statusText} - ${responseText}`);
      }

      const data = JSON.parse(responseText) as ClaudeResponse;
      const content = data.content[0]?.text?.trim();

      if (!content) {
        throw new Error('No correction generated from Claude API');
      }

      console.log('Claude correction response:', content);

      // Parse JSON response - handle potential markdown code blocks and escape sequences
      let jsonContent = content;
      
      // Remove markdown code blocks if present
      if (content.includes('```json')) {
        const match = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) {
          jsonContent = match[1];
        }
      } else if (content.includes('```')) {
        const match = content.match(/```\s*([\s\S]*?)\s*```/);
        if (match) {
          jsonContent = match[1];
        }
      }

      // Clean up the JSON string - remove control characters
      jsonContent = jsonContent
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .trim();

      const result = JSON.parse(jsonContent) as CorrectionResult;

      return result;
    } catch (error) {
      console.error('Claude correction error:', error);
      throw new Error(`Failed to analyze and correct: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
