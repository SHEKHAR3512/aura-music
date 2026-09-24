import { Song, Album, Artist, Playlist, LyricsData } from './types';

// In-memory TTL Cache
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // Keep size under control
    if (this.store.size > 500) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

export const musicCache = new MemoryCache();

// Fallback high-fidelity curated audio items
export const CURATED_FEATURED_SONGS: Song[] = [
  {
    id: 'curated-kesariya',
    title: 'Kesariya',
    artists: [
      { id: 'arijit-singh', name: 'Arijit Singh' },
      { id: 'pritam', name: 'Pritam' }
    ],
    primaryArtist: 'Arijit Singh',
    album: {
      id: 'brahmastra',
      title: 'Brahmastra',
      artwork: 'https://c.saavncdn.com/054/Pritam-All-Time-Hits-Hindi-2023-20230529184043-500x500.jpg'
    },
    artwork: {
      low: 'https://c.saavncdn.com/054/Pritam-All-Time-Hits-Hindi-2023-20230529184043-150x150.jpg',
      medium: 'https://c.saavncdn.com/054/Pritam-All-Time-Hits-Hindi-2023-20230529184043-500x500.jpg',
      high: 'https://c.saavncdn.com/054/Pritam-All-Time-Hits-Hindi-2023-20230529184043-500x500.jpg'
    },
    duration: 268,
    audioUrl: 'https://aac.saavncdn.com/054/4183c8b4a67c70231da0d90701ca39f5_320.mp4',
    language: 'Hindi',
    year: '2022',
    explicit: false,
    hasLyrics: true,
    source: 'curated',
    sourceId: 'curated-kesariya'
  },
  {
    id: 'curated-starboy',
    title: 'Starboy',
    artists: [
      { id: 'the-weeknd', name: 'The Weeknd' },
      { id: 'daft-punk', name: 'Daft Punk' }
    ],
    primaryArtist: 'The Weeknd',
    album: {
      id: 'starboy-album',
      title: 'Starboy',
      artwork: 'https://c.saavncdn.com/372/Starboy-English-2016-500x500.jpg'
    },
    artwork: {
      low: 'https://c.saavncdn.com/372/Starboy-English-2016-150x150.jpg',
      medium: 'https://c.saavncdn.com/372/Starboy-English-2016-500x500.jpg',
      high: 'https://c.saavncdn.com/372/Starboy-English-2016-500x500.jpg'
    },
    duration: 230,
    audioUrl: 'https://aac.saavncdn.com/372/2d22028e95d06cf831e083eb6fb2fe9c_320.mp4',
    language: 'English',
    year: '2016',
    explicit: true,
    hasLyrics: true,
    source: 'curated',
    sourceId: 'curated-starboy'
  },
  {
    id: 'curated-apna-bana-le',
    title: 'Apna Bana Le',
    artists: [
      { id: 'arijit-singh', name: 'Arijit Singh' },
      { id: 'sachin-jigar', name: 'Sachin-Jigar' }
    ],
    primaryArtist: 'Arijit Singh',
    album: {
      id: 'bhediya',
      title: 'Bhediya',
      artwork: 'https://c.saavncdn.com/815/Bhediya-Hindi-2023-20230927155213-500x500.jpg'
    },
    artwork: {
      low: 'https://c.saavncdn.com/815/Bhediya-Hindi-2023-20230927155213-150x150.jpg',
      medium: 'https://c.saavncdn.com/815/Bhediya-Hindi-2023-20230927155213-500x500.jpg',
      high: 'https://c.saavncdn.com/815/Bhediya-Hindi-2023-20230927155213-500x500.jpg'
    },
    duration: 261,
    audioUrl: 'https://aac.saavncdn.com/815/7f9ba570f787b640ce9a0cfa5f05b4b7_320.mp4',
    language: 'Hindi',
    year: '2022',
    explicit: false,
    hasLyrics: true,
    source: 'curated',
    sourceId: 'curated-apna-bana-le'
  },
  {
    id: 'curated-chaleya',
    title: 'Chaleya',
    artists: [
      { id: 'anirudh-ravichander', name: 'Anirudh Ravichander' },
      { id: 'arijit-singh', name: 'Arijit Singh' },
      { id: 'shilpa-rao', name: 'Shilpa Rao' }
    ],
    primaryArtist: 'Anirudh Ravichander',
    album: {
      id: 'jawan',
      title: 'Jawan',
      artwork: 'https://c.saavncdn.com/026/Chaleya-From-Jawan-Hindi-2023-20230814014337-500x500.jpg'
    },
    artwork: {
      low: 'https://c.saavncdn.com/026/Chaleya-From-Jawan-Hindi-2023-20230814014337-150x150.jpg',
      medium: 'https://c.saavncdn.com/026/Chaleya-From-Jawan-Hindi-2023-20230814014337-500x500.jpg',
      high: 'https://c.saavncdn.com/026/Chaleya-From-Jawan-Hindi-2023-20230814014337-500x500.jpg'
    },
    duration: 200,
    audioUrl: 'https://aac.saavncdn.com/026/0f1bc8f4262ae315b9c5957d38399587_320.mp4',
    language: 'Hindi',
    year: '2023',
    explicit: false,
    hasLyrics: true,
    source: 'curated',
    sourceId: 'curated-chaleya'
  },
  {
    id: 'curated-night-changes',
    title: 'Night Changes',
    artists: [{ id: 'one-direction', name: 'One Direction' }],
    primaryArtist: 'One Direction',
    album: {
      id: 'four-album',
      title: 'FOUR (Deluxe)',
      artwork: 'https://c.saavncdn.com/851/FOUR-Deluxe--English-2014-500x500.jpg'
    },
    artwork: {
      low: 'https://c.saavncdn.com/851/FOUR-Deluxe--English-2014-150x150.jpg',
      medium: 'https://c.saavncdn.com/851/FOUR-Deluxe--English-2014-500x500.jpg',
      high: 'https://c.saavncdn.com/851/FOUR-Deluxe--English-2014-500x500.jpg'
    },
    duration: 226,
    audioUrl: 'https://aac.saavncdn.com/851/e9a263d90fc924c520ef63836d54eeea_320.mp4',
    language: 'English',
    year: '2014',
    explicit: false,
    hasLyrics: true,
    source: 'curated',
    sourceId: 'curated-night-changes'
  },
  {
    id: 'curated-softly',
    title: 'Softly',
    artists: [{ id: 'karan-aujla', name: 'Karan Aujla' }, { id: 'ikky', name: 'Ikky' }],
    primaryArtist: 'Karan Aujla',
    album: {
      id: 'making-memories',
      title: 'Making Memories',
      artwork: 'https://c.saavncdn.com/538/Making-Memories-English-2023-20230818075015-500x500.jpg'
    },
    artwork: {
      low: 'https://c.saavncdn.com/538/Making-Memories-English-2023-20230818075015-150x150.jpg',
      medium: 'https://c.saavncdn.com/538/Making-Memories-English-2023-20230818075015-500x500.jpg',
      high: 'https://c.saavncdn.com/538/Making-Memories-English-2023-20230818075015-500x500.jpg'
    },
    duration: 155,
    audioUrl: 'https://aac.saavncdn.com/538/727114725cd7ec508b1df0a7e4515e5e_320.mp4',
    language: 'Punjabi',
    year: '2023',
    explicit: false,
    hasLyrics: true,
    source: 'curated',
    sourceId: 'curated-softly'
  }
];

export const CURATED_POPULAR_ARTISTS: Artist[] = [
  {
    id: '459320',
    name: 'Arijit Singh',
    image: {
      low: 'https://c.saavncdn.com/artists/Arijit_Singh_004_20241118063717_150x150.jpg',
      medium: 'https://c.saavncdn.com/artists/Arijit_Singh_004_20241118063717_500x500.jpg',
      high: 'https://c.saavncdn.com/artists/Arijit_Singh_004_20241118063717_500x500.jpg'
    },
    followerCount: 38400000,
    verified: true,
    dominantLanguage: 'Hindi',
    topSongs: [CURATED_FEATURED_SONGS[0], CURATED_FEATURED_SONGS[2], CURATED_FEATURED_SONGS[3]],
    albums: [],
    singles: [],
    bio: 'India’s most celebrated romantic playback vocalist, beloved worldwide for soul-stirring ballads.'
  },
  {
    id: '456323',
    name: 'Pritam',
    image: {
      low: 'https://c.saavncdn.com/artists/Pritam_Chakraborty-20170711073326_150x150.jpg',
      medium: 'https://c.saavncdn.com/artists/Pritam_Chakraborty-20170711073326_500x500.jpg',
      high: 'https://c.saavncdn.com/artists/Pritam_Chakraborty-20170711073326_500x500.jpg'
    },
    followerCount: 22100000,
    verified: true,
    dominantLanguage: 'Hindi',
    topSongs: [CURATED_FEATURED_SONGS[0]],
    albums: [],
    singles: [],
    bio: 'Pritam Chakraborty is an acclaimed composer and record producer crafting modern Indian cinema anthems.'
  },
  {
    id: '455130',
    name: 'The Weeknd',
    image: {
      low: 'https://c.saavncdn.com/artists/The_Weeknd_150x150.jpg',
      medium: 'https://c.saavncdn.com/artists/The_Weeknd_500x500.jpg',
      high: 'https://c.saavncdn.com/artists/The_Weeknd_500x500.jpg'
    },
    followerCount: 65200000,
    verified: true,
    dominantLanguage: 'English',
    topSongs: [CURATED_FEATURED_SONGS[1]],
    albums: [],
    singles: [],
    bio: 'Abel Makkonen Tesfaye, known professionally as The Weeknd, is a Canadian singer-songwriter known for sonic innovation.'
  },
  {
    id: '742398',
    name: 'Anirudh Ravichander',
    image: {
      low: 'https://c.saavncdn.com/artists/Anirudh_Ravichander_003_20260121134149_150x150.jpg',
      medium: 'https://c.saavncdn.com/artists/Anirudh_Ravichander_003_20260121134149_500x500.jpg',
      high: 'https://c.saavncdn.com/artists/Anirudh_Ravichander_003_20260121134149_500x500.jpg'
    },
    followerCount: 29500000,
    verified: true,
    dominantLanguage: 'Tamil',
    topSongs: [CURATED_FEATURED_SONGS[3]],
    albums: [],
    singles: [],
    bio: 'Rockstar Anirudh is a visionary music composer dominating Indian contemporary film scoring.'
  },
  {
    id: '468246',
    name: 'Karan Aujla',
    image: {
      low: 'https://c.saavncdn.com/artists/Karan_Aujla_004_20260810121947_150x150.jpg',
      medium: 'https://c.saavncdn.com/artists/Karan_Aujla_004_20260810121947_500x500.jpg',
      high: 'https://c.saavncdn.com/artists/Karan_Aujla_004_20260810121947_500x500.jpg'
    },
    followerCount: 16700000,
    verified: true,
    dominantLanguage: 'Punjabi',
    topSongs: [CURATED_FEATURED_SONGS[5]],
    albums: [],
    singles: [],
    bio: 'International Punjabi superstar known for groundbreaking folk-hop fusion and lyrical flair.'
  }
];

export const CURATED_FEATURED_PLAYLISTS: Playlist[] = [
  {
    id: 'top-charts-india',
    title: 'Top 50 — India',
    description: 'The most played tracks across India right now. Updated daily.',
    artwork: {
      low: 'https://c.saavncdn.com/editorial/Hindi-IndiaSuperhitsTop50_20260911054516.jpg',
      medium: 'https://c.saavncdn.com/editorial/Hindi-IndiaSuperhitsTop50_20260911054516.jpg',
      high: 'https://c.saavncdn.com/editorial/Hindi-IndiaSuperhitsTop50_20260911054516.jpg',
    },
    songCount: 50,
    songs: CURATED_FEATURED_SONGS,
    followerCount: 1240000
  },
  {
    id: 'trending-today',
    title: 'Atmospheric Nights',
    description: 'Deep cinematic ambient, acoustic and midnight lofi soundscapes.',
    artwork: {
      low: 'https://c.saavncdn.com/editorial/charts_TrendingToday_134351_20230826113717.jpg',
      medium: 'https://c.saavncdn.com/editorial/charts_TrendingToday_134351_20230826113717.jpg',
      high: 'https://c.saavncdn.com/editorial/charts_TrendingToday_134351_20230826113717.jpg',
    },
    songCount: 35,
    songs: [CURATED_FEATURED_SONGS[1], CURATED_FEATURED_SONGS[4], CURATED_FEATURED_SONGS[0]],
    followerCount: 890000
  },
  {
    id: 'punjabi-fire',
    title: 'Punjabi Wave',
    description: 'Heavy basslines, swagger and high-voltage Punjabi bangers.',
    artwork: {
      low: 'https://c.saavncdn.com/editorial/Let_sPlayKaranAujlaPunjabi_20240828041657_500x500.jpg',
      medium: 'https://c.saavncdn.com/editorial/Let_sPlayKaranAujlaPunjabi_20240828041657_500x500.jpg',
      high: 'https://c.saavncdn.com/editorial/Let_sPlayKaranAujlaPunjabi_20240828041657_500x500.jpg',
    },
    songCount: 40,
    songs: [CURATED_FEATURED_SONGS[5]],
    followerCount: 750000
  }
];
