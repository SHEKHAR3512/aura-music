import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Music2, Sparkles, ArrowDown } from 'lucide-react';
import { useJamStore } from '../store/useJamStore';
import { jamSyncEngine } from '../sync/JamSyncEngine';
import { LyricsData, LyricLine } from '../../../lib/music/types';

export const JamLyrics: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { room, seek } = useJamStore();
  const track = room?.playback.track;

  const [currentSyncedTime, setCurrentSyncedTime] = useState(0);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<any>(null);

  // High-frequency tick reading authoritative expected playback position
  useEffect(() => {
    const timer = setInterval(() => {
      const pos = jamSyncEngine.getExpectedPosition();
      setCurrentSyncedTime(pos);
    }, 60);

    return () => clearInterval(timer);
  }, []);

  // Independently query lyrics for the track
  const { data: lyricsData, isLoading, isError } = useQuery<LyricsData>({
    queryKey: ['lyrics', track?.id, track?.title, track?.primaryArtist],
    queryFn: async () => {
      if (!track) throw new Error('No track');
      const url = new URL(`/api/music/lyrics/${track.id}`, window.location.origin);
      url.searchParams.set('title', track.title);
      url.searchParams.set('artist', track.primaryArtist);
      url.searchParams.set('album', track.album.title);
      url.searchParams.set('duration', String(track.duration));

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Lyrics fetch failed');
      return res.json();
    },
    enabled: !!track?.id,
    staleTime: 1000 * 60 * 60,
  });

  // Calculate active line index based on currentSyncedTime
  const activeIndex = React.useMemo(() => {
    if (!lyricsData || !lyricsData.lines || lyricsData.lines.length === 0) return -1;
    const lines = lyricsData.lines;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (currentSyncedTime >= lines[i].startTime - 0.25) {
        return i;
      }
    }
    return -1;
  }, [lyricsData, currentSyncedTime]);

  // Smoothly center active line
  useEffect(() => {
    if (isUserScrolling || activeIndex === -1 || !activeLineRef.current || !containerRef.current) return;
    activeLineRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [activeIndex, isUserScrolling]);

  const handleScroll = () => {
    setIsUserScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 4000);
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
    seek(line.startTime);
  };

  if (!track) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[260px] text-slate-500">
        <Music2 className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-xs">Select a track to view synchronized lyrics.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[260px] text-slate-400 space-y-2">
        <div className="w-6 h-6 border-2 border-white/20 border-t-[var(--aura-primary,#6366f1)] rounded-full animate-spin" />
        <p className="text-xs">Loading synchronized lyrics stream...</p>
      </div>
    );
  }

  if (isError || !lyricsData || lyricsData.type === 'unavailable' || lyricsData.lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[260px] text-slate-500 space-y-2">
        <Music2 className="w-8 h-8 opacity-40 mx-auto" />
        <h5 className="text-xs font-semibold text-slate-400">Synchronized lyrics unavailable</h5>
        <p className="text-[11px] text-slate-600 max-w-xs">
          Lyrics haven't been cataloged yet for this recording.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative h-full flex flex-col ${className}`}>
      {/* Floating jump to current button */}
      {isUserScrolling && activeIndex !== -1 && (
        <button
          onClick={jumpToCurrent}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/15 text-[11px] font-medium shadow-xl transition-all cursor-pointer"
        >
          <ArrowDown className="w-3 h-3" />
          <span>Jump to active line</span>
        </button>
      )}

      {/* Lyrics lines */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-12 space-y-6 scroll-smooth text-center select-none no-scrollbar max-h-[360px]"
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
                  ? 'text-white text-lg sm:text-xl font-bold scale-105 opacity-100 drop-shadow-[0_0_20px_var(--aura-glow,rgba(255,255,255,0.4))]'
                  : isPast
                  ? 'text-slate-400/60 text-sm font-medium opacity-50 hover:opacity-80'
                  : 'text-slate-400/40 text-sm font-medium opacity-35 hover:opacity-70'
              }`}
            >
              <p className="group-hover:text-white transition-colors">{line.text || '♪'}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
