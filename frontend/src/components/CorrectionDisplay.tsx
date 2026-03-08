import React from 'react';
import { Correction } from '@english-learning-app/shared';
import './CorrectionDisplay.css';

interface CorrectionDisplayProps {
  correction?: Correction;
}

/**
 * CorrectionDisplay component displays original response and correction results
 * Shows side-by-side comparison when corrections exist
 * Shows positive feedback when response is correct
 * 
 * Requirements: 3.1, 3.2, 3.3, 4.4, 4.5
 */
const CorrectionDisplay: React.FC<CorrectionDisplayProps> = ({ correction }) => {
  if (!correction) {
    return null;
  }

  // Display for correct responses (no errors)
  if (!correction.hasErrors) {
    return (
      <div className="correction-display">
        <h2 className="correction-display__title">Feedback</h2>
        
        <div className="correction-display__correct">
          <div className="correction-display__icon">✓</div>
          <div className="correction-display__correct-content">
            <h3>Great job!</h3>
            <p className="correction-display__correct-text">
              Your response is grammatically correct!
            </p>
            <div className="correction-display__original-response">
              <strong>Your response:</strong>
              <p>{correction.originalText}</p>
            </div>
            {correction.suggestions.length > 0 && (
              <div className="correction-display__suggestions">
                <strong>Alternative expressions:</strong>
                <ul>
                  {correction.suggestions.map((suggestion: string, index: number) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Display for responses with corrections
  return (
    <div className="correction-display">
      <h2 className="correction-display__title">Feedback & Corrections</h2>
      
      <div className="correction-display__comparison">
        {/* Original Response */}
        <div className="correction-display__section correction-display__section--original">
          <h3 className="correction-display__section-title">Your Response</h3>
          <div className="correction-display__text-box correction-display__text-box--original">
            <p>{correction.originalText}</p>
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="correction-display__arrow" aria-hidden="true">
          →
        </div>

        {/* Corrected Response */}
        <div className="correction-display__section correction-display__section--corrected">
          <h3 className="correction-display__section-title">Corrected Version</h3>
          <div className="correction-display__text-box correction-display__text-box--corrected">
            <p>{correction.correctedText}</p>
          </div>
        </div>
      </div>

      {/* Explanation */}
      {correction.explanation && (
        <div className="correction-display__explanation">
          <h3 className="correction-display__explanation-title">Explanation</h3>
          <p>{correction.explanation}</p>
        </div>
      )}

      {/* Suggestions */}
      {correction.suggestions.length > 0 && (
        <div className="correction-display__suggestions">
          <h3 className="correction-display__suggestions-title">Suggestions for Improvement</h3>
          <ul>
            {correction.suggestions.map((suggestion: string, index: number) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CorrectionDisplay;
