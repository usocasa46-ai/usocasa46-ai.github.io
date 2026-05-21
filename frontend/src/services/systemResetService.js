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
    || normalized === 'inveFatSession'
  )
}

function isResetDataStorageKey(key) {
  const normalized = String(key || '')
  if (['invefat_theme', 'invefat-theme', 'invefat_reset_notice', 'invefat_last_active_page'].includes(normalized)) {
    return false
  }
  return isSystemStorageKey(normalized)
}

function clearSystemSessionStorage() {
  if (typeof sessionStorage === 'undefined') return 0
  const keys = []
  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index)
    if (key && isSystemStorageKey(key)) keys.push(key)
  }
  keys.forEach((key) => sessionStorage.removeItem(key))
  sessionStorage.removeItem('inveFatSession')
  return keys.length
}

export function getLocalResetFootprint() {
  const snapshot = getRawLocalStorageSnapshot()
  const systemKeys = Object.keys(snapshot).filter(isResetDataStorageKey)
  const companies = safeParse(snapshot.invefat_companies, [])
  const licenses = safeParse(snapshot.invefat_company_licenses, [])
  const users = safeParse(snapshot.invefat_company_users || snapshot.inveFatUsers, [])
  const plans = safeParse(snapshot.invefat_system_plans, [])

  return {
    systemKeys: systemKeys.length,
    companies: Array.isArray(companies) ? companies.length : 0,
    users: Array.isArray(users) ? users.length : 0,
    licenses: Array.isArray(licenses) ? licenses.length : 0,
    plans: Array.isArray(plans) ? plans.length : 0,
    clean: systemKeys.length === 0,
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

export function resetLocalSystem() {
  const supabaseActive = isSupabaseConfigured()
  const before = getLocalResetFootprint()

  Object.keys(getRawLocalStorageSnapshot()).forEach((key) => {
    if (isSystemStorageKey(key)) removeRawLocalStorageItem(key)
  })
  const sessionKeysRemoved = clearSystemSessionStorage()

  return {
    ok: true,
    message: supabaseActive
      ? 'Datos locales limpiados. Datos en Supabase no fueron eliminados. Para dejar la nube en cero ejecute supabase/reset_all_data.sql.'
      : 'Datos locales limpiados. Inicie sesion nuevamente.',
    supabaseWarning: supabaseActive,
    before,
    after: getLocalResetFootprint(),
    sessionKeysRemoved,
  }
}

export const resetEntireLocalSystem = resetLocalSystem
