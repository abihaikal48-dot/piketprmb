import React, { useState, useEffect } from 'react';
import { PiketProvider, usePiket } from './context/PiketContext';
import { Navbar } from './components/Navbar';
import { CrewPiketFlow } from './components/CrewPiketFlow';
import { RosterManager } from './components/RosterManager';
import { SPVDashboard } from './components/SPVDashboard';
import { QRStickerPrinter } from './components/QRStickerPrinter';

function MainApp() {
  const [activeTab, setActiveTab] = useState<'scan' | 'roster' | 'dashboard' | 'stickers'>('scan');
  const { selectAreaById } = usePiket();

  // Handle URL query param: ?area=fryer-station or ?tab=dashboard
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'roster' || tabParam === 'dashboard' || tabParam === 'stickers') {
      setActiveTab(tabParam);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'scan' && (
          <CrewPiketFlow
            onGoToDashboard={() => setActiveTab('dashboard')}
            onGoToRoster={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'roster' && <RosterManager />}

        {activeTab === 'dashboard' && <SPVDashboard />}

        {activeTab === 'stickers' && <QRStickerPrinter />}
      </main>

      {/* Footer (Hidden when printing stickers) */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800">Hara Chicken</span>
            <span>•</span>
            <span>Sistem Piket Kru Digital & Kepatuhan SOP</span>
          </div>

          <p className="text-slate-400">
            Scan QR • AI Verification • Real-time Google Sheets Sync
          </p>
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
