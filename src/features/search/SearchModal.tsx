import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Play, Music, User, Disc, ListMusic, ArrowRight, CornerDownLeft, Plus, Check } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useJamStore } from '../jam/store/useJamStore';
import { Song, Album, Artist, Playlist, SearchResults } from '../../lib/music/types';
import { EqualizerLoader, MiniEqualizerBars } from '../../components/ui/AudioLoaders';
import { triggerHaptic } from '../../lib/utils/haptics';

interface SearchModalProps {
  onSelectArtist?: (artist: Artist) => void;
  onSelectAlbum?: (album: Album) => void;
  onSelectPlaylist?: (playlist: Playlist) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ onSelectArtist, onSelectAlbum, onSelectPlaylist }) => {
  const { searchModalOpen, setSearchModalOpen, playTrack, currentTrack, isPlaying, setJamModalOpen } = usePlayerStore();
  const { room: jamRoom, playTrack: playJamTrack, addToQueue: addJamQueue } = useJamStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [queuedSongIds, setQueuedSongIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search by 280ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchTerm.trim());
      setSelectedIndex(0);
    }, 280);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Focus input on open
  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
      setDebouncedQuery('');
    }
  }, [searchModalOpen]);

  // Fetch search results
  const { data, isLoading } = useQuery<SearchResults>({
    queryKey: ['musicSearch', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) {
        const res = await fetch('/api/music/search');
        return res.json();
      }
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(debouncedQuery)}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const songs = data?.songs || [];
  const artists = data?.artists || [];
  const albums = data?.albums || [];
  const playlists = data?.playlists || [];

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!searchModalOpen) return;

      if (e.key === 'Escape') {
        setSearchModalOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, songs.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        if (songs[selectedIndex]) {
          e.preventDefault();
          handleSongSelect(songs[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchModalOpen, selectedIndex, songs, playTrack, setSearchModalOpen]);

  if (!searchModalOpen) return null;

  const handleSongSelect = (song: Song) => {
    triggerHaptic('button');
    if (jamRoom) {
      playJamTrack(song);
      setSearchModalOpen(false);
    } else {
      playTrack(song);
      setSearchModalOpen(false);
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Universal Music Search"
      className="fixed inset-0 z-[80] flex items-start justify-center pt-8 sm:pt-16 px-3 sm:px-4 bg-black/85 backdrop-blur-2xl animate-dwi-enter"
    >
      <div 
        className="relative w-full max-w-2xl bg-[#0c0f18]/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[85vh]"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8), 0 0 30px rgba(99,102,241,0.15)',
        }}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <Search className="w-5 h-5 text-indigo-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tracks, artists, albums, or lyrics..."
            className="w-full bg-transparent text-base sm:text-lg text-white placeholder-slate-500 focus:outline-none font-display font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 text-slate-400 hover:text-white mr-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono bg-white/10 text-slate-300 rounded-md border border-white/10">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 no-scrollbar">
          
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <EqualizerLoader size="md" color="#818cf8" />
              <span className="text-xs font-mono uppercase tracking-wider">Scanning Repertoire...</span>
            </div>
          )}

          {/* Songs Section */}
          {!isLoading && songs.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 px-1 font-mono">
                <span>{jamRoom ? 'Jam Active • Broadcast track' : 'Recordings'} ({songs.length})</span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">{jamRoom ? 'Click track to stream to room' : 'Use ↑ ↓ and Enter to play'}</span>
              </div>
              <div className="space-y-1.5">
                {songs.map((song, i) => {
                  const isSelected = i === selectedIndex;
                  const isCurrent = (jamRoom ? jamRoom.playback.trackId : currentTrack?.id) === song.id;
                  const isPlayingCurrent = isCurrent && isPlaying;
                  const isAlreadyInQueue = jamRoom?.queue?.some(q => q.track.id === song.id);
                  const isQueued = isAlreadyInQueue || queuedSongIds.has(song.id);
                  return (
                    <div
                      key={`${song.id}-${i}`}
                      onClick={() => handleSongSelect(song)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-indigo-500/20 border border-indigo-500/40 shadow-sm'
                          : 'hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-md border border-white/10">
                          <img
                            src={song.artwork.low || song.artwork.medium}
                            alt={song.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center">
                            <Play className="w-4 h-4 text-white fill-current" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-semibold truncate ${isCurrent ? 'text-indigo-300 font-bold' : 'text-white'}`}>
                              {song.title}
                            </h4>
                            {isPlayingCurrent && <MiniEqualizerBars color="#818cf8" />}
                          </div>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {song.primaryArtist} · {song.album.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {jamRoom && (
                          <button
                            type="button"
                            disabled={isQueued || isCurrent}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isQueued || isCurrent) return;
                              triggerHaptic('button');
                              addJamQueue(song);
                              setQueuedSongIds(prev => new Set(prev).add(song.id));
                              setTimeout(() => {
                                setQueuedSongIds(prev => {
                                  const next = new Set(prev);
                                  next.delete(song.id);
                                  return next;
                                });
                              }, 3000);
                            }}
                            className={`p-2 rounded-xl transition-colors ${
                              isQueued 
                                ? 'text-emerald-400 bg-emerald-500/20 cursor-default' 
                                : isCurrent
                                  ? 'text-indigo-400 bg-indigo-500/20 cursor-default'
                                  : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer'
                            }`}
                            title={isCurrent ? "Currently playing" : isQueued ? "In Jam Queue" : "Add to Jam Queue"}
                          >
                            {isQueued ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {isSelected && (
                          <div className="hidden sm:flex items-center gap-1 text-[11px] text-indigo-400 font-mono pr-2">
                            {jamRoom ? (
                              <><Play className="w-3.5 h-3.5 fill-current" /><span>Play Jam</span></>
                            ) : (
                              <><CornerDownLeft className="w-3.5 h-3.5" /><span>Play</span></>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Artists Section */}
          {!isLoading && artists.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 px-1 font-mono">
                Artists
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {artists.slice(0, 4).map((artist, idx) => (
                  <div
                    key={`${artist.id}-${idx}`}
                    onClick={() => {
                      triggerHaptic('button');
                      if (onSelectArtist) onSelectArtist(artist);
                      setSearchModalOpen(false);
                    }}
                    className="flex flex-col items-center p-3 rounded-2xl hover:bg-white/[0.04] transition-all cursor-pointer text-center group border border-transparent hover:border-white/5"
                  >
                    <div className="relative w-16 h-16 rounded-full overflow-hidden shadow mb-2 border border-white/10 group-hover:border-indigo-400 transition-colors">
                      <img
                        src={artist.image.medium || artist.image.low}
                        alt={artist.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <h5 className="text-xs font-bold text-white truncate w-full">{artist.name}</h5>
                    <span className="text-[10px] text-indigo-400 font-mono mt-0.5">Artist</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Albums Section */}
          {!isLoading && albums.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 px-1 font-mono">
                Albums & Vinyl
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {albums.slice(0, 4).map((album, idx) => (
                  <div
                    key={`${album.id}-${idx}`}
                    onClick={() => {
                      triggerHaptic('button');
                      if (onSelectAlbum) onSelectAlbum(album);
                      setSearchModalOpen(false);
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/[0.04] transition-all cursor-pointer border border-transparent hover:border-white/5"
                  >
                    <img
                      src={album.artwork.medium || album.artwork.low}
                      alt={album.title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover shadow shrink-0 border border-white/10"
                    />
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-white truncate">{album.title}</h5>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{album.primaryArtist || 'Studio Album'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && songs.length === 0 && artists.length === 0 && (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <Music className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <h4 className="text-sm font-bold text-slate-200">No matches found</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">Try searching for a different song title, artist, or album.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
