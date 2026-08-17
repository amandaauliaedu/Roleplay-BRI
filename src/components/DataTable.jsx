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

// Tabel Live Response -- menampilkan submisi MENTAH persis struktur kolom
// Google Form: Timestamp, Jenis UKO, Tanggal Pelaksanaan, Kode UKO, Nama UKO,
// Jabatan, Pilihan Video, PN FL, Nama FL, Upload Video, Keterangan Premises.
export default function DataTable({ rows, pageSize = 10 }) {
  const [sorting, setSorting] = useState([])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'timestamp',
        header: 'Timestamp',
        cell: (info) => {
          const v = info.getValue()
          const d = new Date(v)
          return (
            <span className="whitespace-nowrap font-mono text-xs text-ink-muted">
              {Number.isNaN(d.getTime())
                ? v
                : d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          )
        },
      },
      {
        accessorKey: 'jenisUko',
        header: 'Jenis UKO',
        cell: (info) => (
          <span className="rounded-md bg-surface-hover px-2 py-1 font-mono text-[11px] text-ink-muted">
            {info.getValue()}
          </span>
        ),
      },
      { accessorKey: 'tanggalPelaksanaan', header: 'Tanggal Pelaksanaan', cell: (info) => (
          <span className="whitespace-nowrap text-xs">{info.getValue()}</span>
        ) },
      { accessorKey: 'kodeUko', header: 'Kode UKO', cell: (info) => (
          <span className="font-mono text-xs text-brand">{info.getValue()}</span>
        ) },
      { accessorKey: 'namaUko', header: 'Nama UKO' },
      { accessorKey: 'kcInduk', header: 'KC Induk' },
      { accessorKey: 'jabatan', header: 'Jabatan' },
      { accessorKey: 'pilihanVideo', header: 'Pilihan Video' },
      { accessorKey: 'pnFl', header: 'PN FL Yang Roleplay' },
      { accessorKey: 'namaFl', header: 'Nama FL Yang Roleplay' },
      {
        accessorKey: 'uploadVideo',
        header: 'Upload Video',
        cell: (info) =>
          info.getValue() ? (
            <a
              href={info.getValue()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
            >
              Video <ExternalLink size={11} />
            </a>
          ) : (
            <span className="text-ink-faint">-</span>
          ),
      },
      { accessorKey: 'keteranganPremises', header: 'Keterangan Premises' },
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
        <table className="w-full min-w-[1400px] border-collapse text-left text-sm">
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
                  transition={{ duration: 0.25, delay: i * 0.02 }}
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
