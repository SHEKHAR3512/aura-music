import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, X, RefreshCw } from 'lucide-react';
import jsQR from 'jsqr';

interface QRCodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  // Extract jam code from QR data (could be a URL like "?jam=JAM-XXXX" or just the code)
  const extractJamCode = useCallback((data: string): string | null => {
    // Try URL format: https://...?jam=JAM-XXXX
    try {
      const url = new URL(data);
      const jamCode = url.searchParams.get('jam');
      if (jamCode) return jamCode.toUpperCase();
    } catch {
      // Not a URL
    }
    // Try raw code format: JAM-XXXX or just XXXX
    const cleaned = data.trim().toUpperCase();
    if (/^JAM-[A-Z0-9]{4,}$/.test(cleaned)) return cleaned;
    if (/^[A-Z0-9]{4,8}$/.test(cleaned)) return cleaned;
    return null;
  }, []);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsStarting(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // Rear camera preferred
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Continuous scanning loop using jsQR + canvas
      const scanLoop = () => {
        if (!videoRef.current || !canvasRef.current) {
          animFrameRef.current = requestAnimationFrame(scanLoop);
          return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            try {
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              });

              if (qrResult && qrResult.data) {
                const code = extractJamCode(qrResult.data);
                if (code) {
                  stopCamera();
                  onScan(code);
                  return;
                }
              }
            } catch {
              // Frame decoding error, continue loop
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(scanLoop);
      };

      animFrameRef.current = requestAnimationFrame(scanLoop);
      setIsStarting(false);
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access was denied. Please allow camera permissions and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError(`Could not start camera: ${err.message}`);
      }
      setIsStarting(false);
    }
  }, [extractJamCode, onScan, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Scanner Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Scan QR Code
          </h4>
        </div>
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Camera Viewport */}
      <div className="relative w-full aspect-square max-w-[300px] mx-auto rounded-2xl overflow-hidden bg-black border border-white/10">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-3">
            <CameraOff className="w-10 h-10 text-rose-400" />
            <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={startCamera}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />

            {/* Scanning Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner brackets */}
              <div className="absolute inset-[15%]">
                {/* Top-left */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
                {/* Top-right */}
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
                {/* Bottom-left */}
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
                {/* Bottom-right */}
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br" />
              </div>

              {/* Animated scan line */}
              <div className="absolute left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-qr-scan" />

              {/* Dim outside the scan area */}
              <div className="absolute inset-0 border-[15%] border-black/40" style={{ borderStyle: 'solid' }} />
            </div>

            {/* Loading Spinner */}
            {isStarting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        )}

        {/* Hidden canvas for frame processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Hint */}
      <p className="text-[11px] text-slate-400 text-center leading-relaxed">
        Point your camera at the host's QR code to join the Jam instantly.
      </p>
    </div>
  );
};
