import { CheckCircle2, LogOut, Save, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { erpModules } from '../../config/modulesMap.js'
import {
  appendAuditLog,
  loadPermissions,
  loadRoles,
  savePermissions,
  SECURITY_ACTIONS,
  userCanForUser,
} from '../../security/permissions.js'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import './SecurityModule.css'

function actionIsEnabled(rolePermissions, pageId, actionId) {
  return Array.isArray(rolePermissions?.[pageId]) && rolePermissions[pageId].includes(actionId)
}

function toggleAction(rolePermissions, pageId, actionId, checked) {
  const currentActions = rolePermissions?.[pageId] || []
  const nextActions = checked
    ? [...new Set([...currentActions, actionId])]
    : currentActions.filter((action) => action !== actionId)

  return {
    ...rolePermissions,
    [pageId]: nextActions,
  }
}

export default function SecurityPermissionsPage({ controls, session, onAction }) {
  const [roles] = useState(() => loadRoles())
  const [permissions, setPermissions] = useState(() => loadPermissions())
  const [selectedRoleId, setSelectedRoleId] = useState(() => roles.find((role) => role.id !== 'ROLE-MAIN-ADMIN')?.id || 'ROLE-MAIN-ADMIN')
  const [moduleFilter, setModuleFilter] = useState('Todos')
  const [message, setMessage] = useState('')

  const selectedRole = roles.find((role) => role.id === selectedRoleId) || roles[0]
  const selectedRolePermissions = permissions[selectedRoleId] || {}
  const canConfigure = userCanForUser(session, 'security-permissions', 'configure') || userCanForUser(session, 'security-permissions', 'edit')
  const isMainAdminRole = selectedRole?.id === 'ROLE-MAIN-ADMIN'

  const modulesToRender = useMemo(() => {
    if (moduleFilter === 'Todos') return erpModules.filter((module) => module.id !== 'dashboard')
    return erpModules.filter((module) => module.id === moduleFilter)
  }, [moduleFilter])

  const permissionTotals = useMemo(() => {
    const pages = Object.values(selectedRolePermissions)
    return {
      pages: pages.filter((actions) => actions?.includes('view')).length,
      actions: pages.reduce((total, actions) => total + (Array.isArray(actions) ? actions.length : 0), 0),
    }
  }, [selectedRolePermissions])

  const updatePermission = (pageId, actionId, checked) => {
    if (!canConfigure || isMainAdminRole) return

    setPermissions((current) => ({
      ...current,
      [selectedRoleId]: toggleAction(current[selectedRoleId] || {}, pageId, actionId, checked),
    }))
  }

  const markModuleView = (module, checked) => {
    if (!canConfigure || isMainAdminRole) return

    const pages = module.type === 'single' ? [{ id: module.pageId }] : module.pages || []

    setPermissions((current) => {
      let nextRolePermissions = current[selectedRoleId] || {}

      pages.forEach((page) => {
        nextRolePermissions = toggleAction(nextRolePermissions, page.id, 'view', checked)
      })

      return {
        ...current,
        [selectedRoleId]: nextRolePermissions,
      }
    })
  }

  const saveRolePermissions = () => {
    savePermissions(permissions)
    appendAuditLog('Cambiar permisos', {
      module: 'Seguridad',
      submodule: 'Permisos',
      description: `Permisos actualizados para ${selectedRole?.name}`,
    })
    setMessage('Permisos guardados correctamente.')
    onAction?.('Permisos guardados')
  }

  return (
    <ModulePageLayout
      title="Permisos"
      moduleLabel="Seguridad"
      description="Configura permisos por rol, modulo, submodulo y accion."
      breadcrumb={['Seguridad', 'Permisos']}
      actions={[
        { id: 'save', label: 'Guardar permisos', icon: Save, variant: 'primary', onClick: saveRolePermissions, disabled: !canConfigure || isMainAdminRole },
        { id: 'exit', label: 'Salir', icon: LogOut, onClick: controls?.onClose },
      ]}
      {...controls}
    >
      <div className="security-page security-permissions-page">
        {message && <div className="security-message">{message}</div>}

        <section className="security-panel security-filter-panel">
          <div className="security-panel-heading">
            <div>
              <span>Rol activo</span>
              <h2>Asignacion de permisos</h2>
            </div>
            <strong>{permissionTotals.pages} paginas visibles</strong>
          </div>

          <div className="security-simple-form">
            <label>
              Seleccionar rol
              <select value={selectedRoleId} onChange={(event) => setSelectedRoleId(event.target.value)}>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </label>
            <label>
              Modulo
              <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
                <option>Todos</option>
                {erpModules.filter((module) => module.id !== 'dashboard').map((module) => (
                  <option key={module.id} value={module.id}>{module.label}</option>
                ))}
              </select>
            </label>
            <label>
              Acciones activas
              <input value={permissionTotals.actions} readOnly />
            </label>
            <button type="button" className="is-primary" onClick={saveRolePermissions} disabled={!canConfigure || isMainAdminRole}>
              <CheckCircle2 size={15} />
              Guardar
            </button>
          </div>

          {isMainAdminRole && (
            <div className="security-alert" style={{ marginTop: 12 }}>
              El Administrador principal siempre mantiene acceso total y no se limita desde esta pantalla.
            </div>
          )}
        </section>

        <section className="security-panel security-list-panel">
          <div className="security-panel-heading">
            <div>
              <span>Permisos</span>
              <h2>{selectedRole?.name}</h2>
            </div>
            <strong>{selectedRole?.status}</strong>
          </div>

          <div className="security-permission-matrix">
            {modulesToRender.map((module) => {
              const pages = module.type === 'single' ? [{ id: module.pageId, label: module.label }] : module.pages || []

              return (
                <article className="security-module-permission" key={module.id}>
                  <div className="security-module-permission-header">
                    <div>
                      <span className="security-section-label">{module.label}</span>
                      <h3>{pages.length} submodulos</h3>
                    </div>
                    <div className="security-inline-actions">
                      <button type="button" onClick={() => markModuleView(module, true)} disabled={!canConfigure || isMainAdminRole}>
                        Ver modulo
                      </button>
                      <button type="button" onClick={() => markModuleView(module, false)} disabled={!canConfigure || isMainAdminRole}>
                        Ocultar
                      </button>
                    </div>
                  </div>

                  <div className="security-permission-table-wrap">
                    <table className="security-permission-table">
                      <thead>
                        <tr>
                          <th>Submodulo</th>
                          {SECURITY_ACTIONS.map((action) => (
                            <th key={action.id}>{action.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pages.map((page) => (
                          <tr key={page.id}>
                            <td>
                              <strong>{page.label}</strong>
                              <small>{page.id}</small>
                            </td>
                            {SECURITY_ACTIONS.map((action) => (
                              <td key={action.id}>
                                <input
                                  type="checkbox"
                                  checked={actionIsEnabled(selectedRolePermissions, page.id, action.id)}
                                  disabled={!canConfigure || isMainAdminRole}
                                  onChange={(event) => updatePermission(page.id, action.id, event.target.checked)}
                                  aria-label={`${page.label} ${action.label}`}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </ModulePageLayout>
  )
}
