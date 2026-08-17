import { useEffect, useRef, useState } from 'react'
import Papa from 'papaparse'
import { SHEET_CONFIG } from '../data/config'
import { normalizeSheetRows } from '../utils/dataProcessor'
import { generateMockResponses } from '../utils/mockData'

export function useSheetData() {
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | live | mock | error
  const [lastSync, setLastSync] = useState(null)
  const [error, setError] = useState(null)
  const pollRef = useRef(null)

  async function fetchLive() {
    try {
      setStatus((prev) => (prev === 'idle' ? 'loading' : prev))
      const res = await fetch(SHEET_CONFIG.csvUrl, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const csvText = await res.text()
      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true })
      if (!parsed.data.length) throw new Error('Sheet kosong / format tidak dikenali')
      const normalized = normalizeSheetRows(parsed.data)
      setRows(normalized)
      setStatus('live')
      setLastSync(new Date())
      setError(null)
    } catch (err) {
      console.error('Gagal memuat data live dari Google Sheets, fallback ke mock data:', err)
      setError(err.message)
      setRows((prev) => (prev.length ? prev : generateMockResponses()))
      setStatus((prev) => (prev === 'live' ? 'live' : 'mock'))
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
