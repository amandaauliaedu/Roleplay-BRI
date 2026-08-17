import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { IDENTITY_COLUMNS, ROLEPLAY_PARAM_COLUMNS, VIDEO_COLUMN, REPORT_PALETTE, getValueStyle } from '../data/config'

function hexToRgb(hexColor) {
  const c = hexColor.replace('#', '')
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]
}

const PARAM_KEYS = [...ROLEPLAY_PARAM_COLUMNS.map((c) => c.key), VIDEO_COLUMN.key]

function navyHeader() {
  return { fillColor: hexToRgb(REPORT_PALETTE.headerNavy), textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', valign: 'middle' }
}
function bannerHeader(fontSize = 8.5) {
  return { fillColor: hexToRgb(REPORT_PALETTE.bannerBlue), textColor: hexToRgb(REPORT_PALETTE.bannerBlueText), fontStyle: 'bold', halign: 'center', valign: 'middle', fontSize }
}
function tealHeader() {
  return { fillColor: hexToRgb(REPORT_PALETTE.videoTeal), textColor: hexToRgb(REPORT_PALETTE.videoTealText), fontStyle: 'bold', halign: 'center', valign: 'middle' }
}

// groups: [{ kcInduk, rows }]
export function exportToPDF(groups, periodLabel = 'Semua Periode', filename = 'REPORT_FINAL_ROLEPLAY') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORT FINAL ROLEPLAY', pageWidth / 2, 36, { align: 'center' })

  let cursorY = 55

  groups.forEach((group, gIdx) => {
    if (gIdx > 0) {
      const estRowHeight = 22
      const estHeight = group.rows.length * estRowHeight + 60
      if (cursorY + estHeight > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage()
        cursorY = 40
      } else {
        cursorY += 18
      }
    }

    doc.setFontSize(10.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...hexToRgb(REPORT_PALETTE.headerNavy))
    doc.text(group.kcInduk, 40, cursorY)
    doc.setTextColor(0, 0, 0)
    cursorY += 8

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
      startY: cursorY,
      head: [headRow1, headRow2],
      body,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 5, lineColor: hexToRgb(REPORT_PALETTE.gridLine), lineWidth: 0.5, valign: 'middle' },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 110 },
        2: { cellWidth: 95 },
      },
      margin: { left: 40, right: 40 },
    })

    cursorY = doc.lastAutoTable.finalY + 4
  })

  const dateStr = new Date().toISOString().slice(0, 10)
  doc.save(`${filename}_${dateStr}.pdf`)
}
