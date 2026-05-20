import { useEffect, useState } from 'react'
import AppWorkspace from './AppWorkspace.jsx'
import LoginScreen from './LoginScreen.jsx'
import SuperAdminPanel from './SuperAdminPanel.jsx'
import {
  clearSession,
  loadSession,
  logoutByInactivity,
  saveSession,
  startInactivityTimer,
} from '../security/sessionManager.js'
import {
  appendSystemAudit,
  createCompany,
  createSupportAccess,
  findCompanyByCode,
  getCompanyAccessStatus,
  installCompanyStorageScope,
  isCompanyActive,
  loadCompanies,
  loadSystemPlans,
  loadCompanyUsers,
  saveSystemPlans,
  saveCompanyUsers,
  upsertCompanyLicense,
  updateCompany,
} from '../services/companyStorage.js'

const AUTH_VERSION = 3
const SYSTEM_COMPANY_CODE = 'SYSTEM'
const SUPER_ADMIN = {
  username: 'superadmin',
  password: 'admin123',
  fullName: 'Super Admin',
  role: 'Super Admin',
}

installCompanyStorageScope()

function loadValidSession() {
  try {
    const parsedSession = loadSession()

    if (!parsedSession || parsedSession.authVersion !== AUTH_VERSION) {
      clearSession()
      return null
    }

    if (parsedSession.isSuperAdmin) return parsedSession

    const company = findCompanyByCode(parsedSession.currentCompanyCode)
    if (!company || !isCompanyActive(company)) {
      clearSession()
      return null
    }

    const users = loadCompanyUsers(company)
    const existingUser = users.find((user) => (
      user.username === parsedSession.username &&
      user.companyId === company.id &&
      user.active
    ))

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
  const [companies, setCompanies] = useState(() => loadCompanies())
  const [plans, setPlans] = useState(() => loadSystemPlans())
  const [session, setSession] = useState(() => loadValidSession())
  const [users, setUsers] = useState(() => {
    const company = findCompanyByCode(loadValidSession()?.currentCompanyCode)
    return company ? loadCompanyUsers(company) : []
  })
  const [loginNotice, setLoginNotice] = useState('')

  useEffect(() => {
    if (!session) return undefined

    return startInactivityTimer(() => {
      logoutByInactivity((reason) => handleLogout(reason))
    })
  }, [session])

  useEffect(() => {
    if (!session || session.isSuperAdmin) {
      setUsers([])
      return
    }

    const company = findCompanyByCode(session.currentCompanyCode)
    setUsers(company ? loadCompanyUsers(company) : [])
  }, [session])

  const refreshCompanies = () => setCompanies(loadCompanies())

  const persistUsers = (nextUsers) => {
    const company = findCompanyByCode(session?.currentCompanyCode)
    if (!company) return

    const saved = saveCompanyUsers(company, nextUsers)
    setUsers(saved)
  }

  const handleLogin = ({ companyCode, username, password }) => {
    const cleanCompanyCode = String(companyCode || '').trim().toUpperCase()
    const cleanUsername = String(username || '').trim()
    const cleanPassword = String(password || '').trim()

    if (cleanCompanyCode === SYSTEM_COMPANY_CODE) {
      if (cleanUsername.toLowerCase() !== SUPER_ADMIN.username || cleanPassword !== SUPER_ADMIN.password) {
        return { ok: false, message: 'Credenciales de Super Admin incorrectas.' }
      }

      const nextSession = {
        authVersion: AUTH_VERSION,
        isSuperAdmin: true,
        username: SUPER_ADMIN.username,
        fullName: SUPER_ADMIN.fullName,
        role: SUPER_ADMIN.role,
        currentRole: SUPER_ADMIN.role,
        currentUser: SUPER_ADMIN.username,
        currentCompanyId: 'SYSTEM',
        currentCompanyCode: SYSTEM_COMPANY_CODE,
        currentCompanyName: 'Panel del Sistema',
        loginAt: new Date().toISOString(),
      }

      saveSession(nextSession)
      setLoginNotice('')
      setSession(nextSession)
      return { ok: true }
    }

    const company = findCompanyByCode(cleanCompanyCode)
    if (!company) return { ok: false, message: 'Codigo de empresa no encontrado.' }
    if (!isCompanyActive(company)) return { ok: false, message: 'La empresa no esta activa.' }
    const accessStatus = getCompanyAccessStatus(company)
    if (!accessStatus.allowed) return { ok: false, message: accessStatus.message }

    const companyUsers = loadCompanyUsers(company)
    const foundUser = companyUsers.find((user) => (
      String(user.username || '').toLowerCase() === cleanUsername.toLowerCase() &&
      user.password === cleanPassword &&
      user.active
    ))

    if (!foundUser) {
      return {
        ok: false,
        message: 'Usuario o contrasena incorrectos para esta empresa, o usuario inactivo.',
      }
    }

    const nextSession = {
      authVersion: AUTH_VERSION,
      isSuperAdmin: false,
      username: foundUser.username,
      fullName: foundUser.fullName,
      role: foundUser.role,
      currentRole: foundUser.role,
      currentUser: foundUser.username,
      currentCompanyId: company.id,
      currentCompanyCode: company.companyCode,
      currentCompanyName: company.nombreComercial,
      isMainAdmin: Boolean(foundUser.isMainAdmin || String(foundUser.role || '').toLowerCase().includes('administrador')),
      mustChangePassword: Boolean(foundUser.mustChangePassword),
      firstLoginPending: Boolean(company.firstLoginPending),
      onboardingCompleted: Boolean(company.onboardingCompleted),
      loginAt: new Date().toISOString(),
    }

    if (company.firstLoginPending) {
      appendSystemAudit('Primer inicio de empresa', {
        companyCode: company.companyCode,
        usuario: foundUser.username,
        descripcion: 'Empresa accede por primera vez al sistema.',
      })
    }

    saveSession(nextSession)
    setUsers(companyUsers)
    setLoginNotice('')
    setSession(nextSession)
    return { ok: true }
  }

  const handleLogout = (reason) => {
    clearSession()
    setLoginNotice(reason === 'inactivity'
      ? 'Sesion cerrada por inactividad'
      : reason === 'system-reset'
        ? 'Sistema reiniciado correctamente. Inicie sesion nuevamente.'
        : '')
    setSession(null)
    setUsers([])
  }

  const createUser = (userData) => {
    if (!session?.isMainAdmin || session?.isSuperAdmin) {
      return {
        ok: false,
        message: 'Solo el administrador de empresa puede crear usuarios de su empresa.',
      }
    }

    const cleanUsername = String(userData?.username || '').trim()
    const cleanFullName = String(userData?.fullName || '').trim()
    const cleanPassword = String(userData?.password || '').trim()

    if (!cleanFullName || !cleanUsername || !cleanPassword) {
      return { ok: false, message: 'Completa nombre, usuario y contrasena.' }
    }

    if (cleanPassword.length < 4) {
      return { ok: false, message: 'La contrasena debe tener minimo 4 caracteres.' }
    }

    const exists = users.some((user) => user.username.toLowerCase() === cleanUsername.toLowerCase())
    if (exists) return { ok: false, message: 'Ya existe un usuario con ese nombre en esta empresa.' }

    const nextUser = {
      id: `USR-${String(users.length + 1).padStart(3, '0')}`,
      companyId: session.currentCompanyId,
      companyCode: session.currentCompanyCode,
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
    if (!session?.isMainAdmin || session?.isSuperAdmin) return

    persistUsers(users.map((user) => {
      if (user.username !== username || user.isMainAdmin) return user
      return { ...user, active: !user.active }
    }))
  }

  const deleteUser = (username) => {
    if (!session?.isMainAdmin || session?.isSuperAdmin) return
    persistUsers(users.filter((user) => user.username !== username || user.isMainAdmin))
  }

  const handleSaveCompany = (companyData) => {
    if (companyData.id) {
      const saved = updateCompany(companyData.id, companyData)
      refreshCompanies()
      return saved
    }

    const saved = createCompany({
      ...companyData,
      firstLoginPending: true,
      onboardingCompleted: false,
      createdBy: session?.username || 'superadmin',
    })

    const admin = companyData.admin || {}
    const result = createCompanyAdminUser(saved, {
      fullName: admin.fullName,
      username: admin.username,
      password: admin.password,
      email: admin.email,
      phone: admin.phone,
      mustChangePassword: true,
    })

    refreshCompanies()
    return {
      company: saved,
      admin: result.user,
      initialPassword: admin.password,
      accessSummary: {
        companyCode: saved.companyCode,
        companyName: saved.nombreComercial,
        username: result.user?.username,
        password: admin.password,
        plan: saved.plan,
        modules: saved.modulosActivos,
        fechaActivacion: saved.fechaActivacion,
        fechaVencimiento: saved.fechaVencimiento,
      },
    }
  }

  const handleCreateCompanyAdmin = (companyId, adminData) => {
    const company = companies.find((item) => item.id === companyId)
    if (!company) return { ok: false, message: 'Empresa no encontrada.' }

    const result = createCompanyAdminUser(company, adminData)
    refreshCompanies()
    return result
  }

  const createCompanyAdminUser = (company, adminData) => {
    if (!company) return { ok: false, message: 'Empresa no encontrada.' }

    const companyUsers = loadCompanyUsers(company)
    const cleanUsername = String(adminData.username || '').trim()
    const cleanFullName = String(adminData.fullName || '').trim()
    const cleanPassword = String(adminData.password || '').trim()

    if (!cleanFullName || !cleanUsername || !cleanPassword) {
      return { ok: false, message: 'Completa nombre, usuario y contrasena del admin.' }
    }

    if (companyUsers.some((user) => user.username.toLowerCase() === cleanUsername.toLowerCase())) {
      return { ok: false, message: 'Ese usuario ya existe en la empresa.' }
    }

    const user = {
      id: `USR-${String(companyUsers.length + 1).padStart(3, '0')}`,
      companyId: company.id,
      companyCode: company.companyCode,
      fullName: cleanFullName,
      username: cleanUsername,
      password: cleanPassword,
      role: 'Administrador Principal',
      active: true,
      isMainAdmin: true,
      email: adminData.email || '',
      phone: adminData.phone || '',
      mustChangePassword: adminData.mustChangePassword !== false,
      createdAt: new Date().toISOString(),
    }

    saveCompanyUsers(company, [...companyUsers, user])
    appendSystemAudit('Crear administrador de empresa', {
      companyCode: company.companyCode,
      usuario: session?.username || 'superadmin',
      descripcion: `Admin ${cleanUsername}`,
    })
    return { ok: true, user }
  }

  const handleToggleCompanyStatus = (companyId) => {
    const company = companies.find((item) => item.id === companyId)
    if (!company) return

    updateCompany(companyId, {
      estado: isCompanyActive(company) ? 'suspendida' : 'activa',
    })
    refreshCompanies()
  }

  const handleSavePlans = (nextPlans) => {
    const saved = saveSystemPlans(nextPlans)
    setPlans(saved)
    return saved
  }

  const handleUpdateCompanyLicense = (companyId, patch) => {
    const company = companies.find((item) => item.id === companyId)
    if (!company) return null
    const license = upsertCompanyLicense(company, patch)
    refreshCompanies()
    return license
  }

  const handleAuthorizeSupport = ({ hours, motivo }) => {
    const company = findCompanyByCode(session?.currentCompanyCode)
    if (!company) return { ok: false, message: 'Empresa no encontrada.' }
    createSupportAccess({
      company,
      hours,
      motivo,
      requestedBy: session.username,
      createdBy: 'empresa',
    })
    return { ok: true }
  }

  if (!session) {
    return <LoginScreen onLogin={handleLogin} notice={loginNotice} />
  }

  if (session.isSuperAdmin) {
    return (
      <SuperAdminPanel
        session={session}
        companies={companies}
        plans={plans}
        onLogout={handleLogout}
        onSaveCompany={handleSaveCompany}
        onSavePlans={handleSavePlans}
        onUpdateCompanyLicense={handleUpdateCompanyLicense}
        onCreateCompanyAdmin={handleCreateCompanyAdmin}
        onToggleCompanyStatus={handleToggleCompanyStatus}
      />
    )
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
      onAuthorizeSupport={handleAuthorizeSupport}
    />
  )
}
