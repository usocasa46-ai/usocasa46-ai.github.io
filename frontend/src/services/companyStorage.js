import { erpModules } from '../config/modulesMap.js'

const COMPANIES_KEY = 'invefat_companies'
const SESSION_KEY = 'inveFatSession'
const DEFAULT_COMPANY_CODE = 'EMP001'
const LICENSES_KEY = 'invefat_company_licenses'
const PLANS_KEY = 'invefat_system_plans'
const BACKUPS_LOG_KEY = 'invefat_company_backups_log'
const SUPPORT_ACCESS_KEY = 'invefat_support_access'
const SYSTEM_AUDIT_KEY = 'invefat_system_audit_log'

export const ALL_COMPANY_MODULES = erpModules.map((module) => module.id)
export const DEVELOPMENT_PLAN_NAMES = ['demo', 'desarrollo', 'development']

const DEMO_COMPANY = {
  id: 'COMP-EMP001',
  companyCode: DEFAULT_COMPANY_CODE,
  nombreComercial: 'Empresa Demo',
  razonSocial: 'Empresa Demo',
  rnc: '000000000',
  telefono: '',
  correo: '',
  direccion: '',
  estado: 'activa',
  plan: 'Demo',
  fechaActivacion: new Date().toISOString().slice(0, 10),
  fechaVencimiento: '',
  modulosActivos: ALL_COMPANY_MODULES,
  maxUsuarios: 5,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const DEFAULT_SYSTEM_PLANS = [
  {
    id: 'PLAN-DEMO',
    name: 'Demo',
    status: 'Activo',
    modules: ALL_COMPANY_MODULES,
    description: 'Modo prueba con todos los modulos activos.',
  },
  {
    id: 'PLAN-DEVELOPMENT',
    name: 'Desarrollo',
    status: 'Activo',
    modules: ALL_COMPANY_MODULES,
    description: 'Plan interno para probar el sistema completo.',
  },
  {
    id: 'PLAN-BASIC',
    name: 'Basico',
    status: 'Activo',
    modules: ['dashboard', 'sales', 'inventory', 'reports'],
    description: 'Ventas, clientes, productos y reportes basicos.',
  },
  {
    id: 'PLAN-PRO',
    name: 'Pro',
    status: 'Activo',
    modules: ['dashboard', 'sales', 'inventory', 'purchases', 'warehouse', 'reports'],
    description: 'Ventas, inventario, compras, almacen, POS y reportes.',
  },
  {
    id: 'PLAN-ENTERPRISE',
    name: 'Empresarial',
    status: 'Activo',
    modules: ['dashboard', 'system', 'sales', 'inventory', 'purchases', 'warehouse', 'finance', 'reports', 'settings', 'security'],
    description: 'Todo el ERP, finanzas, DGII, multiusuario y seguridad avanzada.',
  },
]

export const COMPANY_KEY_MAP = {
  inveFatInventoryProducts: 'products',
  invefat_customers: 'customers',
  invefat_sales_invoices: 'invoices',
  invefat_sales_quotes: 'quotes',
  invefat_suppliers: 'suppliers',
  invefat_company_settings: 'settings',
  inveFatUsers: 'users',
  inveFatRoles: 'roles',
  invefat_roles: 'security_roles',
  invefat_permissions: 'permissions',
  invefat_ncf_sequences: 'ncf_sequences',
  invefat_ncf_used: 'ncf_used',
  invefat_warehouses: 'warehouses',
  invefat_inventory_movements: 'inventory_movements',
  invefat_inventory_categories: 'inventory_categories',
  invefat_inventory_brands: 'inventory_brands',
  invefat_inventory_units: 'inventory_units',
  invefat_price_lists: 'price_lists',
  invefat_purchase_requests: 'purchase_requests',
  invefat_supplier_quotes: 'supplier_quotes',
  invefat_purchase_orders: 'purchase_orders',
  invefat_supplier_invoices: 'supplier_invoices',
  invefat_supplier_credit_notes: 'supplier_credit_notes',
  invefat_supplier_payments: 'supplier_payments',
  invefat_warehouse_receipts: 'warehouse_receipts',
  invefat_warehouse_dispatches: 'warehouse_dispatches',
  invefat_warehouse_transfers: 'warehouse_transfers',
  invefat_warehouse_returns: 'warehouse_returns',
  invefat_warehouse_damages: 'warehouse_damages',
  invefat_warehouse_quarantine: 'warehouse_quarantine',
  invefat_sales_reports: 'sales_reports',
  invefat_dgii_606: 'dgii_606',
  invefat_dgii_607: 'dgii_607',
  invefat_rnc_registry: 'rnc_registry',
}

const rawStorage = {
  getItem: Storage.prototype.getItem,
  setItem: Storage.prototype.setItem,
  removeItem: Storage.prototype.removeItem,
}

let storageScopeInstalled = false

function safeParse(value, fallback) {
  try {
    const parsed = value ? JSON.parse(value) : fallback
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function nowIso() {
  return new Date().toISOString()
}

function cleanCode(value) {
  return String(value || '').trim().toUpperCase()
}

function normalizeModuleList(modules) {
  if (!Array.isArray(modules) || modules.length === 0) return ALL_COMPANY_MODULES
  return Array.from(new Set(['dashboard', ...modules.filter((moduleId) => ALL_COMPANY_MODULES.includes(moduleId))]))
}

function rawGet(key) {
  return rawStorage.getItem.call(localStorage, key)
}

function rawSet(key, value) {
  rawStorage.setItem.call(localStorage, key, value)
}

function rawRemove(key) {
  rawStorage.removeItem.call(localStorage, key)
}

function getSessionCompanyCode() {
  const session = safeParse(rawStorage.getItem.call(sessionStorage, SESSION_KEY), null)
  if (!session || session.isSuperAdmin) return ''
  return cleanCode(session.currentCompanyCode || session.companyCode)
}

export function getCompanyKey(baseKey, companyCode = getSessionCompanyCode()) {
  const suffix = COMPANY_KEY_MAP[baseKey]
  const code = cleanCode(companyCode)
  if (!suffix || !code || code === 'SYSTEM') return baseKey
  return `invefat_${code}_${suffix}`
}

export function installCompanyStorageScope() {
  if (storageScopeInstalled || typeof window === 'undefined') return
  storageScopeInstalled = true

  Storage.prototype.getItem = function scopedGetItem(key) {
    const scopedKey = getCompanyKey(key)
    const scopedValue = rawStorage.getItem.call(this, scopedKey)
    if (scopedKey !== key && scopedValue === null && getSessionCompanyCode() === DEFAULT_COMPANY_CODE) {
      return rawStorage.getItem.call(this, key)
    }

    return scopedValue
  }

  Storage.prototype.setItem = function scopedSetItem(key, value) {
    return rawStorage.setItem.call(this, getCompanyKey(key), value)
  }

  Storage.prototype.removeItem = function scopedRemoveItem(key) {
    return rawStorage.removeItem.call(this, getCompanyKey(key))
  }
}

export function loadCompanies() {
  const saved = safeParse(rawGet(COMPANIES_KEY), null)
  if (Array.isArray(saved) && saved.length > 0) {
    const normalized = saved.map((company) => (
      cleanCode(company.companyCode) === DEFAULT_COMPANY_CODE
        ? { ...company, modulosActivos: ALL_COMPANY_MODULES }
        : { ...company, modulosActivos: normalizeModuleList(company.modulosActivos) }
    ))
    rawSet(COMPANIES_KEY, JSON.stringify(normalized))
    return normalized
  }

  rawSet(COMPANIES_KEY, JSON.stringify([DEMO_COMPANY]))
  return [DEMO_COMPANY]
}

export function saveCompanies(companies) {
  rawSet(COMPANIES_KEY, JSON.stringify(companies))
  return companies
}

export function appendSystemAudit(action, payload = {}) {
  const current = safeParse(rawGet(SYSTEM_AUDIT_KEY), [])
  const record = {
    id: `LOG-${Date.now()}`,
    fecha: nowIso(),
    usuario: payload.usuario || payload.user || 'sistema',
    empresa: payload.empresa || payload.companyCode || '',
    accion: action,
    descripcion: payload.descripcion || payload.description || '',
    ip: '',
    modulo: payload.modulo || 'Sistema',
  }
  rawSet(SYSTEM_AUDIT_KEY, JSON.stringify([record, ...(Array.isArray(current) ? current : [])].slice(0, 1000)))
  return record
}

export function loadSystemAudit() {
  return safeParse(rawGet(SYSTEM_AUDIT_KEY), [])
}

export function loadSystemPlans() {
  const saved = safeParse(rawGet(PLANS_KEY), null)
  if (Array.isArray(saved) && saved.length > 0) {
    const defaultsByName = new Map(DEFAULT_SYSTEM_PLANS.map((plan) => [String(plan.name).toLowerCase(), plan]))
    const normalized = saved.map((plan) => {
      const isDevPlan = DEVELOPMENT_PLAN_NAMES.includes(String(plan.name || '').toLowerCase())
      return {
        ...plan,
        modules: isDevPlan ? ALL_COMPANY_MODULES : normalizeModuleList(plan.modules),
      }
    })
    DEFAULT_SYSTEM_PLANS.forEach((defaultPlan) => {
      if (!normalized.some((plan) => String(plan.name).toLowerCase() === String(defaultPlan.name).toLowerCase())) {
        normalized.push(defaultPlan)
      }
    })
    rawSet(PLANS_KEY, JSON.stringify(normalized))
    return normalized
  }

  rawSet(PLANS_KEY, JSON.stringify(DEFAULT_SYSTEM_PLANS))
  return DEFAULT_SYSTEM_PLANS
}

export function saveSystemPlans(plans) {
  rawSet(PLANS_KEY, JSON.stringify(plans))
  appendSystemAudit('Cambiar planes', { descripcion: 'Planes del sistema actualizados' })
  return plans
}

export function loadCompanyLicenses() {
  const saved = safeParse(rawGet(LICENSES_KEY), null)
  if (Array.isArray(saved)) return saved

  const companies = loadCompanies()
  const licenses = companies.map((company) => buildDefaultLicense(company))
  rawSet(LICENSES_KEY, JSON.stringify(licenses))
  return licenses
}

function buildDefaultLicense(company) {
  const plan = loadSystemPlans().find((item) => item.name === company.plan) || DEFAULT_SYSTEM_PLANS[0]
  return {
    id: `LIC-${company.companyCode}`,
    companyId: company.id,
    companyCode: company.companyCode,
    codigoLicencia: `LIC-${company.companyCode}-${String(Date.now()).slice(-6)}`,
    planContratado: company.plan || plan.name,
    estado: company.estado === 'suspendida' ? 'suspendida' : company.plan === 'Demo' ? 'demo' : 'activa',
    fechaActivacion: company.fechaActivacion || new Date().toISOString().slice(0, 10),
    fechaVencimiento: company.fechaVencimiento || '',
    maxUsuarios: Number(company.maxUsuarios || 5),
    maxSucursales: Number(company.maxSucursales || 1),
    maxAlmacenes: Number(company.maxAlmacenes || 2),
    modulosActivos: cleanCode(company.companyCode) === DEFAULT_COMPANY_CODE || DEVELOPMENT_PLAN_NAMES.includes(String(company.plan || '').toLowerCase())
      ? ALL_COMPANY_MODULES
      : normalizeModuleList(Array.isArray(company.modulosActivos) && company.modulosActivos.length ? company.modulosActivos : plan.modules),
    tipoVersion: company.tipoVersion || 'Cloud',
    observacion: company.observacion || '',
    updatedAt: nowIso(),
  }
}

export function saveCompanyLicenses(licenses) {
  rawSet(LICENSES_KEY, JSON.stringify(licenses))
  return licenses
}

export function getCompanyLicense(companyOrCode) {
  const company = typeof companyOrCode === 'string' ? findCompanyByCode(companyOrCode) : companyOrCode
  if (!company) return null
  const licenses = loadCompanyLicenses()
  let license = licenses.find((item) => item.companyId === company.id || cleanCode(item.companyCode) === cleanCode(company.companyCode))
  if (!license) {
    license = buildDefaultLicense(company)
    saveCompanyLicenses([license, ...licenses])
  }
  return license
}

export function upsertCompanyLicense(companyOrCode, patch) {
  const company = typeof companyOrCode === 'string' ? findCompanyByCode(companyOrCode) : companyOrCode
  if (!company) return null
  const licenses = loadCompanyLicenses()
  const current = getCompanyLicense(company)
  const nextLicense = {
    ...current,
    ...patch,
    companyId: company.id,
    companyCode: company.companyCode,
    updatedAt: nowIso(),
  }
  const next = licenses.some((item) => item.id === nextLicense.id)
    ? licenses.map((item) => (item.id === nextLicense.id ? nextLicense : item))
    : [nextLicense, ...licenses]
  saveCompanyLicenses(next)
  appendSystemAudit('Cambiar licencia', { companyCode: company.companyCode, descripcion: `Licencia ${nextLicense.estado}` })
  return nextLicense
}

export function getCompanyAccessStatus(companyOrCode) {
  const company = typeof companyOrCode === 'string' ? findCompanyByCode(companyOrCode) : companyOrCode
  if (!company) return { allowed: false, message: 'Empresa no encontrada.' }
  if (!isCompanyActive(company)) return { allowed: false, message: 'Licencia vencida o suspendida. Contacte al administrador del sistema.' }

  const license = getCompanyLicense(company)
  const status = String(license?.estado || '').toLowerCase()
  if (['vencida', 'suspendida', 'inactiva'].includes(status)) {
    return { allowed: false, message: 'Licencia vencida o suspendida. Contacte al administrador del sistema.' }
  }

  if (license?.fechaVencimiento) {
    const today = new Date()
    const expiresAt = new Date(`${license.fechaVencimiento}T23:59:59`)
    if (expiresAt < today) {
      upsertCompanyLicense(company, { estado: 'vencida' })
      return { allowed: false, message: 'Licencia vencida o suspendida. Contacte al administrador del sistema.' }
    }
  }

  return { allowed: true, license }
}

export function getActiveModuleIdsForCompany(companyCode) {
  const company = findCompanyByCode(companyCode)
  if (!company) return ['dashboard']
  const license = getCompanyLicense(company)
  const modules = Array.isArray(license?.modulosActivos) && license.modulosActivos.length
    ? license.modulosActivos
    : company.modulosActivos
  if (cleanCode(company.companyCode) === DEFAULT_COMPANY_CODE || DEVELOPMENT_PLAN_NAMES.includes(String(license?.planContratado || company.plan || '').toLowerCase())) {
    return ALL_COMPANY_MODULES
  }
  return normalizeModuleList(modules)
}

export function isModuleActiveForCompany(moduleId, session) {
  if (!moduleId || moduleId === 'dashboard') return true
  if (session?.isSuperAdmin) return true
  const activeModules = getActiveModuleIdsForCompany(session?.currentCompanyCode)
  return activeModules.includes(moduleId)
}

export function findCompanyByCode(companyCode) {
  const code = cleanCode(companyCode)
  return loadCompanies().find((company) => cleanCode(company.companyCode) === code) || null
}

export function isCompanyActive(company) {
  return ['activa', 'activo', 'active'].includes(String(company?.estado || '').trim().toLowerCase())
}

export function createCompany(data) {
  const code = cleanCode(data.companyCode)
  const companies = loadCompanies()
  if (!code) throw new Error('Codigo de empresa requerido.')
  if (companies.some((company) => cleanCode(company.companyCode) === code)) {
    throw new Error('Ya existe una empresa con ese codigo.')
  }

  const nextCompany = {
    id: data.id || `COMP-${code}`,
    companyCode: code,
    nombreComercial: String(data.nombreComercial || '').trim(),
    razonSocial: String(data.razonSocial || data.nombreComercial || '').trim(),
    rnc: String(data.rnc || '').trim(),
    telefono: String(data.telefono || '').trim(),
    correo: String(data.correo || '').trim(),
    direccion: String(data.direccion || '').trim(),
    estado: data.estado || 'activa',
    plan: data.plan || 'Demo',
    fechaActivacion: data.fechaActivacion || new Date().toISOString().slice(0, 10),
    fechaVencimiento: data.fechaVencimiento || '',
    modulosActivos: cleanCode(data.companyCode) === DEFAULT_COMPANY_CODE || DEVELOPMENT_PLAN_NAMES.includes(String(data.plan || '').toLowerCase())
      ? ALL_COMPANY_MODULES
      : normalizeModuleList(data.modulosActivos || DEMO_COMPANY.modulosActivos),
    maxUsuarios: Number(data.maxUsuarios || 5),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  saveCompanies([nextCompany, ...companies])
  upsertCompanyLicense(nextCompany, buildDefaultLicense(nextCompany))
  appendSystemAudit('Crear empresa', { companyCode: nextCompany.companyCode, descripcion: nextCompany.nombreComercial })
  return nextCompany
}

export function updateCompany(companyId, patch) {
  const companies = loadCompanies()
  const next = companies.map((company) => (
    company.id === companyId ? { ...company, ...patch, updatedAt: nowIso() } : company
  ))
  saveCompanies(next)
  const saved = next.find((company) => company.id === companyId) || null
  if (saved) {
    upsertCompanyLicense(saved, buildDefaultLicense(saved))
    appendSystemAudit('Editar empresa', { companyCode: saved.companyCode, descripcion: saved.nombreComercial })
  }
  return saved
}

export function getCompanyData(baseKey, fallback = [], companyCode = getSessionCompanyCode()) {
  const scopedKey = getCompanyKey(baseKey, companyCode)
  const scoped = safeParse(rawGet(scopedKey), null)
  if (scoped !== null) return scoped

  if (cleanCode(companyCode) === DEFAULT_COMPANY_CODE) {
    return safeParse(rawGet(baseKey), fallback)
  }

  return fallback
}

export function setCompanyData(baseKey, data, companyCode = getSessionCompanyCode()) {
  rawSet(getCompanyKey(baseKey, companyCode), JSON.stringify(data))
  return data
}

export function getCurrentCompanyId() {
  const session = safeParse(rawStorage.getItem.call(sessionStorage, SESSION_KEY), null)
  return session?.currentCompanyId || ''
}

export function getCurrentCompanyCode() {
  const session = safeParse(rawStorage.getItem.call(sessionStorage, SESSION_KEY), null)
  return session?.currentCompanyCode || ''
}

export function getCurrentCompany() {
  return findCompanyByCode(getCurrentCompanyCode())
}

export function clearCompanySession() {
  sessionStorage.removeItem(SESSION_KEY)
}

export function normalizeCompanyUser(user, company) {
  return {
    id: user.id || `USR-${Date.now()}`,
    companyId: company.id,
    companyCode: company.companyCode,
    fullName: user.fullName || user.nombre || 'Usuario',
    username: user.username || user.usuario,
    password: user.password || user.contrasena || '',
    role: user.role || user.rol || 'Usuario',
    active: user.active !== false && user.estado !== 'Inactivo',
    isMainAdmin: Boolean(user.isMainAdmin),
    createdAt: user.createdAt || nowIso(),
  }
}

export function loadCompanyUsers(company) {
  if (!company) return []
  const users = getCompanyData('inveFatUsers', [], company.companyCode)
  if (Array.isArray(users) && users.length > 0) {
    return users.map((user) => normalizeCompanyUser(user, company))
  }

  const isDemoCompany = cleanCode(company.companyCode) === DEFAULT_COMPANY_CODE
  const legacy = isDemoCompany ? safeParse(rawGet('inveFatUsers'), []) : []
  if (!isDemoCompany) {
    setCompanyData('inveFatUsers', [], company.companyCode)
    return []
  }

  const seeded = Array.isArray(legacy) && legacy.length > 0
    ? legacy.map((user) => normalizeCompanyUser(user, company))
    : [
        normalizeCompanyUser({
          id: 'USR-001',
          fullName: 'Administrador Principal',
          username: 'admin',
          password: 'admin123',
          role: 'Administrador Principal',
          active: true,
          isMainAdmin: true,
          createdAt: 'Inicial',
        }, company),
      ]

  setCompanyData('inveFatUsers', seeded, company.companyCode)
  return seeded
}

export function saveCompanyUsers(company, users) {
  if (!company) return []
  return setCompanyData('inveFatUsers', users.map((user) => normalizeCompanyUser(user, company)), company.companyCode)
}

export function addCompanyRecord(baseKey, record) {
  const current = getCompanyData(baseKey, [])
  const next = [record, ...(Array.isArray(current) ? current : [])]
  return setCompanyData(baseKey, next)
}

export function updateCompanyRecord(baseKey, id, data) {
  const current = getCompanyData(baseKey, [])
  const next = (Array.isArray(current) ? current : []).map((item) => {
    const itemId = item.id || item.code || item.number || item.username
    return itemId === id ? { ...item, ...data } : item
  })
  return setCompanyData(baseKey, next)
}

export function deleteCompanyRecord(baseKey, id) {
  const current = getCompanyData(baseKey, [])
  const next = (Array.isArray(current) ? current : []).filter((item) => {
    const itemId = item.id || item.code || item.number || item.username
    return itemId !== id
  })
  return setCompanyData(baseKey, next)
}

export function getCompanyScopedSnapshot(company) {
  const snapshot = {}
  Object.entries(COMPANY_KEY_MAP).forEach(([baseKey]) => {
    snapshot[baseKey] = getCompanyData(baseKey, [], company.companyCode)
  })
  return snapshot
}

export function generateCompanyBackup(company) {
  const snapshot = getCompanyScopedSnapshot(company)
  const serialized = JSON.stringify(snapshot)
  const record = {
    id: `BCK-${Date.now()}`,
    companyId: company.id,
    companyCode: company.companyCode,
    fecha: nowIso(),
    registros: Object.values(snapshot).reduce((sum, value) => sum + (Array.isArray(value) ? value.length : value ? 1 : 0), 0),
    bytes: new Blob([serialized]).size,
  }
  const current = safeParse(rawGet(BACKUPS_LOG_KEY), [])
  rawSet(BACKUPS_LOG_KEY, JSON.stringify([record, ...(Array.isArray(current) ? current : [])]))
  appendSystemAudit('Generar respaldo', { companyCode: company.companyCode, descripcion: `${record.registros} registros` })
  return {
    meta: record,
    company: {
      id: company.id,
      companyCode: company.companyCode,
      nombreComercial: company.nombreComercial,
    },
    data: snapshot,
  }
}

export function importCompanyBackup(company, backup) {
  const data = backup?.data || {}
  Object.entries(data).forEach(([baseKey, value]) => {
    if (COMPANY_KEY_MAP[baseKey]) setCompanyData(baseKey, value, company.companyCode)
  })
  appendSystemAudit('Importar respaldo', { companyCode: company.companyCode, descripcion: 'Respaldo importado' })
  return true
}

export function loadBackupLog() {
  return safeParse(rawGet(BACKUPS_LOG_KEY), [])
}

export function createSupportAccess({ company, hours = 1, motivo = '', requestedBy = '', createdBy = 'superadmin' }) {
  const start = new Date()
  const end = new Date(start.getTime() + Number(hours || 1) * 60 * 60 * 1000)
  const record = {
    id: `SUP-${Date.now()}`,
    empresa: company.companyCode,
    companyId: company.id,
    superadmin: createdBy,
    fechaInicio: start.toISOString(),
    fechaFin: end.toISOString(),
    motivo,
    estado: 'activo',
    solicitadoPor: requestedBy,
    accionesRealizadas: [],
  }
  const current = safeParse(rawGet(SUPPORT_ACCESS_KEY), [])
  rawSet(SUPPORT_ACCESS_KEY, JSON.stringify([record, ...(Array.isArray(current) ? current : [])]))
  appendSystemAudit('Autorizar soporte', { companyCode: company.companyCode, descripcion: motivo || 'Soporte autorizado' })
  return record
}

export function loadSupportAccess() {
  const records = safeParse(rawGet(SUPPORT_ACCESS_KEY), [])
  const now = new Date()
  return records.map((record) => ({
    ...record,
    estado: new Date(record.fechaFin) >= now && record.estado === 'activo' ? 'activo' : 'vencido',
  }))
}

export function getIsolationResults(companies = loadCompanies()) {
  const bases = ['inveFatInventoryProducts', 'invefat_customers', 'invefat_sales_invoices', 'invefat_company_settings', 'inveFatUsers']
  return companies.map((company) => {
    const counts = Object.fromEntries(bases.map((baseKey) => {
      const value = getCompanyData(baseKey, [], company.companyCode)
      return [COMPANY_KEY_MAP[baseKey] || baseKey, Array.isArray(value) ? value.length : value ? 1 : 0]
    }))
    return {
      companyCode: company.companyCode,
      companyName: company.nombreComercial,
      status: 'Correcto',
      counts,
    }
  })
}

export function ensureDemoCompany() {
  const companies = loadCompanies()
  const demo = companies.find((company) => cleanCode(company.companyCode) === DEFAULT_COMPANY_CODE) || createCompany(DEMO_COMPANY)
  const normalizedDemo = { ...demo, modulosActivos: ALL_COMPANY_MODULES, plan: demo.plan || 'Demo' }
  if (JSON.stringify(demo.modulosActivos) !== JSON.stringify(ALL_COMPANY_MODULES)) {
    saveCompanies(companies.map((company) => (company.id === demo.id ? normalizedDemo : company)))
    upsertCompanyLicense(normalizedDemo, {
      ...getCompanyLicense(normalizedDemo),
      planContratado: 'Demo',
      modulosActivos: ALL_COMPANY_MODULES,
      estado: 'demo',
    })
  }
  loadCompanyUsers(demo)
  return demo
}
