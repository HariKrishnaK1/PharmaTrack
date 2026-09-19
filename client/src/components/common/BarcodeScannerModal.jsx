import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export const BarcodeScannerModal = ({ isOpen, onClose, onScan, title = "Scan Barcode / QR Code" }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [scannedResult, setScannedResult] = useState('');
  const html5QrCodeRef = useRef(null);
  const regionId = 'pt-barcode-scanner-region';

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setErrorMsg('');
      setScannedResult('');
      return;
    }

    // Delay start until modal DOM element is rendered
    const timer = setTimeout(() => {
      startCamera();
    }, 250);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setErrorMsg('');
      setScannedResult('');
      
      const element = document.getElementById(regionId);
      if (!element) return;

      const html5QrCode = new Html5Qrcode(regionId);
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 180 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' }, // Back camera preferred on mobile
        config,
        (decodedText) => {
          setScannedResult(decodedText);
          // Play a small beep / feedback if available
          if ('vibrate' in navigator) navigator.vibrate(100);
          
          setTimeout(() => {
            stopCamera();
            onScan(decodedText.trim());
            onClose();
          }, 400);
        },
        () => {
          // Frame error (e.g. no barcode detected in frame yet) - ignore
        }
      );

      setCameraActive(true);
    } catch (err) {
      console.warn('Camera initiation failed: ', err);
      setErrorMsg(
        err.name === 'NotAllowedError'
          ? 'Camera access permission was denied. Please allow camera access in browser settings.'
          : 'Could not access camera or no active video input devices found.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Body */}
        <div className="p-5 flex flex-col items-center">
          <div className="relative w-full max-w-[320px] aspect-square rounded-xl overflow-hidden bg-slate-950 border-2 border-teal-500/40 shadow-inner flex items-center justify-center">
            {/* Viewfinder Target Container */}
            <div id={regionId} className="w-full h-full" />

            {/* Success Overlay */}
            {scannedResult && (
              <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-emerald-400 p-4 text-center animate-in zoom-in-95">
                <CheckCircle2 className="w-12 h-12 mb-2 text-emerald-400 animate-bounce" />
                <span className="text-xs font-semibold text-white">Code Identified!</span>
                <span className="font-mono text-sm font-bold text-emerald-300 mt-1 break-all bg-emerald-900/50 px-2 py-1 rounded">
                  {scannedResult}
                </span>
              </div>
            )}
          </div>

          {/* Feedback & Instructions */}
          {errorMsg ? (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 w-full">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Scanner Unavailable</p>
                <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">{errorMsg}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-[11px] transition"
                >
                  <RefreshCw className="w-3 h-3" /> Retry Camera
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
              Align barcode, DataMatrix, or QR code inside the viewfinder window.
            </p>
          )}

          {/* Manual Input Fallback */}
          <div className="w-full mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Facing issues?</span>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
            >
              Enter manually
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
