import React from 'react';
import { QrCode, ClipboardList, BarChart3, Printer, Sparkles, CheckCircle2, Clock, Sheet } from 'lucide-react';
import { usePiket } from '../context/PiketContext';
import { ShiftType } from '../types/piket';

interface NavbarProps {
  activeTab: 'scan' | 'roster' | 'dashboard' | 'stickers';
  setActiveTab: (tab: 'scan' | 'roster' | 'dashboard' | 'stickers') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { activeShift, setActiveShift, isSheetsConnected, spreadsheetInfo } = usePiket();

  const toggleShift = () => {
    const nextShift: ShiftType =
      activeShift === 'Pagi (08:00 - 15:00)'
        ? 'Sore / Closing (15:00 - 22:30)'
        : 'Pagi (08:00 - 15:00)';
    setActiveShift(nextShift);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-red-500/20">
              <span className="font-extrabold text-xl tracking-tighter">H</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">HARA CHICKEN</span>
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Piket Digital
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Verifikasi Kebersihan AI & Database Google Sheets
              </p>
            </div>
          </div>

          {/* Shift Switcher & Google Sheets Live Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Shift Pill */}
            <button
              onClick={toggleShift}
              title="Klik untuk ganti shift aktif"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden md:inline">Shift:</span>
              <span className="text-slate-900 font-bold">{activeShift.split(' ')[0]}</span>
            </button>

            {/* Google Sheets Pill */}
            {isSheetsConnected && spreadsheetInfo ? (
              <a
                href={spreadsheetInfo.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                title="Buka Google Spreadsheet"
              >
                <Sheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">Sheets: Terhubung</span>
                <span className="md:hidden">Sheets</span>
              </a>
            ) : (
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                title="Hubungkan ke Google Sheets di Dashboard SPV"
              >
                <Sheet className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Hubungkan Sheets</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 sm:space-x-2 border-t border-slate-100 py-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'scan'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Kirim Piket (Scan QR)</span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'roster'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Jadwal & Buat Piket</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Monitor SPV & Database</span>
          </button>

          <button
            onClick={() => setActiveTab('stickers')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'stickers'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Stiker QR</span>
          </button>
        </div>
      </div>
    </header>
  );
};
