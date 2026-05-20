import { isSupabaseConfigured, supabaseRequest } from '../lib/supabaseClient.js'
import {
  loadCompanies,
  loadCompanyLicenses,
  loadCompanyUsers,
  loadSystemPlans,
  saveCompanies,
  saveCompanyLicenses,
  saveCompanyUsers,
  setRawLocalStorageItem,
} from './companyStorage.js'

function nowIso() {
  return new Date().toISOString()
}

function cleanCode(value) {
  return String(value || '').trim().toUpperCase()
}

function adminHeaders() {
  return { 'x-user-role': 'superadmin' }
}

function companyHeaders(companyCode) {
  const code = cleanCode(companyCode)
  return {
    'x-company-id': code,
    'x-company-code': code,
  }
}

function unwrapRow(row) {
  if (!row || typeof row !== 'object') return row
  return {
    ...(row.data || {}),
    id: row.data?.id || row.id,
    company_id: row.company_id || row.data?.company_id,
  }
}

function companyCodeOf(record) {
  return cleanCode(record?.companyCode || record?.company_code || record?.company_id || record?.companyId)
}

function recordId(record, fallbackPrefix = 'REC') {
  return String(record?.id || record?.username || record?.companyCode || `${fallbackPrefix}-${Date.now()}`)
}

function wrapRecord(record, { id, companyCode = '' } = {}) {
  const code = cleanCode(companyCode || companyCodeOf(record))
  return {
    id: String(id || recordId(record)),
    company_id: code || null,
    data: {
      ...record,
      ...(code ? { company_id: code } : {}),
    },
    updated_at: nowIso(),
  }
}

function mergeById(current, record) {
  const id = recordId(record)
  return current.some((item) => recordId(item) === id)
    ? current.map((item) => (recordId(item) === id ? record : item))
    : [record, ...current]
}

function persistCompanies(companies) {
  saveCompanies(Array.isArray(companies) ? companies : [])
}

function persistLicenses(licenses) {
  saveCompanyLicenses(Array.isArray(licenses) ? licenses : [])
}

function persistPlans(plans) {
  setRawLocalStorageItem('invefat_system_plans', JSON.stringify(Array.isArray(plans) ? plans : []))
}

function persistFlatUsers(users) {
  setRawLocalStorageItem('invefat_company_users', JSON.stringify(Array.isArray(users) ? users : []))
}

function persistUsersByCompany(companies, users) {
  const byCode = new Map()
  users.forEach((user) => {
    const code = companyCodeOf(user)
    if (!code) return
    byCode.set(code, [...(byCode.get(code) || []), user])
  })

  companies.forEach((company) => {
    saveCompanyUsers(company, byCode.get(cleanCode(company.companyCode)) || [])
  })
}

export async function loadSystemDataFromSupabase() {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      source: 'localStorage',
      message: 'Supabase no configurado.',
    }
  }

  try {
    const [companyRows, licenseRows, planRows, userRows] = await Promise.all([
      supabaseRequest('/companies?select=*&order=updated_at.desc', { headers: adminHeaders() }),
      supabaseRequest('/company_licenses?select=*&order=updated_at.desc', { headers: adminHeaders() }),
      supabaseRequest('/system_plans?select=*&order=updated_at.desc', { headers: adminHeaders() }),
      supabaseRequest('/company_users?select=*&order=updated_at.desc', { headers: adminHeaders() }),
    ])

    const companies = Array.isArray(companyRows) ? companyRows.map(unwrapRow) : []
    const licenses = Array.isArray(licenseRows) ? licenseRows.map(unwrapRow) : []
    const plans = Array.isArray(planRows) ? planRows.map(unwrapRow) : []
    const users = Array.isArray(userRows) ? userRows.map(unwrapRow) : []

    persistCompanies(companies)
    persistLicenses(licenses)
    persistPlans(plans)
    persistFlatUsers(users)
    persistUsersByCompany(companies, users)

    return {
      ok: true,
      source: 'Supabase',
      companies,
      licenses,
      plans,
      users,
      message: 'Datos administrativos sincronizados desde Supabase.',
    }
  } catch (error) {
    return {
      ok: false,
      source: 'localStorage',
      error: error.message,
      message: 'No se pudo leer Supabase. Se mantiene localStorage como respaldo.',
    }
  }
}

export async function loadCompanyBundleForLogin(companyCode) {
  const code = cleanCode(companyCode)
  if (!code || !isSupabaseConfigured()) return null

  try {
    const headers = companyHeaders(code)
    const [companyRows, licenseRows, userRows] = await Promise.all([
      supabaseRequest('/companies?select=*', { headers }),
      supabaseRequest('/company_licenses?select=*', { headers }),
      supabaseRequest(`/company_users?select=*&company_id=eq.${encodeURIComponent(code)}`, { headers }),
    ])

    const companies = Array.isArray(companyRows) ? companyRows.map(unwrapRow) : []
    const licenses = Array.isArray(licenseRows) ? licenseRows.map(unwrapRow) : []
    const users = Array.isArray(userRows) ? userRows.map(unwrapRow) : []
    const company = companies.find((item) => companyCodeOf(item) === code) || null
    const license = licenses.find((item) => companyCodeOf(item) === code) || null

    if (!company) return null

    persistCompanies(mergeById(loadCompanies(), company))
    if (license) persistLicenses(mergeById(loadCompanyLicenses(), license))
    saveCompanyUsers(company, users)
    persistFlatUsers(users)

    return { company, license, users }
  } catch (error) {
    console.warn('No se pudo validar empresa en Supabase:', error.message)
    return null
  }
}

export async function syncCompanyToSupabase(company) {
  if (!isSupabaseConfigured() || !company) return { ok: false, skipped: true }

  try {
    await supabaseRequest('/companies?on_conflict=id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=minimal',
        ...adminHeaders(),
      },
      body: JSON.stringify(wrapRecord(company, {
        id: company.id,
        companyCode: company.companyCode,
      })),
    })
    return { ok: true }
  } catch (error) {
    console.warn('No se pudo sincronizar empresa con Supabase:', error.message)
    return { ok: false, error: error.message }
  }
}

export async function syncLicenseToSupabase(license) {
  if (!isSupabaseConfigured() || !license) return { ok: false, skipped: true }

  try {
    await supabaseRequest('/company_licenses?on_conflict=id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=minimal',
        ...adminHeaders(),
      },
      body: JSON.stringify(wrapRecord(license, {
        id: license.id,
        companyCode: license.companyCode,
      })),
    })
    return { ok: true }
  } catch (error) {
    console.warn('No se pudo sincronizar licencia con Supabase:', error.message)
    return { ok: false, error: error.message }
  }
}

export async function syncPlansToSupabase(plans) {
  if (!isSupabaseConfigured() || !Array.isArray(plans)) return { ok: false, skipped: true }

  try {
    await supabaseRequest('/system_plans?on_conflict=id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=minimal',
        ...adminHeaders(),
      },
      body: JSON.stringify(plans.map((plan) => ({
        id: String(plan.id || plan.name),
        company_id: null,
        data: plan,
        updated_at: nowIso(),
      }))),
    })
    return { ok: true }
  } catch (error) {
    console.warn('No se pudo sincronizar planes con Supabase:', error.message)
    return { ok: false, error: error.message }
  }
}

export async function syncCompanyUsersToSupabase(company, users) {
  if (!isSupabaseConfigured() || !company || !Array.isArray(users)) return { ok: false, skipped: true }
  const code = cleanCode(company.companyCode)

  try {
    await supabaseRequest('/company_users?on_conflict=company_id,id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=minimal',
        ...adminHeaders(),
      },
      body: JSON.stringify(users.map((user) => wrapRecord({
        ...user,
        companyCode: code,
        companyId: company.id,
      }, {
        id: user.username,
        companyCode: code,
      }))),
    })
    return { ok: true }
  } catch (error) {
    console.warn('No se pudo sincronizar usuarios con Supabase:', error.message)
    return { ok: false, error: error.message }
  }
}

export function getLocalSystemCounts() {
  const companies = loadCompanies()
  const licenses = loadCompanyLicenses()
  const plans = loadSystemPlans()
  const users = companies.flatMap((company) => loadCompanyUsers(company))

  return {
    companies: companies.length,
    licenses: licenses.length,
    plans: plans.length,
    users: users.length,
  }
}
