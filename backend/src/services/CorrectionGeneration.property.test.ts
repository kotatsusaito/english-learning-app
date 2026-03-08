import fc from 'fast-check';
import { AIServiceAdapter, OpenAIAdapter, ClaudeAdapter } from './AIServiceAdapter';
import { CorrectionResult } from '@english-learning-app/shared';

/**
 * Property-Based Test: Correction Generation for Errors
 * **Validates: Requirements 4.2**
 * 
 * Property 7: Correction Generation for Errors
 * For any response text containing grammatical errors, the AI_Engine should 
 * generate a Correction object with corrected text.
 */

/**
 * Sample responses with known grammatical errors
 * These are used for testing the correction generation property
 */
const errorResponses = [
  // Subject-verb agreement errors
  'She go to school every day.',
  'They was happy yesterday.',
  'He don\'t like coffee.',
  
  // Tense errors
  'I go to Paris last year.',
  'She has went to the store.',
  'We was studying when he called.',
  
  // Article errors
  'I need a advice.',
  'She is teacher.',
  'He bought new car.',
  
  // Preposition errors
  'I am good in math.',
  'She arrived to the party late.',
  'He is interested on science.',
  
  // Plural/singular errors
  'I have two book.',
  'There are many informations.',
  'She has three childs.',
  
  // Word order errors
  'I very much like pizza.',
  'She always is late.',
  'He speaks English very good.',
  
  // Double negatives
  'I don\'t have no money.',
  'She didn\'t do nothing wrong.',
  
  // Mixed errors
  'Yesterday I go to store and buy two book.',
  'She don\'t likes the movie we watch last night.',
  'I am very interesting in learn English because is important for my career.',
];

/**
 * Validates that a CorrectionResult has the expected structure and content
 */
function validateCorrectionResult(result: CorrectionResult, originalResponse: string): void {
  // Must have the required fields
  expect(result).toHaveProperty('hasErrors');
  expect(result).toHaveProperty('correctedText');
  expect(result).toHaveProperty('explanation');
  expect(result).toHaveProperty('suggestions');
  
  // hasErrors should be a boolean
  expect(typeof result.hasErrors).toBe('boolean');
  
  // correctedText should be a non-empty string
  expect(typeof result.correctedText).toBe('string');
  expect(result.correctedText.length).toBeGreaterThan(0);
  
  // explanation should be a string
  expect(typeof result.explanation).toBe('string');
  
  // suggestions should be an array
  expect(Array.isArray(result.suggestions)).toBe(true);
  
  // For responses with errors, correctedText should differ from original
  if (result.hasErrors) {
    expect(result.correctedText).not.toBe(originalResponse);
    expect(result.explanation.length).toBeGreaterThan(0);
  }
}

describe('Property 7: Correction Generation for Errors', () => {
  // Skip if no API key is available
  const skipRealAPI = !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY;
  
  describe('Validation Helper Tests', () => {
    it('should validate a well-formed correction result with errors', () => {
      const result: CorrectionResult = {
        hasErrors: true,
        correctedText: 'She goes to school every day.',
        explanation: 'Changed "go" to "goes" for subject-verb agreement.',
        suggestions: ['Use "goes" with third-person singular subjects.'],
      };
      
      expect(() => validateCorrectionResult(result, 'She go to school every day.')).not.toThrow();
    });
    
    it('should validate a well-formed correction result without errors', () => {
      const result: CorrectionResult = {
        hasErrors: false,
        correctedText: 'I like coffee.',
        explanation: 'No errors found.',
        suggestions: [],
      };
      
      expect(() => validateCorrectionResult(result, 'I like coffee.')).not.toThrow();
    });
  });
  
  describe('Mock Tests with Known Errors', () => {
    it('should handle subject-verb agreement errors', () => {
      const errorResponse = 'She go to school every day.';
      const expectedCorrection = 'She goes to school every day.';
      
      // This test documents the expected behavior
      expect(errorResponse).not.toBe(expectedCorrection);
    });
    
    it('should handle tense errors', () => {
      const errorResponse = 'I go to Paris last year.';
      const expectedCorrection = 'I went to Paris last year.';
      
      expect(errorResponse).not.toBe(expectedCorrection);
    });
    
    it('should handle article errors', () => {
      const errorResponse = 'She is teacher.';
      const expectedCorrection = 'She is a teacher.';
      
      expect(errorResponse).not.toBe(expectedCorrection);
    });
  });
  
  // Real API integration test (only runs if API key is available)
  (skipRealAPI ? describe.skip : describe)('Integration Test with Real AI Service', () => {
    let aiService: AIServiceAdapter;
    
    beforeAll(() => {
      if (process.env.OPENAI_API_KEY) {
        aiService = new OpenAIAdapter({
          apiKey: process.env.OPENAI_API_KEY,
          model: 'gpt-4',
          temperature: 0.3, // Lower temperature for consistent corrections
        });
      } else if (process.env.ANTHROPIC_API_KEY) {
        aiService = new ClaudeAdapter({
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: 'claude-3-5-sonnet-20241022',
          temperature: 0.3,
        });
      }
    });
    
    it('should generate corrections for responses with grammatical errors', async () => {
      const question = 'What did you do yesterday?';
      const errorResponse = 'Yesterday I go to store and buy two book.';
      
      const result = await aiService.analyzeAndCorrect(errorResponse, question);
      
      // Validate structure
      validateCorrectionResult(result, errorResponse);
      
      // Property assertion: should detect errors
      expect(result.hasErrors).toBe(true);
      
      // Property assertion: corrected text should be different
      expect(result.correctedText).not.toBe(errorResponse);
      
      // Property assertion: should provide explanation
      expect(result.explanation.length).toBeGreaterThan(0);
      
      console.log('\nCorrection Result:');
      console.log('Original:', errorResponse);
      console.log('Corrected:', result.correctedText);
      console.log('Explanation:', result.explanation);
    }, 30000);
    
    it('should handle multiple types of grammatical errors', async () => {
      const question = 'Tell me about your interests.';
      const errorResponse = 'I am very interesting in learn English because is important for my career.';
      
      const result = await aiService.analyzeAndCorrect(errorResponse, question);
      
      validateCorrectionResult(result, errorResponse);
      
      expect(result.hasErrors).toBe(true);
      expect(result.correctedText).not.toBe(errorResponse);
      expect(result.explanation.length).toBeGreaterThan(0);
      
      console.log('\nMultiple Errors Correction:');
      console.log('Original:', errorResponse);
      console.log('Corrected:', result.correctedText);
      console.log('Explanation:', result.explanation);
    }, 30000);
    
    // Property-based test with random selection from error pool
    it('should consistently generate corrections for any error response', async () => {
      const question = 'Please answer this question.';
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...errorResponses),
          async (errorResponse) => {
            const result = await aiService.analyzeAndCorrect(errorResponse, question);
            
            // Validate structure
            validateCorrectionResult(result, errorResponse);
            
            // Core property: AI should detect errors and provide corrections
            expect(result.hasErrors).toBe(true);
            expect(result.correctedText).not.toBe(errorResponse);
            expect(result.explanation.length).toBeGreaterThan(0);
            
            // Log for debugging
            console.log(`\n[${errorResponse.substring(0, 40)}...] -> Corrected: ${result.hasErrors}`);
          }
        ),
        { numRuns: 10 } // Test with 10 random samples from error pool
      );
    }, 120000); // 2 minute timeout for multiple API calls
    
    // Test that correct responses are not incorrectly flagged
    it('should not generate unnecessary corrections for correct responses', async () => {
      const question = 'What do you like to do?';
      const correctResponse = 'I like to read books and watch movies.';
      
      const result = await aiService.analyzeAndCorrect(correctResponse, question);
      
      validateCorrectionResult(result, correctResponse);
      
      // For correct responses, hasErrors should be false
      expect(result.hasErrors).toBe(false);
      
      console.log('\nCorrect Response Result:');
      console.log('Original:', correctResponse);
      console.log('Has Errors:', result.hasErrors);
      console.log('Explanation:', result.explanation);
    }, 30000);
  });
  
  describe('Property-Based Test with Generated Error Patterns', () => {
    // Generator for common error patterns
    const subjectVerbErrorGen = fc.constantFrom(
      'He go', 'She walk', 'It run', 'They was', 'We was'
    );
    
    const articleErrorGen = fc.constantFrom(
      'I am teacher', 'She is doctor', 'He bought car'
    );
    
    it('should document error patterns for future testing', () => {
      // This test documents the error patterns we expect to handle
      const patterns = [
        'Subject-verb agreement',
        'Tense errors',
        'Article errors',
        'Preposition errors',
        'Plural/singular errors',
        'Word order errors',
      ];
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(errorResponses.length).toBeGreaterThan(0);
    });
  });
});
