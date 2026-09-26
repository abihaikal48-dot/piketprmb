import React, { useState } from 'react';
import {
  Calendar,
  Users,
  UserPlus,
  Clock,
  CheckCircle2,
  Shuffle,
  Shield,
  Phone,
  Info
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
    const activeCrews = crewList.filter(c => c.active && c.role !== 'Supervisor');
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
    <div className="max-w-4xl mx-auto px-4 py-5 sm:py-6 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Pengaturan Roster
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Jadwal Piket Kru Cihuy
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur kru yang bertugas di tiap area. Saat kru scan QR, nama mereka otomatis terisi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCrewModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Kru</span>
          </button>
        </div>
      </div>

      {/* Date & Shift Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-hidden"
            />
          </div>

          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            {(['Pagi (08:00 - 15:00)', 'Sore / Closing (15:00 - 22:30)'] as ShiftType[]).map((sh) => (
              <button
                key={sh}
                onClick={() => {
                  setSelectedShift(sh);
                  setActiveShift(sh);
                }}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  selectedShift === sh
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sh.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccessMsg && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Tersimpan
            </span>
          )}

          <button
            onClick={handleAutoDistribute}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
          >
            <Shuffle className="w-3 h-3 text-slate-600" />
            <span>Bagi Otomatis</span>
          </button>
        </div>
      </div>

      {/* Roster Assignment Grid */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900">
          Penugasan Area ({selectedShift})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {areas.map((area) => {
            const assignedCrewId = getAssignedCrewId(area.id);

            return (
              <div
                key={area.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                      <AreaIcon categoryOrId={area.id} className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold block">{area.code}</span>
                      <h3 className="font-bold text-slate-900 text-xs">{area.name}</h3>
                    </div>
                  </div>
                </div>

                <div>
                  <select
                    value={assignedCrewId}
                    onChange={(e) => handleAssign(area.id, e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
                  >
                    <option value="">-- Pilih Kru --</option>
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
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-700" />
            <h2 className="text-xs font-bold text-slate-900">Kru Terdaftar ({crewList.length})</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {crewList.map((crew) => (
            <div
              key={crew.id}
              className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between gap-2 text-xs"
            >
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">{crew.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{crew.role}</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Add Crew Modal */}
      {showAddCrewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xs rounded-2xl p-5 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Tambah Kru Baru</h3>

            <form onSubmit={handleAddCrewSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi"
                  value={newCrewName}
                  onChange={(e) => setNewCrewName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Role / Posisi</label>
                <select
                  value={newCrewRole}
                  onChange={(e) => setNewCrewRole(e.target.value as CrewMember['role'])}
                  className="w-full text-xs font-semibold rounded-lg border border-slate-300 p-2 text-slate-800"
                >
                  <option value="Crew Kitchen">Crew Kitchen</option>
                  <option value="Crew Cashier">Crew Cashier</option>
                  <option value="Crew Dining">Crew Dining</option>
                  <option value="Supervisor">Supervisor</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddCrewModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
