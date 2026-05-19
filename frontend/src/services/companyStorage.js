const COMPANIES_KEY = 'invefat_companies'
const SESSION_KEY = 'inveFatSession'
const DEFAULT_COMPANY_CODE = 'EMP001'

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
  modulosActivos: ['dashboard', 'inventory', 'sales', 'purchases', 'warehouse', 'finance', 'reports', 'settings', 'security'],
  maxUsuarios: 5,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

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
  if (Array.isArray(saved) && saved.length > 0) return saved

  rawSet(COMPANIES_KEY, JSON.stringify([DEMO_COMPANY]))
  return [DEMO_COMPANY]
}

export function saveCompanies(companies) {
  rawSet(COMPANIES_KEY, JSON.stringify(companies))
  return companies
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
    modulosActivos: Array.isArray(data.modulosActivos) ? data.modulosActivos : DEMO_COMPANY.modulosActivos,
    maxUsuarios: Number(data.maxUsuarios || 5),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  saveCompanies([nextCompany, ...companies])
  return nextCompany
}

export function updateCompany(companyId, patch) {
  const companies = loadCompanies()
  const next = companies.map((company) => (
    company.id === companyId ? { ...company, ...patch, updatedAt: nowIso() } : company
  ))
  saveCompanies(next)
  return next.find((company) => company.id === companyId) || null
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

export function ensureDemoCompany() {
  const companies = loadCompanies()
  const demo = companies.find((company) => cleanCode(company.companyCode) === DEFAULT_COMPANY_CODE) || createCompany(DEMO_COMPANY)
  loadCompanyUsers(demo)
  return demo
}
