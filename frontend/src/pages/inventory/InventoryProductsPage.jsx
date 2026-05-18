import {
  Ban,
  CheckCircle2,
  Download,
  Edit3,
  FilePlus2,
  History,
  PackageSearch,
  Printer,
  Save,
  Upload,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import { productsService } from '../../services/productsService.js'
import './InventoryProductsPage.css'

const STORAGE_KEY = 'inveFatInventoryProducts'
const SUPPLIERS_KEY = 'invefat_suppliers'
const SALES_INVOICES_KEY = 'invefat_sales_invoices'
const INVENTORY_MOVEMENT_KEYS = ['invefat_inventory_movements', 'inveFatInventoryMovements', 'inventory_movements']
const TRANSFER_KEYS = ['invefat_warehouse_transfers', 'invefat_inventory_transfers', 'invefat_stock_transfers']
const RECEIVING_KEYS = ['invefat_warehouse_receivings', 'invefat_receivings', 'invefat_purchase_receivings']

const defaultProducts = [
  {
    code: 'PRD-1020',
    name: 'Aceite premium 1L',
    description: 'Aceite premium para venta regular.',
    category: 'Lubricantes',
    brand: 'Linea Pro',
    unit: 'Unidad',
    barcode: '7460001020007',
    cost: 280,
    price: 385,
    tax: 'ITBIS 18%',
    minStock: 40,
    maxStock: 240,
    stock: 148,
    status: 'Activo',
    createdAt: '2026-05-17T09:00:00.000Z',
    updatedAt: '2026-05-17T09:00:00.000Z',
  },
  {
    code: 'PRD-1104',
    name: 'Filtro industrial',
    description: 'Filtro para mantenimiento industrial.',
    category: 'Repuestos',
    brand: 'MaxParts',
    unit: 'Unidad',
    barcode: '7460001104004',
    cost: 640,
    price: 890,
    tax: 'ITBIS 18%',
    minStock: 20,
    maxStock: 120,
    stock: 34,
    status: 'Activo',
    createdAt: '2026-05-16T11:30:00.000Z',
    updatedAt: '2026-05-16T11:30:00.000Z',
  },
  {
    code: 'PRD-1322',
    name: 'Empaque sellado',
    description: 'Empaque sellado para proteccion de productos.',
    category: 'Materiales',
    brand: 'PackLine',
    unit: 'Caja',
    barcode: '7460001322002',
    cost: 78,
    price: 125,
    tax: 'ITBIS 18%',
    minStock: 30,
    maxStock: 260,
    stock: 12,
    status: 'Activo',
    createdAt: '2026-05-15T15:20:00.000Z',
    updatedAt: '2026-05-15T15:20:00.000Z',
  },
  {
    code: 'PRD-1405',
    name: 'Valvula acero',
    description: 'Valvula de acero para repuesto tecnico.',
    category: 'Repuestos',
    brand: 'SteelPro',
    unit: 'Unidad',
    barcode: '7460001405002',
    cost: 510,
    price: 760,
    tax: 'ITBIS 18%',
    minStock: 15,
    maxStock: 90,
    stock: 0,
    status: 'Inactivo',
    createdAt: '2026-05-14T10:10:00.000Z',
    updatedAt: '2026-05-14T10:10:00.000Z',
  },
]

const initialFilters = {
  code: '',
  name: '',
  category: '',
  brand: '',
  status: 'Todos',
}

const initialMovementFilters = {
  document: '',
  type: 'Todos',
  dateFrom: '',
  dateTo: '',
}

const bulkImportExample = `codigo,nombre,categoria,unidad,costo,precio,stock,codigoBarra,proveedor
PRD-001,Producto A,General,UND,100,150,10,123456,Proveedor 1
PRD-002,Producto B,General,UND,200,250,5,789456,Proveedor 1`

function normalizeNumber(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function parseNumber(value) {
  const numericValue = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(numericValue) ? numericValue : 0
}

function normalizeProduct(product) {
  return {
    code: String(product.code || '').trim(),
    name: String(product.name || '').trim(),
    description: String(product.description || '').trim(),
    category: String(product.category || '').trim(),
    brand: String(product.brand || '').trim(),
    unit: String(product.unit || 'Unidad').trim(),
    barcode: String(product.barcode || '').trim(),
    cost: normalizeNumber(product.cost),
    price: normalizeNumber(product.price),
    tax: String(product.tax || 'ITBIS 18%').trim(),
    minStock: normalizeNumber(product.minStock),
    maxStock: normalizeNumber(product.maxStock),
    stock: normalizeNumber(product.stock),
    supplierId: String(product.supplierId || product.supplierCode || '').trim(),
    supplierCode: String(product.supplierCode || product.providerCode || product.mainSupplierCode || '').trim(),
    supplierName: String(product.supplierName || product.providerName || product.supplier || product.provider || '').trim(),
    status: product.status === 'Inactivo' ? 'Inactivo' : 'Activo',
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || new Date().toISOString(),
  }
}

function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  void productsService.replaceAll(products)
}

function loadProducts() {
  try {
    const savedProducts = localStorage.getItem(STORAGE_KEY)
    const parsedProducts = savedProducts ? JSON.parse(savedProducts) : null

    if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
      return parsedProducts.map(normalizeProduct)
    }
  } catch {
    // Usar productos base si hay datos corruptos.
  }

  saveProducts(defaultProducts)
  return defaultProducts
}

function nextProductCode(products) {
  const highestNumber = products.reduce((highest, product) => {
    const match = String(product.code || '').match(/PRD-(\d+)/)
    const value = match ? Number(match[1]) : 0
    return Math.max(highest, value)
  }, 0)

  return `PRD-${String(highestNumber + 1).padStart(4, '0')}`
}

function createEmptyProduct(products) {
  return {
    code: nextProductCode(products),
    name: '',
    description: '',
    category: '',
    brand: '',
    unit: 'Unidad',
    barcode: '',
    cost: '',
    price: '',
    tax: 'ITBIS 18%',
    minStock: '',
    maxStock: '',
    stock: '',
    supplierId: '',
    supplierCode: '',
    supplierName: '',
    status: 'Activo',
  }
}

function formatCurrency(value) {
  return `RD$ ${normalizeNumber(value).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function isLowStock(product) {
  return product.status === 'Activo' && normalizeNumber(product.stock) <= normalizeNumber(product.minStock)
}

function productMatchesText(product, value) {
  const text = String(value || '').toLowerCase().trim()
  if (!text) return true

  return [
    product.code,
    product.name,
    product.description,
    product.category,
    product.brand,
    product.unit,
    product.barcode,
    product.supplierCode,
    product.supplierName,
    product.status,
  ].some((field) => String(field || '').toLowerCase().includes(text))
}

function exportProducts(products) {
  const headers = ['Codigo', 'Producto', 'Categoria', 'Unidad', 'Costo', 'Precio', 'Stock', 'Proveedor', 'Estado']
  const rows = products.map((product) => [
    product.code,
    product.name,
    product.category,
    product.unit,
    product.cost,
    product.price,
    product.stock,
    product.supplierName,
    product.status,
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'productos-inventario.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function productStatusClass(product) {
  if (product.status === 'Inactivo') return 'erp-badge is-danger'
  if (isLowStock(product)) return 'erp-badge is-warning'
  return 'erp-badge is-success'
}

function loadStorageArray(key) {
  try {
    const saved = localStorage.getItem(key)
    const parsed = saved ? JSON.parse(saved) : []
    if (Array.isArray(parsed)) return parsed
    if (parsed && typeof parsed === 'object') return Object.values(parsed)
  } catch {
    // Ignorar claves corruptas y continuar con las demas fuentes.
  }

  return []
}

function normalizeSupplier(supplier) {
  const code = String(supplier.code || supplier.supplierCode || supplier.id || '').trim()
  const name = String(supplier.commercialName || supplier.name || supplier.legalName || supplier.supplierName || '').trim()

  return {
    id: String(supplier.id || code || name).trim(),
    code,
    name,
    status: supplier.status || supplier.estado || 'Activo',
  }
}

function loadSuppliers() {
  return loadStorageArray(SUPPLIERS_KEY)
    .map(normalizeSupplier)
    .filter((supplier) => supplier.name && supplier.status !== 'Inactivo')
}

function findSupplierMatch(value, suppliers) {
  const cleanValue = cleanText(value)
  if (!cleanValue) return null

  return suppliers.find((supplier) => (
    cleanText(supplier.code) === cleanValue ||
    cleanText(supplier.name) === cleanValue ||
    cleanText(`${supplier.code} - ${supplier.name}`) === cleanValue
  )) || null
}

function loadArraysFromKeys(keys) {
  return keys.flatMap((key) => loadStorageArray(key).map((item) => ({ ...item, __sourceKey: key })))
}

function cleanText(value) {
  return String(value ?? '').trim().toLowerCase()
}

function itemMatchesProduct(item, product) {
  if (!item || !product) return false

  const productId = cleanText(product.id)
  const productCode = cleanText(product.code)
  const productName = cleanText(product.name)
  const productBarcode = cleanText(product.barcode)
  const itemId = cleanText(item.productId || item.productID || item.id || item.itemId)
  const itemCode = cleanText(item.productCode || item.code || item.codigo || item.sku)
  const itemName = cleanText(item.productName || item.name || item.item || item.nombre)
  const itemBarcode = cleanText(item.barcode || item.codigoBarra)

  return Boolean(
    (productId && itemId && productId === itemId) ||
    (productCode && itemCode && productCode === itemCode) ||
    (productBarcode && itemBarcode && productBarcode === itemBarcode) ||
    (productName && itemName && productName === itemName)
  )
}

function movementQuantity(item) {
  return parseNumber(item.quantity ?? item.qty ?? item.cantidad ?? item.received ?? item.transferred ?? item.units)
}

function normalizeMovementRow(row) {
  return {
    id: row.id || `${row.source}-${row.document}-${row.date}-${row.type}-${row.reference}`,
    date: row.date || row.createdAt || row.updatedAt || '',
    type: row.type || 'Movimiento',
    document: row.document || 'N/D',
    origin: row.origin || '',
    destination: row.destination || '',
    entry: parseNumber(row.entry),
    exit: parseNumber(row.exit),
    balance: '',
    user: row.user || 'Sistema',
    reference: row.reference || row.source || '',
    source: row.source || '',
  }
}

function normalizeStoredMovement(movement, product) {
  if (!itemMatchesProduct(movement, product)) return null

  const type = movement.type || movement.tipo || movement.movementType || 'Movimiento de inventario'
  const quantity = movementQuantity(movement)
  const rawEntry = movement.entry ?? movement.entrada ?? movement.in ?? movement.quantityIn
  const rawExit = movement.exit ?? movement.salida ?? movement.out ?? movement.quantityOut
  const typeText = cleanText(type)
  const entry = rawEntry !== undefined ? parseNumber(rawEntry) : (
    /entrada|recepcion|compra|devolucion|ajuste positivo/.test(typeText) ? quantity : 0
  )
  const exit = rawExit !== undefined ? parseNumber(rawExit) : (
    /salida|venta|transferencia|ajuste negativo/.test(typeText) ? quantity : 0
  )

  return normalizeMovementRow({
    id: movement.id,
    date: movement.date || movement.fecha || movement.createdAt || movement.updatedAt,
    type,
    document: movement.document || movement.documentNumber || movement.number || movement.numero || movement.reference,
    origin: movement.origin || movement.originWarehouse || movement.fromWarehouse || movement.sourceWarehouse || movement.branch || movement.vendor,
    destination: movement.destination || movement.destinationWarehouse || movement.toWarehouse || movement.targetWarehouse || movement.warehouse || movement.customer,
    entry,
    exit,
    user: movement.user || movement.createdBy || movement.updatedBy,
    reference: movement.reference || movement.description || movement.__sourceKey,
    source: movement.__sourceKey || 'movements',
  })
}

function rowsFromInvoice(invoice, product) {
  const lines = Array.isArray(invoice.lines) ? invoice.lines : []

  return lines
    .filter((line) => itemMatchesProduct(line, product))
    .map((line) => normalizeMovementRow({
      id: `${invoice.number}-${line.id || line.code}`,
      date: invoice.date || invoice.createdAt || invoice.updatedAt,
      type: 'Venta / Factura',
      document: invoice.number,
      origin: invoice.warehouse || invoice.branch || 'Almacen',
      destination: invoice.customer || 'Cliente',
      entry: 0,
      exit: parseNumber(line.quantity),
      user: invoice.seller || invoice.user || 'Administrador',
      reference: invoice.state || invoice.paymentMethod || 'Factura',
      source: SALES_INVOICES_KEY,
    }))
}

function rowsFromTransfer(transfer, product) {
  const lines = Array.isArray(transfer.lines)
    ? transfer.lines
    : Array.isArray(transfer.items)
      ? transfer.items
      : Array.isArray(transfer.products)
        ? transfer.products
        : Array.isArray(transfer.details)
          ? transfer.details
          : [transfer]

  return lines
    .filter((line) => itemMatchesProduct(line, product))
    .map((line) => {
      const quantity = movementQuantity(line) || movementQuantity(transfer)

      return normalizeMovementRow({
        id: `${transfer.id || transfer.number || transfer.document}-${line.id || line.code || line.productCode}`,
        date: transfer.date || transfer.fecha || transfer.createdAt || transfer.updatedAt,
        type: transfer.type || transfer.tipo || 'Transferencia',
        document: transfer.number || transfer.document || transfer.code || transfer.numero || 'Transferencia',
        origin: transfer.originWarehouse || transfer.fromWarehouse || transfer.sourceWarehouse || transfer.origin || transfer.fromLocation,
        destination: transfer.destinationWarehouse || transfer.toWarehouse || transfer.targetWarehouse || transfer.destination || transfer.toLocation,
        entry: parseNumber(line.entry ?? line.entrada),
        exit: parseNumber(line.exit ?? line.salida) || quantity,
        user: transfer.user || transfer.createdBy || 'Sistema',
        reference: transfer.reference || transfer.note || transfer.__sourceKey,
        source: transfer.__sourceKey || 'transfers',
      })
    })
}

function rowsFromReceiving(receiving, product) {
  const lines = Array.isArray(receiving.lines)
    ? receiving.lines
    : Array.isArray(receiving.items)
      ? receiving.items
      : Array.isArray(receiving.products)
        ? receiving.products
        : Array.isArray(receiving.details)
          ? receiving.details
          : [receiving]

  return lines
    .filter((line) => itemMatchesProduct(line, product))
    .map((line) => {
      const quantity = parseNumber(line.received ?? line.quantity ?? line.qty ?? line.cantidad)

      return normalizeMovementRow({
        id: `${receiving.id || receiving.number || receiving.document}-${line.id || line.code || line.productCode}`,
        date: receiving.date || receiving.fecha || receiving.createdAt || receiving.updatedAt,
        type: receiving.type || 'Entrada por compra',
        document: receiving.number || receiving.document || receiving.receivingNumber || receiving.numero || 'Recepcion',
        origin: receiving.vendor || receiving.supplier || receiving.provider || 'Proveedor',
        destination: receiving.warehouse || receiving.destinationWarehouse || receiving.toWarehouse || 'Almacen',
        entry: quantity,
        exit: 0,
        user: receiving.user || receiving.receivedBy || receiving.createdBy || 'Sistema',
        reference: receiving.order || receiving.reference || receiving.__sourceKey,
        source: receiving.__sourceKey || 'receivings',
      })
    })
}

function buildProductMovements(product) {
  if (!product) return []

  const storedMovements = loadArraysFromKeys(INVENTORY_MOVEMENT_KEYS)
    .map((movement) => normalizeStoredMovement(movement, product))
    .filter(Boolean)
  const invoiceMovements = loadStorageArray(SALES_INVOICES_KEY).flatMap((invoice) => rowsFromInvoice(invoice, product))
  const transferMovements = loadArraysFromKeys(TRANSFER_KEYS).flatMap((transfer) => rowsFromTransfer(transfer, product))
  const receivingMovements = loadArraysFromKeys(RECEIVING_KEYS).flatMap((receiving) => rowsFromReceiving(receiving, product))

  const seen = new Set()
  const rows = [...storedMovements, ...invoiceMovements, ...transferMovements, ...receivingMovements]
    .filter((row) => {
      const key = [row.date, row.type, row.document, row.entry, row.exit, row.origin, row.destination].join('|')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime()
      const dateB = new Date(b.date || 0).getTime()
      return dateA - dateB
    })

  let balance = 0
  return rows.map((row) => {
    balance += parseNumber(row.entry) - parseNumber(row.exit)
    return { ...row, balance }
  })
}

export default function InventoryProductsPage({ controls, onAction, searchValue = '', onSearchChange }) {
  const [products, setProducts] = useState(() => loadProducts())
  const [suppliers, setSuppliers] = useState(() => loadSuppliers())
  const [filters, setFilters] = useState(initialFilters)
  const [selectedCode, setSelectedCode] = useState('')
  const [formData, setFormData] = useState(() => createEmptyProduct(loadProducts()))
  const [message, setMessage] = useState('')
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [viewMode, setViewMode] = useState('list')
  const [activePanel, setActivePanel] = useState(null)
  const [modalWindowState, setModalWindowState] = useState('normal')
  const [movementFilters, setMovementFilters] = useState(initialMovementFilters)

  useEffect(() => {
    let isActive = true

    setSuppliers(loadSuppliers())

    productsService.getAll().then((storedProducts) => {
      if (!isActive || !Array.isArray(storedProducts) || storedProducts.length === 0) return
      const normalizedProducts = storedProducts.map(normalizeProduct)
      setProducts(normalizedProducts)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedProducts))
    })

    return () => {
      isActive = false
    }
  }, [])

  const search = searchValue
  const setSearch = onSearchChange || (() => {})

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort()
  }, [products])

  const brands = useMemo(() => {
    return Array.from(new Set(products.map((product) => product.brand).filter(Boolean))).sort()
  }, [products])

  const supplierOptions = useMemo(() => (
    suppliers.map((supplier) => ({
      value: supplier.code || supplier.name,
      label: supplier.code ? `${supplier.code} - ${supplier.name}` : supplier.name,
    }))
  ), [suppliers])

  const summary = useMemo(() => {
    const activeProducts = products.filter((product) => product.status === 'Activo')
    const inactiveProducts = products.filter((product) => product.status === 'Inactivo')
    const lowStockProducts = products.filter(isLowStock)
    const latestProduct = [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]

    return {
      total: products.length,
      active: activeProducts.length,
      inactive: inactiveProducts.length,
      lowStock: lowStockProducts.length,
      latestProduct: latestProduct?.name || 'Sin productos',
    }
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesGlobalSearch = productMatchesText(product, search)
      const matchesCode = productMatchesText({ code: product.code }, filters.code)
      const matchesName = productMatchesText({ name: product.name }, filters.name)
      const matchesCategory = !filters.category || product.category.toLowerCase().includes(filters.category.toLowerCase())
      const matchesBrand = !filters.brand || product.brand.toLowerCase().includes(filters.brand.toLowerCase())
      const matchesStatus = filters.status === 'Todos' || product.status === filters.status

      return (
        matchesGlobalSearch &&
        matchesCode &&
        matchesName &&
        matchesCategory &&
        matchesBrand &&
        matchesStatus
      )
    })
  }, [filters, products, search])

  const selectedProduct = useMemo(() => {
    return products.find((product) => product.code === selectedCode) || null
  }, [products, selectedCode])

  const productMovements = useMemo(() => {
    if (!selectedProduct || activePanel !== 'movements') return []
    return buildProductMovements(selectedProduct)
  }, [activePanel, selectedProduct])

  const movementTypes = useMemo(() => {
    return Array.from(new Set(productMovements.map((movement) => movement.type).filter(Boolean))).sort()
  }, [productMovements])

  const filteredMovements = useMemo(() => {
    return productMovements.filter((movement) => {
      const matchesDocument = !movementFilters.document || [
        movement.document,
        movement.reference,
        movement.origin,
        movement.destination,
      ].some((field) => cleanText(field).includes(cleanText(movementFilters.document)))
      const matchesType = movementFilters.type === 'Todos' || movement.type === movementFilters.type
      const movementTime = new Date(movement.date || 0).getTime()
      const fromTime = movementFilters.dateFrom ? new Date(movementFilters.dateFrom).getTime() : null
      const toTime = movementFilters.dateTo ? new Date(movementFilters.dateTo).getTime() : null
      const matchesFrom = !fromTime || movementTime >= fromTime
      const matchesTo = !toTime || movementTime <= toTime

      return matchesDocument && matchesType && matchesFrom && matchesTo
    })
  }, [movementFilters, productMovements])

  const isFormOpen = viewMode === 'form'

  const notify = (text) => {
    setMessage(text)
    onAction?.(text)
  }

  const updateFilter = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const updateForm = (field, value) => {
    if (field === 'supplierCode') {
      const supplier = findSupplierMatch(value, suppliers)
      setFormData((current) => ({
        ...current,
        supplierId: supplier?.id || '',
        supplierCode: supplier?.code || '',
        supplierName: supplier?.name || value,
      }))
      return
    }

    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const updateMovementFilter = (field, value) => {
    setMovementFilters((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const resetModalState = () => {
    setModalWindowState('normal')
  }

  const startNewProduct = () => {
    const emptyProduct = createEmptyProduct(products)
    setSelectedCode('')
    setFormData(emptyProduct)
    setShowBulkImport(false)
    setActivePanel(null)
    setModalWindowState('normal')
    setViewMode('form')
    notify('Formulario listo para nuevo producto')
  }

  const selectProduct = (product) => {
    setSelectedCode(product.code)
    setFormData({
      ...product,
      cost: String(product.cost),
      price: String(product.price),
      minStock: String(product.minStock),
      maxStock: String(product.maxStock),
      stock: String(product.stock),
    })
    notify(`Producto seleccionado: ${product.code}`)
  }

  const saveProduct = () => {
    const productToSave = normalizeProduct({
      ...formData,
      code: formData.code,
      createdAt: selectedProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    if (!productToSave.code || !productToSave.name) {
      notify('Completa codigo y nombre del producto')
      return
    }

    const duplicatedCode = products.some((product) => {
      return product.code === productToSave.code && product.code !== selectedCode
    })

    if (duplicatedCode) {
      notify('Ya existe un producto con ese codigo')
      return
    }

    const productExists = products.some((product) => product.code === selectedCode)
    const nextProducts = productExists
      ? products.map((product) => (product.code === selectedCode ? productToSave : product))
      : [productToSave, ...products]

    setProducts(nextProducts)
    saveProducts(nextProducts)
    setSelectedCode(productToSave.code)
    setFormData({
      ...productToSave,
      cost: String(productToSave.cost),
      price: String(productToSave.price),
      minStock: String(productToSave.minStock),
      maxStock: String(productToSave.maxStock),
      stock: String(productToSave.stock),
    })
    setViewMode('list')
    notify('Producto guardado correctamente')
  }

  const inactivateProduct = (codeToInactivate) => {
    if (!codeToInactivate) {
      notify('Selecciona un producto para inactivar')
      return
    }

    const nextProducts = products.map((product) => {
      if (product.code !== codeToInactivate) return product
      return {
        ...product,
        status: 'Inactivo',
        updatedAt: new Date().toISOString(),
      }
    })

    setProducts(nextProducts)
    saveProducts(nextProducts)
    setSelectedCode(codeToInactivate)
    setFormData((current) => ({
      ...current,
      ...(nextProducts.find((product) => product.code === codeToInactivate) || {}),
      status: 'Inactivo',
    }))
    notify('Producto inactivado correctamente')
  }

  const inactivateSelectedProduct = () => {
    inactivateProduct(selectedCode)
  }

  const editSelectedProduct = () => {
    if (!selectedProduct) {
      notify('Selecciona un producto de la tabla para editar')
      return
    }

    selectProduct(selectedProduct)
    setShowBulkImport(false)
    setActivePanel(null)
    setModalWindowState('normal')
    setViewMode('form')
    notify(`Editando producto ${selectedProduct.code}`)
  }

  const closeForm = () => {
    setViewMode('list')
    resetModalState()
    notify('Formulario cerrado')
  }

  const openStockPanel = () => {
    if (!selectedProduct) {
      notify('Selecciona un producto para ver stock')
      return
    }

    setShowBulkImport(false)
    setModalWindowState('normal')
    setActivePanel('stock')
  }

  const openMovementsPanel = () => {
    if (!selectedProduct) {
      notify('Selecciona un producto para ver movimientos')
      return
    }

    setShowBulkImport(false)
    setMovementFilters(initialMovementFilters)
    setModalWindowState('normal')
    setActivePanel('movements')
  }

  const clearFilters = () => {
    setFilters(initialFilters)
    setSearch('')
    notify('Filtros limpiados')
  }

  const printProducts = () => {
    notify('Preparando impresion de productos')
    window.setTimeout(() => window.print(), 150)
  }

  const importBulkProducts = () => {
    const lines = bulkText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    if (lines.length === 0) {
      notify('Pega productos para importar')
      return
    }

    const existingCodes = new Set(products.map((product) => product.code.toLowerCase()))
    const importedCodes = new Set()
    const importedProducts = []
    let skippedLines = 0

    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase()

      if (index === 0 && lowerLine.includes('codigo') && lowerLine.includes('nombre')) {
        return
      }

      const fields = line.split(',').map((field) => field.trim())

      if (fields.length < 8) {
        skippedLines += 1
        return
      }

      const [code, name, category, unit, cost, price, stock, barcode, supplierValue = ''] = fields
      const cleanCode = String(code || '').trim()
      const supplier = findSupplierMatch(supplierValue, suppliers)

      if (!cleanCode || !name || existingCodes.has(cleanCode.toLowerCase()) || importedCodes.has(cleanCode.toLowerCase())) {
        skippedLines += 1
        return
      }

      importedCodes.add(cleanCode.toLowerCase())
      importedProducts.push(normalizeProduct({
        code: cleanCode,
        name,
        description: '',
        category,
        brand: '',
        unit,
        barcode,
        cost,
        price,
        tax: 'ITBIS 18%',
        minStock: 0,
        maxStock: 0,
        stock,
        supplierId: supplier?.id || '',
        supplierCode: supplier?.code || '',
        supplierName: supplier?.name || supplierValue,
        status: 'Activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
    })

    if (importedProducts.length === 0) {
      notify(`No se importaron productos. Lineas omitidas: ${skippedLines}`)
      return
    }

    const nextProducts = [...importedProducts, ...products]
    setProducts(nextProducts)
    saveProducts(nextProducts)
    setBulkText('')
    setShowBulkImport(false)
    notify(`${importedProducts.length} producto(s) importado(s). Omitidos: ${skippedLines}`)
  }

  const closeInternalView = () => {
    if (modalWindowState === 'maximized') {
      setModalWindowState('normal')
      return
    }

    if (isFormOpen) {
      closeForm()
      return
    }

    if (activePanel) {
      setActivePanel(null)
      resetModalState()
      return
    }

    controls?.onClose?.()
  }

  const pageControls = {
    ...controls,
    onClose: closeInternalView,
  }

  const closeActivePanel = () => {
    setActivePanel(null)
    resetModalState()
  }

  const renderModalControls = (onClose, closeLabel) => (
    <div className="inventory-modal-controls">
      <button type="button" onClick={onClose} className="is-exit" title={closeLabel || 'Cerrar'}>
        <X size={15} />
      </button>
      <button type="button" onClick={() => setModalWindowState('minimized')} title="Minimizar">
        <span>Min</span>
      </button>
      <button
        type="button"
        onClick={() => setModalWindowState((current) => (current === 'maximized' ? 'normal' : 'maximized'))}
        title={modalWindowState === 'maximized' ? 'Restaurar' : 'Maximizar'}
      >
        <span>{modalWindowState === 'maximized' ? 'Rest' : 'Max'}</span>
      </button>
    </div>
  )

  return (
    <ModulePageLayout
      title="Productos"
      moduleLabel="Inventario"
      description="Catalogo maestro de productos con busqueda, edicion, estado y persistencia local."
      breadcrumb={['Inventario', 'Productos']}
      searchValue={search}
      searchPlaceholder="Buscar por codigo, nombre, categoria, marca o estado"
      onSearchChange={setSearch}
      actions={[
        { id: 'new', label: 'Nuevo producto', icon: FilePlus2, variant: 'primary', onClick: startNewProduct },
        { id: 'save', label: 'Guardar', icon: Save, onClick: saveProduct, disabled: !isFormOpen },
        { id: 'edit', label: 'Editar', icon: Edit3, onClick: editSelectedProduct, disabled: !selectedProduct },
        { id: 'inactive', label: 'Inactivar', icon: Ban, variant: 'danger', onClick: inactivateSelectedProduct, disabled: !selectedProduct },
        { id: 'stock', label: 'Ver stock', icon: PackageSearch, onClick: openStockPanel, disabled: !selectedProduct },
        { id: 'movements', label: 'Ver movimientos', icon: History, onClick: openMovementsPanel, disabled: !selectedProduct },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: printProducts },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => { exportProducts(filteredProducts); notify('Productos exportados') } },
        { id: 'bulk', label: 'Carga masiva', icon: Upload, disabled: isFormOpen, onClick: () => { setActivePanel(null); setShowBulkImport((current) => !current) } },
      ]}
      {...pageControls}
    >
      <div className="inventory-products-page erp-data-grid">
        {message && (
          <div className="inventory-save-message" role="status">
            <CheckCircle2 size={17} />
            <span>{message}</span>
          </div>
        )}

        <section className="erp-panel inventory-filter-panel">
          <div className="inventory-panel-heading">
            <div>
              <span>Busqueda avanzada</span>
              <h2>Filtros de producto</h2>
            </div>
            <button type="button" onClick={clearFilters}>Limpiar filtros</button>
          </div>

          <div className="inventory-filter-grid">
            <label>
              Buscar por codigo
              <input
                value={filters.code}
                onChange={(event) => updateFilter('code', event.target.value)}
                placeholder="PRD-1020"
              />
            </label>
            <label>
              Buscar por nombre
              <input
                value={filters.name}
                onChange={(event) => updateFilter('name', event.target.value)}
                placeholder="Nombre del producto"
              />
            </label>
            <label>
              Buscar por categoria
              <input
                value={filters.category}
                onChange={(event) => updateFilter('category', event.target.value)}
                placeholder="Categoria"
                list="inventory-product-categories"
              />
            </label>
            <label>
              Buscar por marca
              <input
                value={filters.brand}
                onChange={(event) => updateFilter('brand', event.target.value)}
                placeholder="Marca"
                list="inventory-product-brands"
              />
            </label>
            <label>
              Estado
              <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
                <option>Todos</option>
                <option>Activo</option>
                <option>Inactivo</option>
              </select>
            </label>
          </div>

          <datalist id="inventory-product-categories">
            {categories.map((category) => <option key={category} value={category} />)}
          </datalist>
          <datalist id="inventory-product-brands">
            {brands.map((brand) => <option key={brand} value={brand} />)}
          </datalist>
        </section>

        {isFormOpen && modalWindowState === 'minimized' && (
          <button type="button" className="inventory-minimized-modal" onClick={() => setModalWindowState('normal')}>
            <span>Producto minimizado</span>
            <strong>{formData.code || 'Nuevo producto'}</strong>
          </button>
        )}

        {isFormOpen && modalWindowState !== 'minimized' && (
          <div className="inventory-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="inventory-product-form-title">
            <section className={`inventory-modal inventory-product-modal ${modalWindowState === 'maximized' ? 'is-maximized' : ''}`}>
              <header className="inventory-modal-header">
                <div>
                  <span>{selectedCode ? 'Edicion' : 'Nuevo registro'}</span>
                  <h2 id="inventory-product-form-title">{selectedCode ? 'Editar producto' : 'Nuevo producto'}</h2>
                </div>
                {renderModalControls(closeForm, 'Cerrar formulario')}
              </header>

              <div className="inventory-modal-body">
                <div className="inventory-product-form">
                  <label>
                    Codigo
                    <input value={formData.code} onChange={(event) => updateForm('code', event.target.value)} />
                  </label>
                  <label>
                    Nombre del producto
                    <input value={formData.name} onChange={(event) => updateForm('name', event.target.value)} />
                  </label>
                  <label className="inventory-span-2">
                    Descripcion
                    <textarea value={formData.description} onChange={(event) => updateForm('description', event.target.value)} />
                  </label>
                  <label>
                    Categoria
                    <input value={formData.category} onChange={(event) => updateForm('category', event.target.value)} list="inventory-product-categories" />
                  </label>
                  <label>
                    Marca
                    <input value={formData.brand} onChange={(event) => updateForm('brand', event.target.value)} list="inventory-product-brands" />
                  </label>
                  <label>
                    Unidad de medida
                    <select value={formData.unit} onChange={(event) => updateForm('unit', event.target.value)}>
                      <option>Unidad</option>
                      <option>Caja</option>
                      <option>Paquete</option>
                      <option>Litro</option>
                      <option>Galon</option>
                      <option>Kilogramo</option>
                    </select>
                  </label>
                  <label>
                    Codigo de barra
                    <input value={formData.barcode} onChange={(event) => updateForm('barcode', event.target.value)} />
                  </label>
                  <label>
                    Proveedor principal
                    <select value={formData.supplierCode || formData.supplierName || ''} onChange={(event) => updateForm('supplierCode', event.target.value)}>
                      <option value="">Sin proveedor</option>
                      {formData.supplierName && !formData.supplierCode && (
                        <option value={formData.supplierName}>{formData.supplierName}</option>
                      )}
                      {supplierOptions.map((supplier) => (
                        <option key={supplier.value} value={supplier.value}>{supplier.label}</option>
                      ))}
                    </select>
                    {suppliers.length === 0 && <small>No hay proveedores registrados</small>}
                  </label>
                  <label>
                    Costo
                    <input type="number" min="0" step="0.01" value={formData.cost} onChange={(event) => updateForm('cost', event.target.value)} />
                  </label>
                  <label>
                    Precio de venta
                    <input type="number" min="0" step="0.01" value={formData.price} onChange={(event) => updateForm('price', event.target.value)} />
                  </label>
                  <label>
                    Impuesto
                    <select value={formData.tax} onChange={(event) => updateForm('tax', event.target.value)}>
                      <option>ITBIS 18%</option>
                      <option>Exento</option>
                      <option>Impuesto incluido</option>
                    </select>
                  </label>
                  <label>
                    Stock actual
                    <input type="number" min="0" step="1" value={formData.stock} onChange={(event) => updateForm('stock', event.target.value)} />
                  </label>
                  <label>
                    Stock minimo
                    <input type="number" min="0" step="1" value={formData.minStock} onChange={(event) => updateForm('minStock', event.target.value)} />
                  </label>
                  <label>
                    Stock maximo
                    <input type="number" min="0" step="1" value={formData.maxStock} onChange={(event) => updateForm('maxStock', event.target.value)} />
                  </label>
                  <label>
                    Estado
                    <select value={formData.status} onChange={(event) => updateForm('status', event.target.value)}>
                      <option>Activo</option>
                      <option>Inactivo</option>
                    </select>
                  </label>
                </div>
              </div>

              <footer className="inventory-modal-footer">
                <button type="button" className="inventory-primary-action" onClick={saveProduct}>
                  Guardar
                </button>
                <button type="button" onClick={closeForm}>
                  Cancelar
                </button>
              </footer>
            </section>
          </div>
        )}

        {!isFormOpen && showBulkImport && (
          <section className="erp-panel inventory-bulk-panel">
            <div className="inventory-panel-heading">
              <div>
                <span>Importacion simple</span>
                <h2>Carga masiva</h2>
              </div>
              <button type="button" onClick={() => setBulkText(bulkImportExample)}>
                Usar ejemplo
              </button>
            </div>

            <label className="inventory-bulk-field">
              Pega productos en formato: codigo,nombre,categoria,unidad,costo,precio,stock,codigoBarra,proveedor
              <textarea
                value={bulkText}
                onChange={(event) => setBulkText(event.target.value)}
                placeholder={bulkImportExample}
              />
            </label>

            <div className="inventory-bulk-actions">
              <button type="button" className="inventory-primary-action" onClick={importBulkProducts}>
                Importar productos
              </button>
              <button type="button" onClick={() => setShowBulkImport(false)}>
                Cerrar
              </button>
            </div>
          </section>
        )}

        {activePanel === 'stock' && selectedProduct && modalWindowState === 'minimized' && (
          <button type="button" className="inventory-minimized-modal" onClick={() => setModalWindowState('normal')}>
            <span>Stock minimizado</span>
            <strong>{selectedProduct.code}</strong>
          </button>
        )}

        {activePanel === 'stock' && selectedProduct && modalWindowState !== 'minimized' && (
          <div className="inventory-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="inventory-stock-title">
            <section className={`inventory-modal inventory-info-modal ${modalWindowState === 'maximized' ? 'is-maximized' : ''}`}>
              <header className="inventory-modal-header">
                <div>
                  <span>Consulta</span>
                  <h2 id="inventory-stock-title">Stock del producto</h2>
                </div>
                {renderModalControls(closeActivePanel, 'Cerrar stock')}
              </header>

              <div className="inventory-modal-body">
                <div className="inventory-info-grid">
                  <article><span>Codigo</span><strong>{selectedProduct.code}</strong></article>
                  <article><span>Nombre</span><strong>{selectedProduct.name}</strong></article>
                  <article><span>Stock actual</span><strong>{selectedProduct.stock}</strong></article>
                  <article><span>Stock minimo</span><strong>{selectedProduct.minStock}</strong></article>
                  <article><span>Stock maximo</span><strong>{selectedProduct.maxStock}</strong></article>
                  <article><span>Estado</span><strong>{selectedProduct.status}</strong></article>
                </div>

                <div className="inventory-modal-section-title">Stock por almacen</div>
                <div className="erp-table-wrap">
                  <table className="erp-table inventory-movements-table">
                    <thead>
                      <tr>
                        <th>Almacen</th>
                        <th>Ubicacion</th>
                        <th>Disponible</th>
                        <th>Reservado</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Principal</td>
                        <td>A-01</td>
                        <td>{selectedProduct.stock}</td>
                        <td>0</td>
                        <td>{selectedProduct.status}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <footer className="inventory-modal-footer">
                <button type="button" onClick={closeActivePanel}>
                  Cerrar
                </button>
              </footer>
            </section>
          </div>
        )}

        {activePanel === 'movements' && selectedProduct && modalWindowState === 'minimized' && (
          <button type="button" className="inventory-minimized-modal" onClick={() => setModalWindowState('normal')}>
            <span>Movimientos minimizados</span>
            <strong>{selectedProduct.code}</strong>
          </button>
        )}

        {activePanel === 'movements' && selectedProduct && modalWindowState !== 'minimized' && (
          <div className="inventory-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="inventory-movements-title">
            <section className={`inventory-modal inventory-info-modal inventory-movements-modal ${modalWindowState === 'maximized' ? 'is-maximized' : ''}`}>
              <header className="inventory-modal-header">
                <div>
                  <span>Kardex</span>
                  <h2 id="inventory-movements-title">Movimientos del producto</h2>
                </div>
                {renderModalControls(closeActivePanel, 'Cerrar movimientos')}
              </header>

              <div className="inventory-modal-body">
                <div className="inventory-selected-title">
                  <strong>{selectedProduct.code}</strong>
                  <span>{selectedProduct.name}</span>
                </div>
                <div className="inventory-movement-filters">
                  <label>
                    Documento
                    <input
                      value={movementFilters.document}
                      onChange={(event) => updateMovementFilter('document', event.target.value)}
                      placeholder="FAC-000001, REC-000001"
                    />
                  </label>
                  <label>
                    Tipo
                    <select value={movementFilters.type} onChange={(event) => updateMovementFilter('type', event.target.value)}>
                      <option>Todos</option>
                      {movementTypes.map((type) => <option key={type}>{type}</option>)}
                    </select>
                  </label>
                  <label>
                    Desde
                    <input type="date" value={movementFilters.dateFrom} onChange={(event) => updateMovementFilter('dateFrom', event.target.value)} />
                  </label>
                  <label>
                    Hasta
                    <input type="date" value={movementFilters.dateTo} onChange={(event) => updateMovementFilter('dateTo', event.target.value)} />
                  </label>
                  <button type="button" onClick={() => setMovementFilters(initialMovementFilters)}>
                    Limpiar
                  </button>
                </div>
                <div className="erp-table-wrap">
                  <table className="erp-table inventory-movements-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Documento</th>
                        <th>Origen</th>
                        <th>Destino</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                        <th>Balance</th>
                        <th>Usuario</th>
                        <th>Referencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMovements.length === 0 && (
                        <tr>
                          <td colSpan="10" className="inventory-empty-table">
                            Este producto todavia no tiene movimientos registrados.
                          </td>
                        </tr>
                      )}
                      {filteredMovements.map((movement) => (
                        <tr key={movement.id}>
                          <td>{movement.date || 'N/D'}</td>
                          <td>{movement.type}</td>
                          <td>{movement.document}</td>
                          <td>{movement.origin || 'N/D'}</td>
                          <td>{movement.destination || 'N/D'}</td>
                          <td>{movement.entry ? normalizeNumber(movement.entry) : 0}</td>
                          <td>{movement.exit ? normalizeNumber(movement.exit) : 0}</td>
                          <td>{movement.balance === '' ? '' : normalizeNumber(movement.balance)}</td>
                          <td>{movement.user || 'Sistema'}</td>
                          <td>{movement.reference || 'N/D'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <footer className="inventory-modal-footer">
                <button type="button" onClick={closeActivePanel}>
                  Cerrar
                </button>
              </footer>
            </section>
          </div>
        )}

        <section className="erp-panel inventory-table-panel">
          <div className="inventory-panel-heading">
            <div>
              <span>{filteredProducts.length} resultado(s)</span>
              <h2>Tabla de productos</h2>
            </div>
          </div>

          <div className="erp-table-wrap">
            <table className="erp-table inventory-products-table">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Producto</th>
                  <th>Categoria</th>
                  <th>Unidad</th>
                  <th>Costo</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.code}
                    className={selectedCode === product.code ? 'is-selected' : ''}
                    onClick={() => selectProduct(product)}
                  >
                    <td>{product.code}</td>
                    <td>
                      <strong>{product.name}</strong>
                      <small>{[product.brand || 'Sin marca', product.supplierName || 'Sin proveedor'].join(' | ')}</small>
                    </td>
                    <td>{product.category || 'Sin categoria'}</td>
                    <td>{product.unit}</td>
                    <td>{formatCurrency(product.cost)}</td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>
                      <span className={isLowStock(product) ? 'inventory-stock-low' : ''}>
                        {product.stock}
                      </span>
                    </td>
                    <td><span className={productStatusClass(product)}>{product.status}</span></td>
                    <td>
                      <div className="erp-table-actions">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            selectProduct(product)
                            setViewMode('form')
                            setActivePanel(null)
                            setShowBulkImport(false)
                          }}
                          title="Editar producto"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            selectProduct(product)
                            inactivateProduct(product.code)
                          }}
                          title="Inactivar producto"
                          disabled={product.status === 'Inactivo'}
                        >
                          <Ban size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="9">
                      <div className="inventory-empty-table">
                        No hay productos que coincidan con la busqueda.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </ModulePageLayout>
  )
}
