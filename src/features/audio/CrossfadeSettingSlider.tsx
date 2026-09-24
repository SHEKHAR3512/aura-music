import React from 'react';
import { Zap, Radio, Sliders, Car, Sparkles, Check } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useJamStore } from '../../lib/jam/jamStore';
import { triggerHaptic } from '../../lib/utils/haptics';

interface CrossfadeSettingSliderProps {
  compact?: boolean;
  showEnvelopeVisual?: boolean;
  inJamSessionModal?: boolean;
}

const CROSSFADE_PRESETS = [
  { seconds: 0, label: '0s', desc: 'Cut' },
  { seconds: 2, label: '2s', desc: 'Fast' },
  { seconds: 4, label: '4s', desc: 'Smooth' },
  { seconds: 8, label: '8s', desc: 'Club' },
  { seconds: 12, label: '12s', desc: 'Max DJ' },
];

export const CrossfadeSettingSlider: React.FC<CrossfadeSettingSliderProps> = ({
  compact = false,
  showEnvelopeVisual = true,
  inJamSessionModal = false,
}) => {
  const { crossfadeSeconds, setCrossfade } = usePlayerStore();
  const { session: jamSession, broadcastSetCrossfade } = useJamStore();

  const handleSliderChange = (newVal: number) => {
    triggerHaptic('seek');
    setCrossfade(newVal);
    if (jamSession) {
      broadcastSetCrossfade(newVal);
    }
  };

  const handlePresetClick = (seconds: number) => {
    triggerHaptic('button');
    setCrossfade(seconds);
    if (jamSession) {
      broadcastSetCrossfade(seconds);
    }
  };

  // Helper description based on active duration
  const getDurationDescription = (secs: number) => {
    if (secs === 0) return 'Immediate Cut (No Crossfade)';
    if (secs <= 2) return 'Fast Gapless Blend';
    if (secs <= 5) return 'Smooth Radio Crossfade';
    if (secs <= 9) return 'Club DJ Transition';
    return 'Extended Harmonic Transition';
  };

  return (
    <div className={`rounded-2xl border transition-all ${
      inJamSessionModal 
        ? 'bg-gradient-to-r from-emerald-950/20 via-black/40 to-black/40 border-emerald-500/25 p-4 sm:p-5' 
        : 'bg-white/[0.04] border-white/10 p-4 sm:p-5'
    }`}>
      {/* Header with Title and Current Duration */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            inJamSessionModal 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
          }`}>
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                Gapless Crossfade Transition
              </h4>
              {jamSession && (
                <span className="hidden xs:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  JAM SYNCED
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {getDurationDescription(crossfadeSeconds)}
            </p>
          </div>
        </div>

        {/* Real-time numerical readout */}
        <div className="flex items-baseline gap-1 bg-black/60 px-3 py-1 rounded-xl border border-white/10 shrink-0">
          <span className="text-sm sm:text-base font-black font-mono tracking-tight text-white">
            {crossfadeSeconds}
          </span>
          <span className="text-[10px] font-mono text-slate-400 uppercase">sec</span>
        </div>
      </div>

      {/* Main Interactive Slider */}
      <div className="space-y-2 py-1">
        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={crossfadeSeconds}
            onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
            aria-label="Crossfade transition duration in seconds"
            className="w-full h-2 rounded-lg bg-black/50 accent-emerald-400 cursor-pointer appearance-none border border-white/10"
            style={{
              background: `linear-gradient(to right, ${
                inJamSessionModal ? '#10b981' : '#6366f1'
              } 0%, ${
                inJamSessionModal ? '#10b981' : '#6366f1'
              } ${(crossfadeSeconds / 12) * 100}%, rgba(255,255,255,0.1) ${(crossfadeSeconds / 12) * 100}%, rgba(255,255,255,0.1) 100%)`
            }}
          />
        </div>

        {/* Tick marks and labels */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 px-0.5 select-none">
          <span>0s (Cut)</span>
          <span className="hidden sm:inline">3s</span>
          <span>6s (Radio)</span>
          <span className="hidden sm:inline">9s</span>
          <span>12s (Max)</span>
        </div>
      </div>

      {/* Visual Audio Envelope Indicator */}
      {showEnvelopeVisual && (
        <div className="my-3.5 p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
              <span>Outgoing Song</span>
            </span>
            <span className="text-slate-500">
              {crossfadeSeconds === 0 ? 'Abrupt Track Cut' : `${crossfadeSeconds}s Overlap Window`}
            </span>
            <span className="flex items-center gap-1">
              <span>Incoming Song</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            </span>
          </div>

          {/* SVG Envelope Diagram */}
          <div className="relative h-10 w-full overflow-hidden rounded-lg bg-black/50 border border-white/5 flex items-center px-2">
            {crossfadeSeconds === 0 ? (
              <div className="w-full flex items-center justify-between text-[11px] font-mono px-4 text-slate-500">
                <span className="text-rose-400/80">Track A Ends (100% Vol)</span>
                <span className="text-white/40">| Instant Switch |</span>
                <span className="text-emerald-400/80">Track B Starts (100% Vol)</span>
              </div>
            ) : (
              <svg className="w-full h-full" viewBox="0 0 300 40" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="fadeA" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.05" />
                  </linearGradient>
                  <linearGradient id="fadeB" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {/* Overlap background shading */}
                <rect 
                  x={150 - (crossfadeSeconds / 12) * 110} 
                  y="2" 
                  width={(crossfadeSeconds / 12) * 220} 
                  height="36" 
                  fill="rgba(16, 185, 129, 0.08)" 
                  rx="4" 
                />

                {/* Curve A (Fade Out) */}
                <path
                  d={`M 10 6 L ${150 - (crossfadeSeconds / 12) * 100} 6 C 150 6, ${150 + (crossfadeSeconds / 12) * 60} 34, ${150 + (crossfadeSeconds / 12) * 100} 34`}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Curve B (Fade In) */}
                <path
                  d={`M ${150 - (crossfadeSeconds / 12) * 100} 34 C ${150 - (crossfadeSeconds / 12) * 60} 34, 150 6, ${150 + (crossfadeSeconds / 12) * 100} 6 L 290 6`}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Preset Buttons */}
      <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider pr-1 shrink-0">
          Presets:
        </span>
        {CROSSFADE_PRESETS.map((p) => {
          const isSelected = crossfadeSeconds === p.seconds;
          return (
            <button
              key={p.seconds}
              type="button"
              onClick={() => handlePresetClick(p.seconds)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shrink-0 border ${
                isSelected
                  ? inJamSessionModal
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-sm'
                    : 'bg-white text-slate-950 font-bold border-white shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 active:bg-white/15 text-slate-300 border-white/5'
              }`}
            >
              <span>{p.label}</span>
              <span className="text-[9px] opacity-75 ml-1 font-mono">{p.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Jam Collaborative Status / Benefit Text */}
      <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-start gap-2 text-[11px] text-slate-400">
        <Car className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${jamSession ? 'text-emerald-400' : 'text-slate-500'}`} />
        <p className="leading-relaxed">
          {jamSession ? (
            <span>
              <strong className="text-white font-medium">Car Jam Active ({jamSession.name}):</strong> Adjusting this slider syncs the gapless transition duration across all passengers and the car speaker in real time.
            </span>
          ) : (
            <span>
              <strong className="text-white font-medium">Jam Session Ready:</strong> Eliminates awkward silence between passenger requests during group road trips. Next track blends in automatically.
            </span>
          )}
        </p>
      </div>
    </div>
  );
};
