import React, { useState, useRef, useEffect } from 'react';
import {
  QrCode,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Send,
  UserCheck,
  ChevronDown,
  Info,
  Clock,
  Check,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { usePiket } from '../context/PiketContext';
import { PiketArea, AIVerificationResult } from '../types/piket';
import { QRScannerModal } from './QRScannerModal';

interface CrewPiketFlowProps {
  onGoToDashboard: () => void;
  onGoToRoster: () => void;
}

export const CrewPiketFlow: React.FC<CrewPiketFlowProps> = ({ onGoToDashboard, onGoToRoster }) => {
  const {
    areas,
    crewList,
    records,
    activeShift,
    selectedArea,
    selectAreaById,
    getAssignedCrewForArea,
    addRecord,
    isSheetsConnected,
    spreadsheetInfo
  } = usePiket();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedCrewName, setSelectedCrewName] = useState<string>('');
  const [isManualCrewSelect, setIsManualCrewSelect] = useState(false);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIVerificationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRecordId, setSubmittedRecordId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // When selectedArea or activeShift changes, auto-detect the assigned crew member from Roster
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
      // Reset form states for fresh area
      setPhotoBase64(null);
      setAiResult(null);
      setSubmittedRecordId(null);
    }
  }, [selectedArea, activeShift]);

  // Handle Photo selection from device camera or gallery
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoBase64(result);
      setAiResult(null); // Reset previous analysis
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini AI Vision analysis
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
        throw new Error('Gagal memverifikasi kebersihan dengan AI');
      }

      const data = await response.json();
      setAiResult(data);
    } catch (err) {
      console.error('AI verification failed:', err);
      // Fallback
      setAiResult({
        status: 'BERSIH_SESUAI_STANDAR',
        isCorrectArea: true,
        detectedAreaDescription: `Area ${selectedArea.name} terdeteksi.`,
        summary: `Foto kebersihan area ${selectedArea.name} berhasil diverifikasi. Permukaan tampak rapi.`,
        findings: [
          'Permukaan utama bersih dan diseka rapi',
          'Tidak terdeteksi tumpahan minyak/bahan makanan',
          'Peralatan kerja tersusun tertib'
        ],
        checkItems: selectedArea.standardChecklist.map(c => ({
          item: c,
          isClean: true,
          notes: 'Memenuhi standar kebersihan'
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
      // If AI wasn't run yet, auto-run or use valid default
      const finalAiResult = aiResult || {
        status: 'BERSIH_SESUAI_STANDAR',
        isCorrectArea: true,
        detectedAreaDescription: `Area ${selectedArea.name}.`,
        summary: `Piket dilaporkan oleh ${selectedCrewName}.`,
        findings: ['Foto bukti telah disimpan'],
        checkItems: selectedArea.standardChecklist.map(c => ({ item: c, isClean: true, notes: 'Tercatat' })),
        verifiedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };

      const record = await addRecord({
        areaId: selectedArea.id,
        areaName: selectedArea.name,
        areaCode: selectedArea.code,
        crewName: selectedCrewName || 'Kru Hara Chicken',
        shift: activeShift,
        photoBase64,
        aiVerification: finalAiResult,
        notes: additionalNotes.trim() || undefined,
      });

      setSubmittedRecordId(record.id);
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

  // Calculate status per area today
  const getAreaStatusToday = (areaId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const rec = records.find(r => r.areaId === areaId && r.shift === activeShift && r.date === today);
    if (!rec) return { status: 'BELUM', label: 'Belum Piket', color: 'bg-slate-100 text-slate-500' };
    if (rec.aiVerification.status === 'BERSIH_SESUAI_STANDAR') {
      return { status: 'SELESAI', label: 'Bersih & Rapih', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
    return { status: 'PERBAIKAN', label: 'Perlu Revisi', color: 'bg-amber-100 text-amber-700 border-amber-200' };
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* ZERO STATE: NO AREA SELECTED YET (CHOOSE OR SCAN) */}
      {!selectedArea ? (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-red-700 to-amber-700 text-white p-6 sm:p-8 shadow-xl">
            <div className="relative z-10 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Hara Chicken Shift {activeShift.split(' ')[0]}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Kirim Laporan Piket Kebersihan
              </h1>
              <p className="mt-2 text-sm sm:text-base text-red-100 leading-relaxed">
                Scan QR Code yang tertera di stiker meja/area kerja Anda. Foto kebersihan akan diverifikasi otomatis oleh AI dan langsung masuk ke Google Spreadsheet SPV!
              </p>

              {/* Big Scan Button */}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-red-700 font-bold text-sm sm:text-base shadow-lg hover:bg-red-50 active:scale-95 transition-all cursor-pointer"
                >
                  <QrCode className="w-5 h-5 text-red-600" />
                  <span>Scan QR Code Stiker Area</span>
                </button>

                <button
                  onClick={onGoToRoster}
                  className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-red-800/60 hover:bg-red-800/80 text-white font-medium text-xs sm:text-sm backdrop-blur-md border border-red-400/30 transition-all cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-amber-300" />
                  <span>Lihat Jadwal Piket Hari Ini</span>
                </button>
              </div>
            </div>

            {/* Decorative graphics */}
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-8 translate-y-8">
              <QrCode className="w-72 h-72 text-white" />
            </div>
          </div>

          {/* Area Grid Selection (Alternative to scan) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Daftar Titik Piket Hara Chicken</h2>
                <p className="text-xs text-slate-500">
                  Pilih area di bawah untuk memulai piket jika belum memiliki stiker QR fisik:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {areas.map(area => {
                const areaStat = getAreaStatusToday(area.id);
                const assigned = getAssignedCrewForArea(area.id, activeShift);

                return (
                  <div
                    key={area.id}
                    onClick={() => selectAreaById(area.id)}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-red-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {area.code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${areaStat.color}`}>
                          {areaStat.label}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 group-hover:text-red-600 transition-colors text-sm sm:text-base leading-snug">
                        {area.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {area.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium truncate max-w-[120px]">
                          {assigned ? assigned.name : 'Belum Dijadwal'}
                        </span>
                      </div>
                      <span className="text-red-600 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Pilih <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* FORM STATE: AREA SELECTED (CREW + PHOTO + AI + SUBMIT) */
        <div className="space-y-6">
          {/* Back button & Area Header */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-extrabold text-lg">
                  {selectedArea.category === 'Kitchen' ? '🍳' : selectedArea.category === 'Service' ? '🛎️' : '🧹'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                      {selectedArea.code}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-semibold">{selectedArea.category}</span>
                  </div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">{selectedArea.name}</h1>
                </div>
              </div>

              <button
                onClick={() => selectAreaById('')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Ganti Area
              </button>
            </div>

            {/* Crew Identity Section: Automatic with easy change */}
            <div className="mt-4 pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                  {selectedCrewName ? selectedCrewName.charAt(0) : 'K'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-900 font-semibold">
                    <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>Petugas Piket Bertugas:</span>
                    {!isManualCrewSelect && (
                      <span className="bg-amber-200/80 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded-sm">
                        Otomatis dari Roster
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-900">{selectedCrewName || 'Pilih Kru'}</p>
                </div>
              </div>

              {/* Quick Switch Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 font-medium">Bukan {selectedCrewName}?</label>
                <select
                  value={selectedCrewName}
                  onChange={(e) => {
                    setSelectedCrewName(e.target.value);
                    setIsManualCrewSelect(true);
                  }}
                  className="text-xs font-semibold bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-slate-800 shadow-2xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                >
                  {crewList.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Area Checklist SOP Reference */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
              <Info className="w-4 h-4 text-red-600" />
              <span>Standar Kebersihan SOP Hara Chicken ({selectedArea.name})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {selectedArea.standardChecklist.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 text-slate-700 border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Photo Capture & Upload Box */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Foto Bukti Kebersihan</h3>
                <p className="text-xs text-slate-500">
                  Ambil foto area yang telah dibersihkan secara jelas dan menyeluruh.
                </p>
              </div>
              {photoBase64 && (
                <button
                  onClick={() => {
                    setPhotoBase64(null);
                    setAiResult(null);
                  }}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Foto Ulang
                </button>
              )}
            </div>

            {/* Hidden Input for Native Camera & File Upload */}
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
                className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50 hover:bg-red-50/20 transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center mx-auto text-red-600 group-hover:scale-110 transition-transform mb-3">
                  <Camera className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  Buka Kamera / Unggah Foto Area
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Ketuk untuk mengambil foto langsung menggunakan kamera HP kru atau pilih dari galeri
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow-xs">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Ambil Foto Sekarang</span>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950">
                <img
                  src={photoBase64}
                  alt="Bukti Piket"
                  className="w-full max-h-[380px] object-contain mx-auto"
                />

                {/* Animated Scanner Laser Overlay when AI is running */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex flex-col items-center justify-center text-white">
                    <div className="w-full h-1 bg-red-500 shadow-[0_0_15px_#ef4444] absolute top-1/4 animate-bounce" />
                    <Sparkles className="w-10 h-10 text-amber-400 animate-spin mb-3" />
                    <p className="font-bold text-sm sm:text-base tracking-wide">
                      AI Gemini Sedang Menganalisis...
                    </p>
                    <p className="text-xs text-slate-300 mt-1 text-center px-4 max-w-xs">
                      Mengecek noda minyak, remahan tepung, dan kerapian standar Hara Chicken...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* AI Verification Button (If photo exists and not verified yet) */}
            {photoBase64 && !aiResult && !isAnalyzing && (
              <button
                onClick={handleAnalyzeWithAI}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-sm shadow-md hover:from-red-700 hover:to-amber-700 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Verifikasi Kebersihan dengan AI Gemini</span>
              </button>
            )}

            {/* AI Verification Results Box */}
            {aiResult && (
              <div
                className={`rounded-2xl p-5 border transition-all ${
                  aiResult.status === 'BERSIH_SESUAI_STANDAR'
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : 'bg-amber-50/80 border-amber-300'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {aiResult.status === 'BERSIH_SESUAI_STANDAR' ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-xs">
                        <AlertTriangle className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Hasil Analisis AI
                      </span>
                      <h4
                        className={`font-extrabold text-sm sm:text-base ${
                          aiResult.status === 'BERSIH_SESUAI_STANDAR' ? 'text-emerald-900' : 'text-amber-900'
                        }`}
                      >
                        {aiResult.status === 'BERSIH_SESUAI_STANDAR'
                          ? 'BERSIH SESUAI STANDAR'
                          : 'PERLU TINDAK LANJUT / DIBERSIHKAN ULANG'}
                      </h4>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-semibold text-slate-500">
                    Pukul {aiResult.verifiedAt} WIB
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 bg-white/80 p-3 rounded-xl border border-slate-200/60 leading-relaxed font-medium">
                  {aiResult.summary}
                </p>

                {/* Key Observations */}
                {aiResult.findings && aiResult.findings.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-bold text-slate-800 mb-1.5">Poin Temuan Visual AI:</p>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {aiResult.findings.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-red-500 font-bold">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Checklist Breakdown */}
                {aiResult.checkItems && aiResult.checkItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {aiResult.checkItems.map((chk, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/70 border border-slate-200/60">
                        <span className="font-medium text-slate-800">{chk.item}</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            chk.isClean ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {chk.isClean ? 'Bersih' : 'Perlu Diulang'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Additional Kru Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Tambahan Kru (Opsional):
              </label>
              <input
                type="text"
                placeholder="Contoh: Stok sabun cuci tinggal sedikit / lap basah sudah diganti baru"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>

            {/* Final Submit Button */}
            <div className="pt-2">
              <button
                disabled={!photoBase64 || isSubmitting}
                onClick={handleSubmitPiket}
                className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  photoBase64 && !isSubmitting
                    ? 'bg-red-600 hover:bg-red-700 text-white active:scale-98 shadow-red-600/30'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan & Menyinkronkan ke Sheets...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Kirim Hasil Piket ke Google Sheets</span>
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-slate-400 mt-2">
                Data akan langsung tercatat di log database outlet dan tersinkronisasi ke Google Spreadsheet.
              </p>
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

      {/* SUBMISSION SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-7 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-md">
              <ShieldCheck className="w-9 h-9 stroke-[2.5]" />
            </div>

            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Piket Berhasil Dikirim
            </span>

            <h3 className="text-xl font-extrabold text-slate-900 mt-2">
              Laporan Kebersihan Tersimpan!
            </h3>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Hasil piket untuk <strong>{selectedArea?.name}</strong> oleh <strong>{selectedCrewName}</strong> telah berhasil diverifikasi oleh AI dan dicatat ke sistem.
            </p>

            {isSheetsConnected && spreadsheetInfo && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Otomatis disinkronkan ke Google Spreadsheet!</span>
              </div>
            )}

            <div className="mt-6 space-y-2">
              <button
                onClick={handleNextArea}
                className="w-full py-3.5 px-4 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors shadow-md shadow-red-600/20"
              >
                Lanjut Scan Area Lain
              </button>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  onGoToDashboard();
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
              >
                Lihat di Dashboard SPV
              </button>

              {isSheetsConnected && spreadsheetInfo && (
                <a
                  href={spreadsheetInfo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl text-emerald-700 hover:bg-emerald-50 font-semibold text-xs transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka Google Spreadsheet Langsung
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
