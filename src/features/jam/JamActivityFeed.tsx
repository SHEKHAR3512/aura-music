import React, { useState } from 'react';
import { 
  Activity, 
  Plus, 
  SkipForward, 
  Play, 
  Pause, 
  Users, 
  Trash2, 
  Music, 
  Clock, 
  Filter,
  Check
} from 'lucide-react';
import { JamActivity } from '../../lib/jam/jamStore';
import { usePlayerStore } from '../../stores/playerStore';

interface JamActivityFeedProps {
  activities: JamActivity[];
  onPlaySong?: (title: string, artist?: string) => void;
}

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}h ago`;
}

export const JamActivityFeed: React.FC<JamActivityFeedProps> = ({ activities }) => {
  const [filter, setFilter] = useState<'all' | 'add' | 'skip' | 'play_pause'>('all');
  const { addToQueue, playNext } = usePlayerStore();

  const filtered = activities.filter((act) => {
    if (filter === 'add') return act.type === 'add' || act.action.includes('add');
    if (filter === 'skip') return act.type === 'skip' || act.action.includes('skip');
    if (filter === 'play_pause') return act.type === 'play' || act.type === 'pause' || act.action.includes('playback');
    return true;
  });

  const getActionBadge = (act: JamActivity) => {
    if (act.type === 'add' || act.action.includes('add')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <Plus className="w-2.5 h-2.5" />
          QUEUED
        </span>
      );
    }
    if (act.type === 'skip' || act.action.includes('skip')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <SkipForward className="w-2.5 h-2.5" />
          SKIPPED
        </span>
      );
    }
    if (act.type === 'pause' || act.action.includes('pause')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">
          <Pause className="w-2.5 h-2.5" />
          PAUSED
        </span>
      );
    }
    if (act.type === 'join' || act.action.includes('join')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          <Users className="w-2.5 h-2.5" />
          JOINED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
        <Play className="w-2.5 h-2.5" />
        PLAYED
      </span>
    );
  };

  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-4 sm:p-5 space-y-4">
      {/* Title & Live Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>Session Activity Feed</span>
              <span className="flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Real-time audit log of who queued, skipped, or controlled music
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
              filter === 'all'
                ? 'bg-white text-slate-950 shadow-sm font-bold'
                : 'bg-white/5 hover:bg-white/10 active:bg-white/15 text-slate-300'
            }`}
          >
            All ({activities.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('add')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
              filter === 'add'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                : 'bg-white/5 hover:bg-white/10 active:bg-white/15 text-slate-300'
            }`}
          >
            Added ({activities.filter((a) => a.type === 'add' || a.action.includes('add')).length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('skip')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
              filter === 'skip'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                : 'bg-white/5 hover:bg-white/10 active:bg-white/15 text-slate-300'
            }`}
          >
            Skipped ({activities.filter((a) => a.type === 'skip' || a.action.includes('skip')).length})
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar pr-1">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-1">
            <Music className="w-5 h-5 mx-auto text-slate-600 mb-1" />
            <p>No activity recorded in this category yet.</p>
            <p className="text-[11px] text-slate-600">
              When Shekhar, Tushar, or Mohit adds or skips a song, it appears here in real-time.
            </p>
          </div>
        ) : (
          filtered.map((act) => (
            <div
              key={act.id}
              className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all text-xs"
            >
              {/* Left: User Avatar + Action Details */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* User Avatar */}
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0 bg-slate-800">
                  {act.avatar ? (
                    <img
                      src={act.avatar}
                      alt={act.userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-white text-[10px]">
                      {act.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white tracking-tight">{act.userName}</span>
                    {getActionBadge(act)}
                    <span className="text-[11px] text-slate-400">{act.action}</span>
                  </div>

                  {/* Track info pill if present */}
                  {act.trackTitle && (
                    <div className="flex items-center gap-2 mt-1 min-w-0">
                      {act.trackArtwork && (
                        <img
                          src={act.trackArtwork}
                          alt={act.trackTitle}
                          referrerPolicy="no-referrer"
                          className="w-5 h-5 rounded object-cover border border-white/10 shrink-0"
                        />
                      )}
                      <span className="text-white font-semibold truncate text-[11px]">
                        "{act.trackTitle}"
                      </span>
                      {act.trackArtist && (
                        <span className="text-slate-400 truncate text-[10px]">
                          · {act.trackArtist}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Timestamp */}
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 shrink-0">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{formatRelativeTime(act.timestamp)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
