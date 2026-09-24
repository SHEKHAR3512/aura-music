import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Maximize, Minimize, Settings2 } from 'lucide-react';
import { VisualizerMode, SongPhase } from '../../lib/music/types';
import { VisualizerRenderer } from '../../lib/visualizer/VisualizerEngine';
import { usePlayerStore } from '../../stores/playerStore';

interface VisualizerCanvasProps {
  className?: string;
  showControls?: boolean;
}

const MODES: { id: VisualizerMode; label: string }[] = [
  { id: 'aurora', label: 'Aurora' },
  { id: 'nebula', label: 'Nebula' },
  { id: 'solar', label: 'Solar' },
  { id: 'liquid', label: 'Liquid' },
  { id: 'pulse', label: 'Pulse' },
  { id: 'waveform', label: 'Waveform' },
  { id: 'spectrum', label: 'Spectrum' },
  { id: 'minimal', label: 'Minimal' },
];

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({ className = '', showControls = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<VisualizerRenderer | null>(null);

  const { visualizerMode, setVisualizerMode, currentColors, isPlaying } = usePlayerStore();
  const [phase, setPhase] = useState<SongPhase>('INTRO');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new VisualizerRenderer(canvas, currentColors);
    renderer.setMode(visualizerMode);
    rendererRef.current = renderer;

    const handleResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      renderer.resize(rect.width, rect.height);
    };

    handleResize();
    renderer.start();

    // Track phase interval for auto-director badge
    const phaseInterval = setInterval(() => {
      if (rendererRef.current) {
        setPhase(rendererRef.current.currentPhase);
      }
    }, 500);

    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      clearInterval(phaseInterval);
      observer.disconnect();
      renderer.stop();
    };
  }, []);

  // Update renderer mode when store changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setMode(visualizerMode);
    }
  }, [visualizerMode]);

  // Update colors when album colors change
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setColors(currentColors);
    }
  }, [currentColors]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.warn(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
      setIsFullscreen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full h-full min-h-[300px] overflow-hidden rounded-2xl bg-black/60 backdrop-blur-md ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Auto-Director Phase & Controls Bar */}
      {showControls && (
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
          
          {/* Auto-Director Section Indicator */}
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-mono text-slate-300 pointer-events-auto shadow-md">
            <span className="w-2 h-2 rounded-full bg-[var(--aura-primary,#6366f1)] animate-ping" />
            <span className="text-slate-400">DIRECTOR:</span>
            <span className="text-white font-semibold">{phase}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen visualizer"
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10 text-white transition-colors pointer-events-auto"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Visualizer Mode Selector Strip */}
      {showControls && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 p-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full overflow-x-auto max-w-[95%] no-scrollbar shadow-2xl">
          {MODES.map((m) => {
            const isActive = visualizerMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setVisualizerMode(m.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-950 font-semibold shadow-md scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
