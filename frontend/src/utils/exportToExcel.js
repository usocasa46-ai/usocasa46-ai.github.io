import * as XLSX from 'xlsx'

function safeSheetName(name = 'Reporte') {
  return String(name)
    .replace(/[:\\/?*\[\]]/g, ' ')
    .trim()
    .slice(0, 31) || 'Reporte'
}

function safeFilename(name = 'Reporte.xlsx') {
  const cleaned = String(name).replace(/[<>:"/\\|?*]/g, ' ').trim()
  return cleaned.toLowerCase().endsWith('.xlsx') ? cleaned : `${cleaned || 'Reporte'}.xlsx`
}

function formatGeneratedAt(date = new Date()) {
  return new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date)
}

function measureColumnWidth(label, values) {
  const maxLength = values.reduce((max, value) => {
    const length = String(value ?? '').length
    return Math.max(max, length)
  }, String(label ?? '').length)

  return { wch: Math.min(Math.max(maxLength + 2, 12), 42) }
}

export function exportToExcel({
  filename,
  sheetName,
  title,
  rows = [],
  columns = [],
  generatedAt = new Date(),
  totals = [],
}) {
  const headers = columns.map((column) => column.label)
  const body = rows.map((row) => columns.map((column) => {
    if (typeof column.render === 'function') {
      return column.render(row, true)
    }

    return row[column.key] ?? ''
  }))

  const tableStartRow = 4
  const totalRows = totals.length
    ? [
        [],
        ...totals.map((total) => {
          const row = Array(headers.length).fill('')
          row[0] = total.label
          row[Math.max(headers.length - 1, 0)] = total.value
          return row
        }),
      ]
    : []

  const worksheet = XLSX.utils.aoa_to_sheet([
    [title || sheetName || 'Reporte'],
    [`Generado: ${formatGeneratedAt(generatedAt)}`],
    [],
    headers,
    ...body,
    ...totalRows,
  ])

  const lastColumn = Math.max(headers.length - 1, 0)
  const lastRow = Math.max(tableStartRow + body.length - 1, tableStartRow)
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastColumn } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastColumn } },
  ]
  worksheet['!cols'] = headers.map((header, index) => measureColumnWidth(header, body.map((row) => row[index])))
  worksheet['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: tableStartRow - 1, c: 0 },
      e: { r: lastRow - 1, c: lastColumn },
    }),
  }

  const workbook = XLSX.utils.book_new()
  workbook.Props = {
    Title: title || sheetName || 'Reporte',
    Subject: 'INVE-FAT SYSTEM',
    Author: 'INVE-FAT SYSTEM',
    CreatedDate: generatedAt,
  }
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName(sheetName || title))
  XLSX.writeFile(workbook, safeFilename(filename))
}
