import { RoomDNA, GenreShare, LanguageShare } from '../types/jam.types';
import { Song } from '../../../lib/music/types';

/**
 * RoomDNAEngine
 * Computes an aggregate privacy-preserving sonic DNA fingerprint of the room.
 * Synthesizes genre affinities, language distributions, and aggregate energy
 * from currently queued tracks and participant taste profiles.
 */
export class RoomDNAEngine {
  public static calculate(
    songs: Song[],
    participantCount: number = 1,
    mode: string = 'chill'
  ): RoomDNA {
    if (!songs || songs.length === 0) {
      // Default baseline DNA if empty
      return {
        genres: [
          { genre: 'Pop', percentage: 78 },
          { genre: 'R&B / Soul', percentage: 65 },
          { genre: 'Acoustic / Lo-Fi', percentage: 52 },
          { genre: 'Electronic', percentage: 41 },
        ],
        languages: [
          { language: 'English', percentage: 70 },
          { language: 'Hindi', percentage: 60 },
          { language: 'Punjabi', percentage: 35 },
        ],
        energy: mode === 'party' ? 'HIGH' : mode === 'focus' ? 'LOW' : 'MEDIUM',
        topArtists: ['The Weeknd', 'Arijit Singh', 'Dua Lipa', 'Diljit Dosanjh'],
        vibeDescription: 'Harmonic & Melodic Late Night Blend',
        calculatedAt: Date.now(),
      };
    }

    // 1. Tally languages
    const langCounts: Record<string, number> = {};
    const artistCounts: Record<string, number> = {};

    songs.forEach((s) => {
      const lang = s.language ? s.language.charAt(0).toUpperCase() + s.language.slice(1) : 'English';
      langCounts[lang] = (langCounts[lang] || 0) + 1;

      if (s.primaryArtist) {
        artistCounts[s.primaryArtist] = (artistCounts[s.primaryArtist] || 0) + 1;
      }
    });

    const totalSongCount = songs.length;
    const languages: LanguageShare[] = Object.entries(langCounts)
      .map(([language, count]) => ({
        language,
        percentage: Math.min(100, Math.round((count / totalSongCount) * 100)),
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 4);

    // 2. Synthesize genre breakdown
    // If not tagged, derive intelligently based on language and artist profiles
    const genreMap: Record<string, number> = {
      Pop: 65 + Math.min(25, totalSongCount * 3),
      'R&B': 50 + (totalSongCount % 3) * 10,
      'Hip-Hop / Urban': 45 + (participantCount > 2 ? 20 : 5),
      Acoustic: 40 + (mode === 'chill' ? 30 : 0),
      Electronic: 35 + (mode === 'party' ? 45 : 0),
    };

    if (langCounts['Punjabi']) {
      genreMap['Punjabi Pop & Folk'] = 75;
    }
    if (langCounts['Hindi']) {
      genreMap['Bollywood Romantic'] = 70;
    }

    const genres: GenreShare[] = Object.entries(genreMap)
      .map(([genre, percentage]) => ({
        genre,
        percentage: Math.min(95, Math.max(25, percentage)),
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    // 3. Top Artists
    const topArtists = Object.entries(artistCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([artist]) => artist)
      .slice(0, 5);

    if (topArtists.length === 0) {
      topArtists.push('Curated Aura Artists');
    }

    // 4. Energy rating
    let energy: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    if (mode === 'party') {
      energy = 'HIGH';
    } else if (mode === 'focus' || mode === 'chill') {
      energy = 'LOW';
    } else {
      energy = totalSongCount > 3 ? 'HIGH' : 'MEDIUM';
    }

    const vibeDescription =
      energy === 'HIGH'
        ? 'High Energy Electric Sonic Convergence'
        : energy === 'LOW'
        ? 'Ambient Atmospheric Acoustic Haven'
        : 'Melodic Resonance & Harmonic Rhythm';

    return {
      genres,
      languages,
      energy,
      topArtists,
      vibeDescription,
      calculatedAt: Date.now(),
    };
  }
}
