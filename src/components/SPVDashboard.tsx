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
  Link,
  Code2,
  Copy,
  Info,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { usePiket } from '../context/PiketContext';
import { PiketRecord } from '../types/piket';
import { signInWithGoogle } from '../services/authService';

export const SPVDashboard: React.FC = () => {
  const {
    areas,
    records,
    activeShift,
    spreadsheetInfo,
    isSheetsConnected,
    googleUserEmail,
    connectGoogleSpreadsheet,
    connectWebhookSpreadsheet,
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
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Webhook setup modal / form for Vercel
  const [showWebhookSetup, setShowWebhookSetup] = useState(false);
  const [webhookInputUrl, setWebhookInputUrl] = useState(spreadsheetInfo?.webhookUrl || '');
  const [sheetUrlInput, setSheetUrlInput] = useState(spreadsheetInfo?.url || '');
  const [copiedScript, setCopiedScript] = useState(false);
  const [oauthErrorNotice, setOauthErrorNotice] = useState<string | null>(null);

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

  const handleGoogleOAuthConnect = async () => {
    setOauthErrorNotice(null);
    try {
      setIsSigningIn(true);
      const { user, accessToken } = await signInWithGoogle();
      const info = await connectGoogleSpreadsheet(accessToken, user.email || 'Akun Google');
      setSyncToast(`Google Spreadsheet terhubung: ${info.title}`);
      setTimeout(() => setSyncToast(null), 4000);
    } catch (err: any) {
      console.error('Sign in Google error:', err);
      setOauthErrorNotice(err.message || 'Gagal login Google.');
      // Auto suggest webhook on Vercel
      setShowWebhookSetup(true);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookInputUrl.trim()) return;

    connectWebhookSpreadsheet(webhookInputUrl.trim(), sheetUrlInput.trim(), 'Piket Cihuy - Google Sheets');
    setShowWebhookSetup(false);
    setSyncToast('Google Sheets Webhook berhasil dihubungkan!');
    setTimeout(() => setSyncToast(null), 3500);
  };

  const sampleAppsScriptCode = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Waktu", "Nama Kru", "Shift", "Area", "Kode", "Status AI", "Ringkasan AI", "Temuan Detail", "Status SPV", "Catatan SPV", "ID"]);
  }
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.timestamp,
    data.crewName,
    data.shift,
    data.areaName,
    data.areaCode,
    data.aiStatus,
    data.aiSummary,
    data.aiFindings,
    data.spvStatus,
    data.spvNotes,
    data.id
  ]);
  return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
}`;

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(sampleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const count = await syncAllPendingToSheets();
      setSyncToast(`Tersinkron ${count} laporan ke Google Sheets!`);
      setTimeout(() => setSyncToast(null), 3500);
    } catch (err) {
      console.error('Sync all error:', err);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSyncSingle = async (recordId: string) => {
    const success = await syncRecordToGoogleSheets(recordId);
    if (success) {
      setSyncToast('Laporan berhasil disinkronkan ke Google Sheets');
      setTimeout(() => setSyncToast(null), 2500);
    } else {
      setShowWebhookSetup(true);
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
    link.setAttribute('download', `Piket_Cihuy_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-5">
      {/* Toast Alert */}
      {syncToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
            Portal Pengawas & SPV
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Monitoring Piket Cihuy
          </h1>
          <p className="text-xs text-slate-500">
            Rekap kebersihan shift {activeShift.split(' ')[0]}, persetujuan laporan, dan database Google Sheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Kepatuhan Shift</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{progressPercent}%</span>
            <span className="text-[11px] text-slate-500 font-semibold">
              ({completedCleanCount}/{totalAreas})
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-red-600 h-1.5 rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase">Bersih Standar</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-700">{completedCleanCount}</span>
            <span className="text-[11px] text-slate-400">Area lolos</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase">Perlu Tindak Lanjut</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-700">{needAttentionCount}</span>
            <span className="text-[11px] text-slate-400">Ada catatan</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Belum Piket</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-700">
              {Math.max(0, totalAreas - todayShiftRecords.length)}
            </span>
            <span className="text-[11px] text-slate-400">Titik QR</span>
          </div>
        </div>
      </div>

      {/* GOOGLE SHEETS CONNECTION BOX (OPTIMIZED FOR VERCEL & SPREADSHEETS) */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300">
              Database Google Sheets
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black tracking-tight">
            {isSheetsConnected
              ? spreadsheetInfo?.title || 'Google Spreadsheet Terhubung'
              : 'Hubungkan Google Sheets (Solusi Vercel)'}
          </h3>
          <p className="text-xs text-emerald-100/80 leading-relaxed">
            {isSheetsConnected
              ? `Tersambung via ${spreadsheetInfo?.type === 'webhook' ? 'Google Apps Script (Vercel Ready)' : 'Google OAuth'}. Setiap piket langsung otomatis tercatat di spreadsheet.`
              : 'Gunakan metode Webhook Google Apps Script (bebas batas domain Vercel) atau Google Sign-in.'}
          </p>

          {oauthErrorNotice && (
            <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/50 text-[11px] text-red-200 mt-2">
              <p className="font-bold text-white mb-0.5">Catatan Domain Vercel:</p>
              <p>{oauthErrorNotice}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isSheetsConnected && spreadsheetInfo ? (
            <>
              {spreadsheetInfo.url && (
                <a
                  href={spreadsheetInfo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Spreadsheet</span>
                </a>
              )}

              {unsyncedCount > 0 && (
                <button
                  disabled={isSyncingAll}
                  onClick={handleSyncAll}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  <span>Sync ({unsyncedCount})</span>
                </button>
              )}

              <button
                onClick={() => setShowWebhookSetup(true)}
                className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white"
                title="Ubah URL Webhook"
              >
                Pengaturan
              </button>

              <button
                onClick={disconnectGoogleSpreadsheet}
                className="text-xs text-emerald-300 hover:text-white underline ml-1"
              >
                Putus
              </button>
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowWebhookSetup(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-sm transition-all"
              >
                <Link className="w-4 h-4" />
                <span>Sambungkan Webhook (Rekomendasi Vercel)</span>
              </button>

              <button
                disabled={isSigningIn}
                onClick={handleGoogleOAuthConnect}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all"
              >
                <span>{isSigningIn ? 'Loading...' : 'Login Google'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[180px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kru / area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-semibold pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
            />
          </div>

          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700"
          >
            <option value="all">Semua Area</option>
            {areas.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700"
          >
            <option value="all">Semua Status AI</option>
            <option value="BERSIH_SESUAI_STANDAR">Bersih Standar</option>
            <option value="PERLU_TINDAKLANJUT">Perlu Revisi</option>
          </select>
        </div>

        <span className="text-[11px] font-bold text-slate-400">
          {filteredRecords.length} Data
        </span>
      </div>

      {/* RECORDS LIST */}
      <div className="space-y-2.5">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-2xs">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-700 text-sm">Belum Ada Laporan</h3>
            <p className="text-xs text-slate-400 mt-0.5">Laporan kru dari scan QR akan tampil di sini.</p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const isClean = record.aiVerification.status === 'BERSIH_SESUAI_STANDAR';

            return (
              <div
                key={record.id}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 hover:border-slate-300 shadow-2xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                {/* Left side */}
                <div className="flex items-start gap-3 flex-1">
                  <div
                    onClick={() => setSelectedRecordForDetail(record)}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 cursor-pointer border border-slate-200"
                  >
                    <img
                      src={record.photoBase64}
                      alt={record.areaName}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {record.areaCode}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 truncate">
                        {record.areaName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        • {record.shift.split(' ')[0]}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      <strong className="text-slate-900">{record.crewName}</strong> • {record.date}, {record.time} WIB
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span
                        className={`text-[9px] font-black px-2 py-0.2 rounded-full ${
                          isClean ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isClean ? 'AI: BERSIH' : 'AI: PERLU CEK'}
                      </span>
                      <p className="text-[11px] text-slate-500 italic truncate max-w-sm">
                        "{record.aiVerification.summary}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right side actions */}
                <div className="flex items-center justify-end gap-2 border-t md:border-t-0 pt-2 md:pt-0">
                  {record.syncedToSheets ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1">
                      <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                      <span>Sheets OK</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSyncSingle(record.id)}
                      className="text-[10px] font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1"
                    >
                      <FileSpreadsheet className="w-3 h-3" />
                      <span>Sync</span>
                    </button>
                  )}

                  {record.spvStatus === 'APPROVED' ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-xl">
                      ✓ Disetujui
                    </span>
                  ) : record.spvStatus === 'REVISION_NEEDED' ? (
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-xl">
                      Revisi
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateRecordSPVStatus(record.id, 'APPROVED')}
                        className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => updateRecordSPVStatus(record.id, 'REVISION_NEEDED', 'Perlu diseka ulang')}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 font-bold text-xs"
                      >
                        Revisi
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedRecordForDetail(record)}
                    className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* WEBHOOK SETUP MODAL (FOR VERCEL ZERO-OAUTH SYNC) */}
      {showWebhookSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Link className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-900">
                  Koneksi Google Sheets (Bebas Error Vercel)
                </h3>
              </div>
              <button
                onClick={() => setShowWebhookSetup(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-xs text-emerald-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Kenapa metode ini direkomendasikan untuk Vercel?</span>
              </p>
              <p className="text-emerald-900 leading-relaxed text-[11px]">
                Google Apps Script Webhook bekerja tanpa OAuth popup (tidak akan terblokir oleh domain vercel.app), sehingga setiap kru yang mengirim piket akan otomatis langsung masuk ke spreadsheet Anda secara real-time!
              </p>
            </div>

            <form onSubmit={handleSaveWebhook} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Buat Spreadsheet & Buka Extensions {'>'} Apps Script
                </label>
                <p className="text-[11px] text-slate-500 mb-1.5">
                  Salin skrip sederhana berikut ke Apps Script Anda:
                </p>
                <div className="relative">
                  <pre className="text-[10px] bg-slate-900 text-slate-100 p-3 rounded-xl overflow-x-auto font-mono max-h-36">
                    {sampleAppsScriptCode}
                  </pre>
                  <button
                    type="button"
                    onClick={copyScriptToClipboard}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedScript ? 'Tersalin!' : 'Salin Kode'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Klik Deploy {'>'} New Deployment {'>'} Web App
                </label>
                <p className="text-[11px] text-slate-500">
                  Pilih "Execute as: Me" dan "Who has access: Anyone". Lalu salin URL Web App yang dihasilkan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Tempel URL Web App Google Apps Script di sini:
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={webhookInputUrl}
                  onChange={(e) => setWebhookInputUrl(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Google Spreadsheet Anda (Opsional, untuk tombol pintasan):
                </label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  value={sheetUrlInput}
                  onChange={(e) => setSheetUrlInput(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWebhookSetup(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
                >
                  Simpan & Hubungkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl p-5 space-y-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded">
                  {selectedRecordForDetail.areaCode}
                </span>
                <h3 className="font-extrabold text-base text-slate-900 mt-0.5">
                  {selectedRecordForDetail.areaName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-200">
              <img
                src={selectedRecordForDetail.photoBase64}
                alt={selectedRecordForDetail.areaName}
                className="w-full max-h-[300px] object-contain mx-auto"
              />
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Analisis AI Gemini:</span>
                <span
                  className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                    selectedRecordForDetail.aiVerification.status === 'BERSIH_SESUAI_STANDAR'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedRecordForDetail.aiVerification.status}
                </span>
              </div>
              <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200/60 leading-relaxed font-medium">
                {selectedRecordForDetail.aiVerification.summary}
              </p>

              {selectedRecordForDetail.aiVerification.findings?.length > 0 && (
                <ul className="text-slate-600 space-y-1 text-[11px] pt-1">
                  {selectedRecordForDetail.aiVerification.findings.map((f, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-red-500 font-bold">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
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
