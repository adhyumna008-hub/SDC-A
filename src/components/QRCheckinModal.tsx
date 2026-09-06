import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { checkInAttendeeByQRService } from '../services/dataService';
import { EventRegistration } from '../types';

interface QRCheckinModalProps {
  onClose: () => void;
  onCheckInSuccess?: (reg: EventRegistration) => void;
}

export const QRCheckinModal: React.FC<QRCheckinModalProps> = ({ onClose, onCheckInSuccess }) => {
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const [qrInput, setQrInput] = useState('');
  const [result, setResult] = useState<{
    success: boolean;
    alreadyCheckedIn?: boolean;
    registration?: EventRegistration;
    message: string;
  } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

  // Audio tone synthesizer for instant audible feedback
  const playFeedbackTone = (frequency: number, durationMs: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  };

  const handleVerify = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;
    setScanning(true);
    setResult(null);

    try {
      const res = await checkInAttendeeByQRService(codeToVerify);
      setResult(res);

      if (res.success && res.registration) {
        playFeedbackTone(880, 250); // High chime: SUCCESS
        onCheckInSuccess?.(res.registration);
      } else {
        playFeedbackTone(220, 450); // Low warning buzz: REJECT / DUPLICATE
      }
    } catch (e) {
      setResult({ success: false, message: 'Check-in validation system error.' });
      playFeedbackTone(220, 450);
    } finally {
      setScanning(false);
    }
  };

  // Setup HTML5 Camera Scanner
  useEffect(() => {
    if (scanMode !== 'camera') return;

    let isMounted = true;
    const scannerElementId = 'reader-camera-viewfinder';

    const startScanner = async () => {
      try {
        setCameraError(null);
        // Clean up previous instance if any
        if (html5QrCodeRef.current) {
          try {
            if (html5QrCodeRef.current.isScanning) {
              await html5QrCodeRef.current.stop();
            }
            html5QrCodeRef.current.clear();
          } catch (e) {
            // ignore cleanup errors
          }
        }

        const html5QrCode = new Html5Qrcode(scannerElementId);
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 }
          },
          (decodedText) => {
            if (!isProcessingRef.current) {
              isProcessingRef.current = true;
              handleVerify(decodedText).finally(() => {
                // Pause 2.5s before allowing next scan to prevent rapid duplicate triggers
                setTimeout(() => {
                  isProcessingRef.current = false;
                }, 2500);
              });
            }
          },
          () => {} // Frame error ignore
        );
      } catch (err: any) {
        console.warn('Camera start issue:', err);
        if (isMounted) {
          setCameraError(err?.message || 'Camera permission denied or camera device not found. Switching to manual input mode.');
          setScanMode('manual');
        }
      }
    };

    const timer = setTimeout(startScanner, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().then(() => {
              html5QrCodeRef.current?.clear();
            }).catch(() => {});
          }
        } catch (e) {}
      }
    };
  }, [scanMode]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="bg-[#0b1326] border border-white/20 rounded-3xl max-w-lg w-full p-6 sm:p-7 relative shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col gap-5 text-on-surface animate-scaleIn">
        
        {/* Specular Liquid Edge */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white/[0.1] to-transparent pointer-events-none rounded-t-3xl"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-electric-cyan text-2xl">qr_code_scanner</span>
              <h3 className="text-white font-headline-lg font-bold text-xl">Day-of-Event Scanner</h3>
            </div>
            <p className="text-xs text-on-surface-variant font-code-sm mt-0.5">
              Live QR verification • Instant attendance recording • 1-scan check
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-white flex items-center justify-center border border-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Mode Toggle (Camera vs Manual Code) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-white/[0.04] rounded-2xl border border-white/10 relative z-10">
          <button
            type="button"
            onClick={() => setScanMode('camera')}
            className={`py-2 px-3 rounded-xl font-code-sm text-xs transition-all flex items-center justify-center gap-1.5 ${
              scanMode === 'camera'
                ? 'bg-electric-cyan text-white font-bold shadow-[0_0_12px_rgba(14,165,233,0.4)]'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">photo_camera</span>
            <span>Live Camera</span>
          </button>
          <button
            type="button"
            onClick={() => setScanMode('manual')}
            className={`py-2 px-3 rounded-xl font-code-sm text-xs transition-all flex items-center justify-center gap-1.5 ${
              scanMode === 'manual'
                ? 'bg-neon-purple text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">keyboard</span>
            <span>Manual Entry</span>
          </button>
        </div>

        {/* Scanner Viewport / Camera View */}
        {scanMode === 'camera' ? (
          <div className="relative z-10 rounded-2xl overflow-hidden border border-white/15 bg-black/60 shadow-inner flex flex-col items-center justify-center min-h-[280px]">
            <div id="reader-camera-viewfinder" className="w-full h-full min-h-[260px]"></div>

            {/* Target Reticle Overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-56 h-56 border-2 border-dashed border-electric-cyan/70 rounded-2xl relative shadow-[0_0_20px_rgba(14,165,233,0.3)] animate-pulse">
                <span className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-electric-cyan"></span>
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-electric-cyan"></span>
                <span className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-electric-cyan"></span>
                <span className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-electric-cyan"></span>
              </div>
            </div>

            {cameraError && (
              <div className="absolute inset-0 bg-black/90 p-6 flex flex-col items-center justify-center text-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-error">no_photography</span>
                <p className="text-xs text-error font-code-sm max-w-xs">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => setScanMode('manual')}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-code-sm text-xs"
                >
                  Use Manual Input
                </button>
              </div>
            )}

            <span className="absolute bottom-2 font-code-sm text-[10px] text-white/70 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">
              Point camera at student QR pass
            </span>
          </div>
        ) : (
          <div className="space-y-3 font-body-md text-xs relative z-10">
            <label className="block text-[11px] font-code-sm text-on-surface-variant">
              Ticket Pass ID / Team Code / Roll Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 24881A05B4 or SDC-4892"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify(qrInput)}
                className="flex-1 bg-white/[0.04] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-electric-cyan font-mono"
              />
              <button
                type="button"
                onClick={() => handleVerify(qrInput)}
                disabled={scanning}
                className="bg-gradient-to-r from-neon-purple to-electric-cyan text-white px-5 py-2.5 rounded-xl font-label-caps text-xs uppercase font-bold shadow hover:opacity-95 transition-all"
              >
                {scanning ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        )}

        {/* Scan Result Card */}
        {result && (
          <div
            className={`p-4 rounded-2xl border text-xs font-code-sm relative z-10 animate-fadeIn ${
              result.success
                ? 'bg-success-glow/15 border-success-glow/50 text-success-glow shadow-[0_0_20px_rgba(34,197,94,0.25)]'
                : result.alreadyCheckedIn
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                : 'bg-error-container/25 border-error/50 text-error'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm mb-1">
              <span className="material-symbols-outlined text-lg">
                {result.success ? 'verified' : result.alreadyCheckedIn ? 'warning' : 'cancel'}
              </span>
              <span>{result.message}</span>
            </div>

            {/* Attendee Details */}
            {result.registration && (
              <div className="mt-3 text-on-surface-variant space-y-1.5 border-t border-white/10 pt-3 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-white font-bold text-xs">{result.registration.userName}</span>
                  <span className="font-mono text-electric-cyan">#{result.registration.id.substring(0, 10)}</span>
                </div>
                <div><strong className="text-white">College:</strong> {result.registration.collegeName}</div>
                <div><strong className="text-white">Roll / Student ID:</strong> <span className="font-mono text-white">{result.registration.rollNumber}</span></div>
                {result.registration.phoneNumber && (
                  <div><strong className="text-white">Phone / WhatsApp:</strong> <span className="font-mono text-white">{result.registration.phoneNumber}</span></div>
                )}
                <div><strong className="text-white">Email:</strong> {result.registration.userEmail}</div>
                <div><strong className="text-white">Event:</strong> {result.registration.eventTitle}</div>
                {result.registration.teamCode && (
                  <div>
                    <strong className="text-white">Team:</strong>{' '}
                    <span className="text-neon-purple font-mono font-bold">
                      {result.registration.teamName} ({result.registration.teamCode})
                    </span>
                  </div>
                )}
                <div className="pt-1 flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-xs">schedule</span>
                  <span>
                    Status: {result.registration.checkedIn ? 'PRESENT' : 'UNVERIFIED'} (
                    {result.registration.checkedInAt ? new Date(result.registration.checkedInAt).toLocaleTimeString() : 'Just Now'}
                    )
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-white/10 flex justify-between items-center relative z-10 text-xs font-code-sm">
          <span className="text-on-surface-variant text-[11px]">
            ⚡ Scans are synced in real time to database
          </span>
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-label-caps text-xs uppercase font-bold transition-colors border border-white/10"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
