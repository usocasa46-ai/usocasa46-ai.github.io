function buildPrintDocument(content, title = 'Etiquetas INVE-FAT SYSTEM') {
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 18px; font-family: Arial, sans-serif; color: #10243a; background: #fff; }
        .label-print-grid { display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-start; }
        .print-label-card { break-inside: avoid; border: 1px solid #ccd8e5; border-radius: 8px; padding: 8px; background: #fff; overflow: hidden; }
        .print-label-card strong { display: block; font-size: 12px; line-height: 1.2; }
        .print-label-card small { display: block; color: #52677d; font-size: 9px; }
        .print-label-card img { max-width: 100%; object-fit: contain; }
        @media print {
          body { padding: 8mm; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="label-print-grid">${content}</div>
      <script>window.addEventListener('load', () => window.print())</script>
    </body>
  </html>`
}

export function printLabelHtml(content, title) {
  if (typeof window === 'undefined') return false
  const printWindow = window.open('', '_blank', 'width=960,height=720')
  if (!printWindow) return false
  printWindow.document.open()
  printWindow.document.write(buildPrintDocument(content, title))
  printWindow.document.close()
  return true
}

export function downloadHtmlFile(content, filename = 'etiquetas-invefat.html') {
  if (typeof document === 'undefined') return false
  const blob = new Blob([buildPrintDocument(content)], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
  return true
}
