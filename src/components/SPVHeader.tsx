import React from 'react';
import { BarChart3, ClipboardList, Printer, ArrowLeft, Lock, FileSpreadsheet } from 'lucide-react';
import { usePiket } from '../context/PiketContext';

interface SPVHeaderProps {
  spvTab: 'dashboard' | 'roster' | 'stickers';
  setSpvTab: (tab: 'dashboard' | 'roster' | 'stickers') => void;
  onExitSPV: () => void;
}

export const SPVHeader: React.FC<SPVHeaderProps> = ({ spvTab, setSpvTab, onExitSPV }) => {
  const { isSheetsConnected, spreadsheetInfo } = usePiket();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs no-print">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand & Portal Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onExitSPV}
              className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              title="Kembali ke Halaman Kirim Piket Kru"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Halaman Kru</span>
            </button>

            <span className="text-slate-300">|</span>

            <div>
              <span className="font-bold text-sm text-slate-900">Dashboard SPV</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {isSheetsConnected && spreadsheetInfo && (
              <a
                href={spreadsheetInfo.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                title="Buka Google Spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Sheets</span>
              </a>
            )}

            <button
              onClick={onExitSPV}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Kunci</span>
            </button>
          </div>
        </div>

        {/* SPV Sub-Tabs */}
        <div className="flex space-x-1 border-t border-slate-100 py-1.5 overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setSpvTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              spvTab === 'dashboard'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Monitoring & Sheets</span>
          </button>

          <button
            onClick={() => setSpvTab('roster')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              spvTab === 'roster'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Jadwal Piket</span>
          </button>

          <button
            onClick={() => setSpvTab('stickers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              spvTab === 'stickers'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
