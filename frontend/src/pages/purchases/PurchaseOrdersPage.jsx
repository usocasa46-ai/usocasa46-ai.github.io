import { Ban, CheckCircle, FilePlus2, Mail, Printer, Save, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'

const purchaseOrders = [
  { number: 'OC-000091', vendor: 'Suplidora Duarte', date: '2026-05-17', status: 'Pendiente', total: 'RD$ 124,600.00' },
  { number: 'OC-000090', vendor: 'Importadora Vega', date: '2026-05-16', status: 'Aprobada', total: 'RD$ 82,240.00' },
  { number: 'OC-000089', vendor: 'Global Parts', date: '2026-05-15', status: 'Recibida parcial', total: 'RD$ 36,410.00' },
]

const detailRows = [
  { code: 'MAT-304', item: 'Caja corrugada grande', qty: 500, cost: 'RD$ 48.00', total: 'RD$ 24,000.00' },
  { code: 'PRD-1020', item: 'Aceite premium 1L', qty: 180, cost: 'RD$ 280.00', total: 'RD$ 50,400.00' },
  { code: 'PRD-1405', item: 'Valvula acero', qty: 60, cost: 'RD$ 610.00', total: 'RD$ 36,600.00' },
]

function badgeClass(status) {
  if (status === 'Aprobada') return 'erp-badge is-success'
  if (status === 'Pendiente') return 'erp-badge is-warning'
  return 'erp-badge is-info'
}

export default function PurchaseOrdersPage({ controls, onAction, searchValue = '', onSearchChange }) {
  const search = searchValue
  const setSearch = onSearchChange || (() => {})
  const [statusFilter, setStatusFilter] = useState('Todos')

  const filteredOrders = useMemo(() => {
    const text = search.toLowerCase().trim()

    return purchaseOrders.filter((order) => {
      const matchesStatus = statusFilter === 'Todos' || order.status === statusFilter
      const matchesText = !text || [order.number, order.vendor, order.date, order.status].some((value) => value.toLowerCase().includes(text))
      return matchesStatus && matchesText
    })
  }, [search, statusFilter])

  const notify = (message) => onAction?.(message)

  return (
    <ModulePageLayout
      title="Ordenes de compra"
      moduleLabel="Compras"
      description="Gestion de ordenes de compra con aprobacion, detalle de productos, totales y conversion a recepcion."
      breadcrumb={['Compras', 'Ordenes de compra']}
      searchValue={search}
      searchPlaceholder="Buscar por orden, proveedor, fecha o estado"
      onSearchChange={setSearch}
      actions={[
        { id: 'new', label: 'Nueva orden', icon: FilePlus2, variant: 'primary', onClick: () => notify('Nueva orden de compra preparada') },
        { id: 'save', label: 'Guardar', icon: Save, onClick: () => notify('Orden de compra guardada') },
        { id: 'approve', label: 'Aprobar', icon: CheckCircle, onClick: () => notify('Orden enviada a aprobacion') },
        { id: 'cancel', label: 'Anular', icon: Ban, variant: 'danger', onClick: () => notify('Orden marcada para anulacion') },
        { id: 'print', label: 'Imprimir PDF', icon: Printer, onClick: () => notify('Generando PDF de orden') },
        { id: 'email', label: 'Enviar', icon: Mail, onClick: () => notify('Orden lista para enviar al proveedor') },
        { id: 'receive', label: 'Convertir a recepcion', icon: Send, onClick: () => notify('Orden preparada para recepcion de mercancia') },
      ]}
      statusCards={[
        { label: 'Ordenes abiertas', value: '9', detail: '3 para aprobar' },
        { label: 'Monto pendiente', value: 'RD$ 243K', detail: 'compras activas' },
        { label: 'Recibidas parcial', value: '2', detail: 'requieren seguimiento' },
        { label: 'Tiempo promedio', value: '2.4 dias', detail: 'aprobacion' },
      ]}
      sidePanel={(
        <>
          <section className="erp-panel">
            <h3>Estado de aprobacion</h3>
            <dl className="erp-detail-list">
              <div className="erp-detail-row"><span>Nivel actual</span><strong>Compras</strong></div>
              <div className="erp-detail-row"><span>Responsable</span><strong>Administrador</strong></div>
              <div className="erp-detail-row"><span>Estado</span><strong>Pendiente</strong></div>
            </dl>
          </section>
          <section className="erp-panel">
            <h3>Totales</h3>
            <div className="erp-total-box">
              <div className="erp-total-line"><span>Subtotal</span><strong>RD$ 111,000.00</strong></div>
              <div className="erp-total-line"><span>ITBIS</span><strong>RD$ 13,600.00</strong></div>
              <div className="erp-total-line is-grand"><span>Total</span><strong>RD$ 124,600.00</strong></div>
            </div>
          </section>
        </>
      )}
      {...controls}
    >
      <div className="erp-data-grid">
        <section className="erp-panel">
          <h2>Filtros de compra</h2>
          <div className="erp-filter-grid">
            <label>
              Numero de orden
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="OC-000091" />
            </label>
            <label>
              Proveedor
              <input onChange={(event) => setSearch(event.target.value)} placeholder="Nombre proveedor" />
            </label>
            <label>
              Fecha
              <input type="date" onChange={(event) => setSearch(event.target.value)} />
            </label>
            <label>
              Estado
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option>Todos</option>
                <option>Pendiente</option>
                <option>Aprobada</option>
                <option>Recibida parcial</option>
              </select>
            </label>
          </div>
        </section>

        <section className="erp-panel">
          <h2>Listado de ordenes</h2>
          <div className="erp-table-wrap">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Proveedor</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.number}>
                    <td>{order.number}</td>
                    <td>{order.vendor}</td>
                    <td>{order.date}</td>
                    <td><span className={badgeClass(order.status)}>{order.status}</span></td>
                    <td>{order.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="erp-panel">
          <h2>Formulario de orden</h2>
          <div className="erp-form-grid">
            <label>
              Proveedor
              <input defaultValue="Suplidora Duarte" />
            </label>
            <label>
              Almacen destino
              <select defaultValue="Almacen principal">
                <option>Almacen principal</option>
                <option>Almacen secundario</option>
              </select>
            </label>
            <label>
              Fecha requerida
              <input type="date" defaultValue="2026-05-20" />
            </label>
            <label>
              Condicion de pago
              <select defaultValue="Credito 30 dias">
                <option>Contado</option>
                <option>Credito 15 dias</option>
                <option>Credito 30 dias</option>
              </select>
            </label>
          </div>
        </section>

        <section className="erp-panel">
          <h2>Detalle de productos</h2>
          <div className="erp-table-wrap">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Costo</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {detailRows.map((row) => (
                  <tr key={row.code}>
                    <td>{row.code}</td>
                    <td>{row.item}</td>
                    <td>{row.qty}</td>
                    <td>{row.cost}</td>
                    <td>{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </ModulePageLayout>
  )
}
