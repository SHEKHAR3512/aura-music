import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDown, Music2, Sparkles } from 'lucide-react';
import { Song, LyricsData, LyricLine } from '../../lib/music/types';
import { useAudioTime } from '../../hooks/useAudioTime';
import { audioEngine } from '../../lib/audio/AudioEngine';

interface SyncedLyricsViewProps {
  song: Song;
  onLineClick?: (time: number) => void;
  className?: string;
}

export const SyncedLyricsView: React.FC<SyncedLyricsViewProps> = ({ song, onLineClick, className = '' }) => {
  const { currentTime } = useAudioTime();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<any>(null);

  // Fetch lyrics from abstraction route
  const { data: lyricsData, isLoading, isError } = useQuery<LyricsData>({
    queryKey: ['lyrics', song.id, song.title, song.primaryArtist],
    queryFn: async () => {
      const url = new URL(`/api/music/lyrics/${song.id}`, window.location.origin);
      url.searchParams.set('title', song.title);
      url.searchParams.set('artist', song.primaryArtist);
      url.searchParams.set('album', song.album.title);
      url.searchParams.set('duration', String(song.duration));

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Lyrics fetch failed');
      return res.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  // Find active line index
  const activeIndex = React.useMemo(() => {
    if (!lyricsData || !lyricsData.lines || lyricsData.lines.length === 0) return -1;
    const lines = lyricsData.lines;
    // Find the latest line whose startTime <= currentTime
    for (let i = lines.length - 1; i >= 0; i--) {
      if (currentTime >= lines[i].startTime - 0.2) {
        return i;
      }
    }
    return -1;
  }, [lyricsData, currentTime]);


  // Center the active line smoothly if the user is not manually scrolling
  useEffect(() => {
    if (isUserScrolling || activeIndex === -1 || !activeLineRef.current || !containerRef.current) return;

    activeLineRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [activeIndex, isUserScrolling]);

  // Detect manual scroll
  const handleScroll = () => {
    setIsUserScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 4500); // Resume auto-scroll after 4.5 seconds of inactivity
  };

  const jumpToCurrent = () => {
    setIsUserScrolling(false);
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  const handleLineClick = (line: LyricLine) => {
    audioEngine.seek(line.startTime);
    if (onLineClick) onLineClick(line.startTime);
  };

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center min-h-[300px] ${className}`}>
        <div className="w-8 h-8 border-2 border-white/20 border-t-[var(--aura-primary,#6366f1)] rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-medium">Synchronizing lyrics stream...</p>
      </div>
    );
  }

  if (isError || !lyricsData || lyricsData.type === 'unavailable') {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center min-h-[300px] ${className}`}>
        <Music2 className="w-10 h-10 text-slate-600 mb-3" />
        <h4 className="text-base font-semibold text-slate-300">Lyrics unavailable</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Synchronized lyrics haven't been cataloged yet for this recording.
        </p>
      </div>
    );
  }

  if (lyricsData.type === 'instrumental') {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center min-h-[300px] ${className}`}>
        <Sparkles className="w-8 h-8 text-[var(--aura-primary,#6366f1)] mb-3 animate-pulse" />
        <h4 className="text-lg font-semibold text-white">Instrumental Recording</h4>
        <p className="text-xs text-slate-400 mt-1">Enjoy the acoustic mastery and instrumental arrangement.</p>
      </div>
    );
  }

  return (
    <div className={`relative h-full flex flex-col ${className}`}>
      {/* Floating "Jump to current" button when manually scrolled */}
      {isUserScrolling && activeIndex !== -1 && (
        <button
          onClick={jumpToCurrent}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/15 text-xs font-medium shadow-xl transition-all active:scale-95"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>Jump to current</span>
        </button>
      )}

      {/* Lyrics Scrollable Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-16 space-y-7 scroll-smooth text-center select-none no-scrollbar"
        style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)' }}
      >
        {lyricsData.lines.map((line, idx) => {
          const isActive = idx === activeIndex;
          const isPast = idx < activeIndex;

          return (
            <div
              key={`${idx}-${line.startTime}`}
              ref={isActive ? activeLineRef : undefined}
              onClick={() => handleLineClick(line)}
              className={`cursor-pointer transition-all duration-300 origin-center py-1 group ${
                isActive
                  ? 'text-white text-xl sm:text-2xl font-bold scale-105 opacity-100 drop-shadow-[0_0_20px_var(--aura-glow,rgba(255,255,255,0.4))]'
                  : isPast
                  ? 'text-slate-400/60 text-base sm:text-lg font-medium opacity-50 hover:opacity-80'
                  : 'text-slate-400/40 text-base sm:text-lg font-medium opacity-35 hover:opacity-70'
              }`}
            >
              <p className="group-hover:text-white transition-colors">{line.text || '♪'}</p>
            </div>
          );
        })}

        {lyricsData.provider && (
          <div className="pt-10 pb-4 text-[11px] text-slate-500 font-mono tracking-wider uppercase">
            Lyrics provided by {lyricsData.provider}
          </div>
        )}
      </div>
    </div>
  );
};
