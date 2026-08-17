import {
  COLUMN_MAP,
  PARAMETER_KEYS,
  JABATAN_PARAM_MAP,
  VIDEO_PREMISES_MATCH,
  KC_ONLY_PARAMS,
} from '../data/config'
import { MASTER_DATA, MASTER_BY_KODE_UKO } from '../data/masterData'

const MONTHS_ID = {
  januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
  juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11,
}

// Parse tanggal berformat "Rabu, 24 Juni 2026" -> Date. Fallback: coba Date bawaan.
export function parseIndoDate(text) {
  if (!text) return null
  const cleaned = String(text).replace(/^[A-Za-z]+,\s*/, '').trim() // buang nama hari
  const m = cleaned.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/)
  if (m) {
    const day = parseInt(m[1], 10)
    const month = MONTHS_ID[m[2].toLowerCase()]
    const year = parseInt(m[3], 10)
    if (month !== undefined) return new Date(year, month, day)
  }
  const fallback = new Date(text)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

function normalizeText(v) {
  return String(v || '').toLowerCase().trim()
}

export function classifyJabatan(jabatan) {
  const text = normalizeText(jabatan)
  for (const rule of JABATAN_PARAM_MAP) {
    if (rule.match.some((m) => text.includes(m.trim()))) return rule.param
  }
  return null
}

export function isVideoPremises(pilihanVideo) {
  const text = normalizeText(pilihanVideo)
  return VIDEO_PREMISES_MATCH.some((m) => text.includes(m))
}

// --------------------------------------------------------------------------
// Parsing hasil CSV (Papaparse) mentah dari Google Sheets -> shape internal
// Setiap baris = SATU submisi roleplay mentah (bukan matriks agregat).
// --------------------------------------------------------------------------
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
    .filter((row) => row[resolvedMap.kodeUko])
    .map((row, idx) => {
      const kodeUko = String(row[resolvedMap.kodeUko] || '').trim().padStart(4, '0')
      const master = MASTER_BY_KODE_UKO[kodeUko]
      return {
        id: `SUB-${idx}-${kodeUko}`,
        timestamp: row[resolvedMap.timestamp] || '',
        jenisUko: row[resolvedMap.jenisUko] || master?.jenisUko || '-',
        tanggalPelaksanaan: row[resolvedMap.tanggalPelaksanaan] || '',
        kodeUko,
        namaUko: row[resolvedMap.namaUko] || master?.namaUker || '-',
        kcInduk: master?.namaCabang || 'Tidak Diketahui',
        jabatan: row[resolvedMap.jabatan] || '',
        pilihanVideo: row[resolvedMap.pilihanVideo] || '',
        pnFl: row[resolvedMap.pnFl] || '',
        namaFl: row[resolvedMap.namaFl] || '',
        uploadVideo: row[resolvedMap.uploadVideo] || '',
        keteranganPremises: row[resolvedMap.keteranganPremises] || '',
      }
    })
}

// --------------------------------------------------------------------------
// Filtering baris mentah (Live Response)
// --------------------------------------------------------------------------
export function filterRawRows(rows, { kcInduk, jenisUko, kodeUko, dateFrom, dateTo, search } = {}) {
  return rows.filter((row) => {
    if (kcInduk && kcInduk !== 'Semua' && row.kcInduk !== kcInduk) return false
    if (jenisUko && jenisUko !== 'Semua' && row.jenisUko !== jenisUko) return false
    if (kodeUko && kodeUko !== 'Semua' && row.kodeUko !== kodeUko) return false
    if (dateFrom || dateTo) {
      const d = parseIndoDate(row.tanggalPelaksanaan)
      if (!d) return false
      if (dateFrom && d < new Date(dateFrom)) return false
      if (dateTo && d > new Date(new Date(dateTo).setHours(23, 59, 59))) return false
    }
    if (search) {
      const q = search.toLowerCase()
      const haystack = `${row.kcInduk} ${row.namaUko} ${row.kodeUko} ${row.jabatan} ${row.namaFl}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

// --------------------------------------------------------------------------
// AGREGASI: submisi mentah -> matriks REPORT FINAL ROLEPLAY (satu baris/unit)
// units: daftar unit master data yang ingin ditampilkan (default: semua)
// --------------------------------------------------------------------------
export function buildReportMatrix(rawRows, { units = MASTER_DATA } = {}) {
  // Kelompokkan submisi mentah per Kode UKO untuk lookup cepat
  const byUnit = {}
  rawRows.forEach((row) => {
    if (!byUnit[row.kodeUko]) byUnit[row.kodeUko] = []
    byUnit[row.kodeUko].push(row)
  })

  return units.map((unit) => {
    const submissions = byUnit[unit.kodeUko] || []
    const values = {}

    PARAMETER_KEYS.filter((k) => k !== 'videoPremises').forEach((param) => {
      const isKcOnly = KC_ONLY_PARAMS.includes(param)
      if (isKcOnly && unit.jenisUko !== 'KC') {
        values[param] = null
        return
      }
      const count = submissions.filter((s) => classifyJabatan(s.jabatan) === param).length
      values[param] = count
    })

    const videoCount = submissions.filter((s) => isVideoPremises(s.pilihanVideo)).length
    values.videoPremises = videoCount > 0 ? videoCount : unit.jenisUko === 'KC' ? 0 : null

    return {
      id: `MTX-${unit.kodeUko}`,
      branchCode: unit.kodeUko,
      namaUko: unit.namaUker,
      kcInduk: unit.namaCabang,
      jenisUko: unit.jenisUko,
      kodeBranch: unit.kodeBranch,
      ...values,
    }
  })
}

// Kelompokkan baris matriks per KC Induk (mempertahankan urutan master data:
// KC induk lebih dulu, lalu KCP/KK/UNIT) -- dipakai untuk preview & export
// supaya tabel tersusun per-cabang seperti dokumen resmi.
export function groupMatrixByKcInduk(matrixRows) {
  const groups = new Map()
  matrixRows.forEach((row) => {
    if (!groups.has(row.kcInduk)) groups.set(row.kcInduk, [])
    groups.get(row.kcInduk).push(row)
  })
  return [...groups.entries()].map(([kcInduk, rows]) => ({ kcInduk, rows }))
}

// --------------------------------------------------------------------------
// Skor kepatuhan per baris matriks (persentase parameter APPLICABLE yang
// terpenuhi >=1). Parameter bernilai null (N/A) dikeluarkan dari perhitungan.
// --------------------------------------------------------------------------
export function rowComplianceScore(row) {
  const applicable = PARAMETER_KEYS.filter((k) => row[k] !== null && row[k] !== undefined)
  if (applicable.length === 0) return 0
  const fulfilled = applicable.filter((k) => Number(row[k]) >= 1).length
  return Math.round((fulfilled / applicable.length) * 100)
}

// --------------------------------------------------------------------------
// Ringkasan untuk Quick Stat Cards (Home) -- rows = baris matriks
// --------------------------------------------------------------------------
export function computeSummary(rows) {
  const totalEvaluasi = rows.length
  const kcActive = new Set(rows.map((r) => r.kcInduk)).size
  const avgScore = totalEvaluasi
    ? Math.round(rows.reduce((sum, r) => sum + rowComplianceScore(r), 0) / totalEvaluasi)
    : 0
  const lulus = rows.filter((r) => rowComplianceScore(r) >= 85).length
  const passRate = totalEvaluasi ? Math.round((lulus / totalEvaluasi) * 100) : 0

  return { totalEvaluasi, kcActive, avgScore, passRate }
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
    skorRataRata: Math.round(groupRows.reduce((sum, r) => sum + rowComplianceScore(r), 0) / groupRows.length),
    totalUnit: groupRows.length,
  }))
}

// --------------------------------------------------------------------------
// Tren berkala (Line Chart) — dikelompokkan per minggu berdasarkan submisi mentah
// --------------------------------------------------------------------------
export function aggregateTrend(rawRows) {
  const buckets = {}
  rawRows.forEach((row) => {
    const d = parseIndoDate(row.tanggalPelaksanaan) || new Date(row.timestamp)
    if (!d || Number.isNaN(d.getTime())) return
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
      jumlahSubmisi: count,
    }))
}

// --------------------------------------------------------------------------
// Distribusi pemenuhan peran (Pie/Donut Chart) — rows = baris matriks
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
    value: rows.filter((r) => r[key] !== null && Number(r[key]) >= 1).length,
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
// Unit dengan performa terendah (butuh peningkatan) -- rows = baris matriks
// --------------------------------------------------------------------------
export function lowestPerformingUnits(rows, limit = 5) {
  return [...rows]
    .map((r) => ({ ...r, score: rowComplianceScore(r) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
}
