import React, { useState } from 'react';
import {
  Music,
  ListMusic,
  FileText,
  Dna,
  Users,
  Activity,
  Sparkles,
  Maximize2,
  X,
  Radio,
  Plus,
} from 'lucide-react';
import { useJamStore } from '../store/useJamStore';
import { JamHeader } from './JamHeader';
import { JamPlayer } from './JamPlayer';
import { JamQueue } from './JamQueue';
import { JamParticipants } from './JamParticipants';
import { JamRoomDNA } from './JamRoomDNA';
import { JamActivity } from './JamActivity';
import { JamVisualizer } from './JamVisualizer';
import { JamLyrics } from './JamLyrics';
import { JamInviteModal } from './JamInviteModal';
import { JamSettingsModal } from './JamSettingsModal';
import { JamSummaryModal } from './JamSummaryModal';
import { JamCreateModal } from './JamCreateModal';
import { JamJoinModal } from './JamJoinModal';
import { JamDebugPanel } from './JamDebugPanel';
import { usePlayerStore } from '../../../stores/playerStore';

export const JamRoom: React.FC = () => {
  const { setSearchModalOpen } = usePlayerStore();
  const { room: jamRoom } = useJamStore();

  const [centerTab, setCenterTab] = useState<'player' | 'visualizer' | 'lyrics'>('player');
  const [mobileTab, setMobileTab] = useState<'now_playing' | 'queue' | 'dna' | 'people' | 'activity'>('now_playing');

  if (!jamRoom) return null;

  return (
    <div className="relative w-full min-h-[calc(100dvh-4rem)] flex flex-col rounded-2xl sm:rounded-3xl bg-[#090b12]/90 border border-white/10 shadow-2xl backdrop-blur-3xl overflow-hidden p-3.5 sm:p-6 mb-4 sm:mb-8 animate-fadeIn">
      {/* Background Dynamic Ambient Radial Glow */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-40 transition-all duration-1000"
        style={{ background: 'var(--aura-primary, #6366f1)' }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-30 transition-all duration-1000"
        style={{ background: 'var(--aura-secondary, #06b6d4)' }}
      />

      {/* Jam Room Header */}
      <JamHeader />

      {/* Desktop 3-Column Studio Grid Layout */}
      <div className="hidden lg:grid grid-cols-12 gap-6 mt-6 flex-1 items-start">
        {/* Left Column: Room DNA & Live Activity (3 cols) */}
        <div className="col-span-3 space-y-5">
          <JamRoomDNA />

          <div className="w-full rounded-2xl bg-black/40 border border-white/10 p-4 space-y-2 backdrop-blur-xl">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Room Activity</span>
            </span>
            <JamActivity />
          </div>
        </div>

        {/* Center Column: Now Playing / Visualizer / Lyrics Centerpiece (6 cols) */}
        <div className="col-span-6 flex flex-col items-center justify-start space-y-4">
          {/* Centerpiece Mode Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/10 text-xs shadow-inner">
            <button
              onClick={() => setCenterTab('player')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer font-medium ${
                centerTab === 'player'
                  ? 'bg-white text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Player</span>
            </button>

            <button
              onClick={() => setCenterTab('visualizer')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer font-medium ${
                centerTab === 'visualizer'
                  ? 'bg-white text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Visualizer</span>
            </button>

            <button
              onClick={() => setCenterTab('lyrics')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer font-medium ${
                centerTab === 'lyrics'
                  ? 'bg-white text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lyrics</span>
            </button>
          </div>

          {/* Center Active View */}
          <div className="w-full flex items-center justify-center min-h-[460px]">
            {centerTab === 'player' && <JamPlayer />}
            {centerTab === 'visualizer' && <JamVisualizer className="h-[460px]" />}
            {centerTab === 'lyrics' && <JamLyrics className="h-[460px] w-full" />}
          </div>
        </div>

        {/* Right Column: Collaborative Queue & People Panel (3 cols) */}
        <div className="col-span-3 space-y-5">
          <div className="w-full rounded-2xl bg-black/40 border border-white/10 p-4 space-y-3 backdrop-blur-xl">
            <JamQueue onOpenSearch={() => setSearchModalOpen(true)} />
          </div>

          <div className="w-full rounded-2xl bg-black/40 border border-white/10 p-4 space-y-3 backdrop-blur-xl">
            <JamParticipants />
          </div>
        </div>
      </div>

      {/* Mobile Responsive Layout */}
      <div className="lg:hidden flex flex-col space-y-4 mt-4">
        {/* Mobile Navigation Segment Control & Quick Add Button */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center justify-between p-1 rounded-full bg-white/5 border border-white/10 text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setMobileTab('now_playing')}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
              mobileTab === 'now_playing' ? 'bg-white text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Player
          </button>
          <button
            onClick={() => setMobileTab('queue')}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
              mobileTab === 'queue' ? 'bg-white text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Queue ({jamRoom.queue.length})
          </button>
          <button
            onClick={() => setMobileTab('dna')}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
              mobileTab === 'dna' ? 'bg-white text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Room DNA
          </button>
          <button
            onClick={() => setMobileTab('people')}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
              mobileTab === 'people' ? 'bg-white text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            People ({Object.keys(jamRoom.participants || {}).length})
          </button>
          <button
            onClick={() => setMobileTab('activity')}
            className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer ${
              mobileTab === 'activity' ? 'bg-white text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Activity
          </button>
        </div>

          {/* Quick Add Song Action Button */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-full bg-[var(--aura-primary,#6366f1)] hover:bg-[var(--aura-primary,#6366f1)]/90 text-white text-xs font-bold shrink-0 shadow-md cursor-pointer transition-transform active:scale-95"
            title="Search and add songs to Jam"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Add</span>
          </button>
        </div>

        {/* Mobile Content Display */}
        <div className="pt-2">
          {mobileTab === 'now_playing' && (
            <div className="space-y-6">
              <JamPlayer />
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCenterTab(centerTab === 'lyrics' ? 'player' : 'lyrics')}
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white cursor-pointer"
                >
                  {centerTab === 'lyrics' ? 'Show Album Artwork' : 'Show Lyrics'}
                </button>
                <button
                  onClick={() => setCenterTab(centerTab === 'visualizer' ? 'player' : 'visualizer')}
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white cursor-pointer"
                >
                  {centerTab === 'visualizer' ? 'Show Album Artwork' : 'Show Visualizer'}
                </button>
              </div>
              {centerTab === 'lyrics' && <JamLyrics className="h-[360px]" />}
              {centerTab === 'visualizer' && <JamVisualizer className="h-[280px]" />}
            </div>
          )}

          {mobileTab === 'queue' && (
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
              <JamQueue onOpenSearch={() => setSearchModalOpen(true)} />
            </div>
          )}

          {mobileTab === 'dna' && <JamRoomDNA />}

          {mobileTab === 'people' && (
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
              <JamParticipants />
            </div>
          )}

          {mobileTab === 'activity' && (
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
              <JamActivity />
            </div>
          )}
        </div>
      </div>

      {/* Embedded Modals & Overlays */}
      <JamInviteModal />
      <JamSettingsModal />
      <JamSummaryModal />
      <JamCreateModal />
      <JamJoinModal />
      <JamDebugPanel />
    </div>
  );
};
