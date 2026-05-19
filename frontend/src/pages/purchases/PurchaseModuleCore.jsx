import { useEffect, useMemo, useState } from 'react'
import {
  Ban,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  FilePlus2,
  FileText,
  Maximize2,
  Minimize2,
  Printer,
  RotateCcw,
  Save,
  Send,
  X,
} from 'lucide-react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import './PurchaseModulePages.css'

const PRODUCTS_KEY = 'inveFatInventoryProducts'
const WAREHOUSES_KEY = 'invefat_warehouses'
const REQUESTS_KEY = 'invefat_purchase_requests'
const QUOTES_KEY = 'invefat_supplier_quotes'
const ORDERS_KEY = 'invefat_purchase_orders'
const INVOICES_KEY = 'invefat_supplier_invoices'
const CREDIT_NOTES_KEY = 'invefat_supplier_credit_notes'
const SUPPLIERS_KEY = 'invefat_suppliers'
const PAYMENTS_KEY = 'invefat_supplier_payments'
const RECEIPTS_KEY = 'invefat_warehouse_receipts'
const PENDING_RECEIPT_ORDER_KEY = 'invefat_pending_receipt_order'
const PENDING_PURCHASE_ORDER_KEY = 'invefat_pending_purchase_order_from_alert'
const PRODUCT_SUPPLIERS_KEY = 'invefat_product_suppliers'

const DEFAULT_SUPPLIERS = [
  {
    code: 'SUP-001',
    type: 'Empresa',
    commercialName: 'Suplidora Duarte',
    legalName: 'Suplidora Duarte SRL',
    fiscalId: '101-0000001-1',
    phone: '809-000-0001',
    whatsapp: '',
    email: 'compras@suplidora.test',
    address: 'Santo Domingo',
    city: 'Santo Domingo',
    province: 'Distrito Nacional',
    country: 'Republica Dominicana',
    contact: 'Compras',
    paymentCondition: 'Credito 30 dias',
    creditDays: 30,
    creditLimit: 100000,
    category: 'General',
    status: 'Activo',
    note: '',
    balance: 0,
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

function nextCode(records, prefix, field = 'code', pad = 3) {
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

function formatCurrency(value) {
  return `RD$ ${toNumber(value).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatNumber(value) {
  return toNumber(value).toLocaleString('es-DO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
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
  if (clean.includes('anulad') || clean.includes('rechaz') || clean.includes('venc')) return 'is-danger'
  if (clean.includes('borrador') || clean.includes('pendiente') || clean.includes('parcial')) return 'is-warning'
  if (clean.includes('aprob') || clean.includes('recib') || clean.includes('pagad') || clean.includes('registr') || clean.includes('activo') || clean.includes('convert')) return 'is-success'
  return 'is-info'
}

function StatusBadge({ value }) {
  return <span className={`purchase-badge ${getStatusClass(value)}`}>{value || 'N/D'}</span>
}

function readProducts() {
  return readArray(PRODUCTS_KEY).map((product) => ({
    code: String(product.code || '').trim(),
    name: String(product.name || '').trim(),
    category: String(product.category || '').trim(),
    unit: String(product.unit || 'Unidad').trim(),
    barcode: String(product.barcode || '').trim(),
    image: product.image || product.imageUrl || product.productImage || product.imagen || product.photo || '',
    cost: toNumber(product.cost),
    price: toNumber(product.price),
    stock: toNumber(product.stock),
    minStock: toNumber(product.minStock),
    maxStock: toNumber(product.maxStock),
    supplierCode: String(product.supplierCode || product.providerCode || product.mainSupplierCode || '').trim(),
    supplierName: String(product.supplierName || product.providerName || product.supplier || product.provider || '').trim(),
    status: product.status || 'Activo',
  }))
}

function productSuppliersMap() {
  return readArray(PRODUCT_SUPPLIERS_KEY).reduce((map, record) => {
    if (!record.productCode) return map
    map[record.productCode] = [
      record.supplierCode,
      record.supplierName,
      ...(record.suppliers || []).map((supplier) => supplier.code || supplier.name),
    ].filter(Boolean)
    return map
  }, {})
}

function productBelongsToSupplier(product, supplierCode, supplierName, relationMap = productSuppliersMap()) {
  if (!supplierCode && !supplierName) return false
  const productSuppliers = [
    product.supplierCode,
    product.supplierName,
    ...(relationMap[product.code] || []),
  ].map((value) => cleanText(value)).filter(Boolean)
  return productSuppliers.includes(cleanText(supplierCode)) || productSuppliers.includes(cleanText(supplierName))
}

function isLowStockProduct(product) {
  return toNumber(product.minStock) > 0 && toNumber(product.stock) <= toNumber(product.minStock)
}

function getSuggestedQuantity(product) {
  const target = toNumber(product.maxStock) > 0 ? toNumber(product.maxStock) : toNumber(product.minStock)
  return Math.max(1, target - toNumber(product.stock))
}

function productOptions(products) {
  return [
    { value: '', label: 'Seleccione un producto' },
    ...products.map((product) => ({ value: product.code, label: `${product.code} - ${product.name}` })),
  ]
}

function normalizeSupplier(record) {
  return {
    code: String(record.code || '').trim().toUpperCase(),
    type: record.type || 'Empresa',
    commercialName: String(record.commercialName || record.name || '').trim(),
    legalName: String(record.legalName || '').trim(),
    fiscalId: String(record.fiscalId || record.rnc || '').trim(),
    phone: String(record.phone || '').trim(),
    whatsapp: String(record.whatsapp || '').trim(),
    email: String(record.email || '').trim(),
    address: String(record.address || '').trim(),
    city: String(record.city || '').trim(),
    province: String(record.province || '').trim(),
    country: String(record.country || 'Republica Dominicana').trim(),
    contact: String(record.contact || '').trim(),
    paymentCondition: record.paymentCondition || 'Contado',
    creditDays: toNumber(record.creditDays),
    creditLimit: toNumber(record.creditLimit),
    category: String(record.category || 'General').trim(),
    status: record.status === 'Inactivo' ? 'Inactivo' : 'Activo',
    note: String(record.note || '').trim(),
    balance: toNumber(record.balance),
    updatedAt: record.updatedAt || nowIso(),
  }
}

function readSuppliers() {
  const saved = readArray(SUPPLIERS_KEY)
  if (saved.length > 0) return saved.map(normalizeSupplier)
  writeArray(SUPPLIERS_KEY, DEFAULT_SUPPLIERS)
  return DEFAULT_SUPPLIERS
}

function supplierOptions() {
  return [
    { value: '', label: 'Seleccione un proveedor' },
    ...readSuppliers().map((supplier) => ({ value: supplier.code, label: `${supplier.code} - ${supplier.commercialName}` })),
  ]
}

function warehouseOptions() {
  const warehouses = readArray(WAREHOUSES_KEY, [
    { code: 'ALM-01', name: 'Almacen Principal' },
    { code: 'ALM-02', name: 'Almacen Sucursal' },
  ])
  return warehouses.map((warehouse) => ({ value: warehouse.code, label: `${warehouse.code} - ${warehouse.name}` }))
}

function getSupplier(code) {
  return readSuppliers().find((supplier) => supplier.code === code) || {}
}

function normalizeLine(line, products) {
  const product = products.find((item) => item.code === line.productCode) || {}
  const quantity = toNumber(line.quantity)
  const cost = toNumber(line.cost ?? product.cost)
  const discount = toNumber(line.discount)
  const tax = toNumber(line.tax)
  return {
    id: line.id || makeId('line'),
    productCode: line.productCode || product.code || '',
    productName: line.productName || product.name || '',
    unit: line.unit || product.unit || 'Unidad',
    quantity,
    cost,
    discount,
    tax,
    reason: line.reason || '',
    requiredDate: line.requiredDate || '',
    total: Math.max(0, quantity * cost - discount + tax),
  }
}

function createBlankLine(products) {
  const product = products[0] || {}
  return normalizeLine({
    productCode: product.code || '',
    productName: product.name || '',
    unit: product.unit || 'Unidad',
    quantity: 1,
    cost: product.cost || 0,
    discount: 0,
    tax: 0,
    reason: '',
    requiredDate: today(),
  }, products)
}

function calculateTotals(lines = []) {
  const subtotal = lines.reduce((sum, line) => sum + (toNumber(line.quantity) * toNumber(line.cost)), 0)
  const discount = lines.reduce((sum, line) => sum + toNumber(line.discount), 0)
  const tax = lines.reduce((sum, line) => sum + toNumber(line.tax), 0)
  const total = subtotal - discount + tax
  return { subtotal, discount, tax, total }
}

function Modal({ title, subtitle = 'Compras', children, onClose, onSave, saveLabel = 'Guardar', wide = false, canSave = true }) {
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
      <button type="button" className="purchase-minimized-modal" onClick={() => setWindowState('normal')}>
        <span>Ventana minimizada</span>
        <strong>{title}</strong>
      </button>
    )
  }

  return (
    <div className="purchase-modal-backdrop" role="presentation">
      <section className={`purchase-modal ${wide ? 'is-wide' : ''} ${windowState === 'maximized' ? 'is-maximized' : ''}`} role="dialog" aria-modal="true">
        <header className="purchase-modal-header">
          <div>
            <span>{subtitle}</span>
            <h2>{title}</h2>
          </div>
          <div className="purchase-modal-controls">
            <button type="button" title="Minimizar" onClick={() => setWindowState('minimized')}><Minimize2 size={14} /></button>
            <button type="button" title={windowState === 'maximized' ? 'Restaurar' : 'Maximizar'} onClick={() => setWindowState(windowState === 'maximized' ? 'normal' : 'maximized')}>
              {windowState === 'maximized' ? <RotateCcw size={14} /> : <Maximize2 size={14} />}
            </button>
            <button type="button" className="is-exit" title="Cerrar" onClick={onClose}><X size={15} /></button>
          </div>
        </header>
        <div className="purchase-modal-body">{children}</div>
        <footer className="purchase-modal-footer">
          <button type="button" onClick={onClose}>Cancelar</button>
          {onSave && (
            <button type="button" className="purchase-primary-action" onClick={onSave} disabled={!canSave}>
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
      <label className={field.span ? `purchase-span-${field.span}` : ''}>
        {field.label}
        <textarea {...commonProps} />
      </label>
    )
  }

  if (field.type === 'select') {
    return (
      <label className={field.span ? `purchase-span-${field.span}` : ''}>
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
    <label className={field.span ? `purchase-span-${field.span}` : ''}>
      {field.label}
      <input type={field.type || 'text'} {...commonProps} />
    </label>
  )
}

function PanelHeading({ eyebrow, title, right }) {
  return (
    <div className="purchase-panel-heading">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {right}
    </div>
  )
}

function PurchasePageLayout({ title, description, searchValue, onSearchChange, actions, controls, children }) {
  return (
    <ModulePageLayout
      title={title}
      moduleLabel="Compras"
      description={description}
      breadcrumb={['Compras', title]}
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

function ActionButtons({ record, onView, onEdit, onPrint, onSend, onVoid, extra }) {
  return (
    <div className="purchase-table-actions">
      <button type="button" title="Ver" aria-label="Ver" onClick={(event) => { event.stopPropagation(); onView?.(record) }}><Eye size={15} /></button>
      {onEdit && <button type="button" title="Editar" aria-label="Editar" onClick={(event) => { event.stopPropagation(); onEdit(record) }}><Edit3 size={15} /></button>}
      {onPrint && <button type="button" title="Imprimir" aria-label="Imprimir" onClick={(event) => { event.stopPropagation(); onPrint(record) }}><Printer size={15} /></button>}
      {onSend && <button type="button" title="Enviar" aria-label="Enviar" onClick={(event) => { event.stopPropagation(); onSend(record) }}><Send size={15} /></button>}
      {extra}
      {onVoid && <button type="button" className="is-danger" title="Anular" aria-label="Anular" disabled={record.status === 'Anulada'} onClick={(event) => { event.stopPropagation(); onVoid(record) }}><Ban size={15} /></button>}
    </div>
  )
}

function SupplierCatalogPage({ controls, onAction, searchValue = '', onSearchChange }) {
  const [records, setRecords] = useState(() => readSuppliers())
  const [filters, setFilters] = useState({ query: '', status: 'Todos' })
  const [selectedCode, setSelectedCode] = useState('')
  const [draft, setDraft] = useState(null)
  const [infoModal, setInfoModal] = useState('')
  const [message, setMessage] = useState('')
  const selected = records.find((record) => record.code === selectedCode)

  const saveRecords = (nextRecords) => {
    setRecords(nextRecords)
    writeArray(SUPPLIERS_KEY, nextRecords)
  }

  const filtered = records.filter((record) => {
    const query = cleanText([filters.query, searchValue].filter(Boolean).join(' '))
    const matchesText = !query || ['code', 'commercialName', 'legalName', 'fiscalId', 'phone', 'email', 'address'].some((field) => cleanText(record[field]).includes(query))
    const matchesStatus = filters.status === 'Todos' || record.status === filters.status
    return matchesText && matchesStatus
  })

  const newSupplier = () => setDraft({
    code: nextCode(records, 'SUP'),
    type: 'Empresa',
    commercialName: '',
    legalName: '',
    fiscalId: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    city: '',
    province: '',
    country: 'Republica Dominicana',
    contact: '',
    paymentCondition: 'Contado',
    creditDays: 0,
    creditLimit: 0,
    category: 'General',
    status: 'Activo',
    note: '',
    balance: 0,
  })

  const saveDraft = () => {
    const normalized = normalizeSupplier(draft)
    if (!normalized.code || !normalized.commercialName) {
      setMessage('Debe completar codigo y nombre del proveedor.')
      return
    }
    const duplicate = records.some((record) => record.code === normalized.code && record.code !== selectedCode)
    if (duplicate) {
      setMessage('Ya existe un proveedor con ese codigo.')
      return
    }
    const exists = records.some((record) => record.code === selectedCode)
    const nextRecords = exists
      ? records.map((record) => record.code === selectedCode ? normalized : record)
      : [normalized, ...records]
    saveRecords(nextRecords)
    setSelectedCode(normalized.code)
    setDraft(null)
    setMessage('Proveedor guardado correctamente.')
    onAction?.('Proveedor guardado')
  }

  const toggleStatus = (target = selected) => {
    if (!target) return
    saveRecords(records.map((record) => (
      record.code === target.code
        ? { ...record, status: record.status === 'Inactivo' ? 'Activo' : 'Inactivo' }
        : record
    )))
    setSelectedCode(target.code)
  }

  const supplierInvoices = readArray(INVOICES_KEY).filter((invoice) => invoice.supplierCode === selected?.code)
  const balance = supplierInvoices.reduce((sum, invoice) => sum + toNumber(invoice.balance ?? invoice.total ?? calculateTotals(invoice.lines).total), 0)

  return (
    <PurchasePageLayout
      title="Proveedores"
      description="Gestion de proveedores, condiciones comerciales, balances e historial."
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      controls={controls}
      actions={[
        { id: 'new', label: 'Nuevo proveedor', icon: FilePlus2, variant: 'primary', onClick: newSupplier },
        { id: 'edit', label: 'Editar', icon: Edit3, disabled: !selected, onClick: () => selected && setDraft({ ...selected }) },
        { id: 'inactive', label: selected?.status === 'Inactivo' ? 'Activar' : 'Inactivar', icon: Ban, disabled: !selected, onClick: toggleStatus },
        { id: 'history', label: 'Historial', icon: FileText, disabled: !selected, onClick: () => setInfoModal('history') },
        { id: 'statement', label: 'Estado de cuenta', icon: Eye, disabled: !selected, onClick: () => setInfoModal('statement') },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('invefat_suppliers.json', records) },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
        { id: 'exit', label: 'Salir', icon: X, onClick: controls?.onClose },
      ]}
    >
      <div className="purchase-module-page">
        {message && <div className="purchase-message">{message}</div>}
        <section className="purchase-panel purchase-filter-panel">
          <PanelHeading eyebrow="Busqueda" title="Filtros de proveedores" />
          <div className="purchase-filter-grid">
            <label>Buscar<input value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Codigo, nombre, RNC, telefono o correo" /></label>
            <label>Estado<select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option>Todos</option><option>Activo</option><option>Inactivo</option></select></label>
          </div>
        </section>
        <section className="purchase-table-wrap">
          <table className="purchase-table is-wide">
            <thead><tr><th>Codigo</th><th>Proveedor</th><th>RNC</th><th>Telefono</th><th>Correo</th><th>Direccion</th><th>Estado</th><th>Balance</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.code} className={selectedCode === record.code ? 'is-selected' : ''} onClick={() => setSelectedCode(record.code)}>
                  <td>{record.code}</td>
                  <td><strong>{record.commercialName}</strong><small>{record.legalName || record.type}</small></td>
                  <td>{record.fiscalId || 'N/D'}</td>
                  <td>{record.phone || 'N/D'}</td>
                  <td>{record.email || 'N/D'}</td>
                  <td>{record.address || 'N/D'}</td>
                  <td><StatusBadge value={record.status} /></td>
                  <td>{formatCurrency(record.balance)}</td>
                  <td><ActionButtons record={record} onView={() => { setSelectedCode(record.code); setInfoModal('statement') }} onEdit={() => { setSelectedCode(record.code); setDraft({ ...record }) }} onPrint={() => window.print()} onVoid={() => toggleStatus(record)} /></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="9" className="purchase-empty-state">No hay proveedores registrados.</td></tr>}
            </tbody>
          </table>
        </section>

        {draft && (
          <Modal title="Proveedor" subtitle={draft.code} onClose={() => setDraft(null)} onSave={saveDraft} wide>
            <div className="purchase-form-grid">
              {[
                { name: 'code', label: 'Codigo proveedor' },
                { name: 'type', label: 'Tipo', type: 'select', options: ['Empresa', 'Persona'] },
                { name: 'commercialName', label: 'Nombre comercial' },
                { name: 'legalName', label: 'Razon social' },
                { name: 'fiscalId', label: 'RNC / identificacion' },
                { name: 'phone', label: 'Telefono' },
                { name: 'whatsapp', label: 'WhatsApp' },
                { name: 'email', label: 'Correo' },
                { name: 'address', label: 'Direccion' },
                { name: 'city', label: 'Ciudad' },
                { name: 'province', label: 'Provincia' },
                { name: 'country', label: 'Pais' },
                { name: 'contact', label: 'Contacto principal' },
                { name: 'paymentCondition', label: 'Condicion de pago', type: 'select', options: ['Contado', 'Credito 15 dias', 'Credito 30 dias', 'Credito 45 dias'] },
                { name: 'creditDays', label: 'Dias de credito', type: 'number' },
                { name: 'creditLimit', label: 'Limite de credito', type: 'number' },
                { name: 'category', label: 'Categoria proveedor' },
                { name: 'status', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo'] },
                { name: 'note', label: 'Nota interna', type: 'textarea', span: 'full' },
              ].map((field) => <FieldControl key={field.name} field={field} value={draft[field.name]} onChange={(name, value) => setDraft((current) => ({ ...current, [name]: value }))} />)}
            </div>
          </Modal>
        )}

        {infoModal && selected && (
          <Modal title={infoModal === 'history' ? 'Historial del proveedor' : 'Estado de cuenta'} subtitle={selected.commercialName} onClose={() => setInfoModal('')} wide>
            <div className="purchase-summary-grid">
              <article><span>Proveedor</span><strong>{selected.commercialName}</strong></article>
              <article><span>Balance</span><strong>{formatCurrency(balance)}</strong></article>
              <article><span>Facturas</span><strong>{supplierInvoices.length}</strong></article>
              <article><span>Estado</span><strong>{selected.status}</strong></article>
            </div>
            <div className="purchase-table-wrap" style={{ marginTop: 12 }}>
              <table className="purchase-table">
                <thead><tr><th>Fecha</th><th>Documento</th><th>Total</th><th>Balance</th><th>Estado</th></tr></thead>
                <tbody>
                  {supplierInvoices.map((invoice) => <tr key={invoice.number}><td>{formatDate(invoice.date)}</td><td>{invoice.number}</td><td>{formatCurrency(invoice.total || calculateTotals(invoice.lines).total)}</td><td>{formatCurrency(invoice.balance ?? invoice.total ?? calculateTotals(invoice.lines).total)}</td><td><StatusBadge value={invoice.status} /></td></tr>)}
                  {supplierInvoices.length === 0 && <tr><td colSpan="5" className="purchase-empty-state">No hay documentos pendientes para este proveedor.</td></tr>}
                </tbody>
              </table>
            </div>
          </Modal>
        )}
      </div>
    </PurchasePageLayout>
  )
}

export function SuppliersPage(props) {
  return <SupplierCatalogPage {...props} />
}

function DocumentPage({
  title,
  description,
  storageKey,
  numberPrefix,
  newLabel,
  completedStatus,
  statuses,
  fields,
  columns,
  lineMode = 'product',
  extraRecordDefaults = {},
  allowApprove = false,
  allowReject = false,
  allowConvert = false,
  convertLabel = 'Convertir',
  convertAction,
  payable = false,
  searchValue = '',
  onSearchChange,
  controls,
  onAction,
  onNavigate,
}) {
  const [records, setRecords] = useState(() => readArray(storageKey))
  const [products] = useState(() => readProducts())
  const [filters, setFilters] = useState({ query: '', status: 'Todos' })
  const [selectedNumber, setSelectedNumber] = useState('')
  const [draft, setDraft] = useState(null)
  const [mode, setMode] = useState('edit')
  const [message, setMessage] = useState('')
  const selected = records.find((record) => record.number === selectedNumber)
  const isPurchaseOrderPage = storageKey === ORDERS_KEY
  const supplierProductRows = useMemo(() => {
    if (!isPurchaseOrderPage || !draft?.supplierCode) return []
    const relationMap = productSuppliersMap()
    return products.filter((product) => productBelongsToSupplier(product, draft.supplierCode, draft.supplier, relationMap))
  }, [draft?.supplierCode, draft?.supplier, isPurchaseOrderPage, products])

  const saveRecords = (nextRecords) => {
    setRecords(nextRecords)
    writeArray(storageKey, nextRecords)
  }

  const createDraft = () => ({
    id: makeId(numberPrefix.toLowerCase()),
    number: nextDocument(records, numberPrefix),
    date: today(),
    supplierCode: '',
    supplier: '',
    fiscalId: '',
    phone: '',
    address: '',
    paymentCondition: 'Contado',
    expectedDate: today(),
    dueDate: today(),
    warehouse: 'ALM-01',
    requester: 'Administrador',
    department: 'Compras',
    priority: 'Media',
    validity: today(),
    deliveryTime: '3 dias',
    relatedRequest: '',
    relatedOrder: '',
    relatedReceipt: '',
    relatedInvoice: '',
    supplierInvoiceNumber: '',
    reason: '',
    status: 'Borrador',
    observations: '',
    lines: lineMode === 'none' ? [] : [createBlankLine(products)],
    paid: 0,
    balance: 0,
    ...extraRecordDefaults,
  })

  const updateDraft = (field, value) => {
    setDraft((current) => {
      const next = { ...current, [field]: value }
      if (field === 'supplierCode') {
        const supplier = getSupplier(value)
        next.supplier = supplier.commercialName || ''
        next.fiscalId = supplier.fiscalId || ''
        next.phone = supplier.phone || ''
        next.address = supplier.address || ''
        next.paymentCondition = supplier.paymentCondition || 'Contado'
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
        }
        return normalizeLine(nextLine, products)
      }),
    }))
  }

  const addLine = () => {
    setDraft((current) => ({ ...current, lines: [...(current.lines || []), createBlankLine(products)] }))
  }

  const addProductToOrder = (product, quantity = 1) => {
    setDraft((current) => {
      const existing = (current.lines || []).find((line) => line.productCode === product.code)
      if (existing) {
        return {
          ...current,
          lines: current.lines.map((line) => (
            line.productCode === product.code
              ? normalizeLine({ ...line, quantity: toNumber(line.quantity) + toNumber(quantity) }, products)
              : line
          )),
        }
      }

      return {
        ...current,
        lines: [
          ...(current.lines || []).filter((line) => line.productCode),
          normalizeLine({
            productCode: product.code,
            productName: product.name,
            unit: product.unit,
            quantity,
            cost: product.cost,
            discount: 0,
            tax: 0,
          }, products),
        ],
      }
    })
  }

  const addLowStockSupplierProducts = () => {
    supplierProductRows.filter(isLowStockProduct).forEach((product) => addProductToOrder(product, getSuggestedQuantity(product)))
  }

  const removeLine = (lineId) => {
    setDraft((current) => ({ ...current, lines: current.lines.filter((line) => line.id !== lineId) }))
  }

  const openNew = () => {
    setMode('edit')
    setDraft(createDraft())
  }

  useEffect(() => {
    if (!isPurchaseOrderPage || !canUseStorage()) return

    const raw = localStorage.getItem(PENDING_PURCHASE_ORDER_KEY)
    if (!raw) return

    localStorage.removeItem(PENDING_PURCHASE_ORDER_KEY)
    try {
      const payload = JSON.parse(raw)
      const supplier = getSupplier(payload.supplierCode)
      const base = createDraft()
      const lines = (payload.lines || []).map((line) => normalizeLine({
        productCode: line.productCode,
        productName: line.productName,
        unit: line.unit,
        quantity: line.quantity || 1,
        cost: line.cost,
        discount: 0,
        tax: 0,
      }, products)).filter((line) => line.productCode)

      setMode('edit')
      setDraft({
        ...base,
        supplierCode: payload.supplierCode || '',
        supplier: supplier.commercialName || payload.supplier || '',
        fiscalId: supplier.fiscalId || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        paymentCondition: supplier.paymentCondition || 'Contado',
        status: 'Borrador',
        observations: 'Orden sugerida desde alertas de stock bajo.',
        lines,
      })
      setMessage('Orden sugerida desde alertas cargada como borrador.')
    } catch {
      setMessage('No se pudo cargar la orden sugerida desde alertas.')
    }
  }, [isPurchaseOrderPage])

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

  const saveDraft = () => {
    const lines = (draft.lines || []).map((line) => normalizeLine(line, products)).filter((line) => line.productCode)
    const totals = calculateTotals(lines)
    const normalized = {
      ...draft,
      lines,
      totals,
      total: totals.total,
      balance: payable ? toNumber(draft.balance || totals.total) : draft.balance,
      status: draft.status === 'Borrador' ? completedStatus : draft.status,
      updatedAt: nowIso(),
    }

    if (!normalized.number) {
      setMessage('El documento necesita un numero.')
      return
    }
    if (lineMode !== 'none' && lines.length === 0) {
      setMessage('Debe agregar al menos un producto.')
      return
    }

    const exists = records.some((record) => record.number === normalized.number)
    const nextRecords = exists
      ? records.map((record) => record.number === normalized.number ? normalized : record)
      : [normalized, ...records]
    saveRecords(nextRecords)
    setSelectedNumber(normalized.number)
    setDraft(null)
    setMessage(`${title}: documento guardado correctamente.`)
    onAction?.(`${title}: documento guardado`)
  }

  const setRecordStatus = (record, status) => {
    const nextRecords = records.map((item) => item.number === record.number ? { ...item, status, updatedAt: nowIso() } : item)
    saveRecords(nextRecords)
    setSelectedNumber(record.number)
    setMessage(`${record.number}: estado actualizado a ${status}.`)
  }

  const filtered = records.filter((record) => {
    const query = cleanText([filters.query, searchValue].filter(Boolean).join(' '))
    const matchesQuery = !query || ['number', 'supplier', 'supplierCode', 'requester', 'department', 'status', 'relatedOrder', 'relatedInvoice', 'relatedReceipt'].some((field) => cleanText(record[field]).includes(query))
    const matchesStatus = filters.status === 'Todos' || record.status === filters.status
    return matchesQuery && matchesStatus
  })

  return (
    <PurchasePageLayout
      title={title}
      description={description}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      controls={controls}
      actions={[
        { id: 'new', label: newLabel, icon: FilePlus2, variant: 'primary', onClick: openNew },
        { id: 'view', label: 'Ver', icon: Eye, disabled: !selected, onClick: () => openView() },
        { id: 'edit', label: 'Editar', icon: Edit3, disabled: !selected || selected.status === 'Anulada', onClick: () => openEdit() },
        allowApprove && { id: 'approve', label: 'Aprobar', icon: CheckCircle2, disabled: !selected, onClick: () => setRecordStatus(selected, 'Aprobada') },
        allowReject && { id: 'reject', label: 'Rechazar', icon: Ban, disabled: !selected, onClick: () => setRecordStatus(selected, 'Rechazada') },
        allowConvert && { id: 'convert', label: convertLabel, icon: Send, disabled: !selected, onClick: () => convertAction?.(selected, saveRecords, records, setMessage, onNavigate) },
        { id: 'print', label: 'Imprimir', icon: Printer, disabled: !selected, onClick: () => window.print() },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson(`${storageKey}.json`, records) },
        { id: 'exit', label: 'Salir', icon: X, onClick: controls?.onClose },
      ].filter(Boolean)}
    >
      <div className="purchase-module-page">
        {message && <div className="purchase-message">{message}</div>}
        <section className="purchase-panel purchase-filter-panel">
          <PanelHeading eyebrow="Consulta" title={`Filtros de ${title.toLowerCase()}`} />
          <div className="purchase-filter-grid">
            <label>Buscar<input value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Numero, proveedor, fecha o estado" /></label>
            <label>Estado<select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option>Todos</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          </div>
        </section>
        <section className="purchase-table-wrap">
          <table className="purchase-table is-wide">
            <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}<th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.number} className={record.number === selectedNumber ? 'is-selected' : ''} onClick={() => setSelectedNumber(record.number)}>
                  {columns.map((column) => <td key={column.key}>{column.render ? column.render(record) : record[column.key]}</td>)}
                  <td>
                    <ActionButtons
                      record={record}
                      onView={(item) => { setSelectedNumber(item.number); openView(item) }}
                      onEdit={(item) => { setSelectedNumber(item.number); openEdit(item) }}
                      onPrint={() => window.print()}
                      onSend={title === 'Ordenes de compra' ? () => onAction?.('Orden preparada para envio al proveedor.') : null}
                      onVoid={(item) => setRecordStatus(item, 'Anulada')}
                      extra={allowConvert ? <button type="button" title={convertLabel} aria-label={convertLabel} onClick={(event) => { event.stopPropagation(); convertAction?.(record, saveRecords, records, setMessage, onNavigate) }}><Send size={15} /></button> : null}
                    />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={columns.length + 1} className="purchase-empty-state">No hay documentos para mostrar.</td></tr>}
            </tbody>
          </table>
        </section>
        {draft && (
          <Modal title={mode === 'view' ? `Ver ${title.toLowerCase()}` : `Editar ${title.toLowerCase()}`} subtitle={draft.number} onClose={() => setDraft(null)} onSave={mode === 'view' ? null : saveDraft} wide>
            <div className="purchase-form-grid">
              {fields.map((field) => <FieldControl key={field.name} field={{ ...field, readOnly: mode === 'view' || field.readOnly }} value={draft[field.name]} onChange={updateDraft} />)}
            </div>
            {isPurchaseOrderPage && mode !== 'view' && (
              <section className="purchase-supplier-products">
                <div className="purchase-panel-heading">
                  <div>
                    <span>Proveedor</span>
                    <h2>Productos asociados al proveedor</h2>
                  </div>
                  <button type="button" className="purchase-small-button" onClick={addLowStockSupplierProducts} disabled={!supplierProductRows.some(isLowStockProduct)}>
                    Agregar stock bajo
                  </button>
                </div>
                {!draft.supplierCode && <div className="purchase-empty-state">Seleccione un proveedor para ver productos asociados.</div>}
                {draft.supplierCode && supplierProductRows.length === 0 && <div className="purchase-empty-state">Este proveedor no tiene productos asociados.</div>}
                {supplierProductRows.length > 0 && (
                  <div className="purchase-table-wrap">
                    <table className="purchase-table is-wide">
                      <thead><tr><th>Codigo</th><th>Producto</th><th>Categoria</th><th>Stock</th><th>Minimo</th><th>Maximo</th><th>Costo</th><th>Unidad</th><th>Estado stock</th><th>Accion</th></tr></thead>
                      <tbody>
                        {supplierProductRows.map((product) => {
                          const lowStock = isLowStockProduct(product)
                          return (
                            <tr key={product.code} className={lowStock ? 'is-low-stock' : ''}>
                              <td>{product.code}</td>
                              <td>
                                <div className="purchase-product-mini">
                                  {product.image ? <img src={product.image} alt={product.name} /> : <span>{String(product.name || 'P').slice(0, 1)}</span>}
                                  <div><strong>{product.name}</strong><small>{product.supplierName || draft.supplier}</small></div>
                                </div>
                              </td>
                              <td>{product.category || 'N/D'}</td>
                              <td>{formatNumber(product.stock)}</td>
                              <td>{formatNumber(product.minStock)}</td>
                              <td>{formatNumber(product.maxStock)}</td>
                              <td>{formatCurrency(product.cost)}</td>
                              <td>{product.unit}</td>
                              <td><StatusBadge value={lowStock ? 'Stock bajo' : 'Normal'} /></td>
                              <td><button type="button" className="purchase-small-button" onClick={() => addProductToOrder(product, lowStock ? getSuggestedQuantity(product) : 1)}>Agregar</button></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
            {lineMode !== 'none' && (
              <>
                <h3 className="purchase-modal-section-title">Detalle de productos</h3>
                {mode !== 'view' && <button type="button" className="purchase-small-button" onClick={addLine}>Agregar producto</button>}
                <div className="purchase-table-wrap" style={{ marginTop: 10 }}>
                  <LinesTable lines={draft.lines || []} products={products} mode={lineMode} updateLine={updateLine} removeLine={removeLine} readOnly={mode === 'view'} />
                </div>
              </>
            )}
            <TotalsBox lines={draft.lines || []} />
          </Modal>
        )}
      </div>
    </PurchasePageLayout>
  )
}

function LinesTable({ lines, products, mode, updateLine, removeLine, readOnly }) {
  return (
    <table className="purchase-table is-wide">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Unidad</th>
          <th>Cantidad</th>
          {mode === 'request' && <th>Motivo</th>}
          {mode === 'request' && <th>Fecha requerida</th>}
          {mode !== 'request' && <th>Costo</th>}
          {mode !== 'request' && <th>Descuento</th>}
          {mode !== 'request' && <th>Impuesto</th>}
          {mode !== 'request' && <th>Total</th>}
          {!readOnly && <th>Accion</th>}
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <tr key={line.id}>
            <td>
              <select className="purchase-line-input" value={line.productCode} onChange={(event) => updateLine(line.id, 'productCode', event.target.value)} disabled={readOnly}>
                {productOptions(products).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </td>
            <td>{line.unit}</td>
            <td><input className="purchase-line-input" type="number" value={line.quantity} onChange={(event) => updateLine(line.id, 'quantity', event.target.value)} disabled={readOnly} /></td>
            {mode === 'request' && <td><input className="purchase-line-input" value={line.reason} onChange={(event) => updateLine(line.id, 'reason', event.target.value)} disabled={readOnly} /></td>}
            {mode === 'request' && <td><input className="purchase-line-input" type="date" value={line.requiredDate} onChange={(event) => updateLine(line.id, 'requiredDate', event.target.value)} disabled={readOnly} /></td>}
            {mode !== 'request' && <td><input className="purchase-line-input" type="number" value={line.cost} onChange={(event) => updateLine(line.id, 'cost', event.target.value)} disabled={readOnly} /></td>}
            {mode !== 'request' && <td><input className="purchase-line-input" type="number" value={line.discount} onChange={(event) => updateLine(line.id, 'discount', event.target.value)} disabled={readOnly} /></td>}
            {mode !== 'request' && <td><input className="purchase-line-input" type="number" value={line.tax} onChange={(event) => updateLine(line.id, 'tax', event.target.value)} disabled={readOnly} /></td>}
            {mode !== 'request' && <td>{formatCurrency(line.total)}</td>}
            {!readOnly && <td><button type="button" className="purchase-small-button" onClick={() => removeLine(line.id)}>Eliminar</button></td>}
          </tr>
        ))}
        {lines.length === 0 && <tr><td colSpan="9" className="purchase-empty-state">No hay productos en el detalle.</td></tr>}
      </tbody>
    </table>
  )
}

function TotalsBox({ lines }) {
  const totals = calculateTotals(lines)
  return (
    <div className="purchase-summary-grid" style={{ marginTop: 12 }}>
      <article><span>Subtotal</span><strong>{formatCurrency(totals.subtotal)}</strong></article>
      <article><span>Descuento</span><strong>{formatCurrency(totals.discount)}</strong></article>
      <article><span>Impuesto</span><strong>{formatCurrency(totals.tax)}</strong></article>
      <article><span>Total</span><strong>{formatCurrency(totals.total)}</strong></article>
    </div>
  )
}

const supplierFields = [
  { name: 'number', label: 'Numero', readOnly: true },
  { name: 'date', label: 'Fecha', type: 'date' },
  { name: 'supplierCode', label: 'Proveedor', type: 'select', options: supplierOptions },
  { name: 'fiscalId', label: 'RNC', readOnly: true },
  { name: 'phone', label: 'Telefono', readOnly: true },
  { name: 'address', label: 'Direccion', readOnly: true },
  { name: 'paymentCondition', label: 'Condicion de pago' },
]

function documentColumns(extra = []) {
  return [
    { key: 'number', label: 'Numero' },
    { key: 'date', label: 'Fecha', render: (record) => formatDate(record.date) },
    ...extra,
    { key: 'total', label: 'Total', render: (record) => formatCurrency(record.total || calculateTotals(record.lines).total) },
    { key: 'status', label: 'Estado', render: (record) => <StatusBadge value={record.status} /> },
  ]
}

export function PurchaseRequestsPage(props) {
  return (
    <DocumentPage
      {...props}
      title="Solicitudes de compra"
      description="Solicitudes internas con aprobacion, prioridad y productos requeridos."
      storageKey={REQUESTS_KEY}
      numberPrefix="SOL"
      newLabel="Nueva solicitud"
      completedStatus="Pendiente"
      statuses={['Borrador', 'Pendiente', 'Aprobada', 'Rechazada', 'Anulada']}
      allowApprove
      allowReject
      lineMode="request"
      fields={[
        { name: 'number', label: 'Numero solicitud', readOnly: true },
        { name: 'date', label: 'Fecha', type: 'date' },
        { name: 'requester', label: 'Solicitante' },
        { name: 'department', label: 'Departamento' },
        { name: 'priority', label: 'Prioridad', type: 'select', options: ['Baja', 'Media', 'Alta', 'Urgente'] },
        { name: 'status', label: 'Estado', type: 'select', options: ['Borrador', 'Pendiente', 'Aprobada', 'Rechazada', 'Anulada'] },
        { name: 'observations', label: 'Observaciones', type: 'textarea', span: 'full' },
      ]}
      columns={documentColumns([
        { key: 'requester', label: 'Solicitante' },
        { key: 'department', label: 'Departamento' },
        { key: 'priority', label: 'Prioridad' },
      ]).filter((column) => column.key !== 'total')}
    />
  )
}

export function SupplierQuotesPage(props) {
  const convertQuote = (quote, saveRecords, records, setMessage) => {
    const orders = readArray(ORDERS_KEY)
    const order = {
      ...quote,
      id: makeId('po'),
      number: nextDocument(orders, 'OC'),
      relatedQuote: quote.number,
      status: 'Pendiente',
      receptionStatus: 'Pendiente',
      updatedAt: nowIso(),
    }
    writeArray(ORDERS_KEY, [order, ...orders])
    saveRecords(records.map((item) => item.number === quote.number ? { ...item, status: 'Convertida a orden', relatedOrder: order.number } : item))
    setMessage(`Cotizacion convertida a orden ${order.number}.`)
  }

  return (
    <DocumentPage
      {...props}
      title="Cotizaciones proveedor"
      description="Cotizaciones recibidas de proveedores, comparacion y conversion a orden."
      storageKey={QUOTES_KEY}
      numberPrefix="COT-P"
      newLabel="Nueva cotizacion"
      completedStatus="Recibida"
      statuses={['Borrador', 'Recibida', 'Aprobada', 'Rechazada', 'Convertida a orden', 'Anulada']}
      allowApprove
      allowReject
      allowConvert
      convertLabel="Convertir a orden"
      convertAction={convertQuote}
      fields={[
        ...supplierFields,
        { name: 'relatedRequest', label: 'Solicitud relacionada' },
        { name: 'validity', label: 'Validez', type: 'date' },
        { name: 'deliveryTime', label: 'Tiempo de entrega' },
        { name: 'status', label: 'Estado', type: 'select', options: ['Borrador', 'Recibida', 'Aprobada', 'Rechazada', 'Convertida a orden', 'Anulada'] },
        { name: 'observations', label: 'Observaciones', type: 'textarea', span: 'full' },
      ]}
      columns={documentColumns([{ key: 'supplier', label: 'Proveedor' }, { key: 'relatedRequest', label: 'Solicitud' }, { key: 'validity', label: 'Validez', render: (record) => formatDate(record.validity) }])}
    />
  )
}

export function PurchaseOrdersPage(props) {
  const convertToReceipt = (order, saveRecords, records, setMessage, onNavigate) => {
    if (canUseStorage()) {
      localStorage.setItem(PENDING_RECEIPT_ORDER_KEY, order.number)
    }

    saveRecords(records.map((item) => (
      item.number === order.number
        ? { ...item, receptionStatus: 'Preparada', updatedAt: nowIso() }
        : item
    )))
    setMessage(`Orden ${order.number} preparada para recepcion.`)
    onNavigate?.('warehouse-receiving')
  }

  return (
    <DocumentPage
      {...props}
      title="Ordenes de compra"
      description="Ordenes con aprobacion, envio, totales y conversion a recepcion."
      storageKey={ORDERS_KEY}
      numberPrefix="OC"
      newLabel="Nueva orden"
      completedStatus="Pendiente"
      statuses={['Borrador', 'Pendiente', 'Aprobada', 'Parcialmente recibida', 'Recibida', 'Cerrada', 'Anulada']}
      allowApprove
      allowConvert
      convertLabel="Convertir a recepcion"
      convertAction={convertToReceipt}
      fields={[
        ...supplierFields,
        { name: 'expectedDate', label: 'Fecha esperada', type: 'date' },
        { name: 'warehouse', label: 'Almacen destino', type: 'select', options: warehouseOptions },
        { name: 'status', label: 'Estado', type: 'select', options: ['Borrador', 'Pendiente', 'Aprobada', 'Parcialmente recibida', 'Recibida', 'Cerrada', 'Anulada'] },
        { name: 'observations', label: 'Observaciones', type: 'textarea', span: 'full' },
      ]}
      columns={documentColumns([{ key: 'supplier', label: 'Proveedor' }, { key: 'receptionStatus', label: 'Recepcion', render: (record) => record.receptionStatus || 'Pendiente' }, { key: 'user', label: 'Usuario', render: () => 'Administrador' }])}
    />
  )
}

export function SupplierInvoicesPage(props) {
  return (
    <DocumentPage
      {...props}
      title="Facturas de proveedor"
      description="Registra facturas recibidas y alimenta cuentas por pagar sin mover inventario."
      storageKey={INVOICES_KEY}
      numberPrefix="FCP"
      newLabel="Nueva factura"
      completedStatus="Pendiente de pago"
      statuses={['Borrador', 'Registrada', 'Pendiente de pago', 'Pagada', 'Anulada']}
      payable
      extraRecordDefaults={{ balance: 0 }}
      fields={[
        ...supplierFields,
        { name: 'supplierInvoiceNumber', label: 'Factura proveedor' },
        { name: 'relatedOrder', label: 'Orden compra relacionada' },
        { name: 'relatedReceipt', label: 'Recepcion relacionada' },
        { name: 'dueDate', label: 'Fecha vencimiento', type: 'date' },
        { name: 'status', label: 'Estado', type: 'select', options: ['Borrador', 'Registrada', 'Pendiente de pago', 'Pagada', 'Anulada'] },
        { name: 'observations', label: 'Observaciones', type: 'textarea', span: 'full' },
      ]}
      columns={documentColumns([{ key: 'supplier', label: 'Proveedor' }, { key: 'supplierInvoiceNumber', label: 'Factura proveedor' }, { key: 'dueDate', label: 'Vencimiento', render: (record) => formatDate(record.dueDate) }])}
    />
  )
}

export function SupplierCreditNotesPage(props) {
  return (
    <DocumentPage
      {...props}
      title="Notas de credito proveedor"
      description="Aplica notas de credito contra facturas de proveedor y cuentas por pagar."
      storageKey={CREDIT_NOTES_KEY}
      numberPrefix="NCP"
      newLabel="Nueva nota"
      completedStatus="Aplicada"
      statuses={['Borrador', 'Aplicada', 'Anulada']}
      fields={[
        ...supplierFields,
        { name: 'relatedInvoice', label: 'Factura relacionada' },
        { name: 'reason', label: 'Motivo' },
        { name: 'status', label: 'Estado', type: 'select', options: ['Borrador', 'Aplicada', 'Anulada'] },
        { name: 'observations', label: 'Observaciones', type: 'textarea', span: 'full' },
      ]}
      columns={documentColumns([{ key: 'supplier', label: 'Proveedor' }, { key: 'relatedInvoice', label: 'Factura' }, { key: 'reason', label: 'Motivo' }])}
    />
  )
}

export function AccountsPayablePage({ controls, onAction, searchValue = '', onSearchChange }) {
  const [invoices, setInvoices] = useState(() => readArray(INVOICES_KEY))
  const [payments, setPayments] = useState(() => readArray(PAYMENTS_KEY))
  const [selectedNumber, setSelectedNumber] = useState('')
  const [draft, setDraft] = useState(null)
  const [filters, setFilters] = useState({ query: '', status: 'Todos' })
  const selected = invoices.find((invoice) => invoice.number === selectedNumber)

  const payableRows = invoices.map((invoice) => {
    const total = toNumber(invoice.total || calculateTotals(invoice.lines).total)
    const paid = payments.filter((payment) => payment.invoiceNumber === invoice.number).reduce((sum, payment) => sum + toNumber(payment.amount), 0)
    const balance = Math.max(0, total - paid)
    const status = balance <= 0 ? 'Pagada' : paid > 0 ? 'Parcial' : new Date(invoice.dueDate || invoice.date).getTime() < Date.now() ? 'Vencida' : 'Pendiente'
    return { ...invoice, total, paid, balance, payableStatus: status }
  })

  const filtered = payableRows.filter((row) => {
    const query = cleanText([filters.query, searchValue].filter(Boolean).join(' '))
    const matchesQuery = !query || ['number', 'supplier', 'supplierCode', 'supplierInvoiceNumber', 'status'].some((field) => cleanText(row[field]).includes(query))
    const matchesStatus = filters.status === 'Todos' || row.payableStatus === filters.status
    return matchesQuery && matchesStatus
  })

  const openPayment = () => {
    if (!selected) return
    setDraft({
      id: makeId('pay'),
      date: today(),
      supplier: selected.supplier,
      invoiceNumber: selected.number,
      amount: payableRows.find((row) => row.number === selected.number)?.balance || 0,
      method: 'Transferencia',
      bank: '',
      reference: '',
      observations: '',
    })
  }

  const savePayment = () => {
    const normalized = { ...draft, amount: toNumber(draft.amount), createdAt: nowIso() }
    const nextPayments = [normalized, ...payments]
    setPayments(nextPayments)
    writeArray(PAYMENTS_KEY, nextPayments)
    const nextInvoices = invoices.map((invoice) => {
      if (invoice.number !== normalized.invoiceNumber) return invoice
      const total = toNumber(invoice.total || calculateTotals(invoice.lines).total)
      const paid = nextPayments.filter((payment) => payment.invoiceNumber === invoice.number).reduce((sum, payment) => sum + toNumber(payment.amount), 0)
      return { ...invoice, paid, balance: Math.max(0, total - paid), status: paid >= total ? 'Pagada' : 'Pendiente de pago' }
    })
    setInvoices(nextInvoices)
    writeArray(INVOICES_KEY, nextInvoices)
    setDraft(null)
    onAction?.('Pago de proveedor registrado')
  }

  return (
    <PurchasePageLayout
      title="Cuentas por pagar"
      description="Consulta facturas pendientes y registra pagos a proveedores."
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      controls={controls}
      actions={[
        { id: 'pay', label: 'Registrar pago', icon: CheckCircle2, variant: 'primary', disabled: !selected, onClick: openPayment },
        { id: 'view', label: 'Ver factura', icon: Eye, disabled: !selected, onClick: () => {} },
        { id: 'print', label: 'Imprimir comprobante', icon: Printer, disabled: !selected, onClick: () => window.print() },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('invefat_accounts_payable.json', payableRows) },
        { id: 'exit', label: 'Salir', icon: X, onClick: controls?.onClose },
      ]}
    >
      <div className="purchase-module-page">
        <section className="purchase-panel purchase-filter-panel">
          <PanelHeading eyebrow="Cuentas" title="Filtros de cuentas por pagar" />
          <div className="purchase-filter-grid">
            <label>Buscar<input value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Proveedor o factura" /></label>
            <label>Estado<select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option>Todos</option><option>Pendiente</option><option>Parcial</option><option>Pagada</option><option>Vencida</option></select></label>
          </div>
        </section>
        <section className="purchase-table-wrap">
          <table className="purchase-table is-wide">
            <thead><tr><th>Proveedor</th><th>Factura</th><th>Fecha</th><th>Vencimiento</th><th>Total</th><th>Pagado</th><th>Balance</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.number} className={selectedNumber === row.number ? 'is-selected' : ''} onClick={() => setSelectedNumber(row.number)}>
                  <td>{row.supplier || row.supplierCode}</td>
                  <td>{row.supplierInvoiceNumber || row.number}</td>
                  <td>{formatDate(row.date)}</td>
                  <td>{formatDate(row.dueDate)}</td>
                  <td>{formatCurrency(row.total)}</td>
                  <td>{formatCurrency(row.paid)}</td>
                  <td>{formatCurrency(row.balance)}</td>
                  <td><StatusBadge value={row.payableStatus} /></td>
                  <td><ActionButtons record={row} onView={() => setSelectedNumber(row.number)} onPrint={() => window.print()} extra={<button type="button" title="Registrar pago" onClick={(event) => { event.stopPropagation(); setSelectedNumber(row.number); setDraft({ id: makeId('pay'), date: today(), supplier: row.supplier, invoiceNumber: row.number, amount: row.balance, method: 'Transferencia', bank: '', reference: '', observations: '' }) }}><CheckCircle2 size={15} /></button>} /></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="9" className="purchase-empty-state">No hay cuentas por pagar registradas.</td></tr>}
            </tbody>
          </table>
        </section>
        {draft && (
          <Modal title="Registrar pago" subtitle={draft.invoiceNumber} onClose={() => setDraft(null)} onSave={savePayment}>
            <div className="purchase-form-grid">
              {[
                { name: 'date', label: 'Fecha', type: 'date' },
                { name: 'supplier', label: 'Proveedor', readOnly: true },
                { name: 'invoiceNumber', label: 'Factura', readOnly: true },
                { name: 'amount', label: 'Monto a pagar', type: 'number' },
                { name: 'method', label: 'Forma de pago', type: 'select', options: ['Efectivo', 'Transferencia', 'Cheque', 'Tarjeta', 'Otro'] },
                { name: 'bank', label: 'Banco / caja' },
                { name: 'reference', label: 'Referencia' },
                { name: 'observations', label: 'Observaciones', type: 'textarea', span: 'full' },
              ].map((field) => <FieldControl key={field.name} field={field} value={draft[field.name]} onChange={(name, value) => setDraft((current) => ({ ...current, [name]: value }))} />)}
            </div>
          </Modal>
        )}
      </div>
    </PurchasePageLayout>
  )
}

export function PurchaseHistoryPage({ controls, searchValue = '', onSearchChange }) {
  const [filters, setFilters] = useState({ query: '', status: 'Todos', from: '', to: '' })
  const rows = [
    ...readArray(ORDERS_KEY).map((item) => ({ ...item, type: 'Orden de compra' })),
    ...readArray(INVOICES_KEY).map((item) => ({ ...item, type: 'Factura proveedor' })),
    ...readArray(RECEIPTS_KEY).map((item) => ({ ...item, type: 'Recepcion mercancia' })),
    ...readArray(PAYMENTS_KEY).map((item) => ({ ...item, type: 'Pago proveedor', number: item.reference || item.id, total: item.amount, status: 'Registrado' })),
  ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())

  const filtered = rows.filter((row) => {
    const query = cleanText([filters.query, searchValue].filter(Boolean).join(' '))
    const matchesQuery = !query || ['type', 'number', 'supplier', 'supplierCode', 'status'].some((field) => cleanText(row[field]).includes(query))
    const matchesStatus = filters.status === 'Todos' || row.status === filters.status
    const time = new Date(row.date || 0).getTime()
    const from = filters.from ? new Date(filters.from).getTime() : null
    const to = filters.to ? new Date(filters.to).getTime() : null
    return matchesQuery && matchesStatus && (!from || time >= from) && (!to || time <= to)
  })

  return (
    <PurchasePageLayout
      title="Historial de compras"
      description="Historico consolidado de ordenes, facturas, recepciones y pagos."
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      controls={controls}
      actions={[
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('invefat_purchase_history.json', filtered) },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
        { id: 'exit', label: 'Salir', icon: X, onClick: controls?.onClose },
      ]}
    >
      <div className="purchase-module-page">
        <section className="purchase-panel purchase-filter-panel">
          <PanelHeading eyebrow="Historial" title="Filtros de compras" />
          <div className="purchase-filter-grid">
            <label>Buscar<input value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Proveedor, documento o producto" /></label>
            <label>Estado<select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option>Todos</option><option>Pendiente</option><option>Aprobada</option><option>Registrada</option><option>Pagada</option><option>Anulada</option></select></label>
            <label>Fecha desde<input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></label>
            <label>Fecha hasta<input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></label>
          </div>
        </section>
        <section className="purchase-table-wrap">
          <table className="purchase-table is-wide">
            <thead><tr><th>Fecha</th><th>Tipo documento</th><th>Numero</th><th>Proveedor</th><th>Total</th><th>Estado</th><th>Usuario</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={`${row.type}-${row.number}`}>
                  <td>{formatDate(row.date)}</td>
                  <td>{row.type}</td>
                  <td>{row.number}</td>
                  <td>{row.supplier || row.supplierCode || 'N/D'}</td>
                  <td>{formatCurrency(row.total || calculateTotals(row.lines).total)}</td>
                  <td><StatusBadge value={row.status} /></td>
                  <td>{row.user || row.responsible || 'Administrador'}</td>
                  <td><ActionButtons record={row} onView={() => {}} onPrint={() => window.print()} /></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="8" className="purchase-empty-state">No hay historial de compras registrado.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </PurchasePageLayout>
  )
}
