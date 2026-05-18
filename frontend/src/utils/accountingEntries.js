export const ACCOUNTING_KEYS = {
  chart: 'invefat_chart_of_accounts',
  entries: 'invefat_journal_entries',
  settings: 'invefat_accounting_settings',
  customerPayments: 'invefat_customer_payments',
  supplierPayments: 'invefat_supplier_payments',
  salesInvoices: 'invefat_sales_invoices',
  supplierInvoices: 'invefat_supplier_invoices',
  warehouseReceipts: 'invefat_warehouse_receipts',
  banks: 'invefat_banks',
  bankMovements: 'invefat_bank_movements',
  cashBoxes: 'invefat_cash_boxes',
  cashMovements: 'invefat_cash_movements',
}

export const defaultChartOfAccounts = [
  { code: '101-001', name: 'Caja', type: 'Activo', level: 1, parent: '', allowMovement: true, status: 'Activo' },
  { code: '102-001', name: 'Banco', type: 'Activo', level: 1, parent: '', allowMovement: true, status: 'Activo' },
  { code: '103-001', name: 'Cuentas por cobrar', type: 'Activo', level: 1, parent: '', allowMovement: true, status: 'Activo' },
  { code: '104-001', name: 'Inventario', type: 'Activo', level: 1, parent: '', allowMovement: true, status: 'Activo' },
  { code: '201-001', name: 'Cuentas por pagar', type: 'Pasivo', level: 1, parent: '', allowMovement: true, status: 'Activo' },
  { code: '202-001', name: 'ITBIS por pagar', type: 'Pasivo', level: 1, parent: '', allowMovement: true, status: 'Activo' },
  { code: '203-001', name: 'ITBIS adelantado', type: 'Activo', level: 1, parent: '', allowMovement: true, status: 'Activo' },
  { code: '301-001', name: 'Capital', type: 'Capital', level: 1, parent: '', allowMovement: false, status: 'Activo' },
  { code: '401-001', name: 'Ventas', type: 'Ingreso', level: 1, parent: '', allowMovement: true, status: 'Activo' },
  { code: '501-001', name: 'Compras', type: 'Costo', level: 1, parent: '', allowMovement: true, status: 'Activo' },
  { code: '502-001', name: 'Costo de venta', type: 'Costo', level: 1, parent: '', allowMovement: true, status: 'Activo' },
  { code: '601-001', name: 'Gastos generales', type: 'Gasto', level: 1, parent: '', allowMovement: true, status: 'Activo' },
]

export const defaultAccountingSettings = {
  sales: {
    salesAccount: '401-001',
    taxPayableAccount: '202-001',
    receivableAccount: '103-001',
    cashBankAccount: '101-001',
    salesDiscountAccount: '601-001',
  },
  purchases: {
    purchaseInventoryAccount: '104-001',
    taxCreditAccount: '203-001',
    payableAccount: '201-001',
    withholdingAccount: '201-001',
  },
  inventory: {
    inventoryAccount: '104-001',
    costOfGoodsAccount: '502-001',
    adjustmentsAccount: '601-001',
  },
}

export function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readStorage(key, fallback = []) {
  if (!canUseStorage()) return fallback
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : fallback
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export function writeStorage(key, value) {
  if (!canUseStorage()) return value
  localStorage.setItem(key, JSON.stringify(value))
  return value
}

export function readArray(key, fallback = []) {
  const value = readStorage(key, fallback)
  return Array.isArray(value) ? value : fallback
}

export function toNumber(value) {
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export function currency(value) {
  return `RD$ ${toNumber(value).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function today() {
  return new Date().toISOString().slice(0, 10)
}

export function nowIso() {
  return new Date().toISOString()
}

export function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

export function nextDocument(records, prefix, field = 'number') {
  const highest = records.reduce((max, record) => {
    const match = String(record[field] || '').match(/(\d+)$/)
    return Math.max(max, match ? Number(match[1]) : 0)
  }, 0)
  return `${prefix}-${String(highest + 1).padStart(6, '0')}`
}

export function getChartOfAccounts() {
  const saved = readArray(ACCOUNTING_KEYS.chart)
  if (saved.length > 0) return saved
  writeStorage(ACCOUNTING_KEYS.chart, defaultChartOfAccounts)
  return defaultChartOfAccounts
}

export function getAccountingSettings() {
  return {
    ...defaultAccountingSettings,
    ...readStorage(ACCOUNTING_KEYS.settings, {}),
  }
}

export function getJournalEntries() {
  return readArray(ACCOUNTING_KEYS.entries)
}

export function saveJournalEntries(entries) {
  return writeStorage(ACCOUNTING_KEYS.entries, entries)
}

export function calculateEntryTotals(lines = []) {
  return lines.reduce((totals, line) => ({
    debit: totals.debit + toNumber(line.debit),
    credit: totals.credit + toNumber(line.credit),
  }), { debit: 0, credit: 0 })
}

export function appendJournalEntry(entry) {
  const entries = getJournalEntries()
  const normalized = {
    id: entry.id || makeId('journal'),
    number: entry.number || nextDocument(entries, 'ASI'),
    date: entry.date || today(),
    description: entry.description || '',
    sourceModule: entry.sourceModule || 'Finanzas',
    sourceDocument: entry.sourceDocument || '',
    status: entry.status || 'Borrador',
    user: entry.user || 'Administrador',
    lines: Array.isArray(entry.lines) ? entry.lines : [],
    createdAt: entry.createdAt || nowIso(),
    updatedAt: nowIso(),
  }
  saveJournalEntries([normalized, ...entries.filter((item) => item.number !== normalized.number)])
  return normalized
}

export function createSalesInvoiceEntry(invoice, forceDraft = false) {
  const settings = getAccountingSettings()
  const total = toNumber(invoice.totals?.total || invoice.total)
  const tax = toNumber(invoice.totals?.taxTotal || invoice.taxTotal)
  const subtotal = Math.max(total - tax, 0)
  if (total <= 0) return null

  return appendJournalEntry({
    description: `Factura de venta ${invoice.number}`,
    sourceModule: 'Ventas',
    sourceDocument: invoice.number,
    status: forceDraft ? 'Borrador' : 'Contabilizado',
    lines: [
      { account: settings.sales.receivableAccount, description: `Cliente ${invoice.customer || ''}`, debit: total, credit: 0 },
      { account: settings.sales.salesAccount, description: 'Venta facturada', debit: 0, credit: subtotal },
      { account: settings.sales.taxPayableAccount, description: 'ITBIS por pagar', debit: 0, credit: tax },
    ],
  })
}

export function createSupplierInvoiceEntry(invoice, forceDraft = false) {
  const settings = getAccountingSettings()
  const total = toNumber(invoice.total || invoice.totals?.total || invoice.amount)
  const tax = toNumber(invoice.tax || invoice.itbis || invoice.totals?.taxTotal)
  const base = Math.max(total - tax, 0)
  if (total <= 0) return null

  return appendJournalEntry({
    description: `Factura proveedor ${invoice.supplierInvoiceNumber || invoice.number}`,
    sourceModule: 'Compras',
    sourceDocument: invoice.supplierInvoiceNumber || invoice.number,
    status: forceDraft ? 'Borrador' : 'Contabilizado',
    lines: [
      { account: settings.purchases.purchaseInventoryAccount, description: 'Compra / inventario', debit: base, credit: 0 },
      { account: settings.purchases.taxCreditAccount, description: 'ITBIS adelantado', debit: tax, credit: 0 },
      { account: settings.purchases.payableAccount, description: `Proveedor ${invoice.supplier || ''}`, debit: 0, credit: total },
    ],
  })
}

export function createCustomerPaymentEntry(payment, forceDraft = false) {
  const settings = getAccountingSettings()
  const amount = toNumber(payment.amount)
  if (amount <= 0) return null

  return appendJournalEntry({
    description: `Cobro cliente ${payment.invoiceNumber || ''}`,
    sourceModule: 'Ventas',
    sourceDocument: payment.invoiceNumber || payment.reference || '',
    status: forceDraft ? 'Borrador' : 'Contabilizado',
    lines: [
      { account: settings.sales.cashBankAccount, description: payment.method || 'Cobro cliente', debit: amount, credit: 0 },
      { account: settings.sales.receivableAccount, description: 'Cuentas por cobrar', debit: 0, credit: amount },
    ],
  })
}

export function createSupplierPaymentEntry(payment, forceDraft = false) {
  const settings = getAccountingSettings()
  const amount = toNumber(payment.amount)
  if (amount <= 0) return null

  return appendJournalEntry({
    description: `Pago proveedor ${payment.invoiceNumber || ''}`,
    sourceModule: 'Compras',
    sourceDocument: payment.invoiceNumber || payment.reference || '',
    status: forceDraft ? 'Borrador' : 'Contabilizado',
    lines: [
      { account: settings.purchases.payableAccount, description: 'Cuentas por pagar', debit: amount, credit: 0 },
      { account: settings.sales.cashBankAccount, description: payment.method || 'Pago proveedor', debit: 0, credit: amount },
    ],
  })
}
