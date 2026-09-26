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
    <div className="min-h-screen bg-zinc-50/70 flex flex-col font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white">
      {/* 1. SEPARATED PAGE: CREW PIKET SUBMISSION PAGE */}
      {currentPage === 'crew' && (
        <>
          <CrewHeader onOpenSPV={() => handleOpenSPV('dashboard')} />

          <main className="flex-1 pb-12">
            <CrewPiketFlow
              onGoToDashboard={() => handleOpenSPV('dashboard')}
              onGoToRoster={() => handleOpenSPV('roster')}
            />
          </main>

          {/* Minimalist Crew Footer */}
          <footer className="bg-white/80 border-t border-zinc-200/80 py-4 px-4 text-xs text-zinc-400 no-print">
            <div className="max-w-4xl mx-auto flex items-center justify-between text-[11px]">
              <span className="font-normal text-zinc-500">Hara Chicken · Sistem Piket Kebersihan Outlet</span>
              <button
                onClick={() => handleOpenSPV('dashboard')}
                className="hover:text-zinc-900 flex items-center gap-1.5 font-medium transition-colors cursor-pointer text-zinc-600"
              >
                <Lock className="w-3 h-3 text-zinc-400" />
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

          <main className="flex-1 pb-14">
            {spvTab === 'dashboard' && <SPVDashboard onLockSPV={handleExitSPV} />}
            {spvTab === 'roster' && <RosterManager />}
            {spvTab === 'stickers' && <QRStickerPrinter />}
          </main>

          {/* Kepala Outlet Portal Footer */}
          <footer className="bg-white/80 border-t border-zinc-200/80 py-4 px-4 text-xs text-zinc-500 no-print">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
              <span className="font-medium text-zinc-600">
                Portal Kepala Outlet Hara Chicken · Ummu Sallaamah
              </span>
              <button
                onClick={handleExitSPV}
                className="text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
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
