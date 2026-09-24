import React, { useState, useEffect } from 'react';
import { Play, Shuffle, UserPlus, Check, ArrowLeft, Heart, Music2, Disc, CloudCheck } from 'lucide-react';
import { Artist, Song, Album } from '../../lib/music/types';
import { usePlayerStore } from '../../stores/playerStore';
import { offlineMetadataCache } from '../../lib/storage/offlineMetadataCache';

interface ArtistViewProps {
  artist: Artist;
  onBack: () => void;
  onSelectAlbum?: (album: Album) => void;
}

export const ArtistView: React.FC<ArtistViewProps> = ({ artist, onBack, onSelectAlbum }) => {
  const { playTrack, currentTrack, isPlaying, likedSongIds, toggleLike } = usePlayerStore();
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (artist) {
      offlineMetadataCache.recordArtistVisit(artist);
    }
  }, [artist]);

  const isOfflineCached = offlineMetadataCache.isArtistOfflineReady(artist.id);
  const topSongs = artist.topSongs || [];

  const handlePlayAll = () => {
    if (topSongs.length > 0) {
      playTrack(topSongs[0], topSongs);
    }
  };

  const handleShuffle = () => {
    if (topSongs.length > 0) {
      const shuffled = [...topSongs].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-fadeIn">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Discovery</span>
      </button>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 min-h-[280px] sm:min-h-[340px] flex items-end p-6 sm:p-10 shadow-2xl bg-gradient-to-t from-black via-slate-950/70 to-transparent">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center -z-10 filter brightness-50 contrast-125"
          style={{ backgroundImage: `url(${artist.image.high || artist.image.medium})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-black/40 to-transparent -z-10" />

        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-[var(--aura-primary,#6366f1)]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--aura-primary,#6366f1)]" />
              <span>Verified Artist</span>
            </div>
            {isOfflineCached && (
              <>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <div className="flex items-center gap-1 text-emerald-400">
                  <CloudCheck className="w-3.5 h-3.5" />
                  <span>Offline Ready</span>
                </div>
              </>
            )}
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            {artist.name}
          </h1>

          {artist.followerCount && (
            <p className="text-xs sm:text-sm text-slate-300 font-mono">
              {(artist.followerCount / 1000000).toFixed(1)}M Monthly Listeners · {artist.dominantLanguage || 'Global'}
            </p>
          )}

          {artist.bio && (
            <p className="text-xs text-slate-400 line-clamp-2 max-w-xl">
              {artist.bio}
            </p>
          )}

          {/* Action CTAs */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handlePlayAll}
              className="px-6 py-2.5 rounded-full bg-white text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play</span>
            </button>

            <button
              onClick={handleShuffle}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
              title="Shuffle top songs"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-4 py-2.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                isFollowing ? 'bg-white/20 text-white' : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              {isFollowing ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>{isFollowing ? 'Following' : 'Follow'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Songs List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Popular Tracks</h2>

        <div className="space-y-1">
          {topSongs.map((song, idx) => {
            const isCurrent = currentTrack?.id === song.id;
            const isLiked = likedSongIds.includes(song.id);

            return (
              <div
                key={`${song.id}-${idx}`}
                onClick={() => playTrack(song, topSongs)}
                className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors border ${
                  isCurrent
                    ? 'bg-[var(--aura-primary,#6366f1)]/15 border-[var(--aura-primary,#6366f1)]/30'
                    : 'hover:bg-white/5 border-transparent'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <span className="w-6 text-center text-xs font-mono text-slate-500 tabular-nums">
                    {idx + 1}
                  </span>

                  <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 shadow">
                    <img
                      src={song.artwork.low || song.artwork.medium}
                      alt={song.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-current" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h4 className={`text-sm font-semibold truncate ${isCurrent ? 'text-[var(--aura-primary,#6366f1)]' : 'text-white'}`}>
                      {song.title}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">
                      {song.album.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pl-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(song);
                    }}
                    className={`p-1.5 rounded-full transition-colors ${
                      isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-white opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  </button>

                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Discography Albums (if available) */}
      {artist.albums && artist.albums.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight">Discography</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {artist.albums.map((album, idx) => (
              <div
                key={`${album.id}-${idx}`}
                onClick={() => onSelectAlbum && onSelectAlbum(album)}
                className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all cursor-pointer"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 shadow">
                  <img
                    src={album.artwork.medium || album.artwork.low}
                    alt={album.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <h4 className="text-xs font-semibold text-white truncate">{album.title}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{album.year || 'Album'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
