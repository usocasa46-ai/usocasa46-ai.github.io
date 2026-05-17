import { LogOut, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { loadAuditLog } from '../../security/permissions.js'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import './SecurityModule.css'

function normalizeAudit(record) {
  return {
    id: record.id || `AUD-${record.date || record.createdAt || Math.random()}`,
    date: record.date || record.createdAt || '',
    user: record.user || record.username || 'sistema',
    action: record.action || 'Accion',
    module: record.module || record.modulo || 'Sistema',
    submodule: record.submodule || record.submodulo || '',
    description: record.description || record.detail?.description || JSON.stringify(record.detail || {}),
  }
}

function formatDate(value) {
  if (!value) return 'Sin fecha'
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

export default function SecurityAuditPage({ controls }) {
  const [records, setRecords] = useState(() => loadAuditLog().map(normalizeAudit))
  const [filters, setFilters] = useState({
    text: '',
    module: '',
  })

  const filteredRecords = useMemo(() => {
    const text = filters.text.trim().toLowerCase()
    const moduleText = filters.module.trim().toLowerCase()

    return records.filter((record) => {
      const matchesText = !text || [record.user, record.action, record.description, record.submodule].some((value) => String(value || '').toLowerCase().includes(text))
      const matchesModule = !moduleText || String(record.module || '').toLowerCase().includes(moduleText)
      return matchesText && matchesModule
    })
  }, [filters, records])

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  return (
    <ModulePageLayout
      title="Auditoria"
      moduleLabel="Seguridad"
      description="Consulta acciones importantes registradas por el sistema."
      breadcrumb={['Seguridad', 'Auditoria']}
      actions={[
        { id: 'refresh', label: 'Actualizar', icon: RotateCcw, onClick: () => setRecords(loadAuditLog().map(normalizeAudit)) },
        { id: 'exit', label: 'Salir', icon: LogOut, onClick: controls?.onClose },
      ]}
      {...controls}
    >
      <div className="security-page security-audit-page">
        <section className="security-panel security-filter-panel">
          <div className="security-panel-heading">
            <div>
              <span>Busqueda</span>
              <h2>Filtrar auditoria</h2>
            </div>
            <strong>{filteredRecords.length} registros</strong>
          </div>
          <div className="security-filter-grid">
            <label className="security-span-2">
              Buscar accion, usuario o descripcion
              <input value={filters.text} onChange={(event) => updateFilter('text', event.target.value)} placeholder="Buscar auditoria" />
            </label>
            <label>
              Modulo
              <input value={filters.module} onChange={(event) => updateFilter('module', event.target.value)} placeholder="Modulo" />
            </label>
          </div>
        </section>

        <section className="security-panel security-list-panel">
          <div className="security-panel-heading">
            <div>
              <span>Registro</span>
              <h2>Historial de auditoria</h2>
            </div>
          </div>
          <div className="security-table-wrap">
            <table className="security-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Accion</th>
                  <th>Modulo</th>
                  <th>Submodulo</th>
                  <th>Descripcion</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{formatDate(record.date)}</td>
                    <td>{record.user}</td>
                    <td>{record.action}</td>
                    <td>{record.module}</td>
                    <td>{record.submodule}</td>
                    <td>{record.description}</td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan="6">No hay registros de auditoria para mostrar.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </ModulePageLayout>
  )
}
