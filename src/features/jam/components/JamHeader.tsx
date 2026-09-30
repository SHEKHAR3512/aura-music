import React from 'react';
import {
  Share2,
  Settings,
  LogOut,
  Radio,
  Sparkles,
  Bug,
  Crown,
  Volume2,
  Smartphone,
  Plus,
} from 'lucide-react';
import { useJamStore } from '../store/useJamStore';
import { usePlayerStore } from '../../../stores/playerStore';
import { JamConnectionStatus } from './JamConnectionStatus';
import { JAM_MODE_CONFIGS } from '../recommendations/JamModeConfig';
import { isParticipantOnline } from '../services/JamPresenceService';

export const JamHeader: React.FC = () => {
  const { setSearchModalOpen } = usePlayerStore();
  const {
    room,
    userId,
    isAudioOutput,
    toggleAudioOutput,
    leaveJam,
    endJam,
    setIsInviteModalOpen,
    setIsSettingsModalOpen,
    toggleDebugPanel,
  } = useJamStore();

  if (!room) return null;

  const isHost = room.metadata.hostId === userId;
  const modeConfig = JAM_MODE_CONFIGS[room.metadata.mode] || JAM_MODE_CONFIGS.chill;
  const participantsList = Object.values(room.participants || {}).filter(isParticipantOnline);

  return (
    <header className="w-full flex items-center justify-between pb-4 border-b border-white/10 flex-wrap gap-3">
      {/* Room Information & Mode */}
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-[var(--aura-primary,#6366f1)] shadow-[0_0_12px_var(--aura-primary,#6366f1)] animate-pulse" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate max-w-[200px] sm:max-w-xs">
              {room.metadata.name}
            </h2>
            {isHost && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-2.5 h-2.5" /> Host
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold"
              style={{ color: modeConfig.accentGlow }}
            >
              <Radio className="w-3 h-3" />
              <span>{modeConfig.name}</span>
            </span>
            <span>•</span>
            <span className="font-mono text-[11px] text-slate-400">
              Code: <strong className="text-white">{room.metadata.id}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls: Participant Avatars, Status, Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Overlapping Avatar Stack */}
        <div className="hidden sm:flex items-center -space-x-2 mr-1">
          {participantsList.slice(0, 4).map((p) => (
            <img
              key={p.id}
              src={p.avatar}
              alt={p.displayName}
              title={`${p.displayName} (${p.isOnline ? 'Online' : 'Offline'})`}
              className={`w-7 h-7 rounded-full object-cover border-2 border-[#090c14] ring-1 ${
                p.role === 'host' ? 'ring-amber-400' : 'ring-white/20'
              }`}
            />
          ))}
          {participantsList.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-white/10 text-white font-mono text-[10px] flex items-center justify-center border-2 border-[#090c14]">
              +{participantsList.length - 4}
            </div>
          )}
        </div>

        {/* Live Synchronization Status Badge */}
        <JamConnectionStatus />

        {/* Audio Output Mode Quick Toggle */}
        <button
          onClick={toggleAudioOutput}
          title={
            isAudioOutput
              ? 'Click to switch to Remote Controller mode (silent on this device)'
              : 'Click to listen on this device (Speaker mode)'
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
            isAudioOutput
              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border-sky-500/30'
          }`}
        >
          {isAudioOutput ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Speaker</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Controller</span>
            </>
          )}
        </button>

        {/* Add Songs Quick Trigger */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--aura-primary,#6366f1)] hover:bg-[var(--aura-primary,#6366f1)]/90 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
          title="Search and add songs to Jam"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Songs</span>
        </button>

        {/* Invite Button */}
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Invite</span>
        </button>

        {/* Settings (Host only or room viewer) */}
        {isHost && (
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            aria-label="Room Settings"
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* Debug Panel Toggle */}
        <button
          onClick={toggleDebugPanel}
          aria-label="Toggle Debug Diagnostics Panel"
          title="Diagnostics Panel (Ctrl+Shift+J)"
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
        >
          <Bug className="w-4 h-4" />
        </button>

        {/* Leave or End Jam */}
        <button
          onClick={isHost ? endJam : leaveJam}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isHost ? 'End Jam' : 'Leave'}</span>
        </button>
      </div>
    </header>
  );
};
