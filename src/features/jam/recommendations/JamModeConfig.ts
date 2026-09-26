import { JamMode } from '../types/jam.types';

export interface ModeConfig {
  id: JamMode;
  name: string;
  tagline: string;
  accentGlow: string;
  visualizerMode: 'aurora' | 'nebula' | 'solar' | 'liquid' | 'pulse' | 'waveform' | 'spectrum' | 'minimal';
  visualizerIntensity: number; // 0.0 to 1.0
  animationSpeedMultiplier: number;
  reactionIntensity: 'subtle' | 'vibrant' | 'explosive';
  backgroundAmbience: 'deep' | 'glowing' | 'cosmic' | 'minimalist' | 'warm';
  uiDensity: 'compact' | 'comfortable' | 'cinematic';
  recommendationWeight: {
    energy: 'low' | 'high' | 'balanced';
    discoveryVsFamiliar: number; // 0.0 (all hits) to 1.0 (all discovery)
  };
}

export const JAM_MODE_CONFIGS: Record<JamMode, ModeConfig> = {
  chill: {
    id: 'chill',
    name: 'Chill & Ambient',
    tagline: 'Mellow sonic waves, soft gradients, relaxed vibes',
    accentGlow: 'rgba(99, 102, 241, 0.45)', // Indigo
    visualizerMode: 'aurora',
    visualizerIntensity: 0.4,
    animationSpeedMultiplier: 0.8,
    reactionIntensity: 'subtle',
    backgroundAmbience: 'deep',
    uiDensity: 'comfortable',
    recommendationWeight: {
      energy: 'low',
      discoveryVsFamiliar: 0.3,
    },
  },
  party: {
    id: 'party',
    name: 'High Energy Party',
    tagline: 'Pulsing waveforms, dynamic reactions, maximum energy',
    accentGlow: 'rgba(236, 72, 153, 0.65)', // Pink / Neon
    visualizerMode: 'pulse',
    visualizerIntensity: 0.95,
    animationSpeedMultiplier: 1.25,
    reactionIntensity: 'explosive',
    backgroundAmbience: 'glowing',
    uiDensity: 'cinematic',
    recommendationWeight: {
      energy: 'high',
      discoveryVsFamiliar: 0.2,
    },
  },
  discover: {
    id: 'discover',
    name: 'Discovery Lab',
    tagline: 'Deep cut recommendations, room DNA analysis, sonic gems',
    accentGlow: 'rgba(16, 185, 129, 0.55)', // Emerald
    visualizerMode: 'nebula',
    visualizerIntensity: 0.65,
    animationSpeedMultiplier: 1.0,
    reactionIntensity: 'vibrant',
    backgroundAmbience: 'cosmic',
    uiDensity: 'comfortable',
    recommendationWeight: {
      energy: 'balanced',
      discoveryVsFamiliar: 0.85,
    },
  },
  focus: {
    id: 'focus',
    name: 'Focus & Flow',
    tagline: 'Distraction-free acoustic sanctuary for deep work',
    accentGlow: 'rgba(14, 165, 233, 0.35)', // Sky / Cyan
    visualizerMode: 'minimal',
    visualizerIntensity: 0.25,
    animationSpeedMultiplier: 0.7,
    reactionIntensity: 'subtle',
    backgroundAmbience: 'minimalist',
    uiDensity: 'compact',
    recommendationWeight: {
      energy: 'low',
      discoveryVsFamiliar: 0.1,
    },
  },
  nostalgia: {
    id: 'nostalgia',
    name: 'Retro Nostalgia',
    tagline: 'Vintage vinyl warmth, timeless classics, golden era sound',
    accentGlow: 'rgba(245, 158, 11, 0.55)', // Amber
    visualizerMode: 'solar',
    visualizerIntensity: 0.55,
    animationSpeedMultiplier: 0.9,
    reactionIntensity: 'vibrant',
    backgroundAmbience: 'warm',
    uiDensity: 'cinematic',
    recommendationWeight: {
      energy: 'balanced',
      discoveryVsFamiliar: 0.4,
    },
  },
};
