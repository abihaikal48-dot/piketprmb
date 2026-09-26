import React, { useState, useRef, useEffect } from 'react';
import {
  QrCode,
  Camera,
  RotateCcw,
  Send,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  ArrowLeft,
  CalendarDays,
  User
} from 'lucide-react';
import { usePiket } from '../context/PiketContext';
import { PiketArea, AIVerificationResult } from '../types/piket';
import { QRScannerModal } from './QRScannerModal';
import { AreaIcon } from './AreaIcon';

interface CrewPiketFlowProps {
  onGoToSPVPortal?: () => void;
  onGoToDashboard?: () => void;
  onGoToRoster?: () => void;
}

// Client-side image compression to prevent memory freeze
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const resultStr = (e.target?.result as string) || '';
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 900;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(resultStr);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = () => resolve(resultStr);
      img.src = resultStr;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

// Subtle color accents matching the original piket schedule chart
const AREA_ACCENT_COLORS: Record<string, { bar: string; tag: string }> = {
  'hara-halaman': { bar: 'bg-emerald-500', tag: 'text-emerald-700' },
  'hara-wastafel-cust': { bar: 'bg-cyan-500', tag: 'text-cyan-700' },
  'hara-showcase': { bar: 'bg-blue-500', tag: 'text-blue-700' },
  'hara-toilet-mushola': { bar: 'bg-fuchsia-500', tag: 'text-fuchsia-700' },
  'hara-kitchen-gas': { bar: 'bg-amber-500', tag: 'text-amber-700' },
  'hara-seal-geprek': { bar: 'bg-purple-500', tag: 'text-purple-700' },
};

export const CrewPiketFlow: React.FC<CrewPiketFlowProps> = ({
  onGoToSPVPortal,
  onGoToDashboard,
  onGoToRoster
}) => {
  const {
    areas,
    crewList,
    records,
    activeShift,
    selectedArea,
    selectAreaById,
    getAssignedCrewForArea,
    addRecord,
  } = usePiket();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedCrewName, setSelectedCrewName] = useState<string>('');
  const [isManualCrewSelect, setIsManualCrewSelect] = useState(false);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIVerificationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-detect crew assigned to selectedArea for current active shift
  useEffect(() => {
    if (selectedArea) {
      const assigned = getAssignedCrewForArea(selectedArea.id, activeShift);
      if (assigned) {
        setSelectedCrewName(assigned.name);
        setIsManualCrewSelect(false);
      } else if (crewList.length > 0) {
        setSelectedCrewName(crewList[0].name);
        setIsManualCrewSelect(true);
      }
      setPhotoBase64(null);
      setAiResult(null);
    }
  }, [selectedArea, activeShift]);

  // Handle Photo selection with compression
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file);
      setPhotoBase64(compressed);
      setAiResult(null);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoBase64(reader.result as string);
        setAiResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger Gemini AI Vision
  const handleAnalyzeWithAI = async () => {
    if (!photoBase64 || !selectedArea) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/verify-cleaning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: photoBase64,
          areaName: selectedArea.name,
          areaCode: selectedArea.code,
          category: selectedArea.category,
          standardChecklist: selectedArea.standardChecklist,
          crewName: selectedCrewName,
          shift: activeShift,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal memverifikasi kebersihan');
      }

      const data = await response.json();
      setAiResult(data);
    } catch (err) {
      console.warn('AI verification connection error:', err);
      setAiResult({
        status: 'PERLU_TINDAKLANJUT',
        isCorrectArea: true,
        detectedAreaDescription: `Area ${selectedArea.name}.`,
        summary: 'Pemeriksaan AI visual sedang antre. Foto kebersihan Anda tetap tersimpan dan siap dievaluasi oleh Kepala Outlet (Ummu Sallaamah).',
        findings: [
          'Foto bukti berhasil diunggah',
          'Laporan akan ditinjau langsung oleh Kepala Outlet'
        ],
        checkItems: selectedArea.standardChecklist.map(c => ({
          item: c,
          isClean: true,
          notes: 'Menunggu tinjauan manual'
        })),
        verifiedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit Piket Report
  const handleSubmitPiket = async () => {
    if (!selectedArea || !photoBase64) return;

    setIsSubmitting(true);
    try {
      const finalAiResult = aiResult || {
        status: 'PERLU_TINDAKLANJUT',
        isCorrectArea: true,
        detectedAreaDescription: `Area ${selectedArea.name}.`,
        summary: `Piket dilaporkan langsung oleh ${selectedCrewName}.`,
        findings: ['Foto bukti telah disimpan, menunggu konfirmasi inspeksi Kepala Outlet (Ummu Sallaamah)'],
        checkItems: selectedArea.standardChecklist.map(c => ({ item: c, isClean: false, notes: 'Menunggu Kepala Outlet' })),
        verifiedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };

      await addRecord({
        areaId: selectedArea.id,
        areaName: selectedArea.name,
        areaCode: selectedArea.code,
        crewName: selectedCrewName || 'Kru Outlet',
        shift: activeShift,
        photoBase64,
        aiVerification: finalAiResult,
        notes: additionalNotes.trim() || undefined,
      });

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to submit piket record:', error);
      alert('Gagal menyimpan laporan piket. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextArea = () => {
    setShowSuccessModal(false);
    selectAreaById('');
    setPhotoBase64(null);
    setAiResult(null);
    setAdditionalNotes('');
  };

  // Status for each area today
  const getAreaStatusToday = (areaId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const rec = records.find(r => r.areaId === areaId && r.shift === activeShift && r.date === today);
    if (!rec) return { status: 'BELUM', label: 'Belum dikerjakan', dot: 'bg-zinc-300' };
    if (rec.aiVerification?.status === 'BERSIH_SESUAI_STANDAR') {
      return { status: 'SELESAI', label: 'Bersih terverifikasi', dot: 'bg-emerald-500' };
    }
    return { status: 'PERBAIKAN', label: 'Perlu revisi', dot: 'bg-amber-500' };
  };

  const handleGoToSPV = () => {
    if (onGoToDashboard) {
      onGoToDashboard();
    } else if (onGoToSPVPortal) {
      onGoToSPVPortal();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* 1. ZERO STATE: CHOOSE OR SCAN AREA */}
      {!selectedArea ? (
        <div className="space-y-6">
          {/* Hero Welcome Bar */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1.5">
                <span>Shift {activeShift.split(' ')[0]}</span>
                <span aria-hidden="true">·</span>
                <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight">
                Lapor Piket Harian
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-md">
                Pilih area piket Anda di bawah atau scan stiker QR di lokasi untuk langsung mengambil foto bukti kebersihan.
              </p>
            </div>

            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs sm:text-sm shadow-xs transition-all active:scale-98 shrink-0 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-zinc-300" />
              <span>Scan QR Stiker</span>
            </button>
          </div>

          {/* Area Grid Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold text-zinc-700 tracking-tight">
                Daftar 6 Area Piket
              </h2>
              <button
                onClick={() => {
                  if (onGoToRoster) onGoToRoster();
                  else if (onGoToSPVPortal) onGoToSPVPortal();
                }}
                className="text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Lihat Jadwal Kru</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {areas.map(area => {
                const areaStat = getAreaStatusToday(area.id);
                const assigned = getAssignedCrewForArea(area.id, activeShift);
                const accent = AREA_ACCENT_COLORS[area.id] || { bar: 'bg-zinc-400', tag: 'text-zinc-700' };

                return (
                  <div
                    key={area.id}
                    onClick={() => selectAreaById(area.id)}
                    className="group bg-white rounded-2xl border border-zinc-200/80 hover:border-zinc-400/90 transition-all duration-150 p-4.5 cursor-pointer relative overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-sm"
                  >
                    {/* Left subtle vertical accent color bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent.bar}`} />

                    <div className="pl-2">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-mono font-medium text-zinc-400">
                          {area.code}
                        </span>

                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                          <span className={`w-2 h-2 rounded-full ${areaStat.dot}`} />
                          <span>{areaStat.label}</span>
                        </div>
                      </div>

                      <h3 className="font-semibold text-zinc-900 text-sm leading-snug group-hover:text-zinc-950 transition-colors">
                        {area.name}
                      </h3>

                      <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                        <div className="flex items-center gap-1.5 truncate">
                          <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">
                            {assigned ? assigned.name : 'Belum dijadwalkan'}
                          </span>
                        </div>

                        <span className="text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all text-xs font-medium shrink-0 flex items-center gap-1">
                          <span>Kirim</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* 2. AREA SELECTED: PHOTO + AI VERIFICATION + SUBMIT */
        <div className="space-y-5">
          {/* Back button & Area Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => selectAreaById('')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer py-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Semua Area</span>
            </button>

            <span className="text-xs text-zinc-400 font-mono">
              {selectedArea.code}
            </span>
          </div>

          {/* Area Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                <span>{selectedArea.category}</span>
                <span>·</span>
                <span>Shift {activeShift.split(' ')[0]}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-zinc-900 tracking-tight">
                {selectedArea.name}
              </h1>
            </div>

            {/* Crew Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200/60">
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <UserCheck className="w-4 h-4 text-zinc-500" />
                <span>Petugas:</span>
                <span className="font-semibold text-zinc-900">{selectedCrewName || 'Kru'}</span>
                {!isManualCrewSelect && (
                  <span className="text-[10px] text-zinc-500 bg-zinc-200/70 px-1.5 py-0.5 rounded">
                    Sesuai Roster
                  </span>
                )}
              </div>

              <select
                value={selectedCrewName}
                onChange={(e) => {
                  setSelectedCrewName(e.target.value);
                  setIsManualCrewSelect(true);
                }}
                className="text-xs font-medium bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-zinc-700 focus:outline-hidden"
              >
                {crewList.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Area Standard Checklist */}
            <div className="pt-2">
              <span className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Poin Checklist Standar Kebersihan:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-700">
                {selectedArea.standardChecklist.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-zinc-50/70 border border-zinc-100">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Photo Capture & AI Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-zinc-900 tracking-tight">
                Foto Bukti Kebersihan
              </h2>
              {photoBase64 && (
                <button
                  onClick={() => {
                    setPhotoBase64(null);
                    setAiResult(null);
                  }}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Ambil Ulang</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />

            {!photoBase64 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-200 hover:border-zinc-400 rounded-2xl p-8 sm:p-10 text-center cursor-pointer bg-zinc-50/40 hover:bg-zinc-50/80 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-xs flex items-center justify-center mx-auto text-zinc-700 mb-3 border border-zinc-200/80">
                  <Camera className="w-5 h-5 text-zinc-600" />
                </div>
                <p className="font-semibold text-zinc-900 text-sm">Ambil Foto dengan Kamera HP</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Ketuk untuk mengambil foto langsung atau memilih dari galeri
                </p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-zinc-950 border border-zinc-200">
                <img
                  src={photoBase64}
                  alt="Bukti Piket"
                  className="w-full max-h-[340px] object-contain mx-auto"
                />

                {isAnalyzing && (
                  <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-2xs flex flex-col items-center justify-center text-white p-4 text-center">
                    <Sparkles className="w-6 h-6 text-amber-300 animate-spin mb-2" />
                    <p className="font-medium text-xs">AI Gemini sedang memeriksa foto kebersihan...</p>
                  </div>
                )}
              </div>
            )}

            {/* AI Verify Button */}
            {photoBase64 && !aiResult && !isAnalyzing && (
              <button
                onClick={handleAnalyzeWithAI}
                className="w-full py-3 px-4 rounded-xl bg-zinc-900 text-white font-medium text-xs sm:text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Verifikasi Kebersihan dengan AI</span>
              </button>
            )}

            {/* AI Result Card */}
            {aiResult && (
              <div
                className={`p-4 rounded-xl border ${
                  !aiResult.isCorrectArea
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : aiResult.status === 'BERSIH_SESUAI_STANDAR'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        !aiResult.isCorrectArea
                          ? 'bg-rose-600'
                          : aiResult.status === 'BERSIH_SESUAI_STANDAR'
                          ? 'bg-emerald-600'
                          : 'bg-amber-600'
                      }`}
                    />
                    <span className="font-semibold text-xs">
                      {!aiResult.isCorrectArea
                        ? 'Foto Ditolak: Bukan Area Terkait'
                        : aiResult.status === 'BERSIH_SESUAI_STANDAR'
                        ? 'Bersih Sesuai Standar'
                        : 'Perlu Dibersihkan Ulang'}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {aiResult.verifiedAt} WIB
                  </span>
                </div>

                {aiResult.detectedAreaDescription && (
                  <p className="text-xs text-zinc-600 mb-2">
                    Terdeteksi: <span className="font-medium text-zinc-800">{aiResult.detectedAreaDescription}</span>
                  </p>
                )}

                <p className="text-xs leading-relaxed text-zinc-800 bg-white/80 p-3 rounded-lg border border-zinc-200/50">
                  {aiResult.summary}
                </p>

                {aiResult.findings && aiResult.findings.length > 0 && (
                  <ul className="mt-2 text-xs text-zinc-700 space-y-1">
                    {aiResult.findings.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-zinc-400">·</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {!aiResult.isCorrectArea && (
                  <button
                    onClick={() => {
                      setPhotoBase64(null);
                      setAiResult(null);
                      setTimeout(() => fileInputRef.current?.click(), 100);
                    }}
                    className="mt-3 w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ambil Foto Ulang Area Sebenarnya</span>
                  </button>
                )}
              </div>
            )}

            {/* Notes Input */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                Catatan Tambahan (Opsional):
              </label>
              <input
                type="text"
                placeholder="Contoh: Meja sudah dilap dan disanitasi"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full text-xs rounded-xl border border-zinc-200 p-2.5 text-zinc-800 bg-white focus:outline-hidden focus:border-zinc-400"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                disabled={!photoBase64 || isSubmitting}
                onClick={handleSubmitPiket}
                className={`w-full py-3.5 px-4 rounded-xl font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                  photoBase64 && !isSubmitting
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-white cursor-pointer active:scale-98 shadow-xs'
                    : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan ke Database & Sheets...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Hasil Piket</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR CAMERA SCANNER MODAL */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectArea={(area) => selectAreaById(area.id)}
      />

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center shadow-xl border border-zinc-200">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-base font-semibold text-zinc-900">
              Laporan Berhasil Terkirim
            </h3>
            <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
              Area <strong>{selectedArea?.name}</strong> telah dilaporkan oleh <strong>{selectedCrewName}</strong> dan tersimpan di database serta Google Sheets.
            </p>

            <div className="mt-5 space-y-2">
              <button
                onClick={handleNextArea}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 text-white font-medium text-xs hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Lanjut Scan Area Lain
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  handleGoToSPV();
                }}
                className="w-full py-2 px-4 rounded-xl border border-zinc-200 text-zinc-700 font-medium text-xs hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                Buka Portal Kepala Outlet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
