import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, Mic, RotateCcw, RotateCw, Clock, Sparkles, Radio } from 'lucide-react';
import { PodcastEpisode } from '../../lib/music/types';
import { usePlayerStore } from '../../stores/playerStore';
import { EqualizerLoader, MiniEqualizerBars } from '../../components/ui/AudioLoaders';
import { triggerHaptic } from '../../lib/utils/haptics';

export const PodcastsView: React.FC = () => {
  const { playTrack, currentTrack, isPlaying } = usePlayerStore();

  const { data: podcasts = [], isLoading } = useQuery<PodcastEpisode[]>({
    queryKey: ['podcasts'],
    queryFn: async () => {
      const res = await fetch('/api/music/podcasts');
      if (!res.ok) throw new Error('Failed to load podcasts');
      return res.json();
    },
    staleTime: 1000 * 60 * 30,
  });

  const handlePlayEpisode = (ep: PodcastEpisode) => {
    triggerHaptic('button');
    // Wrap episode in Song structure for global audio engine
    playTrack({
      id: ep.id,
      title: ep.title,
      artists: [{ id: ep.podcastId, name: ep.podcastTitle }],
      primaryArtist: ep.podcastTitle,
      album: { id: ep.podcastId, title: ep.podcastTitle },
      artwork: ep.artwork,
      duration: ep.duration,
      audioUrl: ep.audioUrl,
      language: 'English',
      explicit: false,
      hasLyrics: false,
      source: 'jiosaavn',
      sourceId: ep.id,
    });
  };

  return (
    <div className="space-y-10 pb-24 animate-dwi-enter">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-r from-emerald-950/40 via-[#0d121c] to-[#07080c] p-6 sm:p-10 shadow-2xl">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
            <Mic className="w-3.5 h-3.5" />
            <span>Spoken Word & Audio Documentaries</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display">
            Sonic Chronicles & Talks
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            In-depth discussions on acoustic engineering, modern vinyl culture, modular synthesizers, and audio philosophy.
          </p>
        </div>
      </div>

      {/* Episode Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
            Featured Broadcasts
          </h2>
          <span className="text-xs text-slate-400 font-mono">High-Definition Voice</span>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <EqualizerLoader size="md" color="#10b981" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {podcasts.map((ep) => {
              const isCurrent = currentTrack?.id === ep.id;
              const isCurrentPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={ep.id}
                  onClick={() => handlePlayEpisode(ep)}
                  className={`group p-4 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-emerald-950/30 border-emerald-500/40 shadow-[0_4px_24px_-4px_rgba(16,185,129,0.25)]'
                      : 'bg-[#0c0f18]/80 hover:bg-[#131826] border-white/[0.06] hover:border-white/15'
                  }`}
                >
                  <div>
                    <div className="relative aspect-video rounded-2xl overflow-hidden mb-3.5 shadow-md border border-white/10">
                      <img
                        src={ep.artwork.medium || ep.artwork.low}
                        alt={ep.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform">
                          <Play className="w-5 h-5 fill-current translate-x-0.5" />
                        </div>
                      </div>
                      {isCurrent && (
                        <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-emerald-500/80 backdrop-blur-md text-slate-950 text-[10px] font-mono font-bold flex items-center gap-1.5 shadow">
                          {isCurrentPlaying && <MiniEqualizerBars color="#052e16" />}
                          <span>{isCurrentPlaying ? 'PLAYING' : 'PAUSED'}</span>
                        </div>
                      )}
                    </div>

                    <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 block mb-1">
                      {ep.podcastTitle}
                    </span>
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                      {ep.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {ep.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/5 text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{Math.round(ep.duration / 60)} min</span>
                    </span>
                    <span>{ep.releaseDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
