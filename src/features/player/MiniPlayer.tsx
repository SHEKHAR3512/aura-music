import React, { useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Volume2, 
  VolumeX, 
  SlidersHorizontal, 
  Mic2, 
  ListMusic, 
  Maximize2, 
  Heart, 
  Waves,
  Sparkles,
  Car
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useJamStore } from '../../lib/jam/jamStore';
import { useAudioTime, formatTime } from '../../hooks/useAudioTime';
import { SafeImage } from '../../components/ui/SafeImage';

export const MiniPlayer: React.FC = () => {
  const { session: jamSession } = useJamStore();
  const {
    currentTrack,
    isPlaying,
    isLoading,
    volume,
    isMuted,
    shuffle,
    repeat,
    likedSongIds,
    queueOpen,
    lyricsOpen,
    eqModalOpen,
    moreLikeThisOpen,
    jamModalOpen,
    visualizerActive,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    toggleLike,
    setQueueOpen,
    setLyricsOpen,
    setEqModalOpen,
    setMoreLikeThisOpen,
    setJamModalOpen,
    toggleVisualizer,
    toggleExpandedPlayer,
  } = usePlayerStore();

  const { currentTime, duration, progress, buffered } = useAudioTime();
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [isHoveringBar, setIsHoveringBar] = useState(false);

  if (!currentTrack) return null;

  const isLiked = likedSongIds.includes(currentTrack.id);

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    seek(percent * duration);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    setHoverPosition(clickX);
    setHoverTime(percent * duration);
  };

  return (
    <footer 
      role="region"
      aria-label="Audio Player"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d0e15]/95 backdrop-blur-xl border-t border-white/[0.08] select-none transition-all duration-300 pb-safe"
      style={{
        boxShadow: '0 -10px 40px -10px var(--aura-glow, rgba(0,0,0,0.5))',
      }}
    >
      {/* Precision Scrub Bar with Hover Timestamp */}
      <div 
        ref={progressBarRef}
        onClick={handleSeekClick}
        onMouseEnter={() => setIsHoveringBar(true)}
        onMouseLeave={() => { setIsHoveringBar(false); setHoverTime(null); }}
        onMouseMove={handleMouseMove}
        className="group relative w-full h-1.5 hover:h-2.5 bg-white/[0.07] cursor-pointer transition-all duration-150"
      >
        {/* Buffered Bar */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-white/15 transition-all duration-200"
          style={{ width: `${duration > 0 ? (buffered / duration) * 100 : 0}%` }}
        />
        {/* Progress Bar */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[var(--aura-secondary,#8b5cf6)] to-[var(--aura-primary,#6366f1)]"
          style={{ width: `${progress * 100}%` }}
        >
          {/* Thumb dot */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform duration-150" />
        </div>

        {/* Hover Time Tooltip */}
        {isHoveringBar && hoverTime !== null && (
          <div 
            className="absolute -top-7 -translate-x-1/2 bg-black/90 text-white text-[11px] font-mono px-2 py-0.5 rounded border border-white/10 pointer-events-none shadow-lg"
            style={{ left: `${hoverPosition}px` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-[72px] flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Track Info (Zone 1) */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 max-w-[35%] sm:max-w-[30%]">
          <div 
            onClick={toggleExpandedPlayer}
            className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 cursor-pointer shadow-md group border border-white/10"
          >
            <SafeImage 
              src={currentTrack.artwork.low || currentTrack.artwork.medium} 
              alt={currentTrack.title}
              type="track"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-150">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="min-w-0">
            <h4 
              onClick={toggleExpandedPlayer}
              className="text-sm font-semibold text-white truncate cursor-pointer hover:underline"
              title={currentTrack.title}
            >
              {currentTrack.title}
            </h4>
            <p className="text-xs text-slate-400 truncate mt-0.5" title={currentTrack.primaryArtist}>
              {currentTrack.primaryArtist}
            </p>
          </div>

          <button
            onClick={() => toggleLike(currentTrack)}
            aria-label={isLiked ? "Unlike song" : "Like song"}
            className={`p-2 rounded-full transition-colors hidden sm:flex shrink-0 ${
              isLiked ? 'text-rose-500 hover:text-rose-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Central Playback Controls (Zone 2) */}
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleShuffle}
              aria-label="Shuffle"
              className={`p-2 rounded-full transition-colors hidden sm:block ${
                shuffle ? 'text-[var(--aura-primary,#6366f1)]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={prevTrack}
              aria-label="Previous track"
              className="p-2 rounded-full text-slate-300 hover:text-white transition-colors"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              disabled={isLoading}
              className="w-11 h-11 rounded-full bg-white text-slate-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              aria-label="Next track"
              className="p-2 rounded-full text-slate-300 hover:text-white transition-colors"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={cycleRepeat}
              aria-label={`Repeat mode: ${repeat}`}
              className={`p-2 rounded-full transition-colors hidden sm:block ${
                repeat !== 'off' ? 'text-[var(--aura-primary,#6366f1)]' : 'text-slate-400 hover:text-white'
              }`}
            >
              {repeat === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Time Counter */}
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono tabular-nums text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Studio Tools & Audio Volume (Zone 3) */}
        <div className="flex items-center gap-1 sm:gap-2 justify-end min-w-0">
          
          {/* More Like This (Related / Same Genre) Trigger */}
          <button
            onClick={() => setMoreLikeThisOpen(!moreLikeThisOpen)}
            aria-label="More Like This"
            title="More Like This (Related Songs & Same Genre)"
            className={`p-2 rounded-lg transition-colors ${
              moreLikeThisOpen ? 'text-[var(--aura-primary,#6366f1)] bg-white/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Car Group Play / Jam Trigger */}
          <button
            onClick={() => setJamModalOpen(true)}
            aria-label="Car Group Play"
            title="Car Group Play / Multi-Device Jam"
            className={`p-2 rounded-lg transition-colors relative ${
              jamSession ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Car className="w-4 h-4" />
            {jamSession && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Studio EQ Trigger */}
          <button
            onClick={() => setEqModalOpen(!eqModalOpen)}
            aria-label="Studio Equalizer"
            title="Studio Equalizer (10-Band EQ)"
            className={`p-2 rounded-lg transition-colors ${
              eqModalOpen ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Canvas Visualizer Trigger */}
          <button
            onClick={toggleVisualizer}
            aria-label="Cinematic Visualizer"
            title="Cinematic Visualizer"
            className={`p-2 rounded-lg transition-colors ${
              visualizerActive ? 'text-[var(--aura-primary,#6366f1)] bg-white/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Waves className="w-4 h-4" />
          </button>

          {/* Synced Lyrics Trigger */}
          <button
            onClick={() => setLyricsOpen(!lyricsOpen)}
            aria-label="Synced Lyrics"
            title="Synced Lyrics"
            className={`p-2 rounded-lg transition-colors ${
              lyricsOpen ? 'text-[var(--aura-primary,#6366f1)] bg-white/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic2 className="w-4 h-4" />
          </button>

          {/* Queue Trigger */}
          <button
            onClick={() => setQueueOpen(!queueOpen)}
            aria-label="Up Next Queue"
            title="Queue"
            className={`p-2 rounded-lg transition-colors ${
              queueOpen ? 'text-[var(--aura-primary,#6366f1)] bg-white/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Volume Slider (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-white/10">
            <button
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Volume slider"
              className="w-20 h-1 bg-white/20 accent-[var(--aura-primary,#6366f1)] rounded-lg cursor-pointer"
            />
          </div>

          {/* Fullscreen Expand Trigger */}
          <button
            onClick={toggleExpandedPlayer}
            aria-label="Expand player"
            title="Expand Now Playing"
            className="p-2 rounded-lg text-slate-400 hover:text-white transition-colors hidden sm:block"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

      </div>
    </footer>
  );
};
