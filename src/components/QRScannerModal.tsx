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

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        });
      }
      setIsScanning(false);
      setCameraError(null);
      return;
    }

    const startScanner = async () => {
      try {
        setCameraError(null);
        setIsScanning(true);
        const html5QrCode = new Html5Qrcode('qr-reader-container');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {
            // scan frame error (ignore continuous scan frames)
          }
        );
      } catch (err: any) {
        console.warn('Camera scan start notice:', err);
        setCameraError(
          'Kamera tidak dapat diakses atau izin belum diberikan. Anda dapat memilih area piket langsung dari tombol cepat di bawah.'
        );
        setIsScanning(false);
      }
    };

    const timer = setTimeout(startScanner, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        });
      }
    };
  }, [isOpen]);

  const handleScanSuccess = (text: string) => {
    // If QR contains full url e.g. https://.../?area=fryer-station or raw ID/code
    let matchedArea: PiketArea | undefined;

    if (text.includes('area=')) {
      try {
        const url = new URL(text);
        const areaParam = url.searchParams.get('area');
        if (areaParam) {
          matchedArea = areas.find(a => a.id === areaParam || a.code.toLowerCase() === areaParam.toLowerCase());
        }
      } catch {
        // fallback regex
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

    if (matchedArea) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
      onSelectArea(matchedArea);
      onClose();
    } else {
      // Pick first matching or default area
      if (areas.length > 0) {
        onSelectArea(areas[0]);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-base">Pindai QR Area Piket</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Viewport */}
        <div className="p-4 bg-slate-950 flex flex-col items-center justify-center min-h-[300px] relative">
          <div id="qr-reader-container" className="w-full max-w-[280px] overflow-hidden rounded-xl" />

          {/* Scanner Overlay Box */}
          {isScanning && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 border-2 border-red-500 rounded-2xl relative animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white" />
              </div>
            </div>
          )}

          {cameraError && (
            <div className="text-center p-4 max-w-xs text-slate-300">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
              <p className="text-xs text-slate-300 mb-3">{cameraError}</p>
            </div>
          )}
        </div>

        {/* Quick Selection Shortcuts (Essential for development & immediate test without printed QR) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Atau Pilih Cepat Area Piket (Simulasi Scan):
          </p>
          <div className="grid grid-cols-2 gap-2">
            {areas.map(area => (
              <button
                key={area.id}
                onClick={() => {
                  onSelectArea(area);
                  onClose();
                }}
                className="text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-red-500 hover:bg-red-50/50 transition-all text-xs font-semibold text-slate-800 flex items-center gap-2 group shadow-2xs"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 group-hover:scale-125 transition-transform" />
                <div className="truncate">
                  <span className="block truncate">{area.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{area.code}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
