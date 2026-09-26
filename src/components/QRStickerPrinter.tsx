import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Printer, Download, QrCode, Globe } from 'lucide-react';
import { usePiket } from '../context/PiketContext';
import { PiketArea } from '../types/piket';
import { AreaIcon } from './AreaIcon';

export const QRStickerPrinter: React.FC = () => {
  const { areas } = usePiket();
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [stickerSize, setStickerSize] = useState<'standard' | 'large' | 'compact'>('standard');
  const [baseUrl, setBaseUrl] = useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.origin : 'https://piket-cihuy.vercel.app';
  });

  useEffect(() => {
    const generateAllQrs = async () => {
      const generated: Record<string, string> = {};
      const cleanBase = baseUrl.trim().replace(/\/+$/, '');

      for (const area of areas) {
        const targetUrl = `${cleanBase}/?area=${area.id}`;
        try {
          const url = await QRCode.toDataURL(targetUrl, {
            width: 360,
            margin: 2,
            color: {
              dark: '#18181b',
              light: '#ffffff',
            },
            errorCorrectionLevel: 'H',
          });
          generated[area.id] = url;
        } catch (e) {
          console.error('Failed to generate QR for', area.id, e);
        }
      }
      setQrDataUrls(generated);
    };

    generateAllQrs();
  }, [areas, baseUrl]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSingleQR = (area: PiketArea) => {
    const dataUrl = qrDataUrls[area.id];
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QR_Stiker_HaraChicken_${area.code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Control bar (No Print) */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <span className="text-xs text-zinc-500 font-medium block mb-1">
            Stiker Fisik Outlet
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight">
            Cetak Stiker QR Area Piket
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-md">
            Cetak dan tempel stiker ini di 6 titik meja atau area outlet. Kru cukup scan dengan kamera HP untuk lapor piket.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sticker Size Options */}
          <div className="flex rounded-xl border border-zinc-200 p-0.5 bg-zinc-50 text-xs">
            <button
              onClick={() => setStickerSize('compact')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                stickerSize === 'compact' ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              6×6 cm
            </button>
            <button
              onClick={() => setStickerSize('standard')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                stickerSize === 'standard' ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              8×8 cm
            </button>
            <button
              onClick={() => setStickerSize('large')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                stickerSize === 'large' ? 'bg-zinc-900 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              10×10 cm
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Stiker</span>
          </button>
        </div>
      </div>

      {/* Target URL Bar */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="text-zinc-500 font-medium shrink-0">Alamat Web:</span>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://piket-cihuy.vercel.app"
            className="w-full text-xs font-mono px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800 focus:outline-hidden focus:border-zinc-400"
          />
        </div>
        <button
          onClick={() => setBaseUrl(window.location.origin)}
          className="text-xs text-zinc-500 hover:text-zinc-900 font-medium underline cursor-pointer"
        >
          Gunakan URL saat ini
        </button>
      </div>

      {/* STICKER PRINT GRID (Simple, Modern, Clean) */}
      <div
        className={`grid gap-4.5 ${
          stickerSize === 'compact'
            ? 'grid-cols-2 sm:grid-cols-3'
            : stickerSize === 'large'
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {areas.map((area) => (
          <div
            key={area.id}
            className="bg-white rounded-2xl overflow-hidden border border-zinc-300 print:border-zinc-900 p-5 flex flex-col justify-between shadow-xs print:shadow-none print:break-inside-avoid relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 print:border-zinc-900">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-bold text-xs">
                  HC
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-zinc-900 tracking-tight">
                    HARA CHICKEN
                  </h3>
                  <p className="text-[10px] text-zinc-400">Piket Kebersihan</p>
                </div>
              </div>

              <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-200">
                {area.code}
              </span>
            </div>

            {/* Area Name & Icon */}
            <div className="text-center my-3">
              <div className="w-8 h-8 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-700 mb-2">
                <AreaIcon categoryOrId={area.id} className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-900 leading-snug">
                {area.name}
              </h2>
            </div>

            {/* QR Code */}
            <div className="bg-white p-2.5 rounded-2xl border border-zinc-200 print:border-zinc-800 flex flex-col items-center justify-center mx-auto my-1">
              {qrDataUrls[area.id] ? (
                <img
                  src={qrDataUrls[area.id]}
                  alt={`QR ${area.name}`}
                  className={`${
                    stickerSize === 'compact'
                      ? 'w-28 h-28'
                      : stickerSize === 'large'
                      ? 'w-44 h-44'
                      : 'w-36 h-36'
                  } object-contain`}
                />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center text-zinc-400">
                  <QrCode className="w-8 h-8 animate-pulse" />
                </div>
              )}
              <span className="text-[9px] font-mono text-zinc-400 font-medium mt-1.5 tracking-wider uppercase">
                Scan dengan Kamera HP
              </span>
            </div>

            {/* Non-print action */}
            <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-end no-print">
              <button
                onClick={() => handleDownloadSingleQR(area)}
                className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Download PNG</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
