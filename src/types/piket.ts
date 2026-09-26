export interface PiketArea {
  id: string;
  name: string;
  code: string;
  category: 'Kitchen' | 'Service' | 'Facility' | 'Storage';
  description: string;
  standardChecklist: string[];
  color: string;
}

export interface CrewMember {
  id: string;
  name: string;
  role: 'Crew Kitchen' | 'Crew Cashier' | 'Crew Dining' | 'Kepala Outlet' | 'Supervisor';
  phone?: string;
  active: boolean;
}

export type ShiftType = 'Pagi (08:00 - 15:00)' | 'Sore / Closing (15:00 - 22:30)';

export interface PiketAssignment {
  areaId: string;
  crewId: string;
  crewName: string;
}

export interface PiketSchedule {
  id: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  assignments: PiketAssignment[];
  notes?: string;
}

export type AIVerificationStatus = 'BERSIH_SESUAI_STANDAR' | 'PERLU_TINDAKLANJUT';

export interface AICheckItem {
  item: string;
  isClean: boolean;
  notes: string;
}

export interface AIVerificationResult {
  status: AIVerificationStatus;
  isCorrectArea: boolean;
  detectedAreaDescription: string;
  summary: string;
  findings: string[];
  checkItems: AICheckItem[];
  verifiedAt: string;
}

export type SPVApprovalStatus = 'PENDING' | 'APPROVED' | 'REVISION_NEEDED';

export interface PiketRecord {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  areaId: string;
  areaName: string;
  areaCode: string;
  crewName: string;
  crewId?: string;
  shift: ShiftType;
  photoBase64: string;
  aiVerification: AIVerificationResult;
  spvStatus: SPVApprovalStatus;
  spvNotes?: string;
  spvApprovedBy?: string;
  spvApprovedAt?: string;
  syncedToSheets: boolean;
  syncedAt?: string;
  notes?: string;
}

export interface SheetConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetName: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}
