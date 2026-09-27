import React from 'react';
import { X, Sliders, Shield, Radio, Check } from 'lucide-react';
import { useJamStore } from '../store/useJamStore';
import { JamMode, JamSettings } from '../types/jam.types';
import { JAM_MODE_CONFIGS } from '../recommendations/JamModeConfig';

export const JamSettingsModal: React.FC = () => {
  const { room, isSettingsModalOpen, setIsSettingsModalOpen, updateSettings, setRoomMode } = useJamStore();

  if (!isSettingsModalOpen || !room) return null;

  const settings = room.settings;
  const currentMode = room.metadata.mode;

  const toggleSetting = (key: keyof JamSettings) => {
    if (typeof settings[key] === 'boolean') {
      updateSettings({ [key]: !settings[key] });
    }
  };

  const handleModeChange = (mode: JamMode) => {
    setRoomMode(mode);
  };

  const permissionItems: Array<{ key: keyof JamSettings; label: string; desc: string }> = [
    { key: 'allowGuestQueue', label: 'Add Songs to Queue', desc: 'Guests can search and add tracks to Up Next' },
    { key: 'allowGuestReorder', label: 'Reorder Queue', desc: 'Guests can drag and reorder collaborative queue' },
    { key: 'allowGuestSkip', label: 'Skip Songs Directly', desc: 'Guests can skip to the next track without voting' },
    { key: 'allowGuestPause', label: 'Pause & Resume Playback', desc: 'Guests can pause audio for everyone' },
    { key: 'allowGuestSeek', label: 'Seek Playhead', desc: 'Guests can scrub to different parts of the song' },
    { key: 'allowReactions', label: 'Floating Emoji Reactions', desc: 'Allow animated social reactions in the room' },
    { key: 'allowRecommendations', label: 'Smart Queue Suggestions', desc: 'Display group recommendation cards' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Room Settings"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn text-slate-100"
    >
      <div className="relative w-full max-w-lg bg-[#0c0f17] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          onClick={() => setIsSettingsModalOpen(false)}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--aura-primary,#6366f1)]/20 border border-[var(--aura-primary,#6366f1)]/40 flex items-center justify-center text-[var(--aura-primary,#6366f1)]">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Jam Room Settings</h3>
            <p className="text-xs text-slate-400">Configure guest permissions & room atmosphere</p>
          </div>
        </div>

        {/* Room Mode Picker */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-pink-400" />
            <span>Room Atmosphere & Mode</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(JAM_MODE_CONFIGS) as JamMode[]).map((modeKey) => {
              const cfg = JAM_MODE_CONFIGS[modeKey];
              const isSelected = currentMode === modeKey;

              return (
                <button
                  key={modeKey}
                  type="button"
                  onClick={() => handleModeChange(modeKey)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white/10 border-[var(--aura-primary,#6366f1)] shadow-lg'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{cfg.name.split(' ')[0]}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[var(--aura-primary,#6366f1)]" />}
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{cfg.tagline}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Guest Permissions Checklist */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guest Permissions</span>
          </label>

          <div className="space-y-2">
            {permissionItems.map((item) => {
              const isChecked = !!settings[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => toggleSetting(item.key)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 cursor-pointer transition-colors"
                >
                  <div className="pr-4">
                    <h5 className="text-xs font-semibold text-white">{item.label}</h5>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      isChecked
                        ? 'bg-[var(--aura-primary,#6366f1)] border-[var(--aura-primary,#6366f1)] text-white'
                        : 'border-white/20 bg-white/5'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Skip Vote Threshold */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white">Vote to Skip Threshold</span>
            <span className="font-mono text-[var(--aura-primary,#6366f1)] font-bold">
              {settings.voteSkipThresholdPercent}% of listeners
            </span>
          </div>
          <input
            type="range"
            min={25}
            max={100}
            step={5}
            value={settings.voteSkipThresholdPercent}
            onChange={(e) =>
              updateSettings({ voteSkipThresholdPercent: parseInt(e.target.value, 10) })
            }
            aria-label="Vote to skip threshold percentage"
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>
      </div>
    </div>
  );
};
