// ============================================================================
// KONFIGURASI SUMBER DATA — Live Response (Google Form) & Master Data UKO
// ============================================================================
// Sheet Live Response: https://docs.google.com/spreadsheets/d/1Gt7w2LLRVhGnhEsNOVeewR2rvcs4AhKfbQeNgAn7cUU/edit#gid=1952116967
//
// AUTO-CONNECT: dashboard ini secara default membangun URL export CSV Google
// Sheets (`/export?format=csv&gid=...`) dari SHEET_ID + GID di bawah — TIDAK
// perlu langkah manual "Publish to web". Ini bekerja selama sheet dibagikan
// minimal sebagai "Anyone with the link — Viewer". Endpoint ini dipoll setiap
// `pollIntervalMs` supaya Live Response tersinkron otomatis tanpa refresh.
//
// Jika suatu saat sheet diganti privat / butuh autentikasi, override lewat
// file `.env`:
//   VITE_SHEET_CSV_URL=...   (link publish-to-web / export csv custom)
//   VITE_SHEET_ID=...        VITE_SHEET_GID=...
//   VITE_GOOGLE_API_KEY=...  (opsional, untuk jalur Sheets API v4)
// ============================================================================

const DEFAULT_SHEET_ID = '1Gt7w2LLRVhGnhEsNOVeewR2rvcs4AhKfbQeNgAn7cUU'
const DEFAULT_GID = '1952116967'

const sheetId = import.meta.env.VITE_SHEET_ID || DEFAULT_SHEET_ID
const gid = import.meta.env.VITE_SHEET_GID || DEFAULT_GID
const explicitCsvUrl = import.meta.env.VITE_SHEET_CSV_URL || ''
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || ''

// URL auto-connect: dibangun otomatis dari sheetId + gid (tidak butuh publish manual)
const autoCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
// URL cadangan (gviz) — dipakai hook sebagai fallback jika `export` diblokir CORS
const gvizCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`

export const SHEET_CONFIG = {
  sheetId,
  gid,
  csvUrl: explicitCsvUrl || autoCsvUrl,
  fallbackCsvUrl: gvizCsvUrl,
  apiUrl: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Form%20Responses%201?key=${apiKey}`,
  apiKey,
  useApi: Boolean(apiKey),
  pollIntervalMs: 30_000, // interval refresh live response (30 detik)
}

// Mapping header mentah Google Form -> field internal dashboard.
// Header di sheet Live Response (lihat tab "Form_Responses"):
// Timestamp | Jenis UKO | Tanggal Pelaksanaan | Kode UKO | Nama UKO | Jabatan |
// Pilihan Video | PN FL Yang Roleplay | Nama FL Yang Roleplay | Upload Video |
// Keterangan Premises
export const COLUMN_MAP = {
  timestamp: { raw: ['timestamp'], field: 'timestamp' },
  jenisUko: { raw: ['jenis uko'], field: 'jenisUko' },
  tanggalPelaksanaan: { raw: ['tanggal pelaksanaan'], field: 'tanggalPelaksanaan' },
  kodeUko: { raw: ['kode uko'], field: 'kodeUko' },
  namaUko: { raw: ['nama uko'], field: 'namaUko' },
  jabatan: { raw: ['jabatan'], field: 'jabatan' },
  pilihanVideo: { raw: ['pilihan video'], field: 'pilihanVideo' },
  pnFl: { raw: ['pn fl'], field: 'pnFl' },
  namaFl: { raw: ['nama fl'], field: 'namaFl' },
  uploadVideo: { raw: ['upload video'], field: 'uploadVideo' },
  keteranganPremises: { raw: ['keterangan premises'], field: 'keteranganPremises' },
}

// Kolom yang ditampilkan pada tabel Live Response — urut & label PERSIS sama
// dengan header Google Sheet supaya operator langsung mengenali datanya.
export const LIVE_RESPONSE_COLUMNS = [
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'jenisUko', label: 'Jenis UKO' },
  { key: 'tanggalPelaksanaan', label: 'Tanggal Pelaksanaan' },
  { key: 'kodeUko', label: 'Kode UKO' },
  { key: 'namaUko', label: 'Nama UKO' },
  { key: 'jabatan', label: 'Jabatan' },
  { key: 'pilihanVideo', label: 'Pilihan Video' },
  { key: 'pnFl', label: 'PN FL Yang Roleplay' },
  { key: 'namaFl', label: 'Nama FL Yang Roleplay' },
  { key: 'uploadVideo', label: 'Upload Video' },
  { key: 'keteranganPremises', label: 'Keterangan Premises' },
]

// --------------------------------------------------------------------------
// Mapping "Jabatan" (nilai isian Google Form) -> kolom parameter pada matriks
// REPORT FINAL ROLEPLAY (CS / Satpam jabatan CS / Satpam jabatan Teller /
// Satpam Only / Teller / UB). Dipakai untuk menghitung jumlah video roleplay
// per parameter, per UKO.
//
// CATATAN: opsi "Jabatan" yang sudah dikonfirmasi ada di form adalah
// "Universal banker" (untuk skenario UB). Tambahkan / sesuaikan pola di
// bawah ini persis dengan opsi dropdown "Jabatan" pada Google Form Anda
// (case-insensitive, dicocokkan dengan `includes`).
// --------------------------------------------------------------------------
export const JABATAN_TO_METRIC = [
  { metric: 'satpamCS', patterns: ['satpam jabatan cs', 'satpam sbg cs', 'satpam - cs'] },
  { metric: 'satpamTeller', patterns: ['satpam jabatan teller', 'satpam sbg teller', 'satpam - teller'] },
  { metric: 'satpamOnly', patterns: ['satpam only', 'satpam'] },
  { metric: 'cs', patterns: ['universal banker', 'cs'] },
  { metric: 'teller', patterns: ['teller'] },
  { metric: 'ub', patterns: ['ub', 'unit banking'] },
]

export function jabatanToMetric(jabatan) {
  const val = String(jabatan || '').toLowerCase().trim()
  for (const { metric, patterns } of JABATAN_TO_METRIC) {
    if (patterns.some((p) => val.includes(p))) return metric
  }
  return null
}

// Kolom parameter roleplay yang berada di bawah banner "ROLEPLAY, [tanggal]"
export const ROLEPLAY_PARAM_COLUMNS = [
  { key: 'cs', label: 'CS' },
  { key: 'satpamCS', label: 'Satpam jabatan CS' },
  { key: 'satpamTeller', label: 'Satpam jabatan Teller' },
  { key: 'satpamOnly', label: 'Satpam Only' },
  { key: 'teller', label: 'Teller' },
  { key: 'ub', label: 'UB' },
]

// Kolom identitas unit (di luar grup parameter)
export const IDENTITY_COLUMNS = [
  { key: 'branchCode', label: 'Branch Code' },
  { key: 'namaUko', label: 'Nama UKO' },
  { key: 'kcInduk', label: 'KC Induk' },
]

export const VIDEO_COLUMN = { key: 'videoPremises', label: 'VIDEO PREMISES' }

// Susunan lengkap kolom matriks REPORT FINAL ROLEPLAY (urutan tampil)
export const REPORT_COLUMNS = [...IDENTITY_COLUMNS, ...ROLEPLAY_PARAM_COLUMNS, VIDEO_COLUMN]

export const PARAMETER_KEYS = ['cs', 'satpamCS', 'satpamTeller', 'satpamOnly', 'teller', 'ub', 'videoPremises']

// Palet warna persis mengikuti dokumen "REPORT FINAL ROLEPLAY"
export const REPORT_PALETTE = {
  headerNavy: '#0B1F4D',
  headerNavyText: '#FFFFFF',
  bannerBlue: '#AFC6EF',
  bannerBlueText: '#0B1F4D',
  videoTeal: '#7FD6D6',
  videoTealText: '#0B1F4D',
  rowBandGreen: '#E3F1DD',
  rowBandWhite: '#FFFFFF',
  cellGreen: '#8CC63F',
  cellGreenText: '#1A2E05',
  cellRed: '#F3A0A0',
  cellRedText: '#5C0E0E',
  cellNA: '#000000',
  gridLine: '#9AA5B8',
}

// Style untuk nilai numerik pada sel parameter (dipakai di UI & export)
export function getValueStyle(value) {
  if (value === null || value === undefined || value === '') {
    return { kind: 'na', bg: REPORT_PALETTE.cellNA, text: REPORT_PALETTE.cellNA, label: '' }
  }
  const num = Number(value)
  if (num === 0) {
    return { kind: 'fail', bg: REPORT_PALETTE.cellRed, text: REPORT_PALETTE.cellRedText, label: '0' }
  }
  return { kind: 'pass', bg: REPORT_PALETTE.cellGreen, text: REPORT_PALETTE.cellGreenText, label: String(num) }
}
