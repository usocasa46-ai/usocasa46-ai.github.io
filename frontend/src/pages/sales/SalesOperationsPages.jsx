import {
  Ban,
  CheckCircle2,
  CreditCard,
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
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import './SalesInvoicePage.css'
import './SalesOperationsPages.css'

const PRODUCTS_KEY = 'inveFatInventoryProducts'
const CUSTOMERS_KEY = 'invefat_customers'
const LEGACY_CUSTOMERS_KEY = 'invefat_sales_customers'
const INVOICES_KEY = 'invefat_sales_invoices'
const QUOTES_KEY = 'invefat_sales_quotes'
const ORDERS_KEY = 'invefat_sales_orders'
const RETURNS_KEY = 'invefat_sales_returns'
const CREDIT_NOTES_KEY = 'invefat_sales_credit_notes'
const PAYMENTS_KEY = 'invefat_customer_payments'
const MOVEMENTS_KEY = 'invefat_inventory_movements'
const REPORTS_KEY = 'invefat_sales_reports'
const PENDING_INVOICE_KEY = 'invefat_pending_invoice_from_sales'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function safeParse(key, fallback = []) {
  if (!canUseStorage()) return fallback
  try {
    const saved = localStorage.getItem(key)
    const parsed = saved ? JSON.parse(saved) : fallback
    return parsed ?? fallback
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
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
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

function nextNumber(records, prefix) {
  const highest = records.reduce((max, record) => {
    const match = String(record.number || '').match(/(\d+)$/)
    return Math.max(max, match ? Number(match[1]) : 0)
  }, 0)
  return `${prefix}-${String(highest + 1).padStart(6, '0')}`
}

function currency(value) {
  return `RD$ ${toNumber(value).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function normalizeCustomer(customer) {
  return {
    code: customer.code || customer.codigo || customer.customerCode || customer.id || '',
    name: customer.name || customer.commercialName || customer.nombre || customer.customer || 'Cliente sin nombre',
    fiscalId: customer.fiscalId || customer.document || customer.rnc || customer.identification || '',
    phone: customer.phone || customer.telefono || '',
    email: customer.email || customer.correo || customer.invoiceEmail || '',
    address: customer.address || customer.direccion || '',
    paymentCondition: customer.paymentCondition || customer.condition || 'Contado',
    creditDays: toNumber(customer.creditDays || customer.daysCredit),
    status: customer.status || customer.estado || 'Activo',
    balance: toNumber(customer.balance),
  }
}

function readCustomers() {
  const main = readArray(CUSTOMERS_KEY)
  const legacy = readArray(LEGACY_CUSTOMERS_KEY)
  const source = main.length ? main : legacy
  return source.map(normalizeCustomer)
}

function normalizeProduct(product) {
  const taxValue = product.tax ?? product.impuesto ?? product.taxRate ?? 0
  return {
    code: product.code || product.codigo || '',
    name: product.name || product.nombre || 'Producto sin nombre',
    category: product.category || product.categoria || 'General',
    unit: product.unit || product.unidad || 'UND',
    barcode: product.barcode || product.codigoBarra || '',
    cost: toNumber(product.cost || product.costo),
    price: toNumber(product.price || product.precio),
    stock: toNumber(product.stock),
    tax: toNumber(taxValue),
    status: product.status || product.estado || 'Activo',
  }
}

function readProducts() {
  return readArray(PRODUCTS_KEY).map(normalizeProduct).filter((product) => product.code)
}

function calculateLines(lines = []) {
  const subtotal = lines.reduce((sum, line) => sum + (toNumber(line.quantity) * toNumber(line.price)), 0)
  const discountTotal = lines.reduce((sum, line) => sum + toNumber(line.discount), 0)
  const taxTotal = lines.reduce((sum, line) => {
    const base = Math.max((toNumber(line.quantity) * toNumber(line.price)) - toNumber(line.discount), 0)
    return sum + (base * (toNumber(line.tax) / 100))
  }, 0)
  const total = Math.max(subtotal - discountTotal + taxTotal, 0)
  return { subtotal, discountTotal, taxTotal, total }
}

function statusClass(status = '') {
  const clean = cleanText(status)
  if (clean.includes('anulad') || clean.includes('rechaz') || clean.includes('venc')) return 'anulada'
  if (clean.includes('pendiente') || clean.includes('borrador') || clean.includes('parcial')) return 'pendiente'
  if (clean.includes('aprobad') || clean.includes('aplicad') || clean.includes('pagad') || clean.includes('facturad') || clean.includes('convert')) return 'pagada'
  return 'guardada'
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

function IconButton({ title, onClick, children, danger = false, disabled = false }) {
  return (
    <button
      type="button"
      className={`sales-icon-action ${danger ? 'is-danger' : ''}`}
      title={title}
      aria-label={title}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.()
      }}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function FloatingModal({ title, subtitle, children, footer, onClose, wide = true }) {
  const [state, setState] = useState('normal')

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      if (state === 'maximized') {
        setState('normal')
        return
      }
      onClose?.()
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose, state])

  if (state === 'minimized') {
    return (
      <button type="button" className="sales-minimized-invoice" onClick={() => setState('normal')}>
        <span>{title} minimizado</span>
        <strong>Restaurar</strong>
      </button>
    )
  }

  return (
    <div className="sales-modal-backdrop" role="presentation">
      <section className={`sales-modal sales-operation-modal ${wide ? 'is-wide' : ''} ${state === 'maximized' ? 'is-maximized' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <div>
            <span>Ventas</span>
            <h2>{title}</h2>
            {subtitle && <small>{subtitle}</small>}
          </div>
          <div className="sales-modal-controls">
            <button type="button" onClick={onClose} title="Salir" className="is-exit"><X size={15} /></button>
            <button type="button" onClick={() => setState('minimized')} title="Minimizar"><Minimize2 size={15} /></button>
            <button type="button" onClick={() => setState((current) => current === 'maximized' ? 'normal' : 'maximized')} title={state === 'maximized' ? 'Restaurar' : 'Maximizar'}><Maximize2 size={15} /></button>
          </div>
        </header>
        <div className="sales-modal-body sales-operation-body">
          {children}
        </div>
        <footer>
          {footer}
        </footer>
      </section>
    </div>
  )
}

function CustomerSelect({ value, onChange, customers }) {
  const customer = customers.find((item) => item.code === value)
  return (
    <div className="sales-operation-grid">
      <label>
        Cliente
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Seleccione cliente</option>
          {customers.map((item) => (
            <option key={item.code || item.name} value={item.code}>{item.code} - {item.name}</option>
          ))}
        </select>
      </label>
      <label>
        RNC / Identificacion
        <input value={customer?.fiscalId || ''} readOnly />
      </label>
      <label>
        Telefono
        <input value={customer?.phone || ''} readOnly />
      </label>
      <label>
        Condicion de pago
        <input value={customer?.paymentCondition || ''} readOnly />
      </label>
    </div>
  )
}

function ProductPicker({ products, onAdd }) {
  const [productCode, setProductCode] = useState('')
  const selected = products.find((product) => product.code === productCode)

  return (
    <div className="sales-product-picker sales-operation-product-picker">
      <label className="sales-span-2">
        Producto
        <select value={productCode} onChange={(event) => setProductCode(event.target.value)}>
          <option value="">Seleccione producto</option>
          {products.map((product) => (
            <option key={product.code} value={product.code}>
              {product.code} - {product.name} - Stock {product.stock}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="sales-primary-button"
        onClick={() => {
          if (!selected) return
          onAdd(selected)
          setProductCode('')
        }}
      >
        <FilePlus2 size={16} />
        Agregar
      </button>
    </div>
  )
}

function LinesTable({ lines, onChange, onRemove, readonly = false }) {
  return (
    <div className="sales-table-wrap">
      <table className="sales-table sales-detail-table">
        <thead>
          <tr>
            <th>Codigo</th>
            <th>Producto</th>
            <th>Unidad</th>
            <th>Cantidad</th>
            <th>Precio</th>
            <th>Descuento</th>
            <th>Impuesto</th>
            <th>Total</th>
            {!readonly && <th>Accion</th>}
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 && (
            <tr>
              <td colSpan={readonly ? 8 : 9} className="sales-empty-cell">Agregue productos al documento.</td>
            </tr>
          )}
          {lines.map((line) => {
            const base = Math.max((toNumber(line.quantity) * toNumber(line.price)) - toNumber(line.discount), 0)
            const total = base + (base * (toNumber(line.tax) / 100))
            return (
              <tr key={line.id || line.code}>
                <td><strong>{line.code}</strong></td>
                <td>{line.name}</td>
                <td>{line.unit}</td>
                <td><input type="number" value={line.quantity} min="0" readOnly={readonly} onChange={(event) => onChange(line.id, 'quantity', event.target.value)} /></td>
                <td><input type="number" value={line.price} min="0" readOnly={readonly} onChange={(event) => onChange(line.id, 'price', event.target.value)} /></td>
                <td><input type="number" value={line.discount} min="0" readOnly={readonly} onChange={(event) => onChange(line.id, 'discount', event.target.value)} /></td>
                <td><input type="number" value={line.tax} min="0" readOnly={readonly} onChange={(event) => onChange(line.id, 'tax', event.target.value)} /></td>
                <td><strong>{currency(total)}</strong></td>
                {!readonly && (
                  <td>
                    <button type="button" className="sales-icon-button" onClick={() => onRemove(line.id)} title="Eliminar">
                      <Trash2 size={15} />
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function makeLineFromProduct(product) {
  return {
    id: makeId('line'),
    code: product.code,
    name: product.name,
    unit: product.unit,
    quantity: 1,
    price: product.price,
    cost: product.cost,
    discount: 0,
    tax: product.tax,
  }
}

function DocumentModal({ title, draft, setDraft, customers, products, onClose, onSave, extraFields }) {
  const selectedCustomer = customers.find((item) => item.code === draft.customerCode)
  const totals = calculateLines(draft.lines)

  const updateCustomer = (code) => {
    const customer = customers.find((item) => item.code === code)
    setDraft((current) => ({
      ...current,
      customerCode: code,
      customer: customer?.name || '',
      fiscalId: customer?.fiscalId || '',
      phone: customer?.phone || '',
      address: customer?.address || '',
      paymentCondition: customer?.paymentCondition || current.paymentCondition || 'Contado',
    }))
  }

  const updateLine = (lineId, field, value) => {
    setDraft((current) => ({
      ...current,
      lines: current.lines.map((line) => line.id === lineId ? { ...line, [field]: value } : line),
    }))
  }

  const addLine = (product) => {
    setDraft((current) => ({
      ...current,
      lines: [...current.lines, makeLineFromProduct(product)],
    }))
  }

  const removeLine = (lineId) => {
    setDraft((current) => ({
      ...current,
      lines: current.lines.filter((line) => line.id !== lineId),
    }))
  }

  return (
    <FloatingModal
      title={title}
      subtitle={draft.number}
      onClose={onClose}
      footer={(
        <>
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="button" className="sales-primary-button" onClick={onSave}><Save size={16} /> Guardar</button>
        </>
      )}
    >
      <section className="sales-modal-section">
        <div className="sales-panel-heading">
          <span>Datos principales</span>
          <h2>Cliente y documento</h2>
        </div>
        <CustomerSelect value={draft.customerCode} onChange={updateCustomer} customers={customers} />
        <div className="sales-operation-grid">
          <label>Numero<input value={draft.number} readOnly /></label>
          <label>Fecha<input type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></label>
          <label>Vendedor<input value={draft.seller} onChange={(event) => setDraft((current) => ({ ...current, seller: event.target.value }))} /></label>
          <label>Estado<select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>{(draft.statusOptions || []).map((status) => <option key={status}>{status}</option>)}</select></label>
          {extraFields}
          <label className="sales-span-2">Observaciones<textarea value={draft.observations} onChange={(event) => setDraft((current) => ({ ...current, observations: event.target.value }))} /></label>
        </div>
        {selectedCustomer && (
          <p className="sales-empty-note">Cliente seleccionado: {selectedCustomer.name}. Condicion: {selectedCustomer.paymentCondition || 'Contado'}.</p>
        )}
      </section>

      <section className="sales-modal-section">
        <div className="sales-panel-heading">
          <span>Detalle</span>
          <h2>Productos</h2>
        </div>
        <ProductPicker products={products} onAdd={addLine} />
        <LinesTable lines={draft.lines} onChange={updateLine} onRemove={removeLine} />
      </section>

      <section className="sales-modal-bottom-grid">
        <div className="sales-note-box">
          <span>Control operativo</span>
          <strong>No descuenta inventario hasta que se convierta o aplique segun flujo.</strong>
        </div>
        <aside className="sales-totals-panel">
          <h2>Totales</h2>
          <div className="sales-total-line"><span>Subtotal</span><strong>{currency(totals.subtotal)}</strong></div>
          <div className="sales-total-line"><span>Descuento</span><strong>{currency(totals.discountTotal)}</strong></div>
          <div className="sales-total-line"><span>Impuesto</span><strong>{currency(totals.taxTotal)}</strong></div>
          <div className="sales-total-line is-grand"><span>Total</span><strong>{currency(totals.total)}</strong></div>
        </aside>
      </section>
    </FloatingModal>
  )
}

function baseDraft(records, prefix, statuses) {
  return {
    id: makeId(prefix.toLowerCase()),
    number: nextNumber(records, prefix),
    date: today(),
    customerCode: '',
    customer: '',
    fiscalId: '',
    phone: '',
    address: '',
    seller: 'Administrador',
    deliveryDate: today(),
    paymentCondition: 'Contado',
    status: statuses[0],
    statusOptions: statuses,
    observations: '',
    lines: [],
    totals: { subtotal: 0, discountTotal: 0, taxTotal: 0, total: 0 },
    updatedAt: nowIso(),
  }
}

export function SalesOrdersPage({ controls, onNavigate, onAction, searchValue, onSearchChange }) {
  const statuses = ['Borrador', 'Pendiente', 'Aprobado', 'Parcial', 'Facturado', 'Anulado']
  const [records, setRecords] = useState(() => readArray(ORDERS_KEY))
  const [customers, setCustomers] = useState(readCustomers)
  const [products, setProducts] = useState(readProducts)
  const [selectedId, setSelectedId] = useState('')
  const [draft, setDraft] = useState(null)
  const selected = records.find((item) => item.id === selectedId || item.number === selectedId)

  useEffect(() => {
    setCustomers(readCustomers())
    setProducts(readProducts())
  }, [])

  const filtered = useMemo(() => {
    const query = cleanText(searchValue)
    return records.filter((record) => !query || [record.number, record.customer, record.status, record.seller].some((value) => cleanText(value).includes(query)))
  }, [records, searchValue])

  const saveDraft = () => {
    if (!draft.customer || draft.lines.length === 0) {
      onAction?.('Debe seleccionar cliente y agregar productos.')
      return
    }
    const totals = calculateLines(draft.lines)
    const saved = { ...draft, totals, updatedAt: nowIso() }
    const next = records.some((item) => item.id === saved.id)
      ? records.map((item) => item.id === saved.id ? saved : item)
      : [saved, ...records]
    setRecords(next)
    writeArray(ORDERS_KEY, next)
    setSelectedId(saved.id)
    setDraft(null)
    onAction?.(`Pedido ${saved.number} guardado.`)
  }

  const updateStatus = (status) => {
    if (!selected) return
    const next = records.map((item) => item.id === selected.id ? { ...item, status, updatedAt: nowIso() } : item)
    setRecords(next)
    writeArray(ORDERS_KEY, next)
    onAction?.(`Pedido ${selected.number} actualizado.`)
  }

  const convertToInvoice = () => {
    if (!selected) return
    localStorage.setItem(PENDING_INVOICE_KEY, JSON.stringify({ source: 'sales-order', ...selected }))
    updateStatus('Facturado')
    onNavigate?.('sales-invoice')
  }

  return (
    <ModulePageLayout
      title="Pedidos de clientes"
      moduleLabel="Ventas"
      breadcrumb={['Ventas', 'Pedidos de clientes']}
      description="Gestiona pedidos comerciales antes de facturar o preparar despacho."
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar por numero, cliente, vendedor o estado"
      actions={[
        { id: 'new', label: 'Nuevo pedido', icon: FilePlus2, variant: 'primary', onClick: () => setDraft(baseDraft(records, 'PED', statuses)) },
        { id: 'edit', label: 'Editar', icon: Edit3, disabled: !selected, onClick: () => setDraft({ ...selected, statusOptions: statuses }) },
        { id: 'approve', label: 'Aprobar', icon: CheckCircle2, disabled: !selected, onClick: () => updateStatus('Aprobado') },
        { id: 'dispatch', label: 'Preparar despacho', icon: Send, disabled: !selected, onClick: () => onNavigate?.('warehouse-dispatch') },
        { id: 'invoice', label: 'Convertir a factura', icon: FileText, disabled: !selected, onClick: convertToInvoice },
        { id: 'void', label: 'Anular', icon: Ban, disabled: !selected, onClick: () => updateStatus('Anulado') },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
      ]}
      statusCards={[
        { label: 'Pedidos', value: records.length, detail: 'Registrados' },
        { label: 'Pendientes', value: records.filter((item) => ['Borrador', 'Pendiente'].includes(item.status)).length },
        { label: 'Aprobados', value: records.filter((item) => item.status === 'Aprobado').length },
        { label: 'Total', value: currency(records.reduce((sum, item) => sum + toNumber(item.totals?.total), 0)) },
      ]}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      <section className="erp-panel">
        <div className="sales-table-wrap">
          <table className="sales-table">
            <thead><tr><th>Numero</th><th>Fecha</th><th>Cliente</th><th>Entrega</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan="7" className="sales-empty-cell">No hay pedidos con esa busqueda.</td></tr>}
              {filtered.map((item) => (
                <tr key={item.id} className={selectedId === item.id ? 'is-selected' : ''} onClick={() => setSelectedId(item.id)}>
                  <td><strong>{item.number}</strong></td>
                  <td>{item.date}</td>
                  <td>{item.customer}</td>
                  <td>{item.deliveryDate}</td>
                  <td>{currency(item.totals?.total)}</td>
                  <td><span className={`sales-state-badge ${statusClass(item.status)}`}>{item.status}</span></td>
                  <td><div className="sales-row-actions"><IconButton title="Ver" onClick={() => setDraft({ ...item, statusOptions: statuses })}><Eye size={15} /></IconButton><IconButton title="Convertir a factura" onClick={() => { setSelectedId(item.id); convertToInvoice() }}><FileText size={15} /></IconButton><IconButton title="Anular" danger onClick={() => { setSelectedId(item.id); updateStatus('Anulado') }}><Ban size={15} /></IconButton></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {draft && (
        <DocumentModal
          title="Pedido de cliente"
          draft={draft}
          setDraft={setDraft}
          customers={customers}
          products={products}
          onClose={() => setDraft(null)}
          onSave={saveDraft}
          extraFields={<label>Fecha de entrega<input type="date" value={draft.deliveryDate} onChange={(event) => setDraft((current) => ({ ...current, deliveryDate: event.target.value }))} /></label>}
        />
      )}
    </ModulePageLayout>
  )
}

function invoiceLines(invoice) {
  return (invoice.lines || invoice.items || []).map((line) => ({
    id: makeId('return-line'),
    code: line.code || line.productCode || '',
    name: line.name || line.productName || '',
    unit: line.unit || 'UND',
    quantity: toNumber(line.quantity || line.qty),
    price: toNumber(line.price),
    discount: toNumber(line.discount),
    tax: toNumber(line.tax),
    condition: 'Bueno',
  }))
}

export function SalesReturnsPage({ controls, onAction, searchValue, onSearchChange }) {
  const statuses = ['Borrador', 'Aplicada', 'Anulada']
  const [records, setRecords] = useState(() => readArray(RETURNS_KEY))
  const [invoices, setInvoices] = useState(() => readArray(INVOICES_KEY))
  const [selectedId, setSelectedId] = useState('')
  const [draft, setDraft] = useState(null)
  const selected = records.find((item) => item.id === selectedId)
  const filtered = useMemo(() => {
    const query = cleanText(searchValue)
    return records.filter((record) => !query || [record.number, record.invoiceNumber, record.customer, record.status].some((value) => cleanText(value).includes(query)))
  }, [records, searchValue])

  const startNew = () => {
    setInvoices(readArray(INVOICES_KEY))
    setDraft({
      id: makeId('return'),
      number: nextNumber(records, 'DEV'),
      date: today(),
      invoiceNumber: '',
      customer: '',
      reason: 'Devolucion',
      productCondition: 'Bueno',
      status: 'Borrador',
      observations: '',
      lines: [],
      statusOptions: statuses,
    })
  }

  const selectInvoice = (number) => {
    const invoice = invoices.find((item) => item.number === number)
    setDraft((current) => ({
      ...current,
      invoiceNumber: number,
      customer: invoice?.customer || invoice?.customerName || '',
      lines: invoice ? invoiceLines(invoice) : [],
    }))
  }

  const updateLine = (lineId, field, value) => {
    setDraft((current) => ({
      ...current,
      lines: current.lines.map((line) => line.id === lineId ? { ...line, [field]: value } : line),
    }))
  }

  const removeLine = (lineId) => setDraft((current) => ({ ...current, lines: current.lines.filter((line) => line.id !== lineId) }))

  const applyInventoryReturn = (saved) => {
    const products = readArray(PRODUCTS_KEY)
    const movements = readArray(MOVEMENTS_KEY)
    const nextMovements = [...movements]
    const nextProducts = products.map((product) => {
      const line = saved.lines.find((item) => item.code === product.code)
      if (!line || saved.productCondition !== 'Bueno') return product
      const nextStock = toNumber(product.stock) + toNumber(line.quantity)
      nextMovements.push({
        id: makeId('movement'),
        date: nowIso(),
        type: 'Entrada por devolucion de venta',
        document: saved.number,
        productCode: line.code,
        productName: line.name,
        entry: toNumber(line.quantity),
        exit: 0,
        balance: nextStock,
        user: 'Administrador',
        reference: saved.invoiceNumber,
      })
      return { ...product, stock: nextStock, updatedAt: nowIso() }
    })
    writeArray(PRODUCTS_KEY, nextProducts)
    writeArray(MOVEMENTS_KEY, nextMovements)
  }

  const saveReturn = () => {
    if (!draft.invoiceNumber || draft.lines.length === 0) {
      onAction?.('Debe seleccionar una factura con productos.')
      return
    }
    const totals = calculateLines(draft.lines)
    const saved = { ...draft, totals, status: draft.status === 'Borrador' ? 'Aplicada' : draft.status, updatedAt: nowIso() }
    const exists = records.some((item) => item.id === saved.id)
    const next = exists ? records.map((item) => item.id === saved.id ? saved : item) : [saved, ...records]
    if (!exists && saved.status === 'Aplicada') applyInventoryReturn(saved)
    setRecords(next)
    writeArray(RETURNS_KEY, next)
    setSelectedId(saved.id)
    setDraft(null)
    onAction?.(`Devolucion ${saved.number} guardada.`)
  }

  return (
    <ModulePageLayout
      title="Devoluciones de venta"
      moduleLabel="Ventas"
      breadcrumb={['Ventas', 'Devoluciones de venta']}
      description="Registra devoluciones desde facturas y genera movimientos si vuelven al inventario."
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      actions={[
        { id: 'new', label: 'Nueva devolucion', icon: FilePlus2, variant: 'primary', onClick: startNew },
        { id: 'view', label: 'Ver', icon: Eye, disabled: !selected, onClick: () => setDraft({ ...selected, statusOptions: statuses }) },
        { id: 'void', label: 'Anular', icon: Ban, disabled: !selected, onClick: () => {
          const next = records.map((item) => item.id === selected.id ? { ...item, status: 'Anulada' } : item)
          setRecords(next); writeArray(RETURNS_KEY, next)
        } },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('devoluciones-venta.json', records) },
      ]}
      statusCards={[
        { label: 'Devoluciones', value: records.length },
        { label: 'Aplicadas', value: records.filter((item) => item.status === 'Aplicada').length },
        { label: 'Anuladas', value: records.filter((item) => item.status === 'Anulada').length },
        { label: 'Total', value: currency(records.reduce((sum, item) => sum + toNumber(item.totals?.total), 0)) },
      ]}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      <section className="erp-panel">
        <div className="sales-table-wrap">
          <table className="sales-table">
            <thead><tr><th>Numero</th><th>Fecha</th><th>Factura</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan="7" className="sales-empty-cell">No hay devoluciones registradas.</td></tr>}
              {filtered.map((item) => (
                <tr key={item.id} className={selectedId === item.id ? 'is-selected' : ''} onClick={() => setSelectedId(item.id)}>
                  <td><strong>{item.number}</strong></td><td>{item.date}</td><td>{item.invoiceNumber}</td><td>{item.customer}</td><td>{currency(item.totals?.total)}</td><td><span className={`sales-state-badge ${statusClass(item.status)}`}>{item.status}</span></td>
                  <td><div className="sales-row-actions"><IconButton title="Ver" onClick={() => setDraft({ ...item, statusOptions: statuses })}><Eye size={15} /></IconButton><IconButton title="Imprimir" onClick={() => window.print()}><Printer size={15} /></IconButton><IconButton title="Anular" danger onClick={() => { setSelectedId(item.id); const next = records.map((record) => record.id === item.id ? { ...record, status: 'Anulada' } : record); setRecords(next); writeArray(RETURNS_KEY, next) }}><Ban size={15} /></IconButton></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {draft && (
        <FloatingModal title="Devolucion de venta" subtitle={draft.number} onClose={() => setDraft(null)} footer={<><button type="button" onClick={() => setDraft(null)}>Cancelar</button><button type="button" className="sales-primary-button" onClick={saveReturn}><Save size={16} /> Guardar devolucion</button></>}>
          <section className="sales-modal-section">
            <div className="sales-operation-grid">
              <label>Factura<select value={draft.invoiceNumber} onChange={(event) => selectInvoice(event.target.value)}><option value="">Seleccione factura</option>{invoices.map((invoice) => <option key={invoice.number} value={invoice.number}>{invoice.number} - {invoice.customer}</option>)}</select></label>
              <label>Cliente<input value={draft.customer} readOnly /></label>
              <label>Fecha<input type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></label>
              <label>Motivo<select value={draft.reason} onChange={(event) => setDraft((current) => ({ ...current, reason: event.target.value }))}>{['Devolucion', 'Producto danado', 'Error de despacho', 'Garantia', 'Otro'].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Estado producto<select value={draft.productCondition} onChange={(event) => setDraft((current) => ({ ...current, productCondition: event.target.value }))}>{['Bueno', 'Danado', 'Cuarentena'].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Estado<select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="sales-span-2">Observaciones<textarea value={draft.observations} onChange={(event) => setDraft((current) => ({ ...current, observations: event.target.value }))} /></label>
            </div>
          </section>
          <section className="sales-modal-section"><LinesTable lines={draft.lines} onChange={updateLine} onRemove={removeLine} /></section>
        </FloatingModal>
      )}
    </ModulePageLayout>
  )
}

export function SalesCreditNotesPage({ controls, onAction, searchValue, onSearchChange }) {
  const statuses = ['Borrador', 'Aplicada', 'Anulada']
  const [records, setRecords] = useState(() => readArray(CREDIT_NOTES_KEY))
  const [invoices, setInvoices] = useState(() => readArray(INVOICES_KEY))
  const [selectedId, setSelectedId] = useState('')
  const [draft, setDraft] = useState(null)
  const selected = records.find((item) => item.id === selectedId)
  const filtered = useMemo(() => {
    const query = cleanText(searchValue)
    return records.filter((record) => !query || [record.number, record.invoiceNumber, record.customer, record.reason, record.status].some((value) => cleanText(value).includes(query)))
  }, [records, searchValue])

  const startNew = () => {
    setInvoices(readArray(INVOICES_KEY))
    setDraft({ id: makeId('credit-note'), number: nextNumber(records, 'NCV'), date: today(), invoiceNumber: '', customer: '', reason: 'Devolucion', amount: 0, status: 'Borrador', observations: '' })
  }

  const selectInvoice = (number) => {
    const invoice = invoices.find((item) => item.number === number)
    setDraft((current) => ({ ...current, invoiceNumber: number, customer: invoice?.customer || '', amount: toNumber(invoice?.totals?.total || invoice?.total) }))
  }

  const saveNote = () => {
    if (!draft.invoiceNumber || toNumber(draft.amount) <= 0) {
      onAction?.('Debe seleccionar factura e indicar monto.')
      return
    }
    const saved = { ...draft, status: draft.status === 'Borrador' ? 'Aplicada' : draft.status, updatedAt: nowIso() }
    const next = records.some((item) => item.id === saved.id) ? records.map((item) => item.id === saved.id ? saved : item) : [saved, ...records]
    setRecords(next)
    writeArray(CREDIT_NOTES_KEY, next)
    setSelectedId(saved.id)
    setDraft(null)
    onAction?.(`Nota de credito ${saved.number} guardada.`)
  }

  return (
    <ModulePageLayout
      title="Notas de credito"
      moduleLabel="Ventas"
      breadcrumb={['Ventas', 'Notas de credito']}
      description="Gestiona notas de credito comerciales asociadas a facturas de venta."
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      actions={[
        { id: 'new', label: 'Nueva nota', icon: FilePlus2, variant: 'primary', onClick: startNew },
        { id: 'edit', label: 'Editar', icon: Edit3, disabled: !selected, onClick: () => setDraft(selected) },
        { id: 'void', label: 'Anular', icon: Ban, disabled: !selected, onClick: () => { const next = records.map((item) => item.id === selected.id ? { ...item, status: 'Anulada' } : item); setRecords(next); writeArray(CREDIT_NOTES_KEY, next) } },
        { id: 'print', label: 'Imprimir PDF', icon: Printer, onClick: () => window.print() },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('notas-credito-ventas.json', records) },
      ]}
      statusCards={[
        { label: 'Notas', value: records.length },
        { label: 'Aplicadas', value: records.filter((item) => item.status === 'Aplicada').length },
        { label: 'Anuladas', value: records.filter((item) => item.status === 'Anulada').length },
        { label: 'Monto', value: currency(records.reduce((sum, item) => sum + toNumber(item.amount), 0)) },
      ]}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      <section className="erp-panel">
        <div className="sales-table-wrap">
          <table className="sales-table">
            <thead><tr><th>Numero</th><th>Fecha</th><th>Factura</th><th>Cliente</th><th>Motivo</th><th>Monto</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan="8" className="sales-empty-cell">No hay notas de credito registradas.</td></tr>}
              {filtered.map((item) => (
                <tr key={item.id} className={selectedId === item.id ? 'is-selected' : ''} onClick={() => setSelectedId(item.id)}>
                  <td><strong>{item.number}</strong></td><td>{item.date}</td><td>{item.invoiceNumber}</td><td>{item.customer}</td><td>{item.reason}</td><td>{currency(item.amount)}</td><td><span className={`sales-state-badge ${statusClass(item.status)}`}>{item.status}</span></td>
                  <td><div className="sales-row-actions"><IconButton title="Ver" onClick={() => setDraft(item)}><Eye size={15} /></IconButton><IconButton title="Imprimir" onClick={() => window.print()}><Printer size={15} /></IconButton><IconButton title="Anular" danger onClick={() => { setSelectedId(item.id); const next = records.map((record) => record.id === item.id ? { ...record, status: 'Anulada' } : record); setRecords(next); writeArray(CREDIT_NOTES_KEY, next) }}><Ban size={15} /></IconButton></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {draft && (
        <FloatingModal title="Nota de credito" subtitle={draft.number} onClose={() => setDraft(null)} wide={false} footer={<><button type="button" onClick={() => setDraft(null)}>Cancelar</button><button type="button" className="sales-primary-button" onClick={saveNote}><Save size={16} /> Guardar</button></>}>
          <section className="sales-modal-section">
            <div className="sales-operation-grid">
              <label>Factura<select value={draft.invoiceNumber} onChange={(event) => selectInvoice(event.target.value)}><option value="">Seleccione factura</option>{invoices.map((invoice) => <option key={invoice.number} value={invoice.number}>{invoice.number} - {invoice.customer}</option>)}</select></label>
              <label>Cliente<input value={draft.customer} readOnly /></label>
              <label>Fecha<input type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></label>
              <label>Motivo<select value={draft.reason} onChange={(event) => setDraft((current) => ({ ...current, reason: event.target.value }))}>{['Devolucion', 'Descuento', 'Error de facturacion', 'Ajuste comercial', 'Otro'].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Monto<input type="number" value={draft.amount} onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))} /></label>
              <label>Estado<select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="sales-span-2">Observaciones<textarea value={draft.observations} onChange={(event) => setDraft((current) => ({ ...current, observations: event.target.value }))} /></label>
            </div>
          </section>
        </FloatingModal>
      )}
    </ModulePageLayout>
  )
}

function invoiceBalance(invoice, payments = []) {
  const total = toNumber(invoice.totals?.total || invoice.total)
  const paidFromInvoice = toNumber(invoice.totals?.paid || invoice.paid || invoice.amountPaid)
  const paidFromPayments = payments
    .filter((payment) => payment.invoiceNumber === invoice.number)
    .reduce((sum, payment) => sum + toNumber(payment.amount), 0)
  const paid = Math.max(paidFromInvoice, paidFromPayments)
  return {
    total,
    paid,
    balance: Math.max(total - paid, 0),
  }
}

export function AccountsReceivablePage({ controls, onAction, searchValue, onSearchChange }) {
  const [invoices, setInvoices] = useState(() => readArray(INVOICES_KEY))
  const [payments, setPayments] = useState(() => readArray(PAYMENTS_KEY))
  const [selectedNumber, setSelectedNumber] = useState('')
  const [paymentDraft, setPaymentDraft] = useState(null)
  const receivables = useMemo(() => invoices.map((invoice) => {
    const balance = invoiceBalance(invoice, payments)
    const dueDate = invoice.dueDate || invoice.expirationDate || ''
    const isOverdue = dueDate && new Date(dueDate).getTime() < Date.now() && balance.balance > 0
    return { ...invoice, ...balance, dueDate, status: balance.balance <= 0 ? 'Pagada' : isOverdue ? 'Vencida' : balance.paid > 0 ? 'Parcial' : 'Pendiente' }
  }).filter((invoice) => invoice.balance > 0 || ['Credito', 'Pendiente', 'Parcial', 'Vencida'].includes(invoice.paymentMethod || invoice.state || invoice.status)), [invoices, payments])
  const selected = receivables.find((item) => item.number === selectedNumber)
  const filtered = useMemo(() => {
    const query = cleanText(searchValue)
    return receivables.filter((item) => !query || [item.number, item.customer, item.customerCode, item.status].some((value) => cleanText(value).includes(query)))
  }, [receivables, searchValue])

  const openPayment = (invoice = selected) => {
    if (!invoice) return
    setPaymentDraft({ id: makeId('payment'), date: today(), invoiceNumber: invoice.number, customer: invoice.customer, amount: invoice.balance, method: 'Efectivo', bank: '', reference: '', observations: '' })
  }

  const savePayment = () => {
    if (!paymentDraft?.invoiceNumber || toNumber(paymentDraft.amount) <= 0) {
      onAction?.('Debe indicar factura y monto a cobrar.')
      return
    }
    const nextPayments = [{ ...paymentDraft, createdAt: nowIso() }, ...payments]
    const nextInvoices = invoices.map((invoice) => {
      if (invoice.number !== paymentDraft.invoiceNumber) return invoice
      const nextBalance = invoiceBalance(invoice, nextPayments)
      return {
        ...invoice,
        paid: nextBalance.paid,
        balance: nextBalance.balance,
        state: nextBalance.balance <= 0 ? 'Pagada' : 'Pendiente',
        totals: { ...(invoice.totals || {}), paid: nextBalance.paid, balance: nextBalance.balance },
      }
    })
    setPayments(nextPayments)
    setInvoices(nextInvoices)
    writeArray(PAYMENTS_KEY, nextPayments)
    writeArray(INVOICES_KEY, nextInvoices)
    setPaymentDraft(null)
    onAction?.('Cobro registrado correctamente.')
  }

  return (
    <ModulePageLayout
      title="Cuentas por cobrar"
      moduleLabel="Ventas"
      breadcrumb={['Ventas', 'Cuentas por cobrar']}
      description="Consulta facturas pendientes y registra cobros de clientes."
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      actions={[
        { id: 'pay', label: 'Registrar cobro', icon: CreditCard, variant: 'primary', disabled: !selected, onClick: () => openPayment() },
        { id: 'view', label: 'Ver factura', icon: Eye, disabled: !selected, onClick: () => onAction?.(`Factura ${selected?.number}`) },
        { id: 'print', label: 'Imprimir recibo', icon: Printer, disabled: !selected, onClick: () => window.print() },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('cuentas-por-cobrar.json', receivables) },
      ]}
      statusCards={[
        { label: 'Pendientes', value: receivables.filter((item) => item.balance > 0).length },
        { label: 'Vencidas', value: receivables.filter((item) => item.status === 'Vencida').length },
        { label: 'Balance', value: currency(receivables.reduce((sum, item) => sum + toNumber(item.balance), 0)) },
        { label: 'Cobros', value: payments.length },
      ]}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      <section className="erp-panel">
        <div className="sales-table-wrap">
          <table className="sales-table">
            <thead><tr><th>Cliente</th><th>Factura</th><th>Fecha</th><th>Vencimiento</th><th>Total</th><th>Pagado</th><th>Balance</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan="9" className="sales-empty-cell">No hay cuentas por cobrar pendientes.</td></tr>}
              {filtered.map((item) => (
                <tr key={item.number} className={selectedNumber === item.number ? 'is-selected' : ''} onClick={() => setSelectedNumber(item.number)}>
                  <td>{item.customer}</td><td><strong>{item.number}</strong></td><td>{item.date}</td><td>{item.dueDate || 'N/D'}</td><td>{currency(item.total)}</td><td>{currency(item.paid)}</td><td>{currency(item.balance)}</td><td><span className={`sales-state-badge ${statusClass(item.status)}`}>{item.status}</span></td>
                  <td><div className="sales-row-actions"><IconButton title="Registrar cobro" onClick={() => openPayment(item)}><CreditCard size={15} /></IconButton><IconButton title="Ver factura" onClick={() => setSelectedNumber(item.number)}><Eye size={15} /></IconButton><IconButton title="Imprimir recibo" onClick={() => window.print()}><Printer size={15} /></IconButton></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {paymentDraft && (
        <FloatingModal title="Registrar cobro" subtitle={paymentDraft.invoiceNumber} onClose={() => setPaymentDraft(null)} wide={false} footer={<><button type="button" onClick={() => setPaymentDraft(null)}>Cancelar</button><button type="button" className="sales-primary-button" onClick={savePayment}><Save size={16} /> Guardar cobro</button></>}>
          <section className="sales-modal-section">
            <div className="sales-operation-grid">
              <label>Fecha<input type="date" value={paymentDraft.date} onChange={(event) => setPaymentDraft((current) => ({ ...current, date: event.target.value }))} /></label>
              <label>Cliente<input value={paymentDraft.customer} readOnly /></label>
              <label>Factura<input value={paymentDraft.invoiceNumber} readOnly /></label>
              <label>Monto<input type="number" value={paymentDraft.amount} onChange={(event) => setPaymentDraft((current) => ({ ...current, amount: event.target.value }))} /></label>
              <label>Forma de pago<select value={paymentDraft.method} onChange={(event) => setPaymentDraft((current) => ({ ...current, method: event.target.value }))}>{['Efectivo', 'Transferencia', 'Tarjeta', 'Cheque', 'Otro'].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label>Banco / caja<input value={paymentDraft.bank} onChange={(event) => setPaymentDraft((current) => ({ ...current, bank: event.target.value }))} /></label>
              <label>Referencia<input value={paymentDraft.reference} onChange={(event) => setPaymentDraft((current) => ({ ...current, reference: event.target.value }))} /></label>
              <label className="sales-span-2">Observaciones<textarea value={paymentDraft.observations} onChange={(event) => setPaymentDraft((current) => ({ ...current, observations: event.target.value }))} /></label>
            </div>
          </section>
        </FloatingModal>
      )}
    </ModulePageLayout>
  )
}

export function SalesHistoryPage({ controls, searchValue, onSearchChange }) {
  const invoices = readArray(INVOICES_KEY).map((item) => ({ id: `invoice-${item.number}`, type: 'Factura', number: item.number, date: item.date, customer: item.customer, total: item.totals?.total || item.total, status: item.state || item.status, user: item.seller || 'Administrador' }))
  const quotes = readArray(QUOTES_KEY).map((item) => ({ id: `quote-${item.number}`, type: 'Cotizacion', number: item.number, date: item.date, customer: item.customer?.name || item.customerName || item.customer, total: item.totals?.total || item.total, status: item.state || item.status, user: item.seller || 'Administrador' }))
  const orders = readArray(ORDERS_KEY).map((item) => ({ id: `order-${item.number}`, type: 'Pedido', number: item.number, date: item.date, customer: item.customer, total: item.totals?.total, status: item.status, user: item.seller || 'Administrador' }))
  const returns = readArray(RETURNS_KEY).map((item) => ({ id: `return-${item.number}`, type: 'Devolucion', number: item.number, date: item.date, customer: item.customer, total: item.totals?.total, status: item.status, user: 'Administrador' }))
  const notes = readArray(CREDIT_NOTES_KEY).map((item) => ({ id: `note-${item.number}`, type: 'Nota de credito', number: item.number, date: item.date, customer: item.customer, total: item.amount, status: item.status, user: 'Administrador' }))
  const payments = readArray(PAYMENTS_KEY).map((item) => ({ id: `payment-${item.id}`, type: 'Cobro', number: item.reference || item.invoiceNumber, date: item.date, customer: item.customer, total: item.amount, status: 'Registrado', user: 'Administrador' }))
  const reports = readArray(REPORTS_KEY)
  const records = [...invoices, ...quotes, ...orders, ...returns, ...notes, ...payments].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
  const [selected, setSelected] = useState(null)
  const filtered = useMemo(() => {
    const query = cleanText(searchValue)
    return records.filter((record) => !query || [record.type, record.number, record.customer, record.status, record.user].some((value) => cleanText(value).includes(query)))
  }, [records, searchValue])

  return (
    <ModulePageLayout
      title="Historial de ventas"
      moduleLabel="Ventas"
      breadcrumb={['Ventas', 'Historial de ventas']}
      description="Historial consolidado de facturas, cotizaciones, pedidos, devoluciones, notas y cobros."
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      actions={[
        { id: 'view', label: 'Ver documento', icon: Eye, disabled: !selected, onClick: () => {} },
        { id: 'print', label: 'Reimprimir', icon: Printer, disabled: !selected, onClick: () => window.print() },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('historial-ventas.json', records) },
      ]}
      statusCards={[
        { label: 'Documentos', value: records.length },
        { label: 'Facturas', value: invoices.length },
        { label: 'Cobros', value: payments.length },
        { label: 'Reportes', value: reports.length },
      ]}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      <section className="erp-panel">
        <div className="sales-table-wrap">
          <table className="sales-table">
            <thead><tr><th>Fecha</th><th>Tipo documento</th><th>Numero</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Usuario</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan="8" className="sales-empty-cell">No hay historial con esa busqueda.</td></tr>}
              {filtered.map((item) => (
                <tr key={item.id} className={selected?.id === item.id ? 'is-selected' : ''} onClick={() => setSelected(item)}>
                  <td>{item.date}</td><td>{item.type}</td><td><strong>{item.number}</strong></td><td>{item.customer}</td><td>{currency(item.total)}</td><td><span className={`sales-state-badge ${statusClass(item.status)}`}>{item.status || 'N/D'}</span></td><td>{item.user}</td>
                  <td><div className="sales-row-actions"><IconButton title="Ver documento" onClick={() => setSelected(item)}><Eye size={15} /></IconButton><IconButton title="Reimprimir" onClick={() => window.print()}><Printer size={15} /></IconButton><IconButton title="Exportar" onClick={() => exportJson(`${item.type}-${item.number}.json`, item)}><Download size={15} /></IconButton></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {selected && (
        <FloatingModal title="Detalle de historial" subtitle={selected.number} onClose={() => setSelected(null)} wide={false} footer={<button type="button" onClick={() => setSelected(null)}>Cerrar</button>}>
          <section className="sales-modal-section">
            <div className="sales-client-summary">
              <article><span>Documento</span><strong>{selected.type}</strong></article>
              <article><span>Numero</span><strong>{selected.number}</strong></article>
              <article><span>Cliente</span><strong>{selected.customer}</strong></article>
              <article><span>Total</span><strong>{currency(selected.total)}</strong></article>
            </div>
          </section>
        </FloatingModal>
      )}
    </ModulePageLayout>
  )
}
