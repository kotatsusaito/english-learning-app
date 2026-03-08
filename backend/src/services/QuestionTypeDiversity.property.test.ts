import fc from 'fast-check';
import { AIServiceAdapter, OpenAIAdapter, ClaudeAdapter } from './AIServiceAdapter';
import { ConversationContext } from '@english-learning-app/shared';

/**
 * Property-Based Test: Question Type Diversity
 * **Validates: Requirements 1.4**
 * 
 * Property 2: Question Type Diversity
 * For any sequence of N questions (where N ≥ 5), the generated questions 
 * should include at least 2 different question types (e.g., open-ended, 
 * yes/no, opinion-based).
 */

/**
 * Question type classification
 */
enum QuestionType {
  YES_NO = 'yes_no',           // Questions that can be answered with yes/no
  OPEN_ENDED = 'open_ended',   // Questions requiring detailed answers
  OPINION = 'opinion',         // Questions asking for opinions/preferences
  EXPERIENCE = 'experience',   // Questions about past experiences
  HYPOTHETICAL = 'hypothetical', // What-if questions
  CHOICE = 'choice',           // Questions offering choices (or/either)
  UNKNOWN = 'unknown'          // Cannot classify
}

/**
 * Classifies a question into a question type based on linguistic patterns
 * More specific patterns are checked first to avoid misclassification
 */
function classifyQuestionType(question: string): QuestionType {
  const lowerQuestion = question.toLowerCase().trim();
  
  // Experience questions - check first as they're very specific
  const experiencePatterns = [
    /have you ever/,
    /did you ever/,
    /when was the last time/,
    /tell me about a time/,
    /describe a situation/,
    /what was your/,
  ];
  
  if (experiencePatterns.some(pattern => pattern.test(lowerQuestion))) {
    return QuestionType.EXPERIENCE;
  }
  
  // Opinion questions - check before yes/no as they're more specific
  const opinionPatterns = [
    /what do you think/,
    /what's your opinion/,
    /what is your opinion/,
    /how do you feel/,
    /do you prefer/,
    /which do you like/,
    /what's your favorite/,
    /what is your favorite/,
    /do you believe/,
  ];
  
  if (opinionPatterns.some(pattern => pattern.test(lowerQuestion))) {
    return QuestionType.OPINION;
  }
  
  // Hypothetical questions
  const hypotheticalPatterns = [
    /what would you do if/,
    /what if/,
    /imagine/,
    /suppose/,
    /if you could/,
    /if you were/,
    /if you had/,
  ];
  
  if (hypotheticalPatterns.some(pattern => pattern.test(lowerQuestion))) {
    return QuestionType.HYPOTHETICAL;
  }
  
  // Choice questions
  const choicePatterns = [
    /\bor\b/,
    /either.*or/,
    /which (one|do you)/,
  ];
  
  if (choicePatterns.some(pattern => pattern.test(lowerQuestion))) {
    return QuestionType.CHOICE;
  }
  
  // Yes/No questions - check after more specific patterns
  const yesNoPatterns = [
    /^do you\b/,
    /^does\b/,
    /^did you\b/,
    /^have you\b/,
    /^has\b/,
    /^had\b/,
    /^is\b/,
    /^are you\b/,
    /^was\b/,
    /^were you\b/,
    /^can you\b/,
    /^could you\b/,
    /^would you\b/,
    /^will you\b/,
    /^should\b/,
  ];
  
  if (yesNoPatterns.some(pattern => pattern.test(lowerQuestion))) {
    return QuestionType.YES_NO;
  }
  
  // Open-ended questions - typically start with wh- words
  const openEndedPatterns = [
    /^what\b/,
    /^why\b/,
    /^how\b/,
    /^where\b/,
    /^when\b/,
    /^who\b/,
  ];
  
  if (openEndedPatterns.some(pattern => pattern.test(lowerQuestion))) {
    return QuestionType.OPEN_ENDED;
  }
  
  return QuestionType.UNKNOWN;
}

/**
 * Counts the number of unique question types in a list of questions
 */
function countUniqueQuestionTypes(questions: string[]): number {
  const types = new Set<QuestionType>();
  
  for (const question of questions) {
    const type = classifyQuestionType(question);
    if (type !== QuestionType.UNKNOWN) {
      types.add(type);
    }
  }
  
  return types.size;
}

/**
 * Creates a mock AI service for testing that returns predefined questions
 */
class MockAIService implements AIServiceAdapter {
  private questionIndex = 0;
  private questions: string[];
  
  constructor(questions: string[]) {
    this.questions = questions;
  }
  
  async generateQuestion(context: ConversationContext): Promise<string> {
    if (this.questionIndex >= this.questions.length) {
      throw new Error('No more mock questions available');
    }
    return this.questions[this.questionIndex++];
  }
  
  async analyzeAndCorrect(response: string, question: string): Promise<any> {
    return {
      hasErrors: false,
      correctedText: response,
      explanation: 'No errors',
      suggestions: [],
    };
  }
}

describe('Property 2: Question Type Diversity', () => {
  // Skip if no API key is available
  const skipRealAPI = !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY;
  
  describe('Question Type Classification', () => {
    it('should correctly classify yes/no questions', () => {
      const yesNoQuestions = [
        'Do you like coffee?',
        'Have you been to Paris?',
        'Can you speak Spanish?',
        'Would you like to travel?',
        'Is this your first time?',
      ];
      
      yesNoQuestions.forEach(q => {
        expect(classifyQuestionType(q)).toBe(QuestionType.YES_NO);
      });
    });
    
    it('should correctly classify opinion questions', () => {
      const opinionQuestions = [
        'What do you think about climate change?',
        "What's your opinion on remote work?",
        'How do you feel about social media?',
        'Do you prefer tea or coffee?',
      ];
      
      opinionQuestions.forEach(q => {
        expect(classifyQuestionType(q)).toBe(QuestionType.OPINION);
      });
    });
    
    it('should correctly classify experience questions', () => {
      const experienceQuestions = [
        'Have you ever traveled abroad?',
        'When was the last time you went to a concert?',
        'Tell me about a time when you faced a challenge.',
      ];
      
      experienceQuestions.forEach(q => {
        expect(classifyQuestionType(q)).toBe(QuestionType.EXPERIENCE);
      });
    });
    
    it('should correctly classify open-ended questions', () => {
      const openEndedQuestions = [
        'What are your hobbies?',
        'Why did you choose your career?',
        'How do you spend your weekends?',
      ];
      
      openEndedQuestions.forEach(q => {
        expect(classifyQuestionType(q)).toBe(QuestionType.OPEN_ENDED);
      });
    });
  });
  
  describe('Mock AI Service Tests', () => {
    it('should detect diversity with exactly 2 types', () => {
      const questions = [
        'Do you like pizza?',           // YES_NO
        'Have you been to Italy?',      // YES_NO
        'What are your hobbies?',       // OPEN_ENDED
        'Why do you like reading?',     // OPEN_ENDED
        'How do you relax?',            // OPEN_ENDED
      ];
      
      const uniqueTypes = countUniqueQuestionTypes(questions);
      expect(uniqueTypes).toBeGreaterThanOrEqual(2);
    });
    
    it('should detect diversity with multiple types', () => {
      const questions = [
        'Do you like coffee?',                    // YES_NO
        'What do you think about remote work?',   // OPINION
        'Have you ever traveled to Asia?',        // EXPERIENCE
        'What are your favorite books?',          // OPEN_ENDED
        'Would you like to learn a new language?', // YES_NO
      ];
      
      const uniqueTypes = countUniqueQuestionTypes(questions);
      expect(uniqueTypes).toBeGreaterThanOrEqual(2);
    });
  });
  
  describe('Property-Based Test with Mock Data', () => {
    it('should maintain diversity across different question sets', () => {
      // Define diverse question pools for each type
      const yesNoPool = [
        'Do you enjoy reading?',
        'Have you visited Japan?',
        'Can you play an instrument?',
        'Would you like to try skydiving?',
        'Is learning English important to you?',
      ];
      
      const opinionPool = [
        'What do you think about artificial intelligence?',
        "What's your opinion on electric cars?",
        'How do you feel about working from home?',
        'Do you prefer city life or countryside?',
        "What's your favorite season and why?",
      ];
      
      const experiencePool = [
        'Have you ever tried a new sport?',
        'When was the last time you cooked something new?',
        'Tell me about a memorable trip you took.',
        'Have you ever learned a new skill as an adult?',
        'What was your most challenging project?',
      ];
      
      const openEndedPool = [
        'What are your career goals?',
        'How do you stay motivated?',
        'What hobbies do you enjoy?',
        'Why did you start learning English?',
        'What makes you happy?',
      ];
      
      const allPools = [yesNoPool, opinionPool, experiencePool, openEndedPool];
      
      // Property: Any combination of 5+ questions from diverse pools should have 2+ types
      // We need to ensure we pick from at least 2 different pools to test diversity
      fc.assert(
        fc.property(
          fc.tuple(
            fc.nat(allPools.length - 1),  // First pool index
            fc.nat(allPools.length - 1)   // Second pool index (can be same)
          ).chain(([pool1, pool2]) => {
            // Ensure we have at least 2 different pools
            const poolIndices = pool1 === pool2 && allPools.length > 1
              ? [pool1, (pool1 + 1) % allPools.length]
              : [pool1, pool2];
            
            return fc.array(
              fc.constantFrom(...poolIndices).chain(poolIndex =>
                fc.nat(allPools[poolIndex].length - 1).map(qIndex =>
                  allPools[poolIndex][qIndex]
                )
              ),
              { minLength: 5, maxLength: 10 }
            );
          }),
          (questions) => {
            const uniqueTypes = countUniqueQuestionTypes(questions);
            
            // The property: at least 2 different question types
            expect(uniqueTypes).toBeGreaterThanOrEqual(2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  // Real API integration test (only runs if API key is available)
  (skipRealAPI ? describe.skip : describe)('Integration Test with Real AI Service', () => {
    let aiService: AIServiceAdapter;
    
    beforeAll(() => {
      if (process.env.OPENAI_API_KEY) {
        const { OpenAIAdapter } = require('./AIServiceAdapter');
        aiService = new OpenAIAdapter({
          apiKey: process.env.OPENAI_API_KEY,
          model: 'gpt-4',
          temperature: 0.7,
        });
      } else if (process.env.ANTHROPIC_API_KEY) {
        const { ClaudeAdapter } = require('./AIServiceAdapter');
        aiService = new ClaudeAdapter({
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: 'claude-3-5-sonnet-20241022',
          temperature: 0.7,
        });
      }
    });
    
    it('should generate diverse question types over multiple questions', async () => {
      const numQuestions = 7; // Test with 7 questions
      const questions: string[] = [];
      
      const context: ConversationContext = {
        sessionId: 'test-session',
        previousTurns: [],
      };
      
      // Generate N questions
      for (let i = 0; i < numQuestions; i++) {
        const question = await aiService.generateQuestion(context);
        questions.push(question);
        
        // Add to context for next iteration
        context.previousTurns.push({
          question,
          userResponse: 'This is a test response.',
          correction: null,
          timestamp: new Date(),
        });
      }
      
      // Log questions for debugging
      console.log('\nGenerated Questions:');
      questions.forEach((q, i) => {
        const type = classifyQuestionType(q);
        console.log(`${i + 1}. [${type}] ${q}`);
      });
      
      // Count unique question types
      const uniqueTypes = countUniqueQuestionTypes(questions);
      console.log(`\nUnique question types: ${uniqueTypes}`);
      
      // Property assertion: at least 2 different types
      expect(uniqueTypes).toBeGreaterThanOrEqual(2);
    }, 60000); // 60 second timeout for API calls
  });
});
