import React, { useEffect, useRef, useState } from 'react';
import { VisualizerRenderer } from '../../../lib/visualizer/VisualizerEngine';
import { useJamStore } from '../store/useJamStore';
import { JAM_MODE_CONFIGS } from '../recommendations/JamModeConfig';
import { usePlayerStore } from '../../../stores/playerStore';

export const JamVisualizer: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<VisualizerRenderer | null>(null);

  const { room } = useJamStore();
  const { currentColors } = usePlayerStore();

  const mode = room?.metadata.mode || 'chill';
  const modeConfig = JAM_MODE_CONFIGS[mode] || JAM_MODE_CONFIGS.chill;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new VisualizerRenderer(canvas, currentColors);
    renderer.setMode(modeConfig.visualizerMode);
    rendererRef.current = renderer;

    const handleResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      renderer.resize(rect.width, rect.height);
    };

    handleResize();
    renderer.start();

    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      renderer.stop();
    };
  }, []);

  // Update mode when room mode changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setMode(modeConfig.visualizerMode);
    }
  }, [modeConfig.visualizerMode]);

  // Update colors when album artwork changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setColors(currentColors);
    }
  }, [currentColors]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[260px] rounded-2xl overflow-hidden bg-black/40 backdrop-blur-md border border-white/5 ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Synchronized Mode Watermark */}
      <div className="absolute bottom-3 right-4 pointer-events-none z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-[10px] font-mono text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--aura-primary,#6366f1)] animate-ping" />
        <span>SYNCED VISUALS • {modeConfig.name.toUpperCase()}</span>
      </div>
    </div>
  );
};
