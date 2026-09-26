import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Printer, Download, QrCode, Globe, Info, Check } from 'lucide-react';
import { usePiket } from '../context/PiketContext';
import { PiketArea } from '../types/piket';
import { AreaIcon } from './AreaIcon';

export const QRStickerPrinter: React.FC = () => {
  const { areas } = usePiket();
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [stickerSize, setStickerSize] = useState<'standard' | 'large' | 'compact'>('standard');
  const [baseUrl, setBaseUrl] = useState<string>('https://piket-cihuy.vercel.app');

  useEffect(() => {
    // If running in browser and has origin, user can use current or vercel URL
    const generateAllQrs = async () => {
      const generated: Record<string, string> = {};
      const cleanBase = baseUrl.trim().replace(/\/+$/, '');

      for (const area of areas) {
        // Direct link that opens app with that area pre-selected
        const targetUrl = `${cleanBase}/?area=${area.id}`;
        try {
          const url = await QRCode.toDataURL(targetUrl, {
            width: 320,
            margin: 2,
            color: {
              dark: '#000000',
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
    link.download = `QR_Stiker_PiketCihuy_${area.code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 sm:py-6 space-y-4">
      {/* Control bar (No Print) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Stiker Fisik Outlet
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Cetak Stiker QR Piket Cihuy
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Stiker untuk ditempel di tiap titik meja/area piket. Kru scan langsung dengan kamera HP.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sticker Size Options */}
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setStickerSize('compact')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                stickerSize === 'compact' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              6x6 cm
            </button>
            <button
              onClick={() => setStickerSize('standard')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                stickerSize === 'standard' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              8x8 cm
            </button>
            <button
              onClick={() => setStickerSize('large')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                stickerSize === 'large' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              10x10 cm
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak (Print)</span>
          </button>
        </div>
      </div>

      {/* Target URL Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2 no-print text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-500 font-medium shrink-0">Link QR:</span>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://piket-cihuy.vercel.app"
            className="w-full text-xs font-mono font-semibold px-2 py-1 rounded bg-slate-50 border border-slate-200 text-slate-800"
          />
        </div>
        <button
          onClick={() => setBaseUrl(window.location.origin)}
          className="text-[11px] text-slate-500 hover:text-slate-800 underline"
        >
          Gunakan URL saat ini
        </button>
      </div>

      {/* STICKER PRINT GRID (Clean, modern, crisp, no emojis) */}
      <div
        className={`grid gap-4 ${
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
            className="bg-white rounded-2xl overflow-hidden border border-slate-300 print:border-black p-4 flex flex-col justify-between shadow-2xs print:shadow-none print:break-inside-avoid relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 print:border-black">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-slate-900 print:bg-black text-white flex items-center justify-center font-bold text-xs">
                  PC
                </div>
                <div>
                  <h3 className="font-bold text-xs tracking-tight text-slate-900">
                    PIKET CIHUY
                  </h3>
                </div>
              </div>

              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 print:bg-slate-200 text-slate-800 border border-slate-200">
                {area.code}
              </span>
            </div>

            {/* Area Name & Icon */}
            <div className="text-center my-2">
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-700 mb-1">
                <AreaIcon categoryOrId={area.id} className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                {area.name}
              </h2>
            </div>

            {/* QR Code */}
            <div className="bg-white p-2 rounded-xl border border-slate-200 print:border-black flex flex-col items-center justify-center mx-auto my-1">
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
                <div className="w-36 h-36 flex items-center justify-center text-slate-400">
                  <QrCode className="w-8 h-8 animate-pulse" />
                </div>
              )}
              <span className="text-[9px] font-mono text-slate-500 font-bold mt-1">
                SCAN DENGAN KAMERA HP
              </span>
            </div>

            {/* Bottom Slogan */}
            <div className="mt-2 pt-2 border-t border-slate-100 text-center">
              <span className="text-[10px] font-semibold text-slate-600">
                Kebersihan Terjaga, Piket Cihuy!
              </span>
            </div>

            {/* Non-print action */}
            <div className="mt-2 pt-1 flex items-center justify-end no-print">
              <button
                onClick={() => handleDownloadSingleQR(area)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
              >
                <Download className="w-3 h-3" />
                <span>Simpan PNG</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
