import { useEffect, useState } from 'react'
import App from '../App.jsx'
import LoginScreen from './LoginScreen.jsx'
import './AuthGate.css'

const AUTH_VERSION = 2

const MAIN_ADMIN = {
  id: 'USR-001',
  fullName: 'Administrador Principal',
  username: 'admin',
  password: 'admin123',
  role: 'Administrador Principal',
  active: true,
  isMainAdmin: true,
  createdAt: 'Inicial',
}

function saveUsers(users) {
  localStorage.setItem('inveFatUsers', JSON.stringify(users))
}

function loadUsers() {
  try {
    const savedUsers = localStorage.getItem('inveFatUsers')
    const parsedUsers = savedUsers ? JSON.parse(savedUsers) : null

    if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
      const hasMainAdmin = parsedUsers.some((user) => user.isMainAdmin)

      if (hasMainAdmin) return parsedUsers

      const usersWithAdmin = [MAIN_ADMIN, ...parsedUsers]
      saveUsers(usersWithAdmin)
      return usersWithAdmin
    }
  } catch {
    // continuar con usuario principal
  }

  saveUsers([MAIN_ADMIN])
  return [MAIN_ADMIN]
}

function loadValidSession() {
  try {
    const savedSession = localStorage.getItem('inveFatSession')
    const parsedSession = savedSession ? JSON.parse(savedSession) : null

    if (!parsedSession || parsedSession.authVersion !== AUTH_VERSION) {
      localStorage.removeItem('inveFatSession')
      return null
    }

    const users = loadUsers()
    const existingUser = users.find((user) => user.username === parsedSession.username && user.active)

    if (!existingUser) {
      localStorage.removeItem('inveFatSession')
      return null
    }

    return parsedSession
  } catch {
    localStorage.removeItem('inveFatSession')
    return null
  }
}

export default function AuthGate() {
  const [users, setUsers] = useState(() => loadUsers())
  const [session, setSession] = useState(() => loadValidSession())
  const [showUsersPanel, setShowUsersPanel] = useState(false)
  const [showFileMenu, setShowFileMenu] = useState(false)
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [fileMenuPosition, setFileMenuPosition] = useState({ top: 52, left: 430 })
  const [userError, setUserError] = useState('')
  const [newUser, setNewUser] = useState({
    fullName: '',
    username: '',
    password: '',
    role: 'Usuario',
    active: true,
  })

  const persistUsers = (nextUsers) => {
    setUsers(nextUsers)
    saveUsers(nextUsers)
  }

  const handleLogin = ({ username, password, remember }) => {
    const foundUser = users.find((user) => {
      return (
        user.username.toLowerCase() === username.toLowerCase() &&
        user.password === password &&
        user.active
      )
    })

    if (!foundUser) {
      return {
        ok: false,
        message: 'Usuario o contrasena incorrectos, o usuario inactivo.',
      }
    }

    const nextSession = {
      authVersion: AUTH_VERSION,
      username: foundUser.username,
      fullName: foundUser.fullName,
      role: foundUser.role,
      isMainAdmin: Boolean(foundUser.isMainAdmin),
      loginAt: new Date().toISOString(),
    }

    if (remember) {
      localStorage.setItem('inveFatSession', JSON.stringify(nextSession))
    } else {
      localStorage.removeItem('inveFatSession')
    }

    setSession(nextSession)
    return { ok: true }
  }

  const handleLogout = () => {
    localStorage.removeItem('inveFatSession')
    setSession(null)
    setShowUsersPanel(false)
    setShowFileMenu(false)
    setShowAdminMenu(false)
  }

  useEffect(() => {
    if (!session) return undefined

    let removeFileMenu = () => {}

    const connectFileMenu = () => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const fileButton = buttons.find((button) => button.textContent.trim() === 'Archivo')

      if (!fileButton) return

      const openFileMenu = (event) => {
        event.preventDefault()
        event.stopPropagation()

        const rect = fileButton.getBoundingClientRect()

        setFileMenuPosition({
          top: rect.bottom + 8,
          left: rect.left,
        })

        setShowAdminMenu(false)
        setShowFileMenu((current) => !current)
      }

      fileButton.addEventListener('click', openFileMenu)

      removeFileMenu = () => {
        fileButton.removeEventListener('click', openFileMenu)
      }
    }

    const closeMenus = (event) => {
      if (
        event.target.closest('.auth-file-dropdown') ||
        event.target.closest('.auth-admin-dropdown') ||
        event.target.closest('.auth-admin-hitbox') ||
        event.target.textContent?.trim() === 'Archivo'
      ) {
        return
      }

      setShowFileMenu(false)
      setShowAdminMenu(false)
    }

    const timer = setTimeout(connectFileMenu, 300)
    document.addEventListener('click', closeMenus)

    return () => {
      clearTimeout(timer)
      removeFileMenu()
      document.removeEventListener('click', closeMenus)
    }
  }, [session])

  const updateNewUser = (field, value) => {
    setNewUser((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const resetNewUser = () => {
    setNewUser({
      fullName: '',
      username: '',
      password: '',
      role: 'Usuario',
      active: true,
    })
  }

  const createUser = (event) => {
    event.preventDefault()

    if (!session?.isMainAdmin) {
      setUserError('Solo el Administrador Principal puede crear usuarios.')
      return
    }

    const cleanUsername = newUser.username.trim()
    const cleanFullName = newUser.fullName.trim()

    if (!cleanFullName || !cleanUsername || !newUser.password.trim()) {
      setUserError('Completa nombre, usuario y contrasena.')
      return
    }

    if (newUser.password.trim().length < 4) {
      setUserError('La contrasena debe tener minimo 4 caracteres.')
      return
    }

    const exists = users.some((user) => user.username.toLowerCase() === cleanUsername.toLowerCase())

    if (exists) {
      setUserError('Ya existe un usuario con ese nombre.')
      return
    }

    const nextUser = {
      id: `USR-${String(users.length + 1).padStart(3, '0')}`,
      fullName: cleanFullName,
      username: cleanUsername,
      password: newUser.password.trim(),
      role: newUser.role,
      active: Boolean(newUser.active),
      isMainAdmin: false,
      createdAt: new Date().toISOString(),
    }

    persistUsers([...users, nextUser])
    resetNewUser()
    setUserError('')
  }

  const toggleUserStatus = (username) => {
    if (!session?.isMainAdmin) return

    const nextUsers = users.map((user) => {
      if (user.username !== username || user.isMainAdmin) return user

      return {
        ...user,
        active: !user.active,
      }
    })

    persistUsers(nextUsers)
  }

  const deleteUser = (username) => {
    if (!session?.isMainAdmin) return

    const nextUsers = users.filter((user) => user.username !== username || user.isMainAdmin)

    persistUsers(nextUsers)
  }

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <>
      <App />

      {showFileMenu && (
        <div
          className="auth-file-dropdown"
          style={{
            top: `${fileMenuPosition.top}px`,
            left: `${fileMenuPosition.left}px`,
          }}
        >
          <button type="button">Nuevo</button>
          <button type="button">Abrir</button>
          <button type="button">Guardar</button>
          <button type="button">Guardar como</button>
          <button type="button" onClick={() => window.print()}>Imprimir</button>
          <button type="button">Exportar PDF</button>
          <button type="button">Configurar pagina</button>

          <div className="auth-file-separator" />

          <button type="button" className="auth-file-danger" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </div>
      )}

      {session.isMainAdmin && !showUsersPanel && (
        <button
          type="button"
          className="auth-admin-hitbox"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setShowFileMenu(false)
            setShowAdminMenu((current) => !current)
          }}
          title="Menu administrador"
        />
      )}

      {showAdminMenu && session.isMainAdmin && !showUsersPanel && (
        <>
          <button
            type="button"
            className="auth-admin-backdrop"
            onClick={() => setShowAdminMenu(false)}
            aria-label="Cerrar menu administrador"
          />

          <div className="auth-admin-dropdown">
            <button
              type="button"
              onClick={() => {
                setShowAdminMenu(false)
                setShowUsersPanel(true)
              }}
            >
              Crear usuario
            </button>
          </div>
        </>
      )}

      {showUsersPanel && session.isMainAdmin && (
        <section className="auth-users-panel">
          <div className="auth-users-header">
            <div>
              <span>Administrador Principal</span>
              <h3>Gestion de usuarios</h3>
              <p>Crea usuarios autorizados para entrar al sistema.</p>
            </div>

            <button type="button" onClick={() => setShowUsersPanel(false)}>
              Cerrar
            </button>
          </div>

          {userError && (
            <div className="auth-user-error">
              {userError}
            </div>
          )}

          <form className="auth-user-form" onSubmit={createUser}>
            <label>
              Nombre
              <input
                value={newUser.fullName}
                onChange={(event) => updateNewUser('fullName', event.target.value)}
                placeholder="Nombre completo"
              />
            </label>

            <label>
              Usuario
              <input
                value={newUser.username}
                onChange={(event) => updateNewUser('username', event.target.value)}
                placeholder="usuario"
              />
            </label>

            <label>
              Contrasena
              <input
                type="password"
                value={newUser.password}
                onChange={(event) => updateNewUser('password', event.target.value)}
                placeholder="contrasena"
              />
            </label>

            <label>
              Rol
              <select
                value={newUser.role}
                onChange={(event) => updateNewUser('role', event.target.value)}
              >
                <option>Usuario</option>
                <option>Facturacion</option>
                <option>Inventario</option>
                <option>Compras</option>
                <option>Administrador</option>
              </select>
            </label>

            <label className="auth-user-check">
              <input
                type="checkbox"
                checked={newUser.active}
                onChange={(event) => updateNewUser('active', event.target.checked)}
              />
              Activo
            </label>

            <button type="submit">
              Crear usuario
            </button>
          </form>

          <div className="auth-user-list">
            {users.map((user) => (
              <article key={user.username}>
                <div>
                  <strong>{user.fullName}</strong>
                  <span>{user.username} - {user.role}</span>
                </div>

                <em className={user.active ? 'auth-active' : 'auth-inactive'}>
                  {user.active ? 'Activo' : 'Inactivo'}
                </em>

                <button
                  type="button"
                  disabled={user.isMainAdmin}
                  onClick={() => toggleUserStatus(user.username)}
                >
                  {user.active ? 'Desactivar' : 'Activar'}
                </button>

                <button
                  type="button"
                  disabled={user.isMainAdmin}
                  onClick={() => deleteUser(user.username)}
                >
                  Eliminar
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  )
}