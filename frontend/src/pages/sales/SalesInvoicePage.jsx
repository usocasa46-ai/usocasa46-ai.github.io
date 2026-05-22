import {
  Ban,
  Download,
  Edit3,
  Eye,
  FilePlus2,
  Mail,
  Printer,
  Save,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import { customersService } from '../../services/customersService.js'
import { invoicesService } from '../../services/invoicesService.js'
import { productsService } from '../../services/productsService.js'
import { promotionsService } from '../../services/promotionsService.js'
import { settingsService } from '../../services/settingsService.js'
import { normalizeRnc, rncService } from '../../services/rncService.js'
import {
  createPdfMetadata,
  downloadSalesDocumentPdf,
  openSalesDocumentPdf,
  printSalesDocumentPdf,
} from '../../utils/pdf/salesDocumentPdf.js'
import { ACCOUNTING_KEYS, createSalesInvoiceEntry, readArray as readAccountingArray } from '../../utils/accountingEntries.js'
import { generateNextNcf, markNcfAsUsed, peekNextNcf } from '../../utils/ncfGenerator.js'
import { registerIssuedElectronicDocument } from '../../services/electronicBillingService.js'
import { applyPromotionsToLines, collectAppliedPromotions } from '../../utils/promotions/promotionEngine.js'
import { validateCouponPromotion } from '../../utils/promotions/promotionValidator.js'
import './SalesInvoicePage.css'

const INVOICES_KEY = 'invefat_sales_invoices'
const PRODUCTS_KEY = 'inveFatInventoryProducts'
const MOVEMENTS_KEY = 'invefat_inventory_movements'
const REPORTS_KEY = 'invefat_sales_reports'
const SETTINGS_KEY = 'invefat_company_settings'
const CUSTOMER_KEYS = ['invefat_sales_customers', 'invefat_customers', 'inveFatCustomers']

const paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia', 'Credito', 'Mixto']

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
    showSignature: true,
    showStamp: false,
    footerMessage: 'Documento generado por INVE-FAT SYSTEM.',
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
    {
      code: 'MAT-01',
      name: 'Empresa matriz',
      address: 'Direccion principal',
      status: 'Activa',
      mainWarehouse: 'ALM-01',
    },
  ],
  warehouses: [
    { code: 'ALM-01', name: 'Almacen Principal' },
    { code: 'ALM-02', name: 'Almacen Sucursal' },
  ],
  numbering: {
    invoice: { prefix: 'FAC', nextNumber: 1, length: 6, separator: '-' },
  },
  preferences: {
    allowNegativeStock: false,
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
    creditLimit: 0,
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

function normalizeProduct(product) {
  const rawTax = product.tax ?? product.impuesto ?? product.taxRate

  return {
    ...product,
    code: product.code || product.codigo || '',
    name: product.name || product.nombre || 'Producto sin nombre',
    description: product.description || product.descripcion || '',
    category: product.category || product.categoria || 'General',
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
    name: customer.name || customer.nombre || customer.customer || 'Cliente sin nombre',
    fiscalId: customer.fiscalId || customer.document || customer.rnc || customer.identification || customer.customerDocument || '',
    phone: customer.phone || customer.telefono || '',
    email: customer.email || customer.correo || '',
    invoiceEmail: customer.invoiceEmail || customer.email || customer.correoFactura || '',
    address: customer.address || customer.direccion || '',
    paymentCondition: customer.paymentCondition || customer.condicionPago || 'Contado',
    creditDays: toNumber(customer.creditDays || customer.diasCredito),
    creditLimit: toNumber(customer.creditLimit || customer.limiteCredito || customer.limit),
    priceList: customer.priceList || customer.listaPrecio || customer.listaPrecios || 'General',
    authorizedDiscount: toNumber(customer.authorizedDiscount || customer.descuentoAutorizado),
    preferredReceiptType: customer.preferredReceiptType || customer.tipoComprobante || 'Consumidor final',
    status: customer.status || customer.estado || 'Activo',
  }
}

function loadCustomers(invoices = []) {
  const storedCustomers = CUSTOMER_KEYS.flatMap((key) => {
    const saved = safeParse(key, [])
    return Array.isArray(saved) ? saved : []
  })

  const invoiceCustomers = invoices
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
  ;[...defaultCustomers, ...storedCustomers, ...invoiceCustomers]
    .map(normalizeCustomer)
    .filter((customer) => customer.code && customer.status !== 'Inactivo')
    .forEach((customer) => {
      byCode.set(customer.code, customer)
    })

  return Array.from(byCode.values())
}

function defaultTaxRate(settings) {
  return toNumber(settings?.preferences?.defaultTax || settings?.company?.defaultTax || 0)
}

function loadProducts() {
  const products = safeParse(PRODUCTS_KEY, [])
  return Array.isArray(products) ? products.map(normalizeProduct).filter((product) => product.code) : []
}

function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
  void productsService.replaceAll(products)
}

function loadInvoices() {
  const invoices = safeParse(INVOICES_KEY, [])
  return Array.isArray(invoices) ? invoices : []
}

function saveInvoices(invoices) {
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices))
  void invoicesService.replaceAll(invoices)
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

function nextNcf(settings, invoices) {
  if (!settings.fiscal?.useNcf) return ''
  return peekNextNcf(settings.fiscal.defaultReceiptType || settings.fiscal.ncfPrefix) || ''
}

function defaultBranch(settings) {
  const branch = settings.branches.find((item) => item.status !== 'Inactiva') || settings.branches[0]
  return branch || defaultSettings.branches[0]
}

function defaultWarehouse(settings, branchCode) {
  const branch = settings.branches.find((item) => item.code === branchCode) || defaultBranch(settings)
  return branch?.mainWarehouse || settings.warehouses[0]?.code || 'ALM-01'
}

function emptyInvoice(settings, invoices) {
  const branch = defaultBranch(settings)

  return {
    id: makeId('invoice'),
    number: nextInvoiceNumber(settings, invoices),
    date: todayDate(),
    customerCode: '',
    customer: '',
    fiscalId: '',
    phone: '',
    email: '',
    invoiceEmail: '',
    address: '',
    seller: 'Administrador',
    branch: branch.code,
    warehouse: defaultWarehouse(settings, branch.code),
    paymentCondition: 'Contado',
    paymentMethod: 'Efectivo',
    receiptType: settings.fiscal?.defaultReceiptType || 'Consumidor final',
    ncf: nextNcf(settings, invoices),
    ncfValidUntil: settings.fiscal?.ncfValidUntil || '',
    dueDate: todayDate(),
    creditDays: 0,
    creditLimit: 0,
    priceList: 'General',
    authorizedDiscount: 0,
    preferredReceiptType: 'Consumidor final',
    state: 'Borrador',
    paidAmount: 0,
    lines: [],
    inventoryApplied: false,
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

function calculateTotals(invoice) {
  const lines = Array.isArray(invoice.lines) ? invoice.lines : []
  const subtotal = lines.reduce((sum, line) => sum + toNumber(line.quantity) * toNumber(line.price), 0)
  const discountTotal = lines.reduce((sum, line) => sum + Math.min(toNumber(line.discount), toNumber(line.quantity) * toNumber(line.price)), 0)
  const taxTotal = lines.reduce((sum, line) => {
    const base = toNumber(line.quantity) * toNumber(line.price)
    const taxable = Math.max(base - Math.min(toNumber(line.discount), base), 0)
    return sum + taxable * (toNumber(line.taxRate) / 100)
  }, 0)
  const total = Math.max(subtotal - discountTotal + taxTotal, 0)
  const paid = toNumber(invoice.paidAmount)

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

function finalState(invoice, totals) {
  if (invoice.state === 'Anulada') return 'Anulada'
  if (invoice.paymentMethod === 'Credito') return 'Pendiente'
  if (toNumber(invoice.paidAmount) >= totals.total && totals.total > 0) return 'Pagada'
  return 'Guardada'
}

function reportFromInvoice(invoice, totals) {
  const lines = Array.isArray(invoice.lines) ? invoice.lines : []

  return {
    id: invoice.id,
    number: invoice.number,
    date: invoice.date,
    customer: invoice.customer,
    products: lines.map((line) => ({
      code: line.code,
      name: line.name,
      quantity: toNumber(line.quantity),
      subtotal: toNumber(line.quantity) * toNumber(line.price),
      tax: lineTotal(line) - Math.max(toNumber(line.quantity) * toNumber(line.price) - toNumber(line.discount), 0),
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
    updatedAt: new Date().toISOString(),
  }
}

export default function SalesInvoicePage({ controls, onAction, searchValue = '', onSearchChange }) {
  const [settings] = useState(() => loadSettings())
  const [products, setProducts] = useState(() => loadProducts())
  const [invoices, setInvoices] = useState(() => loadInvoices())
  const [customers, setCustomers] = useState(() => loadCustomers(loadInvoices()))
  const [invoice, setInvoice] = useState(() => emptyInvoice(loadSettings(), loadInvoices()))
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState('')
  const [filters, setFilters] = useState({
    query: '',
  })
  const [productQuery, setProductQuery] = useState('')
  const [customerQuery, setCustomerQuery] = useState('')
  const [rncLookupNote, setRncLookupNote] = useState('')
  const [selectedProductCode, setSelectedProductCode] = useState('')
  const [message, setMessage] = useState('')
  const [activeModal, setActiveModal] = useState('')
  const [invoiceModalState, setInvoiceModalState] = useState('normal')
  const [promotions, setPromotions] = useState([])
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState('')

  useEffect(() => {
    let isActive = true

    Promise.all([
      settingsService.getById(),
      productsService.getAll(),
      invoicesService.getAll(),
      customersService.getAll(),
      promotionsService.getAll(),
    ]).then(([storedSettings, storedProducts, storedInvoices, storedCustomers, storedPromotions]) => {
      if (!isActive) return

      if (storedSettings && Object.keys(storedSettings).length > 0) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(storedSettings))
      }

      if (Array.isArray(storedProducts) && storedProducts.length > 0) {
        const normalizedProducts = storedProducts.map(normalizeProduct)
        setProducts(normalizedProducts)
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(normalizedProducts))
      }

      if (Array.isArray(storedInvoices) && storedInvoices.length > 0) {
        setInvoices(storedInvoices)
        localStorage.setItem(INVOICES_KEY, JSON.stringify(storedInvoices))
      }

      if (Array.isArray(storedCustomers) && storedCustomers.length > 0) {
        localStorage.setItem('invefat_customers', JSON.stringify(storedCustomers))
        setCustomers(loadCustomers(Array.isArray(storedInvoices) ? storedInvoices : loadInvoices()))
      }

      setPromotions(Array.isArray(storedPromotions) ? storedPromotions : [])
    })

    return () => {
      isActive = false
    }
  }, [])

  const branches = useMemo(() => settings.branches || defaultSettings.branches, [settings.branches])
  const warehouses = useMemo(() => settings.warehouses || defaultSettings.warehouses, [settings.warehouses])
  const selectedInvoice = useMemo(() => (
    invoices.find((item) => item.number === selectedInvoiceNumber)
  ), [invoices, selectedInvoiceNumber])
  const totals = useMemo(() => calculateTotals(invoice), [invoice])

  const filteredInvoices = useMemo(() => {
    const global = `${searchValue} ${filters.query}`.trim().toLowerCase()

    return invoices.filter((item) => {
      return !global || [
        item.number,
        item.customer,
        item.fiscalId,
        item.customerCode,
      ].some((field) => String(field || '').toLowerCase().includes(global))
    })
  }, [filters, invoices, searchValue])

  const filteredCustomers = useMemo(() => {
    const query = customerQuery.trim().toLowerCase()
    return customers
      .filter((customer) => {
        if (!query) return true
        return [customer.code, customer.name, customer.fiscalId, customer.phone].some((field) => (
          String(field || '').toLowerCase().includes(query)
        ))
      })
      .slice(0, 40)
  }, [customerQuery, customers])

  const availableProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase()
    return products
      .filter((product) => product.status !== 'Inactivo')
      .filter((product) => {
        if (!query) return true
        return [product.code, product.name, product.barcode].some((field) => (
          String(field || '').toLowerCase().includes(query)
        ))
      })
      .slice(0, 50)
  }, [productQuery, products])

  const selectedProduct = useMemo(() => (
    products.find((product) => product.code === selectedProductCode)
  ), [products, selectedProductCode])

  const registeredCustomerCount = useMemo(() => (
    customers.filter((customer) => customer.code !== 'CLI-CONTADO').length
  ), [customers])

  const notify = (text) => {
    setMessage(text)
    onAction?.(text)
  }

  const promotionContext = (currentInvoice, couponCode = appliedCoupon) => ({
    couponCode,
    customerCode: currentInvoice.customerCode,
    customerGroup: currentInvoice.customerGroup || '',
    paymentMethod: currentInvoice.paymentMethod,
    branch: currentInvoice.branch,
    warehouse: currentInvoice.warehouse,
    fiscalReceipt: currentInvoice.receiptType && currentInvoice.receiptType !== 'Consumidor final',
  })

  const priceInvoiceLines = (currentInvoice, nextLines = currentInvoice.lines, couponCode = appliedCoupon) => {
    const result = applyPromotionsToLines(nextLines, promotions, promotionContext(currentInvoice, couponCode))
    return {
      ...currentInvoice,
      lines: result.lines,
      appliedPromotions: result.appliedPromotions,
      promotionSavings: result.savings,
      promotionCoupon: couponCode,
    }
  }

  const closePageOrModal = () => {
    if (activeModal === 'invoice' && invoiceModalState === 'maximized') {
      setInvoiceModalState('normal')
      return
    }

    if (activeModal) {
      setActiveModal('')
      setInvoiceModalState('normal')
      return
    }

    controls?.onClose?.()
  }

  const pageControls = {
    ...controls,
    onClose: closePageOrModal,
  }

  const updateInvoice = (field, value) => {
    setInvoice((current) => priceInvoiceLines({
      ...current,
      [field]: value,
    }))
  }

  const handleBranchChange = (branchCode) => {
    setInvoice((current) => priceInvoiceLines({
      ...current,
      branch: branchCode,
      warehouse: defaultWarehouse(settings, branchCode),
    }))
  }

  const selectCustomer = (customerCode) => {
    const customer = customers.find((item) => item.code === customerCode)
    if (!customer) return

    setInvoice((current) => priceInvoiceLines({
      ...current,
      customerCode: customer.code,
      customer: customer.name,
      fiscalId: customer.fiscalId,
      phone: customer.phone,
      email: customer.email,
      invoiceEmail: customer.invoiceEmail,
      address: customer.address,
      paymentCondition: customer.paymentCondition || current.paymentCondition,
      paymentMethod: customer.paymentCondition === 'Credito' ? 'Credito' : current.paymentMethod,
      creditDays: customer.creditDays || 0,
      creditLimit: customer.creditLimit || 0,
      priceList: customer.priceList || 'General',
      authorizedDiscount: customer.authorizedDiscount || 0,
      preferredReceiptType: customer.preferredReceiptType || 'Consumidor final',
    }))
    setCustomerQuery(`${customer.code} - ${customer.name} - ${customer.fiscalId || 'sin RNC'}`)
  }

  const applyRncLookupToInvoice = async (value) => {
    const rnc = normalizeRnc(value)
    if (rnc.length < 9) {
      setRncLookupNote('')
      return
    }

    const record = await rncService.getByRnc(rnc)
    if (!record) {
      setRncLookupNote('RNC no encontrado en la base.')
      return
    }

    setInvoice((current) => ({
      ...current,
      customerCode: current.customerCode || `RNC-${record.rnc}`,
      customer: record.razonSocial,
      fiscalId: record.rnc,
      fiscalActivity: record.actividadEconomica,
      fiscalStatus: record.estado,
      fiscalRegimen: record.regimenPago,
    }))
    setCustomerQuery(`${record.rnc} - ${record.razonSocial}`)
    setRncLookupNote(`RNC encontrado: ${record.razonSocial}`)
  }

  const updateCustomerQuery = (value) => {
    setCustomerQuery(value)
    const normalized = value.trim().toLowerCase()
    const match = customers.find((customer) => (
      customer.code.toLowerCase() === normalized || String(customer.fiscalId || '').toLowerCase() === normalized
    ))

    if (match) {
      selectCustomer(match.code)
      setRncLookupNote('')
      return
    }

    void applyRncLookupToInvoice(value)
  }

  const useCustomerQueryAsCashClient = () => {
    const name = customerQuery.trim()
    if (!name) {
      notify('Escriba el nombre del cliente o seleccione uno registrado.')
      return
    }

    setInvoice((current) => priceInvoiceLines({
      ...current,
      customerCode: 'CLI-CONTADO',
      customer: name,
      fiscalId: '',
      phone: '',
      email: '',
      invoiceEmail: '',
      address: '',
      paymentCondition: 'Contado',
      paymentMethod: current.paymentMethod === 'Credito' ? 'Efectivo' : current.paymentMethod,
      creditDays: 0,
      creditLimit: 0,
      priceList: 'General',
      authorizedDiscount: 0,
      preferredReceiptType: 'Consumidor final',
    }))
    notify('Cliente de contado aplicado a la factura.')
  }

  const startNewInvoice = () => {
    const freshInvoices = loadInvoices()
    const freshProducts = loadProducts()
    setInvoices(freshInvoices)
    setProducts(freshProducts)
    setCustomers(loadCustomers(freshInvoices))
    setInvoice(emptyInvoice(settings, freshInvoices))
    setSelectedInvoiceNumber('')
    setSelectedProductCode('')
    setProductQuery('')
    setCustomerQuery('')
    setCouponInput('')
    setAppliedCoupon('')
    setActiveModal('invoice')
    setInvoiceModalState('normal')
    notify('Nueva factura lista para registrar.')
  }

  const selectProduct = (code) => {
    const product = products.find((item) => item.code === code)
    setSelectedProductCode(code)

    if (product) {
      setProductQuery(`${product.code} - ${product.name}`)
    }
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

    const quantity = 1
    const productTax = selectedProduct.tax === null ? defaultTaxRate(settings) : selectedProduct.tax

    setInvoice((current) => {
      const existingLine = current.lines.find((line) => line.code === selectedProduct.code)

      if (existingLine) {
        return priceInvoiceLines({
          ...current,
          lines: current.lines.map((line) => (
            line.code === selectedProduct.code
              ? {
                  ...line,
                  quantity: toNumber(line.quantity) + quantity,
                }
              : line
          )),
        })
      }

      return priceInvoiceLines({
        ...current,
        lines: [
          ...current.lines,
          {
            id: makeId('line'),
            code: selectedProduct.code,
            name: selectedProduct.name,
            description: selectedProduct.description,
            unit: selectedProduct.unit,
            barcode: selectedProduct.barcode,
            image: selectedProduct.image,
            category: selectedProduct.category,
            supplierCode: selectedProduct.supplierCode,
            supplierName: selectedProduct.supplierName,
            stock: selectedProduct.stock,
            quantity,
            price: selectedProduct.price,
            discount: 0,
            manualDiscount: 0,
            taxRate: productTax || 0,
          },
        ],
      })
    })

    setSelectedProductCode('')
    setProductQuery('')
    notify('Producto agregado a la factura.')
  }

  const updateLine = (lineId, field, value) => {
    setInvoice((current) => priceInvoiceLines(current, current.lines.map((line) => (
      line.id === lineId
        ? { ...line, [field]: value, ...(field === 'discount' ? { manualDiscount: value } : {}) }
        : line
    ))))
  }

  const removeLine = (lineId) => {
    setInvoice((current) => priceInvoiceLines(current, current.lines.filter((line) => line.id !== lineId)))
  }

  const applyCoupon = () => {
    const couponCode = couponInput.trim().toUpperCase()
    const validation = validateCouponPromotion(promotions, couponCode, promotionContext(invoice, couponCode), invoice.lines)
    if (!validation.ok) {
      notify(validation.message)
      return
    }

    setAppliedCoupon(couponCode)
    setCouponInput(couponCode)
    setInvoice((current) => priceInvoiceLines(current, current.lines, couponCode))
    notify(validation.message)
  }

  const clearCoupon = () => {
    setAppliedCoupon('')
    setCouponInput('')
    setInvoice((current) => priceInvoiceLines(current, current.lines, ''))
    notify('Cupon removido de la factura.')
  }

  const validateInvoice = () => {
    if (!invoice.customer.trim()) return 'Debe indicar el cliente de la factura.'
    if (!invoice.lines.length) return 'Debe agregar al menos un producto.'

    const missing = invoice.lines.find((line) => !products.some((product) => product.code === line.code))
    if (missing) return `El producto ${missing.code} no existe en inventario.`

    const allowNegativeStock = Boolean(settings.preferences?.allowNegativeStock)
    if (!allowNegativeStock && !invoice.inventoryApplied) {
      const lowStockLine = invoice.lines.find((line) => {
        const product = products.find((item) => item.code === line.code)
        return product && toNumber(product.stock) < toNumber(line.quantity)
      })

      if (lowStockLine) {
        const product = products.find((item) => item.code === lowStockLine.code)
        return `Stock insuficiente para ${lowStockLine.name}. Disponible: ${formatNumber(product?.stock || 0)}.`
      }
    }

    return ''
  }

  const applyInventoryExit = (savedInvoice) => {
    const movementDate = new Date().toISOString()
    const movements = safeParse(MOVEMENTS_KEY, [])
    const nextMovements = Array.isArray(movements) ? [...movements] : []

    const nextProducts = products.map((product) => {
      const line = savedInvoice.lines.find((item) => item.code === product.code)
      if (!line) return product

      const nextStock = toNumber(product.stock) - toNumber(line.quantity)
      nextMovements.push({
        id: makeId('movement'),
        date: movementDate,
        type: 'Salida por venta',
        document: savedInvoice.number,
        productCode: line.code,
        productName: line.name,
        warehouse: savedInvoice.warehouse,
        branch: savedInvoice.branch,
        entry: 0,
        exit: toNumber(line.quantity),
        balance: nextStock,
        user: savedInvoice.seller || 'Administrador',
      })

      return {
        ...product,
        stock: nextStock,
        updatedAt: movementDate,
      }
    })

    saveProducts(nextProducts)
    localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(nextMovements))
    setProducts(nextProducts)
  }

  const saveReport = (savedInvoice, savedTotals) => {
    const reports = safeParse(REPORTS_KEY, [])
    const list = Array.isArray(reports) ? reports : []
    const record = reportFromInvoice(savedInvoice, savedTotals)
    const exists = list.some((item) => item.number === savedInvoice.number)
    const nextReports = exists
      ? list.map((item) => (item.number === savedInvoice.number ? record : item))
      : [record, ...list]

    localStorage.setItem(REPORTS_KEY, JSON.stringify(nextReports))
  }

  const updateInvoicePdfReference = (targetInvoice, pdfInfo) => {
    if (!targetInvoice?.number) return

    const nextInvoices = loadInvoices().map((item) => (
      item.number === targetInvoice.number
        ? {
            ...item,
            pdf: pdfInfo,
            updatedAt: new Date().toISOString(),
          }
        : item
    ))

    if (!nextInvoices.some((item) => item.number === targetInvoice.number)) return

    setInvoices(nextInvoices)
    saveInvoices(nextInvoices)

    if (invoice.number === targetInvoice.number) {
      setInvoice((current) => ({
        ...current,
        pdf: pdfInfo,
      }))
    }
  }

  const ensurePrintableInvoice = (targetInvoice = selectedInvoice || invoice) => {
    if (!targetInvoice || !Array.isArray(targetInvoice.lines) || !targetInvoice.lines.length) {
      notify('Agregue productos antes de generar el PDF.')
      return null
    }

    return {
      ...targetInvoice,
      totals: targetInvoice.totals || calculateTotals(targetInvoice),
    }
  }

  const saveInvoice = () => {
    const error = validateInvoice()
    if (error) {
      notify(error)
      return
    }

    const nextTotals = calculateTotals(invoice)
    const existing = invoices.find((item) => item.number === invoice.number)
    const shouldApplyInventory = !existing?.inventoryApplied && !invoice.inventoryApplied && invoice.state !== 'Anulada'
    const fiscalInvoice = {
      ...invoice,
      receiptType: invoice.receiptType || settings.fiscal?.defaultReceiptType || 'Consumidor final',
      ncf: invoice.ncf || nextNcf(settings, invoices),
      ncfValidUntil: invoice.ncfValidUntil || settings.fiscal?.ncfValidUntil || '',
    }

    if (settings.fiscal?.useNcf || fiscalInvoice.receiptType !== 'Consumidor final') {
      const nextSequenceNcf = peekNextNcf(fiscalInvoice.receiptType || settings.fiscal.defaultReceiptType)
      if (!invoice.ncf || fiscalInvoice.ncf === nextSequenceNcf) {
        const consumed = generateNextNcf(fiscalInvoice.receiptType || settings.fiscal.defaultReceiptType, fiscalInvoice.branch, {
          documentId: fiscalInvoice.number,
          documentType: 'Factura',
          moduloOrigen: 'Ventas > Factura',
          clienteProveedor: fiscalInvoice.customer,
          total: nextTotals.total,
          usuario: fiscalInvoice.seller,
        })
        if (consumed.ncf) {
          fiscalInvoice.ncf = consumed.ncf
          fiscalInvoice.ncfValidUntil = fiscalInvoice.ncfValidUntil || consumed.validUntil
          fiscalInvoice.ncfValidoHasta = fiscalInvoice.ncfValidUntil
          fiscalInvoice.tipoComprobante = fiscalInvoice.receiptType
          fiscalInvoice.comprobanteFiscal = fiscalInvoice.receiptType !== 'Consumidor final'
        } else if (fiscalInvoice.receiptType !== 'Consumidor final') {
          notify(consumed.error || 'No hay secuencia NCF disponible para esta factura.')
          return
        }
      }
    }

    const pdfInfo = createPdfMetadata(fiscalInvoice, settings, 'invoice')
    const savedInvoice = {
      ...fiscalInvoice,
      state: finalState(fiscalInvoice, nextTotals),
      totals: nextTotals,
      inventoryApplied: Boolean(existing?.inventoryApplied || invoice.inventoryApplied || shouldApplyInventory),
      appliedPromotions: collectAppliedPromotions(fiscalInvoice.lines),
      promotionCoupon: appliedCoupon,
      pdf: pdfInfo,
      updatedAt: new Date().toISOString(),
    }

    if (shouldApplyInventory) {
      applyInventoryExit(savedInvoice)
    }

    const nextInvoices = existing
      ? [savedInvoice, ...invoices.filter((item) => item.number !== savedInvoice.number)]
      : [savedInvoice, ...invoices]

    setInvoices(nextInvoices)
    saveInvoices(nextInvoices)
    saveReport(savedInvoice, nextTotals)
    if (savedInvoice.ncf) {
      markNcfAsUsed(savedInvoice.ncf, savedInvoice.number, 'Factura', {
        tipoComprobante: savedInvoice.tipoComprobante || savedInvoice.receiptType,
        clienteProveedor: savedInvoice.customer,
        total: savedInvoice.totals.total,
        usuario: savedInvoice.seller,
        moduloOrigen: 'Ventas > Factura',
      })
      registerIssuedElectronicDocument(savedInvoice, settings, {
        sourceModule: 'Ventas > Factura',
        documentType: 'Factura',
      })
    }
    const existingAccountingEntry = readAccountingArray(ACCOUNTING_KEYS.entries).some((entry) => entry.sourceDocument === savedInvoice.number && entry.sourceModule === 'Ventas')
    if (!existingAccountingEntry && savedInvoice.state !== 'Anulada') {
      createSalesInvoiceEntry(savedInvoice)
    }
    void promotionsService.recordSaleUsage({
      invoice: savedInvoice,
      source: 'Factura',
      userId: savedInvoice.seller,
    })
    setInvoice(savedInvoice)
    setSelectedInvoiceNumber(savedInvoice.number)
    setCustomers(loadCustomers(nextInvoices))
    setActiveModal('')
    setInvoiceModalState('normal')
    notify(`Factura ${savedInvoice.number} guardada correctamente.`)
  }

  const editSelectedInvoice = () => {
    if (!selectedInvoice) {
      notify('Seleccione una factura para editar.')
      return
    }

    openInvoiceEditor(selectedInvoice)
  }

  const openInvoiceEditor = (targetInvoice) => {
    const couponCode = targetInvoice.promotionCoupon || ''
    setAppliedCoupon(couponCode)
    setCouponInput(couponCode)
    setInvoice(priceInvoiceLines({
      ...targetInvoice,
      lines: Array.isArray(targetInvoice.lines) ? targetInvoice.lines : [],
    }, Array.isArray(targetInvoice.lines) ? targetInvoice.lines : [], couponCode))
    setSelectedInvoiceNumber(targetInvoice.number)
    setCustomerQuery(`${targetInvoice.customerCode || ''} ${targetInvoice.customer || ''} ${targetInvoice.fiscalId || ''}`.trim())
    setActiveModal('invoice')
    setInvoiceModalState('normal')
    notify(`Editando factura ${targetInvoice.number}.`)
  }

  const cancelSelectedInvoice = (targetInvoice = selectedInvoice) => {
    if (!targetInvoice) {
      notify('Seleccione una factura para anular.')
      return
    }

    const nextInvoices = invoices.map((item) => (
      item.number === targetInvoice.number
        ? { ...item, state: 'Anulada', updatedAt: new Date().toISOString() }
        : item
    ))

    setInvoices(nextInvoices)
    saveInvoices(nextInvoices)
    if (invoice.number === targetInvoice.number) {
      setInvoice((current) => ({ ...current, state: 'Anulada' }))
    }
    notify(`Factura ${targetInvoice.number} anulada.`)
  }

  const showPreview = async (targetInvoice = selectedInvoice || invoice) => {
    const printableInvoice = ensurePrintableInvoice(targetInvoice)
    if (!printableInvoice) return false

    const pdfInfo = await openSalesDocumentPdf({
      documentData: printableInvoice,
      settings,
      documentType: 'invoice',
    })
    updateInvoicePdfReference(printableInvoice, pdfInfo)
    notify(`PDF de factura ${printableInvoice.number} abierto en vista previa.`)
    return true
  }

  const printInvoice = async (targetInvoice = selectedInvoice || invoice) => {
    const printableInvoice = ensurePrintableInvoice(targetInvoice)
    if (!printableInvoice) return

    const pdfInfo = await printSalesDocumentPdf({
      documentData: printableInvoice,
      settings,
      documentType: 'invoice',
    })
    updateInvoicePdfReference(printableInvoice, pdfInfo)
    notify(`Factura ${printableInvoice.number} enviada a impresion.`)
  }

  const downloadInvoicePdf = async (targetInvoice = selectedInvoice || invoice) => {
    const printableInvoice = ensurePrintableInvoice(targetInvoice)
    if (!printableInvoice) return

    const pdfInfo = await downloadSalesDocumentPdf({
      documentData: printableInvoice,
      settings,
      documentType: 'invoice',
    })
    updateInvoicePdfReference(printableInvoice, pdfInfo)
    notify(`PDF de factura ${printableInvoice.number} descargado.`)
  }

  const sendInvoice = () => {
    notify('Factura preparada para envio. La integracion de correo quedo lista para una fase posterior.')
  }

  const updateFilter = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const actions = [
    { id: 'new', label: 'Nueva factura', icon: FilePlus2, variant: 'primary', onClick: startNewInvoice },
    { id: 'view', label: 'Ver', icon: Eye, disabled: !selectedInvoice, onClick: () => showPreview(selectedInvoice) },
    { id: 'print', label: 'Reimprimir', icon: Printer, disabled: !selectedInvoice, onClick: () => printInvoice(selectedInvoice) },
    { id: 'download', label: 'Descargar PDF', icon: Download, disabled: !selectedInvoice, onClick: () => downloadInvoicePdf(selectedInvoice) },
    { id: 'send', label: 'Enviar', icon: Send, disabled: !selectedInvoice, onClick: sendInvoice },
    { id: 'edit', label: 'Editar', icon: Edit3, disabled: !selectedInvoice, onClick: editSelectedInvoice },
    { id: 'cancel', label: 'Anular', icon: Ban, variant: 'danger', disabled: !selectedInvoice || selectedInvoice.state === 'Anulada', onClick: cancelSelectedInvoice },
    { id: 'close', label: 'Salir', icon: X, onClick: () => controls?.onClose?.() },
  ]

  return (
    <ModulePageLayout
      title="Factura"
      moduleLabel="Ventas"
      breadcrumb={['Ventas', 'Factura']}
      description="Registra ventas, descuenta inventario y deja la informacion lista para reportes e impresion."
      searchValue={searchValue}
      searchPlaceholder="Buscar factura activa"
      onSearchChange={onSearchChange}
      actions={actions}
      controls={pageControls}
      windowState={pageControls.windowState}
      onClose={pageControls.onClose}
      onMinimize={pageControls.onMinimize}
      onRestore={pageControls.onRestore}
      onMaximize={pageControls.onMaximize}
    >
      <section className="sales-invoice-page">
        {message && <div className="sales-message">{message}</div>}

        <section className="erp-panel sales-compact-search-panel">
          <div className="sales-compact-search">
            <Search size={16} />
            <input
              value={filters.query}
              onChange={(event) => updateFilter('query', event.target.value)}
              placeholder="Buscar por numero, cliente, RNC o codigo"
            />
            <strong>{filteredInvoices.length} facturas</strong>
          </div>
        </section>

        <section className="erp-panel sales-list-panel sales-main-list">
          <div className="sales-panel-heading">
            <div>
              <span>Registro</span>
              <h2>Facturas generadas</h2>
            </div>
            {selectedInvoice && <strong>{selectedInvoice.number}</strong>}
          </div>

          <div className="sales-table-wrap">
            <table className="sales-table sales-invoices-table">
              <thead>
                <tr>
                  <th>Numero</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>RNC</th>
                  <th>Total</th>
                  <th>Forma de pago</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan="8" className="sales-empty-cell">No hay facturas generadas con esa busqueda.</td>
                  </tr>
                )}
                {filteredInvoices.map((item) => (
                  <tr
                    key={item.number}
                    className={selectedInvoiceNumber === item.number ? 'is-selected' : ''}
                    onClick={() => setSelectedInvoiceNumber(item.number)}
                  >
                    <td>{item.number}</td>
                    <td>{item.date}</td>
                    <td>
                      <strong>{item.customer || 'Cliente de contado'}</strong>
                      <small>{item.customerCode || 'Sin codigo'}</small>
                    </td>
                    <td>{item.fiscalId || 'N/D'}</td>
                    <td>{currency(item.totals?.total || calculateTotals(item).total, settings)}</td>
                    <td>{item.paymentMethod}</td>
                    <td><span className={`sales-state-badge ${String(item.state || '').toLowerCase()}`}>{item.state}</span></td>
                    <td>
                      <div className="sales-row-actions">
                        <button type="button" className="sales-icon-action" title="Ver factura" aria-label="Ver factura" onClick={(event) => { event.stopPropagation(); setSelectedInvoiceNumber(item.number); showPreview(item) }}>
                          <Eye size={15} />
                        </button>
                        <button type="button" className="sales-icon-action" title="Reimprimir factura" aria-label="Reimprimir factura" onClick={(event) => { event.stopPropagation(); setSelectedInvoiceNumber(item.number); printInvoice(item) }}>
                          <Printer size={15} />
                        </button>
                        <button type="button" className="sales-icon-action" title="Descargar PDF" aria-label="Descargar PDF" onClick={(event) => { event.stopPropagation(); setSelectedInvoiceNumber(item.number); downloadInvoicePdf(item) }}>
                          <Download size={15} />
                        </button>
                        <button type="button" className="sales-icon-action" title="Enviar factura" aria-label="Enviar factura" onClick={(event) => { event.stopPropagation(); setSelectedInvoiceNumber(item.number); sendInvoice() }}>
                          <Send size={15} />
                        </button>
                        <button type="button" className="sales-icon-action" title="Editar factura" aria-label="Editar factura" onClick={(event) => { event.stopPropagation(); openInvoiceEditor(item) }}>
                          <Edit3 size={15} />
                        </button>
                        <button type="button" className="sales-icon-action is-danger" title="Anular factura" aria-label="Anular factura" disabled={item.state === 'Anulada'} onClick={(event) => { event.stopPropagation(); setSelectedInvoiceNumber(item.number); cancelSelectedInvoice(item) }}>
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

        {activeModal === 'invoice' && invoiceModalState === 'minimized' && (
          <button type="button" className="sales-minimized-invoice" onClick={() => setInvoiceModalState('normal')}>
            <span>Factura minimizada</span>
            <strong>{invoice.number}</strong>
          </button>
        )}

        {activeModal === 'invoice' && invoiceModalState !== 'minimized' && (
          <div className="sales-modal-backdrop" role="presentation">
            <section className={`sales-modal sales-invoice-form-modal ${invoiceModalState === 'maximized' ? 'is-maximized' : ''}`} role="dialog" aria-modal="true" aria-label="Formulario de factura">
              <header>
                <div>
                  <span>{invoice.number}</span>
                  <h2>{selectedInvoiceNumber ? 'Editar factura' : 'Nueva factura'}</h2>
                </div>
                <div className="sales-modal-controls">
                  <button type="button" onClick={() => { setActiveModal(''); setInvoiceModalState('normal') }} title="Salir" className="is-exit">
                    <X size={16} />
                    <span>Salir</span>
                  </button>
                  <button type="button" onClick={() => setInvoiceModalState('minimized')} title="Minimizar">
                    <span>Minimizar</span>
                  </button>
                  <button type="button" onClick={() => setInvoiceModalState((current) => (current === 'maximized' ? 'normal' : 'maximized'))} title="Maximizar">
                    <span>{invoiceModalState === 'maximized' ? 'Restaurar' : 'Maximizar'}</span>
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
                    <strong>{invoice.customer || 'Sin cliente'}</strong>
                  </div>

                  <div className="sales-client-picker">
                    <label className="sales-span-2">
                      Buscar por codigo, nombre o RNC
                      <div className="sales-search-input">
                        <Search size={16} />
                        <input
                          value={customerQuery}
                          onChange={(event) => updateCustomerQuery(event.target.value)}
                          placeholder="CLI-001, cliente o RNC"
                        />
                      </div>
                    </label>
                    <label className="sales-span-2">
                      Cliente registrado
                      <select value={invoice.customerCode} onChange={(event) => selectCustomer(event.target.value)}>
                        <option value="">Seleccione un cliente</option>
                        {filteredCustomers.map((customer) => (
                          <option key={customer.code} value={customer.code}>
                            {customer.code} - {customer.name} - {customer.fiscalId || 'sin RNC'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="button" onClick={useCustomerQueryAsCashClient}>Usar contado</button>
                    <button type="button" onClick={() => notify('Crear cliente rapido queda preparado para una fase posterior.')}>Crear cliente rapido</button>
                  </div>
                  {registeredCustomerCount === 0 && (
                    <p className="sales-empty-note">No hay clientes registrados. Puede usar cliente de contado o crear clientes desde Ventas &gt; Clientes.</p>
                  )}
                  {rncLookupNote && <p className="sales-empty-note">{rncLookupNote}</p>}

                  <div className="sales-client-summary">
                    <article><span>Nombre</span><strong>{invoice.customer || 'Pendiente'}</strong></article>
                    <article><span>RNC / ID</span><strong>{invoice.fiscalId || 'N/D'}</strong></article>
                    <article><span>Telefono</span><strong>{invoice.phone || 'N/D'}</strong></article>
                    <article><span>Direccion</span><strong>{invoice.address || 'N/D'}</strong></article>
                    <article><span>Condicion</span><strong>{invoice.paymentCondition}</strong></article>
                    <article><span>Dias credito</span><strong>{invoice.creditDays || 0}</strong></article>
                    <article><span>Correo</span><strong>{invoice.email || invoice.invoiceEmail || 'N/D'}</strong></article>
                    <article><span>Lista precio</span><strong>{invoice.priceList || 'General'}</strong></article>
                  </div>
                </section>

                <section className="sales-modal-section">
                  <div className="sales-panel-heading">
                    <div>
                      <span>Documento</span>
                      <h2>Datos de factura</h2>
                    </div>
                    <strong>{invoice.state}</strong>
                  </div>

                  <div className="sales-form-grid">
                    <label>
                      Numero
                      <input value={invoice.number} readOnly />
                    </label>
                    <label>
                      Fecha
                      <input type="date" value={invoice.date} onChange={(event) => updateInvoice('date', event.target.value)} />
                    </label>
                    <label>
                      Vendedor
                      <input value={invoice.seller} onChange={(event) => updateInvoice('seller', event.target.value)} />
                    </label>
                    <label>
                      Sucursal
                      <select value={invoice.branch} onChange={(event) => handleBranchChange(event.target.value)}>
                        {branches.map((branch) => (
                          <option key={branch.code} value={branch.code}>{branch.name || branch.code}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Almacen origen
                      <select value={invoice.warehouse} onChange={(event) => updateInvoice('warehouse', event.target.value)}>
                        {warehouses.map((warehouse) => (
                          <option key={warehouse.code} value={warehouse.code}>{warehouse.code} - {warehouse.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Forma de pago
                      <select value={invoice.paymentMethod} onChange={(event) => updateInvoice('paymentMethod', event.target.value)}>
                        {paymentMethods.map((method) => <option key={method}>{method}</option>)}
                      </select>
                    </label>
                    <label>
                      Condicion
                      <select value={invoice.paymentCondition} onChange={(event) => updateInvoice('paymentCondition', event.target.value)}>
                        <option>Contado</option>
                        <option>Credito</option>
                      </select>
                    </label>
                    <label>
                      Tipo de comprobante
                      <select value={invoice.receiptType} onChange={(event) => updateInvoice('receiptType', event.target.value)}>
                        <option>Consumidor final</option>
                        <option>Credito fiscal</option>
                        <option>Gubernamental</option>
                        <option>Regimen especial</option>
                      </select>
                    </label>
                    <label>
                      NCF
                      <input value={invoice.ncf || ''} onChange={(event) => updateInvoice('ncf', event.target.value)} placeholder={settings.fiscal?.useNcf ? 'NCF automatico' : 'NCF opcional'} />
                    </label>
                    <label>
                      Valido hasta
                      <input type="date" value={invoice.ncfValidUntil || ''} onChange={(event) => updateInvoice('ncfValidUntil', event.target.value)} />
                    </label>
                    {invoice.paymentMethod === 'Credito' ? (
                      <>
                        <label>
                          Vencimiento
                          <input type="date" value={invoice.dueDate} onChange={(event) => updateInvoice('dueDate', event.target.value)} />
                        </label>
                        <label>
                          Dias de credito
                          <input type="number" min="0" value={invoice.creditDays} onChange={(event) => updateInvoice('creditDays', event.target.value)} />
                        </label>
                        <label>
                          Balance pendiente
                          <input value={currency(totals.balance, settings)} readOnly />
                        </label>
                      </>
                    ) : (
                      <>
                        <label>
                          Monto recibido
                          <input type="number" min="0" step="0.01" value={invoice.paidAmount} onChange={(event) => updateInvoice('paidAmount', event.target.value)} />
                        </label>
                        <label>
                          Devuelta
                          <input value={currency(totals.change, settings)} readOnly />
                        </label>
                      </>
                    )}
                  </div>
                </section>

                <section className="sales-modal-section sales-products-panel">
                  <div className="sales-panel-heading">
                    <div>
                      <span>Productos</span>
                      <h2>Detalle de productos</h2>
                    </div>
                    <strong>{products.length} en inventario</strong>
                  </div>

                  <div className="sales-product-picker">
                    <label className="sales-span-2">
                      Buscar por codigo, nombre o codigo de barra
                      <div className="sales-search-input">
                        <Search size={16} />
                        <input
                          value={productQuery}
                          onChange={(event) => updateProductQuery(event.target.value)}
                          placeholder="Escriba o escanee el producto"
                        />
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
                          <th>Barra</th>
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
                        {invoice.lines.length === 0 && (
                          <tr>
                            <td colSpan="11" className="sales-empty-cell">Agregue productos desde el buscador superior.</td>
                          </tr>
                        )}
                        {invoice.lines.map((line) => (
                          <tr key={line.id}>
                            <td>{line.code}</td>
                            <td>
                              <div className="sales-product-cell">
                                {line.image ? <img src={line.image} alt={line.name} /> : <span>{String(line.name || 'P').slice(0, 1)}</span>}
                                <div>
                                  <strong>{line.name}</strong>
                                  <small>{line.description || 'Sin descripcion adicional'}</small>
                                  {line.promotionApplications?.length > 0 && <small className="sales-promo-line-note">Oferta: {line.promotionApplications.map((promotion) => promotion.name).join(', ')}</small>}
                                </div>
                              </div>
                            </td>
                            <td>{line.unit}</td>
                            <td>{line.barcode || 'N/D'}</td>
                            <td>{formatNumber(line.stock, 0)}</td>
                            <td>
                              <input type="number" min="0" step="0.01" value={line.quantity} onChange={(event) => updateLine(line.id, 'quantity', event.target.value)} />
                            </td>
                            <td>
                              <input type="number" min="0" step="0.01" value={line.price} onChange={(event) => updateLine(line.id, 'price', event.target.value)} />
                            </td>
                            <td>
                              <input type="number" min="0" step="0.01" value={line.manualDiscount ?? line.discount} onChange={(event) => updateLine(line.id, 'discount', event.target.value)} />
                            </td>
                            <td>{formatNumber(line.taxRate)}%</td>
                            <td>{currency(lineTotal(line), settings)}</td>
                            <td>
                              <button type="button" className="sales-icon-button" onClick={() => removeLine(line.id)} title="Eliminar producto">
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="sales-modal-bottom-grid">
                  <div className="sales-note-box">
                    <strong>Impresion lista</strong>
                    <span>Al guardar, la factura queda disponible para ver y reimprimir desde el listado.</span>
                  </div>
                  <aside className="sales-totals-panel">
                    <h2>Totales</h2>
                    <div className="sales-promotion-coupon">
                      <label>
                        Aplicar cupon / oferta
                        <span>
                          <input value={couponInput} onChange={(event) => setCouponInput(event.target.value.toUpperCase())} placeholder="VERANO10" />
                          <button type="button" onClick={applyCoupon}>Aplicar</button>
                        </span>
                      </label>
                      {appliedCoupon && <button type="button" onClick={clearCoupon}>Quitar {appliedCoupon}</button>}
                      {invoice.appliedPromotions?.length > 0 && <small>Ofertas: {invoice.appliedPromotions.map((promotion) => promotion.name).join(', ')}. Ahorro {currency(invoice.promotionSavings || 0, settings)}.</small>}
                    </div>
                    <div className="sales-total-line"><span>Subtotal</span><strong>{currency(totals.subtotal, settings)}</strong></div>
                    <div className="sales-total-line"><span>Descuento</span><strong>{currency(totals.discountTotal, settings)}</strong></div>
                    <div className="sales-total-line"><span>Impuesto</span><strong>{currency(totals.taxTotal, settings)}</strong></div>
                    <div className="sales-total-line"><span>Pagado</span><strong>{currency(totals.paid, settings)}</strong></div>
                    <div className="sales-total-line"><span>Balance</span><strong>{currency(totals.balance, settings)}</strong></div>
                    <div className="sales-total-line is-grand"><span>Total</span><strong>{currency(totals.total, settings)}</strong></div>
                  </aside>
                </section>
              </div>

              <footer>
                <button type="button" onClick={() => setActiveModal('')}>Cancelar</button>
                <button type="button" onClick={() => showPreview()}>Vista previa</button>
                <button type="button" onClick={() => downloadInvoicePdf()}>
                  <Download size={16} />
                  Descargar PDF
                </button>
                <button type="button" className="sales-primary-button" onClick={saveInvoice}>
                  <Save size={16} />
                  Guardar factura
                </button>
              </footer>
            </section>
          </div>
        )}

        {activeModal === 'preview' && (
          <div className="sales-modal-backdrop" role="presentation">
            <section className="sales-modal sales-preview-modal" role="dialog" aria-modal="true" aria-label="Vista previa de factura">
              <header>
                <div>
                  <span>{settings.billing.printFormat} / {settings.billing.invoiceModel}</span>
                  <h2>Vista previa de factura</h2>
                </div>
                <button type="button" onClick={() => setActiveModal('')} title="Cerrar">
                  <X size={18} />
                </button>
              </header>
              <div className="sales-modal-body">
                <article className="sales-print-preview">
                  <div className="sales-print-header">
                    {settings.documentOptions.showLogo && settings.brand.logo && (
                      <img src={settings.brand.logo} alt="Logo empresa" />
                    )}
                    <div>
                      <h3>{settings.company.tradeName || settings.company.legalName}</h3>
                      {settings.documentOptions.showFiscalId && <p>RNC: {settings.company.fiscalId || 'N/D'}</p>}
                      {settings.documentOptions.showAddress && <p>{settings.company.address || 'Direccion principal'}</p>}
                      {settings.documentOptions.showPhone && <p>Tel: {settings.company.phone || 'N/D'}</p>}
                    </div>
                    <aside>
                      <strong>Factura</strong>
                      <span>{invoice.number}</span>
                      <small>{invoice.date}</small>
                    </aside>
                  </div>

                  <div className="sales-print-customer">
                    <div>
                      <span>Cliente</span>
                      <strong>{invoice.customer || 'Cliente de contado'}</strong>
                      <p>{invoice.fiscalId || 'Identificacion no registrada'}</p>
                    </div>
                    <div>
                      <span>Pago</span>
                      <strong>{invoice.paymentMethod}</strong>
                      <p>{invoice.state}</p>
                    </div>
                    {settings.documentOptions.showWarehouse && (
                      <div>
                        <span>Almacen</span>
                        <strong>{invoice.warehouse}</strong>
                        <p>{invoice.branch}</p>
                      </div>
                    )}
                  </div>

                  <table className="sales-print-table">
                    <thead>
                      <tr>
                        <th>Codigo</th>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>Precio</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lines.map((line) => (
                        <tr key={line.id}>
                          <td>{line.code}</td>
                          <td>{line.name}</td>
                          <td>{formatNumber(line.quantity)}</td>
                          <td>{currency(line.price, settings)}</td>
                          <td>{currency(lineTotal(line), settings)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="sales-print-summary">
                    <div>
                      {settings.documentOptions.showLegalNote && <p>{settings.company.legalNote}</p>}
                      <p>{settings.billing.footerMessage}</p>
                    </div>
                    <aside>
                      <span>Subtotal <strong>{currency(totals.subtotal, settings)}</strong></span>
                      <span>Impuesto <strong>{currency(totals.taxTotal, settings)}</strong></span>
                      <span className="is-grand">Total <strong>{currency(totals.total, settings)}</strong></span>
                    </aside>
                  </div>
                </article>
              </div>
              <footer>
                <button type="button" onClick={() => setActiveModal('')}>Cerrar</button>
                <button type="button" className="sales-primary-button" onClick={() => window.print()}>
                  <Printer size={16} />
                  Imprimir
                </button>
                <button type="button" onClick={sendInvoice}>
                  <Mail size={16} />
                  Enviar
                </button>
              </footer>
            </section>
          </div>
        )}
      </section>
    </ModulePageLayout>
  )
}
