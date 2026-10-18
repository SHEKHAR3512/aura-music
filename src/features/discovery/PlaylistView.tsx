import React, { useEffect } from 'react';
import { Play, Shuffle, ArrowLeft, Heart, Clock, Music2, Share2, Plus, CloudCheck, Disc } from 'lucide-react';
import { Playlist, Album, Song } from '../../lib/music/types';
import { usePlayerStore } from '../../stores/playerStore';
import { offlineMetadataCache } from '../../lib/storage/offlineMetadataCache';
import { MasterTrackCard } from '../../components/ui/AuraCards';
import { triggerHaptic } from '../../lib/utils/haptics';

interface PlaylistViewProps {
  playlist?: Playlist;
  album?: Album;
  onBack: () => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlist, album, onBack }) => {
  const { playTrack, currentTrack, likedSongIds, toggleLike } = usePlayerStore();

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
  const subtitle = album ? `${album.primaryArtist} · ${album.year || 'Studio Album'}` : `${songs.length} Tracks`;

  const handlePlayAll = () => {
    triggerHaptic('button');
    if (songs.length > 0) {
      playTrack(songs[0], songs);
    }
  };

  const handleShuffle = () => {
    triggerHaptic('button');
    if (songs.length > 0) {
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  return (
    <div className="space-y-10 pb-24 animate-dwi-enter">
      {/* Back button */}
      <button
        onClick={() => {
          triggerHaptic('button');
          onBack();
        }}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back</span>
      </button>

      {/* Header Banner — Vinyl Sleeve & Studio Presentation */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0d101a] via-[#121626] to-[#090b12] border border-white/10 shadow-2xl">
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-white/15 bg-black group">
          {artwork && (
            <img
              src={artwork.high || artwork.medium}
              alt={title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700"
            />
          )}
          {/* Vinyl Grooves Specular Sheen */}
          <div className="absolute inset-0 vinyl-grooves opacity-40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40" />
        </div>

        <div className="space-y-3 min-w-0 flex-1">
          <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-indigo-400">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30">
              {album ? 'Studio Album Master' : 'Curated Playlist'}
            </span>
            {isOfflineCached && (
              <span className="flex items-center gap-1 text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CloudCheck className="w-3.5 h-3.5" />
                Offline Ready
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight truncate leading-tight font-display">
            {title}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-medium">
            {subtitle}
          </p>

          {description && (
            <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 max-w-xl leading-relaxed">
              {description}
            </p>
          )}

          <div className="flex items-center gap-3 pt-3">
            <button
              onClick={handlePlayAll}
              className="px-7 py-3 rounded-full bg-white text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_4px_20px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current translate-x-0.5" />
              <span>Play All</span>
            </button>

            <button
              onClick={handleShuffle}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors cursor-pointer"
              title="Shuffle all songs"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tracks Section using MasterTrackCard */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
            Tracklist ({songs.length})
          </h2>
          <span className="text-xs text-slate-400 font-mono">Lossless Audio Stream</span>
        </div>

        {songs.length === 0 ? (
          <div className="p-8 text-center bg-[#0d101a]/60 border border-white/5 rounded-2xl">
            <Music2 className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm text-slate-300">No tracks in this collection yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {songs.map((song, idx) => (
              <MasterTrackCard
                key={`${song.id}-${idx}`}
                song={song}
                playlistContext={songs}
                index={idx}
                showRank={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
