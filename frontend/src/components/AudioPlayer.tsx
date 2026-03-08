import React, { useState, useRef, useEffect } from 'react';
import './AudioPlayer.css';

interface AudioPlayerProps {
  audioUrl?: string;
  text?: string; // Add text prop for Web Speech API
  onError?: (error: string) => void;
}

/**
 * AudioPlayer component manages audio playback for corrected text
 * Provides play/stop controls and manages playback state
 * 
 * Requirements: 5.3, 5.4
 */
const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  text,
  onError
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useSpeechAPI, setUseSpeechAPI] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if Web Speech API is available
  useEffect(() => {
    if ('speechSynthesis' in window) {
      setUseSpeechAPI(true);
      
      // Load voices (some browsers need this)
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.map(v => v.name));
      };
      
      // Load voices immediately
      loadVoices();
      
      // Also load when voices change (for Chrome)
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // Load audio when URL changes (for backend audio)
  useEffect(() => {
    if (!audioUrl || useSpeechAPI) {
      setIsPlaying(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Create new audio element
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    // Handle audio events
    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleError = () => {
      // Fallback to Web Speech API if audio fails
      console.log('Audio failed, falling back to Web Speech API');
      setUseSpeechAPI(true);
      setIsLoading(false);
      setError(null);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    // Cleanup
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl, useSpeechAPI]);

  const handlePlay = async () => {
    // Use Web Speech API if available and text is provided
    if (useSpeechAPI && text) {
      try {
        setError(null);
        
        // Stop any ongoing speech
        window.speechSynthesis.cancel();
        
        // Get available voices
        const voices = window.speechSynthesis.getVoices();
        
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.85; // Slightly slower for learning
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Try to find a high-quality English voice
        // Prefer Google, Microsoft, or Apple voices
        const preferredVoice = voices.find(voice => 
          voice.lang.startsWith('en') && 
          (voice.name.includes('Google') || 
           voice.name.includes('Microsoft') || 
           voice.name.includes('Samantha') || // macOS
           voice.name.includes('Karen') || // macOS
           voice.name.includes('Daniel') || // macOS
           voice.name.includes('Moira') || // macOS
           voice.name.includes('Natural'))
        );
        
        // Fallback to any English voice
        const englishVoice = preferredVoice || voices.find(voice => 
          voice.lang.startsWith('en')
        );
        
        if (englishVoice) {
          utterance.voice = englishVoice;
          console.log('Using voice:', englishVoice.name);
        }
        
        utterance.onstart = () => {
          setIsPlaying(true);
        };
        
        utterance.onend = () => {
          setIsPlaying(false);
        };
        
        utterance.onerror = (event) => {
          const errorMessage = 'Failed to play audio. Please try again.';
          setError(errorMessage);
          setIsPlaying(false);
          if (onError) {
            onError(errorMessage);
          }
        };
        
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        const errorMessage = 'Failed to play audio. Please try again.';
        setError(errorMessage);
        setIsPlaying(false);
        if (onError) {
          onError(errorMessage);
        }
      }
      return;
    }

    // Fallback to audio element
    if (!audioRef.current) return;

    try {
      setError(null);
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      const errorMessage = 'Failed to play audio. Please try again.';
      setError(errorMessage);
      setIsPlaying(false);
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const handleStop = () => {
    // Stop Web Speech API
    if (useSpeechAPI) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Stop audio element
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  if (!audioUrl && !text) {
    return null;
  }

  return (
    <div className="audio-player">
      <h3 className="audio-player__title">Pronunciation</h3>
      
      <div className="audio-player__controls">
        {isLoading ? (
          <div className="audio-player__loading">
            <div className="spinner-small" aria-label="Loading audio"></div>
            <span>Loading audio...</span>
          </div>
        ) : error ? (
          <div className="audio-player__error" role="alert">
            <span className="error-icon-small">⚠️</span>
            <span>{error}</span>
          </div>
        ) : (
          <>
            {isPlaying ? (
              <button
                onClick={handleStop}
                className="audio-player__btn audio-player__btn--stop"
                aria-label="Stop audio"
              >
                <span className="btn-icon">⏹</span>
                Stop
              </button>
            ) : (
              <button
                onClick={handlePlay}
                className="audio-player__btn audio-player__btn--play"
                aria-label="Play audio"
              >
                <span className="btn-icon">▶</span>
                Play
              </button>
            )}
            
            <span className="audio-player__hint">
              Listen to the correct pronunciation
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;
