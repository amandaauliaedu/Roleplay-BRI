import { PARAMETER_KEYS, COLUMN_MAP, jabatanToMetric, isPremisesJabatan } from '../data/config'
import { MASTER_DATA, KC_INDUK_ORDER, UKO_ORDER_BY_KC, findUkoByKode, normalizeCode, padUkoCode } from '../data/masterData'
import { parseIndoDate, slugifyIndoDate } from './dateUtils'

// ============================================================================
// 1) PARSING RESPONS MENTAH GOOGLE FORM (Live Response)
// ============================================================================
// Setiap baris = satu submission video roleplay/premises apa adanya, PERSIS
// seperti tampil di sheet "Form_Responses" (tidak diagregasi).
export function normalizeSheetRows(rawRows) {
  const headerKeys = Object.keys(rawRows[0] || {})

  const resolvedMap = {}
  Object.entries(COLUMN_MAP).forEach(([internalKey, { raw }]) => {
    const match = headerKeys.find((h) =>
      raw.some((candidate) => h.toLowerCase().trim().includes(candidate.toLowerCase())),
    )
    if (match) resolvedMap[internalKey] = match
  })

  return rawRows
    .filter((row) => Object.values(row).some((v) => String(v || '').trim() !== ''))
    .map((row, idx) => {
      const kodeUko = row[resolvedMap.kodeUko] || ''
      const master = findUkoByKode(kodeUko)
      const timestampRaw = row[resolvedMap.timestamp] || ''
      const tanggalRaw = row[resolvedMap.tanggalPelaksanaan] || ''
      return {
        id: `LR-${idx}-${kodeUko}`,
        timestamp: timestampRaw,
        timestampDate: parseIndoDate(timestampRaw),
        jenisUko: master?.jenisUko || row[resolvedMap.jenisUko] || '',
        tanggalPelaksanaan: tanggalRaw,
        tanggalPelaksanaanDate: parseIndoDate(tanggalRaw),
        kodeUko: kodeUko,
        kodeUkoNorm: normalizeCode(kodeUko),
        namaUko: master?.namaUker || row[resolvedMap.namaUko] || '',
        jabatan: row[resolvedMap.jabatan] || '',
        pilihanVideo: row[resolvedMap.pilihanVideo] || '',
        pnFl: row[resolvedMap.pnFl] || '',
        namaFl: row[resolvedMap.namaFl] || '',
        uploadVideo: row[resolvedMap.uploadVideo] || '',
        keteranganPremises: row[resolvedMap.keteranganPremises] || '',
        kcInduk: master?.namaCabang || 'Tidak dikenali',
        branchCode: master?.kodeBranch || '',
      }
    })
    // Terbaru & berurutan: submission dengan Timestamp paling baru tampil
    // paling atas. Pakai timestampDate hasil parse eksplisit (bukan
    // `new Date(str)` bawaan) supaya format DD/MM/YYYY khas Google Form
    // Indonesia tidak salah urut.
    .sort((a, b) => {
      const tb = b.timestampDate ? b.timestampDate.getTime() : 0
      const ta = a.timestampDate ? a.timestampDate.getTime() : 0
      return tb - ta
    })
}

// ============================================================================
// 2) AGREGASI -> MATRIKS "REPORT FINAL ROLEPLAY" (per KC Induk, per UKO)
// ============================================================================
// Untuk setiap Kode UKO pada MASTER DATA, hitung jumlah video roleplay yang
// sesuai per parameter (CS / Satpam jabatan CS / Satpam jabatan Teller /
// Satpam Only / Teller / UB) berdasarkan field "Jabatan" pada submission,
// dan jumlah "Video Premises" dari field "Pilihan Video".
//
// Nilai sel: null = N/A (UKO tsb belum pernah submit APAPUN — belum
// terpantau roleplay-nya sama sekali), 0..n = jumlah video yang sudah masuk.
// Aturan "N/A vs 0" ini bisa disesuaikan jika ada ketentuan applicability
// resmi per Jenis UKO (KC/KCP/KK/UNIT) — cukup ubah fungsi `buildParamSet`.
export function buildReportRows(liveRows) {
  const byUko = new Map() // kodeUkoNorm -> submissions[]
  liveRows.forEach((row) => {
    if (!row.kodeUkoNorm) return
    if (!byUko.has(row.kodeUkoNorm)) byUko.set(row.kodeUkoNorm, [])
    byUko.get(row.kodeUkoNorm).push(row)
  })

  const rows = []
  MASTER_DATA.forEach((uko) => {
    const submissions = byUko.get(uko.kodeUkoNorm) || []
    rows.push({
      id: `RPT-${uko.kodeUkoNorm}`,
      // "Branch Code" pada template REPORT FINAL ROLEPLAY sebenarnya adalah
      // Kode UKO milik baris itu sendiri (bukan kode cabang induk bersama),
      // ditampilkan 4-digit dengan nol di depan persis seperti dokumen asli
      // (mis. "0006", bukan "6").
      branchCode: padUkoCode(uko.kodeUko),
      namaUko: uko.namaUker,
      kcInduk: uko.namaCabang,
      jenisUko: uko.jenisUko,
      kodeUko: uko.kodeUko,
      ...buildParamSet(submissions),
    })
  })
  return rows
}

function buildParamSet(submissions) {
  const hasAnyData = submissions.length > 0
  const counts = { cs: 0, satpamCS: 0, satpamTeller: 0, satpamOnly: 0, teller: 0, ub: 0, videoPremises: 0 }

  submissions.forEach((s) => {
    // Video Premises ditentukan dari Jabatan = "Middle Manajer" (role khusus
    // yang bertugas upload video Premises), BUKAN dari field "Pilihan Video".
    if (isPremisesJabatan(s.jabatan)) {
      counts.videoPremises += 1
      return
    }
    const metric = jabatanToMetric(s.jabatan)
    if (metric) counts[metric] += 1
  })

  if (!hasAnyData) {
    return { cs: null, satpamCS: null, satpamTeller: null, satpamOnly: null, teller: null, ub: null, videoPremises: null }
  }
  return counts
}

// --------------------------------------------------------------------------
// DIAGNOSTIK: nilai "Jabatan" dari submission live yang TIDAK cocok dengan
// pola manapun di JABATAN_TO_METRIC / PREMISES_JABATAN_PATTERNS (config.js)
// — akibatnya submission tsb tidak menambah hitungan parameter apapun
// (tampak sebagai angka 0 di laporan padahal sebenarnya ADA data). Dipakai
// untuk banner diagnostik di Download Report.
// --------------------------------------------------------------------------
export function distinctUnmatchedJabatan(liveRows) {
  const counts = new Map()
  liveRows.forEach((row) => {
    const raw = String(row.jabatan || '').trim()
    if (!raw) return
    if (isPremisesJabatan(raw)) return
    if (jabatanToMetric(raw)) return
    counts.set(raw, (counts.get(raw) || 0) + 1)
  })
  return [...counts.entries()]
    .map(([jabatan, count]) => ({ jabatan, count }))
    .sort((a, b) => b.count - a.count)
}

// Urutkan rows agregat sesuai urutan resmi KC Induk & UKO pada master data
// (dipakai untuk preview & export supaya identik dengan dokumen asli).
export function sortReportRowsByMasterOrder(rows) {
  const rank = new Map()
  let i = 0
  KC_INDUK_ORDER.forEach((kc) => {
    ;(UKO_ORDER_BY_KC[kc] || []).forEach((kodeUkoNorm) => {
      rank.set(kodeUkoNorm, i++)
    })
  })
  return [...rows].sort((a, b) => (rank.get(normalizeCode(a.kodeUko)) ?? 0) - (rank.get(normalizeCode(b.kodeUko)) ?? 0))
}

// Kelompokkan rows agregat per KC Induk (dipakai export Excel/PDF supaya
// setiap KC Induk berada di grup/halamannya sendiri, seperti dokumen asli).
export function groupReportRowsByKc(rows) {
  const sorted = sortReportRowsByMasterOrder(rows)
  const groups = []
  let current = null
  sorted.forEach((row) => {
    if (!current || current.kcInduk !== row.kcInduk) {
      current = { kcInduk: row.kcInduk, rows: [] }
      groups.push(current)
    }
    current.rows.push(row)
  })
  return groups
}

// --------------------------------------------------------------------------
// Filtering (dipakai baik untuk Live Response mentah maupun rows agregat)
// --------------------------------------------------------------------------
export function filterRows(rows, { kcInduk, namaUko, branchCode, jenisUko, dateFrom, dateTo, search, timestampKey = 'timestampDate' } = {}) {
  return rows.filter((row) => {
    if (kcInduk && kcInduk !== 'Semua' && row.kcInduk !== kcInduk) return false
    if (namaUko && namaUko !== 'Semua' && row.namaUko !== namaUko) return false
    if (branchCode && branchCode !== 'Semua' && row.branchCode !== branchCode) return false
    if (jenisUko && jenisUko !== 'Semua' && row.jenisUko !== jenisUko) return false
    const rowDate = row[timestampKey]
    if (dateFrom && rowDate && rowDate < new Date(dateFrom)) return false
    if (dateTo && rowDate && rowDate > new Date(new Date(dateTo).setHours(23, 59, 59))) return false
    if (search) {
      const q = search.toLowerCase()
      const haystack = `${row.kcInduk} ${row.namaUko} ${row.branchCode} ${row.jabatan || ''} ${row.namaFl || ''} ${row.pnFl || ''}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

// --------------------------------------------------------------------------
// Skor kepatuhan per baris agregat (persentase parameter APPLICABLE yang
// terpenuhi >= 1). Parameter bernilai null (N/A) dikeluarkan dari perhitungan.
// --------------------------------------------------------------------------
export function rowComplianceScore(row) {
  const applicable = PARAMETER_KEYS.filter((k) => row[k] !== null && row[k] !== undefined)
  if (applicable.length === 0) return 0
  const fulfilled = applicable.filter((k) => Number(row[k]) >= 1).length
  return Math.round((fulfilled / applicable.length) * 100)
}

// --------------------------------------------------------------------------
// Ringkasan untuk Quick Stat Cards (Home) — dihitung dari rows agregat
// --------------------------------------------------------------------------
export function computeSummary(rows) {
  const totalUko = rows.length
  const totalVideo = rows.reduce(
    (sum, r) => sum + PARAMETER_KEYS.reduce((s, k) => s + (Number(r[k]) > 0 ? Number(r[k]) : 0), 0),
    0,
  )
  const kcActive = new Set(rows.map((r) => r.kcInduk)).size
  const evaluated = rows.filter((r) => PARAMETER_KEYS.some((k) => r[k] !== null))
  const avgScore = evaluated.length
    ? Math.round(evaluated.reduce((sum, r) => sum + rowComplianceScore(r), 0) / evaluated.length)
    : 0
  const lulus = evaluated.filter((r) => rowComplianceScore(r) >= 85).length
  const passRate = evaluated.length ? Math.round((lulus / evaluated.length) * 100) : 0

  return { totalEvaluasi: totalVideo, totalUko, kcActive, avgScore, passRate }
}

// --------------------------------------------------------------------------
// Agregasi kinerja per KC Induk (untuk Bar Chart)
// --------------------------------------------------------------------------
export function aggregateByKcInduk(rows) {
  const groups = {}
  rows.forEach((row) => {
    if (!groups[row.kcInduk]) groups[row.kcInduk] = []
    groups[row.kcInduk].push(row)
  })
  return Object.entries(groups).map(([kcInduk, groupRows]) => ({
    kcInduk,
    skorRataRata: Math.round(
      groupRows.reduce((sum, r) => sum + rowComplianceScore(r), 0) / groupRows.length,
    ),
    totalUnit: groupRows.length,
  }))
}

// --------------------------------------------------------------------------
// Tren berkala (Line Chart) — dikelompokkan per minggu, berbasis Live
// Response mentah (field timestamp submission), bukan rows agregat.
// --------------------------------------------------------------------------
export function aggregateTrend(liveRows) {
  const buckets = {}
  liveRows.forEach((row) => {
    const d = row.timestampDate
    if (!d) return
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toISOString().slice(0, 10)
    if (!buckets[key]) buckets[key] = 0
    buckets[key] += 1
  })
  return Object.entries(buckets)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([week, count]) => ({
      minggu: new Date(week).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      jumlahVideo: count,
    }))
}

// --------------------------------------------------------------------------
// Distribusi pemenuhan peran (Pie/Donut Chart) — hanya hitung yang applicable
// --------------------------------------------------------------------------
export function aggregateRoleDistribution(rows) {
  const labels = {
    cs: 'CS',
    satpamCS: 'Satpam Jbt. CS',
    satpamTeller: 'Satpam Jbt. Teller',
    satpamOnly: 'Satpam Only',
    teller: 'Teller',
    ub: 'UB',
    videoPremises: 'Video Premises',
  }
  return PARAMETER_KEYS.map((key) => ({
    name: labels[key],
    value: rows.reduce((sum, r) => sum + (Number(r[key]) > 0 ? Number(r[key]) : 0), 0),
  }))
}

// --------------------------------------------------------------------------
// Radar per KC Induk (rata-rata tiap parameter, hanya yang applicable)
// --------------------------------------------------------------------------
export function aggregateRadarByKc(rows, kcInduk) {
  const scoped = kcInduk && kcInduk !== 'Semua' ? rows.filter((r) => r.kcInduk === kcInduk) : rows
  const labels = {
    cs: 'CS',
    satpamCS: 'Satpam-CS',
    satpamTeller: 'Satpam-Teller',
    satpamOnly: 'Satpam Only',
    teller: 'Teller',
    ub: 'UB',
    videoPremises: 'Video Premises',
  }
  return PARAMETER_KEYS.map((key) => {
    const applicable = scoped.filter((r) => r[key] !== null && r[key] !== undefined)
    const fulfilled = applicable.filter((r) => Number(r[key]) >= 1).length
    return {
      parameter: labels[key],
      skor: applicable.length ? Math.round((fulfilled / applicable.length) * 100) : 0,
    }
  })
}

// --------------------------------------------------------------------------
// Label periode untuk banner "ROLEPLAY, [periode]" pada matriks laporan
// --------------------------------------------------------------------------
export function formatPeriodLabel(dateFrom, dateTo) {
  const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  if (dateFrom && dateTo && dateFrom !== dateTo) {
    const from = new Date(dateFrom).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })
    const to = new Date(dateTo).toLocaleDateString('id-ID', opts)
    return `${from} - ${to}`
  }
  if (dateFrom || dateTo) {
    return new Date(dateFrom || dateTo).toLocaleDateString('id-ID', opts)
  }
  return 'Semua Periode'
}

// --------------------------------------------------------------------------
// Nama file laporan mengikuti PERIODE DATA (tanggal yang dipilih / tanggal
// pelaksanaan roleplay), BUKAN tanggal saat file diunduh.
//  - Jika user memilih rentang tanggal di filter -> pakai tanggal itu.
//  - Jika tidak -> pakai tanggal pelaksanaan (field "Tanggal Pelaksanaan")
//    yang paling sering muncul di data yang sedang ditampilkan.
//  - Jika keduanya tidak tersedia -> "Semua_Periode".
// --------------------------------------------------------------------------
export function resolveReportFilenameDate({ dateFrom, dateTo }, scopedLiveRows = []) {
  if (dateFrom && dateTo && dateFrom !== dateTo) {
    return `${slugifyIndoDate(new Date(dateFrom))}_sd_${slugifyIndoDate(new Date(dateTo))}`
  }
  if (dateFrom || dateTo) {
    return slugifyIndoDate(new Date(dateFrom || dateTo))
  }

  const counts = new Map()
  scopedLiveRows.forEach((row) => {
    const d = row.tanggalPelaksanaanDate || row.timestampDate
    if (!d) return
    const key = d.toDateString()
    counts.set(key, (counts.get(key) || 0) + 1)
  })
  if (counts.size === 0) return 'Semua_Periode'
  const [modeKey] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  return slugifyIndoDate(new Date(modeKey))
}

// --------------------------------------------------------------------------
// Unit dengan performa terendah (butuh peningkatan) — hanya UKO yang sudah
// punya minimal 1 data (exclude yang murni N/A / belum pernah submit).
// --------------------------------------------------------------------------
export function lowestPerformingUnits(rows, limit = 5) {
  return [...rows]
    .filter((r) => PARAMETER_KEYS.some((k) => r[k] !== null))
    .map((r) => ({ ...r, score: rowComplianceScore(r) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
}

export function bestPerformingUnits(rows, limit = 5) {
  return [...rows]
    .filter((r) => PARAMETER_KEYS.some((k) => r[k] !== null))
    .map((r) => ({ ...r, score: rowComplianceScore(r) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
