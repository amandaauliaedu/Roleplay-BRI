# Roleplay RO Surabaya — BRI Region 12 Surabaya (OSE)

Dashboard interaktif untuk memantau, menganalisis, dan mengunduh laporan Roleplay
Operation, Service, and E-Channel (OSE) — BRI Region 12 Surabaya. Dibangun dengan
React (Vite), Tailwind CSS, Framer Motion, Recharts, dan TanStack Table.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`.

## Auto-connect ke Google Sheet Live Response

Dashboard ini **otomatis tersambung** ke sheet berikut tanpa konfigurasi tambahan:
`https://docs.google.com/spreadsheets/d/1Gt7w2LLRVhGnhEsNOVeewR2rvcs4AhKfbQeNgAn7cUU/edit#gid=1952116967`

Ia membangun URL export CSV dari `sheetId` + `gid` (lihat `src/data/config.js`) dan
mem-poll ulang setiap 30 detik — kolom Live Response mengikuti persis header sheet
asli (Timestamp, Jenis UKO, Tanggal Pelaksanaan, Kode UKO, Nama UKO, Jabatan,
Pilihan Video, PN FL Yang Roleplay, Nama FL Yang Roleplay, Upload Video,
Keterangan Premises). Syaratnya hanya: sheet dibagikan minimal sebagai **"Anyone
with the link — Viewer"**. Lihat `.env.example` untuk opsi override (ganti sheet
lain, atau pakai Google Sheets API v4).

Jika koneksi live gagal (offline / sheet belum publik), dashboard otomatis jatuh
ke mode demo (badge "Demo" di navbar) memakai data dummy realistis agar tetap
bisa didemokan.

## Tema Dark / Light

Toggle di pojok kanan navbar mengganti tema (disimpan di localStorage). Seluruh
palet warna memakai CSS variables (`src/index.css`) bertema **biru korporat BRI**
(`--c-brand`), sehingga tidak perlu mengubah className di komponen manapun saat
berganti tema.

## Master Data UKO & KC Induk

`src/data/masterDataRaw.js` di-generate dari `MASTER_DATA_UKO_KANWIL.xls` (358
baris UKO). `src/data/masterData.js` menyediakan lookup Kode UKO → KC Induk
(dengan normalisasi leading-zero) yang dipakai untuk:
- Melengkapi Nama UKO / Jenis UKO / KC Induk pada Live Response.
- Mengelompokkan & mengurutkan Download Report per KC Induk sesuai urutan resmi.

Jika struktur cabang berubah, re-generate `masterDataRaw.js` dari file `.xls`
terbaru (lihat komentar di kepala file tsb).

## Struktur Proyek

```
src/
├── App.jsx                   # Orkestrasi navigasi & fetching data
├── main.jsx                  # Entry point React (dibungkus ThemeProvider)
├── index.css                 # Tailwind + CSS variables tema dark/light
├── context/
│   └── ThemeContext.jsx      # State tema dark/light + persist localStorage
├── components/
│   ├── Navbar.jsx            # Navigasi 4 section + toggle tema + status sync
│   ├── StatCard.jsx          # Kartu statistik ringkas
│   ├── FilterBar.jsx         # Search + filter dropdown + date range
│   ├── DataTable.jsx         # Tabel TanStack Table — kolom sesuai sheet asli
│   ├── ReportMatrix.jsx      # Tabel matriks sesuai format REPORT FINAL ROLEPLAY
│   ├── ValueCell.jsx         # Sel nilai hijau/merah/N/A
│   └── LoadingState.jsx      # Spinner & indikator status sinkronisasi
├── sections/
│   ├── Home.jsx               # Section 1: Landing + hero + quick stats
│   ├── LiveResponse.jsx       # Section 2: Live monitoring + filter
│   ├── DownloadReport.jsx     # Section 3: Filter periode/hierarki + export xlsx/pdf
│   └── DataAnalyst.jsx        # Section 4: KPI + bar/line/pie/radar chart
├── hooks/
│   └── useSheetData.js        # Auto-connect + polling CSV, fallback demo data
├── utils/
│   ├── dataProcessor.js       # Parsing submission + agregasi matriks laporan
│   ├── mockData.js            # Generator data dummy (fallback offline)
│   ├── exportExcel.js         # Export .xlsx — 1 blok header per KC Induk
│   └── exportPDF.js           # Export PDF — 1 halaman per KC Induk
└── data/
    ├── config.js               # Konfigurasi sumber data, mapping kolom & warna
    ├── masterData.js           # Lookup Kode UKO -> KC Induk + helper
    └── masterDataRaw.js        # Data mentah dari MASTER_DATA_UKO_KANWIL.xls
```
