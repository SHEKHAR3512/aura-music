import React, { useState } from 'react';
import { 
  Heart, 
  FolderPlus, 
  Clock, 
  Flame, 
  BarChart2, 
  Play, 
  Plus, 
  Trash2, 
  Music, 
  User, 
  Sparkles,
  Check,
  WifiOff,
  CloudCheck,
  Disc3
} from 'lucide-react';
import { useLibraryStore } from '../../lib/storage/libraryStore';
import { usePlayerStore } from '../../stores/playerStore';
import { Playlist, Song, Artist } from '../../lib/music/types';
import { offlineMetadataCache } from '../../lib/storage/offlineMetadataCache';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { MasterTrackCard, AuraArtistCard, AuraPlaylistCard } from '../../components/ui/AuraCards';
import { triggerHaptic } from '../../lib/utils/haptics';

interface LibraryViewProps {
  onSelectPlaylist: (playlist: Playlist) => void;
  onSelectArtist?: (artist: Artist) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ onSelectPlaylist, onSelectArtist }) => {
  const { isForcedOffline, toggleForcedOffline } = useNetworkStatus();
  const { profile, playlists, createPlaylist, deletePlaylist, stats, recentlyPlayed } = useLibraryStore();
  const { playTrack, currentTrack, likedSongIds, setAuthModalOpen } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<'playlists' | 'likes' | 'stats' | 'recent' | 'offline'>('playlists');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const offlineArtists = offlineMetadataCache.getOfflineArtists();
  const offlinePlaylists = offlineMetadataCache.getOfflinePlaylists();

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    triggerHaptic('button');
    createPlaylist(newTitle.trim(), newDesc.trim());
    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-10 pb-24 animate-dwi-enter text-slate-100">
      
      {/* Profile Bar with Studio Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0d101a] via-[#121626] to-[#090b12] border border-white/10 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-400 shadow-xl shrink-0">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">{profile.name}</h2>
              {profile.provider !== 'guest' && (
                <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Check className="w-3 h-3" />
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{profile.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {/* Manual Go Offline Toggle Switch */}
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white/5 border border-white/10 shadow-sm">
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-bold text-white flex items-center gap-1 justify-end">
                {isForcedOffline ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <WifiOff className="w-3 h-3" /> Offline Sim
                  </span>
                ) : (
                  <span className="text-slate-300">Live Network</span>
                )}
              </span>
              <span className="text-[9px] font-mono text-slate-400">
                {isForcedOffline ? 'Testing cache' : 'Go Offline'}
              </span>
            </div>

            <button
              onClick={() => {
                triggerHaptic('button');
                toggleForcedOffline();
              }}
              role="switch"
              aria-checked={isForcedOffline}
              aria-label="Force offline mode to test cached metadata"
              title={isForcedOffline ? "Resume online mode" : "Simulate offline mode"}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isForcedOffline ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]' : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isForcedOffline ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {profile.provider === 'guest' ? (
            <button
              onClick={() => {
                triggerHaptic('button');
                setAuthModalOpen(true);
              }}
              className="px-6 py-2.5 rounded-full bg-white text-slate-950 text-xs font-bold hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-lg"
            >
              Sign In / Register
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full">
              <span>Synchronized Cloud Account</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'playlists', label: `Playlists (${playlists.length})`, icon: FolderPlus },
          { id: 'likes', label: `Liked Songs (${likedSongIds.length})`, icon: Heart },
          { id: 'offline', label: `Offline Ready (${offlineArtists.length + offlinePlaylists.length})`, icon: WifiOff },
          { id: 'stats', label: 'Listening Journal & Stats', icon: BarChart2 },
          { id: 'recent', label: 'Recently Played', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('tab');
                setActiveTab(tab.id as any);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive 
                  ? 'bg-white text-slate-950 font-bold shadow-md scale-102' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: User Playlists */}
      {activeTab === 'playlists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white tracking-tight font-display">Your Collections</h3>
            <button
              onClick={() => {
                triggerHaptic('button');
                if (profile.provider === 'guest' || profile.isAnonymous) {
                  setAuthModalOpen(true);
                  return;
                }
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-950 text-xs font-bold shadow hover:bg-slate-100 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Playlist</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {playlists.map((pl, i) => (
              <div key={`${pl.id}-${i}`} className="relative group">
                <AuraPlaylistCard
                  playlist={pl}
                  onClick={() => onSelectPlaylist(pl)}
                  badge={`${pl.songCount} Tracks`}
                />
                {pl.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('button');
                      deletePlaylist(pl.id);
                    }}
                    className="absolute top-5 right-5 p-2 rounded-full bg-black/60 backdrop-blur-md text-slate-400 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Delete playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Offline Ready Cached Items */}
      {activeTab === 'offline' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1 font-bold">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline Metadata Cache Active</span>
              </div>
              <p className="text-xs text-slate-300">
                Frequently visited artists and playlists are automatically stored in LocalStorage for offline catalog browsing.
              </p>
            </div>
            <button
              onClick={() => {
                triggerHaptic('button');
                offlineMetadataCache.clearCache();
                window.location.reload();
              }}
              className="text-xs font-medium text-slate-400 hover:text-rose-400 transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
            >
              Clear Cache
            </button>
          </div>

          {/* Cached Artists */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Offline Available Artists ({offlineArtists.length})
            </h4>

            {offlineArtists.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">No artists cached yet. Visit artist profiles to save them for offline browsing.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {offlineArtists.map((artist, i) => (
                  <AuraArtistCard
                    key={`${artist.id}-${i}`}
                    artist={artist}
                    onClick={() => onSelectArtist && onSelectArtist(artist)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Cached Playlists */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Offline Available Playlists ({offlinePlaylists.length})
            </h4>

            {offlinePlaylists.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">No external playlists cached yet. Visit playlists to enable offline access.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {offlinePlaylists.map((pl, i) => (
                  <AuraPlaylistCard
                    key={`${pl.id}-${i}`}
                    playlist={pl}
                    onClick={() => onSelectPlaylist(pl)}
                    badge="Offline Ready"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Liked Songs */}
      {activeTab === 'likes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white tracking-tight font-display">Favorite Recordings</h3>
            <span className="text-xs text-slate-400 font-mono">{likedSongIds.length} tracks</span>
          </div>

          {recentlyPlayed.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              No liked songs yet. Click the heart icon on any track to save it here.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {recentlyPlayed.map((song, i) => (
                <MasterTrackCard
                  key={`${song.id}-${i}`}
                  song={song}
                  playlistContext={recentlyPlayed}
                  index={i}
                  showRank={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Listening Stats Journal */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl bg-[#0c0f18]/80 border border-white/[0.06] shadow-lg">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Listening Time
              </span>
              <div className="text-3xl font-black text-white tabular-nums font-display">
                {stats.totalMinutesListened} <span className="text-sm font-normal text-slate-400">min</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">High-fidelity audio playback tracked</p>
            </div>

            <div className="p-6 rounded-3xl bg-[#0c0f18]/80 border border-white/[0.06] shadow-lg">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Tracks Completed
              </span>
              <div className="text-3xl font-black text-white tabular-nums font-display">
                {stats.tracksPlayedCount}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Unique play sessions recorded</p>
            </div>

            <div className="p-6 rounded-3xl bg-[#0c0f18]/80 border border-white/[0.06] shadow-lg">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Most Played Melody
              </span>
              <div className="text-base font-bold text-white truncate font-display">
                {stats.mostPlayedSong?.title || 'Kesariya'}
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {stats.mostPlayedSong?.artist || 'Arijit Singh'} · {stats.mostPlayedSong?.count || 14} plays
              </p>
            </div>
          </div>

          {/* Top Artists & Top Genres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-[#0c0f18]/80 border border-white/[0.06] space-y-3 shadow-lg">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Top Repertoire Artists
              </h4>
              <div className="space-y-2.5">
                {stats.topArtists.map((artist, i) => (
                  <div key={artist.name} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                    <span className="text-slate-200 font-medium">
                      {i + 1}. {artist.name}
                    </span>
                    <span className="text-indigo-400 font-mono tabular-nums font-bold">{artist.count} plays</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#0c0f18]/80 border border-white/[0.06] space-y-3 shadow-lg">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Top Acoustic Genres
              </h4>
              <div className="space-y-2.5">
                {stats.topGenres.map((genre) => (
                  <div key={genre.name} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                    <span className="text-slate-200 font-medium">{genre.name}</span>
                    <span className="text-cyan-400 font-mono tabular-nums font-bold">{genre.count} sessions</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Recently Played */}
      {activeTab === 'recent' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white tracking-tight font-display">Recently Streamed</h3>
            <span className="text-xs text-slate-400 font-mono">{recentlyPlayed.length} recordings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {recentlyPlayed.map((song, i) => (
              <MasterTrackCard
                key={`${song.id}-rp-${i}`}
                song={song}
                playlistContext={recentlyPlayed}
                index={i}
                showRank={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-dwi-enter"
        >
          <div className="w-full max-w-md bg-[#0e111a] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 font-display">Create New Collection</h3>
            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Midnight Acoustic Sessions"
                  required
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description (optional)</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the sonic mood or purpose..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer shadow-lg"
                >
                  Save Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
