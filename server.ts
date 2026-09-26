import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
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

// In-memory store for server-persisted records
let piketRecords: any[] = [];
let piketRosters: any[] = [];

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
        responseSchema: {
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
        }
      }
    });

    const resultText = response.text;
    const parsedData = JSON.parse(resultText || '{}');

    return res.json({
      ...parsedData,
      verifiedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    });
  } catch (error: any) {
    console.error('Gemini cleaning verification error:', error);
    // Strict fallback: do NOT blindly approve random or unverified photos
    return res.status(200).json({
      status: 'PERLU_TINDAKLANJUT',
      isCorrectArea: false,
      detectedAreaDescription: 'Perlu verifikasi fisik langsung oleh SPV.',
      summary: 'Foto bukti belum dapat diverifikasi otomatis secara akurat. Pastikan foto diambil dengan pencahayaan terang dan mengarah tepat pada area kerja.',
      findings: [
        'Pastikan foto menampilkan area kerja dan peralatan yang dibersihkan secara jelas',
        'Hindari mengambil foto objek lain, wajah, atau area gelap',
        'Laporan piket tetap dicatat dan menunggu inspeksi visual langsung dari SPV'
      ],
      checkItems: [
        { item: 'Kesesuaian Area Kerja', isClean: false, notes: 'Menunggu konfirmasi visual SPV' },
        { item: 'Kerapian & Kebersihan', isClean: false, notes: 'Perlu inspeksi fisik langsung' }
      ],
      verifiedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    });
  }
});

// Piket records endpoints
app.get('/api/piket/records', (req, res) => {
  res.json({ records: piketRecords });
});

app.post('/api/piket/records', (req, res) => {
  const newRecord = req.body;
  if (!newRecord.id) {
    newRecord.id = 'piket-' + Date.now();
  }
  piketRecords.unshift(newRecord);
  res.json({ success: true, record: newRecord });
});

app.patch('/api/piket/records/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const index = piketRecords.findIndex(r => r.id === id);
  if (index !== -1) {
    piketRecords[index] = { ...piketRecords[index], ...updates };
    return res.json({ success: true, record: piketRecords[index] });
  }
  res.status(404).json({ error: 'Record not found' });
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
