import React, { useState } from 'react';
import { X, Sparkles, Radio, Lock, Globe, Shield, Check } from 'lucide-react';
import { useJamStore } from '../store/useJamStore';
import { JamMode, JamPrivacy, JamSettings } from '../types/jam.types';
import { JAM_MODE_CONFIGS } from '../recommendations/JamModeConfig';
import { usePlayerStore } from '../../../stores/playerStore';

export const JamCreateModal: React.FC = () => {
  const { isCreateModalOpen, setIsCreateModalOpen, createJam } = useJamStore();
  const { currentTrack, queue } = usePlayerStore();

  const [roomName, setRoomName] = useState('Late Night Jam');
  const [mode, setMode] = useState<JamMode>('chill');
  const [privacy, setPrivacy] = useState<JamPrivacy>('public_link');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial guest permissions
  const [permissions, setPermissions] = useState<Partial<JamSettings>>({
    allowGuestQueue: true,
    allowGuestReorder: true,
    allowGuestSkip: false,
    allowGuestPause: false,
    allowGuestSeek: false,
    allowGuestVolume: true,
    allowReactions: true,
    allowRecommendations: true,
  });

  if (!isCreateModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createJam({
        roomName: roomName.trim() || 'Late Night Jam',
        mode,
        privacy,
        initialTrack: currentTrack,
        initialQueue: queue,
        settings: permissions,
      });
    } catch (err) {
      console.error('Failed to create Jam:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (key: keyof JamSettings) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Start a Jam Listening Room"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn text-slate-100"
    >
      <div className="relative w-full max-w-lg bg-[#0c0f17] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          onClick={() => setIsCreateModalOpen(false)}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--aura-primary,#6366f1)]/20 border border-[var(--aura-primary,#6366f1)]/40 flex items-center justify-center text-[var(--aura-primary,#6366f1)] shadow-lg shadow-indigo-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Start a Jam</h3>
            <p className="text-xs text-slate-400">
              Listen to music simultaneously with friends across any device
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Room Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Room Name
            </label>
            <input
              type="text"
              required
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Late Night Acoustic Jam"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[var(--aura-primary,#6366f1)]"
            />
          </div>

          {/* Room Atmosphere Mode */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Room Atmosphere
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(JAM_MODE_CONFIGS) as JamMode[]).map((modeKey) => {
                const cfg = JAM_MODE_CONFIGS[modeKey];
                const isSelected = mode === modeKey;

                return (
                  <button
                    key={modeKey}
                    type="button"
                    onClick={() => setMode(modeKey)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white/10 border-[var(--aura-primary,#6366f1)] shadow-md'
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{cfg.name.split(' ')[0]}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[var(--aura-primary,#6366f1)]" />}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">{cfg.tagline}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Privacy */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Room Privacy
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPrivacy('public_link')}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                  privacy === 'public_link'
                    ? 'bg-white/10 border-[var(--aura-primary,#6366f1)] text-white'
                    : 'bg-white/[0.02] border-white/5 text-slate-400'
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold block text-white">Anyone with Link</span>
                  <span className="text-[10px] text-slate-400">Direct join via share link or QR</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPrivacy('invite_only')}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                  privacy === 'invite_only'
                    ? 'bg-white/10 border-[var(--aura-primary,#6366f1)] text-white'
                    : 'bg-white/[0.02] border-white/5 text-slate-400'
                }`}
              >
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold block text-white">Invite Only</span>
                  <span className="text-[10px] text-slate-400">Requires verified invite token</span>
                </div>
              </button>
            </div>
          </div>

          {/* Guest Permissions Quick Checklist */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Guest Permissions</span>
            </label>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <label
                onClick={() => togglePermission('allowGuestQueue')}
                className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!!permissions.allowGuestQueue}
                  readOnly
                  className="rounded text-[var(--aura-primary,#6366f1)]"
                />
                <span className="text-slate-300">Add songs to queue</span>
              </label>

              <label
                onClick={() => togglePermission('allowGuestReorder')}
                className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!!permissions.allowGuestReorder}
                  readOnly
                  className="rounded text-[var(--aura-primary,#6366f1)]"
                />
                <span className="text-slate-300">Reorder queue</span>
              </label>

              <label
                onClick={() => togglePermission('allowGuestSkip')}
                className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!!permissions.allowGuestSkip}
                  readOnly
                  className="rounded text-[var(--aura-primary,#6366f1)]"
                />
                <span className="text-slate-300">Skip songs directly</span>
              </label>

              <label
                onClick={() => togglePermission('allowReactions')}
                className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!!permissions.allowReactions}
                  readOnly
                  className="rounded text-[var(--aura-primary,#6366f1)]"
                />
                <span className="text-slate-300">Social reactions</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-[var(--aura-primary,#6366f1)] hover:bg-[var(--aura-primary,#6366f1)]/90 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Listening Room...</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4" />
                  <span>Start Jamming Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
