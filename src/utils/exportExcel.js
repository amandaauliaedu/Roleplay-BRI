import ExcelJS from 'exceljs'
import { IDENTITY_COLUMNS, ROLEPLAY_PARAM_COLUMNS, VIDEO_COLUMN, REPORT_PALETTE, getValueStyle } from '../data/config'
import { groupReportRowsByKc } from './dataProcessor'

function hex(c) {
  // '#RRGGBB' -> 'FFRRGGBB' (ARGB dipakai ExcelJS)
  return `FF${c.replace('#', '').toUpperCase()}`
}

// Ekspor Excel mengikuti PERSIS pola dokumen referensi "REPORT FINAL ROLEPLAY":
// header 2 baris (navy + banner biru) DIULANG setiap kali berpindah KC Induk,
// dengan page break di antara tiap grup supaya saat dicetak, satu KC Induk
// berada di halamannya sendiri — seperti pada dokumen asli.
export async function exportToExcel(rows, periodLabel = 'Semua Periode', filename = 'REPORT_FINAL_ROLEPLAY') {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Report Final Roleplay', {
    views: [{ showGridLines: false }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  })

  const identityCount = IDENTITY_COLUMNS.length
  const paramCount = ROLEPLAY_PARAM_COLUMNS.length
  const totalCols = identityCount + paramCount + 1 // +1 video premises
  const bannerStartCol = identityCount + 1
  const bannerEndCol = identityCount + paramCount
  const videoCol = totalCols

  const groups = groupReportRowsByKc(rows)
  let r = 1
  const rowBreaks = []

  groups.forEach((group, groupIdx) => {
    // -------- Header blok (diulang per KC Induk) --------
    sheet.mergeCells(r, 1, r, totalCols)
    const titleCell = sheet.getCell(r, 1)
    titleCell.value = 'REPORT FINAL ROLEPLAY'
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF111827' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    sheet.getRow(r).height = 22
    r += 1

    const headerRow1 = r
    const headerRow2 = r + 1

    IDENTITY_COLUMNS.forEach((col, i) => {
      sheet.mergeCells(headerRow1, i + 1, headerRow2, i + 1)
      const cell = sheet.getCell(headerRow1, i + 1)
      cell.value = col.label
      styleHeaderCell(cell, REPORT_PALETTE.headerNavy, REPORT_PALETTE.headerNavyText)
    })

    sheet.mergeCells(headerRow1, bannerStartCol, headerRow1, bannerEndCol)
    const bannerCell = sheet.getCell(headerRow1, bannerStartCol)
    bannerCell.value = `ROLEPLAY, ${periodLabel}`
    styleHeaderCell(bannerCell, REPORT_PALETTE.bannerBlue, REPORT_PALETTE.bannerBlueText)

    ROLEPLAY_PARAM_COLUMNS.forEach((col, i) => {
      const cell = sheet.getCell(headerRow2, bannerStartCol + i)
      cell.value = col.label
      styleHeaderCell(cell, REPORT_PALETTE.bannerBlue, REPORT_PALETTE.bannerBlueText, 9)
    })

    sheet.mergeCells(headerRow1, videoCol, headerRow2, videoCol)
    const videoCell = sheet.getCell(headerRow1, videoCol)
    videoCell.value = VIDEO_COLUMN.label
    styleHeaderCell(videoCell, REPORT_PALETTE.videoTeal, REPORT_PALETTE.videoTealText)

    sheet.getRow(headerRow1).height = 28
    sheet.getRow(headerRow2).height = 32
    r = headerRow2 + 1

    // -------- Data grup ini --------
    group.rows.forEach((row, idx) => {
      const band = idx % 2 === 0 ? REPORT_PALETTE.rowBandGreen : REPORT_PALETTE.rowBandWhite

      IDENTITY_COLUMNS.forEach((col, i) => {
        const cell = sheet.getCell(r, i + 1)
        cell.value = row[col.key]
        cell.font = { bold: true, size: 10, color: { argb: 'FF111827' } }
        cell.alignment = { vertical: 'middle', horizontal: i === 0 ? 'center' : 'left' }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hex(band) } }
        cell.border = thinBorder()
      })

      ;[...ROLEPLAY_PARAM_COLUMNS, VIDEO_COLUMN].forEach((col, i) => {
        const cell = sheet.getCell(r, identityCount + 1 + i)
        const value = row[col.key]
        const style = getValueStyle(value)
        cell.value = style.kind === 'na' ? '' : Number(value)
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.font = { bold: true, size: 10, color: { argb: hex(style.text) } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hex(style.bg) } }
        cell.border = thinBorder()
      })

      r += 1
    })

    r += 1 // baris kosong pemisah antar grup
    if (groupIdx < groups.length - 1) rowBreaks.push(r - 1)
  })

  sheet.pageSetup.printArea = `A1:${sheet.getColumn(totalCols).letter}${r}`
  sheet.rowBreaks = rowBreaks.map((row) => ({ id: row, max: totalCols - 1, man: true }))

  // -------- Lebar kolom --------
  sheet.getColumn(1).width = 12
  sheet.getColumn(2).width = 26
  sheet.getColumn(3).width = 22
  for (let c = identityCount + 1; c <= totalCols; c++) {
    sheet.getColumn(c).width = 14
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function styleHeaderCell(cell, bg, textColor, fontSize = 10) {
  cell.font = { bold: true, size: fontSize, color: { argb: hex(textColor) } }
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hex(bg) } }
  cell.border = thinBorder()
}

function thinBorder() {
  const style = { style: 'thin', color: { argb: 'FF9AA5B8' } }
  return { top: style, left: style, bottom: style, right: style }
}
