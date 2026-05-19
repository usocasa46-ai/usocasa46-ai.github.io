import {
  Ban,
  Download,
  Edit3,
  Eye,
  FilePlus2,
  Printer,
  Save,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { customersService } from '../../services/customersService.js'
import { invoicesService } from '../../services/invoicesService.js'
import { productsService } from '../../services/productsService.js'
import { quotesService } from '../../services/quotesService.js'
import { settingsService } from '../../services/settingsService.js'
import {
  createPdfMetadata,
  downloadSalesDocumentPdf,
  openSalesDocumentPdf,
  printSalesDocumentPdf,
} from '../../utils/pdf/salesDocumentPdf.js'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import './SalesInvoicePage.css'
import './SalesQuotesPage.css'

const QUOTES_KEY = 'invefat_sales_quotes'
const QUOTE_REPORTS_KEY = 'invefat_sales_quote_reports'
const INVOICES_KEY = 'invefat_sales_invoices'
const PRODUCTS_KEY = 'inveFatInventoryProducts'
const MOVEMENTS_KEY = 'invefat_inventory_movements'
const SETTINGS_KEY = 'invefat_company_settings'
const CUSTOMER_KEYS = ['invefat_sales_customers', 'invefat_customers', 'inveFatCustomers']

const defaultSettings = {
  company: {
    tradeName: 'INVE-FAT SYSTEM',
    legalName: 'Empresa Principal',
    fiscalId: '',
    address: '',
    phone: '',
    email: '',
    currency: 'RD$',
    legalNote: 'Gracias por su compra.',
  },
  brand: {
    logo: '',
    primaryColor: '#0f2742',
    secondaryColor: '#eef3f8',
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
    invoiceModel: 'Moderno profesional',
    printFormat: 'Carta',
    orientation: 'Vertical',
    fontSize: '11',
    footerMessage: 'Documento generado por INVE-FAT SYSTEM.',
    showSignature: true,
    showStamp: false,
  },
  fiscal: {
    useNcf: false,
    defaultReceiptType: 'Consumidor final',
    ncfPrefix: 'B02',
    nextNcf: 1,
    ncfLength: 8,
    ncfValidUntil: '',
    showNcf: true,
    showNcfValidUntil: true,
    showPaymentCondition: true,
  },
  branches: [
    { code: 'MAT-01', name: 'Empresa matriz', status: 'Activa', mainWarehouse: 'ALM-01' },
  ],
  warehouses: [
    { code: 'ALM-01', name: 'Almacen Principal' },
    { code: 'ALM-02', name: 'Almacen Sucursal' },
  ],
  numbering: {
    invoice: { prefix: 'FAC', nextNumber: 1, length: 6, separator: '-' },
    quote: { prefix: 'COT', nextNumber: 1, length: 6, separator: '-' },
  },
  preferences: {
    allowNegativeStock: false,
    defaultTax: 'ITBIS 18%',
  },
}

const defaultCustomers = [
  {
    code: 'CLI-CONTADO',
    name: 'Cliente de contado',
    fiscalId: '000-0000000-0',
    phone: '',
    address: '',
    paymentCondition: 'Contado',
    creditDays: 0,
  },
]

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function safeParse(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function formatNumber(value, decimals = 2) {
  return toNumber(value).toLocaleString('es-DO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function currency(value, settings) {
  const symbol = settings?.company?.currency || settings?.preferences?.currency || 'RD$'
  return `${symbol} ${formatNumber(value)}`
}

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function datePlusDays(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function normalizeProduct(product) {
  const rawTax = product.tax ?? product.impuesto ?? product.taxRate

  return {
    ...product,
    code: product.code || product.codigo || '',
    name: product.name || product.nombre || 'Producto sin nombre',
    description: product.description || product.descripcion || '',
    unit: product.unit || product.unidad || 'UND',
    barcode: product.barcode || product.codigoBarra || '',
    price: toNumber(product.price ?? product.precio),
    cost: toNumber(product.cost ?? product.costo),
    tax: rawTax === undefined || rawTax === null || rawTax === '' ? null : toNumber(rawTax),
    stock: toNumber(product.stock),
    status: product.status || product.estado || 'Activo',
    image: product.image || product.imageUrl || product.productImage || product.imagen || product.photo || '',
  }
}

function normalizeCustomer(customer) {
  return {
    code: customer.code || customer.codigo || customer.customerCode || customer.id || '',
    name: customer.tradeName || customer.name || customer.nombre || customer.customer || 'Cliente sin nombre',
    fiscalId: customer.fiscalId || customer.document || customer.rnc || customer.identification || '',
    phone: customer.phone || customer.telefono || '',
    email: customer.email || customer.correo || '',
    invoiceEmail: customer.invoiceEmail || customer.email || customer.correoFactura || '',
    address: customer.address || customer.direccion || '',
    paymentCondition: customer.paymentCondition || customer.condicionPago || 'Contado',
    creditDays: toNumber(customer.creditDays || customer.diasCredito),
    creditLimit: toNumber(customer.creditLimit || customer.limiteCredito),
    priceList: customer.priceList || customer.listaPrecio || 'General',
    status: customer.status || customer.estado || 'Activo',
  }
}

function loadCustomers(quotes = []) {
  const storedCustomers = CUSTOMER_KEYS.flatMap((key) => {
    const saved = safeParse(key, [])
    return Array.isArray(saved) ? saved : []
  })

  const quoteCustomers = quotes
    .filter((item) => item.customer)
    .map((item) => ({
      code: item.customerCode || item.fiscalId || item.customer,
      name: item.customer,
      fiscalId: item.fiscalId || '',
      phone: item.phone || '',
      address: item.address || '',
      paymentCondition: item.paymentCondition || 'Contado',
      creditDays: item.creditDays || 0,
    }))

  const byCode = new Map()
  ;[...defaultCustomers, ...storedCustomers, ...quoteCustomers]
    .map(normalizeCustomer)
    .filter((customer) => customer.code && customer.status !== 'Inactivo')
    .forEach((customer) => byCode.set(customer.code, customer))

  return Array.from(byCode.values())
}

function loadProducts() {
  const products = safeParse(PRODUCTS_KEY, [])
  return Array.isArray(products) ? products.map(normalizeProduct).filter((product) => product.code) : []
}

function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
  void productsService.replaceAll(products)
}

function loadSettings() {
  const saved = safeParse(SETTINGS_KEY, null)
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

function loadQuotes() {
  const quotes = safeParse(QUOTES_KEY, [])
  return Array.isArray(quotes) ? quotes : []
}

function saveQuotes(quotes) {
  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes))
  void quotesService.replaceAll(quotes)
}

function loadInvoices() {
  const invoices = safeParse(INVOICES_KEY, [])
  return Array.isArray(invoices) ? invoices : []
}

function saveInvoices(invoices) {
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices))
  void invoicesService.replaceAll(invoices)
}

function defaultTaxRate(settings) {
  const taxValue = settings?.preferences?.defaultTax || settings?.company?.defaultTax || 0
  return String(taxValue).includes('18') ? 18 : toNumber(taxValue)
}

function nextDocumentNumber(settings, documents, key, fallbackPrefix) {
  const config = settings.numbering?.[key] || { prefix: fallbackPrefix, nextNumber: 1, length: 6, separator: '-' }
  const prefix = config.prefix || fallbackPrefix
  const separator = config.separator || '-'
  const length = Number(config.length) || 6
  const configuredNext = Number(config.nextNumber) || 1
  const maxExisting = documents.reduce((max, document) => {
    const numberPart = String(document.number || '').replace(prefix, '').replace(separator, '')
    const parsed = Number.parseInt(numberPart, 10)
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max
  }, 0)

  return `${prefix}${separator}${String(Math.max(configuredNext, maxExisting + 1)).padStart(length, '0')}`
}

function nextNcf(settings, invoices) {
  if (!settings.fiscal?.useNcf) return ''

  const prefix = settings.fiscal.ncfPrefix || 'B02'
  const length = Number(settings.fiscal.ncfLength) || 8
  const configuredNext = Number(settings.fiscal.nextNcf) || 1
  const maxExisting = invoices.reduce((max, invoice) => {
    const numberPart = String(invoice.ncf || '').replace(prefix, '')
    const parsed = Number.parseInt(numberPart, 10)
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max
  }, 0)

  return `${prefix}${String(Math.max(configuredNext, maxExisting + 1)).padStart(length, '0')}`
}

function defaultBranch(settings) {
  return settings.branches.find((item) => item.status !== 'Inactiva') || settings.branches[0] || defaultSettings.branches[0]
}

function defaultWarehouse(settings, branchCode) {
  const branch = settings.branches.find((item) => item.code === branchCode) || defaultBranch(settings)
  return branch?.mainWarehouse || settings.warehouses[0]?.code || 'ALM-01'
}

function emptyQuote(settings, quotes) {
  const branch = defaultBranch(settings)

  return {
    id: makeId('quote'),
    number: nextDocumentNumber(settings, quotes, 'quote', 'COT'),
    date: todayDate(),
    validUntil: datePlusDays(15),
    customerCode: '',
    customer: '',
    fiscalId: '',
    phone: '',
    email: '',
    address: '',
    seller: 'Administrador',
    branch: branch.code,
    warehouse: defaultWarehouse(settings, branch.code),
    paymentCondition: 'Contado',
    state: 'Borrador',
    observations: '',
    terms: 'Precios sujetos a disponibilidad y validez de la cotizacion.',
    lines: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function lineTotal(line) {
  const base = toNumber(line.quantity) * toNumber(line.price)
  const discount = Math.min(toNumber(line.discount), base)
  const taxable = Math.max(base - discount, 0)
  const tax = taxable * (toNumber(line.taxRate) / 100)
  return taxable + tax
}

function calculateTotals(document) {
  const lines = Array.isArray(document.lines) ? document.lines : []
  const subtotal = lines.reduce((sum, line) => sum + toNumber(line.quantity) * toNumber(line.price), 0)
  const discountTotal = lines.reduce((sum, line) => sum + Math.min(toNumber(line.discount), toNumber(line.quantity) * toNumber(line.price)), 0)
  const taxTotal = lines.reduce((sum, line) => {
    const base = toNumber(line.quantity) * toNumber(line.price)
    const taxable = Math.max(base - Math.min(toNumber(line.discount), base), 0)
    return sum + taxable * (toNumber(line.taxRate) / 100)
  }, 0)
  const total = Math.max(subtotal - discountTotal + taxTotal, 0)

  return {
    subtotal,
    discountTotal,
    taxTotal,
    total,
    paid: 0,
    balance: total,
    change: 0,
  }
}

function quoteReportFromQuote(quote, totals) {
  return {
    id: quote.id,
    number: quote.number,
    date: quote.date,
    validUntil: quote.validUntil,
    customer: quote.customer,
    products: quote.lines.map((line) => ({
      code: line.code,
      name: line.name,
      quantity: toNumber(line.quantity),
      total: lineTotal(line),
    })),
    subtotal: totals.subtotal,
    discount: totals.discountTotal,
    tax: totals.taxTotal,
    total: totals.total,
    seller: quote.seller,
    state: quote.state,
    updatedAt: new Date().toISOString(),
  }
}

export default function SalesQuotesPage({ controls, onAction, searchValue = '', onSearchChange }) {
  const [settings] = useState(() => loadSettings())
  const [products, setProducts] = useState(() => loadProducts())
  const [quotes, setQuotes] = useState(() => loadQuotes())
  const [customers, setCustomers] = useState(() => loadCustomers(loadQuotes()))
  const [quote, setQuote] = useState(() => emptyQuote(loadSettings(), loadQuotes()))
  const [selectedQuoteNumber, setSelectedQuoteNumber] = useState('')
  const [filters, setFilters] = useState({ query: '', status: 'Todos' })
  const [productQuery, setProductQuery] = useState('')
  const [customerQuery, setCustomerQuery] = useState('')
  const [selectedProductCode, setSelectedProductCode] = useState('')
  const [message, setMessage] = useState('')
  const [activeModal, setActiveModal] = useState('')
  const [quoteModalState, setQuoteModalState] = useState('normal')

  useEffect(() => {
    let isActive = true

    Promise.all([
      settingsService.getById(),
      productsService.getAll(),
      quotesService.getAll(),
      customersService.getAll(),
    ]).then(([storedSettings, storedProducts, storedQuotes, storedCustomers]) => {
      if (!isActive) return

      if (storedSettings && Object.keys(storedSettings).length > 0) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(storedSettings))
      }

      if (Array.isArray(storedProducts) && storedProducts.length > 0) {
        const normalizedProducts = storedProducts.map(normalizeProduct)
        setProducts(normalizedProducts)
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(normalizedProducts))
      }

      if (Array.isArray(storedQuotes) && storedQuotes.length > 0) {
        setQuotes(storedQuotes)
        localStorage.setItem(QUOTES_KEY, JSON.stringify(storedQuotes))
      }

      if (Array.isArray(storedCustomers) && storedCustomers.length > 0) {
        localStorage.setItem('invefat_customers', JSON.stringify(storedCustomers))
        setCustomers(loadCustomers(Array.isArray(storedQuotes) ? storedQuotes : loadQuotes()))
      }
    })

    return () => {
      isActive = false
    }
  }, [])

  const branches = useMemo(() => settings.branches || defaultSettings.branches, [settings.branches])
  const warehouses = useMemo(() => settings.warehouses || defaultSettings.warehouses, [settings.warehouses])
  const selectedQuote = useMemo(() => quotes.find((item) => item.number === selectedQuoteNumber), [quotes, selectedQuoteNumber])
  const totals = useMemo(() => calculateTotals(quote), [quote])

  const filteredQuotes = useMemo(() => {
    const global = `${searchValue} ${filters.query}`.trim().toLowerCase()

    return quotes.filter((item) => {
      const matchesText = !global || [item.number, item.customer, item.fiscalId, item.customerCode, item.date].some((field) => (
        String(field || '').toLowerCase().includes(global)
      ))
      const matchesStatus = filters.status === 'Todos' || item.state === filters.status
      return matchesText && matchesStatus
    })
  }, [filters, quotes, searchValue])

  const filteredCustomers = useMemo(() => {
    const query = customerQuery.trim().toLowerCase()
    return customers
      .filter((customer) => {
        if (!query) return true
        return [customer.code, customer.name, customer.fiscalId, customer.phone].some((field) => String(field || '').toLowerCase().includes(query))
      })
      .slice(0, 40)
  }, [customerQuery, customers])

  const availableProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase()
    return products
      .filter((product) => product.status !== 'Inactivo')
      .filter((product) => {
        if (!query) return true
        return [product.code, product.name, product.barcode].some((field) => String(field || '').toLowerCase().includes(query))
      })
      .slice(0, 50)
  }, [productQuery, products])

  const selectedProduct = useMemo(() => products.find((product) => product.code === selectedProductCode), [products, selectedProductCode])

  const notify = (text) => {
    setMessage(text)
    onAction?.(text)
  }

  const closePageOrModal = () => {
    if (activeModal === 'quote' && quoteModalState === 'maximized') {
      setQuoteModalState('normal')
      return
    }
    if (activeModal) {
      setActiveModal('')
      setQuoteModalState('normal')
      return
    }
    controls?.onClose?.()
  }

  const pageControls = {
    ...controls,
    onClose: closePageOrModal,
  }

  const updateQuote = (field, value) => {
    setQuote((current) => ({ ...current, [field]: value }))
  }

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  const handleBranchChange = (branchCode) => {
    setQuote((current) => ({
      ...current,
      branch: branchCode,
      warehouse: defaultWarehouse(settings, branchCode),
    }))
  }

  const selectCustomer = (customerCode) => {
    const customer = customers.find((item) => item.code === customerCode)
    if (!customer) return

    setQuote((current) => ({
      ...current,
      customerCode: customer.code,
      customer: customer.name,
      fiscalId: customer.fiscalId,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      paymentCondition: customer.paymentCondition || current.paymentCondition,
    }))
    setCustomerQuery(`${customer.code} - ${customer.name} - ${customer.fiscalId || 'sin RNC'}`)
  }

  const updateCustomerQuery = (value) => {
    setCustomerQuery(value)
    const normalized = value.trim().toLowerCase()
    const match = customers.find((customer) => (
      customer.code.toLowerCase() === normalized || String(customer.fiscalId || '').toLowerCase() === normalized
    ))
    if (match) selectCustomer(match.code)
  }

  const useCustomerQueryAsCashClient = () => {
    const name = customerQuery.trim()
    if (!name) {
      notify('Escriba el nombre del cliente o seleccione uno registrado.')
      return
    }

    setQuote((current) => ({
      ...current,
      customerCode: 'CLI-CONTADO',
      customer: name,
      fiscalId: '',
      phone: '',
      email: '',
      address: '',
      paymentCondition: 'Contado',
    }))
    notify('Cliente de contado aplicado a la cotizacion.')
  }

  const startNewQuote = () => {
    const freshQuotes = loadQuotes()
    setQuotes(freshQuotes)
    setProducts(loadProducts())
    setCustomers(loadCustomers(freshQuotes))
    setQuote(emptyQuote(settings, freshQuotes))
    setSelectedQuoteNumber('')
    setSelectedProductCode('')
    setProductQuery('')
    setCustomerQuery('')
    setActiveModal('quote')
    setQuoteModalState('normal')
    notify('Nueva cotizacion lista para registrar.')
  }

  const selectProduct = (code) => {
    const product = products.find((item) => item.code === code)
    setSelectedProductCode(code)
    if (product) setProductQuery(`${product.code} - ${product.name}`)
  }

  const updateProductQuery = (value) => {
    setProductQuery(value)
    const normalized = value.trim().toLowerCase()
    const match = products.find((product) => (
      product.code.toLowerCase() === normalized || String(product.barcode || '').toLowerCase() === normalized
    ))
    if (match) selectProduct(match.code)
  }

  const addProductLine = () => {
    if (!selectedProduct) {
      notify('Seleccione un producto existente antes de agregarlo.')
      return
    }

    const productTax = selectedProduct.tax === null ? defaultTaxRate(settings) : selectedProduct.tax
    setQuote((current) => {
      const existingLine = current.lines.find((line) => line.code === selectedProduct.code)
      if (existingLine) {
        return {
          ...current,
          lines: current.lines.map((line) => (
            line.code === selectedProduct.code ? { ...line, quantity: toNumber(line.quantity) + 1 } : line
          )),
        }
      }

      return {
        ...current,
        lines: [
          ...current.lines,
          {
            id: makeId('quote-line'),
            code: selectedProduct.code,
            name: selectedProduct.name,
            description: selectedProduct.description,
            unit: selectedProduct.unit,
            barcode: selectedProduct.barcode,
            image: selectedProduct.image,
            stock: selectedProduct.stock,
            quantity: 1,
            price: selectedProduct.price,
            discount: 0,
            taxRate: productTax || 0,
          },
        ],
      }
    })

    setSelectedProductCode('')
    setProductQuery('')
    notify('Producto agregado a la cotizacion.')
  }

  const updateLine = (lineId, field, value) => {
    setQuote((current) => ({
      ...current,
      lines: current.lines.map((line) => (line.id === lineId ? { ...line, [field]: value } : line)),
    }))
  }

  const removeLine = (lineId) => {
    setQuote((current) => ({
      ...current,
      lines: current.lines.filter((line) => line.id !== lineId),
    }))
  }

  const validateQuote = () => {
    if (!quote.customer.trim()) return 'Debe indicar el cliente de la cotizacion.'
    if (!quote.lines.length) return 'Debe agregar al menos un producto.'
    const missing = quote.lines.find((line) => !products.some((product) => product.code === line.code))
    if (missing) return `El producto ${missing.code} no existe en inventario.`
    return ''
  }

  const saveQuoteReport = (savedQuote, savedTotals) => {
    const reports = safeParse(QUOTE_REPORTS_KEY, [])
    const list = Array.isArray(reports) ? reports : []
    const record = quoteReportFromQuote(savedQuote, savedTotals)
    const exists = list.some((item) => item.number === savedQuote.number)
    const nextReports = exists
      ? list.map((item) => (item.number === savedQuote.number ? record : item))
      : [record, ...list]
    localStorage.setItem(QUOTE_REPORTS_KEY, JSON.stringify(nextReports))
  }

  const saveQuote = () => {
    const error = validateQuote()
    if (error) {
      notify(error)
      return
    }

    const nextTotals = calculateTotals(quote)
    const existing = quotes.find((item) => item.number === quote.number)
    const pdfInfo = createPdfMetadata(quote, settings, 'quote')
    const savedQuote = {
      ...quote,
      state: quote.state === 'Borrador' ? 'Emitida' : quote.state,
      totals: nextTotals,
      pdf: pdfInfo,
      updatedAt: new Date().toISOString(),
    }

    const nextQuotes = existing
      ? [savedQuote, ...quotes.filter((item) => item.number !== savedQuote.number)]
      : [savedQuote, ...quotes]

    setQuotes(nextQuotes)
    saveQuotes(nextQuotes)
    saveQuoteReport(savedQuote, nextTotals)
    setQuote(savedQuote)
    setSelectedQuoteNumber(savedQuote.number)
    setCustomers(loadCustomers(nextQuotes))
    setActiveModal('')
    setQuoteModalState('normal')
    notify(`Cotizacion ${savedQuote.number} guardada correctamente.`)
  }

  const openQuoteEditor = (targetQuote) => {
    setQuote({
      ...targetQuote,
      lines: Array.isArray(targetQuote.lines) ? targetQuote.lines : [],
    })
    setSelectedQuoteNumber(targetQuote.number)
    setCustomerQuery(`${targetQuote.customerCode || ''} ${targetQuote.customer || ''} ${targetQuote.fiscalId || ''}`.trim())
    setActiveModal('quote')
    setQuoteModalState('normal')
    notify(`Editando cotizacion ${targetQuote.number}.`)
  }

  const cancelQuote = (targetQuote = selectedQuote) => {
    if (!targetQuote) {
      notify('Seleccione una cotizacion para anular.')
      return
    }

    const nextQuotes = quotes.map((item) => (
      item.number === targetQuote.number ? { ...item, state: 'Anulada', updatedAt: new Date().toISOString() } : item
    ))
    setQuotes(nextQuotes)
    saveQuotes(nextQuotes)
    notify(`Cotizacion ${targetQuote.number} anulada.`)
  }

  const ensurePrintableQuote = (targetQuote = selectedQuote || quote) => {
    if (!targetQuote || !Array.isArray(targetQuote.lines) || !targetQuote.lines.length) {
      notify('Agregue productos antes de generar el PDF.')
      return null
    }
    return {
      ...targetQuote,
      totals: targetQuote.totals || calculateTotals(targetQuote),
    }
  }

  const updateQuotePdfReference = (targetQuote, pdfInfo) => {
    if (!targetQuote?.number) return
    const nextQuotes = loadQuotes().map((item) => (
      item.number === targetQuote.number ? { ...item, pdf: pdfInfo, updatedAt: new Date().toISOString() } : item
    ))
    if (!nextQuotes.some((item) => item.number === targetQuote.number)) return
    setQuotes(nextQuotes)
    saveQuotes(nextQuotes)
  }

  const previewQuotePdf = async (targetQuote = selectedQuote || quote) => {
    const printableQuote = ensurePrintableQuote(targetQuote)
    if (!printableQuote) return false
    const pdfInfo = await openSalesDocumentPdf({ documentData: printableQuote, settings, documentType: 'quote' })
    updateQuotePdfReference(printableQuote, pdfInfo)
    notify(`PDF de cotizacion ${printableQuote.number} abierto en vista previa.`)
    return true
  }

  const printQuotePdf = async (targetQuote = selectedQuote || quote) => {
    const printableQuote = ensurePrintableQuote(targetQuote)
    if (!printableQuote) return
    const pdfInfo = await printSalesDocumentPdf({ documentData: printableQuote, settings, documentType: 'quote' })
    updateQuotePdfReference(printableQuote, pdfInfo)
    notify(`Cotizacion ${printableQuote.number} enviada a impresion.`)
  }

  const downloadQuotePdf = async (targetQuote = selectedQuote || quote) => {
    const printableQuote = ensurePrintableQuote(targetQuote)
    if (!printableQuote) return
    const pdfInfo = await downloadSalesDocumentPdf({ documentData: printableQuote, settings, documentType: 'quote' })
    updateQuotePdfReference(printableQuote, pdfInfo)
    notify(`PDF de cotizacion ${printableQuote.number} descargado.`)
  }

  const applyInventoryForInvoice = (invoice, currentProducts) => {
    const movementDate = new Date().toISOString()
    const movements = safeParse(MOVEMENTS_KEY, [])
    const nextMovements = Array.isArray(movements) ? [...movements] : []
    const nextProducts = currentProducts.map((product) => {
      const line = invoice.lines.find((item) => item.code === product.code)
      if (!line) return product

      const nextStock = toNumber(product.stock) - toNumber(line.quantity)
      nextMovements.push({
        id: makeId('movement'),
        date: movementDate,
        type: 'Salida por venta',
        document: invoice.number,
        productCode: line.code,
        productName: line.name,
        warehouse: invoice.warehouse,
        branch: invoice.branch,
        entry: 0,
        exit: toNumber(line.quantity),
        balance: nextStock,
        user: invoice.seller || 'Administrador',
        reference: invoice.createdFromQuote || '',
      })

      return { ...product, stock: nextStock, updatedAt: movementDate }
    })

    saveProducts(nextProducts)
    localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(nextMovements))
    setProducts(nextProducts)
  }

  const convertQuoteToInvoice = (targetQuote = selectedQuote) => {
    if (!targetQuote) {
      notify('Seleccione una cotizacion para convertir.')
      return
    }

    if (['Anulada', 'Convertida a factura'].includes(targetQuote.state)) {
      notify('Esta cotizacion no se puede convertir en su estado actual.')
      return
    }

    const freshProducts = loadProducts()
    const allowNegativeStock = Boolean(settings.preferences?.allowNegativeStock)
    if (!allowNegativeStock) {
      const lowStockLine = targetQuote.lines.find((line) => {
        const product = freshProducts.find((item) => item.code === line.code)
        return product && toNumber(product.stock) < toNumber(line.quantity)
      })

      if (lowStockLine) {
        const product = freshProducts.find((item) => item.code === lowStockLine.code)
        notify(`Stock insuficiente para convertir ${lowStockLine.name}. Disponible: ${formatNumber(product?.stock || 0)}.`)
        return
      }
    }

    const invoices = loadInvoices()
    const invoiceTotals = calculateTotals(targetQuote)
    const invoiceNumber = nextDocumentNumber(settings, invoices, 'invoice', 'FAC')
    const paymentMethod = targetQuote.paymentCondition === 'Credito' ? 'Credito' : 'Efectivo'
    const invoice = {
      ...targetQuote,
      id: makeId('invoice'),
      number: invoiceNumber,
      receiptType: settings.fiscal?.defaultReceiptType || 'Consumidor final',
      ncf: nextNcf(settings, invoices),
      ncfValidUntil: settings.fiscal?.ncfValidUntil || '',
      quoteNumber: targetQuote.number,
      createdFromQuote: targetQuote.number,
      paymentMethod,
      dueDate: targetQuote.paymentCondition === 'Credito' ? targetQuote.validUntil : targetQuote.date,
      creditDays: targetQuote.paymentCondition === 'Credito' ? 30 : 0,
      paidAmount: 0,
      state: paymentMethod === 'Credito' ? 'Pendiente' : 'Guardada',
      totals: invoiceTotals,
      inventoryApplied: true,
      pdf: createPdfMetadata({ ...targetQuote, number: invoiceNumber, totals: invoiceTotals }, settings, 'invoice'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    applyInventoryForInvoice(invoice, freshProducts)
    saveInvoices([invoice, ...invoices])

    const nextQuotes = quotes.map((item) => (
      item.number === targetQuote.number
        ? {
            ...item,
            state: 'Convertida a factura',
            relatedInvoiceNumber: invoice.number,
            updatedAt: new Date().toISOString(),
          }
        : item
    ))

    setQuotes(nextQuotes)
    saveQuotes(nextQuotes)
    setSelectedQuoteNumber(targetQuote.number)
    notify(`Cotizacion ${targetQuote.number} convertida a factura ${invoice.number}.`)
  }

  const actions = [
    { id: 'new', label: 'Nueva cotizacion', icon: FilePlus2, variant: 'primary', onClick: startNewQuote },
    { id: 'view', label: 'Ver', icon: Eye, disabled: !selectedQuote, onClick: () => previewQuotePdf(selectedQuote) },
    { id: 'edit', label: 'Editar', icon: Edit3, disabled: !selectedQuote, onClick: () => openQuoteEditor(selectedQuote) },
    { id: 'print', label: 'Imprimir', icon: Printer, disabled: !selectedQuote, onClick: () => printQuotePdf(selectedQuote) },
    { id: 'download', label: 'Descargar PDF', icon: Download, disabled: !selectedQuote, onClick: () => downloadQuotePdf(selectedQuote) },
    { id: 'convert', label: 'Convertir a factura', icon: Send, disabled: !selectedQuote || selectedQuote.state === 'Convertida a factura' || selectedQuote.state === 'Anulada', onClick: () => convertQuoteToInvoice(selectedQuote) },
    { id: 'cancel', label: 'Anular', icon: Ban, variant: 'danger', disabled: !selectedQuote || selectedQuote.state === 'Anulada', onClick: () => cancelQuote(selectedQuote) },
    { id: 'close', label: 'Salir', icon: X, onClick: () => controls?.onClose?.() },
  ]

  return (
    <ModulePageLayout
      title="Cotizaciones"
      moduleLabel="Ventas"
      breadcrumb={['Ventas', 'Cotizaciones']}
      description="Emite cotizaciones profesionales sin descontar inventario y conviertelas a factura cuando sean aprobadas."
      searchValue={searchValue}
      searchPlaceholder="Buscar cotizacion activa"
      onSearchChange={onSearchChange}
      actions={actions}
      controls={pageControls}
      windowState={pageControls.windowState}
      onClose={pageControls.onClose}
      onMinimize={pageControls.onMinimize}
      onRestore={pageControls.onRestore}
      onMaximize={pageControls.onMaximize}
    >
      <section className="sales-invoice-page sales-quotes-page">
        {message && <div className="sales-message">{message}</div>}

        <section className="erp-panel sales-compact-search-panel">
          <div className="sales-compact-search sales-quote-search">
            <Search size={16} />
            <input
              value={filters.query}
              onChange={(event) => updateFilter('query', event.target.value)}
              placeholder="Buscar por numero, cliente, fecha o RNC"
            />
            <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
              <option>Todos</option>
              <option>Borrador</option>
              <option>Emitida</option>
              <option>Aprobada</option>
              <option>Rechazada</option>
              <option>Vencida</option>
              <option>Convertida a factura</option>
              <option>Anulada</option>
            </select>
            <strong>{filteredQuotes.length} cotizaciones</strong>
          </div>
        </section>

        <section className="erp-panel sales-list-panel sales-main-list">
          <div className="sales-panel-heading">
            <div>
              <span>Registro</span>
              <h2>Cotizaciones generadas</h2>
            </div>
            {selectedQuote && <strong>{selectedQuote.number}</strong>}
          </div>

          <div className="sales-table-wrap">
            <table className="sales-table sales-quotes-table">
              <thead>
                <tr>
                  <th>Numero</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Validez</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.length === 0 && (
                  <tr>
                    <td colSpan="7" className="sales-empty-cell">No hay cotizaciones con esa busqueda.</td>
                  </tr>
                )}
                {filteredQuotes.map((item) => (
                  <tr
                    key={item.number}
                    className={selectedQuoteNumber === item.number ? 'is-selected' : ''}
                    onClick={() => setSelectedQuoteNumber(item.number)}
                  >
                    <td>{item.number}</td>
                    <td>{item.date}</td>
                    <td>
                      <strong>{item.customer || 'Cliente de contado'}</strong>
                      <small>{item.customerCode || 'Sin codigo'}</small>
                    </td>
                    <td>{currency(item.totals?.total || calculateTotals(item).total, settings)}</td>
                    <td><span className={`sales-state-badge ${String(item.state || '').toLowerCase().replaceAll(' ', '-')}`}>{item.state}</span></td>
                    <td>{item.validUntil}</td>
                    <td>
                      <div className="sales-row-actions">
                        <button type="button" title="Ver cotizacion" aria-label="Ver cotizacion" onClick={(event) => { event.stopPropagation(); setSelectedQuoteNumber(item.number); previewQuotePdf(item) }}>
                          <Eye size={15} />
                        </button>
                        <button type="button" title="Editar cotizacion" aria-label="Editar cotizacion" onClick={(event) => { event.stopPropagation(); openQuoteEditor(item) }}>
                          <Edit3 size={15} />
                        </button>
                        <button type="button" title="Imprimir cotizacion" aria-label="Imprimir cotizacion" onClick={(event) => { event.stopPropagation(); printQuotePdf(item) }}>
                          <Printer size={15} />
                        </button>
                        <button type="button" title="Descargar PDF" aria-label="Descargar PDF" onClick={(event) => { event.stopPropagation(); downloadQuotePdf(item) }}>
                          <Download size={15} />
                        </button>
                        <button type="button" title="Convertir a factura" aria-label="Convertir a factura" disabled={item.state === 'Convertida a factura' || item.state === 'Anulada'} onClick={(event) => { event.stopPropagation(); convertQuoteToInvoice(item) }}>
                          <FilePlus2 size={15} />
                        </button>
                        <button type="button" title="Enviar cotizacion" aria-label="Enviar cotizacion" onClick={(event) => { event.stopPropagation(); notify(`Cotizacion ${item.number} lista para envio.`) }}>
                          <Send size={15} />
                        </button>
                        <button type="button" className="is-danger" title="Anular cotizacion" aria-label="Anular cotizacion" disabled={item.state === 'Anulada'} onClick={(event) => { event.stopPropagation(); cancelQuote(item) }}>
                          <Ban size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {activeModal === 'quote' && quoteModalState === 'minimized' && (
          <button type="button" className="sales-minimized-invoice" onClick={() => setQuoteModalState('normal')}>
            <span>Cotizacion minimizada</span>
            <strong>{quote.number}</strong>
          </button>
        )}

        {activeModal === 'quote' && quoteModalState !== 'minimized' && (
          <div className="sales-modal-backdrop" role="presentation">
            <section className={`sales-modal sales-invoice-form-modal ${quoteModalState === 'maximized' ? 'is-maximized' : ''}`} role="dialog" aria-modal="true" aria-label="Formulario de cotizacion">
              <header>
                <div>
                  <span>{quote.number}</span>
                  <h2>{selectedQuoteNumber ? 'Editar cotizacion' : 'Nueva cotizacion'}</h2>
                </div>
                <div className="sales-modal-controls">
                  <button type="button" onClick={() => { setActiveModal(''); setQuoteModalState('normal') }} title="Salir" className="is-exit">
                    <X size={16} />
                    <span>Salir</span>
                  </button>
                  <button type="button" onClick={() => setQuoteModalState('minimized')} title="Minimizar">
                    <span>Minimizar</span>
                  </button>
                  <button type="button" onClick={() => setQuoteModalState((current) => (current === 'maximized' ? 'normal' : 'maximized'))} title="Maximizar">
                    <span>{quoteModalState === 'maximized' ? 'Restaurar' : 'Maximizar'}</span>
                  </button>
                </div>
              </header>

              <div className="sales-modal-body sales-invoice-modal-body">
                <section className="sales-modal-section">
                  <div className="sales-panel-heading">
                    <div>
                      <span>Cliente</span>
                      <h2>Seleccion de cliente</h2>
                    </div>
                    <strong>{quote.customer || 'Sin cliente'}</strong>
                  </div>

                  <div className="sales-client-picker">
                    <label className="sales-span-2">
                      Buscar por codigo, nombre o RNC
                      <div className="sales-search-input">
                        <Search size={16} />
                        <input value={customerQuery} onChange={(event) => updateCustomerQuery(event.target.value)} placeholder="CLI-001, cliente o RNC" />
                      </div>
                    </label>
                    <label className="sales-span-2">
                      Cliente registrado
                      <select value={quote.customerCode} onChange={(event) => selectCustomer(event.target.value)}>
                        <option value="">Seleccione un cliente</option>
                        {filteredCustomers.map((customer) => (
                          <option key={customer.code} value={customer.code}>
                            {customer.code} - {customer.name} - {customer.fiscalId || 'sin RNC'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="button" onClick={useCustomerQueryAsCashClient}>Usar contado</button>
                  </div>
                </section>

                <section className="sales-modal-section">
                  <div className="sales-panel-heading">
                    <div>
                      <span>Documento</span>
                      <h2>Datos de cotizacion</h2>
                    </div>
                    <strong>{quote.state}</strong>
                  </div>

                  <div className="sales-form-grid">
                    <label>Numero<input value={quote.number} readOnly /></label>
                    <label>Fecha<input type="date" value={quote.date} onChange={(event) => updateQuote('date', event.target.value)} /></label>
                    <label>Valida hasta<input type="date" value={quote.validUntil} onChange={(event) => updateQuote('validUntil', event.target.value)} /></label>
                    <label>Estado<select value={quote.state} onChange={(event) => updateQuote('state', event.target.value)}><option>Borrador</option><option>Emitida</option><option>Aprobada</option><option>Rechazada</option><option>Vencida</option><option>Convertida a factura</option><option>Anulada</option></select></label>
                    <label>Vendedor<input value={quote.seller} onChange={(event) => updateQuote('seller', event.target.value)} /></label>
                    <label>Sucursal<select value={quote.branch} onChange={(event) => handleBranchChange(event.target.value)}>{branches.map((branch) => <option key={branch.code} value={branch.code}>{branch.name || branch.code}</option>)}</select></label>
                    <label>Almacen referencia<select value={quote.warehouse} onChange={(event) => updateQuote('warehouse', event.target.value)}>{warehouses.map((warehouse) => <option key={warehouse.code} value={warehouse.code}>{warehouse.code} - {warehouse.name}</option>)}</select></label>
                    <label>Condicion de pago<select value={quote.paymentCondition} onChange={(event) => updateQuote('paymentCondition', event.target.value)}><option>Contado</option><option>Credito</option></select></label>
                    <label className="sales-span-2">Observaciones<textarea value={quote.observations} onChange={(event) => updateQuote('observations', event.target.value)} /></label>
                    <label className="sales-span-2">Condiciones comerciales<textarea value={quote.terms} onChange={(event) => updateQuote('terms', event.target.value)} /></label>
                  </div>
                </section>

                <section className="sales-modal-section sales-products-panel">
                  <div className="sales-panel-heading">
                    <div>
                      <span>Productos</span>
                      <h2>Detalle de productos</h2>
                    </div>
                    <strong>No descuenta inventario</strong>
                  </div>

                  <div className="sales-product-picker">
                    <label className="sales-span-2">
                      Buscar por codigo, nombre o codigo de barra
                      <div className="sales-search-input">
                        <Search size={16} />
                        <input value={productQuery} onChange={(event) => updateProductQuery(event.target.value)} placeholder="Escriba o escanee el producto" />
                      </div>
                    </label>
                    <label className="sales-span-2">
                      Producto
                      <select value={selectedProductCode} onChange={(event) => selectProduct(event.target.value)}>
                        <option value="">Seleccione un producto existente</option>
                        {availableProducts.map((product) => (
                          <option key={product.code} value={product.code}>
                            {product.code} - {product.name} | {product.unit} | Stock {formatNumber(product.stock, 0)} | {currency(product.price, settings)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="button" className="sales-primary-button" onClick={addProductLine}>
                      <FilePlus2 size={16} />
                      Agregar
                    </button>
                  </div>

                  <div className="sales-table-wrap">
                    <table className="sales-table sales-detail-table">
                      <thead>
                        <tr>
                          <th>Codigo</th>
                          <th>Producto</th>
                          <th>Unidad</th>
                          <th>Stock</th>
                          <th>Cantidad</th>
                          <th>Precio</th>
                          <th>Descuento</th>
                          <th>Impuesto</th>
                          <th>Total</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {quote.lines.length === 0 && (
                          <tr>
                            <td colSpan="10" className="sales-empty-cell">Agregue productos desde el buscador superior.</td>
                          </tr>
                        )}
                        {quote.lines.map((line) => (
                          <tr key={line.id}>
                            <td>{line.code}</td>
                            <td>
                              <div className="sales-product-cell">
                                {line.image ? <img src={line.image} alt={line.name} /> : <span>{String(line.name || 'P').slice(0, 1)}</span>}
                                <div><strong>{line.name}</strong><small>{line.description || 'Sin descripcion adicional'}</small></div>
                              </div>
                            </td>
                            <td>{line.unit}</td>
                            <td>{formatNumber(line.stock, 0)}</td>
                            <td><input type="number" min="0" step="0.01" value={line.quantity} onChange={(event) => updateLine(line.id, 'quantity', event.target.value)} /></td>
                            <td><input type="number" min="0" step="0.01" value={line.price} onChange={(event) => updateLine(line.id, 'price', event.target.value)} /></td>
                            <td><input type="number" min="0" step="0.01" value={line.discount} onChange={(event) => updateLine(line.id, 'discount', event.target.value)} /></td>
                            <td>{formatNumber(line.taxRate)}%</td>
                            <td>{currency(lineTotal(line), settings)}</td>
                            <td><button type="button" className="sales-icon-button" onClick={() => removeLine(line.id)} title="Eliminar producto"><Trash2 size={15} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="sales-modal-bottom-grid">
                  <div className="sales-note-box">
                    <strong>Importante</strong>
                    <span>Guardar esta cotizacion no descuenta inventario ni genera movimiento de salida.</span>
                  </div>
                  <aside className="sales-totals-panel">
                    <h2>Totales</h2>
                    <div className="sales-total-line"><span>Subtotal</span><strong>{currency(totals.subtotal, settings)}</strong></div>
                    <div className="sales-total-line"><span>Descuento</span><strong>{currency(totals.discountTotal, settings)}</strong></div>
                    <div className="sales-total-line"><span>Impuesto</span><strong>{currency(totals.taxTotal, settings)}</strong></div>
                    <div className="sales-total-line is-grand"><span>Total</span><strong>{currency(totals.total, settings)}</strong></div>
                  </aside>
                </section>
              </div>

              <footer>
                <button type="button" onClick={() => setActiveModal('')}>Cancelar</button>
                <button type="button" onClick={() => previewQuotePdf()}>Vista previa</button>
                <button type="button" onClick={() => downloadQuotePdf()}><Download size={16} /> Descargar PDF</button>
                <button type="button" className="sales-primary-button" onClick={saveQuote}><Save size={16} /> Guardar cotizacion</button>
              </footer>
            </section>
          </div>
        )}
      </section>
    </ModulePageLayout>
  )
}
