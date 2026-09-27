import { Song } from '../music/types';

export interface MediaSessionHandlers {
  onPlay: () => void;
  onPause: () => void;
  onPreviousTrack: () => void;
  onNextTrack: () => void;
  onSeekTo: (time: number) => void;
  onSeekBackward: (offset: number) => void;
  onSeekForward: (offset: number) => void;
  onStop: () => void;
}

class MediaSessionService {
  private get isSupported(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'mediaSession' in navigator;
  }
  private currentTrackId: string | null = null;
  private lastPositionUpdate = 0;
  private handlers: MediaSessionHandlers | null = null;

  /**
   * Initialize Media Session action handlers for macOS Control Center, Touch Bar,
   * Apple keyboard media keys (F7, F8, F9), Lock Screen & AirPods controls.
   */
  public init(handlers: MediaSessionHandlers) {
    if (!this.isSupported) return;
    this.handlers = handlers;

    const ms = navigator.mediaSession;

    // Helper to safely assign action handlers
    const setHandler = (action: MediaSessionAction, fn: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(action, fn);
      } catch (err) {
        // Some browsers may not support specific actions (e.g. seekforward)
        console.debug(`MediaSession action [${action}] not supported:`, err);
      }
    };

    // MacBook Play / Pause (MediaKey F8, Touch Bar, AirPods single tap)
    setHandler('play', () => {
      this.handlers?.onPlay();
    });

    setHandler('pause', () => {
      this.handlers?.onPause();
    });

    // MacBook Skip Previous (MediaKey F7, Touch Bar, AirPods triple tap)
    setHandler('previoustrack', () => {
      this.handlers?.onPreviousTrack();
    });

    // MacBook Skip Next (MediaKey F9, Touch Bar, AirPods double tap)
    setHandler('nexttrack', () => {
      this.handlers?.onNextTrack();
    });

    // MacBook Touch Bar / macOS Control Center scrub bar seeking
    setHandler('seekto', (details) => {
      if (details.seekTime !== undefined && isFinite(details.seekTime)) {
        this.handlers?.onSeekTo(details.seekTime);
      }
    });

    // MacBook Touch Bar / AirPods skip backward (default: 10s)
    setHandler('seekbackward', (details) => {
      const offset = details.seekOffset || 10;
      this.handlers?.onSeekBackward(offset);
    });

    // MacBook Touch Bar / AirPods skip forward (default: 10s)
    setHandler('seekforward', (details) => {
      const offset = details.seekOffset || 10;
      this.handlers?.onSeekForward(offset);
    });

    // Stop action
    setHandler('stop', () => {
      this.handlers?.onStop();
    });
  }

  /**
   * Synchronize track metadata with macOS Now Playing (Control Center, Touch Bar, Lock Screen)
   */
  public updateMetadata(song: Song | null) {
    if (!this.isSupported || !song) return;

    // Avoid redundant updates for the exact same track
    this.currentTrackId = song.id;

    // WebKit / macOS requires absolute URLs for artwork rendering
    const toAbsolute = (url?: string): string => {
      if (!url) return '';
      try {
        return new URL(url, window.location.href).href;
      } catch {
        return url;
      }
    };

    const title = song.title || 'Unknown Title';
    const artist =
      song.primaryArtist ||
      (Array.isArray(song.artists) && song.artists.length > 0
        ? song.artists.map((a) => a.name).join(', ')
        : 'Aura Music');

    const album =
      typeof song.album === 'object' && song.album !== null
        ? song.album.title || 'Single'
        : typeof song.album === 'string'
        ? song.album
        : 'Aura Cinematic';

    const artworkList: MediaImage[] = [];

    if (song.artwork?.low) {
      artworkList.push({
        src: toAbsolute(song.artwork.low),
        sizes: '96x96',
        type: 'image/jpeg',
      });
      artworkList.push({
        src: toAbsolute(song.artwork.low),
        sizes: '128x128',
        type: 'image/jpeg',
      });
    }

    if (song.artwork?.medium) {
      artworkList.push({
        src: toAbsolute(song.artwork.medium),
        sizes: '256x256',
        type: 'image/jpeg',
      });
      artworkList.push({
        src: toAbsolute(song.artwork.medium),
        sizes: '384x384',
        type: 'image/jpeg',
      });
    }

    if (song.artwork?.high) {
      artworkList.push({
        src: toAbsolute(song.artwork.high),
        sizes: '512x512',
        type: 'image/jpeg',
      });
    }

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album,
        artwork: artworkList,
      });
    } catch (e) {
      console.warn('Failed to update MediaSession metadata:', e);
    }
  }

  /**
   * Update macOS playback state ('playing' | 'paused' | 'none').
   * Crucial for MacBook Touch Bar & Control Center icon toggling!
   */
  public updatePlaybackState(isPlaying: boolean) {
    if (!this.isSupported) return;

    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch (e) {
      console.warn('Failed to set mediaSession playbackState:', e);
    }
  }

  /**
   * Update macOS timeline scrub bar position state.
   * Throttled to avoid overwhelming the system event bus.
   */
  public updatePositionState(currentTime: number, duration: number, playbackRate = 1.0) {
    if (!this.isSupported || !('setPositionState' in navigator.mediaSession)) return;

    const now = Date.now();
    // Throttle to max 2 updates per second unless duration changed
    if (now - this.lastPositionUpdate < 500) return;
    this.lastPositionUpdate = now;

    try {
      if (duration > 0 && isFinite(duration) && isFinite(currentTime) && currentTime >= 0) {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, duration),
          playbackRate: Math.max(0.25, Math.min(2.5, playbackRate || 1.0)),
          position: Math.min(Math.max(0, currentTime), duration),
        });
      }
    } catch (e) {
      // Ignore transient position timing sync exceptions
    }
  }
}

export const mediaSessionService = new MediaSessionService();
