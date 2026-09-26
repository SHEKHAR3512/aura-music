import React from 'react';
import { Sparkles, Play, Pause, FastForward, Plus, ArrowUpDown, Trash2, UserPlus, LogOut, Radio, Crown } from 'lucide-react';
import { useJamStore } from '../store/useJamStore';
import { JamActivityEvent } from '../types/jam.types';

export const JamActivity: React.FC = () => {
  const { room } = useJamStore();
  const activityList = room?.activity || [];

  const getEventIcon = (type: JamActivityEvent['type']) => {
    switch (type) {
      case 'PLAY':
        return <Play className="w-3 h-3 text-emerald-400" />;
      case 'PAUSE':
        return <Pause className="w-3 h-3 text-amber-400" />;
      case 'TRACK_CHANGE':
        return <FastForward className="w-3 h-3 text-indigo-400" />;
      case 'QUEUE_ADD':
        return <Plus className="w-3 h-3 text-cyan-400" />;
      case 'QUEUE_REORDER':
        return <ArrowUpDown className="w-3 h-3 text-purple-400" />;
      case 'QUEUE_REMOVE':
        return <Trash2 className="w-3 h-3 text-rose-400" />;
      case 'USER_JOIN':
        return <UserPlus className="w-3 h-3 text-emerald-400" />;
      case 'USER_LEAVE':
        return <LogOut className="w-3 h-3 text-slate-400" />;
      case 'HOST_TRANSFER':
        return <Crown className="w-3 h-3 text-amber-400" />;
      case 'ROOM_MODE_CHANGE':
        return <Radio className="w-3 h-3 text-pink-400" />;
      default:
        return <Sparkles className="w-3 h-3 text-[var(--aura-primary,#6366f1)]" />;
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffSec = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
    if (diffSec < 15) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  };

  if (activityList.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-500">
        No recent room activity.
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2 max-h-[280px] overflow-y-auto no-scrollbar">
      {activityList.slice(0, 20).map((act) => (
        <div
          key={act.id}
          className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs hover:bg-white/[0.04] transition-colors"
        >
          <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
            {getEventIcon(act.type)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-slate-300 truncate leading-snug">
              <span className="font-semibold text-white">{act.actorName}</span>{' '}
              {act.message.replace(act.actorName, '').trim()}
            </p>
          </div>

          <span className="text-[10px] font-mono text-slate-500 shrink-0">
            {formatRelativeTime(act.timestamp)}
          </span>
        </div>
      ))}
    </div>
  );
};
