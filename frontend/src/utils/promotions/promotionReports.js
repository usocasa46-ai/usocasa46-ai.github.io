import { getPromotionLifecycleStatus, normalizePromotion } from './promotionValidator.js'

function toNumber(value) {
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function invoiceLines(invoice) {
  return Array.isArray(invoice?.lines)
    ? invoice.lines
    : Array.isArray(invoice?.products)
      ? invoice.products
      : []
}

export function buildPromotionReports({ promotions = [], usage = [], invoices = [], products = [] }) {
  const normalized = promotions.map(normalizePromotion)
  const totalDiscount = usage.reduce((sum, record) => sum + toNumber(record.discountAmount || record.discount_amount), 0)
  const totalSales = usage.reduce((sum, record) => sum + toNumber(record.totalAfter || record.total_after), 0)
  const lifecycleRows = normalized.map((promotion) => ({
    ...promotion,
    lifecycleStatus: getPromotionLifecycleStatus(promotion),
  }))
  const usageByPromotion = new Map()
  const usageByCustomer = new Map()

  usage.forEach((record) => {
    const promotionId = record.promotionId || record.promotion_id
    const current = usageByPromotion.get(promotionId) || {
      id: promotionId,
      name: record.promotionName || record.promotion_name || 'Oferta',
      uses: 0,
      discounted: 0,
      sales: 0,
    }
    current.uses += 1
    current.discounted += toNumber(record.discountAmount || record.discount_amount)
    current.sales += toNumber(record.totalAfter || record.total_after)
    usageByPromotion.set(promotionId, current)

    const customer = record.customer || record.customerName || record.customer_id || 'Consumidor final'
    const customerRow = usageByCustomer.get(customer) || { customer, uses: 0, savings: 0 }
    customerRow.uses += 1
    customerRow.savings += toNumber(record.discountAmount || record.discount_amount)
    usageByCustomer.set(customer, customerRow)
  })

  const soldByProduct = new Map()
  invoices.forEach((invoice) => {
    invoiceLines(invoice).forEach((line) => {
      const code = String(line.code || line.productCode || '').trim()
      if (!code) return
      const current = soldByProduct.get(code) || { quantity: 0, lastSale: '' }
      current.quantity += toNumber(line.quantity)
      current.lastSale = [current.lastSale, invoice.date || invoice.createdAt || ''].sort().at(-1) || ''
      soldByProduct.set(code, current)
    })
  })

  const suggestions = products.flatMap((product) => {
    const code = String(product.code || '').trim()
    const sales = soldByProduct.get(code)
    const stock = toNumber(product.stock)
    const daysSinceSale = sales?.lastSale
      ? Math.floor((Date.now() - new Date(sales.lastSale).getTime()) / 86400000)
      : null
    const rows = []

    if (stock > 0 && !sales) {
      rows.push({
        id: `${code}-zero`,
        title: `${product.name || code} tiene venta cero`,
        detail: 'Sugerencia: descuento de liquidacion o promocion 2x1 antes de recomprar.',
      })
    }
    if (stock > toNumber(product.minStock) * 3 && sales && sales.quantity <= 2) {
      rows.push({
        id: `${code}-stock`,
        title: `${product.name || code} tiene stock alto y movimiento bajo`,
        detail: 'Sugerencia: combo, precio especial o campana por categoria.',
      })
    }
    if (daysSinceSale !== null && daysSinceSale >= 60) {
      rows.push({
        id: `${code}-slow`,
        title: `${product.name || code} lleva ${daysSinceSale} dias sin venta`,
        detail: 'Sugerencia: revisar precio y activar oferta temporal.',
      })
    }
    return rows
  }).slice(0, 12)

  return {
    kpis: {
      active: lifecycleRows.filter((promotion) => promotion.lifecycleStatus === 'Activa').length,
      scheduled: lifecycleRows.filter((promotion) => promotion.lifecycleStatus === 'Programada').length,
      expired: lifecycleRows.filter((promotion) => promotion.lifecycleStatus === 'Vencida').length,
      totalDiscount,
      totalSales,
      uses: usage.length,
    },
    offersRows: lifecycleRows,
    topPromotions: Array.from(usageByPromotion.values()).sort((left, right) => right.uses - left.uses),
    customerSavings: Array.from(usageByCustomer.values()).sort((left, right) => right.savings - left.savings),
    suggestions,
  }
}

export function promotionExportRows(promotions = []) {
  return promotions.map((promotion) => {
    const row = normalizePromotion(promotion)
    return {
      Nombre: row.name,
      Tipo: row.type,
      Estado: getPromotionLifecycleStatus(row),
      Inicio: row.startDate,
      Fin: row.endDate,
      Cupon: row.couponCode,
      Prioridad: row.priority,
      Combinable: row.stackable ? 'Si' : 'No',
      Usos: row.usedCount,
      Productos: row.products.join(', '),
      Categorias: row.categories.join(', '),
    }
  })
}

export function promotionUsageExportRows(usage = []) {
  return usage.map((record) => ({
    Oferta: record.promotionName || record.promotion_name || '',
    Factura: record.invoiceNumber || record.invoice_id || '',
    Origen: record.source || '',
    Cliente: record.customer || record.customer_id || '',
    Descuento: toNumber(record.discountAmount || record.discount_amount),
    TotalAntes: toNumber(record.totalBefore || record.total_before),
    TotalDespues: toNumber(record.totalAfter || record.total_after),
    Usuario: record.userId || record.user_id || '',
    Fecha: record.createdAt || record.created_at || '',
  }))
}

