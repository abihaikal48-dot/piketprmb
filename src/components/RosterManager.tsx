import React, { useState } from 'react';
import {
  Calendar,
  Users,
  UserPlus,
  CheckCircle2,
  Shuffle,
  X,
  User
} from 'lucide-react';
import { usePiket } from '../context/PiketContext';
import { CrewMember, ShiftType } from '../types/piket';
import { getTodayDateString } from '../data/piketData';
import { AreaIcon } from './AreaIcon';

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

  const handleAutoDistribute = () => {
    const activeCrews = crewList.filter(c => c.active && c.role !== 'Supervisor' && c.role !== 'Kepala Outlet');
    if (activeCrews.length === 0) return;

    areas.forEach((area, index) => {
      const assignedCrew = activeCrews[index % activeCrews.length];
      updateScheduleAssignment(selectedDate, selectedShift, area.id, assignedCrew.id);
    });

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2000);
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
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <span>Roster Piket</span>
            <span>·</span>
            <span>Kepala Outlet: Ummu Sallaamah</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight">
            Jadwal Piket Kru Outlet
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-md">
            Atur penugasan kru di 6 area kerja. Saat kru membuka aplikasi atau scan QR, nama mereka akan terdeteksi otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCrewModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-white font-medium text-xs hover:bg-zinc-800 transition-colors shadow-xs cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Kru Baru</span>
          </button>
        </div>
      </div>

      {/* Date & Shift Bar */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 text-xs text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-medium text-zinc-800 focus:outline-hidden"
            />
          </div>

          <div className="flex rounded-xl border border-zinc-200 p-0.5 bg-zinc-50">
            {(['Pagi (08:00 - 15:00)', 'Sore / Closing (15:00 - 22:30)'] as ShiftType[]).map((sh) => (
              <button
                key={sh}
                onClick={() => {
                  setSelectedShift(sh);
                  setActiveShift(sh);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedShift === sh
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {sh.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccessMsg && (
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Tersimpan
            </span>
          )}

          <button
            onClick={handleAutoDistribute}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-medium transition-colors cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5 text-zinc-500" />
            <span>Bagi Rata Otomatis</span>
          </button>
        </div>
      </div>

      {/* Roster Assignment Grid */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">
          Penugasan 6 Area Piket ({selectedShift})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {areas.map((area) => {
            const assignedCrewId = getAssignedCrewId(area.id);

            return (
              <div
                key={area.id}
                className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0">
                      <AreaIcon categoryOrId={area.id} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-zinc-400 block">{area.code}</span>
                      <h3 className="font-medium text-zinc-900 text-xs truncate">{area.name}</h3>
                    </div>
                  </div>
                </div>

                <div>
                  <select
                    value={assignedCrewId}
                    onChange={(e) => handleAssign(area.id, e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-hidden focus:border-zinc-400"
                  >
                    <option value="">-- Pilih Kru Bertugas --</option>
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
      </div>

      {/* Crew Members List */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-500" />
            <h2 className="text-xs font-semibold text-zinc-900">Daftar Kru ({crewList.length} Orang)</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {crewList.map((crew) => (
            <div
              key={crew.id}
              className="p-3 rounded-xl border border-zinc-200/80 bg-white flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900 truncate">{crew.name}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{crew.role}</p>
                </div>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Add Crew Modal */}
      {showAddCrewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-semibold text-zinc-900">Tambah Kru Baru</h3>
              <button
                onClick={() => setShowAddCrewModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCrewSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-700 font-medium mb-1">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={newCrewName}
                  onChange={(e) => setNewCrewName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 p-2.5 text-zinc-800 bg-white focus:outline-hidden focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="block text-zinc-700 font-medium mb-1">Peran / Posisi:</label>
                <select
                  value={newCrewRole}
                  onChange={(e) => setNewCrewRole(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-200 p-2.5 text-zinc-800 bg-white focus:outline-hidden"
                >
                  <option value="Crew Kitchen">Crew Kitchen</option>
                  <option value="Crew Service">Crew Service</option>
                  <option value="Leader Shift">Leader Shift</option>
                  <option value="Kepala Outlet">Kepala Outlet</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-700 font-medium mb-1">No. WhatsApp (Opsional):</label>
                <input
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={newCrewPhone}
                  onChange={(e) => setNewCrewPhone(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 p-2.5 text-zinc-800 bg-white focus:outline-hidden focus:border-zinc-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCrewModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 text-zinc-600 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors shadow-xs cursor-pointer"
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
