// Fallback demo data — HANYA dipakai jika koneksi ke Google Sheets Live
// Response gagal (mis. sheet belum di-share "Anyone with the link", atau
// browser sedang offline). Strukturnya PERSIS meniru kolom asli Google Form
// supaya seluruh dashboard tetap bisa didemokan tanpa koneksi live.
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

const JABATAN_POOL = ['Universal banker', 'Satpam jabatan CS', 'Satpam jabatan Teller', 'Satpam Only', 'Teller']
const NAMES = ['Silfia Zulfani', 'Ananda Amaliya', 'Astrid Octavia', 'Ragilia Larasati', 'Hilda R', 'Rizky Nur Fadillah', 'Kurniawan Noor Ananda', 'Eva Lilyana', 'Hestin N', 'Farilia Hilya Agatha']

function randomRecentDate() {
  const now = new Date()
  const past = new Date(now.getTime() - rand() * 20 * 24 * 60 * 60 * 1000)
  return past.toISOString()
}

export function generateMockResponses() {
  const rows = []
  let idx = 0
  MASTER_DATA.forEach((uko) => {
    // sebagian besar UKO sudah submit, sebagian kecil belum (agar Video
    // Premises & beberapa parameter tampil N/A seperti dokumen asli)
    if (rand() < 0.08) return

    const submissionCount = 4 + Math.floor(rand() * 3)
    for (let i = 0; i < submissionCount; i += 1) {
      idx += 1
      const isPremises = rand() < 0.12
      rows.push({
        Timestamp: randomRecentDate(),
        'Jenis UKO': uko.jenisUko,
        'Tanggal Pelaksanaan': 'Rabu, 24 Juni 2026',
        'Kode UKO': uko.kodeUko,
        'Nama UKO': uko.namaUker,
        Jabatan: isPremises ? 'Universal banker' : JABATAN_POOL[Math.floor(rand() * JABATAN_POOL.length)],
        'Pilihan Video': isPremises ? 'Video Premises' : 'Video Roleplay',
        'PN FL Yang Roleplay': String(300000 + Math.floor(rand() * 90000)),
        'Nama FL Yang Roleplay': NAMES[Math.floor(rand() * NAMES.length)],
        'Upload Video': 'https://drive.google.com/mock-link',
        'Keterangan Premises': isPremises ? 'baik' : '-',
        __mockId: `MOCK-${idx}`,
      })
    }
  })
  return rows
}
