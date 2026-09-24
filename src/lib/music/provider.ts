import { Song, Album, Artist, Playlist, LyricsData, PodcastEpisode, SearchResults } from './types';
import { jioSaavnProvider } from './jiosaavn';
import { fetchLyrics } from './lyrics';
import { CURATED_FEATURED_SONGS } from './cache';

export interface MusicProvider {
  search(query: string): Promise<SearchResults>;
  getSong(id: string): Promise<Song | null>;
  getAlbum(id: string): Promise<Album | null>;
  getArtist(id: string): Promise<Artist | null>;
  getPlaylist(id: string): Promise<Playlist | null>;
  getLyrics(song: Song): Promise<LyricsData>;
  getCharts(): Promise<Playlist[]>;
  getNewReleases(language?: string): Promise<Song[]>;
  getTrending(language?: string): Promise<Song[]>;
  getPodcasts(): Promise<PodcastEpisode[]>;
  getRadio(song: Song): Promise<Song[]>;
}

class DefaultMusicProvider implements MusicProvider {
  async search(query: string): Promise<SearchResults> {
    const data = await jioSaavnProvider.searchAll(query);
    return {
      query,
      songs: data.songs,
      albums: data.albums,
      artists: data.artists,
      playlists: data.playlists,
      podcasts: [],
    };
  }

  async getSong(id: string): Promise<Song | null> {
    return jioSaavnProvider.getSong(id);
  }

  async getAlbum(id: string): Promise<Album | null> {
    return jioSaavnProvider.getAlbum(id);
  }

  async getArtist(id: string): Promise<Artist | null> {
    return jioSaavnProvider.getArtist(id);
  }

  async getPlaylist(id: string): Promise<Playlist | null> {
    return jioSaavnProvider.getPlaylist(id);
  }

  async getLyrics(song: Song): Promise<LyricsData> {
    return fetchLyrics(song.id, song.title, song.primaryArtist, song.album.title, song.duration);
  }

  async getCharts(): Promise<Playlist[]> {
    return jioSaavnProvider.getCharts();
  }

  async getNewReleases(language: string = 'hindi'): Promise<Song[]> {
    return jioSaavnProvider.searchSongs(`latest new ${language} releases`, 1, 15);
  }

  async getTrending(language: string = 'hindi'): Promise<Song[]> {
    return jioSaavnProvider.getTrending(language);
  }

  async getPodcasts(): Promise<PodcastEpisode[]> {
    return jioSaavnProvider.getPodcasts();
  }

  async getRadio(song: Song): Promise<Song[]> {
    // Generate deterministic continuation radio based on artist and language
    try {
      const related = await jioSaavnProvider.searchSongs(`${song.primaryArtist} ${song.language}`, 1, 15);
      const filtered = related.filter(s => s.id !== song.id);
      if (filtered.length >= 5) return filtered;
    } catch (err) {
      // Fallback
    }

    const fallback = CURATED_FEATURED_SONGS.filter(s => s.id !== song.id);
    return fallback.length > 0 ? fallback : CURATED_FEATURED_SONGS;
  }
}

export const musicProvider: MusicProvider = new DefaultMusicProvider();
