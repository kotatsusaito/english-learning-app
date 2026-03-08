import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CorrectionDisplay from './CorrectionDisplay';
import { Correction } from '@english-learning-app/shared';

describe('CorrectionDisplay', () => {
  describe('when no correction is provided', () => {
    it('should render nothing', () => {
      const { container } = render(<CorrectionDisplay />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('when response is correct (no errors)', () => {
    const correctCorrection: Correction = {
      hasErrors: false,
      originalText: 'I went to the store yesterday.',
      correctedText: 'I went to the store yesterday.',
      explanation: '',
      suggestions: []
    };

    it('should display positive feedback', () => {
      render(<CorrectionDisplay correction={correctCorrection} />);
      
      expect(screen.getByText('Great job!')).toBeInTheDocument();
      expect(screen.getByText('Your response is grammatically correct!')).toBeInTheDocument();
    });

    it('should display the original response', () => {
      render(<CorrectionDisplay correction={correctCorrection} />);
      
      expect(screen.getByText('Your response:')).toBeInTheDocument();
      expect(screen.getByText('I went to the store yesterday.')).toBeInTheDocument();
    });

    it('should display suggestions when provided', () => {
      const correctionWithSuggestions: Correction = {
        ...correctCorrection,
        suggestions: [
          'You could also say: "I visited the store yesterday."',
          'Alternative: "I stopped by the store yesterday."'
        ]
      };

      render(<CorrectionDisplay correction={correctionWithSuggestions} />);
      
      expect(screen.getByText('Alternative expressions:')).toBeInTheDocument();
      expect(screen.getByText('You could also say: "I visited the store yesterday."')).toBeInTheDocument();
      expect(screen.getByText('Alternative: "I stopped by the store yesterday."')).toBeInTheDocument();
    });

    it('should not display suggestions section when no suggestions', () => {
      render(<CorrectionDisplay correction={correctCorrection} />);
      
      expect(screen.queryByText('Alternative expressions:')).not.toBeInTheDocument();
    });
  });

  describe('when response has errors', () => {
    const correctionWithErrors: Correction = {
      hasErrors: true,
      originalText: 'I goed to the store yesterday.',
      correctedText: 'I went to the store yesterday.',
      explanation: 'The past tense of "go" is "went", not "goed".',
      suggestions: ['Remember: irregular verbs have special past tense forms.']
    };

    it('should display both original and corrected text', () => {
      render(<CorrectionDisplay correction={correctionWithErrors} />);
      
      expect(screen.getByText('Your Response')).toBeInTheDocument();
      expect(screen.getByText('Corrected Version')).toBeInTheDocument();
      expect(screen.getByText('I goed to the store yesterday.')).toBeInTheDocument();
      expect(screen.getByText('I went to the store yesterday.')).toBeInTheDocument();
    });

    it('should display explanation when provided', () => {
      render(<CorrectionDisplay correction={correctionWithErrors} />);
      
      expect(screen.getByText('Explanation')).toBeInTheDocument();
      expect(screen.getByText('The past tense of "go" is "went", not "goed".')).toBeInTheDocument();
    });

    it('should display suggestions when provided', () => {
      render(<CorrectionDisplay correction={correctionWithErrors} />);
      
      expect(screen.getByText('Suggestions for Improvement')).toBeInTheDocument();
      expect(screen.getByText('Remember: irregular verbs have special past tense forms.')).toBeInTheDocument();
    });

    it('should not display explanation section when explanation is empty', () => {
      const correctionNoExplanation: Correction = {
        ...correctionWithErrors,
        explanation: ''
      };

      render(<CorrectionDisplay correction={correctionNoExplanation} />);
      
      expect(screen.queryByText('Explanation')).not.toBeInTheDocument();
    });

    it('should not display suggestions section when no suggestions', () => {
      const correctionNoSuggestions: Correction = {
        ...correctionWithErrors,
        suggestions: []
      };

      render(<CorrectionDisplay correction={correctionNoSuggestions} />);
      
      expect(screen.queryByText('Suggestions for Improvement')).not.toBeInTheDocument();
    });
  });

  describe('Requirements validation', () => {
    it('should preserve and display original user response (Req 3.1, 3.2)', () => {
      const correction: Correction = {
        hasErrors: true,
        originalText: 'She dont like apples.',
        correctedText: "She doesn't like apples.",
        explanation: 'Use "doesn\'t" for third person singular.',
        suggestions: []
      };

      render(<CorrectionDisplay correction={correction} />);
      
      // Original text should be displayed exactly as submitted
      expect(screen.getByText('She dont like apples.')).toBeInTheDocument();
    });

    it('should maintain display of original response while showing corrections (Req 3.3)', () => {
      const correction: Correction = {
        hasErrors: true,
        originalText: 'They was happy.',
        correctedText: 'They were happy.',
        explanation: 'Use "were" with plural subjects.',
        suggestions: []
      };

      render(<CorrectionDisplay correction={correction} />);
      
      // Both original and corrected should be visible
      expect(screen.getByText('They was happy.')).toBeInTheDocument();
      expect(screen.getByText('They were happy.')).toBeInTheDocument();
    });

    it('should display original and corrected text in clear comparative format (Req 4.4)', () => {
      const correction: Correction = {
        hasErrors: true,
        originalText: 'He have a car.',
        correctedText: 'He has a car.',
        explanation: 'Use "has" for third person singular.',
        suggestions: []
      };

      const { container } = render(<CorrectionDisplay correction={correction} />);
      
      // Check that comparison layout exists
      const comparisonSection = container.querySelector('.correction-display__comparison');
      expect(comparisonSection).toBeInTheDocument();
      
      // Check that both sections are present
      expect(screen.getByText('Your Response')).toBeInTheDocument();
      expect(screen.getByText('Corrected Version')).toBeInTheDocument();
    });

    it('should indicate when response is correct (Req 4.5)', () => {
      const correction: Correction = {
        hasErrors: false,
        originalText: 'The weather is nice today.',
        correctedText: 'The weather is nice today.',
        explanation: '',
        suggestions: []
      };

      render(<CorrectionDisplay correction={correction} />);
      
      expect(screen.getByText('Your response is grammatically correct!')).toBeInTheDocument();
    });
  });
});
