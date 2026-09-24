import React, { useEffect } from 'react';
import { Play, Shuffle, ArrowLeft, Heart, Clock, Music2, Share2, Plus, CloudCheck } from 'lucide-react';
import { Playlist, Album, Song } from '../../lib/music/types';
import { usePlayerStore } from '../../stores/playerStore';
import { offlineMetadataCache } from '../../lib/storage/offlineMetadataCache';

interface PlaylistViewProps {
  playlist?: Playlist;
  album?: Album;
  onBack: () => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlist, album, onBack }) => {
  const { playTrack, currentTrack, likedSongIds, toggleLike, addToQueue, playNext } = usePlayerStore();

  useEffect(() => {
    if (playlist) {
      offlineMetadataCache.recordPlaylistVisit(playlist);
    }
  }, [playlist]);

  const isOfflineCached = playlist ? offlineMetadataCache.isPlaylistOfflineReady(playlist.id) : false;
  const title = playlist?.title || album?.title || 'Collection';
  const description = playlist?.description || album?.description || '';
  const artwork = playlist?.artwork || album?.artwork;
  const songs: Song[] = playlist?.songs || album?.songs || [];
  const subtitle = album ? `${album.primaryArtist} · ${album.year || 'Album'}` : `${songs.length} Tracks`;

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playTrack(songs[0], songs);
    }
  };

  const handleShuffle = () => {
    if (songs.length > 0) {
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
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
        <span>Back</span>
      </button>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-6 p-6 rounded-3xl bg-gradient-to-r from-slate-900/80 via-indigo-950/30 to-black border border-white/10 shadow-2xl">
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-white/15">
          {artwork && (
            <img
              src={artwork.high || artwork.medium}
              alt={title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="space-y-3 min-w-0 flex-1">
          <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-widest text-[var(--aura-primary,#6366f1)]">
            <span>{album ? 'Album Master' : 'Curated Playlist'}</span>
            {isOfflineCached && (
              <>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <CloudCheck className="w-3.5 h-3.5" />
                  Offline Ready
                </span>
              </>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight truncate leading-tight">
            {title}
          </h1>

          <p className="text-sm text-slate-300 font-medium">
            {subtitle}
          </p>

          {description && (
            <p className="text-xs text-slate-400 line-clamp-2 max-w-xl">
              {description}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handlePlayAll}
              className="px-6 py-2.5 rounded-full bg-white text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play All</span>
            </button>

            <button
              onClick={handleShuffle}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
              title="Shuffle playlist"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tracklist Table */}
      <div className="space-y-2">
        <div className="grid grid-cols-12 px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-slate-500 border-b border-white/5">
          <span className="col-span-1 text-center">#</span>
          <span className="col-span-6 sm:col-span-7">Title</span>
          <span className="col-span-3 sm:col-span-3 hidden sm:block">Album</span>
          <span className="col-span-5 sm:col-span-1 text-right flex items-center justify-end gap-1">
            <Clock className="w-3 h-3" />
          </span>
        </div>

        {songs.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            This collection currently has no active tracks.
          </div>
        ) : (
          <div className="space-y-1">
            {songs.map((song, idx) => {
              const isCurrent = currentTrack?.id === song.id;
              const isLiked = likedSongIds.includes(song.id);

              return (
                <div
                  key={`${song.id}-${idx}`}
                  onClick={() => playTrack(song, songs)}
                  className={`grid grid-cols-12 items-center p-3 rounded-2xl cursor-pointer transition-colors group border ${
                    isCurrent
                      ? 'bg-[var(--aura-primary,#6366f1)]/15 border-[var(--aura-primary,#6366f1)]/30'
                      : 'hover:bg-white/5 border-transparent'
                  }`}
                >
                  {/* Number / Play Indicator */}
                  <div className="col-span-1 text-center text-xs font-mono text-slate-500 tabular-nums">
                    <span className="group-hover:hidden">{idx + 1}</span>
                    <Play className="w-3.5 h-3.5 text-white fill-current mx-auto hidden group-hover:block" />
                  </div>

                  {/* Song Title & Artist */}
                  <div className="col-span-6 sm:col-span-7 flex items-center gap-3 min-w-0 pr-2">
                    <img
                      src={song.artwork.low || song.artwork.medium}
                      alt={song.title}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover shadow shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className={`text-sm font-semibold truncate ${isCurrent ? 'text-[var(--aura-primary,#6366f1)] font-bold' : 'text-white'}`}>
                        {song.title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate">
                        {song.primaryArtist}
                      </p>
                    </div>
                  </div>

                  {/* Album Name */}
                  <div className="col-span-3 hidden sm:block text-xs text-slate-400 truncate pr-2">
                    {song.album.title}
                  </div>

                  {/* Duration & Quick Actions */}
                  <div className="col-span-5 sm:col-span-1 flex items-center justify-end gap-2 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(song);
                      }}
                      className={`p-1 rounded transition-colors ${
                        isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-white opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToQueue(song);
                      }}
                      className="p-1 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Add to queue"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-xs font-mono text-slate-400 tabular-nums">
                      {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
