import React, { useState } from 'react';
import { Crown, MoreVertical, LogOut, Check, Wifi, UserCheck, Shield } from 'lucide-react';
import { useJamStore } from '../store/useJamStore';
import { JamParticipant } from '../types/jam.types';
import { isParticipantOnline } from '../services/JamPresenceService';

export const JamParticipants: React.FC = () => {
  const { room, userId, transferHost } = useJamStore();
  const [selectedUserForTransfer, setSelectedUserForTransfer] = useState<JamParticipant | null>(null);

  if (!room) return null;

  const participantsList = Object.values(room.participants || {});
  const isHost = room.metadata.hostId === userId;
  const onlineParticipants = participantsList.filter(isParticipantOnline);

  // Sort host and active online listeners to the top
  const sortedParticipants = [...participantsList].sort((a, b) => {
    const aHost = a.id === room.metadata.hostId ? 1 : 0;
    const bHost = b.id === room.metadata.hostId ? 1 : 0;
    if (aHost !== bHost) return bHost - aHost;
    const aOnline = isParticipantOnline(a) ? 1 : 0;
    const bOnline = isParticipantOnline(b) ? 1 : 0;
    if (aOnline !== bOnline) return bOnline - aOnline;
    return (b.lastSeen || 0) - (a.lastSeen || 0);
  });

  const handleConfirmTransfer = async () => {
    if (selectedUserForTransfer) {
      await transferHost(selectedUserForTransfer.id);
      setSelectedUserForTransfer(null);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-white uppercase tracking-wider">
          Listening Together ({onlineParticipants.length})
        </span>
        <span className="text-[10px] font-mono text-emerald-400">
          {onlineParticipants.length} Active Online
        </span>
      </div>

      <div className="space-y-1.5 max-h-[320px] overflow-y-auto no-scrollbar">
        {sortedParticipants.map((participant) => {
          const isParticipantHost = participant.role === 'host' || participant.id === room.metadata.hostId;
          const isCurrentUser = participant.id === userId;
          const active = isParticipantOnline(participant);

          return (
            <div
              key={participant.id}
              className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl border transition-all ${
                isParticipantHost
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Avatar with live status dot */}
                <div className="relative shrink-0">
                  <img
                    src={participant.avatar}
                    alt={participant.displayName}
                    className="w-8 h-8 rounded-full object-cover border border-white/10"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#090c14] ${
                      active ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                </div>

                {/* Name & Badge */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                      {participant.displayName}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[10px] font-mono text-slate-400">(You)</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    {isParticipantHost ? (
                      <span className="text-amber-300 font-bold flex items-center gap-0.5">
                        <Crown className="w-2.5 h-2.5" /> Room Host
                      </span>
                    ) : (
                      <span className={active ? 'text-slate-300' : 'text-slate-500'}>
                        {active ? 'Listening' : 'Offline'}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Host Actions Menu */}
              {isHost && !isParticipantHost && (
                <button
                  onClick={() => setSelectedUserForTransfer(participant)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-medium border border-white/10 transition-colors cursor-pointer"
                  title="Transfer Host Ownership"
                >
                  Make Host
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Host Transfer Confirmation Modal */}
      {selectedUserForTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-[#0e121e] border border-amber-500/30 p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <Crown className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white">Transfer Host Rights?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Make <strong className="text-white">{selectedUserForTransfer.displayName}</strong> the
              new Host of this Jam? They will obtain full playback, queue, and room moderation
              authority.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setSelectedUserForTransfer(null)}
                className="py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTransfer}
                className="py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer transition-colors shadow-lg shadow-amber-500/25"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
