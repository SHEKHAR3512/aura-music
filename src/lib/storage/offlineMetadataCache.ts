import { Artist, Playlist, Album, Song } from '../music/types';

export interface CachedArtistEntry {
  artist: Artist;
  visitCount: number;
  lastVisited: number;
}

export interface CachedPlaylistEntry {
  playlist: Playlist;
  visitCount: number;
  lastVisited: number;
}

const STORAGE_KEY_ARTISTS = 'aura_offline_frequent_artists';
const STORAGE_KEY_PLAYLISTS = 'aura_offline_frequent_playlists';
const MAX_CACHED_ENTRIES = 25;

export const offlineMetadataCache = {
  /**
   * Record visit and cache artist metadata
   */
  recordArtistVisit(artist: Artist): void {
    if (typeof window === 'undefined' || !artist || !artist.id) return;
    try {
      const records = this.getRawArtistRecords();
      const existing = records.find(r => r.artist.id === artist.id);

      if (existing) {
        existing.visitCount += 1;
        existing.lastVisited = Date.now();
        // Update artist with fresh data if available
        existing.artist = { ...existing.artist, ...artist };
      } else {
        records.push({
          artist,
          visitCount: 1,
          lastVisited: Date.now(),
        });
      }

      // Sort by visit count and keep top entries
      records.sort((a, b) => b.visitCount - a.visitCount || b.lastVisited - a.lastVisited);
      const trimmed = records.slice(0, MAX_CACHED_ENTRIES);
      localStorage.setItem(STORAGE_KEY_ARTISTS, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to cache offline artist metadata:', e);
    }
  },

  /**
   * Record visit and cache playlist metadata
   */
  recordPlaylistVisit(playlist: Playlist): void {
    if (typeof window === 'undefined' || !playlist || !playlist.id) return;
    try {
      const records = this.getRawPlaylistRecords();
      const existing = records.find(r => r.playlist.id === playlist.id);

      if (existing) {
        existing.visitCount += 1;
        existing.lastVisited = Date.now();
        existing.playlist = { ...existing.playlist, ...playlist };
      } else {
        records.push({
          playlist,
          visitCount: 1,
          lastVisited: Date.now(),
        });
      }

      records.sort((a, b) => b.visitCount - a.visitCount || b.lastVisited - a.lastVisited);
      const trimmed = records.slice(0, MAX_CACHED_ENTRIES);
      localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to cache offline playlist metadata:', e);
    }
  },

  /**
   * Get all cached artists available for offline browsing
   */
  getOfflineArtists(): Artist[] {
    return this.getRawArtistRecords().map(r => r.artist);
  },

  /**
   * Get all cached playlists available for offline browsing
   */
  getOfflinePlaylists(): Playlist[] {
    return this.getRawPlaylistRecords().map(r => r.playlist);
  },

  /**
   * Check if artist is cached for offline use
   */
  isArtistOfflineReady(artistId: string): boolean {
    return this.getRawArtistRecords().some(r => r.artist.id === artistId);
  },

  /**
   * Check if playlist is cached for offline use
   */
  isPlaylistOfflineReady(playlistId: string): boolean {
    return this.getRawPlaylistRecords().some(r => r.playlist.id === playlistId);
  },

  getRawArtistRecords(): CachedArtistEntry[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ARTISTS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  getRawPlaylistRecords(): CachedPlaylistEntry[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PLAYLISTS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  clearCache(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY_ARTISTS);
    localStorage.removeItem(STORAGE_KEY_PLAYLISTS);
  },
};
