import React from 'react';
import { 
  Compass, 
  Flame, 
  Heart, 
  Zap, 
  Moon, 
  Music, 
  Feather, 
  Disc, 
  Sun, 
  Globe, 
  SlidersHorizontal,
  X
} from 'lucide-react';
import { triggerHaptic } from '../../lib/utils/haptics';

export interface GenreTag {
  id: string;
  label: string;
  searchQuery: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  description: string;
}

export const GENRE_TAGS: GenreTag[] = [
  {
    id: 'all',
    label: 'All Genres',
    searchQuery: '',
    icon: Compass,
    accentColor: '#6366f1',
    description: 'Curated mix of current top releases, chart-toppers, and trending soundscapes',
  },
  {
    id: 'bollywood',
    label: 'Bollywood & Filmi',
    searchQuery: 'Bollywood hits',
    icon: Flame,
    accentColor: '#f43f5e',
    description: 'Cinematic master anthems, grand orchestra arrangements, and blockbuster film hits',
  },
  {
    id: 'romantic',
    label: 'Romantic & Love',
    searchQuery: 'Romantic Hindi love',
    icon: Heart,
    accentColor: '#ec4899',
    description: 'Heartfelt acoustic melodies, emotional vocals, and timeless love ballads',
  },
  {
    id: 'punjabi',
    label: 'Punjabi Pop & Hip-Hop',
    searchQuery: 'Punjabi pop hip hop',
    icon: Zap,
    accentColor: '#eab308',
    description: 'High-voltage basslines, viral Punjabi rhythm hooks, and bhangra energy',
  },
  {
    id: 'lofi',
    label: 'Lo-Fi & Midnight Chill',
    searchQuery: 'Lofi chill beats Hindi',
    icon: Moon,
    accentColor: '#8b5cf6',
    description: 'Late-night ambient soundscapes, tape warmth, and soothing relaxed beats',
  },
  {
    id: 'indie',
    label: 'Indie & Acoustic',
    searchQuery: 'Indie pop acoustic Hindi',
    icon: Music,
    accentColor: '#10b981',
    description: 'Independent singer-songwriters, organic guitar melodies, and authentic stories',
  },
  {
    id: 'sufi',
    label: 'Sufi & Soulful',
    searchQuery: 'Sufi songs qawwali',
    icon: Feather,
    accentColor: '#14b8a6',
    description: 'Ecstatic qawwalis, transcendent spiritual lyrics, and acoustic harmoniums',
  },
  {
    id: 'edm',
    label: 'EDM & Dance Club',
    searchQuery: 'EDM party dance hits',
    icon: Disc,
    accentColor: '#06b6d4',
    description: 'Punchy synths, heavy drops, and unstoppable electronic dance club energy',
  },
  {
    id: 'devotional',
    label: 'Devotional & Peaceful',
    searchQuery: 'Devotional bhajan peaceful',
    icon: Sun,
    accentColor: '#f97316',
    description: 'Peaceful morning bhajans, sacred chants, and meditative acoustic harmony',
  },
  {
    id: 'global',
    label: 'English & Global Hits',
    searchQuery: 'Billboard top global hits',
    icon: Globe,
    accentColor: '#3b82f6',
    description: 'Global chart-toppers, international pop, synthwave, and Billboard viral tracks',
  },
];

interface GenreTagFilterProps {
  selectedGenre: string;
  onSelectGenre: (genreId: string) => void;
}

export const GenreTagFilter: React.FC<GenreTagFilterProps> = ({
  selectedGenre,
  onSelectGenre,
}) => {
  const handleSelect = (genreId: string) => {
    triggerHaptic('selection');
    // Clicking active genre again toggles back to 'all'
    if (selectedGenre === genreId && genreId !== 'all') {
      onSelectGenre('all');
    } else {
      onSelectGenre(genreId);
    }
  };

  return (
    <div className="w-full space-y-2.5">
      {/* Label and Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
            Filter by Genre
          </span>
        </div>

        {selectedGenre !== 'all' && (
          <button
            type="button"
            onClick={() => handleSelect('all')}
            className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
            <span>Reset filter</span>
          </button>
        )}
      </div>

      {/* Horizontal Genre Tag Carousel */}
      <div 
        className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar touch-pan-x"
        role="tablist"
        aria-label="Genre Filters"
      >
        {GENRE_TAGS.map((genre) => {
          const isActive = selectedGenre === genre.id;
          const Icon = genre.icon;

          return (
            <button
              key={genre.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => handleSelect(genre.id)}
              className={`group shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer border ${
                isActive
                  ? 'bg-white text-slate-950 shadow-lg scale-[1.02] border-white'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border-white/5 active:scale-95'
              }`}
              style={{
                borderColor: isActive ? genre.accentColor : undefined,
                boxShadow: isActive
                  ? `0 4px 20px -2px ${genre.accentColor}40`
                  : undefined,
              }}
            >
              <div 
                className={`w-5 h-5 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                  isActive ? 'text-slate-950' : 'text-slate-400'
                }`}
                style={{
                  color: isActive ? undefined : genre.accentColor,
                }}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>

              <span className="whitespace-nowrap font-medium tracking-tight">
                {genre.label}
              </span>

              {isActive && genre.id !== 'all' && (
                <span 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ backgroundColor: genre.accentColor }} 
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
