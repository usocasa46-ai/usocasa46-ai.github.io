function toNumber(value) {
  const numericValue = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(numericValue) ? numericValue : 0
}

function cleanText(value) {
  return String(value ?? '').trim().toLowerCase()
}

function readDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function getRecordDate(record) {
  return readDate(record?.date || record?.fecha || record?.createdAt || record?.created_at || record?.fechaEmision || record?.fechaRecepcion || record?.issueDate)
}

function normalizeStatus(value) {
  return String(value || 'Pendiente').trim()
}

function inRange(record, filters = {}) {
  const date = getRecordDate(record)
  const from = filters.from ? new Date(`${filters.from}T00:00:00`) : null
  const to = filters.to ? new Date(`${filters.to}T23:59:59`) : null
  if (!date) return true
  if (from && date < from) return false
  if (to && date > to) return false
  return true
}

function arrayFromLines(record) {
  const candidates = [
    record?.items,
    record?.lines,
    record?.products,
    record?.details,
    record?.detalle,
    record?.productos,
  ]
  const list = candidates.find(Array.isArray)
  return Array.isArray(list) ? list : []
}

function productCodeOf(line) {
  return String(line?.productCode || line?.code || line?.codigo || line?.sku || line?.id || '').trim()
}

function productNameOf(line) {
  return String(line?.productName || line?.name || line?.nombre || line?.description || line?.descripcion || '').trim()
}

function lineQuantity(line) {
  return toNumber(line?.quantity ?? line?.qty ?? line?.cantidad ?? line?.receivedQuantity ?? line?.received ?? 0)
}

function linePrice(line) {
  return toNumber(line?.price ?? line?.unitPrice ?? line?.precio ?? line?.precioUnitario ?? line?.cost ?? line?.costo ?? 0)
}

function lineTotal(line) {
  const explicit = toNumber(line?.total ?? line?.subtotal ?? line?.amount ?? line?.monto)
  return explicit || lineQuantity(line) * linePrice(line)
}

function normalizeProducts(products = []) {
  return (Array.isArray(products) ? products : []).map((product) => ({
    ...product,
    code: String(product.code || product.codigo || product.id || '').trim(),
    name: String(product.name || product.nombre || product.description || '').trim(),
    category: String(product.category || product.categoria || 'Sin categoria').trim(),
    supplierCode: String(product.supplierCode || product.providerCode || product.proveedorCodigo || '').trim(),
    supplierName: String(product.supplierName || product.providerName || product.supplier || product.proveedor || '').trim(),
    cost: toNumber(product.cost || product.costo || product.averageCost || product.costoPromedio),
    price: toNumber(product.price || product.precio || product.salePrice || product.precioVenta),
    stock: toNumber(product.stock || product.existencia || product.quantity),
    minStock: toNumber(product.minStock || product.stockMinimo || product.minimumStock),
    warehouse: String(product.warehouse || product.almacen || '').trim(),
    createdAt: product.createdAt || product.created_at || product.fechaCreacion || '',
  })).filter((product) => product.code || product.name)
}

function supplierLabel(supplier) {
  return supplier?.commercialName || supplier?.legalName || supplier?.name || supplier?.nombre || supplier?.supplier || supplier?.code || 'N/D'
}

function normalizeSuppliers(suppliers = []) {
  return (Array.isArray(suppliers) ? suppliers : []).map((supplier) => ({
    ...supplier,
    code: String(supplier.code || supplier.codigo || supplier.id || '').trim(),
    name: supplierLabel(supplier),
    category: supplier.category || supplier.categoria || 'General',
    status: supplier.status || supplier.estado || 'Activo',
  }))
}

function matchesFilters(product, filters = {}) {
  const query = cleanText(filters.product)
  const supplier = cleanText(filters.supplier)
  const category = cleanText(filters.category)
  const warehouse = cleanText(filters.warehouse)

  if (query && ![product.code, product.name].some((value) => cleanText(value).includes(query))) return false
  if (category && category !== 'todos' && cleanText(product.category) !== category) return false
  if (supplier && supplier !== 'todos' && ![product.supplierCode, product.supplierName].some((value) => cleanText(value) === supplier)) return false
  if (warehouse && warehouse !== 'todos' && cleanText(product.warehouse) !== warehouse) return false
  return true
}

function addSaleMetrics(productMap, invoices = [], filters = {}) {
  ;(Array.isArray(invoices) ? invoices : []).filter((invoice) => inRange(invoice, filters)).forEach((invoice) => {
    const status = cleanText(invoice.status || invoice.state || invoice.estado)
    if (status.includes('anulad')) return

    arrayFromLines(invoice).forEach((line) => {
      const code = productCodeOf(line)
      const key = code || productNameOf(line)
      if (!key) return
      if (!productMap.has(key)) {
        productMap.set(key, {
          code,
          name: productNameOf(line) || code,
          category: 'Sin categoria',
          supplierCode: '',
          supplierName: '',
          cost: 0,
          price: linePrice(line),
          stock: 0,
          minStock: 0,
        })
      }
      const product = productMap.get(key)
      const quantity = lineQuantity(line)
      const revenue = lineTotal(line)
      product.soldQuantity = toNumber(product.soldQuantity) + quantity
      product.revenue = toNumber(product.revenue) + revenue
      product.estimatedCost = toNumber(product.estimatedCost) + quantity * toNumber(product.cost)
      const saleDate = getRecordDate(invoice)
      if (saleDate && (!product.lastSaleDate || saleDate > product.lastSaleDate)) product.lastSaleDate = saleDate
    })
  })
}

function addPurchaseMetrics(productMap, purchaseOrders = [], supplierInvoices = [], receipts = [], filters = {}) {
  const records = [...(purchaseOrders || []), ...(supplierInvoices || []), ...(receipts || [])].filter((record) => inRange(record, filters))
  records.forEach((record) => {
    arrayFromLines(record).forEach((line) => {
      const code = productCodeOf(line)
      const key = code || productNameOf(line)
      if (!key) return
      if (!productMap.has(key)) {
        productMap.set(key, {
          code,
          name: productNameOf(line) || code,
          category: 'Sin categoria',
          supplierCode: record.supplierCode || record.proveedorCodigo || '',
          supplierName: record.supplier || record.supplierName || record.proveedor || '',
          cost: linePrice(line),
          price: 0,
          stock: 0,
          minStock: 0,
        })
      }
      const product = productMap.get(key)
      product.purchasedQuantity = toNumber(product.purchasedQuantity) + lineQuantity(line)
      product.purchasedAmount = toNumber(product.purchasedAmount) + lineTotal(line)
      if (!product.supplierName) product.supplierName = record.supplier || record.supplierName || record.proveedor || ''
      if (!product.supplierCode) product.supplierCode = record.supplierCode || record.proveedorCodigo || ''
    })
  })
}

function productStatus(row) {
  if (row.stock <= row.minStock && row.minStock > 0) return 'Stock critico'
  if (!row.soldQuantity && row.stock > 0) return 'Sin venta'
  if (row.soldQuantity >= 50) return 'Alto movimiento'
  if (row.soldQuantity >= 10) return 'Movimiento medio'
  return 'Bajo movimiento'
}

function buildProductRows(products, invoices, purchaseOrders, supplierInvoices, receipts, filters) {
  const productMap = new Map()
  normalizeProducts(products).forEach((product) => {
    productMap.set(product.code || product.name, {
      ...product,
      soldQuantity: 0,
      revenue: 0,
      estimatedCost: 0,
      purchasedQuantity: 0,
      purchasedAmount: 0,
      lastSaleDate: null,
    })
  })

  addSaleMetrics(productMap, invoices, filters)
  addPurchaseMetrics(productMap, purchaseOrders, supplierInvoices, receipts, filters)

  return Array.from(productMap.values())
    .filter((product) => matchesFilters(product, filters))
    .map((product) => {
      const estimatedCost = toNumber(product.estimatedCost) || toNumber(product.soldQuantity) * toNumber(product.cost)
      const margin = toNumber(product.revenue) - estimatedCost
      return {
        code: product.code || 'N/D',
        product: product.name || product.code || 'Producto',
        supplier: product.supplierName || product.supplierCode || 'Sin proveedor',
        category: product.category || 'Sin categoria',
        quantitySold: toNumber(product.soldQuantity),
        revenue: toNumber(product.revenue),
        estimatedCost,
        margin,
        lastSale: product.lastSaleDate ? product.lastSaleDate.toISOString().slice(0, 10) : 'Sin venta',
        stock: toNumber(product.stock),
        minStock: toNumber(product.minStock),
        purchasedQuantity: toNumber(product.purchasedQuantity),
        purchasedAmount: toNumber(product.purchasedAmount),
        status: productStatus({ ...product, estimatedCost, margin }),
      }
    })
}

function buildSupplierRows(suppliers, purchaseOrders = [], receipts = [], filters = {}) {
  const supplierMap = new Map()
  normalizeSuppliers(suppliers).forEach((supplier) => {
    supplierMap.set(supplier.code || supplier.name, {
      supplier: supplier.name,
      code: supplier.code,
      ordersGenerated: 0,
      ordersReceived: 0,
      completeReceipts: 0,
      partialReceipts: 0,
      delayedReceipts: 0,
      totalPurchased: 0,
      totalDays: 0,
      deliverySamples: 0,
    })
  })

  const ordersByNumber = new Map()
  ;(purchaseOrders || []).filter((order) => inRange(order, filters)).forEach((order) => {
    const key = order.supplierCode || order.supplier || order.supplierName || order.proveedor || 'Sin proveedor'
    if (!supplierMap.has(key)) {
      supplierMap.set(key, {
        supplier: order.supplier || order.supplierName || order.proveedor || key,
        code: order.supplierCode || '',
        ordersGenerated: 0,
        ordersReceived: 0,
        completeReceipts: 0,
        partialReceipts: 0,
        delayedReceipts: 0,
        totalPurchased: 0,
        totalDays: 0,
        deliverySamples: 0,
      })
    }
    const row = supplierMap.get(key)
    row.ordersGenerated += 1
    row.totalPurchased += toNumber(order.total || order.amount || order.monto) || arrayFromLines(order).reduce((sum, line) => sum + lineTotal(line), 0)
    if (order.number || order.id) ordersByNumber.set(order.number || order.id, order)
  })

  ;(receipts || []).filter((receipt) => inRange(receipt, filters)).forEach((receipt) => {
    const key = receipt.supplierCode || receipt.supplier || receipt.supplierName || receipt.proveedor || 'Sin proveedor'
    if (!supplierMap.has(key)) {
      supplierMap.set(key, {
        supplier: receipt.supplier || receipt.supplierName || receipt.proveedor || key,
        code: receipt.supplierCode || '',
        ordersGenerated: 0,
        ordersReceived: 0,
        completeReceipts: 0,
        partialReceipts: 0,
        delayedReceipts: 0,
        totalPurchased: 0,
        totalDays: 0,
        deliverySamples: 0,
      })
    }

    const row = supplierMap.get(key)
    const status = cleanText(receipt.status || receipt.estado)
    row.ordersReceived += 1
    if (status.includes('parcial')) row.partialReceipts += 1
    else row.completeReceipts += 1

    const order = ordersByNumber.get(receipt.orderNumber || receipt.purchaseOrder || receipt.ordenCompra)
    const orderDate = getRecordDate(order)
    const receiptDate = getRecordDate(receipt)
    if (orderDate && receiptDate) {
      const days = Math.max(0, Math.round((receiptDate - orderDate) / 86400000))
      row.totalDays += days
      row.deliverySamples += 1
      if (days > 7) row.delayedReceipts += 1
    }
  })

  return Array.from(supplierMap.values()).map((row) => {
    const avgDeliveryDays = row.deliverySamples ? row.totalDays / row.deliverySamples : 0
    const compliance = row.ordersGenerated ? Math.min(100, Math.round((row.completeReceipts / row.ordersGenerated) * 100)) : 0
    let status = 'Regular'
    if (compliance >= 90 && avgDeliveryDays <= 3) status = 'Excelente'
    else if (compliance >= 75) status = 'Bueno'
    else if (compliance < 50 && row.ordersGenerated > 0) status = 'Critico'

    return {
      supplier: row.supplier,
      ordersGenerated: row.ordersGenerated,
      ordersReceived: row.ordersReceived,
      completeReceipts: row.completeReceipts,
      partialReceipts: row.partialReceipts,
      avgDeliveryDays,
      totalPurchased: row.totalPurchased,
      compliance,
      status,
    }
  }).filter((row) => row.ordersGenerated || row.ordersReceived || cleanText(filters.supplier) === 'todos' || !filters.supplier)
}

function orderedQuantity(order) {
  return arrayFromLines(order).reduce((sum, line) => sum + lineQuantity(line), 0)
}

function receivedQuantity(receipt) {
  return arrayFromLines(receipt).reduce((sum, line) => sum + lineQuantity(line), 0)
}

function buildReceptionRows(purchaseOrders = [], receipts = [], filters = {}) {
  const ordersByNumber = new Map((purchaseOrders || []).map((order) => [order.number || order.id, order]))
  return (receipts || []).filter((receipt) => inRange(receipt, filters)).map((receipt) => {
    const order = ordersByNumber.get(receipt.orderNumber || receipt.purchaseOrder || receipt.ordenCompra)
    const orderDate = getRecordDate(order)
    const receiptDate = getRecordDate(receipt)
    const ordered = orderedQuantity(order)
    const received = receivedQuantity(receipt)
    const days = orderDate && receiptDate ? Math.max(0, Math.round((receiptDate - orderDate) / 86400000)) : 0
    return {
      number: receipt.number || receipt.id || 'N/D',
      orderNumber: receipt.orderNumber || receipt.purchaseOrder || receipt.ordenCompra || 'N/D',
      supplier: receipt.supplier || receipt.supplierName || receipt.proveedor || order?.supplier || 'N/D',
      ordered,
      received,
      difference: ordered ? ordered - received : 0,
      orderDate: orderDate ? orderDate.toISOString().slice(0, 10) : 'N/D',
      receiptDate: receiptDate ? receiptDate.toISOString().slice(0, 10) : 'N/D',
      elapsedDays: days,
      status: normalizeStatus(receipt.status || receipt.estado),
    }
  }).filter((row) => {
    const status = cleanText(filters.receptionStatus)
    return !status || status === 'todos' || cleanText(row.status) === status
  })
}

function buildAlerts(productRows, supplierRows, receptionRows) {
  const alerts = []
  const slowProducts = productRows.filter((row) => row.status === 'Sin venta' && row.stock > 0)
  const lowFastProducts = productRows.filter((row) => row.status === 'Alto movimiento' && row.stock <= row.minStock && row.minStock > 0)
  const delayedSuppliers = supplierRows.filter((row) => row.status === 'Critico' || row.avgDeliveryDays > 7)
  const partialReceipts = receptionRows.filter((row) => cleanText(row.status).includes('parcial') || row.difference > 0)

  if (slowProducts.length) alerts.push({ type: 'Baja rotacion', message: `${slowProducts.length} productos tienen stock, pero no registran venta en el rango.`, action: 'Revisar precio o crear promocion.' })
  if (lowFastProducts.length) alerts.push({ type: 'Stock bajo', message: `${lowFastProducts.length} productos se venden rapido y estan cerca del minimo.`, action: 'Recomprar o transferir stock.' })
  if (delayedSuppliers.length) alerts.push({ type: 'Proveedor', message: `${delayedSuppliers.length} proveedores muestran retrasos o bajo cumplimiento.`, action: 'Revisar condiciones de compra.' })
  if (partialReceipts.length) alerts.push({ type: 'Recepciones', message: `${partialReceipts.length} recepciones tienen faltantes o estado parcial.`, action: 'Dar seguimiento al proveedor.' })

  if (!alerts.length) alerts.push({ type: 'Analisis', message: 'No hay alertas criticas con los datos disponibles.', action: 'Mantener seguimiento del periodo.' })
  return alerts
}

export function buildPurchaseAnalytics({
  products = [],
  suppliers = [],
  purchaseOrders = [],
  supplierInvoices = [],
  warehouseReceipts = [],
  invoices = [],
  filters = {},
} = {}) {
  const productRows = buildProductRows(products, invoices, purchaseOrders, supplierInvoices, warehouseReceipts, filters)
  const supplierRows = buildSupplierRows(suppliers, purchaseOrders, warehouseReceipts, filters)
  const receptionRows = buildReceptionRows(purchaseOrders, warehouseReceipts, filters)
  const lowRotationRows = productRows
    .filter((row) => ['Bajo movimiento', 'Sin venta', 'Stock critico'].includes(row.status))
    .sort((a, b) => a.quantitySold - b.quantitySold || b.stock - a.stock)
  const topSoldRows = [...productRows].sort((a, b) => b.quantitySold - a.quantitySold || b.revenue - a.revenue)

  const totalBought = productRows.reduce((sum, row) => sum + row.purchasedAmount, 0)
  const totalSold = productRows.reduce((sum, row) => sum + row.revenue, 0)
  const margin = productRows.reduce((sum, row) => sum + row.margin, 0)
  const completeReceipts = receptionRows.filter((row) => !cleanText(row.status).includes('parcial') && row.difference <= 0).length
  const partialReceipts = receptionRows.length - completeReceipts
  const pendingOrders = (purchaseOrders || []).filter((order) => cleanText(order.status || order.estado).includes('pendiente')).length
  const lowStockProducts = productRows.filter((row) => row.status === 'Stock critico').length

  return {
    kpis: {
      totalBought,
      totalSold,
      margin,
      topProducts: topSoldRows.length,
      lowRotation: lowRotationRows.length,
      noSale: productRows.filter((row) => row.quantitySold === 0).length,
      fastestSupplier: supplierRows.filter((row) => row.avgDeliveryDays > 0).sort((a, b) => a.avgDeliveryDays - b.avgDeliveryDays)[0]?.supplier || 'N/D',
      delayedSupplier: supplierRows.sort((a, b) => b.avgDeliveryDays - a.avgDeliveryDays)[0]?.supplier || 'N/D',
      completeReceipts,
      partialReceipts,
      pendingOrders,
      lowStockProducts,
    },
    productRows,
    topSoldRows,
    lowRotationRows,
    supplierRows,
    receptionRows,
    alerts: buildAlerts(productRows, supplierRows, receptionRows),
    hasData: productRows.length > 0 || supplierRows.some((row) => row.ordersGenerated || row.ordersReceived) || receptionRows.length > 0,
  }
}

export function formatAnalyticsCurrency(value) {
  return `RD$ ${toNumber(value).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatAnalyticsNumber(value) {
  return toNumber(value).toLocaleString('es-DO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}
