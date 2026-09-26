import { PiketRecord } from '../types/piket';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const STORAGE_SHEET_KEY = 'piket_cihuy_spreadsheet_info';
const STORAGE_WEBHOOK_KEY = 'piket_cihuy_webhook_url';

export interface SpreadsheetInfo {
  id?: string;
  url: string;
  title: string;
  sheetName: string;
  type: 'oauth' | 'webhook';
  webhookUrl?: string;
  createdTime: string;
}

export const getSavedSpreadsheetInfo = (): SpreadsheetInfo | null => {
  try {
    const raw = localStorage.getItem(STORAGE_SHEET_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveSpreadsheetInfo = (info: SpreadsheetInfo | null) => {
  if (info) {
    localStorage.setItem(STORAGE_SHEET_KEY, JSON.stringify(info));
  } else {
    localStorage.removeItem(STORAGE_SHEET_KEY);
  }
};

export const saveWebhookConnection = (webhookUrl: string, sheetUrl?: string, title?: string): SpreadsheetInfo => {
  const cleanWebhook = webhookUrl.trim();
  const info: SpreadsheetInfo = {
    title: title?.trim() || 'Google Spreadsheet (Webhook / Apps Script)',
    url: sheetUrl?.trim() || cleanWebhook,
    sheetName: 'Log Piket',
    type: 'webhook',
    webhookUrl: cleanWebhook,
    createdTime: new Date().toISOString(),
  };
  saveSpreadsheetInfo(info);
  return info;
};

// Send record to Google Sheet via Apps Script Webhook (Zero OAuth, Works on Vercel instantly!)
export const appendRecordViaWebhook = async (
  webhookUrl: string,
  record: PiketRecord
): Promise<boolean> => {
  const payload = {
    timestamp: `${record.date} ${record.time}`,
    crewName: record.crewName,
    shift: record.shift,
    areaName: record.areaName,
    areaCode: record.areaCode,
    aiStatus: record.aiVerification.status === 'BERSIH_SESUAI_STANDAR' ? 'BERSIH (STANDAR)' : 'PERLU TINDAK LANJUT',
    aiSummary: record.aiVerification.summary,
    aiFindings: record.aiVerification.findings.join('; '),
    spvStatus: record.spvStatus === 'APPROVED' ? 'DISETUJUI SPV' : record.spvStatus === 'REVISION_NEEDED' ? 'PERLU REVISI' : 'PENDING SPV',
    spvNotes: record.spvNotes || '-',
    id: record.id,
  };

  try {
    // Send as JSON with text/plain to prevent CORS preflight in Apps Script
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

  saveSpreadsheetInfo(info);
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
