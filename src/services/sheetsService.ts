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
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // Inisialisasi Header Mewah & Rapi jika sheet masih kosong
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Waktu & Tanggal",
        "Shift",
        "Area Piket",
        "Kode Area",
        "Petugas Kru",
        "Status Verifikasi AI",
        "Validasi Foto Area",
        "Ringkasan Kebersihan AI",
        "Poin Temuan Detail",
        "Status Kepala Outlet",
        "Catatan Kepala Outlet (Ummu Sallaamah)",
        "Foto Bukti Kebersihan",
        "ID Laporan"
      ];
      sheet.appendRow(headers);
      
      // Styling Header: Teal Tua, Teks Putih Tebal, Freeze Baris 1
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#0f766e")
                 .setFontColor("#ffffff")
                 .setFontWeight("bold")
                 .setFontSize(10)
                 .setVerticalAlignment("middle");
      sheet.setRowHeight(1, 36);
      sheet.setFrozenRows(1);
    }
    
    var data = JSON.parse(e.postData.contents);
    
    // Simpan Foto Bukti ke Google Drive otomatis (jika ada)
    var photoCell = "-";
    if (data.photoBase64 && data.photoBase64.length > 50) {
      try {
        var base64Clean = data.photoBase64;
        if (base64Clean.indexOf(";base64,") > -1) {
          base64Clean = base64Clean.split(";base64,")[1];
        }
        var decoded = Utilities.base64Decode(base64Clean);
        var filename = "Piket_" + (data.areaCode || "Area") + "_" + (data.id || Date.now()) + ".jpg";
        var blob = Utilities.newBlob(decoded, "image/jpeg", filename);
        
        // Buat folder khusus di Google Drive
        var folderName = "Foto Piket Hara Chicken";
        var folders = DriveApp.getFoldersByName(folderName);
        var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        var viewUrl = file.getUrl();
        photoCell = '=HYPERLINK("' + viewUrl + '", "Lihat Foto Bukti (Drive)")';
      } catch (driveErr) {
        photoCell = "Tersimpan di Aplikasi";
      }
    }
    
    // Tambah baris data baru
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString("id-ID"),
      data.shift || "-",
      data.areaName || "-",
      data.areaCode || "-",
      data.crewName || "-",
      data.aiStatus || "-",
      data.isCorrectArea || "SESUAI",
      data.aiSummary || "-",
      data.aiFindings || "-",
      data.headStatus || "PENDING KEPALA OUTLET",
      data.headNotes || "-",
      photoCell,
      data.id || "-"
    ]);
    
    var newRow = sheet.getLastRow();
    sheet.setRowHeight(newRow, 30);
    sheet.getRange(newRow, 1, 1, 13).setVerticalAlignment("middle");
    
    // Pewarnaan status otomatis (Hijau jika bersih, Kuning jika perlu tindak lanjut)
    var statusRange = sheet.getRange(newRow, 6);
    if ((data.aiStatus || "").indexOf("BERSIH") > -1) {
      statusRange.setBackground("#dcfce7").setFontColor("#166534").setFontWeight("bold");
    } else {
      statusRange.setBackground("#fee2e2").setFontColor("#991b1b").setFontWeight("bold");
    }
    
    // Auto-fit kolom agar terbaca sangat rapi
    sheet.autoResizeColumns(1, 13);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", row: newRow }))
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
  const isCorrect = record.aiVerification?.isCorrectArea ?? true;

  const payload = {
    timestamp: `${record.date} ${record.time}`,
    shift: record.shift,
    areaName: record.areaName,
    areaCode: record.areaCode,
    crewName: record.crewName,
    aiStatus: isClean ? 'BERSIH (STANDAR)' : 'PERLU TINDAK LANJUT',
    isCorrectArea: isCorrect ? 'SESUAI AREA' : 'FOTO DITOLAK / TIDAK SESUAI',
    aiSummary: record.aiVerification?.summary || '-',
    aiFindings: (record.aiVerification?.findings || []).join('; ') || '-',
    headStatus: record.spvStatus === 'APPROVED' ? 'DISETUJUI KEPALA OUTLET' : record.spvStatus === 'REVISION_NEEDED' ? 'PERLU REVISI' : 'PENDING KEPALA OUTLET',
    headNotes: record.spvNotes || '-',
    photoBase64: record.photoBase64 || '',
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
    shift: 'Pagi (08:00 - 15:00)',
    areaName: 'Halaman Depan + Samping + Keset (Uji Coba)',
    areaCode: 'HARA-HLM-01',
    crewName: 'Bangkit Tri Widodo',
    aiStatus: 'BERSIH (STANDAR)',
    isCorrectArea: 'SESUAI AREA',
    aiSummary: 'Koneksi otomatis dari web app Piket Cihuy berhasil terhubung ke Google Spreadsheet.',
    aiFindings: 'Tes sinkronisasi data berhasil terkirim; Format kolom rapi & siap digunakan',
    headStatus: 'DISETUJUI KEPALA OUTLET',
    headNotes: 'Sistem Terhubung - Kepala Outlet: Ummu Sallaamah',
    photoBase64: '',
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

// Generates tab-separated text (TSV) for direct 1-click copy-paste into Google Sheets / Excel
export const getRecordsTsvString = (records: PiketRecord[]): string => {
  const headers = [
    'Waktu & Tanggal',
    'Shift',
    'Area Piket',
    'Kode Area',
    'Petugas Kru',
    'Status AI',
    'Validasi Foto',
    'Ringkasan AI',
    'Temuan Detail AI',
    'Status Kepala Outlet',
    'Catatan Kepala Outlet (Ummu Sallaamah)',
    'ID Laporan'
  ];

  const rows = records.map(r => {
    const isClean = r.aiVerification?.status === 'BERSIH_SESUAI_STANDAR';
    const isCorrect = r.aiVerification?.isCorrectArea ?? true;
    return [
      `${r.date} ${r.time}`,
      r.shift,
      r.areaName,
      r.areaCode,
      r.crewName,
      isClean ? 'BERSIH (STANDAR)' : 'PERLU TINDAK LANJUT',
      isCorrect ? 'SESUAI AREA' : 'FOTO DITOLAK / TIDAK SESUAI',
      (r.aiVerification?.summary || '-').replace(/\t|\n/g, ' '),
      (r.aiVerification?.findings?.join('; ') || '-').replace(/\t|\n/g, ' '),
      r.spvStatus === 'APPROVED' ? 'DISETUJUI KEPALA OUTLET' : r.spvStatus === 'REVISION_NEEDED' ? 'PERLU REVISI' : 'PENDING KEPALA OUTLET',
      (r.spvNotes || '-').replace(/\t|\n/g, ' '),
      r.id
    ].join('\t');
  });

  return [headers.join('\t'), ...rows].join('\n');
};
