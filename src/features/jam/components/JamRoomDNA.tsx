import React from 'react';
import { Dna, Zap, Globe, Music, Sparkles } from 'lucide-react';
import { useJamStore } from '../store/useJamStore';

export const JamRoomDNA: React.FC = () => {
  const { roomDNA } = useJamStore();

  if (!roomDNA) {
    return (
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-slate-500">
        Calculating room sonic DNA...
      </div>
    );
  }

  const getEnergyColor = () => {
    switch (roomDNA.energy) {
      case 'HIGH':
        return 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-500/20';
      case 'MEDIUM':
        return 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-indigo-500/20';
      default:
        return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20';
    }
  };

  return (
    <div className="w-full rounded-2xl bg-black/40 border border-white/10 p-4 space-y-4 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--aura-primary,#6366f1)]/20 border border-[var(--aura-primary,#6366f1)]/40 flex items-center justify-center text-[var(--aura-primary,#6366f1)]">
            <Dna className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wider uppercase">Room DNA</h4>
            <p className="text-[10px] text-slate-400">Collective sonic fingerprint</p>
          </div>
        </div>

        {/* Energy Pill */}
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1 shadow-md ${getEnergyColor()}`}>
          <Zap className="w-3 h-3" />
          <span>{roomDNA.energy} ENERGY</span>
        </div>
      </div>

      {/* Genres Spectrum */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
          Dominant Genres
        </span>
        <div className="space-y-1.5">
          {roomDNA.genres.map((g) => (
            <div key={g.genre} className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium truncate">{g.genre}</span>
                <span className="text-slate-400 font-mono text-[11px]">{g.percentage}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--aura-primary,#6366f1)] to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${g.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Languages & Top Artists Grid */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
        {/* Languages */}
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono uppercase">
            <Globe className="w-3 h-3" />
            <span>Languages</span>
          </div>
          <p className="text-slate-200 font-semibold truncate text-[11px]">
            {roomDNA.languages.map((l) => l.language).join(' • ') || 'Multilingual'}
          </p>
        </div>

        {/* Top Artist Shared Vibe */}
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono uppercase">
            <Music className="w-3 h-3" />
            <span>Key Artists</span>
          </div>
          <p className="text-slate-200 font-semibold truncate text-[11px]">
            {roomDNA.topArtists.slice(0, 2).join(', ') || 'Shared Hits'}
          </p>
        </div>
      </div>

      {/* Explanatory Vibe Tag */}
      <div className="flex items-center gap-2 p-2 rounded-xl bg-[var(--aura-primary,#6366f1)]/10 border border-[var(--aura-primary,#6366f1)]/20 text-[11px] text-slate-300">
        <Sparkles className="w-3.5 h-3.5 text-[var(--aura-primary,#6366f1)] shrink-0" />
        <span className="truncate">{roomDNA.vibeDescription}</span>
      </div>
    </div>
  );
};
