import { ClipboardCheck, FilePlus2, Printer, Save, Truck } from 'lucide-react'
import { useMemo } from 'react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'

const receptions = [
  { number: 'REC-000044', order: 'OC-000091', vendor: 'Suplidora Duarte', date: '2026-05-17', status: 'En revision', items: 3 },
  { number: 'REC-000043', order: 'OC-000089', vendor: 'Global Parts', date: '2026-05-16', status: 'Parcial', items: 2 },
  { number: 'REC-000042', order: 'OC-000086', vendor: 'Importadora Vega', date: '2026-05-14', status: 'Recibida', items: 8 },
]

const receivedRows = [
  { code: 'MAT-304', item: 'Caja corrugada grande', ordered: 500, received: 500, pending: 0 },
  { code: 'PRD-1020', item: 'Aceite premium 1L', ordered: 180, received: 120, pending: 60 },
  { code: 'PRD-1405', item: 'Valvula acero', ordered: 60, received: 60, pending: 0 },
]

function badgeClass(status) {
  if (status === 'Recibida') return 'erp-badge is-success'
  if (status === 'Parcial') return 'erp-badge is-warning'
  return 'erp-badge is-info'
}

export default function WarehouseReceivingPage({ controls, onAction, searchValue = '', onSearchChange }) {
  const search = searchValue
  const setSearch = onSearchChange || (() => {})

  const filteredReceptions = useMemo(() => {
    const text = search.toLowerCase().trim()
    if (!text) return receptions

    return receptions.filter((reception) => {
      return [reception.number, reception.order, reception.vendor, reception.date, reception.status].some((value) => {
        return value.toLowerCase().includes(text)
      })
    })
  }, [search])

  const notify = (message) => onAction?.(message)

  return (
    <ModulePageLayout
      title="Recepcion de mercancia"
      moduleLabel="Almacen"
      description="Registro de recepciones por orden de compra o entrada manual, con validacion de cantidades recibidas."
      breadcrumb={['Almacen', 'Recepcion de mercancia']}
      searchValue={search}
      searchPlaceholder="Buscar orden, proveedor, recepcion, fecha o estado"
      onSearchChange={setSearch}
      actions={[
        { id: 'new', label: 'Crear recepcion', icon: FilePlus2, variant: 'primary', onClick: () => notify('Recepcion nueva preparada') },
        { id: 'by-order', label: 'Recibir por orden', icon: ClipboardCheck, onClick: () => notify('Recepcion vinculada a orden de compra') },
        { id: 'manual', label: 'Recibir manual', icon: Truck, onClick: () => notify('Recepcion manual iniciada') },
        { id: 'save', label: 'Guardar', icon: Save, onClick: () => notify('Recepcion guardada') },
        { id: 'print', label: 'Imprimir recibo', icon: Printer, onClick: () => notify('Generando recibo de almacen') },
      ]}
      statusCards={[
        { label: 'Recepciones hoy', value: '5', detail: '2 en revision' },
        { label: 'Ordenes abiertas', value: '11', detail: 'pendientes de recibir' },
        { label: 'Parciales', value: '3', detail: 'con saldo pendiente' },
        { label: 'Calidad', value: '1', detail: 'retenida por revision' },
      ]}
      sidePanel={(
        <>
          <section className="erp-panel">
            <h3>Resumen recepcion</h3>
            <dl className="erp-detail-list">
              <div className="erp-detail-row"><span>Orden origen</span><strong>OC-000091</strong></div>
              <div className="erp-detail-row"><span>Almacen</span><strong>Principal</strong></div>
              <div className="erp-detail-row"><span>Estado</span><strong>En revision</strong></div>
              <div className="erp-detail-row"><span>Recibido por</span><strong>Administrador</strong></div>
            </dl>
          </section>
          <section className="erp-panel">
            <h3>Validaciones</h3>
            <ul className="erp-note-list">
              <li>Confirmar diferencias contra la orden antes de cerrar.</li>
              <li>Enviar productos retenidos a control de calidad.</li>
              <li>Actualizar stock al confirmar la recepcion.</li>
            </ul>
          </section>
        </>
      )}
      {...controls}
    >
      <div className="erp-data-grid">
        <section className="erp-panel">
          <h2>Buscar orden de compra</h2>
          <div className="erp-filter-grid">
            <label>
              Orden
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="OC-000091" />
            </label>
            <label>
              Proveedor
              <input onChange={(event) => setSearch(event.target.value)} placeholder="Proveedor" />
            </label>
            <label>
              Fecha
              <input type="date" onChange={(event) => setSearch(event.target.value)} />
            </label>
            <label>
              Estado
              <select onChange={(event) => setSearch(event.target.value)}>
                <option value="">Todos</option>
                <option>En revision</option>
                <option>Parcial</option>
                <option>Recibida</option>
              </select>
            </label>
          </div>
        </section>

        <section className="erp-panel">
          <h2>Listado de recepciones</h2>
          <div className="erp-table-wrap">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Recepcion</th>
                  <th>Orden</th>
                  <th>Proveedor</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceptions.map((reception) => (
                  <tr key={reception.number}>
                    <td>{reception.number}</td>
                    <td>{reception.order}</td>
                    <td>{reception.vendor}</td>
                    <td>{reception.date}</td>
                    <td><span className={badgeClass(reception.status)}>{reception.status}</span></td>
                    <td>{reception.items}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="erp-panel">
          <h2>Formulario de recepcion</h2>
          <div className="erp-form-grid">
            <label>
              Orden de compra
              <input defaultValue="OC-000091" />
            </label>
            <label>
              Proveedor
              <input defaultValue="Suplidora Duarte" />
            </label>
            <label>
              Almacen destino
              <select defaultValue="Principal">
                <option>Principal</option>
                <option>Secundario</option>
                <option>Cuarentena</option>
              </select>
            </label>
            <label>
              Fecha recepcion
              <input type="date" defaultValue="2026-05-17" />
            </label>
            <label className="erp-span-2">
              Observaciones
              <textarea defaultValue="Recepcion parcial pendiente de validar por calidad." />
            </label>
          </div>
        </section>

        <section className="erp-panel">
          <h2>Detalle de productos recibidos</h2>
          <div className="erp-table-wrap">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Producto</th>
                  <th>Ordenado</th>
                  <th>Recibido</th>
                  <th>Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {receivedRows.map((row) => (
                  <tr key={row.code}>
                    <td>{row.code}</td>
                    <td>{row.item}</td>
                    <td>{row.ordered}</td>
                    <td>{row.received}</td>
                    <td>{row.pending}</td>
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
