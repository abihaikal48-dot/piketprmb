import React from 'react';
import {
  QrCode,
  BarChart3,
  ClipboardList,
  Printer,
  Clock,
  Sheet,
  ArrowLeft,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { usePiket } from '../context/PiketContext';
import { ShiftType } from '../types/piket';

interface NavbarProps {
  currentView: 'crew' | 'spv';
  setCurrentView: (view: 'crew' | 'spv') => void;
  spvTab: 'dashboard' | 'roster' | 'stickers';
  setSpvTab: (tab: 'dashboard' | 'roster' | 'stickers') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  spvTab,
  setSpvTab,
}) => {
  const { activeShift, setActiveShift, isSheetsConnected, spreadsheetInfo } = usePiket();

  const toggleShift = () => {
    const nextShift: ShiftType =
      activeShift === 'Pagi (08:00 - 15:00)'
        ? 'Sore / Closing (15:00 - 22:30)'
        : 'Pagi (08:00 - 15:00)';
    setActiveShift(nextShift);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs no-print">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow-xs font-black text-lg">
              🍗
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                  Piket Cihuy
                </span>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-md uppercase">
                  {currentView === 'crew' ? 'Portal Kru' : 'Portal SPV'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">
                Piket QR Code, AI Vision & Google Sheets
              </p>
            </div>
          </div>

          {/* Quick Actions & View Switcher */}
          <div className="flex items-center gap-2">
            {/* Shift Pill */}
            <button
              onClick={toggleShift}
              title="Ganti Shift"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{activeShift.split(' ')[0]}</span>
            </button>

            {/* Sheets Indicator Pill */}
            {isSheetsConnected && spreadsheetInfo && (
              <a
                href={spreadsheetInfo.url}
                target="_blank"
                rel="noreferrer"
                title="Google Spreadsheet Terhubung"
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <Sheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sheets ON</span>
              </a>
            )}

            {/* Big Switcher Button: Mode Kru <-> Mode SPV */}
            {currentView === 'crew' ? (
              <button
                onClick={() => setCurrentView('spv')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
              >
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Dashboard SPV</span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentView('crew')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Halaman Kru (Scan QR)</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-bar ONLY in SPV Portal */}
        {currentView === 'spv' && (
          <div className="flex space-x-1 border-t border-slate-100 py-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setSpvTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                spvTab === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Monitoring & Sheets</span>
            </button>

            <button
              onClick={() => setSpvTab('roster')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                spvTab === 'roster'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Buat Jadwal Piket</span>
            </button>

            <button
              onClick={() => setSpvTab('stickers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                spvTab === 'stickers'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Stiker QR</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
