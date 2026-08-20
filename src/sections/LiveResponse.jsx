import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Table2, AlertTriangle, Info, Search, X, CalendarSearch } from 'lucide-react'
import FilterBar from '../components/FilterBar'
import DataTable from '../components/DataTable'
import { SyncStatus } from '../components/LoadingState'
import { filterRows } from '../utils/dataProcessor'
import { formatIndoDate } from '../utils/dateUtils'

export default function LiveResponse({ rows, status, lastSync, error, onRefresh }) {
  const [filters, setFilters] = useState({})

  // --- Cari berdasarkan Tanggal Pelaksanaan (dengan tombol search) ---
  const [dateInput, setDateInput] = useState('')
  const [appliedDate, setAppliedDate] = useState(null)

  const runDateSearch = () => {
    if (dateInput) setAppliedDate(dateInput)
  }
  const clearDateSearch = () => {
    setDateInput('')
    setAppliedDate(null)
  }

  const kcOptions = useMemo(() => [...new Set(rows.map((r) => r.kcInduk))].sort(), [rows])
  const jenisUkoOptions = useMemo(() => [...new Set(rows.map((r) => r.jenisUko))].filter(Boolean).sort(), [rows])
  const kcScoped = useMemo(
    () => (filters.kcInduk && filters.kcInduk !== 'Semua' ? rows.filter((r) => r.kcInduk === filters.kcInduk) : rows),
    [rows, filters.kcInduk],
  )
  const ukoOptions = useMemo(() => [...new Set(kcScoped.map((r) => r.namaUko))].sort(), [kcScoped])

  const filteredBase = useMemo(() => filterRows(rows, filters), [rows, filters])

  // Cocokkan Tanggal Pelaksanaan (bukan Timestamp submit) — sesuai maksud
  // "tanggal yang diinputkan" pada form roleplay.
  const filtered = useMemo(() => {
    if (!appliedDate) return filteredBase
    const target = new Date(appliedDate).toDateString()
    return filteredBase.filter((r) => r.tanggalPelaksanaanDate && r.tanggalPelaksanaanDate.toDateString() === target)
  }, [filteredBase, appliedDate])

  const appliedDateLabel = appliedDate ? formatIndoDate(new Date(appliedDate)) : ''

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <p className="eyebrow flex items-center gap-2">
            <Table2 size={13} />
            Section 2
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Live Response Monitoring</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Data respons mentah tersambung otomatis (auto-sync) ke Google Form roleplay RO
            Surabaya, diperbarui setiap 30 detik &middot; diurutkan dari submission{' '}
            <strong className="text-ink">terbaru</strong>. Kolom mengikuti persis header pada
            spreadsheet Live Response.
          </p>
        </div>
        <SyncStatus status={status} lastSync={lastSync} onRefresh={onRefresh} />
      </motion.div>

      {status === 'mock' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 flex items-start gap-2 rounded-xl border border-warn/30 bg-warn/10 p-3 text-xs text-warn"
        >
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <span>
            Belum berhasil menyambung ke Google Sheet live ({error || 'alasan tidak diketahui'}). Menampilkan
            data demo sementara. Pastikan sheet dibagikan sebagai <strong>&ldquo;Anyone with the link — Viewer&rdquo;</strong>{' '}
            agar auto-connect berjalan.
          </span>
        </motion.div>
      )}

      {status === 'live' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 flex items-start gap-2 rounded-xl border border-brand/20 bg-brand/5 p-3 text-xs text-ink-muted"
        >
          <Info size={14} className="mt-0.5 flex-shrink-0 text-brand" />
          <span>
            <strong className="text-ink">{rows.length.toLocaleString('id-ID')} baris</strong> berhasil disinkron dari
            Google Sheet. Jika angka ini terasa jauh lebih sedikit dari jumlah respons yang Anda lihat
            langsung di Google Form/Sheet, kemungkinan besar ada <strong className="text-ink">Filter (Data → Create a filter)</strong> yang
            sedang aktif di tab &ldquo;Form_Responses&rdquo; — filter biasa (bukan Filter View) ikut
            membatasi apa yang diekspor lewat CSV. Buka sheet-nya, lalu <strong className="text-ink">Data → Remove filter</strong>{' '}
            (atau ganti ke Filter View) supaya auto-sync di sini mengambil seluruh baris.
          </span>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08 }}
        className="mb-4"
      >
        <div className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-ink-faint">
            <CalendarSearch size={14} />
            Cari per Tanggal Pelaksanaan
          </div>
          <div className="flex flex-1 items-center gap-2">
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runDateSearch()}
              className="rounded-lg border border-border bg-surface-raised py-2 px-3 text-sm text-ink focus:border-brand/50 focus:outline-none"
            />
            <button
              onClick={runDateSearch}
              disabled={!dateInput}
              aria-label="Cari berdasarkan tanggal"
              className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-void transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Search size={15} />
              Cari
            </button>
            {appliedDate && (
              <button
                onClick={clearDateSearch}
                aria-label="Hapus pencarian tanggal"
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-2 text-xs text-ink-muted hover:border-fail/50 hover:text-fail"
              >
                <X size={13} /> Reset
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {appliedDate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 p-3 text-sm text-ink-muted"
            >
              <Search size={14} className="text-brand" />
              Ditemukan <strong className="text-ink">{filtered.length.toLocaleString('id-ID')} respons</strong> pada
              tanggal pelaksanaan <strong className="text-ink">{appliedDateLabel}</strong>.
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-4"
      >
        <FilterBar
          filters={filters}
          onChange={setFilters}
          jenisUkoOptions={jenisUkoOptions}
          kcOptions={kcOptions}
          ukoOptions={ukoOptions}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <DataTable rows={filtered} pageSize={10} />
      </motion.div>
    </div>
  )
}
