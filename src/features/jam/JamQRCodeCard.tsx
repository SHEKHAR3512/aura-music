import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Copy, 
  Check, 
  Download, 
  Share2, 
  Car, 
  Smartphone,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface JamQRCodeCardProps {
  sessionCode: string;
  sessionName: string;
  memberCount: number;
  standalone?: boolean;
}

export const JamQRCodeCard: React.FC<JamQRCodeCardProps> = ({
  sessionCode,
  sessionName,
  memberCount,
  standalone = false,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Construct absolute join URL with jam query parameter
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const joinUrl = `${origin}?jam=${encodeURIComponent(sessionCode)}`;

  useEffect(() => {
    let isCancelled = false;

    QRCode.toDataURL(joinUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: '#080c14',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (!isCancelled) {
          setQrDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('Failed to generate Jam QR Code:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [joinUrl]);

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(joinUrl);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // Fallback
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const handleCopyCode = async () => {
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(sessionCode);
      }
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    } catch {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `AURA-Jam-${sessionCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${sessionName} on AURA Music`,
          text: `Join our car group listening session! Use code ${sessionCode} or open the link below:`,
          url: joinUrl,
        });
        return;
      } catch (e) {
        // User cancelled or share failed, fallback to copy
      }
    }
    handleCopyLink();
  };

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-white/[0.04] to-black/50 border border-emerald-500/25 p-4 sm:p-6 shadow-xl relative overflow-hidden flex flex-col items-center">
      {/* Ambient background glow */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="w-full text-center space-y-1 mb-5 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold tracking-wide">
          <Car className="w-3.5 h-3.5 text-emerald-400" />
          <span>SCAN TO JOIN CAR JAM</span>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
          Connect Passengers Wirelessly
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
          Point any iPhone or Android camera at this code to join as a passenger controller.
        </p>
      </div>

      {/* Centerpiece: Scannable QR Code */}
      <div className="relative z-10 flex flex-col items-center my-1">
        <div className="relative group">
          {/* Card glow behind QR */}
          <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl bg-white p-3 shadow-2xl flex items-center justify-center border-4 border-emerald-400/40">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for Jam Session ${sessionCode}`}
                className="w-full h-full object-contain rounded-lg select-none"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-50 rounded-lg">
                <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-[11px] font-mono text-slate-600">Generating QR...</span>
              </div>
            )}

            {/* Centered Car Icon Watermark Badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-9 h-9 rounded-xl bg-[#090d16] border-2 border-emerald-400 shadow-xl flex items-center justify-center text-emerald-400">
                <Car className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* 4-Letter Code Display Pill */}
        <div className="mt-3.5 flex items-center gap-2 bg-black/60 border border-emerald-500/40 rounded-xl px-3.5 py-1.5 shadow-sm">
          <span className="text-[11px] font-mono text-slate-400">Jam Code:</span>
          <span className="text-sm font-black text-white font-mono tracking-widest">
            {sessionCode}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            aria-label="Copy Jam code"
            className="p-1 text-slate-400 hover:text-emerald-300 transition-colors ml-1 cursor-pointer"
            title="Copy 4-Letter Code"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* URL Link Bar (Guaranteed Never to Clip on Mobile) */}
      <div className="w-full max-w-md mt-5 relative z-10 space-y-3">
        <div className="w-full flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl p-1.5 pl-3 min-w-0 overflow-hidden">
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs font-mono text-slate-300 truncate flex-1 min-w-0 select-all">
            {joinUrl}
          </span>
          <button
            type="button"
            onClick={handleCopyLink}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            title="Copy Direct Join URL"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden xs:inline">{copiedLink ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Action Button Row */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full">
          <button
            type="button"
            onClick={handleNativeShare}
            className="h-11 sm:h-10 flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>Share Link</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadQR}
            disabled={!qrDataUrl}
            className="h-11 sm:h-10 flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Save Image</span>
          </button>
        </div>

        {/* Mobile-Friendly Instruction Note */}
        <div className="pt-1 flex items-start gap-2 text-[11px] text-slate-400 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
          <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            iPhone & Android: Open standard Camera app, tap yellow link pop-up. No login or app download needed.
          </p>
        </div>
      </div>
    </div>
  );
};
