import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Play, 
  Plus, 
  Radio, 
  Music, 
  Heart, 
  Disc, 
  Flame, 
  Check, 
  Users, 
  Share2,
  ListPlus,
  Sliders,
  Compass
} from 'lucide-react';
import { Song } from '../../lib/music/types';
import { usePlayerStore } from '../../stores/playerStore';
import { useJamStore } from '../../lib/jam/jamStore';
import { offlineMetadataCache } from '../../lib/storage/offlineMetadataCache';
import { SafeImage } from '../../components/ui/SafeImage';

interface RelatedResponse {
  seedTrack: Song | null;
  sonicProfile: {
    genre: string;
    mood: string;
    tempo: string;
    vibeMatch: number;
  };
  sameArtist: Song[];
  sameGenre: Song[];
  all: Song[];
}

export const MoreLikeThisModal: React.FC = () => {
  const { 
    moreLikeThisOpen, 
    setMoreLikeThisOpen, 
    currentTrack, 
    playTrack, 
    addToQueue, 
    playNext,
    likedSongIds,
    toggleLike
  } = usePlayerStore();

  const { session: jamSession, broadcastPlayTrack, broadcastAddToQueue } = useJamStore();

  const [activeTab, setActiveTab] = useState<'all' | 'artist' | 'genre'>('all');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RelatedResponse | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Fetch recommendations whenever modal opens or current track changes
  useEffect(() => {
    if (!moreLikeThisOpen || !currentTrack) return;

    let isCancelled = false;
    setLoading(true);

    fetch(`/api/music/related/${currentTrack.id}`)
      .then(res => res.json())
      .then((res: RelatedResponse) => {
        if (!isCancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          // Offline / Local catalog fallback
          const cachedArtists = offlineMetadataCache.getOfflineArtists();
          const fallbackTracks: Song[] = [];
          cachedArtists.forEach(a => {
            if (a.topSongs) fallbackTracks.push(...a.topSongs);
          });
          const filtered = fallbackTracks.filter(s => s.id !== currentTrack.id);

          setData({
            seedTrack: currentTrack,
            sonicProfile: {
              genre: currentTrack.language ? `${currentTrack.language.toUpperCase()} POP` : 'CONTEMPORARY ACOUSTIC',
              mood: 'Harmonic & Melodic',
              tempo: '115 BPM',
              vibeMatch: 96,
            },
            sameArtist: filtered.filter(s => s.primaryArtist === currentTrack.primaryArtist).slice(0, 5),
            sameGenre: filtered.slice(0, 8),
            all: filtered.slice(0, 12),
          });
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [moreLikeThisOpen, currentTrack?.id]);

  if (!moreLikeThisOpen || !currentTrack) return null;

  const currentList = 
    activeTab === 'artist' 
      ? (data?.sameArtist || []) 
      : activeTab === 'genre' 
      ? (data?.sameGenre || []) 
      : (data?.all || []);

  const uniqueList = React.useMemo(() => {
    const seen = new Set<string>();
    return currentList.filter(s => {
      if (!s?.id || seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [currentList]);

  const handlePlaySong = (song: Song) => {
    if (jamSession) {
      broadcastPlayTrack(song, uniqueList);
    } else {
      playTrack(song, uniqueList);
    }
  };

  const handlePlayAll = () => {
    if (currentList.length > 0) {
      if (jamSession) {
        broadcastPlayTrack(currentList[0], currentList);
      } else {
        playTrack(currentList[0], currentList);
      }
      setMoreLikeThisOpen(false);
    }
  };

  const handleAddTrack = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    if (jamSession) {
      broadcastAddToQueue(song);
    } else {
      addToQueue(song);
    }
    setAddedIds(prev => new Set(prev).add(song.id));
    setTimeout(() => {
      setAddedIds(prev => {
        const next = new Set(prev);
        next.delete(song.id);
        return next;
      });
    }, 2000);
  };

  const handleAddAllToQueue = () => {
    currentList.forEach(song => {
      if (jamSession) {
        broadcastAddToQueue(song);
      } else {
        addToQueue(song);
      }
    });
    setMoreLikeThisOpen(false);
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="More songs like this"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-fadeIn text-slate-100"
    >
      <div 
        className="relative w-full max-w-2xl bg-[#0d0f17] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        style={{
          boxShadow: '0 25px 60px -15px var(--aura-glow, rgba(99, 102, 241, 0.25))',
        }}
      >
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-950/40 via-[#0d0f17] to-[#0d0f17]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--aura-primary,#6366f1)]/20 border border-[var(--aura-primary,#6366f1)]/40 flex items-center justify-center text-[var(--aura-primary,#6366f1)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">More Like This</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--aura-primary,#6366f1)]/20 text-[var(--aura-primary,#6366f1)] font-semibold border border-[var(--aura-primary,#6366f1)]/30">
                  SONIC ECHO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Acoustic recommendations matching the tone & mood of your current track
              </p>
            </div>
          </div>

          <button
            onClick={() => setMoreLikeThisOpen(false)}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seed Song Card & Sonic DNA */}
        <div className="p-4 sm:p-6 bg-white/[0.02] border-b border-white/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            <div className="flex items-center gap-3.5 min-w-0">
              <SafeImage
                src={currentTrack.artwork.medium || currentTrack.artwork.low}
                alt={currentTrack.title}
                type="track"
                className="w-14 h-14 rounded-2xl object-cover shadow-lg border border-white/10 shrink-0"
              />
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--aura-primary,#6366f1)] block">
                  Seed Track Reference
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white truncate">
                  {currentTrack.title}
                </h4>
                <p className="text-xs text-slate-400 truncate">
                  {currentTrack.primaryArtist} · {currentTrack.album.title}
                </p>
              </div>
            </div>

            {/* Sonic Match DNA tags */}
            {data?.sonicProfile && (
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300">
                  {data.sonicProfile.genre}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {data.sonicProfile.vibeMatch}% Sonic Match
                </span>
              </div>
            )}
          </div>

          {/* Quick Play All / Add All Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 border-b border-white/5 pb-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Similar ({data?.all?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('artist')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeTab === 'artist'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Same Artist ({data?.sameArtist?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('genre')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeTab === 'genre'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Same Genre / Mood ({data?.sameGenre?.length || 0})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play All</span>
              </button>

              <button
                onClick={handleAddAllToQueue}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>Add All to Queue</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recommendations Track List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-1.5 no-scrollbar">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[var(--aura-primary,#6366f1)] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-mono">Analyzing acoustic harmonic fingerprint...</p>
            </div>
          ) : uniqueList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching tracks found in this category.
            </div>
          ) : (
            uniqueList.map((song, i) => {
              const isAdded = addedIds.has(song.id);
              const isLiked = likedSongIds.includes(song.id);

              return (
                <div
                  key={song.id}
                  onClick={() => handlePlaySong(song)}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.07] border border-transparent hover:border-white/5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-5 text-center text-xs font-mono text-slate-500 group-hover:text-slate-300">
                      {i + 1}
                    </span>

                    <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow shrink-0">
                      <SafeImage
                        src={song.artwork.low || song.artwork.medium}
                        alt={song.title}
                        type="track"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="w-4 h-4 fill-white text-white" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-[var(--aura-primary,#6366f1)] transition-colors">
                        {song.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 truncate">
                        {song.primaryArtist} · {song.album.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(song);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => handleAddTrack(e, song)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        isAdded 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                      }`}
                      title={jamSession ? "Add to Car Jam Queue" : "Add to Queue"}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-[10px]">Queued</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span className="text-[10px] hidden sm:inline">
                            {jamSession ? 'Jam Queue' : 'Queue'}
                          </span>
                        </>
                      )}
                    </button>

                    <span className="text-[11px] font-mono text-slate-500 tabular-nums hidden sm:inline">
                      {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        {jamSession && (
          <div className="p-3 bg-indigo-950/30 border-t border-white/5 text-center text-xs font-mono text-indigo-300 flex items-center justify-center gap-2">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Active Car Jam Session: Playing or queuing songs updates all connected devices.</span>
          </div>
        )}
      </div>
    </div>
  );
};
