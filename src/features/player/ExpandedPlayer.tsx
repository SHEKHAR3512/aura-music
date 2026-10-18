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
  Car,
  Disc3
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useJamStore } from '../jam/store/useJamStore';
import { useAudioTime, formatTime } from '../../hooks/useAudioTime';
import { SyncedLyricsView } from '../lyrics/SyncedLyricsView';
import { VisualizerCanvas } from '../visualizer/VisualizerCanvas';
import { QueueDrawer } from '../queue/QueueDrawer';
import { EqualizerLoader } from '../../components/ui/AudioLoaders';
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

  const { room: jamRoom } = useJamStore();

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
      className="fixed inset-0 z-50 flex flex-col bg-[#07080c] text-slate-100 overflow-hidden select-none animate-dwi-enter"
    >
      {/* Dynamic Atmospheric Blurred Backdrop */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-35 blur-3xl scale-125 transition-all duration-1000"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 35%, var(--aura-primary, #6366f1) 0%, var(--aura-secondary, #8b5cf6) 40%, rgba(7,8,12,0.95) 85%)`,
        }}
      />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b border-white/10 gap-3">
        <button
          onClick={() => {
            triggerHaptic('button');
            toggleExpandedPlayer();
          }}
          aria-label="Collapse player"
          className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
        >
          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Center Mode Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
          <button
            onClick={() => {
              triggerHaptic('tab');
              setActiveTab('artwork');
            }}
            className={`px-3.5 sm:px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'artwork' ? 'bg-white text-slate-950 shadow-md font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Artwork
          </button>
          <button
            onClick={() => {
              triggerHaptic('tab');
              setActiveTab('lyrics');
            }}
            className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'lyrics' ? 'bg-white text-slate-950 shadow-md font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            <span>Lyrics</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic('tab');
              setActiveTab('visualizer');
            }}
            className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'visualizer' ? 'bg-white text-slate-950 shadow-md font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Visualizer</span>
          </button>
        </div>

        {/* Secondary Studio Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              triggerHaptic('button');
              setMoreLikeThisOpen(true);
            }}
            aria-label="More Like This"
            title="More Like This"
            className="flex items-center gap-1.5 p-2 sm:px-3.5 sm:py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Discovery</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('button');
              setJamModalOpen(true);
            }}
            aria-label="Car Group Play"
            title="Car Group Play / Jam"
            className={`flex items-center gap-1.5 p-2 sm:px-3.5 sm:py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              jamRoom ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{jamRoom ? 'Jam Active' : 'Group Play'}</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('button');
              setEqModalOpen(true);
            }}
            aria-label="Open Equalizer Console"
            title="Studio Equalizer"
            className="p-2 sm:p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Main Center Stage */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-4xl mx-auto w-full overflow-y-auto no-scrollbar">
        
        {/* TAB 1: Cinematic Artwork with Real Vinyl Record Presentation */}
        {activeTab === 'artwork' && (
          <div className="flex flex-col items-center text-center max-w-lg w-full animate-dwi-enter my-auto">
            {/* Vinyl Record & Sleeve Stage */}
            <div className="relative w-64 h-64 sm:w-84 sm:h-84 mb-6 sm:mb-8 flex items-center justify-center">
              {/* Spinning Vinyl Record behind artwork */}
              <div 
                className={`absolute w-60 h-60 sm:w-80 sm:h-80 rounded-full bg-[#0a0a0f] border-2 border-slate-700/80 shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-700 ${
                  isPlaying 
                    ? 'translate-x-12 sm:translate-x-16 animate-vinyl-spin' 
                    : 'translate-x-6 rotate-12'
                }`}
              >
                <div className="absolute inset-0 vinyl-grooves opacity-75" />
                <div className="relative w-1/3 h-1/3 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-500 flex items-center justify-center border border-white/20">
                  <div className="w-4 h-4 rounded-full bg-[#07080c] border border-white/40" />
                </div>
              </div>

              {/* Sleeve Art (Front) */}
              <div 
                className="relative z-10 w-60 h-60 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-black"
                style={{
                  boxShadow: '0 25px 60px -12px rgba(99,102,241,0.3)',
                }}
              >
                <SafeImage
                  src={currentTrack.artwork.high || currentTrack.artwork.medium}
                  alt={currentTrack.title}
                  type="track"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-50" />
              </div>
            </div>

            <div className="w-full flex items-center justify-between mb-2">
              <div className="text-left min-w-0 flex-1">
                <h2 className="text-2xl sm:text-4xl font-black text-white truncate tracking-tight font-display">
                  {currentTrack.title}
                </h2>
                <p className="text-base sm:text-lg text-slate-300 truncate mt-1 font-medium">
                  {currentTrack.primaryArtist} · {currentTrack.album.title}
                </p>
              </div>

              <button
                onClick={() => {
                  triggerHaptic('like');
                  toggleLike(currentTrack);
                }}
                aria-label={isLiked ? "Unlike song" : "Like song"}
                className={`p-3 rounded-full transition-all ml-4 shrink-0 cursor-pointer ${
                  isLiked ? 'text-rose-500 bg-rose-500/15' : 'text-slate-400 hover:text-white bg-white/5'
                }`}
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Quality & Meta Tags */}
            <div className="w-full flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
              <span className="text-indigo-400 font-bold">320 KBPS MASTER</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="text-cyan-400 font-bold">24-BIT / 96KHZ FLAC</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span>{currentTrack.language || 'Original Master'}</span>
            </div>
          </div>
        )}

        {/* TAB 2: Synced Lyrics View */}
        {activeTab === 'lyrics' && (
          <div className="w-full h-full max-h-[550px] animate-dwi-enter">
            <SyncedLyricsView song={currentTrack} />
          </div>
        )}

        {/* TAB 3: Canvas Visualizer View */}
        {activeTab === 'visualizer' && (
          <div className="w-full h-full max-h-[550px] animate-dwi-enter">
            <VisualizerCanvas showControls={true} />
          </div>
        )}

      </div>

      {/* Bottom Playback Controls Tray */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-6 pb-8 pt-2">
        
        {/* Scrub Bar with Radiant Glow */}
        <div className="w-full mb-3">
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={progress}
            onChange={handleSeekChange}
            aria-label="Playback seek scrub"
            className="w-full h-2 bg-white/20 accent-indigo-400 rounded-lg cursor-pointer"
          />
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-1.5 tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center justify-between mt-2">
          
          <button
            onClick={() => {
              triggerHaptic('button');
              toggleShuffle();
            }}
            aria-label="Shuffle playback"
            className={`p-3 rounded-full transition-colors cursor-pointer ${
              shuffle ? 'text-indigo-400 bg-white/10 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              triggerHaptic('skipBack');
              prevTrack();
            }}
            aria-label="Previous track"
            className="p-3.5 rounded-full text-slate-200 hover:text-white active:scale-90 transition-all cursor-pointer"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          {/* Big White Center Play Button with Radiant Aura */}
          <button
            onClick={() => {
              triggerHaptic('button');
              togglePlay();
            }}
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={isLoading}
            className="w-18 h-18 rounded-full bg-white text-slate-950 flex items-center justify-center hover:scale-106 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.4)] cursor-pointer"
          >
            {isLoading ? (
              <EqualizerLoader size="md" color="#090a0f" />
            ) : isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            onClick={() => {
              triggerHaptic('skipForward');
              nextTrack();
            }}
            aria-label="Next track"
            className="p-3.5 rounded-full text-slate-200 hover:text-white active:scale-90 transition-all cursor-pointer"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={() => {
              triggerHaptic('button');
              cycleRepeat();
            }}
            aria-label={`Repeat mode: ${repeat}`}
            className={`p-3 rounded-full transition-colors cursor-pointer ${
              repeat !== 'off' ? 'text-indigo-400 bg-white/10 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            {repeat === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>

        </div>

        {/* Secondary controls footer (Speed) */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/5 text-xs text-slate-400">
          <div className="relative">
            <button
              onClick={() => {
                triggerHaptic('button');
                setShowSpeedMenu(!showSpeedMenu);
              }}
              className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
            >
              <Gauge className="w-3.5 h-3.5 text-indigo-400" />
              <span>{playbackRate}x Playback Speed</span>
            </button>

            {showSpeedMenu && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#0e111a] border border-white/10 rounded-2xl p-1.5 shadow-2xl flex gap-1 z-20">
                {SPEED_OPTIONS.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      triggerHaptic('selection');
                      setPlaybackRate(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-mono cursor-pointer ${
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
