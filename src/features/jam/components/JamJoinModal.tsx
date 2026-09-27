import React, { useState } from 'react';
import { X, Radio, QrCode, Camera } from 'lucide-react';
import { useJamStore } from '../store/useJamStore';
import { DEFAULT_AVATARS } from '../utils/jamUtils';
import { QRCodeScanner } from '../QRCodeScanner';

export const JamJoinModal: React.FC<{ initialCode?: string }> = ({ initialCode = '' }) => {
  const {
    isJoinModalOpen,
    setIsJoinModalOpen,
    joinJam,
    userName,
    setUserName,
    userAvatar,
    setUserAvatar,
  } = useJamStore();

  const [code, setCode] = useState(initialCode);
  const [localName, setLocalName] = useState(userName || 'Aura Listener');
  const [localAvatar, setLocalAvatar] = useState(userAvatar || DEFAULT_AVATARS[0]);
  const [isJoining, setIsJoining] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isJoinModalOpen) return null;

  const handleScanSuccess = async (scannedCode: string) => {
    setShowScanner(false);
    setCode(scannedCode);
    setUserName(localName.trim() || 'Aura Listener');
    setUserAvatar(localAvatar);

    setIsJoining(true);
    setErrorMsg(null);
    const success = await joinJam(scannedCode.trim().toUpperCase(), localName.trim(), localAvatar);
    setIsJoining(false);

    if (!success) {
      setErrorMsg(`Could not connect to Jam room "${scannedCode}". Verify the code or try again.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isJoining) return;

    setIsJoining(true);
    setErrorMsg(null);

    setUserName(localName.trim() || 'Aura Listener');
    setUserAvatar(localAvatar);

    const success = await joinJam(code.trim().toUpperCase(), localName.trim(), localAvatar);
    setIsJoining(false);

    if (!success) {
      setErrorMsg('Could not find or connect to Jam room. Please verify the 6-character code.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Join a Jam Listening Room"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn text-slate-100"
    >
      <div className="relative w-full max-w-md bg-[#0c0f17] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-5 text-center max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          onClick={() => {
            setShowScanner(false);
            setIsJoinModalOpen(false);
          }}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="w-12 h-12 rounded-2xl bg-[var(--aura-primary,#6366f1)]/20 border border-[var(--aura-primary,#6366f1)]/40 text-[var(--aura-primary,#6366f1)] flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
          <Radio className="w-6 h-6 animate-pulse" />
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white tracking-tight">Join a Jam Room</h3>
          <p className="text-xs text-slate-400">
            Scan a QR code from host screen or enter the room code.
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px]">
            <span>📱 Joining as Remote Controller • Audio plays on Host</span>
          </div>
        </div>

        {/* Live Camera Scanner View if Active */}
        {showScanner ? (
          <div className="p-2 rounded-2xl bg-white/[0.02] border border-emerald-500/30">
            <QRCodeScanner
              onScan={handleScanSuccess}
              onClose={() => setShowScanner(false)}
            />
          </div>
        ) : (
          <>
            {/* Primary Action: Big "Scan QR Code" Button */}
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/15 hover:from-emerald-500/30 hover:to-teal-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block leading-tight font-bold text-white text-xs sm:text-sm">
                  Scan QR Code with Camera
                </span>
                <span className="block text-[10px] text-emerald-400/80 font-normal">
                  Point phone camera at PC or friend's screen
                </span>
              </div>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                or type code
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Room Code */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Jam Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3 h-3" />
                    <span>Open camera</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. X7K92P or JAM-XXXX"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm font-mono tracking-widest uppercase focus:outline-none focus:border-[var(--aura-primary,#6366f1)]"
                />
              </div>

              {/* Your Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Your Display Name
                </label>
                <input
                  type="text"
                  required
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  placeholder="Choose a nickname"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[var(--aura-primary,#6366f1)]"
                />
              </div>

              {/* Avatar Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Choose Avatar
                </label>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {DEFAULT_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLocalAvatar(av)}
                      className={`relative rounded-full transition-transform cursor-pointer ${
                        localAvatar === av
                          ? 'scale-115 ring-2 ring-[var(--aura-primary,#6366f1)] ring-offset-2 ring-offset-[#0c0f17]'
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      <img src={av} alt="Avatar option" className="w-10 h-10 rounded-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl text-center">
                  {errorMsg}
                </p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isJoining || !code.trim()}
                  className="w-full py-3 rounded-2xl bg-[var(--aura-primary,#6366f1)] hover:bg-[var(--aura-primary,#6366f1)]/90 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isJoining ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Connecting to Jam...</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-4 h-4" />
                      <span>Join Jam Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
