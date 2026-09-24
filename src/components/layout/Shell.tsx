import React, { useEffect } from 'react';
import { 
  Compass, 
  TrendingUp, 
  Mic, 
  Bookmark, 
  Search, 
  SlidersHorizontal, 
  User, 
  Radio, 
  Waves,
  WifiOff,
  Car
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../lib/storage/libraryStore';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useJamStore } from '../../lib/jam/jamStore';

interface ShellProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ currentTab, onTabChange, children }) => {
  const { session: jamSession } = useJamStore();
  const { isOnline, isForcedOffline, toggleForcedOffline } = useNetworkStatus();
  const {
    togglePlay,
    nextTrack,
    prevTrack,
    toggleMute,
    toggleLike,
    currentTrack,
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

  // Desktop Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        nextTrack();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        prevTrack();
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
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col selection:bg-[var(--aura-primary,#6366f1)]/30 selection:text-white">
      
      {/* Top Bar (Single-Row Three-Zone Top Bar Contract) */}
      <header className="sticky top-0 z-30 h-16 px-4 sm:px-8 border-b border-white/[0.08] bg-[#08090d]/85 backdrop-blur-xl flex items-center justify-between">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onTabChange('explore');
            }}
            className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--aura-primary,#6366f1)] shadow-[0_0_12px_var(--aura-primary,#6366f1)]" />
            <span className="font-sans">AURA</span>
          </a>
        </div>

        {/* Zone 2: Navigation Links (Clean text links with active indicator) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`transition-colors py-1 relative ${
                  isActive ? 'text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[var(--aura-primary,#6366f1)] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions (Search Trigger, Studio EQ, Profile) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Car Group Play Trigger */}
          <button
            onClick={() => setJamModalOpen(true)}
            aria-label="Car Group Play"
            title="Car Group Play / Multi-Device Jam"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              jamSession 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300'
            }`}
          >
            <Car className={`w-3.5 h-3.5 ${jamSession ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">
              {jamSession ? `Car Jam (${jamSession.members.length})` : 'Group Play'}
            </span>
          </button>

          {/* Quick Search Trigger */}
          <button
            onClick={() => setSearchModalOpen(true)}
            aria-label="Search music (press slash key)"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white/10 rounded text-slate-400">
              /
            </kbd>
          </button>

          {/* Equalizer Console Button */}
          <button
            onClick={() => setEqModalOpen(!eqModalOpen)}
            aria-label="Studio Equalizer"
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Profile / Account Button */}
          <button
            onClick={() => setAuthModalOpen(true)}
            aria-label="Member Profile"
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
          >
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-xs font-medium text-slate-200 hidden sm:inline truncate max-w-[100px]">
              {profile.name.split(' ')[0]}
            </span>
          </button>
        </div>

      </header>

      {/* Offline Status Banner */}
      {!isOnline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs font-mono text-amber-300 flex items-center justify-center gap-2 animate-fadeIn flex-wrap">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            {isForcedOffline 
              ? 'Offline Simulation Active · Forced offline mode to test cached metadata' 
              : 'Offline Browsing Active · Browsing cached metadata from LocalStorage and Service Worker'}
          </span>
          {isForcedOffline && (
            <button
              onClick={toggleForcedOffline}
              className="ml-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-sans font-bold border border-amber-500/40 transition-colors cursor-pointer"
            >
              Resume Online
            </button>
          )}
        </div>
      )}

      {/* Main Content Area — extra bottom padding on mobile to clear nav + MiniPlayer */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 pb-44 md:pb-6">
        {children}
      </main>

      {/* Mobile Fixed Bottom Navigation Tab Bar — sits ABOVE the MiniPlayer */}
      <div className="md:hidden fixed bottom-[84px] left-0 right-0 z-30 bg-[#0d0f17]/95 backdrop-blur-xl border-t border-white/[0.08] px-4 py-2 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[44px] transition-colors ${
                isActive ? 'text-[var(--aura-primary,#6366f1)] font-semibold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>

    </div>
  );
};
