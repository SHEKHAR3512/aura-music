import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Play, Music, User, Disc, ListMusic, ArrowRight, CornerDownLeft, Plus } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useJamStore } from '../../lib/jam/jamStore';
import { Song, Album, Artist, Playlist, SearchResults } from '../../lib/music/types';

interface SearchModalProps {
  onSelectArtist?: (artist: Artist) => void;
  onSelectAlbum?: (album: Album) => void;
  onSelectPlaylist?: (playlist: Playlist) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ onSelectArtist, onSelectAlbum, onSelectPlaylist }) => {
  const { searchModalOpen, setSearchModalOpen, playTrack, currentTrack, setJamModalOpen } = usePlayerStore();
  const { session: jamSession, broadcastAddToQueue } = useJamStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search by 300ms
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

  // If a Jam session is active, add songs to the Jam queue instead of playing locally
  const handleSongSelect = (song: Song) => {
    if (jamSession) {
      broadcastAddToQueue(song);
      setSearchModalOpen(false);
      setJamModalOpen(true); // Re-open Jam modal to see the queue
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-xl animate-fadeIn"
    >
      <div 
        className="relative w-full max-w-2xl bg-[#0f111a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[80vh]"
        style={{
          boxShadow: '0 25px 60px -15px var(--aura-glow, rgba(0,0,0,0.7))',
        }}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tracks, artists, albums, or lyrics..."
            className="w-full bg-transparent text-base sm:text-lg text-white placeholder-slate-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 text-slate-400 hover:text-white mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono bg-white/10 text-slate-300 rounded border border-white/10">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
          
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <div className="w-5 h-5 border-2 border-[var(--aura-primary,#6366f1)] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Searching global library...</span>
            </div>
          )}

          {/* Songs Section */}
          {!isLoading && songs.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                <span>{jamSession ? 'Tap to add to Jam queue' : 'Songs'} ({songs.length})</span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">{jamSession ? 'Adds to car queue' : 'Use ↑ ↓ and Enter to play'}</span>
              </div>
              <div className="space-y-1">
                {songs.map((song, i) => {
                  const isSelected = i === selectedIndex;
                  const isCurrent = currentTrack?.id === song.id;
                  return (
                    <div
                      key={`${song.id}-${i}`}
                      onClick={() => handleSongSelect(song)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[var(--aura-primary,#6366f1)]/20 border border-[var(--aura-primary,#6366f1)]/30'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                          <img
                            src={song.artwork.low || song.artwork.medium}
                            alt={song.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center">
                            <Play className="w-3.5 h-3.5 text-white fill-current" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <h4 className={`text-sm font-medium truncate ${isCurrent ? 'text-[var(--aura-primary,#6366f1)] font-bold' : 'text-white'}`}>
                            {song.title}
                          </h4>
                          <p className="text-xs text-slate-400 truncate">
                            {song.primaryArtist} · {song.album.title}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="hidden sm:flex items-center gap-1 text-[11px] text-[var(--aura-primary,#6366f1)] font-mono pr-2">
                          {jamSession ? (
                            <><Plus className="w-3.5 h-3.5" /><span>Add</span></>
                          ) : (
                            <><CornerDownLeft className="w-3.5 h-3.5" /><span>Play</span></>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Artists Section */}
          {!isLoading && artists.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Artists
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {artists.slice(0, 4).map((artist, idx) => (
                  <div
                    key={`${artist.id}-${idx}`}
                    onClick={() => {
                      if (onSelectArtist) onSelectArtist(artist);
                      setSearchModalOpen(false);
                    }}
                    className="flex flex-col items-center p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer text-center group border border-transparent hover:border-white/5"
                  >
                    <img
                      src={artist.image.medium || artist.image.low}
                      alt={artist.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-full object-cover shadow mb-2 group-hover:scale-105 transition-transform"
                    />
                    <h5 className="text-xs font-semibold text-white truncate w-full">{artist.name}</h5>
                    <span className="text-[10px] text-slate-400">Artist</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Albums Section */}
          {!isLoading && albums.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Albums
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {albums.slice(0, 3).map((album, idx) => (
                  <div
                    key={`${album.id}-${idx}`}
                    onClick={() => {
                      if (onSelectAlbum) onSelectAlbum(album);
                      setSearchModalOpen(false);
                    }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5"
                  >
                    <img
                      src={album.artwork.medium || album.artwork.low}
                      alt={album.title}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-lg object-cover shadow shrink-0"
                    />
                    <div className="min-w-0">
                      <h5 className="text-xs font-semibold text-white truncate">{album.title}</h5>
                      <p className="text-[10px] text-slate-400 truncate">{album.primaryArtist || 'Album'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && songs.length === 0 && artists.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Music className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <h4 className="text-sm font-semibold text-slate-200">No matches found</h4>
              <p className="text-xs text-slate-500 mt-1">Try searching for a different song title or artist name.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
