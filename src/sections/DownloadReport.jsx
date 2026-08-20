import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FileDown, FileSpreadsheet, FileText, Filter, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import FilterBar from '../components/FilterBar'
import ReportMatrix from '../components/ReportMatrix'
import {
  filterRows,
  formatPeriodLabel,
  buildReportRows,
  sortReportRowsByMasterOrder,
  resolveReportFilenameDate,
  distinctUnmatchedJabatan,
  groupReportRowsByKc,
} from '../utils/dataProcessor'
import { exportToExcel } from '../utils/exportExcel'
import { exportToPDF } from '../utils/exportPDF'

export default function DownloadReport({ liveRows }) {
  const [filters, setFilters] = useState({})
  const [exporting, setExporting] = useState(null)

  // 1) Rentang tanggal membatasi SUBMISSION mentah yang dihitung ke dalam
  //    matriks (mempengaruhi angka), sebelum diagregasi per UKO.
  // Rentang tanggal mengacu ke "Tanggal Pelaksanaan" (BUKAN Timestamp submit)
  // — persis seperti rumus COUNTIFS resmi yang mencocokkan kolom C (Tanggal
  // Pelaksanaan) sheet Form Responses, bukan kolom Timestamp.
  const dateScopedLive = useMemo(
    () => filterRows(liveRows, { dateFrom: filters.dateFrom, dateTo: filters.dateTo, timestampKey: 'tanggalPelaksanaanDate' }),
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
  const unmatchedJabatan = useMemo(() => distinctUnmatchedJabatan(dateScopedLive), [dateScopedLive])

  // --- Preview web dipisah per KC Induk (sama seperti pagination di PDF) ---
  const kcGroups = useMemo(() => groupReportRowsByKc(filtered), [filtered])
  const [activeKc, setActiveKc] = useState(0)
  useEffect(() => {
    setActiveKc(0)
  }, [kcGroups.length, filters.kcInduk, filters.dateFrom, filters.dateTo, filters.namaUko, filters.branchCode, filters.jenisUko])
  const currentGroup = kcGroups[activeKc] || null

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
          dateFieldLabel="Tanggal Pelaksanaan"
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

      {unmatchedJabatan.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 flex items-start gap-2 rounded-xl border border-fail/30 bg-fail/5 p-3 text-xs text-fail"
        >
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <span>
            Ditemukan <strong>{unmatchedJabatan.length} nilai Jabatan</strong> pada data yang belum
            dikenali sistem (submission ini tidak dihitung ke parameter manapun, jadi bisa terlihat
            sebagai 0 padahal ada datanya):{' '}
            <strong className="text-ink">
              {unmatchedJabatan.slice(0, 8).map((u) => `"${u.jabatan}" (${u.count}×)`).join(', ')}
              {unmatchedJabatan.length > 8 ? ', ...' : ''}
            </strong>
            . Cek ejaan nilai ini terhadap opsi resmi (Customer Service, Satpam Jabatan CS, Satpam
            Jabatan Teller, Satpam Only, Teller, Universal Banker, Middle Manajer) lalu sesuaikan
            di <code className="rounded bg-surface-hover px-1 py-0.5">src/data/config.js</code> →{' '}
            <code className="rounded bg-surface-hover px-1 py-0.5">JABATAN_TO_METRIC</code>.
          </span>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="eyebrow">Preview Laporan · dipisah per KC Induk</p>
          {kcGroups.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveKc((i) => Math.max(0, i - 1))}
                disabled={activeKc === 0}
                className="rounded-lg border border-border p-1.5 text-ink-muted disabled:opacity-30 hover:border-brand/50 hover:text-brand"
                aria-label="KC Induk sebelumnya"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="min-w-[140px] text-center font-mono text-xs text-ink-muted">
                {activeKc + 1} / {kcGroups.length} KC Induk
              </span>
              <button
                onClick={() => setActiveKc((i) => Math.min(kcGroups.length - 1, i + 1))}
                disabled={activeKc === kcGroups.length - 1}
                className="rounded-lg border border-border p-1.5 text-ink-muted disabled:opacity-30 hover:border-brand/50 hover:text-brand"
                aria-label="KC Induk berikutnya"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {kcGroups.length > 1 && (
          <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
            {kcGroups.map((g, i) => (
              <button
                key={g.kcInduk}
                onClick={() => setActiveKc(i)}
                className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  i === activeKc
                    ? 'border-brand bg-brand text-white'
                    : 'border-border bg-surface-raised text-ink-muted hover:border-brand/50 hover:text-brand'
                }`}
              >
                {g.kcInduk}
                <span className="ml-1.5 opacity-70">{g.rows.length}</span>
              </button>
            ))}
          </div>
        )}

        {currentGroup ? (
          <motion.div
            key={currentGroup.kcInduk}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ReportMatrix rows={currentGroup.rows} periodLabel={periodLabel} />
          </motion.div>
        ) : (
          <div className="panel p-10 text-center text-sm text-ink-muted">
            Tidak ada data yang cocok dengan filter saat ini.
          </div>
        )}
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
