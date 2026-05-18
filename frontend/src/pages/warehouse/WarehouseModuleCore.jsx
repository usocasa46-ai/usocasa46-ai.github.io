import { useEffect, useMemo, useState } from 'react'
import {
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Edit3,
  Eye,
  FilePlus2,
  ListChecks,
  MapPin,
  Maximize2,
  Minimize2,
  PackageCheck,
  PackageOpen,
  Printer,
  RotateCcw,
  Route,
  Save,
  Send,
  ShieldCheck,
  Truck,
  Warehouse,
  X,
} from 'lucide-react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import './WarehouseModulePages.css'

const PRODUCTS_KEY = 'inveFatInventoryProducts'
const MOVEMENTS_KEY = 'invefat_inventory_movements'
const WAREHOUSES_KEY = 'invefat_warehouses'
const LOCATIONS_KEY = 'invefat_warehouse_locations'
const RECEIPTS_KEY = 'invefat_warehouse_receipts'
const PURCHASE_ORDERS_KEY = 'invefat_purchase_orders'
const PENDING_RECEIPT_ORDER_KEY = 'invefat_pending_receipt_order'
const DISPATCHES_KEY = 'invefat_warehouse_dispatches'
const TRANSFERS_KEY = 'invefat_warehouse_transfers'
const PICKING_KEY = 'invefat_warehouse_picking'
const PUTAWAY_KEY = 'invefat_warehouse_putaway'
const RETURNS_KEY = 'invefat_warehouse_returns'
const DAMAGES_KEY = 'invefat_warehouse_damages'
const QUARANTINE_KEY = 'invefat_warehouse_quarantine'
const QUALITY_KEY = 'invefat_warehouse_quality'
const ROUTES_KEY = 'invefat_warehouse_routes'

const DEFAULT_WAREHOUSES = [
  {
    code: 'ALM-01',
    name: 'Almacen Principal',
    type: 'Principal',
    address: 'Almacen matriz',
    manager: 'Administrador',
    phone: '',
    branch: 'Empresa matriz',
    status: 'Activo',
  },
  {
    code: 'ALM-02',
    name: 'Almacen Sucursal',
    type: 'Sucursal',
    address: 'Sucursal principal',
    manager: 'Administrador',
    phone: '',
    branch: 'Sucursal',
    status: 'Activo',
  },
]

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

function readArray(key, fallback = []) {
  const value = safeParse(key, fallback)
  return Array.isArray(value) ? value : fallback
}

function writeArray(key, value) {
  if (!canUseStorage()) return
  localStorage.setItem(key, JSON.stringify(value))
}

function toNumber(value) {
  const numericValue = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(numericValue) ? numericValue : 0
}

function cleanText(value) {
  return String(value ?? '').toLowerCase().trim()
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function nowIso() {
  return new Date().toISOString()
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function nextCode(records, prefix, field = 'code', pad = 2) {
  const highest = records.reduce((max, record) => {
    const match = String(record[field] || '').match(/(\d+)$/)
    return Math.max(max, match ? Number(match[1]) : 0)
  }, 0)

  return `${prefix}-${String(highest + 1).padStart(pad, '0')}`
}

function nextDocument(records, prefix) {
  return nextCode(records, prefix, 'number', 6)
}

function formatDate(value) {
  if (!value) return 'N/D'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  return date.toISOString().slice(0, 10)
}

function formatNumber(value) {
  return toNumber(value).toLocaleString('es-DO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function formatCurrency(value) {
  return `RD$ ${toNumber(value).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function exportJson(filename, payload) {
  if (typeof document === 'undefined') return
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function getStatusClass(status = '') {
  const clean = cleanText(status)
  if (clean.includes('anulad') || clean.includes('inactiv') || clean.includes('rechaz') || clean.includes('dan') || clean.includes('venc')) return 'is-danger'
  if (clean.includes('borrador') || clean.includes('pendiente') || clean.includes('proceso') || clean.includes('cuarentena') || clean.includes('condicional')) return 'is-warning'
  if (clean.includes('activo') || clean.includes('recib') || clean.includes('despach') || clean.includes('transfer') || clean.includes('prepar') || clean.includes('aprob') || clean.includes('liber')) return 'is-success'
  return 'is-info'
}

function StatusBadge({ value }) {
  return <span className={`warehouse-badge ${getStatusClass(value)}`}>{value || 'N/D'}</span>
}

function normalizeWarehouse(record) {
  return {
    code: String(record.code || '').trim().toUpperCase(),
    name: String(record.name || '').trim(),
    type: record.type || 'Principal',
    address: String(record.address || '').trim(),
    manager: String(record.manager || '').trim(),
    phone: String(record.phone || '').trim(),
    branch: String(record.branch || '').trim(),
    status: record.status === 'Inactivo' ? 'Inactivo' : 'Activo',
    updatedAt: record.updatedAt || nowIso(),
  }
}

function readWarehouses() {
  const saved = readArray(WAREHOUSES_KEY)
  if (saved.length > 0) return saved.map(normalizeWarehouse)
  writeArray(WAREHOUSES_KEY, DEFAULT_WAREHOUSES)
  return DEFAULT_WAREHOUSES
}

function warehouseOptions() {
  return readWarehouses().map((warehouse) => ({ value: warehouse.code, label: `${warehouse.code} - ${warehouse.name}` }))
}

function readPurchaseOrders() {
  return readArray(PURCHASE_ORDERS_KEY).filter((order) => !['Anulada', 'Cerrada', 'Recibida'].includes(order.status))
}

function purchaseOrderOptions() {
  const orders = readPurchaseOrders()
  return [
    { value: '', label: orders.length ? 'Seleccione una orden' : 'No hay ordenes de compra disponibles' },
    ...orders.map((order) => ({ value: order.number, label: `${order.number} - ${order.supplier || order.supplierCode || 'Proveedor'}` })),
  ]
}

function findPurchaseOrder(orderNumber) {
  return readArray(PURCHASE_ORDERS_KEY).find((order) => order.number === orderNumber)
}

function readProducts() {
  return readArray(PRODUCTS_KEY).map((product) => ({
    code: String(product.code || '').trim(),
    name: String(product.name || '').trim(),
    description: String(product.description || '').trim(),
    unit: String(product.unit || 'Unidad').trim(),
    barcode: String(product.barcode || '').trim(),
    cost: toNumber(product.cost),
    price: toNumber(product.price),
    stock: toNumber(product.stock),
    status: product.status || 'Activo',
  }))
}

function writeProducts(products) {
  writeArray(PRODUCTS_KEY, products)
}

function productOptions(products) {
  return [
    { value: '', label: 'Seleccione un producto' },
    ...products.map((product) => ({ value: product.code, label: `${product.code} - ${product.name}` })),
  ]
}

function readLocations() {
  return readArray(LOCATIONS_KEY)
}

function locationOptions(warehouseCode = '') {
  const locations = readLocations().filter((location) => !warehouseCode || location.warehouseCode === warehouseCode)
  return [
    { value: '', label: 'Sin ubicacion' },
    ...locations.map((location) => ({ value: location.code, label: `${location.code} - ${location.zone || 'Zona'}` })),
  ]
}

function addMovements(movements) {
  if (!movements.length) return
  writeArray(MOVEMENTS_KEY, [...movements, ...readArray(MOVEMENTS_KEY)])
}

function adjustProductStock(lines, mode) {
  if (!['entry', 'exit'].includes(mode)) return readProducts()
  const products = readProducts()
  const nextProducts = products.map((product) => {
    const relatedLines = lines.filter((line) => line.productCode === product.code)
    if (!relatedLines.length) return product

    const quantity = relatedLines.reduce((sum, line) => sum + toNumber(line.quantity), 0)
    const nextStock = mode === 'entry' ? toNumber(product.stock) + quantity : toNumber(product.stock) - quantity
    return { ...product, stock: nextStock, updatedAt: nowIso() }
  })
  writeProducts(nextProducts)
  return nextProducts
}

function productFromLine(line, products) {
  return products.find((product) => product.code === line.productCode) || {}
}

function normalizeLine(line, products) {
  const product = productFromLine(line, products)
  const quantity = toNumber(line.quantity || line.receivedQuantity || line.dispatchedQuantity || line.returnedQuantity || 0)
  const orderedQuantity = toNumber(line.orderedQuantity || quantity)
  const alreadyReceivedQuantity = toNumber(line.alreadyReceivedQuantity || line.previouslyReceivedQuantity || 0)
  const receivedQuantity = toNumber(line.receivedQuantity ?? quantity)
  const cost = toNumber(line.cost ?? product.cost)
  const tax = toNumber(line.tax)
  const effectiveQuantity = toNumber(line.receivedQuantity ?? quantity)

  return {
    id: line.id || makeId('line'),
    productCode: line.productCode || product.code || '',
    productName: line.productName || product.name || '',
    unit: line.unit || product.unit || 'Unidad',
    barcode: line.barcode || product.barcode || '',
    quantity,
    orderedQuantity,
    alreadyReceivedQuantity,
    receivedQuantity,
    pendingQuantity: Math.max(0, orderedQuantity - alreadyReceivedQuantity),
    stockAvailable: toNumber(line.stockAvailable ?? product.stock),
    cost,
    tax,
    total: effectiveQuantity * cost + tax,
    condition: line.condition || 'Buena',
    suggestedLocation: line.suggestedLocation || '',
    finalLocation: line.finalLocation || '',
    lineStatus: line.lineStatus || 'Pendiente',
    criterion: line.criterion || '',
    result: line.result || 'Pendiente',
    note: line.note || '',
  }
}

function getLineQuantity(line, mode = 'quantity') {
  if (mode === 'received') return toNumber(line.receivedQuantity || line.quantity)
  if (mode === 'returned') return toNumber(line.returnedQuantity || line.quantity)
  return toNumber(line.quantity)
}

function Modal({
  title,
  subtitle = 'Almacen',
  children,
  onClose,
  onSave,
  saveLabel = 'Guardar',
  wide = false,
  canSave = true,
}) {
  const [windowState, setWindowState] = useState('normal')

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation?.()
      if (windowState === 'maximized') {
        setWindowState('normal')
        return
      }
      onClose?.()
    }

    window.addEventListener('keydown', handleEscape, true)
    return () => window.removeEventListener('keydown', handleEscape, true)
  }, [onClose, windowState])

  if (windowState === 'minimized') {
    return (
      <button type="button" className="warehouse-minimized-modal" onClick={() => setWindowState('normal')}>
        <span>Ventana minimizada</span>
        <strong>{title}</strong>
      </button>
    )
  }

  return (
    <div className="warehouse-modal-backdrop" role="presentation">
      <section className={`warehouse-modal ${wide ? 'is-wide' : ''} ${windowState === 'maximized' ? 'is-maximized' : ''}`} role="dialog" aria-modal="true">
        <header className="warehouse-modal-header">
          <div>
            <span>{subtitle}</span>
            <h2>{title}</h2>
          </div>
          <div className="warehouse-modal-controls">
            <button type="button" title="Minimizar" onClick={() => setWindowState('minimized')}><Minimize2 size={14} /></button>
            <button type="button" title={windowState === 'maximized' ? 'Restaurar' : 'Maximizar'} onClick={() => setWindowState(windowState === 'maximized' ? 'normal' : 'maximized')}>
              {windowState === 'maximized' ? <RotateCcw size={14} /> : <Maximize2 size={14} />}
            </button>
            <button type="button" className="is-exit" title="Cerrar" onClick={onClose}><X size={15} /></button>
          </div>
        </header>
        <div className="warehouse-modal-body">{children}</div>
        <footer className="warehouse-modal-footer">
          <button type="button" onClick={onClose}>Cancelar</button>
          {onSave && (
            <button type="button" className="warehouse-primary-action" onClick={onSave} disabled={!canSave}>
              <Save size={15} />
              {saveLabel}
            </button>
          )}
        </footer>
      </section>
    </div>
  )
}

function FieldControl({ field, value, onChange }) {
  const options = typeof field.options === 'function' ? field.options() : field.options
  const commonProps = {
    value: value ?? '',
    onChange: (event) => onChange(field.name, event.target.value),
    readOnly: field.readOnly,
  }

  if (field.type === 'textarea') {
    return (
      <label className={field.span ? `warehouse-span-${field.span}` : ''}>
        {field.label}
        <textarea {...commonProps} rows={field.rows || 3} />
      </label>
    )
  }

  if (field.type === 'select') {
    return (
      <label className={field.span ? `warehouse-span-${field.span}` : ''}>
        {field.label}
        <select {...commonProps}>
          {(options || []).map((option) => {
            const optionValue = typeof option === 'string' ? option : option.value
            const optionLabel = typeof option === 'string' ? option : option.label
            return <option key={optionValue} value={optionValue}>{optionLabel}</option>
          })}
        </select>
      </label>
    )
  }

  return (
    <label className={field.span ? `warehouse-span-${field.span}` : ''}>
      {field.label}
      <input type={field.type || 'text'} {...commonProps} />
    </label>
  )
}

function PanelHeading({ eyebrow, title, right }) {
  return (
    <div className="warehouse-panel-heading">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {right}
    </div>
  )
}

function WarehousePageLayout({
  title,
  description,
  searchValue,
  onSearchChange,
  actions,
  controls,
  children,
}) {
  return (
    <ModulePageLayout
      title={title}
      moduleLabel="Almacen"
      description={description}
      breadcrumb={['Almacen', title]}
      searchValue={searchValue}
      searchPlaceholder={`Buscar en ${title}`}
      onSearchChange={onSearchChange}
      actions={actions}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      {children}
    </ModulePageLayout>
  )
}

function CatalogPage({
  title,
  description,
  storageKey,
  defaultRecords = [],
  normalizeRecord,
  createRecord,
  fields,
  columns,
  searchFields,
  codeField = 'code',
  nameField = 'name',
  activeStatus = 'Activo',
  inactiveStatus = 'Inactivo',
  searchValue = '',
  onSearchChange,
  controls,
  extraActions = [],
  onSelectRecord,
}) {
  const [records, setRecords] = useState(() => {
    const saved = readArray(storageKey)
    if (saved.length > 0) return saved.map(normalizeRecord)
    const normalizedDefaults = defaultRecords.map(normalizeRecord)
    if (normalizedDefaults.length > 0) writeArray(storageKey, normalizedDefaults)
    return normalizedDefaults
  })
  const [filters, setFilters] = useState({ query: '', status: 'Todos' })
  const [selectedCode, setSelectedCode] = useState('')
  const [draft, setDraft] = useState(null)
  const [message, setMessage] = useState('')
  const selected = records.find((record) => String(record[codeField]) === String(selectedCode))

  const filtered = records.filter((record) => {
    const query = cleanText([searchValue, filters.query].filter(Boolean).join(' '))
    const matchesQuery = !query || searchFields.some((field) => cleanText(record[field]).includes(query))
    const matchesStatus = filters.status === 'Todos' || record.status === filters.status
    return matchesQuery && matchesStatus
  })

  const saveRecords = (nextRecords) => {
    setRecords(nextRecords)
    writeArray(storageKey, nextRecords)
  }

  const openNew = () => {
    setSelectedCode('')
    setDraft(createRecord(records))
  }

  const openEdit = (record = selected) => {
    if (!record) return
    setSelectedCode(record[codeField])
    setDraft({ ...record })
  }

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const saveDraft = () => {
    const normalized = normalizeRecord({ ...draft, updatedAt: nowIso() })
    if (!normalized[codeField] || !normalized[nameField]) {
      setMessage('Debe completar codigo y nombre.')
      return
    }
    const duplicate = records.some((record) => (
      String(record[codeField]).toLowerCase() === String(normalized[codeField]).toLowerCase()
      && String(record[codeField]) !== String(selectedCode)
    ))
    if (duplicate) {
      setMessage('Ya existe un registro con ese codigo.')
      return
    }
    const exists = records.some((record) => String(record[codeField]) === String(selectedCode))
    const nextRecords = exists
      ? records.map((record) => String(record[codeField]) === String(selectedCode) ? normalized : record)
      : [normalized, ...records]
    saveRecords(nextRecords)
    setSelectedCode(normalized[codeField])
    setDraft(null)
    setMessage(`${title}: registro guardado correctamente.`)
  }

  const toggleStatus = (target = selected) => {
    if (!target) return
    const nextStatus = target.status === inactiveStatus ? activeStatus : inactiveStatus
    const nextRecords = records.map((record) => (
      String(record[codeField]) === String(target[codeField])
        ? { ...record, status: nextStatus, updatedAt: nowIso() }
        : record
    ))
    saveRecords(nextRecords)
    setSelectedCode(target[codeField])
  }

  return (
    <WarehousePageLayout
      title={title}
      description={description}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      controls={controls}
      actions={[
        { id: 'new', label: 'Nuevo', icon: FilePlus2, variant: 'primary', onClick: openNew },
        { id: 'edit', label: 'Editar', icon: Edit3, disabled: !selected, onClick: () => openEdit() },
        { id: 'inactive', label: selected?.status === inactiveStatus ? 'Activar' : 'Inactivar', icon: Ban, disabled: !selected, onClick: () => toggleStatus() },
        ...extraActions.map((action) => ({ ...action, disabled: action.disabled || !selected, onClick: () => action.onClick?.(selected) })),
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson(`${storageKey}.json`, records) },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
        { id: 'exit', label: 'Salir', icon: X, onClick: controls?.onClose },
      ]}
    >
      <div className="warehouse-module-page">
        {message && <div className="warehouse-message">{message}</div>}
        <section className="warehouse-panel warehouse-filter-panel">
          <PanelHeading eyebrow="Busqueda" title={`Filtros de ${title.toLowerCase()}`} />
          <div className="warehouse-filter-grid">
            <label>
              Buscar
              <input value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Codigo, nombre o descripcion" />
            </label>
            <label>
              Estado
              <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                <option>Todos</option>
                <option>{activeStatus}</option>
                <option>{inactiveStatus}</option>
              </select>
            </label>
          </div>
        </section>

        <section className="warehouse-table-wrap">
          <table className="warehouse-table">
            <thead>
              <tr>
                {columns.map((column) => <th key={column.key}>{column.label}</th>)}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record[codeField]} className={String(selectedCode) === String(record[codeField]) ? 'is-selected' : ''} onClick={() => { setSelectedCode(record[codeField]); onSelectRecord?.(record) }}>
                  {columns.map((column) => <td key={column.key}>{column.render ? column.render(record) : record[column.key]}</td>)}
                  <td>
                    <div className="warehouse-table-actions">
                      <button type="button" title="Editar" onClick={(event) => { event.stopPropagation(); openEdit(record) }}><Edit3 size={15} /></button>
                      <button type="button" title="Cambiar estado" onClick={(event) => { event.stopPropagation(); toggleStatus(record) }}><Ban size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={columns.length + 1} className="warehouse-empty-state">No hay registros para mostrar.</td></tr>}
            </tbody>
          </table>
        </section>

        {draft && (
          <Modal title={`Registro de ${title.toLowerCase()}`} onClose={() => setDraft(null)} onSave={saveDraft}>
            <div className="warehouse-form-grid">
              {fields.map((field) => <FieldControl key={field.name} field={field} value={draft[field.name]} onChange={updateDraft} />)}
            </div>
          </Modal>
        )}
      </div>
    </WarehousePageLayout>
  )
}

function recordMatches(record, fields, query) {
  const text = cleanText(query)
  if (!text) return true
  return fields.some((field) => cleanText(record[field]).includes(text))
}

function createBlankLine(products) {
  const product = products[0] || {}
  return normalizeLine({
    productCode: product.code || '',
    productName: product.name || '',
    unit: product.unit || 'Unidad',
    quantity: 1,
    receivedQuantity: 1,
    orderedQuantity: 1,
    cost: product.cost || 0,
    stockAvailable: product.stock || 0,
  }, products)
}

function receivedQuantityForOrder(orderNumber, productCode, receipts = readArray(RECEIPTS_KEY)) {
  return receipts
    .filter((receipt) => receipt.purchaseOrder === orderNumber && receipt.status !== 'Anulado')
    .flatMap((receipt) => receipt.lines || [])
    .filter((line) => line.productCode === productCode)
    .reduce((sum, line) => sum + toNumber(line.receivedQuantity || line.quantity), 0)
}

function draftFromPurchaseOrder(order, baseDraft, products, receipts = readArray(RECEIPTS_KEY)) {
  if (!order) return baseDraft

  const lines = (order.lines || []).map((line) => {
    const product = products.find((item) => item.code === line.productCode) || {}
    const orderedQuantity = toNumber(line.quantity || line.orderedQuantity)
    const alreadyReceivedQuantity = receivedQuantityForOrder(order.number, line.productCode, receipts)
    const pendingQuantity = Math.max(0, orderedQuantity - alreadyReceivedQuantity)
    const cost = toNumber(line.cost ?? product.cost)
    const tax = toNumber(line.tax)

    return normalizeLine({
      id: makeId('receipt-line'),
      productCode: line.productCode,
      productName: line.productName || product.name,
      unit: line.unit || product.unit,
      orderedQuantity,
      alreadyReceivedQuantity,
      pendingQuantity,
      receivedQuantity: pendingQuantity,
      quantity: pendingQuantity,
      cost,
      tax,
      stockAvailable: product.stock,
      lineStatus: pendingQuantity > 0 ? 'Pendiente' : 'Recibida',
    }, products)
  })

  return {
    ...baseDraft,
    supplier: order.supplier || order.supplierCode || '',
    fiscalId: order.fiscalId || '',
    phone: order.phone || '',
    address: order.address || '',
    orderDate: order.date || '',
    paymentCondition: order.paymentCondition || '',
    purchaseOrder: order.number,
    warehouse: order.warehouse || baseDraft.warehouse,
    observations: order.observations || baseDraft.observations,
    lines,
  }
}

function updatePurchaseOrderReceiptState(orderNumber, receipts) {
  if (!orderNumber) return

  const orders = readArray(PURCHASE_ORDERS_KEY)
  const order = orders.find((item) => item.number === orderNumber)
  if (!order) return

  const hasAnyReceipt = (order.lines || []).some((line) => receivedQuantityForOrder(orderNumber, line.productCode, receipts) > 0)
  const isFullyReceived = (order.lines || []).every((line) => {
    const orderedQuantity = toNumber(line.quantity || line.orderedQuantity)
    return receivedQuantityForOrder(orderNumber, line.productCode, receipts) >= orderedQuantity
  })
  const nextStatus = isFullyReceived ? 'Recibida' : hasAnyReceipt ? 'Parcialmente recibida' : order.status
  const nextReceptionStatus = isFullyReceived ? 'Recibida' : hasAnyReceipt ? 'Parcial' : order.receptionStatus || 'Pendiente'

  writeArray(PURCHASE_ORDERS_KEY, orders.map((item) => (
    item.number === orderNumber
      ? { ...item, status: nextStatus, receptionStatus: nextReceptionStatus, updatedAt: nowIso() }
      : item
  )))
}

function DocumentPage({
  title,
  description,
  storageKey,
  numberPrefix,
  newLabel,
  defaultStatus = 'Borrador',
  completedStatus = 'Guardado',
  statuses = ['Borrador', 'Guardado', 'Anulado'],
  fields,
  columns,
  lineMode = 'product',
  stockMode = 'none',
  purchaseOrderSupport = false,
  movementType = '',
  movementEntryType = '',
  movementExitType = '',
  validate,
  searchValue = '',
  onSearchChange,
  controls,
  onAction,
}) {
  const [records, setRecords] = useState(() => readArray(storageKey))
  const [products, setProducts] = useState(() => readProducts())
  const [filters, setFilters] = useState({ query: '', status: 'Todos', warehouse: 'Todos' })
  const [selectedNumber, setSelectedNumber] = useState('')
  const [draft, setDraft] = useState(null)
  const [mode, setMode] = useState('edit')
  const [message, setMessage] = useState('')
  const selected = records.find((record) => record.number === selectedNumber)
  const availablePurchaseOrders = purchaseOrderSupport ? readPurchaseOrders() : []

  const saveRecords = (nextRecords) => {
    setRecords(nextRecords)
    writeArray(storageKey, nextRecords)
  }

  const newDraft = () => ({
    id: makeId(numberPrefix.toLowerCase()),
    number: nextDocument(records, numberPrefix),
    date: today(),
    warehouse: 'ALM-01',
    sourceWarehouse: 'ALM-01',
    targetWarehouse: 'ALM-02',
    manager: 'Administrador',
    responsible: 'Administrador',
    supplier: '',
    customer: '',
    origin: '',
    relatedDocument: '',
    purchaseOrder: '',
    reason: '',
    observations: '',
    status: defaultStatus,
    lines: lineMode === 'criteria' ? [{ id: makeId('criterion'), criterion: 'Revision visual', result: 'Pendiente', note: '' }] : [createBlankLine(products)],
  })

  const openNew = () => {
    setProducts(readProducts())
    setMode('edit')
    setDraft(newDraft())
  }

  useEffect(() => {
    if (!purchaseOrderSupport || !canUseStorage()) return

    const pendingOrderNumber = localStorage.getItem(PENDING_RECEIPT_ORDER_KEY)
    if (!pendingOrderNumber) return

    const freshProducts = readProducts()
    const order = findPurchaseOrder(pendingOrderNumber)
    localStorage.removeItem(PENDING_RECEIPT_ORDER_KEY)
    setProducts(freshProducts)
    setMode('edit')

    if (!order) {
      setDraft(newDraft())
      setMessage(`No se encontro la orden ${pendingOrderNumber}.`)
      return
    }

    setDraft(draftFromPurchaseOrder(order, newDraft(), freshProducts, records))
    setMessage(`Orden ${order.number} cargada para recepcion.`)
  }, [purchaseOrderSupport])

  const openEdit = (record = selected) => {
    if (!record) return
    setMode('edit')
    setDraft({ ...record, lines: (record.lines || []).map((line) => normalizeLine(line, products)) })
  }

  const openView = (record = selected) => {
    if (!record) return
    setMode('view')
    setDraft({ ...record, lines: (record.lines || []).map((line) => normalizeLine(line, products)) })
  }

  const updateDraft = (field, value) => {
    setDraft((current) => {
      const next = { ...current, [field]: value }

      if (purchaseOrderSupport && field === 'purchaseOrder' && value) {
        const order = findPurchaseOrder(value)
        if (order) return draftFromPurchaseOrder(order, next, products, records)
      }

      return next
    })
  }

  const updateLine = (lineId, field, value) => {
    setDraft((current) => ({
      ...current,
      lines: current.lines.map((line) => {
        if (line.id !== lineId) return line
        const nextLine = { ...line, [field]: value }
        if (field === 'productCode') {
          const product = products.find((item) => item.code === value)
          nextLine.productName = product?.name || ''
          nextLine.unit = product?.unit || 'Unidad'
          nextLine.cost = product?.cost || 0
          nextLine.stockAvailable = product?.stock || 0
          nextLine.barcode = product?.barcode || ''
        }
        const normalized = normalizeLine(nextLine, products)
        if (lineMode === 'receiving') {
          normalized.pendingQuantity = Math.max(0, toNumber(normalized.orderedQuantity) - toNumber(normalized.alreadyReceivedQuantity))
          normalized.quantity = toNumber(normalized.receivedQuantity)
          normalized.total = toNumber(normalized.receivedQuantity) * toNumber(normalized.cost) + toNumber(normalized.tax)
        }
        return normalized
      }),
    }))
  }

  const addLine = () => {
    setDraft((current) => ({ ...current, lines: [...(current.lines || []), createBlankLine(products)] }))
  }

  const removeLine = (lineId) => {
    setDraft((current) => ({ ...current, lines: current.lines.filter((line) => line.id !== lineId) }))
  }

  const makeMovements = (savedRecord, normalizedLines) => {
    const date = nowIso()
    const base = {
      date,
      document: savedRecord.number,
      branch: savedRecord.branch || '',
      user: savedRecord.responsible || savedRecord.manager || 'Administrador',
      reference: savedRecord.reason || savedRecord.observations || title,
    }

    if (stockMode === 'transfer') {
      return normalizedLines.flatMap((line) => ([
        {
          id: makeId('movement'),
          ...base,
          type: movementExitType || 'Transferencia salida',
          productCode: line.productCode,
          productName: line.productName,
          origin: savedRecord.sourceWarehouse,
          destination: savedRecord.targetWarehouse,
          warehouse: savedRecord.sourceWarehouse,
          entry: 0,
          exit: getLineQuantity(line),
        },
        {
          id: makeId('movement'),
          ...base,
          type: movementEntryType || 'Transferencia entrada',
          productCode: line.productCode,
          productName: line.productName,
          origin: savedRecord.sourceWarehouse,
          destination: savedRecord.targetWarehouse,
          warehouse: savedRecord.targetWarehouse,
          entry: getLineQuantity(line),
          exit: 0,
        },
      ]))
    }

    return normalizedLines.map((line) => ({
      id: makeId('movement'),
      ...base,
      type: movementType || title,
      productCode: line.productCode,
      productName: line.productName,
      origin: savedRecord.sourceWarehouse || savedRecord.origin || savedRecord.supplier || '',
      destination: savedRecord.targetWarehouse || savedRecord.warehouse || savedRecord.customer || '',
      warehouse: savedRecord.warehouse || savedRecord.sourceWarehouse || savedRecord.targetWarehouse || '',
      entry: stockMode === 'entry' ? getLineQuantity(line) : 0,
      exit: stockMode === 'exit' ? getLineQuantity(line) : 0,
      cost: line.cost,
      unitCost: line.cost,
    }))
  }

  const saveDraft = () => {
    const normalizedLines = (draft.lines || [])
      .map((line) => normalizeLine(line, products))
      .filter((line) => lineMode === 'criteria' ? line.criterion : line.productCode)

    const normalized = {
      ...draft,
      lines: normalizedLines,
      status: draft.status === 'Borrador' ? completedStatus : draft.status,
      updatedAt: nowIso(),
    }
    if (purchaseOrderSupport && normalized.status === completedStatus) {
      const isPartialReceipt = normalizedLines.some((line) => toNumber(line.receivedQuantity) < toNumber(line.pendingQuantity))
      normalized.status = isPartialReceipt ? 'Parcial' : completedStatus
    }

    const overReceivedLine = purchaseOrderSupport
      ? normalizedLines.find((line) => toNumber(line.receivedQuantity) > toNumber(line.pendingQuantity))
      : null
    const validationMessage = overReceivedLine
      ? `No puede recibir mas de lo pendiente para ${overReceivedLine.productName}.`
      : validate?.(normalized, products) || ''
    if (validationMessage) {
      setMessage(validationMessage)
      return
    }

    const exists = records.some((record) => record.number === normalized.number)
    const shouldApplyMovements = !exists && normalized.status !== 'Anulado' && stockMode !== 'none' && lineMode !== 'criteria'

    if (shouldApplyMovements) {
      if (stockMode === 'entry') adjustProductStock(normalizedLines, 'entry')
      if (stockMode === 'exit') adjustProductStock(normalizedLines, 'exit')
      addMovements(makeMovements(normalized, normalizedLines))
      setProducts(readProducts())
    }

    const nextRecords = exists
      ? records.map((record) => record.number === normalized.number ? normalized : record)
      : [normalized, ...records]
    saveRecords(nextRecords)
    if (purchaseOrderSupport) updatePurchaseOrderReceiptState(normalized.purchaseOrder, nextRecords)
    setSelectedNumber(normalized.number)
    setDraft(null)
    setMessage(`${title}: registro guardado correctamente.`)
    onAction?.(`${title}: registro guardado`)
  }

  const voidRecord = () => {
    if (!selected || selected.status === 'Anulado') return
    saveRecords(records.map((record) => record.number === selected.number ? { ...record, status: 'Anulado', updatedAt: nowIso() } : record))
    setMessage(`${title}: registro anulado.`)
  }

  const filtered = records.filter((record) => {
    const query = [filters.query, searchValue].filter(Boolean).join(' ')
    const matchesQuery = recordMatches(record, ['number', 'supplier', 'customer', 'origin', 'relatedDocument', 'purchaseOrder', 'warehouse', 'sourceWarehouse', 'targetWarehouse', 'responsible', 'status'], query)
    const matchesStatus = filters.status === 'Todos' || record.status === filters.status
    const matchesWarehouse = filters.warehouse === 'Todos' || [record.warehouse, record.sourceWarehouse, record.targetWarehouse].includes(filters.warehouse)
    return matchesQuery && matchesStatus && matchesWarehouse
  })

  return (
    <WarehousePageLayout
      title={title}
      description={description}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      controls={controls}
      actions={[
        { id: 'new', label: newLabel, icon: FilePlus2, variant: 'primary', onClick: openNew },
        { id: 'view', label: 'Ver', icon: Eye, disabled: !selected, onClick: () => openView() },
        { id: 'edit', label: 'Editar', icon: Edit3, disabled: !selected || selected.status === 'Anulado', onClick: () => openEdit() },
        { id: 'void', label: 'Anular', icon: Ban, disabled: !selected || selected.status === 'Anulado', onClick: voidRecord },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson(`${storageKey}.json`, records) },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
        { id: 'exit', label: 'Salir', icon: X, onClick: controls?.onClose },
      ]}
    >
      <div className="warehouse-module-page">
        {message && <div className="warehouse-message">{message}</div>}
        <section className="warehouse-panel warehouse-filter-panel">
          <PanelHeading eyebrow="Consulta" title={`Filtros de ${title.toLowerCase()}`} />
          <div className="warehouse-filter-grid">
            <label>Buscar<input value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Numero, proveedor, cliente o documento" /></label>
            <label>Estado<select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option>Todos</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label>Almacen<select value={filters.warehouse} onChange={(event) => setFilters((current) => ({ ...current, warehouse: event.target.value }))}><option>Todos</option>{warehouseOptions().map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          </div>
        </section>

        <section className="warehouse-table-wrap">
          <table className="warehouse-table is-wide">
            <thead>
              <tr>
                {columns.map((column) => <th key={column.key}>{column.label}</th>)}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.number} className={selectedNumber === record.number ? 'is-selected' : ''} onClick={() => setSelectedNumber(record.number)}>
                  {columns.map((column) => <td key={column.key}>{column.render ? column.render(record) : record[column.key]}</td>)}
                  <td>
                    <div className="warehouse-table-actions">
                      <button type="button" title="Ver" onClick={(event) => { event.stopPropagation(); setSelectedNumber(record.number); openView(record) }}><Eye size={15} /></button>
                      <button type="button" title="Editar" onClick={(event) => { event.stopPropagation(); setSelectedNumber(record.number); openEdit(record) }} disabled={record.status === 'Anulado'}><Edit3 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={columns.length + 1} className="warehouse-empty-state">No hay registros para mostrar.</td></tr>}
            </tbody>
          </table>
        </section>

        {draft && (
          <Modal title={`${mode === 'view' ? 'Ver' : 'Editar'} ${title.toLowerCase()}`} subtitle={draft.number} onClose={() => setDraft(null)} onSave={mode === 'view' ? null : saveDraft} wide>
            {purchaseOrderSupport && availablePurchaseOrders.length === 0 && (
              <div className="warehouse-message">No hay ordenes de compra disponibles.</div>
            )}
            <div className="warehouse-form-grid">
              {fields.map((field) => <FieldControl key={field.name} field={{ ...field, readOnly: mode === 'view' || field.readOnly }} value={draft[field.name]} onChange={updateDraft} />)}
            </div>

            <h3 className="warehouse-modal-section-title">Detalle</h3>
            {mode !== 'view' && lineMode !== 'criteria' && (
              <button type="button" className="warehouse-small-button" onClick={addLine}>
                <PackageOpen size={15} /> Agregar producto
              </button>
            )}

            <div className="warehouse-table-wrap" style={{ marginTop: 10 }}>
              {lineMode === 'criteria' ? (
                <CriteriaTable lines={draft.lines || []} updateLine={updateLine} readOnly={mode === 'view'} />
              ) : (
                <ProductLinesTable lines={draft.lines || []} products={products} mode={lineMode} updateLine={updateLine} removeLine={removeLine} readOnly={mode === 'view'} />
              )}
            </div>
          </Modal>
        )}
      </div>
    </WarehousePageLayout>
  )
}

function ProductLinesTable({ lines, products, mode, updateLine, removeLine, readOnly }) {
  return (
    <table className="warehouse-table is-wide">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Unidad</th>
          {mode === 'receiving' && <th>Ordenada</th>}
          {mode === 'receiving' && <th>Ya recibida</th>}
          {mode === 'receiving' && <th>Pendiente</th>}
          <th>{mode === 'receiving' ? 'A recibir' : 'Cantidad'}</th>
          {mode === 'picking' && <th>Ubicacion sugerida</th>}
          {mode === 'putaway' && <th>Ubicacion final</th>}
          {mode === 'returns' && <th>Condicion</th>}
          <th>Stock</th>
          <th>Costo</th>
          {mode === 'receiving' && <th>Impuesto</th>}
          <th>Total</th>
          <th>Estado</th>
          {!readOnly && <th>Accion</th>}
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <tr key={line.id}>
            <td>
              <select className="warehouse-line-input" value={line.productCode} onChange={(event) => updateLine(line.id, 'productCode', event.target.value)} disabled={readOnly}>
                {productOptions(products).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </td>
            <td>{line.unit}</td>
            {mode === 'receiving' && <td><input className="warehouse-line-input" type="number" value={line.orderedQuantity} onChange={(event) => updateLine(line.id, 'orderedQuantity', event.target.value)} disabled={readOnly} /></td>}
            {mode === 'receiving' && <td>{formatNumber(line.alreadyReceivedQuantity)}</td>}
            {mode === 'receiving' && <td>{formatNumber(line.pendingQuantity)}</td>}
            <td><input className="warehouse-line-input" type="number" value={mode === 'receiving' ? line.receivedQuantity : line.quantity} onChange={(event) => updateLine(line.id, mode === 'receiving' ? 'receivedQuantity' : 'quantity', event.target.value)} disabled={readOnly} /></td>
            {mode === 'picking' && <td><select className="warehouse-line-input" value={line.suggestedLocation} onChange={(event) => updateLine(line.id, 'suggestedLocation', event.target.value)} disabled={readOnly}>{locationOptions().map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>}
            {mode === 'putaway' && <td><select className="warehouse-line-input" value={line.finalLocation} onChange={(event) => updateLine(line.id, 'finalLocation', event.target.value)} disabled={readOnly}>{locationOptions().map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>}
            {mode === 'returns' && <td><select className="warehouse-line-input" value={line.condition} onChange={(event) => updateLine(line.id, 'condition', event.target.value)} disabled={readOnly}><option>Buena</option><option>Danada</option><option>Cuarentena</option></select></td>}
            <td>{formatNumber(line.stockAvailable)}</td>
            <td><input className="warehouse-line-input" type="number" value={line.cost} onChange={(event) => updateLine(line.id, 'cost', event.target.value)} disabled={readOnly} /></td>
            {mode === 'receiving' && <td><input className="warehouse-line-input" type="number" value={line.tax} onChange={(event) => updateLine(line.id, 'tax', event.target.value)} disabled={readOnly} /></td>}
            <td>{formatCurrency(line.total)}</td>
            <td><StatusBadge value={line.lineStatus || 'Pendiente'} /></td>
            {!readOnly && <td><button type="button" className="warehouse-small-button" onClick={() => removeLine(line.id)}>Eliminar</button></td>}
          </tr>
        ))}
        {lines.length === 0 && <tr><td colSpan={mode === 'receiving' ? 12 : 11} className="warehouse-empty-state">No hay productos en el detalle.</td></tr>}
      </tbody>
    </table>
  )
}

function CriteriaTable({ lines, updateLine, readOnly }) {
  return (
    <table className="warehouse-table">
      <thead><tr><th>Criterio</th><th>Resultado</th><th>Nota</th></tr></thead>
      <tbody>
        {lines.map((line) => (
          <tr key={line.id}>
            <td><input className="warehouse-line-input" value={line.criterion} onChange={(event) => updateLine(line.id, 'criterion', event.target.value)} disabled={readOnly} /></td>
            <td><select className="warehouse-line-input" value={line.result} onChange={(event) => updateLine(line.id, 'result', event.target.value)} disabled={readOnly}><option>Pendiente</option><option>Aprobado</option><option>Rechazado</option><option>Condicional</option></select></td>
            <td><input className="warehouse-line-input" value={line.note} onChange={(event) => updateLine(line.id, 'note', event.target.value)} disabled={readOnly} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function documentColumns(extra = []) {
  return [
    { key: 'number', label: 'Numero' },
    { key: 'date', label: 'Fecha', render: (record) => formatDate(record.date) },
    ...extra,
    { key: 'warehouse', label: 'Almacen', render: (record) => record.warehouse || record.sourceWarehouse || record.targetWarehouse || 'N/D' },
    { key: 'items', label: 'Productos', render: (record) => record.lines?.length || 0 },
    { key: 'status', label: 'Estado', render: (record) => <StatusBadge value={record.status} /> },
    { key: 'responsible', label: 'Usuario', render: (record) => record.responsible || record.manager || 'Administrador' },
  ]
}

const baseDocumentFields = [
  { name: 'number', label: 'Numero', readOnly: true },
  { name: 'date', label: 'Fecha', type: 'date' },
  { name: 'warehouse', label: 'Almacen', type: 'select', options: warehouseOptions },
  { name: 'responsible', label: 'Responsable' },
  { name: 'relatedDocument', label: 'Documento relacionado' },
  { name: 'observations', label: 'Observaciones', type: 'textarea', span: 'full' },
]

export function WarehouseListPage(props) {
  const [stockModal, setStockModal] = useState(null)
  const movements = readArray(MOVEMENTS_KEY)
  const stockRows = stockModal ? movements.filter((movement) => [movement.warehouse, movement.origin, movement.destination].includes(stockModal.code)) : []

  return (
    <>
      <CatalogPage
        {...props}
        title="Almacenes"
        description="Administra almacenes principales, sucursales, temporales, cuarentena y devoluciones."
        storageKey={WAREHOUSES_KEY}
        defaultRecords={DEFAULT_WAREHOUSES}
        normalizeRecord={normalizeWarehouse}
        createRecord={(records) => ({ code: nextCode(records, 'ALM'), name: '', type: 'Sucursal', address: '', manager: '', phone: '', branch: '', status: 'Activo' })}
        fields={[
          { name: 'code', label: 'Codigo de almacen' },
          { name: 'name', label: 'Nombre de almacen' },
          { name: 'type', label: 'Tipo', type: 'select', options: ['Principal', 'Sucursal', 'Temporal', 'Cuarentena', 'Devoluciones'] },
          { name: 'branch', label: 'Sucursal asignada' },
          { name: 'manager', label: 'Encargado' },
          { name: 'phone', label: 'Telefono' },
          { name: 'status', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo'] },
          { name: 'address', label: 'Direccion', type: 'textarea', span: 'full' },
        ]}
        columns={[
          { key: 'code', label: 'Codigo' },
          { key: 'name', label: 'Nombre', render: (record) => <strong>{record.name}</strong> },
          { key: 'type', label: 'Tipo' },
          { key: 'branch', label: 'Sucursal' },
          { key: 'manager', label: 'Encargado' },
          { key: 'status', label: 'Estado', render: (record) => <StatusBadge value={record.status} /> },
        ]}
        searchFields={['code', 'name', 'type', 'branch', 'manager', 'status']}
        extraActions={[{ id: 'stock', label: 'Ver stock', icon: PackageCheck, onClick: (record) => setStockModal(record) }]}
      />
      {stockModal && (
        <Modal title="Stock relacionado" subtitle={stockModal.name} onClose={() => setStockModal(null)} wide>
          <div className="warehouse-table-wrap">
            <table className="warehouse-table is-wide">
              <thead><tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Documento</th><th>Entrada</th><th>Salida</th><th>Referencia</th></tr></thead>
              <tbody>
                {stockRows.map((movement) => (
                  <tr key={movement.id || `${movement.document}-${movement.productCode}`}>
                    <td>{formatDate(movement.date)}</td>
                    <td><strong>{movement.productName}</strong><small>{movement.productCode}</small></td>
                    <td>{movement.type}</td>
                    <td>{movement.document}</td>
                    <td>{formatNumber(movement.entry)}</td>
                    <td>{formatNumber(movement.exit)}</td>
                    <td>{movement.reference || 'N/D'}</td>
                  </tr>
                ))}
                {stockRows.length === 0 && <tr><td colSpan="7" className="warehouse-empty-state">No hay movimientos relacionados con este almacen.</td></tr>}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </>
  )
}

function normalizeLocation(record) {
  return {
    code: String(record.code || '').trim().toUpperCase(),
    warehouseCode: record.warehouseCode || 'ALM-01',
    zone: String(record.zone || '').trim(),
    aisle: String(record.aisle || '').trim(),
    rack: String(record.rack || '').trim(),
    level: String(record.level || '').trim(),
    position: String(record.position || '').trim(),
    description: String(record.description || '').trim(),
    status: record.status === 'Inactivo' ? 'Inactivo' : 'Activo',
    updatedAt: record.updatedAt || nowIso(),
  }
}

export function WarehouseLocationsPage(props) {
  return (
    <CatalogPage
      {...props}
      title="Ubicaciones"
      description="Administra zonas, pasillos, estantes, niveles y posiciones internas."
      storageKey={LOCATIONS_KEY}
      normalizeRecord={normalizeLocation}
      createRecord={(records) => ({ code: nextCode(records, 'UBI'), warehouseCode: 'ALM-01', zone: 'ZONA-A', aisle: 'PAS-01', rack: 'EST-01', level: 'NIV-01', position: 'POS-01', description: '', status: 'Activo' })}
      fields={[
        { name: 'code', label: 'Codigo de ubicacion' },
        { name: 'warehouseCode', label: 'Almacen', type: 'select', options: warehouseOptions },
        { name: 'zone', label: 'Zona' },
        { name: 'aisle', label: 'Pasillo' },
        { name: 'rack', label: 'Estante' },
        { name: 'level', label: 'Nivel' },
        { name: 'position', label: 'Posicion' },
        { name: 'status', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo'] },
        { name: 'description', label: 'Descripcion', type: 'textarea', span: 'full' },
      ]}
      columns={[
        { key: 'code', label: 'Codigo' },
        { key: 'warehouseCode', label: 'Almacen' },
        { key: 'zone', label: 'Zona' },
        { key: 'aisle', label: 'Pasillo' },
        { key: 'rack', label: 'Estante' },
        { key: 'level', label: 'Nivel' },
        { key: 'status', label: 'Estado', render: (record) => <StatusBadge value={record.status} /> },
      ]}
      searchFields={['code', 'warehouseCode', 'zone', 'aisle', 'rack', 'level', 'position', 'status']}
    />
  )
}

export function WarehouseReceivingPage(props) {
  return (
    <DocumentPage
      {...props}
      title="Recepcion de mercancia"
      description="Recibe productos por orden de compra o entrada manual y aumenta stock."
      storageKey={RECEIPTS_KEY}
      numberPrefix="REC"
      newLabel="Nueva recepcion"
      defaultStatus="Borrador"
      completedStatus="Recibida"
      statuses={['Borrador', 'Parcial', 'Recibida', 'Anulado']}
      stockMode="entry"
      movementType="Entrada por recepcion"
      lineMode="receiving"
      purchaseOrderSupport
      fields={[
        { name: 'number', label: 'Numero recepcion', readOnly: true },
        { name: 'date', label: 'Fecha', type: 'date' },
        { name: 'purchaseOrder', label: 'Orden de compra', type: 'select', options: purchaseOrderOptions },
        { name: 'supplier', label: 'Proveedor' },
        { name: 'fiscalId', label: 'RNC proveedor', readOnly: true },
        { name: 'phone', label: 'Telefono', readOnly: true },
        { name: 'address', label: 'Direccion', readOnly: true },
        { name: 'orderDate', label: 'Fecha de orden', type: 'date', readOnly: true },
        { name: 'paymentCondition', label: 'Condicion de pago', readOnly: true },
        { name: 'warehouse', label: 'Almacen destino', type: 'select', options: warehouseOptions },
        { name: 'responsible', label: 'Responsable' },
        { name: 'status', label: 'Estado', type: 'select', options: ['Borrador', 'Parcial', 'Recibida', 'Anulado'] },
        { name: 'observations', label: 'Observaciones', type: 'textarea', span: 'full' },
      ]}
      columns={documentColumns([
        { key: 'supplier', label: 'Proveedor' },
        { key: 'purchaseOrder', label: 'Orden compra' },
      ])}
    />
  )
}

export function WarehouseDispatchPage(props) {
  return (
    <DocumentPage
      {...props}
      title="Despacho"
      description="Registra salidas operativas de mercancia desde un almacen origen."
      storageKey={DISPATCHES_KEY}
      numberPrefix="DES"
      newLabel="Nuevo despacho"
      completedStatus="Despachado"
      statuses={['Borrador', 'Despachado', 'Anulado']}
      stockMode="exit"
      movementType="Salida por despacho"
      validate={(record, products) => {
        const lowLine = record.lines.find((line) => toNumber(products.find((product) => product.code === line.productCode)?.stock) < toNumber(line.quantity))
        return lowLine ? `Stock insuficiente para ${lowLine.productName}.` : ''
      }}
      fields={[
        { name: 'number', label: 'Numero despacho', readOnly: true },
        { name: 'date', label: 'Fecha', type: 'date' },
        { name: 'customer', label: 'Cliente / destino' },
        { name: 'warehouse', label: 'Almacen origen', type: 'select', options: warehouseOptions },
        { name: 'responsible', label: 'Responsable' },
        { name: 'relatedDocument', label: 'Documento relacionado' },
        { name: 'status', label: 'Estado', type: 'select', options: ['Borrador', 'Despachado', 'Anulado'] },
        { name: 'observations', label: 'Observaciones', type: 'textarea', span: 'full' },
      ]}
      columns={documentColumns([{ key: 'customer', label: 'Cliente / destino' }, { key: 'relatedDocument', label: 'Documento' }])}
    />
  )
}

export function WarehouseTransfersPage(props) {
  return (
    <DocumentPage
      {...props}
      title="Transferencias entre almacenes"
      description="Mueve mercancia entre almacenes con movimientos de salida y entrada."
      storageKey={TRANSFERS_KEY}
      numberPrefix="TR"
      newLabel="Nueva transferencia"
      completedStatus="Transferida"
      statuses={['Borrador', 'Transferida', 'Anulado']}
      stockMode="transfer"
      movementExitType="Transferencia salida"
      movementEntryType="Transferencia entrada"
      validate={(record, products) => {
        if (record.sourceWarehouse === record.targetWarehouse) return 'El almacen origen y destino no pueden ser iguales.'
        const lowLine = record.lines.find((line) => toNumber(products.find((product) => product.code === line.productCode)?.stock) < toNumber(line.quantity))
        return lowLine ? `Stock insuficiente para ${lowLine.productName}.` : ''
      }}
      fields={[
        { name: 'number', label: 'Numero transferencia', readOnly: true },
        { name: 'date', label: 'Fecha', type: 'date' },
        { name: 'sourceWarehouse', label: 'Almacen origen', type: 'select', options: warehouseOptions },
        { name: 'targetWarehouse', label: 'Almacen destino', type: 'select', options: warehouseOptions },
        { name: 'responsible', label: 'Responsable' },
        { name: 'reason', label: 'Motivo' },
        { name: 'status', label: 'Estado', type: 'select', options: ['Borrador', 'Transferida', 'Anulado'] },
        { name: 'observations', label: 'Observaciones', type: 'textarea', span: 'full' },
      ]}
      columns={documentColumns([{ key: 'sourceWarehouse', label: 'Origen' }, { key: 'targetWarehouse', label: 'Destino' }, { key: 'reason', label: 'Motivo' }])}
    />
  )
}

export function WarehousePickingPage(props) {
  return (
    <DocumentPage
      {...props}
      title="Picking"
      description="Prepara productos para despacho desde ubicaciones sugeridas."
      storageKey={PICKING_KEY}
      numberPrefix="PIC"
      newLabel="Nuevo picking"
      completedStatus="En proceso"
      statuses={['Pendiente', 'En proceso', 'Preparado', 'Anulado']}
      lineMode="picking"
      fields={[
        { name: 'number', label: 'Numero picking', readOnly: true },
        { name: 'date', label: 'Fecha', type: 'date' },
        { name: 'relatedDocument', label: 'Documento origen' },
        { name: 'warehouse', label: 'Almacen', type: 'select', options: warehouseOptions },
        { name: 'responsible', label: 'Responsable' },
        { name: 'status', label: 'Estado', type: 'select', options: ['Pendiente', 'En proceso', 'Preparado', 'Anulado'] },
        { name: 'observations', label: 'Observaciones', type: 'textarea', span: 'full' },
      ]}
      columns={documentColumns([{ key: 'relatedDocument', label: 'Documento origen' }])}
    />
  )
}

export function WarehousePutawayPage(props) {
  return (
    <DocumentPage
      {...props}
      title="Putaway"
      description="Asigna ubicaciones finales a productos recibidos."
      storageKey={PUTAWAY_KEY}
      numberPrefix="PUT"
      newLabel="Crear putaway"
      completedStatus="Asignado"
      statuses={['Pendiente', 'Asignado', 'Confirmado', 'Anulado']}
      lineMode="putaway"
      fields={[
        { name: 'number', label: 'Numero putaway', readOnly: true },
        { name: 'date', label: 'Fecha', type: 'date' },
        { name: 'relatedDocument', label: 'Recepcion relacionada' },
        { name: 'warehouse', label: 'Almacen', type: 'select', options: warehouseOptions },
        { name: 'responsible', label: 'Responsable' },
        { name: 'status', label: 'Estado', type: 'select', options: ['Pendiente', 'Asignado', 'Confirmado', 'Anulado'] },
        { name: 'observations', label: 'Observaciones', type: 'textarea', span: 'full' },
      ]}
      columns={documentColumns([{ key: 'relatedDocument', label: 'Recepcion' }])}
    />
  )
}

export function WarehouseReturnsPage(props) {
  return (
    <DocumentPage
      {...props}
      title="Devoluciones al almacen"
      description="Registra mercancia devuelta y aumenta stock si esta en condicion buena."
      storageKey={RETURNS_KEY}
      numberPrefix="DEV"
      newLabel="Nueva devolucion"
      completedStatus="Recibida"
      statuses={['Borrador', 'Recibida', 'En cuarentena', 'Anulado']}
      lineMode="returns"
      stockMode="entry"
      movementType="Entrada por devolucion"
      fields={[
        { name: 'number', label: 'Numero devolucion', readOnly: true },
        { name: 'date', label: 'Fecha', type: 'date' },
        { name: 'origin', label: 'Origen devolucion', type: 'select', options: ['Cliente', 'Despacho', 'Interna'] },
        { name: 'warehouse', label: 'Almacen destino', type: 'select', options: warehouseOptions },
        { name: 'responsible', label: 'Responsable' },
        { name: 'reason', label: 'Motivo' },
        { name: 'status', label: 'Estado', type: 'select', options: ['Borrador', 'Recibida', 'En cuarentena', 'Anulado'] },
        { name: 'observations', label: 'Observaciones', type: 'textarea', span: 'full' },
      ]}
      columns={documentColumns([{ key: 'origin', label: 'Origen' }, { key: 'reason', label: 'Motivo' }])}
    />
  )
}

export function WarehouseDamagesPage(props) {
  return (
    <DocumentPage
      {...props}
      title="Mermas y averias"
      description="Registra perdidas, danos, vencimientos y productos no vendibles."
      storageKey={DAMAGES_KEY}
      numberPrefix="MER"
      newLabel="Nueva merma"
      completedStatus="Aplicada"
      statuses={['Borrador', 'Aplicada', 'Anulado']}
      stockMode="exit"
      movementType="Salida por merma"
      fields={[
        { name: 'number', label: 'Numero merma', readOnly: true },
        { name: 'date', label: 'Fecha', type: 'date' },
        { name: 'warehouse', label: 'Almacen', type: 'select', options: warehouseOptions },
        { name: 'responsible', label: 'Responsable' },
        { name: 'reason', label: 'Motivo', type: 'select', options: ['Producto danado', 'Vencido', 'Perdida', 'Rotura', 'Ajuste por averia', 'Otro'] },
        { name: 'status', label: 'Estado', type: 'select', options: ['Borrador', 'Aplicada', 'Anulado'] },
        { name: 'observations', label: 'Observaciones', type: 'textarea', span: 'full' },
      ]}
      columns={documentColumns([{ key: 'reason', label: 'Motivo' }])}
    />
  )
}

export function WarehouseQuarantinePage(props) {
  return (
    <DocumentPage
      {...props}
      title="Cuarentena"
      description="Controla productos retenidos para revision, liberacion o rechazo."
      storageKey={QUARANTINE_KEY}
      numberPrefix="CUA"
      newLabel="Enviar a cuarentena"
      completedStatus="En cuarentena"
      statuses={['En cuarentena', 'Liberado', 'Rechazado', 'Devuelto', 'Danado', 'Anulado']}
      stockMode="none"
      movementType="Cuarentena"
      fields={[
        { name: 'number', label: 'Numero', readOnly: true },
        { name: 'date', label: 'Fecha', type: 'date' },
        { name: 'warehouse', label: 'Almacen', type: 'select', options: warehouseOptions },
        { name: 'location', label: 'Ubicacion', type: 'select', options: locationOptions },
        { name: 'responsible', label: 'Responsable' },
        { name: 'reason', label: 'Motivo' },
        { name: 'status', label: 'Estado', type: 'select', options: ['En cuarentena', 'Liberado', 'Rechazado', 'Devuelto', 'Danado', 'Anulado'] },
        { name: 'observations', label: 'Observaciones', type: 'textarea', span: 'full' },
      ]}
      columns={documentColumns([{ key: 'location', label: 'Ubicacion' }, { key: 'reason', label: 'Motivo' }])}
    />
  )
}

export function WarehouseQualityPage(props) {
  return (
    <DocumentPage
      {...props}
      title="Control de calidad"
      description="Inspecciona mercancia recibida o retenida en cuarentena."
      storageKey={QUALITY_KEY}
      numberPrefix="QC"
      newLabel="Nueva inspeccion"
      completedStatus="Aprobado"
      statuses={['Pendiente', 'Aprobado', 'Rechazado', 'Condicional', 'En cuarentena', 'Anulado']}
      lineMode="criteria"
      fields={[
        { name: 'number', label: 'Numero inspeccion', readOnly: true },
        { name: 'date', label: 'Fecha', type: 'date' },
        { name: 'relatedDocument', label: 'Recepcion relacionada' },
        { name: 'lot', label: 'Lote / serie' },
        { name: 'responsible', label: 'Inspector' },
        { name: 'status', label: 'Resultado', type: 'select', options: ['Pendiente', 'Aprobado', 'Rechazado', 'Condicional', 'En cuarentena', 'Anulado'] },
        { name: 'observations', label: 'Observaciones', type: 'textarea', span: 'full' },
      ]}
      columns={documentColumns([{ key: 'relatedDocument', label: 'Recepcion' }, { key: 'lot', label: 'Lote / serie' }])}
    />
  )
}

function normalizeRoute(record) {
  return {
    code: String(record.code || '').trim().toUpperCase(),
    name: String(record.name || '').trim(),
    zone: String(record.zone || '').trim(),
    responsible: String(record.responsible || '').trim(),
    vehicle: String(record.vehicle || '').trim(),
    status: record.status === 'Inactivo' ? 'Inactivo' : 'Activo',
    stops: Array.isArray(record.stops) ? record.stops : [],
    updatedAt: record.updatedAt || nowIso(),
  }
}

export function WarehouseRoutesPage(props) {
  return (
    <CatalogPage
      {...props}
      title="Rutas de despacho"
      description="Organiza rutas, zonas, responsables, vehiculos y destinos de entrega."
      storageKey={ROUTES_KEY}
      normalizeRecord={normalizeRoute}
      createRecord={(records) => ({ code: nextCode(records, 'RUT'), name: '', zone: '', responsible: '', vehicle: '', status: 'Activo', stops: [] })}
      fields={[
        { name: 'code', label: 'Codigo de ruta' },
        { name: 'name', label: 'Nombre de ruta' },
        { name: 'zone', label: 'Zona' },
        { name: 'responsible', label: 'Responsable' },
        { name: 'vehicle', label: 'Vehiculo' },
        { name: 'status', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo'] },
      ]}
      columns={[
        { key: 'code', label: 'Codigo' },
        { key: 'name', label: 'Ruta', render: (record) => <strong>{record.name}</strong> },
        { key: 'zone', label: 'Zona' },
        { key: 'responsible', label: 'Responsable' },
        { key: 'vehicle', label: 'Vehiculo' },
        { key: 'status', label: 'Estado', render: (record) => <StatusBadge value={record.status} /> },
      ]}
      searchFields={['code', 'name', 'zone', 'responsible', 'vehicle', 'status']}
    />
  )
}
