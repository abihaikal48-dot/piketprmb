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
  MessageSquare,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { usePiket } from '../context/PiketContext';
import { PiketRecord, ShiftType } from '../types/piket';
import { signInWithGoogle, logoutGoogle } from '../services/authService';

export const SPVDashboard: React.FC = () => {
  const {
    areas,
    records,
    activeShift,
    spreadsheetInfo,
    isSheetsConnected,
    googleUserEmail,
    connectGoogleSpreadsheet,
    disconnectGoogleSpreadsheet,
    updateRecordSPVStatus,
    syncRecordToGoogleSheets,
    syncAllPendingToSheets
  } = usePiket();

  const [filterShift, setFilterShift] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<PiketRecord | null>(null);
  const [spvNoteInput, setSpvNoteInput] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);

  // Statistics calculation for current active shift
  const today = new Date().toISOString().split('T')[0];
  const todayShiftRecords = records.filter(r => r.date === today && r.shift === activeShift);

  const completedCleanCount = todayShiftRecords.filter(
    r => r.aiVerification.status === 'BERSIH_SESUAI_STANDAR'
  ).length;

  const needAttentionCount = todayShiftRecords.filter(
    r => r.aiVerification.status === 'PERLU_TINDAKLANJUT'
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
    if (filterStatus !== 'all' && record.aiVerification.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCrew = record.crewName.toLowerCase().includes(q);
      const matchArea = record.areaName.toLowerCase().includes(q);
      if (!matchCrew && !matchArea) return false;
    }
    return true;
  });

  // Handle Google OAuth Sign In
  const handleGoogleConnect = async () => {
    try {
      setIsSigningIn(true);
      const { user, accessToken } = await signInWithGoogle();
      const info = await connectGoogleSpreadsheet(accessToken, user.email || 'Akun Google');
      setSyncSuccessToast(`Google Spreadsheet terhubung: ${info.title}`);
      setTimeout(() => setSyncSuccessToast(null), 4000);
    } catch (err: any) {
      console.error('Sign in Google error:', err);
      alert('Gagal menghubungkan Google Sheets: ' + (err.message || 'Coba lagi'));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const count = await syncAllPendingToSheets();
      setSyncSuccessToast(`Berhasil menyinkronkan ${count} laporan ke Google Sheets!`);
      setTimeout(() => setSyncSuccessToast(null), 3500);
    } catch (err) {
      console.error('Sync all error:', err);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSyncSingle = async (recordId: string) => {
    const success = await syncRecordToGoogleSheets(recordId);
    if (success) {
      setSyncSuccessToast('Laporan berhasil disinkronkan ke Google Sheets');
      setTimeout(() => setSyncSuccessToast(null), 2500);
    } else {
      alert('Pastikan Google Sheets telah terhubung untuk menyinkronkan data.');
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
    link.setAttribute('download', `Hara_Chicken_Log_Piket_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Toast Notification */}
      {syncSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 animate-bounce text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{syncSuccessToast}</span>
        </div>
      )}

      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wider mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            Panel Pengawas / Kepala Outlet
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Monitoring Piket & Verifikasi Kebersihan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau kepatuhan piket kru Hara Chicken per shift, periksa hasil foto visual AI, dan kelola database Google Sheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Shift Compliance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kepatuhan Shift</span>
            <span className="p-2 rounded-xl bg-red-50 text-red-600 font-bold text-xs">
              {activeShift.split(' ')[0]}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{progressPercent}%</span>
            <span className="text-xs text-slate-500 font-semibold">
              ({completedCleanCount}/{totalAreas} Area)
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-red-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bersih Sesuai Standar</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-emerald-700">{completedCleanCount}</span>
            <span className="text-xs text-slate-500 ml-2 font-medium">Area tervalidasi AI</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Perlu Tindak Lanjut</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-amber-700">{needAttentionCount}</span>
            <span className="text-xs text-slate-500 ml-2 font-medium">Ada catatan / noda</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Belum Dikerjakan</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-700">
              {Math.max(0, totalAreas - todayShiftRecords.length)}
            </span>
            <span className="text-xs text-slate-500 ml-2 font-medium">Titik stiker QR</span>
          </div>
        </div>
      </div>

      {/* Google Sheets Integration Card */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-3xl p-6 shadow-md border border-emerald-800/50 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              Database Sentral Google Sheets
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">
            {isSheetsConnected && spreadsheetInfo
              ? spreadsheetInfo.title
              : 'Hubungkan Google Spreadsheet Outlet'}
          </h3>
          <p className="text-xs text-emerald-100/80 leading-relaxed">
            {isSheetsConnected
              ? `Terhubung dengan ${googleUserEmail || 'Google Workspace'}. Setiap laporan piket otomatis tersimpan rapi baris demi baris di Google Sheets.`
              : 'Aktifkan integrasi resmi Google Sheets untuk mencatat seluruh log piket, nama kru, waktu kirim, dan hasil verifikasi AI secara otomatis.'}
          </p>

          {isSheetsConnected && unsyncedCount > 0 && (
            <p className="text-xs text-amber-300 font-bold mt-1">
              • Terdapat {unsyncedCount} laporan baru yang siap disinkronkan ke Sheets.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isSheetsConnected && spreadsheetInfo ? (
            <>
              <a
                href={spreadsheetInfo.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka Google Spreadsheet</span>
              </a>

              {unsyncedCount > 0 && (
                <button
                  disabled={isSyncingAll}
                  onClick={handleSyncAll}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  <span>Sync ({unsyncedCount}) Baris</span>
                </button>
              )}

              <button
                onClick={disconnectGoogleSpreadsheet}
                className="text-xs text-emerald-300 hover:text-white underline underline-offset-2 ml-1"
              >
                Putuskan
              </button>
            </>
          ) : (
            <button
              disabled={isSigningIn}
              onClick={handleGoogleConnect}
              className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white text-slate-800 hover:bg-slate-50 font-bold text-xs sm:text-sm shadow-lg transition-all"
            >
              {/* Google G Logo SVG */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSigningIn ? 'Menghubungkan...' : 'Sign in & Buat Spreadsheet Otomatis'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama kru atau area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-semibold pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            />
          </div>

          {/* Area Filter */}
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
          >
            <option value="all">Semua Area Piket</option>
            {areas.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {/* Shift Filter */}
          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
          >
            <option value="all">Semua Shift</option>
            <option value="Pagi (08:00 - 15:00)">Shift Pagi</option>
            <option value="Sore / Closing (15:00 - 22:30)">Shift Sore / Closing</option>
          </select>

          {/* Status AI Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
          >
            <option value="all">Semua Status AI</option>
            <option value="BERSIH_SESUAI_STANDAR">Bersih Sesuai Standar</option>
            <option value="PERLU_TINDAKLANJUT">Perlu Tindak Lanjut</option>
          </select>
        </div>

        <span className="text-xs font-bold text-slate-500">
          Menampilkan {filteredRecords.length} Catatan
        </span>
      </div>

      {/* Piket Records List / Cards */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-base">Belum Ada Laporan Piket</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Laporan yang dikirim oleh kru melalui scan QR area akan langsung muncul di sini secara real-time.
            </p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const isClean = record.aiVerification.status === 'BERSIH_SESUAI_STANDAR';

            return (
              <div
                key={record.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-slate-300 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Thumbnail & Core Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div
                    onClick={() => setSelectedRecordForDetail(record)}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 cursor-pointer relative group border border-slate-200 shadow-2xs"
                  >
                    <img
                      src={record.photoBase64}
                      alt={record.areaName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {record.areaCode}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{record.areaName}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 font-medium">Shift {record.shift.split(' ')[0]}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="font-bold text-slate-800">{record.crewName}</span>
                      <span className="text-slate-400">mengirim pada</span>
                      <span className="font-semibold text-slate-700">{record.date}, {record.time} WIB</span>
                    </div>

                    {/* AI Summary Badge */}
                    <div className="pt-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isClean
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isClean ? 'AI: Bersih Sesuai Standar' : 'AI: Perlu Perhatian'}
                      </span>

                      <p className="text-xs text-slate-600 line-clamp-1 italic max-w-md">
                        "{record.aiVerification.summary}"
                      </p>
                    </div>

                    {/* SPV Note if exists */}
                    {record.spvNotes && (
                      <p className="text-[11px] text-blue-700 bg-blue-50/70 px-2 py-0.5 rounded-md inline-block">
                        Catatan SPV: {record.spvNotes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions & Status */}
                <div className="flex flex-wrap items-center justify-end gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                  {/* Sheets sync status pill */}
                  {record.syncedToSheets ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                      <span>Di Sheets</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSyncSingle(record.id)}
                      className="text-[10px] font-bold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                      title="Kirim baris ini ke Google Spreadsheet"
                    >
                      <FileSpreadsheet className="w-3 h-3" />
                      <span>Sync ke Sheets</span>
                    </button>
                  )}

                  {/* SPV Approval status / quick buttons */}
                  {record.spvStatus === 'APPROVED' ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Disetujui SPV</span>
                    </span>
                  ) : record.spvStatus === 'REVISION_NEEDED' ? (
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-xl flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Minta Revisi</span>
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateRecordSPVStatus(record.id, 'APPROVED')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Setujui</span>
                      </button>
                      <button
                        onClick={() => updateRecordSPVStatus(record.id, 'REVISION_NEEDED', 'Perlu diseka ulang')}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-amber-50 text-amber-800 font-semibold text-xs transition-colors"
                      >
                        Revisi
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedRecordForDetail(record)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                    title="Buka detail foto dan analisis AI"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DETAIL MODAL: PHOTO + FULL AI FINDINGS + SPV REVIEW */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded">
                    {selectedRecordForDetail.areaCode}
                  </span>
                  <h3 className="font-bold text-base">{selectedRecordForDetail.areaName}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Petugas: {selectedRecordForDetail.crewName} • {selectedRecordForDetail.date}, {selectedRecordForDetail.time} WIB
                </p>
              </div>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Scrollable */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Photo Viewport */}
              <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-200">
                <img
                  src={selectedRecordForDetail.photoBase64}
                  alt={selectedRecordForDetail.areaName}
                  className="w-full max-h-[350px] object-contain mx-auto"
                />
              </div>

              {/* AI Verification Report */}
              <div
                className={`p-4 rounded-2xl border ${
                  selectedRecordForDetail.aiVerification.status === 'BERSIH_SESUAI_STANDAR'
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : 'bg-amber-50/80 border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase">
                      Laporan Audit AI Gemini
                    </span>
                  </div>
                  <span
                    className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                      selectedRecordForDetail.aiVerification.status === 'BERSIH_SESUAI_STANDAR'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {selectedRecordForDetail.aiVerification.status === 'BERSIH_SESUAI_STANDAR'
                      ? 'BERSIH SESUAI STANDAR'
                      : 'PERLU TINDAK LANJUT'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                  {selectedRecordForDetail.aiVerification.summary}
                </p>

                {/* Findings */}
                {selectedRecordForDetail.aiVerification.findings?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60">
                    <p className="text-xs font-bold text-slate-800 mb-1">Temuan Visual Terdeteksi:</p>
                    <ul className="text-xs text-slate-700 space-y-1">
                      {selectedRecordForDetail.aiVerification.findings.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-red-500 font-bold">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* SPV Review Section */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Keputusan Kepala Outlet / SPV:
                </h4>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      updateRecordSPVStatus(selectedRecordForDetail.id, 'APPROVED', spvNoteInput);
                      setSelectedRecordForDetail(prev => prev ? { ...prev, spvStatus: 'APPROVED', spvNotes: spvNoteInput } : null);
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                      selectedRecordForDetail.spvStatus === 'APPROVED'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Setujui (Lolos SOP)</span>
                  </button>

                  <button
                    onClick={() => {
                      updateRecordSPVStatus(selectedRecordForDetail.id, 'REVISION_NEEDED', spvNoteInput || 'Harap bersihkan ulang');
                      setSelectedRecordForDetail(prev => prev ? { ...prev, spvStatus: 'REVISION_NEEDED', spvNotes: spvNoteInput } : null);
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                      selectedRecordForDetail.spvStatus === 'REVISION_NEEDED'
                        ? 'bg-amber-600 text-white'
                        : 'bg-white border border-amber-300 text-amber-800 hover:bg-amber-50'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Minta Bersihkan Ulang</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Catatan Arahan untuk Kru:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Sangat baik, lanjutkan besok / Harap lap bagian bawah rak lagi"
                    defaultValue={selectedRecordForDetail.spvNotes || ''}
                    onChange={(e) => setSpvNoteInput(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-800 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                ID: {selectedRecordForDetail.id}
              </span>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
