import { DEFAULT_PAGE_ID, erpModules, pageRegistry } from '../config/modulesMap.js'
import { securityService } from '../services/securityService.js'
import { usersService } from '../services/usersService.js'

export const SECURITY_ACTIONS = [
  { id: 'view', label: 'Ver' },
  { id: 'create', label: 'Crear' },
  { id: 'edit', label: 'Editar' },
  { id: 'delete', label: 'Eliminar' },
  { id: 'void', label: 'Anular' },
  { id: 'approve', label: 'Aprobar' },
  { id: 'print', label: 'Imprimir' },
  { id: 'export', label: 'Exportar' },
  { id: 'configure', label: 'Configurar' },
]

export const SECURITY_STORAGE = {
  users: ['inveFatUsers', 'invefat_users'],
  roles: ['invefat_roles', 'inveFatRoles'],
  permissions: ['invefat_permissions'],
  audit: ['invefat_audit_log', 'inveFatAuditLog'],
  session: 'inveFatSession',
}

export const DEFAULT_SECURITY_ROLES = [
  {
    id: 'ROLE-MAIN-ADMIN',
    name: 'Administrador principal',
    description: 'Acceso total al sistema y a la configuracion de seguridad.',
    level: 100,
    status: 'Activo',
    systemRole: true,
  },
  {
    id: 'ROLE-ADMIN',
    name: 'Administrador',
    description: 'Gestion operativa completa con seguridad controlada.',
    level: 80,
    status: 'Activo',
    systemRole: false,
  },
  {
    id: 'ROLE-BILLING',
    name: 'Facturacion',
    description: 'Emision de facturas, clientes y consultas de venta.',
    level: 60,
    status: 'Activo',
    systemRole: false,
  },
  {
    id: 'ROLE-INVENTORY',
    name: 'Inventario',
    description: 'Gestion de productos, stock y movimientos.',
    level: 55,
    status: 'Activo',
    systemRole: false,
  },
  {
    id: 'ROLE-WAREHOUSE',
    name: 'Almacen',
    description: 'Recepcion, despacho y transferencias de almacen.',
    level: 50,
    status: 'Activo',
    systemRole: false,
  },
  {
    id: 'ROLE-PURCHASES',
    name: 'Compras',
    description: 'Solicitudes, ordenes de compra y proveedores.',
    level: 50,
    status: 'Activo',
    systemRole: false,
  },
  {
    id: 'ROLE-SALES',
    name: 'Ventas',
    description: 'Operacion de ventas, clientes e historial comercial.',
    level: 50,
    status: 'Activo',
    systemRole: false,
  },
  {
    id: 'ROLE-READONLY',
    name: 'Consulta',
    description: 'Consulta de informacion sin cambios operativos.',
    level: 25,
    status: 'Activo',
    systemRole: false,
  },
  {
    id: 'ROLE-BASIC',
    name: 'Usuario basico',
    description: 'Acceso minimo al dashboard.',
    level: 10,
    status: 'Activo',
    systemRole: false,
  },
]

export const DEFAULT_MAIN_ADMIN = {
  id: 'USR-001',
  fullName: 'Administrador Principal',
  username: 'admin',
  password: 'admin123',
  email: '',
  phone: '',
  branch: 'Matriz',
  roleId: 'ROLE-MAIN-ADMIN',
  role: 'Administrador principal',
  status: 'Activo',
  active: true,
  accessEnabled: true,
  isAdmin: true,
  isMainAdmin: true,
  lastAccess: '',
  createdAt: 'Inicial',
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function safeParse(rawValue, fallback) {
  try {
    const parsed = rawValue ? JSON.parse(rawValue) : fallback
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function readFirstArray(keys, fallback = []) {
  if (!canUseStorage()) return fallback

  for (const key of keys) {
    const value = safeParse(localStorage.getItem(key), null)
    if (Array.isArray(value) && value.length > 0) {
      return value
    }
  }

  return fallback
}

function writeAll(keys, value) {
  if (!canUseStorage()) return
  keys.forEach((key) => localStorage.setItem(key, JSON.stringify(value)))
}

function normalizeRoleName(roleName = '') {
  return String(roleName).trim().toLowerCase()
}

function legacyRoleToId(roleName) {
  const cleanRole = normalizeRoleName(roleName)

  if (cleanRole.includes('principal')) return 'ROLE-MAIN-ADMIN'
  if (cleanRole.includes('administrador')) return 'ROLE-ADMIN'
  if (cleanRole.includes('facturacion')) return 'ROLE-BILLING'
  if (cleanRole.includes('inventario')) return 'ROLE-INVENTORY'
  if (cleanRole.includes('almacen')) return 'ROLE-WAREHOUSE'
  if (cleanRole.includes('compra')) return 'ROLE-PURCHASES'
  if (cleanRole.includes('venta')) return 'ROLE-SALES'
  if (cleanRole.includes('consulta')) return 'ROLE-READONLY'

  return 'ROLE-BASIC'
}

export function getDefaultPermissions() {
  const permissions = {}
  const allActionIds = SECURITY_ACTIONS.map((action) => action.id)

  DEFAULT_SECURITY_ROLES.forEach((role) => {
    permissions[role.id] = {}
  })

  Object.keys(pageRegistry).forEach((pageId) => {
    permissions['ROLE-MAIN-ADMIN'][pageId] = allActionIds
  })

  Object.keys(pageRegistry).forEach((pageId) => {
    permissions['ROLE-ADMIN'][pageId] = pageId.startsWith('security-')
      ? ['view', 'create', 'edit', 'print', 'export', 'configure']
      : ['view', 'create', 'edit', 'delete', 'void', 'approve', 'print', 'export']
  })

  const billingPages = ['dashboard', 'sales-invoice', 'sales-customers', 'sales-history', 'sales-receivables', 'inventory-products', 'reports-sales', 'reports-customers']
  const inventoryPages = [
    'dashboard',
    'inventory-products',
    'inventory-categories',
    'inventory-brands',
    'inventory-units',
    'inventory-price-lists',
    'inventory-stock',
    'inventory-kardex',
    'inventory-adjustments',
    'inventory-count',
    'inventory-lots',
    'inventory-barcodes',
    'inventory-costs',
    'reports-inventory',
  ]
  const warehousePages = ['dashboard', 'warehouse-list', 'warehouse-locations', 'warehouse-receiving', 'warehouse-dispatch', 'warehouse-transfers', 'warehouse-picking', 'warehouse-putaway', 'reports-warehouse']
  const purchasePages = ['dashboard', 'purchase-requests', 'purchase-orders', 'purchase-vendors', 'purchase-invoices', 'purchase-payables', 'reports-purchases', 'inventory-products']
  const salesPages = ['dashboard', 'sales-invoice', 'sales-customers', 'sales-quotes', 'sales-customer-orders', 'sales-history', 'reports-sales']

  billingPages.forEach((pageId) => {
    permissions['ROLE-BILLING'][pageId] = pageId === 'inventory-products'
      ? ['view']
      : ['view', 'create', 'edit', 'print', 'export']
  })

  inventoryPages.forEach((pageId) => {
    permissions['ROLE-INVENTORY'][pageId] = ['view', 'create', 'edit', 'print', 'export']
  })

  warehousePages.forEach((pageId) => {
    permissions['ROLE-WAREHOUSE'][pageId] = ['view', 'create', 'edit', 'approve', 'print', 'export']
  })

  purchasePages.forEach((pageId) => {
    permissions['ROLE-PURCHASES'][pageId] = pageId === 'inventory-products'
      ? ['view']
      : ['view', 'create', 'edit', 'approve', 'print', 'export']
  })

  salesPages.forEach((pageId) => {
    permissions['ROLE-SALES'][pageId] = ['view', 'create', 'edit', 'print', 'export']
  })

  Object.keys(pageRegistry).forEach((pageId) => {
    if (pageId === 'dashboard') return
    permissions['ROLE-READONLY'][pageId] = ['view']
  })

  permissions['ROLE-BASIC'].dashboard = ['view']

  return permissions
}

function normalizeRole(role) {
  const fallbackRole = DEFAULT_SECURITY_ROLES.find((item) => item.id === legacyRoleToId(role?.name || role?.role))

  return {
    id: role?.id || role?.roleId || fallbackRole?.id || `ROLE-${Date.now()}`,
    name: role?.name || role?.role || fallbackRole?.name || 'Usuario basico',
    description: role?.description || role?.detail || fallbackRole?.description || '',
    level: Number(role?.level ?? fallbackRole?.level ?? 10),
    status: role?.status || (role?.active === false ? 'Inactivo' : 'Activo'),
    systemRole: Boolean(role?.systemRole || fallbackRole?.systemRole),
  }
}

export function loadRoles() {
  const savedRoles = readFirstArray(SECURITY_STORAGE.roles, [])

  if (savedRoles.length > 0) {
    const normalizedRoles = savedRoles.map(normalizeRole)
    const missingRoles = DEFAULT_SECURITY_ROLES.filter((defaultRole) => {
      return !normalizedRoles.some((role) => role.id === defaultRole.id || normalizeRoleName(role.name) === normalizeRoleName(defaultRole.name))
    })

    const nextRoles = [...normalizedRoles, ...missingRoles]
    writeAll(SECURITY_STORAGE.roles, nextRoles)
    return nextRoles
  }

  writeAll(SECURITY_STORAGE.roles, DEFAULT_SECURITY_ROLES)
  return DEFAULT_SECURITY_ROLES
}

export function saveRoles(roles) {
  const normalizedRoles = roles.map(normalizeRole)
  writeAll(SECURITY_STORAGE.roles, normalizedRoles)
  void securityService.roles.replaceAll(normalizedRoles)
  return normalizedRoles
}

function normalizeUser(user) {
  const roleId = user?.roleId || legacyRoleToId(user?.role)
  const role = loadRoles().find((item) => item.id === roleId)
  const isMainAdmin = Boolean(user?.isMainAdmin || roleId === 'ROLE-MAIN-ADMIN' || normalizeRoleName(user?.username) === 'admin')

  return {
    ...DEFAULT_MAIN_ADMIN,
    ...user,
    id: user?.id || `USR-${Date.now()}`,
    fullName: user?.fullName || user?.name || '',
    username: user?.username || user?.user || '',
    password: user?.password || '',
    email: user?.email || '',
    phone: user?.phone || user?.telefono || '',
    branch: user?.branch || user?.sucursal || 'Matriz',
    roleId: isMainAdmin ? 'ROLE-MAIN-ADMIN' : roleId,
    role: isMainAdmin ? 'Administrador principal' : (role?.name || user?.role || 'Usuario basico'),
    status: user?.status || (user?.active === false ? 'Inactivo' : 'Activo'),
    active: user?.active !== false && user?.status !== 'Inactivo' && user?.accessEnabled !== false,
    accessEnabled: user?.accessEnabled !== false,
    isAdmin: Boolean(user?.isAdmin || isMainAdmin || roleId === 'ROLE-ADMIN'),
    isMainAdmin,
    lastAccess: user?.lastAccess || user?.loginAt || '',
  }
}

export function loadUsers() {
  const savedUsers = readFirstArray(SECURITY_STORAGE.users, [])

  if (savedUsers.length > 0) {
    const normalizedUsers = savedUsers.map(normalizeUser)
    const hasMainAdmin = normalizedUsers.some((user) => user.isMainAdmin)
    const nextUsers = hasMainAdmin ? normalizedUsers : [DEFAULT_MAIN_ADMIN, ...normalizedUsers]
    writeAll(SECURITY_STORAGE.users, nextUsers)
    return nextUsers
  }

  writeAll(SECURITY_STORAGE.users, [DEFAULT_MAIN_ADMIN])
  return [DEFAULT_MAIN_ADMIN]
}

export function saveUsers(users) {
  const normalizedUsers = users.map(normalizeUser)
  writeAll(SECURITY_STORAGE.users, normalizedUsers)
  void usersService.replaceAll(normalizedUsers)
  return normalizedUsers
}

export function loadPermissions() {
  if (!canUseStorage()) return getDefaultPermissions()

  const saved = safeParse(localStorage.getItem(SECURITY_STORAGE.permissions[0]), null)
  const defaultPermissions = getDefaultPermissions()

  if (saved && typeof saved === 'object') {
    const mergedPermissions = { ...defaultPermissions }

    Object.keys(saved).forEach((roleId) => {
      mergedPermissions[roleId] = {
        ...(defaultPermissions[roleId] || {}),
        ...(saved[roleId] || {}),
      }
    })

    mergedPermissions['ROLE-MAIN-ADMIN'] = defaultPermissions['ROLE-MAIN-ADMIN']
    return mergedPermissions
  }

  savePermissions(defaultPermissions)
  return defaultPermissions
}

export function savePermissions(permissions) {
  if (!canUseStorage()) return permissions
  localStorage.setItem(SECURITY_STORAGE.permissions[0], JSON.stringify(permissions))
  void securityService.permissions.replaceAll(permissions)
  return permissions
}

export function getCurrentUser() {
  if (!canUseStorage()) return null

  const session = safeParse(localStorage.getItem(SECURITY_STORAGE.session), null)
  if (!session) return null

  const users = loadUsers()
  return users.find((user) => user.username === session.username) || session
}

export function getUserRole(user = getCurrentUser()) {
  const roles = loadRoles()
  const roleId = user?.roleId || legacyRoleToId(user?.role)

  return roles.find((role) => role.id === roleId) ||
    roles.find((role) => normalizeRoleName(role.name) === normalizeRoleName(user?.role)) ||
    roles.find((role) => role.id === 'ROLE-BASIC')
}

export function getRolePermissions(roleId) {
  const permissions = loadPermissions()
  return permissions[roleId] || {}
}

export function userCanForUser(user, pageId, action = 'view') {
  if (pageId === DEFAULT_PAGE_ID || pageId === 'dashboard') return true
  if (!user) return false

  const role = getUserRole(user)
  if (user.isMainAdmin || role?.id === 'ROLE-MAIN-ADMIN') return true

  const rolePermissions = getRolePermissions(role?.id)
  const pageActions = rolePermissions?.[pageId] || []

  return Array.isArray(pageActions) && pageActions.includes(action)
}

export function userCan(pageId, action = 'view') {
  return userCanForUser(getCurrentUser(), pageId, action)
}

export function userCanModule(moduleId, action = 'view') {
  if (moduleId === DEFAULT_PAGE_ID || moduleId === 'dashboard') return true
  const module = erpModules.find((item) => item.id === moduleId)

  if (!module) return false
  if (module.type === 'single') return userCan(module.pageId, action)

  return (module.pages || []).some((page) => userCan(page.id, action))
}

export function getVisibleModules(modules = erpModules, user = getCurrentUser()) {
  return modules
    .map((module) => {
      if (module.type === 'single') return module

      const visiblePages = (module.pages || []).filter((page) => userCanForUser(user, page.id, 'view'))

      if (visiblePages.length === 0) return null

      return {
        ...module,
        pages: visiblePages,
      }
    })
    .filter(Boolean)
}

export function appendAuditLog(action, payload = {}) {
  if (!canUseStorage()) return

  const currentUser = getCurrentUser()
  const currentLog = readFirstArray(SECURITY_STORAGE.audit, [])
  const nextRecord = {
    id: `AUD-${Date.now()}`,
    date: new Date().toISOString(),
    user: currentUser?.username || payload.user || 'sistema',
    action,
    module: payload.module || 'Seguridad',
    submodule: payload.submodule || '',
    description: payload.description || '',
    data: payload.data || {},
  }

  writeAll(SECURITY_STORAGE.audit, [nextRecord, ...currentLog].slice(0, 500))
  void securityService.audit.create(nextRecord)
}

export function loadAuditLog() {
  return readFirstArray(SECURITY_STORAGE.audit, [])
}
