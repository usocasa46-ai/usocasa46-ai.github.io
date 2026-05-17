import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileText,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react'
import './ErpCockpitDashboard.css'

export default function ErpCockpitDashboard() {
  const shortcuts = [
    { title: 'Nueva venta', subtitle: 'Factura o venta rapida', icon: ShoppingCart, color: 'green' },
    { title: 'Nueva compra', subtitle: 'Registrar compra', icon: ShoppingBag, color: 'blue' },
    { title: 'Recibir mercancia', subtitle: 'Entrada a almacen', icon: Truck, color: 'orange' },
    { title: 'Inventario', subtitle: 'Stock y movimientos', icon: Warehouse, color: 'cyan' },
    { title: 'Cotizacion', subtitle: 'Crear cotizacion', icon: FileText, color: 'blue' },
    { title: 'Reportes', subtitle: 'Ver indicadores', icon: BarChart3, color: 'green' },
  ]

  const previews = [
    {
      title: 'Ventas del dia',
      value: 'RD$ 125,430',
      detail: '+12.5% vs ayer',
      icon: ShoppingCart,
      color: 'green',
      lines: ['18 facturas emitidas', '5 cotizaciones abiertas', '3 ventas pendientes de cobro'],
    },
    {
      title: 'Compras del dia',
      value: 'RD$ 75,230',
      detail: '4 ordenes registradas',
      icon: ShoppingBag,
      color: 'blue',
      lines: ['2 compras recibidas', '1 orden esperando aprobacion', '1 factura pendiente'],
    },
    {
      title: 'Inventario bajo',
      value: '23 productos',
      detail: 'Requieren reposicion',
      icon: Boxes,
      color: 'orange',
      lines: ['Toner HP 85A: critico', 'Papel bond A4: bajo', 'Teclados Logitech: bajo'],
    },
    {
      title: 'Cuentas por cobrar',
      value: 'RD$ 250,000',
      detail: '12 clientes pendientes',
      icon: Users,
      color: 'purple',
      lines: ['3 facturas vencidas', '6 vencen esta semana', 'Cliente ABC con mayor balance'],
    },
    {
      title: 'Cuentas por pagar',
      value: 'RD$ 125,000',
      detail: '8 proveedores pendientes',
      icon: CreditCard,
      color: 'red',
      lines: ['2 pagos vencen hoy', '4 pagos esta semana', 'Proveedor Tech Solutions pendiente'],
    },
    {
      title: 'Flujo de caja',
      value: 'RD$ 80,430',
      detail: '+8.7% vs ayer',
      icon: DollarSign,
      color: 'green',
      lines: ['Ingresos: RD$ 205,430', 'Egresos: RD$ 125,000', 'Balance positivo'],
    },
  ]

  const workPanels = [
    {
      title: 'Alertas y aprobaciones',
      icon: AlertTriangle,
      color: 'orange',
      items: [
        'Orden de compra #OC-2458 pendiente',
        '23 productos con stock bajo',
        '12 facturas por cobrar',
      ],
    },
    {
      title: 'Documentos recientes',
      icon: ClipboardList,
      color: 'blue',
      items: [
        'FV-000245 - Factura de venta',
        'OC-000125 - Orden de compra',
        'RM-000189 - Recepcion de mercancia',
      ],
    },
    {
      title: 'Actividad reciente',
      icon: Receipt,
      color: 'green',
      items: [
        'Factura creada hace 10 minutos',
        'Mercancia recibida en almacen',
        'Producto actualizado por administrador',
      ],
    },
  ]

  return (
    <section className="simple-dashboard">
      <header className="simple-dashboard-header">
        <div>
          <span>Panel principal</span>
          <h1>Bienvenido, Administrador</h1>
          <p>Accesos rapidos visibles y resumen operativo en vista previa.</p>
        </div>

        <div className="simple-dashboard-date">
          <strong>Hoy</strong>
          <span>24 mayo 2025</span>
        </div>
      </header>

      <section className="simple-quick-section">
        <div className="simple-section-title">
          <div>
            <span>Trabajo rapido</span>
            <h2>Accesos rapidos</h2>
          </div>

          <p>Las operaciones principales quedan siempre visibles.</p>
        </div>

        <div className="simple-shortcuts-grid">
          {shortcuts.map((item) => {
            const Icon = item.icon

            return (
              <button key={item.title} type="button" className={`simple-shortcut ${item.color}`}>
                <span>
                  <Icon size={28} strokeWidth={2.5} />
                </span>

                <strong>{item.title}</strong>
                <small>{item.subtitle}</small>
              </button>
            )
          })}
        </div>
      </section>

      <section className="simple-preview-section">
        <div className="simple-section-title compact">
          <div>
            <span>Resumen</span>
            <h2>Vista previa operativa</h2>
          </div>

          <p>Pasa el puntero por encima para expandir cada bloque.</p>
        </div>

        <div className="simple-preview-grid">
          {previews.map((item) => {
            const Icon = item.icon

            return (
              <article key={item.title} className={`simple-preview-card ${item.color}`}>
                <div className="simple-preview-main">
                  <span className="simple-preview-icon">
                    <Icon size={25} strokeWidth={2.5} />
                  </span>

                  <div>
                    <small>{item.title}</small>
                    <strong>{item.value}</strong>
                    <p>{item.detail}</p>
                  </div>
                </div>

                <div className="simple-preview-expand">
                  {item.lines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="simple-work-grid">
        {workPanels.map((panel) => {
          const Icon = panel.icon

          return (
            <article key={panel.title} className={`simple-work-card ${panel.color}`}>
              <div className="simple-work-head">
                <span>
                  <Icon size={23} strokeWidth={2.5} />
                </span>

                <h3>{panel.title}</h3>
              </div>

              <div className="simple-work-preview">
                {panel.items.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </article>
          )
        })}
      </section>

      <footer className="simple-dashboard-footer">
        <span>INVE-FAT SYSTEM</span>
        <span>Sucursal Principal</span>
        <span>Usuario: Administrador</span>
        <span>Â© 2025</span>
      </footer>
    </section>
  )
}