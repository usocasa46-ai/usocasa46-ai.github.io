import {
  Banknote,
  CreditCard,
  Download,
  Maximize2,
  Minus,
  Pause,
  Plus,
  Printer,
  ReceiptText,
  RefreshCcw,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import { invoicesService } from '../../services/invoicesService.js'
import { productsService } from '../../services/productsService.js'
import { createSalesInvoiceEntry, readArray as readAccountingArray, ACCOUNTING_KEYS } from '../../utils/accountingEntries.js'
import { createPdfMetadata, downloadSalesDocumentPdf, printSalesDocumentPdf } from '../../utils/pdf/salesDocumentPdf.js'
import { consumeNextNcf, peekNextNcf } from '../../utils/ncfGenerator.js'
import './SalesPosPage.css'

const PRODUCTS_KEY = 'inveFatInventoryProducts'
const CUSTOMERS_KEYS = ['invefat_customers', 'invefat_sales_customers', 'inveFatCustomers']
const INVOICES_KEY = 'invefat_sales_invoices'
const MOVEMENTS_KEY = 'invefat_inventory_movements'
const REPORTS_KEY = 'invefat_sales_reports'
const SETTINGS_KEY = 'invefat_company_settings'
const POS_SALES_KEY = 'invefat_pos_sales'
const SUSPENDED_KEY = 'invefat_pos_suspended_sales'
const CASH_MOVEMENTS_KEY = 'invefat_cash_movements'

const paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia', 'Credito', 'Mixto']

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
    logo: '',
    primaryColor: '#0f2742',
    accentColor: '#f1872d',
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
  },
  billing: {
    invoiceModel: 'Ticket / POS',
    printFormat: 'Ticket 80mm',
    orientation: 'Vertical',
    fontSize: '10',
    footerMessage: 'Gracias por su compra.',
  },
  fiscal: {
    useNcf: false,
    defaultReceiptType: 'Consumidor final',
    ncfPrefix: 'B02',
    nextNcf: 1,
    ncfLength: 8,
    ncfValidUntil: '',
  },
  branches: [{ code: 'MAT-01', name: 'Empresa matriz', mainWarehouse: 'ALM-01', status: 'Activa' }],
  warehouses: [{ code: 'ALM-01', name: 'Almacen Principal' }],
  numbering: {
    invoice: { prefix: 'FAC', nextNumber: 1, length: 6, separator: '-' },
  },
  preferences: {
    allowNegativeStock: false,
  },
}

const cashCustomer = {
  code: 'CLI-CONTADO',
  name: 'Consumidor final',
  fiscalId: '',
  phone: '',
  email: '',
  address: '',
  paymentCondition: 'Contado',
  creditDays: 0,
  preferredReceiptType: 'Consumidor final',
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function safeParse(key, fallback) {
  if (!canUseStorage()) return fallback
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  if (!canUseStorage()) return
  localStorage.setItem(key, JSON.stringify(value))
}

function readArray(key, fallback = []) {
  const value = safeParse(key, fallback)
  return Array.isArray(value) ? value : fallback
}

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function cleanText(value) {
  return String(value ?? '').trim().toLowerCase()
}

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function currency(value, settings) {
  const symbol = settings?.company?.currency || 'RD$'
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

function mergeSettings(saved) {
  if (!saved || typeof saved !== 'object') return defaultSettings
  return {
    ...defaultSettings,
    ...saved,
    company: { ...defaultSettings.company, ...saved.company },
    brand: { ...defaultSettings.brand, ...saved.brand },
    documentOptions: { ...defaultSettings.documentOptions, ...saved.documentOptions },
    billing: { ...defaultSettings.billing, ...saved.billing },
    fiscal: { ...defaultSettings.fiscal, ...saved.fiscal },
    preferences: { ...defaultSettings.preferences, ...saved.preferences },
    numbering: { ...defaultSettings.numbering, ...saved.numbering },
    branches: Array.isArray(saved.branches) && saved.branches.length ? saved.branches : defaultSettings.branches,
    warehouses: Array.isArray(saved.warehouses) && saved.warehouses.length ? saved.warehouses : defaultSettings.warehouses,
  }
}

function loadSettings() {
  return mergeSettings(safeParse(SETTINGS_KEY, null))
}

function normalizeProduct(product) {
  const rawTax = product.tax ?? product.impuesto ?? product.taxRate
  return {
    ...product,
    code: String(product.code || product.codigo || '').trim(),
    name: String(product.name || product.nombre || 'Producto sin nombre').trim(),
    description: String(product.description || product.descripcion || '').trim(),
    category: String(product.category || product.categoria || 'General').trim(),
    unit: String(product.unit || product.unidad || 'UND').trim(),
    barcode: String(product.barcode || product.codigoBarra || '').trim(),
    price: toNumber(product.price ?? product.precio),
    cost: toNumber(product.cost ?? product.costo),
    tax: rawTax === undefined || rawTax === null || rawTax === '' ? 0 : toNumber(rawTax),
    stock: toNumber(product.stock),
    supplierCode: String(product.supplierCode || product.providerCode || '').trim(),
    supplierName: String(product.supplierName || product.providerName || product.supplier || '').trim(),
    status: product.status || product.estado || 'Activo',
  }
}

function loadProducts() {
  return readArray(PRODUCTS_KEY).map(normalizeProduct).filter((product) => product.code)
}

function saveProducts(products) {
  writeStorage(PRODUCTS_KEY, products)
  void productsService.replaceAll(products)
}

function normalizeCustomer(customer) {
  return {
    code: String(customer.code || customer.codigo || customer.customerCode || customer.id || '').trim(),
    name: String(customer.name || customer.commercialName || customer.nombre || customer.customer || 'Cliente sin nombre').trim(),
    fiscalId: String(customer.fiscalId || customer.document || customer.rnc || customer.identification || '').trim(),
    phone: String(customer.phone || customer.telefono || '').trim(),
    email: String(customer.email || customer.correo || customer.invoiceEmail || '').trim(),
    address: String(customer.address || customer.direccion || '').trim(),
    paymentCondition: customer.paymentCondition || customer.condition || 'Contado',
    creditDays: toNumber(customer.creditDays || customer.daysCredit || customer.diasCredito),
    creditLimit: toNumber(customer.creditLimit || customer.limiteCredito),
    priceList: customer.priceList || customer.listaPrecio || 'General',
    preferredReceiptType: customer.preferredReceiptType || customer.tipoComprobante || 'Consumidor final',
    status: customer.status || customer.estado || 'Activo',
  }
}

function loadCustomers() {
  const customers = CUSTOMERS_KEYS.flatMap((key) => readArray(key))
    .map(normalizeCustomer)
    .filter((customer) => customer.code && customer.status !== 'Inactivo')
  const byCode = new Map()
  ;[cashCustomer, ...customers].forEach((customer) => byCode.set(customer.code, customer))
  return Array.from(byCode.values())
}

function defaultBranch(settings) {
  return settings.branches.find((branch) => branch.status !== 'Inactiva') || settings.branches[0] || defaultSettings.branches[0]
}

function defaultWarehouse(settings, branchCode) {
  const branch = settings.branches.find((item) => item.code === branchCode) || defaultBranch(settings)
  return branch?.mainWarehouse || settings.warehouses[0]?.code || 'ALM-01'
}

function nextInvoiceNumber(settings, invoices) {
  const config = settings.numbering?.invoice || defaultSettings.numbering.invoice
  const prefix = config.prefix || 'FAC'
  const separator = config.separator || '-'
  const length = Number(config.length) || 6
  const configuredNext = Number(config.nextNumber) || 1
  const maxExisting = invoices.reduce((max, invoice) => {
    const numberPart = String(invoice.number || '').replace(prefix, '').replace(separator, '')
    const parsed = Number.parseInt(numberPart, 10)
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max
  }, 0)
  return `${prefix}${separator}${String(Math.max(configuredNext, maxExisting + 1)).padStart(length, '0')}`
}

function nextNcf(settings, invoices, receiptType) {
  if (!settings.fiscal?.useNcf) return ''
  const type = receiptType || settings.fiscal.defaultReceiptType || settings.fiscal.ncfPrefix || 'Consumidor final'
  const sequenceNcf = peekNextNcf(type)
  if (sequenceNcf) return sequenceNcf

  const prefix = settings.fiscal.ncfPrefix || 'B02'
  const length = Number(settings.fiscal.ncfLength) || 8
  const configuredNext = Number(settings.fiscal.nextNcf) || 1
  const maxExisting = invoices.reduce((max, invoice) => {
    const parsed = Number.parseInt(String(invoice.ncf || '').replace(prefix, ''), 10)
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max
  }, 0)
  return `${prefix}${String(Math.max(configuredNext, maxExisting + 1)).padStart(length, '0')}`
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

function calculateTotals(lines = [], payment = {}) {
  const subtotal = lines.reduce((sum, line) => sum + lineBase(line), 0)
  const discountTotal = lines.reduce((sum, line) => sum + lineDiscount(line), 0)
  const taxTotal = lines.reduce((sum, line) => sum + lineTax(line), 0)
  const total = Math.max(subtotal - discountTotal + taxTotal, 0)
  const paid = payment.method === 'Credito'
    ? 0
    : payment.method === 'Efectivo'
      ? toNumber(payment.received)
      : payment.method === 'Mixto'
        ? toNumber(payment.cash) + toNumber(payment.card) + toNumber(payment.transfer)
        : total

  return {
    subtotal,
    discountTotal,
    taxTotal,
    total,
    paid,
    balance: Math.max(total - paid, 0),
    change: ['Efectivo', 'Mixto'].includes(payment.method) ? Math.max(paid - total, 0) : 0,
  }
}

function makeLine(product) {
  return {
    id: makeId('pos-line'),
    code: product.code,
    name: product.name,
    description: product.description,
    unit: product.unit,
    barcode: product.barcode,
    stock: product.stock,
    quantity: 1,
    price: product.price,
    discount: 0,
    taxRate: product.tax || 0,
  }
}

function buildReport(invoice, totals) {
  return {
    id: invoice.id,
    number: invoice.number,
    date: invoice.date,
    customer: invoice.customer,
    products: invoice.lines.map((line) => ({
      code: line.code,
      name: line.name,
      quantity: toNumber(line.quantity),
      subtotal: lineBase(line),
      tax: lineTax(line),
      total: lineTotal(line),
    })),
    subtotal: totals.subtotal,
    tax: totals.taxTotal,
    discount: totals.discountTotal,
    total: totals.total,
    paymentMethod: invoice.paymentMethod,
    seller: invoice.seller,
    branch: invoice.branch,
    warehouse: invoice.warehouse,
    state: invoice.state,
    source: 'POS',
    updatedAt: new Date().toISOString(),
  }
}

export default function SalesPosPage({ controls, onAction, searchValue = '', onSearchChange, session }) {
  const [settings] = useState(() => loadSettings())
  const [products, setProducts] = useState(() => loadProducts())
  const [customers, setCustomers] = useState(() => loadCustomers())
  const [invoices, setInvoices] = useState(() => readArray(INVOICES_KEY))
  const [suspendedSales, setSuspendedSales] = useState(() => readArray(SUSPENDED_KEY))
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [productQuery, setProductQuery] = useState('')
  const [customerQuery, setCustomerQuery] = useState('')
  const [customer, setCustomer] = useState(cashCustomer)
  const [lines, setLines] = useState([])
  const [payment, setPayment] = useState({ method: 'Efectivo', received: '', card: '', transfer: '', reference: '', bank: '' })
  const [message, setMessage] = useState('')
  const [completedInvoice, setCompletedInvoice] = useState(null)
  const [showSuspended, setShowSuspended] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    setProducts(loadProducts())
    setCustomers(loadCustomers())
    setInvoices(readArray(INVOICES_KEY))
  }, [])

  const branch = defaultBranch(settings)
  const warehouse = defaultWarehouse(settings, branch.code)
  const totals = useMemo(() => calculateTotals(lines, payment), [lines, payment])
  const categories = useMemo(() => ['Todas', ...Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort()], [products])

  const filteredProducts = useMemo(() => {
    const query = cleanText(`${searchValue || ''} ${productQuery}`.trim())
    return products
      .filter((product) => product.status !== 'Inactivo')
      .filter((product) => selectedCategory === 'Todas' || product.category === selectedCategory)
      .filter((product) => !query || [product.code, product.name, product.barcode, product.category].some((field) => cleanText(field).includes(query)))
      .slice(0, 72)
  }, [products, productQuery, searchValue, selectedCategory])

  const filteredCustomers = useMemo(() => {
    const query = cleanText(customerQuery)
    return customers
      .filter((item) => !query || [item.code, item.name, item.fiscalId, item.phone].some((field) => cleanText(field).includes(query)))
      .slice(0, 20)
  }, [customers, customerQuery])

  const notify = (text) => {
    setMessage(text)
    onAction?.(text)
  }

  const resetSale = () => {
    setLines([])
    setPayment({ method: 'Efectivo', received: '', card: '', transfer: '', reference: '', bank: '' })
    setCustomer(cashCustomer)
    setCustomerQuery('')
    setProductQuery('')
    setCompletedInvoice(null)
  }

  const selectCustomer = (code) => {
    const nextCustomer = customers.find((item) => item.code === code) || cashCustomer
    setCustomer(nextCustomer)
    setCustomerQuery(`${nextCustomer.code} - ${nextCustomer.name}${nextCustomer.fiscalId ? ` - ${nextCustomer.fiscalId}` : ''}`)
    if (nextCustomer.paymentCondition === 'Credito') {
      setPayment((current) => ({ ...current, method: 'Credito' }))
    }
  }

  const updateCustomerQuery = (value) => {
    setCustomerQuery(value)
    const normalized = cleanText(value)
    const match = customers.find((item) => (
      cleanText(item.code) === normalized ||
      cleanText(item.fiscalId) === normalized ||
      cleanText(`${item.code} - ${item.name}`) === normalized ||
      cleanText(`${item.code} - ${item.name} - ${item.fiscalId}`) === normalized
    ))

    if (match) selectCustomer(match.code)
  }

  const updateProductQuery = (value) => {
    setProductQuery(value)
    const normalized = cleanText(value)
    const match = products.find((product) => cleanText(product.code) === normalized || cleanText(product.barcode) === normalized)
    if (match) addProduct(match)
  }

  const addProduct = (product) => {
    if (!product || product.status === 'Inactivo') {
      notify('Producto no disponible para venta.')
      return
    }

    setLines((current) => {
      const existing = current.find((line) => line.code === product.code)
      if (existing) {
        return current.map((line) => line.code === product.code ? { ...line, quantity: toNumber(line.quantity) + 1 } : line)
      }
      return [...current, makeLine(product)]
    })
    setProductQuery('')
  }

  const updateLine = (lineId, field, value) => {
    setLines((current) => current.map((line) => line.id === lineId ? { ...line, [field]: value } : line))
  }

  const changeQty = (lineId, step) => {
    setLines((current) => current.map((line) => {
      if (line.id !== lineId) return line
      return { ...line, quantity: Math.max(1, toNumber(line.quantity) + step) }
    }))
  }

  const removeLine = (lineId) => {
    setLines((current) => current.filter((line) => line.id !== lineId))
  }

  const validateSale = () => {
    if (lines.length === 0) return 'Debe agregar productos al carrito.'
    if (!payment.method) return 'Seleccione una forma de pago.'
    if (payment.method === 'Credito' && customer.code === cashCustomer.code) return 'La venta a credito requiere un cliente registrado.'

    const allowNegativeStock = Boolean(settings.preferences?.allowNegativeStock)
    if (!allowNegativeStock) {
      const badLine = lines.find((line) => {
        const product = products.find((item) => item.code === line.code)
        return product && toNumber(product.stock) < toNumber(line.quantity)
      })
      if (badLine) {
        const product = products.find((item) => item.code === badLine.code)
        return `Stock insuficiente para ${badLine.name}. Disponible: ${formatQuantity(product?.stock || 0)}.`
      }
    }

    if (payment.method === 'Efectivo' && toNumber(payment.received) < totals.total) return 'El monto recibido no cubre el total.'
    if (payment.method === 'Mixto' && totals.paid < totals.total) return 'El pago mixto no cubre el total.'

    return ''
  }

  const applyInventoryExit = (invoice) => {
    const movementDate = new Date().toISOString()
    const movements = readArray(MOVEMENTS_KEY)
    const nextMovements = [...movements]
    const nextProducts = products.map((product) => {
      const line = invoice.lines.find((item) => item.code === product.code)
      if (!line) return product
      const nextStock = toNumber(product.stock) - toNumber(line.quantity)
      nextMovements.push({
        id: makeId('movement'),
        date: movementDate,
        type: 'Salida por venta POS',
        document: invoice.number,
        productCode: line.code,
        productName: line.name,
        warehouse: invoice.warehouse,
        branch: invoice.branch,
        entry: 0,
        exit: toNumber(line.quantity),
        balance: nextStock,
        user: invoice.seller || 'Caja',
        reference: 'Punto de venta',
      })
      return { ...product, stock: nextStock, updatedAt: movementDate }
    })

    setProducts(nextProducts)
    saveProducts(nextProducts)
    writeStorage(MOVEMENTS_KEY, nextMovements)
  }

  const saveReport = (invoice, invoiceTotals) => {
    const reports = readArray(REPORTS_KEY)
    const record = buildReport(invoice, invoiceTotals)
    const nextReports = reports.some((item) => item.number === invoice.number)
      ? reports.map((item) => item.number === invoice.number ? record : item)
      : [record, ...reports]
    writeStorage(REPORTS_KEY, nextReports)
  }

  const saveCashMovement = (invoice, invoiceTotals) => {
    const cashMovements = readArray(CASH_MOVEMENTS_KEY)
    const entryAmount = invoice.paymentMethod === 'Credito' ? 0 : invoiceTotals.total
    const record = {
      id: makeId('cash'),
      date: new Date().toISOString(),
      type: 'Venta POS',
      concept: `Factura ${invoice.number}`,
      invoiceNumber: invoice.number,
      method: invoice.paymentMethod,
      reference: payment.reference || payment.bank || '',
      entry: entryAmount,
      salida: 0,
      balance: 0,
      user: invoice.seller,
    }
    writeStorage(CASH_MOVEMENTS_KEY, [record, ...cashMovements])
  }

  const savePosSale = (invoice) => {
    const sales = readArray(POS_SALES_KEY)
    writeStorage(POS_SALES_KEY, [{ invoiceNumber: invoice.number, id: invoice.id, date: invoice.date, total: invoice.totals.total }, ...sales])
  }

  const collectPaymentSnapshot = () => ({
    method: payment.method,
    received: payment.method === 'Efectivo' ? toNumber(payment.received) : totals.paid,
    cash: toNumber(payment.cash),
    card: toNumber(payment.card),
    transfer: toNumber(payment.transfer),
    reference: payment.reference,
    bank: payment.bank,
  })

  const completeSale = async () => {
    const error = validateSale()
    if (error) {
      notify(error)
      return
    }

    const freshInvoices = readArray(INVOICES_KEY)
    const receiptType = customer.preferredReceiptType || settings.fiscal?.defaultReceiptType || 'Consumidor final'
    let ncf = nextNcf(settings, freshInvoices, receiptType)
    let ncfValidUntil = settings.fiscal?.ncfValidUntil || ''

    if (settings.fiscal?.useNcf) {
      const consumed = consumeNextNcf(receiptType)
      if (consumed.ncf) {
        ncf = consumed.ncf
        ncfValidUntil = consumed.validUntil || ncfValidUntil
      }
    }

    const invoiceTotals = calculateTotals(lines, payment)
    const invoice = {
      id: makeId('invoice'),
      number: nextInvoiceNumber(settings, freshInvoices),
      date: todayDate(),
      customerCode: customer.code,
      customer: customer.name,
      fiscalId: customer.fiscalId,
      phone: customer.phone,
      email: customer.email,
      invoiceEmail: customer.email,
      address: customer.address,
      seller: session?.fullName || session?.username || 'Caja',
      branch: branch.code,
      warehouse,
      paymentCondition: payment.method === 'Credito' ? 'Credito' : customer.paymentCondition || 'Contado',
      paymentMethod: payment.method,
      paymentDetail: collectPaymentSnapshot(),
      receiptType,
      ncf,
      ncfValidUntil,
      dueDate: payment.method === 'Credito' ? todayDate() : todayDate(),
      creditDays: payment.method === 'Credito' ? toNumber(customer.creditDays) : 0,
      state: payment.method === 'Credito' ? 'Pendiente' : 'Pagada',
      paidAmount: payment.method === 'Credito' ? 0 : invoiceTotals.paid,
      totals: invoiceTotals,
      lines,
      source: 'POS',
      inventoryApplied: true,
      pdf: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const pdfInfo = createPdfMetadata(invoice, ticketSettings(), 'invoice')
    const savedInvoice = { ...invoice, pdf: pdfInfo }
    const nextInvoices = [savedInvoice, ...freshInvoices]

    applyInventoryExit(savedInvoice)
    setInvoices(nextInvoices)
    writeStorage(INVOICES_KEY, nextInvoices)
    void invoicesService.replaceAll(nextInvoices)
    saveReport(savedInvoice, invoiceTotals)
    saveCashMovement(savedInvoice, invoiceTotals)
    savePosSale(savedInvoice)
    const existingAccountingEntry = readAccountingArray(ACCOUNTING_KEYS.entries).some((entry) => entry.sourceDocument === savedInvoice.number && entry.sourceModule === 'Ventas')
    if (!existingAccountingEntry) createSalesInvoiceEntry(savedInvoice)
    setCompletedInvoice(savedInvoice)
    setLines([])
    setPayment({ method: 'Efectivo', received: '', card: '', transfer: '', reference: '', bank: '' })
    notify(`Venta POS completada: ${savedInvoice.number}.`)
  }

  const ticketSettings = () => ({
    ...settings,
    billing: {
      ...settings.billing,
      invoiceModel: settings.billing?.invoiceModel || 'Ticket / POS',
      printFormat: String(settings.billing?.printFormat || '').includes('Ticket') ? settings.billing.printFormat : 'Ticket 80mm',
      fontSize: settings.billing?.fontSize || '10',
    },
  })

  const printCompleted = async () => {
    if (!completedInvoice) return
    const pdfInfo = await printSalesDocumentPdf({ documentData: completedInvoice, settings: ticketSettings(), documentType: 'invoice' })
    const nextInvoices = readArray(INVOICES_KEY).map((item) => item.number === completedInvoice.number ? { ...item, pdf: pdfInfo } : item)
    writeStorage(INVOICES_KEY, nextInvoices)
    setInvoices(nextInvoices)
  }

  const downloadCompleted = async () => {
    if (!completedInvoice) return
    await downloadSalesDocumentPdf({ documentData: completedInvoice, settings: ticketSettings(), documentType: 'invoice' })
  }

  const suspendSale = () => {
    if (lines.length === 0) {
      notify('No hay productos para suspender.')
      return
    }
    const record = {
      id: makeId('suspended'),
      date: new Date().toISOString(),
      customer,
      lines,
      payment,
      total: totals.total,
      user: session?.fullName || 'Caja',
    }
    const next = [record, ...suspendedSales]
    setSuspendedSales(next)
    writeStorage(SUSPENDED_KEY, next)
    resetSale()
    notify('Venta suspendida correctamente.')
  }

  const recoverSale = (record) => {
    setCustomer(record.customer || cashCustomer)
    setLines(record.lines || [])
    setPayment(record.payment || { method: 'Efectivo', received: '', card: '', transfer: '', reference: '', bank: '' })
    const next = suspendedSales.filter((item) => item.id !== record.id)
    setSuspendedSales(next)
    writeStorage(SUSPENDED_KEY, next)
    setShowSuspended(false)
    notify('Venta suspendida recuperada.')
  }

  const toggleFullscreen = () => {
    setFullscreen((current) => !current)
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {})
      return
    }
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {})
    }
  }

  const updatePaymentMethod = (method) => {
    setPayment((current) => ({
      ...current,
      method,
      received: method === 'Efectivo' ? current.received : '',
    }))
  }

  const paymentInputs = (
    <div className="pos-payment-fields">
      {payment.method === 'Efectivo' && (
        <label>Monto recibido<input type="number" min="0" value={payment.received} onChange={(event) => setPayment((current) => ({ ...current, received: event.target.value }))} /></label>
      )}
      {payment.method === 'Tarjeta' && (
        <label>Autorizacion<input value={payment.reference} onChange={(event) => setPayment((current) => ({ ...current, reference: event.target.value }))} /></label>
      )}
      {payment.method === 'Transferencia' && (
        <>
          <label>Banco<input value={payment.bank} onChange={(event) => setPayment((current) => ({ ...current, bank: event.target.value }))} /></label>
          <label>Referencia<input value={payment.reference} onChange={(event) => setPayment((current) => ({ ...current, reference: event.target.value }))} /></label>
        </>
      )}
      {payment.method === 'Mixto' && (
        <>
          <label>Efectivo<input type="number" min="0" value={payment.cash} onChange={(event) => setPayment((current) => ({ ...current, cash: event.target.value }))} /></label>
          <label>Tarjeta<input type="number" min="0" value={payment.card} onChange={(event) => setPayment((current) => ({ ...current, card: event.target.value }))} /></label>
          <label>Transferencia<input type="number" min="0" value={payment.transfer} onChange={(event) => setPayment((current) => ({ ...current, transfer: event.target.value }))} /></label>
          <label>Referencia<input value={payment.reference} onChange={(event) => setPayment((current) => ({ ...current, reference: event.target.value }))} /></label>
        </>
      )}
      {payment.method === 'Credito' && (
        <div className="pos-credit-note">Credito disponible solo para clientes registrados.</div>
      )}
    </div>
  )

  return (
    <ModulePageLayout
      title="Punto de venta"
      moduleLabel="Ventas"
      breadcrumb={['Ventas', 'Punto de venta']}
      description="Caja touch para facturar rapido, descontar inventario y generar tickets."
      searchValue={searchValue}
      searchPlaceholder="Buscar producto en POS"
      onSearchChange={onSearchChange}
      actions={[
        { id: 'fullscreen', label: fullscreen ? 'Salir pantalla completa' : 'Pantalla completa', icon: Maximize2, onClick: toggleFullscreen },
        { id: 'suspend', label: 'Suspender venta', icon: Pause, onClick: suspendSale, disabled: lines.length === 0 },
        { id: 'recover', label: 'Recuperar venta', icon: RotateCcw, onClick: () => setShowSuspended(true), disabled: suspendedSales.length === 0 },
        { id: 'cancel', label: 'Cancelar venta', icon: X, variant: 'danger', onClick: resetSale, disabled: lines.length === 0 },
        { id: 'exit', label: 'Salir', icon: X, onClick: controls?.onClose },
      ]}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      <section className={`sales-pos-page ${fullscreen ? 'is-pos-fullscreen' : ''}`}>
        {message && <div className="pos-message">{message}</div>}

        <div className="pos-shell">
          <section className="pos-product-zone">
            <div className="pos-search-card">
              <label>
                <Search size={22} />
                <input
                  value={productQuery}
                  onChange={(event) => updateProductQuery(event.target.value)}
                  placeholder="Codigo, nombre o codigo de barra"
                  autoComplete="off"
                />
              </label>
            </div>

            <div className="pos-category-row">
              {categories.map((category) => (
                <button type="button" key={category} className={selectedCategory === category ? 'is-active' : ''} onClick={() => setSelectedCategory(category)}>
                  {category}
                </button>
              ))}
            </div>

            <div className="pos-products-grid">
              {filteredProducts.map((product) => (
                <button type="button" key={product.code} className={toNumber(product.stock) <= 0 ? 'is-out' : ''} onClick={() => addProduct(product)}>
                  <strong>{product.name}</strong>
                  <span>{product.code}</span>
                  <small>Stock {formatQuantity(product.stock)} | {currency(product.price, settings)}</small>
                </button>
              ))}
              {filteredProducts.length === 0 && <div className="pos-empty-card">No hay productos disponibles con esa busqueda.</div>}
            </div>
          </section>

          <aside className="pos-cart-zone">
            <div className="pos-customer-card">
              <div>
                <span>Cliente</span>
                <strong>{customer.name}</strong>
                <small>{customer.fiscalId || 'Consumidor final'}</small>
              </div>
              <label>
                Buscar cliente
                <input value={customerQuery} onChange={(event) => updateCustomerQuery(event.target.value)} placeholder="Codigo, nombre o RNC" list="pos-customers" />
              </label>
              <select value={customer.code} onChange={(event) => selectCustomer(event.target.value)}>
                {filteredCustomers.map((item) => <option key={item.code} value={item.code}>{item.code} - {item.name}</option>)}
              </select>
              <datalist id="pos-customers">
                {filteredCustomers.map((item) => <option key={item.code} value={`${item.code} - ${item.name}`} />)}
              </datalist>
            </div>

            <div className="pos-cart-list">
              <div className="pos-cart-heading">
                <ReceiptText size={18} />
                <strong>Carrito</strong>
                <span>{lines.length} linea(s)</span>
              </div>

              {lines.length === 0 && <div className="pos-empty-cart">Agregue productos para iniciar la venta.</div>}
              {lines.map((line) => (
                <article key={line.id} className="pos-cart-line">
                  <div>
                    <strong>{line.name}</strong>
                    <span>{line.code} | {line.unit}</span>
                  </div>
                  <div className="pos-qty-controls">
                    <button type="button" onClick={() => changeQty(line.id, -1)}><Minus size={16} /></button>
                    <input type="number" min="1" value={line.quantity} onChange={(event) => updateLine(line.id, 'quantity', event.target.value)} />
                    <button type="button" onClick={() => changeQty(line.id, 1)}><Plus size={16} /></button>
                  </div>
                  <div className="pos-line-money">
                    <input type="number" min="0" value={line.price} onChange={(event) => updateLine(line.id, 'price', event.target.value)} title="Precio" />
                    <input type="number" min="0" value={line.discount} onChange={(event) => updateLine(line.id, 'discount', event.target.value)} title="Descuento" />
                    <strong>{currency(lineTotal(line), settings)}</strong>
                  </div>
                  <button type="button" className="pos-remove-line" onClick={() => removeLine(line.id)} title="Eliminar linea">
                    <Trash2 size={17} />
                  </button>
                </article>
              ))}
            </div>

            <div className="pos-payment-panel">
              <div className="pos-payment-methods">
                {paymentMethods.map((method) => (
                  <button type="button" key={method} className={payment.method === method ? 'is-active' : ''} onClick={() => updatePaymentMethod(method)}>
                    {method === 'Efectivo' ? <Banknote size={17} /> : <CreditCard size={17} />}
                    {method}
                  </button>
                ))}
              </div>
              {paymentInputs}
            </div>

            <div className="pos-total-panel">
              <div><span>Subtotal</span><strong>{currency(totals.subtotal, settings)}</strong></div>
              <div><span>Descuento</span><strong>{currency(totals.discountTotal, settings)}</strong></div>
              <div><span>Impuesto</span><strong>{currency(totals.taxTotal, settings)}</strong></div>
              <div><span>Pagado</span><strong>{currency(totals.paid, settings)}</strong></div>
              <div><span>Devuelta</span><strong>{currency(totals.change, settings)}</strong></div>
              <div className="is-grand"><span>Total</span><strong>{currency(totals.total, settings)}</strong></div>
              <button type="button" className="pos-charge-button" onClick={completeSale}>
                <ReceiptText size={22} />
                Cobrar
              </button>
            </div>
          </aside>
        </div>

        {showSuspended && (
          <div className="pos-modal-backdrop" role="presentation">
            <section className="pos-modal" role="dialog" aria-modal="true">
              <header>
                <div>
                  <span>Caja</span>
                  <h2>Ventas suspendidas</h2>
                </div>
                <button type="button" onClick={() => setShowSuspended(false)}><X size={18} /></button>
              </header>
              <div className="pos-modal-body">
                {suspendedSales.length === 0 && <div className="pos-empty-card">No hay ventas suspendidas.</div>}
                {suspendedSales.map((sale) => (
                  <article key={sale.id} className="pos-suspended-row">
                    <div>
                      <strong>{sale.customer?.name || 'Consumidor final'}</strong>
                      <span>{new Date(sale.date).toLocaleString('es-DO')} | {sale.lines?.length || 0} producto(s)</span>
                    </div>
                    <strong>{currency(sale.total, settings)}</strong>
                    <button type="button" onClick={() => recoverSale(sale)}>Recuperar</button>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {completedInvoice && (
          <div className="pos-modal-backdrop" role="presentation">
            <section className="pos-modal pos-completed-modal" role="dialog" aria-modal="true">
              <header>
                <div>
                  <span>Venta completada</span>
                  <h2>{completedInvoice.number}</h2>
                </div>
                <button type="button" onClick={() => setCompletedInvoice(null)}><X size={18} /></button>
              </header>
              <div className="pos-modal-body">
                <div className="pos-success-card">
                  <ReceiptText size={42} />
                  <strong>{currency(completedInvoice.totals.total, settings)}</strong>
                  <span>{completedInvoice.customer} | {completedInvoice.paymentMethod}</span>
                  {completedInvoice.ncf && <small>NCF: {completedInvoice.ncf}</small>}
                </div>
              </div>
              <footer>
                <button type="button" onClick={() => setCompletedInvoice(null)}>Cerrar</button>
                <button type="button" onClick={downloadCompleted}><Download size={16} /> Descargar</button>
                <button type="button" onClick={printCompleted}><Printer size={16} /> Imprimir ticket</button>
                <button type="button" className="pos-primary-button" onClick={resetSale}><RefreshCcw size={16} /> Nueva venta</button>
              </footer>
            </section>
          </div>
        )}
      </section>
    </ModulePageLayout>
  )
}
