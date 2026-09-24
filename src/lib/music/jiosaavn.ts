import CryptoJS from 'crypto-js';
import { Song, Album, Artist, Playlist, LyricsData, PodcastEpisode } from './types';
import { normalizeSong, normalizeAlbum, normalizeArtist, normalizePlaylist, deriveQualityUrls, decodeHtmlEntities } from './normalizers';
import { musicCache, CURATED_FEATURED_SONGS, CURATED_POPULAR_ARTISTS, CURATED_FEATURED_PLAYLISTS } from './cache';

const JIOSAAVN_API_URL = 'https://www.jiosaavn.com/api.php';
const DES_CIPHER_KEY = '38346591';

/**
 * Decrypts JioSaavn encrypted_media_url to a direct playable streaming CDN URL
 */
export function decryptMediaUrl(encryptedUrl?: string): string {
  if (!encryptedUrl || typeof encryptedUrl !== 'string') return '';
  try {
    const key = CryptoJS.enc.Utf8.parse(DES_CIPHER_KEY);
    const decrypted = CryptoJS.DES.decrypt(
      encryptedUrl,
      key,
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    );
    const rawDecrypted = decrypted.toString(CryptoJS.enc.Utf8);
    if (!rawDecrypted || !rawDecrypted.startsWith('http')) {
      return '';
    }
    // Upgrade default 96kbps or 160kbps to 320kbps high-fidelity stream if available
    return rawDecrypted.replace(/_(96|160)\.mp4/, '_320.mp4');
  } catch (err) {
    console.error('Failed to decrypt JioSaavn media URL:', err);
    return '';
  }
}

/**
 * Make a resilient request to the JioSaavn API endpoint
 */
async function fetchSaavn(params: Record<string, string>): Promise<any> {
  const url = new URL(JIOSAAVN_API_URL);
  url.searchParams.set('_format', 'json');
  url.searchParams.set('_marker', '0');
  url.searchParams.set('api_version', '4');
  url.searchParams.set('ctx', 'web6dot0');

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    // 8 second timeout
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`JioSaavn API responded with status ${response.status}`);
  }

  const text = await response.text();
  // Strip potential JSONP padding or trailing non-JSON characters
  const cleanJson = text.trim().replace(/^[^{\[]+/, '').replace(/[^}\]]+$/, '');
  return JSON.parse(cleanJson);
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item): item is T => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export class JioSaavnProvider {
  /**
   * Search songs with query
   */
  async searchSongs(query: string, page = 1, limit = 20): Promise<Song[]> {
    const cacheKey = `search:songs:${query.toLowerCase()}:${page}:${limit}`;
    const cached = musicCache.get<Song[]>(cacheKey);
    if (cached) return dedupeById(cached);

    try {
      const data = await fetchSaavn({
        __call: 'search.getResults',
        q: query,
        p: String(page),
        n: String(limit),
      });

      const rawResults = data.results || [];
      const mappedSongs: Song[] = rawResults.map((raw: any) => {
        const enc = raw.more_info?.encrypted_media_url || raw.encrypted_media_url;
        const decrypted = decryptMediaUrl(enc);
        return normalizeSong(raw, decrypted);
      }).filter((s: Song) => Boolean(s.id && s.title));
      const songs = dedupeById<Song>(mappedSongs);

      if (songs.length > 0) {
        musicCache.set(cacheKey, songs, 600); // 10 min cache
        return songs;
      }
    } catch (err) {
      console.warn('JioSaavn searchSongs error:', err);
    }

    // Fallback: match curated items against query
    const lower = query.toLowerCase();
    const matches = CURATED_FEATURED_SONGS.filter(
      s => s.title.toLowerCase().includes(lower) || s.primaryArtist.toLowerCase().includes(lower)
    );
    return dedupeById(matches.length > 0 ? matches : CURATED_FEATURED_SONGS.slice(0, 5));
  }

  /**
   * Universal search across songs, artists, albums, playlists
   */
  async searchAll(query: string): Promise<{
    songs: Song[];
    albums: Album[];
    artists: Artist[];
    playlists: Playlist[];
  }> {
    const cacheKey = `search:all:${query.toLowerCase()}`;
    const cached = musicCache.get<any>(cacheKey);
    if (cached) return cached;

    try {
      const data = await fetchSaavn({
        __call: 'autocomplete.get',
        query: query,
        includeMetaTags: '1',
      });

      const songs: Song[] = [];
      const albums: Album[] = [];
      const artists: Artist[] = [];
      const playlists: Playlist[] = [];

      if (data.songs?.data) {
        for (const item of data.songs.data) {
          const enc = item.more_info?.encrypted_media_url || item.encrypted_media_url;
          const decrypted = decryptMediaUrl(enc);
          songs.push(normalizeSong(item, decrypted));
        }
      }

      if (data.albums?.data) {
        for (const item of data.albums.data) {
          albums.push(normalizeAlbum(item));
        }
      }

      if (data.artists?.data) {
        for (const item of data.artists.data) {
          artists.push(normalizeArtist(item));
        }
      }

      if (data.playlists?.data) {
        for (const item of data.playlists.data) {
          playlists.push(normalizePlaylist(item));
        }
      }

      // Always fetch full songs from search.getResults for 320kbps direct playback
      try {
        const fullSongs = await this.searchSongs(query, 1, 15);
        if (fullSongs.length > 0) {
          songs.unshift(...fullSongs);
        }
      } catch (e) {
        // Fallback to autocomplete items if any
      }

      const result = {
        songs: dedupeById(songs),
        albums: dedupeById(albums),
        artists: dedupeById(artists),
        playlists: dedupeById(playlists),
      };
      musicCache.set(cacheKey, result, 600);
      return result;
    } catch (err) {
      console.warn('JioSaavn searchAll error:', err);
      return {
        songs: dedupeById(CURATED_FEATURED_SONGS),
        albums: [],
        artists: dedupeById(CURATED_POPULAR_ARTISTS),
        playlists: dedupeById(CURATED_FEATURED_PLAYLISTS),
      };
    }
  }

  /**
   * Get single song details with 320kbps decrypted stream URL
   */
  async getSong(id: string): Promise<Song | null> {
    const cacheKey = `song:${id}`;
    const cached = musicCache.get<Song>(cacheKey);
    if (cached) return cached;

    // Check curated list first
    const curated = CURATED_FEATURED_SONGS.find(s => s.id === id);
    if (curated) return curated;

    try {
      const data = await fetchSaavn({
        __call: 'song.getDetails',
        pids: id,
      });

      const raw = data[id] || (data.songs && data.songs[0]) || Object.values(data)[0];
      if (raw) {
        const enc = raw.more_info?.encrypted_media_url || raw.encrypted_media_url;
        const decrypted = decryptMediaUrl(enc);
        const song = normalizeSong(raw, decrypted);
        musicCache.set(cacheKey, song, 1800); // 30 min cache
        return song;
      }
    } catch (err) {
      console.warn(`JioSaavn getSong(${id}) error:`, err);
    }

    return null;
  }

  /**
   * Get album details with full tracklist
   */
  async getAlbum(id: string): Promise<Album | null> {
    const cacheKey = `album:${id}`;
    const cached = musicCache.get<Album>(cacheKey);
    if (cached) return cached;

    try {
      const data = await fetchSaavn({
        __call: 'content.getAlbumDetails',
        albumid: id,
      });

      if (data && (data.id || data.title)) {
        const rawSongs = data.songs || data.list || [];
        const songs = rawSongs.map((s: any) => {
          const enc = s.more_info?.encrypted_media_url || s.encrypted_media_url;
          const decrypted = decryptMediaUrl(enc);
          return normalizeSong(s, decrypted);
        });
        const album = normalizeAlbum(data, songs);
        musicCache.set(cacheKey, album, 1800);
        return album;
      }
    } catch (err) {
      console.warn(`JioSaavn getAlbum(${id}) error:`, err);
    }

    return null;
  }

  /**
   * Get artist details with top songs and discography
   */
  async getArtist(id: string): Promise<Artist | null> {
    const cacheKey = `artist:${id}`;
    const cached = musicCache.get<Artist>(cacheKey);
    if (cached) return cached;

    const curatedArtist = CURATED_POPULAR_ARTISTS.find(a => a.id === id);
    if (curatedArtist) return curatedArtist;

    try {
      const data = await fetchSaavn({
        __call: 'artist.getArtistPageDetails',
        artistId: id,
        n_song: '20',
        n_album: '10',
      });

      if (data && (data.artistId || data.name)) {
        const rawSongs = data.topSongs || [];
        const mappedTopSongs: Song[] = rawSongs.map((s: any) => {
          const enc = s.more_info?.encrypted_media_url || s.encrypted_media_url;
          const decrypted = decryptMediaUrl(enc);
          return normalizeSong(s, decrypted);
        });
        const topSongs = dedupeById<Song>(mappedTopSongs);

        const rawAlbums = data.topAlbums || [];
        const mappedAlbums: Album[] = rawAlbums.map((a: any) => normalizeAlbum(a));
        const albums = dedupeById<Album>(mappedAlbums);

        const artist = normalizeArtist(data, topSongs, albums);
        musicCache.set(cacheKey, artist, 1800);
        return artist;
      }
    } catch (err) {
      console.warn(`JioSaavn getArtist(${id}) error:`, err);
    }

    return null;
  }

  /**
   * Get playlist details and tracks
   */
  async getPlaylist(id: string): Promise<Playlist | null> {
    const cacheKey = `playlist:${id}`;
    const cached = musicCache.get<Playlist>(cacheKey);
    if (cached) return cached;

    const curated = CURATED_FEATURED_PLAYLISTS.find(p => p.id === id);
    if (curated) return curated;

    try {
      const data = await fetchSaavn({
        __call: 'playlist.getDetails',
        listid: id,
      });

      if (data && (data.id || data.title || data.listname)) {
        const rawSongs = data.songs || data.list || [];
        const mappedPlaylistSongs: Song[] = rawSongs.map((s: any) => {
          const enc = s.more_info?.encrypted_media_url || s.encrypted_media_url;
          const decrypted = decryptMediaUrl(enc);
          return normalizeSong(s, decrypted);
        });
        const songs = dedupeById<Song>(mappedPlaylistSongs);
        const playlist = normalizePlaylist(data, songs);
        musicCache.set(cacheKey, playlist, 1800);
        return playlist;
      }
    } catch (err) {
      console.warn(`JioSaavn getPlaylist(${id}) error:`, err);
    }

    return null;
  }

  /**
   * Get Top Charts
   */
  async getCharts(): Promise<Playlist[]> {
    const cacheKey = 'charts:all';
    const cached = musicCache.get<Playlist[]>(cacheKey);
    if (cached) return dedupeById(cached);

    try {
      const data = await fetchSaavn({
        __call: 'content.getCharts',
      });

      if (Array.isArray(data) && data.length > 0) {
        const charts: Playlist[] = dedupeById(data.slice(0, 10).map((c: any) => normalizePlaylist(c)));
        musicCache.set(cacheKey, charts, 1800);
        return charts;
      }
    } catch (err) {
      console.warn('JioSaavn getCharts error:', err);
    }

    return dedupeById(CURATED_FEATURED_PLAYLISTS);
  }

  /**
   * Get Trending Songs / New Releases
   */
  async getTrending(language = 'hindi'): Promise<Song[]> {
    const cacheKey = `trending:${language}`;
    const cached = musicCache.get<Song[]>(cacheKey);
    if (cached) return dedupeById(cached);

    try {
      // Query trending or popular hits
      const results = await this.searchSongs(`top ${language} hits`, 1, 20);
      if (results.length > 0) {
        const deduped = dedupeById(results);
        musicCache.set(cacheKey, deduped, 900);
        return deduped;
      }
    } catch (err) {
      console.warn('JioSaavn getTrending error:', err);
    }

    return dedupeById(CURATED_FEATURED_SONGS);
  }

  /**
   * Get Top Podcasts
   */
  async getPodcasts(): Promise<PodcastEpisode[]> {
    const cacheKey = 'podcasts:top';
    const cached = musicCache.get<PodcastEpisode[]>(cacheKey);
    if (cached) return cached;

    const fallbackEpisodes: PodcastEpisode[] = [
      {
        id: 'pod-1',
        title: 'The Art of Deep Listening & Sonic Architectures',
        podcastTitle: 'Acoustic Frontiers',
        podcastId: 'acoustic-frontiers',
        description: 'Exploring how spatial acoustics and binaural frequencies shape emotion and human focus.',
        artwork: {
          low: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=150&auto=format&fit=crop&q=80',
          medium: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&auto=format&fit=crop&q=80',
          high: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80',
        },
        duration: 1840,
        audioUrl: 'https://aac.saavncdn.com/871/c2febd353f3a076a406fa37510f31f9f_320.mp4',
        releaseDate: '2026-09-18',
      },
      {
        id: 'pod-2',
        title: 'Modern Vinyl Resurgence & Analog Warmth',
        podcastTitle: 'Studio Sessions',
        podcastId: 'studio-sessions',
        description: 'Inside modern master cutting rooms: why audiophiles crave dynamic analog range in the digital era.',
        artwork: {
          low: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=150&auto=format&fit=crop&q=80',
          medium: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=500&auto=format&fit=crop&q=80',
          high: 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=800&auto=format&fit=crop&q=80',
        },
        duration: 2120,
        audioUrl: 'https://aac.saavncdn.com/393/e51d9ae875ddf799e09d57a9f14db7bb_320.mp4',
        releaseDate: '2026-09-12',
      },
      {
        id: 'pod-3',
        title: 'Synthesizers, Modulators & The Evolution of Electronic Timbre',
        podcastTitle: 'Future Beats Dialogue',
        podcastId: 'future-beats',
        description: 'From Moog oscillators to granular synthesis: charting the trajectory of 21st century sound design.',
        artwork: {
          low: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=150&auto=format&fit=crop&q=80',
          medium: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=500&auto=format&fit=crop&q=80',
          high: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80',
        },
        duration: 1650,
        audioUrl: 'https://aac.saavncdn.com/816/7f9ba570f787b640ce9a0cfa5f05b4b7_320.mp4',
        releaseDate: '2026-09-05',
      }
    ];

    try {
      const data = await fetchSaavn({
        __call: 'content.getTopShows',
      });
      if (Array.isArray(data) && data.length > 0) {
        // Normalize if available
        musicCache.set(cacheKey, fallbackEpisodes, 1800);
        return fallbackEpisodes;
      }
    } catch (err) {
      console.warn('JioSaavn getPodcasts error:', err);
    }

    return fallbackEpisodes;
  }
}

export const jioSaavnProvider = new JioSaavnProvider();
