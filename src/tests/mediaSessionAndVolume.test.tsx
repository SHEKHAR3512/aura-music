import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { mediaSessionService } from '../lib/media/MediaSessionService';
import { usePlayerStore } from '../stores/playerStore';
import { VolumeHUD } from '../components/ui/VolumeHUD';
import { Song } from '../lib/music/types';

const testSong: Song = {
  id: 'test-mac-track',
  title: 'Starboy (Cinematic)',
  primaryArtist: 'The Weeknd',
  artists: [{ id: '1', name: 'The Weeknd' }],
  album: { id: 'alb-1', title: 'Starboy Deluxe' },
  duration: 230,
  year: 2026,
  language: 'English',
  audioUrl: 'https://example.com/audio.mp3',
  artwork: {
    low: 'https://example.com/low.jpg',
    medium: 'https://example.com/med.jpg',
    high: 'https://example.com/high.jpg',
  },
  explicit: false,
  hasLyrics: true,
  source: 'curated',
  sourceId: 'starboy-1',
};

describe('macOS Native Media Controls & Apple Player Integration', () => {
  let mockActionHandlers: Record<string, Function> = {};
  let mockMetadata: any = null;
  let mockPlaybackState: string = 'none';
  let mockPositionState: any = null;

  beforeEach(() => {
    vi.useFakeTimers();
    mockActionHandlers = {};
    mockMetadata = null;
    mockPlaybackState = 'none';
    mockPositionState = null;

    // Mock navigator.mediaSession
    Object.defineProperty(navigator, 'mediaSession', {
      writable: true,
      configurable: true,
      value: {
        setActionHandler: (action: string, handler: Function) => {
          mockActionHandlers[action] = handler;
        },
        get metadata() {
          return mockMetadata;
        },
        set metadata(val: any) {
          mockMetadata = val;
        },
        get playbackState() {
          return mockPlaybackState;
        },
        set playbackState(val: string) {
          mockPlaybackState = val;
        },
        setPositionState: (pos: any) => {
          mockPositionState = pos;
        },
      },
    });

    // Mock MediaMetadata constructor
    (window as any).MediaMetadata = class MockMediaMetadata {
      title: string;
      artist: string;
      album: string;
      artwork: any[];
      constructor(init: any) {
        this.title = init.title;
        this.artist = init.artist;
        this.album = init.album;
        this.artwork = init.artwork;
      }
    };
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('1. MediaSessionService (macOS Control Center, Touch Bar, Lock Screen & AirPods)', () => {
    it('registers all required macOS Now Playing action handlers', () => {
      const handlers = {
        onPlay: vi.fn(),
        onPause: vi.fn(),
        onPreviousTrack: vi.fn(),
        onNextTrack: vi.fn(),
        onSeekTo: vi.fn(),
        onSeekBackward: vi.fn(),
        onSeekForward: vi.fn(),
        onStop: vi.fn(),
      };

      mediaSessionService.init(handlers);

      expect(typeof mockActionHandlers['play']).toBe('function');
      expect(typeof mockActionHandlers['pause']).toBe('function');
      expect(typeof mockActionHandlers['previoustrack']).toBe('function');
      expect(typeof mockActionHandlers['nexttrack']).toBe('function');
      expect(typeof mockActionHandlers['seekto']).toBe('function');
      expect(typeof mockActionHandlers['seekbackward']).toBe('function');
      expect(typeof mockActionHandlers['seekforward']).toBe('function');
      expect(typeof mockActionHandlers['stop']).toBe('function');

      // Trigger actions as macOS Now Playing / Touch Bar would
      mockActionHandlers['play']();
      expect(handlers.onPlay).toHaveBeenCalled();

      mockActionHandlers['pause']();
      expect(handlers.onPause).toHaveBeenCalled();

      mockActionHandlers['nexttrack']();
      expect(handlers.onNextTrack).toHaveBeenCalled();

      mockActionHandlers['previoustrack']();
      expect(handlers.onPreviousTrack).toHaveBeenCalled();

      mockActionHandlers['seekto']({ seekTime: 45 });
      expect(handlers.onSeekTo).toHaveBeenCalledWith(45);

      mockActionHandlers['seekbackward']({ seekOffset: 15 });
      expect(handlers.onSeekBackward).toHaveBeenCalledWith(15);

      mockActionHandlers['seekforward']({ seekOffset: 15 });
      expect(handlers.onSeekForward).toHaveBeenCalledWith(15);
    });

    it('updates metadata with absolute URLs for WebKit macOS compatibility', () => {
      mediaSessionService.updateMetadata(testSong);

      expect(mockMetadata).not.toBeNull();
      expect(mockMetadata.title).toBe('Starboy (Cinematic)');
      expect(mockMetadata.artist).toBe('The Weeknd');
      expect(mockMetadata.album).toBe('Starboy Deluxe');
      expect(mockMetadata.artwork.length).toBeGreaterThan(0);
      expect(mockMetadata.artwork[0].src).toContain('https://example.com');
    });

    it('synchronizes playbackState between playing and paused for MacBook Touch Bar toggling', () => {
      mediaSessionService.updatePlaybackState(true);
      expect(navigator.mediaSession.playbackState).toBe('playing');

      mediaSessionService.updatePlaybackState(false);
      expect(navigator.mediaSession.playbackState).toBe('paused');
    });

    it('updates timeline position state for macOS Touch Bar and Control Center scrubber', () => {
      mediaSessionService.updatePositionState(60, 230, 1.0);
      expect(mockPositionState).not.toBeNull();
      expect(mockPositionState.position).toBe(60);
      expect(mockPositionState.duration).toBe(230);
      expect(mockPositionState.playbackRate).toBe(1.0);
    });
  });

  describe('2. Volume Controls & On-Screen Volume HUD', () => {
    it('adjusts volume via adjustVolume helper', () => {
      usePlayerStore.setState({ volume: 0.5, isMuted: false });
      
      usePlayerStore.getState().adjustVolume(0.05);
      expect(usePlayerStore.getState().volume).toBeCloseTo(0.55);

      usePlayerStore.getState().adjustVolume(-0.1);
      expect(usePlayerStore.getState().volume).toBeCloseTo(0.45);
    });

    it('clamps volume within [0, 1] range', () => {
      usePlayerStore.setState({ volume: 0.95 });
      usePlayerStore.getState().adjustVolume(0.2);
      expect(usePlayerStore.getState().volume).toBe(1.0);

      usePlayerStore.getState().adjustVolume(-1.5);
      expect(usePlayerStore.getState().volume).toBe(0.0);
    });

    it('displays Apple-style Volume HUD when volume changes and dismisses after inactivity', () => {
      usePlayerStore.setState({ volume: 0.7, isMuted: false });

      render(<VolumeHUD />);

      // On initial render, HUD is suppressed
      expect(screen.queryByRole('status')).not.toBeInTheDocument();

      // Trigger volume change
      act(() => {
        usePlayerStore.getState().setVolume(0.85);
      });

      // HUD appears
      const hud = screen.getByRole('status');
      expect(hud).toBeInTheDocument();
      expect(hud).toHaveTextContent('85%');

      // Advances past timeout (1400ms)
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      // HUD auto-dismisses
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('displays Muted status in Volume HUD when isMuted is true', () => {
      usePlayerStore.setState({ volume: 0.5, isMuted: false });

      render(<VolumeHUD />);

      act(() => {
        usePlayerStore.setState({ isMuted: true, volume: 0 });
      });

      const hud = screen.getByRole('status');
      expect(hud).toBeInTheDocument();
      expect(hud).toHaveTextContent('Muted');
    });
  });
});
