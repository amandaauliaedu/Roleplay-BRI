# Dashboard Roleplay -- BRI Region 12 Surabaya (OSE)

Dashboard interaktif untuk memantau, menganalisis, dan mengunduh laporan Roleplay
Operation, Service, and E-Channel (OSE) BRI Region 12 Surabaya. Dibangun dengan
React (Vite), Tailwind CSS, Framer Motion, Recharts, dan TanStack Table.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`. Live Response akan otomatis mencoba menyambung ke
Google Sheets live response tanpa setup tambahan (lihat bagian di bawah).

## Alur Data

```
Google Sheets (Form_Responses)
        │  fetch via endpoint gviz/tq (CSV), auto, tiap 60 detik
        ▼
useSheetData()  ──►  rawRows (submisi mentah, 1 baris = 1 submisi roleplay)
        │
        │  buildReportMatrix() + MASTER_DATA (Kode UKO → Jenis UKO, KC Induk)
        ▼
matrixRows (1 baris = 1 unit, kolom CS/Satpam-CS/.../Video Premises terhitung)
        │
        ├─► Home: computeSummary()
        ├─► Data Analyst: aggregateByKcInduk(), aggregateTrend(rawRows), dst
        └─► Download Report: groupMatrixByKcInduk() → preview & export per KC Induk
```

## Struktur Proyek

```
src/
├── App.jsx                   # Orkestrasi navigasi, fetch data, agregasi matriks
├── data/
│   ├── config.js              # Sumber data, mapping kolom, mapping Jabatan→Parameter
│   └── masterData.js          # Master data UKO (embed statis dari MASTER_DATA_UKO_KANWIL.xls)
├── hooks/
│   ├── useSheetData.js        # Fetch + polling live sheet, fallback mock
│   └── useTheme.js            # Toggle dark/light + persist ke localStorage
├── components/
│   ├── Navbar.jsx             # Branding + navigasi 4 section + theme toggle
│   ├── DataTable.jsx          # Tabel Live Response (kolom persis Google Form)
│   ├── ReportMatrix.jsx       # Preview matriks laporan, dikelompokkan per KC Induk
│   ├── ValueCell.jsx          # Sel nilai hijau/merah/hitam (N/A)
│   ├── FilterBar.jsx          # Filter KC Induk / Jenis UKO / Kode UKO / tanggal
│   └── LoadingState.jsx       # Spinner & indikator status sinkronisasi
├── sections/
│   ├── Home.jsx                # Section 1: Landing + hero + quick stats
│   ├── LiveResponse.jsx        # Section 2: submisi mentah + filter
│   ├── DownloadReport.jsx      # Section 3: filter + preview + export per KC Induk
│   └── DataAnalyst.jsx         # Section 4: KPI + bar/line/pie/radar chart
└── utils/
    ├── dataProcessor.js        # Parsing, klasifikasi Jabatan, agregasi matriks
    ├── mockData.js             # Generator submisi dummy (fallback offline)
    ├── exportExcel.js          # Export .xlsx (exceljs) dikelompokkan per KC Induk
    └── exportPDF.js            # Export PDF (jspdf-autotable) dikelompokkan per KC Induk
```

## Live Response -- Auto-Connect ke Google Sheets

Sheet live response dibagikan sebagai **"Anyone with link can view"**, sehingga
bisa diakses langsung dari browser lewat endpoint export CSV bawaan Google
(`/gviz/tq?tqx=out:csv&gid=...`) -- **tanpa perlu API key atau setup manual**.
URL ini sudah di-hardcode sebagai default di `src/data/config.js` memakai ID
sheet yang kamu berikan, jadi begitu `npm run dev` dijalankan, Live Response
akan langsung mencoba sinkron dari sheet aslinya.

Jika suatu saat sheet berubah jadi private, fetch akan gagal (CORS/403) dan
dashboard otomatis fallback ke data simulasi (badge "MODE DEMO") -- tidak akan
menampilkan layar kosong. Untuk kembali live setelah itu, kamu bisa:

1. Pastikan sharing sheet kembali ke "Anyone with link can view", **atau**
2. Isi `.env` dengan `VITE_GOOGLE_API_KEY` + Google Sheets API v4 untuk akses
   yang butuh autentikasi.

## Menyesuaikan Mapping Jabatan → Parameter Report

Baris live response adalah submisi mentah per parameter (kolom `Jabatan` &
`Pilihan Video`). Untuk menghasilkan matriks REPORT FINAL ROLEPLAY, submisi
dihitung per Kode UKO berdasarkan `JABATAN_PARAM_MAP` dan `VIDEO_PREMISES_MATCH`
di `src/data/config.js`. **Sesuaikan daftar teks di sana jika label pilihan di
Google Form kamu berbeda** -- pencocokan bersifat case-insensitive & substring.

Parameter **UB** secara default hanya dihitung untuk unit berjenis `KC`
(kantor cabang induk) -- sub-unit (KCP/KK/UNIT) akan tampil N/A (hitam),
sesuai pola yang konsisten pada seluruh dokumen contoh yang dilampirkan.
Ini diatur lewat `KC_ONLY_PARAMS` di `config.js`, silakan kosongkan array
tersebut bila ingin UB dihitung apa adanya di semua jenis UKO.

## Master Data UKO

`src/data/masterData.js` berisi 358 unit (KC/KCP/KK/UNIT) di 25 KC Induk,
di-embed statis dari `MASTER_DATA_UKO_KANWIL.xls` yang dilampirkan. Data ini
dipakai untuk:
- Melengkapi KC Induk pada setiap baris live response (lookup by Kode UKO)
- Menentukan daftar lengkap unit pada Download Report (termasuk unit yang
  belum ada submisinya sama sekali -- tetap muncul dengan nilai 0)

Jika daftar unit berubah, update ulang array `MASTER_DATA` di file tersebut
(atau minta dibuatkan ulang dari file master data terbaru).

## Download Report -- Dikelompokkan per KC Induk

Preview di layar maupun file Excel/PDF yang diunduh sekarang tersusun sebagai
**satu tabel per KC Induk** (header diulang di tiap kelompok), persis seperti
struktur dokumen "REPORT FINAL ROLEPLAY" yang dilampirkan. Gunakan filter KC
Induk untuk mempersempit ke satu cabang saja, atau biarkan "Semua" untuk
mengunduh seluruh 25 KC Induk sekaligus.

- **Excel**: `src/utils/exportExcel.js` (pustaka `exceljs` -- mendukung warna
  sel, merge cell, dan border seperti dokumen asli)
- **PDF**: `src/utils/exportPDF.js` (pustaka `jspdf` + `jspdf-autotable`,
  header 2 baris dengan colSpan/rowSpan, page-break otomatis antar KC Induk)

## Tema Dark & Light

Tombol toggle (ikon matahari/bulan) ada di navbar kanan atas. Preferensi
tersimpan di `localStorage` lewat `src/hooks/useTheme.js`. Warna brand (biru
BRI, `#00529C`) tetap konsisten di kedua tema; hanya latar & kontras teks yang
berubah lewat CSS variable di `src/index.css`.

## Build Produksi

```bash
npm run build
npm run preview
```
