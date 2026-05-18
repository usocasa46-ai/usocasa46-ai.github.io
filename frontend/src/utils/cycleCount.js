import { readProducts, readStorageArray, toNumber, writeStorageArray } from './alertsEngine.js'

export const CYCLE_COUNTS_KEY = 'invefat_cycle_counts'
export const ADJUSTMENTS_KEY = 'invefat_inventory_adjustments'
export const MOVEMENTS_KEY = 'invefat_inventory_movements'
export const PRODUCTS_KEY = 'inveFatInventoryProducts'

export function nextCycleCountNumber(records) {
  const highest = records.reduce((max, record) => {
    const match = String(record.number || '').match(/(\d+)$/)
    return Math.max(max, match ? Number(match[1]) : 0)
  }, 0)
  return `CC-${String(highest + 1).padStart(6, '0')}`
}

export function selectCycleProducts(criteria = 'Todos', value = '') {
  const products = readProducts()
  if (criteria === 'Categoria' && value) return products.filter((product) => product.category === value)
  if (criteria === 'Proveedor' && value) return products.filter((product) => product.supplierCode === value || product.supplierName === value)
  if (criteria === 'Stock bajo') return products.filter((product) => product.minStock > 0 && product.stock <= product.minStock)
  return products
}

export function applyCycleCount(record) {
  const products = readStorageArray(PRODUCTS_KEY)
  const movements = readStorageArray(MOVEMENTS_KEY)
  const adjustments = readStorageArray(ADJUSTMENTS_KEY)
  const appliedAt = new Date().toISOString()
  const adjustmentNumber = `AJ-${String(adjustments.length + 1).padStart(6, '0')}`
  const adjustmentLines = []

  const nextProducts = products.map((product) => {
    const line = (record.lines || []).find((item) => item.code === product.code)
    if (!line) return product
    const systemStock = toNumber(line.systemStock)
    const physicalStock = toNumber(line.physicalStock)
    const difference = physicalStock - systemStock
    if (difference === 0) return product

    adjustmentLines.push({
      productCode: product.code,
      productName: product.name,
      quantity: Math.abs(difference),
      difference,
      unit: product.unit,
    })
    movements.unshift({
      id: `cycle-movement-${record.number}-${product.code}-${Date.now()}`,
      date: appliedAt,
      type: difference > 0 ? 'Ajuste por conteo ciclico - Entrada' : 'Ajuste por conteo ciclico - Salida',
      document: record.number,
      productCode: product.code,
      productName: product.name,
      warehouse: record.warehouse,
      entry: difference > 0 ? Math.abs(difference) : 0,
      exit: difference < 0 ? Math.abs(difference) : 0,
      balance: physicalStock,
      user: record.responsible,
      reference: 'Conteo ciclico',
    })
    return { ...product, stock: physicalStock, updatedAt: appliedAt }
  })

  if (adjustmentLines.length > 0) {
    adjustments.unshift({
      id: `cycle-adjustment-${record.number}`,
      number: adjustmentNumber,
      date: appliedAt,
      type: 'Correccion',
      reason: 'Conteo ciclico',
      status: 'Aplicado',
      user: record.responsible,
      warehouse: record.warehouse,
      relatedCount: record.number,
      lines: adjustmentLines,
    })
  }

  writeStorageArray(PRODUCTS_KEY, nextProducts)
  writeStorageArray(MOVEMENTS_KEY, movements)
  writeStorageArray(ADJUSTMENTS_KEY, adjustments)
}
