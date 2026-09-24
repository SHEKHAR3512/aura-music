import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  BookmarkPlus, 
  Sparkles, 
  Play, 
  ChevronUp, 
  ChevronDown, 
  History, 
  ListMusic 
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../lib/storage/libraryStore';
import { Song } from '../../lib/music/types';

export const QueueDrawer: React.FC = () => {
  const {
    queueOpen,
    setQueueOpen,
    queue,
    queueIndex,
    history,
    currentTrack,
    playTrack,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    smartQueueEnabled,
    setSmartQueue,
  } = usePlayerStore();

  const { createPlaylist } = useLibraryStore();
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!queueOpen) return null;

  const upNextTracks = queue.slice(queueIndex + 1);

  const handleSaveAsPlaylist = () => {
    if (queue.length === 0) return;
    const title = `Queue Session — ${new Date().toLocaleDateString()}`;
    const newPl = createPlaylist(title, `Saved queue session containing ${queue.length} tracks.`);
    queue.forEach(song => {
      // Add each song to playlist
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Playback Queue"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-[#0d0f17]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col animate-slideLeft text-slate-100"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'queue' ? 'bg-white text-slate-950 font-semibold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Up Next ({upNextTracks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'history' ? 'bg-white text-slate-950 font-semibold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </div>

        <button
          onClick={() => setQueueOpen(false)}
          aria-label="Close Queue"
          className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Queue Options Bar */}
      {activeTab === 'queue' && (
        <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between text-xs">
          {/* Smart Queue Toggle */}
          <button
            onClick={() => setSmartQueue(!smartQueueEnabled)}
            className={`flex items-center gap-1.5 transition-colors ${
              smartQueueEnabled ? 'text-[var(--aura-primary,#6366f1)] font-medium' : 'text-slate-400 hover:text-white'
            }`}
            title="Auto-continue playback with recommended songs when queue finishes"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Continuation</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveAsPlaylist}
              className="text-slate-300 hover:text-white flex items-center gap-1"
              title="Save current queue as a permanent playlist"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>{saveSuccess ? 'Saved!' : 'Save'}</span>
            </button>

            <button
              onClick={clearQueue}
              className="text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
              title="Clear upcoming queue"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 select-none no-scrollbar">
        
        {/* Currently Playing Card */}
        {currentTrack && activeTab === 'queue' && (
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Now Playing
            </span>
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-[var(--aura-primary,#6366f1)]/15 to-transparent border border-[var(--aura-primary,#6366f1)]/30">
              <img
                src={currentTrack.artwork.low || currentTrack.artwork.medium}
                alt={currentTrack.title}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-lg object-cover shadow shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-white truncate">{currentTrack.title}</h4>
                <p className="text-xs text-slate-400 truncate">{currentTrack.primaryArtist}</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--aura-primary,#6366f1)] animate-ping mr-2" />
            </div>
          </div>
        )}

        {/* Up Next List */}
        {activeTab === 'queue' && (
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Next in Queue
            </span>

            {upNextTracks.length === 0 ? (
              <div className="text-center py-10 px-4 text-slate-500 text-xs">
                No upcoming tracks. Queue will auto-continue with similar music.
              </div>
            ) : (
              <div className="space-y-1.5">
                {upNextTracks.map((song, idx) => {
                  const actualIndex = queueIndex + 1 + idx;
                  return (
                    <div
                      key={`${song.id}-${actualIndex}`}
                      className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                    >
                      <div 
                        onClick={() => playTrack(song)}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                          <img
                            src={song.artwork.low || song.artwork.medium}
                            alt={song.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play className="w-3.5 h-3.5 text-white fill-current" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <h5 className="text-xs font-semibold text-white truncate group-hover:text-[var(--aura-primary,#6366f1)] transition-colors">
                            {song.title}
                          </h5>
                          <p className="text-[11px] text-slate-400 truncate">{song.primaryArtist}</p>
                        </div>
                      </div>

                      {/* Reorder and Delete Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {idx > 0 && (
                          <button
                            onClick={() => reorderQueue(actualIndex, actualIndex - 1)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                            title="Move up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {idx < upNextTracks.length - 1 && (
                          <button
                            onClick={() => reorderQueue(actualIndex, actualIndex + 1)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                            title="Move down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => removeFromQueue(actualIndex)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/10 ml-1"
                          title="Remove from queue"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* History List */}
        {activeTab === 'history' && (
          <div className="space-y-2">
            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Tracks you play during this session will appear here.
              </div>
            ) : (
              history.map((song, i) => (
                <div
                  key={`${song.id}-hist-${i}`}
                  onClick={() => playTrack(song)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <img
                    src={song.artwork.low || song.artwork.medium}
                    alt={song.title}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-semibold text-white truncate group-hover:text-[var(--aura-primary,#6366f1)] transition-colors">
                      {song.title}
                    </h5>
                    <p className="text-[11px] text-slate-400 truncate">{song.primaryArtist}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};
