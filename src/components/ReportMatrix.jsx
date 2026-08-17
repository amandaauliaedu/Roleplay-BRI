import { motion } from 'framer-motion'
import ValueCell from './ValueCell'
import { IDENTITY_COLUMNS, ROLEPLAY_PARAM_COLUMNS, VIDEO_COLUMN, REPORT_PALETTE } from '../data/config'

// Replika visual dokumen "REPORT FINAL ROLEPLAY": header navy bertingkat,
// banner "ROLEPLAY, [periode]", kolom Video Premises teal, sel nilai
// hijau/merah/hitam. Data dikelompokkan per KC Induk (satu tabel per cabang,
// header diulang tiap kelompok) -- persis format dokumen resmi yang dilampirkan.
export default function ReportMatrix({ groups, periodLabel = 'Semua Periode' }) {
  const totalRows = groups.reduce((sum, g) => sum + g.rows.length, 0)

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card">
      <div className="p-6">
        <h2 className="mb-1 text-center font-display text-xl font-bold text-[#111827]">
          REPORT FINAL ROLEPLAY
        </h2>
        <p className="mb-5 text-center text-xs text-gray-500">
          ROLEPLAY, {periodLabel} &middot; {groups.length} KC Induk &middot; {totalRows} unit
        </p>

        {totalRows === 0 && (
          <div className="py-14 text-center">
            <p className="text-xs uppercase tracking-widest text-gray-400">
              Tidak ada data untuk filter yang dipilih
            </p>
          </div>
        )}

        <div className="space-y-8 overflow-x-auto">
          {groups.map((group) => (
            <KcIndukTable key={group.kcInduk} group={group} periodLabel={periodLabel} />
          ))}
        </div>
      </div>
    </div>
  )
}

function KcIndukTable({ group, periodLabel }) {
  return (
    <div>
      <h3 className="mb-2 font-display text-sm font-bold text-[#0B1F4D]">{group.kcInduk}</h3>
      <table className="w-full min-w-[980px] border-collapse text-sm">
        <thead>
          <tr>
            {IDENTITY_COLUMNS.map((col) => (
              <th
                key={col.key}
                rowSpan={2}
                className="border px-3 py-2 text-xs font-bold uppercase tracking-wide"
                style={{
                  backgroundColor: REPORT_PALETTE.headerNavy,
                  color: REPORT_PALETTE.headerNavyText,
                  borderColor: REPORT_PALETTE.gridLine,
                }}
              >
                {col.label}
              </th>
            ))}
            <th
              colSpan={ROLEPLAY_PARAM_COLUMNS.length}
              className="border px-3 py-2 text-xs font-bold"
              style={{
                backgroundColor: REPORT_PALETTE.bannerBlue,
                color: REPORT_PALETTE.bannerBlueText,
                borderColor: REPORT_PALETTE.gridLine,
              }}
            >
              ROLEPLAY, {periodLabel}
            </th>
            <th
              rowSpan={2}
              className="border px-3 py-2 text-xs font-bold uppercase leading-tight"
              style={{
                backgroundColor: REPORT_PALETTE.videoTeal,
                color: REPORT_PALETTE.videoTealText,
                borderColor: REPORT_PALETTE.gridLine,
              }}
            >
              {VIDEO_COLUMN.label}
            </th>
          </tr>
          <tr>
            {ROLEPLAY_PARAM_COLUMNS.map((col) => (
              <th
                key={col.key}
                className="border px-2 py-2 text-[11px] font-bold leading-tight"
                style={{
                  backgroundColor: REPORT_PALETTE.bannerBlue,
                  color: REPORT_PALETTE.bannerBlueText,
                  borderColor: REPORT_PALETTE.gridLine,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {group.rows.map((row, i) => {
            const band = i % 2 === 0 ? REPORT_PALETTE.rowBandGreen : REPORT_PALETTE.rowBandWhite
            return (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.015, 0.3) }}
              >
                {IDENTITY_COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className="border px-3 py-2 text-xs font-semibold text-[#111827]"
                    style={{ backgroundColor: band, borderColor: REPORT_PALETTE.gridLine }}
                  >
                    {row[col.key]}
                  </td>
                ))}
                {ROLEPLAY_PARAM_COLUMNS.map((col) => (
                  <td key={col.key} className="border p-0.5" style={{ borderColor: REPORT_PALETTE.gridLine }}>
                    <ValueCell value={row[col.key]} />
                  </td>
                ))}
                <td className="border p-0.5" style={{ borderColor: REPORT_PALETTE.gridLine }}>
                  <ValueCell value={row.videoPremises} />
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
