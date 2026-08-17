import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FileDown, FileSpreadsheet, FileText, Filter } from 'lucide-react'
import FilterBar from '../components/FilterBar'
import ReportMatrix from '../components/ReportMatrix'
import { filterRawRows, buildReportMatrix, groupMatrixByKcInduk, formatPeriodLabel } from '../utils/dataProcessor'
import { exportToExcel } from '../utils/exportExcel'
import { exportToPDF } from '../utils/exportPDF'
import { MASTER_DATA, KC_INDUK_LIST } from '../data/masterData'

export default function DownloadReport({ rows }) {
  const [filters, setFilters] = useState({})
  const [exporting, setExporting] = useState(null)

  // Filter submisi mentah berdasarkan periode & (opsional) kc induk/jenis uko/kode uko
  const dateFiltered = useMemo(
    () => filterRawRows(rows, { dateFrom: filters.dateFrom, dateTo: filters.dateTo, search: filters.search }),
    [rows, filters.dateFrom, filters.dateTo, filters.search],
  )

  // Unit master data yang jadi cakupan laporan (semua, atau disaring per KC Induk/Jenis/Kode)
  const scopedUnits = useMemo(() => {
    return MASTER_DATA.filter((u) => {
      if (filters.kcInduk && filters.kcInduk !== 'Semua' && u.namaCabang !== filters.kcInduk) return false
      if (filters.jenisUko && filters.jenisUko !== 'Semua' && u.jenisUko !== filters.jenisUko) return false
      if (filters.kodeUko && filters.kodeUko !== 'Semua' && u.kodeUko !== filters.kodeUko) return false
      return true
    })
  }, [filters.kcInduk, filters.jenisUko, filters.kodeUko])

  const matrixRows = useMemo(() => buildReportMatrix(dateFiltered, { units: scopedUnits }), [dateFiltered, scopedUnits])
  const groups = useMemo(() => groupMatrixByKcInduk(matrixRows), [matrixRows])

  const periodLabel = useMemo(() => formatPeriodLabel(filters.dateFrom, filters.dateTo), [filters.dateFrom, filters.dateTo])

  const jenisUkoOptions = ['KC', 'KCP', 'KK', 'UNIT']
  const kodeUkoOptions = useMemo(() => scopedUnits.map((u) => u.kodeUko).sort(), [scopedUnits])

  const handleExport = async (type) => {
    setExporting(type)
    await new Promise((r) => setTimeout(r, 400))
    if (type === 'xlsx') await exportToExcel(groups, periodLabel)
    if (type === 'pdf') exportToPDF(groups, periodLabel)
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
          Saring data berdasarkan periode dan hierarki unit, tinjau matriks laporan tersusun per
          KC Induk persis format resmi, lalu unduh ke Excel atau PDF.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="my-6 flex flex-col gap-3"
      >
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-ink-faint">
          <Filter size={12} /> Filter Hierarki (KC Induk &rarr; Jenis UKO &rarr; Kode UKO) &amp; Periode
        </div>
        <FilterBar
          filters={filters}
          onChange={setFilters}
          kcOptions={KC_INDUK_LIST}
          jenisUkoOptions={jenisUkoOptions}
          kodeUkoOptions={kodeUkoOptions}
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
          <span className="font-semibold text-ink">{matrixRows.length}</span> unit dari{' '}
          <span className="font-semibold text-ink">{groups.length}</span> KC Induk siap diekspor
          sesuai filter saat ini.
        </p>
        <div className="flex gap-2">
          <ExportButton
            icon={FileSpreadsheet}
            label="Excel (.xlsx)"
            loading={exporting === 'xlsx'}
            onClick={() => handleExport('xlsx')}
            disabled={matrixRows.length === 0}
          />
          <ExportButton
            icon={FileText}
            label="PDF"
            loading={exporting === 'pdf'}
            onClick={() => handleExport('pdf')}
            disabled={matrixRows.length === 0}
          />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <p className="eyebrow mb-2">Preview Laporan (per KC Induk)</p>
        <ReportMatrix groups={groups} periodLabel={periodLabel} />
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
