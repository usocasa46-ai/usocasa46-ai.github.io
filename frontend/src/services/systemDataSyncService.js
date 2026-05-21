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
  COMPANY_LICENSE_MODULES,
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
  const data = row.data || {}
  const companyCode = cleanCode(row.company_code || data.company_code || data.companyCode || row.company_id || data.company_id)
  const internalCompanyId = data.companyId || data.company_id || row.company_id || data.companyCode || data.company_code
  return {
    ...data,
    ...row,
    id: data.id || row.id,
    companyId: data.companyId || internalCompanyId,
    company_id: data.company_id || internalCompanyId,
    companyCode: data.companyCode || companyCode,
    company_code: data.company_code || companyCode,
    nombreComercial: data.nombreComercial || row.nombre_comercial || data.nombre_comercial,
    razonSocial: data.razonSocial || row.razon_social || data.razon_social,
    planContratado: data.planContratado || row.plan_contratado || data.plan_contratado,
    modulosActivos: data.modulosActivos || row.modulos_activos || data.modulos_activos,
    fechaActivacion: data.fechaActivacion || row.fecha_activacion || data.fecha_activacion,
    fechaVencimiento: data.fechaVencimiento || row.fecha_vencimiento || data.fecha_vencimiento,
    maxUsuarios: data.maxUsuarios || row.max_usuarios || data.max_usuarios,
    maxSucursales: data.maxSucursales || row.max_sucursales || data.max_sucursales,
    maxAlmacenes: data.maxAlmacenes || row.max_almacenes || data.max_almacenes,
    tipoVersion: data.tipoVersion || row.tipo_version || data.tipo_version,
    username: data.username || row.username || data.usuario || row.usuario,
    usuario: data.usuario || row.usuario || data.username || row.username,
    fullName: data.fullName || row.nombre || data.nombre,
    nombre: data.nombre || row.nombre || data.fullName,
    role: data.role || row.role || data.rol || row.rol,
    rol: data.rol || row.rol || data.role || row.role,
    password: data.password || row.password || data.password_hash || row.password_hash,
    mustChangePassword: data.mustChangePassword ?? row.must_change_password ?? data.must_change_password,
    _supabase: {
      id: row.id,
      company_id: row.company_id || '',
      company_code: row.company_code || '',
    },
  }
}

function companyCodeOf(record) {
  return cleanCode(record?.companyCode || record?.company_code || record?._supabase?.company_code)
}

function companyIdOf(record) {
  return String(record?.companyId || record?.company_id || record?.id || record?._supabase?.company_id || '').trim()
}

function sanitizeModules(modules) {
  if (!Array.isArray(modules)) return COMPANY_LICENSE_MODULES
  const cleaned = modules.filter((moduleId) => COMPANY_LICENSE_MODULES.includes(moduleId))
  return Array.from(new Set(['dashboard', ...cleaned]))
}

function normalizeCompanyForStorage(company) {
  const code = cleanCode(company?.companyCode || company?.company_code || company?._supabase?.company_code)
  const id = String(company?.id || company?.companyId || company?._supabase?.id || `COMP-${code}`)
  return {
    ...company,
    id,
    companyId: id,
    company_id: id,
    companyCode: code,
    company_code: code,
    modulosActivos: sanitizeModules(company?.modulosActivos || company?.modulos_activos),
  }
}

function normalizeLicenseForStorage(license, company = null) {
  const code = cleanCode(license?.companyCode || license?.company_code || company?.companyCode || company?.company_code)
  const companyId = String(license?.companyId || company?.id || license?.company_id || '')
  return {
    ...license,
    companyId,
    company_id: companyId,
    companyCode: code,
    company_code: code,
    planContratado: license?.planContratado || license?.plan_contratado || company?.plan || 'Demo',
    modulosActivos: sanitizeModules(license?.modulosActivos || license?.modulos_activos || company?.modulosActivos),
    estado: license?.estado || 'activa',
  }
}

function normalizeUserForStorage(user, company) {
  const code = cleanCode(user?.companyCode || user?.company_code || company?.companyCode)
  const companyId = String(user?.companyId || company?.id || user?.company_id || '')
  return {
    ...user,
    id: user?.id || user?.username || user?.usuario,
    companyId,
    company_id: companyId,
    companyCode: code,
    company_code: code,
    username: user?.username || user?.usuario,
    usuario: user?.usuario || user?.username,
    fullName: user?.fullName || user?.nombre || user?.name || 'Usuario',
    nombre: user?.nombre || user?.fullName || user?.name || 'Usuario',
    role: user?.role || user?.rol || 'Usuario',
    rol: user?.rol || user?.role || 'Usuario',
    active: user?.active !== false && !['inactivo', 'inactiva', 'suspendido'].includes(String(user?.estado || '').toLowerCase()),
    estado: user?.estado || (user?.active === false ? 'inactivo' : 'activo'),
  }
}

function recordId(record, fallbackPrefix = 'REC') {
  return String(record?.id || record?.username || record?.companyCode || `${fallbackPrefix}-${Date.now()}`)
}

function supabaseData(record, { companyId = '', companyCode = '' } = {}) {
  const code = cleanCode(companyCode || companyCodeOf(record))
  const internalId = String(companyId || companyIdOf(record) || '').trim()
  const modules = record.modulosActivos || record.modulos_activos
  return {
    ...record,
    ...(internalId ? { companyId: internalId, company_id: internalId } : {}),
    ...(code ? { companyCode: code, company_code: code } : {}),
    ...(modules ? { modulosActivos: sanitizeModules(modules), modulos_activos: sanitizeModules(modules) } : {}),
  }
}

function wrapRecord(record, { id, companyId = '', companyCode = '' } = {}) {
  const code = cleanCode(companyCode || companyCodeOf(record))
  const internalId = String(companyId || companyIdOf(record) || '').trim()
  return {
    id: String(id || recordId(record)),
    company_id: internalId || null,
    company_code: code || null,
    data: supabaseData(record, { companyId: internalId, companyCode: code }),
    updated_at: nowIso(),
  }
}

function companyPayload(company) {
  const base = wrapRecord(company, {
    id: company.id,
    companyId: company.id,
    companyCode: company.companyCode,
  })

  return {
    ...base,
    nombre_comercial: company.nombreComercial || '',
    razon_social: company.razonSocial || company.nombreComercial || '',
    rnc: company.rnc || '',
    telefono: company.telefono || '',
    correo: company.correo || '',
    direccion: company.direccion || '',
    estado: company.estado || 'activa',
    plan: company.plan || 'Demo',
    first_login_pending: company.firstLoginPending !== false,
    onboarding_completed: Boolean(company.onboardingCompleted),
    created_at: company.createdAt || nowIso(),
  }
}

function licensePayload(license) {
  const base = wrapRecord(license, {
    id: license.id,
    companyId: license.companyId,
    companyCode: license.companyCode,
  })

  return {
    ...base,
    codigo_licencia: license.codigoLicencia || license.codigo_licencia || license.id || '',
    plan_contratado: license.planContratado || license.plan_contratado || 'Demo',
    estado: license.estado || 'activa',
    modulos_activos: sanitizeModules(license.modulosActivos || license.modulos_activos),
    fecha_activacion: license.fechaActivacion || license.fecha_activacion || null,
    fecha_vencimiento: license.fechaVencimiento || license.fecha_vencimiento || null,
    max_usuarios: Number(license.maxUsuarios || license.max_usuarios || 0),
    max_sucursales: Number(license.maxSucursales || license.max_sucursales || 0),
    max_almacenes: Number(license.maxAlmacenes || license.max_almacenes || 0),
    tipo_version: license.tipoVersion || license.tipo_version || 'Cloud',
    observacion: license.observacion || '',
    created_at: license.createdAt || nowIso(),
  }
}

function userPayload(user, company) {
  const code = cleanCode(company?.companyCode || user.companyCode || user.company_code)
  const companyId = String(company?.id || user.companyId || user.company_id || '')
  const username = user.username || user.usuario || ''
  const normalized = {
    ...user,
    companyId,
    companyCode: code,
    username,
    usuario: username,
  }
  const base = wrapRecord(normalized, {
    id: username,
    companyId,
    companyCode: code,
  })

  return {
    ...base,
    nombre: user.fullName || user.nombre || username,
    usuario: username,
    username,
    password: user.password || '',
    password_hash: user.passwordHash || user.password_hash || user.password || '',
    rol: user.role || user.rol || 'Usuario',
    role: user.role || user.rol || 'Usuario',
    estado: user.active === false ? 'inactivo' : (user.estado || 'activo'),
    must_change_password: Boolean(user.mustChangePassword || user.must_change_password),
    correo: user.email || user.correo || '',
    telefono: user.phone || user.telefono || '',
    created_at: user.createdAt || nowIso(),
  }
}

function mergeById(current, record) {
  const id = recordId(record)
  return current.some((item) => recordId(item) === id)
    ? current.map((item) => (recordId(item) === id ? record : item))
    : [record, ...current]
}

async function verifyPersisted(path, message) {
  const rows = await supabaseRequest(path, { headers: adminHeaders() })
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(message)
  }
  return rows
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

    const companies = Array.isArray(companyRows) ? companyRows.map(unwrapRow).map(normalizeCompanyForStorage) : []
    const companiesByCode = new Map(companies.map((company) => [companyCodeOf(company), company]))
    const licenses = Array.isArray(licenseRows)
      ? licenseRows.map(unwrapRow).map((license) => normalizeLicenseForStorage(license, companiesByCode.get(companyCodeOf(license))))
      : []
    const plans = Array.isArray(planRows) ? planRows.map(unwrapRow) : []
    const users = Array.isArray(userRows)
      ? userRows.map(unwrapRow).map((user) => normalizeUserForStorage(user, companiesByCode.get(companyCodeOf(user))))
      : []

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
      supabaseRequest('/company_users?select=*', { headers }),
    ])

    const companies = Array.isArray(companyRows) ? companyRows.map(unwrapRow).map(normalizeCompanyForStorage) : []
    const company = companies.find((item) => companyCodeOf(item) === code) || null
    const licenses = Array.isArray(licenseRows)
      ? licenseRows.map(unwrapRow).map((license) => normalizeLicenseForStorage(license, company))
      : []
    const users = Array.isArray(userRows)
      ? userRows.map(unwrapRow).map((user) => normalizeUserForStorage(user, company))
      : []
    const license = licenses.find((item) => companyCodeOf(item) === code || item.companyId === company?.id) || null

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
    const rows = await supabaseRequest('/companies?on_conflict=id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
        ...adminHeaders(),
      },
      body: JSON.stringify(companyPayload(company)),
    })
    await verifyPersisted(`/companies?select=id,company_id,company_code&id=eq.${encodeURIComponent(company.id)}`, 'Supabase no devolvio la empresa guardada.')
    return { ok: true, rows: Array.isArray(rows) ? rows.length : 0 }
  } catch (error) {
    console.warn('No se pudo sincronizar empresa con Supabase:', error.message)
    return { ok: false, error: error.message }
  }
}

export async function syncLicenseToSupabase(license) {
  if (!isSupabaseConfigured() || !license) return { ok: false, skipped: true }

  try {
    const rows = await supabaseRequest('/company_licenses?on_conflict=id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
        ...adminHeaders(),
      },
      body: JSON.stringify(licensePayload(license)),
    })
    await verifyPersisted(`/company_licenses?select=id,company_id,company_code&id=eq.${encodeURIComponent(license.id)}`, 'Supabase no devolvio la licencia guardada.')
    return { ok: true, rows: Array.isArray(rows) ? rows.length : 0 }
  } catch (error) {
    console.warn('No se pudo sincronizar licencia con Supabase:', error.message)
    return { ok: false, error: error.message }
  }
}

export async function syncPlansToSupabase(plans) {
  if (!isSupabaseConfigured() || !Array.isArray(plans)) return { ok: false, skipped: true }

  try {
    const rows = await supabaseRequest('/system_plans?on_conflict=id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
        ...adminHeaders(),
      },
      body: JSON.stringify(plans.map((plan) => ({
        id: String(plan.id || plan.name),
        company_id: null,
        data: plan,
        updated_at: nowIso(),
      }))),
    })
    return { ok: true, rows: Array.isArray(rows) ? rows.length : 0 }
  } catch (error) {
    console.warn('No se pudo sincronizar planes con Supabase:', error.message)
    return { ok: false, error: error.message }
  }
}

export async function syncCompanyUsersToSupabase(company, users) {
  if (!isSupabaseConfigured() || !company || !Array.isArray(users)) return { ok: false, skipped: true }
  const code = cleanCode(company.companyCode)

  try {
    const rows = await supabaseRequest('/company_users?on_conflict=company_id,id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
        ...adminHeaders(),
      },
      body: JSON.stringify(users.map((user) => userPayload(user, company))),
    })
    if (users.length > 0) {
      await verifyPersisted(`/company_users?select=id,company_id,company_code&id=eq.${encodeURIComponent(users[0].username)}&company_id=eq.${encodeURIComponent(company.id)}`, 'Supabase no devolvio el usuario administrador guardado.')
    }
    return { ok: true, rows: Array.isArray(rows) ? rows.length : 0 }
  } catch (error) {
    console.warn('No se pudo sincronizar usuarios con Supabase:', error.message)
    return { ok: false, error: error.message }
  }
}

export async function diagnoseCompanyLogin(companyCode) {
  const code = cleanCode(companyCode)
  if (!code) return { ok: false, message: 'Escribe un codigo de empresa.' }
  if (!isSupabaseConfigured()) return { ok: false, message: 'Supabase no configurado.' }

  try {
    const headers = companyHeaders(code)
    const [companyRows, licenseRows, userRows] = await Promise.all([
      supabaseRequest('/companies?select=*', { headers }),
      supabaseRequest('/company_licenses?select=*', { headers }),
      supabaseRequest('/company_users?select=*', { headers }),
    ])

    const companies = Array.isArray(companyRows) ? companyRows.map(unwrapRow).map(normalizeCompanyForStorage) : []
    const company = companies.find((item) => companyCodeOf(item) === code) || null
    const licenses = Array.isArray(licenseRows)
      ? licenseRows.map(unwrapRow).map((license) => normalizeLicenseForStorage(license, company))
      : []
    const users = Array.isArray(userRows)
      ? userRows.map(unwrapRow).map((user) => normalizeUserForStorage(user, company))
      : []
    const license = company
      ? licenses.find((item) => item.companyId === company.id || companyCodeOf(item) === code) || null
      : null
    const adminUser = company
      ? users.find((user) => (
        (user.companyId === company.id || companyCodeOf(user) === code)
        && user.active
        && (user.isMainAdmin || String(user.role || user.rol || '').toLowerCase().includes('admin'))
      )) || null
      : null

    const licenseCompanyIdOk = Boolean(company && license && license.companyId === company.id && license._supabase?.company_id === company.id)
    const licenseCompanyCodeOk = Boolean(company && license && companyCodeOf(license) === code && license._supabase?.company_code === code)
    const relatedUsers = company ? users.filter((user) => companyCodeOf(user) === code || user.companyId === company.id) : []
    const userCompanyIdOk = Boolean(company && relatedUsers.length > 0 && relatedUsers.every((user) => user.companyId === company.id && user._supabase?.company_id === company.id))
    const userCompanyCodeOk = Boolean(company && relatedUsers.length > 0 && relatedUsers.every((user) => companyCodeOf(user) === code && user._supabase?.company_code === code))
    const licenseActive = Boolean(license && ['activa', 'activo', 'active', 'demo'].includes(String(license.estado || '').toLowerCase()))
    const loginShouldWork = Boolean(company && adminUser && licenseActive && licenseCompanyIdOk && licenseCompanyCodeOk)

    return {
      ok: true,
      companyCode: code,
      exists: Boolean(company),
      companyId: company?.id || '',
      detectedCompanyCode: company ? companyCodeOf(company) : '',
      adminActive: Boolean(adminUser),
      licenseActive,
      licenseCompanyIdOk,
      licenseCompanyCodeOk,
      userCompanyIdOk,
      userCompanyCodeOk,
      loginShouldWork,
      problem: !company
        ? 'La empresa no existe en companies.'
        : !adminUser
          ? 'No hay usuario administrador activo para esta empresa.'
          : !license
            ? 'No hay licencia para esta empresa.'
            : !licenseActive
              ? 'La licencia no esta activa.'
              : !licenseCompanyIdOk || !licenseCompanyCodeOk
                ? 'La licencia tiene identificadores mezclados.'
                : !userCompanyIdOk || !userCompanyCodeOk
                  ? 'Los usuarios tienen identificadores mezclados.'
                  : '',
    }
  } catch (error) {
    return { ok: false, message: error.message }
  }
}

export async function repairCompanyIdentifiers(companyCode) {
  const code = cleanCode(companyCode)
  if (!code) return { ok: false, message: 'Escribe un codigo de empresa.' }
  if (!isSupabaseConfigured()) return { ok: false, message: 'Supabase no configurado.' }

  try {
    const headers = adminHeaders()
    const [companyRows, licenseRows, userRows] = await Promise.all([
      supabaseRequest('/companies?select=*', { headers }),
      supabaseRequest('/company_licenses?select=*', { headers }),
      supabaseRequest('/company_users?select=*', { headers }),
    ])
    const companyRow = (Array.isArray(companyRows) ? companyRows : []).find((row) => companyCodeOf(unwrapRow(row)) === code)
    if (!companyRow) return { ok: false, message: 'Empresa no encontrada en Supabase.' }

    const company = normalizeCompanyForStorage(unwrapRow(companyRow))
    const touched = { companies: 0, licenses: 0, users: 0 }

    await supabaseRequest(`/companies?id=eq.${encodeURIComponent(companyRow.id)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(companyPayload({ ...company, companyCode: code })),
    })
    touched.companies += 1

    const relatedLicenses = (Array.isArray(licenseRows) ? licenseRows : []).filter((row) => {
      const license = unwrapRow(row)
      return companyCodeOf(license) === code || license.companyId === company.id || license.company_id === company.id || license.company_id === code
    })
    if (relatedLicenses.length === 0) {
      await supabaseRequest('/company_licenses?on_conflict=id', {
        method: 'POST',
        headers: {
          Prefer: 'resolution=merge-duplicates,return=representation',
          ...headers,
        },
        body: JSON.stringify(licensePayload({
          id: `LIC-${code}`,
          companyId: company.id,
          companyCode: code,
          codigoLicencia: `LIC-${code}-${String(Date.now()).slice(-6)}`,
          planContratado: company.plan || 'Demo',
          estado: 'activa',
          modulosActivos: company.modulosActivos,
          fechaActivacion: company.fechaActivacion || new Date().toISOString().slice(0, 10),
          fechaVencimiento: company.fechaVencimiento || '',
          maxUsuarios: company.maxUsuarios || 5,
          maxSucursales: company.maxSucursales || 1,
          maxAlmacenes: company.maxAlmacenes || 2,
          tipoVersion: company.tipoVersion || 'Cloud',
        })),
      })
      touched.licenses += 1
    }
    for (const row of relatedLicenses) {
      const license = normalizeLicenseForStorage(unwrapRow(row), company)
      await supabaseRequest(`/company_licenses?id=eq.${encodeURIComponent(row.id)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(licensePayload({ ...license, companyId: company.id, companyCode: code })),
      })
      touched.licenses += 1
    }

    const relatedUsers = (Array.isArray(userRows) ? userRows : []).filter((row) => {
      const user = unwrapRow(row)
      return companyCodeOf(user) === code || user.companyId === company.id || user.company_id === company.id || user.company_id === code
    })
    for (const row of relatedUsers) {
      const user = normalizeUserForStorage(unwrapRow(row), company)
      const oldCompanyId = row.company_id || code
      await supabaseRequest(`/company_users?id=eq.${encodeURIComponent(row.id)}&company_id=eq.${encodeURIComponent(oldCompanyId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(userPayload({ ...user, companyId: company.id, companyCode: code }, company)),
      })
      touched.users += 1
    }

    await loadSystemDataFromSupabase()
    return { ok: true, message: 'Empresa reparada correctamente.', touched }
  } catch (error) {
    return { ok: false, message: error.message }
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
