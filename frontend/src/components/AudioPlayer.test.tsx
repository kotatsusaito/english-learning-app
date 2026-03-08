import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AudioPlayer from './AudioPlayer';

// Mock HTMLAudioElement
class MockAudio {
  src = '';
  paused = true;
  currentTime = 0;
  private listeners: { [key: string]: Function[] } = {};
  play = jest.fn(() => {
    this.paused = false;
    return Promise.resolve();
  });
  pause = jest.fn(() => {
    this.paused = true;
  });

  addEventListener(event: string, handler: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
  }

  removeEventListener(event: string, handler: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(h => h !== handler);
    }
  }

  triggerEvent(event: string) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(handler => handler());
    }
  }
}

describe('AudioPlayer Component', () => {
  let mockAudio: MockAudio;

  beforeEach(() => {
    mockAudio = new MockAudio();
    global.Audio = jest.fn(() => mockAudio) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when no audioUrl is provided', () => {
      const { container } = render(<AudioPlayer />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when audioUrl is provided', () => {
      render(<AudioPlayer audioUrl="https://example.com/audio.mp3" />);
      expect(screen.getByText('Pronunciation')).toBeInTheDocument();
    });

    it('should display loading state initially', () => {
      render(<AudioPlayer audioUrl="https://example.com/audio.mp3" />);
      expect(screen.getByText('Loading audio...')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading audio')).toBeInTheDocument();
    });
  });

  describe('Audio Loading', () => {
    it('should create Audio element with correct URL', () => {
      const audioUrl = 'https://example.com/audio.mp3';
      render(<AudioPlayer audioUrl={audioUrl} />);
      
      expect(global.Audio).toHaveBeenCalledWith(audioUrl);
    });

    it('should display play button when audio is ready', async () => {
      render(<AudioPlayer audioUrl="https://example.com/audio.mp3" />);
      
      act(() => {
        mockAudio.triggerEvent('canplay');
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
      });
    });

    it('should handle audio load error', async () => {
      const onError = jest.fn();
      render(<AudioPlayer audioUrl="https://example.com/audio.mp3" onError={onError} />);
      
      act(() => {
        mockAudio.triggerEvent('error');
      });
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Failed to load audio. Please try again.')).toBeInTheDocument();
        expect(onError).toHaveBeenCalledWith('Failed to load audio. Please try again.');
      });
    });
  });

  describe('Play Functionality', () => {
    it('should play audio when play button is clicked', async () => {
      const user = userEvent.setup();
      render(<AudioPlayer audioUrl="https://example.com/audio.mp3" />);
      
      act(() => {
        mockAudio.triggerEvent('canplay');
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
      });
      
      const playButton = screen.getByLabelText('Play audio');
      await user.click(playButton);
      
      expect(mockAudio.play).toHaveBeenCalled();
      expect(mockAudio.paused).toBe(false);
    });

    it('should show stop button when audio is playing', async () => {
      const user = userEvent.setup();
      render(<AudioPlayer audioUrl="https://example.com/audio.mp3" />);
      
      act(() => {
        mockAudio.triggerEvent('canplay');
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
      });
      
      await user.click(screen.getByLabelText('Play audio'));
      
      await waitFor(() => {
        expect(screen.getByLabelText('Stop audio')).toBeInTheDocument();
      });
    });

    it('should handle play error', async () => {
      const user = userEvent.setup();
      const onError = jest.fn();
      
      mockAudio.play = jest.fn(() => Promise.reject(new Error('Play failed')));
      
      render(<AudioPlayer audioUrl="https://example.com/audio.mp3" onError={onError} />);
      
      act(() => {
        mockAudio.triggerEvent('canplay');
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
      });
      
      await user.click(screen.getByLabelText('Play audio'));
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to play audio. Please try again.');
      });
    });
  });

  describe('Stop Functionality', () => {
    it('should stop audio when stop button is clicked', async () => {
      const user = userEvent.setup();
      render(<AudioPlayer audioUrl="https://example.com/audio.mp3" />);
      
      act(() => {
        mockAudio.triggerEvent('canplay');
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
      });
      
      await user.click(screen.getByLabelText('Play audio'));
      
      await waitFor(() => {
        expect(screen.getByLabelText('Stop audio')).toBeInTheDocument();
      });
      
      await user.click(screen.getByLabelText('Stop audio'));
      
      expect(mockAudio.pause).toHaveBeenCalled();
      expect(mockAudio.currentTime).toBe(0);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
      });
    });

    it('should reset to play button after stopping', async () => {
      const user = userEvent.setup();
      render(<AudioPlayer audioUrl="https://example.com/audio.mp3" />);
      
      act(() => {
        mockAudio.triggerEvent('canplay');
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
      });
      
      await user.click(screen.getByLabelText('Play audio'));
      await user.click(screen.getByLabelText('Stop audio'));
      
      await waitFor(() => {
        expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
        expect(screen.queryByLabelText('Stop audio')).not.toBeInTheDocument();
      });
    });
  });

  describe('Audio Replay Capability (Requirement 5.4)', () => {
    it('should allow playing audio multiple times', async () => {
      const user = userEvent.setup();
      render(<AudioPlayer audioUrl="https://example.com/audio.mp3" />);
      
      act(() => {
        mockAudio.triggerEvent('canplay');
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
      });
      
      // First play
      await user.click(screen.getByLabelText('Play audio'));
      expect(mockAudio.play).toHaveBeenCalledTimes(1);
      
      // Stop
      await user.click(screen.getByLabelText('Stop audio'));
      
      // Second play
      await user.click(screen.getByLabelText('Play audio'));
      expect(mockAudio.play).toHaveBeenCalledTimes(2);
      
      // Stop
      await user.click(screen.getByLabelText('Stop audio'));
      
      // Third play
      await user.click(screen.getByLabelText('Play audio'));
      expect(mockAudio.play).toHaveBeenCalledTimes(3);
    });

    it('should reset to play button when audio ends naturally', async () => {
      const user = userEvent.setup();
      render(<AudioPlayer audioUrl="https://example.com/audio.mp3" />);
      
      act(() => {
        mockAudio.triggerEvent('canplay');
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
      });
      
      await user.click(screen.getByLabelText('Play audio'));
      
      // Simulate audio ending
      act(() => {
        mockAudio.triggerEvent('ended');
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
      });
    });
  });

  describe('URL Changes', () => {
    it('should load new audio when URL changes', () => {
      const { rerender } = render(<AudioPlayer audioUrl="https://example.com/audio1.mp3" />);
      
      expect(global.Audio).toHaveBeenCalledWith('https://example.com/audio1.mp3');
      
      rerender(<AudioPlayer audioUrl="https://example.com/audio2.mp3" />);
      
      expect(global.Audio).toHaveBeenCalledWith('https://example.com/audio2.mp3');
    });

    it('should stop playing when URL changes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<AudioPlayer audioUrl="https://example.com/audio1.mp3" />);
      
      act(() => {
        mockAudio.triggerEvent('canplay');
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
      });
      
      await user.click(screen.getByLabelText('Play audio'));
      
      await waitFor(() => {
        expect(screen.getByLabelText('Stop audio')).toBeInTheDocument();
      });
      
      rerender(<AudioPlayer audioUrl="https://example.com/audio2.mp3" />);
      
      expect(mockAudio.pause).toHaveBeenCalled();
    });

    it('should unmount cleanly when URL is removed', async () => {
      const { rerender } = render(<AudioPlayer audioUrl="https://example.com/audio.mp3" />);
      
      act(() => {
        mockAudio.triggerEvent('canplay');
      });
      
      await waitFor(() => {
        expect(screen.getByLabelText('Play audio')).toBeInTheDocument();
      });
      
      rerender(<AudioPlayer />);
      
      expect(mockAudio.pause).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup audio element on unmount', () => {
      const { unmount } = render(<AudioPlayer audioUrl="https://example.com/audio.mp3" />);
      
      unmount();
      
      expect(mockAudio.pause).toHaveBeenCalled();
      expect(mockAudio.src).toBe('');
    });
  });
});
