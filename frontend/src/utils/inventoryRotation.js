import { cleanText, readProducts, readStorageArray, toNumber, writeStorageArray } from './alertsEngine.js'

const MOVEMENTS_KEY = 'invefat_inventory_movements'
const SALES_INVOICES_KEY = 'invefat_sales_invoices'
const RECEIPTS_KEY = 'invefat_warehouse_receipts'
const TRANSFERS_KEY = 'invefat_warehouse_transfers'
const ROTATION_ALERTS_KEY = 'invefat_inventory_rotation_alerts'

function parseDate(value) {
  const date = new Date(value || 0)
  return Number.isNaN(date.getTime()) ? null : date
}

function daysSince(value) {
  const date = parseDate(value)
  if (!date) return null
  return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000))
}

function movementRows() {
  const movements = readStorageArray(MOVEMENTS_KEY).map((movement) => ({
    date: movement.date,
    productCode: movement.productCode,
    productName: movement.productName,
    warehouse: movement.warehouse || movement.origin || movement.destination || '',
    entry: toNumber(movement.entry),
    exit: toNumber(movement.exit),
    type: movement.type || 'Movimiento',
    document: movement.document,
  }))

  const sales = readStorageArray(SALES_INVOICES_KEY).flatMap((invoice) => (
    (invoice.lines || invoice.products || []).map((line) => ({
      date: invoice.date,
      productCode: line.code || line.productCode,
      productName: line.name || line.productName,
      warehouse: invoice.warehouse || '',
      entry: 0,
      exit: toNumber(line.quantity),
      type: 'Venta / Factura',
      document: invoice.number,
    }))
  ))

  const receipts = readStorageArray(RECEIPTS_KEY).flatMap((receipt) => (
    (receipt.lines || []).map((line) => ({
      date: receipt.date,
      productCode: line.productCode,
      productName: line.productName,
      warehouse: receipt.warehouse,
      entry: toNumber(line.receivedQuantity || line.quantity),
      exit: 0,
      type: 'Entrada por recepcion',
      document: receipt.number,
    }))
  ))

  const transfers = readStorageArray(TRANSFERS_KEY).flatMap((transfer) => (
    (transfer.lines || []).flatMap((line) => ([
      {
        date: transfer.date,
        productCode: line.productCode,
        productName: line.productName,
        warehouse: transfer.sourceWarehouse,
        entry: 0,
        exit: toNumber(line.quantity),
        type: 'Transferencia salida',
        document: transfer.number,
      },
      {
        date: transfer.date,
        productCode: line.productCode,
        productName: line.productName,
        warehouse: transfer.targetWarehouse,
        entry: toNumber(line.quantity),
        exit: 0,
        type: 'Transferencia entrada',
        document: transfer.number,
      },
    ]))
  ))

  return [...movements, ...sales, ...receipts, ...transfers]
}

export function analyzeInventoryRotation({ from = '', to = '', warehouse = 'Todos' } = {}) {
  const products = readProducts()
  const fromTime = from ? new Date(from).getTime() : null
  const toTime = to ? new Date(to).getTime() : null
  const rows = products.map((product) => {
    const related = movementRows().filter((movement) => {
      const date = parseDate(movement.date)
      const time = date?.getTime() || 0
      const matchesProduct = movement.productCode === product.code || cleanText(movement.productName) === cleanText(product.name)
      const matchesWarehouse = warehouse === 'Todos' || movement.warehouse === warehouse
      return matchesProduct && matchesWarehouse && (!fromTime || time >= fromTime) && (!toTime || time <= toTime)
    })
    const outgoing = related.reduce((sum, movement) => sum + toNumber(movement.exit), 0)
    const incoming = related.reduce((sum, movement) => sum + toNumber(movement.entry), 0)
    const last = related
      .filter((movement) => parseDate(movement.date))
      .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())[0]
    const daysNoMovement = last ? daysSince(last.date) : null
    const rotation = outgoing <= 0
      ? 'Sin movimiento'
      : outgoing >= Math.max(10, product.minStock)
        ? 'Alta'
        : outgoing >= Math.max(3, product.minStock / 2)
          ? 'Media'
          : 'Baja'
    const recommendation = rotation === 'Alta' && product.stock <= product.minStock
      ? 'Reponer urgente'
      : rotation === 'Sin movimiento'
        ? 'Programar conteo ciclico'
        : rotation === 'Baja'
          ? 'Revisar demanda'
          : 'Mantener seguimiento'

    return {
      ...product,
      outgoing,
      incoming,
      lastMovement: last?.date || '',
      daysNoMovement,
      rotation,
      recommendation,
    }
  })

  const alerts = rows
    .filter((row) => ['Baja', 'Sin movimiento'].includes(row.rotation) || (row.rotation === 'Alta' && row.stock <= row.minStock))
    .map((row) => ({
      id: `rotation-${row.code}`,
      productCode: row.code,
      productName: row.name,
      rotation: row.rotation,
      recommendation: row.recommendation,
      createdAt: new Date().toISOString(),
    }))
  writeStorageArray(ROTATION_ALERTS_KEY, alerts)

  return rows
}
