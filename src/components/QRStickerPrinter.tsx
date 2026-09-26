import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Printer, Download, Sparkles, QrCode, Info, CheckCircle2 } from 'lucide-react';
import { usePiket } from '../context/PiketContext';
import { PiketArea } from '../types/piket';

export const QRStickerPrinter: React.FC = () => {
  const { areas } = usePiket();
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [stickerSize, setStickerSize] = useState<'standard' | 'large' | 'compact'>('standard');

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const generateAllQrs = async () => {
      const generated: Record<string, string> = {};
      for (const area of areas) {
        // Direct link that opens app with that area selected
        const targetUrl = `${origin}/?area=${area.id}`;
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
  }, [areas]);

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
      {/* Non-print control bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Printer className="w-3.5 h-3.5" />
            Cetak Stiker Fisik Outlet
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Stiker QR Code Titik Piket Hara Chicken
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Cetak stiker ini di kertas stiker label atau A4, lalu tempelkan di masing-masing titik area (Meja Fryer, Kasir, Dining, Toilet). Kru cukup memindai stiker dengan kamera HP untuk lapor piket.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sticker Size Options */}
          <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setStickerSize('compact')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                stickerSize === 'compact' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Kecil (6x6 cm)
            </button>
            <button
              onClick={() => setStickerSize('standard')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                stickerSize === 'standard' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Standar (8x8 cm)
            </button>
            <button
              onClick={() => setStickerSize('large')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                stickerSize === 'large' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Besar (10x10 cm)
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Semua Stiker (Print)</span>
          </button>
        </div>
      </div>

      {/* Guide Note (No Print) */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900 no-print">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Panduan Pemasangan Stiker Fisik di Outlet:</p>
          <p className="mt-0.5 text-amber-800 leading-relaxed">
            Tempelkan stiker pada tempat yang bersih dan terlindung dari cipratan minyak langsung (disarankan menggunakan plastik laminasi atau stiker vinyl tahan air). Kru dapat memindai kode menggunakan kamera bawaan HP (iOS / Android) atau langsung melalui tombol scan di aplikasi ini.
          </p>
        </div>
      </div>

      {/* STICKER PRINT GRID (Formatted for Paper Print & Screen View) */}
      <div
        className={`grid gap-6 ${
          stickerSize === 'compact'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : stickerSize === 'large'
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {areas.map((area) => (
          <div
            key={area.id}
            className="bg-white rounded-3xl overflow-hidden border-2 border-dashed border-slate-300 print:border-black p-5 flex flex-col justify-between shadow-xs print:shadow-none print:break-inside-avoid relative"
          >
            {/* Header Badge */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-red-600 print:border-black">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-600 print:bg-black text-white flex items-center justify-center font-extrabold text-sm">
                  H
                </div>
                <div>
                  <h3 className="font-extrabold text-xs tracking-tight text-slate-900 uppercase">
                    HARA CHICKEN
                  </h3>
                  <span className="text-[10px] text-red-600 print:text-black font-bold tracking-wider uppercase block">
                    TITIK KONTROL PIKET
                  </span>
                </div>
              </div>

              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-100 print:bg-slate-200 text-slate-900 border border-slate-300">
                {area.code}
              </span>
            </div>

            {/* Area Name */}
            <div className="text-center my-3">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
                {area.name}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Kategori: {area.category}
              </p>
            </div>

            {/* QR Code Centerpiece */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 print:border-black flex flex-col items-center justify-center mx-auto my-2">
              {qrDataUrls[area.id] ? (
                <img
                  src={qrDataUrls[area.id]}
                  alt={`QR ${area.name}`}
                  className={`${
                    stickerSize === 'compact'
                      ? 'w-36 h-36'
                      : stickerSize === 'large'
                      ? 'w-48 h-48'
                      : 'w-40 h-40'
                  } object-contain`}
                />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center text-slate-400">
                  <QrCode className="w-12 h-12 animate-pulse" />
                </div>
              )}
              <span className="text-[10px] font-mono text-slate-400 font-bold mt-1">
                SCAN DENGAN KAMERA HP
              </span>
            </div>

            {/* Cleanliness SOP bullets */}
            <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-600 space-y-1">
              <p className="font-bold text-slate-800 text-[11px]">Standar Titik Ini:</p>
              {area.standardChecklist.slice(0, 2).map((chk, i) => (
                <p key={i} className="flex items-start gap-1">
                  <span className="text-red-500 font-bold">•</span>
                  <span>{chk}</span>
                </p>
              ))}
            </div>

            {/* Bottom Slogan */}
            <div className="mt-3 pt-2 border-t border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                Kebersihan Terjaga, Ayam Crispy Juara!
              </span>
            </div>

            {/* Non-print action button */}
            <div className="mt-3 pt-2 flex items-center justify-end gap-2 no-print">
              <button
                onClick={() => handleDownloadSingleQR(area)}
                className="text-xs font-semibold text-slate-600 hover:text-red-600 flex items-center gap-1"
                title="Unduh file PNG QR Code"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Simpan Gambar</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
