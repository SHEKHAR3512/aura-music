import React, { useRef, useState, useCallback } from 'react';
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
  Car,
  Disc3
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useJamStore } from '../jam/store/useJamStore';
import { useAudioTime, formatTime } from '../../hooks/useAudioTime';
import { SafeImage } from '../../components/ui/SafeImage';
import { EqualizerLoader } from '../../components/ui/AudioLoaders';
import { triggerHaptic } from '../../lib/utils/haptics';

export const MiniPlayer: React.FC = () => {
  const { room: jamRoom } = useJamStore();
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

  // Touch swipe state for mobile forward/backward
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
    setSwipeOffset(0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      isSwiping.current = true;
      setSwipeOffset(Math.max(-80, Math.min(80, dx)));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (isSwiping.current) {
      const SWIPE_THRESHOLD = 50;
      if (swipeOffset < -SWIPE_THRESHOLD) {
        triggerHaptic('skipForward');
        nextTrack();
      } else if (swipeOffset > SWIPE_THRESHOLD) {
        triggerHaptic('skipBack');
        prevTrack();
      }
    }
    isSwiping.current = false;
    setSwipeOffset(0);
  }, [swipeOffset, nextTrack, prevTrack]);

  if (!currentTrack) return null;

  const isLiked = likedSongIds.includes(currentTrack.id);

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    triggerHaptic('seek');
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
      className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 right-0 z-40 bg-[#0a0c14]/95 backdrop-blur-2xl border-t border-white/[0.09] select-none transition-all duration-300 md:pb-safe shadow-[0_-12px_40px_rgba(0,0,0,0.7)]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Precision Scrub Bar with Specular Glow & Hover Timestamp */}
      <div 
        ref={progressBarRef}
        onClick={handleSeekClick}
        onMouseEnter={() => setIsHoveringBar(true)}
        onMouseLeave={() => { setIsHoveringBar(false); setHoverTime(null); }}
        onMouseMove={handleMouseMove}
        className="group relative w-full h-1.5 hover:h-2.5 bg-white/[0.08] cursor-pointer transition-all duration-150"
      >
        {/* Buffered Bar */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-white/20 transition-all duration-200"
          style={{ width: `${duration > 0 ? (buffered / duration) * 100 : 0}%` }}
        />
        
        {/* Progress Fill with Radiant Gradient */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"
          style={{ width: `${progress * 100}%` }}
        >
          {/* Thumb Indicator */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_#6366f1] scale-0 group-hover:scale-100 transition-transform duration-150" />
        </div>

        {/* Hover Time Tooltip */}
        {isHoveringBar && hoverTime !== null && (
          <div 
            className="absolute -top-8 -translate-x-1/2 bg-black/95 text-white text-[11px] font-mono px-2.5 py-0.5 rounded-lg border border-white/15 pointer-events-none shadow-2xl backdrop-blur-md"
            style={{ left: `${hoverPosition}px` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>

      <div 
        className="max-w-7xl mx-auto px-4 sm:px-6 h-[74px] flex items-center justify-between gap-2 sm:gap-6 transition-transform duration-150"
        style={{ transform: swipeOffset ? `translateX(${swipeOffset}px)` : undefined, opacity: swipeOffset ? 0.7 : 1 }}
      >
        
        {/* Track Info (Zone 1) with Vinyl Grooves Disc */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 sm:flex-initial sm:max-w-[32%]">
          <div 
            onClick={() => {
              triggerHaptic('button');
              toggleExpandedPlayer();
            }}
            className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 cursor-pointer shadow-lg group border border-white/10"
          >
            <SafeImage 
              src={currentTrack.artwork.low || currentTrack.artwork.medium} 
              alt={currentTrack.title}
              type="track"
              className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                isPlaying ? 'animate-vinyl-spin-slow' : ''
              }`}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div 
            className="min-w-0 flex-1 cursor-pointer" 
            onClick={() => {
              triggerHaptic('button');
              toggleExpandedPlayer();
            }}
          >
            <div className="flex items-center gap-1.5">
              <h4 
                className="text-xs sm:text-sm font-bold text-white truncate hover:underline tracking-tight"
                title={currentTrack.title}
              >
                {currentTrack.title}
              </h4>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5" title={currentTrack.primaryArtist}>
              {currentTrack.primaryArtist}
            </p>
          </div>

          {/* Desktop Like Button */}
          <button
            onClick={() => {
              triggerHaptic('like');
              toggleLike(currentTrack);
            }}
            aria-label={isLiked ? "Unlike song" : "Like song"}
            className={`p-2 rounded-full transition-colors hidden sm:flex shrink-0 cursor-pointer ${
              isLiked ? 'text-rose-500 hover:text-rose-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Central Playback Controls (Zone 2) */}
        <div className="flex flex-col items-center justify-center gap-1 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-4">
            <button
              onClick={() => {
                triggerHaptic('button');
                toggleShuffle();
              }}
              aria-label="Shuffle"
              className={`p-2 rounded-full transition-colors hidden sm:block cursor-pointer ${
                shuffle ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                triggerHaptic('skipBack');
                prevTrack();
              }}
              aria-label="Previous track"
              className="p-2 rounded-full text-slate-300 hover:text-white active:scale-90 transition-all cursor-pointer"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>

            {/* Main Play/Pause Button with Glowing Ambient Ring */}
            <button
              onClick={() => {
                triggerHaptic('button');
                togglePlay();
              }}
              aria-label={isPlaying ? "Pause" : "Play"}
              disabled={isLoading}
              className="w-11 h-11 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-[0_0_16px_rgba(255,255,255,0.35)] hover:scale-108 active:scale-95 transition-all cursor-pointer"
            >
              {isLoading ? (
                <EqualizerLoader size="sm" color="#090a0f" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
              )}
            </button>

            <button
              onClick={() => {
                triggerHaptic('skipForward');
                nextTrack();
              }}
              aria-label="Next track"
              className="p-2 rounded-full text-slate-300 hover:text-white active:scale-90 transition-all cursor-pointer"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>

            <button
              onClick={() => {
                triggerHaptic('button');
                cycleRepeat();
              }}
              aria-label={`Repeat mode: ${repeat}`}
              className={`p-2 rounded-full transition-colors hidden sm:block cursor-pointer ${
                repeat !== 'off' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {repeat === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Time Counter */}
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono tabular-nums text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span className="text-slate-600">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Studio Tools & Volume (Zone 3) */}
        <div className="flex items-center gap-1 sm:gap-2 justify-end shrink-0">
          
          {/* Jam Room Trigger */}
          <button
            onClick={() => {
              triggerHaptic('button');
              setJamModalOpen(true);
            }}
            aria-label="Aura Jam"
            title="Car Group Play / Jam"
            className={`p-2 rounded-xl transition-colors relative cursor-pointer ${
              jamRoom ? 'text-indigo-300 bg-indigo-500/20 flex' : 'text-slate-400 hover:text-white hidden sm:flex'
            }`}
          >
            <Car className="w-4 h-4" />
            {jamRoom && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            )}
          </button>

          {/* More Like This (Gemini Recommendations) */}
          <button
            onClick={() => {
              triggerHaptic('button');
              setMoreLikeThisOpen(!moreLikeThisOpen);
            }}
            aria-label="More Like This"
            title="More Like This (Related Songs & Same Genre)"
            className={`p-2 rounded-xl transition-colors hidden md:flex cursor-pointer ${
              moreLikeThisOpen ? 'text-indigo-300 bg-white/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Studio EQ Console Trigger */}
          <button
            onClick={() => {
              triggerHaptic('button');
              setEqModalOpen(!eqModalOpen);
            }}
            aria-label="Studio Equalizer"
            title="Studio Equalizer (10-Band EQ)"
            className={`p-2 rounded-xl transition-colors hidden lg:flex cursor-pointer ${
              eqModalOpen ? 'text-white bg-white/15' : 'text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Visualizer Trigger */}
          <button
            onClick={() => {
              triggerHaptic('button');
              toggleVisualizer();
            }}
            aria-label="Cinematic Visualizer"
            title="Audio Visualizer"
            className={`p-2 rounded-xl transition-colors hidden lg:flex cursor-pointer ${
              visualizerActive ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Waves className="w-4 h-4" />
          </button>

          {/* Synced Lyrics Trigger */}
          <button
            onClick={() => {
              triggerHaptic('button');
              setLyricsOpen(!lyricsOpen);
            }}
            aria-label="Synced Lyrics"
            title="Synced Lyrics"
            className={`p-2 rounded-xl transition-colors hidden sm:flex cursor-pointer ${
              lyricsOpen ? 'text-indigo-300 bg-white/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic2 className="w-4 h-4" />
          </button>

          {/* Up Next Queue Trigger */}
          <button
            onClick={() => {
              triggerHaptic('button');
              setQueueOpen(!queueOpen);
            }}
            aria-label="Up Next Queue"
            title="Queue"
            className={`p-2 rounded-xl transition-colors hidden sm:flex cursor-pointer ${
              queueOpen ? 'text-indigo-300 bg-white/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Mobile Heart Like Button */}
          <button
            onClick={() => {
              triggerHaptic('like');
              toggleLike(currentTrack);
            }}
            aria-label={isLiked ? "Unlike song" : "Like song"}
            className={`p-2 rounded-full transition-colors flex sm:hidden shrink-0 cursor-pointer ${
              isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>

          {/* Volume Slider (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-white/10">
            <button
              onClick={() => {
                triggerHaptic('button');
                toggleMute();
              }}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
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
              className="w-20 h-1 bg-white/20 accent-indigo-400 rounded-lg cursor-pointer"
            />
          </div>

          {/* Fullscreen Expand Trigger */}
          <button
            onClick={() => {
              triggerHaptic('button');
              toggleExpandedPlayer();
            }}
            aria-label="Expand player"
            title="Expand Now Playing"
            className="p-2 rounded-xl text-slate-400 hover:text-white transition-colors hidden sm:block cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

      </div>
    </footer>
  );
};
