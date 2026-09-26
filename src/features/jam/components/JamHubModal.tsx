import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Plus,
  ArrowRight,
  QrCode,
  Users,
  Clock,
  Sparkles,
  History,
  Globe,
  Dna,
  Zap,
} from 'lucide-react';
import { useJamStore } from '../store/useJamStore';
import { usePlayerStore } from '../../../stores/playerStore';
import { JamRoom } from './JamRoom';
import { JamCreateModal } from './JamCreateModal';
import { JamJoinModal } from './JamJoinModal';
import { QRCodeScanner } from '../QRCodeScanner';

export const JamHubModal: React.FC = () => {
  const { jamModalOpen, setJamModalOpen } = usePlayerStore();
  const {
    room,
    setIsCreateModalOpen,
    setIsJoinModalOpen,
    joinJam,
    summary,
  } = useJamStore();

  const [showScanner, setShowScanner] = useState(false);
  const [quickCode, setQuickCode] = useState('');

  // Auto-detect ?jam=XXXX in URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const codeFromQuery = params.get('jam');
    if (codeFromQuery) {
      setQuickCode(codeFromQuery.toUpperCase());
      setJamModalOpen(true);
      joinJam(codeFromQuery.toUpperCase());
    } else {
      // Also check pathname: /jam/XXXX
      const match = window.location.pathname.match(/\/jam\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        const pathCode = match[1].toUpperCase();
        setQuickCode(pathCode);
        setJamModalOpen(true);
        joinJam(pathCode);
      }
    }
  }, []);

  if (!jamModalOpen) return null;

  // If user is currently in an active Jam session, render the full Jam Room listening interface!
  if (room) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Aura Jam Listening Room"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-2xl overflow-y-auto no-scrollbar"
      >
        <div className="relative w-full max-w-6xl my-auto">
          {/* Close / Minimize button */}
          <button
            onClick={() => setJamModalOpen(false)}
            aria-label="Minimize Jam Room"
            className="absolute top-4 right-4 z-40 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <JamRoom />
        </div>
      </div>
    );
  }

  // Pre-configured public listening rooms for discovery (Spec #36)
  const publicRooms = [
    {
      id: 'CHILL1',
      name: 'Lofi & Ambient Sanctuary',
      listeners: 5,
      mode: 'Chill',
      genres: 'Acoustic • Lo-Fi • Ambient',
      energy: 'Mellow Vibe',
    },
    {
      id: 'HIT88',
      name: 'Global Chart Toppers',
      listeners: 8,
      mode: 'Party',
      genres: 'Pop • R&B • Hip-Hop',
      energy: '🔥 High Energy',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Aura Jam Hub"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn text-slate-100 overflow-y-auto no-scrollbar"
    >
      <div className="relative w-full max-w-2xl bg-[#0c0f17] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-auto">
        {/* Close Button */}
        <button
          onClick={() => setJamModalOpen(false)}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Section */}
        <div className="text-center space-y-2 max-w-md mx-auto pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--aura-primary,#6366f1)]/15 border border-[var(--aura-primary,#6366f1)]/30 text-[var(--aura-primary,#6366f1)] text-[11px] font-bold tracking-wider">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>REALTIME LISTENING ROOM</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Listen Together in Jam
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Experience synchronized music across rooms, cars, and distance. Everyone hears the same
            track with millisecond clock precision.
          </p>
        </div>

        {/* 2 Primary Action Cards: [Start a Jam] and [Join Jam] */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Start a Jam */}
          <div
            onClick={() => setIsCreateModalOpen(true)}
            className="group relative p-5 rounded-3xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] hover:from-white/[0.07] hover:to-white/[0.02] border border-white/10 hover:border-[var(--aura-primary,#6366f1)]/50 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 shadow-xl"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--aura-primary,#6366f1)]/20 border border-[var(--aura-primary,#6366f1)]/40 flex items-center justify-center text-[var(--aura-primary,#6366f1)] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white group-hover:text-[var(--aura-primary,#6366f1)] transition-colors">
                  Start a Jam
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Become the room host. Share a link or QR code with friends to control the room.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--aura-primary,#6366f1)]">
              <span>Create listening room</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Join a Jam */}
          <div
            onClick={() => setIsJoinModalOpen(true)}
            className="group relative p-5 rounded-3xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] hover:from-white/[0.07] hover:to-white/[0.02] border border-white/10 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 shadow-xl"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                  Join a Jam
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Enter a 6-letter room code or scan a QR code from a friend's device or car console.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
              <span>Enter room code</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Quick Join Input & QR Camera Scanner Trigger */}
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/[0.02] border border-white/10">
          <input
            type="text"
            placeholder="Have a code? e.g. X7K92P"
            value={quickCode}
            onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
            className="flex-1 px-3 py-2 bg-transparent text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={() => setShowScanner(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Scan QR Code via Camera"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={() => quickCode.trim() && joinJam(quickCode.trim())}
            disabled={!quickCode.trim()}
            className="px-4 py-2 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
          >
            Join
          </button>
        </div>

        {/* Public Discoverable Jams (Spec #36) */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Discover Public Listening Rooms</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {publicRooms.map((pubRoom) => (
              <div
                key={pubRoom.id}
                onClick={() => joinJam(pubRoom.id)}
                className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all cursor-pointer space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-white group-hover:text-[var(--aura-primary,#6366f1)] transition-colors">
                    {pubRoom.name}
                  </h5>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {pubRoom.listeners} listening
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">{pubRoom.genres}</p>

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                  <span>{pubRoom.energy}</span>
                  <span className="font-bold text-[var(--aura-primary,#6366f1)] group-hover:underline">
                    Join Room →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modals */}
        <JamCreateModal />
        <JamJoinModal initialCode={quickCode} />

        {/* QR Camera Scanner Modal if opened */}
        {showScanner && (
          <QRCodeScanner
            onScan={(scannedCode: string) => {
              setShowScanner(false);
              setQuickCode(scannedCode);
              joinJam(scannedCode);
            }}
            onClose={() => setShowScanner(false)}
          />
        )}
      </div>
    </div>
  );
};
