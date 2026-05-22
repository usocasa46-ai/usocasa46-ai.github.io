import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  Copy,
  Download,
  Eye,
  PauseCircle,
  Pencil,
  Plus,
  RefreshCcw,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import { customersService } from '../../services/customersService.js'
import { invoicesService } from '../../services/invoicesService.js'
import { productsService } from '../../services/productsService.js'
import { promotionsService } from '../../services/promotionsService.js'
import { suppliersService } from '../../services/suppliersService.js'
import {
  getPromotionLifecycleStatus,
  getPromotionTypeLabel,
  normalizePromotion,
  PROMOTION_STATUSES,
  PROMOTION_TYPES,
  validatePromotionDraft,
} from '../../utils/promotions/promotionValidator.js'
import {
  buildPromotionReports,
  promotionExportRows,
  promotionUsageExportRows,
} from '../../utils/promotions/promotionReports.js'
import './SalesPromotionsPage.css'

const DEFAULT_FILTERS = {
  status: 'Todos',
  type: 'Todos',
  from: '',
  to: '',
  product: '',
  category: 'Todas',
}

const DEFAULT_DRAFT = {
  id: '',
  name: '',
  description: '',
  type: 'percentage',
  status: 'Activa',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  priority: 10,
  stackable: false,
  application: 'all',
  productsText: '',
  categoriesText: '',
  suppliersText: '',
  customersText: '',
  customerGroupsText: '',
  couponCode: '',
  maxUses: '',
  conditions: {
    minimumQuantity: '',
    minimumAmount: '',
    minStock: '',
    maxStock: '',
    nearExpiry: false,
    expiryDays: 30,
    lowRotation: false,
    receiptMode: 'any',
    paymentMethod: 'any',
    branch: '',
    warehouse: '',
    customerCode: '',
    customerGroup: '',
  },
  actions: {
    discountPercent: '',
    discountAmount: '',
    specialPrice: '',
    buyQuantity: '',
    freeQuantity: '',
    freeProductCode: '',
    comboPrice: '',
    giftLabel: '',
  },
}

function toArray(value) {
  return Array.isArray(value) ? value : []
}

function splitList(value) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean)
}

function joinList(value) {
  return toArray(value).join(', ')
}

function money(value) {
  return `RD$ ${Number(value || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDateTime() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
}

function exportWorkbook(filename, sheets) {
  const workbook = XLSX.utils.book_new()
  Object.entries(sheets).forEach(([sheetName, rows]) => {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(toArray(rows)), sheetName.slice(0, 31))
  })
  XLSX.writeFile(workbook, filename)
}

function promotionToDraft(record) {
  const promotion = normalizePromotion(record)
  return {
    ...DEFAULT_DRAFT,
    ...promotion,
    productsText: joinList(promotion.products),
    categoriesText: joinList(promotion.categories),
    suppliersText: joinList(promotion.suppliers),
    customersText: joinList(promotion.customers),
    customerGroupsText: joinList(promotion.customerGroups),
    conditions: { ...DEFAULT_DRAFT.conditions, ...promotion.conditions },
    actions: { ...DEFAULT_DRAFT.actions, ...promotion.actions },
  }
}

function draftToPromotion(draft) {
  return normalizePromotion({
    ...draft,
    id: draft.id || `PROMO-${Date.now()}`,
    products: splitList(draft.productsText),
    categories: splitList(draft.categoriesText),
    suppliers: splitList(draft.suppliersText),
    customers: splitList(draft.customersText),
    customerGroups: splitList(draft.customerGroupsText),
    createdAt: draft.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

function distinct(values) {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean))).sort()
}

function StatusBadge({ value }) {
  return <span className={`sales-promo-badge is-${String(value || '').toLowerCase()}`}>{value}</span>
}

function EmptyState({ message }) {
  return (
    <div className="sales-promo-empty">
      <Tag size={22} />
      <strong>{message}</strong>
      <span>Las ofertas guardadas para esta empresa apareceran aqui.</span>
    </div>
  )
}

export default function SalesPromotionsPage({
  controls,
  searchValue = '',
  onSearchChange,
  onAction,
}) {
  const [promotions, setPromotions] = useState([])
  const [usage, setUsage] = useState([])
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [invoices, setInvoices] = useState([])
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [draft, setDraft] = useState(DEFAULT_DRAFT)
  const [modalMode, setModalMode] = useState('')
  const [selectedPromotionId, setSelectedPromotionId] = useState('')
  const [historyPromotionId, setHistoryPromotionId] = useState('')
  const [message, setMessage] = useState('')
  const [modalError, setModalError] = useState('')
  const [loading, setLoading] = useState(false)

  const notify = (text) => {
    setMessage(text)
    onAction?.(text)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [storedPromotions, storedUsage, storedProducts, storedCustomers, storedSuppliers, storedInvoices] = await Promise.all([
        promotionsService.getAll(),
        promotionsService.getUsage(),
        productsService.getAll(),
        customersService.getAll(),
        suppliersService.getAll(),
        invoicesService.getAll(),
      ])
      setPromotions(toArray(storedPromotions).map(normalizePromotion))
      setUsage(toArray(storedUsage))
      setProducts(toArray(storedProducts))
      setCustomers(toArray(storedCustomers))
      setSuppliers(toArray(storedSuppliers))
      setInvoices(toArray(storedInvoices))
    } catch (error) {
      console.error('No se pudieron cargar ofertas:', error)
      notify('No se pudieron cargar las ofertas de esta empresa.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const options = useMemo(() => ({
    categories: distinct(products.map((product) => product.category || product.categoria || 'Sin categoria')),
    products: distinct(products.map((product) => product.code)),
    suppliers: distinct([
      ...suppliers.map((supplier) => supplier.code || supplier.name || supplier.commercialName),
      ...products.map((product) => product.supplierCode || product.supplierName),
    ]),
    customers: distinct(customers.map((customer) => customer.code || customer.name)),
  }), [customers, products, suppliers])

  const reports = useMemo(() => buildPromotionReports({ promotions, usage, invoices, products }), [invoices, products, promotions, usage])
  const selectedPromotion = promotions.find((promotion) => promotion.id === selectedPromotionId) || null
  const usageRows = useMemo(() => usage.filter((record) => !historyPromotionId || String(record.promotionId || record.promotion_id) === historyPromotionId), [historyPromotionId, usage])

  const filteredPromotions = useMemo(() => {
    const query = String(searchValue || '').trim().toLowerCase()
    return promotions.filter((promotion) => {
      const lifecycle = getPromotionLifecycleStatus(promotion)
      const matchesQuery = !query || [
        promotion.name,
        promotion.description,
        promotion.couponCode,
        promotion.type,
        promotion.products.join(' '),
        promotion.categories.join(' '),
      ].some((value) => String(value || '').toLowerCase().includes(query))
      const matchesStatus = filters.status === 'Todos' || lifecycle === filters.status || promotion.status === filters.status
      const matchesType = filters.type === 'Todos' || promotion.type === filters.type
      const matchesProduct = !filters.product || promotion.products.includes(filters.product)
      const matchesCategory = filters.category === 'Todas' || promotion.categories.includes(filters.category)
      const matchesStart = !filters.from || !promotion.endDate || promotion.endDate >= filters.from
      const matchesEnd = !filters.to || !promotion.startDate || promotion.startDate <= filters.to
      return matchesQuery && matchesStatus && matchesType && matchesProduct && matchesCategory && matchesStart && matchesEnd
    })
  }, [filters, promotions, searchValue])

  const openCreate = () => {
    setDraft(DEFAULT_DRAFT)
    setModalError('')
    setModalMode('create')
  }

  const openEdit = (promotion) => {
    setDraft(promotionToDraft(promotion))
    setModalError('')
    setModalMode('edit')
  }

  const savePromotion = async () => {
    const promotion = draftToPromotion(draft)
    const errors = validatePromotionDraft(promotion)
    if (errors.length) {
      setModalError(errors[0])
      return
    }

    const saved = modalMode === 'edit'
      ? await promotionsService.update(promotion.id, promotion)
      : await promotionsService.create(promotion)
    setModalError('')
    setModalMode('')
    setSelectedPromotionId(saved.id)
    notify(`Oferta ${saved.name} guardada.`)
    await loadData()
  }

  const togglePromotion = async (promotion) => {
    const nextStatus = ['Activa', 'Programada'].includes(promotion.status) ? 'Pausada' : 'Activa'
    await promotionsService.update(promotion.id, { status: nextStatus })
    notify(`${promotion.name}: ${nextStatus}.`)
    await loadData()
  }

  const duplicatePromotion = async (promotion) => {
    const duplicate = normalizePromotion({
      ...promotion,
      id: `PROMO-${Date.now()}`,
      name: `${promotion.name} copia`,
      usedCount: 0,
      createdAt: new Date().toISOString(),
    })
    await promotionsService.create(duplicate)
    notify('Oferta duplicada.')
    await loadData()
  }

  const removePromotion = async (promotion) => {
    const uses = Number(promotion.usedCount || 0) + usage.filter((record) => String(record.promotionId || record.promotion_id) === promotion.id).length
    if (uses > 0) {
      notify('No se puede eliminar una oferta con historial de uso.')
      return
    }
    await promotionsService.remove(promotion.id)
    if (selectedPromotionId === promotion.id) setSelectedPromotionId('')
    notify('Oferta eliminada.')
    await loadData()
  }

  const updateDraft = (field, value) => {
    setModalError('')
    setDraft((current) => ({ ...current, [field]: value }))
  }
  const updateCondition = (field, value) => {
    setModalError('')
    setDraft((current) => ({
      ...current,
      conditions: { ...current.conditions, [field]: value },
    }))
  }
  const updateAction = (field, value) => {
    setModalError('')
    setDraft((current) => ({
      ...current,
      actions: { ...current.actions, [field]: value },
    }))
  }

  const exportOffers = () => exportWorkbook(`ofertas-${formatDateTime()}.xlsx`, {
    Ofertas: promotionExportRows(promotions),
    Historial: promotionUsageExportRows(usage),
  })
  const exportUsage = () => exportWorkbook(`descuentos-ofertas-${formatDateTime()}.xlsx`, {
    Historial: promotionUsageExportRows(usage),
    TopOfertas: reports.topPromotions,
    Clientes: reports.customerSavings,
  })

  return (
    <ModulePageLayout
      title="Ofertas y promociones"
      moduleLabel="Ventas"
      breadcrumb={['Ventas', 'Ofertas y promociones']}
      description="Reglas automaticas y cupones para ventas, factura y punto de venta."
      searchValue={searchValue}
      searchPlaceholder="Buscar oferta, cupon, producto o categoria"
      onSearchChange={onSearchChange}
      actions={[
        { id: 'new', label: 'Nueva oferta', icon: Plus, variant: 'primary', onClick: openCreate },
        { id: 'export', label: 'Exportar ofertas', icon: Download, onClick: exportOffers },
        { id: 'reload', label: 'Actualizar', icon: RefreshCcw, onClick: loadData },
      ]}
      statusCards={[
        { label: 'Activas', value: reports.kpis.active },
        { label: 'Programadas', value: reports.kpis.scheduled },
        { label: 'Usos', value: reports.kpis.uses },
        { label: 'Descuento acumulado', value: money(reports.kpis.totalDiscount) },
      ]}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      <section className="sales-promotions-page">
        {message && <div className="sales-promo-message">{message}</div>}

        <section className="sales-promo-panel sales-promo-filters">
          <label>Estado<select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option>Todos</option><option>Activa</option><option>Programada</option><option>Vencida</option><option>Pausada</option><option>Inactiva</option></select></label>
          <label>Tipo<select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}><option>Todos</option>{PROMOTION_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
          <label>Desde<input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></label>
          <label>Hasta<input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></label>
          <label>Producto<select value={filters.product} onChange={(event) => setFilters((current) => ({ ...current, product: event.target.value }))}><option value="">Todos</option>{options.products.map((code) => <option key={code}>{code}</option>)}</select></label>
          <label>Categoria<select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}><option>Todas</option>{options.categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        </section>

        <section className="sales-promo-panel">
          <header className="sales-promo-section-head">
            <div><span>Gestion</span><h2>Ofertas definidas</h2></div>
            <strong>{loading ? 'Cargando...' : `${filteredPromotions.length} oferta(s)`}</strong>
          </header>
          {!filteredPromotions.length ? <EmptyState message="No hay ofertas para los filtros seleccionados." /> : (
            <div className="sales-promo-table-wrap">
              <table className="sales-promo-table">
                <thead><tr><th>Nombre</th><th>Tipo</th><th>Aplicacion</th><th>Inicio</th><th>Fin</th><th>Estado</th><th>Productos / categorias</th><th>Usos</th><th>Descontado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {filteredPromotions.map((promotion) => {
                    const promotionUsage = usage.filter((record) => String(record.promotionId || record.promotion_id) === promotion.id)
                    const discounted = promotionUsage.reduce((sum, record) => sum + Number(record.discountAmount || record.discount_amount || 0), 0)
                    return (
                      <tr key={promotion.id}>
                        <td><strong>{promotion.name}</strong><small>{promotion.couponCode || promotion.description || 'Regla automatica'}</small></td>
                        <td>{getPromotionTypeLabel(promotion.type)}</td>
                        <td>{promotion.application === 'all' ? 'Todos' : promotion.application}</td>
                        <td>{promotion.startDate || 'Ahora'}</td>
                        <td>{promotion.endDate || 'Abierta'}</td>
                        <td><StatusBadge value={getPromotionLifecycleStatus(promotion)} /></td>
                        <td>{[promotion.products.join(', '), promotion.categories.join(', ')].filter(Boolean).join(' | ') || 'Toda la venta'}</td>
                        <td>{Number(promotion.usedCount || 0)}</td>
                        <td>{money(discounted)}</td>
                        <td>
                          <div className="sales-promo-row-actions">
                            <button type="button" title="Ver" onClick={() => setSelectedPromotionId(promotion.id)}><Eye size={15} /></button>
                            <button type="button" title="Editar" onClick={() => openEdit(promotion)}><Pencil size={15} /></button>
                            <button type="button" title="Activar o pausar" onClick={() => togglePromotion(promotion)}><PauseCircle size={15} /></button>
                            <button type="button" title="Duplicar" onClick={() => duplicatePromotion(promotion)}><Copy size={15} /></button>
                            <button type="button" title="Historial" onClick={() => setHistoryPromotionId(promotion.id)}><BarChart3 size={15} /></button>
                            <button type="button" title="Eliminar sin uso" onClick={() => removePromotion(promotion)} disabled={Number(promotion.usedCount || 0) > 0}><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="sales-promo-two-columns">
          <section className="sales-promo-panel">
            <header className="sales-promo-section-head">
              <div><span>Analisis</span><h2>Uso de ofertas</h2></div>
              <button type="button" onClick={exportUsage}><Download size={15} /> Reporte xlsx</button>
            </header>
            <div className="sales-promo-report-grid">
              <article><span>Ventas con oferta</span><strong>{money(reports.kpis.totalSales)}</strong></article>
              <article><span>Vencidas</span><strong>{reports.kpis.expired}</strong></article>
              <article><span>Mas usada</span><strong>{reports.topPromotions[0]?.name || 'Sin uso'}</strong></article>
              <article><span>Cliente con ahorro</span><strong>{reports.customerSavings[0]?.customer || 'Sin datos'}</strong></article>
            </div>
            <div className="sales-promo-history">
              {!usageRows.length ? <EmptyState message="Aun no hay historial de promociones usadas." /> : usageRows.slice(0, 12).map((record) => (
                <article key={record.id}>
                  <div><strong>{record.promotionName || record.promotion_name || 'Oferta'}</strong><span>{record.invoiceNumber || record.invoice_id || 'Factura pendiente'} | {record.source || 'Venta'}</span></div>
                  <strong>{money(record.discountAmount || record.discount_amount)}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="sales-promo-panel">
            <header className="sales-promo-section-head">
              <div><span>Sugerencias</span><h2>Ideas basadas en ventas</h2></div>
              <strong>No automaticas</strong>
            </header>
            <div className="sales-promo-suggestions">
              {!reports.suggestions.length ? <EmptyState message="No hay datos suficientes para sugerir ofertas." /> : reports.suggestions.map((suggestion) => (
                <article key={suggestion.id}><strong>{suggestion.title}</strong><p>{suggestion.detail}</p></article>
              ))}
            </div>
          </section>
        </div>

        {selectedPromotion && (
          <aside className="sales-promo-detail">
            <button type="button" onClick={() => setSelectedPromotionId('')} title="Cerrar detalle"><X size={16} /></button>
            <span>Detalle</span>
            <h2>{selectedPromotion.name}</h2>
            <p>{selectedPromotion.description || 'Oferta preparada para factura y punto de venta.'}</p>
            <dl>
              <div><dt>Tipo</dt><dd>{getPromotionTypeLabel(selectedPromotion.type)}</dd></div>
              <div><dt>Cupon</dt><dd>{selectedPromotion.couponCode || 'Automatico'}</dd></div>
              <div><dt>Resultado</dt><dd>{selectedPromotion.actions.discountPercent ? `${selectedPromotion.actions.discountPercent}%` : money(selectedPromotion.actions.discountAmount || selectedPromotion.actions.specialPrice || selectedPromotion.actions.comboPrice)}</dd></div>
              <div><dt>Reglas</dt><dd>{selectedPromotion.stackable ? 'Combinable' : 'Prioridad exclusiva'} | prioridad {selectedPromotion.priority}</dd></div>
            </dl>
          </aside>
        )}
      </section>

      {modalMode && (
        <div className="sales-promo-modal-backdrop" role="presentation">
          <section className="sales-promo-modal" role="dialog" aria-modal="true" aria-label="Formulario de oferta">
            <header><div><span>Ventas</span><h2>{modalMode === 'edit' ? 'Editar oferta' : 'Nueva oferta'}</h2></div><button type="button" onClick={() => setModalMode('')} aria-label="Cerrar formulario"><X size={18} /></button></header>
            <div className="sales-promo-modal-body">
              {modalError && <div className="sales-promo-modal-error">{modalError}</div>}
              <section>
                <h3>Datos generales</h3>
                <div className="sales-promo-form-grid">
                  <label>Nombre<input value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} required aria-invalid={Boolean(modalError && !draft.name)} /></label>
                  <label>Tipo<select value={draft.type} onChange={(event) => updateDraft('type', event.target.value)}>{PROMOTION_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
                  <label>Estado<select value={draft.status} onChange={(event) => updateDraft('status', event.target.value)}>{PROMOTION_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
                  <label>Prioridad<input type="number" min="0" value={draft.priority} onChange={(event) => updateDraft('priority', event.target.value)} /></label>
                  <label className="sales-promo-span-2">Descripcion<textarea value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} /></label>
                </div>
              </section>

              <section>
                <h3>Vigencia</h3>
                <div className="sales-promo-form-grid">
                  <label>Fecha inicio<input type="date" value={draft.startDate} onChange={(event) => updateDraft('startDate', event.target.value)} /></label>
                  <label>Fecha fin<input type="date" value={draft.endDate} onChange={(event) => updateDraft('endDate', event.target.value)} /></label>
                  <label>Hora inicio<input type="time" value={draft.startTime} onChange={(event) => updateDraft('startTime', event.target.value)} /></label>
                  <label>Hora fin<input type="time" value={draft.endTime} onChange={(event) => updateDraft('endTime', event.target.value)} /></label>
                </div>
              </section>

              <section>
                <h3>Aplicacion y condiciones</h3>
                <div className="sales-promo-form-grid">
                  <label>Aplicacion<select value={draft.application} onChange={(event) => updateDraft('application', event.target.value)}><option value="all">Todos los productos</option><option value="products">Productos especificos</option><option value="categories">Categorias</option><option value="suppliers">Proveedor</option><option value="customers">Cliente o grupo</option><option value="branch">Sucursal / almacen</option></select></label>
                  <label>Productos<input value={draft.productsText} onChange={(event) => updateDraft('productsText', event.target.value)} placeholder={options.products.length ? options.products.slice(0, 3).join(', ') : 'No hay productos disponibles'} />{!options.products.length && <small className="sales-promo-field-note">No hay productos disponibles.</small>}</label>
                  <label>Categorias<input value={draft.categoriesText} onChange={(event) => updateDraft('categoriesText', event.target.value)} placeholder={options.categories.length ? options.categories.slice(0, 3).join(', ') : 'No hay categorias disponibles'} />{!options.categories.length && <small className="sales-promo-field-note">No hay categorias disponibles.</small>}</label>
                  <label>Proveedores<input value={draft.suppliersText} onChange={(event) => updateDraft('suppliersText', event.target.value)} placeholder={options.suppliers.slice(0, 3).join(', ')} /></label>
                  <label>Clientes<input value={draft.customersText} onChange={(event) => updateDraft('customersText', event.target.value)} placeholder={options.customers.slice(0, 3).join(', ')} /></label>
                  <label>Grupos cliente<input value={draft.customerGroupsText} onChange={(event) => updateDraft('customerGroupsText', event.target.value)} placeholder="Mayorista, fidelidad" /></label>
                  <label>Cantidad minima<input type="number" min="0" value={draft.conditions.minimumQuantity} onChange={(event) => updateCondition('minimumQuantity', event.target.value)} /></label>
                  <label>Monto minimo<input type="number" min="0" value={draft.conditions.minimumAmount} onChange={(event) => updateCondition('minimumAmount', event.target.value)} /></label>
                  <label>Stock minimo<input type="number" min="0" value={draft.conditions.minStock} onChange={(event) => updateCondition('minStock', event.target.value)} /></label>
                  <label>Stock maximo<input type="number" min="0" value={draft.conditions.maxStock} onChange={(event) => updateCondition('maxStock', event.target.value)} /></label>
                  <label>Comprobante<select value={draft.conditions.receiptMode} onChange={(event) => updateCondition('receiptMode', event.target.value)}><option value="any">Cualquiera</option><option value="consumer">Solo consumidor final</option><option value="fiscal">Solo comprobante fiscal</option></select></label>
                  <label>Metodo de pago<select value={draft.conditions.paymentMethod} onChange={(event) => updateCondition('paymentMethod', event.target.value)}><option value="any">Cualquiera</option><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option><option>Mixto</option><option>Credito</option></select></label>
                  <label>Sucursal<input value={draft.conditions.branch} onChange={(event) => updateCondition('branch', event.target.value)} /></label>
                  <label>Almacen<input value={draft.conditions.warehouse} onChange={(event) => updateCondition('warehouse', event.target.value)} /></label>
                  <label className="sales-promo-check"><input type="checkbox" checked={draft.conditions.nearExpiry} onChange={(event) => updateCondition('nearExpiry', event.target.checked)} /> Cercano a vencimiento</label>
                  <label>Dias vencimiento<input type="number" min="1" value={draft.conditions.expiryDays} onChange={(event) => updateCondition('expiryDays', event.target.value)} /></label>
                  <label className="sales-promo-check"><input type="checkbox" checked={draft.conditions.lowRotation} onChange={(event) => updateCondition('lowRotation', event.target.checked)} /> Baja rotacion</label>
                  <label className="sales-promo-check"><input type="checkbox" checked={draft.stackable} onChange={(event) => updateDraft('stackable', event.target.checked)} /> Permitir combinar con otras ofertas</label>
                </div>
              </section>

              <section>
                <h3>Resultado</h3>
                <div className="sales-promo-form-grid">
                  <label>Porcentaje<input type="number" min="0" max="100" value={draft.actions.discountPercent} onChange={(event) => updateAction('discountPercent', event.target.value)} /></label>
                  <label>Monto fijo<input type="number" min="0" value={draft.actions.discountAmount} onChange={(event) => updateAction('discountAmount', event.target.value)} /></label>
                  <label>Precio final<input type="number" min="0" value={draft.actions.specialPrice} onChange={(event) => updateAction('specialPrice', event.target.value)} /></label>
                  <label>Precio combo<input type="number" min="0" value={draft.actions.comboPrice} onChange={(event) => updateAction('comboPrice', event.target.value)} /></label>
                  <label>Compra X<input type="number" min="0" value={draft.actions.buyQuantity} onChange={(event) => updateAction('buyQuantity', event.target.value)} /></label>
                  <label>Lleva Y gratis<input type="number" min="0" value={draft.actions.freeQuantity} onChange={(event) => updateAction('freeQuantity', event.target.value)} /></label>
                  <label>Producto gratis<input value={draft.actions.freeProductCode} onChange={(event) => updateAction('freeProductCode', event.target.value)} /></label>
                  <label>Regalo / bonificacion<input value={draft.actions.giftLabel} onChange={(event) => updateAction('giftLabel', event.target.value)} /></label>
                  <label>Codigo cupon<input value={draft.couponCode} onChange={(event) => updateDraft('couponCode', event.target.value.toUpperCase())} placeholder="VERANO10" /></label>
                  <label>Maximo usos<input type="number" min="0" value={draft.maxUses} onChange={(event) => updateDraft('maxUses', event.target.value)} /></label>
                </div>
              </section>
            </div>
            <footer><button type="button" onClick={() => setModalMode('')}>Cancelar</button><button type="button" className="is-primary" onClick={savePromotion}>Guardar oferta</button></footer>
          </section>
        </div>
      )}
    </ModulePageLayout>
  )
}
