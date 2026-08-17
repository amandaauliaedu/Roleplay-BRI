import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FileDown, FileSpreadsheet, FileText, Filter } from 'lucide-react'
import FilterBar from '../components/FilterBar'
import ReportMatrix from '../components/ReportMatrix'
import { filterRows, formatPeriodLabel, buildReportRows, sortReportRowsByMasterOrder, resolveReportFilenameDate } from '../utils/dataProcessor'
import { exportToExcel } from '../utils/exportExcel'
import { exportToPDF } from '../utils/exportPDF'

export default function DownloadReport({ liveRows }) {
  const [filters, setFilters] = useState({})
  const [exporting, setExporting] = useState(null)

  // 1) Rentang tanggal membatasi SUBMISSION mentah yang dihitung ke dalam
  //    matriks (mempengaruhi angka), sebelum diagregasi per UKO.
  const dateScopedLive = useMemo(
    () => filterRows(liveRows, { dateFrom: filters.dateFrom, dateTo: filters.dateTo }),
    [liveRows, filters.dateFrom, filters.dateTo],
  )
  const aggregated = useMemo(() => buildReportRows(dateScopedLive), [dateScopedLive])

  // 2) Filter hierarki (KC Induk / Jenis UKO / Nama UKO / Branch Code)
  //    membatasi BARIS UKO mana yang ditampilkan/diekspor, diterapkan
  //    setelah agregasi supaya baris yang di-exclude benar-benar hilang
  //    (bukan sekadar bernilai 0/N/A).
  const filtered = useMemo(
    () => sortReportRowsByMasterOrder(filterRows(aggregated, filters)),
    [aggregated, filters],
  )

  const jenisUkoOptions = useMemo(() => [...new Set(aggregated.map((r) => r.jenisUko))].filter(Boolean).sort(), [aggregated])
  const kcOptions = useMemo(() => [...new Set(aggregated.map((r) => r.kcInduk))].sort(), [aggregated])
  const kcScoped = useMemo(
    () => (filters.kcInduk && filters.kcInduk !== 'Semua' ? aggregated.filter((r) => r.kcInduk === filters.kcInduk) : aggregated),
    [aggregated, filters.kcInduk],
  )
  const ukoOptions = useMemo(() => [...new Set(kcScoped.map((r) => r.namaUko))].sort(), [kcScoped])
  const branchOptions = useMemo(() => [...new Set(kcScoped.map((r) => r.branchCode))].sort(), [kcScoped])

  const periodLabel = useMemo(() => formatPeriodLabel(filters.dateFrom, filters.dateTo), [filters.dateFrom, filters.dateTo])
  const filenameDate = useMemo(
    () => resolveReportFilenameDate(filters, dateScopedLive),
    [filters, dateScopedLive],
  )

  const handleExport = async (type) => {
    setExporting(type)
    await new Promise((r) => setTimeout(r, 400))
    if (type === 'xlsx') await exportToExcel(filtered, periodLabel, `REPORT_FINAL_ROLEPLAY_${filenameDate}`)
    if (type === 'pdf') exportToPDF(filtered, periodLabel, `REPORT_FINAL_ROLEPLAY_${filenameDate}`)
    setExporting(null)
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="eyebrow flex items-center gap-2">
          <FileDown size={13} />
          Section 3
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Download Report Final Roleplay</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Saring berdasarkan periode pelaksanaan & hierarki (KC Induk &rarr; UKO &rarr; Branch),
          tinjau matriks laporan persis format resmi — dikelompokkan &amp; diurutkan per KC Induk
          sesuai master data — lalu unduh ke Excel atau PDF.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="my-6 flex flex-col gap-3"
      >
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-ink-faint">
          <Filter size={12} /> Filter Periode &amp; Hierarki
        </div>
        <FilterBar
          filters={filters}
          onChange={setFilters}
          jenisUkoOptions={jenisUkoOptions}
          kcOptions={kcOptions}
          ukoOptions={ukoOptions}
          branchOptions={branchOptions}
          showSearch={false}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mb-4 flex flex-col items-start justify-between gap-3 rounded-2xl border border-brand/20 bg-brand/5 p-4 sm:flex-row sm:items-center"
      >
        <p className="text-sm text-ink-muted">
          <span className="font-semibold text-ink">{filtered.length}</span> UKO siap diekspor sesuai
          filter saat ini{filters.kcInduk && filters.kcInduk !== 'Semua' ? ` · ${filters.kcInduk}` : ''} · periode{' '}
          <span className="font-medium text-ink">{periodLabel}</span>.
        </p>
        <div className="flex gap-2">
          <ExportButton
            icon={FileSpreadsheet}
            label="Excel (.xlsx)"
            loading={exporting === 'xlsx'}
            onClick={() => handleExport('xlsx')}
            disabled={filtered.length === 0}
          />
          <ExportButton
            icon={FileText}
            label="PDF"
            loading={exporting === 'pdf'}
            onClick={() => handleExport('pdf')}
            disabled={filtered.length === 0}
          />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <p className="eyebrow mb-2">Preview Laporan · dikelompokkan per KC Induk</p>
        <ReportMatrix rows={filtered} periodLabel={periodLabel} />
      </motion.div>
    </div>
  )
}

function ExportButton({ icon: Icon, label, onClick, loading, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled || loading} className="btn-primary disabled:cursor-not-allowed disabled:opacity-40">
      {loading ? (
        <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
          <Icon size={16} />
        </motion.span>
      ) : (
        <Icon size={16} />
      )}
      {loading ? 'Menyiapkan...' : label}
    </button>
  )
}
