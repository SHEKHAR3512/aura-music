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
  CloudCheck
} from 'lucide-react';
import { useLibraryStore } from '../../lib/storage/libraryStore';
import { usePlayerStore } from '../../stores/playerStore';
import { Playlist, Song, Artist } from '../../lib/music/types';
import { offlineMetadataCache } from '../../lib/storage/offlineMetadataCache';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

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
    const pl = createPlaylist(newTitle.trim(), newDesc.trim());
    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-8 pb-24 animate-fadeIn text-slate-100">
      
      {/* Profile Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-black border border-white/10 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--aura-primary,#6366f1)]/50 shadow-xl shrink-0">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{profile.name}</h2>
              {profile.provider !== 'guest' && (
                <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
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
              onClick={toggleForcedOffline}
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
              onClick={() => setAuthModalOpen(true)}
              className="px-5 py-2 rounded-full bg-white text-slate-950 text-xs font-bold hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              Sign In / Register
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <span>Synchronized Cloud Account</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('playlists')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'playlists' ? 'bg-white text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          <span>Playlists ({playlists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('likes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'likes' ? 'bg-white text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Liked Songs ({likedSongIds.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('offline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'offline' ? 'bg-white text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <WifiOff className="w-4 h-4 text-emerald-400" />
          <span>Offline Ready ({offlineArtists.length + offlinePlaylists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'stats' ? 'bg-white text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Listening Journal & Stats</span>
        </button>

        <button
          onClick={() => setActiveTab('recent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'recent' ? 'bg-white text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Recently Played</span>
        </button>
      </div>

      {/* TAB 1: User Playlists */}
      {activeTab === 'playlists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight">Your Collections</h3>
            <button
              onClick={() => {
                if (profile.provider === 'guest' || profile.isAnonymous) {
                  setAuthModalOpen(true);
                  return;
                }
                setShowCreateModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--aura-primary,#6366f1)] hover:opacity-90 text-white text-xs font-semibold shadow transition-opacity cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Playlist</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {playlists.map((pl, i) => (
              <div
                key={`${pl.id}-${i}`}
                onClick={() => onSelectPlaylist(pl)}
                className="group p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-md">
                    <img
                      src={pl.artwork.medium || pl.artwork.low}
                      alt={pl.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 fill-current translate-x-0.5" />
                      </div>
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-white truncate">{pl.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{pl.description}</p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/5 text-[11px] font-mono text-slate-400">
                  <span>{pl.songCount} Tracks</span>
                  {pl.isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePlaylist(pl.id);
                      }}
                      className="text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Offline Ready Cached Items */}
      {activeTab === 'offline' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline Metadata Cache Active</span>
              </div>
              <p className="text-xs text-slate-300">
                Frequently visited artists and playlists are automatically stored in LocalStorage and Cache Storage for offline catalog browsing.
              </p>
            </div>
            <button
              onClick={() => {
                offlineMetadataCache.clearCache();
                window.location.reload();
              }}
              className="text-xs font-medium text-slate-400 hover:text-rose-400 transition-colors self-start sm:self-auto shrink-0"
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {offlineArtists.map((artist, i) => (
                  <div
                    key={`${artist.id}-${i}`}
                    onClick={() => onSelectArtist && onSelectArtist(artist)}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all cursor-pointer flex flex-col items-center text-center group"
                  >
                    <div className="relative w-20 h-20 rounded-full overflow-hidden mb-2 border border-white/10 group-hover:border-emerald-400 transition-colors shadow">
                      <img
                        src={artist.image.medium || artist.image.low}
                        alt={artist.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs font-bold text-white truncate w-full">{artist.name}</span>
                    <span className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Offline Cached
                    </span>
                  </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {offlinePlaylists.map((pl, i) => (
                  <div
                    key={`${pl.id}-${i}`}
                    onClick={() => onSelectPlaylist(pl)}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all cursor-pointer flex items-center gap-3"
                  >
                    <img
                      src={pl.artwork.medium || pl.artwork.low}
                      alt={pl.title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover shadow shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-semibold text-white truncate">{pl.title}</h5>
                      <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">
                        {pl.songCount} Tracks · Ready Offline
                      </span>
                    </div>
                  </div>
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
            <h3 className="text-lg font-bold text-white tracking-tight">Favorite Recordings</h3>
            <span className="text-xs text-slate-400 font-mono">{likedSongIds.length} tracks</span>
          </div>

          {recentlyPlayed.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              No liked songs yet. Click the heart icon on any track to save it here.
            </div>
          ) : (
            <div className="space-y-1">
              {recentlyPlayed.map((song, i) => (
                <div
                  key={`${song.id}-${i}`}
                  onClick={() => playTrack(song)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/5 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <img
                      src={song.artwork.low || song.artwork.medium}
                      alt={song.title}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-xl object-cover shadow shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate group-hover:text-[var(--aura-primary,#6366f1)] transition-colors">
                        {song.title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate">{song.primaryArtist}</p>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Listening Stats Journal */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Listening Time
              </span>
              <div className="text-3xl font-black text-white tabular-nums">
                {stats.totalMinutesListened} <span className="text-sm font-normal text-slate-400">min</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">High-fidelity audio playback tracked</p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Tracks Completed
              </span>
              <div className="text-3xl font-black text-white tabular-nums">
                {stats.tracksPlayedCount}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Unique play sessions recorded</p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Most Played Melody
              </span>
              <div className="text-base font-bold text-white truncate">
                {stats.mostPlayedSong?.title || 'Kesariya'}
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {stats.mostPlayedSong?.artist || 'Arijit Singh'} · {stats.mostPlayedSong?.count || 14} plays
              </p>
            </div>
          </div>

          {/* Top Artists & Top Genres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Top Repertoire Artists
              </h4>
              <div className="space-y-2">
                {stats.topArtists.map((artist, i) => (
                  <div key={artist.name} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">
                      {i + 1}. {artist.name}
                    </span>
                    <span className="text-slate-400 font-mono tabular-nums">{artist.count} plays</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Top Acoustic Genres
              </h4>
              <div className="space-y-2">
                {stats.topGenres.map((genre) => (
                  <div key={genre.name} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{genre.name}</span>
                    <span className="text-slate-400 font-mono tabular-nums">{genre.count} sessions</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Recently Played */}
      {activeTab === 'recent' && (
        <div className="space-y-2">
          {recentlyPlayed.map((song, i) => (
            <div
              key={`${song.id}-rp-${i}`}
              onClick={() => playTrack(song)}
              className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/5 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <img
                  src={song.artwork.low || song.artwork.medium}
                  alt={song.title}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-xl object-cover shadow shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate">{song.title}</h4>
                  <p className="text-xs text-slate-400 truncate">{song.primaryArtist}</p>
                </div>
              </div>

              <span className="text-xs font-mono text-slate-400 tabular-nums">
                {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
        >
          <div className="w-full max-w-md bg-[#0f111a] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Create New Playlist</h3>
            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Ambient Deep Focus"
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[var(--aura-primary,#6366f1)]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Description (optional)</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the sonic mood or purpose..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[var(--aura-primary,#6366f1)] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Save Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
