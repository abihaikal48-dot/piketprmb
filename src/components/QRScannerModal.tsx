import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePiket } from '../context/PiketContext';
import { PiketArea } from '../types/piket';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArea: (area: PiketArea) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onSelectArea }) => {
  const { areas } = usePiket();
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const stopScannerSafely = async (instance?: Html5Qrcode | null) => {
    const scanner = instance || scannerRef.current;
    if (scanner === scannerRef.current) {
      scannerRef.current = null;
    }
    if (!scanner) return;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch {
      // Silently catch and suppress "Cannot stop, scanner is not running or paused"
    }

    try {
      scanner.clear();
    } catch {
      // Silently catch container clear errors
    }
  };

  useEffect(() => {
    let isCancelled = false;

    if (!isOpen) {
      stopScannerSafely();
      setIsScanning(false);
      setCameraError(null);
      return;
    }

    const startScanner = async () => {
      if (isCancelled) return;
      try {
        setCameraError(null);
        setIsScanning(true);

        // Ensure container exists
        const container = document.getElementById('qr-reader-container');
        if (!container) return;

        const html5QrCode = new Html5Qrcode('qr-reader-container');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (!isCancelled) {
              handleScanSuccess(decodedText);
            }
          },
          () => {
            // ignore continuous scanning frame misses
          }
        );

        if (isCancelled) {
          stopScannerSafely(html5QrCode);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('Camera scan notice:', err);
          setCameraError(
            'Kamera tidak dapat diakses atau izin belum diberikan. Anda dapat memilih area piket langsung dari tombol cepat di bawah.'
          );
          setIsScanning(false);
        }
      }
    };

    const timer = setTimeout(startScanner, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      stopScannerSafely();
    };
  }, [isOpen]);

  const handleScanSuccess = async (text: string) => {
    let matchedArea: PiketArea | undefined;

    if (text.includes('area=')) {
      try {
        const url = new URL(text);
        const areaParam = url.searchParams.get('area');
        if (areaParam) {
          matchedArea = areas.find(a => a.id === areaParam || a.code.toLowerCase() === areaParam.toLowerCase());
        }
      } catch {
        const match = text.match(/area=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          matchedArea = areas.find(a => a.id === match[1] || a.code.toLowerCase() === match[1].toLowerCase());
        }
      }
    }

    if (!matchedArea) {
      matchedArea = areas.find(
        a =>
          a.id.toLowerCase() === text.trim().toLowerCase() ||
          a.code.toLowerCase() === text.trim().toLowerCase() ||
          a.name.toLowerCase() === text.trim().toLowerCase()
      );
    }

    await stopScannerSafely();

    if (matchedArea) {
      onSelectArea(matchedArea);
      onClose();
    } else if (areas.length > 0) {
      onSelectArea(areas[0]);
      onClose();
    }
  };

  const handleClose = async () => {
    await stopScannerSafely();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-xl border border-slate-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Scan QR Code Area</h3>
            <p className="text-[11px] text-slate-500">Arahkan kamera ke stiker QR meja piket</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-square flex items-center justify-center">
            <div id="qr-reader-container" className="w-full h-full" />

            {cameraError && (
              <div className="absolute inset-0 bg-slate-900/90 p-5 flex flex-col items-center justify-center text-center text-white">
                <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                <p className="text-xs font-semibold leading-relaxed mb-3">
                  {cameraError}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Pilih Cepat Tanpa Kamera:
            </span>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
              {areas.map(area => (
                <button
                  key={area.id}
                  onClick={async () => {
                    await stopScannerSafely();
                    onSelectArea(area);
                    onClose();
                  }}
                  className="p-2 rounded-lg text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs transition-colors"
                >
                  <span className="text-[10px] font-mono text-slate-400 block font-bold">{area.code}</span>
                  <span className="font-bold text-slate-800 truncate block">{area.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
