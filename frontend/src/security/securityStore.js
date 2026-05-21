const SECURITY_VERSION = 1

export const SYSTEM_MODULES = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'inventory', name: 'Inventario y Almacen' },
  { id: 'sales', name: 'Ventas' },
  { id: 'purchases', name: 'Compras' },
  { id: 'accounting', name: 'Contabilidad' },
  { id: 'hr', name: 'Recursos Humanos' },
  { id: 'crm', name: 'CRM' },
  { id: 'production', name: 'Produccion' },
  { id: 'reports', name: 'Reportes' },
  { id: 'settings', name: 'Configuracion del sistema' },
]

export const DEFAULT_COMPANY = {
  id: 'COMP-001',
  name: 'INVE-FAT SYSTEM',
  businessName: 'Empresa Principal',
  companyCode: 'EMPRESA',
  companyKey: '1234',
  active: true,
  createdAt: 'Inicial',
}

export const DEFAULT_ROLES = [
  {
    id: 'ROLE-MAIN-ADMIN',
    name: 'Administrador Principal',
    level: 100,
    systemRole: true,
    permissions: {
      dashboard: ['view'],
      inventory: ['view', 'create', 'edit', 'delete', 'approve'],
      sales: ['view', 'create', 'edit', 'delete', 'approve'],
      purchases: ['view', 'create', 'edit', 'delete', 'approve'],
      accounting: ['view', 'create', 'edit', 'delete', 'approve'],
      hr: ['view', 'create', 'edit', 'delete', 'approve'],
      crm: ['view', 'create', 'edit', 'delete', 'approve'],
      production: ['view', 'create', 'edit', 'delete', 'approve'],
      reports: ['view', 'export'],
      settings: ['view', 'create', 'edit', 'delete', 'approve'],
    },
  },
  {
    id: 'ROLE-ADMIN',
    name: 'Administrador',
    level: 80,
    systemRole: false,
    permissions: {
      dashboard: ['view'],
      inventory: ['view', 'create', 'edit'],
      sales: ['view', 'create', 'edit'],
      purchases: ['view', 'create', 'edit'],
      accounting: ['view'],
      hr: ['view'],
      crm: ['view', 'create', 'edit'],
      production: ['view'],
      reports: ['view', 'export'],
      settings: ['view'],
    },
  },
  {
    id: 'ROLE-INVENTORY',
    name: 'Inventario',
    level: 50,
    systemRole: false,
    permissions: {
      dashboard: ['view'],
      inventory: ['view', 'create', 'edit'],
      sales: ['view'],
      purchases: ['view'],
      accounting: [],
      hr: [],
      crm: [],
      production: [],
      reports: ['view'],
      settings: [],
    },
  },
  {
    id: 'ROLE-SALES',
    name: 'Facturacion',
    level: 50,
    systemRole: false,
    permissions: {
      dashboard: ['view'],
      inventory: ['view'],
      sales: ['view', 'create', 'edit'],
      purchases: [],
      accounting: [],
      hr: [],
      crm: ['view', 'create'],
      production: [],
      reports: ['view'],
      settings: [],
    },
  },
  {
    id: 'ROLE-USER',
    name: 'Usuario',
    level: 20,
    systemRole: false,
    permissions: {
      dashboard: ['view'],
      inventory: ['view'],
      sales: ['view'],
      purchases: ['view'],
      accounting: [],
      hr: [],
      crm: [],
      production: [],
      reports: [],
      settings: [],
    },
  },
]

export const DEFAULT_MAIN_ADMIN = {
  id: 'USR-001',
  companyId: 'COMP-001',
  fullName: 'Administrador Principal',
  username: 'admin',
  password: 'admin123',
  roleId: 'ROLE-MAIN-ADMIN',
  role: 'Administrador Principal',
  active: true,
  isMainAdmin: true,
  createdAt: 'Inicial',
}

function safeParse(value, fallback) {
  try {
    const parsed = value ? JSON.parse(value) : fallback
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export function loadCompanies() {
  const companies = safeParse(localStorage.getItem('inveFatCompanies'), null)

  if (Array.isArray(companies) && companies.length > 0) {
    return companies
  }

  return []
}

export function saveCompanies(companies) {
  localStorage.setItem('inveFatCompanies', JSON.stringify(companies))
}

export function loadRoles() {
  const roles = safeParse(localStorage.getItem('inveFatRoles'), null)

  if (Array.isArray(roles) && roles.length > 0) {
    return roles
  }

  localStorage.setItem('inveFatRoles', JSON.stringify(DEFAULT_ROLES))
  return DEFAULT_ROLES
}

export function saveRoles(roles) {
  localStorage.setItem('inveFatRoles', JSON.stringify(roles))
}

export function loadSecureUsers() {
  const users = safeParse(localStorage.getItem('inveFatUsers'), null)

  if (Array.isArray(users) && users.length > 0) {
    return users.map((user) => ({
      companyId: user.companyId || 'COMP-001',
      roleId: user.roleId || roleNameToId(user.role),
      ...user,
    }))
  }

  return []
}

export function saveSecureUsers(users) {
  localStorage.setItem('inveFatUsers', JSON.stringify(users))
}

export function roleNameToId(roleName) {
  const cleanRole = String(roleName || '').toLowerCase()

  if (cleanRole.includes('principal')) return 'ROLE-MAIN-ADMIN'
  if (cleanRole.includes('administrador')) return 'ROLE-ADMIN'
  if (cleanRole.includes('inventario')) return 'ROLE-INVENTORY'
  if (cleanRole.includes('facturacion')) return 'ROLE-SALES'

  return 'ROLE-USER'
}

export function findCompanyByCredentials(companyCode, companyKey) {
  const cleanCode = String(companyCode || '').trim().toLowerCase()
  const cleanKey = String(companyKey || '').trim()

  const companies = loadCompanies()

  return companies.find((company) => {
    return (
      company.active &&
      String(company.companyCode || '').trim().toLowerCase() === cleanCode &&
      String(company.companyKey || '').trim() === cleanKey
    )
  })
}

export function getUserRole(user) {
  const roles = loadRoles()

  return roles.find((role) => role.id === user?.roleId) ||
    roles.find((role) => role.name === user?.role) ||
    roles.find((role) => role.id === 'ROLE-USER')
}

export function userCan(user, moduleId, action = 'view') {
  if (!user || !moduleId) return false

  const role = getUserRole(user)

  if (!role) return false

  const permissions = role.permissions?.[moduleId] || []

  return permissions.includes(action)
}

export function createSecuritySession(user, company, remember) {
  const role = getUserRole(user)

  const session = {
    authVersion: 3,
    securityVersion: SECURITY_VERSION,
    companyId: company.id,
    companyName: company.name,
    companyCode: company.companyCode,
    username: user.username,
    fullName: user.fullName,
    roleId: user.roleId,
    role: role?.name || user.role || 'Usuario',
    isMainAdmin: Boolean(user.isMainAdmin),
    permissions: role?.permissions || {},
    loginAt: new Date().toISOString(),
  }

  if (remember) {
    localStorage.setItem('inveFatSession', JSON.stringify(session))
  } else {
    localStorage.removeItem('inveFatSession')
  }

  localStorage.setItem('inveFatLastCompanyCode', company.companyCode)

  return session
}

export function loadSystemConfig() {
  const config = safeParse(localStorage.getItem('inveFatSystemConfig'), null)

  if (config) return config

  const defaultConfig = {
    companyDisplayName: DEFAULT_COMPANY.name,
    defaultBranch: 'Principal',
    currency: 'RD$',
    requireCompanyCredential: true,
    requireActiveUser: true,
    auditEnabled: true,
    updatedAt: 'Inicial',
  }

  localStorage.setItem('inveFatSystemConfig', JSON.stringify(defaultConfig))
  return defaultConfig
}

export function saveSystemConfig(config) {
  localStorage.setItem('inveFatSystemConfig', JSON.stringify({
    ...config,
    updatedAt: new Date().toISOString(),
  }))
}

export function writeAuditLog(action, detail = {}) {
  const config = loadSystemConfig()

  if (!config.auditEnabled) return

  const current = safeParse(localStorage.getItem('inveFatAuditLog'), [])

  const session = safeParse(localStorage.getItem('inveFatSession'), null)

  const nextLog = [
    {
      id: `AUD-${Date.now()}`,
      action,
      detail,
      username: session?.username || 'sin-sesion',
      companyId: session?.companyId || null,
      createdAt: new Date().toISOString(),
    },
    ...current,
  ].slice(0, 300)

  localStorage.setItem('inveFatAuditLog', JSON.stringify(nextLog))
}

export function loadAuditLog() {
  return safeParse(localStorage.getItem('inveFatAuditLog'), [])
}
