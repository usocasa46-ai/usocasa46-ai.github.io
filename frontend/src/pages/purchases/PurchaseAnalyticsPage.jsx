import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Download,
  PackageSearch,
  RefreshCcw,
  ShoppingCart,
  Truck,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import { getRecordsByCompany } from '../../services/dataClient.js'
import { productsService } from '../../services/productsService.js'
import { suppliersService } from '../../services/suppliersService.js'
import { invoicesService } from '../../services/invoicesService.js'
import {
  buildPurchaseAnalytics,
  formatAnalyticsCurrency,
  formatAnalyticsNumber,
} from '../../utils/analytics/purchaseAnalytics.js'
import './PurchaseAnalyticsPage.css'

const DATA_SOURCES = {
  purchaseOrders: ['purchase_orders', 'invefat_purchase_orders'],
  supplierInvoices: ['supplier_invoices', 'invefat_supplier_invoices'],
  warehouseReceipts: ['warehouse_receipts', 'invefat_warehouse_receipts'],
  warehouses: ['warehouses', 'invefat_warehouses'],
}

const DEFAULT_FILTERS = {
  from: '',
  to: '',
  supplier: 'Todos',
  category: 'Todos',
  warehouse: 'Todos',
  product: '',
  receptionStatus: 'Todos',
  comprobanteType: 'Todos',
}

function toArray(value) {
  return Array.isArray(value) ? value : []
}

function exportWorkbook(filename, sheets) {
  const workbook = XLSX.utils.book_new()
  Object.entries(sheets).forEach(([sheetName, rows]) => {
    const sheet = XLSX.utils.json_to_sheet(toArray(rows))
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName.slice(0, 31))
  })
  XLSX.writeFile(workbook, filename)
}

function uniqueOptions(values, fallback = 'Todos') {
  const clean = Array.from(new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))).sort()
  return [fallback, ...clean]
}

function formatDateTime() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
}

function EmptyNotice({ message = 'No hay datos suficientes para este análisis.' }) {
  return (
    <div className="purchase-analytics-empty">
      <PackageSearch size={22} />
      <strong>{message}</strong>
      <span>Cuando existan compras, ventas, productos, proveedores o recepciones de esta empresa, el tablero calculará los indicadores automáticamente.</span>
    </div>
  )
}

function DataTable({ columns, rows, emptyMessage }) {
  if (!rows.length) return <EmptyNotice message={emptyMessage} />
  return (
    <div className="purchase-analytics-table-wrap">
      <table className="purchase-analytics-table">
        <thead>
          <tr>
            {columns.map((column) => <th key={column.key}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.code || row.number || row.supplier || 'row'}-${index}`}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PurchaseAnalyticsPage({
  controls,
  searchValue = '',
  onSearchChange,
  onAction,
}) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    products: [],
    suppliers: [],
    purchaseOrders: [],
    supplierInvoices: [],
    warehouseReceipts: [],
    invoices: [],
    warehouses: [],
  })
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const loadData = async () => {
    setLoading(true)
    try {
      const [
        products,
        suppliers,
        invoices,
        purchaseOrders,
        supplierInvoices,
        warehouseReceipts,
        warehouses,
      ] = await Promise.all([
        productsService.getAll(),
        suppliersService.getAll(),
        invoicesService.getAll(),
        getRecordsByCompany(...DATA_SOURCES.purchaseOrders),
        getRecordsByCompany(...DATA_SOURCES.supplierInvoices),
        getRecordsByCompany(...DATA_SOURCES.warehouseReceipts),
        getRecordsByCompany(...DATA_SOURCES.warehouses),
      ])

      setData({
        products: toArray(products),
        suppliers: toArray(suppliers),
        invoices: toArray(invoices),
        purchaseOrders: toArray(purchaseOrders),
        supplierInvoices: toArray(supplierInvoices),
        warehouseReceipts: toArray(warehouseReceipts),
        warehouses: toArray(warehouses),
      })
    } catch (error) {
      console.error('No se pudo cargar el análisis de compras:', error)
      onAction?.('No se pudo cargar el análisis de compras.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filterOptions = useMemo(() => ({
    suppliers: uniqueOptions([
      ...data.suppliers.map((supplier) => supplier.code || supplier.commercialName || supplier.name),
      ...data.products.map((product) => product.supplierCode || product.supplierName),
    ]),
    categories: uniqueOptions(data.products.map((product) => product.category || product.categoria || 'Sin categoría')),
    warehouses: uniqueOptions([
      ...data.warehouses.map((warehouse) => warehouse.code || warehouse.name),
      ...data.products.map((product) => product.warehouse || product.almacen),
    ]),
    receptionStatuses: uniqueOptions(data.warehouseReceipts.map((receipt) => receipt.status || receipt.estado)),
  }), [data])

  const mergedFilters = useMemo(() => ({
    ...filters,
    product: searchValue || filters.product,
  }), [filters, searchValue])

  const analytics = useMemo(() => buildPurchaseAnalytics({ ...data, filters: mergedFilters }), [data, mergedFilters])
  const visibleTop = analytics.topSoldRows.slice(0, 20)
  const visibleLowRotation = analytics.lowRotationRows.slice(0, 30)

  const exportGeneral = () => {
    exportWorkbook(`analisis-compras-${formatDateTime()}.xlsx`, {
      General: [
        { Indicador: 'Total comprado', Valor: analytics.kpis.totalBought },
        { Indicador: 'Total vendido', Valor: analytics.kpis.totalSold },
        { Indicador: 'Margen estimado', Valor: analytics.kpis.margin },
        { Indicador: 'Recepciones completas', Valor: analytics.kpis.completeReceipts },
        { Indicador: 'Recepciones parciales', Valor: analytics.kpis.partialReceipts },
        { Indicador: 'Ordenes pendientes', Valor: analytics.kpis.pendingOrders },
      ],
      Productos: analytics.productRows,
      Proveedores: analytics.supplierRows,
      Recepciones: analytics.receptionRows,
    })
  }

  const exportSheet = (sheetName, rows) => {
    exportWorkbook(`${sheetName.toLowerCase().replace(/\s+/g, '-')}-${formatDateTime()}.xlsx`, {
      [sheetName]: rows,
    })
  }

  const productColumns = [
    { key: 'code', label: 'Código' },
    { key: 'product', label: 'Producto' },
    { key: 'supplier', label: 'Proveedor' },
    { key: 'category', label: 'Categoría' },
    { key: 'quantitySold', label: 'Cantidad vendida', render: formatAnalyticsNumber },
    { key: 'revenue', label: 'Ingreso generado', render: formatAnalyticsCurrency },
    { key: 'estimatedCost', label: 'Costo estimado', render: formatAnalyticsCurrency },
    { key: 'margin', label: 'Margen', render: formatAnalyticsCurrency },
    { key: 'lastSale', label: 'Última venta' },
    { key: 'stock', label: 'Stock', render: formatAnalyticsNumber },
    { key: 'status', label: 'Estado', render: (value) => <span className="purchase-analytics-badge">{value}</span> },
  ]

  const supplierColumns = [
    { key: 'supplier', label: 'Proveedor' },
    { key: 'ordersGenerated', label: 'Órdenes generadas', render: formatAnalyticsNumber },
    { key: 'ordersReceived', label: 'Órdenes recibidas', render: formatAnalyticsNumber },
    { key: 'completeReceipts', label: 'Completas', render: formatAnalyticsNumber },
    { key: 'partialReceipts', label: 'Parciales', render: formatAnalyticsNumber },
    { key: 'avgDeliveryDays', label: 'Días promedio', render: formatAnalyticsNumber },
    { key: 'totalPurchased', label: 'Monto comprado', render: formatAnalyticsCurrency },
    { key: 'compliance', label: 'Cumplimiento %', render: (value) => `${formatAnalyticsNumber(value)}%` },
    { key: 'status', label: 'Estado', render: (value) => <span className="purchase-analytics-badge">{value}</span> },
  ]

  const receptionColumns = [
    { key: 'number', label: 'Recepción' },
    { key: 'orderNumber', label: 'Orden' },
    { key: 'supplier', label: 'Proveedor' },
    { key: 'ordered', label: 'Ordenado', render: formatAnalyticsNumber },
    { key: 'received', label: 'Recibido', render: formatAnalyticsNumber },
    { key: 'difference', label: 'Diferencia', render: formatAnalyticsNumber },
    { key: 'orderDate', label: 'Fecha orden' },
    { key: 'receiptDate', label: 'Fecha recepción' },
    { key: 'elapsedDays', label: 'Días', render: formatAnalyticsNumber },
    { key: 'status', label: 'Estado', render: (value) => <span className="purchase-analytics-badge">{value}</span> },
  ]

  return (
    <ModulePageLayout
      title="Análisis de datos"
      moduleLabel="Compras"
      description="Analiza compras, ventas, inventario, proveedores y recepciones con datos de la empresa actual."
      breadcrumb={['Compras', 'Análisis de datos']}
      searchValue={searchValue}
      searchPlaceholder="Buscar producto, código o proveedor"
      onSearchChange={onSearchChange}
      actions={[
        { id: 'refresh', label: loading ? 'Cargando' : 'Actualizar', icon: RefreshCcw, onClick: loadData, disabled: loading },
        { id: 'export', label: 'Exportar general', icon: Download, onClick: exportGeneral, variant: 'primary' },
      ]}
      statusCards={[
        { label: 'Total comprado', value: formatAnalyticsCurrency(analytics.kpis.totalBought), detail: 'Compras y recepciones' },
        { label: 'Total vendido', value: formatAnalyticsCurrency(analytics.kpis.totalSold), detail: 'Ventas del rango' },
        { label: 'Margen estimado', value: formatAnalyticsCurrency(analytics.kpis.margin), detail: 'Venta menos costo' },
        { label: 'Stock bajo', value: analytics.kpis.lowStockProducts, detail: 'Productos críticos' },
      ]}
      {...controls}
    >
      <div className="purchase-analytics-page">
        <section className="purchase-analytics-panel purchase-analytics-filters">
          <label>Desde<input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></label>
          <label>Hasta<input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></label>
          <label>Proveedor<select value={filters.supplier} onChange={(event) => setFilters((current) => ({ ...current, supplier: event.target.value }))}>{filterOptions.suppliers.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label>Categoría<select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}>{filterOptions.categories.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label>Almacén<select value={filters.warehouse} onChange={(event) => setFilters((current) => ({ ...current, warehouse: event.target.value }))}>{filterOptions.warehouses.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label>Producto<input value={filters.product} onChange={(event) => setFilters((current) => ({ ...current, product: event.target.value }))} placeholder="Código o nombre" /></label>
          <label>Estado recepción<select value={filters.receptionStatus} onChange={(event) => setFilters((current) => ({ ...current, receptionStatus: event.target.value }))}>{filterOptions.receptionStatuses.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label>Tipo comprobante<select value={filters.comprobanteType} onChange={(event) => setFilters((current) => ({ ...current, comprobanteType: event.target.value }))}><option>Todos</option><option>Fiscal</option><option>Consumo</option><option>Proveedor</option></select></label>
        </section>

        <section className="purchase-analytics-kpi-grid">
          <article><ShoppingCart size={19} /><span>Productos más vendidos</span><strong>{analytics.kpis.topProducts}</strong></article>
          <article><PackageSearch size={19} /><span>Baja rotación</span><strong>{analytics.kpis.lowRotation}</strong></article>
          <article><AlertTriangle size={19} /><span>Productos sin venta</span><strong>{analytics.kpis.noSale}</strong></article>
          <article><Truck size={19} /><span>Proveedor más rápido</span><strong>{analytics.kpis.fastestSupplier}</strong></article>
          <article><Truck size={19} /><span>Más retrasos</span><strong>{analytics.kpis.delayedSupplier}</strong></article>
          <article><BarChart3 size={19} /><span>Recepciones completas</span><strong>{analytics.kpis.completeReceipts}</strong></article>
          <article><BarChart3 size={19} /><span>Recepciones parciales</span><strong>{analytics.kpis.partialReceipts}</strong></article>
          <article><AlertTriangle size={19} /><span>Órdenes pendientes</span><strong>{analytics.kpis.pendingOrders}</strong></article>
        </section>

        {!analytics.hasData && <EmptyNotice />}

        <section className="purchase-analytics-section">
          <div className="purchase-analytics-section-head">
            <div><span>Ventas</span><h2>Análisis de ventas por producto</h2></div>
            <button type="button" onClick={() => exportSheet('Productos', analytics.productRows)}><Download size={16} /> Exportar .xlsx</button>
          </div>
          <DataTable columns={productColumns} rows={analytics.productRows.slice(0, 60)} emptyMessage="No hay ventas o productos suficientes para analizar." />
        </section>

        <section className="purchase-analytics-two-columns">
          <div className="purchase-analytics-section">
            <div className="purchase-analytics-section-head">
              <div><span>Top</span><h2>Productos más vendidos</h2></div>
              <button type="button" onClick={() => exportSheet('Productos mas vendidos', visibleTop)}><Download size={16} /> Exportar</button>
            </div>
            <DataTable columns={productColumns.slice(0, 7)} rows={visibleTop} emptyMessage="Todavía no hay productos vendidos en este rango." />
          </div>

          <div className="purchase-analytics-section">
            <div className="purchase-analytics-section-head">
              <div><span>Rotación</span><h2>Productos de baja rotación</h2></div>
              <button type="button" onClick={() => exportSheet('Baja rotacion', visibleLowRotation)}><Download size={16} /> Exportar</button>
            </div>
            <DataTable columns={[
              { key: 'code', label: 'Código' },
              { key: 'product', label: 'Producto' },
              { key: 'stock', label: 'Stock', render: formatAnalyticsNumber },
              { key: 'quantitySold', label: 'Venta', render: formatAnalyticsNumber },
              { key: 'status', label: 'Estado', render: (value) => <span className="purchase-analytics-badge">{value}</span> },
            ]} rows={visibleLowRotation} emptyMessage="No se detectaron productos de baja rotación." />
          </div>
        </section>

        <section className="purchase-analytics-section">
          <div className="purchase-analytics-section-head">
            <div><span>Proveedores</span><h2>Rendimiento de proveedores</h2></div>
            <button type="button" onClick={() => exportSheet('Proveedores', analytics.supplierRows)}><Download size={16} /> Exportar .xlsx</button>
          </div>
          <DataTable columns={supplierColumns} rows={analytics.supplierRows} emptyMessage="No hay proveedores u órdenes suficientes para evaluar rendimiento." />
        </section>

        <section className="purchase-analytics-section">
          <div className="purchase-analytics-section-head">
            <div><span>Recepciones</span><h2>Recepciones completas y parciales</h2></div>
            <button type="button" onClick={() => exportSheet('Recepciones', analytics.receptionRows)}><Download size={16} /> Exportar .xlsx</button>
          </div>
          <DataTable columns={receptionColumns} rows={analytics.receptionRows} emptyMessage="No hay recepciones registradas para el rango seleccionado." />
        </section>

        <section className="purchase-analytics-alerts">
          <div className="purchase-analytics-section-head">
            <div><span>Recomendaciones</span><h2>Alertas inteligentes</h2></div>
          </div>
          <div className="purchase-analytics-alert-grid">
            {analytics.alerts.map((alert) => (
              <article key={`${alert.type}-${alert.message}`}>
                <AlertTriangle size={18} />
                <div>
                  <strong>{alert.type}</strong>
                  <p>{alert.message}</p>
                  <small>{alert.action}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </ModulePageLayout>
  )
}
