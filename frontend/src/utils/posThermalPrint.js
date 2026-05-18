function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function money(value, settings = {}) {
  const symbol = settings?.company?.currency || 'RD$'
  return `${symbol} ${toNumber(value).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function quantity(value) {
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

function documentTotals(invoice) {
  if (invoice?.totals) {
    return {
      subtotal: toNumber(invoice.totals.subtotal),
      discountTotal: toNumber(invoice.totals.discountTotal || invoice.totals.discount),
      taxTotal: toNumber(invoice.totals.taxTotal || invoice.totals.tax),
      total: toNumber(invoice.totals.total),
      paid: toNumber(invoice.totals.paid || invoice.paidAmount),
      balance: toNumber(invoice.totals.balance),
      change: toNumber(invoice.totals.change),
    }
  }

  const lines = Array.isArray(invoice?.lines) ? invoice.lines : []
  const subtotal = lines.reduce((sum, line) => sum + lineBase(line), 0)
  const discountTotal = lines.reduce((sum, line) => sum + lineDiscount(line), 0)
  const taxTotal = lines.reduce((sum, line) => sum + lineTax(line), 0)
  const total = Math.max(subtotal - discountTotal + taxTotal, 0)
  const paid = toNumber(invoice?.paidAmount)
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

function companyBlock(settings = {}) {
  const company = settings.company || {}
  const documentOptions = settings.documentOptions || {}
  const logo = settings.brand?.logo || settings.logo || company.logo || ''
  const showLogo = documentOptions.showLogo !== false && logo

  return `
    ${showLogo ? `<img class="ticket-logo" src="${escapeHtml(logo)}" alt="Logo" />` : ''}
    <h1>${escapeHtml(company.tradeName || company.legalName || 'INVE-FAT SYSTEM')}</h1>
    ${company.legalName && company.legalName !== company.tradeName ? `<p>${escapeHtml(company.legalName)}</p>` : ''}
    ${company.fiscalId ? `<p>RNC: ${escapeHtml(company.fiscalId)}</p>` : ''}
    ${company.address ? `<p>${escapeHtml(company.address)}</p>` : ''}
    ${company.phone || company.whatsapp ? `<p>Tel: ${escapeHtml([company.phone, company.whatsapp].filter(Boolean).join(' / '))}</p>` : ''}
    ${company.email ? `<p>${escapeHtml(company.email)}</p>` : ''}
  `
}

export function createThermalTicketHtml(invoice, settings = {}, options = {}) {
  const width = options.width || settings?.billing?.printFormat || 'Ticket 80mm'
  const ticketWidth = String(width).includes('58') ? '58mm' : '80mm'
  const totals = documentTotals(invoice)
  const lines = Array.isArray(invoice?.lines) ? invoice.lines : []
  const printedAt = new Date().toLocaleString('es-DO')
  const fiscal = Boolean(invoice?.comprobanteFiscal || invoice?.ncf)

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(invoice?.number || 'Factura POS')}</title>
  <style>
    @page { size: ${ticketWidth} auto; margin: 0; }
    * { box-sizing: border-box; }
    body {
      width: ${ticketWidth};
      margin: 0;
      background: #ffffff;
      color: #111111;
      font-family: "Arial", "Helvetica", sans-serif;
      font-size: ${ticketWidth === '58mm' ? '10px' : '11px'};
      line-height: 1.25;
    }
    .ticket {
      width: 100%;
      padding: 8px 7px 10px;
    }
    .center { text-align: center; }
    .ticket-logo {
      max-width: ${ticketWidth === '58mm' ? '42mm' : '55mm'};
      max-height: 24mm;
      object-fit: contain;
      display: block;
      margin: 0 auto 4px;
    }
    h1 {
      margin: 0 0 2px;
      font-size: ${ticketWidth === '58mm' ? '13px' : '15px'};
      text-transform: uppercase;
      letter-spacing: 0;
    }
    h2 {
      margin: 6px 0 3px;
      font-size: ${ticketWidth === '58mm' ? '12px' : '13px'};
      text-align: center;
      letter-spacing: 0;
    }
    p { margin: 1px 0; overflow-wrap: anywhere; }
    .sep {
      border-top: 1px dashed #222;
      margin: 6px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 5px;
      margin: 2px 0;
    }
    .row span:first-child { flex: 1; }
    .row strong { text-align: right; white-space: nowrap; }
    .small { font-size: 0.92em; }
    .muted { color: #333; }
    .item {
      padding: 4px 0;
      border-bottom: 1px dotted #b7b7b7;
    }
    .item-title {
      display: flex;
      justify-content: space-between;
      gap: 5px;
      font-weight: 700;
    }
    .item-name {
      flex: 1;
      overflow-wrap: anywhere;
    }
    .item-code {
      white-space: nowrap;
      font-size: 0.9em;
      color: #333;
    }
    .item-detail {
      display: grid;
      grid-template-columns: 1.1fr 1fr 1fr 1fr;
      gap: 3px;
      margin-top: 2px;
      font-size: 0.94em;
      text-align: right;
    }
    .item-detail span:first-child { text-align: left; }
    .totals .row {
      font-size: 1em;
    }
    .grand {
      margin-top: 4px;
      padding-top: 5px;
      border-top: 1px solid #111;
      font-size: ${ticketWidth === '58mm' ? '13px' : '15px'};
      font-weight: 800;
    }
    .footer {
      margin-top: 8px;
      text-align: center;
      overflow-wrap: anywhere;
    }
    .actions {
      position: sticky;
      bottom: 0;
      display: flex;
      gap: 6px;
      justify-content: center;
      padding: 8px 0 0;
      background: #fff;
    }
    .actions button {
      min-height: 32px;
      border: 1px solid #111;
      border-radius: 5px;
      background: #fff;
      color: #111;
      padding: 5px 8px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    @media print {
      .actions { display: none; }
      body { width: ${ticketWidth}; }
      .ticket { padding-bottom: 0; }
    }
  </style>
</head>
<body>
  <main class="ticket">
    <section class="center">
      ${companyBlock(settings)}
    </section>
    <div class="sep"></div>
    <h2>FACTURA</h2>
    <section>
      <div class="row"><span>No.</span><strong>${escapeHtml(invoice?.number || '')}</strong></div>
      <div class="row"><span>Fecha</span><strong>${escapeHtml(invoice?.date || '')}</strong></div>
      <div class="row"><span>Hora</span><strong>${escapeHtml(new Date(invoice?.createdAt || Date.now()).toLocaleTimeString('es-DO'))}</strong></div>
      <div class="row"><span>Cajero</span><strong>${escapeHtml(invoice?.seller || 'Caja')}</strong></div>
      <div class="row"><span>Sucursal</span><strong>${escapeHtml(invoice?.branch || '')}</strong></div>
      <div class="row"><span>Almacen</span><strong>${escapeHtml(invoice?.warehouse || '')}</strong></div>
      ${fiscal ? `
        <div class="row"><span>Tipo</span><strong>${escapeHtml(invoice?.tipoComprobante || invoice?.receiptType || '')}</strong></div>
        <div class="row"><span>NCF</span><strong>${escapeHtml(invoice?.ncf || '')}</strong></div>
        ${invoice?.ncfValidoHasta || invoice?.ncfValidUntil ? `<div class="row"><span>Valido hasta</span><strong>${escapeHtml(invoice.ncfValidoHasta || invoice.ncfValidUntil)}</strong></div>` : ''}
      ` : ''}
    </section>
    <div class="sep"></div>
    <section>
      <p><strong>Cliente:</strong> ${escapeHtml(invoice?.customer || 'Consumidor Final')}</p>
      ${invoice?.fiscalId ? `<p><strong>RNC:</strong> ${escapeHtml(invoice.fiscalId)}</p>` : ''}
      ${invoice?.phone ? `<p><strong>Tel:</strong> ${escapeHtml(invoice.phone)}</p>` : ''}
      ${invoice?.address ? `<p><strong>Dir:</strong> ${escapeHtml(invoice.address)}</p>` : ''}
      ${invoice?.paymentCondition ? `<p><strong>Condicion:</strong> ${escapeHtml(invoice.paymentCondition)}</p>` : ''}
    </section>
    <div class="sep"></div>
    <section>
      ${lines.map((line) => `
        <article class="item">
          <div class="item-title">
            <span class="item-name">${escapeHtml(line.name || line.description || 'Producto')}</span>
            <span class="item-code">${escapeHtml(line.code || '')}</span>
          </div>
          <div class="item-detail">
            <span>${quantity(line.quantity)} x ${money(line.price, settings)}</span>
            <span>ITBIS ${money(lineTax(line), settings)}</span>
            <span>Desc. ${money(lineDiscount(line), settings)}</span>
            <strong>${money(lineTotal(line), settings)}</strong>
          </div>
        </article>
      `).join('')}
    </section>
    <section class="totals">
      <div class="sep"></div>
      <div class="row"><span>Subtotal</span><strong>${money(totals.subtotal, settings)}</strong></div>
      ${totals.discountTotal > 0 ? `<div class="row"><span>Descuento</span><strong>${money(totals.discountTotal, settings)}</strong></div>` : ''}
      <div class="row"><span>ITBIS</span><strong>${money(totals.taxTotal, settings)}</strong></div>
      <div class="row grand"><span>TOTAL</span><strong>${money(totals.total, settings)}</strong></div>
      <div class="row"><span>Forma de pago</span><strong>${escapeHtml(invoice?.paymentMethod || '')}</strong></div>
      <div class="row"><span>Recibido</span><strong>${money(totals.paid, settings)}</strong></div>
      ${totals.change > 0 ? `<div class="row"><span>Devuelta</span><strong>${money(totals.change, settings)}</strong></div>` : ''}
      ${totals.balance > 0 ? `<div class="row"><span>Balance</span><strong>${money(totals.balance, settings)}</strong></div>` : ''}
    </section>
    <div class="sep"></div>
    <section class="footer">
      <p>${escapeHtml(settings?.billing?.footerMessage || 'Gracias por su compra.')}</p>
      ${settings?.company?.legalNote ? `<p>${escapeHtml(settings.company.legalNote)}</p>` : ''}
      <p><strong>Gracias por su compra</strong></p>
      <p class="small muted">Impreso por ${escapeHtml(invoice?.seller || 'Caja')} - ${escapeHtml(printedAt)}</p>
    </section>
    <div class="actions">
      <button type="button" onclick="window.print()">Imprimir</button>
      <button type="button" onclick="window.close()">Cerrar</button>
    </div>
  </main>
</body>
</html>`
}

export function openThermalTicket(invoice, settings = {}, options = {}) {
  if (typeof window === 'undefined') return null
  const html = createThermalTicketHtml(invoice, settings, options)
  const popup = window.open('', '_blank', 'width=420,height=720')
  if (!popup) return null

  popup.document.open()
  popup.document.write(html)
  popup.document.close()

  if (options.autoPrint) {
    popup.setTimeout(() => {
      popup.focus()
      popup.print()
    }, 300)
  }

  return popup
}
