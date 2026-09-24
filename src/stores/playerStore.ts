import { create } from 'zustand';
import { Song, VisualizerMode, EQPresetName } from '../lib/music/types';
import { audioEngine, EQ_PRESETS } from '../lib/audio/AudioEngine';
import { extractDominantColors, applyDynamicThemeVariables, DEFAULT_COLORS, ExtractedColors } from '../lib/color/colorExtractor';
import { CURATED_FEATURED_SONGS } from '../lib/music/cache';
import { triggerHaptic } from '../lib/utils/haptics';

interface PlayerState {
  // Current playback state
  currentTrack: Song | null;
  queue: Song[];
  queueIndex: number;
  history: Song[];
  isPlaying: boolean;
  isLoading: boolean;

  // Audio adjustments
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  playbackRate: number;
  crossfadeSeconds: number;
  isNightMode: boolean;
  balance: number;
  eqPreset: EQPresetName;
  customBands: number[];

  // Sleep Timer
  sleepTimerEnd: number | null;
  sleepTimerRemaining: number | null;

  // Visuals & Modals
  visualizerMode: VisualizerMode;
  visualizerActive: boolean;
  isExpandedPlayer: boolean;
  queueOpen: boolean;
  lyricsOpen: boolean;
  eqModalOpen: boolean;
  searchModalOpen: boolean;
  authModalOpen: boolean;
  moreLikeThisOpen: boolean;
  jamModalOpen: boolean;
  currentColors: ExtractedColors;

  // User Library & Preferences
  likedSongIds: string[];
  smartQueueEnabled: boolean;

  // Actions
  playTrack: (song: Song, newQueue?: Song[]) => Promise<void>;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (seconds: number) => void;
  addToQueue: (song: Song) => void;
  playNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  setEQBand: (index: number, gain: number) => void;
  applyEQPreset: (preset: EQPresetName) => void;
  toggleNightMode: () => void;
  setBalance: (pan: number) => void;
  setCrossfade: (seconds: number) => void;
  setSleepTimer: (minutes: number | null) => void;
  setVisualizerMode: (mode: VisualizerMode) => void;
  toggleVisualizer: () => void;
  toggleLike: (song: Song) => void;
  toggleExpandedPlayer: () => void;
  setQueueOpen: (open: boolean) => void;
  setLyricsOpen: (open: boolean) => void;
  setEqModalOpen: (open: boolean) => void;
  setSearchModalOpen: (open: boolean) => void;
  setAuthModalOpen: (open: boolean) => void;
  setMoreLikeThisOpen: (open: boolean) => void;
  setJamModalOpen: (open: boolean) => void;
  setSmartQueue: (enabled: boolean) => void;
}

// Media Session helper
function updateMediaSession(song: Song) {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title,
    artist: song.primaryArtist,
    album: song.album.title,
    artwork: [
      { src: song.artwork.low, sizes: '96x96', type: 'image/jpeg' },
      { src: song.artwork.medium, sizes: '256x256', type: 'image/jpeg' },
      { src: song.artwork.high, sizes: '512x512', type: 'image/jpeg' },
    ],
  });
}

// Local storage helpers
const LIKES_KEY = 'aura_liked_songs';
function getInitialLikes(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    return raw ? JSON.parse(raw) : ['curated-kesariya'];
  } catch (e) {
    return ['curated-kesariya'];
  }
}

let sleepTimerInterval: any = null;

export const usePlayerStore = create<PlayerState>((set, get) => {
  // Listen for audio engine state updates
  audioEngine.subscribeState((isPlaying, isLoading) => {
    set({ isPlaying, isLoading });
  });

  // Track ended handler
  audioEngine.subscribeEnded(() => {
    const { repeat, nextTrack, currentTrack } = get();
    if (repeat === 'one' && currentTrack) {
      audioEngine.seek(0);
      audioEngine.play();
    } else {
      nextTrack();
    }
  });

  // Setup media session action handlers
  if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => audioEngine.play());
    navigator.mediaSession.setActionHandler('pause', () => audioEngine.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => get().prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => get().nextTrack());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) audioEngine.seek(details.seekTime);
    });
  }

  return {
    currentTrack: CURATED_FEATURED_SONGS[0],
    queue: CURATED_FEATURED_SONGS,
    queueIndex: 0,
    history: [],
    isPlaying: false,
    isLoading: false,

    volume: 0.85,
    isMuted: false,
    shuffle: false,
    repeat: 'off',
    playbackRate: 1.0,
    crossfadeSeconds: 2,
    isNightMode: false,
    balance: 0,
    eqPreset: 'Flat',
    customBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

    sleepTimerEnd: null,
    sleepTimerRemaining: null,

    visualizerMode: 'aurora',
    visualizerActive: false,
    isExpandedPlayer: false,
    queueOpen: false,
    lyricsOpen: false,
    eqModalOpen: false,
    searchModalOpen: false,
    authModalOpen: false,
    moreLikeThisOpen: false,
    jamModalOpen: false,
    currentColors: DEFAULT_COLORS,

    likedSongIds: getInitialLikes(),
    smartQueueEnabled: true,

    playTrack: async (song: Song, newQueue?: Song[]) => {
      const state = get();

      // If audioUrl is missing or incomplete, resolve song details
      let activeSong = song;
      if (!activeSong.audioUrl || !activeSong.audioUrl.startsWith('http')) {
        try {
          const res = await fetch(`/api/music/song/${song.id}`);
          if (res.ok) {
            const resolved = await res.json();
            if (resolved && resolved.audioUrl) {
              activeSong = { ...activeSong, ...resolved };
            }
          }
        } catch (e) {
          console.warn('Failed to resolve song details, falling back:', e);
        }

        // If still missing audioUrl, fall back to high quality stream
        if (!activeSong.audioUrl || !activeSong.audioUrl.startsWith('http')) {
          activeSong.audioUrl = CURATED_FEATURED_SONGS[0].audioUrl;
        }
      }

      let updatedQueue = newQueue || state.queue;
      let newIndex = updatedQueue.findIndex(s => s.id === activeSong.id);

      if (newIndex === -1) {
        updatedQueue = [activeSong, ...updatedQueue];
        newIndex = 0;
      } else {
        updatedQueue[newIndex] = activeSong;
      }

      set({
        currentTrack: activeSong,
        queue: updatedQueue,
        queueIndex: newIndex,
        history: state.currentTrack ? [state.currentTrack, ...state.history.slice(0, 30)] : state.history,
        isLoading: true,
      });

      updateMediaSession(activeSong);

      // Trigger tactile haptic on play
      triggerHaptic('play');

      // Extract colors & apply theme
      extractDominantColors(activeSong.artwork.medium || activeSong.artwork.high).then((colors) => {
        set({ currentColors: colors });
        applyDynamicThemeVariables(colors);
      });

      // Stream play through audio engine
      const crossfade = state.crossfadeSeconds > 0 && state.isPlaying;
      await audioEngine.loadAndPlay(activeSong.audioUrl, crossfade);
    },

    togglePlay: () => {
      const state = get();
      if (!state.currentTrack) {
        if (state.queue.length > 0) {
          get().playTrack(state.queue[0]);
        }
        return;
      }

      // Haptic feedback on play / pause
      triggerHaptic(state.isPlaying ? 'pause' : 'play');

      if (state.isPlaying) {
        audioEngine.pause();
      } else {
        audioEngine.play();
      }
    },

    nextTrack: () => {
      const { queue, queueIndex, shuffle, repeat, smartQueueEnabled } = get();
      if (queue.length === 0) return;

      // Haptic feedback on forward skip
      triggerHaptic('skipForward');

      let nextIndex = queueIndex + 1;

      if (shuffle) {
        nextIndex = Math.floor(Math.random() * queue.length);
      } else if (nextIndex >= queue.length) {
        if (repeat === 'all') {
          nextIndex = 0;
        } else if (smartQueueEnabled) {
          // Smart Queue continuation from curated items
          const nextSong = CURATED_FEATURED_SONGS[Math.floor(Math.random() * CURATED_FEATURED_SONGS.length)];
          set({ queue: [...queue, nextSong] });
          nextIndex = queue.length;
        } else {
          return; // Stop at end of queue
        }
      }

      const nextSong = queue[nextIndex];
      if (nextSong) {
        get().playTrack(nextSong);
      }
    },

    prevTrack: () => {
      // Haptic feedback on back skip
      triggerHaptic('skipBack');

      // If played for more than 3 seconds, seek back to beginning of track
      if (audioEngine.getCurrentTime() > 3) {
        audioEngine.seek(0);
        return;
      }

      const { queue, queueIndex, history } = get();
      if (history.length > 0) {
        const prev = history[0];
        set({ history: history.slice(1) });
        get().playTrack(prev);
        return;
      }

      if (queueIndex > 0) {
        get().playTrack(queue[queueIndex - 1]);
      } else {
        audioEngine.seek(0);
      }
    },

    seek: (seconds: number) => {
      triggerHaptic('seek');
      audioEngine.seek(seconds);
    },

    addToQueue: (song: Song) => {
      triggerHaptic('queue');
      set(state => ({
        queue: [...state.queue, song],
      }));
    },

    playNext: (song: Song) => {
      set(state => {
        const newQueue = [...state.queue];
        newQueue.splice(state.queueIndex + 1, 0, song);
        return { queue: newQueue };
      });
    },

    removeFromQueue: (index: number) => {
      set(state => {
        const newQueue = state.queue.filter((_, i) => i !== index);
        let newIndex = state.queueIndex;
        if (index < state.queueIndex) {
          newIndex--;
        } else if (index === state.queueIndex && newIndex >= newQueue.length) {
          newIndex = Math.max(0, newQueue.length - 1);
        }
        return {
          queue: newQueue,
          queueIndex: newIndex,
        };
      });
    },

    reorderQueue: (startIndex: number, endIndex: number) => {
      set(state => {
        const result = Array.from(state.queue);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        // Adjust queueIndex
        let newIndex = state.queueIndex;
        if (state.queueIndex === startIndex) {
          newIndex = endIndex;
        } else if (startIndex < state.queueIndex && endIndex >= state.queueIndex) {
          newIndex--;
        } else if (startIndex > state.queueIndex && endIndex <= state.queueIndex) {
          newIndex++;
        }

        return { queue: result, queueIndex: newIndex };
      });
    },

    clearQueue: () => {
      const { currentTrack } = get();
      set({
        queue: currentTrack ? [currentTrack] : [],
        queueIndex: 0,
      });
    },

    toggleShuffle: () => {
      triggerHaptic('button');
      set(state => ({ shuffle: !state.shuffle }));
    },

    cycleRepeat: () => {
      triggerHaptic('button');
      set(state => {
        const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
        const next = modes[(modes.indexOf(state.repeat) + 1) % modes.length];
        return { repeat: next };
      });
    },

    setVolume: (vol: number) => {
      audioEngine.setVolume(vol);
      set({ volume: vol, isMuted: vol === 0 });
    },

    toggleMute: () => {
      const { isMuted, volume } = get();
      if (isMuted) {
        audioEngine.setVolume(volume || 0.85);
        set({ isMuted: false });
      } else {
        audioEngine.setVolume(0);
        set({ isMuted: true });
      }
    },

    setPlaybackRate: (rate: number) => {
      audioEngine.setPlaybackRate(rate);
      set({ playbackRate: rate });
    },

    setEQBand: (index: number, gain: number) => {
      audioEngine.setEQBand(index, gain);
      set(state => {
        const bands = [...state.customBands];
        bands[index] = gain;
        return { customBands: bands, eqPreset: 'Custom' };
      });
    },

    applyEQPreset: (preset: EQPresetName) => {
      const bands = EQ_PRESETS[preset] || EQ_PRESETS.Flat;
      audioEngine.applyEQPreset(preset);
      set({ eqPreset: preset, customBands: [...bands] });
    },

    toggleNightMode: () => {
      set(state => {
        const next = !state.isNightMode;
        audioEngine.setNightMode(next);
        return { isNightMode: next };
      });
    },

    setBalance: (pan: number) => {
      audioEngine.setBalance(pan);
      set({ balance: pan });
    },

    setCrossfade: (seconds: number) => {
      audioEngine.setCrossfade(seconds);
      set({ crossfadeSeconds: seconds });
    },

    setSleepTimer: (minutes: number | null) => {
      if (sleepTimerInterval) {
        clearInterval(sleepTimerInterval);
        sleepTimerInterval = null;
      }

      if (minutes === null) {
        set({ sleepTimerEnd: null, sleepTimerRemaining: null });
        return;
      }

      const totalSeconds = minutes * 60;
      const endTime = Date.now() + totalSeconds * 1000;
      set({ sleepTimerEnd: endTime, sleepTimerRemaining: totalSeconds });

      sleepTimerInterval = setInterval(() => {
        const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
        set({ sleepTimerRemaining: remaining });

        if (remaining <= 0) {
          clearInterval(sleepTimerInterval);
          sleepTimerInterval = null;
          audioEngine.pause();
          set({ sleepTimerEnd: null, sleepTimerRemaining: null });
        }
      }, 1000);
    },

    setVisualizerMode: (mode: VisualizerMode) => {
      set({ visualizerMode: mode });
    },

    toggleVisualizer: () => {
      set(state => ({ visualizerActive: !state.visualizerActive }));
    },

    toggleLike: (song: Song) => {
      triggerHaptic('like');
      set(state => {
        const exists = state.likedSongIds.includes(song.id);
        const updated = exists
          ? state.likedSongIds.filter(id => id !== song.id)
          : [song.id, ...state.likedSongIds];

        try {
          localStorage.setItem(LIKES_KEY, JSON.stringify(updated));
        } catch (e) {}

        return { likedSongIds: updated };
      });
    },

    toggleExpandedPlayer: () => {
      set(state => ({ isExpandedPlayer: !state.isExpandedPlayer }));
    },

    setQueueOpen: (open: boolean) => set({ queueOpen: open }),
    setLyricsOpen: (open: boolean) => set({ lyricsOpen: open }),
    setEqModalOpen: (open: boolean) => set({ eqModalOpen: open }),
    setSearchModalOpen: (open: boolean) => set({ searchModalOpen: open }),
    setAuthModalOpen: (open: boolean) => set({ authModalOpen: open }),
    setMoreLikeThisOpen: (open: boolean) => set({ moreLikeThisOpen: open }),
    setJamModalOpen: (open: boolean) => set({ jamModalOpen: open }),
    setSmartQueue: (enabled: boolean) => set({ smartQueueEnabled: enabled }),
  };
});
