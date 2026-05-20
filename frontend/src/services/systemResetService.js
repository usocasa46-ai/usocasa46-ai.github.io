import { isSupabaseConfigured } from '../lib/supabaseClient.js'
import {
  appendSystemAudit,
  clearRawLocalStorage,
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

export function resetEntireLocalSystem() {
  const supabaseActive = isSupabaseConfigured()

  clearRawLocalStorage()
  sessionStorage.removeItem('inveFatSession')

  return {
    ok: true,
    message: supabaseActive
      ? 'Sistema local reiniciado. Los datos en Supabase no fueron eliminados porque se requiere operacion administrativa segura.'
      : 'Sistema reiniciado correctamente. Inicie sesion nuevamente.',
    supabaseWarning: supabaseActive,
  }
}
