import React, { useState } from 'react';
import { 
  ChevronDown, 
  Heart, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  SlidersHorizontal, 
  Radio, 
  Mic2, 
  Waves, 
  ListMusic, 
  Gauge,
  Sparkles,
  Car
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useJamStore } from '../../lib/jam/jamStore';
import { useAudioTime, formatTime } from '../../hooks/useAudioTime';
import { SyncedLyricsView } from '../lyrics/SyncedLyricsView';
import { VisualizerCanvas } from '../visualizer/VisualizerCanvas';
import { QueueDrawer } from '../queue/QueueDrawer';
import { triggerHaptic } from '../../lib/utils/haptics';
import { SafeImage } from '../../components/ui/SafeImage';

export const ExpandedPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    isExpandedPlayer,
    toggleExpandedPlayer,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    shuffle,
    toggleShuffle,
    repeat,
    cycleRepeat,
    likedSongIds,
    toggleLike,
    setEqModalOpen,
    setMoreLikeThisOpen,
    setJamModalOpen,
    playbackRate,
    setPlaybackRate,
  } = usePlayerStore();

  const { session: jamSession } = useJamStore();

  const { currentTime, duration, progress } = useAudioTime();
  const [activeTab, setActiveTab] = useState<'artwork' | 'lyrics' | 'visualizer'>('artwork');
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  if (!isExpandedPlayer || !currentTrack) return null;

  const isLiked = likedSongIds.includes(currentTrack.id);
  const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0];

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    triggerHaptic('seek');
    seek(newProgress * duration);
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Expanded Now Playing Experience"
      className="fixed inset-0 z-50 flex flex-col bg-[#08090d] text-slate-100 overflow-hidden select-none animate-fadeIn"
    >
      {/* Dynamic Atmospheric Blurred Backdrop */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 blur-3xl scale-125 transition-all duration-1000"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 35%, var(--aura-primary, #6366f1) 0%, var(--aura-secondary, #8b5cf6) 40%, rgba(8,9,13,0.95) 85%)`,
        }}
      />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10">
        <button
          onClick={toggleExpandedPlayer}
          aria-label="Collapse player"
          className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        {/* Center Mode Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
          <button
            onClick={() => setActiveTab('artwork')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'artwork' ? 'bg-white text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            Artwork
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'lyrics' ? 'bg-white text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            <span>Lyrics</span>
          </button>
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'visualizer' ? 'bg-white text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Visualizer</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* More Like This */}
          <button
            onClick={() => setMoreLikeThisOpen(true)}
            aria-label="More Like This"
            title="More Like This (Related & Same Genre)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--aura-primary,#6366f1)]" />
            <span className="hidden sm:inline">More Like This</span>
          </button>

          {/* Car Group Play */}
          <button
            onClick={() => setJamModalOpen(true)}
            aria-label="Car Group Play"
            title="Car Group Play (Jam Session)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              jamSession ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{jamSession ? 'Car Jam' : 'Group Play'}</span>
          </button>

          {/* Studio EQ Console */}
          <button
            onClick={() => setEqModalOpen(true)}
            aria-label="Open Equalizer Console"
            title="Studio Equalizer"
            className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Center Stage */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full overflow-hidden">
        
        {/* TAB 1: Cinematic Artwork View */}
        {activeTab === 'artwork' && (
          <div className="flex flex-col items-center text-center max-w-md w-full animate-fadeIn">
            <div 
              className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden shadow-2xl mb-8 border border-white/15 group"
              style={{
                boxShadow: '0 25px 50px -12px var(--aura-glow, rgba(0,0,0,0.7))',
              }}
            >
              <SafeImage
                src={currentTrack.artwork.high || currentTrack.artwork.medium}
                alt={currentTrack.title}
                type="track"
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-105' : 'scale-100'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
            </div>

            <div className="w-full flex items-center justify-between mb-2">
              <div className="text-left min-w-0 flex-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white truncate tracking-tight">
                  {currentTrack.title}
                </h2>
                <p className="text-base text-slate-300 truncate mt-1">
                  {currentTrack.primaryArtist} · {currentTrack.album.title}
                </p>
              </div>

              <button
                onClick={() => toggleLike(currentTrack)}
                aria-label={isLiked ? "Unlike song" : "Like song"}
                className={`p-3 rounded-full transition-colors ml-4 shrink-0 ${
                  isLiked ? 'text-rose-500 bg-rose-500/10' : 'text-slate-400 hover:text-white bg-white/5'
                }`}
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Quality & Meta Tags (Clean unboxed typography) */}
            <div className="w-full flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
              <span>320 KBPS AAC</span>
              <span aria-hidden="true">·</span>
              <span>{currentTrack.language}</span>
              {currentTrack.year && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{currentTrack.year}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Synced Lyrics View */}
        {activeTab === 'lyrics' && (
          <div className="w-full h-full max-h-[550px] animate-fadeIn">
            <SyncedLyricsView song={currentTrack} />
          </div>
        )}

        {/* TAB 3: Canvas Visualizer View */}
        {activeTab === 'visualizer' && (
          <div className="w-full h-full max-h-[550px] animate-fadeIn">
            <VisualizerCanvas showControls={true} />
          </div>
        )}

      </div>

      {/* Bottom Playback Controls Tray */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-6 pb-8 pt-2">
        
        {/* Scrub Bar */}
        <div className="w-full mb-3">
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={progress}
            onChange={handleSeekChange}
            aria-label="Playback seek scrub"
            className="w-full h-1.5 bg-white/20 accent-[var(--aura-primary,#6366f1)] rounded-lg cursor-pointer"
          />
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center justify-between mt-2">
          
          <button
            onClick={toggleShuffle}
            aria-label="Shuffle playback"
            className={`p-2.5 rounded-full transition-colors ${
              shuffle ? 'text-[var(--aura-primary,#6366f1)] bg-white/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={prevTrack}
            aria-label="Previous track"
            className="p-3 rounded-full text-slate-200 hover:text-white transition-colors"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={isLoading}
            className="w-16 h-16 rounded-full bg-white text-slate-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-2xl cursor-pointer"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            aria-label="Next track"
            className="p-3 rounded-full text-slate-200 hover:text-white transition-colors"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={cycleRepeat}
            aria-label={`Repeat mode: ${repeat}`}
            className={`p-2.5 rounded-full transition-colors ${
              repeat !== 'off' ? 'text-[var(--aura-primary,#6366f1)] bg-white/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            {repeat === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>

        </div>

        {/* Secondary controls footer (Speed, Radio) */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/5 text-xs text-slate-400">
          
          {/* Speed Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>{playbackRate}x Speed</span>
            </button>

            {showSpeedMenu && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#12141f] border border-white/10 rounded-xl p-1 shadow-xl flex gap-1 z-20">
                {SPEED_OPTIONS.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setPlaybackRate(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={`px-2 py-1 rounded text-xs font-mono ${
                      playbackRate === rate ? 'bg-white text-slate-900 font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
