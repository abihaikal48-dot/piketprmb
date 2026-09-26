import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '50mb' }));

// Initialized Gemini AI client
// Initialized Gemini AI client
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : new GoogleGenAI();

// API: AI Vision Cleaning Verification
app.post('/api/verify-cleaning', async (req, res) => {
  try {
    const { imageBase64, areaName, areaCode, category, standardChecklist, crewName } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Foto bukti piket wajib diunggah.' });
    }

    // Clean base64 string
    let mimeType = 'image/jpeg';
    let base64Data = imageBase64;
    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      mimeType = parts[0].replace('data:', '') || 'image/jpeg';
      base64Data = parts[1];
    }

    const checklistStr = Array.isArray(standardChecklist)
      ? standardChecklist.map((c, i) => `- ${c}`).join('\n')
      : '- Kebersihan meja, lantai, dan peralatan';

    const prompt = `Anda adalah Auditor Mutu & Kebersihan Outlet Restoran Cepat Saji "Hara Chicken" yang SANGAT KETAT, TELITI, DAN ANTI-MANIPULASI.
Kru piket ${crewName || 'Kru Outlet'} mengaku telah membersihkan area: "${areaName}" (Kode: ${areaCode}, Kategori: ${category}) dan mengunggah foto bukti ini.

PERINGATAN AUDIT FISIK - JANGAN PERNAH MENILAI BERSIH UNTUK FOTO ASAL, FOTO TIDAK SESUAI, ATAU FOTO GELAP/BURAM:
1. VALIDASI KESESUAIAN AREA & OBJEK (ANTI-FOTO ASAL / SELFIE / BENDA LAIN):
   - Periksa apakah foto ini BENAR-BENAR merupakan area kerja "${areaName}" di outlet restoran atau peralatan dapur/meja yang relevan?
   - JIKA FOTO ADALAH:
     * Foto selfie, foto wajah seseorang, foto anggota badan/pakaian
     * Foto layar komputer / layar HP / tablet / screenshot
     * Foto tembok polos, langit-langit/plafon, lantai kosong tanpa perlengkapan outlet
     * Foto kasur, kamar tidur, mobil, jalanan luar, pemandangan, hewan
     * Foto hitam gelap gulita, buram parah (blur), ditutup jari/kamera gelap
     * Foto benda acak yang tidak berhubungan sama sekali dengan area kerja "${areaName}"
   MAKA ANDA WAJIB MEMBERIKAN KEPUTUSAN:
     - "isCorrectArea": false
     - "status": "PERLU_TINDAKLANJUT"
     - "detectedAreaDescription": Sebutkan objek nyata yang terlihat di foto (misalnya: "Foto wajah manusia / selfie", "Layar monitor", "Tembok polos", dsb).
     - "summary": "Foto ditolak karena bukan area ${areaName}. Terdeteksi: [sebutkan objek yang tampak di foto]. Mohon ambil foto area kerja yang sebenarnya."
     - "findings": ["Foto yang diunggah tidak memperlihatkan area kerja ${areaName}", "Kru mengunggah foto yang tidak relevan dengan tugas piket", "Wajib mengambil foto fisik area kerja ${areaName}"]
     - Pada "checkItems", tandai semua item "isClean": false dengan catatan "Foto tidak valid / objek tidak sesuai".

2. EVALUASI KEBERSIHAN NYATA (JIKA OBJEK FOTO MEMANG AREA TERSEBUT):
   Periksa standar checklist SOP berikut:
${checklistStr}
   - Deteksi dengan jeli:
     * Noda minyak, kerak penggorengan, ceceran saus/tepung crispy berserakan
     * Sampah plastik/struk/tisu tercecer yang belum dibuang
     * Peralatan masak/wadah kotor berserakan belum dicuci
     * Genangan air, lantai becek berminyak, atau lap kotor diletakkan sembarangan
   - JIKA MASIH ADA KOTORAN, NODA, ATAU BERANTAKAN:
     - "isCorrectArea": true
     - "status": "PERLU_TINDAKLANJUT"
     - "summary": Sebutkan bagian mana yang masih kotor atau berantakan pada area ${areaName}.
     - "findings": Berikan 2-4 poin temuan spesifik kotoran yang tampak pada gambar.
     - Tandai item yang belum bersih dengan "isClean": false dan berikan catatan perbaikan.

3. HANYA JIKA BENAR-BENAR BERSIH, HIGIENIS, & TERTATA RAPI:
   - "isCorrectArea": true
   - "status": "BERSIH_SESUAI_STANDAR"
   - "summary": Konfirmasi bahwa area ${areaName} rapi, bersih, dan higienis memenuhi standar outlet Hara Chicken.
   - "findings": Sebutkan poin-poin spesifik bagian yang tampak bersih.

CATATAN: JANGAN MEMBERIKAN SKOR ANGKA. Gunakan bahasa Indonesia yang tegas, profesional, dan akurat.`;

    const schema = {
      type: 'OBJECT',
      properties: {
        status: {
          type: 'STRING',
          enum: ['BERSIH_SESUAI_STANDAR', 'PERLU_TINDAKLANJUT'],
          description: 'Status kebersihan akhir hasil deteksi'
        },
        isCorrectArea: {
          type: 'BOOLEAN',
          description: 'Apakah foto sesuai dengan area piket yang dilaporkan'
        },
        detectedAreaDescription: {
          type: 'STRING',
          description: 'Deskripsi singkat area atau objek yang teridentifikasi dalam foto'
        },
        summary: {
          type: 'STRING',
          description: 'Ringkasan hasil evaluasi kebersihan 1-2 kalimat'
        },
        findings: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Daftar 2-4 poin temuan spesifik yang terlihat di foto'
        },
        checkItems: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              item: { type: 'STRING' },
              isClean: { type: 'BOOLEAN' },
              notes: { type: 'STRING' }
            },
            required: ['item', 'isClean', 'notes']
          },
          description: 'Status per item checklist'
        }
      },
      required: ['status', 'isCorrectArea', 'detectedAreaDescription', 'summary', 'findings', 'checkItems']
    };

    // Resilient model fallback: if gemini-3.8-flash hits 503 high demand, try alternative models
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let response: any = null;
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Data
                  }
                },
                {
                  text: prompt
                }
              ]
            }
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: schema
          }
        });
        if (response && response.text) {
          break; // successfully generated
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed, trying fallback:`, err?.message || err);
        // Wait 400ms before trying the next candidate model
        await new Promise(res => setTimeout(res, 400));
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('Semua model AI sedang sibuk.');
    }

    const resultText = response.text;
    const parsedData = JSON.parse(resultText || '{}');

    return res.json({
      ...parsedData,
      verifiedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    });
  } catch (error: any) {
    console.error('Gemini cleaning verification error:', error);
    const errStr = error?.message || String(error);
    const isCapacityIssue = errStr.includes('503') || errStr.includes('high demand') || errStr.includes('UNAVAILABLE') || errStr.includes('429');

    // Strict fallback: do NOT blindly approve random or unverified photos
    return res.status(200).json({
      status: 'PERLU_TINDAKLANJUT',
      isCorrectArea: false,
      detectedAreaDescription: 'Memerlukan konfirmasi visual fisik langsung oleh SPV',
      summary: isCapacityIssue
        ? 'Layanan AI Gemini Google sedang mengalami antrean padat sementara (503). Foto bukti telah disimpan dengan aman dan diteruskan untuk verifikasi langsung oleh SPV.'
        : 'Verifikasi visual otomatis belum dapat mengonfirmasi keaslian foto. Pastikan foto diambil dengan pencahayaan terang tepat di area piket.',
      findings: [
        isCapacityIssue
          ? 'Server AI sedang dalam lonjakan trafik antrean sementara'
          : 'Pastikan kamera mengarah tepat ke area kerja dan peralatan piket',
        'Foto bukti fisik kebersihan telah didokumentasikan di sistem',
        'Laporan piket menunggu konfirmasi inspeksi langsung oleh SPV'
      ],
      checkItems: [
        { item: 'Kesesuaian Area Kerja', isClean: false, notes: 'Menunggu konfirmasi visual SPV' },
        { item: 'Kerapian & Kebersihan', isClean: false, notes: 'Perlu inspeksi fisik langsung' }
      ],
      verifiedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    });
  }
});

// File persistence paths
const STORE_FILE = path.join(__dirname, '.piket_records.json');
const CONFIG_FILE = path.join(__dirname, '.piket_config.json');

// In-memory store for server-persisted records with disk backup
let piketRecords: any[] = [];
try {
  if (fs.existsSync(STORE_FILE)) {
    piketRecords = JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'));
  }
} catch (e) {
  piketRecords = [];
}

let sharedConfig: any = null;
try {
  if (fs.existsSync(CONFIG_FILE)) {
    sharedConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  }
} catch (e) {
  sharedConfig = null;
}

const saveStore = () => {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(piketRecords.slice(0, 150), null, 2));
  } catch (e) {
    console.error('Error saving records to disk:', e);
  }
};

const saveConfig = () => {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(sharedConfig, null, 2));
  } catch (e) {
    console.error('Error saving config to disk:', e);
  }
};

// Piket records endpoints for multi-device synchronization
app.get('/api/piket/records', (req, res) => {
  res.json({ records: piketRecords });
});

app.post('/api/piket/records', (req, res) => {
  const newRecord = req.body;
  if (!newRecord.id) {
    newRecord.id = 'piket-' + Date.now();
  }
  // Avoid duplicate if already exists
  const exists = piketRecords.some(r => r.id === newRecord.id);
  if (!exists) {
    piketRecords.unshift(newRecord);
    saveStore();
  }
  res.json({ success: true, record: newRecord });
});

app.patch('/api/piket/records/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const index = piketRecords.findIndex(r => r.id === id);
  if (index !== -1) {
    piketRecords[index] = { ...piketRecords[index], ...updates };
    saveStore();
    return res.json({ success: true, record: piketRecords[index] });
  }
  res.status(404).json({ error: 'Record not found' });
});

// Shared Google Sheets config endpoint (syncs webhook URL across all phones & computers)
app.get('/api/piket/config', (req, res) => {
  res.json({ config: sharedConfig });
});

app.post('/api/piket/config', (req, res) => {
  sharedConfig = req.body;
  saveConfig();
  res.json({ success: true, config: sharedConfig });
});

// Dev vs Prod Vite Mounting
if (!isProd) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server Hara Chicken Piket running at http://0.0.0.0:${PORT}`);
});
