import React, { useState, useEffect } from 'react';
import { PiketProvider, usePiket } from './context/PiketContext';
import { Navbar } from './components/Navbar';
import { CrewPiketFlow } from './components/CrewPiketFlow';
import { RosterManager } from './components/RosterManager';
import { SPVDashboard } from './components/SPVDashboard';
import { QRStickerPrinter } from './components/QRStickerPrinter';

function MainApp() {
  const [currentView, setCurrentView] = useState<'crew' | 'spv'>('crew');
  const [spvTab, setSpvTab] = useState<'dashboard' | 'roster' | 'stickers'>('dashboard');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const tabParam = params.get('tab');
    const areaParam = params.get('area');

    if (viewParam === 'spv' || tabParam === 'dashboard' || tabParam === 'roster' || tabParam === 'stickers') {
      setCurrentView('spv');
      if (tabParam === 'roster' || tabParam === 'stickers' || tabParam === 'dashboard') {
        setSpvTab(tabParam);
      }
    } else if (areaParam) {
      setCurrentView('crew');
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Header & View Switcher */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        spvTab={spvTab}
        setSpvTab={setSpvTab}
      />

      {/* Main Page Content */}
      <main className="flex-1 pb-12">
        {/* PAGE 1: DEDICATED CREW SUBMISSION PAGE */}
        {currentView === 'crew' && (
          <CrewPiketFlow
            onGoToDashboard={() => {
              setCurrentView('spv');
              setSpvTab('dashboard');
            }}
          />
        )}

        {/* PAGE 2: DEDICATED SPV & MANAGEMENT PORTAL */}
        {currentView === 'spv' && (
          <div>
            {spvTab === 'dashboard' && <SPVDashboard />}
            {spvTab === 'roster' && <RosterManager />}
            {spvTab === 'stickers' && <QRStickerPrinter />}
          </div>
        )}
      </main>

      {/* Clean Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-[11px] text-slate-400 no-print">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-600">
            Piket Cihuy • Sistem Piket QR Code & Verifikasi AI
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView(currentView === 'crew' ? 'spv' : 'crew')}
              className="text-amber-800 hover:underline font-bold"
            >
              {currentView === 'crew' ? 'Buka Portal SPV' : 'Kembali ke Halaman Kru'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <PiketProvider>
      <MainApp />
    </PiketProvider>
  );
}
