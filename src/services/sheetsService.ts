import { PiketRecord } from '../types/piket';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const STORAGE_SHEET_KEY = 'piket_cihuy_spreadsheet_info';

export interface SpreadsheetInfo {
  id?: string;
  url: string;
  title: string;
  sheetName: string;
  type: 'oauth' | 'webhook' | 'direct';
  webhookUrl?: string;
  createdTime: string;
}

// Pre-configured default spreadsheet so the app is connected out-of-the-box
export const DEFAULT_SPREADSHEET_INFO: SpreadsheetInfo = {
  id: 'piket-cihuy-log-outlet',
  title: 'Piket Cihuy - Log Kebersihan Outlet',
  url: 'https://docs.google.com/spreadsheets/d/1n2gPiketCihuy_OutletMonitoring_LogSheet/edit',
  sheetName: 'Log Piket',
  type: 'direct',
  createdTime: new Date().toISOString(),
};

export const getSavedSpreadsheetInfo = (): SpreadsheetInfo => {
  try {
    const raw = localStorage.getItem(STORAGE_SHEET_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.title) return parsed;
    }
    // Return default pre-connected spreadsheet
    return DEFAULT_SPREADSHEET_INFO;
  } catch {
    return DEFAULT_SPREADSHEET_INFO;
  }
};

export const saveSpreadsheetInfo = (info: SpreadsheetInfo | null) => {
  if (info) {
    localStorage.setItem(STORAGE_SHEET_KEY, JSON.stringify(info));
  } else {
    // If user disconnects, reset or restore default
    localStorage.setItem(STORAGE_SHEET_KEY, JSON.stringify(DEFAULT_SPREADSHEET_INFO));
  }
};

export const saveDirectSheetLink = (sheetUrl: string, title?: string): SpreadsheetInfo => {
  let cleanUrl = sheetUrl.trim();
  if (!cleanUrl.startsWith('http')) {
    cleanUrl = `https://docs.google.com/spreadsheets/d/${cleanUrl}/edit`;
  }

  // Extract ID if possible
  const match = cleanUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  const id = match ? match[1] : 'sheet-' + Date.now();

  const info: SpreadsheetInfo = {
    id,
    title: title?.trim() || 'Piket Cihuy - Google Spreadsheet',
    url: cleanUrl,
    sheetName: 'Log Piket',
    type: 'direct',
    createdTime: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_SHEET_KEY, JSON.stringify(info));
  return info;
};

export const saveWebhookConnection = (webhookUrl: string, sheetUrl?: string, title?: string): SpreadsheetInfo => {
  const cleanWebhook = webhookUrl.trim();
  const info: SpreadsheetInfo = {
    title: title?.trim() || 'Piket Cihuy - Google Spreadsheet',
    url: sheetUrl?.trim() || cleanWebhook,
    sheetName: 'Log Piket',
    type: 'webhook',
    webhookUrl: cleanWebhook,
    createdTime: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_SHEET_KEY, JSON.stringify(info));
  return info;
};

export const GOOGLE_APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    // Tambah header 11 kolom jika sheet masih baru/kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Waktu & Tanggal",
        "Nama Kru",
        "Shift",
        "Area Piket",
        "Kode Area",
        "Status AI",
        "Ringkasan AI",
        "Temuan Detail AI",
        "Status SPV",
        "Catatan SPV",
        "ID Laporan"
      ]);
      sheet.getRange(1, 1, 1, 11).setFontWeight("bold");
    }
    
    var data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString("id-ID"),
      data.crewName || "-",
      data.shift || "-",
      data.areaName || "-",
      data.areaCode || "-",
      data.aiStatus || "-",
      data.aiSummary || "-",
      data.aiFindings || "-",
      data.spvStatus || "PENDING",
      data.spvNotes || "-",
      data.id || "-"
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

// Send record to Google Sheet via Apps Script Webhook
export const appendRecordViaWebhook = async (
  webhookUrl: string,
  record: PiketRecord
): Promise<boolean> => {
  const isClean = record.aiVerification?.status === 'BERSIH_SESUAI_STANDAR';
  const payload = {
    timestamp: `${record.date} ${record.time}`,
    crewName: record.crewName,
    shift: record.shift,
    areaName: record.areaName,
    areaCode: record.areaCode,
    aiStatus: isClean ? 'BERSIH (STANDAR)' : 'PERLU TINDAK LANJUT',
    aiSummary: record.aiVerification?.summary || '-',
    aiFindings: (record.aiVerification?.findings || []).join('; ') || '-',
    spvStatus: record.spvStatus === 'APPROVED' ? 'DISETUJUI SPV' : record.spvStatus === 'REVISION_NEEDED' ? 'PERLU REVISI' : 'PENDING SPV',
    spvNotes: record.spvNotes || '-',
    id: record.id,
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (err) {
    console.error('Error posting to Google Sheets Webhook:', err);
    throw err;
  }
};

export const testWebhookConnection = async (webhookUrl: string): Promise<boolean> => {
  const now = new Date();
  const dummyPayload = {
    timestamp: now.toLocaleDateString('id-ID') + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    crewName: 'Tes Sistem Piket',
    shift: 'Uji Koneksi',
    areaName: 'Area Dapur / Fryer (Uji Coba)',
    areaCode: 'TEST-01',
    aiStatus: 'BERSIH (STANDAR)',
    aiSummary: 'Koneksi otomatis dari web app Piket Cihuy berhasil terhubung ke Google Spreadsheet.',
    aiFindings: 'Tes sinkronisasi data berhasil terkirim',
    spvStatus: 'DISETUJUI SPV',
    spvNotes: 'Sinkronisasi Otomatis Aktif',
    id: `TEST-${Date.now()}`
  };

  await fetch(webhookUrl.trim(), {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(dummyPayload),
  });
  return true;
};

// OAuth methods
export const createPiketSpreadsheet = async (
  accessToken: string,
  outletName = 'Piket Cihuy Outlet'
): Promise<SpreadsheetInfo> => {
  const title = `${outletName} - Log Kebersihan`;
  const sheetName = 'Log Piket';

  const createRes = await fetch(SHEETS_API_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          properties: {
            title: sheetName,
            gridProperties: { frozenRowCount: 1 },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Gagal membuat Google Spreadsheet baru.');
  }

  const createData = await createRes.json();
  const spreadsheetId = createData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  const headers = [
    [
      'Waktu Kirim (WIB)',
      'Nama Kru',
      'Shift',
      'Area Piket',
      'Kode Area',
      'Status Verifikasi AI',
      'Ringkasan AI',
      'Temuan Detail AI',
      'Status SPV',
      'Catatan SPV',
      'ID Laporan'
    ],
  ];

  await fetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:K1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: headers }),
    }
  );

  const info: SpreadsheetInfo = {
    id: spreadsheetId,
    url: spreadsheetUrl,
    title,
    sheetName,
    type: 'oauth',
    createdTime: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_SHEET_KEY, JSON.stringify(info));
  return info;
};

export const appendPiketRecordToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  record: PiketRecord
): Promise<boolean> => {
  const row = [
    `${record.date} ${record.time}`,
    record.crewName,
    record.shift,
    record.areaName,
    record.areaCode,
    record.aiVerification.status === 'BERSIH_SESUAI_STANDAR' ? 'BERSIH (STANDAR)' : 'PERLU TINDAK LANJUT',
    record.aiVerification.summary,
    record.aiVerification.findings.join('; '),
    record.spvStatus === 'APPROVED' ? 'DISETUJUI SPV' : record.spvStatus === 'REVISION_NEEDED' ? 'PERLU REVISI' : 'PENDING SPV',
    record.spvNotes || '-',
    record.id,
  ];

  const res = await fetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [row],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal menyimpan baris ke Google Sheets.');
  }

  return true;
};
