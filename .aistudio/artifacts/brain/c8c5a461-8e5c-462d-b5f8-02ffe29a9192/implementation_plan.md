# Sistem Piket Kru Hara Chicken (QR Scan + AI Verification + Google Sheets Sync)

Sistem piket digital terintegrasi untuk outlet Hara Chicken yang menggantikan kebiasaan pengiriman foto piket di grup WhatsApp. Kru cukup memindai QR Code di area piket, identitas kru & jadwal terisi otomatis, foto area diverifikasi seketika oleh AI Gemini Vision (mendeteksi kebersihan/kotoran tanpa skor angka), dan seluruh riwayat langsung tersinkronisasi rapi ke Google Spreadsheet untuk audit SPV dan Kepala Outlet.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Keputusan Utama yang Dikonfirmasi dari Kebutuhan Operasional:**
> 1. **Identitas Kru Otomatis (Roster / Jadwal Piket)**: Tersedia fitur pengaturan jadwal piket harian per shift (Pagi, Sore, Closing) sehingga saat kru memindai QR area, nama kru penanggung jawab langsung terdeteksi otomatis. Bila ada pergantian kru (tukar shift/bantuan), kru tetap bisa memilih nama dari daftar kru dengan satu ketukan.
> 2. **Verifikasi AI Tanpa Skor Angka**: AI Gemini Vision menganalisis foto bukti kebersihan untuk memverifikasi kelengkapan sudut foto, mendeteksi noda kotoran/minyak/ceceran sisa makanan, serta mengeluarkan status visual (*"Bersih & Rapih"* atau *"Perlu Ditindaklanjuti"*) beserta catatan poin yang perlu diperhatikan.
> 3. **Google Sheets sebagai Database Sentral**: Setiap kali kru menekan tombol kirim setelah verifikasi AI, data langsung dicatat baris per baris ke Google Sheet (Waktu/Timestamp, Nama Kru, Shift, Area Piket, Status AI, Catatan Analisis AI, dan URL/Status Bukti Foto).
> 4. **Fitur Cetak Stiker QR Siap Tempel**: Disediakan generator stiker QR Code berlabel nama area (Meja Kasir, Dapur Goreng/Fryer, Meja Pelanggan/Dining, Area Cuci Piring & Waste, Toilet & Wastafel) dengan branding Hara Chicken yang siap dicetak/di-print untuk ditempel di masing-masing titik fisik outlet.

---

## 1. Overview & Core Concept

### Masalah yang Diselesaikan
Sebelumnya, pengiriman foto piket dilakukan melalui grup WhatsApp: foto menumpuk, sulit dilacak siapa yang sudah atau belum piket, jam pengiriman sering tercecer, dan SPV kesulitan merekap kepatuhan kebersihan harian antar shift.

### Solusi Sistem Baru
1. **Titik Fisik Berbasis QR**: Stiker QR unik ditempel di setiap area krusial Hara Chicken (Kitchen/Fryer, Dining, Cashier, Dishwashing, Storage/Packaging, Restroom).
2. **Kru Experience (Mobile-First)**:
   - Kru membuka kamera smartphone atau pemindai QR bawaan aplikasi.
   - Sistem membuka formulir piket spesifik area tersebut secara instan.
   - Nama kru dan shift aktif terisi otomatis berdasarkan jadwal hari ini (bisa diganti cepat bila tukar tugas).
   - Kru memotret kondisi area yang sudah dibersihkan.
   - AI Gemini Vision memindai foto secara langsung: mengonfirmasi kebersihan dan memberi peringatan jika masih ada ceceran tepung, minyak goreng, atau meja belum dilap.
   - Kru klik *"Kirim Hasil Piket"*.
3. **Database Google Sheets & Dashboard SPV**:
   - Data otomatis tersimpan di Google Sheets secara real-time.
   - Kepala Outlet / SPV memiliki Dashboard ringkas untuk memantau status piket hari ini (area mana yang sudah selesai, sedang proses, atau belum piket sama sekali).
   - Terdapat tombol langsung untuk membuka Google Spreadsheet dan mengunduh laporan rekapitulasi.

---

## 2. User Experience & Visual Design

### Alur Pengguna (User Flows)
```
┌─────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ 1. Scan QR Area │ ───► │ 2. Formulir Cepat       │ ───► │ 3. Ambil Foto Bukti     │
│    (Fisik Stiker)│      │    - Area terpilih      │      │    - Kamera / Galeri    │
│                 │      │    - Kru & Shift auto   │      │                         │
└─────────────────┘      └─────────────────────────┘      └────────────┬────────────┘
                                                                       │
                                                                       ▼
┌─────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ 6. Google Sheet │ ◄─── │ 5. Kirim Laporan        │ ◄─── │ 4. Verifikasi AI Gemini │
│    & SPV Monitor│      │    - Timestamp tercatat │      │    - Deteksi kotoran/oli│
│    Real-time    │      │    - Feedback tersimpan │      │    - Status: Bersih/Perlu│
└─────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

### Navigasi Tab & Fitur Utama
1. **Mode Kru (Piket Cepat)**:
   - Pemindai QR kamera internal & simulasi pilihan area instan (memudahkan pengujian langsung di browser).
   - Form verifikasi foto interaktif dengan preview kamera, tombol unggah, dan analisis AI interaktif dengan badge status yang jelas.
2. **Jadwal & Roster Kru ("Fitur Buat Piket")**:
   - Pengaturan kru aktif Hara Chicken.
   - Pemetaan jadwal tugas harian per area dan shift (Pagi: 08:00 - 16:00, Closing: 16:00 - 23:00) agar pengisian nama kru benar-benar otomatis.
3. **Dashboard Monitoring SPV / Kepala Outlet**:
   - Status checklist harian (Progress bar kelengkapan piket outlet hari ini).
   - Feed riwayat kiriman terkini lengkap dengan badge hasil verifikasi AI.
   - Filter berdasarkan tanggal, area, shift, dan kru.
   - Integrasi Google Sheets terpadu (OAuth Google Workspace) untuk sync otomatis & buka spreadsheet secara langsung.
4. **Cetak Stiker QR Code**:
   - Layout kartu stiker siap cetak dengan logo Hara Chicken, nama area, instruksi pemindaian, dan QR Code kontras tinggi yang siap dicetak ke printer A4 atau kertas stiker thermal.

### Visual Identity & Theme
- **Brand Colors**: Mengusung identitas F&B Hara Chicken yang energik, bersih, dan profesional:
  - Deep Red / Crimson (`#DC2626` & `#991B1B`): Brand accent Hara Chicken.
  - Warm Amber / Golden (`#F59E0B`): Aksen renyah & hangat.
  - Clean Slate / White Backgrounds (`#F8FAFC` & `#FFFFFF`): Menekankan kebersihan dan keterbacaan tinggi di layar HP kru dapur.
- **Tipografi**: Inter / Plus Jakarta Sans — modern, tegas, dan mudah dibaca oleh staf operasional dalam ritme kerja cepat.
- **Feedback & Motion**: Micro-animation saat AI sedang menganalisis foto (scanning laser effect), badge hijau cerah saat bersih, dan badge oranye saat ada catatan perbaikan.

---

## 3. Key Product Decisions & Trade-Offs

- **Penanganan Kamera & QR di Browser Web**:
  - *Pendekatan*: Menggunakan QR reader berbasis HTML5 video stream dengan fallback pilihan cepat area via tombol klik. Hal ini menjamin kru bisa memindai QR langsung dari aplikasi, atau langsung membuka link QR dari kamera bawaan HP (iOS / Android).
- **Verifikasi AI Gemini Vision (`@google/genai`)**:
  - *Pendekatan*: Mengirim gambar bukti ke Gemini 2.5 Flash dengan structured output (JSON). AI diminta menganalisis:
    1. Apakah foto tersebut benar-benar menampilkan area piket yang dimaksud?
    2. Apakah terdapat kotoran, sisa remahan tepung/minyak, lantai basah/kotor, atau peralatan tidak rapi?
    3. Status hasil verifikasi (`BERSIH_STANDAR` vs `PERLU_TINDAKLANJUT`).
    4. Catatan spesifik untuk kru (misal: *"Area fryer bersih, namun lap kotor masih tertinggal di samping baskom"*).
  - *Kenapa*: Memenuhi permintaan tanpa skor angka, namun memberikan koreksi langsung sebelum dilaporkan ke SPV.
- **Integrasi Google Sheets via Google Workspace Skill**:
  - *Pendekatan*: Menggunakan alur OAuth Google Workspace (`set_up_oauth` dengan scope spreadsheet). Data piket dikirim ke Google Sheets API secara terstruktur.
  - *Fallback Cerdas*: Tetap menyimpan log lokal di browser/server sehingga data tidak pernah hilang meskipun koneksi internet kru sedang lambat di area dapur.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          React Frontend (Vite)                         │
│                                                                        │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────┐ │
│  │     Crew QR View      │  │  SPV Monitoring Hub   │  │ QR Print Hub │ │
│  │ (Camera/QR + Upload)  │  │(Filters + Table + Log)│  │ (Sticker PDF)│ │
│  └───────────┬───────────┘  └──────────┬───────────┘  └──────────────┘ │
│              │                         │                               │
│              ▼                         ▼                               │
│  ┌─────────────────────────────────────────────────┐                   │
│  │    Roster & Shift Context (Auto-Crew Matcher)   │                   │
│  └───────────────────────┬─────────────────────────┘                   │
└──────────────────────────┼─────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Express Server / Backend                        │
│                                                                        │
│   POST /api/ai/verify-cleaning  ──►  Gemini 2.5 Flash Vision           │
│   POST /api/sheets/sync         ──►  Google Sheets API (Spreadsheet)   │
│   GET  /api/sheets/status       ──►  OAuth Check & Sheet Link          │
│   GET  /api/piket/records       ──►  Persistent Piket History Store    │
└────────────────────────────────────────────────────────────────────────┘
```

### Struktur Kolom Google Sheets
| No | Kolom | Keterangan |
|---|---|---|
| 1 | `Waktu Kirim` | Tanggal & Jam (e.g. `2026-09-26 14:30`) |
| 2 | `Nama Kru` | Kru piket yang bertugas |
| 3 | `Shift` | Shift Pagi / Siang / Closing |
| 4 | `Area Piket` | Dapur Fryer / Meja Kasir / Dining / Toilet / dll. |
| 5 | `Status AI` | Bersih Sesuai Standar / Perlu Ditindaklanjuti |
| 6 | `Temuan & Catatan AI`| Catatan deteksi visual dari Gemini |
| 7 | `Status Approval SPV`| Approved / Need Revision / Pending |
| 8 | `Link Foto Bukti` | Data referensi foto |

---

## Rencana Langkah Eksekusi (Setelah Approval)
1. **Persiapan Dependensi & Konfigurasi**: Menyiapkan QR reader (`html5-qrcode` / `qrcode.react`), Express API endpoints, dan inisialisasi OAuth Google Sheets.
2. **Implementasi Service AI Vision**: Endpoint proxy backend yang memanggil Gemini 2.5 Flash untuk memeriksa foto kebersihan dapur/outlet F&B.
3. **Implementasi Modul Roster & Jadwal Otomatis**: Fitur "Buat Piket" untuk mengatur kru harian agar pemilihan nama kru otomatis saat scan QR.
4. **Implementasi Modul Kru (Scan + Upload + AI Verification)**: Alur pemindaian responsif mobile yang super cepat dan mulus.
5. **Implementasi Dashboard SPV & Sync Google Sheets**: Tabel rekapitulasi, indikator kepatuhan piket harian, dan tombol ekspor/sync Sheets.
6. **Implementasi Generator Stiker QR Siap Cetak**: Halaman print view berstandar stiker label dengan logo Hara Chicken.
7. **Verifikasi & Build Test**: Pengujian kompilasi menyeluruh (`compile_applet`).
