import { LogOut, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import './SecurityModule.css'

function formatDate(value) {
  if (!value) return 'Sesion actual'
  try {
    return new Intl.DateTimeFormat('es-DO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export default function SecuritySessionsPage({ controls, session }) {
  const [refreshKey, setRefreshKey] = useState(0)

  const rows = [
    {
      id: `SESSION-${refreshKey}`,
      username: session?.username || 'usuario',
      role: session?.role || 'Usuario',
      loginAt: session?.loginAt || '',
      status: 'Activa',
      source: 'Navegador local',
    },
  ]

  return (
    <ModulePageLayout
      title="Sesiones"
      moduleLabel="Seguridad"
      description="Consulta las sesiones activas del sistema local."
      breadcrumb={['Seguridad', 'Sesiones']}
      actions={[
        { id: 'refresh', label: 'Actualizar', icon: RotateCcw, onClick: () => setRefreshKey((value) => value + 1) },
        { id: 'exit', label: 'Salir', icon: LogOut, onClick: controls?.onClose },
      ]}
      {...controls}
    >
      <div className="security-page security-sessions-page">
        <section className="security-panel">
          <div className="security-panel-heading">
            <div>
              <span>Sesiones</span>
              <h2>Actividad actual</h2>
            </div>
            <strong>{rows.length} activa</strong>
          </div>
          <div className="security-table-wrap">
            <table className="security-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Inicio</th>
                  <th>Estado</th>
                  <th>Origen</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.username}</td>
                    <td>{row.role}</td>
                    <td>{formatDate(row.loginAt)}</td>
                    <td><span className="security-badge is-success">{row.status}</span></td>
                    <td>{row.source}</td>
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
