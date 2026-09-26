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
  Plus
} from 'lucide-react';
import { usePiket } from '../context/PiketContext';
import { PiketRecord } from '../types/piket';
import { signInWithGoogle } from '../services/authService';
import { AreaIcon } from './AreaIcon';

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
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [showChangeSheetModal, setShowChangeSheetModal] = useState(false);
  const [customSheetUrl, setCustomSheetUrl] = useState('');

  const copyHeadersToClipboard = () => {
    const headerText = "Waktu Kirim (WIB)\tNama Kru\tShift\tArea Piket\tKode Area\tStatus Verifikasi AI\tRingkasan AI\tTemuan Detail AI\tStatus SPV\tCatatan SPV\tID Laporan";
    navigator.clipboard.writeText(headerText);
    setSyncToast('Format 11 kolom header disalin ke clipboard!');
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleSaveDirectSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSheetUrl.trim()) return;
    setDirectSpreadsheetLink(customSheetUrl.trim());
    setShowChangeSheetModal(false);
    setCustomSheetUrl('');
    setSyncToast('Link Google Spreadsheet berhasil diperbarui!');
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
    const headers = ['Waktu', 'Nama Kru', 'Shift', 'Area', 'Kode Area', 'Status AI', 'Ringkasan AI', 'Status SPV'];
    const rows = filteredRecords.map(r => [
      `"${r.date} ${r.time}"`,
      `"${r.crewName}"`,
      `"${r.shift}"`,
      `"${r.areaName}"`,
      `"${r.areaCode}"`,
      `"${r.aiVerification.status}"`,
      `"${r.aiVerification.summary.replace(/"/g, '""')}"`,
      `"${r.spvStatus}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Piket_Cihuy_Log_${today}.csv`);
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
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Portal SPV & Kepala Outlet
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Monitoring Piket Cihuy
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau kepatuhan piket kru, verifikasi visual AI, dan database spreadsheet.
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

      {/* Google Sheets Connection Card (Clean & Simple) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {isSheetsConnected ? spreadsheetInfo?.title || 'Google Spreadsheet Terhubung' : 'Google Spreadsheet Outlet'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-lg">
            {isSheetsConnected
              ? 'Data piket dan hasil verifikasi AI otomatis disinkronkan ke Google Spreadsheet.'
              : 'Sambungkan Google Spreadsheet agar data piket tersimpan dan mudah diaudit.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isSheetsConnected && spreadsheetInfo ? (
            <>
              <a
                href={spreadsheetInfo.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Spreadsheet</span>
              </a>

              <button
                onClick={() => setShowChangeSheetModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
                title="Ganti atau masukkan link Google Spreadsheet sendiri"
              >
                <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Ganti Link</span>
              </button>

              <button
                onClick={copyHeadersToClipboard}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium text-xs transition-colors"
                title="Salin 11 nama kolom header untuk ditempel di spreadsheet baru"
              >
                <Copy className="w-3 h-3 text-slate-400" />
                <span>Salin Kolom</span>
              </button>

              {unsyncedCount > 0 && (
                <button
                  disabled={isSyncingAll}
                  onClick={handleSyncAll}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  <span>Sync ({unsyncedCount})</span>
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowChangeSheetModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition-colors"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Sambungkan Spreadsheet</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Ganti Link Google Spreadsheet */}
      {showChangeSheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Sambungkan Google Spreadsheet</h3>
              </div>
              <button onClick={() => setShowChangeSheetModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3 text-xs text-slate-600">
              <p>
                Masukkan link Google Spreadsheet Anda (bebas, langsung terhubung tanpa repot otorisasi):
              </p>

              <form onSubmit={handleSaveDirectSheet} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Link / ID Google Spreadsheet:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                    value={customSheetUrl}
                    onChange={(e) => setCustomSheetUrl(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-900 bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Atau buat sheet baru di Google Drive:{" "}
                    <a
                      href="https://docs.google.com/spreadsheets/u/0/create"
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-900 font-bold underline"
                    >
                      Buka Google Sheets Baru
                    </a>
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                  <span>Siapkan 11 kolom header otomatis:</span>
                  <button
                    type="button"
                    onClick={copyHeadersToClipboard}
                    className="px-2 py-1 rounded bg-white border border-slate-200 text-slate-800 font-bold hover:bg-slate-100 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3 text-slate-500" />
                    <span>Salin Kolom</span>
                  </button>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowChangeSheetModal(false)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                  >
                    Simpan & Hubungkan
                  </button>
                </div>
              </form>
            </div>
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

              {/* SPV Actions */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-slate-800">Status Approval:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      updateRecordSPVStatus(selectedRecordForDetail.id, 'APPROVED', spvNoteInput);
                      setSelectedRecordForDetail(prev => prev ? { ...prev, spvStatus: 'APPROVED' } : null);
                    }}
                    className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                  >
                    Setujui Laporan
                  </button>
                  <button
                    onClick={() => {
                      updateRecordSPVStatus(selectedRecordForDetail.id, 'REVISION_NEEDED', spvNoteInput || 'Harap bersihkan ulang');
                      setSelectedRecordForDetail(prev => prev ? { ...prev, spvStatus: 'REVISION_NEEDED' } : null);
                    }}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Minta Revisi
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
