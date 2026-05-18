import { useEffect, useMemo, useState } from 'react'
import {
  Ban,
  Barcode,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  Download,
  Edit3,
  Eye,
  FilePlus2,
  History,
  Layers,
  ListChecks,
  Maximize2,
  Minimize2,
  PackageCheck,
  PackageSearch,
  Printer,
  QrCode,
  RotateCcw,
  Ruler,
  Save,
  Search,
  Tags,
  X,
} from 'lucide-react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import './InventoryModulePages.css'

const PRODUCTS_KEY = 'inveFatInventoryProducts'
const MOVEMENTS_KEY = 'invefat_inventory_movements'
const INVOICE_KEY = 'invefat_sales_invoices'
const ADJUSTMENTS_KEY = 'invefat_inventory_adjustments'
const COUNTS_KEY = 'invefat_inventory_counts'
const CATEGORIES_KEY = 'invefat_inventory_categories'
const BRANDS_KEY = 'invefat_inventory_brands'
const UNITS_KEY = 'invefat_inventory_units'
const PRICE_LISTS_KEY = 'invefat_price_lists'
const LOTS_KEY = 'invefat_inventory_lots'
const BARCODES_KEY = 'invefat_inventory_barcodes'
const COSTS_KEY = 'invefat_inventory_costs'

const EXTRA_MOVEMENT_KEYS = [
  'inveFatInventoryMovements',
  'inventory_movements',
  'invefat_warehouse_transfers',
  'invefat_inventory_transfers',
  'invefat_stock_transfers',
  'invefat_warehouse_receivings',
  'invefat_receivings',
  'invefat_purchase_receivings',
]

const DEFAULT_WAREHOUSES = [
  { code: 'ALM-01', name: 'Almacen Principal' },
  { code: 'ALM-02', name: 'Almacen Sucursal' },
]

const DEFAULT_CATEGORIES = [
  { code: 'CAT-001', name: 'General', description: 'Categoria base para productos nuevos.', parentCode: '', status: 'Activa' },
  { code: 'CAT-002', name: 'Repuestos', description: 'Repuestos y piezas.', parentCode: '', status: 'Activa' },
]

const DEFAULT_BRANDS = [
  { code: 'MAR-001', name: 'General', description: 'Marca generica.', status: 'Activo' },
  { code: 'MAR-002', name: 'Linea Pro', description: 'Linea comercial principal.', status: 'Activo' },
]

const DEFAULT_UNITS = [
  { code: 'UND', name: 'Unidad', abbreviation: 'UND', type: 'Unidad', factor: 1, status: 'Activo' },
  { code: 'CAJA', name: 'Caja', abbreviation: 'CJ', type: 'Caja', factor: 1, status: 'Activo' },
  { code: 'PAQ', name: 'Paquete', abbreviation: 'PAQ', type: 'Paquete', factor: 1, status: 'Activo' },
  { code: 'KG', name: 'Kilogramo', abbreviation: 'KG', type: 'Peso', factor: 1, status: 'Activo' },
  { code: 'LB', name: 'Libra', abbreviation: 'LB', type: 'Peso', factor: 0.453592, status: 'Activo' },
  { code: 'GAL', name: 'Galon', abbreviation: 'GAL', type: 'Volumen', factor: 1, status: 'Activo' },
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

function readProducts() {
  return readArray(PRODUCTS_KEY).map((product) => ({
    code: String(product.code || '').trim(),
    name: String(product.name || '').trim(),
    description: String(product.description || '').trim(),
    category: String(product.category || '').trim(),
    brand: String(product.brand || '').trim(),
    unit: String(product.unit || 'Unidad').trim(),
    barcode: String(product.barcode || '').trim(),
    cost: toNumber(product.cost),
    price: toNumber(product.price),
    tax: String(product.tax || '').trim(),
    minStock: toNumber(product.minStock),
    maxStock: toNumber(product.maxStock),
    stock: toNumber(product.stock),
    status: product.status || 'Activo',
    updatedAt: product.updatedAt || product.createdAt || '',
  }))
}

function saveProducts(products) {
  writeArray(PRODUCTS_KEY, products)
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

function nextCode(records, prefix, field = 'code') {
  const highest = records.reduce((max, record) => {
    const match = String(record[field] || '').match(/(\d+)$/)
    return Math.max(max, match ? Number(match[1]) : 0)
  }, 0)

  return `${prefix}-${String(highest + 1).padStart(3, '0')}`
}

function nextDocument(records, prefix, field = 'number') {
  const highest = records.reduce((max, record) => {
    const match = String(record[field] || '').match(/(\d+)$/)
    return Math.max(max, match ? Number(match[1]) : 0)
  }, 0)

  return `${prefix}-${String(highest + 1).padStart(6, '0')}`
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

function formatDate(value) {
  if (!value) return 'N/D'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  return date.toISOString().slice(0, 10)
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
  if (clean.includes('inactiv') || clean.includes('anulad') || clean.includes('sin stock')) return 'is-danger'
  if (clean.includes('bajo') || clean.includes('borrador') || clean.includes('proceso') || clean.includes('sobre')) return 'is-warning'
  if (clean.includes('aplic') || clean.includes('activo') || clean.includes('normal')) return 'is-success'
  return 'is-info'
}

function StatusBadge({ value }) {
  return <span className={`inventory-badge ${getStatusClass(value)}`}>{value || 'N/D'}</span>
}

function Modal({
  title,
  subtitle = 'Inventario',
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
      <button type="button" className="inventory-minimized-modal" onClick={() => setWindowState('normal')}>
        <span>Ventana minimizada</span>
        <strong>{title}</strong>
      </button>
    )
  }

  return (
    <div className="inventory-modal-backdrop" role="presentation">
      <section className={`inventory-modal ${wide ? 'is-wide' : ''} ${windowState === 'maximized' ? 'is-maximized' : ''}`} role="dialog" aria-modal="true">
        <header className="inventory-modal-header">
          <div>
            <span>{subtitle}</span>
            <h2>{title}</h2>
          </div>
          <div className="inventory-modal-controls">
            <button type="button" title="Minimizar" onClick={() => setWindowState('minimized')}>
              <Minimize2 size={14} />
            </button>
            <button type="button" title={windowState === 'maximized' ? 'Restaurar' : 'Maximizar'} onClick={() => setWindowState(windowState === 'maximized' ? 'normal' : 'maximized')}>
              {windowState === 'maximized' ? <RotateCcw size={14} /> : <Maximize2 size={14} />}
            </button>
            <button type="button" className="is-exit" title="Cerrar" onClick={onClose}>
              <X size={15} />
            </button>
          </div>
        </header>
        <div className="inventory-modal-body">{children}</div>
        <footer className="inventory-modal-footer">
          <button type="button" onClick={onClose}>Cancelar</button>
          {onSave && (
            <button type="button" className="inventory-primary-action" onClick={onSave} disabled={!canSave}>
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
  }

  if (field.type === 'textarea') {
    return (
      <label className={field.span ? `inventory-span-${field.span}` : ''}>
        {field.label}
        <textarea {...commonProps} rows={field.rows || 3} />
      </label>
    )
  }

  if (field.type === 'select') {
    return (
      <label className={field.span ? `inventory-span-${field.span}` : ''}>
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
    <label className={field.span ? `inventory-span-${field.span}` : ''}>
      {field.label}
      <input type={field.type || 'text'} {...commonProps} />
    </label>
  )
}

function getWarehouses() {
  const settings = safeParse('invefat_company_settings', {})
  const configured = Array.isArray(settings?.warehouses) ? settings.warehouses : []
  const warehouses = configured.length > 0 ? configured : DEFAULT_WAREHOUSES
  return warehouses.map((warehouse) => ({
    code: warehouse.code || warehouse.id || warehouse.name,
    name: warehouse.name || warehouse.label || warehouse.code,
  }))
}

function PanelHeading({ eyebrow, title, right }) {
  return (
    <div className="inventory-panel-heading">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {right}
    </div>
  )
}

function selectedRecord(records, selectedCode, field = 'code') {
  return records.find((record) => String(record[field]) === String(selectedCode)) || null
}

function CatalogPage({
  title,
  description,
  storageKey,
  defaultRecords = [],
  createRecord,
  normalizeRecord,
  fields,
  columns,
  searchFields,
  activeStatus = 'Activo',
  inactiveStatus = 'Inactivo',
  codeField = 'code',
  nameField = 'name',
  codePrefix = 'REG',
  searchValue = '',
  onSearchChange,
  controls,
  onAction,
}) {
  const [records, setRecords] = useState(() => {
    const saved = readArray(storageKey)
    if (saved.length > 0) return saved.map(normalizeRecord)
    if (defaultRecords.length > 0) writeArray(storageKey, defaultRecords.map(normalizeRecord))
    return defaultRecords.map(normalizeRecord)
  })
  const [filters, setFilters] = useState({ query: '', status: 'Todos' })
  const [selectedCode, setSelectedCode] = useState('')
  const [modalMode, setModalMode] = useState('')
  const [draft, setDraft] = useState(null)
  const [message, setMessage] = useState('')

  const selected = selectedRecord(records, selectedCode, codeField)
  const filteredRecords = useMemo(() => {
    const text = cleanText([searchValue, filters.query].filter(Boolean).join(' '))
    return records.filter((record) => {
      const matchesText = !text || searchFields.some((field) => cleanText(record[field]).includes(text))
      const matchesStatus = filters.status === 'Todos' || record.status === filters.status
      return matchesText && matchesStatus
    })
  }, [filters, records, searchFields, searchValue])

  const saveRecords = (nextRecords) => {
    setRecords(nextRecords)
    writeArray(storageKey, nextRecords)
  }

  const openNew = () => {
    setDraft(createRecord(records))
    setModalMode('new')
  }

  const openEdit = (record = selected) => {
    if (!record) return
    setSelectedCode(record[codeField])
    setDraft({ ...record })
    setModalMode('edit')
  }

  const closeModal = () => {
    setDraft(null)
    setModalMode('')
  }

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const handleSave = () => {
    const normalized = normalizeRecord(draft)
    if (!normalized[codeField]) {
      setMessage('Debe indicar un codigo.')
      return
    }
    if (!normalized[nameField]) {
      setMessage('Debe indicar un nombre.')
      return
    }

    const duplicate = records.some((record) => (
      String(record[codeField]).toLowerCase() === String(normalized[codeField]).toLowerCase()
      && (modalMode === 'new' || String(record[codeField]) !== String(selectedCode))
    ))

    if (duplicate) {
      setMessage('Ya existe un registro con ese codigo.')
      return
    }

    const nextRecords = modalMode === 'new'
      ? [normalized, ...records]
      : records.map((record) => (String(record[codeField]) === String(selectedCode) ? normalized : record))

    saveRecords(nextRecords)
    setSelectedCode(normalized[codeField])
    setMessage(`${title}: registro guardado correctamente.`)
    onAction?.(`${title}: registro guardado`)
    closeModal()
  }

  const inactivate = (target = selected) => {
    if (!target) return
    const nextStatus = target.status === inactiveStatus ? activeStatus : inactiveStatus
    const nextRecords = records.map((record) => (
      String(record[codeField]) === String(target[codeField])
        ? { ...record, status: nextStatus, updatedAt: nowIso() }
        : record
    ))
    saveRecords(nextRecords)
    setSelectedCode(target[codeField])
    setMessage(`${title}: estado actualizado.`)
  }

  return (
    <ModulePageLayout
      title={title}
      moduleLabel="Inventario"
      description={description}
      breadcrumb={['Inventario', title]}
      searchValue={searchValue}
      searchPlaceholder={`Buscar en ${title}`}
      onSearchChange={onSearchChange}
      actions={[
        { id: 'new', label: 'Nuevo', icon: FilePlus2, variant: 'primary', onClick: openNew },
        { id: 'edit', label: 'Editar', icon: Edit3, disabled: !selected, onClick: () => openEdit() },
        { id: 'inactive', label: selected?.status === inactiveStatus ? 'Activar' : 'Inactivar', icon: Ban, disabled: !selected, onClick: inactivate },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson(`${storageKey}.json`, records) },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
        { id: 'exit', label: 'Salir', icon: X, onClick: controls?.onClose },
      ]}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      <div className="inventory-module-page">
        {message && <div className="inventory-message">{message}</div>}
        <section className="inventory-panel inventory-filter-panel">
          <PanelHeading eyebrow="Busqueda" title={`Filtros de ${title.toLowerCase()}`} />
          <div className="inventory-filter-grid">
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

        <section className="inventory-table-wrap">
          <table className="inventory-table">
            <thead>
              <tr>
                {columns.map((column) => <th key={column.key}>{column.label}</th>)}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record[codeField]} className={String(selectedCode) === String(record[codeField]) ? 'is-selected' : ''} onClick={() => setSelectedCode(record[codeField])}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      {column.render ? column.render(record) : record[column.key]}
                    </td>
                  ))}
                  <td>
                    <div className="inventory-table-actions">
                      <button type="button" title="Editar" onClick={(event) => { event.stopPropagation(); openEdit(record) }}>
                        <Edit3 size={15} />
                      </button>
                      <button type="button" title="Cambiar estado" onClick={(event) => { event.stopPropagation(); inactivate(record) }}>
                        <Ban size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="inventory-empty-state">No hay registros para mostrar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {draft && (
          <Modal title={modalMode === 'new' ? `Nuevo ${title.toLowerCase()}` : `Editar ${title.toLowerCase()}`} onClose={closeModal} onSave={handleSave}>
            <div className="inventory-form-grid">
              {fields.map((field) => (
                <FieldControl key={field.name} field={field} value={draft[field.name]} onChange={updateDraft} />
              ))}
            </div>
          </Modal>
        )}
      </div>
    </ModulePageLayout>
  )
}

function normalizeCategory(record) {
  return {
    code: String(record.code || '').trim().toUpperCase(),
    name: String(record.name || record.category || '').trim(),
    description: String(record.description || '').trim(),
    parentCode: String(record.parentCode || '').trim(),
    status: record.status === 'Inactiva' ? 'Inactiva' : 'Activa',
    updatedAt: record.updatedAt || nowIso(),
  }
}

function normalizeBrand(record) {
  return {
    code: String(record.code || '').trim().toUpperCase(),
    name: String(record.name || record.brand || '').trim(),
    description: String(record.description || '').trim(),
    status: record.status === 'Inactivo' ? 'Inactivo' : 'Activo',
    updatedAt: record.updatedAt || nowIso(),
  }
}

function normalizeUnit(record) {
  return {
    code: String(record.code || '').trim().toUpperCase(),
    name: String(record.name || '').trim(),
    abbreviation: String(record.abbreviation || record.code || '').trim().toUpperCase(),
    type: record.type || 'Unidad',
    factor: toNumber(record.factor || 1),
    status: record.status === 'Inactivo' ? 'Inactivo' : 'Activo',
    updatedAt: record.updatedAt || nowIso(),
  }
}

export function InventoryCategoriesPage(props) {
  const categoryOptions = () => [
    { value: '', label: 'Sin categoria padre' },
    ...readArray(CATEGORIES_KEY, DEFAULT_CATEGORIES).map((category) => ({ value: category.code, label: `${category.code} - ${category.name}` })),
  ]

  return (
    <CatalogPage
      {...props}
      title="Categorias"
      description="Organiza los productos por familias, lineas y grupos comerciales."
      storageKey={CATEGORIES_KEY}
      defaultRecords={DEFAULT_CATEGORIES}
      createRecord={(records) => ({ code: nextCode(records, 'CAT'), name: '', description: '', parentCode: '', status: 'Activa' })}
      normalizeRecord={normalizeCategory}
      activeStatus="Activa"
      inactiveStatus="Inactiva"
      fields={[
        { name: 'code', label: 'Codigo de categoria' },
        { name: 'name', label: 'Nombre de categoria' },
        { name: 'parentCode', label: 'Categoria padre', type: 'select', options: categoryOptions },
        { name: 'status', label: 'Estado', type: 'select', options: ['Activa', 'Inactiva'] },
        { name: 'description', label: 'Descripcion', type: 'textarea', span: 'full' },
      ]}
      columns={[
        { key: 'code', label: 'Codigo' },
        { key: 'name', label: 'Categoria', render: (record) => <strong>{record.name}</strong> },
        { key: 'parentCode', label: 'Categoria padre', render: (record) => record.parentCode || 'N/D' },
        { key: 'status', label: 'Estado', render: (record) => <StatusBadge value={record.status} /> },
      ]}
      searchFields={['code', 'name', 'description', 'parentCode']}
    />
  )
}

export function InventoryBrandsPage(props) {
  return (
    <CatalogPage
      {...props}
      title="Marcas"
      description="Administra marcas comerciales disponibles para productos."
      storageKey={BRANDS_KEY}
      defaultRecords={DEFAULT_BRANDS}
      createRecord={(records) => ({ code: nextCode(records, 'MAR'), name: '', description: '', status: 'Activo' })}
      normalizeRecord={normalizeBrand}
      fields={[
        { name: 'code', label: 'Codigo de marca' },
        { name: 'name', label: 'Nombre de marca' },
        { name: 'status', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo'] },
        { name: 'description', label: 'Descripcion', type: 'textarea', span: 'full' },
      ]}
      columns={[
        { key: 'code', label: 'Codigo' },
        { key: 'name', label: 'Marca', render: (record) => <strong>{record.name}</strong> },
        { key: 'description', label: 'Descripcion' },
        { key: 'status', label: 'Estado', render: (record) => <StatusBadge value={record.status} /> },
      ]}
      searchFields={['code', 'name', 'description']}
    />
  )
}

export function InventoryUnitsPage(props) {
  return (
    <CatalogPage
      {...props}
      title="Unidades de medida"
      description="Define unidades, abreviaturas y factores de conversion para productos."
      storageKey={UNITS_KEY}
      defaultRecords={DEFAULT_UNITS}
      createRecord={(records) => ({ code: nextCode(records, 'UND'), name: '', abbreviation: '', type: 'Unidad', factor: 1, status: 'Activo' })}
      normalizeRecord={normalizeUnit}
      fields={[
        { name: 'code', label: 'Codigo' },
        { name: 'name', label: 'Nombre' },
        { name: 'abbreviation', label: 'Abreviatura' },
        { name: 'type', label: 'Tipo', type: 'select', options: ['Unidad', 'Peso', 'Volumen', 'Longitud', 'Caja', 'Paquete'] },
        { name: 'factor', label: 'Factor de conversion', type: 'number' },
        { name: 'status', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo'] },
      ]}
      columns={[
        { key: 'code', label: 'Codigo' },
        { key: 'name', label: 'Nombre', render: (record) => <strong>{record.name}</strong> },
        { key: 'abbreviation', label: 'Abreviatura' },
        { key: 'type', label: 'Tipo' },
        { key: 'factor', label: 'Factor' },
        { key: 'status', label: 'Estado', render: (record) => <StatusBadge value={record.status} /> },
      ]}
      searchFields={['code', 'name', 'abbreviation', 'type']}
    />
  )
}

function collectMovements(products = readProducts()) {
  const productMap = new Map(products.map((product) => [product.code, product]))
  const movements = []
  const seen = new Set()

  const pushMovement = (raw, source = 'inventario') => {
    if (!raw) return
    const productCode = raw.productCode || raw.code || raw.codigo || raw.itemCode || raw.product?.code || raw.line?.code
    const product = productMap.get(productCode)
    const productName = raw.productName || raw.name || raw.product || raw.product?.name || product?.name || 'Producto'
    const entry = toNumber(raw.entry ?? raw.entrada ?? raw.in ?? raw.quantityIn ?? raw.qtyIn)
    const exit = toNumber(raw.exit ?? raw.salida ?? raw.out ?? raw.quantityOut ?? raw.qtyOut)
    const quantity = toNumber(raw.quantity ?? raw.cantidad ?? raw.qty)
    const type = raw.type || raw.tipo || raw.movementType || source
    const finalEntry = entry || (cleanText(type).includes('entrada') || cleanText(type).includes('recepcion') || cleanText(type).includes('compra') ? quantity : 0)
    const finalExit = exit || (cleanText(type).includes('salida') || cleanText(type).includes('venta') || cleanText(type).includes('transferencia') ? quantity : 0)
    const date = raw.date || raw.fecha || raw.createdAt || raw.updatedAt || nowIso()
    const document = raw.document || raw.documentNumber || raw.number || raw.numero || raw.reference || raw.id || 'N/D'
    const key = `${source}|${document}|${productCode}|${finalEntry}|${finalExit}|${date}`

    if (!productCode || seen.has(key)) return
    seen.add(key)
    movements.push({
      id: raw.id || key,
      date,
      productCode,
      productName,
      type,
      document,
      entry: finalEntry,
      exit: finalExit,
      balance: raw.balance ?? '',
      origin: raw.origin || raw.originWarehouse || raw.fromWarehouse || raw.sourceWarehouse || raw.branch || raw.vendor || '',
      destination: raw.destination || raw.destinationWarehouse || raw.toWarehouse || raw.targetWarehouse || raw.warehouse || raw.customer || '',
      warehouse: raw.warehouse || raw.destinationWarehouse || raw.originWarehouse || '',
      user: raw.user || raw.createdBy || raw.updatedBy || 'Sistema',
      reference: raw.reference || raw.description || source,
      source,
      unitCost: toNumber(raw.unitCost || raw.cost || product?.cost),
    })
  }

  ;[MOVEMENTS_KEY, ...EXTRA_MOVEMENT_KEYS].forEach((key) => {
    readArray(key).forEach((movement) => pushMovement(movement, key))
  })

  readArray(INVOICE_KEY).forEach((invoice) => {
    if (invoice.status === 'Anulada') return
    ;(invoice.lines || invoice.items || []).forEach((line) => {
      pushMovement({
        id: `${invoice.number}-${line.code}`,
        date: invoice.date || invoice.createdAt,
        type: 'Venta / Factura',
        document: invoice.number,
        productCode: line.code,
        productName: line.name,
        exit: line.quantity,
        origin: invoice.warehouse,
        destination: invoice.customer,
        warehouse: invoice.warehouse,
        user: invoice.seller || invoice.user,
        reference: invoice.number,
      }, 'facturas')
    })
  })

  readArray(ADJUSTMENTS_KEY).forEach((adjustment) => {
    if (adjustment.status !== 'Aplicado') return
    pushMovement({
      id: adjustment.id || adjustment.number,
      date: adjustment.date,
      type: `Ajuste de inventario - ${adjustment.type}`,
      document: adjustment.number,
      productCode: adjustment.productCode,
      productName: adjustment.productName,
      entry: adjustment.type === 'Entrada' || (adjustment.type === 'Correccion' && toNumber(adjustment.quantity) > 0) ? Math.abs(toNumber(adjustment.quantity)) : 0,
      exit: adjustment.type === 'Salida' || (adjustment.type === 'Correccion' && toNumber(adjustment.quantity) < 0) ? Math.abs(toNumber(adjustment.quantity)) : 0,
      warehouse: adjustment.warehouse,
      user: adjustment.user,
      reference: adjustment.reason,
    }, 'ajustes')
  })

  const ordered = movements.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
  const balances = {}
  return ordered.map((movement) => {
    const code = movement.productCode
    balances[code] = toNumber(balances[code]) + toNumber(movement.entry) - toNumber(movement.exit)
    return {
      ...movement,
      balance: movement.balance !== '' && movement.balance !== undefined ? movement.balance : balances[code],
    }
  })
}

function useProductsState() {
  const [products, setProducts] = useState(() => readProducts())
  const refreshProducts = () => setProducts(readProducts())
  const commitProducts = (nextProducts) => {
    setProducts(nextProducts)
    saveProducts(nextProducts)
  }
  return { products, refreshProducts, commitProducts }
}

function productOptions(products) {
  return [
    { value: '', label: 'Seleccione un producto' },
    ...products.map((product) => ({ value: product.code, label: `${product.code} - ${product.name}` })),
  ]
}

function warehouseOptions() {
  return getWarehouses().map((warehouse) => ({ value: warehouse.code, label: `${warehouse.code} - ${warehouse.name}` }))
}

function stockState(product) {
  const stock = toNumber(product.stock)
  if (stock <= 0) return 'Sin stock'
  if (stock <= toNumber(product.minStock)) return 'Bajo'
  if (toNumber(product.maxStock) > 0 && stock > toNumber(product.maxStock)) return 'Sobre stock'
  return 'Normal'
}

export function InventoryPriceListsPage({ controls, onAction, searchValue = '', onSearchChange }) {
  const { products } = useProductsState()
  const [records, setRecords] = useState(() => readArray(PRICE_LISTS_KEY))
  const [filters, setFilters] = useState({ query: '', status: 'Todos' })
  const [selectedCode, setSelectedCode] = useState('')
  const [draft, setDraft] = useState(null)
  const [message, setMessage] = useState('')
  const selected = selectedRecord(records, selectedCode)

  const saveRecords = (nextRecords) => {
    setRecords(nextRecords)
    writeArray(PRICE_LISTS_KEY, nextRecords)
  }

  const newList = () => ({
    code: nextCode(records, 'LPR'),
    name: '',
    description: '',
    currency: 'RD$',
    status: 'Activo',
    items: products.map((product) => ({
      code: product.code,
      name: product.name,
      basePrice: toNumber(product.price),
      listPrice: toNumber(product.price),
      status: product.status,
    })),
  })

  const filtered = records.filter((record) => {
    const query = cleanText([filters.query, searchValue].filter(Boolean).join(' '))
    const matchesQuery = !query || [record.code, record.name, record.description, record.currency].some((item) => cleanText(item).includes(query))
    const matchesStatus = filters.status === 'Todos' || record.status === filters.status
    return matchesQuery && matchesStatus
  })

  const openEdit = (record = selected) => {
    if (!record) return
    const existingItems = Array.isArray(record.items) ? record.items : []
    const items = products.map((product) => {
      const existing = existingItems.find((item) => item.code === product.code)
      return existing || {
        code: product.code,
        name: product.name,
        basePrice: toNumber(product.price),
        listPrice: toNumber(product.price),
        status: product.status,
      }
    })
    setDraft({ ...record, items })
  }

  const saveDraft = () => {
    const normalized = {
      ...draft,
      code: String(draft.code || '').trim().toUpperCase(),
      name: String(draft.name || '').trim(),
      description: String(draft.description || '').trim(),
      currency: draft.currency || 'RD$',
      status: draft.status || 'Activo',
      items: (draft.items || []).map((item) => ({
        ...item,
        basePrice: toNumber(item.basePrice),
        listPrice: toNumber(item.listPrice),
      })),
      updatedAt: nowIso(),
    }
    if (!normalized.code || !normalized.name) {
      setMessage('Debe indicar codigo y nombre de la lista.')
      return
    }
    const duplicate = records.some((record) => record.code === normalized.code && record.code !== selectedCode)
    if (duplicate) {
      setMessage('Ya existe una lista con ese codigo.')
      return
    }
    const exists = records.some((record) => record.code === selectedCode)
    const nextRecords = exists
      ? records.map((record) => (record.code === selectedCode ? normalized : record))
      : [normalized, ...records]
    saveRecords(nextRecords)
    setSelectedCode(normalized.code)
    setDraft(null)
    setMessage('Lista de precios guardada correctamente.')
    onAction?.('Lista de precios guardada')
  }

  const toggleStatus = () => {
    if (!selected) return
    const nextRecords = records.map((record) => (
      record.code === selected.code ? { ...record, status: record.status === 'Inactivo' ? 'Activo' : 'Inactivo', updatedAt: nowIso() } : record
    ))
    saveRecords(nextRecords)
  }

  return (
    <ModulePageLayout
      title="Listas de precios"
      moduleLabel="Inventario"
      description="Define precios comerciales por producto para clientes, facturas y cotizaciones."
      breadcrumb={['Inventario', 'Listas de precios']}
      searchValue={searchValue}
      searchPlaceholder="Buscar en listas de precios"
      onSearchChange={onSearchChange}
      actions={[
        { id: 'new', label: 'Nueva lista', icon: FilePlus2, variant: 'primary', onClick: () => { setSelectedCode(''); setDraft(newList()) } },
        { id: 'edit', label: 'Editar', icon: Edit3, disabled: !selected, onClick: () => openEdit() },
        { id: 'inactive', label: selected?.status === 'Inactivo' ? 'Activar' : 'Inactivar', icon: Ban, disabled: !selected, onClick: toggleStatus },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('invefat_price_lists.json', records) },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
        { id: 'exit', label: 'Salir', icon: X, onClick: controls?.onClose },
      ]}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      <div className="inventory-module-page">
        {message && <div className="inventory-message">{message}</div>}
        <section className="inventory-panel inventory-filter-panel">
          <PanelHeading eyebrow="Busqueda" title="Filtros de listas" />
          <div className="inventory-filter-grid">
            <label>
              Buscar
              <input value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Codigo, nombre o descripcion" />
            </label>
            <label>
              Estado
              <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                <option>Todos</option>
                <option>Activo</option>
                <option>Inactivo</option>
              </select>
            </label>
          </div>
        </section>

        <section className="inventory-table-wrap">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Lista</th>
                <th>Moneda</th>
                <th>Productos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.code} className={record.code === selectedCode ? 'is-selected' : ''} onClick={() => setSelectedCode(record.code)}>
                  <td>{record.code}</td>
                  <td><strong>{record.name}</strong><small>{record.description || 'Sin descripcion'}</small></td>
                  <td>{record.currency}</td>
                  <td>{record.items?.length || 0}</td>
                  <td><StatusBadge value={record.status} /></td>
                  <td>
                    <div className="inventory-table-actions">
                      <button type="button" title="Editar" onClick={(event) => { event.stopPropagation(); setSelectedCode(record.code); openEdit(record) }}><Edit3 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="6" className="inventory-empty-state">No hay listas de precios registradas.</td></tr>}
            </tbody>
          </table>
        </section>

        {draft && (
          <Modal title={selectedCode ? 'Editar lista de precios' : 'Nueva lista de precios'} onClose={() => setDraft(null)} onSave={saveDraft} wide>
            <div className="inventory-form-grid">
              <FieldControl field={{ name: 'code', label: 'Codigo' }} value={draft.code} onChange={(field, value) => setDraft((current) => ({ ...current, [field]: value }))} />
              <FieldControl field={{ name: 'name', label: 'Nombre de lista' }} value={draft.name} onChange={(field, value) => setDraft((current) => ({ ...current, [field]: value }))} />
              <FieldControl field={{ name: 'currency', label: 'Moneda', type: 'select', options: ['RD$', 'USD', 'EUR'] }} value={draft.currency} onChange={(field, value) => setDraft((current) => ({ ...current, [field]: value }))} />
              <FieldControl field={{ name: 'status', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo'] }} value={draft.status} onChange={(field, value) => setDraft((current) => ({ ...current, [field]: value }))} />
              <FieldControl field={{ name: 'description', label: 'Descripcion', type: 'textarea', span: 'full' }} value={draft.description} onChange={(field, value) => setDraft((current) => ({ ...current, [field]: value }))} />
            </div>

            <h3 className="inventory-modal-section-title">Productos asignados a la lista</h3>
            <div className="inventory-table-wrap">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Codigo producto</th>
                    <th>Producto</th>
                    <th>Precio base</th>
                    <th>Precio de lista</th>
                    <th>Margen</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {(draft.items || []).map((item) => {
                    const margin = toNumber(item.basePrice) > 0 ? ((toNumber(item.listPrice) - toNumber(item.basePrice)) / toNumber(item.basePrice)) * 100 : 0
                    return (
                      <tr key={item.code}>
                        <td>{item.code}</td>
                        <td>{item.name}</td>
                        <td>{formatCurrency(item.basePrice)}</td>
                        <td>
                          <input
                            type="number"
                            value={item.listPrice}
                            onChange={(event) => setDraft((current) => ({
                              ...current,
                              items: current.items.map((row) => (row.code === item.code ? { ...row, listPrice: event.target.value } : row)),
                            }))}
                          />
                        </td>
                        <td>{formatNumber(margin)}%</td>
                        <td><StatusBadge value={item.status} /></td>
                      </tr>
                    )
                  })}
                  {(draft.items || []).length === 0 && <tr><td colSpan="6" className="inventory-empty-state">No hay productos registrados para asignar precios.</td></tr>}
                </tbody>
              </table>
            </div>
          </Modal>
        )}
      </div>
    </ModulePageLayout>
  )
}

export function InventoryStockPage({ controls, searchValue = '', onSearchChange }) {
  const { products, refreshProducts } = useProductsState()
  const [filters, setFilters] = useState({ query: '', category: 'Todos', status: 'Todos', warehouse: 'Todos' })
  const [selectedCode, setSelectedCode] = useState('')
  const [modalProduct, setModalProduct] = useState(null)
  const movements = useMemo(() => collectMovements(products), [products])
  const categories = Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort()
  const selected = products.find((product) => product.code === selectedCode)

  const filtered = products.filter((product) => {
    const query = cleanText([filters.query, searchValue].filter(Boolean).join(' '))
    const lastMovement = movements.filter((movement) => movement.productCode === product.code).at(-1)
    const matchesQuery = !query || [product.code, product.name, product.category, product.unit, lastMovement?.document].some((item) => cleanText(item).includes(query))
    const matchesCategory = filters.category === 'Todos' || product.category === filters.category
    const matchesStatus = filters.status === 'Todos' || stockState(product) === filters.status
    return matchesQuery && matchesCategory && matchesStatus
  })

  return (
    <ModulePageLayout
      title="Stock por producto"
      moduleLabel="Inventario"
      description="Consulta existencias actuales, stock minimo, maximo y ultimo movimiento."
      breadcrumb={['Inventario', 'Stock por producto']}
      searchValue={searchValue}
      searchPlaceholder="Buscar producto o codigo"
      onSearchChange={onSearchChange}
      actions={[
        { id: 'movements', label: 'Ver movimientos', icon: History, disabled: !selected, onClick: () => setModalProduct(selected) },
        { id: 'kardex', label: 'Ver Kardex', icon: PackageSearch, disabled: !selected, onClick: () => setModalProduct(selected) },
        { id: 'refresh', label: 'Actualizar', icon: CheckCircle2, onClick: refreshProducts },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('invefat_stock_productos.json', filtered) },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
        { id: 'exit', label: 'Salir', icon: X, onClick: controls?.onClose },
      ]}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      <div className="inventory-module-page">
        <section className="inventory-panel inventory-filter-panel">
          <PanelHeading eyebrow="Consulta" title="Filtros de stock" />
          <div className="inventory-filter-grid">
            <label>Buscar<input value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Codigo o producto" /></label>
            <label>Categoria<select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}><option>Todos</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>Estado de stock<select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option>Todos</option><option>Normal</option><option>Bajo</option><option>Sin stock</option><option>Sobre stock</option></select></label>
            <label>Almacen<select value={filters.warehouse} onChange={(event) => setFilters((current) => ({ ...current, warehouse: event.target.value }))}><option>Todos</option>{warehouseOptions().map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          </div>
        </section>
        <section className="inventory-table-wrap">
          <table className="inventory-table is-wide">
            <thead><tr><th>Codigo</th><th>Producto</th><th>Categoria</th><th>Unidad</th><th>Stock actual</th><th>Minimo</th><th>Maximo</th><th>Estado</th><th>Almacen</th><th>Ultimo movimiento</th></tr></thead>
            <tbody>
              {filtered.map((product) => {
                const lastMovement = movements.filter((movement) => movement.productCode === product.code).at(-1)
                return (
                  <tr key={product.code} className={selectedCode === product.code ? 'is-selected' : ''} onClick={() => setSelectedCode(product.code)}>
                    <td>{product.code}</td>
                    <td><strong>{product.name}</strong><small>{product.barcode || 'Sin codigo de barra'}</small></td>
                    <td>{product.category || 'N/D'}</td>
                    <td>{product.unit}</td>
                    <td>{formatNumber(product.stock)}</td>
                    <td>{formatNumber(product.minStock)}</td>
                    <td>{formatNumber(product.maxStock)}</td>
                    <td><StatusBadge value={stockState(product)} /></td>
                    <td>{lastMovement?.warehouse || lastMovement?.destination || 'ALM-01'}</td>
                    <td>{lastMovement ? `${formatDate(lastMovement.date)} - ${lastMovement.document}` : 'Sin movimientos'}</td>
                  </tr>
                )
              })}
              {filtered.length === 0 && <tr><td colSpan="10" className="inventory-empty-state">No hay productos para mostrar.</td></tr>}
            </tbody>
          </table>
        </section>
        {modalProduct && (
          <MovementsModal product={modalProduct} movements={movements.filter((movement) => movement.productCode === modalProduct.code)} onClose={() => setModalProduct(null)} />
        )}
      </div>
    </ModulePageLayout>
  )
}

function MovementsModal({ product, movements, onClose }) {
  const [filters, setFilters] = useState({ document: '', type: 'Todos', from: '', to: '' })
  const types = Array.from(new Set(movements.map((movement) => movement.type).filter(Boolean))).sort()
  const filtered = movements.filter((movement) => {
    const matchesDocument = !filters.document || [movement.document, movement.reference, movement.origin, movement.destination].some((item) => cleanText(item).includes(cleanText(filters.document)))
    const matchesType = filters.type === 'Todos' || movement.type === filters.type
    const movementTime = new Date(movement.date || 0).getTime()
    const fromTime = filters.from ? new Date(filters.from).getTime() : null
    const toTime = filters.to ? new Date(filters.to).getTime() : null
    return matchesDocument && matchesType && (!fromTime || movementTime >= fromTime) && (!toTime || movementTime <= toTime)
  })

  return (
    <Modal title="Movimientos del producto" subtitle={`${product.code} - ${product.name}`} onClose={onClose} wide>
      <section className="inventory-panel inventory-filter-panel">
        <div className="inventory-filter-grid">
          <label>Documento<input value={filters.document} onChange={(event) => setFilters((current) => ({ ...current, document: event.target.value }))} /></label>
          <label>Tipo<select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}><option>Todos</option>{types.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label>Desde<input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></label>
          <label>Hasta<input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></label>
        </div>
      </section>
      <div className="inventory-table-wrap">
        <MovementTable movements={filtered} emptyMessage="Este producto todavia no tiene movimientos registrados." />
      </div>
    </Modal>
  )
}

function MovementTable({ movements, emptyMessage = 'No hay movimientos registrados.' }) {
  return (
    <table className="inventory-table is-wide">
      <thead><tr><th>Fecha</th><th>Producto</th><th>Codigo</th><th>Tipo</th><th>Documento</th><th>Entrada</th><th>Salida</th><th>Balance</th><th>Origen</th><th>Destino</th><th>Usuario</th><th>Referencia</th></tr></thead>
      <tbody>
        {movements.map((movement) => (
          <tr key={movement.id}>
            <td>{formatDate(movement.date)}</td>
            <td>{movement.productName}</td>
            <td>{movement.productCode}</td>
            <td>{movement.type}</td>
            <td>{movement.document}</td>
            <td>{formatNumber(movement.entry)}</td>
            <td>{formatNumber(movement.exit)}</td>
            <td>{movement.balance === '' ? '' : formatNumber(movement.balance)}</td>
            <td>{movement.origin || movement.warehouse || 'N/D'}</td>
            <td>{movement.destination || 'N/D'}</td>
            <td>{movement.user || 'Sistema'}</td>
            <td>{movement.reference || 'N/D'}</td>
          </tr>
        ))}
        {movements.length === 0 && <tr><td colSpan="12" className="inventory-empty-state">{emptyMessage}</td></tr>}
      </tbody>
    </table>
  )
}

export function InventoryKardexPage({ controls, searchValue = '', onSearchChange }) {
  const [filters, setFilters] = useState({ product: '', type: 'Todos', document: '', from: '', to: '', warehouse: 'Todos' })
  const products = readProducts()
  const movements = useMemo(() => collectMovements(products).slice().reverse(), [])
  const types = Array.from(new Set(movements.map((movement) => movement.type).filter(Boolean))).sort()
  const filtered = movements.filter((movement) => {
    const query = cleanText([filters.product, searchValue].filter(Boolean).join(' '))
    const matchesProduct = !query || [movement.productCode, movement.productName].some((item) => cleanText(item).includes(query))
    const matchesType = filters.type === 'Todos' || movement.type === filters.type
    const matchesDocument = !filters.document || cleanText(movement.document).includes(cleanText(filters.document))
    const movementTime = new Date(movement.date || 0).getTime()
    const fromTime = filters.from ? new Date(filters.from).getTime() : null
    const toTime = filters.to ? new Date(filters.to).getTime() : null
    const matchesWarehouse = filters.warehouse === 'Todos' || [movement.warehouse, movement.origin, movement.destination].includes(filters.warehouse)
    return matchesProduct && matchesType && matchesDocument && matchesWarehouse && (!fromTime || movementTime >= fromTime) && (!toTime || movementTime <= toTime)
  })

  return (
    <ModulePageLayout
      title="Kardex / movimientos"
      moduleLabel="Inventario"
      description="Historial consolidado de entradas, salidas, facturas, ajustes y transferencias."
      breadcrumb={['Inventario', 'Kardex / movimientos']}
      searchValue={searchValue}
      searchPlaceholder="Buscar producto o codigo"
      onSearchChange={onSearchChange}
      actions={[
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('invefat_kardex_movimientos.json', filtered) },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
        { id: 'exit', label: 'Salir', icon: X, onClick: controls?.onClose },
      ]}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      <div className="inventory-module-page">
        <section className="inventory-panel inventory-filter-panel">
          <PanelHeading eyebrow="Kardex" title="Filtros de movimientos" />
          <div className="inventory-filter-grid">
            <label>Producto<input value={filters.product} onChange={(event) => setFilters((current) => ({ ...current, product: event.target.value }))} placeholder="Codigo o producto" /></label>
            <label>Tipo<select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}><option>Todos</option>{types.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label>Documento<input value={filters.document} onChange={(event) => setFilters((current) => ({ ...current, document: event.target.value }))} /></label>
            <label>Almacen<select value={filters.warehouse} onChange={(event) => setFilters((current) => ({ ...current, warehouse: event.target.value }))}><option>Todos</option>{warehouseOptions().map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label>Fecha desde<input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></label>
            <label>Fecha hasta<input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></label>
          </div>
        </section>
        <section className="inventory-table-wrap">
          <MovementTable movements={filtered} />
        </section>
      </div>
    </ModulePageLayout>
  )
}

export function InventoryAdjustmentsPage({ controls, onAction, searchValue = '', onSearchChange }) {
  const { products, commitProducts } = useProductsState()
  const [records, setRecords] = useState(() => readArray(ADJUSTMENTS_KEY))
  const [filters, setFilters] = useState({ query: '', status: 'Todos', type: 'Todos' })
  const [selectedNumber, setSelectedNumber] = useState('')
  const [draft, setDraft] = useState(null)
  const [message, setMessage] = useState('')
  const selected = records.find((record) => record.number === selectedNumber)

  const saveRecords = (nextRecords) => {
    setRecords(nextRecords)
    writeArray(ADJUSTMENTS_KEY, nextRecords)
  }

  const openNew = () => setDraft({
    id: makeId('adjustment'),
    number: nextDocument(records, 'AJU'),
    date: today(),
    type: 'Entrada',
    productCode: '',
    productName: '',
    warehouse: 'ALM-01',
    quantity: 1,
    reason: 'Entrada manual',
    observation: '',
    user: 'Administrador',
    status: 'Borrador',
  })

  const updateDraft = (field, value) => {
    setDraft((current) => {
      const next = { ...current, [field]: value }
      if (field === 'productCode') {
        const product = products.find((item) => item.code === value)
        next.productName = product?.name || ''
      }
      return next
    })
  }

  const saveDraft = () => {
    if (!draft.productCode) {
      setMessage('Debe seleccionar un producto.')
      return
    }
    const normalized = { ...draft, quantity: toNumber(draft.quantity), updatedAt: nowIso() }
    const exists = records.some((record) => record.number === normalized.number)
    const nextRecords = exists
      ? records.map((record) => (record.number === normalized.number ? normalized : record))
      : [normalized, ...records]
    saveRecords(nextRecords)
    setSelectedNumber(normalized.number)
    setDraft(null)
    setMessage('Ajuste guardado correctamente.')
  }

  const openEdit = () => {
    if (selected) setDraft({ ...selected })
  }

  const applyAdjustment = () => {
    if (!selected || selected.status === 'Aplicado') return
    const product = products.find((item) => item.code === selected.productCode)
    if (!product) {
      setMessage('El producto del ajuste no existe.')
      return
    }

    const quantity = toNumber(selected.quantity)
    const entry = selected.type === 'Entrada' || (selected.type === 'Correccion' && quantity > 0) ? Math.abs(quantity) : 0
    const exit = selected.type === 'Salida' || (selected.type === 'Correccion' && quantity < 0) ? Math.abs(quantity) : 0
    const nextStock = toNumber(product.stock) + entry - exit
    const nextProducts = products.map((item) => item.code === product.code ? { ...item, stock: nextStock, updatedAt: nowIso() } : item)
    const movement = {
      id: makeId('movement'),
      date: nowIso(),
      type: `Ajuste de inventario - ${selected.type}`,
      document: selected.number,
      productCode: product.code,
      productName: product.name,
      warehouse: selected.warehouse,
      entry,
      exit,
      balance: nextStock,
      user: selected.user,
      reference: selected.reason,
    }
    writeArray(MOVEMENTS_KEY, [movement, ...readArray(MOVEMENTS_KEY)])
    commitProducts(nextProducts)
    saveRecords(records.map((record) => record.number === selected.number ? { ...record, status: 'Aplicado', appliedAt: nowIso() } : record))
    setMessage('Ajuste aplicado y movimiento registrado.')
    onAction?.('Ajuste de inventario aplicado')
  }

  const voidAdjustment = () => {
    if (!selected || selected.status === 'Aplicado') return
    saveRecords(records.map((record) => record.number === selected.number ? { ...record, status: 'Anulado', updatedAt: nowIso() } : record))
    setMessage('Ajuste anulado.')
  }

  const filtered = records.filter((record) => {
    const query = cleanText([filters.query, searchValue].filter(Boolean).join(' '))
    const matchesQuery = !query || [record.number, record.productCode, record.productName, record.reason].some((item) => cleanText(item).includes(query))
    const matchesStatus = filters.status === 'Todos' || record.status === filters.status
    const matchesType = filters.type === 'Todos' || record.type === filters.type
    return matchesQuery && matchesStatus && matchesType
  })

  return (
    <ModulePageLayout
      title="Ajustes de inventario"
      moduleLabel="Inventario"
      description="Registra entradas, salidas y correcciones controladas de inventario."
      breadcrumb={['Inventario', 'Ajustes de inventario']}
      searchValue={searchValue}
      searchPlaceholder="Buscar ajuste"
      onSearchChange={onSearchChange}
      actions={[
        { id: 'new', label: 'Nuevo ajuste', icon: FilePlus2, variant: 'primary', onClick: openNew },
        { id: 'edit', label: 'Editar', icon: Edit3, disabled: !selected || selected.status === 'Aplicado', onClick: openEdit },
        { id: 'apply', label: 'Aplicar ajuste', icon: CheckCircle2, disabled: !selected || selected.status === 'Aplicado' || selected.status === 'Anulado', onClick: applyAdjustment },
        { id: 'void', label: 'Anular', icon: Ban, disabled: !selected || selected.status === 'Aplicado' || selected.status === 'Anulado', onClick: voidAdjustment },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('invefat_inventory_adjustments.json', records) },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
        { id: 'exit', label: 'Salir', icon: X, onClick: controls?.onClose },
      ]}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      <div className="inventory-module-page">
        {message && <div className="inventory-message">{message}</div>}
        <section className="inventory-panel inventory-filter-panel">
          <PanelHeading eyebrow="Ajustes" title="Filtros de ajustes" />
          <div className="inventory-filter-grid">
            <label>Buscar<input value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Numero o producto" /></label>
            <label>Tipo<select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}><option>Todos</option><option>Entrada</option><option>Salida</option><option>Correccion</option></select></label>
            <label>Estado<select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option>Todos</option><option>Borrador</option><option>Aplicado</option><option>Anulado</option></select></label>
          </div>
        </section>
        <section className="inventory-table-wrap">
          <table className="inventory-table is-wide">
            <thead><tr><th>Numero</th><th>Fecha</th><th>Tipo</th><th>Producto</th><th>Cantidad</th><th>Motivo</th><th>Estado</th><th>Usuario</th></tr></thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.number} className={selectedNumber === record.number ? 'is-selected' : ''} onClick={() => setSelectedNumber(record.number)}>
                  <td>{record.number}</td>
                  <td>{formatDate(record.date)}</td>
                  <td>{record.type}</td>
                  <td><strong>{record.productName}</strong><small>{record.productCode}</small></td>
                  <td>{formatNumber(record.quantity)}</td>
                  <td>{record.reason}</td>
                  <td><StatusBadge value={record.status} /></td>
                  <td>{record.user}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="8" className="inventory-empty-state">No hay ajustes registrados.</td></tr>}
            </tbody>
          </table>
        </section>
        {draft && (
          <Modal title={draft.number ? `Ajuste ${draft.number}` : 'Nuevo ajuste'} onClose={() => setDraft(null)} onSave={saveDraft}>
            <div className="inventory-form-grid">
              <FieldControl field={{ name: 'number', label: 'Numero de ajuste' }} value={draft.number} onChange={updateDraft} />
              <FieldControl field={{ name: 'date', label: 'Fecha', type: 'date' }} value={draft.date} onChange={updateDraft} />
              <FieldControl field={{ name: 'type', label: 'Tipo', type: 'select', options: ['Entrada', 'Salida', 'Correccion'] }} value={draft.type} onChange={updateDraft} />
              <FieldControl field={{ name: 'productCode', label: 'Producto', type: 'select', options: productOptions(products) }} value={draft.productCode} onChange={updateDraft} />
              <FieldControl field={{ name: 'warehouse', label: 'Almacen', type: 'select', options: warehouseOptions() }} value={draft.warehouse} onChange={updateDraft} />
              <FieldControl field={{ name: 'quantity', label: 'Cantidad', type: 'number' }} value={draft.quantity} onChange={updateDraft} />
              <FieldControl field={{ name: 'reason', label: 'Motivo', type: 'select', options: ['Conteo fisico', 'Dano', 'Perdida', 'Correccion', 'Entrada manual', 'Salida manual', 'Otro'] }} value={draft.reason} onChange={updateDraft} />
              <FieldControl field={{ name: 'user', label: 'Usuario' }} value={draft.user} onChange={updateDraft} />
              <FieldControl field={{ name: 'observation', label: 'Observacion', type: 'textarea', span: 'full' }} value={draft.observation} onChange={updateDraft} />
            </div>
          </Modal>
        )}
      </div>
    </ModulePageLayout>
  )
}

export function InventoryPhysicalCountPage({ controls, onAction, searchValue = '', onSearchChange }) {
  const { products, commitProducts } = useProductsState()
  const [records, setRecords] = useState(() => readArray(COUNTS_KEY))
  const [selectedNumber, setSelectedNumber] = useState('')
  const [draft, setDraft] = useState(null)
  const [message, setMessage] = useState('')
  const selected = records.find((record) => record.number === selectedNumber)
  const filtered = records.filter((record) => {
    const query = cleanText(searchValue)
    return !query || [record.number, record.warehouse, record.responsible, record.status].some((item) => cleanText(item).includes(query))
  })

  const saveRecords = (nextRecords) => {
    setRecords(nextRecords)
    writeArray(COUNTS_KEY, nextRecords)
  }

  const openNew = () => setDraft({
    id: makeId('count'),
    number: nextDocument(records, 'CON'),
    date: today(),
    warehouse: 'ALM-01',
    responsible: 'Administrador',
    status: 'Borrador',
    observation: '',
    lines: products.map((product) => ({
      code: product.code,
      name: product.name,
      systemStock: toNumber(product.stock),
      physicalStock: toNumber(product.stock),
    })),
  })

  const saveDraft = () => {
    const normalized = {
      ...draft,
      lines: (draft.lines || []).map((line) => ({
        ...line,
        systemStock: toNumber(line.systemStock),
        physicalStock: toNumber(line.physicalStock),
        difference: toNumber(line.physicalStock) - toNumber(line.systemStock),
      })),
      updatedAt: nowIso(),
    }
    const exists = records.some((record) => record.number === normalized.number)
    const nextRecords = exists
      ? records.map((record) => (record.number === normalized.number ? normalized : record))
      : [normalized, ...records]
    saveRecords(nextRecords)
    setSelectedNumber(normalized.number)
    setDraft(null)
    setMessage('Conteo guardado correctamente.')
  }

  const applyCount = () => {
    if (!selected || selected.status === 'Aplicado') return
    const movementDate = nowIso()
    const nextMovements = [...readArray(MOVEMENTS_KEY)]
    const nextProducts = products.map((product) => {
      const line = selected.lines?.find((item) => item.code === product.code)
      if (!line) return product
      const difference = toNumber(line.physicalStock) - toNumber(line.systemStock)
      if (difference === 0) return product
      const nextStock = toNumber(line.physicalStock)
      nextMovements.unshift({
        id: makeId('movement'),
        date: movementDate,
        type: difference > 0 ? 'Ajuste por conteo - Entrada' : 'Ajuste por conteo - Salida',
        document: selected.number,
        productCode: product.code,
        productName: product.name,
        warehouse: selected.warehouse,
        entry: difference > 0 ? Math.abs(difference) : 0,
        exit: difference < 0 ? Math.abs(difference) : 0,
        balance: nextStock,
        user: selected.responsible,
        reference: 'Conteo fisico',
      })
      return { ...product, stock: nextStock, updatedAt: movementDate }
    })
    writeArray(MOVEMENTS_KEY, nextMovements)
    commitProducts(nextProducts)
    saveRecords(records.map((record) => record.number === selected.number ? { ...record, status: 'Aplicado', appliedAt: movementDate } : record))
    setMessage('Conteo aplicado y movimientos registrados.')
    onAction?.('Conteo fisico aplicado')
  }

  const voidCount = () => {
    if (!selected || selected.status === 'Aplicado') return
    saveRecords(records.map((record) => record.number === selected.number ? { ...record, status: 'Anulado', updatedAt: nowIso() } : record))
  }

  return (
    <ModulePageLayout
      title="Conteo fisico"
      moduleLabel="Inventario"
      description="Registra conteos fisicos y aplica diferencias al inventario."
      breadcrumb={['Inventario', 'Conteo fisico']}
      searchValue={searchValue}
      searchPlaceholder="Buscar conteo"
      onSearchChange={onSearchChange}
      actions={[
        { id: 'new', label: 'Nuevo conteo', icon: FilePlus2, variant: 'primary', onClick: openNew },
        { id: 'edit', label: 'Editar', icon: Edit3, disabled: !selected || selected.status === 'Aplicado', onClick: () => selected && setDraft({ ...selected }) },
        { id: 'apply', label: 'Aplicar ajuste', icon: CheckCircle2, disabled: !selected || selected.status === 'Aplicado' || selected.status === 'Anulado', onClick: applyCount },
        { id: 'void', label: 'Anular', icon: Ban, disabled: !selected || selected.status === 'Aplicado' || selected.status === 'Anulado', onClick: voidCount },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('invefat_inventory_counts.json', records) },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
        { id: 'exit', label: 'Salir', icon: X, onClick: controls?.onClose },
      ]}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      <div className="inventory-module-page">
        {message && <div className="inventory-message">{message}</div>}
        <section className="inventory-table-wrap">
          <table className="inventory-table">
            <thead><tr><th>Numero</th><th>Fecha</th><th>Almacen</th><th>Responsable</th><th>Lineas</th><th>Diferencias</th><th>Estado</th></tr></thead>
            <tbody>
              {filtered.map((record) => {
                const differences = (record.lines || []).filter((line) => toNumber(line.physicalStock) !== toNumber(line.systemStock)).length
                return (
                  <tr key={record.number} className={selectedNumber === record.number ? 'is-selected' : ''} onClick={() => setSelectedNumber(record.number)}>
                    <td>{record.number}</td>
                    <td>{formatDate(record.date)}</td>
                    <td>{record.warehouse}</td>
                    <td>{record.responsible}</td>
                    <td>{record.lines?.length || 0}</td>
                    <td>{differences}</td>
                    <td><StatusBadge value={record.status} /></td>
                  </tr>
                )
              })}
              {filtered.length === 0 && <tr><td colSpan="7" className="inventory-empty-state">No hay conteos registrados.</td></tr>}
            </tbody>
          </table>
        </section>
        {draft && (
          <Modal title={`Conteo ${draft.number}`} onClose={() => setDraft(null)} onSave={saveDraft} wide>
            <div className="inventory-form-grid">
              <FieldControl field={{ name: 'number', label: 'Numero de conteo' }} value={draft.number} onChange={(field, value) => setDraft((current) => ({ ...current, [field]: value }))} />
              <FieldControl field={{ name: 'date', label: 'Fecha', type: 'date' }} value={draft.date} onChange={(field, value) => setDraft((current) => ({ ...current, [field]: value }))} />
              <FieldControl field={{ name: 'warehouse', label: 'Almacen', type: 'select', options: warehouseOptions() }} value={draft.warehouse} onChange={(field, value) => setDraft((current) => ({ ...current, [field]: value }))} />
              <FieldControl field={{ name: 'responsible', label: 'Responsable' }} value={draft.responsible} onChange={(field, value) => setDraft((current) => ({ ...current, [field]: value }))} />
              <FieldControl field={{ name: 'status', label: 'Estado', type: 'select', options: ['Borrador', 'En proceso', 'Aplicado', 'Anulado'] }} value={draft.status} onChange={(field, value) => setDraft((current) => ({ ...current, [field]: value }))} />
              <FieldControl field={{ name: 'observation', label: 'Observacion', type: 'textarea', span: 'full' }} value={draft.observation} onChange={(field, value) => setDraft((current) => ({ ...current, [field]: value }))} />
            </div>
            <h3 className="inventory-modal-section-title">Detalle del conteo</h3>
            <div className="inventory-table-wrap">
              <table className="inventory-table is-wide">
                <thead><tr><th>Producto</th><th>Stock sistema</th><th>Cantidad fisica</th><th>Diferencia</th><th>Accion sugerida</th></tr></thead>
                <tbody>
                  {(draft.lines || []).map((line) => {
                    const difference = toNumber(line.physicalStock) - toNumber(line.systemStock)
                    return (
                      <tr key={line.code}>
                        <td><strong>{line.name}</strong><small>{line.code}</small></td>
                        <td>{formatNumber(line.systemStock)}</td>
                        <td><input type="number" value={line.physicalStock} onChange={(event) => setDraft((current) => ({ ...current, lines: current.lines.map((row) => row.code === line.code ? { ...row, physicalStock: event.target.value } : row) }))} /></td>
                        <td>{formatNumber(difference)}</td>
                        <td>{difference === 0 ? 'Sin ajuste' : difference > 0 ? 'Entrada por diferencia' : 'Salida por diferencia'}</td>
                      </tr>
                    )
                  })}
                  {(draft.lines || []).length === 0 && <tr><td colSpan="5" className="inventory-empty-state">No hay productos para contar.</td></tr>}
                </tbody>
              </table>
            </div>
          </Modal>
        )}
      </div>
    </ModulePageLayout>
  )
}

function normalizeLot(record) {
  return {
    id: record.id || makeId('lot'),
    productCode: String(record.productCode || '').trim(),
    productName: String(record.productName || '').trim(),
    controlType: record.controlType || 'Lote',
    number: String(record.number || '').trim(),
    manufactureDate: record.manufactureDate || '',
    expiryDate: record.expiryDate || '',
    quantity: toNumber(record.quantity),
    warehouse: record.warehouse || 'ALM-01',
    status: record.status || 'Activo',
    updatedAt: record.updatedAt || nowIso(),
  }
}

export function InventoryLotsPage(props) {
  const products = readProducts()
  return (
    <CatalogPage
      {...props}
      title="Lotes y series"
      description="Consulta y registra lotes o series por producto para trazabilidad futura."
      storageKey={LOTS_KEY}
      createRecord={() => ({ id: makeId('lot'), productCode: '', productName: '', controlType: 'Lote', number: '', manufactureDate: '', expiryDate: '', quantity: 1, warehouse: 'ALM-01', status: 'Activo' })}
      normalizeRecord={normalizeLot}
      codeField="id"
      nameField="number"
      fields={[
        { name: 'productCode', label: 'Producto', type: 'select', options: productOptions(products) },
        { name: 'controlType', label: 'Tipo control', type: 'select', options: ['Lote', 'Serie'] },
        { name: 'number', label: 'Numero de lote o serie' },
        { name: 'manufactureDate', label: 'Fecha fabricacion', type: 'date' },
        { name: 'expiryDate', label: 'Fecha vencimiento', type: 'date' },
        { name: 'quantity', label: 'Cantidad', type: 'number' },
        { name: 'warehouse', label: 'Almacen', type: 'select', options: warehouseOptions() },
        { name: 'status', label: 'Estado', type: 'select', options: ['Activo', 'Vencido', 'Bloqueado', 'Consumido', 'Inactivo'] },
      ]}
      columns={[
        { key: 'productCode', label: 'Producto', render: (record) => <><strong>{products.find((product) => product.code === record.productCode)?.name || record.productName || 'N/D'}</strong><small>{record.productCode}</small></> },
        { key: 'number', label: 'Lote / Serie' },
        { key: 'manufactureDate', label: 'Fabricacion', render: (record) => formatDate(record.manufactureDate) },
        { key: 'expiryDate', label: 'Vencimiento', render: (record) => formatDate(record.expiryDate) },
        { key: 'quantity', label: 'Cantidad', render: (record) => formatNumber(record.quantity) },
        { key: 'warehouse', label: 'Almacen' },
        { key: 'status', label: 'Estado', render: (record) => <StatusBadge value={record.status} /> },
      ]}
      searchFields={['productCode', 'productName', 'number', 'status']}
    />
  )
}

export function InventoryBarcodesPage({ controls, onAction, searchValue = '', onSearchChange }) {
  const { products } = useProductsState()
  const [records, setRecords] = useState(() => readArray(BARCODES_KEY))
  const [filters, setFilters] = useState({ query: '', status: 'Todos' })
  const [selectedId, setSelectedId] = useState('')
  const [draft, setDraft] = useState(null)
  const [message, setMessage] = useState('')
  const selected = records.find((record) => record.id === selectedId)

  const saveRecords = (nextRecords) => {
    setRecords(nextRecords)
    writeArray(BARCODES_KEY, nextRecords)
  }

  const openNew = () => setDraft({
    id: makeId('barcode'),
    productCode: '',
    productName: '',
    primaryCode: '',
    alternateCode: '',
    type: 'Barra',
    status: 'Activo',
  })

  const updateDraft = (field, value) => {
    setDraft((current) => {
      const next = { ...current, [field]: value }
      if (field === 'productCode') {
        const product = products.find((item) => item.code === value)
        next.productName = product?.name || ''
        next.primaryCode = product?.barcode || next.primaryCode
      }
      return next
    })
  }

  const generateInternalCode = () => {
    setDraft((current) => ({ ...current, alternateCode: `IF${String(Date.now()).slice(-10)}` }))
  }

  const saveDraft = () => {
    if (!draft.productCode) {
      setMessage('Debe seleccionar un producto.')
      return
    }
    const normalized = { ...draft, updatedAt: nowIso() }
    const exists = records.some((record) => record.id === normalized.id)
    const nextRecords = exists
      ? records.map((record) => record.id === normalized.id ? normalized : record)
      : [normalized, ...records]
    saveRecords(nextRecords)
    setSelectedId(normalized.id)
    setDraft(null)
    setMessage('Codigo de barra guardado correctamente.')
    onAction?.('Codigo de barra guardado')
  }

  const filtered = records.filter((record) => {
    const query = cleanText([filters.query, searchValue].filter(Boolean).join(' '))
    const matchesQuery = !query || [record.productCode, record.productName, record.primaryCode, record.alternateCode].some((item) => cleanText(item).includes(query))
    const matchesStatus = filters.status === 'Todos' || record.status === filters.status
    return matchesQuery && matchesStatus
  })

  return (
    <ModulePageLayout
      title="Codigos de barra / QR"
      moduleLabel="Inventario"
      description="Administra codigos principales, alternos y vista de etiquetas."
      breadcrumb={['Inventario', 'Codigos de barra / QR']}
      searchValue={searchValue}
      searchPlaceholder="Buscar codigo o producto"
      onSearchChange={onSearchChange}
      actions={[
        { id: 'new', label: 'Nuevo codigo', icon: Barcode, variant: 'primary', onClick: openNew },
        { id: 'edit', label: 'Editar', icon: Edit3, disabled: !selected, onClick: () => selected && setDraft({ ...selected }) },
        { id: 'print', label: 'Imprimir etiquetas', icon: Printer, onClick: () => window.print() },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('invefat_inventory_barcodes.json', records) },
        { id: 'exit', label: 'Salir', icon: X, onClick: controls?.onClose },
      ]}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      <div className="inventory-module-page">
        {message && <div className="inventory-message">{message}</div>}
        <section className="inventory-panel inventory-filter-panel">
          <PanelHeading eyebrow="Etiquetas" title="Filtros de codigos" />
          <div className="inventory-filter-grid">
            <label>Buscar<input value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Producto, barra o QR" /></label>
            <label>Estado<select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option>Todos</option><option>Activo</option><option>Inactivo</option></select></label>
          </div>
        </section>
        <section className="inventory-table-wrap">
          <table className="inventory-table">
            <thead><tr><th>Producto</th><th>Codigo principal</th><th>Codigo alterno</th><th>Tipo</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id} className={selectedId === record.id ? 'is-selected' : ''} onClick={() => setSelectedId(record.id)}>
                  <td><strong>{record.productName || products.find((product) => product.code === record.productCode)?.name || 'N/D'}</strong><small>{record.productCode}</small></td>
                  <td>{record.primaryCode || 'Sin codigo'}</td>
                  <td>{record.alternateCode || 'N/D'}</td>
                  <td>{record.type}</td>
                  <td><StatusBadge value={record.status} /></td>
                  <td><div className="inventory-table-actions"><button type="button" title="Editar" onClick={(event) => { event.stopPropagation(); setDraft({ ...record }); setSelectedId(record.id) }}><Edit3 size={15} /></button></div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="6" className="inventory-empty-state">No hay codigos registrados.</td></tr>}
            </tbody>
          </table>
        </section>
        {draft && (
          <Modal title="Codigo de barra / QR" onClose={() => setDraft(null)} onSave={saveDraft}>
            <div className="inventory-form-grid">
              <FieldControl field={{ name: 'productCode', label: 'Producto', type: 'select', options: productOptions(products) }} value={draft.productCode} onChange={updateDraft} />
              <FieldControl field={{ name: 'primaryCode', label: 'Codigo principal' }} value={draft.primaryCode} onChange={updateDraft} />
              <FieldControl field={{ name: 'alternateCode', label: 'Codigo alterno' }} value={draft.alternateCode} onChange={updateDraft} />
              <FieldControl field={{ name: 'type', label: 'Tipo', type: 'select', options: ['Barra', 'QR'] }} value={draft.type} onChange={updateDraft} />
              <FieldControl field={{ name: 'status', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo'] }} value={draft.status} onChange={updateDraft} />
            </div>
            <div className="inventory-modal-section-title">Vista previa de etiqueta</div>
            <div className="inventory-label-preview">
              <strong>{draft.productName || 'Producto'}</strong>
              <div className="barcode-lines" />
              <span>{draft.alternateCode || draft.primaryCode || 'Sin codigo'}</span>
            </div>
            <button type="button" className="inventory-small-button" onClick={generateInternalCode}>
              <QrCode size={15} /> Generar codigo interno
            </button>
          </Modal>
        )}
      </div>
    </ModulePageLayout>
  )
}

export function InventoryCostsPage({ controls, onAction, searchValue = '', onSearchChange }) {
  const { products, commitProducts } = useProductsState()
  const movements = useMemo(() => collectMovements(products), [products])
  const [filters, setFilters] = useState({ query: '', category: 'Todos', warehouse: 'Todos', status: 'Todos' })
  const [selectedCode, setSelectedCode] = useState('')
  const [draft, setDraft] = useState(null)
  const selected = products.find((product) => product.code === selectedCode)
  const categories = Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort()

  const rows = products.map((product) => {
    const productMovements = movements.filter((movement) => movement.productCode === product.code)
    const lastMovement = productMovements.at(-1)
    const entryMovements = productMovements.filter((movement) => toNumber(movement.entry) > 0 && toNumber(movement.unitCost) > 0)
    const averageCost = entryMovements.length
      ? entryMovements.reduce((sum, movement) => sum + toNumber(movement.unitCost), 0) / entryMovements.length
      : toNumber(product.cost)
    return {
      ...product,
      currentCost: toNumber(product.cost),
      lastCost: toNumber(lastMovement?.unitCost || product.cost),
      averageCost,
      inventoryValue: toNumber(product.stock) * toNumber(product.cost),
      lastMovement,
    }
  })

  const filtered = rows.filter((row) => {
    const query = cleanText([filters.query, searchValue].filter(Boolean).join(' '))
    const costStatus = row.currentCost <= 0 ? 'Costo cero' : row.stock > 0 && row.currentCost <= 0 ? 'Stock sin costo' : 'Costo actualizado'
    const matchesQuery = !query || [row.code, row.name, row.category].some((item) => cleanText(item).includes(query))
    const matchesCategory = filters.category === 'Todos' || row.category === filters.category
    const matchesStatus = filters.status === 'Todos' || costStatus === filters.status
    return matchesQuery && matchesCategory && matchesStatus
  })

  const totals = {
    value: filtered.reduce((sum, product) => sum + product.inventoryValue, 0),
    zeroCost: filtered.filter((product) => product.currentCost <= 0).length,
    stockNoCost: filtered.filter((product) => product.stock > 0 && product.currentCost <= 0).length,
    updated: filtered.filter((product) => product.currentCost > 0).length,
  }

  const saveCost = () => {
    const nextCost = toNumber(draft.cost)
    const nextProducts = products.map((product) => product.code === draft.code ? { ...product, cost: nextCost, updatedAt: nowIso() } : product)
    const costRecords = readArray(COSTS_KEY)
    writeArray(COSTS_KEY, [{ id: makeId('cost'), productCode: draft.code, productName: draft.name, previousCost: draft.currentCost, newCost: nextCost, date: nowIso(), user: 'Administrador' }, ...costRecords])
    commitProducts(nextProducts)
    setDraft(null)
    onAction?.('Costo actualizado')
  }

  return (
    <ModulePageLayout
      title="Costos de inventario"
      moduleLabel="Inventario"
      description="Consulta costos, valor de inventario y productos con costo pendiente."
      breadcrumb={['Inventario', 'Costos de inventario']}
      searchValue={searchValue}
      searchPlaceholder="Buscar costo por producto"
      onSearchChange={onSearchChange}
      actions={[
        { id: 'edit', label: 'Actualizar costo', icon: DollarSign, disabled: !selected, onClick: () => selected && setDraft({ ...rows.find((row) => row.code === selected.code), cost: selected.cost }) },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('invefat_inventory_costs_view.json', filtered) },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
        { id: 'exit', label: 'Salir', icon: X, onClick: controls?.onClose },
      ]}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      <div className="inventory-module-page">
        <section className="inventory-summary-grid">
          <article><span>Valor total inventario</span><strong>{formatCurrency(totals.value)}</strong></article>
          <article><span>Productos costo cero</span><strong>{totals.zeroCost}</strong></article>
          <article><span>Stock sin costo</span><strong>{totals.stockNoCost}</strong></article>
          <article><span>Costo actualizado</span><strong>{totals.updated}</strong></article>
        </section>
        <section className="inventory-panel inventory-filter-panel">
          <PanelHeading eyebrow="Costos" title="Filtros de costos" />
          <div className="inventory-filter-grid">
            <label>Producto<input value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} /></label>
            <label>Categoria<select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}><option>Todos</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>Almacen<select value={filters.warehouse} onChange={(event) => setFilters((current) => ({ ...current, warehouse: event.target.value }))}><option>Todos</option>{warehouseOptions().map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label>Estado<select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option>Todos</option><option>Costo cero</option><option>Stock sin costo</option><option>Costo actualizado</option></select></label>
          </div>
        </section>
        <section className="inventory-table-wrap">
          <table className="inventory-table is-wide">
            <thead><tr><th>Producto</th><th>Costo actual</th><th>Ultimo costo</th><th>Costo promedio</th><th>Stock</th><th>Valor inventario</th><th>Ultima compra</th><th>Ultimo movimiento</th></tr></thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.code} className={selectedCode === row.code ? 'is-selected' : ''} onClick={() => setSelectedCode(row.code)}>
                  <td><strong>{row.name}</strong><small>{row.code}</small></td>
                  <td>{formatCurrency(row.currentCost)}</td>
                  <td>{formatCurrency(row.lastCost)}</td>
                  <td>{formatCurrency(row.averageCost)}</td>
                  <td>{formatNumber(row.stock)}</td>
                  <td>{formatCurrency(row.inventoryValue)}</td>
                  <td>{row.lastMovement?.type?.includes('compra') ? formatDate(row.lastMovement.date) : 'N/D'}</td>
                  <td>{row.lastMovement ? `${formatDate(row.lastMovement.date)} - ${row.lastMovement.document}` : 'Sin movimientos'}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="8" className="inventory-empty-state">No hay costos para mostrar.</td></tr>}
            </tbody>
          </table>
        </section>
        {draft && (
          <Modal title="Actualizar costo de producto" subtitle={draft.name} onClose={() => setDraft(null)} onSave={saveCost}>
            <div className="inventory-message is-warning">Confirme el nuevo costo. Este cambio actualiza el costo del producto en la data local y deja historial en costos de inventario.</div>
            <div className="inventory-form-grid">
              <label>Producto<input value={`${draft.code} - ${draft.name}`} readOnly /></label>
              <label>Costo actual<input value={draft.currentCost} readOnly /></label>
              <FieldControl field={{ name: 'cost', label: 'Nuevo costo', type: 'number' }} value={draft.cost} onChange={(field, value) => setDraft((current) => ({ ...current, [field]: value }))} />
            </div>
          </Modal>
        )}
      </div>
    </ModulePageLayout>
  )
}
