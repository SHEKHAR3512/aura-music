import React from 'react';

/**
 * 5-Bar Acoustic Frequency Equalizer Loader
 * Renders realistic animated spectrum bars pulsing with harmonic frequencies.
 */
export const EqualizerLoader: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}> = ({ size = 'md', color, className = '' }) => {
  const heights = {
    sm: 'h-4 gap-0.5',
    md: 'h-7 gap-1',
    lg: 'h-12 gap-1.5',
  }[size];

  const barWidth = {
    sm: 'w-1',
    md: 'w-1.5',
    lg: 'w-2',
  }[size];

  return (
    <div 
      role="status" 
      aria-label="Loading audio stream..."
      className={`flex items-end justify-center ${heights} ${className}`}
    >
      <span 
        className={`${barWidth} rounded-full wave-bar-1 transition-colors`}
        style={{ backgroundColor: color || 'var(--aura-primary, #6366f1)' }} 
      />
      <span 
        className={`${barWidth} rounded-full wave-bar-2 transition-colors`}
        style={{ backgroundColor: color || 'var(--aura-secondary, #8b5cf6)' }} 
      />
      <span 
        className={`${barWidth} rounded-full wave-bar-3 transition-colors`}
        style={{ backgroundColor: color || 'var(--aura-cyan, #06b6d4)' }} 
      />
      <span 
        className={`${barWidth} rounded-full wave-bar-4 transition-colors`}
        style={{ backgroundColor: color || 'var(--aura-primary, #6366f1)' }} 
      />
      <span 
        className={`${barWidth} rounded-full wave-bar-5 transition-colors`}
        style={{ backgroundColor: color || 'var(--aura-secondary, #8b5cf6)' }} 
      />
    </div>
  );
};

/**
 * 33-RPM High-Fidelity Vinyl Disc Loader
 * Renders a spinning grooved record with glowing center label and specular reflection.
 */
export const VinylDiscLoader: React.FC<{
  label?: string;
  size?: number;
}> = ({ label = 'AURA MASTER', size = 80 }) => {
  return (
    <div 
      role="status" 
      aria-label="Loading audio..."
      className="flex flex-col items-center justify-center p-6 space-y-4"
    >
      <div 
        className="relative rounded-full bg-[#0a0a0f] border-2 border-slate-700/60 shadow-2xl animate-vinyl-spin flex items-center justify-center overflow-hidden"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* Vinyl Grooves */}
        <div className="absolute inset-0 vinyl-grooves rounded-full opacity-60" />
        
        {/* Specular Light Reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none rounded-full" />

        {/* Center Label */}
        <div 
          className="relative w-1/3 h-1/3 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-rose-500 flex items-center justify-center shadow-inner border border-white/20"
        >
          {/* Spindle Hole */}
          <div className="w-2.5 h-2.5 rounded-full bg-[#07080c] border border-white/30" />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-slate-400">
        <EqualizerLoader size="sm" />
        <span>{label}</span>
      </div>
    </div>
  );
};

/**
 * Micro 4-bar jumping equalizer wave indicator for active song cards
 */
export const MiniEqualizerBars: React.FC<{ color?: string }> = ({ color }) => {
  return (
    <div className="flex items-end gap-[2px] h-3.5 w-3.5 shrink-0" aria-hidden="true">
      <span 
        className="w-[2px] rounded-full wave-bar-1" 
        style={{ backgroundColor: color || '#818cf8' }} 
      />
      <span 
        className="w-[2px] rounded-full wave-bar-3" 
        style={{ backgroundColor: color || '#06b6d4' }} 
      />
      <span 
        className="w-[2px] rounded-full wave-bar-2" 
        style={{ backgroundColor: color || '#818cf8' }} 
      />
      <span 
        className="w-[2px] rounded-full wave-bar-4" 
        style={{ backgroundColor: color || '#a855f7' }} 
      />
    </div>
  );
};

/**
 * High-Craft Track Card Skeleton Loading State
 */
export const TrackCardSkeleton: React.FC = () => {
  return (
    <div className="p-3.5 rounded-2xl bg-[#0d101a]/80 border border-white/5 flex items-center gap-4 skeleton-shimmer">
      {/* Artwork placeholder with vinyl peeking edge */}
      <div className="relative w-14 h-14 rounded-xl bg-white/5 shrink-0 overflow-hidden" />
      
      {/* Title & metadata lines */}
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-4 bg-white/10 rounded-md w-3/4" />
        <div className="flex items-center gap-2">
          <div className="h-3 bg-white/5 rounded-md w-1/3" />
          <div className="h-3 bg-white/5 rounded-md w-12" />
        </div>
      </div>

      {/* Action / duration placeholder */}
      <div className="w-8 h-8 rounded-full bg-white/5 shrink-0" />
    </div>
  );
};

/**
 * Spotlight Hero Banner Loading Skeleton
 */
export const HeroSpotlightSkeleton: React.FC = () => {
  return (
    <div className="relative rounded-3xl overflow-hidden border border-white/5 bg-[#0d101a]/90 p-6 sm:p-10 shadow-2xl skeleton-shimmer">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="max-w-xl space-y-4 flex-1">
          <div className="h-4 bg-white/10 rounded-full w-44" />
          <div className="h-10 sm:h-12 bg-white/10 rounded-xl w-4/5" />
          <div className="h-5 bg-white/5 rounded-lg w-2/3" />
          <div className="h-4 bg-white/5 rounded-md w-full" />
          <div className="flex items-center gap-4 pt-4">
            <div className="h-12 w-44 bg-white/15 rounded-full" />
            <div className="h-4 w-28 bg-white/5 rounded-md" />
          </div>
        </div>
        <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-2xl bg-white/10 shrink-0 self-center md:self-auto" />
      </div>
    </div>
  );
};
