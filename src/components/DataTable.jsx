import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpDown, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { LIVE_RESPONSE_COLUMNS } from '../data/config'

function formatCell(key, value, row) {
  if (key === 'timestamp') {
    const d = row.timestampDate
    if (d) {
      return (
        <span className="font-mono text-xs text-ink-muted">
          {d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </span>
      )
    }
    return <span className="text-ink-faint">{value || '-'}</span>
  }
  if (!value) return <span className="text-ink-faint">-</span>
  if (key === 'uploadVideo') {
    return (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
      >
        Lihat video <ExternalLink size={11} />
      </a>
    )
  }
  if (key === 'kodeUko') return <span className="font-mono text-xs text-brand">{value}</span>
  return <span>{value}</span>
}

// Tabel Live Response — kolom PERSIS sama seperti header Google Sheet
// (Timestamp, Jenis UKO, Tanggal Pelaksanaan, Kode UKO, Nama UKO, Jabatan,
// Pilihan Video, PN FL Yang Roleplay, Nama FL Yang Roleplay, Upload Video,
// Keterangan Premises), plus KC Induk hasil pencocokan master data.
export default function DataTable({ rows, pageSize = 10 }) {
  // Default sort: Timestamp terbaru dulu (data sudah diurutkan begitu dari
  // dataProcessor, tapi kita set eksplisit di sini juga supaya tetap
  // konsisten walau kolom lain diklik lalu kembali ke Timestamp).
  const [sorting, setSorting] = useState([{ id: 'timestamp', desc: true }])

  const columns = useMemo(
    () => [
      ...LIVE_RESPONSE_COLUMNS.map((col) => ({
        accessorKey: col.key,
        header: col.label,
        // Sorting Timestamp memakai Date hasil parse eksplisit (timestampDate),
        // bukan string mentah — supaya format DD/MM/YYYY khas Google Form
        // Indonesia tidak terurut asal-asalan secara leksikografis.
        sortingFn:
          col.key === 'timestamp'
            ? (a, b) => (a.original.timestampDate?.getTime() || 0) - (b.original.timestampDate?.getTime() || 0)
            : undefined,
        cell: (info) => formatCell(col.key, info.getValue(), info.row.original),
      })),
      {
        accessorKey: 'kcInduk',
        header: 'KC Induk',
        cell: (info) => <span className="rounded-md bg-surface-hover px-2 py-1 text-xs text-ink-muted">{info.getValue()}</span>,
      },
    ],
    [],
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-raised">
              {table.getHeaderGroups()[0].headers.map((header) => (
                <th key={header.id} className="whitespace-nowrap px-4 py-3">
                  <button
                    onClick={header.column.getToggleSortingHandler()}
                    className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-ink-faint hover:text-brand"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && <ArrowUpDown size={11} />}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {table.getRowModel().rows.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="border-b border-border/60 hover:bg-surface-hover"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-4 py-3 text-ink">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="py-14 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">
            Tidak ada data yang cocok dengan filter
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="font-mono text-[11px] text-ink-faint">
            Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()} · {rows.length} baris
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-lg border border-border p-1.5 text-ink-muted disabled:opacity-30 hover:border-brand/50 hover:text-brand"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-lg border border-border p-1.5 text-ink-muted disabled:opacity-30 hover:border-brand/50 hover:text-brand"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
