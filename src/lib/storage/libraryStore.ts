import { create } from 'zustand';
import { Song, Playlist } from '../music/types';
import { CURATED_FEATURED_SONGS } from '../music/cache';
import {
  saveUserProfileToFirestore,
  savePlaylistToFirestore,
  deletePlaylistFromFirestore,
  saveStatsToFirestore,
  saveRecentlyPlayedToFirestore,
  getCurrentUid,
} from './firestoreSync';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isAnonymous: boolean;
  provider: 'guest' | 'google' | 'email';
}

export interface ListeningStats {
  totalMinutesListened: number;
  tracksPlayedCount: number;
  topArtists: { name: string; count: number }[];
  topGenres: { name: string; count: number }[];
  mostPlayedSong?: { title: string; artist: string; count: number };
}

interface LibraryState {
  profile: UserProfile;
  playlists: Playlist[];
  recentlyPlayed: Song[];
  stats: ListeningStats;

  // Actions
  updateProfile: (profile: Partial<UserProfile>) => void;
  createPlaylist: (title: string, description?: string) => Playlist;
  deletePlaylist: (id: string) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  recordTrackPlay: (song: Song, secondsPlayed?: number) => void;
  setPlaylistsFromRemote: (playlists: Playlist[]) => void;
  setStatsFromRemote: (stats: ListeningStats) => void;
}


const STORAGE_PLAYLISTS = 'aura_user_playlists';
const STORAGE_STATS = 'aura_listening_stats';
const STORAGE_PROFILE = 'aura_user_profile';

function loadInitialPlaylists(): Playlist[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_PLAYLISTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return [
    {
      id: 'my-favorites-default',
      title: 'Midnight Reverie',
      description: 'A personal sanctuary of moody atmospheric tracks and soulful melodies.',
      artwork: {
        low: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&auto=format&fit=crop&q=80',
        medium: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
        high: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      },
      songCount: 3,
      songs: [CURATED_FEATURED_SONGS[0], CURATED_FEATURED_SONGS[2], CURATED_FEATURED_SONGS[4]],
      isCustom: true,
      createdAt: '2026-09-20',
    }
  ];
}

function loadInitialStats(): ListeningStats {
  if (typeof window === 'undefined') {
    return {
      totalMinutesListened: 142,
      tracksPlayedCount: 38,
      topArtists: [
        { name: 'Arijit Singh', count: 18 },
        { name: 'The Weeknd', count: 12 },
        { name: 'Karan Aujla', count: 8 },
      ],
      topGenres: [
        { name: 'Bollywood Romantic', count: 20 },
        { name: 'Synthwave / R&B', count: 12 },
        { name: 'Punjabi Wave', count: 8 },
      ],
      mostPlayedSong: { title: 'Kesariya', artist: 'Arijit Singh', count: 14 },
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_STATS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return {
    totalMinutesListened: 142,
    tracksPlayedCount: 38,
    topArtists: [
      { name: 'Arijit Singh', count: 18 },
      { name: 'The Weeknd', count: 12 },
      { name: 'Karan Aujla', count: 8 },
    ],
    topGenres: [
      { name: 'Bollywood Romantic', count: 20 },
      { name: 'Synthwave / R&B', count: 12 },
      { name: 'Punjabi Wave', count: 8 },
    ],
    mostPlayedSong: { title: 'Kesariya', artist: 'Arijit Singh', count: 14 },
  };
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  profile: {
    id: 'user_local_1',
    name: 'Audiophile Member',
    email: 'listener@aura.audio',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isAnonymous: false,
    provider: 'guest',
  },
  playlists: loadInitialPlaylists(),
  recentlyPlayed: CURATED_FEATURED_SONGS.slice(0, 4),
  stats: loadInitialStats(),

  updateProfile: (updates) => {
    set(state => {
      const next = { ...state.profile, ...updates };
      try {
        localStorage.setItem(STORAGE_PROFILE, JSON.stringify(next));
      } catch (e) {}
      const uid = getCurrentUid();
      if (uid) saveUserProfileToFirestore(uid, next);
      return { profile: next };
    });
  },

  setPlaylistsFromRemote: (playlists) => {
    set({ playlists });
    try {
      localStorage.setItem(STORAGE_PLAYLISTS, JSON.stringify(playlists));
    } catch (e) {}
  },

  setStatsFromRemote: (stats) => {
    set({ stats });
    try {
      localStorage.setItem(STORAGE_STATS, JSON.stringify(stats));
    } catch (e) {}
  },

  createPlaylist: (title, description) => {
    const id = `playlist_${Date.now()}`;
    const newPlaylist: Playlist = {
      id,
      title,
      description: description || 'Curated personal playlist',
      artwork: {
        low: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&auto=format&fit=crop&q=80',
        medium: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
        high: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
      },
      songCount: 0,
      songs: [],
      isCustom: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    set(state => {
      const updated = [newPlaylist, ...state.playlists];
      try {
        localStorage.setItem(STORAGE_PLAYLISTS, JSON.stringify(updated));
      } catch (e) {}
      const uid = getCurrentUid();
      if (uid) savePlaylistToFirestore(uid, newPlaylist);
      return { playlists: updated };
    });

    return newPlaylist;
  },

  deletePlaylist: (id) => {
    set(state => {
      const updated = state.playlists.filter(p => p.id !== id);
      try {
        localStorage.setItem(STORAGE_PLAYLISTS, JSON.stringify(updated));
      } catch (e) {}
      const uid = getCurrentUid();
      if (uid) deletePlaylistFromFirestore(uid, id);
      return { playlists: updated };
    });
  },

  addSongToPlaylist: (playlistId, song) => {
    set(state => {
      const updated = state.playlists.map(p => {
        if (p.id === playlistId) {
          if (p.songs.some(s => s.id === song.id)) return p;
          const nextSongs = [...p.songs, song];
          return {
            ...p,
            songs: nextSongs,
            songCount: nextSongs.length,
          };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_PLAYLISTS, JSON.stringify(updated));
      } catch (e) {}
      const uid = getCurrentUid();
      if (uid) {
        const modified = updated.find(p => p.id === playlistId);
        if (modified) savePlaylistToFirestore(uid, modified);
      }
      return { playlists: updated };
    });
  },

  removeSongFromPlaylist: (playlistId, songId) => {
    set(state => {
      const updated = state.playlists.map(p => {
        if (p.id === playlistId) {
          const nextSongs = p.songs.filter(s => s.id !== songId);
          return {
            ...p,
            songs: nextSongs,
            songCount: nextSongs.length,
          };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_PLAYLISTS, JSON.stringify(updated));
      } catch (e) {}
      const uid = getCurrentUid();
      if (uid) {
        const modified = updated.find(p => p.id === playlistId);
        if (modified) savePlaylistToFirestore(uid, modified);
      }
      return { playlists: updated };
    });
  },

  recordTrackPlay: (song, secondsPlayed = 180) => {
    set(state => {
      const currentStats = { ...state.stats };
      currentStats.tracksPlayedCount += 1;
      currentStats.totalMinutesListened += Math.round(secondsPlayed / 60);

      // Update artist tally
      const artistIndex = currentStats.topArtists.findIndex(a => a.name === song.primaryArtist);
      if (artistIndex >= 0) {
        currentStats.topArtists[artistIndex].count += 1;
      } else {
        currentStats.topArtists.push({ name: song.primaryArtist, count: 1 });
      }
      currentStats.topArtists.sort((a, b) => b.count - a.count);

      // Update recently played
      const nextRecent = [song, ...state.recentlyPlayed.filter(s => s.id !== song.id)].slice(0, 20);

      try {
        localStorage.setItem(STORAGE_STATS, JSON.stringify(currentStats));
      } catch (e) {}

      const uid = getCurrentUid();
      if (uid) {
        saveStatsToFirestore(uid, currentStats);
        saveRecentlyPlayedToFirestore(uid, nextRecent);
      }

      return {
        stats: currentStats,
        recentlyPlayed: nextRecent,
      };
    });
  },
}));
