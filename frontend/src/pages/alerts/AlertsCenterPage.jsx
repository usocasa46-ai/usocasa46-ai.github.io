import { useMemo, useState } from 'react'
import { Ban, CheckCircle2, Eye, FilePlus2, RefreshCw, ShoppingCart, X } from 'lucide-react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import {
  buildLowStockGroups,
  cleanText,
  getAlerts,
  preparePurchaseOrderFromProducts,
  setAlertStatus,
} from '../../utils/alertsEngine.js'
import './AlertsCenterPage.css'

function priorityClass(priority = '') {
  const clean = cleanText(priority)
  if (clean === 'critica') return 'is-critical'
  if (clean === 'alta') return 'is-high'
  if (clean === 'media') return 'is-medium'
  return 'is-low'
}

function Badge({ value, type = 'status' }) {
  return <span className={`alerts-badge ${type === 'priority' ? priorityClass(value) : ''}`}>{value || 'N/D'}</span>
}

export default function AlertsCenterPage({ controls, onNavigate, onAction, searchValue = '', onSearchChange }) {
  const [alerts, setAlerts] = useState(() => getAlerts())
  const [selectedId, setSelectedId] = useState('')
  const [filters, setFilters] = useState({ type: 'Todos', priority: 'Todos', status: 'Todos', module: 'Todos' })
  const [message, setMessage] = useState('')
  const selected = alerts.find((alert) => alert.id === selectedId)
  const groups = useMemo(() => buildLowStockGroups(), [alerts])

  const refresh = () => {
    setAlerts(getAlerts())
    setMessage('Alertas actualizadas.')
  }

  const updateStatus = (status) => {
    if (!selected) return
    const nextAlerts = setAlertStatus(selected.id, status)
    setAlerts(nextAlerts)
    setMessage(`Alerta marcada como ${status}.`)
  }

  const createOrder = (group) => {
    if (!group || group.products.length === 0) return
    preparePurchaseOrderFromProducts(group)
    setMessage('Orden de compra sugerida preparada.')
    onAction?.('Orden de compra sugerida preparada')
    onNavigate?.('purchase-orders')
  }

  const createOrderFromSelected = () => {
    if (!selected || !['Stock bajo', 'Stock agotado'].includes(selected.tipo)) return
    const group = groups.find((item) => item.products.some((product) => product.code === selected.referencia))
    createOrder(group)
  }

  const options = useMemo(() => ({
    types: ['Todos', ...Array.from(new Set(alerts.map((alert) => alert.tipo))).sort()],
    modules: ['Todos', ...Array.from(new Set(alerts.map((alert) => alert.modulo))).sort()],
  }), [alerts])

  const filtered = alerts.filter((alert) => {
    const query = cleanText(searchValue)
    const matchesText = !query || [alert.titulo, alert.descripcion, alert.tipo, alert.modulo, alert.submodulo, alert.referencia].some((value) => cleanText(value).includes(query))
    const matchesType = filters.type === 'Todos' || alert.tipo === filters.type
    const matchesPriority = filters.priority === 'Todos' || alert.prioridad === filters.priority
    const matchesStatus = filters.status === 'Todos' || alert.estado === filters.status
    const matchesModule = filters.module === 'Todos' || alert.modulo === filters.module
    return matchesText && matchesType && matchesPriority && matchesStatus && matchesModule
  })

  const summary = {
    critical: alerts.filter((alert) => alert.prioridad === 'critica' && alert.estado === 'pendiente').length,
    high: alerts.filter((alert) => alert.prioridad === 'alta' && alert.estado === 'pendiente').length,
    pending: alerts.filter((alert) => alert.estado === 'pendiente').length,
    lowStock: groups.reduce((sum, group) => sum + group.products.length, 0),
  }

  return (
    <ModulePageLayout
      title="Alertas"
      moduleLabel="Sistema"
      description="Centro centralizado para revisar alertas operativas, stock bajo y acciones sugeridas."
      breadcrumb={['Sistema', 'Alertas']}
      searchValue={searchValue}
      searchPlaceholder="Buscar alerta"
      onSearchChange={onSearchChange}
      actions={[
        { id: 'refresh', label: 'Actualizar', icon: RefreshCw, onClick: refresh },
        { id: 'view', label: 'Ver', icon: Eye, disabled: !selected, onClick: () => selected && setMessage(selected.descripcion) },
        { id: 'attend', label: 'Atender', icon: CheckCircle2, disabled: !selected, onClick: () => updateStatus('atendida') },
        { id: 'ignore', label: 'Ignorar', icon: Ban, disabled: !selected, onClick: () => updateStatus('ignorada') },
        { id: 'create-order', label: 'Crear orden', icon: ShoppingCart, disabled: !selected || !['Stock bajo', 'Stock agotado'].includes(selected.tipo), onClick: createOrderFromSelected },
        { id: 'exit', label: 'Salir', icon: X, onClick: controls?.onClose },
      ]}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      <div className="alerts-page">
        {message && <div className="alerts-message">{message}</div>}

        <section className="alerts-summary-grid">
          <article><span>Criticas</span><strong>{summary.critical}</strong></article>
          <article><span>Altas</span><strong>{summary.high}</strong></article>
          <article><span>Pendientes</span><strong>{summary.pending}</strong></article>
          <article><span>Stock bajo</span><strong>{summary.lowStock}</strong></article>
        </section>

        <section className="alerts-panel">
          <div className="alerts-panel-heading">
            <div>
              <span>Stock bajo</span>
              <h2>Stock bajo por proveedor</h2>
            </div>
          </div>
          <div className="alerts-group-grid">
            {groups.map((group) => (
              <article key={group.supplierCode || group.supplierName}>
                <div>
                  <strong>{group.supplierName}</strong>
                  <span>{group.products.length} productos</span>
                </div>
                <p>Total sugerido: RD$ {group.totalSuggestedCost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                <button type="button" onClick={() => createOrder(group)}>
                  <FilePlus2 size={15} />
                  Crear orden de compra
                </button>
              </article>
            ))}
            {groups.length === 0 && <div className="alerts-empty">No hay productos en stock bajo.</div>}
          </div>
        </section>

        <section className="alerts-panel alerts-filter-panel">
          <div className="alerts-filter-grid">
            <label>Tipo<select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}>{options.types.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Prioridad<select value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}><option>Todos</option><option>baja</option><option>media</option><option>alta</option><option>critica</option></select></label>
            <label>Estado<select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option>Todos</option><option>pendiente</option><option>atendida</option><option>ignorada</option></select></label>
            <label>Modulo<select value={filters.module} onChange={(event) => setFilters((current) => ({ ...current, module: event.target.value }))}>{options.modules.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
        </section>

        <section className="alerts-table-wrap">
          <table className="alerts-table">
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Modulo</th><th>Alerta</th><th>Prioridad</th><th>Estado</th><th>Referencia</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map((alert) => (
                <tr key={alert.id} className={selectedId === alert.id ? 'is-selected' : ''} onClick={() => setSelectedId(alert.id)}>
                  <td>{String(alert.fecha || '').slice(0, 10)}</td>
                  <td>{alert.tipo}</td>
                  <td><strong>{alert.modulo}</strong><small>{alert.submodulo}</small></td>
                  <td><strong>{alert.titulo}</strong><small>{alert.descripcion}</small></td>
                  <td><Badge value={alert.prioridad} type="priority" /></td>
                  <td><Badge value={alert.estado} /></td>
                  <td>{alert.referencia || 'N/D'}</td>
                  <td>
                    <div className="alerts-row-actions">
                      <button type="button" title="Atender" onClick={(event) => { event.stopPropagation(); setSelectedId(alert.id); setAlerts(setAlertStatus(alert.id, 'atendida')) }}><CheckCircle2 size={15} /></button>
                      <button type="button" title="Ignorar" onClick={(event) => { event.stopPropagation(); setSelectedId(alert.id); setAlerts(setAlertStatus(alert.id, 'ignorada')) }}><Ban size={15} /></button>
                      {['Stock bajo', 'Stock agotado'].includes(alert.tipo) && (
                        <button type="button" title="Crear orden" onClick={(event) => { event.stopPropagation(); setSelectedId(alert.id); const group = groups.find((item) => item.products.some((product) => product.code === alert.referencia)); createOrder(group) }}><ShoppingCart size={15} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="8" className="alerts-empty">No hay alertas para mostrar.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </ModulePageLayout>
  )
}
