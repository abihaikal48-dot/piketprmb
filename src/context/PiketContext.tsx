import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  PiketArea,
  CrewMember,
  PiketSchedule,
  PiketRecord,
  ShiftType,
  AIVerificationResult
} from '../types/piket';
import {
  DEFAULT_AREAS,
  DEFAULT_CREW,
  getDefaultSchedules,
  INITIAL_RECORDS,
  getTodayDateString,
  getCurrentShift
} from '../data/piketData';
import {
  SpreadsheetInfo,
  getSavedSpreadsheetInfo,
  createPiketSpreadsheet,
  appendPiketRecordToSheet
} from '../services/sheetsService';
import { getCachedAccessToken } from '../services/authService';

interface PiketContextType {
  areas: PiketArea[];
  crewList: CrewMember[];
  schedules: PiketSchedule[];
  records: PiketRecord[];
  activeShift: ShiftType;
  selectedArea: PiketArea | null;
  spreadsheetInfo: SpreadsheetInfo | null;
  isSheetsConnected: boolean;
  googleUserEmail: string | null;
  selectAreaById: (areaId: string) => void;
  getAssignedCrewForArea: (areaId: string, shift?: ShiftType) => CrewMember | null;
  addRecord: (record: Omit<PiketRecord, 'id' | 'timestamp' | 'date' | 'time' | 'syncedToSheets' | 'spvStatus'>) => Promise<PiketRecord>;
  updateRecordSPVStatus: (recordId: string, status: 'APPROVED' | 'REVISION_NEEDED', notes?: string) => Promise<void>;
  updateScheduleAssignment: (date: string, shift: ShiftType, areaId: string, crewId: string) => void;
  addNewCrew: (name: string, role: CrewMember['role'], phone?: string) => void;
  connectGoogleSpreadsheet: (token: string, email: string) => Promise<SpreadsheetInfo>;
  disconnectGoogleSpreadsheet: () => void;
  syncRecordToGoogleSheets: (recordId: string) => Promise<boolean>;
  syncAllPendingToSheets: () => Promise<number>;
  setActiveShift: (shift: ShiftType) => void;
}

const PiketContext = createContext<PiketContextType | undefined>(undefined);

const STORAGE_KEYS = {
  RECORDS: 'hara_chicken_piket_records',
  SCHEDULES: 'hara_chicken_piket_schedules',
  CREW: 'hara_chicken_piket_crew',
};

export const PiketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [areas] = useState<PiketArea[]>(DEFAULT_AREAS);
  
  // Crew list
  const [crewList, setCrewList] = useState<CrewMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CREW);
      return saved ? JSON.parse(saved) : DEFAULT_CREW;
    } catch {
      return DEFAULT_CREW;
    }
  });

  // Schedules
  const [schedules, setSchedules] = useState<PiketSchedule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
      return saved ? JSON.parse(saved) : getDefaultSchedules();
    } catch {
      return getDefaultSchedules();
    }
  });

  // Records
  const [records, setRecords] = useState<PiketRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
      return saved ? JSON.parse(saved) : INITIAL_RECORDS;
    } catch {
      return INITIAL_RECORDS;
    }
  });

  const [activeShift, setActiveShift] = useState<ShiftType>(getCurrentShift());
  const [selectedArea, setSelectedArea] = useState<PiketArea | null>(null);

  // Sheets state
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<SpreadsheetInfo | null>(getSavedSpreadsheetInfo);
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);

  // Save changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CREW, JSON.stringify(crewList));
  }, [crewList]);

  // Check URL parameters for direct QR scan: ?area=fryer-station
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const areaParam = params.get('area');
    if (areaParam) {
      const found = areas.find(a => a.id === areaParam || a.code.toLowerCase() === areaParam.toLowerCase());
      if (found) {
        setSelectedArea(found);
      }
    }
  }, [areas]);

  const selectAreaById = (areaId: string) => {
    const found = areas.find(a => a.id === areaId);
    setSelectedArea(found || null);
  };

  // Find crew member automatically assigned for this area today
  const getAssignedCrewForArea = (areaId: string, shift: ShiftType = activeShift): CrewMember | null => {
    const today = getTodayDateString();
    const sched = schedules.find(s => s.date === today && s.shift === shift);
    if (!sched) return null;

    const assignment = sched.assignments.find(a => a.areaId === areaId);
    if (!assignment) return null;

    const crew = crewList.find(c => c.id === assignment.crewId || c.name === assignment.crewName);
    return crew || { id: assignment.crewId, name: assignment.crewName, role: 'Crew Kitchen', active: true };
  };

  const addRecord = async (
    recordData: Omit<PiketRecord, 'id' | 'timestamp' | 'date' | 'time' | 'syncedToSheets' | 'spvStatus'>
  ): Promise<PiketRecord> => {
    const now = new Date();
    const dateStr = getTodayDateString();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const newRecord: PiketRecord = {
      ...recordData,
      id: `piket-${Date.now()}`,
      timestamp: now.toISOString(),
      date: dateStr,
      time: timeStr,
      spvStatus: 'PENDING',
      syncedToSheets: false,
    };

    // If Google Sheet is connected and token available, sync right away
    const token = getCachedAccessToken();
    if (token && spreadsheetInfo?.id) {
      try {
        await appendPiketRecordToSheet(token, spreadsheetInfo.id, spreadsheetInfo.sheetName, newRecord);
        newRecord.syncedToSheets = true;
        newRecord.syncedAt = timeStr;
      } catch (err) {
        console.warn('Auto sync to sheets failed, saved locally:', err);
      }
    }

    setRecords(prev => [newRecord, ...prev]);

    // Also persist to server endpoint in background
    fetch('/api/piket/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord),
    }).catch(e => console.warn('Server persist note:', e));

    return newRecord;
  };

  const updateRecordSPVStatus = async (
    recordId: string,
    status: 'APPROVED' | 'REVISION_NEEDED',
    notes?: string
  ) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    setRecords(prev =>
      prev.map(r => {
        if (r.id === recordId) {
          return {
            ...r,
            spvStatus: status,
            spvNotes: notes || (status === 'APPROVED' ? 'Disetujui oleh SPV' : 'Perlu pembersihan ulang'),
            spvApprovedBy: 'Kepala Outlet / SPV',
            spvApprovedAt: timeStr,
          };
        }
        return r;
      })
    );

    // Call server endpoint
    fetch(`/api/piket/records/${recordId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spvStatus: status, spvNotes: notes }),
    }).catch(e => console.warn('Server patch note:', e));
  };

  const updateScheduleAssignment = (
    date: string,
    shift: ShiftType,
    areaId: string,
    crewId: string
  ) => {
    const crew = crewList.find(c => c.id === crewId);
    if (!crew) return;

    setSchedules(prev => {
      const existing = prev.find(s => s.date === date && s.shift === shift);
      if (existing) {
        const updatedAssignments = existing.assignments.map(a =>
          a.areaId === areaId ? { ...a, crewId: crew.id, crewName: crew.name } : a
        );
        if (!existing.assignments.some(a => a.areaId === areaId)) {
          updatedAssignments.push({ areaId, crewId: crew.id, crewName: crew.name });
        }
        return prev.map(s =>
          s.date === date && s.shift === shift ? { ...s, assignments: updatedAssignments } : s
        );
      } else {
        return [
          ...prev,
          {
            id: `sched-${date}-${Date.now()}`,
            date,
            shift,
            assignments: [{ areaId, crewId: crew.id, crewName: crew.name }],
          },
        ];
      }
    });
  };

  const addNewCrew = (name: string, role: CrewMember['role'], phone?: string) => {
    const newMember: CrewMember = {
      id: `crew-${Date.now()}`,
      name: name.trim(),
      role,
      phone,
      active: true,
    };
    setCrewList(prev => [...prev, newMember]);
  };

  const connectGoogleSpreadsheet = async (token: string, email: string): Promise<SpreadsheetInfo> => {
    const info = await createPiketSpreadsheet(token, 'Hara Chicken Outlet');
    setSpreadsheetInfo(info);
    setGoogleUserEmail(email);
    return info;
  };

  const disconnectGoogleSpreadsheet = () => {
    setSpreadsheetInfo(null);
    setGoogleUserEmail(null);
  };

  const syncRecordToGoogleSheets = async (recordId: string): Promise<boolean> => {
    const token = getCachedAccessToken();
    if (!token || !spreadsheetInfo?.id) return false;

    const record = records.find(r => r.id === recordId);
    if (!record) return false;

    try {
      await appendPiketRecordToSheet(token, spreadsheetInfo.id, spreadsheetInfo.sheetName, record);
      setRecords(prev =>
        prev.map(r => (r.id === recordId ? { ...r, syncedToSheets: true, syncedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) } : r))
      );
      return true;
    } catch (err) {
      console.error('Error syncing record to sheet:', err);
      return false;
    }
  };

  const syncAllPendingToSheets = async (): Promise<number> => {
    const token = getCachedAccessToken();
    if (!token || !spreadsheetInfo?.id) return 0;

    const pending = records.filter(r => !r.syncedToSheets);
    let count = 0;
    for (const r of pending) {
      try {
        await appendPiketRecordToSheet(token, spreadsheetInfo.id, spreadsheetInfo.sheetName, r);
        count++;
      } catch (err) {
        console.error('Failed syncing record:', r.id, err);
      }
    }

    if (count > 0) {
      setRecords(prev =>
        prev.map(r => (!r.syncedToSheets ? { ...r, syncedToSheets: true } : r))
      );
    }

    return count;
  };

  return (
    <PiketContext.Provider
      value={{
        areas,
        crewList,
        schedules,
        records,
        activeShift,
        selectedArea,
        spreadsheetInfo,
        isSheetsConnected: !!spreadsheetInfo?.id,
        googleUserEmail,
        selectAreaById,
        getAssignedCrewForArea,
        addRecord,
        updateRecordSPVStatus,
        updateScheduleAssignment,
        addNewCrew,
        connectGoogleSpreadsheet,
        disconnectGoogleSpreadsheet,
        syncRecordToGoogleSheets,
        syncAllPendingToSheets,
        setActiveShift,
      }}
    >
      {children}
    </PiketContext.Provider>
  );
};

export const usePiket = () => {
  const context = useContext(PiketContext);
  if (!context) {
    throw new Error('usePiket must be used within a PiketProvider');
  }
  return context;
};
