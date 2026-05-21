import { isSupabaseConfigured, supabaseRequest } from '../lib/supabaseClient.js'
import {
  COMPANY_LICENSE_MODULES,
  findCompanyByCode,
  getCompanyAccessStatus,
  isCompanyActive,
  loadCompanies,
  loadCompanyLicenses,
  loadCompanyUsers,
  saveCompanies,
  saveCompanyLicenses,
  saveCompanyUsers,
} from './companyStorage.js'

export const AUTH_VERSION = 3
export const SYSTEM_COMPANY_CODE = 'SYSTEM'

const SUPER_ADMIN = {
  username: 'superadmin',
  password: 'admin123',
  fullName: 'Super Admin',
  role: 'Super Admin',
}

function cleanCode(value) {
  return String(value || '').trim().toUpperCase()
}

function cleanText(value) {
  return String(value || '').trim()
}

function lower(value) {
  return cleanText(value).toLowerCase()
}

function nowIso() {
  return new Date().toISOString()
}

function companyHeaders(companyCode) {
  const code = cleanCode(companyCode)
  return {
    'x-company-id': code,
    'x-company-code': code,
  }
}

function parseJsonMaybe(value, fallback = null) {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'string') return fallback

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function normalizeModules(value) {
  const parsed = parseJsonMaybe(value, value)
  const list = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'string'
      ? parsed.split(',').map((item) => item.trim())
      : []

  const cleaned = list.filter((moduleId) => COMPANY_LICENSE_MODULES.includes(moduleId))
  return Array.from(new Set(['dashboard', ...cleaned]))
}

function unwrapRow(row) {
  if (!row || typeof row !== 'object') return {}
  const data = row.data && typeof row.data === 'object' ? row.data : {}

  return {
    ...data,
    ...row,
    data,
    _raw: row,
  }
}

function companyCodeOf(record) {
  return cleanCode(
    record?.company_code
    || record?.companyCode
    || record?.codigoEmpresa
    || record?.data?.company_code
    || record?.data?.companyCode
  )
}

function companyIdOf(record) {
  return cleanText(
    record?.company_id
    || record?.companyId
    || record?.data?.company_id
    || record?.data?.companyId
    || record?.id
  )
}

function normalizeCompany(row) {
  const record = unwrapRow(row)
  const code = companyCodeOf(record)
  const id = companyIdOf(record) || (code ? `COMP-${code}` : cleanText(record.id))

  return {
    ...record.data,
    ...record,
    id,
    companyId: id,
    company_id: id,
    companyCode: code,
    company_code: code,
    nombreComercial: record.nombreComercial || record.nombre_comercial || record.name || record.nombre || '',
    razonSocial: record.razonSocial || record.razon_social || record.nombreComercial || record.nombre_comercial || '',
    estado: record.estado || record.status || 'activa',
    plan: record.plan || record.plan_contratado || record.planContratado || 'Demo',
    modulosActivos: normalizeModules(record.modulosActivos || record.modulos_activos),
    firstLoginPending: Boolean(record.firstLoginPending || record.first_login_pending),
    onboardingCompleted: Boolean(record.onboardingCompleted || record.onboarding_completed),
  }
}

function normalizeLicense(row, company) {
  const record = unwrapRow(row)
  const code = companyCodeOf(record) || company?.companyCode || ''
  const companyId = companyIdOf(record) || company?.id || ''

  return {
    ...record.data,
    ...record,
    id: cleanText(record.id || record.codigoLicencia || record.codigo_licencia || `LIC-${code}`),
    companyId,
    company_id: companyId,
    companyCode: code,
    company_code: code,
    estado: record.estado || record.status || 'activa',
    planContratado: record.planContratado || record.plan_contratado || company?.plan || 'Demo',
    fechaVencimiento: record.fechaVencimiento || record.fecha_vencimiento || '',
    modulosActivos: normalizeModules(record.modulosActivos || record.modulos_activos || company?.modulosActivos),
  }
}

function normalizeUser(row, company) {
  const record = unwrapRow(row)
  const code = companyCodeOf(record) || company?.companyCode || ''
  const companyId = companyIdOf(record) || company?.id || ''
  const username = cleanText(record.username || record.usuario || record.user || record.email)
  const estado = record.estado || record.status || (record.active === false ? 'inactivo' : 'activo')
  const active = record.active !== false && !['inactivo', 'inactiva', 'suspendido', 'suspendida'].includes(lower(estado))

  return {
    ...record.data,
    ...record,
    id: cleanText(record.id || username),
    companyId,
    company_id: companyId,
    companyCode: code,
    company_code: code,
    username,
    usuario: username,
    password: cleanText(record.password || record.contrasena || record['contrase\u00f1a'] || record.password_hash || ''),
    fullName: record.fullName || record.nombre || record.name || username,
    nombre: record.nombre || record.fullName || record.name || username,
    role: record.role || record.rol || 'Usuario',
    rol: record.rol || record.role || 'Usuario',
    active,
    estado,
    isMainAdmin: Boolean(record.isMainAdmin || record.is_main_admin || lower(record.role || record.rol).includes('admin')),
    mustChangePassword: Boolean(record.mustChangePassword || record.must_change_password),
    email: record.email || record.correo || '',
    phone: record.phone || record.telefono || '',
  }
}

function isActiveStatus(value) {
  return ['activa', 'activo', 'active', 'demo'].includes(lower(value))
}

function isBlockedLicenseStatus(value) {
  return ['vencida', 'vencido', 'suspendida', 'suspendido', 'inactiva', 'inactivo'].includes(lower(value))
}

function isExpired(dateValue) {
  const value = cleanText(dateValue)
  if (!value) return false
  const expiresAt = new Date(`${value.slice(0, 10)}T23:59:59`)
  return Number.isFinite(expiresAt.getTime()) && expiresAt < new Date()
}

function upsertById(list, record) {
  const id = cleanText(record?.id)
  const code = companyCodeOf(record)
  const current = Array.isArray(list) ? list : []
  const exists = current.some((item) => cleanText(item.id) === id || (code && companyCodeOf(item) === code))
  return exists
    ? current.map((item) => (cleanText(item.id) === id || (code && companyCodeOf(item) === code) ? record : item))
    : [record, ...current]
}

function persistLoginBundle(company, license, users) {
  if (!company) return
  saveCompanies(upsertById(loadCompanies(), company))
  if (license) saveCompanyLicenses(upsertById(loadCompanyLicenses(), license))
  saveCompanyUsers(company, Array.isArray(users) ? users : [])
}

function buildSuperAdminSession() {
  return {
    authVersion: AUTH_VERSION,
    isSuperAdmin: true,
    username: SUPER_ADMIN.username,
    fullName: SUPER_ADMIN.fullName,
    role: SUPER_ADMIN.role,
    currentRole: SUPER_ADMIN.role,
    currentUser: SUPER_ADMIN.username,
    currentCompanyId: 'SYSTEM',
    currentCompanyCode: SYSTEM_COMPANY_CODE,
    currentCompanyName: 'Panel del Sistema',
    loginAt: nowIso(),
  }
}

function buildCompanySession(company, user, license) {
  const activeModules = normalizeModules(license?.modulosActivos || company?.modulosActivos)

  return {
    authVersion: AUTH_VERSION,
    isSuperAdmin: false,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    currentRole: user.role,
    currentUser: user.username,
    currentCompanyId: company.id,
    currentCompanyCode: company.companyCode,
    currentCompanyName: company.nombreComercial,
    currentLicense: license || null,
    activeModules,
    isMainAdmin: Boolean(user.isMainAdmin || lower(user.role).includes('administrador') || lower(user.role).includes('admin')),
    mustChangePassword: Boolean(user.mustChangePassword),
    firstLoginPending: Boolean(company.firstLoginPending),
    onboardingCompleted: Boolean(company.onboardingCompleted),
    loginAt: nowIso(),
  }
}

function supabaseErrorMessage(error) {
  const detail = cleanText(error?.detail || error?.message)
  if (error?.status === 401 || error?.status === 403) {
    return 'Error de permisos o politicas RLS en Supabase.'
  }
  if (error?.status === 404 || /relation .* does not exist|schema cache|not found/i.test(detail)) {
    return 'Supabase conectado, pero falta ejecutar o actualizar el SQL de tablas.'
  }
  return 'No se pudo conectar con Supabase. Revise conexion o configuracion.'
}

async function loginWithSupabase(companyCode, username, password) {
  const headers = companyHeaders(companyCode)
  let companyRows = []
  let userRows = []
  let licenseRows = []

  try {
    ;[companyRows, userRows, licenseRows] = await Promise.all([
      supabaseRequest('/companies?select=*', { headers }),
      supabaseRequest('/company_users?select=*', { headers }),
      supabaseRequest('/company_licenses?select=*', { headers }),
    ])
  } catch (error) {
    return { ok: false, message: supabaseErrorMessage(error), error: error?.message || String(error) }
  }

  const companies = (Array.isArray(companyRows) ? companyRows : []).map(normalizeCompany)
  const company = companies.find((item) => companyCodeOf(item) === companyCode) || null
  if (!company) return { ok: false, message: 'Empresa no existe.' }
  if (!isActiveStatus(company.estado)) return { ok: false, message: 'Empresa inactiva.' }

  const licenses = (Array.isArray(licenseRows) ? licenseRows : [])
    .map((row) => normalizeLicense(row, company))
    .filter((license) => (
      companyCodeOf(license) === company.companyCode
      || cleanText(license.companyId) === cleanText(company.id)
    ))
  const license = licenses.find((item) => isActiveStatus(item.estado)) || licenses[0] || null
  if (!license) return { ok: false, message: 'Licencia no encontrada.' }
  if (isBlockedLicenseStatus(license.estado) || isExpired(license.fechaVencimiento)) {
    return { ok: false, message: 'Licencia vencida o suspendida.' }
  }

  const users = (Array.isArray(userRows) ? userRows : [])
    .map((row) => normalizeUser(row, company))
    .filter((user) => (
      companyCodeOf(user) === company.companyCode
      || cleanText(user.companyId) === cleanText(company.id)
    ))
  const user = users.find((item) => lower(item.username) === lower(username)) || null
  if (!user) return { ok: false, message: 'Usuario no encontrado.' }
  if (!user.active) return { ok: false, message: 'Usuario inactivo.' }
  if (cleanText(user.password) !== cleanText(password)) return { ok: false, message: 'Contrasena incorrecta.' }

  const normalizedLicense = {
    ...license,
    companyId: company.id,
    company_id: company.id,
    companyCode: company.companyCode,
    company_code: company.companyCode,
    modulosActivos: normalizeModules(license.modulosActivos),
  }
  const normalizedUsers = users.map((item) => ({
    ...item,
    companyId: company.id,
    company_id: company.id,
    companyCode: company.companyCode,
    company_code: company.companyCode,
  }))

  persistLoginBundle(company, normalizedLicense, normalizedUsers)

  return {
    ok: true,
    source: 'Supabase',
    company,
    license: normalizedLicense,
    users: normalizedUsers,
    user,
    session: buildCompanySession(company, user, normalizedLicense),
  }
}

function loginWithLocalStorage(companyCode, username, password) {
  const company = findCompanyByCode(companyCode)
  if (!company) return { ok: false, message: 'Empresa no existe.' }
  if (!isCompanyActive(company)) return { ok: false, message: 'Empresa inactiva.' }

  const accessStatus = getCompanyAccessStatus(company)
  if (!accessStatus.allowed) return { ok: false, message: accessStatus.message }

  const users = loadCompanyUsers(company)
  const user = users.find((item) => lower(item.username) === lower(username)) || null
  if (!user) return { ok: false, message: 'Usuario no encontrado.' }
  if (!user.active) return { ok: false, message: 'Usuario inactivo.' }
  if (cleanText(user.password) !== cleanText(password)) return { ok: false, message: 'Contrasena incorrecta.' }

  return {
    ok: true,
    source: 'localStorage',
    company,
    license: accessStatus.license,
    users,
    user,
    session: buildCompanySession(company, user, accessStatus.license),
  }
}

export async function loginCompanyUser(companyCodeOrPayload, usernameArg = '', passwordArg = '') {
  const payload = typeof companyCodeOrPayload === 'object' && companyCodeOrPayload !== null
    ? companyCodeOrPayload
    : { companyCode: companyCodeOrPayload, username: usernameArg, password: passwordArg }
  const { companyCode, username, password } = payload
  const cleanCompanyCode = cleanCode(companyCode)
  const cleanUsername = cleanText(username)
  const cleanPassword = cleanText(password)

  if (!cleanCompanyCode) return { ok: false, message: 'Debe indicar el codigo de empresa.' }
  if (!cleanUsername) return { ok: false, message: 'Debe indicar el usuario.' }
  if (!cleanPassword) return { ok: false, message: 'Debe indicar la contrasena.' }

  if (cleanCompanyCode === SYSTEM_COMPANY_CODE) {
    if (lower(cleanUsername) !== SUPER_ADMIN.username || cleanPassword !== SUPER_ADMIN.password) {
      return { ok: false, message: 'Credenciales de Super Admin incorrectas.' }
    }

    return {
      ok: true,
      source: 'SYSTEM',
      users: [],
      session: buildSuperAdminSession(),
    }
  }

  if (isSupabaseConfigured()) {
    return loginWithSupabase(cleanCompanyCode, cleanUsername, cleanPassword)
  }

  return loginWithLocalStorage(cleanCompanyCode, cleanUsername, cleanPassword)
}
