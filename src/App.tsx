import React, { useState, useEffect } from 'react';
import { PiketProvider } from './context/PiketContext';
import { CrewHeader } from './components/CrewHeader';
import { SPVHeader } from './components/SPVHeader';
import { CrewPiketFlow } from './components/CrewPiketFlow';
import { RosterManager } from './components/RosterManager';
import { SPVDashboard } from './components/SPVDashboard';
import { QRStickerPrinter } from './components/QRStickerPrinter';
import { SPVAuthModal } from './components/SPVAuthModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Lock } from 'lucide-react';

function MainApp() {
  const [currentPage, setCurrentPage] = useState<'crew' | 'spv'>('crew');
  const [spvTab, setSpvTab] = useState<'dashboard' | 'roster' | 'stickers'>('dashboard');
  const [isSPVUnlocked, setIsSPVUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('piket_cihuy_spv_session') === 'unlocked';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [targetTabAfterAuth, setTargetTabAfterAuth] = useState<'dashboard' | 'roster' | 'stickers'>('dashboard');

  // Handle URL query parameters: ?page=spv or ?page=crew
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    const tabParam = params.get('tab');

    if (pageParam === 'spv' || tabParam === 'dashboard' || tabParam === 'roster' || tabParam === 'stickers') {
      if (tabParam === 'roster' || tabParam === 'stickers') {
        setSpvTab(tabParam);
      }
      if (isSPVUnlocked) {
        setCurrentPage('spv');
      } else {
        setTargetTabAfterAuth(
          tabParam === 'roster' ? 'roster' : tabParam === 'stickers' ? 'stickers' : 'dashboard'
        );
        setIsAuthModalOpen(true);
      }
    }
  }, [isSPVUnlocked]);

  const handleOpenSPV = (tab: 'dashboard' | 'roster' | 'stickers' = 'dashboard') => {
    if (isSPVUnlocked) {
      setSpvTab(tab);
      setCurrentPage('spv');
    } else {
      setTargetTabAfterAuth(tab);
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsSPVUnlocked(true);
    sessionStorage.setItem('piket_cihuy_spv_session', 'unlocked');
    setIsAuthModalOpen(false);
    setSpvTab(targetTabAfterAuth);
    setCurrentPage('spv');
  };

  const handleExitSPV = () => {
    setIsSPVUnlocked(false);
    sessionStorage.removeItem('piket_cihuy_spv_session');
    setCurrentPage('crew');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* 1. SEPARATED PAGE: CREW PIKET SUBMISSION PAGE */}
      {currentPage === 'crew' && (
        <>
          <CrewHeader onOpenSPV={() => handleOpenSPV('dashboard')} />

          <main className="flex-1 pb-10">
            <CrewPiketFlow
              onGoToDashboard={() => handleOpenSPV('dashboard')}
              onGoToRoster={() => handleOpenSPV('roster')}
            />
          </main>

          {/* Minimalist Crew Footer */}
          <footer className="bg-white border-t border-slate-200 py-3.5 px-4 text-center text-xs text-slate-400 no-print">
            <div className="max-w-3xl mx-auto flex items-center justify-between text-[11px]">
              <span>Hara Chicken • Sistem Piket Kru</span>
              <button
                onClick={() => handleOpenSPV('dashboard')}
                className="hover:text-slate-700 flex items-center gap-1 font-medium"
              >
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Portal Kepala Outlet</span>
              </button>
            </div>
          </footer>
        </>
      )}

      {/* 2. SEPARATED PAGE: KEPALA OUTLET MANAGEMENT & DASHBOARD PORTAL */}
      {currentPage === 'spv' && (
        <>
          <SPVHeader
            spvTab={spvTab}
            setSpvTab={setSpvTab}
            onExitSPV={handleExitSPV}
          />

          <main className="flex-1 pb-12">
            {spvTab === 'dashboard' && <SPVDashboard onLockSPV={handleExitSPV} />}
            {spvTab === 'roster' && <RosterManager />}
            {spvTab === 'stickers' && <QRStickerPrinter />}
          </main>

          {/* Kepala Outlet Portal Footer */}
          <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500 no-print">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="font-semibold text-slate-700">
                Portal Kepala Outlet Hara Chicken • Ummu Sallaamah
              </span>
              <button
                onClick={handleExitSPV}
                className="text-slate-500 hover:text-slate-800 underline text-[11px]"
              >
                Kembali ke Halaman Kru
              </button>
            </div>
          </footer>
        </>
      )}

      {/* SPV PIN Authentication Modal */}
      <SPVAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PiketProvider>
        <MainApp />
      </PiketProvider>
    </ErrorBoundary>
  );
}
