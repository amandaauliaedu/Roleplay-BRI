// Google Form "Timestamp" & "Tanggal Pelaksanaan" biasanya berformat lokal
// Indonesia: "DD/MM/YYYY HH:mm:ss" atau "Rabu, 24 Juni 2026" — BUKAN format
// AS (MM/DD/YYYY) yang diasumsikan `new Date(str)` bawaan JavaScript. Kalau
// dibiarkan pakai parser bawaan, tanggal seperti "24/06/2026" (tgl 24 bulan
// Juni) bisa gagal di-parse atau salah urutan. Fungsi ini menangani kedua
// format tsb secara eksplisit.

const BULAN_ID = {
  januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
  juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11,
}

export function parseIndoDate(raw) {
  if (!raw) return null
  const str = String(raw).trim()
  if (!str) return null

  // Format "DD/MM/YYYY" atau "DD/MM/YYYY HH:mm:ss"
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/)
  if (slashMatch) {
    const [, d, m, y, hh = '0', mm = '0', ss = '0'] = slashMatch
    const date = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss))
    return Number.isNaN(date.getTime()) ? null : date
  }

  // Format "Rabu, 24 Juni 2026" (nama hari opsional)
  const idMatch = str
    .toLowerCase()
    .match(/(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+(\d{4})/)
  if (idMatch) {
    const [, d, bulan, y] = idMatch
    const date = new Date(Number(y), BULAN_ID[bulan], Number(d))
    return Number.isNaN(date.getTime()) ? null : date
  }

  // Fallback: ISO / format lain yang bisa dikenali parser bawaan
  const fallback = new Date(str)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

const BULAN_LABEL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function formatIndoDate(date) {
  if (!date) return ''
  return `${date.getDate()} ${BULAN_LABEL[date.getMonth()]} ${date.getFullYear()}`
}

// Untuk nama file: "8_Agustus_2026" (tanpa spasi/koma)
export function slugifyIndoDate(date) {
  if (!date) return ''
  return `${date.getDate()}_${BULAN_LABEL[date.getMonth()]}_${date.getFullYear()}`
}
