import React from 'react';
import { Clock, Lock, Sparkles } from 'lucide-react';
import { usePiket } from '../context/PiketContext';
import { ShiftType } from '../types/piket';

interface CrewHeaderProps {
  onOpenSPV: () => void;
}

export const CrewHeader: React.FC<CrewHeaderProps> = ({ onOpenSPV }) => {
  const { activeShift, setActiveShift } = usePiket();

  const toggleShift = () => {
    const nextShift: ShiftType =
      activeShift === 'Pagi (08:00 - 15:00)'
        ? 'Sore / Closing (15:00 - 22:30)'
        : 'Pagi (08:00 - 15:00)';
    setActiveShift(nextShift);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs no-print">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-2xs">
              HC
            </div>
            <div>
              <span className="font-bold text-base text-slate-900 tracking-tight">Hara Chicken</span>
              <p className="text-[10px] text-slate-500 font-medium">Piket Kru Outlet</p>
            </div>
          </div>

          {/* Right Controls: Shift Switcher & Kepala Outlet Portal Link */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleShift}
              title="Ganti Shift Aktif"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-200"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{activeShift.split(' ')[0]}</span>
            </button>

            <button
              onClick={onOpenSPV}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer shadow-2xs"
            >
              <Lock className="w-3 h-3 text-slate-300" />
              <span>Kepala Outlet</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
