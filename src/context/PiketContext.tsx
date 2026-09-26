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
  appendPiketRecordToSheet,
  appendRecordViaWebhook,
  saveWebhookConnection,
  saveDirectSheetLink,
  saveSpreadsheetInfo
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
  connectWebhookSpreadsheet: (webhookUrl: string, sheetUrl?: string, title?: string) => SpreadsheetInfo;
  setDirectSpreadsheetLink: (url: string, title?: string) => SpreadsheetInfo;
  disconnectGoogleSpreadsheet: () => void;
  syncRecordToGoogleSheets: (recordId: string) => Promise<boolean>;
  syncAllPendingToSheets: () => Promise<number>;
  setActiveShift: (shift: ShiftType) => void;
}

const PiketContext = createContext<PiketContextType | undefined>(undefined);

const STORAGE_KEYS = {
  RECORDS: 'piket_cihuy_records',
  SCHEDULES: 'piket_cihuy_schedules',
  CREW: 'piket_cihuy_crew',
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

  // Sheets state (supports webhook and OAuth)
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<SpreadsheetInfo | null>(getSavedSpreadsheetInfo);
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Store lightweight copy in localStorage (limit to last 25 records with truncated big images if needed)
      const safeRecords = records.slice(0, 25).map(r => ({
        ...r,
        photoBase64: r.photoBase64 && r.photoBase64.length > 200000
          ? r.photoBase64.slice(0, 50) + '...'
          : r.photoBase64
      }));
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(safeRecords));
    } catch (e) {
      console.warn('LocalStorage quota limit reached, ignoring local persistence for heavy image records:', e);
    }
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CREW, JSON.stringify(crewList));
  }, [crewList]);

  // Handle URL query ?area=...
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
      id: `cihuy-${Date.now()}`,
      timestamp: now.toISOString(),
      date: dateStr,
      time: timeStr,
      spvStatus: 'PENDING',
      syncedToSheets: false,
    };

    // Auto-sync to Google Sheet if connected
    if (spreadsheetInfo) {
      if (spreadsheetInfo.type === 'webhook' && spreadsheetInfo.webhookUrl) {
        try {
          await appendRecordViaWebhook(spreadsheetInfo.webhookUrl, newRecord);
          newRecord.syncedToSheets = true;
          newRecord.syncedAt = timeStr;
        } catch (err) {
          console.warn('Webhook sync failed, saving locally:', err);
        }
      } else if (spreadsheetInfo.type === 'oauth' && spreadsheetInfo.id) {
        const token = getCachedAccessToken();
        if (token) {
          try {
            await appendPiketRecordToSheet(token, spreadsheetInfo.id, spreadsheetInfo.sheetName, newRecord);
            newRecord.syncedToSheets = true;
            newRecord.syncedAt = timeStr;
          } catch (err) {
            console.warn('OAuth sync to sheets failed, saving locally:', err);
          }
        }
      }
    }

    setRecords(prev => [newRecord, ...prev]);

    // Background server log
    fetch('/api/piket/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord),
    }).catch(() => {});

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
            spvNotes: notes || (status === 'APPROVED' ? 'Disetujui SPV' : 'Perlu diseka ulang'),
            spvApprovedBy: 'SPV Piket Cihuy',
            spvApprovedAt: timeStr,
          };
        }
        return r;
      })
    );

    fetch(`/api/piket/records/${recordId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spvStatus: status, spvNotes: notes }),
    }).catch(() => {});
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
    const info = await createPiketSpreadsheet(token, 'Piket Cihuy');
    setSpreadsheetInfo(info);
    setGoogleUserEmail(email);
    return info;
  };

  const connectWebhookSpreadsheet = (webhookUrl: string, sheetUrl?: string, title?: string): SpreadsheetInfo => {
    const info = saveWebhookConnection(webhookUrl, sheetUrl, title);
    setSpreadsheetInfo(info);
    return info;
  };

  const setDirectSpreadsheetLink = (url: string, title?: string): SpreadsheetInfo => {
    const info = saveDirectSheetLink(url, title);
    setSpreadsheetInfo(info);
    return info;
  };

  const disconnectGoogleSpreadsheet = () => {
    saveSpreadsheetInfo(null);
    setSpreadsheetInfo(getSavedSpreadsheetInfo());
    setGoogleUserEmail(null);
  };

  const syncRecordToGoogleSheets = async (recordId: string): Promise<boolean> => {
    if (!spreadsheetInfo) return false;
    const record = records.find(r => r.id === recordId);
    if (!record) return false;

    try {
      if (spreadsheetInfo.type === 'webhook' && spreadsheetInfo.webhookUrl) {
        await appendRecordViaWebhook(spreadsheetInfo.webhookUrl, record);
      } else if (spreadsheetInfo.type === 'oauth' && spreadsheetInfo.id) {
        const token = getCachedAccessToken();
        if (!token) return false;
        await appendPiketRecordToSheet(token, spreadsheetInfo.id, spreadsheetInfo.sheetName, record);
      } else {
        return false;
      }

      setRecords(prev =>
        prev.map(r => (r.id === recordId ? { ...r, syncedToSheets: true, syncedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) } : r))
      );
      return true;
    } catch (err) {
      console.error('Error syncing record:', err);
      return false;
    }
  };

  const syncAllPendingToSheets = async (): Promise<number> => {
    if (!spreadsheetInfo) return 0;
    const pending = records.filter(r => !r.syncedToSheets);
    let count = 0;

    for (const r of pending) {
      try {
        if (spreadsheetInfo.type === 'webhook' && spreadsheetInfo.webhookUrl) {
          await appendRecordViaWebhook(spreadsheetInfo.webhookUrl, r);
          count++;
        } else if (spreadsheetInfo.type === 'oauth' && spreadsheetInfo.id) {
          const token = getCachedAccessToken();
          if (token) {
            await appendPiketRecordToSheet(token, spreadsheetInfo.id, spreadsheetInfo.sheetName, r);
            count++;
          }
        }
      } catch (err) {
        console.error('Failed syncing:', r.id, err);
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
        isSheetsConnected: !!spreadsheetInfo,
        googleUserEmail,
        selectAreaById,
        getAssignedCrewForArea,
        addRecord,
        updateRecordSPVStatus,
        updateScheduleAssignment,
        addNewCrew,
        connectGoogleSpreadsheet,
        connectWebhookSpreadsheet,
        setDirectSpreadsheetLink,
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
