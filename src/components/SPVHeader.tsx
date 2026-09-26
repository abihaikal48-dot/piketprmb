import React from 'react';
import { BarChart3, CalendarDays, Printer, ArrowLeft, Lock, ExternalLink } from 'lucide-react';
import { usePiket } from '../context/PiketContext';

interface SPVHeaderProps {
  spvTab: 'dashboard' | 'roster' | 'stickers';
  setSpvTab: (tab: 'dashboard' | 'roster' | 'stickers') => void;
  onExitSPV: () => void;
}

export const SPVHeader: React.FC<SPVHeaderProps> = ({ spvTab, setSpvTab, onExitSPV }) => {
  const { isSheetsConnected, spreadsheetInfo, isFirebaseConnected } = usePiket();

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-zinc-200/80 sticky top-0 z-30 no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-15">
          {/* Brand & Portal Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onExitSPV}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors py-1.5 pr-2 rounded-lg"
              title="Kembali ke Halaman Kirim Piket Kru"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Halaman Kru</span>
            </button>

            <span className="text-zinc-200">|</span>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-zinc-900 tracking-tight">Kepala Outlet</span>
              <span className="text-xs text-zinc-500 hidden sm:inline">· Ummu Sallaamah</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {isFirebaseConnected && (
              <div 
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/70"
                title="Tersinkronisasi Realtime via Google Firebase"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Firebase Realtime</span>
              </div>
            )}

            {isSheetsConnected && spreadsheetInfo && (
              <a
                href={spreadsheetInfo.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 transition-colors"
                title="Buka Google Spreadsheet"
              >
                <span>Google Sheets</span>
                <ExternalLink className="w-3 h-3 text-emerald-600" />
              </a>
            )}

            <button
              onClick={onExitSPV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Kunci Akses</span>
            </button>
          </div>
        </div>

        {/* Modern Segmented Navigation Tabs */}
        <div className="flex items-center gap-1 pb-2.5 pt-0.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSpvTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              spvTab === 'dashboard'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Monitoring & Sheets</span>
          </button>

          <button
            onClick={() => setSpvTab('roster')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              spvTab === 'roster'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Jadwal Piket</span>
          </button>

          <button
            onClick={() => setSpvTab('stickers')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              spvTab === 'stickers'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Stiker QR</span>
          </button>
        </div>
      </div>
    </header>
  );
};
