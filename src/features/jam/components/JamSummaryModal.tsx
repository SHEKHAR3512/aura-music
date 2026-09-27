import React from 'react';
import { Trophy, Clock, Music, Users, Heart, Dna, Plus } from 'lucide-react';
import { useJamStore } from '../store/useJamStore';

export const JamSummaryModal: React.FC = () => {
  const { summary, isSummaryModalOpen, setIsSummaryModalOpen, setIsCreateModalOpen } = useJamStore();

  if (!isSummaryModalOpen || !summary) return null;

  const durationMin = Math.max(1, Math.round(summary.durationSeconds / 60));

  const handleStartAnother = () => {
    setIsSummaryModalOpen(false);
    setIsCreateModalOpen(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Jam Session Complete"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn text-slate-100"
    >
      <div className="relative w-full max-w-md bg-[#0c0f17] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 text-center">
        {/* Glow Header Badge */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-pink-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10">
          <Trophy className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono tracking-widest text-[var(--aura-primary,#6366f1)] uppercase font-bold">
            SESSION COMPLETE
          </span>
          <h3 className="text-2xl font-black text-white tracking-tight">{summary.roomName}</h3>
          <p className="text-xs text-slate-400">
            {durationMin} minutes of synchronized sonic connection
          </p>
        </div>

        {/* 4 Stat Highlights Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-left">
          {/* Duration */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono uppercase">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Duration</span>
            </div>
            <p className="text-sm font-bold text-white">{durationMin} min</p>
          </div>

          {/* Tracks */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono uppercase">
              <Music className="w-3 h-3 text-[var(--aura-primary,#6366f1)]" />
              <span>Tracks Played</span>
            </div>
            <p className="text-sm font-bold text-white">{summary.totalTracksPlayed} songs</p>
          </div>

          {/* Listeners */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono uppercase">
              <Users className="w-3 h-3 text-emerald-400" />
              <span>Listeners</span>
            </div>
            <p className="text-sm font-bold text-white">{summary.participantCount} friends</p>
          </div>

          {/* Reactions */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono uppercase">
              <Heart className="w-3 h-3 text-rose-400" />
              <span>Reactions</span>
            </div>
            <p className="text-sm font-bold text-white">{summary.totalReactions} emojis</p>
          </div>
        </div>

        {/* Top Track Pill */}
        {summary.topTrack && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-left">
            <img
              src={summary.topTrack.artwork.low || summary.topTrack.artwork.medium}
              alt={summary.topTrack.title}
              className="w-10 h-10 rounded-xl object-cover border border-white/10"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-amber-400 font-mono uppercase font-bold tracking-wider">
                FEATURED HIGHLIGHT
              </span>
              <h5 className="text-xs font-bold text-white truncate">{summary.topTrack.title}</h5>
              <p className="text-[11px] text-slate-400 truncate">{summary.topTrack.primaryArtist}</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => setIsSummaryModalOpen(false)}
            className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Close Recap
          </button>
          <button
            onClick={handleStartAnother}
            className="py-2.5 rounded-xl bg-[var(--aura-primary,#6366f1)] hover:bg-[var(--aura-primary,#6366f1)]/90 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-lg shadow-indigo-500/25"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Start Another Jam</span>
          </button>
        </div>
      </div>
    </div>
  );
};
