import React, { useState, useEffect } from 'react';
import { Play, Shuffle, UserPlus, Check, ArrowLeft, Heart, Music2, Disc, CloudCheck, Sparkles } from 'lucide-react';
import { Artist, Song, Album } from '../../lib/music/types';
import { usePlayerStore } from '../../stores/playerStore';
import { offlineMetadataCache } from '../../lib/storage/offlineMetadataCache';
import { MasterTrackCard, AuraPlaylistCard } from '../../components/ui/AuraCards';
import { triggerHaptic } from '../../lib/utils/haptics';

interface ArtistViewProps {
  artist: Artist;
  onBack: () => void;
  onSelectAlbum?: (album: Album) => void;
}

export const ArtistView: React.FC<ArtistViewProps> = ({ artist, onBack, onSelectAlbum }) => {
  const { playTrack, currentTrack, isPlaying } = usePlayerStore();
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (artist) {
      offlineMetadataCache.recordArtistVisit(artist);
    }
  }, [artist]);

  const isOfflineCached = offlineMetadataCache.isArtistOfflineReady(artist.id);
  const topSongs = artist.topSongs || [];

  const handlePlayAll = () => {
    triggerHaptic('button');
    if (topSongs.length > 0) {
      playTrack(topSongs[0], topSongs);
    }
  };

  const handleShuffle = () => {
    triggerHaptic('button');
    if (topSongs.length > 0) {
      const shuffled = [...topSongs].sort(() => Math.random() - 0.5);
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
        <span>Back to Soundstage</span>
      </button>

      {/* Hero Banner with Cinematic Stage Lighting */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 min-h-[300px] sm:min-h-[360px] flex items-end p-6 sm:p-10 shadow-2xl bg-gradient-to-t from-[#07080c] via-[#0d101a]/80 to-transparent">
        {/* Background Image with Depth Blur */}
        <div 
          className="absolute inset-0 bg-cover bg-center -z-10 filter brightness-45 contrast-125 scale-105"
          style={{ backgroundImage: `url(${artist.image.high || artist.image.medium})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080c] via-black/40 to-transparent -z-10" />

        <div className="relative z-10 space-y-3.5 max-w-2xl">
          <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-indigo-400">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30">
              <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
              <span>Verified Soundstage Artist</span>
            </div>
            {isOfflineCached && (
              <div className="flex items-center gap-1 text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CloudCheck className="w-3.5 h-3.5" />
                <span>Offline Cached</span>
              </div>
            )}
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight font-display">
            {artist.name}
          </h1>

          {artist.followerCount && (
            <p className="text-xs sm:text-sm text-slate-300 font-mono tabular-nums">
              {(artist.followerCount / 1000000).toFixed(1)}M Monthly Listeners · {artist.dominantLanguage || 'Global'}
            </p>
          )}

          {artist.bio && (
            <p className="text-xs sm:text-sm text-slate-300/90 line-clamp-2 max-w-xl leading-relaxed">
              {artist.bio}
            </p>
          )}

          {/* Action CTAs */}
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
              title="Shuffle top songs"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                triggerHaptic('button');
                setIsFollowing(!isFollowing);
              }}
              className={`px-5 py-3 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isFollowing 
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm' 
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              {isFollowing ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>{isFollowing ? 'Following' : 'Follow'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Songs List using MasterTrackCard */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
            Popular Soundscapes
          </h2>
          <span className="text-xs text-slate-400 font-mono">Top Master Releases</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {topSongs.map((song, idx) => (
            <MasterTrackCard
              key={`${song.id}-${idx}`}
              song={song}
              playlistContext={topSongs}
              index={idx}
              showRank={true}
            />
          ))}
        </div>
      </div>

      {/* Discography Albums */}
      {artist.albums && artist.albums.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
              Discography & Vinyl Releases
            </h2>
            <span className="text-xs text-slate-400 font-mono">{artist.albums.length} Releases</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {artist.albums.map((album, idx) => (
              <div
                key={`${album.id}-${idx}`}
                onClick={() => {
                  triggerHaptic('cardSelect');
                  onSelectAlbum && onSelectAlbum(album);
                }}
                className="group p-3.5 rounded-3xl bg-[#0c0f18]/80 hover:bg-[#131826] border border-white/[0.06] hover:border-white/15 transition-all duration-300 cursor-pointer shadow-lg hover:-translate-y-1"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 shadow-md border border-white/10">
                  <img
                    src={album.artwork.high || album.artwork.medium || album.artwork.low}
                    alt={album.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-40" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors line-clamp-1">
                  {album.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {album.year || 'Studio Album'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
