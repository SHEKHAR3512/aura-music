import React, { useState, useEffect } from 'react';
import { X, Bug, Zap, Activity, Clock, Shield, Sliders, RefreshCw, UserCheck } from 'lucide-react';
import { useJamStore } from '../store/useJamStore';
import { jamSyncEngine } from '../sync/JamSyncEngine';
import { clockSyncService } from '../sync/ClockSyncService';
import { audioEngine } from '../../../lib/audio/AudioEngine';
import { rtdb } from '../../../lib/firebase';

export const JamDebugPanel: React.FC = () => {
  const {
    room,
    userId,
    connectionState,
    isDebugPanelOpen,
    setIsDebugPanelOpen,
    latencyRtt,
    clockOffset,
    driftMs,
    isSynced,
  } = useJamStore();

  const [simulatedLatency, setSimulatedLatency] = useState<number>(0);
  const [simulatedDriftOffset, setSimulatedDriftOffset] = useState<number>(0);
  const [actualPos, setActualPos] = useState<number>(0);
  const [expectedPos, setExpectedPos] = useState<number>(0);

  // Keyboard shortcut listener: Ctrl + Shift + J
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        useJamStore.getState().toggleDebugPanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Poll high frequency audio clock for diagnostics
  useEffect(() => {
    if (!isDebugPanelOpen) return;
    const interval = setInterval(() => {
      setActualPos(audioEngine.getCurrentTime());
      setExpectedPos(jamSyncEngine.getExpectedPosition());
    }, 100);

    return () => clearInterval(interval);
  }, [isDebugPanelOpen]);

  if (!isDebugPanelOpen) return null;

  const handleApplyClockDrift = (ms: number) => {
    setSimulatedDriftOffset(ms);
    clockSyncService.setFirebaseOffset(clockSyncService.getOffset() + ms);
    jamSyncEngine.performPeriodicDriftCheck();
  };

  const handleSimulateFakeUser = async (name: string) => {
    if (!room) return;
    const fakeId = `fake-${Date.now().toString(36)}`;
    await fetch('/api/jam/room-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'HEARTBEAT',
        data: {
          roomId: room.metadata.id,
          participant: {
            id: fakeId,
            displayName: name,
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
            role: 'guest',
            isOnline: true,
            joinedAt: Date.now(),
            lastSeen: Date.now(),
          },
        },
      }),
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[85vh] overflow-y-auto no-scrollbar rounded-2xl bg-[#090c14]/95 border border-indigo-500/40 p-4 shadow-2xl backdrop-blur-2xl text-xs space-y-4 animate-fadeIn text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-white uppercase tracking-wider">Jam Diagnostics Console</span>
        </div>
        <button
          onClick={() => setIsDebugPanelOpen(false)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Telemetry Grid */}
      <div className="space-y-1.5 font-mono text-[11px] bg-black/50 p-3 rounded-xl border border-white/5">
        <div className="flex justify-between">
          <span className="text-slate-400">Room ID:</span>
          <span className="text-white font-bold">{room?.metadata.id || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">User ID:</span>
          <span className="text-slate-300 truncate max-w-[160px]">{userId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Host ID:</span>
          <span className="text-slate-300 truncate max-w-[160px]">{room?.metadata.hostId || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Playback Version:</span>
          <span className="text-cyan-400 font-bold">{room?.playback.playbackVersion || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Sequence Number:</span>
          <span className="text-cyan-400">{room?.sequenceNumber || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Connection Transport:</span>
          <span className="text-emerald-400 font-bold">{rtdb ? 'Firebase RTDB + WS' : 'Server WS Fallback'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Network Latency (RTT):</span>
          <span className="text-white">{latencyRtt}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Clock Offset:</span>
          <span className="text-white">{clockOffset}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Expected Position:</span>
          <span className="text-indigo-300">{expectedPos.toFixed(2)}s</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Actual Audio Position:</span>
          <span className="text-indigo-300">{actualPos.toFixed(2)}s</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Measured Drift:</span>
          <span
            className={`font-bold ${
              Math.abs(driftMs) < 80
                ? 'text-emerald-400'
                : Math.abs(driftMs) < 300
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {driftMs}ms {isSynced ? '✓ Synced' : '⚠ Syncing'}
          </span>
        </div>
      </div>

      {/* Network & Clock Simulation Suite */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <span className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>Clock Drift Simulation</span>
        </span>

        <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono">
          <button
            onClick={() => handleApplyClockDrift(-250)}
            className="py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 cursor-pointer"
          >
            -250ms
          </button>
          <button
            onClick={() => handleApplyClockDrift(0)}
            className="py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={() => handleApplyClockDrift(150)}
            className="py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 cursor-pointer"
          >
            +150ms
          </button>
          <button
            onClick={() => handleApplyClockDrift(500)}
            className="py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 cursor-pointer text-amber-300"
          >
            +500ms
          </button>
        </div>
      </div>

      {/* Multi-User Simulation Suite */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <span className="font-bold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Multi-User Simulation</span>
        </span>

        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
          <button
            onClick={() => handleSimulateFakeUser('Tushar (Co-Pilot)')}
            className="py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 cursor-pointer text-slate-300"
          >
            + Tushar
          </button>
          <button
            onClick={() => handleSimulateFakeUser('Mohit (Backseat DJ)')}
            className="py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 cursor-pointer text-slate-300"
          >
            + Mohit
          </button>
          <button
            onClick={() => handleSimulateFakeUser('Maya (Listener)')}
            className="py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 cursor-pointer text-slate-300"
          >
            + Maya
          </button>
        </div>
      </div>
    </div>
  );
};
