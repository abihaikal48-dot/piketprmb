import React, { useState } from 'react';
import {
  Calendar,
  Users,
  UserPlus,
  Clock,
  Sparkles,
  CheckCircle2,
  Shuffle,
  Shield,
  Phone,
  Save,
  Info
} from 'lucide-react';
import { usePiket } from '../context/PiketContext';
import { CrewMember, ShiftType } from '../types/piket';
import { getTodayDateString } from '../data/piketData';

export const RosterManager: React.FC = () => {
  const {
    areas,
    crewList,
    schedules,
    activeShift,
    updateScheduleAssignment,
    addNewCrew,
    setActiveShift
  } = usePiket();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedShift, setSelectedShift] = useState<ShiftType>(activeShift);
  const [newCrewName, setNewCrewName] = useState('');
  const [newCrewRole, setNewCrewRole] = useState<CrewMember['role']>('Crew Kitchen');
  const [newCrewPhone, setNewCrewPhone] = useState('');
  const [showAddCrewModal, setShowAddCrewModal] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Find schedule for selected date & shift
  const currentSchedule = schedules.find(
    s => s.date === selectedDate && s.shift === selectedShift
  );

  const getAssignedCrewId = (areaId: string): string => {
    if (!currentSchedule) return '';
    const found = currentSchedule.assignments.find(a => a.areaId === areaId);
    return found ? found.crewId : '';
  };

  const handleAssign = (areaId: string, crewId: string) => {
    updateScheduleAssignment(selectedDate, selectedShift, areaId, crewId);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2000);
  };

  // Auto-distribute active crew members evenly across all areas
  const handleAutoDistribute = () => {
    const activeCrews = crewList.filter(c => c.active && c.role !== 'Supervisor');
    if (activeCrews.length === 0) return;

    areas.forEach((area, index) => {
      const assignedCrew = activeCrews[index % activeCrews.length];
      updateScheduleAssignment(selectedDate, selectedShift, area.id, assignedCrew.id);
    });

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  const handleAddCrewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCrewName.trim()) return;

    addNewCrew(newCrewName, newCrewRole, newCrewPhone.trim() || undefined);
    setNewCrewName('');
    setNewCrewPhone('');
    setShowAddCrewModal(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Clock className="w-3.5 h-3.5" />
            Fitur Buat & Kelola Piket Kru
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Penjadwalan Roster Piket Hara Chicken
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Tentukan kru penanggung jawab untuk setiap titik area. Saat kru memindai QR stiker di area kerja, nama mereka langsung <strong>terisi otomatis</strong> tanpa perlu ketik manual.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCrewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>Tambah Kru Baru</span>
          </button>
        </div>
      </div>

      {/* Date & Shift Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            />
          </div>

          {/* Shift Selector */}
          <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
            {(['Pagi (08:00 - 15:00)', 'Sore / Closing (15:00 - 22:30)'] as ShiftType[]).map((sh) => (
              <button
                key={sh}
                onClick={() => {
                  setSelectedShift(sh);
                  setActiveShift(sh);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  selectedShift === sh
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sh.split(' ')[0]} Shift
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccessMsg && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Jadwal Diperbarui!
            </span>
          )}

          <button
            onClick={handleAutoDistribute}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-700" />
            <span>Bagi Otomatis Semua Kru</span>
          </button>
        </div>
      </div>

      {/* Roster Assignment Grid */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Penetapan Kru per Titik Piket ({selectedShift})
            </h2>
            <p className="text-xs text-slate-500">
              Pilih kru penanggung jawab untuk masing-masing stasiun fisik outlet:
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {areas.length} Area Piket
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {areas.map((area) => {
            const assignedCrewId = getAssignedCrewId(area.id);
            const assignedCrew = crewList.find(c => c.id === assignedCrewId);

            return (
              <div
                key={area.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                        {area.code}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">{area.category}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{area.name}</h3>
                  </div>

                  <span className="text-xl">
                    {area.category === 'Kitchen' ? '🍗' : area.category === 'Service' ? '🛎️' : '🧼'}
                  </span>
                </div>

                {/* Dropdown Crew Assignee */}
                <div className="pt-2 border-t border-slate-200/60">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Petugas Piket:
                  </label>
                  <select
                    value={assignedCrewId}
                    onChange={(e) => handleAssign(area.id, e.target.value)}
                    className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 shadow-2xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  >
                    <option value="">-- Pilih Kru Penanggung Jawab --</option>
                    {crewList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5 text-xs text-blue-900">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            <strong>Tips Operasional:</strong> Pengaturan ini langsung aktif. Ketika kru membuka kamera scan QR di area <em>"Meja Kasir"</em>, sistem langsung mengenali nama kru yang dijadwalkan di sini sehingga kru bisa langsung memotret dan mengirim tanpa input manual.
          </span>
        </div>
      </div>

      {/* Crew Members Directory Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-bold text-slate-900">Daftar Kru Hara Chicken Terdaftar</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Total: {crewList.length} Personel
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {crewList.map((crew) => (
            <div
              key={crew.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                  {crew.name.charAt(0)}
                </div>
                <div className="truncate">
                  <p className="font-bold text-xs text-slate-900 truncate">{crew.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{crew.role}</p>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Aktif
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Crew Modal */}
      {showAddCrewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Tambah Kru Outlet Baru</h3>
            <p className="text-xs text-slate-500 mb-4">
              Masukkan nama personel yang bekerja di outlet Hara Chicken.
            </p>

            <form onSubmit={handleAddCrewSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Kru</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Fauzi"
                  value={newCrewName}
                  onChange={(e) => setNewCrewName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Posisi / Role</label>
                <select
                  value={newCrewRole}
                  onChange={(e) => setNewCrewRole(e.target.value as CrewMember['role'])}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                >
                  <option value="Crew Kitchen">Crew Kitchen (Fryer / Dapur)</option>
                  <option value="Crew Cashier">Crew Cashier (Kasir & Warmer)</option>
                  <option value="Crew Dining">Crew Dining (Layanan & Meja)</option>
                  <option value="Supervisor">Supervisor / Kepala Outlet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp (Opsional)</label>
                <input
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={newCrewPhone}
                  onChange={(e) => setNewCrewPhone(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCrewModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-md shadow-red-600/20"
                >
                  Simpan Kru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
