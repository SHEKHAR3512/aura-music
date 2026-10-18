import React, { useEffect } from 'react';
import { 
  Compass, 
  TrendingUp, 
  Mic, 
  Bookmark, 
  Search, 
  SlidersHorizontal, 
  Radio, 
  Waves,
  WifiOff,
  Disc3
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../lib/storage/libraryStore';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useJamStore } from '../../features/jam/store/useJamStore';
import { audioEngine } from '../../lib/audio/AudioEngine';
import { MiniEqualizerBars } from '../ui/AudioLoaders';
import { triggerHaptic } from '../../lib/utils/haptics';

interface ShellProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ currentTab, onTabChange, children }) => {
  const { room } = useJamStore();
  const { isOnline, isForcedOffline, toggleForcedOffline } = useNetworkStatus();
  const {
    togglePlay,
    nextTrack,
    prevTrack,
    toggleMute,
    adjustVolume,
    seek,
    toggleLike,
    currentTrack,
    isPlaying,
    setQueueOpen,
    queueOpen,
    setSearchModalOpen,
    searchModalOpen,
    setEqModalOpen,
    eqModalOpen,
    setAuthModalOpen,
    setJamModalOpen,
    isExpandedPlayer,
    toggleExpandedPlayer,
  } = usePlayerStore();

  const { profile } = useLibraryStore();

  // Desktop Native Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === ' ' || e.code === 'Space' || e.key === 'MediaPlayPause') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'MediaTrackNext' || (e.metaKey && e.key === 'ArrowRight') || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        nextTrack();
      } else if (e.key === 'MediaTrackPrevious' || (e.metaKey && e.key === 'ArrowLeft') || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        prevTrack();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        adjustVolume(e.shiftKey ? 0.1 : 0.05);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        adjustVolume(e.shiftKey ? -0.1 : -0.05);
      } else if (e.key === 'ArrowLeft' && !e.metaKey) {
        e.preventDefault();
        seek(Math.max(0, audioEngine.getCurrentTime() - (e.shiftKey ? 10 : 5)));
      } else if (e.key === 'ArrowRight' && !e.metaKey) {
        e.preventDefault();
        seek(audioEngine.getCurrentTime() + (e.shiftKey ? 10 : 5));
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        if (currentTrack) toggleLike(currentTrack);
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        setQueueOpen(!queueOpen);
      } else if (e.key === '/') {
        e.preventDefault();
        setSearchModalOpen(true);
      } else if (e.key === 'Escape') {
        if (isExpandedPlayer) toggleExpandedPlayer();
        setSearchModalOpen(false);
        setEqModalOpen(false);
        setQueueOpen(false);
        setAuthModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    nextTrack,
    prevTrack,
    toggleMute,
    adjustVolume,
    seek,
    toggleLike,
    currentTrack,
    queueOpen,
    setQueueOpen,
    setSearchModalOpen,
    isExpandedPlayer,
    toggleExpandedPlayer,
    setEqModalOpen,
    setAuthModalOpen,
  ]);

  const navItems = [
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'charts', label: 'Charts', icon: TrendingUp },
    { id: 'podcasts', label: 'Podcasts', icon: Mic },
    { id: 'library', label: 'Library', icon: Bookmark },
  ];

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-white">
      
      {/* Top Bar (Single-Row Three-Zone Top Bar) */}
      <header className="sticky top-0 z-30 h-16 px-4 sm:px-8 border-b border-white/[0.07] bg-[#07080c]/85 backdrop-blur-xl flex items-center justify-between">
        
        {/* Zone 1: Wordmark with living acoustic indicator */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              triggerHaptic('button');
              onTabChange('explore');
            }}
            className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5 hover:opacity-90 transition-opacity font-display"
          >
            <div className="relative flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-[0_0_12px_#6366f1]" />
              {isPlaying && (
                <span className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-75" />
              )}
            </div>
            <span>AURA</span>
            <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-400 uppercase bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-full hidden sm:inline">
              STUDIO
            </span>
          </a>
        </div>

        {/* Zone 2: Navigation Links (Clean pill bar with active indicator) */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-white/[0.04] border border-white/[0.06] backdrop-blur-md">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  triggerHaptic('tab');
                  onTabChange(item.id);
                }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions (Jam Room, Quick Search, Studio EQ, Profile) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Aura Jam Listening Room Trigger */}
          <button
            onClick={() => {
              triggerHaptic('button');
              setJamModalOpen(true);
            }}
            aria-label="Aura Jam Listening Room"
            title="Realtime Collaborative Listening Room"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              room 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm' 
                : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${room ? 'text-indigo-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">
              {room ? `Jam (${Object.keys(room.participants || {}).length})` : 'Aura Jam'}
            </span>
          </button>

          {/* Quick Search Command Trigger */}
          <button
            onClick={() => {
              triggerHaptic('button');
              setSearchModalOpen(true);
            }}
            aria-label="Search music (press slash key)"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white/10 rounded text-slate-400">
              /
            </kbd>
          </button>

          {/* Equalizer Console Trigger */}
          <button
            onClick={() => {
              triggerHaptic('button');
              setEqModalOpen(!eqModalOpen)}
            }
            aria-label="Studio Equalizer"
            title="Open Studio Acoustic Console"
            className={`p-2 rounded-full transition-all cursor-pointer ${
              eqModalOpen 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Member Profile Avatar */}
          <button
            onClick={() => {
              triggerHaptic('button');
              setAuthModalOpen(true);
            }}
            aria-label="Member Profile"
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
          >
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-6 h-6 rounded-full object-cover border border-indigo-400/30"
            />
            <span className="text-xs font-medium text-slate-200 hidden sm:inline truncate max-w-[90px]">
              {profile.name.split(' ')[0]}
            </span>
          </button>
        </div>

      </header>

      {/* Offline Status Telemetry Banner */}
      {!isOnline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs font-mono text-amber-300 flex items-center justify-center gap-2 animate-dwi-enter flex-wrap">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            {isForcedOffline 
              ? 'Offline Simulation Active · Testing offline local cache' 
              : 'Offline Mode Active · Streaming cached metadata and tracks'}
          </span>
          {isForcedOffline && (
            <button
              onClick={toggleForcedOffline}
              className="ml-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-sans font-bold border border-amber-500/40 transition-colors cursor-pointer"
            >
              Resume Live
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 ${
        currentTrack ? 'pb-44 md:pb-28' : 'pb-24 md:pb-12'
      }`}>
        {children}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (44px Minimum Touch Targets) */}
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-[#0a0c14]/95 backdrop-blur-2xl border-t border-white/[0.08] px-4 flex items-center justify-around shadow-2xl pb-safe"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                triggerHaptic('tab');
                onTabChange(item.id);
              }}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-all cursor-pointer ${
                isActive ? 'text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5 shadow-[0_0_6px_#818cf8]" />
              )}
            </button>
          );
        })}
      </nav>

    </div>
  );
};
