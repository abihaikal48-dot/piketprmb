import React, { useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  FileSpreadsheet,
  Download,
  Eye,
  Shield,
  Sparkles,
  Lock,
  Link as LinkIcon,
  Copy,
  Plus,
  Code2,
  CheckCheck
} from 'lucide-react';
import { usePiket } from '../context/PiketContext';
import { PiketRecord } from '../types/piket';
import { signInWithGoogle } from '../services/authService';
import { AreaIcon } from './AreaIcon';
import { GOOGLE_APPS_SCRIPT_CODE, testWebhookConnection, getRecordsTsvString } from '../services/sheetsService';

interface SPVDashboardProps {
  onLockSPV?: () => void;
}

export const SPVDashboard: React.FC<SPVDashboardProps> = ({ onLockSPV }) => {
  const {
    areas,
    records,
    activeShift,
    spreadsheetInfo,
    isSheetsConnected,
    googleUserEmail,
    connectGoogleSpreadsheet,
    disconnectGoogleSpreadsheet,
    setDirectSpreadsheetLink,
    updateRecordSPVStatus,
    syncRecordToGoogleSheets,
    syncAllPendingToSheets,
    connectWebhookSpreadsheet
  } = usePiket();

  const [filterShift, setFilterShift] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<PiketRecord | null>(null);
  const [spvNoteInput, setSpvNoteInput] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [showWebhookSetup, setShowWebhookSetup] = useState(false);
  const [webhookUrlInput, setWebhookUrlInput] = useState(spreadsheetInfo?.webhookUrl || '');
  const [showChangeSheetModal, setShowChangeSheetModal] = useState(false);
  const [customSheetUrl, setCustomSheetUrl] = useState(spreadsheetInfo?.url || '');
  const [modalTab, setModalTab] = useState<'webhook' | 'copy' | 'link'>('webhook');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  const isRealtimeSyncActive = !!(spreadsheetInfo?.type === 'webhook' && spreadsheetInfo.webhookUrl);

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setSyncToast('Kode Google Apps Script disalin ke clipboard!');
    setTimeout(() => setSyncToast(null), 3000);
  };

  const copyHeadersToClipboard = () => {
    const headerText = "Waktu Kirim (WIB)\tNama Kru\tShift\tArea Piket\tKode Area\tStatus Verifikasi AI\tRingkasan AI\tTemuan Detail AI\tStatus SPV\tCatatan SPV\tID Laporan";
    navigator.clipboard.writeText(headerText);
    setSyncToast('Format 11 kolom header disalin ke clipboard!');
    setTimeout(() => setSyncToast(null), 3000);
  };

  const copyTableDataToClipboard = () => {
    const tsv = getRecordsTsvString(records);
    navigator.clipboard.writeText(tsv);
    setSyncToast('Semua baris data disalin rapi! Buka Google Sheets dan tekan Ctrl+V');
    setTimeout(() => setSyncToast(null), 3500);
  };

  const handleTestWebhook = async () => {
    const url = webhookUrlInput.trim();
    if (!url) {
      setSyncToast('Masukkan URL Webhook Apps Script terlebih dahulu!');
      setTimeout(() => setSyncToast(null), 3000);
      return;
    }
    setIsTestingWebhook(true);
    try {
      await testWebhookConnection(url);
      setSyncToast('1 Baris tes berhasil dikirim ke Google Spreadsheet!');
      setTimeout(() => setSyncToast(null), 3500);
    } catch (err: any) {
      setSyncToast('Gagal mengirim data uji coba ke Webhook.');
      setTimeout(() => setSyncToast(null), 3500);
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleSaveWebhookConnection = (e: React.FormEvent) => {
    e.preventDefault();
    const webhook = webhookUrlInput.trim();
    if (!webhook) {
      setSyncToast('Masukkan URL Webhook Apps Script.');
      setTimeout(() => setSyncToast(null), 3000);
      return;
    }
    connectWebhookSpreadsheet(webhook, customSheetUrl.trim() || undefined);
    setShowChangeSheetModal(false);
    setSyncToast('Auto-Sync Google Spreadsheet aktif!');
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleSaveDirectSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSheetUrl.trim()) return;
    setDirectSpreadsheetLink(customSheetUrl.trim());
    setShowChangeSheetModal(false);
    setSyncToast('Tautan Google Spreadsheet disimpan!');
    setTimeout(() => setSyncToast(null), 3000);
  };

  // Statistics calculation for current active shift
  const today = new Date().toISOString().split('T')[0];
  const todayShiftRecords = records.filter(r => r.date === today && r.shift === activeShift);

  const completedCleanCount = todayShiftRecords.filter(
    r => r.aiVerification?.status === 'BERSIH_SESUAI_STANDAR'
  ).length;

  const needAttentionCount = todayShiftRecords.filter(
    r => r.aiVerification?.status === 'PERLU_TINDAKLANJUT'
  ).length;

  const totalAreas = areas.length;
  const progressPercent = Math.min(
    100,
    Math.round((completedCleanCount / Math.max(1, totalAreas)) * 100)
  );

  const unsyncedCount = records.filter(r => !r.syncedToSheets).length;

  // Filter records
  const filteredRecords = records.filter(record => {
    if (filterShift !== 'all' && record.shift !== filterShift) return false;
    if (filterArea !== 'all' && record.areaId !== filterArea) return false;
    if (filterStatus !== 'all' && record.aiVerification?.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCrew = record.crewName.toLowerCase().includes(q);
      const matchArea = record.areaName.toLowerCase().includes(q);
      if (!matchCrew && !matchArea) return false;
    }
    return true;
  });

  const handleGoogleConnect = async () => {
    try {
      setIsSigningIn(true);
      const { user, accessToken } = await signInWithGoogle();
      const info = await connectGoogleSpreadsheet(accessToken, user.email || 'Akun Google');
      setSyncToast(`Google Sheets terhubung: ${info.title}`);
      setTimeout(() => setSyncToast(null), 3000);
    } catch (err: any) {
      console.warn('Google connect error:', err);
      // If Vercel domain unauthorized error, guide to simple webhook
      setShowWebhookSetup(true);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrlInput.trim()) return;
    connectWebhookSpreadsheet(webhookUrlInput.trim());
    setShowWebhookSetup(false);
    setSyncToast('Google Sheets Webhook berhasil tersimpan!');
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const count = await syncAllPendingToSheets();
      setSyncToast(`Berhasil menyinkronkan ${count} laporan!`);
      setTimeout(() => setSyncToast(null), 3000);
    } catch (err) {
      console.error('Sync all error:', err);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      'Waktu & Tanggal',
      'Shift',
      'Area Piket',
      'Kode Area',
      'Petugas Kru',
      'Status AI',
      'Validasi Foto',
      'Ringkasan AI',
      'Detail Temuan AI',
      'Status Kepala Outlet',
      'Catatan Kepala Outlet (Ummu Sallaamah)',
      'ID Laporan'
    ];
    const rows = filteredRecords.map(r => {
      const isClean = r.aiVerification?.status === 'BERSIH_SESUAI_STANDAR';
      const isCorrect = r.aiVerification?.isCorrectArea ?? true;
      return [
        `"${r.date} ${r.time}"`,
        `"${r.shift}"`,
        `"${r.areaName.replace(/"/g, '""')}"`,
        `"${r.areaCode}"`,
        `"${r.crewName}"`,
        `"${isClean ? 'BERSIH (STANDAR)' : 'PERLU TINDAK LANJUT'}"`,
        `"${isCorrect ? 'SESUAI AREA' : 'FOTO DITOLAK / TIDAK SESUAI'}"`,
        `"${(r.aiVerification?.summary || '-').replace(/"/g, '""')}"`,
        `"${(r.aiVerification?.findings?.join('; ') || '-').replace(/"/g, '""')}"`,
        `"${r.spvStatus === 'APPROVED' ? 'DISETUJUI KEPALA OUTLET' : r.spvStatus === 'REVISION_NEEDED' ? 'PERLU REVISI' : 'PENDING'}"`,
        `"${(r.spvNotes || '-').replace(/"/g, '""')}"`,
        `"${r.id}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Piket_HaraChicken_Log_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-5 sm:py-6 space-y-5">
      {/* Toast Notification */}
      {syncToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Kepala Outlet: Ummu Sallaamah
            </span>
            <span className="text-[10px] font-semibold text-slate-500">• Hara Chicken</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Monitoring Piket Outlet
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau kepatuhan kebersihan 6 area piket, validasi AI visual, dan sinkronisasi Google Sheets realtime.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onLockSPV && (
            <button
              onClick={onLockSPV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Kunci Akses</span>
            </button>
          )}

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Cards (Simple & lightweight) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Kepatuhan Shift</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900">{progressPercent}%</span>
            <span className="text-[11px] text-slate-500">({completedCleanCount}/{totalAreas})</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-slate-900 h-1.5 rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Bersih Standar</span>
          <div className="mt-1">
            <span className="text-2xl font-bold text-emerald-600">{completedCleanCount}</span>
            <span className="text-[11px] text-slate-500 ml-1">Area</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Perlu Revisi</span>
          <div className="mt-1">
            <span className="text-2xl font-bold text-amber-600">{needAttentionCount}</span>
            <span className="text-[11px] text-slate-500 ml-1">Area</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500">Belum Piket</span>
          <div className="mt-1">
            <span className="text-2xl font-bold text-slate-700">
              {Math.max(0, totalAreas - todayShiftRecords.length)}
            </span>
            <span className="text-[11px] text-slate-500 ml-1">Area</span>
          </div>
        </div>
      </div>

      {/* Google Sheets Connection Card */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
        isRealtimeSyncActive
          ? 'bg-emerald-50/60 border-emerald-200'
          : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className={`w-4 h-4 ${isRealtimeSyncActive ? 'text-emerald-700' : 'text-slate-600'}`} />
            <h3 className="text-sm font-bold text-slate-900">
              {spreadsheetInfo?.title || 'Google Spreadsheet Outlet'}
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isRealtimeSyncActive
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              {isRealtimeSyncActive ? 'Auto-Sync Realtime Aktif' : 'Belum Auto-Sync Realtime'}
            </span>
          </div>
          <p className="text-xs text-slate-600 max-w-xl">
            {isRealtimeSyncActive
              ? 'Setiap kali kru mengirim hasil piket & AI, data langsung otomatis bertambah ke baris Google Spreadsheet secara realtime.'
              : 'Aktifkan Webhook Google Apps Script agar setiap laporan kru otomatis tersimpan ke baris Google Spreadsheet Anda tanpa repot.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {spreadsheetInfo?.url && (
            <a
              href={spreadsheetInfo.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs transition-colors shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Buka Sheet</span>
            </a>
          )}

          <button
            onClick={() => {
              setModalTab('webhook');
              setShowChangeSheetModal(true);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-colors shadow-2xs ${
              isRealtimeSyncActive
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>{isRealtimeSyncActive ? 'Pengaturan Auto-Sync' : 'Hubungkan Auto-Sync (1 Menit)'}</span>
          </button>

          <button
            onClick={copyTableDataToClipboard}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
            title="Salin seluruh baris tabel untuk ditempel langsung (Ctrl+V) di Google Sheets"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Salin Data (Ctrl+V)</span>
          </button>

          {isRealtimeSyncActive && unsyncedCount > 0 && (
            <button
              disabled={isSyncingAll}
              onClick={handleSyncAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-semibold text-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>Sync Ulang ({unsyncedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal: Pengaturan Google Spreadsheet & Auto-Sync */}
      {showChangeSheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pengaturan Google Spreadsheet</h3>
                  <p className="text-[11px] text-slate-500">Pilih metode sinkronisasi data piket ke Google Sheets</p>
                </div>
              </div>
              <button onClick={() => setShowChangeSheetModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 mt-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setModalTab('webhook')}
                className={`py-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                  modalTab === 'webhook'
                    ? 'border-emerald-600 text-emerald-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Auto-Sync Realtime (Apps Script)</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('copy')}
                className={`py-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                  modalTab === 'copy'
                    ? 'border-emerald-600 text-emerald-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Cepat (1 Klik)</span>
              </button>
            </div>

            {/* Tab 1: Webhook Auto-Sync (Recommended) */}
            {modalTab === 'webhook' && (
              <div className="mt-4 space-y-4 text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 space-y-1.5">
                  <p className="font-bold text-[11px] uppercase tracking-wide text-emerald-800">
                    Cara Menghubungkan Auto-Sync (Hanya 1 Menit):
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-emerald-900">
                    <li>Buka Google Spreadsheet Anda $\rightarrow$ klik menu <strong>Ekstensi</strong> $\rightarrow$ <strong>Apps Script</strong>.</li>
                    <li>Hapus semua teks yang ada, lalu tempel kode skrip di bawah ini.</li>
                    <li>Klik tombol biru <strong>Terapkan (Deploy)</strong> $\rightarrow$ <strong>Deployment baru</strong> $\rightarrow$ pilih jenis <strong>Aplikasi web</strong> $\rightarrow$ ubah *Siapa yang memiliki akses* menjadi <strong>Siapa saja (Anyone)</strong> $\rightarrow$ Salin <strong>URL Aplikasi Web</strong> dan tempel di form berikut.</li>
                  </ol>
                </div>

                {/* Copy script button */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 text-white text-xs">
                  <span className="font-mono text-[11px] text-slate-300 truncate">Kode Skrip Otomatisasi (doPost)</span>
                  <button
                    type="button"
                    onClick={copyScriptToClipboard}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shrink-0"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Salin Kode Skrip</span>
                  </button>
                </div>

                <form onSubmit={handleSaveWebhookConnection} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      1. URL Webhook Apps Script (Berakhiran /exec):
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={webhookUrlInput}
                      onChange={(e) => setWebhookUrlInput(e.target.value)}
                      className="w-full text-xs font-mono rounded-xl border border-slate-300 p-2.5 text-slate-900 bg-white focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      2. Tautan Google Spreadsheet (Untuk Tombol Buka Sheet):
                    </label>
                    <input
                      type="text"
                      placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                      value={customSheetUrl}
                      onChange={(e) => setCustomSheetUrl(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-900 bg-white"
                    />
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={isTestingWebhook || !webhookUrlInput.trim()}
                      onClick={handleTestWebhook}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCheck className={`w-3.5 h-3.5 text-emerald-600 ${isTestingWebhook ? 'animate-pulse' : ''}`} />
                      <span>{isTestingWebhook ? 'Mengirim Tes...' : 'Kirim Baris Uji Coba'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowChangeSheetModal(false)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs"
                      >
                        Simpan & Aktifkan Auto-Sync
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 2: Copy to Clipboard / Export */}
            {modalTab === 'copy' && (
              <div className="mt-4 space-y-4 text-xs text-slate-600">
                <p>
                  Jika Anda belum sempat memasang Apps Script, Anda dapat langsung menyalin seluruh data laporan dalam format tabel dan menempelkannya (<kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-300">Ctrl + V</kbd>) ke Google Spreadsheet kapan saja:
                </p>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={copyTableDataToClipboard}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4 text-emerald-400" />
                    <span>Salin Semua Baris Data (Siap Tempel Ctrl+V ke Sheets)</span>
                  </button>

                  <button
                    type="button"
                    onClick={copyHeadersToClipboard}
                    className="w-full py-2 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                    <span>Salin 11 Kolom Header Saja</span>
                  </button>

                  <button
                    type="button"
                    onClick={exportCSV}
                    className="w-full py-2 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>Download File Laporan (.CSV)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[180px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kru / area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800"
            />
          </div>

          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
          >
            <option value="all">Semua Area</option>
            {areas.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
          >
            <option value="all">Semua Shift</option>
            <option value="Pagi (08:00 - 15:00)">Pagi</option>
            <option value="Sore / Closing (15:00 - 22:30)">Closing</option>
          </select>
        </div>

        <span className="text-[11px] font-medium text-slate-500">
          {filteredRecords.length} Laporan
        </span>
      </div>

      {/* Piket Records List */}
      <div className="space-y-2.5">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-2xs">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-700 text-sm">Belum Ada Laporan Piket</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Laporan yang dikirim oleh kru akan otomatis muncul di sini.
            </p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const isClean = record.aiVerification?.status === 'BERSIH_SESUAI_STANDAR';

            return (
              <div
                key={record.id}
                className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 hover:border-slate-300 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    onClick={() => setSelectedRecordForDetail(record)}
                    className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0 cursor-pointer border border-slate-200 relative group"
                  >
                    <img
                      src={record.photoBase64}
                      alt={record.areaName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="min-w-0 space-y-0.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {record.areaCode}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {record.areaName}
                      </h4>
                      <span className="text-[10px] text-slate-400">•</span>
                      <span className="text-[10px] text-slate-500">{record.shift.split(' ')[0]}</span>
                    </div>

                    <p className="text-xs text-slate-600">
                      <strong>{record.crewName}</strong> • {record.date}, {record.time} WIB
                    </p>

                    <div className="flex items-center gap-2 pt-0.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                          isClean
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isClean ? 'AI: Bersih' : 'AI: Perlu Perhatian'}
                      </span>
                      <p className="text-[11px] text-slate-500 italic truncate max-w-xs">
                        "{record.aiVerification?.summary || 'Tercatat'}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: SPV Actions */}
                <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0">
                  {record.spvStatus === 'APPROVED' ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Disetujui</span>
                    </span>
                  ) : record.spvStatus === 'REVISION_NEEDED' ? (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Revisi</span>
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateRecordSPVStatus(record.id, 'APPROVED')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => updateRecordSPVStatus(record.id, 'REVISION_NEEDED', 'Perlu diseka ulang')}
                        className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors"
                      >
                        Revisi
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedRecordForDetail(record)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                    title="Detail"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400">{selectedRecordForDetail.areaCode}</span>
                <h3 className="text-sm font-bold">{selectedRecordForDetail.areaName}</h3>
              </div>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3.5">
              <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-200">
                <img
                  src={selectedRecordForDetail.photoBase64}
                  alt={selectedRecordForDetail.areaName}
                  className="w-full max-h-[280px] object-contain mx-auto"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Analisis AI Gemini</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedRecordForDetail.aiVerification?.status === 'BERSIH_SESUAI_STANDAR'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedRecordForDetail.aiVerification?.status === 'BERSIH_SESUAI_STANDAR'
                      ? 'Bersih Sesuai Standar'
                      : 'Perlu Tindak Lanjut'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed pt-1">
                  {selectedRecordForDetail.aiVerification?.summary || 'Tidak ada catatan visual.'}
                </p>
              </div>

              {/* Kepala Outlet Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Verifikasi Kepala Outlet:</span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Ummu Sallaamah
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Catatan Evaluasi / Arahan:
                  </label>
                  <input
                    type="text"
                    value={spvNoteInput}
                    onChange={(e) => setSpvNoteInput(e.target.value)}
                    placeholder="Contoh: Sudah bersih dan higienis, pertahankan..."
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-slate-900 bg-white"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      updateRecordSPVStatus(selectedRecordForDetail.id, 'APPROVED', spvNoteInput);
                      setSelectedRecordForDetail(prev => prev ? { ...prev, spvStatus: 'APPROVED', spvNotes: spvNoteInput } : null);
                      setSpvNoteInput('');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Setujui (Bersih)</span>
                  </button>
                  <button
                    onClick={() => {
                      updateRecordSPVStatus(selectedRecordForDetail.id, 'REVISION_NEEDED', spvNoteInput || 'Harap bersihkan ulang');
                      setSelectedRecordForDetail(prev => prev ? { ...prev, spvStatus: 'REVISION_NEEDED', spvNotes: spvNoteInput || 'Harap bersihkan ulang' } : null);
                      setSpvNoteInput('');
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Minta Bersihkan Ulang</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
