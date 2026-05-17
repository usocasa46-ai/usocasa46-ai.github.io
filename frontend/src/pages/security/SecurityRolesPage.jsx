import {
  Ban,
  Copy,
  Edit3,
  FilePlus2,
  LogOut,
  Save,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  appendAuditLog,
  DEFAULT_SECURITY_ROLES,
  getDefaultPermissions,
  loadPermissions,
  loadRoles,
  loadUsers,
  savePermissions,
  saveRoles,
  userCanForUser,
} from '../../security/permissions.js'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import './SecurityModule.css'

const emptyRole = {
  id: '',
  name: '',
  description: '',
  level: 10,
  status: 'Activo',
  systemRole: false,
}

function nextRoleId(roles) {
  const maxNumber = roles.reduce((max, role) => {
    const parsed = Number.parseInt(String(role.id || '').replace(/[^\d]/g, ''), 10)
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max
  }, DEFAULT_SECURITY_ROLES.length)

  return `ROLE-CUSTOM-${String(maxNumber + 1).padStart(3, '0')}`
}

export default function SecurityRolesPage({ controls, session, onAction }) {
  const [roles, setRoles] = useState(() => loadRoles())
  const [users] = useState(() => loadUsers())
  const [selectedRoleId, setSelectedRoleId] = useState('ROLE-MAIN-ADMIN')
  const [form, setForm] = useState(emptyRole)
  const [modalMode, setModalMode] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const selectedRole = roles.find((role) => role.id === selectedRoleId)
  const canCreate = userCanForUser(session, 'security-roles', 'create')
  const canEdit = userCanForUser(session, 'security-roles', 'edit')
  const canDelete = userCanForUser(session, 'security-roles', 'delete')

  const userCountByRole = useMemo(() => {
    return users.reduce((map, user) => {
      const roleId = user.roleId || roles.find((role) => role.name === user.role)?.id || 'ROLE-BASIC'
      map[roleId] = (map[roleId] || 0) + 1
      return map
    }, {})
  }, [roles, users])

  const filteredRoles = useMemo(() => {
    const text = search.trim().toLowerCase()
    if (!text) return roles

    return roles.filter((role) => {
      return [role.name, role.description, role.status, role.level].some((value) => String(value || '').toLowerCase().includes(text))
    })
  }, [roles, search])

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== 'Escape' || !modalMode) return
      event.preventDefault()
      closeModal()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [modalMode])

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const persistRoles = (nextRoles, action, description) => {
    const savedRoles = saveRoles(nextRoles)
    setRoles(savedRoles)
    appendAuditLog(action, {
      module: 'Seguridad',
      submodule: 'Roles',
      description,
    })
  }

  const openNewRole = () => {
    setForm({
      ...emptyRole,
      id: nextRoleId(roles),
    })
    setError('')
    setModalMode('new')
  }

  const openEditRole = (role = selectedRole) => {
    if (!role) return
    setForm({ ...emptyRole, ...role })
    setError('')
    setModalMode('edit')
  }

  const duplicateRole = () => {
    if (!selectedRole) return

    const nextRole = {
      ...selectedRole,
      id: nextRoleId(roles),
      name: `${selectedRole.name} copia`,
      systemRole: false,
      status: 'Activo',
    }

    const permissions = loadPermissions()
    savePermissions({
      ...permissions,
      [nextRole.id]: permissions[selectedRole.id] || {},
    })

    persistRoles([...roles, nextRole], 'Duplicar rol', `Duplicado rol ${selectedRole.name}`)
    setSelectedRoleId(nextRole.id)
    setMessage('Rol duplicado correctamente.')
  }

  const toggleRoleStatus = () => {
    if (!selectedRole || selectedRole.systemRole || selectedRole.id === 'ROLE-MAIN-ADMIN') return

    const nextRoles = roles.map((role) => {
      if (role.id !== selectedRole.id) return role
      return {
        ...role,
        status: role.status === 'Activo' ? 'Inactivo' : 'Activo',
      }
    })

    persistRoles(nextRoles, 'Cambiar estado de rol', `Cambiado estado de ${selectedRole.name}`)
    setMessage(selectedRole.status === 'Activo' ? 'Rol inactivado correctamente.' : 'Rol activado correctamente.')
  }

  const saveRole = (event) => {
    event.preventDefault()
    const cleanName = form.name.trim()

    if (!cleanName) {
      setError('El nombre del rol es obligatorio.')
      return
    }

    const duplicateName = roles.some((role) => role.name.toLowerCase() === cleanName.toLowerCase() && role.id !== form.id)
    if (duplicateName) {
      setError('Ya existe un rol con ese nombre.')
      return
    }

    const nextRole = {
      ...form,
      name: cleanName,
      level: Number(form.level) || 10,
    }

    const nextRoles = modalMode === 'edit'
      ? roles.map((role) => (role.id === form.id ? nextRole : role))
      : [...roles, nextRole]

    if (modalMode === 'new') {
      const permissions = loadPermissions()
      savePermissions({
        ...permissions,
        [nextRole.id]: getDefaultPermissions()['ROLE-BASIC'],
      })
    }

    persistRoles(
      nextRoles,
      modalMode === 'edit' ? 'Editar rol' : 'Crear rol',
      `${modalMode === 'edit' ? 'Editado' : 'Creado'} rol ${cleanName}`,
    )
    setSelectedRoleId(nextRole.id)
    setMessage(modalMode === 'edit' ? 'Rol actualizado correctamente.' : 'Rol creado correctamente.')
    onAction?.(modalMode === 'edit' ? 'Rol actualizado' : 'Rol creado')
    closeModal()
  }

  const closeModal = () => {
    setModalMode('')
    setError('')
  }

  return (
    <ModulePageLayout
      title="Roles"
      moduleLabel="Seguridad"
      description="Define perfiles de acceso para usuarios administrativos y operativos."
      breadcrumb={['Seguridad', 'Roles']}
      actions={[
        { id: 'new', label: 'Nuevo rol', icon: FilePlus2, variant: 'primary', onClick: openNewRole, disabled: !canCreate },
        { id: 'edit', label: 'Editar rol', icon: Edit3, onClick: () => openEditRole(), disabled: !selectedRole || !canEdit },
        { id: 'duplicate', label: 'Duplicar rol', icon: Copy, onClick: duplicateRole, disabled: !selectedRole || !canCreate },
        { id: 'inactive', label: selectedRole?.status === 'Activo' ? 'Inactivar rol' : 'Activar rol', icon: Ban, onClick: toggleRoleStatus, disabled: !selectedRole || selectedRole.systemRole || !canDelete },
        { id: 'exit', label: 'Salir', icon: LogOut, onClick: controls?.onClose },
      ]}
      {...controls}
    >
      <div className="security-page security-roles-page">
        {message && <div className="security-message">{message}</div>}

        <section className="security-panel security-filter-panel">
          <div className="security-panel-heading">
            <div>
              <span>Busqueda</span>
              <h2>Consultar roles</h2>
            </div>
            <strong>{filteredRoles.length} roles</strong>
          </div>
          <div className="security-filter-grid">
            <label className="security-span-2">
              Buscar rol
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, descripcion, nivel o estado" />
            </label>
          </div>
        </section>

        <section className="security-panel security-list-panel">
          <div className="security-panel-heading">
            <div>
              <span>Listado</span>
              <h2>Roles del sistema</h2>
            </div>
            <strong>{selectedRole ? selectedRole.name : 'Sin seleccion'}</strong>
          </div>

          <div className="security-table-wrap">
            <table className="security-table">
              <thead>
                <tr>
                  <th>Nombre del rol</th>
                  <th>Descripcion</th>
                  <th>Nivel</th>
                  <th>Estado</th>
                  <th>Usuarios</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => (
                  <tr
                    key={role.id}
                    className={selectedRoleId === role.id ? 'is-selected' : ''}
                    onClick={() => setSelectedRoleId(role.id)}
                  >
                    <td>{role.name}</td>
                    <td>{role.description}</td>
                    <td>{role.level}</td>
                    <td>
                      <span className={role.status === 'Activo' ? 'security-badge is-success' : 'security-badge is-danger'}>
                        {role.status}
                      </span>
                    </td>
                    <td>{userCountByRole[role.id] || 0}</td>
                    <td>
                      <div className="security-table-actions">
                        <button type="button" onClick={(event) => { event.stopPropagation(); openEditRole(role) }} disabled={!canEdit}>
                          <Edit3 size={14} />
                        </button>
                        <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedRoleId(role.id) }}>
                          <ShieldCheck size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {modalMode && (
        <div className="security-modal-backdrop" role="presentation">
          <section className="security-modal is-small" role="dialog" aria-modal="true">
            <header>
              <div>
                <span>{modalMode === 'edit' ? 'Editar rol' : 'Nuevo rol'}</span>
                <h2>{modalMode === 'edit' ? form.name : 'Crear rol'}</h2>
              </div>
              <button type="button" onClick={closeModal} title="Cerrar">
                <X size={17} />
              </button>
            </header>

            <form className="security-modal-body security-form-grid" onSubmit={saveRole}>
              {error && <div className="security-alert security-span-2">{error}</div>}
              <label>
                Nombre del rol
                <input value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="Nombre del rol" disabled={form.id === 'ROLE-MAIN-ADMIN'} />
              </label>
              <label>
                Nivel de acceso
                <input type="number" value={form.level} onChange={(event) => updateForm('level', event.target.value)} min="1" max="100" />
              </label>
              <label>
                Estado
                <select value={form.status} onChange={(event) => updateForm('status', event.target.value)} disabled={form.systemRole}>
                  <option>Activo</option>
                  <option>Inactivo</option>
                </select>
              </label>
              <label>
                Rol de sistema
                <select value={form.systemRole ? 'Si' : 'No'} onChange={(event) => updateForm('systemRole', event.target.value === 'Si')} disabled>
                  <option>Si</option>
                  <option>No</option>
                </select>
              </label>
              <label className="security-span-2">
                Descripcion
                <textarea value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="Descripcion del rol" />
              </label>
            </form>

            <footer>
              <button type="button" onClick={closeModal}>Cancelar</button>
              <button type="button" className="is-primary" onClick={saveRole}>
                <Save size={15} />
                Guardar
              </button>
            </footer>
          </section>
        </div>
      )}
    </ModulePageLayout>
  )
}
