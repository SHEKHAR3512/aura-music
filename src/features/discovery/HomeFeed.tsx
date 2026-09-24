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
  Check
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { Song, Playlist, Artist, Album } from '../../lib/music/types';
import { CURATED_FEATURED_SONGS, CURATED_POPULAR_ARTISTS, CURATED_FEATURED_PLAYLISTS } from '../../lib/music/cache';
import { GenreTagFilter, GENRE_TAGS } from './GenreTagFilter';
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

  const handleClearGenreFilter = () => {
    triggerHaptic('button');
    setSelectedGenre('all');
  };

  return (
    <div className="space-y-8 sm:space-y-10 pb-20">
      
      {/* Editorial Spotlight Hero */}
      {heroSong && (
        <div 
          className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-black p-6 sm:p-10 shadow-2xl transition-all duration-500"
          style={{
            borderColor: isFiltered ? `${activeGenre.accentColor}40` : undefined,
          }}
        >
          {/* Ambient Glow */}
          <div 
            className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full blur-3xl opacity-35 pointer-events-none transition-all duration-700"
            style={{ 
              backgroundColor: isFiltered ? activeGenre.accentColor : 'var(--aura-primary, #6366f1)' 
            }}
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div 
                className="flex items-center gap-2 text-xs font-mono mb-3 uppercase tracking-wider font-semibold"
                style={{ color: isFiltered ? activeGenre.accentColor : 'var(--aura-primary, #6366f1)' }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {isFiltered ? `${activeGenre.label} Spotlight` : 'Editorial Spotlight · High Fidelity Master'}
                </span>
              </div>
              
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {heroSong.title}
              </h1>
              <p className="text-base sm:text-lg text-slate-300 mt-2 font-medium">
                {heroSong.primaryArtist} · {heroSong.album.title}
              </p>
              <p className="text-xs text-slate-400 mt-3 line-clamp-2">
                {isFiltered 
                  ? activeGenre.description 
                  : 'Immerse yourself in precision dynamic range, ultra-clear acoustic vocals, and harmonic mastering.'}
              </p>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => playTrack(heroSong, displayedSongs)}
                  className="px-6 py-3 rounded-full bg-white text-slate-950 font-bold text-sm flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play Master Stream</span>
                </button>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pl-3">
                  <span>320 KBPS</span>
                  <span aria-hidden="true">·</span>
                  <span>{heroSong.language || (isFiltered ? activeGenre.label : 'Master')}</span>
                </div>
              </div>
            </div>

            <div className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-white/10 self-center md:self-auto group">
              <img
                src={heroSong.artwork.high || heroSong.artwork.medium}
                alt={heroSong.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-40" />
            </div>
          </div>
        </div>
      )}

      {/* Genre Tag Filter Component */}
      <div className="pt-1">
        <GenreTagFilter
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
        />
      </div>

      {/* Active Genre Refinement Banner */}
      {isFiltered && (
        <div 
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition-all animate-fadeIn"
          style={{
            backgroundColor: `${activeGenre.accentColor}12`,
            borderColor: `${activeGenre.accentColor}35`,
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
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
            className="self-start sm:self-center shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-white text-xs font-semibold transition-colors cursor-pointer border border-white/10"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset to All</span>
          </button>
        </div>
      )}

      {/* Main Track Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isFiltered ? (
              <div 
                className="w-4 h-4 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: activeGenre.accentColor }}
              >
                {React.createElement(activeGenre.icon, { className: 'w-2.5 h-2.5' })}
              </div>
            ) : (
              <Flame className="w-4 h-4 text-rose-400" />
            )}
            <h2 className="text-xl font-bold text-white tracking-tight">
              {isFiltered ? `${activeGenre.label} Soundscapes` : 'Trending Soundscapes'}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {isFiltered ? 'Refined by genre' : 'Updated hourly'}
          </span>
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
                      ? 'bg-white text-slate-950 font-bold shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Loading State Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {[...Array(6)].map((_, idx) => (
              <div 
                key={idx} 
                className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse flex items-center gap-3.5"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-white/10 rounded w-3/4" />
                  <div className="h-2.5 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedSongs.length === 0 ? (
          /* Empty State for Genre */
          <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
            <Music className="w-8 h-8 mx-auto text-slate-600 mb-1" />
            <p className="text-sm font-semibold text-white">No tracks found for {activeGenre.label}</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try choosing another genre tag or reset back to All Genres to discover trending hits.
            </p>
            <button
              type="button"
              onClick={handleClearGenreFilter}
              className="px-4 py-2 rounded-xl bg-white text-slate-950 text-xs font-bold shadow hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Reset to All Genres
            </button>
          </div>
        ) : (
          /* Tracks Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {displayedSongs.slice(0, 12).map((song, i) => {
              const isCurrent = currentTrack?.id === song.id;
              return (
                <div
                  key={`${song.id}-${i}`}
                  onClick={() => playTrack(song, displayedSongs)}
                  className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                    isCurrent
                      ? 'bg-[var(--aura-primary,#6366f1)]/15 border-[var(--aura-primary,#6366f1)]/30 shadow-md'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md">
                      <img
                        src={song.artwork.low || song.artwork.medium}
                        alt={song.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="w-4 h-4 text-white fill-current" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h4 className={`text-sm font-semibold truncate ${isCurrent ? 'text-[var(--aura-primary,#6366f1)] font-bold' : 'text-white'}`}>
                        {song.title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {song.primaryArtist}
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 tabular-nums pl-2">
                    {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Featured Genre Artists (when filtered) or Visionary Artists (when All) */}
      {isFiltered && genreData?.artists && genreData.artists.length > 0 ? (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Featured {activeGenre.label} Artists
            </h2>
            <span className="text-xs text-slate-400 font-mono">Top performers</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {genreData.artists.slice(0, 5).map((artist, idx) => (
              <div
                key={`${artist.id}-${idx}`}
                onClick={() => onSelectArtist(artist)}
                className="group flex flex-col items-center text-center p-3 rounded-2xl hover:bg-white/[0.05] transition-all cursor-pointer border border-transparent hover:border-white/5"
              >
                <div 
                  className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-xl mb-3 border-2 transition-colors"
                  style={{ borderColor: `${activeGenre.accentColor}50` }}
                >
                  <img
                    src={artist.image.medium || artist.image.low}
                    alt={artist.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h4 className="text-sm font-semibold text-white truncate w-full">{artist.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{activeGenre.label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Genre Playlists (when filtered) or Top Charts & Playlists (when All) */}
      {isFiltered && genreData?.playlists && genreData.playlists.length > 0 ? (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                {activeGenre.label} Collections & Playlists
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {genreData.playlists.slice(0, 3).map((pl, idx) => (
              <div
                key={`${pl.id}-${idx}`}
                onClick={() => onSelectPlaylist(pl)}
                className="group p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-video sm:aspect-square rounded-xl overflow-hidden mb-3 shadow-lg">
                  <img
                    src={pl.artwork.medium || pl.artwork.low}
                    alt={pl.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300">
                      {pl.songCount} Tracks
                    </span>
                    <h3 className="text-base font-bold text-white truncate">{pl.title}</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {pl.description || `Curated high-fidelity ${activeGenre.label} selection.`}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : !isFiltered ? (
        /* Top Charts Playlists (All Mode) */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">Top Charts & Playlists</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {charts.slice(0, 3).map((pl, idx) => (
              <div
                key={`${pl.id}-${idx}`}
                onClick={() => onSelectPlaylist(pl)}
                className="group p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-video sm:aspect-square rounded-xl overflow-hidden mb-3 shadow-lg">
                  <img
                    src={pl.artwork.medium || pl.artwork.low}
                    alt={pl.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300">
                      {pl.songCount} Tracks
                    </span>
                    <h3 className="text-base font-bold text-white truncate">{pl.title}</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {pl.description || 'Explore the chart-topping selection curated for high-resolution acoustic sound.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Featured Artists (All Mode) */}
      {!isFiltered && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">Visionary Artists</h2>
            <span className="text-xs text-slate-400 font-mono">Popular worldwide</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {CURATED_POPULAR_ARTISTS.map((artist, idx) => (
              <div
                key={`${artist.id}-${idx}`}
                onClick={() => onSelectArtist(artist)}
                className="group flex flex-col items-center text-center p-3 rounded-2xl hover:bg-white/[0.05] transition-all cursor-pointer border border-transparent hover:border-white/5"
              >
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-xl mb-3 border-2 border-white/10 group-hover:border-[var(--aura-primary,#6366f1)] transition-colors">
                  <img
                    src={artist.image.medium || artist.image.low}
                    alt={artist.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h4 className="text-sm font-semibold text-white truncate w-full">{artist.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{artist.dominantLanguage} · Artist</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
