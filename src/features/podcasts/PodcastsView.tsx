import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, Mic, RotateCcw, RotateCw, Clock, Sparkles } from 'lucide-react';
import { PodcastEpisode } from '../../lib/music/types';
import { usePlayerStore } from '../../stores/playerStore';

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
    <div className="space-y-8 pb-24 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-black border border-white/10 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400 mb-2">
            <Mic className="w-3.5 h-3.5" />
            <span>Spoken Word & Audio Documentaries</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Sonic Chronicles & Talks
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl">
            In-depth discussions on acoustic engineering, modern vinyl culture, synthesizers, and music philosophy.
          </p>
        </div>
      </div>

      {/* Episode Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Featured Episodes</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {podcasts.map((ep) => {
            const isCurrent = currentTrack?.id === ep.id;

            return (
              <div
                key={ep.id}
                onClick={() => handlePlayEpisode(ep)}
                className={`group p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5'
                }`}
              >
                <div>
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-3 shadow-md">
                    <img
                      src={ep.artwork.medium || ep.artwork.low}
                      alt={ep.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 fill-current translate-x-0.5" />
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 block mb-1">
                    {ep.podcastTitle}
                  </span>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                    {ep.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {ep.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/5 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{Math.round(ep.duration / 60)} min</span>
                  </span>
                  <span>{ep.releaseDate}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
