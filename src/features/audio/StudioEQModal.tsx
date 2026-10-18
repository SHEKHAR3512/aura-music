import React from 'react';
import { X, Moon, Volume2, Timer, Zap, Sliders, RotateCcw, Activity } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { EQ_FREQUENCIES, EQ_PRESETS } from '../../lib/audio/AudioEngine';
import { EQPresetName } from '../../lib/music/types';
import { CrossfadeSettingSlider } from './CrossfadeSettingSlider';
import { triggerHaptic } from '../../lib/utils/haptics';

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
  } = usePlayerStore();

  if (!eqModalOpen) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Studio Equalizer and Acoustic Console"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-2xl animate-dwi-enter"
    >
      <div 
        className="relative w-full max-w-2xl bg-[#0c0f18]/95 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-100"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8), 0 0 30px rgba(99,102,241,0.15)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight font-display">
                Studio Acoustic Console
              </h3>
              <p className="text-xs text-slate-400 font-mono">10-band mastering equalization & spatial soundstage</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('button');
              setEqModalOpen(false);
            }}
            aria-label="Close Equalizer"
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* EQ Presets Bar */}
        <div className="mt-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 font-mono">
            Acoustic Tuning Presets
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_NAMES.map((name) => {
              const active = eqPreset === name;
              return (
                <button
                  key={name}
                  onClick={() => {
                    triggerHaptic('selection');
                    applyEQPreset(name);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    active
                      ? 'bg-white text-slate-950 font-bold shadow-md border-white'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
                  }`}
                >
                  {name}
                </button>
              );
            })}
            <button
              onClick={() => {
                triggerHaptic('button');
                applyEQPreset('Flat');
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 border border-white/5 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* 10-Band Equalizer Sliders — Rackmount Audio Console Style */}
        <div className="mt-6 p-5 rounded-2xl bg-[#08090f] border border-white/[0.08] shadow-inner">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-4 px-2 font-mono">
            <span className="text-indigo-400 font-bold">+12 dB</span>
            <span className="text-slate-500">0 dB Acoustic Baseline</span>
            <span className="text-cyan-400 font-bold">-12 dB</span>
          </div>

          <div className="grid grid-cols-10 gap-1 sm:gap-2.5 items-center justify-items-center h-44">
            {EQ_FREQUENCIES.map((freq, index) => {
              const gain = customBands[index] || 0;
              const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
              return (
                <div key={freq} className="flex flex-col items-center h-full justify-between w-full">
                  <span className={`text-[10px] font-mono tabular-nums ${gain !== 0 ? 'text-indigo-300 font-bold' : 'text-slate-400'}`}>
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
                      className="slider-vertical h-28 w-2 accent-indigo-400 cursor-pointer"
                      style={{
                        writingMode: 'vertical-lr',
                        direction: 'rtl',
                      }}
                    />
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 mt-1 font-semibold">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Crossfade Transition Section */}
        <div className="mt-6">
          <CrossfadeSettingSlider showEnvelopeVisual={true} />
        </div>

        {/* Dynamic Effects, Balance, Night Mode & Sleep Timer */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Stereo Balance */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-2">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                Stereo Panner (L ↔ R)
              </span>
              <span className="font-mono tabular-nums text-indigo-300">
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
              className="w-full h-1.5 bg-white/10 accent-indigo-400 rounded cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 mt-1.5">Adjust spatial headphone channel balance.</p>
          </div>

          {/* Night Mode Dynamics */}
          <div 
            onClick={() => {
              triggerHaptic('button');
              toggleNightMode();
            }}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              isNightMode ? 'bg-indigo-500/15 border-indigo-500/40 shadow-sm' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isNightMode ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Night Compression Mode</h4>
                <p className="text-[10px] text-slate-400">Normalizes dynamic volume peaks for late night quiet listening</p>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={isNightMode} 
              readOnly 
              className="accent-indigo-500 w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Sleep Timer */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 sm:col-span-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-2.5">
              <span className="flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-rose-400" />
                Sleep Timer Auto-Shutdown
              </span>
              {sleepTimerRemaining !== null && (
                <span className="font-mono text-emerald-400 text-xs font-bold">
                  {Math.floor(sleepTimerRemaining / 60)}m {sleepTimerRemaining % 60}s remaining
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {SLEEP_PRESETS.map((p) => {
                return (
                  <button
                    key={p.label}
                    onClick={() => {
                      triggerHaptic('selection');
                      setSleepTimer(p.minutes);
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors border border-white/5 cursor-pointer"
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
