import React, { useState, useEffect, useRef } from 'react';
import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';

export function VolumeHUD() {
  const volume = usePlayerStore((state) => state.volume);
  const isMuted = usePlayerStore((state) => state.isMuted);

  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Suppress showing HUD on initial page load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setVisible(true);

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      setVisible(false);
    }, 1400);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [volume, isMuted]);

  if (!visible) return null;

  const currentPercent = isMuted ? 0 : Math.round(volume * 100);

  const VolumeIcon = isMuted || volume === 0
    ? VolumeX
    : volume < 0.33
    ? Volume
    : volume < 0.67
    ? Volume1
    : Volume2;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Volume: ${currentPercent}%`}
      className="fixed top-8 left-1/2 -translate-x-1/2 z-[99998] pointer-events-none select-none transition-all duration-200 animate-fadeIn"
    >
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#0c0e18]/90 backdrop-blur-2xl border border-white/20 text-white shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_24px_rgba(99,102,241,0.25)] min-w-[200px] max-w-[240px]">
        <div className="p-1.5 rounded-xl bg-white/10 text-[var(--aura-primary,#6366f1)] shrink-0">
          <VolumeIcon className="w-5 h-5" />
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wide">
            <span className="text-slate-300">Volume</span>
            <span className="font-mono text-white tabular-nums">
              {isMuted ? 'Muted' : `${currentPercent}%`}
            </span>
          </div>

          {/* Smooth Apple-style progress track */}
          <div className="h-1.5 w-full bg-white/15 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-100 rounded-full ${
                isMuted
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-[var(--aura-secondary,#8b5cf6)] to-[var(--aura-primary,#6366f1)]'
              }`}
              style={{ width: `${currentPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
