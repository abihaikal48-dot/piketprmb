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
  Info
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

// Client-side image compression to prevent memory freeze and LocalStorage QuotaExceeded crashes
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
        isCorrectArea: false,
        detectedAreaDescription: 'Koneksi ke backend verifikasi AI gagal.',
        summary: 'Gagal menghubungkan ke server verifikasi AI. Pastikan variabel GEMINI_API_KEY sudah diset di Vercel (Project Settings > Environment Variables).',
        findings: [
          'Endpoint /api/verify-cleaning tidak memberikan respon valid',
          'Pastikan deployment di Vercel memiliki environment variable GEMINI_API_KEY',
          'Laporan tetap dapat disimpan untuk ditinjau secara langsung oleh SPV'
        ],
        checkItems: selectedArea.standardChecklist.map(c => ({
          item: c,
          isClean: false,
          notes: 'Belum terverifikasi AI'
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
        isCorrectArea: false,
        detectedAreaDescription: `Area ${selectedArea.name}.`,
        summary: `Piket dilaporkan langsung oleh ${selectedCrewName} tanpa verifikasi AI.`,
        findings: ['Foto bukti telah disimpan, menunggu konfirmasi inspeksi SPV'],
        checkItems: selectedArea.standardChecklist.map(c => ({ item: c, isClean: false, notes: 'Menunggu SPV' })),
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
    if (!rec) return { status: 'BELUM', label: 'Belum', color: 'bg-slate-100 text-slate-500' };
    if (rec.aiVerification?.status === 'BERSIH_SESUAI_STANDAR') {
      return { status: 'SELESAI', label: 'Bersih', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    return { status: 'PERBAIKAN', label: 'Perlu Revisi', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  };

  const handleGoToSPV = () => {
    if (onGoToDashboard) {
      onGoToDashboard();
    } else if (onGoToSPVPortal) {
      onGoToSPVPortal();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 sm:py-6">
      {/* 1. ZERO STATE: CHOOSE OR SCAN AREA */}
      {!selectedArea ? (
        <div className="space-y-4">
          {/* Main Action Banner */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Hara Chicken • Shift {activeShift.split(' ')[0]}
                </span>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                  Lapor Piket Kebersihan Outlet
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Scan QR code stiker di meja/area kerja, atau pilih area di bawah:
                </p>
              </div>

              {/* Big Scan Button */}
              <button
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-2xs transition-all active:scale-98 shrink-0 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan QR Stiker</span>
              </button>
            </div>
          </div>

          {/* Area List Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-600">Pilih Area Piket:</span>
              <button
                onClick={() => {
                  if (onGoToRoster) onGoToRoster();
                  else if (onGoToSPVPortal) onGoToSPVPortal();
                }}
                className="text-xs text-slate-500 hover:text-slate-900 font-medium"
              >
                Lihat Jadwal Kru
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {areas.map(area => {
                const areaStat = getAreaStatusToday(area.id);
                const assigned = getAssignedCrewForArea(area.id, activeShift);

                return (
                  <div
                    key={area.id}
                    onClick={() => selectAreaById(area.id)}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-400 transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        <AreaIcon categoryOrId={area.id} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-400 font-bold">
                            {area.code}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${areaStat.color}`}>
                            {areaStat.label}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate mt-0.5">
                          {area.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 truncate">
                          {assigned ? assigned.name : 'Belum Dijadwalkan'}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* 2. AREA SELECTED: PHOTO + AI VERIFICATION + SUBMIT */
        <div className="space-y-4">
          {/* Header Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                  <AreaIcon categoryOrId={selectedArea.id} className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-500">
                    <span>{selectedArea.code}</span>
                    <span>•</span>
                    <span>{selectedArea.category}</span>
                  </div>
                  <h1 className="text-base sm:lg font-bold text-slate-900 leading-tight">
                    {selectedArea.name}
                  </h1>
                </div>
              </div>

              <button
                onClick={() => selectAreaById('')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Ganti Area
              </button>
            </div>

            {/* Crew Identifier (Auto-filled) */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-600" />
                <span className="text-xs text-slate-600">Petugas:</span>
                <span className="text-xs font-bold text-slate-900">{selectedCrewName || 'Kru'}</span>
                {!isManualCrewSelect && (
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                    Otomatis
                  </span>
                )}
              </div>

              <select
                value={selectedCrewName}
                onChange={(e) => {
                  setSelectedCrewName(e.target.value);
                  setIsManualCrewSelect(true);
                }}
                className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
              >
                {crewList.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Area SOP Checklist */}
            <div className="mt-3">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Standar Kebersihan Area:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700">
                {selectedArea.standardChecklist.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 p-1.5 rounded bg-slate-50/80">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Photo Capture & AI Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Foto Bukti Kebersihan</span>
              {photoBase64 && (
                <button
                  onClick={() => {
                    setPhotoBase64(null);
                    setAiResult(null);
                  }}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Foto Ulang
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
                className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-2xs flex items-center justify-center mx-auto text-slate-700 mb-2.5">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="font-bold text-slate-900 text-sm">Ambil Foto dengan Kamera HP</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ketuk di sini untuk membuka kamera atau galeri foto
                </p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-200">
                <img
                  src={photoBase64}
                  alt="Bukti Piket"
                  className="w-full max-h-[300px] object-contain mx-auto"
                />

                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-2xs flex flex-col items-center justify-center text-white">
                    <Sparkles className="w-8 h-8 text-amber-300 animate-spin mb-2" />
                    <p className="font-bold text-xs">AI Memeriksa Foto Kebersihan...</p>
                  </div>
                )}
              </div>
            )}

            {/* AI Verify Button */}
            {photoBase64 && !aiResult && !isAnalyzing && (
              <button
                onClick={handleAnalyzeWithAI}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Verifikasi Kebersihan dengan AI</span>
              </button>
            )}

            {/* AI Result Card */}
            {aiResult && (
              <div
                className={`p-3.5 rounded-xl border ${
                  !aiResult.isCorrectArea
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : aiResult.status === 'BERSIH_SESUAI_STANDAR'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {!aiResult.isCorrectArea ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    ) : aiResult.status === 'BERSIH_SESUAI_STANDAR' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                    )}
                    <span className="font-bold text-xs">
                      {!aiResult.isCorrectArea
                        ? 'Foto Ditolak: Bukan Area Terkait'
                        : aiResult.status === 'BERSIH_SESUAI_STANDAR'
                        ? 'Bersih Sesuai Standar'
                        : 'Perlu Dibersihkan Ulang'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {aiResult.verifiedAt} WIB
                  </span>
                </div>

                {aiResult.detectedAreaDescription && (
                  <div className="text-[11px] font-semibold text-slate-600 mb-1.5">
                    Terdeteksi: <span className="font-mono text-slate-800">{aiResult.detectedAreaDescription}</span>
                  </div>
                )}

                <p className="text-xs leading-relaxed text-slate-800 bg-white/80 p-2.5 rounded-lg border border-slate-200/50">
                  {aiResult.summary}
                </p>

                {aiResult.findings && aiResult.findings.length > 0 && (
                  <ul className="mt-2 text-[11px] text-slate-700 space-y-0.5">
                    {aiResult.findings.map((f, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-slate-400 font-bold">•</span>
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
                    className="mt-3 w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ambil Foto Ulang Area Sebenarnya</span>
                  </button>
                )}
              </div>
            )}

            {/* Notes Input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Catatan Tambahan (Opsional):
              </label>
              <input
                type="text"
                placeholder="Contoh: Meja sudah dilap dan disanitasi"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 text-slate-800 bg-white focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                disabled={!photoBase64 || isSubmitting}
                onClick={handleSubmitPiket}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                  photoBase64 && !isSubmitting
                    ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer active:scale-98'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center shadow-xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Laporan Berhasil Terkirim!
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Area <strong>{selectedArea?.name}</strong> telah dilaporkan oleh <strong>{selectedCrewName}</strong> dan tersimpan di database.
            </p>

            <div className="mt-5 space-y-2">
              <button
                onClick={handleNextArea}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
              >
                Lanjut Scan Area Lain
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  handleGoToSPV();
                }}
                className="w-full py-2 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Buka Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
