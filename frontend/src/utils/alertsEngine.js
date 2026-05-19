import { getNcfWarnings } from './ncfGenerator.js'

export const ALERTS_KEY = 'invefat_alerts'
export const PENDING_PURCHASE_ORDER_KEY = 'invefat_pending_purchase_order_from_alert'

const PRODUCTS_KEY = 'inveFatInventoryProducts'
const SUPPLIERS_KEY = 'invefat_suppliers'
const MOVEMENTS_KEY = 'invefat_inventory_movements'
const PURCHASE_ORDERS_KEY = 'invefat_purchase_orders'
const WAREHOUSE_RECEIPTS_KEY = 'invefat_warehouse_receipts'
const SUPPLIER_INVOICES_KEY = 'invefat_supplier_invoices'
const SALES_INVOICES_KEY = 'invefat_sales_invoices'
const CYCLE_COUNTS_KEY = 'invefat_cycle_counts'

export function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readStorageArray(key, fallback = []) {
  if (!canUseStorage()) return fallback
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : fallback
  } catch {
    return fallback
  }
}

export function writeStorageArray(key, value) {
  if (!canUseStorage()) return
  localStorage.setItem(key, JSON.stringify(value))
}

export function toNumber(value) {
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export function cleanText(value) {
  return String(value ?? '').toLowerCase().trim()
}

export function nowIso() {
  return new Date().toISOString()
}

function makeId(parts) {
  return parts.filter(Boolean).join('-').replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()
}

export function normalizeProduct(product) {
  const supplierCode = String(
    product.supplierCode ||
    product.providerCode ||
    product.mainSupplierCode ||
    product.supplierId ||
    product.providerId ||
    ''
  ).trim()
  const supplierName = String(
    product.supplierName ||
    product.providerName ||
    product.mainSupplier ||
    product.supplier ||
    product.provider ||
    ''
  ).trim()

  return {
    ...product,
    code: String(product.code || '').trim(),
    name: String(product.name || '').trim(),
    category: String(product.category || '').trim(),
    unit: String(product.unit || 'Unidad').trim(),
    cost: toNumber(product.cost),
    stock: toNumber(product.stock),
    minStock: toNumber(product.minStock ?? product.stockMin ?? product.minimumStock),
    maxStock: toNumber(product.maxStock ?? product.stockMax ?? product.maximumStock),
    supplierCode,
    supplierName,
    status: product.status || 'Activo',
  }
}

export function readProducts() {
  return readStorageArray(PRODUCTS_KEY).map(normalizeProduct).filter((product) => product.code)
}

export function readSuppliers() {
  return readStorageArray(SUPPLIERS_KEY).map((supplier) => ({
    code: String(supplier.code || '').trim(),
    name: String(supplier.commercialName || supplier.name || supplier.legalName || '').trim(),
  }))
}

export function supplierNameFor(product, suppliers = readSuppliers()) {
  if (product.supplierName) return product.supplierName
  return suppliers.find((supplier) => supplier.code === product.supplierCode)?.name || 'Sin proveedor asignado'
}

export function getProductSupplierKey(product) {
  return product.supplierCode || product.supplierName || 'sin-proveedor'
}

export function isLowStock(product) {
  return product.status !== 'Inactivo' && product.minStock > 0 && product.stock <= product.minStock
}

export function isOutOfStock(product) {
  return product.status !== 'Inactivo' && product.stock <= 0
}

export function getSuggestedQuantity(product) {
  const target = product.maxStock > 0 ? product.maxStock : product.minStock
  return Math.max(1, target - product.stock)
}

function movementDate(movement) {
  const date = new Date(movement.date || movement.createdAt || 0)
  return Number.isNaN(date.getTime()) ? null : date
}

export function buildLowStockGroups(products = readProducts(), suppliers = readSuppliers()) {
  const groups = new Map()
  products.filter(isLowStock).forEach((product) => {
    const key = getProductSupplierKey(product)
    const supplierName = supplierNameFor(product, suppliers)
    const current = groups.get(key) || {
      supplierCode: product.supplierCode,
      supplierName,
      products: [],
      totalSuggestedCost: 0,
      totalSuggestedQuantity: 0,
    }
    const suggestedQuantity = getSuggestedQuantity(product)
    current.products.push({ ...product, suggestedQuantity })
    current.totalSuggestedQuantity += suggestedQuantity
    current.totalSuggestedCost += suggestedQuantity * product.cost
    groups.set(key, current)
  })

  return Array.from(groups.values()).sort((a, b) => b.products.length - a.products.length)
}

export function generateAlertsSnapshot() {
  const products = readProducts()
  const suppliers = readSuppliers()
  const movements = readStorageArray(MOVEMENTS_KEY)
  const purchaseOrders = readStorageArray(PURCHASE_ORDERS_KEY)
  const receipts = readStorageArray(WAREHOUSE_RECEIPTS_KEY)
  const supplierInvoices = readStorageArray(SUPPLIER_INVOICES_KEY)
  const salesInvoices = readStorageArray(SALES_INVOICES_KEY)
  const cycleCounts = readStorageArray(CYCLE_COUNTS_KEY)
  const createdAt = nowIso()
  const alerts = []

  getNcfWarnings().forEach((warning) => {
    alerts.push({
      id: makeId(['ncf', warning.kind, warning.sequence.id]),
      fecha: createdAt,
      tipo: warning.kind === 'por-agotarse' ? 'NCF por agotarse' : warning.kind === 'agotada' ? 'NCF agotado' : warning.kind === 'vencida' ? 'NCF vencido' : 'NCF por vencer',
      modulo: 'Finanzas',
      submodulo: 'Comprobantes fiscales / NCF',
      titulo: warning.sequence.type,
      descripcion: warning.message,
      prioridad: warning.priority,
      referencia: warning.sequence.id,
      accionSugerida: 'Ver secuencia',
      pageId: 'finance-ncf-sequences',
    })
  })

  products.forEach((product) => {
    if (isOutOfStock(product)) {
      alerts.push({
        id: makeId(['stock-agotado', product.code]),
        fecha: createdAt,
        tipo: 'Stock agotado',
        modulo: 'Inventario',
        submodulo: 'Productos',
        titulo: `${product.name} sin stock`,
        descripcion: `El producto ${product.code} tiene stock actual ${product.stock}.`,
        prioridad: 'critica',
        referencia: product.code,
        accionSugerida: 'Crear orden de compra',
      })
    } else if (isLowStock(product)) {
      alerts.push({
        id: makeId(['stock-bajo', product.code]),
        fecha: createdAt,
        tipo: 'Stock bajo',
        modulo: 'Inventario',
        submodulo: 'Productos',
        titulo: `${product.name} bajo minimo`,
        descripcion: `Stock actual ${product.stock}. Minimo ${product.minStock}. Sugerido ${getSuggestedQuantity(product)} ${product.unit}.`,
        prioridad: 'alta',
        referencia: product.code,
        accionSugerida: 'Crear orden de compra',
      })
    }

    if (!product.supplierCode && !product.supplierName) {
      alerts.push({
        id: makeId(['sin-proveedor', product.code]),
        fecha: createdAt,
        tipo: 'Producto sin proveedor',
        modulo: 'Inventario',
        submodulo: 'Productos',
        titulo: `${product.name} sin proveedor principal`,
        descripcion: 'Asigne un proveedor principal para automatizar sugerencias de compra.',
        prioridad: isLowStock(product) ? 'alta' : 'media',
        referencia: product.code,
        accionSugerida: 'Asignar proveedor',
      })
    }
  })

  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000)
  products.forEach((product) => {
    const productMovements = movements.filter((movement) => (
      movement.productCode === product.code ||
      cleanText(movement.productName) === cleanText(product.name)
    ))
    const recentOutputs = productMovements
      .filter((movement) => (movementDate(movement)?.getTime() || 0) >= thirtyDaysAgo)
      .reduce((sum, movement) => sum + toNumber(movement.exit || movement.salida), 0)
    const lastMovement = productMovements
      .map(movementDate)
      .filter(Boolean)
      .sort((a, b) => b.getTime() - a.getTime())[0]

    if (recentOutputs >= Math.max(10, product.minStock || 0)) {
      alerts.push({
        id: makeId(['alta-rotacion', product.code]),
        fecha: createdAt,
        tipo: 'Producto alta rotacion',
        modulo: 'Inventario',
        submodulo: 'Rotacion',
        titulo: `${product.name} con alta rotacion`,
        descripcion: `Salidas recientes: ${recentOutputs}. Revise abastecimiento.`,
        prioridad: isLowStock(product) ? 'alta' : 'media',
        referencia: product.code,
        accionSugerida: isLowStock(product) ? 'Crear orden de compra' : 'Revisar reposicion',
      })
    }

    if (lastMovement && lastMovement.getTime() < ninetyDaysAgo) {
      alerts.push({
        id: makeId(['baja-rotacion', product.code]),
        fecha: createdAt,
        tipo: 'Producto baja rotacion',
        modulo: 'Inventario',
        submodulo: 'Rotacion',
        titulo: `${product.name} con baja rotacion`,
        descripcion: `Ultimo movimiento: ${lastMovement.toISOString().slice(0, 10)}.`,
        prioridad: 'media',
        referencia: product.code,
        accionSugerida: 'Revisar demanda',
      })
    }

    if (!lastMovement) {
      alerts.push({
        id: makeId(['sin-movimiento', product.code]),
        fecha: createdAt,
        tipo: 'Producto sin movimiento',
        modulo: 'Inventario',
        submodulo: 'Rotacion',
        titulo: `${product.name} sin movimientos`,
        descripcion: 'No se encontraron movimientos registrados para este producto.',
        prioridad: 'media',
        referencia: product.code,
        accionSugerida: 'Programar conteo ciclico',
      })
    }
  })

  products.forEach((product) => {
    const counted = cycleCounts.some((count) => (count.lines || []).some((line) => line.code === product.code))
    if (!counted) {
      alerts.push({
        id: makeId(['conteo-pendiente', product.code]),
        fecha: createdAt,
        tipo: 'Conteo ciclico pendiente',
        modulo: 'Inventario',
        submodulo: 'Conteo ciclico',
        titulo: `${product.name} pendiente de conteo`,
        descripcion: 'Producto sin conteo ciclico registrado.',
        prioridad: 'baja',
        referencia: product.code,
        accionSugerida: 'Crear plan de conteo',
      })
    }
  })

  purchaseOrders
    .filter((order) => ['Borrador', 'Pendiente', 'Aprobada', 'Parcialmente recibida'].includes(order.status))
    .forEach((order) => {
      alerts.push({
        id: makeId(['orden-pendiente', order.number]),
        fecha: order.updatedAt || order.date || createdAt,
        tipo: 'Orden de compra pendiente',
        modulo: 'Compras',
        submodulo: 'Ordenes de compra',
        titulo: `${order.number} pendiente`,
        descripcion: `Proveedor: ${order.supplier || order.supplierCode || 'N/D'}. Estado: ${order.status}.`,
        prioridad: order.status === 'Parcialmente recibida' ? 'alta' : 'media',
        referencia: order.number,
        accionSugerida: 'Dar seguimiento',
      })
    })

  receipts
    .filter((receipt) => receipt.status === 'Parcial')
    .forEach((receipt) => {
      alerts.push({
        id: makeId(['recepcion-parcial', receipt.number]),
        fecha: receipt.updatedAt || receipt.date || createdAt,
        tipo: 'Recepcion parcial',
        modulo: 'Almacen',
        submodulo: 'Recepcion de mercancia',
        titulo: `${receipt.number} parcial`,
        descripcion: `Orden relacionada: ${receipt.purchaseOrder || 'N/D'}.`,
        prioridad: 'media',
        referencia: receipt.number,
        accionSugerida: 'Completar recepcion',
      })
    })

  supplierInvoices
    .filter((invoice) => ['Pendiente de pago', 'Parcial', 'Vencida'].includes(invoice.status))
    .forEach((invoice) => {
      alerts.push({
        id: makeId(['factura-proveedor-pendiente', invoice.number]),
        fecha: invoice.dueDate || invoice.date || createdAt,
        tipo: 'Factura pendiente de pago',
        modulo: 'Compras',
        submodulo: 'Cuentas por pagar',
        titulo: `${invoice.number} pendiente`,
        descripcion: `Proveedor: ${invoice.supplier || invoice.supplierCode || 'N/D'}.`,
        prioridad: 'media',
        referencia: invoice.number,
        accionSugerida: 'Registrar pago',
      })
    })

  salesInvoices
    .filter((invoice) => toNumber(invoice.balance || invoice.pendingBalance) > 0)
    .forEach((invoice) => {
      alerts.push({
        id: makeId(['cliente-balance', invoice.number]),
        fecha: invoice.date || createdAt,
        tipo: 'Cliente con balance pendiente',
        modulo: 'Ventas',
        submodulo: 'Cuentas por cobrar',
        titulo: `${invoice.customer || 'Cliente'} con balance`,
        descripcion: `Factura ${invoice.number}. Balance ${toNumber(invoice.balance || invoice.pendingBalance)}.`,
        prioridad: 'media',
        referencia: invoice.number,
        accionSugerida: 'Revisar cobro',
      })
    })

  return alerts.map((alert) => ({
    estado: 'pendiente',
    usuario: 'Sistema',
    fechaAtendida: '',
    ...alert,
  }))
}

export function getAlerts() {
  const saved = readStorageArray(ALERTS_KEY)
  const savedById = new Map(saved.map((alert) => [alert.id, alert]))
  const generated = generateAlertsSnapshot().map((alert) => ({
    ...alert,
    ...(savedById.get(alert.id) || {}),
  }))
  const generatedIds = new Set(generated.map((alert) => alert.id))
  const manual = saved.filter((alert) => !generatedIds.has(alert.id))
  const allAlerts = [...generated, ...manual].sort((a, b) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime())
  writeStorageArray(ALERTS_KEY, allAlerts)
  return allAlerts
}

export function setAlertStatus(alertId, estado) {
  const alerts = getAlerts().map((alert) => (
    alert.id === alertId
      ? { ...alert, estado, fechaAtendida: estado === 'pendiente' ? '' : nowIso() }
      : alert
  ))
  writeStorageArray(ALERTS_KEY, alerts)
  return alerts
}

export function preparePurchaseOrderFromProducts(group) {
  if (!canUseStorage()) return
  const payload = {
    supplierCode: group.supplierCode || '',
    supplier: group.supplierName || '',
    source: 'alertas',
    createdAt: nowIso(),
    lines: (group.products || []).map((product) => ({
      productCode: product.code,
      productName: product.name,
      unit: product.unit,
      quantity: getSuggestedQuantity(product),
      cost: product.cost,
      stock: product.stock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      category: product.category,
    })),
  }
  localStorage.setItem(PENDING_PURCHASE_ORDER_KEY, JSON.stringify(payload))
}
