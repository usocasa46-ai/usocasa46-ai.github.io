import {
  Download,
  Printer,
  RefreshCcw,
  Search,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import './ReportsModulePages.css'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function safeParse(key, fallback = []) {
  if (!canUseStorage()) return fallback
  try {
    const saved = localStorage.getItem(key)
    const parsed = saved ? JSON.parse(saved) : fallback
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function cleanText(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function toNumber(value) {
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function currency(value) {
  return `RD$ ${toNumber(value).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function dateValue(row) {
  return String(row.date || row.fecha || row.createdAt || row.updatedAt || '').slice(0, 10)
}

function documentValue(row) {
  return row.document || row.number || row.numero || row.ncf || row.code || row.id || 'N/D'
}

function exportCsv(filename, rows, columns) {
  if (typeof document === 'undefined') return
  const header = columns.map((column) => column.label).join(',')
  const body = rows.map((row) => columns.map((column) => `"${String(column.render ? column.render(row, true) : row[column.key] ?? '').replaceAll('"', '""')}"`).join(','))
  const blob = new Blob([[header, ...body].join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function normalizeSalesRows() {
  const invoices = safeParse('invefat_sales_invoices').map((item) => ({
    type: item.origin === 'POS' || item.source === 'POS' ? 'Factura POS' : 'Factura',
    date: item.date,
    document: item.number,
    ncf: item.ncf || '',
    party: item.customer || item.customerName || 'Cliente',
    total: item.totals?.total || item.total,
    paymentMethod: item.paymentMethod || item.formaPago || 'N/D',
    status: item.state || item.status || 'Guardada',
    user: item.seller || item.user || item.createdBy || 'Administrador',
  }))
  const quotes = safeParse('invefat_sales_quotes').map((item) => ({
    type: 'Cotizacion',
    date: item.date,
    document: item.number,
    ncf: '',
    party: item.customer || item.customerName || 'Cliente',
    total: item.totals?.total || item.total,
    paymentMethod: item.paymentCondition || 'N/D',
    status: item.status || 'Emitida',
    user: item.seller || item.user || 'Administrador',
  }))
  const returns = safeParse('invefat_sales_returns').map((item) => ({
    type: 'Devolucion',
    date: item.date,
    document: item.number,
    ncf: item.ncf || '',
    party: item.customer || 'Cliente',
    total: item.total || item.totals?.total,
    paymentMethod: 'N/D',
    status: item.status || 'Aplicada',
    user: item.user || 'Administrador',
  }))
  const notes = safeParse('invefat_sales_credit_notes').map((item) => ({
    type: 'Nota de credito',
    date: item.date,
    document: item.number,
    ncf: item.ncf || item.creditNcf || '',
    party: item.customer || 'Cliente',
    total: item.total || item.totals?.total,
    paymentMethod: 'N/D',
    status: item.status || 'Aplicada',
    user: item.user || 'Administrador',
  }))
  const payments = safeParse('invefat_customer_payments').map((item) => ({
    type: 'Cobro',
    date: item.date,
    document: item.reference || item.number || item.invoiceNumber,
    ncf: '',
    party: item.customer || item.customerName || 'Cliente',
    total: item.amount || item.paid,
    paymentMethod: item.paymentMethod || item.formaPago || 'N/D',
    status: item.status || 'Registrado',
    user: item.user || 'Administrador',
  }))
  return [...invoices, ...quotes, ...returns, ...notes, ...payments]
}

function normalizePurchaseRows() {
  const orders = safeParse('invefat_purchase_orders').map((item) => ({
    type: 'Orden de compra',
    date: item.date,
    document: item.number,
    ncf: '',
    party: item.supplier || item.supplierName || 'Proveedor',
    total: item.total || item.totals?.total,
    paymentMethod: item.paymentCondition || 'N/D',
    status: item.status || 'Pendiente',
    user: item.user || item.responsible || 'Administrador',
  }))
  const receipts = safeParse('invefat_warehouse_receipts').map((item) => ({
    type: 'Recepcion',
    date: item.date || item.supplierInvoiceDate,
    document: item.number,
    ncf: item.supplierNcf || '',
    party: item.supplier || item.supplierName || 'Proveedor',
    total: item.supplierInvoiceAmount || item.total,
    paymentMethod: item.supplierPaymentMethod || item.paymentMethod || 'N/D',
    status: item.status || 'Recibida',
    user: item.user || item.responsible || 'Administrador',
  }))
  const invoices = safeParse('invefat_supplier_invoices').map((item) => ({
    type: 'Factura proveedor',
    date: item.date || item.supplierInvoiceDate,
    document: item.number || item.supplierInvoiceNumber,
    ncf: item.supplierNcf || item.ncf || '',
    party: item.supplier || item.supplierName || 'Proveedor',
    total: item.total || item.totals?.total,
    paymentMethod: item.paymentMethod || 'Credito',
    status: item.status || 'Pendiente',
    user: item.user || 'Administrador',
  }))
  const payments = safeParse('invefat_supplier_payments').map((item) => ({
    type: 'Pago proveedor',
    date: item.date,
    document: item.reference || item.number || item.invoiceNumber,
    ncf: item.supplierNcf || '',
    party: item.supplier || item.supplierName || 'Proveedor',
    total: item.amount || item.paid,
    paymentMethod: item.paymentMethod || 'N/D',
    status: item.status || 'Registrado',
    user: item.user || 'Administrador',
  }))
  return [...orders, ...receipts, ...invoices, ...payments]
}

function normalizeInventoryRows() {
  const products = safeParse('inveFatInventoryProducts').map((item) => ({
    type: 'Producto',
    date: item.updatedAt || item.createdAt || '',
    document: item.code,
    party: item.name,
    category: item.category || 'N/D',
    warehouse: item.warehouse || 'General',
    entry: 0,
    exit: 0,
    stock: item.stock,
    status: item.status || 'Activo',
    total: toNumber(item.stock) * toNumber(item.cost),
  }))
  const movements = safeParse('invefat_inventory_movements').map((item) => ({
    type: item.type || 'Movimiento',
    date: item.date,
    document: item.document,
    party: item.productName || item.product || item.productCode,
    category: item.category || '',
    warehouse: item.warehouse || item.sourceWarehouse || item.targetWarehouse || 'N/D',
    entry: item.entry,
    exit: item.exit,
    stock: item.balance,
    status: item.status || 'Registrado',
    total: item.total || 0,
  }))
  return [...products, ...movements]
}

function normalizeWarehouseRows() {
  return [
    ...safeParse('invefat_warehouse_receipts').map((item) => ({ ...item, type: 'Recepcion', total: item.total || item.supplierInvoiceAmount })),
    ...safeParse('invefat_warehouse_dispatches').map((item) => ({ ...item, type: 'Despacho' })),
    ...safeParse('invefat_warehouse_transfers').map((item) => ({ ...item, type: 'Transferencia' })),
    ...safeParse('invefat_warehouse_returns').map((item) => ({ ...item, type: 'Devolucion' })),
    ...safeParse('invefat_warehouse_damages').map((item) => ({ ...item, type: 'Merma / averia' })),
    ...safeParse('invefat_warehouse_quarantine').map((item) => ({ ...item, type: 'Cuarentena' })),
  ].map((item) => ({
    type: item.type,
    date: item.date,
    document: item.number || item.document,
    party: item.supplier || item.customer || item.destination || item.productName || 'N/D',
    warehouse: item.warehouse || item.sourceWarehouse || item.targetWarehouse || item.target || 'N/D',
    total: item.total || item.amount || 0,
    status: item.status || item.estado || 'Registrado',
    user: item.user || item.responsible || 'Administrador',
  }))
}

function normalizeFinanceRows() {
  return [
    ...safeParse('invefat_customer_payments').map((item) => ({ ...item, type: 'Cobro cliente', party: item.customer || item.customerName, total: item.amount || item.paid })),
    ...safeParse('invefat_supplier_payments').map((item) => ({ ...item, type: 'Pago proveedor', party: item.supplier || item.supplierName, total: item.amount || item.paid })),
    ...safeParse('invefat_journal_entries').map((item) => ({ ...item, type: 'Asiento contable', party: item.description, total: (item.lines || []).reduce((sum, line) => sum + toNumber(line.debit), 0) })),
    ...safeParse('invefat_bank_movements').map((item) => ({ ...item, type: 'Movimiento banco', party: item.bank || item.reference, total: toNumber(item.entry) - toNumber(item.exit) })),
    ...safeParse('invefat_cash_movements').map((item) => ({ ...item, type: 'Caja chica', party: item.concept, total: toNumber(item.entry) - toNumber(item.exit) })),
  ].map((item) => ({
    type: item.type,
    date: item.date,
    document: item.number || item.reference || item.id,
    party: item.party || 'N/D',
    total: item.total,
    status: item.status || 'Registrado',
    user: item.user || 'Administrador',
  }))
}

function normalizeCustomerRows() {
  const invoices = safeParse('invefat_sales_invoices')
  return safeParse('invefat_customers').map((customer) => {
    const customerInvoices = invoices.filter((invoice) => invoice.customerCode === customer.code || invoice.fiscalId === customer.fiscalId)
    const total = customerInvoices.reduce((sum, invoice) => sum + toNumber(invoice.totals?.total || invoice.total), 0)
    return {
      type: 'Cliente',
      date: customer.updatedAt || customer.createdAt,
      document: customer.code,
      party: customer.tradeName || customer.name || customer.legalName,
      ncf: customer.fiscalId,
      total,
      status: customer.status || 'Activo',
      user: customer.seller || 'Administrador',
    }
  })
}

function normalizeSupplierRows() {
  const invoices = safeParse('invefat_supplier_invoices')
  return safeParse('invefat_suppliers').map((supplier) => {
    const supplierInvoices = invoices.filter((invoice) => invoice.supplierCode === supplier.code || invoice.fiscalId === supplier.fiscalId)
    const total = supplierInvoices.reduce((sum, invoice) => sum + toNumber(invoice.total || invoice.totals?.total), 0)
    return {
      type: 'Proveedor',
      date: supplier.updatedAt || supplier.createdAt,
      document: supplier.code,
      party: supplier.commercialName || supplier.name || supplier.legalName,
      ncf: supplier.fiscalId,
      total,
      status: supplier.status || 'Activo',
      user: supplier.contact || 'Administrador',
    }
  })
}

function normalizeUserRows() {
  return [
    ...safeParse('inveFatUsers').map((item) => ({ type: 'Usuario', date: item.createdAt, document: item.username, party: item.fullName, status: item.active === false ? 'Inactivo' : 'Activo', user: item.role })),
    ...safeParse('invefat_audit_log').map((item) => ({ type: 'Auditoria', date: item.date || item.fecha, document: item.action || item.accion, party: item.description || item.descripcion, status: item.module || item.modulo, user: item.user || item.usuario })),
  ]
}

function normalizeDgiiRows() {
  return [
    ...safeParse('invefat_dgii_606').map((item) => ({ ...item, type: 'DGII 606', date: item.fechaComprobante, document: item.ncfProveedor, party: item.razonSocialProveedor || item.rncProveedor, total: item.montoFacturado })),
    ...safeParse('invefat_dgii_607').map((item) => ({ ...item, type: 'DGII 607', date: item.fechaComprobante, document: item.ncfEmitido, party: item.razonSocialCliente || item.rncCliente, total: item.montoFacturado })),
    ...safeParse('invefat_ncf_used').map((item) => ({ ...item, type: 'NCF usado', date: item.fecha || item.date, document: item.NCF || item.ncf, party: item.clienteProveedor, total: item.total })),
    ...safeParse('invefat_ncf_sequences').map((item) => ({ ...item, type: 'Secuencia NCF', date: item.validUntil, document: item.prefix, party: item.description || item.type, total: Number(item.toNumber || 0) - Number(item.nextNumber || 0) + 1 })),
  ].map((item) => ({
    type: item.type,
    date: item.date,
    document: documentValue(item),
    ncf: item.ncfEmitido || item.ncfProveedor || item.NCF || item.ncf || item.prefix || '',
    party: item.party || 'N/D',
    total: item.total,
    status: item.estado || item.status || 'Registrado',
    user: item.usuario || item.user || 'Sistema',
  }))
}

function normalizeCustomRows() {
  return [
    { type: 'Ventas', document: 'Facturas', total: safeParse('invefat_sales_invoices').length, status: 'Disponible' },
    { type: 'Compras', document: 'Ordenes', total: safeParse('invefat_purchase_orders').length, status: 'Disponible' },
    { type: 'Inventario', document: 'Productos', total: safeParse('inveFatInventoryProducts').length, status: 'Disponible' },
    { type: 'Almacen', document: 'Recepciones', total: safeParse('invefat_warehouse_receipts').length, status: 'Disponible' },
    { type: 'Finanzas', document: 'Asientos', total: safeParse('invefat_journal_entries').length, status: 'Disponible' },
    { type: 'DGII', document: 'Registros', total: safeParse('invefat_dgii_606').length + safeParse('invefat_dgii_607').length, status: 'Disponible' },
  ]
}

const reportDefinitions = {
  sales: {
    title: 'Reportes de ventas',
    description: 'Facturas, POS, cotizaciones, devoluciones, notas de credito y cobros.',
    rows: normalizeSalesRows,
    file: 'reportes-ventas.csv',
  },
  purchases: {
    title: 'Reportes de compras',
    description: 'Ordenes, recepciones, facturas de proveedor y pagos.',
    rows: normalizePurchaseRows,
    file: 'reportes-compras.csv',
  },
  inventory: {
    title: 'Reportes de inventario',
    description: 'Productos, stock, kardex, movimientos y ajustes.',
    rows: normalizeInventoryRows,
    file: 'reportes-inventario.csv',
  },
  warehouse: {
    title: 'Reportes de almacen',
    description: 'Recepciones, despachos, transferencias, devoluciones y cuarentena.',
    rows: normalizeWarehouseRows,
    file: 'reportes-almacen.csv',
  },
  finance: {
    title: 'Reportes financieros',
    description: 'Cuentas por cobrar, cuentas por pagar, cobros, pagos, bancos y caja.',
    rows: normalizeFinanceRows,
    file: 'reportes-financieros.csv',
  },
  customers: {
    title: 'Reportes de clientes',
    description: 'Clientes, balances y actividad comercial.',
    rows: normalizeCustomerRows,
    file: 'reportes-clientes.csv',
  },
  suppliers: {
    title: 'Reportes de proveedores',
    description: 'Proveedores, balances y documentos de compra.',
    rows: normalizeSupplierRows,
    file: 'reportes-proveedores.csv',
  },
  users: {
    title: 'Reportes de usuarios',
    description: 'Usuarios, roles y auditoria disponible.',
    rows: normalizeUserRows,
    file: 'reportes-usuarios.csv',
  },
  dgii: {
    title: 'Reportes DGII',
    description: '606, 607, NCF usados, secuencias disponibles y errores fiscales.',
    rows: normalizeDgiiRows,
    file: 'reportes-dgii.csv',
  },
  custom: {
    title: 'Reportes personalizados',
    description: 'Vista base para combinar datos de modulos y crear reportes propios.',
    rows: normalizeCustomRows,
    file: 'reportes-personalizados.csv',
  },
}

const columns = [
  { key: 'date', label: 'Fecha', render: (row) => dateValue(row) || 'N/D' },
  { key: 'type', label: 'Tipo' },
  { key: 'document', label: 'Documento', render: (row) => documentValue(row) },
  { key: 'ncf', label: 'NCF' },
  { key: 'party', label: 'Cliente / proveedor / concepto' },
  { key: 'total', label: 'Total', render: (row, raw) => raw ? toNumber(row.total) : currency(row.total) },
  { key: 'paymentMethod', label: 'Forma pago' },
  { key: 'status', label: 'Estado' },
  { key: 'user', label: 'Usuario' },
]

function ReportPage({ type = 'sales', controls, searchValue = '', onSearchChange }) {
  const definition = reportDefinitions[type] || reportDefinitions.sales
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', party: '', status: 'Todos', document: '', paymentMethod: '', ncf: '' })
  const [refreshKey, setRefreshKey] = useState(0)
  const rows = useMemo(() => definition.rows(), [definition, refreshKey])

  const filtered = useMemo(() => {
    const global = cleanText(searchValue)
    return rows.filter((row) => {
      const rowDate = dateValue(row)
      const matchesGlobal = !global || Object.values(row).some((value) => cleanText(value).includes(global))
      const matchesDateFrom = !filters.dateFrom || !rowDate || rowDate >= filters.dateFrom
      const matchesDateTo = !filters.dateTo || !rowDate || rowDate <= filters.dateTo
      const matchesParty = !filters.party || cleanText(row.party).includes(cleanText(filters.party))
      const matchesDocument = !filters.document || cleanText(documentValue(row)).includes(cleanText(filters.document))
      const matchesPayment = !filters.paymentMethod || cleanText(row.paymentMethod).includes(cleanText(filters.paymentMethod))
      const matchesNcf = !filters.ncf || cleanText(row.ncf).includes(cleanText(filters.ncf))
      const matchesStatus = filters.status === 'Todos' || cleanText(row.status).includes(cleanText(filters.status))
      return matchesGlobal && matchesDateFrom && matchesDateTo && matchesParty && matchesDocument && matchesPayment && matchesNcf && matchesStatus
    })
  }, [filters, rows, searchValue])

  const statusOptions = useMemo(() => ['Todos', ...Array.from(new Set(rows.map((row) => row.status).filter(Boolean))).slice(0, 12)], [rows])
  const total = filtered.reduce((sum, row) => sum + toNumber(row.total), 0)
  const withErrors = filtered.filter((row) => cleanText(row.status).includes('error') || cleanText(row.status).includes('advert')).length

  const updateFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }))
  const clearFilters = () => setFilters({ dateFrom: '', dateTo: '', party: '', status: 'Todos', document: '', paymentMethod: '', ncf: '' })

  return (
    <ModulePageLayout
      title={definition.title}
      moduleLabel="Reportes"
      breadcrumb={['Reportes', definition.title]}
      description={definition.description}
      searchValue={searchValue}
      searchPlaceholder={`Buscar en ${definition.title}`}
      onSearchChange={onSearchChange}
      controls={controls}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
      actions={[
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportCsv(definition.file, filtered, columns) },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
        { id: 'clear', label: 'Limpiar filtros', icon: RefreshCcw, onClick: clearFilters },
        { id: 'exit', label: 'Salir', icon: X, onClick: controls?.onClose },
      ]}
    >
      <section className="reports-page">
        <div className="reports-summary-grid">
          <article><span>Registros</span><strong>{filtered.length.toLocaleString('es-DO')}</strong></article>
          <article><span>Total</span><strong>{currency(total)}</strong></article>
          <article><span>Estados distintos</span><strong>{statusOptions.length - 1}</strong></article>
          <article><span>Alertas fiscales</span><strong>{withErrors}</strong></article>
        </div>

        <section className="reports-panel reports-filter-panel">
          <div className="reports-filter-title">
            <Search size={16} />
            <strong>Filtros del reporte</strong>
          </div>
          <div className="reports-filter-grid">
            <label>Fecha desde<input type="date" value={filters.dateFrom} onChange={(event) => updateFilter('dateFrom', event.target.value)} /></label>
            <label>Fecha hasta<input type="date" value={filters.dateTo} onChange={(event) => updateFilter('dateTo', event.target.value)} /></label>
            <label>Cliente / proveedor<input value={filters.party} onChange={(event) => updateFilter('party', event.target.value)} /></label>
            <label>Documento<input value={filters.document} onChange={(event) => updateFilter('document', event.target.value)} /></label>
            <label>NCF<input value={filters.ncf} onChange={(event) => updateFilter('ncf', event.target.value)} /></label>
            <label>Forma de pago<input value={filters.paymentMethod} onChange={(event) => updateFilter('paymentMethod', event.target.value)} /></label>
            <label>Estado<select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
            <button type="button" onClick={() => setRefreshKey((current) => current + 1)}><RefreshCcw size={15} /> Refrescar</button>
          </div>
        </section>

        <section className="reports-panel">
          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((row, index) => (
                  <tr key={`${documentValue(row)}-${index}`}>
                    {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] || 'N/D'}</td>)}
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={columns.length} className="reports-empty">No hay registros para mostrar con esos filtros.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </ModulePageLayout>
  )
}

export function SalesReportsPage(props) {
  return <ReportPage {...props} type="sales" />
}

export function PurchaseReportsPage(props) {
  return <ReportPage {...props} type="purchases" />
}

export function InventoryReportsPage(props) {
  return <ReportPage {...props} type="inventory" />
}

export function WarehouseReportsPage(props) {
  return <ReportPage {...props} type="warehouse" />
}

export function FinancialReportsPage(props) {
  return <ReportPage {...props} type="finance" />
}

export function CustomerReportsPage(props) {
  return <ReportPage {...props} type="customers" />
}

export function SupplierReportsPage(props) {
  return <ReportPage {...props} type="suppliers" />
}

export function UserReportsPage(props) {
  return <ReportPage {...props} type="users" />
}

export function DgiiReportsPage(props) {
  return <ReportPage {...props} type="dgii" />
}

export function CustomReportsPage(props) {
  return <ReportPage {...props} type="custom" />
}
