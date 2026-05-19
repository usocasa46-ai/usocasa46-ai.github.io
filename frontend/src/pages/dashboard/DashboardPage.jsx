import { AlertTriangle, ArrowRight, PackageCheck, ReceiptText, ShoppingCart, TrendingUp } from 'lucide-react'
import { quickAccessPages } from '../../config/modulesMap.js'
import { buildLowStockGroups, getAlerts } from '../../utils/alertsEngine.js'
import SystemDateTime from '../../components/SystemDateTime.jsx'
import '../../components/AppWorkspace.css'

const kpis = [
  { label: 'Ventas del dia', value: 'RD$ 138K', detail: '12 facturas', icon: ReceiptText },
  { label: 'Compras abiertas', value: '9', detail: '3 pendientes de aprobar', icon: ShoppingCart },
  { label: 'Productos criticos', value: '18', detail: 'bajo stock', icon: PackageCheck },
  { label: 'Margen estimado', value: '28%', detail: 'resumen operativo', icon: TrendingUp },
]

export default function DashboardPage({ session, onSelectPage }) {
  const alerts = getAlerts().filter((alert) => alert.estado === 'pendiente').slice(0, 3)
  const lowStockCount = buildLowStockGroups().reduce((sum, group) => sum + group.products.length, 0)
  const dashboardKpis = kpis.map((kpi) => (
    kpi.label === 'Productos criticos'
      ? { ...kpi, value: String(lowStockCount), detail: 'stock bajo o agotado' }
      : kpi
  ))

  return (
    <section className="erp-dashboard-page">
      <header className="erp-dashboard-hero">
        <div>
          <span>Panel principal</span>
          <h1>INVE-FAT SYSTEM</h1>
          <p>Resumen corto para operar ventas, compras, inventario y almacen sin saturar la pantalla.</p>
        </div>
        <div className="erp-dashboard-hero-side">
          <SystemDateTime />
          <aside>
            <strong>{session?.fullName || 'Usuario activo'}</strong>
            <small>{session?.role || 'Sesion activa'}</small>
          </aside>
        </div>
      </header>

      <div className="erp-dashboard-kpis">
        {dashboardKpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <article key={kpi.label}>
              <span><Icon size={18} /></span>
              <div>
                <small>{kpi.label}</small>
                <strong>{kpi.value}</strong>
                <em>{kpi.detail}</em>
              </div>
            </article>
          )
        })}
      </div>

      <div className="erp-dashboard-grid">
        <section className="erp-panel">
          <h2>Accesos rapidos</h2>
          <div className="erp-quick-access-grid">
            {quickAccessPages.map((item) => (
              <button type="button" key={item.id} onClick={() => onSelectPage(item.id)}>
                <span>{item.label}</span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </section>

        <section className="erp-panel">
          <h2>Alertas criticas</h2>
          <ul className="erp-alert-list">
            {alerts.map((alert) => (
              <li key={alert.id}>
                <AlertTriangle size={16} />
                <span>{alert.titulo}</span>
              </li>
            ))}
            {alerts.length === 0 && (
              <li>
                <AlertTriangle size={16} />
                <span>No hay alertas pendientes.</span>
              </li>
            )}
          </ul>
          <button type="button" className="erp-dashboard-link-button" onClick={() => onSelectPage('system-alerts')}>
            Ver todas las alertas
            <ArrowRight size={15} />
          </button>
        </section>

        <section className="erp-panel erp-dashboard-summary">
          <h2>Resumen corto</h2>
          <p>
            El dashboard queda reducido a indicadores esenciales y accesos principales. Cada acceso abre
            una pagina independiente del submodulo correspondiente.
          </p>
        </section>
      </div>
    </section>
  )
}
