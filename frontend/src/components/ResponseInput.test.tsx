import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResponseInput from './ResponseInput';

describe('ResponseInput Component', () => {
  describe('Basic Rendering', () => {
    it('should render the component with title', () => {
      const mockOnSubmit = jest.fn();
      render(<ResponseInput onSubmit={mockOnSubmit} />);
      
      expect(screen.getByText('Your Response')).toBeInTheDocument();
    });

    it('should render textarea with default placeholder', () => {
      const mockOnSubmit = jest.fn();
      render(<ResponseInput onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByLabelText('Response input');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('placeholder', 'Type your response in English...');
    });

    it('should render textarea with custom placeholder', () => {
      const mockOnSubmit = jest.fn();
      const customPlaceholder = 'Custom placeholder text';
      render(<ResponseInput onSubmit={mockOnSubmit} placeholder={customPlaceholder} />);
      
      const textarea = screen.getByLabelText('Response input');
      expect(textarea).toHaveAttribute('placeholder', customPlaceholder);
    });

    it('should render submit button', () => {
      const mockOnSubmit = jest.fn();
      render(<ResponseInput onSubmit={mockOnSubmit} />);
      
      expect(screen.getByRole('button', { name: 'Submit Response' })).toBeInTheDocument();
    });

    it('should render keyboard hint', () => {
      const mockOnSubmit = jest.fn();
      render(<ResponseInput onSubmit={mockOnSubmit} />);
      
      expect(screen.getByText('Press Ctrl+Enter to submit')).toBeInTheDocument();
    });
  });

  describe('Input Handling - Requirement 2.2', () => {
    it('should display text as user types in real-time', () => {
      const mockOnSubmit = jest.fn();
      render(<ResponseInput onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByLabelText('Response input') as HTMLTextAreaElement;
      
      // Type text
      fireEvent.change(textarea, { target: { value: 'Hello' } });
      expect(textarea.value).toBe('Hello');
      
      // Type more text
      fireEvent.change(textarea, { target: { value: 'Hello World' } });
      expect(textarea.value).toBe('Hello World');
    });

    it('should show character count when text is entered', () => {
      const mockOnSubmit = jest.fn();
      render(<ResponseInput onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByLabelText('Response input');
      
      // Initially no character count
      expect(screen.queryByText(/characters/)).not.toBeInTheDocument();
      
      // Type text
      fireEvent.change(textarea, { target: { value: 'Hello' } });
      expect(screen.getByText('5 characters')).toBeInTheDocument();
      
      // Type more text
      fireEvent.change(textarea, { target: { value: 'Hello World!' } });
      expect(screen.getByText('12 characters')).toBeInTheDocument();
    });
  });

  describe('Submit Functionality - Requirement 2.3', () => {
    it('should call onSubmit with text when form is submitted', () => {
      const mockOnSubmit = jest.fn();
      render(<ResponseInput onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByLabelText('Response input');
      const submitButton = screen.getByRole('button', { name: 'Submit Response' });
      
      // Type text
      fireEvent.change(textarea, { target: { value: 'My response' } });
      
      // Submit
      fireEvent.click(submitButton);
      
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith('My response');
    });

    it('should clear input after successful submission', () => {
      const mockOnSubmit = jest.fn();
      render(<ResponseInput onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByLabelText('Response input') as HTMLTextAreaElement;
      const submitButton = screen.getByRole('button', { name: 'Submit Response' });
      
      // Type and submit
      fireEvent.change(textarea, { target: { value: 'Test response' } });
      fireEvent.click(submitButton);
      
      // Input should be cleared
      expect(textarea.value).toBe('');
    });

    it('should not submit empty or whitespace-only text', () => {
      const mockOnSubmit = jest.fn();
      render(<ResponseInput onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByLabelText('Response input');
      const submitButton = screen.getByRole('button', { name: 'Submit Response' });
      
      // Try to submit empty
      fireEvent.click(submitButton);
      expect(mockOnSubmit).not.toHaveBeenCalled();
      
      // Try to submit whitespace only
      fireEvent.change(textarea, { target: { value: '   ' } });
      fireEvent.click(submitButton);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should submit on Ctrl+Enter keyboard shortcut', () => {
      const mockOnSubmit = jest.fn();
      render(<ResponseInput onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByLabelText('Response input');
      
      // Type text
      fireEvent.change(textarea, { target: { value: 'Quick submit' } });
      
      // Press Ctrl+Enter
      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
      
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith('Quick submit');
    });

    it('should submit on Cmd+Enter keyboard shortcut (Mac)', () => {
      const mockOnSubmit = jest.fn();
      render(<ResponseInput onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByLabelText('Response input');
      
      // Type text
      fireEvent.change(textarea, { target: { value: 'Mac submit' } });
      
      // Press Cmd+Enter
      fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });
      
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith('Mac submit');
    });

    it('should not submit on Enter without modifier keys', () => {
      const mockOnSubmit = jest.fn();
      render(<ResponseInput onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByLabelText('Response input');
      
      // Type text
      fireEvent.change(textarea, { target: { value: 'Test' } });
      
      // Press Enter alone (should allow newline)
      fireEvent.keyDown(textarea, { key: 'Enter' });
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State - Requirement 2.1', () => {
    it('should disable textarea when disabled prop is true', () => {
      const mockOnSubmit = jest.fn();
      render(<ResponseInput onSubmit={mockOnSubmit} disabled={true} />);
      
      const textarea = screen.getByLabelText('Response input');
      expect(textarea).toBeDisabled();
    });

    it('should disable submit button when disabled prop is true', () => {
      const mockOnSubmit = jest.fn();
      render(<ResponseInput onSubmit={mockOnSubmit} disabled={true} />);
      
      const submitButton = screen.getByRole('button', { name: 'Submit Response' });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when input is empty', () => {
      const mockOnSubmit = jest.fn();
      render(<ResponseInput onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByRole('button', { name: 'Submit Response' });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when input has text', () => {
      const mockOnSubmit = jest.fn();
      render(<ResponseInput onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByLabelText('Response input');
      const submitButton = screen.getByRole('button', { name: 'Submit Response' });
      
      // Initially disabled
      expect(submitButton).toBeDisabled();
      
      // Type text
      fireEvent.change(textarea, { target: { value: 'Some text' } });
      
      // Should be enabled
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long text input', () => {
      const mockOnSubmit = jest.fn();
      render(<ResponseInput onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByLabelText('Response input') as HTMLTextAreaElement;
      const longText = 'a'.repeat(1000);
      
      fireEvent.change(textarea, { target: { value: longText } });
      
      expect(textarea.value).toBe(longText);
      expect(screen.getByText('1000 characters')).toBeInTheDocument();
    });

    it('should handle special characters and unicode', () => {
      const mockOnSubmit = jest.fn();
      render(<ResponseInput onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByLabelText('Response input');
      const specialText = 'Hello 世界! 🌍 @#$%';
      
      fireEvent.change(textarea, { target: { value: specialText } });
      
      const submitButton = screen.getByRole('button', { name: 'Submit Response' });
      fireEvent.click(submitButton);
      
      expect(mockOnSubmit).toHaveBeenCalledWith(specialText);
    });

    it('should preserve newlines in multi-line input', () => {
      const mockOnSubmit = jest.fn();
      render(<ResponseInput onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByLabelText('Response input');
      const multiLineText = 'Line 1\nLine 2\nLine 3';
      
      fireEvent.change(textarea, { target: { value: multiLineText } });
      
      const submitButton = screen.getByRole('button', { name: 'Submit Response' });
      fireEvent.click(submitButton);
      
      expect(mockOnSubmit).toHaveBeenCalledWith(multiLineText);
    });
  });
});
