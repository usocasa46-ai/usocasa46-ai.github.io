import { erpModules } from '../config/modulesMap.js'

const COMPANIES_KEY = 'invefat_companies'
const SESSION_KEY = 'inveFatSession'
const LICENSES_KEY = 'invefat_company_licenses'
const PLANS_KEY = 'invefat_system_plans'
const BACKUPS_LOG_KEY = 'invefat_company_backups_log'
const SUPPORT_ACCESS_KEY = 'invefat_support_access'
const SYSTEM_AUDIT_KEY = 'invefat_system_audit_log'

export const ALL_COMPANY_MODULES = erpModules.map((module) => module.id)
export const DEVELOPMENT_PLAN_NAMES = ['demo', 'desarrollo', 'development']

const CLEAN_COMPANY_DEFAULTS = {
  inveFatInventoryProducts: [],
  invefat_products: [],
  invefat_customers: [],
  invefat_sales_customers: [],
  inveFatCustomers: [],
  invefat_sales_invoices: [],
  invefat_sales_quotes: [],
  invefat_sales_orders: [],
  invefat_sales_returns: [],
  invefat_sales_credit_notes: [],
  invefat_suppliers: [],
  invefat_company_settings: {},
  invefat_settings: {},
  inveFatUsers: [],
  invefat_users: [],
  inveFatRoles: [],
  invefat_roles: [],
  invefat_permissions: [],
  invefat_ncf_sequences: [],
  invefat_ncf_used: [],
  invefat_warehouses: [],
  invefat_warehouse_locations: [],
  invefat_inventory_movements: [],
  inveFatInventoryMovements: [],
  invefat_inventory_adjustments: [],
  invefat_inventory_counts: [],
  invefat_purchase_orders: [],
  invefat_purchase_requests: [],
  invefat_supplier_quotes: [],
  invefat_supplier_invoices: [],
  invefat_supplier_credit_notes: [],
  invefat_supplier_payments: [],
  invefat_warehouse_receipts: [],
  invefat_warehouse_dispatches: [],
  invefat_warehouse_transfers: [],
  invefat_dgii_606: [],
  invefat_dgii_607: [],
  invefat_electronic_documents: [],
  invefat_electronic_received_documents: [],
  invefat_electronic_commercial_responses: [],
  invefat_electronic_archive: [],
  invefat_electronic_contingency_queue: [],
  invefat_electronic_usage: {},
  invefat_electronic_certificate: {},
  invefat_electronic_dgii_config: {},
  invefat_employees: [],
  invefat_hr_departments: [],
  invefat_hr_positions: [],
  invefat_employee_contracts: [],
  invefat_attendance: [],
  invefat_employee_absences: [],
  invefat_vacations: [],
  invefat_overtime: [],
  invefat_payrolls: [],
  invefat_pay_slips: [],
  invefat_payroll_settings: {},
  invefat_payroll_email_queue: [],
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
  products: 'products',
  inveFatInventoryProducts: 'products',
  invefat_products: 'products',
  customers: 'customers',
  invefat_customers: 'customers',
  invefat_sales_customers: 'customers',
  inveFatCustomers: 'customers',
  invoices: 'invoices',
  invefat_sales_invoices: 'invoices',
  invefat_invoices: 'invoices',
  quotes: 'quotes',
  invefat_sales_quotes: 'quotes',
  invefat_quotes: 'quotes',
  sales_orders: 'sales_orders',
  invefat_sales_orders: 'sales_orders',
  sales_returns: 'sales_returns',
  invefat_sales_returns: 'sales_returns',
  sales_credit_notes: 'sales_credit_notes',
  invefat_sales_credit_notes: 'sales_credit_notes',
  customer_payments: 'customer_payments',
  invefat_customer_payments: 'customer_payments',
  invefat_suppliers: 'suppliers',
  suppliers: 'suppliers',
  settings: 'settings',
  invefat_company_settings: 'settings',
  invefat_settings: 'settings',
  'invefat-business-settings': 'settings',
  inveFatSystemConfig: 'settings',
  users: 'users',
  inveFatUsers: 'users',
  invefat_users: 'users',
  'invefat-system-users': 'users',
  inveFatRoles: 'roles',
  invefat_roles: 'security_roles',
  invefat_permissions: 'permissions',
  invefat_audit_log: 'audit_log',
  inveFatAuditLog: 'audit_log',
  invefat_ncf_sequences: 'ncf_sequences',
  invefat_ncf_used: 'ncf_used',
  invefat_warehouses: 'warehouses',
  invefat_branches: 'branches',
  invefat_inventory_movements: 'inventory_movements',
  inveFatInventoryMovements: 'inventory_movements',
  inventory_movements: 'inventory_movements',
  invefat_inventory_categories: 'inventory_categories',
  inventory_categories: 'inventory_categories',
  invefat_inventory_brands: 'inventory_brands',
  inventory_brands: 'inventory_brands',
  invefat_inventory_units: 'inventory_units',
  inventory_units: 'inventory_units',
  invefat_inventory_adjustments: 'inventory_adjustments',
  invefat_inventory_counts: 'inventory_counts',
  invefat_cycle_counts: 'cycle_counts',
  invefat_inventory_rotation_alerts: 'inventory_rotation_alerts',
  invefat_inventory_lots: 'inventory_lots',
  invefat_inventory_barcodes: 'inventory_barcodes',
  invefat_inventory_costs: 'inventory_costs',
  invefat_inventory_transfers: 'inventory_transfers',
  invefat_stock_transfers: 'inventory_transfers',
  invefat_price_lists: 'price_lists',
  invefat_product_suppliers: 'product_suppliers',
  invefat_purchase_requests: 'purchase_requests',
  invefat_supplier_quotes: 'supplier_quotes',
  invefat_purchase_orders: 'purchase_orders',
  invefat_purchase_receivings: 'warehouse_receipts',
  invefat_receivings: 'warehouse_receipts',
  invefat_supplier_invoices: 'supplier_invoices',
  invefat_supplier_credit_notes: 'supplier_credit_notes',
  invefat_supplier_payments: 'supplier_payments',
  invefat_warehouse_receipts: 'warehouse_receipts',
  invefat_warehouse_receivings: 'warehouse_receipts',
  invefat_warehouse_locations: 'warehouse_locations',
  invefat_warehouse_dispatches: 'warehouse_dispatches',
  invefat_warehouse_transfers: 'warehouse_transfers',
  invefat_warehouse_picking: 'warehouse_picking',
  invefat_warehouse_putaway: 'warehouse_putaway',
  invefat_warehouse_returns: 'warehouse_returns',
  invefat_warehouse_damages: 'warehouse_damages',
  invefat_warehouse_quarantine: 'warehouse_quarantine',
  invefat_warehouse_quality: 'warehouse_quality',
  invefat_warehouse_routes: 'warehouse_routes',
  invefat_alerts: 'alerts',
  invefat_notifications: 'notifications',
  invefat_pending_purchase_order_from_alert: 'pending_purchase_order_from_alert',
  invefat_pending_invoice_from_sales: 'pending_invoice_from_sales',
  invefat_pending_receipt_order: 'pending_receipt_order',
  invefat_pos_sales: 'pos_sales',
  invefat_pos_suspended_sales: 'pos_suspended_sales',
  invefat_sales_reports: 'sales_reports',
  invefat_sales_quote_reports: 'sales_quote_reports',
  invefat_reports: 'reports',
  invefat_dgii_606: 'dgii_606',
  invefat_dgii_607: 'dgii_607',
  invefat_electronic_documents: 'electronic_documents',
  invefat_electronic_received_documents: 'electronic_received_documents',
  invefat_electronic_commercial_responses: 'electronic_commercial_responses',
  invefat_electronic_archive: 'electronic_archive',
  invefat_electronic_contingency_queue: 'electronic_contingency_queue',
  invefat_electronic_usage: 'electronic_usage',
  invefat_electronic_certificate: 'electronic_certificate',
  invefat_electronic_dgii_config: 'electronic_dgii_config',
  invefat_chart_of_accounts: 'chart_of_accounts',
  invefat_journal_entries: 'journal_entries',
  invefat_accounting_settings: 'accounting_settings',
  invefat_banks: 'banks',
  invefat_bank_movements: 'bank_movements',
  invefat_bank_reconciliations: 'bank_reconciliations',
  invefat_cash_boxes: 'cash_boxes',
  invefat_cash_movements: 'cash_movements',
  invefat_rnc_registry: 'rnc_registry',
  invefat_rnc_registry_fallback: 'rnc_registry_fallback',
  invefat_rnc_registry_meta: 'rnc_registry_meta',
  invefat_company_credential: 'company_credential',
  invefat_employees: 'employees',
  employees: 'employees',
  invefat_hr_departments: 'hr_departments',
  hr_departments: 'hr_departments',
  invefat_hr_positions: 'hr_positions',
  hr_positions: 'hr_positions',
  invefat_employee_contracts: 'employee_contracts',
  employee_contracts: 'employee_contracts',
  invefat_attendance: 'attendance',
  attendance: 'attendance',
  invefat_employee_absences: 'employee_absences',
  employee_absences: 'employee_absences',
  invefat_vacations: 'vacations',
  vacations: 'vacations',
  invefat_overtime: 'overtime',
  overtime: 'overtime',
  invefat_payrolls: 'payrolls',
  payrolls: 'payrolls',
  invefat_pay_slips: 'pay_slips',
  pay_slips: 'pay_slips',
  invefat_payroll_settings: 'payroll_settings',
  payroll_settings: 'payroll_settings',
  invefat_payroll_email_queue: 'payroll_email_queue',
  payroll_email_queue: 'payroll_email_queue',
}

const OPERATIONAL_SUFFIXES = new Set(Object.values(COMPANY_KEY_MAP))
const OPERATIONAL_GLOBAL_KEYS = Object.keys(COMPANY_KEY_MAP).filter((key) => (
  key.startsWith('invefat') || key.startsWith('inveFat') || key === 'products' || key === 'customers' || key === 'invoices' || key === 'quotes' || key === 'suppliers'
))

const rawStorage = {
  getItem: Storage.prototype.getItem,
  setItem: Storage.prototype.setItem,
  removeItem: Storage.prototype.removeItem,
  clear: Storage.prototype.clear,
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

export function getRawLocalStorageSnapshot() {
  const snapshot = {}
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (key) snapshot[key] = rawGet(key)
  }
  return snapshot
}

export function setRawLocalStorageItem(key, value) {
  rawSet(key, value)
  return value
}

export function removeRawLocalStorageItem(key) {
  rawRemove(key)
}

export function clearRawLocalStorage() {
  rawStorage.clear.call(localStorage)
}

function isAlreadyScopedCompanyKey(key) {
  const match = /^invefat_[A-Z0-9]+_(.+)$/i.exec(String(key || ''))
  return Boolean(match && OPERATIONAL_SUFFIXES.has(match[1]))
}

function isOperationalStorageKey(key) {
  return Boolean(COMPANY_KEY_MAP[key] || isAlreadyScopedCompanyKey(key))
}

function hasStoredOperationalData(value) {
  if (value === null || value === undefined) return false
  const parsed = safeParse(value, undefined)
  if (Array.isArray(parsed)) return parsed.length > 0
  if (parsed && typeof parsed === 'object') return Object.keys(parsed).length > 0
  return !['', 'null', 'undefined', '[]', '{}'].includes(String(value).trim())
}

function getSessionCompanyCode() {
  const session = safeParse(rawStorage.getItem.call(sessionStorage, SESSION_KEY), null)
  if (!session || session.isSuperAdmin) return ''
  return cleanCode(session.currentCompanyCode || session.companyCode)
}

export function getCompanyKey(baseKey, companyCode = getSessionCompanyCode()) {
  if (isAlreadyScopedCompanyKey(baseKey)) return baseKey
  const suffix = COMPANY_KEY_MAP[baseKey]
  const code = cleanCode(companyCode)
  if (!suffix || !code || code === 'SYSTEM') return baseKey
  return `invefat_${code}_${suffix}`
}

export function installCompanyStorageScope() {
  if (storageScopeInstalled || typeof window === 'undefined') return
  storageScopeInstalled = true

  Storage.prototype.getItem = function scopedGetItem(key) {
    if (this === localStorage && isOperationalStorageKey(key)) {
      const companyCode = getSessionCompanyCode()
      if (!companyCode || companyCode === 'SYSTEM') return null

      const scopedKey = getCompanyKey(key, companyCode)
      const scopedValue = rawStorage.getItem.call(this, scopedKey)

      return scopedValue
    }

    const scopedKey = getCompanyKey(key)
    const scopedValue = rawStorage.getItem.call(this, scopedKey)

    return scopedValue
  }

  Storage.prototype.setItem = function scopedSetItem(key, value) {
    if (this === localStorage && isOperationalStorageKey(key)) {
      const companyCode = getSessionCompanyCode()
      if (!companyCode || companyCode === 'SYSTEM') return undefined
      return rawStorage.setItem.call(this, getCompanyKey(key, companyCode), value)
    }

    return rawStorage.setItem.call(this, getCompanyKey(key), value)
  }

  Storage.prototype.removeItem = function scopedRemoveItem(key) {
    if (this === localStorage && isOperationalStorageKey(key)) {
      const companyCode = getSessionCompanyCode()
      if (!companyCode || companyCode === 'SYSTEM') return undefined
      return rawStorage.removeItem.call(this, getCompanyKey(key, companyCode))
    }

    return rawStorage.removeItem.call(this, getCompanyKey(key))
  }
}

export function getGlobalOperationalStorageWarnings() {
  return OPERATIONAL_GLOBAL_KEYS
    .filter((key) => hasStoredOperationalData(rawGet(key)))
    .map((key) => ({
      key,
      message: `Se detectaron datos operativos globales no aislados en ${key}. Son datos antiguos y no se cargan en empresas nuevas.`,
    }))
}

export function loadCompanies() {
  const saved = safeParse(rawGet(COMPANIES_KEY), null)
  if (Array.isArray(saved)) {
    const normalized = saved.map((company) => (
      DEVELOPMENT_PLAN_NAMES.includes(String(company.plan || '').toLowerCase())
        ? { ...company, modulosActivos: ALL_COMPANY_MODULES }
        : { ...company, modulosActivos: normalizeModuleList(company.modulosActivos) }
    ))
    rawSet(COMPANIES_KEY, JSON.stringify(normalized))
    return normalized
  }

  return []
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
  if (Array.isArray(saved)) {
    const normalized = saved.map((plan) => {
      const isDevPlan = DEVELOPMENT_PLAN_NAMES.includes(String(plan.name || '').toLowerCase())
      return {
        ...plan,
        modules: isDevPlan ? ALL_COMPANY_MODULES : normalizeModuleList(plan.modules),
      }
    })
    rawSet(PLANS_KEY, JSON.stringify(normalized))
    return normalized
  }

  return []
}

export function saveSystemPlans(plans) {
  rawSet(PLANS_KEY, JSON.stringify(plans))
  appendSystemAudit('Cambiar planes', { descripcion: 'Planes del sistema actualizados' })
  return plans
}

export function loadCompanyLicenses() {
  const saved = safeParse(rawGet(LICENSES_KEY), null)
  if (Array.isArray(saved)) return saved

  return []
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
    limiteMensualDocumentosElectronicos: Number(company.limiteMensualDocumentosElectronicos || 0),
    documentosElectronicosUsados: Number(company.documentosElectronicosUsados || 0),
    bloquearAlLimiteElectronico: Boolean(company.bloquearAlLimiteElectronico),
    modulosActivos: DEVELOPMENT_PLAN_NAMES.includes(String(company.plan || '').toLowerCase())
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
  if (DEVELOPMENT_PLAN_NAMES.includes(String(license?.planContratado || company.plan || '').toLowerCase())) {
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
    modulosActivos: DEVELOPMENT_PLAN_NAMES.includes(String(data.plan || '').toLowerCase())
      ? ALL_COMPANY_MODULES
      : normalizeModuleList(data.modulosActivos || ALL_COMPANY_MODULES),
    maxUsuarios: Number(data.maxUsuarios || 5),
    firstLoginPending: data.firstLoginPending !== false,
    onboardingCompleted: Boolean(data.onboardingCompleted),
    createdBy: data.createdBy || 'superadmin',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  saveCompanies([nextCompany, ...companies])
  initializeCleanCompanyData(nextCompany)
  upsertCompanyLicense(nextCompany, buildDefaultLicense(nextCompany))
  appendSystemAudit('Crear empresa', { companyCode: nextCompany.companyCode, descripcion: nextCompany.nombreComercial })
  return nextCompany
}

export function initializeCleanCompanyData(company) {
  if (!company) return false

  Object.entries(CLEAN_COMPANY_DEFAULTS).forEach(([baseKey, value]) => {
    setCompanyData(baseKey, value, company.companyCode)
  })

  return true
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
    email: user.email || user.correo || '',
    phone: user.phone || user.telefono || '',
    mustChangePassword: Boolean(user.mustChangePassword),
    createdAt: user.createdAt || nowIso(),
  }
}

export function loadCompanyUsers(company) {
  if (!company) return []
  const users = getCompanyData('inveFatUsers', [], company.companyCode)
  if (Array.isArray(users) && users.length > 0) {
    return users.map((user) => normalizeCompanyUser(user, company))
  }

  setCompanyData('inveFatUsers', [], company.companyCode)
  return []
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
