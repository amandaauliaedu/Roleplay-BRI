// ============================================================================
// KONFIGURASI SUMBER DATA -- AUTO-CONNECT KE GOOGLE SHEETS
// ============================================================================
// Sheet live response dibagikan sebagai "Anyone with link can view", sehingga
// bisa diakses langsung dari browser tanpa API key lewat endpoint export CSV
// bawaan Google (gviz). Ini yang membuat Live Response bisa auto-connect &
// auto-sync tanpa perlu langkah "Publish to web" manual.
//
// Jika suatu saat sheet diubah menjadi private/restricted, fetch ini akan
// gagal (CORS/403) dan dashboard otomatis fallback ke mock data -- tidak
// akan menampilkan layar kosong/error ke pengguna.
// ============================================================================

const SHEET_ID = import.meta.env.VITE_SHEET_ID || '1Gt7w2LLRVhGnhEsNOVeewR2rvcs4AhKfbQeNgAn7cUU'
const SHEET_GID = import.meta.env.VITE_SHEET_GID || '1952116967'

function buildDefaultCsvUrl(id, gid) {
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`
}

export const SHEET_CONFIG = {
  sheetId: SHEET_ID,
  gid: SHEET_GID,
  // Bisa dioverride lewat VITE_SHEET_CSV_URL kalau sheet-nya berbeda / private
  csvUrl: import.meta.env.VITE_SHEET_CSV_URL || buildDefaultCsvUrl(SHEET_ID, SHEET_GID),
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
  pollIntervalMs: 60_000, // interval refresh live response
}

// ============================================================================
// MAPPING KOLOM MENTAH GOOGLE FORM -> FIELD INTERNAL
// ============================================================================
// Sesuai struktur asli sheet "Form_Responses":
// Timestamp | Jenis UKO | Tanggal Pelaksanaan | Kode UKO | Nama UKO | Jabatan
// | Pilihan Video | PN FL Yang Roleplay | Nama FL Yang Roleplay | Upload Video
// | Keterangan Premises
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

// ============================================================================
// AGREGASI: JABATAN (submisi mentah) -> KOLOM PARAMETER REPORT FINAL ROLEPLAY
// ============================================================================
// Setiap baris respons mentah = SATU submisi roleplay untuk SATU parameter.
// Untuk menghasilkan matriks REPORT FINAL ROLEPLAY, submisi per Kode UKO
// dihitung (count) per parameter berikut. Sesuaikan daftar `match` di bawah
// bila label pilihan pada Google Form kamu berbeda teksnya -- pencocokan
// bersifat case-insensitive & substring, urutan dari paling spesifik.
export const JABATAN_PARAM_MAP = [
  { param: 'satpamCS', match: ['satpam jabatan cs', 'satpam sbg cs', 'satpam sebagai cs'] },
  { param: 'satpamTeller', match: ['satpam jabatan teller', 'satpam sbg teller', 'satpam sebagai teller'] },
  { param: 'satpamOnly', match: ['satpam only', 'satpam saja'] },
  { param: 'ub', match: ['universal banker', 'universal bank', ' ub '] },
  { param: 'teller', match: ['teller'] },
  { param: 'cs', match: ['customer service', ' cs ', 'cs'] },
]

// Nilai "Pilihan Video" yang dianggap sebagai submisi Video Premises
// (selain "Video Roleplay" yang dihitung ke parameter jabatan di atas)
export const VIDEO_PREMISES_MATCH = ['video premises', 'premises']

// Parameter yang HANYA berlaku di level KC (kantor cabang induk unit itu
// sendiri) -- pada praktiknya UB dievaluasi satu kali per cabang, bukan per
// UKO turunannya. Sub-unit (KCP/KK/UNIT) akan ditampilkan N/A (hitam) untuk
// parameter ini walau tidak ada larangan submit dari form. Kosongkan array
// ini bila kamu ingin semua parameter dihitung apa adanya di semua jenis UKO.
export const KC_ONLY_PARAMS = ['ub']

export const PARAMETER_KEYS = ['cs', 'satpamCS', 'satpamTeller', 'satpamOnly', 'teller', 'ub', 'videoPremises']

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
