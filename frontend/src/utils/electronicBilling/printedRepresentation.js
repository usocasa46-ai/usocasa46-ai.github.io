import { calculateElectronicTaxes } from './taxCalculator.js'

function clean(value) {
  return String(value ?? '').trim()
}

function escapeHtml(value) {
  return clean(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function money(value) {
  return Number(value || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function pickCompany(settings = {}) {
  const company = settings.company || settings.companyInfo || settings.business || settings.general || settings
  return {
    name: company.nombreComercial || company.name || settings.companyName || 'INVE-FAT SYSTEM',
    legalName: company.razonSocial || company.legalName || company.nombreComercial || company.name || settings.companyName || 'INVE-FAT SYSTEM',
    rnc: company.rnc || company.fiscalId || company.taxId || settings.rnc || settings.companyRnc || '',
    address: company.direccion || company.address || settings.address || settings.companyAddress || '',
    phone: company.telefono || company.phone || settings.phone || '',
    email: company.correo || company.email || settings.email || '',
    logo: company.logo || settings.logo || settings.companyLogo || '',
    footerMessage: company.footerMessage || settings.footerMessage || 'Gracias por su compra',
  }
}

function buildQrData(invoice = {}, document = {}) {
  return JSON.stringify({
    rnc: document.companyRnc || '',
    ncf: document.ncf || invoice.ncf || '',
    fecha: invoice.date || document.date || '',
    total: invoice.totals?.total || document.total || 0,
    codigoSeguridad: document.securityCode || '',
  })
}

export function buildPrintedRepresentation(invoice = {}, settings = {}, document = {}) {
  const company = pickCompany(settings)
  const taxes = calculateElectronicTaxes(invoice)
  const generatedAt = new Date().toISOString()
  const qrData = document.qrData || buildQrData(invoice, document)
  const lines = taxes.lines

  const rows = lines.map((line) => `
      <tr>
        <td>${escapeHtml(line.code)}</td>
        <td>${escapeHtml(line.name)}</td>
        <td class="num">${money(line.quantity)}</td>
        <td class="num">${money(line.price)}</td>
        <td class="num">${money(line.tax)}</td>
        <td class="num">${money(line.total)}</td>
      </tr>
  `).join('')

  const htmlContent = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Representacion impresa ${escapeHtml(invoice.ncf || invoice.number || '')}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; color: #172033; background: #fff; }
    .ri { max-width: 840px; margin: 0 auto; padding: 24px; }
    .header { display: flex; justify-content: space-between; gap: 16px; border-bottom: 2px solid #1f3b63; padding-bottom: 14px; }
    .brand { display: flex; gap: 12px; align-items: center; }
    .brand img { width: 56px; height: 56px; object-fit: contain; border: 1px solid #d8dee8; border-radius: 8px; }
    h1, h2, p { margin: 0; }
    h1 { font-size: 18px; color: #102a4c; }
    h2 { font-size: 15px; color: #f58220; margin-top: 4px; }
    .meta, .client, .totals, .footer { margin-top: 16px; border: 1px solid #d8dee8; border-radius: 8px; padding: 12px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 18px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th { background: #eef3f8; color: #102a4c; text-align: left; padding: 8px; }
    td { border-bottom: 1px solid #e3e8ef; padding: 8px; vertical-align: top; }
    .num { text-align: right; white-space: nowrap; }
    .qr { border: 1px dashed #6b7a90; padding: 10px; border-radius: 8px; font-size: 11px; max-width: 260px; word-break: break-word; }
    .totals { margin-left: auto; max-width: 320px; }
    .total-line { display: flex; justify-content: space-between; padding: 5px 0; }
    .total-line strong { font-size: 18px; color: #102a4c; }
    .footer { text-align: center; color: #536176; font-size: 12px; }
    @media print { .ri { padding: 10mm; } }
  </style>
</head>
<body>
  <main class="ri">
    <section class="header">
      <div class="brand">
        ${company.logo ? `<img src="${escapeHtml(company.logo)}" alt="Logo" />` : ''}
        <div>
          <h1>${escapeHtml(company.name)}</h1>
          <p>${escapeHtml(company.legalName)}</p>
          <p>RNC: ${escapeHtml(company.rnc)}</p>
          <p>${escapeHtml(company.address)}</p>
          <p>${escapeHtml(company.phone)} ${company.email ? `- ${escapeHtml(company.email)}` : ''}</p>
        </div>
      </div>
      <div class="qr">
        <strong>Codigo QR preparado</strong><br />
        ${escapeHtml(qrData)}
      </div>
    </section>

    <section class="meta">
      <h2>Representacion impresa de comprobante fiscal electronico</h2>
      <div class="grid">
        <span>Tipo e-CF: <strong>${escapeHtml(document.ecfType || invoice.tipoComprobante || invoice.receiptType || 'Factura')}</strong></span>
        <span>NCF/e-NCF: <strong>${escapeHtml(document.ncf || invoice.ncf || '')}</strong></span>
        <span>Factura: <strong>${escapeHtml(invoice.number || '')}</strong></span>
        <span>Fecha: <strong>${escapeHtml(invoice.date || invoice.createdAt || '')}</strong></span>
        <span>Estado electronico: <strong>${escapeHtml(document.electronicStatus || 'Pendiente')}</strong></span>
        <span>Codigo seguridad: <strong>${escapeHtml(document.securityCode || '')}</strong></span>
      </div>
    </section>

    <section class="client">
      <div class="grid">
        <span>Cliente: <strong>${escapeHtml(invoice.razonSocialCliente || invoice.customer || 'Consumidor Final')}</strong></span>
        <span>RNC cliente: <strong>${escapeHtml(invoice.rncCliente || invoice.fiscalId || invoice.customerRnc || '')}</strong></span>
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th>Codigo</th>
          <th>Descripcion</th>
          <th class="num">Cant.</th>
          <th class="num">Precio</th>
          <th class="num">ITBIS</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <section class="totals">
      <div class="total-line"><span>Subtotal</span><span>RD$ ${money(taxes.subtotal)}</span></div>
      <div class="total-line"><span>Descuento</span><span>RD$ ${money(taxes.discount)}</span></div>
      <div class="total-line"><span>ITBIS</span><span>RD$ ${money(taxes.itbis)}</span></div>
      <div class="total-line"><strong>Total</strong><strong>RD$ ${money(taxes.total)}</strong></div>
      <div class="total-line"><span>Forma de pago</span><span>${escapeHtml(invoice.paymentMethod || invoice.payment?.method || '')}</span></div>
    </section>

    <section class="footer">
      <p>${escapeHtml(company.footerMessage)}</p>
      <p>Emitido por: ${escapeHtml(invoice.seller || invoice.cashier || invoice.user || '')}</p>
      <p>Fecha de impresion: ${escapeHtml(generatedAt)}</p>
    </section>
  </main>
</body>
</html>`

  return {
    format: 'RI-preparacion-1.0',
    generatedAt,
    qrData,
    htmlContent,
  }
}

export function openPrintedRepresentation(htmlContent) {
  const preview = window.open('', '_blank', 'width=980,height=720')
  if (!preview) return null
  preview.document.write(htmlContent)
  preview.document.close()
  preview.focus()
  return preview
}
