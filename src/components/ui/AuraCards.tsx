import React from 'react';
import { Play, Pause, Heart, Plus, Check, Disc, Music, User, Radio, Sparkles } from 'lucide-react';
import { Song, Artist, Playlist, Album } from '../../lib/music/types';
import { usePlayerStore } from '../../stores/playerStore';
import { formatTime } from '../../hooks/useAudioTime';
import { MiniEqualizerBars } from './AudioLoaders';
import { triggerHaptic } from '../../lib/utils/haptics';

interface MasterTrackCardProps {
  song: Song;
  playlistContext?: Song[];
  index?: number;
  showRank?: boolean;
}

export const MasterTrackCard: React.FC<MasterTrackCardProps> = ({
  song,
  playlistContext,
  index,
  showRank = false,
}) => {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    likedSongIds,
    toggleLike,
    addToQueue,
  } = usePlayerStore();

  const isCurrent = currentTrack?.id === song.id;
  const isThisPlaying = isCurrent && isPlaying;
  const isLiked = likedSongIds.includes(song.id);

  const handleCardClick = () => {
    triggerHaptic('cardSelect');
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(song, playlistContext || [song]);
    }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('like');
    toggleLike(song);
  };

  const handleQueueClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('button');
    addToQueue(song);
  };

  const durationStr = song.duration ? formatTime(song.duration) : '3:20';

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`Play ${song.title} by ${song.primaryArtist}`}
      className={`group relative flex items-center justify-between p-3 rounded-2xl cursor-pointer select-none transition-all duration-300 border ${
        isCurrent
          ? 'bg-gradient-to-r from-indigo-950/70 via-[#101424] to-[#0c0e18] border-indigo-500/40 shadow-[0_4px_24px_-4px_rgba(99,102,241,0.25)]'
          : 'bg-[#0c0f18]/80 hover:bg-[#131826] border-white/[0.06] hover:border-white/15'
      }`}
    >
      {/* Ambient Active Edge Accent */}
      {isCurrent && (
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-indigo-400 to-cyan-400 rounded-r-full shadow-[0_0_8px_#6366f1]" />
      )}

      {/* Left: Artwork, Vinyl Edge, Title & Artist */}
      <div className="flex items-center gap-3.5 min-w-0 pr-2">
        {/* Optional Rank / Index Number */}
        {showRank && typeof index === 'number' && (
          <span className="w-5 text-center text-xs font-mono font-bold text-slate-500 group-hover:text-slate-300 tabular-nums shrink-0">
            {index < 9 ? `0${index + 1}` : index + 1}
          </span>
        )}

        {/* Artwork Box with Vinyl Disc Sleeve Peek */}
        <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-xl overflow-hidden shrink-0 shadow-md border border-white/10 group-hover:shadow-indigo-500/20 transition-all">
          <img
            src={song.artwork.medium || song.artwork.low}
            alt={song.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
          />
          
          {/* Subtle Vinyl Grooves Texture */}
          <div className="absolute inset-0 vinyl-grooves opacity-40 pointer-events-none" />

          {/* Hover / Playing Overlay */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all ${
              isCurrent
                ? 'bg-black/50 opacity-100'
                : 'bg-black/40 opacity-0 group-hover:opacity-100'
            }`}
          >
            {isThisPlaying ? (
              <MiniEqualizerBars color="#a5b4fc" />
            ) : isCurrent ? (
              <Play className="w-5 h-5 text-white fill-current" />
            ) : (
              <Play className="w-4 h-4 text-white fill-current translate-x-0.5" />
            )}
          </div>
        </div>

        {/* Song Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className={`text-sm font-semibold tracking-tight truncate ${
                isCurrent ? 'text-indigo-200 font-bold' : 'text-slate-100 group-hover:text-white'
              }`}
            >
              {song.title}
            </h4>
            {isCurrent && (
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Playing
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
            <span className="truncate max-w-[140px] sm:max-w-[200px] hover:text-slate-200">
              {song.primaryArtist}
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider hidden sm:inline">
              320K Master
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions, Duration & Like */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Add to Queue Button (Visible on hover/touch) */}
        <button
          onClick={handleQueueClick}
          aria-label="Add to Queue"
          title="Add to Up Next"
          className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Favorite / Like Button */}
        <button
          onClick={handleLikeClick}
          aria-label={isLiked ? "Unlike song" : "Like song"}
          className={`p-1.5 rounded-full transition-all cursor-pointer ${
            isLiked
              ? 'text-rose-400 hover:text-rose-300'
              : 'text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 focus:opacity-100'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        </button>

        {/* Duration */}
        <span className="text-xs font-mono text-slate-400 tabular-nums pl-1 w-10 text-right">
          {durationStr}
        </span>
      </div>
    </div>
  );
};

interface AuraArtistCardProps {
  artist: Artist;
  onClick: () => void;
}

export const AuraArtistCard: React.FC<AuraArtistCardProps> = ({ artist, onClick }) => {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View artist ${artist.name}`}
      className="group flex flex-col items-center text-center p-4 rounded-3xl bg-[#0c0f18]/60 hover:bg-[#121624] border border-white/[0.06] hover:border-indigo-500/30 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-indigo-500/10"
    >
      {/* Concentric Acoustic Wave Framing */}
      <div className="relative mb-3.5">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-white/15 group-hover:border-indigo-400 transition-all shadow-xl group-hover:scale-105 duration-500">
          <img
            src={artist.image.medium || artist.image.high}
            alt={artist.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Ambient Ring Glow */}
        <div className="absolute inset-0 rounded-full group-hover:animate-sonic-pulse pointer-events-none" />
      </div>

      <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors tracking-tight line-clamp-1">
        {artist.name}
      </h4>
      
      <p className="text-[11px] font-mono text-slate-400 mt-1 tabular-nums">
        {artist.followerCount 
          ? `${(artist.followerCount / 1000000).toFixed(1)}M Listeners` 
          : 'Verified Artist'}
      </p>
    </div>
  );
};

interface AuraPlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
  badge?: string;
  rank?: string;
}

export const AuraPlaylistCard: React.FC<AuraPlaylistCardProps> = ({
  playlist,
  onClick,
  badge,
  rank,
}) => {
  const { playTrack } = usePlayerStore();

  const handleQuickPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playlist.songs && playlist.songs.length > 0) {
      triggerHaptic('button');
      playTrack(playlist.songs[0], playlist.songs);
    } else {
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Open playlist ${playlist.title}`}
      className="group relative flex flex-col p-3 sm:p-3.5 rounded-3xl bg-[#0c0f18]/80 hover:bg-[#131826] border border-white/[0.06] hover:border-white/15 transition-all duration-300 cursor-pointer shadow-lg hover:-translate-y-1"
    >
      {/* Vinyl Sleeve Container with High-Gloss Sheen */}
      <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 shadow-md border border-white/10 group-hover:shadow-2xl transition-all">
        {playlist.artwork && (
          <img
            src={playlist.artwork.high || playlist.artwork.medium}
            alt={playlist.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700"
          />
        )}

        {/* Vinyl Disc Silhouette Peeking on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Rank Watermark e.g. #01 */}
        {rank && (
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono font-bold text-xs">
            {rank}
          </div>
        )}

        {/* Track Count Badge */}
        {badge && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-indigo-500/80 backdrop-blur-md text-white font-mono text-[10px] font-bold uppercase tracking-wider shadow">
            {badge}
          </div>
        )}

        {/* Hover Quick Play Pill */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <button
            onClick={handleQuickPlay}
            aria-label="Play Playlist"
            className="w-11 h-11 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Playlist Meta */}
      <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-200 transition-colors line-clamp-1 tracking-tight">
        {playlist.title}
      </h4>

      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
        {playlist.description || `${playlist.songCount || 'Curated'} high-fidelity soundscapes`}
      </p>
    </div>
  );
};
