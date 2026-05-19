import { useEffect, useState } from 'react'
import AppWorkspace from './AppWorkspace.jsx'
import LoginScreen from './LoginScreen.jsx'
import {
  clearSession,
  loadSession,
  logoutByInactivity,
  saveSession,
  startInactivityTimer,
} from '../security/sessionManager.js'

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
    const parsedSession = loadSession()

    if (!parsedSession || parsedSession.authVersion !== AUTH_VERSION) {
      clearSession()
      return null
    }

    const users = loadUsers()
    const existingUser = users.find((user) => user.username === parsedSession.username && user.active)

    if (!existingUser) {
      clearSession()
      return null
    }

    return parsedSession
  } catch {
    clearSession()
    return null
  }
}

export default function AuthGate() {
  const [users, setUsers] = useState(() => loadUsers())
  const [session, setSession] = useState(() => loadValidSession())
  const [loginNotice, setLoginNotice] = useState('')

  useEffect(() => {
    if (!session) return undefined

    return startInactivityTimer(() => {
      logoutByInactivity((reason) => handleLogout(reason))
    })
  }, [session])

  const persistUsers = (nextUsers) => {
    setUsers(nextUsers)
    saveUsers(nextUsers)
  }

  const handleLogin = ({ username, password }) => {
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

    saveSession(nextSession)
    setLoginNotice('')
    setSession(nextSession)
    return { ok: true }
  }

  const handleLogout = (reason) => {
    clearSession()
    setLoginNotice(reason === 'inactivity' ? 'Sesion cerrada por inactividad' : '')
    setSession(null)
  }

  const createUser = (userData) => {

    if (!session?.isMainAdmin) {
      return {
        ok: false,
        message: 'Solo el Administrador Principal puede crear usuarios.',
      }
    }

    const cleanUsername = String(userData?.username || '').trim()
    const cleanFullName = String(userData?.fullName || '').trim()
    const cleanPassword = String(userData?.password || '').trim()

    if (!cleanFullName || !cleanUsername || !cleanPassword) {
      return {
        ok: false,
        message: 'Completa nombre, usuario y contrasena.',
      }
    }

    if (cleanPassword.length < 4) {
      return {
        ok: false,
        message: 'La contrasena debe tener minimo 4 caracteres.',
      }
    }

    const exists = users.some((user) => user.username.toLowerCase() === cleanUsername.toLowerCase())

    if (exists) {
      return {
        ok: false,
        message: 'Ya existe un usuario con ese nombre.',
      }
    }

    const nextUser = {
      id: `USR-${String(users.length + 1).padStart(3, '0')}`,
      fullName: cleanFullName,
      username: cleanUsername,
      password: cleanPassword,
      role: userData?.role || 'Usuario',
      active: userData?.active !== false,
      isMainAdmin: false,
      createdAt: new Date().toISOString(),
    }

    persistUsers([...users, nextUser])
    return { ok: true, user: nextUser }
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
    return <LoginScreen onLogin={handleLogin} notice={loginNotice} />
  }

  return (
    <AppWorkspace
      session={session}
      users={users}
      onLogout={handleLogout}
      onCreateUser={createUser}
      onToggleUserStatus={toggleUserStatus}
      onDeleteUser={deleteUser}
      onReplaceUsers={persistUsers}
    />
  )
}
