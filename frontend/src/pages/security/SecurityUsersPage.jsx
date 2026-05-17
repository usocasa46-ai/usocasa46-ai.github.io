import { FilePlus2, Save, ShieldCheck, Trash2, UserCheck } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'

const emptyUser = {
  fullName: '',
  username: '',
  password: '',
  role: 'Usuario',
  active: true,
}

export default function SecurityUsersPage({
  controls,
  session,
  users = [],
  onCreateUser,
  onToggleUserStatus,
  onDeleteUser,
  onAction,
  searchValue = '',
  onSearchChange,
}) {
  const [formData, setFormData] = useState(emptyUser)
  const [localError, setLocalError] = useState('')
  const formRef = useRef(null)
  const search = searchValue
  const setSearch = onSearchChange || (() => {})

  const filteredUsers = useMemo(() => {
    const text = search.toLowerCase().trim()
    if (!text) return users

    return users.filter((user) => {
      return [user.fullName, user.username, user.role, user.active ? 'Activo' : 'Inactivo'].some((value) => {
        return String(value || '').toLowerCase().includes(text)
      })
    })
  }, [search, users])

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const result = onCreateUser?.(formData)

    if (result?.ok === false) {
      setLocalError(result.message || 'No se pudo crear el usuario.')
      return
    }

    setLocalError('')
    setFormData(emptyUser)
    onAction?.('Usuario creado correctamente')
  }

  const canManageUsers = Boolean(session?.isMainAdmin)

  return (
    <ModulePageLayout
      title="Usuarios"
      moduleLabel="Seguridad"
      description="Administracion de usuarios autorizados, roles base y estado de acceso al sistema."
      breadcrumb={['Seguridad', 'Usuarios']}
      searchValue={search}
      searchPlaceholder="Buscar por nombre, usuario, rol o estado"
      onSearchChange={setSearch}
      actions={[
        { id: 'new', label: 'Nuevo usuario', icon: FilePlus2, variant: 'primary', onClick: () => setFormData(emptyUser), disabled: !canManageUsers },
        { id: 'save', label: 'Guardar usuario', icon: Save, onClick: () => formRef.current?.requestSubmit(), disabled: !canManageUsers },
      ]}
      statusCards={[
        { label: 'Usuarios', value: String(users.length), detail: 'registrados' },
        { label: 'Activos', value: String(users.filter((user) => user.active).length), detail: 'con acceso' },
        { label: 'Roles base', value: '5', detail: 'estructura preparada' },
        { label: 'Auditoria', value: 'Activa', detail: 'acciones registrables' },
      ]}
      sidePanel={(
        <>
          <section className="erp-panel">
            <h3>Permisos preparados</h3>
            <ul className="erp-note-list">
              <li>Permisos por modulo y submodulo.</li>
              <li>Acciones: ver, crear, editar, eliminar, aprobar, imprimir y exportar.</li>
              <li>Roles separados para administrador, facturacion, inventario, compras y usuario.</li>
            </ul>
          </section>
          <section className="erp-panel">
            <h3>Perfil activo</h3>
            <dl className="erp-detail-list">
              <div className="erp-detail-row"><span>Usuario</span><strong>{session?.username}</strong></div>
              <div className="erp-detail-row"><span>Rol</span><strong>{session?.role}</strong></div>
              <div className="erp-detail-row"><span>Principal</span><strong>{session?.isMainAdmin ? 'Si' : 'No'}</strong></div>
            </dl>
          </section>
        </>
      )}
      {...controls}
    >
      <div className="erp-data-grid">
        <section className="erp-panel">
          <h2>Crear usuario</h2>
          {!canManageUsers && (
            <div className="erp-inline-alert">
              Solo el Administrador Principal puede crear, desactivar o eliminar usuarios.
            </div>
          )}
          {localError && <div className="erp-inline-alert is-danger">{localError}</div>}

          <form ref={formRef} className="erp-form-grid" onSubmit={handleSubmit}>
            <label>
              Nombre completo
              <input
                value={formData.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                placeholder="Nombre completo"
                disabled={!canManageUsers}
              />
            </label>
            <label>
              Usuario
              <input
                value={formData.username}
                onChange={(event) => updateField('username', event.target.value)}
                placeholder="usuario"
                disabled={!canManageUsers}
              />
            </label>
            <label>
              Contrasena
              <input
                type="password"
                value={formData.password}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder="minimo 4 caracteres"
                disabled={!canManageUsers}
              />
            </label>
            <label>
              Rol
              <select
                value={formData.role}
                onChange={(event) => updateField('role', event.target.value)}
                disabled={!canManageUsers}
              >
                <option>Usuario</option>
                <option>Facturacion</option>
                <option>Inventario</option>
                <option>Compras</option>
                <option>Administrador</option>
              </select>
            </label>
            <label>
              Estado
              <select
                value={formData.active ? 'Activo' : 'Inactivo'}
                onChange={(event) => updateField('active', event.target.value === 'Activo')}
                disabled={!canManageUsers}
              >
                <option>Activo</option>
                <option>Inactivo</option>
              </select>
            </label>
            <label>
              Politica inicial
              <select disabled={!canManageUsers} defaultValue="Cambio posterior">
                <option>Cambio posterior</option>
                <option>Clave temporal</option>
              </select>
            </label>
          </form>
        </section>

        <section className="erp-panel">
          <h2>Listado de usuarios</h2>
          <div className="erp-table-wrap">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.username}>
                    <td>{user.fullName}</td>
                    <td>{user.username}</td>
                    <td>{user.role}</td>
                    <td>
                      <span className={user.active ? 'erp-badge is-success' : 'erp-badge is-danger'}>
                        {user.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="erp-table-actions">
                        <button
                          type="button"
                          disabled={!canManageUsers || user.isMainAdmin}
                          onClick={() => {
                            onToggleUserStatus?.(user.username)
                            onAction?.(user.active ? 'Usuario desactivado' : 'Usuario activado')
                          }}
                          title={user.active ? 'Desactivar' : 'Activar'}
                        >
                          <UserCheck size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={!canManageUsers || user.isMainAdmin}
                          onClick={() => {
                            onDeleteUser?.(user.username)
                            onAction?.('Usuario eliminado')
                          }}
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="erp-panel">
          <h2>Roles y acciones</h2>
          <div className="erp-table-wrap">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Rol</th>
                  <th>Modulos</th>
                  <th>Acciones</th>
                  <th>Base</th>
                </tr>
              </thead>
              <tbody>
                {['Administrador', 'Facturacion', 'Inventario', 'Compras', 'Usuario'].map((role) => (
                  <tr key={role}>
                    <td>{role}</td>
                    <td>Segun permisos asignados</td>
                    <td>Ver, crear, editar, aprobar, imprimir, exportar</td>
                    <td><ShieldCheck size={16} /></td>
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
