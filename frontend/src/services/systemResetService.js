import { isSupabaseConfigured } from '../lib/supabaseClient.js'
import {
  appendSystemAudit,
  COMPANY_KEY_MAP,
  getCompanyKey,
  getRawLocalStorageSnapshot,
  loadCompanyUsers,
  removeRawLocalStorageItem,
  saveCompanyUsers,
  setCompanyData,
} from './companyStorage.js'

const PRESERVED_COMPANY_KEYS = new Set([
  'users',
  'inveFatUsers',
  'invefat_users',
  'inveFatRoles',
  'invefat_roles',
  'invefat_permissions',
  'invefat_company_credential',
])

const RESET_NOTICE_KEY = 'invefat_reset_notice'
const ACTIVE_SESSION_KEYS = new Set(['inveFatSession'])
const RESET_EXCLUDED_STORAGE_KEYS = new Set([RESET_NOTICE_KEY])
const SESSION_RESET_NAMES = new Set([
  'currentCompany',
  'currentCompanyCode',
  'currentCompanyId',
  'currentUser',
  'activeModules',
  'auth',
  'token',
  'accessToken',
  'refreshToken',
  'session',
  'user',
])
const SESSION_RESET_NAMES_LOWER = new Set(Array.from(SESSION_RESET_NAMES).map((name) => name.toLowerCase()))
const KNOWN_INDEXED_DB_NAMES = [
  'invefat',
  'INVEFAT',
  'inve-fat',
  'INVE-FAT',
  'invefat_rnc_registry',
  'invefat-rnc-registry',
  'invefat_data',
  'invefat-cache',
]

export const SUPABASE_RESET_SQL = `-- INVE-FAT SYSTEM - reinicio total de datos en Supabase.
-- ADVERTENCIA: esto borra todos los datos de prueba/produccion en las tablas listadas.
-- Ejecutar manualmente en Supabase SQL Editor solo despues de descargar y verificar backup.
-- Este script NO borra estructura, NO hace DROP TABLE y NO hace DROP SCHEMA.

do $$
declare
  tables_to_clean text[] := array[
    'payroll_email_queue',
    'pay_slips',
    'payrolls',
    'overtime',
    'vacations',
    'employee_absences',
    'attendance',
    'employee_contracts',
    'hr_positions',
    'hr_departments',
    'employees',
    'electronic_archive',
    'electronic_commercial_responses',
    'electronic_received_documents',
    'electronic_documents',
    'electronic_usage',
    'electronic_contingency_queue',
    'dgii_606',
    'dgii_607',
    'rnc_registry',
    'reports',
    'sales_reports',
    'pos_sales',
    'pos_suspended_sales',
    'warehouse_transfers',
    'warehouse_dispatches',
    'warehouse_receipts',
    'warehouse_locations',
    'warehouses',
    'supplier_payments',
    'supplier_credit_notes',
    'supplier_invoices',
    'purchase_orders',
    'purchase_requests',
    'purchases',
    'inventory_counts',
    'inventory_adjustments',
    'inventory_movements',
    'ncf_used',
    'ncf_sequences',
    'settings',
    'quotes',
    'invoices',
    'suppliers',
    'customers',
    'products',
    'company_backups_log',
    'support_access',
    'system_audit_log',
    'company_users',
    'company_licenses',
    'system_plans',
    'companies'
  ];
  truncate_list text;
begin
  select string_agg(format('%I.%I', schemaname, tablename), ', ')
    into truncate_list
  from pg_tables
  where schemaname = 'public'
    and tablename = any(tables_to_clean);

  if truncate_list is not null then
    execute 'truncate table ' || truncate_list || ' restart identity cascade';
  end if;
end $$;

-- Recargar cache de PostgREST/Supabase.
notify pgrst, 'reload schema';

-- Si en fases futuras se agregan nuevas tablas multiempresa, incluirlas en
-- tables_to_clean antes de ejecutar un reinicio total.`

function emptyValueForSuffix(suffix) {
  if (
    String(suffix || '').includes('settings')
    || String(suffix || '').includes('config')
    || String(suffix || '').includes('certificate')
    || String(suffix || '').includes('usage')
    || String(suffix || '').includes('meta')
    || String(suffix || '').includes('credential')
  ) {
    return {}
  }

  return []
}

function cleanCode(value) {
  return String(value || '').trim().toUpperCase()
}

function safeParse(value, fallback) {
  try {
    const parsed = value ? JSON.parse(value) : fallback
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function isSystemStorageKey(key) {
  const normalized = String(key || '')
  return (
    /^invefat/i.test(normalized)
    || /^inveFat/.test(normalized)
    || /^inve-fat/i.test(normalized)
    || /^INVE-FAT/.test(normalized)
    || normalized === 'inveFatSession'
  )
}

function isRelatedSystemName(value) {
  const normalized = String(value || '').trim()
  return (
    /^invefat/i.test(normalized)
    || /^inveFat/.test(normalized)
    || /^inve-fat/i.test(normalized)
    || /^INVE-FAT/.test(normalized)
  )
}

function isSessionResetKey(key) {
  const normalized = String(key || '')
  return (
    isSystemStorageKey(normalized)
    || SESSION_RESET_NAMES.has(normalized)
    || SESSION_RESET_NAMES_LOWER.has(normalized.toLowerCase())
  )
}

function isResetDataStorageKey(key, { ignoreActiveSession = true } = {}) {
  const normalized = String(key || '')
  if (RESET_EXCLUDED_STORAGE_KEYS.has(normalized)) return false
  if (ignoreActiveSession && ACTIVE_SESSION_KEYS.has(normalized)) {
    return false
  }
  return isSystemStorageKey(normalized)
}

function collectStorageKeys(storage, predicate) {
  if (!storage) return []
  const keys = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key && predicate(key)) keys.push(key)
  }
  return keys
}

function clearSystemSessionStorage() {
  if (typeof sessionStorage === 'undefined') return 0
  const keys = collectStorageKeys(sessionStorage, isSessionResetKey)
  keys.forEach((key) => sessionStorage.removeItem(key))
  sessionStorage.removeItem('inveFatSession')
  return keys.length
}

async function getIndexedDbNames({ includeKnown = false } = {}) {
  if (typeof indexedDB === 'undefined') return []
  const discovered = new Set()

  if (typeof indexedDB.databases === 'function') {
    try {
      const databases = await indexedDB.databases()
      databases.forEach((database) => {
        if (database?.name) discovered.add(database.name)
      })
    } catch {
      // Algunos navegadores no permiten enumerar IndexedDB.
    }
  }

  if (includeKnown) KNOWN_INDEXED_DB_NAMES.forEach((name) => discovered.add(name))
  return Array.from(discovered).filter(isRelatedSystemName)
}

function deleteIndexedDb(name) {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined' || !name) {
      resolve(false)
      return
    }

    try {
      const request = indexedDB.deleteDatabase(name)
      request.onsuccess = () => resolve(true)
      request.onerror = () => resolve(false)
      request.onblocked = () => resolve(false)
    } catch {
      resolve(false)
    }
  })
}

async function getCacheNames() {
  if (typeof caches === 'undefined' || typeof caches.keys !== 'function') return []
  try {
    const names = await caches.keys()
    return names.filter(isRelatedSystemName)
  } catch {
    return []
  }
}

async function deleteCache(name) {
  if (typeof caches === 'undefined' || !name) return false
  try {
    return caches.delete(name)
  } catch {
    return false
  }
}

export function getLocalResetFootprint() {
  const snapshot = getRawLocalStorageSnapshot()
  const systemKeys = Object.keys(snapshot).filter((key) => isResetDataStorageKey(key))
  const sessionKeys = typeof sessionStorage === 'undefined'
    ? []
    : collectStorageKeys(sessionStorage, (key) => isSessionResetKey(key) && key !== RESET_NOTICE_KEY && !ACTIVE_SESSION_KEYS.has(key))
  const companies = safeParse(snapshot.invefat_companies, [])
  const licenses = safeParse(snapshot.invefat_company_licenses, [])
  const users = safeParse(snapshot.invefat_company_users || snapshot.inveFatUsers, [])
  const plans = safeParse(snapshot.invefat_system_plans, [])

  return {
    systemKeys: systemKeys.length,
    localStorageKeys: systemKeys.length,
    sessionStorageKeys: sessionKeys.length,
    activeSessionPresent: typeof sessionStorage !== 'undefined' && Boolean(sessionStorage.getItem('inveFatSession')),
    companies: Array.isArray(companies) ? companies.length : 0,
    users: Array.isArray(users) ? users.length : 0,
    licenses: Array.isArray(licenses) ? licenses.length : 0,
    plans: Array.isArray(plans) ? plans.length : 0,
    indexedDbNames: [],
    cacheNames: [],
    indexedDbCount: 0,
    cacheCount: 0,
    clean: systemKeys.length === 0 && sessionKeys.length === 0,
  }
}

export async function getAdvancedLocalResetFootprint() {
  const basic = getLocalResetFootprint()
  const [indexedDbNames, cacheNames] = await Promise.all([
    getIndexedDbNames(),
    getCacheNames(),
  ])

  return {
    ...basic,
    indexedDbNames,
    cacheNames,
    indexedDbCount: indexedDbNames.length,
    cacheCount: cacheNames.length,
    indexedDbClean: indexedDbNames.length === 0,
    cacheClean: cacheNames.length === 0,
    localStorageClean: basic.localStorageKeys === 0,
    sessionStorageClean: basic.sessionStorageKeys === 0,
    clean: basic.localStorageKeys === 0
      && basic.sessionStorageKeys === 0
      && indexedDbNames.length === 0
      && cacheNames.length === 0,
  }
}

export function registerResetRequested({ session, type, company = null }) {
  appendSystemAudit(type === 'empresa' ? 'reinicio empresa solicitado' : 'reinicio sistema solicitado', {
    usuario: session?.username || 'superadmin',
    companyCode: company?.companyCode || '',
    descripcion: company ? company.nombreComercial : 'Reinicio completo solicitado',
  })
}

export function resetCompanyLocalData(company, { session } = {}) {
  const companyCode = cleanCode(company?.companyCode)
  if (!companyCode) throw new Error('Empresa no valida para reinicio.')

  appendSystemAudit('reinicio empresa confirmado', {
    usuario: session?.username || 'superadmin',
    companyCode,
    descripcion: `${company.nombreComercial || companyCode} confirmado con frase segura`,
  })

  const preservedUsers = loadCompanyUsers(company)
  const preservedScopedKeys = new Set(
    Array.from(PRESERVED_COMPANY_KEYS).map((baseKey) => getCompanyKey(baseKey, companyCode)),
  )

  Object.keys(getRawLocalStorageSnapshot()).forEach((key) => {
    if (key.startsWith(`invefat_${companyCode}_`) && !preservedScopedKeys.has(key)) {
      removeRawLocalStorageItem(key)
    }
  })

  Object.entries(COMPANY_KEY_MAP).forEach(([baseKey, suffix]) => {
    if (PRESERVED_COMPANY_KEYS.has(baseKey)) return
    setCompanyData(baseKey, emptyValueForSuffix(suffix), companyCode)
  })

  saveCompanyUsers(company, preservedUsers)
  appendSystemAudit('reinicio empresa ejecutado', {
    usuario: session?.username || 'superadmin',
    companyCode,
    descripcion: `${company.nombreComercial || companyCode} reiniciada sin datos operativos`,
  })

  return {
    ok: true,
    message: `Empresa ${companyCode} reiniciada correctamente.`,
  }
}

export async function resetLocalSystem() {
  const supabaseActive = isSupabaseConfigured()
  const before = await getAdvancedLocalResetFootprint()

  Object.keys(getRawLocalStorageSnapshot()).forEach((key) => {
    if (isResetDataStorageKey(key, { ignoreActiveSession: false })) removeRawLocalStorageItem(key)
  })
  const sessionKeysRemoved = clearSystemSessionStorage()
  const [indexedDbNames, cacheNames] = await Promise.all([
    getIndexedDbNames({ includeKnown: true }),
    getCacheNames(),
  ])
  const indexedDbResults = await Promise.all(indexedDbNames.map(deleteIndexedDb))
  const cacheResults = await Promise.all(cacheNames.map(deleteCache))

  return {
    ok: true,
    message: supabaseActive
      ? 'Datos locales limpiados. Datos en Supabase no fueron eliminados. Para dejar la nube en cero ejecute supabase/reset_all_data.sql.'
      : 'Datos locales limpiados. Inicie sesion nuevamente.',
    supabaseWarning: supabaseActive,
    before,
    after: await getAdvancedLocalResetFootprint(),
    sessionKeysRemoved,
    indexedDbRemoved: indexedDbResults.filter(Boolean).length,
    cachesRemoved: cacheResults.filter(Boolean).length,
  }
}

export const resetEntireLocalSystem = resetLocalSystem
