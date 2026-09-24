import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Radio, 
  Play, 
  Pause, 
  SkipForward, 
  Plus, 
  Copy, 
  Check, 
  Share2, 
  Volume2, 
  VolumeX, 
  LogOut, 
  Car, 
  Smartphone, 
  Trash2, 
  Music, 
  Search,
  QrCode,
  Activity,
  SlidersHorizontal,
  ChevronRight,
  Camera
} from 'lucide-react';
import { useJamStore, JamMember } from '../../lib/jam/jamStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../lib/storage/libraryStore';
import { JamQRCodeCard } from './JamQRCodeCard';
import { JamActivityFeed } from './JamActivityFeed';
import { QRCodeScanner } from './QRCodeScanner';
import { CrossfadeSettingSlider } from '../audio/CrossfadeSettingSlider';
import { triggerHaptic } from '../../lib/utils/haptics';

export const GroupPlayModal: React.FC = () => {
  const { 
    jamModalOpen, 
    setJamModalOpen, 
    currentTrack, 
    queue, 
    setSearchModalOpen,
    setAuthModalOpen,
  } = usePlayerStore();

  const { profile } = useLibraryStore();
  const isGuest = profile.provider === 'guest' || profile.isAnonymous;

  const {
    session,
    deviceId,
    userName,
    setUserName,
    avatar,
    setAvatar,
    isAudioOutput,
    isConnecting,
    error,
    createSession,
    joinSession,
    leaveSession,
    broadcastControl,
    broadcastRemoveFromQueue,
    toggleLocalAudioOutput,
  } = useJamStore();

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [sessionTab, setSessionTab] = useState<'controls' | 'queue' | 'activity' | 'qr'>('controls');
  const [sessionName, setSessionName] = useState("Shekhar's Car Jam");
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Check if user opened app via a scanned QR code URL (?jam=JAM-XXXX)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const jamFromUrl = urlParams.get('jam');
    if (jamFromUrl) {
      setJoinCode(jamFromUrl.toUpperCase());
      setActiveTab('join');
    }
  }, []);

  if (!jamModalOpen) return null;

  // Preset names inspired by the user brief (Shekhar, Tushar, Mohit)
  const presets = [
    { name: 'Shekhar', role: 'Driver / Host', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    { name: 'Tushar', role: 'Co-Pilot', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { name: 'Mohit', role: 'Backseat DJ', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSession(sessionName.trim() || 'Car Roadtrip Jam', currentTrack, queue);
    setSessionTab('qr'); // Show QR code first so passengers can join right away!
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    await joinSession(joinCode.trim(), userName, avatar);
    setSessionTab('controls');
  };

  const handleScannedCode = async (scannedCode: string) => {
    setJoinCode(scannedCode);
    setShowScanner(false);
    triggerHaptic('selection');
    await joinSession(scannedCode, userName, avatar);
    setSessionTab('controls');
  };

  const handleCopyCode = () => {
    if (!session) return;
    navigator.clipboard.writeText(session.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If user is not authenticated, show member-only unlock dialog
  if (isGuest) {
    return (
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Member Sign-In Required for Car Group Play"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn text-slate-100"
      >
        <div 
          className="relative w-full max-w-md bg-[#0c0f17] border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-center"
          style={{
            boxShadow: '0 25px 60px -15px rgba(16, 185, 129, 0.4)',
          }}
        >
          <button
            onClick={() => setJamModalOpen(false)}
            aria-label="Close dialog"
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto mb-5 shadow-lg shadow-emerald-500/20">
            <Car className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-extrabold text-white tracking-tight mb-2">
            Car Group Play is Member-Only
          </h3>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            Synchronize audio across passenger devices, broadcast shared queues, and let everyone DJ together via instant QR code.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2.5 mb-6 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span>Real-time sub-50ms synchronized playback</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span>Multi-passenger QR code auto-joining</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span>Shared voting queue and DJ co-pilot controls</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => {
                setJamModalOpen(false);
                setAuthModalOpen(true);
              }}
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
            >
              Sign In or Create Account to Unlock
            </button>
            <button
              onClick={() => setJamModalOpen(false)}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Continue listening solo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Car Group Play Jam Session"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-xl animate-fadeIn text-slate-100"
    >
      <div 
        className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-[#0c0f17] border-0 sm:border sm:border-white/10 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          boxShadow: '0 25px 60px -15px var(--aura-glow, rgba(16, 185, 129, 0.35))',
        }}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-[#0c0f17] to-[#0c0f17] shrink-0">

          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  Car Group Play
                </h2>
                <span className="hidden xs:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  REAL-TIME
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Single car audio speaker, multi-device passenger control
              </p>
            </div>
          </div>

          <button
            onClick={() => setJamModalOpen(false)}
            aria-label="Close group play modal"
            className="w-10 h-10 rounded-full text-slate-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 no-scrollbar">

          {/* ACTIVE JAM SESSION DASHBOARD */}
          {session ? (
            <div className="space-y-4 animate-fadeIn">
              {/* Sticky Session Status Bar */}
              <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-black border border-emerald-500/30 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
                      Active: {session.name}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-wider">
                        {session.id}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        · {session.members.length} {session.members.length === 1 ? 'device' : 'devices'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Top Actions: Copy Code & Leave */}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Code'}</span>
                  </button>

                  <button
                    onClick={leaveSession}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/30 text-rose-300 border border-rose-500/20 text-xs font-semibold transition-colors cursor-pointer"
                    title="Leave Jam Session"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Leave</span>
                  </button>
                </div>
              </div>

              {/* Segmented Sub-Navigation (Responsive Tabs for Smooth Mobile Control) */}
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setSessionTab('controls')}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                    sessionTab === 'controls'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Controls</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSessionTab('queue')}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                    sessionTab === 'queue'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Music className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Queue ({session.queue.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSessionTab('activity')}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                    sessionTab === 'activity'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Activity</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSessionTab('qr')}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                    sessionTab === 'qr'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">QR Code</span>
                </button>
              </div>

              {/* TAB 1: CONTROLS & SPEAKER */}
              {sessionTab === 'controls' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Car Speaker Output Switcher */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isAudioOutput ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-white/5 text-slate-400'
                      }`}>
                        {isAudioOutput ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                          <span>{isAudioOutput ? 'Car Speaker Mode (Active)' : 'Remote Controller Mode'}</span>
                          {isAudioOutput && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-semibold">
                              BLUETOOTH / AUX
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          {isAudioOutput 
                            ? 'Audio streams from this phone into the car stereo.' 
                            : 'Audio is silenced locally so only the car plays music.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('button');
                        toggleLocalAudioOutput();
                      }}
                      role="switch"
                      aria-checked={isAudioOutput}
                      aria-label="Toggle car speaker audio output"
                      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isAudioOutput ? 'bg-emerald-500' : 'bg-white/20'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isAudioOutput ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Shared Synchronized Player Bar */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-white/[0.04] to-black/40 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {session.currentTrack ? (
                          <img
                            src={session.currentTrack.artwork.low || session.currentTrack.artwork.medium}
                            alt={session.currentTrack.title}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover shadow border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 shrink-0">
                            <Music className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
                            Now Playing in Car
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                            {session.currentTrack?.title || 'No song selected'}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate">
                            {session.currentTrack?.primaryArtist || 'Search or pick a track to play'}
                          </p>
                        </div>
                      </div>

                      {/* Playback Controls (Touch Targets >= 44px) with Haptic Feedback */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(session.isPlaying ? 'pause' : 'play');
                            broadcastControl(session.isPlaying ? 'pause' : 'play');
                          }}
                          aria-label={session.isPlaying ? 'Pause music' : 'Play music'}
                          className="w-11 h-11 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                        >
                          {session.isPlaying ? (
                            <Pause className="w-5 h-5 fill-current" />
                          ) : (
                            <Play className="w-5 h-5 fill-current translate-x-0.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('skipForward');
                            broadcastControl('next');
                          }}
                          aria-label="Skip to next track"
                          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Skip to next track"
                        >
                          <SkipForward className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Action Shortcuts */}
                    <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setJamModalOpen(false);
                          setSearchModalOpen(true);
                        }}
                        className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Add Song to Car</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSessionTab('qr')}
                        className="py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 active:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Invite with QR</span>
                      </button>
                    </div>
                  </div>

                  {/* Collaborative Jam Crossfade & Gapless Transition Slider */}
                  <CrossfadeSettingSlider inJamSessionModal={true} showEnvelopeVisual={true} />

                  {/* Connected Passengers List */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        Passengers in Car ({session.members.length})
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono">Real-time sync</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {session.members.map((member: JamMember) => {
                        const isMe = member.id === deviceId;
                        const isOutput = member.isAudioOutput;

                        return (
                          <div
                            key={member.id}
                            className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                              isOutput 
                                ? 'bg-emerald-500/10 border-emerald-500/30' 
                                : 'bg-white/[0.02] border-white/5'
                            }`}
                          >
                            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/10 shrink-0 bg-slate-800">
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <h5 className="text-xs font-bold text-white truncate">{member.name}</h5>
                                {isMe && <span className="text-[10px] text-emerald-400 font-mono">(You)</span>}
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                {isOutput ? (
                                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                    <Volume2 className="w-3 h-3" /> Speaker
                                  </span>
                                ) : (
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <Smartphone className="w-3 h-3" /> Controller
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CAR QUEUE */}
              {sessionTab === 'queue' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        Shared Queue ({session.queue.length})
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Tracks play automatically in sequence on the car audio
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setJamModalOpen(false);
                        setSearchModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow transition-colors cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Song</span>
                    </button>
                  </div>

                  {session.queue.length === 0 ? (
                    <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                      <Music className="w-8 h-8 mx-auto text-slate-600 mb-1" />
                      <p className="text-xs font-medium text-slate-300">The car queue is empty</p>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                        Anyone in the car can tap 'Add Song' to search and queue tracks.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setJamModalOpen(false);
                          setSearchModalOpen(true);
                        }}
                        className="mt-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Search Music</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-80 overflow-y-auto no-scrollbar">
                      {session.queue.map((song, i) => (
                        <div
                          key={`${song.id}-${i}`}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="w-4 text-center text-[11px] font-mono text-slate-500 shrink-0">
                              {i + 1}
                            </span>
                            <img
                              src={song.artwork.low || song.artwork.medium}
                              alt={song.title}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-semibold text-white truncate">{song.title}</h5>
                              <p className="text-[10px] text-slate-400 truncate">{song.primaryArtist}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => broadcastRemoveFromQueue(i)}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20 transition-colors shrink-0 cursor-pointer"
                            title="Remove from queue"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: LIVE ACTIVITY FEED */}
              {sessionTab === 'activity' && (
                <div className="animate-fadeIn">
                  <JamActivityFeed activities={session.activity || []} />
                </div>
              )}

              {/* TAB 4: QR CODE & PASSENGER INVITE */}
              {sessionTab === 'qr' && (
                <div className="animate-fadeIn">
                  <JamQRCodeCard
                    sessionCode={session.id}
                    sessionName={session.name}
                    memberCount={session.members.length}
                    standalone
                  />
                </div>
              )}
            </div>
          ) : (
            /* SETUP / JOIN SCREEN */
            <div className="space-y-5 animate-fadeIn">
              {/* Story / Concept Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-black border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-3">
                <Car className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white mb-0.5">How Car Group Play Works</h4>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    The driver connects to car Bluetooth / AUX as the main speaker. Passengers join wirelessly from their phones to search and queue tracks without playing overlapping audio.
                  </p>
                </div>
              </div>

              {/* Passenger Identity Picker */}
              <div className="space-y-2.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block">
                  Select Passenger Profile
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {presets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setUserName(preset.name);
                        setAvatar(preset.avatar);
                      }}
                      className={`p-3 rounded-2xl border transition-all flex flex-col items-center text-center cursor-pointer min-h-[90px] justify-center ${
                        userName === preset.name
                          ? 'bg-emerald-500/20 border-emerald-500/60 shadow-lg scale-[1.02]'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 active:bg-white/15'
                      }`}
                    >
                      <img
                        src={preset.avatar}
                        alt={preset.name}
                        className="w-10 h-10 rounded-full object-cover mb-1.5 border border-white/10"
                      />
                      <span className="text-xs font-bold text-white truncate w-full">{preset.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 truncate w-full">{preset.role}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-1">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Or enter custom passenger name..."
                    className="w-full h-11 px-3.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-medium"
                  />
                </div>
              </div>

              {/* Tabs: Create vs Join */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className={`h-11 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'create'
                      ? 'bg-white text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  <span>Start Car Jam (Driver)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('join')}
                  className={`h-11 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'join'
                      ? 'bg-white text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Join with Code</span>
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                  {error}
                </div>
              )}

              {/* CREATE TAB */}
              {activeTab === 'create' && (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Session Name</label>
                    <input
                      type="text"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="e.g. Shekhar's Car Roadtrip"
                      required
                      className="w-full h-12 px-3.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 font-medium"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Starting this session will turn your device into the master car audio output. A QR code and 4-letter code will be generated for your friends in the car.
                  </p>

                  <button
                    type="submit"
                    disabled={isConnecting}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    {isConnecting ? (
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Car className="w-4 h-4" />
                        <span>Launch Car Jam Session</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* JOIN TAB */}
              {activeTab === 'join' && (
                <div className="space-y-4">
                  {showScanner ? (
                    <QRCodeScanner
                      onScan={handleScannedCode}
                      onClose={() => setShowScanner(false)}
                    />
                  ) : (
                    <form onSubmit={handleJoin} className="space-y-4">
                      {/* Prominent Camera Scan Button */}
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('button');
                          setShowScanner(true);
                        }}
                        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/10 border border-emerald-500/40 hover:border-emerald-500/70 text-emerald-300 font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/10 hover:bg-emerald-500/25 active:scale-[0.99] transition-all cursor-pointer group"
                      >
                        <Camera className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span>Scan Host's QR Code with Camera</span>
                      </button>

                      {/* Divider */}
                      <div className="flex items-center gap-3 my-2">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                          Or enter code manually
                        </span>
                        <div className="flex-1 h-px bg-white/10" />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">
                          Enter 4-Character Jam Code
                        </label>
                        <input
                          type="text"
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                          placeholder="e.g. JAM-CAR9"
                          required
                          maxLength={10}
                          className="w-full h-12 text-center tracking-widest text-lg font-mono bg-white/5 border border-white/10 rounded-xl text-white uppercase focus:outline-none focus:border-emerald-400"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isConnecting || !joinCode.trim()}
                        className="w-full h-12 rounded-xl bg-white text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-slate-100 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isConnecting ? (
                          <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Smartphone className="w-4 h-4" />
                            <span>Connect & Join Car Jam</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
