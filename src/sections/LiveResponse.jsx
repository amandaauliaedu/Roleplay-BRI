import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Table2, AlertTriangle, Info } from 'lucide-react'
import FilterBar from '../components/FilterBar'
import DataTable from '../components/DataTable'
import { SyncStatus } from '../components/LoadingState'
import { filterRows } from '../utils/dataProcessor'

export default function LiveResponse({ rows, status, lastSync, error, onRefresh }) {
  const [filters, setFilters] = useState({})

  const kcOptions = useMemo(() => [...new Set(rows.map((r) => r.kcInduk))].sort(), [rows])
  const jenisUkoOptions = useMemo(() => [...new Set(rows.map((r) => r.jenisUko))].filter(Boolean).sort(), [rows])
  const kcScoped = useMemo(
    () => (filters.kcInduk && filters.kcInduk !== 'Semua' ? rows.filter((r) => r.kcInduk === filters.kcInduk) : rows),
    [rows, filters.kcInduk],
  )
  const ukoOptions = useMemo(() => [...new Set(kcScoped.map((r) => r.namaUko))].sort(), [kcScoped])

  const filtered = useMemo(() => filterRows(rows, filters), [rows, filters])

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
