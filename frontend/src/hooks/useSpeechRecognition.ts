import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

/**
 * Custom hook for speech recognition
 * Provides a clean interface to the Web Speech API
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    lang = 'en-US',
    continuous = true,
    interimResults = true,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const isInitializedRef = useRef(false);

  // Initialize speech recognition
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.log('Speech recognition not supported');
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;
      
      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart + ' ';
          }
        }

        if (finalTranscript) {
          finalTranscriptRef.current += finalTranscript;
          setTranscript(finalTranscriptRef.current);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          if (onError) {
            const errorMessage = getErrorMessage(event.error);
            onError(errorMessage);
          }
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      setIsSupported(true);
      isInitializedRef.current = true;
      console.log('Speech recognition initialized');
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [lang, continuous, interimResults, onError]);

  const startListening = useCallback(() => {
    console.log('startListening called, isSupported:', isSupported, 'isListening:', isListening);
    
    if (!recognitionRef.current) {
      console.error('Recognition not initialized');
      if (onError) {
        onError('Speech recognition is not supported in your browser.');
      }
      return;
    }

    if (isListening) {
      console.log('Already listening, ignoring start request');
      return;
    }

    try {
      recognitionRef.current.start();
      console.log('Recognition start called');
    } catch (error: any) {
      console.error('Failed to start speech recognition:', error);
      
      // If already started, just update state
      if (error.message && error.message.includes('already started')) {
        setIsListening(true);
      } else if (onError) {
        onError('Failed to start speech recognition. Please try again.');
      }
    }
  }, [isSupported, isListening, onError]);

  const stopListening = useCallback(() => {
    console.log('stopListening called');
    
    if (!recognitionRef.current) {
      return;
    }

    try {
      recognitionRef.current.stop();
      console.log('Recognition stop called');
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
    
    // Always update state
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  };
}

/**
 * Get user-friendly error message from speech recognition error code
 */
function getErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'no-speech':
      return 'No speech detected. Please try again.';
    case 'audio-capture':
      return 'Microphone not found. Please check your device.';
    case 'not-allowed':
      return 'Microphone access denied. Please allow microphone access.';
    case 'network':
      return 'Network error. Please check your connection.';
    case 'aborted':
      return 'Speech recognition was aborted.';
    default:
      return 'Speech recognition error. Please try again.';
  }
}
