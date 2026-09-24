import React from 'react';
import { X, Moon, Volume2, Timer, Zap, Sliders, RotateCcw } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { EQ_FREQUENCIES, EQ_PRESETS } from '../../lib/audio/AudioEngine';
import { EQPresetName } from '../../lib/music/types';
import { CrossfadeSettingSlider } from './CrossfadeSettingSlider';

const PRESET_NAMES: EQPresetName[] = [
  'Flat',
  'Bass Boost',
  'Pop',
  'Rock',
  'Electronic',
  'Jazz',
  'Classical',
  'Vocal',
];

const SLEEP_PRESETS = [
  { label: 'Off', minutes: null },
  { label: '5m', minutes: 5 },
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '60m', minutes: 60 },
];

export const StudioEQModal: React.FC = () => {
  const {
    eqModalOpen,
    setEqModalOpen,
    eqPreset,
    customBands,
    setEQBand,
    applyEQPreset,
    isNightMode,
    toggleNightMode,
    balance,
    setBalance,
    crossfadeSeconds,
    setCrossfade,
    sleepTimerRemaining,
    setSleepTimer,
    playbackRate,
    setPlaybackRate,
  } = usePlayerStore();

  if (!eqModalOpen) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Studio Equalizer and Audio Controls"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
    >
      <div 
        className="relative w-full max-w-2xl bg-[#0f111a] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-100"
        style={{
          boxShadow: '0 25px 60px -15px var(--aura-glow, rgba(0,0,0,0.7))',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--aura-primary,#6366f1)]/20 border border-[var(--aura-primary,#6366f1)]/30 flex items-center justify-center text-[var(--aura-primary,#6366f1)]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Studio Acoustic Console</h3>
              <p className="text-xs text-slate-400">10-band studio equalization & spatial dynamics</p>
            </div>
          </div>
          <button
            onClick={() => setEqModalOpen(false)}
            aria-label="Close Equalizer"
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* EQ Presets Bar */}
        <div className="mt-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Target Tuning Presets
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_NAMES.map((name) => {
              const active = eqPreset === name;
              return (
                <button
                  key={name}
                  onClick={() => applyEQPreset(name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-gradient-to-r from-[var(--aura-secondary,#8b5cf6)] to-[var(--aura-primary,#6366f1)] text-white shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  {name}
                </button>
              );
            })}
            <button
              onClick={() => applyEQPreset('Flat')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-white/5 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* 10-Band Equalizer Sliders */}
        <div className="mt-6 p-4 rounded-xl bg-black/40 border border-white/5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-4 px-1">
            <span>+12 dB</span>
            <span className="font-mono text-slate-500">0 dB Baseline</span>
            <span>-12 dB</span>
          </div>

          <div className="grid grid-cols-10 gap-1.5 sm:gap-3 items-center justify-items-center h-44">
            {EQ_FREQUENCIES.map((freq, index) => {
              const gain = customBands[index] || 0;
              const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
              return (
                <div key={freq} className="flex flex-col items-center h-full justify-between w-full">
                  <span className="text-[10px] font-mono tabular-nums text-slate-300">
                    {gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1)}
                  </span>

                  <div className="relative flex items-center justify-center h-28 w-6">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={gain}
                      onChange={(e) => setEQBand(index, parseFloat(e.target.value))}
                      aria-label={`${label} Hz band`}
                      className="slider-vertical h-28 w-2 accent-[var(--aura-primary,#6366f1)] cursor-pointer"
                      style={{
                        writingMode: 'vertical-lr',
                        direction: 'rtl',
                      }}
                    />
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 mt-1">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Crossfade Transition Section (Gapless & Jam Synchronized) */}
        <div className="mt-6">
          <CrossfadeSettingSlider showEnvelopeVisual={true} />
        </div>

        {/* Dynamic Effects, Balance, Night Mode & Sleep Timer */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Stereo Balance */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                Stereo Panner (L ↔ R)
              </span>
              <span className="font-mono tabular-nums text-slate-400">
                {balance === 0 ? 'Center' : balance < 0 ? `L ${Math.abs(balance * 100).toFixed(0)}%` : `R ${(balance * 100).toFixed(0)}%`}
              </span>
            </div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={balance}
              onChange={(e) => setBalance(parseFloat(e.target.value))}
              aria-label="Stereo balance"
              className="w-full h-1.5 bg-white/10 accent-[var(--aura-primary,#6366f1)] rounded cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 mt-1.5">Adjust spatial ear balance for headphone listening.</p>
          </div>

          {/* Night Mode Dynamics */}
          <div 
            onClick={toggleNightMode}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
              isNightMode ? 'bg-[var(--aura-primary,#6366f1)]/15 border-[var(--aura-primary,#6366f1)]/40' : 'bg-white/5 border-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isNightMode ? 'bg-[var(--aura-primary,#6366f1)] text-white' : 'bg-white/10 text-slate-400'}`}>
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Night Compression Mode</h4>
                <p className="text-[10px] text-slate-400">Normalizes dynamic volume peaks for late night quiet listening</p>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={isNightMode} 
              readOnly 
              className="accent-[var(--aura-primary,#6366f1)] w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Sleep Timer */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 sm:col-span-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-rose-400" />
                Sleep Timer
              </span>
              {sleepTimerRemaining !== null && (
                <span className="font-mono text-emerald-400 text-xs font-semibold">
                  {Math.floor(sleepTimerRemaining / 60)}m {sleepTimerRemaining % 60}s remaining
                </span>
              )}
            </div>
            <div className="flex gap-1.5">
              {SLEEP_PRESETS.map((p) => {
                return (
                  <button
                    key={p.label}
                    onClick={() => setSleepTimer(p.minutes)}
                    className="flex-1 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-medium transition-colors"
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
