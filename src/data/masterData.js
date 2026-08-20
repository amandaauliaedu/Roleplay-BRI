// ============================================================================
// MASTER DATA UKO — RO SURABAYA
// ============================================================================
// Sumber: MASTER_DATA_UKO_KANWIL.xls (dilampirkan oleh user).
// Dipakai untuk:
//  1) Menentukan "KC Induk" (namaCabang) dari setiap Kode UKO, dipakai untuk
//     mengelompokkan Download Report persis seperti dokumen "REPORT FINAL
//     ROLEPLAY" (per KC Induk, urutan sesuai urutan pada master data).
//  2) Melengkapi Nama UKO / Jenis UKO / Kode Branch jika field tersebut
//     kosong pada respons Google Form (mis. hanya kode yang diisi).
// ============================================================================
import { MASTER_DATA_RAW } from './masterDataRaw'

// Normalisasi kode: Excel/Google Sheets sering membuang leading zero pada
// kolom angka ("0006" -> 6). Kita samakan semua kode ke bentuk numerik-string
// tanpa leading zero supaya pencocokan antara master data & respons form
// tidak meleset gara-gara format kode berbeda.
export function normalizeCode(value) {
  if (value === null || value === undefined) return ''
  const trimmed = String(value).trim()
  if (trimmed === '') return ''
  const numeric = trimmed.replace(/\D/g, '')
  if (numeric === '') return trimmed.toUpperCase()
  return String(parseInt(numeric, 10))
}

export const MASTER_DATA = MASTER_DATA_RAW.map((r) => ({
  ...r,
  kodeUkoNorm: normalizeCode(r.kodeUko),
  kodeBranchNorm: normalizeCode(r.kodeBranch),
}))

// Lookup cepat: Kode UKO (normalized) -> record master
const UKO_INDEX = new Map(MASTER_DATA.map((r) => [r.kodeUkoNorm, r]))

export function findUkoByKode(kodeUko) {
  return UKO_INDEX.get(normalizeCode(kodeUko)) || null
}

// Kode UKO asli di file .xls berupa teks berpadding-nol (mis. "0006"), tapi
// saat dibaca lewat pandas/Excel angka murni kehilangan nol di depan
// ("6"). Fungsi ini mengembalikan bentuk tampil 4-digit yang benar — dipakai
// untuk kolom "Branch Code" pada Report Final Roleplay (kolom itu sebenarnya
// menampilkan Kode UKO tiap baris, bukan kode cabang induk bersama).
export function padUkoCode(code) {
  const norm = normalizeCode(code)
  if (!norm) return ''
  return norm.length < 4 ? norm.padStart(4, '0') : norm
}

// Daftar KC Induk unik, URUTAN SESUAI MASTER DATA (= urutan dokumen
// "REPORT FINAL ROLEPLAY" asli) — dipakai untuk mengurutkan Download Report.
export const KC_INDUK_ORDER = [...new Set(MASTER_DATA.map((r) => r.namaCabang))]

// Urutan UKO di dalam satu KC Induk juga mengikuti urutan pada master data
// (KC induk selalu baris pertama, lalu KCP/KK/UNIT menyusul).
export const UKO_ORDER_BY_KC = KC_INDUK_ORDER.reduce((acc, kc) => {
  acc[kc] = MASTER_DATA.filter((r) => r.namaCabang === kc).map((r) => r.kodeUkoNorm)
  return acc
}, {})

export const JENIS_UKO_OPTIONS = [...new Set(MASTER_DATA.map((r) => r.jenisUko))]
