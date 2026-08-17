import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Table2 } from 'lucide-react'
import FilterBar from '../components/FilterBar'
import DataTable from '../components/DataTable'
import { SyncStatus } from '../components/LoadingState'
import { filterRawRows } from '../utils/dataProcessor'
import { KC_INDUK_LIST } from '../data/masterData'

export default function LiveResponse({ rows, status, lastSync, onRefresh, error }) {
  const [filters, setFilters] = useState({})

  const jenisUkoOptions = useMemo(() => [...new Set(rows.map((r) => r.jenisUko))].sort(), [rows])
  const kodeUkoOptions = useMemo(() => [...new Set(rows.map((r) => r.kodeUko))].sort(), [rows])

  const filtered = useMemo(() => filterRawRows(rows, filters), [rows, filters])

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
            Data respons mentah tersinkron otomatis dari Google Form roleplay (via Google Sheets),
            diperbarui setiap {60} detik.
          </p>
        </div>
        <SyncStatus status={status} lastSync={lastSync} onRefresh={onRefresh} />
      </motion.div>

      {status === 'mock' && error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-xs text-warn"
        >
          Tidak bisa menyambung ke Google Sheets live ({error}). Menampilkan data simulasi
          sementara -- cek kembali koneksi internet atau izin akses sheet.
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-4"
      >
        <FilterBar
          filters={filters}
          onChange={setFilters}
          kcOptions={KC_INDUK_LIST}
          jenisUkoOptions={jenisUkoOptions}
          kodeUkoOptions={kodeUkoOptions}
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
