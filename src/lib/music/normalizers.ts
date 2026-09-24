import { Song, Album, Artist, Playlist, LyricsData, ArtworkUrls, ArtistRef, AudioQualityUrls } from './types';

// Decode HTML entities commonly present in music metadata (e.g. &quot;, &#039;, &amp;)
export function decodeHtmlEntities(str: string = ''): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// Clean and normalize image URLs to various resolutions (50x50, 150x150, 500x500)
export function normalizeArtwork(rawUrl?: string): ArtworkUrls {
  if (!rawUrl || typeof rawUrl !== 'string') {
    const fallback = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80';
    return { low: fallback, medium: fallback, high: fallback };
  }

  // JioSaavn image URLs often contain 150x150 or 50x50
  let high = rawUrl;
  let medium = rawUrl;
  let low = rawUrl;

  if (rawUrl.includes('150x150')) {
    high = rawUrl.replace('150x150', '500x500');
    low = rawUrl.replace('150x150', '50x50');
  } else if (rawUrl.includes('50x50')) {
    high = rawUrl.replace('50x50', '500x500');
    medium = rawUrl.replace('50x50', '150x150');
  } else if (!rawUrl.includes('500x500')) {
    // If no dimension in pattern, use as high
    high = rawUrl;
  }

  return { low, medium, high };
}

// Derive audio URLs for different bitrates (96kbps, 160kbps, 320kbps)
export function deriveQualityUrls(url: string): AudioQualityUrls {
  if (!url) return {};
  if (url.includes('_96.mp4') || url.includes('_160.mp4') || url.includes('_320.mp4')) {
    return {
      low: url.replace(/_(96|160|320)\.mp4/, '_96.mp4'),
      medium: url.replace(/_(96|160|320)\.mp4/, '_160.mp4'),
      high: url.replace(/_(96|160|320)\.mp4/, '_320.mp4'),
    };
  }
  return { medium: url, high: url };
}

export function parseArtists(rawArtists: any, subtitle?: string): ArtistRef[] {
  const result: ArtistRef[] = [];

  if (Array.isArray(rawArtists) && rawArtists.length > 0) {
    for (const a of rawArtists) {
      if (a && (a.name || a.title)) {
        result.push({
          id: String(a.id || a.artistId || Math.random().toString(36).substring(2, 9)),
          name: decodeHtmlEntities(a.name || a.title),
          role: a.role,
          image: a.image,
        });
      }
    }
  }

  if (result.length === 0 && subtitle) {
    const parts = subtitle.split(',').map(s => s.trim()).filter(Boolean);
    for (const p of parts) {
      result.push({
        id: p.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: decodeHtmlEntities(p),
      });
    }
  }

  if (result.length === 0) {
    result.push({ id: 'unknown', name: 'Various Artists' });
  }

  return result;
}

export function normalizeSong(raw: any, decryptedAudioUrl?: string): Song {
  const id = String(raw.id || raw.songId || raw.pid || '');
  const title = decodeHtmlEntities(raw.title || raw.song || raw.name || 'Untitled Track');
  const duration = parseInt(raw.duration || raw.more_info?.duration || '180', 10);
  
  // Extract artist references
  const rawArtistMap = raw.more_info?.artistMap?.primary_artists || raw.more_info?.artistMap?.artists || raw.artists;
  const artists = parseArtists(rawArtistMap, raw.subtitle || raw.header_desc);
  const primaryArtist = artists[0]?.name || decodeHtmlEntities(raw.more_info?.singers || raw.singers || 'Various Artists');

  const albumId = String(raw.more_info?.album_id || raw.album_id || '');
  const albumTitle = decodeHtmlEntities(raw.more_info?.album || raw.album || title);

  const artwork = normalizeArtwork(raw.image);

  const audioUrl = decryptedAudioUrl || raw.audioUrl || raw.media_preview_url || '';
  const qualityUrls = audioUrl ? deriveQualityUrls(audioUrl) : undefined;

  const explicit = raw.explicit_content === '1' || raw.explicit === true || raw.more_info?.explicit === '1';
  const hasLyrics = raw.more_info?.has_lyrics === 'true' || raw.has_lyrics === true || raw.has_lyrics === 'true';
  const lyricsId = raw.more_info?.lyrics_id || raw.lyrics_id;
  const lyricsSnippet = decodeHtmlEntities(raw.more_info?.lyrics_snippet || raw.lyrics_snippet);

  const language = raw.language || raw.more_info?.language || 'Hindi';
  const year = raw.year || raw.more_info?.year;
  const releaseDate = raw.release_date || raw.more_info?.release_date;
  const playCount = parseInt(raw.play_count || raw.more_info?.play_count || '0', 10);

  return {
    id,
    title,
    artists,
    primaryArtist,
    album: {
      id: albumId,
      title: albumTitle,
      artwork: artwork.high,
    },
    artwork,
    duration: isNaN(duration) ? 180 : duration,
    audioUrl: qualityUrls?.high || audioUrl,
    qualityUrls,
    language,
    releaseDate,
    year,
    explicit,
    hasLyrics,
    lyricsId,
    lyricsSnippet,
    playCount,
    source: 'jiosaavn',
    sourceId: id,
  };
}

export function normalizeAlbum(raw: any, songs: Song[] = []): Album {
  const id = String(raw.id || raw.albumid || '');
  const title = decodeHtmlEntities(raw.title || raw.name || 'Untitled Album');
  const artwork = normalizeArtwork(raw.image);
  const artists = parseArtists(raw.artists || raw.more_info?.artists, raw.subtitle || raw.header_desc);
  const primaryArtist = artists[0]?.name || decodeHtmlEntities(raw.header_desc || 'Various Artists');
  const songCount = parseInt(raw.more_info?.song_pids ? raw.more_info.song_pids.split(',').length : (raw.list_count || songs.length || 0), 10);

  return {
    id,
    title,
    artists,
    artwork,
    year: raw.year || raw.more_info?.year,
    language: raw.language || raw.more_info?.language,
    songCount: songs.length > 0 ? songs.length : songCount,
    songs,
    releaseDate: raw.release_date || raw.more_info?.release_date,
    primaryArtist,
    description: decodeHtmlEntities(raw.header_desc || raw.description),
  };
}

export function normalizeArtist(raw: any, topSongs: Song[] = [], albums: Album[] = []): Artist {
  const id = String(raw.artistId || raw.id || '');
  const name = decodeHtmlEntities(raw.name || 'Unknown Artist');
  const image = normalizeArtwork(raw.image);
  const followerCount = parseInt(raw.follower_count || '0', 10);
  const verified = raw.isVerified === true || raw.isVerified === 'true';
  const dominantLanguage = raw.dominantLanguage || raw.language;

  return {
    id,
    name,
    image,
    followerCount,
    verified,
    dominantLanguage,
    topSongs,
    albums,
    singles: [],
    bio: decodeHtmlEntities(raw.bio || raw.description),
  };
}

export function normalizePlaylist(raw: any, songs: Song[] = []): Playlist {
  const id = String(raw.id || raw.listid || '');
  const title = decodeHtmlEntities(raw.title || raw.listname || 'Untitled Playlist');
  const artwork = normalizeArtwork(raw.image);
  const description = decodeHtmlEntities(raw.description || raw.header_desc || '');
  const songCount = parseInt(raw.list_count || songs.length || 0, 10);
  const followerCount = parseInt(raw.follower_count || '0', 10);

  return {
    id,
    title,
    description,
    artwork,
    songCount: songs.length > 0 ? songs.length : songCount,
    songs,
    followerCount,
  };
}
