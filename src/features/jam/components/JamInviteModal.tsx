import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Copy,
  Check,
  Share2,
  Download,
  Users,
  ExternalLink,
  Smartphone,
  Radio,
} from 'lucide-react';
import { useJamStore } from '../store/useJamStore';
import { getJamShareUrl } from '../utils/jamUtils';

export const JamInviteModal: React.FC = () => {
  const { room, isInviteModalOpen, setIsInviteModalOpen } = useJamStore();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [networkOrigin, setNetworkOrigin] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/system/info')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.url) setNetworkOrigin(d.url);
      })
      .catch(() => {});
  }, [isInviteModalOpen]);

  const shareUrl = room ? getJamShareUrl(room.metadata.id, room.metadata.inviteToken) : '';
  const participants = Object.values(room?.participants || {});

  useEffect(() => {
    if (!shareUrl) return;
    let isCancelled = false;

    QRCode.toDataURL(shareUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: '#080c14',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    }).then((url) => {
      if (!isCancelled) setQrDataUrl(url);
    });

    return () => {
      isCancelled = true;
    };
  }, [shareUrl, networkOrigin]);

  if (!isInviteModalOpen || !room) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(room.metadata.id);
      }
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${room.metadata.name} on Aura Jam`,
          text: `Listen to synchronized music together in my Jam room "${room.metadata.name}"! Use code ${room.metadata.id}:`,
          url: shareUrl,
        });
        return;
      } catch (e) {}
    }
    handleCopyLink();
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `Aura-Jam-${room.metadata.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Invite to Jam"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn text-slate-100"
    >
      <div className="relative w-full max-w-md bg-[#0c0f17] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5 text-center">
        {/* Close Button */}
        <button
          onClick={() => setIsInviteModalOpen(false)}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Room Header Info */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--aura-primary,#6366f1)]/15 border border-[var(--aura-primary,#6366f1)]/30 text-[var(--aura-primary,#6366f1)] text-[11px] font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>JOIN MY JAM</span>
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight">{room.metadata.name}</h3>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {participants.length} listener{participants.length === 1 ? '' : 's'} in this room
            </span>
          </div>

          {networkOrigin && (
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 bg-white/[0.04] py-1 px-3 rounded-full border border-white/10 mx-auto w-fit mt-1">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>iPhone LAN:</span>
              <span className="font-mono text-white font-semibold select-all">{networkOrigin}</span>
            </div>
          )}
        </div>

        {/* Center QR Code */}
        <div className="flex flex-col items-center justify-center my-2">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-[var(--aura-primary,#6366f1)]/30 to-cyan-500/30 rounded-3xl blur-md opacity-75" />

            <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl bg-white p-3 shadow-2xl flex items-center justify-center border-4 border-white/20">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code for Jam ${room.metadata.id}`}
                  className="w-full h-full object-contain rounded-lg select-none"
                />
              ) : (
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>

          {/* 6-Letter Code Pill */}
          <div className="mt-3.5 flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 shadow-sm">
            <span className="text-[11px] font-mono text-slate-400">Room Code:</span>
            <span className="text-sm font-black text-white font-mono tracking-widest">
              {room.metadata.id}
            </span>
            <button
              onClick={handleCopyCode}
              aria-label="Copy code"
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Copy Room Code"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* URL Link Bar */}
        <div className="w-full flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl p-1.5 pl-3 min-w-0">
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs font-mono text-slate-300 truncate flex-1 min-w-0 select-all text-left">
            {shareUrl}
          </span>
          <button
            onClick={handleCopyLink}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--aura-primary,#6366f1)] hover:bg-[var(--aura-primary,#6366f1)]/90 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Share & Download Buttons */}
        <div className="grid grid-cols-2 gap-2 w-full pt-1">
          <button
            onClick={handleNativeShare}
            className="h-10 flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>Share Link</span>
          </button>

          <button
            onClick={handleDownloadQR}
            disabled={!qrDataUrl}
            className="h-10 flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Save Image</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Point any camera to scan and join instantly without account</span>
        </p>
      </div>
    </div>
  );
};
