import React from 'react';
import { Clock, Lock, Sparkles, ChevronDown } from 'lucide-react';
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

  const isPagi = activeShift.includes('Pagi');

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200/80 sticky top-0 z-30 no-print transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-15">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-950 flex items-center justify-center text-white font-bold text-xs tracking-tight shadow-xs">
              HC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-zinc-900 tracking-tight">Hara Chicken</span>
                <span className="text-[10px] text-zinc-400 font-medium hidden sm:inline">· Outlet Piket</span>
              </div>
              <p className="text-[11px] text-zinc-500 font-normal">Sistem Monitoring Kebersihan</p>
            </div>
          </div>

          {/* Right Controls: Shift Switcher & Kepala Outlet Portal Link */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleShift}
              title="Klik untuk beralih Shift"
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100/80 hover:bg-zinc-200/80 text-zinc-700 transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-900 transition-colors" />
              <span>Shift {isPagi ? 'Pagi' : 'Sore / Closing'}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            <button
              onClick={onOpenSPV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white transition-all shadow-xs active:scale-98 cursor-pointer"
            >
              <Lock className="w-3 h-3 text-zinc-300" />
              <span>Kepala Outlet</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
