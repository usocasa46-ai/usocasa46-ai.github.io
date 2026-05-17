const defaultSettings = {
  company: {
    tradeName: 'INVE-FAT SYSTEM',
    legalName: 'Empresa Principal',
    fiscalId: '',
    address: '',
    phone: '',
    whatsapp: '',
    email: '',
    currency: 'RD$',
    legalNote: 'Gracias por su compra.',
  },
  brand: {
    primaryColor: '#0f2742',
    secondaryColor: '#eef3f8',
    accentColor: '#f1872d',
    logo: '',
  },
  documentOptions: {
    showLogo: true,
    showFiscalId: true,
    showPhone: true,
    showAddress: true,
    showEmail: true,
    showSeller: true,
    showBranch: true,
    showWarehouse: true,
    showLegalNote: true,
    showQr: false,
  },
  billing: {
    invoiceModel: 'Moderno profesional',
    printFormat: 'Carta',
    orientation: 'Vertical',
    fontSize: '11',
    showLineDiscount: true,
    showTotals: true,
    showSignature: true,
    showStamp: false,
    footerMessage: 'Documento generado por INVE-FAT SYSTEM.',
  },
}

const pageFormats = {
  A4: { width: 595, height: 842 },
  Carta: { width: 612, height: 792 },
  'Media carta': { width: 612, height: 396 },
  'Ticket 80mm': { width: 226, height: 720 },
  'Ticket 58mm': { width: 164, height: 720 },
}

function mergeSettings(settings = {}) {
  return {
    ...defaultSettings,
    ...settings,
    company: { ...defaultSettings.company, ...settings.company },
    brand: { ...defaultSettings.brand, ...settings.brand },
    documentOptions: { ...defaultSettings.documentOptions, ...settings.documentOptions },
    billing: { ...defaultSettings.billing, ...settings.billing },
  }
}

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function sanitizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapePdfText(value) {
  return sanitizeText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function hexToRgb(hexValue, fallback = '#0f2742') {
  const hex = String(hexValue || fallback).replace('#', '')
  const full = hex.length === 3 ? hex.split('').map((item) => item + item).join('') : hex
  const parsed = Number.parseInt(full, 16)

  if (!Number.isFinite(parsed)) return hexToRgb(fallback, '#0f2742')

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  }
}

function pdfColor(hexValue) {
  const { r, g, b } = hexToRgb(hexValue)
  return `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)}`
}

function formatMoney(value, settings) {
  const symbol = settings.company.currency || settings.preferences?.currency || 'RD$'
  return `${symbol} ${toNumber(value).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatQuantity(value) {
  return toNumber(value).toLocaleString('es-DO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function lineBase(line) {
  return toNumber(line.quantity) * toNumber(line.price)
}

function lineDiscount(line) {
  return Math.min(toNumber(line.discount), lineBase(line))
}

function lineTax(line) {
  return Math.max(lineBase(line) - lineDiscount(line), 0) * (toNumber(line.taxRate) / 100)
}

function lineTotal(line) {
  return Math.max(lineBase(line) - lineDiscount(line), 0) + lineTax(line)
}

function calculateTotals(documentData) {
  if (documentData?.totals) {
    return {
      subtotal: toNumber(documentData.totals.subtotal),
      discountTotal: toNumber(documentData.totals.discountTotal || documentData.totals.discount),
      taxTotal: toNumber(documentData.totals.taxTotal || documentData.totals.tax),
      total: toNumber(documentData.totals.total),
      paid: toNumber(documentData.totals.paid || documentData.paidAmount),
      balance: toNumber(documentData.totals.balance),
      change: toNumber(documentData.totals.change),
    }
  }

  const lines = Array.isArray(documentData?.lines) ? documentData.lines : []
  const subtotal = lines.reduce((sum, line) => sum + lineBase(line), 0)
  const discountTotal = lines.reduce((sum, line) => sum + lineDiscount(line), 0)
  const taxTotal = lines.reduce((sum, line) => sum + lineTax(line), 0)
  const total = Math.max(subtotal - discountTotal + taxTotal, 0)
  const paid = toNumber(documentData?.paidAmount)

  return {
    subtotal,
    discountTotal,
    taxTotal,
    total,
    paid,
    balance: Math.max(total - paid, 0),
    change: Math.max(paid - total, 0),
  }
}

function getPageSize(settings) {
  const format = settings.billing.printFormat || 'Carta'
  const base = pageFormats[format] || pageFormats.Carta
  const horizontal = settings.billing.orientation === 'Horizontal' && !format.includes('Ticket')

  return horizontal ? { width: base.height, height: base.width } : base
}

function splitText(value, maxChars) {
  const words = sanitizeText(value).split(' ').filter(Boolean)
  const lines = []
  let current = ''

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars && current) {
      lines.push(current)
      current = word
      return
    }
    current = next
  })

  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function textWidthChars(width, fontSize) {
  return Math.max(Math.floor(width / (fontSize * 0.52)), 8)
}

function buildPdf(objects, pages, pageSize) {
  const kids = []

  objects.push('<< /Type /Catalog /Pages 2 0 R >>')
  objects.push('')
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')

  pages.forEach((pageContent) => {
    const pageObjectId = objects.length + 1
    const contentObjectId = objects.length + 2
    kids.push(`${pageObjectId} 0 R`)
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageSize.width} ${pageSize.height}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectId} 0 R >>`)
    objects.push(`<< /Length ${pageContent.length} >>\nstream\n${pageContent}\nendstream`)
  })

  objects[1] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>`

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return pdf
}

function createCanvasContext(pageSize, margin, settings) {
  const pages = []
  let commands = []
  let y = pageSize.height - margin

  const push = (command) => commands.push(command)
  const commitPage = () => {
    pages.push(commands.join('\n'))
    commands = []
    y = pageSize.height - margin
  }

  const rect = (x, topY, width, height, color, strokeColor = null) => {
    if (color) push(`${pdfColor(color)} rg ${x} ${topY - height} ${width} ${height} re f`)
    if (strokeColor) push(`${pdfColor(strokeColor)} RG ${x} ${topY - height} ${width} ${height} re S`)
  }

  const line = (x1, y1, x2, y2, color = '#dce5ef', width = 1) => {
    push(`${pdfColor(color)} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`)
  }

  const text = (value, x, textY, size = 10, options = {}) => {
    const font = options.bold ? 'F2' : 'F1'
    const color = options.color || '#172d43'
    const safeValue = escapePdfText(value)
    push(`BT /${font} ${size} Tf ${pdfColor(color)} rg ${x} ${textY} Td (${safeValue}) Tj ET`)
  }

  const wrappedText = (value, x, textY, width, size = 10, options = {}) => {
    const lines = splitText(value, textWidthChars(width, size))
    lines.forEach((lineText, index) => text(lineText, x, textY - (index * (size + 3)), size, options))
    return lines.length * (size + 3)
  }

  const pageBreakIfNeeded = (neededHeight, drawHeader) => {
    if (y - neededHeight > margin + 90) return
    drawFooter()
    commitPage()
    drawHeader?.()
  }

  const drawFooter = () => {
    const footerY = margin + 28
    line(margin, footerY + 18, pageSize.width - margin, footerY + 18, '#dce5ef', 0.6)
    text(settings.billing.footerMessage || 'Documento generado por INVE-FAT SYSTEM.', margin, footerY, 8, { color: '#60758b' })
    text(`Impreso: ${new Date().toLocaleString('es-DO')}`, pageSize.width - margin - 130, footerY, 8, { color: '#60758b' })
  }

  return {
    get y() { return y },
    set y(value) { y = value },
    pages,
    commitPage,
    rect,
    line,
    text,
    wrappedText,
    pageBreakIfNeeded,
    drawFooter,
  }
}

export function createPdfMetadata(documentData, settings = {}, documentType = 'invoice') {
  const mergedSettings = mergeSettings(settings)
  const prefix = documentType === 'quote' ? 'COTIZACION' : 'FACTURA'

  return {
    generated: true,
    generatedAt: new Date().toISOString(),
    model: mergedSettings.billing.invoiceModel,
    format: mergedSettings.billing.printFormat,
    fileName: `${prefix}-${sanitizeText(documentData?.number || Date.now())}.pdf`,
  }
}

export function createSalesDocumentPdfBlob({ documentData, settings, documentType = 'invoice' }) {
  const mergedSettings = mergeSettings(settings)
  const pageSize = getPageSize(mergedSettings)
  const isTicket = String(mergedSettings.billing.printFormat || '').includes('Ticket')
  const margin = isTicket ? 14 : 36
  const baseFont = Math.max(8, Math.min(toNumber(mergedSettings.billing.fontSize) || 11, isTicket ? 10 : 13))
  const title = documentType === 'quote' ? 'COTIZACION' : 'FACTURA'
  const documentLabel = documentType === 'quote' ? 'Cotizacion' : 'Factura'
  const lines = Array.isArray(documentData?.lines) ? documentData.lines : []
  const totals = calculateTotals(documentData)
  const primary = mergedSettings.brand.primaryColor
  const accent = mergedSettings.brand.accentColor
  const secondary = mergedSettings.brand.secondaryColor
  const contentWidth = pageSize.width - (margin * 2)
  const objects = []
  const ctx = createCanvasContext(pageSize, margin, mergedSettings)

  const drawDocumentHeader = () => {
    const headerHeight = isTicket ? 92 : 104
    ctx.rect(margin, ctx.y, contentWidth, headerHeight, '#ffffff', '#dce5ef')
    ctx.rect(margin, ctx.y, contentWidth, 10, primary)

    const companyX = margin + 14
    const companyY = ctx.y - 29
    if (mergedSettings.documentOptions.showLogo && mergedSettings.brand.logo) {
      ctx.rect(companyX, ctx.y - 22, 42, 42, secondary, '#dce5ef')
      ctx.text('LOGO', companyX + 8, ctx.y - 48, 8, { bold: true, color: primary })
    }

    const companyTextX = mergedSettings.documentOptions.showLogo && mergedSettings.brand.logo ? companyX + 54 : companyX
    ctx.text(mergedSettings.company.tradeName || mergedSettings.company.legalName, companyTextX, companyY, isTicket ? 12 : 17, { bold: true, color: primary })
    ctx.text(mergedSettings.company.legalName || '', companyTextX, companyY - 16, baseFont, { color: '#40576f' })

    let infoY = companyY - 31
    if (mergedSettings.documentOptions.showFiscalId) {
      ctx.text(`RNC / ID: ${mergedSettings.company.fiscalId || 'N/D'}`, companyTextX, infoY, baseFont - 1, { color: '#60758b' })
      infoY -= 13
    }
    if (mergedSettings.documentOptions.showAddress) {
      infoY -= ctx.wrappedText(mergedSettings.company.address || 'Direccion principal', companyTextX, infoY, contentWidth * 0.48, baseFont - 1, { color: '#60758b' }) - (baseFont + 2)
    }
    if (mergedSettings.documentOptions.showPhone) {
      ctx.text(`Tel: ${mergedSettings.company.phone || 'N/D'}  WhatsApp: ${mergedSettings.company.whatsapp || 'N/D'}`, companyTextX, infoY, baseFont - 1, { color: '#60758b' })
    }
    if (mergedSettings.documentOptions.showEmail) {
      ctx.text(`Correo: ${mergedSettings.company.email || 'N/D'}`, companyTextX, infoY - 13, baseFont - 1, { color: '#60758b' })
    }

    const docBoxWidth = isTicket ? contentWidth : 172
    const docBoxX = isTicket ? margin + 10 : pageSize.width - margin - docBoxWidth - 14
    const docBoxY = ctx.y - 26
    ctx.rect(docBoxX, docBoxY + 8, docBoxWidth, 70, primary)
    ctx.text(title, docBoxX + 14, docBoxY - 13, isTicket ? 12 : 18, { bold: true, color: '#ffffff' })
    ctx.text(documentData?.number || 'Pendiente', docBoxX + 14, docBoxY - 33, baseFont + 1, { bold: true, color: '#ffffff' })
    ctx.text(`Fecha: ${documentData?.date || ''}`, docBoxX + 14, docBoxY - 50, baseFont - 1, { color: '#e8f0f8' })

    ctx.y -= headerHeight + 16
  }

  const drawCustomerBlock = () => {
    const blockHeight = isTicket ? 116 : 92
    ctx.rect(margin, ctx.y, contentWidth, blockHeight, '#ffffff', '#dce5ef')
    ctx.rect(margin, ctx.y, contentWidth, 8, accent)
    ctx.text('Datos del cliente', margin + 14, ctx.y - 27, baseFont + 1, { bold: true, color: primary })
    ctx.text(`Cliente: ${documentData?.customer || 'Cliente de contado'}`, margin + 14, ctx.y - 45, baseFont, { bold: true })
    ctx.text(`Codigo: ${documentData?.customerCode || 'N/D'}  RNC / ID: ${documentData?.fiscalId || 'N/D'}`, margin + 14, ctx.y - 61, baseFont - 1, { color: '#60758b' })
    ctx.text(`Telefono: ${documentData?.phone || 'N/D'}`, margin + 14, ctx.y - 77, baseFont - 1, { color: '#60758b' })

    const rightX = isTicket ? margin + 14 : margin + contentWidth * 0.58
    const rightY = isTicket ? ctx.y - 93 : ctx.y - 45
    ctx.text(`Pago: ${documentData?.paymentMethod || documentData?.paymentCondition || 'N/D'}`, rightX, rightY, baseFont - 1, { color: '#40576f' })
    ctx.text(`Condicion: ${documentData?.paymentCondition || 'N/D'}`, rightX, rightY - 16, baseFont - 1, { color: '#40576f' })
    if (documentType === 'quote') {
      ctx.text(`Validez: ${documentData?.validUntil || 'N/D'}`, rightX, rightY - 32, baseFont - 1, { color: '#40576f' })
    }

    ctx.y -= blockHeight + 14
  }

  const drawTableHeader = () => {
    const tableTop = ctx.y
    ctx.rect(margin, tableTop, contentWidth, 26, primary)
    const columns = isTicket
      ? [
          { label: 'Producto', x: margin + 8, width: contentWidth * 0.48 },
          { label: 'Cant.', x: margin + contentWidth * 0.54, width: 32 },
          { label: 'Total', x: margin + contentWidth * 0.72, width: contentWidth * 0.25 },
        ]
      : [
          { label: 'Codigo', x: margin + 8, width: 72 },
          { label: 'Descripcion', x: margin + 82, width: contentWidth - 318 },
          { label: 'Und', x: pageSize.width - margin - 232, width: 36 },
          { label: 'Cant.', x: pageSize.width - margin - 192, width: 40 },
          { label: 'Precio', x: pageSize.width - margin - 148, width: 54 },
          { label: 'Desc.', x: pageSize.width - margin - 92, width: 42 },
          { label: 'Total', x: pageSize.width - margin - 48, width: 44 },
        ]

    columns.forEach((column) => ctx.text(column.label, column.x, tableTop - 17, 8, { bold: true, color: '#ffffff' }))
    ctx.y -= 26
  }

  const drawLineRow = (line, index) => {
    const rowHeight = isTicket ? 42 : 36
    ctx.pageBreakIfNeeded(rowHeight + 10, drawTableHeader)
    const rowTop = ctx.y
    ctx.rect(margin, rowTop, contentWidth, rowHeight, index % 2 === 0 ? '#ffffff' : '#f8fafc', '#edf2f7')

    if (isTicket) {
      ctx.wrappedText(line.name || line.description || line.code, margin + 8, rowTop - 14, contentWidth * 0.5, 8, { bold: true })
      ctx.text(formatQuantity(line.quantity), margin + contentWidth * 0.56, rowTop - 18, 8)
      ctx.text(formatMoney(lineTotal(line), mergedSettings), margin + contentWidth * 0.72, rowTop - 18, 8, { bold: true })
    } else {
      ctx.text(line.code || '', margin + 8, rowTop - 16, 8)
      ctx.wrappedText(line.name || line.description || 'Producto', margin + 82, rowTop - 14, contentWidth - 322, 8, { bold: true })
      ctx.text(line.unit || 'UND', pageSize.width - margin - 232, rowTop - 16, 8)
      ctx.text(formatQuantity(line.quantity), pageSize.width - margin - 192, rowTop - 16, 8)
      ctx.text(formatMoney(line.price, mergedSettings), pageSize.width - margin - 148, rowTop - 16, 8)
      ctx.text(formatMoney(line.discount, mergedSettings), pageSize.width - margin - 92, rowTop - 16, 8)
      ctx.text(formatMoney(lineTotal(line), mergedSettings), pageSize.width - margin - 48, rowTop - 16, 8, { bold: true })
    }

    ctx.y -= rowHeight
  }

  const drawTotals = () => {
    const totalsWidth = isTicket ? contentWidth : 230
    const totalsX = isTicket ? margin : pageSize.width - margin - totalsWidth
    const totalsTop = ctx.y - 16
    const totalsHeight = 126
    ctx.pageBreakIfNeeded(totalsHeight + 80)
    ctx.rect(totalsX, totalsTop, totalsWidth, totalsHeight, '#ffffff', '#dce5ef')
    ctx.rect(totalsX, totalsTop, totalsWidth, 8, accent)

    const rows = [
      ['Subtotal', totals.subtotal],
      ['Descuento', totals.discountTotal],
      ['Impuesto', totals.taxTotal],
      ['Pagado', totals.paid],
      ['Balance', totals.balance],
    ]

    let rowY = totalsTop - 24
    rows.forEach(([label, value]) => {
      ctx.text(label, totalsX + 12, rowY, 9, { color: '#53687e' })
      ctx.text(formatMoney(value, mergedSettings), totalsX + 105, rowY, 9, { bold: true })
      rowY -= 17
    })
    ctx.rect(totalsX + 8, rowY + 10, totalsWidth - 16, 24, primary)
    ctx.text('TOTAL', totalsX + 14, rowY - 7, 10, { bold: true, color: '#ffffff' })
    ctx.text(formatMoney(totals.total, mergedSettings), totalsX + 104, rowY - 7, 10, { bold: true, color: '#ffffff' })

    const noteX = margin
    const noteWidth = isTicket ? contentWidth : Math.max(240, contentWidth - totalsWidth - 24)
    const noteTop = totalsTop
    if (!isTicket) {
      ctx.text('Notas', noteX, noteTop - 18, 10, { bold: true, color: primary })
      if (documentType === 'quote') {
        ctx.wrappedText('Esta cotizacion no representa factura fiscal.', noteX, noteTop - 36, noteWidth, 9, { color: '#60758b' })
      }
      if (documentData?.observations) {
        ctx.wrappedText(documentData.observations, noteX, noteTop - 54, noteWidth, 9, { color: '#60758b' })
      }
      if (mergedSettings.documentOptions.showLegalNote) {
        ctx.wrappedText(mergedSettings.company.legalNote || '', noteX, noteTop - 72, noteWidth, 9, { color: '#60758b' })
      }
    }

    ctx.y = totalsTop - totalsHeight - 18
  }

  const drawSignatures = () => {
    if (!mergedSettings.billing.showSignature || isTicket) return
    ctx.pageBreakIfNeeded(76)
    const signatureY = ctx.y - 34
    ctx.line(margin, signatureY, margin + 180, signatureY, '#9fb1c4', 0.8)
    ctx.line(pageSize.width - margin - 180, signatureY, pageSize.width - margin, signatureY, '#9fb1c4', 0.8)
    ctx.text('Entregado por', margin + 52, signatureY - 15, 9, { color: '#60758b' })
    ctx.text('Recibido por', pageSize.width - margin - 124, signatureY - 15, 9, { color: '#60758b' })
    ctx.y -= 76
  }

  drawDocumentHeader()
  drawCustomerBlock()
  drawTableHeader()
  lines.forEach(drawLineRow)
  drawTotals()
  drawSignatures()
  ctx.drawFooter()
  ctx.commitPage()

  const pdf = buildPdf(objects, ctx.pages, pageSize)
  return new Blob([pdf], { type: 'application/pdf' })
}

export function downloadSalesDocumentPdf({ documentData, settings, documentType = 'invoice' }) {
  const blob = createSalesDocumentPdfBlob({ documentData, settings, documentType })
  const metadata = createPdfMetadata(documentData, settings, documentType)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = metadata.fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return metadata
}

export function openSalesDocumentPdf({ documentData, settings, documentType = 'invoice' }) {
  const blob = createSalesDocumentPdfBlob({ documentData, settings, documentType })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(url), 60000)
  return createPdfMetadata(documentData, settings, documentType)
}

export function printSalesDocumentPdf({ documentData, settings, documentType = 'invoice' }) {
  const blob = createSalesDocumentPdfBlob({ documentData, settings, documentType })
  const url = URL.createObjectURL(blob)
  const frame = document.createElement('iframe')
  frame.style.position = 'fixed'
  frame.style.right = '0'
  frame.style.bottom = '0'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  frame.src = url
  frame.onload = () => {
    frame.contentWindow?.focus()
    frame.contentWindow?.print()
    window.setTimeout(() => {
      frame.remove()
      URL.revokeObjectURL(url)
    }, 3000)
  }
  document.body.appendChild(frame)
  return createPdfMetadata(documentData, settings, documentType)
}
