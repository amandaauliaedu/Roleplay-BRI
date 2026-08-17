import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { IDENTITY_COLUMNS, ROLEPLAY_PARAM_COLUMNS, VIDEO_COLUMN, REPORT_PALETTE, getValueStyle } from '../data/config'
import { groupReportRowsByKc } from './dataProcessor'

function hexToRgb(hexColor) {
  const c = hexColor.replace('#', '')
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]
}

const PARAM_KEYS = [...ROLEPLAY_PARAM_COLUMNS.map((c) => c.key), VIDEO_COLUMN.key]

// Ekspor PDF mengikuti PERSIS pola dokumen referensi "REPORT FINAL ROLEPLAY":
// tiap KC Induk mendapat blok tabel + header sendiri (dengan page break di
// antaranya), sama seperti pada dokumen contoh yang dilampirkan.
export function exportToPDF(rows, periodLabel = 'Semua Periode', filename = 'REPORT_FINAL_ROLEPLAY') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const groups = groupReportRowsByKc(rows)

  let startY = 36

  groups.forEach((group, groupIdx) => {
    if (groupIdx > 0) {
      doc.addPage()
      startY = 36
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('REPORT FINAL ROLEPLAY', doc.internal.pageSize.getWidth() / 2, startY, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`KC Induk: ${group.kcInduk}`, doc.internal.pageSize.getWidth() / 2, startY + 14, { align: 'center' })

    const headRow1 = [
      { content: 'Branch Code', rowSpan: 2, styles: navyHeader() },
      { content: 'Nama UKO', rowSpan: 2, styles: navyHeader() },
      { content: 'KC Induk', rowSpan: 2, styles: navyHeader() },
      { content: `ROLEPLAY, ${periodLabel}`, colSpan: ROLEPLAY_PARAM_COLUMNS.length, styles: bannerHeader() },
      { content: 'VIDEO PREMISES', rowSpan: 2, styles: tealHeader() },
    ]
    const headRow2 = ROLEPLAY_PARAM_COLUMNS.map((c) => ({ content: c.label, styles: bannerHeader(7.5) }))

    const body = group.rows.map((row, idx) => {
      const band = idx % 2 === 0 ? hexToRgb(REPORT_PALETTE.rowBandGreen) : [255, 255, 255]
      const identity = IDENTITY_COLUMNS.map((col) => ({
        content: row[col.key],
        styles: { fillColor: band, textColor: [17, 24, 39], fontStyle: 'bold', halign: col.key === 'branchCode' ? 'center' : 'left' },
      }))
      const params = PARAM_KEYS.map((key) => {
        const style = getValueStyle(row[key])
        return {
          content: style.kind === 'na' ? '' : style.label,
          styles: {
            fillColor: hexToRgb(style.bg),
            textColor: style.kind === 'na' ? hexToRgb(style.bg) : hexToRgb(style.text),
            fontStyle: 'bold',
            halign: 'center',
          },
        }
      })
      return [...identity, ...params]
    })

    autoTable(doc, {
      startY: startY + 30,
      head: [headRow1, headRow2],
      body,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 5, lineColor: hexToRgb(REPORT_PALETTE.gridLine), lineWidth: 0.5, valign: 'middle' },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 110 },
        2: { cellWidth: 95 },
      },
      didDrawPage: () => {
        // Footer tampil di SETIAP halaman fisik (termasuk halaman lanjutan
        // saat satu KC Induk meluber ke >1 halaman) — mempertegas bahwa
        // satu halaman = satu KC Induk, tidak pernah digabung dengan KC lain.
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        doc.setFontSize(8)
        doc.setTextColor(120, 120, 120)
        doc.text(`Halaman khusus KC Induk: ${group.kcInduk}`, 40, pageHeight - 16)
        doc.text(periodLabel, pageWidth - 40, pageHeight - 16, { align: 'right' })
      },
    })
  })

  doc.save(`${filename}.pdf`)
}

function navyHeader() {
  return { fillColor: hexToRgb(REPORT_PALETTE.headerNavy), textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', valign: 'middle' }
}
function bannerHeader(fontSize = 8.5) {
  return { fillColor: hexToRgb(REPORT_PALETTE.bannerBlue), textColor: hexToRgb(REPORT_PALETTE.bannerBlueText), fontStyle: 'bold', halign: 'center', valign: 'middle', fontSize }
}
function tealHeader() {
  return { fillColor: hexToRgb(REPORT_PALETTE.videoTeal), textColor: hexToRgb(REPORT_PALETTE.videoTealText), fontStyle: 'bold', halign: 'center', valign: 'middle' }
}
