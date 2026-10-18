import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Play, 
  Sparkles, 
  Flame, 
  TrendingUp, 
  Music, 
  Radio, 
  ChevronRight, 
  Disc, 
  X, 
  SlidersHorizontal,
  Compass,
  Check,
  Disc3,
  Waves
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { Song, Playlist, Artist, Album } from '../../lib/music/types';
import { CURATED_FEATURED_SONGS, CURATED_POPULAR_ARTISTS, CURATED_FEATURED_PLAYLISTS } from '../../lib/music/cache';
import { GenreTagFilter, GENRE_TAGS } from './GenreTagFilter';
import { MasterTrackCard, AuraArtistCard, AuraPlaylistCard } from '../../components/ui/AuraCards';
import { TrackCardSkeleton, HeroSpotlightSkeleton, EqualizerLoader } from '../../components/ui/AudioLoaders';
import { triggerHaptic } from '../../lib/utils/haptics';

interface HomeFeedProps {
  onSelectArtist: (artist: Artist) => void;
  onSelectAlbum: (album: Album) => void;
  onSelectPlaylist: (playlist: Playlist) => void;
}

const LANGUAGES = [
  { id: 'hindi', label: 'Hindi' },
  { id: 'punjabi', label: 'Punjabi' },
  { id: 'english', label: 'English' },
  { id: 'tamil', label: 'Tamil' },
  { id: 'telugu', label: 'Telugu' },
  { id: 'malayalam', label: 'Malayalam' },
];

export const HomeFeed: React.FC<HomeFeedProps> = ({ onSelectArtist, onSelectAlbum, onSelectPlaylist }) => {
  const { playTrack, currentTrack, isPlaying } = usePlayerStore();
  const [selectedLanguage, setSelectedLanguage] = useState('hindi');
  const [selectedGenre, setSelectedGenre] = useState('all');

  const activeGenre = GENRE_TAGS.find((g) => g.id === selectedGenre) || GENRE_TAGS[0];

  // Fetch trending songs by language (default when genre is 'all')
  const { data: trendingSongs = CURATED_FEATURED_SONGS, isLoading: isTrendingLoading } = useQuery<Song[]>({
    queryKey: ['trending', selectedLanguage],
    queryFn: async () => {
      const res = await fetch(`/api/music/trending?language=${selectedLanguage}`);
      if (!res.ok) throw new Error('Failed to load trending songs');
      return res.json();
    },
    staleTime: 1000 * 60 * 15,
  });

  // Fetch genre refined music when a specific genre tag is selected
  const { data: genreData, isLoading: isGenreLoading } = useQuery<{
    songs: Song[];
    albums: Album[];
    artists: Artist[];
    playlists: Playlist[];
  }>({
    queryKey: ['genre-search', selectedGenre, activeGenre.searchQuery],
    queryFn: async () => {
      if (selectedGenre === 'all') {
        return { songs: [], albums: [], artists: [], playlists: [] };
      }
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(activeGenre.searchQuery)}`);
      if (!res.ok) throw new Error('Failed to load genre songs');
      return res.json();
    },
    enabled: selectedGenre !== 'all',
    staleTime: 1000 * 60 * 20,
  });

  // Fetch top charts playlists
  const { data: charts = CURATED_FEATURED_PLAYLISTS } = useQuery<Playlist[]>({
    queryKey: ['charts'],
    queryFn: async () => {
      const res = await fetch('/api/music/charts');
      if (!res.ok) throw new Error('Failed to load charts');
      return res.json();
    },
    staleTime: 1000 * 60 * 30,
  });

  // Determine active song list & hero song
  const isFiltered = selectedGenre !== 'all';
  const displayedSongs = isFiltered 
    ? (genreData?.songs && genreData.songs.length > 0 ? genreData.songs : [])
    : trendingSongs;
  const isLoading = isFiltered ? isGenreLoading : isTrendingLoading;
  const heroSong = displayedSongs[0] || trendingSongs[0] || CURATED_FEATURED_SONGS[0];
  const isHeroPlaying = currentTrack?.id === heroSong?.id && isPlaying;

  const handleClearGenreFilter = () => {
    triggerHaptic('button');
    setSelectedGenre('all');
  };

  return (
    <div className="space-y-10 sm:space-y-12 pb-24">
      
      {/* Editorial Spotlight Hero — Vinyl Sleeve Stage Presentation */}
      {isLoading ? (
        <HeroSpotlightSkeleton />
      ) : heroSong ? (
        <div 
          className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-r from-[#0d101a] via-[#121626] to-[#090b12] p-6 sm:p-10 shadow-2xl transition-all duration-700 group"
          style={{
            borderColor: isFiltered ? `${activeGenre.accentColor}35` : undefined,
          }}
        >
          {/* Ambient Acoustic Radial Glow */}
          <div 
            className="absolute -right-16 -bottom-16 w-96 h-96 rounded-full blur-3xl opacity-35 pointer-events-none transition-all duration-700 animate-aura-breathe"
            style={{ 
              backgroundColor: isFiltered ? activeGenre.accentColor : 'var(--aura-primary, #6366f1)' 
            }}
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-xl space-y-3">
              {/* Telemetry Tag */}
              <div 
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider font-semibold border backdrop-blur-md"
                style={{ 
                  color: isFiltered ? activeGenre.accentColor : '#a5b4fc',
                  backgroundColor: isFiltered ? `${activeGenre.accentColor}15` : 'rgba(99,102,241,0.12)',
                  borderColor: isFiltered ? `${activeGenre.accentColor}30` : 'rgba(99,102,241,0.25)',
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {isFiltered ? `${activeGenre.label} Spotlight` : 'Editorial Master · 24-Bit / 96kHz High Fidelity'}
                </span>
              </div>
              
              {/* Big Title in Space Grotesk */}
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight font-display">
                {heroSong.title}
              </h1>

              {/* Artist & Album */}
              <p className="text-base sm:text-lg text-slate-300 font-medium">
                <span className="text-white font-semibold">{heroSong.primaryArtist}</span>
                <span className="text-slate-600 mx-2" aria-hidden="true">·</span>
                <span className="text-slate-400">{heroSong.album.title}</span>
              </p>

              <p className="text-xs sm:text-sm text-slate-400 max-w-lg leading-relaxed">
                {isFiltered 
                  ? activeGenre.description 
                  : 'Engineered with studio-grade acoustic clarity, wide dynamic range, and harmonic frequency balance.'}
              </p>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <button
                  onClick={() => {
                    triggerHaptic('button');
                    playTrack(heroSong, displayedSongs);
                  }}
                  className="px-7 py-3.5 rounded-full bg-white text-slate-950 font-bold text-sm flex items-center gap-2.5 shadow-[0_4px_20px_rgba(255,255,255,0.25)] hover:scale-104 active:scale-96 transition-transform cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current translate-x-0.5" />
                  <span>{isHeroPlaying ? 'Resume Stream' : 'Play Master Stream'}</span>
                </button>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 px-3 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
                  <span className="text-emerald-400 font-bold">LOSSLESS FLAC</span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span>{heroSong.language || 'Original'}</span>
                </div>
              </div>
            </div>

            {/* Interactive Vinyl Record Sleeve Presentation */}
            <div className="relative w-52 h-52 sm:w-64 sm:h-64 shrink-0 self-center md:self-auto">
              {/* Vinyl Disc Slipping Out Behind the Sleeve */}
              <div 
                className={`absolute top-2 -right-8 w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-[#0a0a0f] border-2 border-slate-700/80 shadow-2xl flex items-center justify-center transition-transform duration-700 overflow-hidden ${
                  isHeroPlaying 
                    ? 'translate-x-6 animate-vinyl-spin' 
                    : 'group-hover:translate-x-8 group-hover:rotate-45'
                }`}
              >
                <div className="absolute inset-0 vinyl-grooves opacity-70" />
                {/* Center Label */}
                <div className="relative w-1/3 h-1/3 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-rose-500 flex items-center justify-center border border-white/20">
                  <div className="w-3 h-3 rounded-full bg-[#090b12] border border-white/40" />
                </div>
              </div>

              {/* Album Artwork Sleeve (Front) */}
              <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-black">
                <img
                  src={heroSong.artwork.high || heroSong.artwork.medium}
                  alt={heroSong.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-50" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Genre Tag Filter Strip */}
      <div className="pt-1">
        <GenreTagFilter
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
        />
      </div>

      {/* Active Genre Refinement Banner */}
      {isFiltered && (
        <div 
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border transition-all animate-dwi-enter"
          style={{
            backgroundColor: `${activeGenre.accentColor}12`,
            borderColor: `${activeGenre.accentColor}35`,
          }}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg"
              style={{ backgroundColor: activeGenre.accentColor }}
            >
              {React.createElement(activeGenre.icon, { className: 'w-5 h-5' })}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span 
                  className="text-[11px] font-mono uppercase tracking-wider font-bold"
                  style={{ color: activeGenre.accentColor }}
                >
                  Active Genre Filter
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  · {displayedSongs.length} {displayedSongs.length === 1 ? 'track' : 'tracks'} refined
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight truncate">
                {activeGenre.label}
              </h3>
              <p className="text-xs text-slate-400 truncate">
                {activeGenre.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearGenreFilter}
            className="self-start sm:self-center shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-white text-xs font-semibold transition-colors cursor-pointer border border-white/10"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset to All</span>
          </button>
        </div>
      )}

      {/* Main Track Grid Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {isFiltered ? (
              <div 
                className="w-5 h-5 rounded-lg flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: activeGenre.accentColor }}
              >
                {React.createElement(activeGenre.icon, { className: 'w-3 h-3' })}
              </div>
            ) : (
              <Flame className="w-5 h-5 text-rose-400" />
            )}
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
              {isFiltered ? `${activeGenre.label} Soundscapes` : 'Trending Soundscapes'}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              {isFiltered ? 'Refined by genre' : 'Studio Master Feed'}
            </span>
          </div>
        </div>

        {/* Language Dial Selector (Displayed when 'All' is active) */}
        {!isFiltered && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {LANGUAGES.map((lang) => {
              const active = selectedLanguage === lang.id;
              return (
                <button
                  key={lang.id}
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedLanguage(lang.id);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-white text-slate-950 font-bold shadow-lg scale-102'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
            {[...Array(6)].map((_, idx) => (
              <TrackCardSkeleton key={idx} />
            ))}
          </div>
        ) : displayedSongs.length === 0 ? (
          /* Empty State for Genre */
          <div className="p-10 text-center bg-[#0d101a]/80 border border-white/5 rounded-3xl space-y-4">
            <div className="w-14 h-14 rounded-full bg-white/5 mx-auto flex items-center justify-center text-slate-400">
              <Disc3 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">No tracks found for {activeGenre.label}</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Try choosing another genre tag or reset back to All Genres to discover trending hits.
            </p>
            <button
              type="button"
              onClick={handleClearGenreFilter}
              className="px-5 py-2.5 rounded-xl bg-white text-slate-950 text-xs font-bold shadow hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Reset to All Genres
            </button>
          </div>
        ) : (
          /* Tracks Grid using MasterTrackCard */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
            {displayedSongs.slice(0, 12).map((song, i) => (
              <MasterTrackCard
                key={`${song.id}-${i}`}
                song={song}
                playlistContext={displayedSongs}
                index={i}
                showRank={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Featured Genre Artists (when filtered) or Visionary Artists (when All) */}
      {isFiltered && genreData?.artists && genreData.artists.length > 0 ? (
        <div className="space-y-4 animate-dwi-enter">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
              Featured {activeGenre.label} Artists
            </h2>
            <span className="text-xs text-slate-400 font-mono">Top performers</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {genreData.artists.slice(0, 5).map((artist, idx) => (
              <AuraArtistCard
                key={`${artist.id}-${idx}`}
                artist={artist}
                onClick={() => onSelectArtist(artist)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Genre Playlists (when filtered) or Top Charts & Playlists (when All) */}
      {isFiltered && genreData?.playlists && genreData.playlists.length > 0 ? (
        <div className="space-y-4 animate-dwi-enter">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
                {activeGenre.label} Collections & Playlists
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {genreData.playlists.slice(0, 3).map((pl, idx) => (
              <AuraPlaylistCard
                key={`${pl.id}-${idx}`}
                playlist={pl}
                onClick={() => onSelectPlaylist(pl)}
                badge={`${pl.songCount || 'Curated'} Tracks`}
              />
            ))}
          </div>
        </div>
      ) : !isFiltered ? (
        /* Top Charts Playlists (All Mode) */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
                Top Charts & Soundstage Playlists
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Curated daily</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {charts.slice(0, 3).map((pl, idx) => (
              <AuraPlaylistCard
                key={`${pl.id}-${idx}`}
                playlist={pl}
                onClick={() => onSelectPlaylist(pl)}
                rank={`#0${idx + 1}`}
                badge={`${pl.songCount || '50'} Tracks`}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Visionary Artists (All Mode) */}
      {!isFiltered && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
              Visionary Artists
            </h2>
            <span className="text-xs text-slate-400 font-mono">Popular worldwide</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {CURATED_POPULAR_ARTISTS.map((artist, idx) => (
              <AuraArtistCard
                key={`${artist.id}-${idx}`}
                artist={artist}
                onClick={() => onSelectArtist(artist)}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
