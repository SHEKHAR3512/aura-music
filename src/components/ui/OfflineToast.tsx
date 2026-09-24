import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, ChevronRight, X, Minimize2, Maximize2, HardDrive } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

interface OfflineToastProps {
  onOpenOfflineLibrary?: () => void;
}

export const OfflineToast: React.FC<OfflineToastProps> = ({ onOpenOfflineLibrary }) => {
  const { isOnline, isSystemOnline, isForcedOffline, setForcedOffline } = useNetworkStatus();
  const isOffline = !isOnline;

  const [isMinimized, setIsMinimized] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);
  const [lastOnlineState, setLastOnlineState] = useState(isOnline);

  // Detect transition from offline -> online to show restored message
  useEffect(() => {
    if (!lastOnlineState && isOnline) {
      setJustReconnected(true);
      const timer = setTimeout(() => {
        setJustReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
    setLastOnlineState(isOnline);
  }, [isOnline, lastOnlineState]);

  // Test network connectivity
  const handleCheckConnection = async () => {
    setIsChecking(true);
    try {
      if (isForcedOffline) {
        setForcedOffline(false);
      }
      const res = await fetch('/api/music/charts', { method: 'HEAD', cache: 'no-store' });
      if (res.ok) {
        setJustReconnected(true);
        setTimeout(() => setJustReconnected(false), 3500);
      }
    } catch (e) {
      // Still offline
    } finally {
      setTimeout(() => setIsChecking(false), 600);
    }
  };

  // Reconnection announcement toast (temporary 3.5s)
  if (justReconnected) {
    return (
      <div 
        role="status"
        aria-live="polite"
        className="fixed bottom-22 sm:bottom-24 left-4 sm:left-8 z-40 max-w-sm w-full bg-[#0d141e]/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-3.5 shadow-2xl animate-fadeIn flex items-center justify-between text-slate-100"
        style={{ boxShadow: '0 10px 30px -5px rgba(16, 185, 129, 0.3)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Connection Restored</h4>
            <p className="text-[11px] text-emerald-300">Live streaming and cloud sync are now active.</p>
          </div>
        </div>
        <button 
          onClick={() => setJustReconnected(false)}
          className="p-1 rounded text-slate-400 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Not offline and not testing
  if (!isOffline) return null;

  // Minimized Compact Pill Mode
  if (isMinimized) {
    return (
      <div 
        role="status"
        aria-live="polite"
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-22 sm:bottom-24 left-4 sm:left-8 z-40 flex items-center gap-2.5 px-3.5 py-2 bg-[#12141f]/95 hover:bg-[#161a29] backdrop-blur-xl border border-amber-500/40 rounded-full shadow-2xl cursor-pointer text-slate-100 transition-all hover:scale-105 active:scale-95 group"
        style={{ boxShadow: '0 8px 25px -4px rgba(245, 158, 11, 0.3)' }}
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <WifiOff className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-semibold text-white">Offline Mode Active</span>
        <span className="text-[10px] font-mono text-slate-400">· Cached Content</span>
        <Maximize2 className="w-3 h-3 text-slate-400 group-hover:text-white ml-1" />
      </div>
    );
  }

  // Expanded Persistent Notification Card
  return (
    <div 
      role="alert"
      aria-live="assertive"
      className="fixed bottom-22 sm:bottom-24 left-4 sm:left-8 z-40 max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-auto bg-[#10121d]/95 backdrop-blur-2xl border border-amber-500/40 rounded-2xl p-4 shadow-2xl text-slate-100 animate-fadeIn"
      style={{
        boxShadow: '0 15px 35px -5px rgba(245, 158, 11, 0.25), 0 0 0 1px rgba(245, 158, 11, 0.1)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <WifiOff className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white tracking-tight">Offline Mode</h4>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 font-semibold">
                CACHED
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">Network connection unavailable</p>
          </div>
        </div>

        <button
          onClick={() => setIsMinimized(true)}
          aria-label="Minimize offline notification"
          title="Minimize to badge"
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-xs text-slate-300 mt-3 leading-relaxed">
        You are currently viewing cached artists, tracklists, and playlists stored in your local storage. High-resolution metadata remains accessible offline.
      </p>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/10">
        {onOpenOfflineLibrary ? (
          <button
            onClick={onOpenOfflineLibrary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            <span>View Offline Library</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </button>
        ) : <div />}

        <button
          onClick={handleCheckConnection}
          disabled={isChecking}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Retry network connection"
        >
          <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin text-amber-400' : ''}`} />
          <span>{isChecking ? 'Checking...' : 'Check Status'}</span>
        </button>
      </div>
    </div>
  );
};
