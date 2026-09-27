import React, { useState } from 'react';
import { Wifi, Activity, Clock, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { useJamStore } from '../store/useJamStore';

export const JamConnectionStatus: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { connectionState, latencyRtt, clockOffset, driftMs, isSynced } = useJamStore();

  const getStatusColor = () => {
    switch (connectionState) {
      case 'synced':
      case 'connected':
        return 'bg-emerald-500 text-emerald-300 border-emerald-500/30';
      case 'syncing':
        return 'bg-amber-500 text-amber-300 border-amber-500/30';
      case 'reconnecting':
      case 'connecting':
        return 'bg-blue-500 text-blue-300 border-blue-500/30 animate-pulse';
      default:
        return 'bg-rose-500 text-rose-300 border-rose-500/30';
    }
  };

  const getStatusLabel = () => {
    switch (connectionState) {
      case 'synced':
        return 'LIVE';
      case 'syncing':
        return 'SYNCING';
      case 'reconnecting':
        return 'RECONNECTING';
      case 'connecting':
        return 'CONNECTING';
      default:
        return 'OFFLINE';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View Jam connection status"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border backdrop-blur-md transition-all cursor-pointer hover:opacity-90 ${getStatusColor()}`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            connectionState === 'synced' || connectionState === 'connected'
              ? 'bg-emerald-400 animate-pulse'
              : connectionState === 'syncing'
              ? 'bg-amber-400'
              : 'bg-rose-400'
          }`}
        />
        <span>{getStatusLabel()}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-8 z-50 w-64 p-4 rounded-2xl bg-[#0e121e]/95 border border-white/10 shadow-2xl backdrop-blur-2xl text-xs space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[var(--aura-primary,#6366f1)]" />
                Connection Telemetry
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {isSynced ? 'Ultra-Sync' : 'Calibrating'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Wifi className="w-3 h-3" />
                  Network RTT
                </span>
                <span className="font-mono text-white font-semibold">
                  {latencyRtt > 0 ? `${latencyRtt}ms` : '< 20ms'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Clock Offset
                </span>
                <span className="font-mono text-white font-semibold">
                  {clockOffset > 0 ? `+${clockOffset}ms` : `${clockOffset}ms`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  Audio Drift
                </span>
                <span
                  className={`font-mono font-semibold ${
                    Math.abs(driftMs) <= 80
                      ? 'text-emerald-400'
                      : Math.abs(driftMs) <= 300
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {Math.abs(driftMs)}ms
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center gap-1.5 text-[10px] text-slate-400">
              {isSynced ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Sub-audible synchronization active.</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Micro rate adjustment correcting drift.</span>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
