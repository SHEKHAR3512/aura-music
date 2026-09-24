export interface ArtistRef {
  id: string;
  name: string;
  role?: string;
  image?: string;
}

export interface ArtworkUrls {
  low: string;
  medium: string;
  high: string;
}

export interface AudioQualityUrls {
  low?: string;    // 96kbps
  medium?: string; // 160kbps
  high?: string;   // 320kbps
}

export interface Song {
  id: string;
  title: string;
  artists: ArtistRef[];
  primaryArtist: string;
  album: {
    id: string;
    title: string;
    artwork?: string;
  };
  artwork: ArtworkUrls;
  duration: number; // in seconds
  audioUrl: string;
  qualityUrls?: AudioQualityUrls;
  language: string;
  releaseDate?: string;
  year?: string | number;
  explicit: boolean;
  hasLyrics: boolean;
  lyricsId?: string;
  lyricsSnippet?: string;
  playCount?: number;
  source: 'jiosaavn' | 'curated' | 'local';
  sourceId: string;
}

export interface Album {
  id: string;
  title: string;
  artists: ArtistRef[];
  artwork: ArtworkUrls;
  year?: string | number;
  language?: string;
  songCount: number;
  songs: Song[];
  releaseDate?: string;
  primaryArtist?: string;
  description?: string;
}

export interface Artist {
  id: string;
  name: string;
  image: ArtworkUrls;
  followerCount?: number;
  verified?: boolean;
  dominantLanguage?: string;
  topSongs: Song[];
  albums: Album[];
  singles: Song[];
  bio?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  artwork: ArtworkUrls;
  songCount: number;
  songs: Song[];
  followerCount?: number;
  isCustom?: boolean;
  createdAt?: string;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  podcastTitle: string;
  podcastId: string;
  description: string;
  artwork: ArtworkUrls;
  duration: number;
  audioUrl: string;
  releaseDate: string;
  playbackPosition?: number;
  season?: number;
  episodeNumber?: number;
}

export interface PodcastShow {
  id: string;
  title: string;
  host: string;
  description: string;
  artwork: ArtworkUrls;
  category: string;
  episodes: PodcastEpisode[];
}

export type LyricsType = 'synced' | 'plain' | 'instrumental' | 'unavailable';

export interface LyricLine {
  startTime: number; // seconds with decimals (e.g. 14.52)
  endTime: number;   // seconds with decimals
  text: string;
}

export interface LyricsData {
  type: LyricsType;
  lines: LyricLine[];
  plainText?: string;
  copyright?: string;
  provider?: string;
}

export interface SearchResults {
  query: string;
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  podcasts: PodcastEpisode[];
}

export interface AudioFeatures {
  bass: number;        // 0.0 - 1.0
  mids: number;        // 0.0 - 1.0
  treble: number;      // 0.0 - 1.0
  energy: number;      // 0.0 - 1.0 overall RMS
  beat: boolean;       // transient peak detected
  intensity: number;   // smoothed intensity
  spectrum: Uint8Array;
}

export type VisualizerMode =
  | 'aurora'
  | 'nebula'
  | 'solar'
  | 'liquid'
  | 'pulse'
  | 'waveform'
  | 'spectrum'
  | 'minimal';

export type SongPhase = 'INTRO' | 'BUILD' | 'PEAK' | 'BREAKDOWN' | 'OUTRO';

export type EQPresetName =
  | 'Flat'
  | 'Pop'
  | 'Rock'
  | 'Classical'
  | 'Jazz'
  | 'Electronic'
  | 'Vocal'
  | 'Bass Boost'
  | 'Custom';

export interface EQPreset {
  name: EQPresetName;
  bands: number[]; // 10 gain values in dB (-12dB to +12dB)
}
