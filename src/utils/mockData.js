// Generator data dummy (submisi mentah, meniru struktur asli Google Form)
// dipakai sebagai fallback ketika live sheet tidak bisa diakses.
import { MASTER_DATA } from '../data/masterData'

function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260807)

const JABATAN_LABELS = ['CS', 'Satpam jabatan CS', 'Satpam jabatan Teller', 'Satpam Only', 'Teller', 'Universal Banker']
const FIRST_NAMES = ['Ahmad', 'Siti', 'Budi', 'Rizky', 'Dewi', 'Hilda', 'Umar', 'Farah', 'Laksamana', 'Eva', 'Kurniawan', 'Ridho', 'Nabila', 'Discus', 'Akbar', 'Astrid']
const LAST_NAMES = ['Pratama', 'Wijaya', 'Santoso', 'Fadillah', 'Anggraini', 'Zulfani', 'Faruq', 'Lilyana', 'Ananda', 'Damayanti', 'Rendra', 'Octavia']

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

function pick(arr) {
  return arr[Math.floor(rand() * arr.length)]
}

function randomRecentDate(withinDays = 21) {
  const now = new Date()
  const d = new Date(now.getTime() - rand() * withinDays * 24 * 60 * 60 * 1000)
  return d
}

function formatIndoDate(d) {
  return `${DAYS_ID[d.getDay()]}, ${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
}

function randomName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
}

function randomPn() {
  return String(Math.floor(300000 + rand() * 99999))
}

let idCounter = 0

function pushSubmission(rows, unit, jabatan, date) {
  idCounter += 1
  rows.push({
    id: `MOCK-${idCounter}`,
    timestamp: date.toISOString(),
    jenisUko: unit.jenisUko,
    tanggalPelaksanaan: formatIndoDate(date),
    kodeUko: unit.kodeUko,
    namaUko: unit.namaUker,
    kcInduk: unit.namaCabang,
    jabatan,
    pilihanVideo: 'Video Roleplay',
    pnFl: randomPn(),
    namaFl: randomName(),
    uploadVideo: 'https://drive.google.com/mock-link',
    keteranganPremises: '-',
  })
}

function pushVideoPremises(rows, unit, date) {
  idCounter += 1
  rows.push({
    id: `MOCK-${idCounter}`,
    timestamp: date.toISOString(),
    jenisUko: unit.jenisUko,
    tanggalPelaksanaan: formatIndoDate(date),
    kodeUko: unit.kodeUko,
    namaUko: unit.namaUker,
    kcInduk: unit.namaCabang,
    jabatan: '-',
    pilihanVideo: 'Video Premises',
    pnFl: '',
    namaFl: '',
    uploadVideo: 'https://drive.google.com/mock-link-premises',
    keteranganPremises: pick(['baik', 'ok', 'sesuai', 'fix', '-']),
  })
}

export function generateMockResponses() {
  const rows = []

  MASTER_DATA.forEach((unit) => {
    JABATAN_LABELS.forEach((jabatan) => {
      // KC selalu lengkap; jenis lain punya peluang gagal/kosong supaya
      // matriks hasil agregasi bervariasi (hijau/merah) seperti data asli
      const skipChance = unit.jenisUko === 'KC' ? 0.02 : 0.08
      const retakeChance = 0.12
      const r = rand()
      if (r < skipChance) return // tidak submit -> 0
      const date = randomRecentDate()
      pushSubmission(rows, unit, jabatan, date)
      if (rand() < retakeChance) {
        pushSubmission(rows, unit, jabatan, randomRecentDate())
      }
    })

    // Video Premises: sebagian besar unit submit, sebagian tidak (-> N/A)
    if (rand() > 0.25) {
      pushVideoPremises(rows, unit, randomRecentDate())
    }
  })

  return rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}
