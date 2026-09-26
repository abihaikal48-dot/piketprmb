import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, areaName, areaCode, category, standardChecklist, crewName } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: 'Foto bukti piket wajib diunggah.' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    if (!apiKey) {
      return res.status(200).json({
        status: 'PERLU_TINDAKLANJUT',
        isCorrectArea: false,
        detectedAreaDescription: 'API Key Gemini belum diset pada Vercel',
        summary: 'Environment variable GEMINI_API_KEY belum dikonfigurasi di dashboard Vercel (Project Settings > Environment Variables).',
        findings: [
          'Harap buka Vercel Project Settings > Environment Variables',
          'Tambahkan GEMINI_API_KEY dengan API key Google AI Studio Anda',
          'Lakukan Redeploy project di Vercel agar AI aktif'
        ],
        checkItems: (standardChecklist || ['Kebersihan area', 'Kerapian peralatan']).map((chk: string) => ({
          item: chk,
          isClean: false,
          notes: 'Konfigurasi Vercel GEMINI_API_KEY diperlukan'
        })),
        verifiedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      });
    }

    const ai = new GoogleGenAI({ apiKey });

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

    const parsedData = JSON.parse(response.text || '{}');
    return res.status(200).json({
      ...parsedData,
      verifiedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    });
  } catch (error: any) {
    console.error('Vercel API error in verify-cleaning:', error);
    return res.status(200).json({
      status: 'PERLU_TINDAKLANJUT',
      isCorrectArea: false,
      detectedAreaDescription: 'Pemeriksaan visual membutuhkan konfirmasi SPV',
      summary: 'Gagal memproses verifikasi visual otomatis: ' + (error?.message || 'Kendala server'),
      findings: [
        'Pastikan foto memperlihatkan area kerja dan peralatan yang dibersihkan dengan terang',
        'Foto asal / tidak jelas tidak dapat disetujui otomatis',
        'Laporan menunggu konfirmasi fisik langsung oleh SPV'
      ],
      checkItems: [
        { item: 'Kesesuaian Area', isClean: false, notes: 'Menunggu SPV' }
      ],
      verifiedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    });
  }
}
