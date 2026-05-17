import { Ban, FilePlus2, Mail, Printer, Save } from 'lucide-react'
import { useMemo } from 'react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'

const invoices = [
  { number: 'FAC-000184', customer: 'Comercial Rivera', date: '2026-05-17', status: 'Borrador', total: 'RD$ 42,850.00' },
  { number: 'FAC-000183', customer: 'Distribuidora Norte', date: '2026-05-16', status: 'Emitida', total: 'RD$ 18,430.00' },
  { number: 'FAC-000182', customer: 'Mercado Central', date: '2026-05-16', status: 'Pagada', total: 'RD$ 76,980.00' },
]

const detailRows = [
  { code: 'PRD-1020', item: 'Aceite premium 1L', qty: 12, price: 'RD$ 310.00', total: 'RD$ 3,720.00' },
  { code: 'PRD-1104', item: 'Filtro industrial', qty: 6, price: 'RD$ 725.00', total: 'RD$ 4,350.00' },
  { code: 'PRD-1322', item: 'Empaque sellado', qty: 20, price: 'RD$ 95.00', total: 'RD$ 1,900.00' },
]

function badgeClass(status) {
  if (status === 'Pagada') return 'erp-badge is-success'
  if (status === 'Borrador') return 'erp-badge is-warning'
  return 'erp-badge is-info'
}

export default function SalesInvoicePage({ controls, onAction, searchValue = '', onSearchChange }) {
  const search = searchValue
  const setSearch = onSearchChange || (() => {})

  const filteredInvoices = useMemo(() => {
    const text = search.toLowerCase().trim()
    if (!text) return invoices

    return invoices.filter((invoice) => {
      return [invoice.number, invoice.customer, invoice.date, invoice.status].some((value) => {
        return value.toLowerCase().includes(text)
      })
    })
  }, [search])

  const notify = (message) => onAction?.(message)

  return (
    <ModulePageLayout
      title="Factura"
      moduleLabel="Ventas"
      description="Emision y control de facturas de clientes con detalle de productos, impuestos y totales."
      breadcrumb={['Ventas', 'Factura']}
      searchValue={search}
      searchPlaceholder="Buscar por numero, cliente, fecha o estado"
      onSearchChange={setSearch}
      actions={[
        { id: 'new', label: 'Nueva factura', icon: FilePlus2, variant: 'primary', onClick: () => notify('Nueva factura preparada') },
        { id: 'save', label: 'Guardar', icon: Save, onClick: () => notify('Factura guardada en borrador') },
        { id: 'print', label: 'Imprimir PDF', icon: Printer, onClick: () => notify('Generando PDF de factura') },
        { id: 'email', label: 'Enviar correo', icon: Mail, onClick: () => notify('Factura lista para enviar por correo') },
        { id: 'cancel', label: 'Anular', icon: Ban, variant: 'danger', onClick: () => notify('Factura marcada para anulacion') },
      ]}
      statusCards={[
        { label: 'Facturas hoy', value: '12', detail: 'RD$ 138,260.00' },
        { label: 'Pendientes', value: '4', detail: 'requieren cobro' },
        { label: 'Borradores', value: '2', detail: 'sin emitir' },
        { label: 'Impuestos', value: 'RD$ 8,145', detail: 'estimado del dia' },
      ]}
      {...controls}
    >
      <div className="erp-data-grid">
        <div className="erp-two-column">
          <section className="erp-panel">
            <h2>Listado de facturas</h2>
            <div className="erp-table-wrap">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Numero</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.number}>
                      <td>{invoice.number}</td>
                      <td>{invoice.customer}</td>
                      <td>{invoice.date}</td>
                      <td><span className={badgeClass(invoice.status)}>{invoice.status}</span></td>
                      <td>{invoice.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="erp-panel">
            <h2>Formulario de factura</h2>
            <div className="erp-form-grid">
              <label>
                Cliente
                <input defaultValue="Comercial Rivera" />
              </label>
              <label>
                NCF
                <input defaultValue="B0100000184" />
              </label>
              <label>
                Fecha
                <input type="date" defaultValue="2026-05-17" />
              </label>
              <label>
                Condicion
                <select defaultValue="Credito 15 dias">
                  <option>Contado</option>
                  <option>Credito 15 dias</option>
                  <option>Credito 30 dias</option>
                </select>
              </label>
              <label>
                Vendedor
                <input defaultValue="Administrador Principal" />
              </label>
              <label>
                Moneda
                <select defaultValue="RD$">
                  <option>RD$</option>
                  <option>USD</option>
                </select>
              </label>
              <label className="erp-span-2">
                Observaciones
                <textarea defaultValue="Entrega programada con validacion de inventario." />
              </label>
            </div>
          </section>
        </div>

        <section className="erp-panel">
          <h2>Detalle de productos</h2>
          <div className="erp-table-wrap">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {detailRows.map((row) => (
                  <tr key={row.code}>
                    <td>{row.code}</td>
                    <td>{row.item}</td>
                    <td>{row.qty}</td>
                    <td>{row.price}</td>
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
