import React, { useState } from 'react';
import {
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
  Sparkles,
  Lock,
  Link as LinkIcon,
  Copy,
  Code2,
  CheckCheck,
  User,
  Calendar,
  Layers
} from 'lucide-react';
import { usePiket } from '../context/PiketContext';
import { PiketRecord } from '../types/piket';
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
    updateRecordSPVStatus,
    syncAllPendingToSheets,
    connectWebhookSpreadsheet,
    setDirectSpreadsheetLink
  } = usePiket();

  const [filterShift, setFilterShift] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<PiketRecord | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [webhookUrlInput, setWebhookUrlInput] = useState(spreadsheetInfo?.webhookUrl || '');
  const [showChangeSheetModal, setShowChangeSheetModal] = useState(false);
  const [customSheetUrl, setCustomSheetUrl] = useState(spreadsheetInfo?.url || '');
  const [modalTab, setModalTab] = useState<'webhook' | 'copy'>('webhook');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  const isRealtimeSyncActive = !!(spreadsheetInfo?.type === 'webhook' && spreadsheetInfo.webhookUrl);

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setSyncToast('Kode skrip berhasil disalin.');
    setTimeout(() => setSyncToast(null), 3000);
  };

  const copyTableDataToClipboard = () => {
    const tsv = getRecordsTsvString(records);
    navigator.clipboard.writeText(tsv);
    setSyncToast('Data berhasil disalin! Tempel (Ctrl+V) di Google Sheets.');
    setTimeout(() => setSyncToast(null), 3500);
  };

  const handleTestWebhook = async () => {
    const url = webhookUrlInput.trim();
    if (!url) {
      setSyncToast('Masukkan URL Webhook Apps Script terlebih dahulu.');
      setTimeout(() => setSyncToast(null), 3000);
      return;
    }
    setIsTestingWebhook(true);
    try {
      await testWebhookConnection(url);
      setSyncToast('1 Baris tes berhasil terkirim ke Google Sheets!');
      setTimeout(() => setSyncToast(null), 3500);
    } catch {
      setSyncToast('Gagal mengirim baris tes. Periksa kembali URL Webhook.');
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

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const syncedCount = await syncAllPendingToSheets();
      setSyncToast(`${syncedCount} laporan berhasil disinkronkan ke Google Sheets.`);
    } catch {
      setSyncToast('Gagal melakukan sinkronisasi ulang.');
    } finally {
      setIsSyncingAll(false);
      setTimeout(() => setSyncToast(null), 3500);
    }
  };

  const exportCSV = () => {
    const headers = [
      'Waktu Kirim',
      'Nama Kru',
      'Shift',
      'Area Piket',
      'Kode Area',
      'Status Verifikasi AI',
      'Ringkasan AI',
      'Temuan Detail AI',
      'Status Kepala Outlet',
      'Catatan Kepala Outlet (Ummu Sallaamah)',
      'ID Laporan'
    ];

    const rows = records.map(r => [
      `"${r.date} ${r.time}"`,
      `"${r.crewName}"`,
      `"${r.shift}"`,
      `"${r.areaName}"`,
      `"${r.areaCode}"`,
      `"${r.aiVerification?.status === 'BERSIH_SESUAI_STANDAR' ? 'Bersih Sesuai Standar' : 'Perlu Tindak Lanjut'}"`,
      `"${(r.aiVerification?.summary || '').replace(/"/g, '""')}"`,
      `"${(r.aiVerification?.findings?.join('; ') || '').replace(/"/g, '""')}"`,
      `"${r.spvStatus === 'APPROVED' ? 'Disetujui' : r.spvStatus === 'REVISION_NEEDED' ? 'Perlu Revisi' : 'Menunggu Review'}"`,
      `"${(r.spvNotes || '').replace(/"/g, '""')}"`,
      `"${r.id}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Piket_HaraChicken_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Shift & date stats
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
      const matchSummary = record.aiVerification?.summary?.toLowerCase().includes(q) || false;
      if (!matchCrew && !matchArea && !matchSummary) return false;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Toast Notification */}
      {syncToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-zinc-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-zinc-700 flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <span>Kepala Outlet: Ummu Sallaamah</span>
            <span>·</span>
            <span>Hara Chicken</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight">
            Monitoring Piket & Evaluasi
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-lg">
            Pantau kepatuhan piket di 6 area outlet, evaluasi kebersihan visual AI, dan pastikan data tersinkron ke Google Sheets.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-medium text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>Ekspor CSV</span>
          </button>

          {onLockSPV && (
            <button
              onClick={onLockSPV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-zinc-300" />
              <span>Kunci Portal</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <span className="text-xs text-zinc-500 font-medium">Kepatuhan Shift Ini</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-zinc-900 tracking-tight">{progressPercent}%</span>
            <span className="text-xs text-zinc-400">({completedCleanCount}/{totalAreas} Area)</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-1 mt-3 overflow-hidden">
            <div className="bg-zinc-900 h-1 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <span className="text-xs text-zinc-500 font-medium">Bersih Terverifikasi</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-emerald-600 tracking-tight">{completedCleanCount}</span>
            <span className="text-xs text-zinc-400">Area</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Standar terpenuhi</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <span className="text-xs text-zinc-500 font-medium">Perlu Perhatian / Revisi</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-amber-600 tracking-tight">{needAttentionCount}</span>
            <span className="text-xs text-zinc-400">Area</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Perlu evaluasi</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
          <span className="text-xs text-zinc-500 font-medium">Belum Dikerjakan</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-zinc-700 tracking-tight">
              {Math.max(0, totalAreas - todayShiftRecords.length)}
            </span>
            <span className="text-xs text-zinc-400">Area</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
            <span>Shift {activeShift.split(' ')[0]}</span>
          </div>
        </div>
      </div>

      {/* Google Sheets Connection Banner */}
      <div className={`p-5 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        isRealtimeSyncActive
          ? 'bg-emerald-50/40 border-emerald-200/80'
          : 'bg-white border-zinc-200/80'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isRealtimeSyncActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">
              Google Spreadsheet Auto-Sync
            </h2>
            <span className="text-xs text-zinc-400">·</span>
            <span className="text-xs text-zinc-500">
              {isRealtimeSyncActive ? 'Tersambung Realtime' : 'Belum Terhubung Webhook'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 max-w-xl">
            {isRealtimeSyncActive
              ? 'Laporan yang dikirim kru dan hasil AI visual otomatis masuk ke baris Google Sheets Anda secara instan bersama link foto Google Drive.'
              : 'Hubungkan skrip Apps Script agar data laporan dan foto kru otomatis masuk ke file spreadsheet Anda secara online.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {spreadsheetInfo?.url && (
            <a
              href={spreadsheetInfo.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 font-medium text-xs transition-colors shadow-xs"
            >
              <span>Buka Spreadsheet</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>
          )}

          <button
            onClick={() => {
              setModalTab('webhook');
              setShowChangeSheetModal(true);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-medium text-xs transition-colors shadow-xs cursor-pointer ${
              isRealtimeSyncActive
                ? 'bg-zinc-900 hover:bg-zinc-800 text-white'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>{isRealtimeSyncActive ? 'Pengaturan Webhook' : 'Hubungkan Auto-Sync'}</span>
          </button>

          <button
            onClick={copyTableDataToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-medium text-xs transition-colors cursor-pointer"
            title="Salin seluruh baris tabel untuk ditempel langsung (Ctrl+V) di Google Sheets"
          >
            <Copy className="w-3.5 h-3.5 text-zinc-400" />
            <span>Salin Data (Ctrl+V)</span>
          </button>

          {isRealtimeSyncActive && unsyncedCount > 0 && (
            <button
              disabled={isSyncingAll}
              onClick={handleSyncAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-medium text-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>Sync Ulang ({unsyncedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kru atau area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8.5 pr-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800 focus:outline-hidden focus:border-zinc-400"
            />
          </div>

          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="text-xs bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-zinc-700 focus:outline-hidden"
          >
            <option value="all">Semua Area</option>
            {areas.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            className="text-xs bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-zinc-700 focus:outline-hidden"
          >
            <option value="all">Semua Shift</option>
            <option value="Pagi (08:00 - 15:00)">Pagi</option>
            <option value="Sore / Closing (15:00 - 22:30)">Closing</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-zinc-700 focus:outline-hidden"
          >
            <option value="all">Semua Status</option>
            <option value="BERSIH_SESUAI_STANDAR">Bersih Standar</option>
            <option value="PERLU_TINDAKLANJUT">Perlu Revisi</option>
          </select>
        </div>

        <span className="text-xs text-zinc-400 font-medium">
          {filteredRecords.length} Laporan
        </span>
      </div>

      {/* Piket Records List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-zinc-200/80 shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <h3 className="font-semibold text-zinc-800 text-sm">Belum Ada Laporan Piket</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Laporan yang dikirim oleh kru melalui scan QR atau halaman depan akan otomatis muncul di sini secara real-time.
            </p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const isClean = record.aiVerification?.status === 'BERSIH_SESUAI_STANDAR';

            return (
              <div
                key={record.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200/80 hover:border-zinc-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    onClick={() => setSelectedRecordForDetail(record)}
                    className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 shrink-0 cursor-pointer border border-zinc-200 relative group"
                  >
                    <img
                      src={record.photoBase64}
                      alt={record.areaName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-zinc-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="min-w-0 space-y-1 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-zinc-400 font-medium">{record.areaCode}</span>
                      <span className="text-zinc-300">·</span>
                      <h3 className="font-semibold text-zinc-900 truncate">
                        {record.areaName}
                      </h3>
                      <span className="text-zinc-300">·</span>
                      <span className="text-zinc-500">{record.shift.split(' ')[0]}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="font-medium text-zinc-800">{record.crewName}</span>
                      <span>·</span>
                      <span>{record.date}, {record.time} WIB</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isClean ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className={`font-medium ${isClean ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {isClean ? 'Bersih Sesuai Standar' : 'Perlu Revisi'}
                        </span>
                      </div>
                      <span className="text-zinc-300">·</span>
                      <p className="text-zinc-500 truncate max-w-sm">
                        {record.aiVerification?.summary || 'Tercatat'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                  {record.spvStatus === 'APPROVED' ? (
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200/80 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Disetujui</span>
                    </span>
                  ) : record.spvStatus === 'REVISION_NEEDED' ? (
                    <span className="text-xs font-medium text-amber-700 bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-200/80 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Perlu Revisi</span>
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateRecordSPVStatus(record.id, 'APPROVED')}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => updateRecordSPVStatus(record.id, 'REVISION_NEEDED', 'Perlu diseka dan dibersihkan ulang')}
                        className="px-2.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 text-xs font-medium hover:bg-zinc-50 transition-colors cursor-pointer"
                      >
                        Minta Revisi
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedRecordForDetail(record)}
                    className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
                    title="Lihat Detail Lengkap"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-xl border border-zinc-200 flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-zinc-400">{selectedRecordForDetail.areaCode}</span>
                <h3 className="text-sm font-semibold text-zinc-900">{selectedRecordForDetail.areaName}</h3>
              </div>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="p-1 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="rounded-xl overflow-hidden bg-zinc-950 border border-zinc-200">
                <img
                  src={selectedRecordForDetail.photoBase64}
                  alt={selectedRecordForDetail.areaName}
                  className="w-full max-h-[300px] object-contain mx-auto"
                />
              </div>

              <div className="space-y-1 text-zinc-600 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/60">
                <div className="flex justify-between">
                  <span>Petugas:</span>
                  <span className="font-semibold text-zinc-900">{selectedRecordForDetail.crewName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu Kirim:</span>
                  <span className="font-medium text-zinc-800">{selectedRecordForDetail.date}, {selectedRecordForDetail.time} WIB</span>
                </div>
                <div className="flex justify-between">
                  <span>Shift:</span>
                  <span className="font-medium text-zinc-800">{selectedRecordForDetail.shift}</span>
                </div>
                {selectedRecordForDetail.notes && (
                  <div className="pt-1 border-t border-zinc-200/60 mt-1">
                    <span className="text-zinc-400">Catatan Kru: </span>
                    <span className="text-zinc-800 italic">"{selectedRecordForDetail.notes}"</span>
                  </div>
                )}
              </div>

              {/* AI Vision Results */}
              <div className="p-3.5 rounded-xl border border-zinc-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      selectedRecordForDetail.aiVerification?.status === 'BERSIH_SESUAI_STANDAR'
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`} />
                    <span className="font-semibold text-zinc-900">
                      {selectedRecordForDetail.aiVerification?.status === 'BERSIH_SESUAI_STANDAR'
                        ? 'Bersih Sesuai Standar'
                        : 'Perlu Revisi Kebersihan'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {selectedRecordForDetail.aiVerification?.verifiedAt} WIB
                  </span>
                </div>

                <p className="text-zinc-700 leading-relaxed">
                  {selectedRecordForDetail.aiVerification?.summary}
                </p>

                {selectedRecordForDetail.aiVerification?.findings && (
                  <ul className="text-zinc-600 space-y-1 pt-1">
                    {selectedRecordForDetail.aiVerification.findings.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-zinc-400">·</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Approval controls */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100">
                <button
                  onClick={() => {
                    updateRecordSPVStatus(selectedRecordForDetail.id, 'REVISION_NEEDED', 'Perlu diseka ulang');
                    setSelectedRecordForDetail(null);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  Minta Revisi
                </button>
                <button
                  onClick={() => {
                    updateRecordSPVStatus(selectedRecordForDetail.id, 'APPROVED');
                    setSelectedRecordForDetail(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Setujui Kebersihan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Webhook & Sheets Modal */}
      {showChangeSheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-semibold text-zinc-900">Pengaturan Google Spreadsheet</h3>
              </div>
              <button onClick={() => setShowChangeSheetModal(false)} className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex border-b border-zinc-200 mt-4 text-xs font-medium">
              <button
                type="button"
                onClick={() => setModalTab('webhook')}
                className={`py-2 px-3 border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'webhook'
                    ? 'border-zinc-900 text-zinc-900 font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Auto-Sync Realtime (Apps Script)
              </button>
              <button
                type="button"
                onClick={() => setModalTab('copy')}
                className={`py-2 px-3 border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'copy'
                    ? 'border-zinc-900 text-zinc-900 font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Salin Cepat (1 Klik)
              </button>
            </div>

            {modalTab === 'webhook' && (
              <div className="mt-4 space-y-4 text-xs">
                <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/70 text-zinc-700 space-y-1.5">
                  <p className="font-semibold text-zinc-900">
                    Langkah Aktivasi (1 Menit):
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-zinc-600">
                    <li>Buka spreadsheet Google $\rightarrow$ menu <strong>Ekstensi</strong> $\rightarrow$ <strong>Apps Script</strong>.</li>
                    <li>Salin kode skrip di bawah lalu tempel menggantikan isi file di Apps Script.</li>
                    <li>Klik <strong>Deploy</strong> $\rightarrow$ <strong>Deployment baru</strong> $\rightarrow$ pilih <strong>Aplikasi web</strong> $\rightarrow$ ubah akses ke <strong>Siapa saja (Anyone)</strong> $\rightarrow$ Salin URL Webhook-nya.</li>
                  </ol>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 text-white">
                  <span className="font-mono text-xs text-zinc-300">Skrip Google Apps Script</span>
                  <button
                    type="button"
                    onClick={copyScriptToClipboard}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Kode</span>
                  </button>
                </div>

                <form onSubmit={handleSaveWebhookConnection} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-zinc-800 mb-1">
                      URL Webhook Apps Script (berakhiran /exec):
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={webhookUrlInput}
                      onChange={(e) => setWebhookUrlInput(e.target.value)}
                      className="w-full text-xs font-mono rounded-xl border border-zinc-200 p-2.5 text-zinc-900 bg-white focus:outline-hidden focus:border-zinc-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-800 mb-1">
                      Link Google Spreadsheet (untuk tombol buka):
                    </label>
                    <input
                      type="text"
                      placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                      value={customSheetUrl}
                      onChange={(e) => setCustomSheetUrl(e.target.value)}
                      className="w-full text-xs rounded-xl border border-zinc-200 p-2.5 text-zinc-900 bg-white focus:outline-hidden focus:border-zinc-400"
                    />
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={isTestingWebhook || !webhookUrlInput.trim()}
                      onClick={handleTestWebhook}
                      className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 font-medium text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCheck className={`w-3.5 h-3.5 text-emerald-600 ${isTestingWebhook ? 'animate-pulse' : ''}`} />
                      <span>{isTestingWebhook ? 'Mengirim Tes...' : 'Kirim Baris Uji Coba'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowChangeSheetModal(false)}
                        className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-600 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors shadow-xs cursor-pointer"
                      >
                        Simpan & Aktifkan
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {modalTab === 'copy' && (
              <div className="mt-4 space-y-3 text-xs text-zinc-600">
                <p>
                  Salin seluruh isi laporan langsung ke clipboard, lalu tekan <strong>Ctrl + V</strong> di lembar Google Sheets Anda:
                </p>

                <button
                  type="button"
                  onClick={copyTableDataToClipboard}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Salin Semua Baris Data (Siap Tempel Ctrl+V)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
