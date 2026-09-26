import React from 'react';
import { QrCode, ClipboardList, BarChart3, Printer, Clock, FileSpreadsheet, Lock, Unlock, Check } from 'lucide-react';
import { usePiket } from '../context/PiketContext';
import { ShiftType } from '../types/piket';

interface NavbarProps {
  activeTab: 'scan' | 'roster' | 'dashboard' | 'stickers';
  setActiveTab: (tab: 'scan' | 'roster' | 'dashboard' | 'stickers') => void;
  isSPVUnlocked: boolean;
  onRequestSPVAccess: () => void;
  onLockSPV: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isSPVUnlocked,
  onRequestSPVAccess,
  onLockSPV
}) => {
  const { activeShift, setActiveShift, isSheetsConnected, spreadsheetInfo } = usePiket();

  const toggleShift = () => {
    const nextShift: ShiftType =
      activeShift === 'Pagi (08:00 - 15:00)'
        ? 'Sore / Closing (15:00 - 22:30)'
        : 'Pagi (08:00 - 15:00)';
    setActiveShift(nextShift);
  };

  const handleTabClick = (tab: 'scan' | 'roster' | 'dashboard' | 'stickers') => {
    if ((tab === 'dashboard' || tab === 'roster') && !isSPVUnlocked) {
      onRequestSPVAccess();
      return;
    }
    setActiveTab(tab);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand Logo & Name */}
          <div
            onClick={() => setActiveTab('scan')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm tracking-tight">
              PC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900 tracking-tight">Piket Cihuy</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Outlet
                </span>
              </div>
            </div>
          </div>

          {/* Quick Controls: Shift & SPV Lock Button */}
          <div className="flex items-center gap-2">
            {/* Shift Pill */}
            <button
              onClick={toggleShift}
              title="Klik untuk ganti shift aktif"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-200"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Shift:</span>
              <span className="text-slate-900 font-bold">{activeShift.split(' ')[0]}</span>
            </button>

            {/* Sheets Status Pill */}
            {isSheetsConnected && spreadsheetInfo ? (
              <a
                href={spreadsheetInfo.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                title="Buka Google Spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">Sheets Terhubung</span>
                <span className="md:hidden">Sheets</span>
              </a>
            ) : null}

            {/* SPV Lock Status Toggle */}
            {isSPVUnlocked ? (
              <button
                onClick={onLockSPV}
                title="Klik untuk mengunci kembali akses SPV"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">SPV Terbuka</span>
                <span className="text-[10px] text-slate-400 font-normal ml-0.5">(Kunci)</span>
              </button>
            ) : (
              <button
                onClick={onRequestSPVAccess}
                title="Buka akses Dashboard SPV dengan PIN"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-slate-300" />
                <span>SPV</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-t border-slate-100 py-1.5 overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'scan'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Kirim Piket</span>
          </button>

          <button
            onClick={() => handleTabClick('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Dashboard SPV</span>
            {!isSPVUnlocked && <Lock className="w-3 h-3 text-slate-400 ml-0.5" />}
          </button>

          <button
            onClick={() => handleTabClick('roster')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'roster'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Jadwal Piket</span>
            {!isSPVUnlocked && <Lock className="w-3 h-3 text-slate-400 ml-0.5" />}
          </button>

          <button
            onClick={() => setActiveTab('stickers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'stickers'
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
