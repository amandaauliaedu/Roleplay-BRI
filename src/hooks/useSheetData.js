import { useEffect, useRef, useState } from 'react'
import Papa from 'papaparse'
import { SHEET_CONFIG } from '../data/config'
import { normalizeSheetRows } from '../utils/dataProcessor'
import { generateMockResponses } from '../utils/mockData'

// Live Response auto-connect: dashboard ini TIDAK menunggu konfigurasi
// manual (.env) — begitu dimuat, ia langsung mencoba menyambung ke Google
// Sheet Live Response memakai SHEET_CONFIG.csvUrl (export CSV otomatis dari
// sheetId + gid), dengan fallback ke endpoint gviz, lalu ke demo data jika
// keduanya gagal (mis. sheet belum di-share publik / offline). Setelah
// tersambung, data disinkron ulang otomatis setiap `pollIntervalMs`.
async function fetchCsv(url) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const csvText = await res.text()
  // Google kadang membalas halaman login HTML jika sheet belum publik
  if (csvText.trim().startsWith('<')) throw new Error('Sheet belum bisa diakses publik (butuh share "Anyone with the link")')
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true })
  return parsed.data
}

export function useSheetData() {
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | live | mock | error
  const [lastSync, setLastSync] = useState(null)
  const [error, setError] = useState(null)
  const pollRef = useRef(null)

  async function fetchLive() {
    setStatus((prev) => (prev === 'idle' ? 'loading' : prev))
    try {
      const raw = await fetchCsv(SHEET_CONFIG.csvUrl)
      setRows(normalizeSheetRows(raw))
      setStatus('live')
      setLastSync(new Date())
      setError(null)
      return
    } catch (err) {
      console.warn('Gagal via export CSV, mencoba endpoint gviz...', err.message)
    }

    try {
      const raw = await fetchCsv(SHEET_CONFIG.fallbackCsvUrl)
      setRows(normalizeSheetRows(raw))
      setStatus('live')
      setLastSync(new Date())
      setError(null)
      return
    } catch (err) {
      console.error('Gagal memuat data live, fallback ke demo data:', err.message)
      setError(err.message)
      setRows(normalizeSheetRows(generateMockResponses()))
      setStatus('mock')
      setLastSync(new Date())
    }
  }

  useEffect(() => {
    fetchLive()
    pollRef.current = setInterval(fetchLive, SHEET_CONFIG.pollIntervalMs)
    return () => clearInterval(pollRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function refresh() {
    fetchLive()
  }

  return { rows, status, lastSync, error, refresh }
}
