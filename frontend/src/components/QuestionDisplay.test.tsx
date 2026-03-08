import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuestionDisplay from './QuestionDisplay';

describe('QuestionDisplay Component', () => {
  describe('Question Display', () => {
    it('should display the question text when provided', () => {
      const question = 'What is your favorite hobby?';
      render(<QuestionDisplay question={question} />);
      
      expect(screen.getByText(question)).toBeInTheDocument();
    });

    it('should display multiple questions correctly', () => {
      const question1 = 'Where do you live?';
      const { rerender } = render(<QuestionDisplay question={question1} />);
      expect(screen.getByText(question1)).toBeInTheDocument();
      
      const question2 = 'What do you do for work?';
      rerender(<QuestionDisplay question={question2} />);
      expect(screen.getByText(question2)).toBeInTheDocument();
      expect(screen.queryByText(question1)).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading indicator when isLoading is true', () => {
      render(<QuestionDisplay isLoading={true} />);
      
      expect(screen.getByText('Generating question...')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading question')).toBeInTheDocument();
    });

    it('should not display question text when loading', () => {
      const question = 'What is your name?';
      render(<QuestionDisplay question={question} isLoading={true} />);
      
      expect(screen.getByText('Generating question...')).toBeInTheDocument();
      expect(screen.queryByText(question)).not.toBeInTheDocument();
    });

    it('should hide loading indicator when isLoading becomes false', () => {
      const { rerender } = render(<QuestionDisplay isLoading={true} />);
      expect(screen.getByText('Generating question...')).toBeInTheDocument();
      
      rerender(<QuestionDisplay isLoading={false} question="Test question" />);
      expect(screen.queryByText('Generating question...')).not.toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display error message when error prop is provided', () => {
      const errorMessage = 'Failed to generate question. Please try again.';
      render(<QuestionDisplay error={errorMessage} />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should not display question when error is present', () => {
      const question = 'What is your name?';
      const error = 'Network error';
      render(<QuestionDisplay question={question} error={error} />);
      
      expect(screen.getByText(error)).toBeInTheDocument();
      expect(screen.queryByText(question)).not.toBeInTheDocument();
    });

    it('should display error icon with error message', () => {
      render(<QuestionDisplay error="Test error" />);
      
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state message when no question is provided', () => {
      render(<QuestionDisplay />);
      
      expect(screen.getByText('No question yet. Start a session to begin!')).toBeInTheDocument();
    });

    it('should not display empty state when question is provided', () => {
      render(<QuestionDisplay question="Test question" />);
      
      expect(screen.queryByText('No question yet. Start a session to begin!')).not.toBeInTheDocument();
    });
  });

  describe('Priority Handling', () => {
    it('should prioritize loading state over error', () => {
      render(<QuestionDisplay isLoading={true} error="Some error" />);
      
      expect(screen.getByText('Generating question...')).toBeInTheDocument();
      expect(screen.queryByText('Some error')).not.toBeInTheDocument();
    });

    it('should prioritize error over question', () => {
      render(<QuestionDisplay question="Test question" error="Some error" />);
      
      expect(screen.getByText('Some error')).toBeInTheDocument();
      expect(screen.queryByText('Test question')).not.toBeInTheDocument();
    });

    it('should prioritize loading over all other states', () => {
      render(<QuestionDisplay isLoading={true} question="Test" error="Error" />);
      
      expect(screen.getByText('Generating question...')).toBeInTheDocument();
      expect(screen.queryByText('Test')).not.toBeInTheDocument();
      expect(screen.queryByText('Error')).not.toBeInTheDocument();
    });
  });
});
