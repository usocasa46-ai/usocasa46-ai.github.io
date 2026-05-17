import {
  Ban,
  Edit3,
  Eye,
  FilePlus2,
  KeyRound,
  LogOut,
  Save,
  ShieldCheck,
  UserCog,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  appendAuditLog,
  getRolePermissions,
  loadRoles,
  loadUsers,
  saveUsers,
  userCanForUser,
} from '../../security/permissions.js'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import './SecurityModule.css'

const emptyUser = {
  id: '',
  fullName: '',
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: '',
  branch: 'Matriz',
  roleId: 'ROLE-BASIC',
  status: 'Activo',
  accessEnabled: true,
  isAdmin: false,
}

function nextUserId(users) {
  const maxNumber = users.reduce((max, user) => {
    const parsed = Number.parseInt(String(user.id || '').replace(/[^\d]/g, ''), 10)
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max
  }, 0)

  return `USR-${String(maxNumber + 1).padStart(3, '0')}`
}

function statusLabel(user) {
  return user.active && user.status !== 'Inactivo' && user.accessEnabled !== false ? 'Activo' : 'Inactivo'
}

function formatDate(value) {
  if (!value || value === 'Inicial') return value || 'Sin acceso'

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

export default function SecurityUsersPage({ controls, session, onAction, onReplaceUsers }) {
  const [users, setUsers] = useState(() => loadUsers())
  const [roles] = useState(() => loadRoles())
  const [selectedUsername, setSelectedUsername] = useState('')
  const [form, setForm] = useState(emptyUser)
  const [modalMode, setModalMode] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [permissionUser, setPermissionUser] = useState(null)
  const [filters, setFilters] = useState({
    name: '',
    username: '',
    role: '',
    status: 'Todos',
  })

  const selectedUser = users.find((user) => user.username === selectedUsername)
  const canCreate = userCanForUser(session, 'security-users', 'create')
  const canEdit = userCanForUser(session, 'security-users', 'edit')
  const canDelete = userCanForUser(session, 'security-users', 'delete')

  const roleById = useMemo(() => {
    return roles.reduce((map, role) => {
      map[role.id] = role
      return map
    }, {})
  }, [roles])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const roleName = roleById[user.roleId]?.name || user.role || ''
      const matchesName = String(user.fullName || '').toLowerCase().includes(filters.name.toLowerCase())
      const matchesUsername = String(user.username || '').toLowerCase().includes(filters.username.toLowerCase())
      const matchesRole = String(roleName).toLowerCase().includes(filters.role.toLowerCase())
      const matchesStatus = filters.status === 'Todos' || statusLabel(user) === filters.status

      return matchesName && matchesUsername && matchesRole && matchesStatus
    })
  }, [filters, roleById, users])

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      if (modalMode || permissionUser) {
        event.preventDefault()
        closeModal()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [modalMode, permissionUser])

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const persistUsers = (nextUsers, auditAction, auditDescription) => {
    const savedUsers = saveUsers(nextUsers)
    setUsers(savedUsers)
    onReplaceUsers?.(savedUsers)

    if (auditAction) {
      appendAuditLog(auditAction, {
        module: 'Seguridad',
        submodule: 'Usuarios',
        description: auditDescription,
      })
    }
  }

  const openNewUser = () => {
    setForm({
      ...emptyUser,
      id: nextUserId(users),
    })
    setError('')
    setModalMode('new')
  }

  const openEditUser = (user = selectedUser) => {
    if (!user) return
    setForm({
      ...emptyUser,
      ...user,
      roleId: user.roleId || roles.find((role) => role.name === user.role)?.id || 'ROLE-BASIC',
      status: statusLabel(user),
      password: '',
      confirmPassword: '',
    })
    setError('')
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode('')
    setPermissionUser(null)
    setError('')
  }

  const saveUser = (event) => {
    event.preventDefault()
    const cleanUsername = form.username.trim()
    const cleanFullName = form.fullName.trim()
    const selectedRole = roleById[form.roleId] || roles[0]

    if (!cleanFullName || !cleanUsername) {
      setError('Completa nombre completo y usuario.')
      return
    }

    if (modalMode === 'new' && !form.password.trim()) {
      setError('La contrasena es obligatoria al crear usuario.')
      return
    }

    if (form.password && form.password !== form.confirmPassword) {
      setError('La confirmacion de contrasena no coincide.')
      return
    }

    const usernameExists = users.some((user) => {
      return user.username.toLowerCase() === cleanUsername.toLowerCase() && user.username !== selectedUsername
    })

    if (usernameExists) {
      setError('Ya existe un usuario con ese nombre de usuario.')
      return
    }

    if (modalMode === 'edit' && selectedUser?.isMainAdmin && form.roleId !== 'ROLE-MAIN-ADMIN') {
      setError('El administrador principal debe conservar su rol de seguridad.')
      return
    }

    const nextUser = {
      ...form,
      username: cleanUsername,
      fullName: cleanFullName,
      roleId: selectedRole.id,
      role: selectedRole.name,
      active: form.status === 'Activo' && form.accessEnabled,
      accessEnabled: Boolean(form.accessEnabled),
      isAdmin: Boolean(form.isAdmin || selectedRole.id === 'ROLE-ADMIN' || selectedRole.id === 'ROLE-MAIN-ADMIN'),
      isMainAdmin: Boolean(form.isMainAdmin || selectedRole.id === 'ROLE-MAIN-ADMIN'),
      createdAt: form.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (!form.password) {
      delete nextUser.password
    }

    const nextUsers = modalMode === 'edit'
      ? users.map((user) => {
        if (user.username !== selectedUsername) return user

        return {
          ...user,
          ...nextUser,
          password: nextUser.password || user.password,
        }
      })
      : [...users, nextUser]

    persistUsers(
      nextUsers,
      modalMode === 'edit' ? 'Editar usuario' : 'Crear usuario',
      `${modalMode === 'edit' ? 'Editado' : 'Creado'} usuario ${cleanUsername}`,
    )
    setSelectedUsername(cleanUsername)
    setMessage(modalMode === 'edit' ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.')
    onAction?.(modalMode === 'edit' ? 'Usuario actualizado' : 'Usuario creado')
    closeModal()
  }

  const toggleUserStatus = () => {
    if (!selectedUser || selectedUser.isMainAdmin) return

    const nextUsers = users.map((user) => {
      if (user.username !== selectedUser.username) return user

      const nextActive = !user.active
      return {
        ...user,
        active: nextActive,
        status: nextActive ? 'Activo' : 'Inactivo',
        accessEnabled: nextActive,
        updatedAt: new Date().toISOString(),
      }
    })

    persistUsers(
      nextUsers,
      selectedUser.active ? 'Inactivar usuario' : 'Activar usuario',
      `${selectedUser.active ? 'Inactivado' : 'Activado'} usuario ${selectedUser.username}`,
    )
    setMessage(selectedUser.active ? 'Usuario inactivado correctamente.' : 'Usuario activado correctamente.')
  }

  const resetPassword = () => {
    if (!selectedUser || selectedUser.isMainAdmin) return

    const nextUsers = users.map((user) => {
      if (user.username !== selectedUser.username) return user
      return {
        ...user,
        password: '1234',
        mustChangePassword: true,
        updatedAt: new Date().toISOString(),
      }
    })

    persistUsers(nextUsers, 'Restablecer contrasena', `Contrasena temporal asignada a ${selectedUser.username}`)
    setMessage('Contrasena restablecida a 1234.')
  }

  const permissionSummary = (user) => {
    const role = roleById[user?.roleId] || roles.find((item) => item.name === user?.role)
    const rolePermissions = getRolePermissions(role?.id)
    const enabledPages = Object.entries(rolePermissions || {}).filter(([, actions]) => actions?.includes('view'))

    return {
      role,
      enabledPages,
    }
  }

  return (
    <ModulePageLayout
      title="Usuarios"
      moduleLabel="Seguridad"
      description="Administra usuarios, accesos, roles y estado de ingreso al sistema."
      breadcrumb={['Seguridad', 'Usuarios']}
      actions={[
        { id: 'new', label: 'Nuevo usuario', icon: FilePlus2, variant: 'primary', onClick: openNewUser, disabled: !canCreate },
        { id: 'edit', label: 'Editar', icon: Edit3, onClick: () => openEditUser(), disabled: !selectedUser || !canEdit },
        { id: 'toggle', label: selectedUser?.active ? 'Inactivar' : 'Activar', icon: Ban, onClick: toggleUserStatus, disabled: !selectedUser || selectedUser.isMainAdmin || !canDelete },
        { id: 'reset', label: 'Restablecer contrasena', icon: KeyRound, onClick: resetPassword, disabled: !selectedUser || selectedUser.isMainAdmin || !canEdit },
        { id: 'assign', label: 'Asignar rol', icon: UserCog, onClick: () => openEditUser(), disabled: !selectedUser || !canEdit },
        { id: 'permissions', label: 'Ver permisos', icon: ShieldCheck, onClick: () => setPermissionUser(selectedUser), disabled: !selectedUser },
        { id: 'exit', label: 'Salir', icon: LogOut, onClick: controls?.onClose },
      ]}
      {...controls}
    >
      <div className="security-page security-users-page">
        {message && <div className="security-message">{message}</div>}

        <section className="security-panel security-filter-panel">
          <div className="security-panel-heading">
            <div>
              <span>Busqueda</span>
              <h2>Consultar usuarios</h2>
            </div>
            <strong>{filteredUsers.length} registros</strong>
          </div>

          <div className="security-filter-grid">
            <label>
              Buscar por nombre
              <input value={filters.name} onChange={(event) => updateFilter('name', event.target.value)} placeholder="Nombre completo" />
            </label>
            <label>
              Buscar por usuario
              <input value={filters.username} onChange={(event) => updateFilter('username', event.target.value)} placeholder="Usuario" />
            </label>
            <label>
              Buscar por rol
              <input value={filters.role} onChange={(event) => updateFilter('role', event.target.value)} placeholder="Rol" />
            </label>
            <label>
              Estado
              <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
                <option>Todos</option>
                <option>Activo</option>
                <option>Inactivo</option>
              </select>
            </label>
          </div>
        </section>

        <section className="security-panel security-list-panel">
          <div className="security-panel-heading">
            <div>
              <span>Listado</span>
              <h2>Usuarios del sistema</h2>
            </div>
            <strong>{selectedUser ? selectedUser.username : 'Sin seleccion'}</strong>
          </div>

          <div className="security-table-wrap">
            <table className="security-table">
              <thead>
                <tr>
                  <th>Nombre completo</th>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Sucursal</th>
                  <th>Estado</th>
                  <th>Ultimo acceso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.username}
                    className={selectedUsername === user.username ? 'is-selected' : ''}
                    onClick={() => setSelectedUsername(user.username)}
                  >
                    <td>{user.fullName}</td>
                    <td>{user.username}</td>
                    <td>{roleById[user.roleId]?.name || user.role}</td>
                    <td>{user.branch || 'Matriz'}</td>
                    <td>
                      <span className={statusLabel(user) === 'Activo' ? 'security-badge is-success' : 'security-badge is-danger'}>
                        {statusLabel(user)}
                      </span>
                    </td>
                    <td>{formatDate(user.lastAccess)}</td>
                    <td>
                      <div className="security-table-actions">
                        <button type="button" onClick={(event) => { event.stopPropagation(); openEditUser(user) }} disabled={!canEdit}>
                          <Edit3 size={14} />
                        </button>
                        <button type="button" onClick={(event) => { event.stopPropagation(); setPermissionUser(user) }}>
                          <Eye size={14} />
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
          <section className="security-modal" role="dialog" aria-modal="true">
            <header>
              <div>
                <span>{modalMode === 'edit' ? 'Editar usuario' : 'Nuevo usuario'}</span>
                <h2>{modalMode === 'edit' ? form.fullName || form.username : 'Crear usuario'}</h2>
              </div>
              <button type="button" onClick={closeModal} title="Cerrar">
                <X size={17} />
              </button>
            </header>

            <form className="security-modal-body security-form-grid" onSubmit={saveUser}>
              {error && <div className="security-alert security-span-2">{error}</div>}

              <label>
                Nombre completo
                <input value={form.fullName} onChange={(event) => updateForm('fullName', event.target.value)} placeholder="Nombre completo" />
              </label>
              <label>
                Usuario
                <input value={form.username} onChange={(event) => updateForm('username', event.target.value)} placeholder="usuario" disabled={form.isMainAdmin} />
              </label>
              <label>
                Contrasena
                <input type="password" value={form.password} onChange={(event) => updateForm('password', event.target.value)} placeholder={modalMode === 'edit' ? 'Dejar vacio para mantener' : 'Contrasena'} />
              </label>
              <label>
                Confirmar contrasena
                <input type="password" value={form.confirmPassword} onChange={(event) => updateForm('confirmPassword', event.target.value)} placeholder="Confirmar contrasena" />
              </label>
              <label>
                Correo
                <input type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} placeholder="correo@empresa.com" />
              </label>
              <label>
                Telefono
                <input value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} placeholder="Telefono" />
              </label>
              <label>
                Sucursal
                <input value={form.branch} onChange={(event) => updateForm('branch', event.target.value)} placeholder="Matriz" />
              </label>
              <label>
                Rol
                <select value={form.roleId} onChange={(event) => updateForm('roleId', event.target.value)} disabled={form.isMainAdmin}>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Estado
                <select value={form.status} onChange={(event) => updateForm('status', event.target.value)} disabled={form.isMainAdmin}>
                  <option>Activo</option>
                  <option>Inactivo</option>
                </select>
              </label>
              <label>
                Permitir acceso al sistema
                <select value={form.accessEnabled ? 'Si' : 'No'} onChange={(event) => updateForm('accessEnabled', event.target.value === 'Si')} disabled={form.isMainAdmin}>
                  <option>Si</option>
                  <option>No</option>
                </select>
              </label>
              <label>
                Es administrador
                <select value={form.isAdmin ? 'Si' : 'No'} onChange={(event) => updateForm('isAdmin', event.target.value === 'Si')} disabled={form.isMainAdmin}>
                  <option>Si</option>
                  <option>No</option>
                </select>
              </label>
            </form>

            <footer>
              <button type="button" onClick={closeModal}>Cancelar</button>
              <button type="button" className="is-primary" onClick={saveUser}>
                <Save size={15} />
                Guardar
              </button>
            </footer>
          </section>
        </div>
      )}

      {permissionUser && (
        <div className="security-modal-backdrop" role="presentation">
          <section className="security-modal is-small" role="dialog" aria-modal="true">
            <header>
              <div>
                <span>Permisos</span>
                <h2>{permissionUser.fullName}</h2>
              </div>
              <button type="button" onClick={closeModal} title="Cerrar">
                <X size={17} />
              </button>
            </header>
            <div className="security-modal-body">
              <div className="security-summary-grid">
                <article>
                  <span>Rol</span>
                  <strong>{permissionSummary(permissionUser).role?.name}</strong>
                </article>
                <article>
                  <span>Paginas visibles</span>
                  <strong>{permissionSummary(permissionUser).enabledPages.length}</strong>
                </article>
              </div>
              <div className="security-permission-list">
                {permissionSummary(permissionUser).enabledPages.map(([pageId, actions]) => (
                  <div key={pageId}>
                    <strong>{pageId}</strong>
                    <span>{actions.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
            <footer>
              <button type="button" onClick={closeModal}>Cerrar</button>
            </footer>
          </section>
        </div>
      )}
    </ModulePageLayout>
  )
}
