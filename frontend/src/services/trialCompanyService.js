import { isSupabaseConfigured, supabaseRequest } from '../lib/supabaseClient.js'
import {
  loadCompanies,
  loadCompanyLicenses,
  loadCompanyUsers,
  saveCompanies,
  saveCompanyLicenses,
  saveCompanyUsers,
} from './companyStorage.js'

export const TRIAL_COMPANY_CODE = 'PRUEBA'
export const TRIAL_COMPANY_ID = 'COMP-PRUEBA'
export const TRIAL_ADMIN_USERNAME = 'admin'
export const TRIAL_ADMIN_PASSWORD = '1234'

export const TRIAL_MODULES = [
  'dashboard',
  'sales',
  'purchases',
  'inventory',
  'warehouse',
  'finance',
  'crm',
  'hr',
  'production',
  'reports',
  'settings',
  'security',
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

function oneYearFromToday() {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString().slice(0, 10)
}

function nowIso() {
  return new Date().toISOString()
}

function cleanCode(value) {
  return String(value || '').trim().toUpperCase()
}

function adminHeaders() {
  return { 'x-user-role': 'superadmin' }
}

function companyHeaders(companyCode = TRIAL_COMPANY_CODE) {
  const code = cleanCode(companyCode)
  return {
    'x-company-id': `COMP-${code}`,
    'x-company-code': code,
    'x-user-role': 'superadmin',
  }
}

function upsertByCode(list, record) {
  const code = cleanCode(record?.companyCode || record?.company_code)
  const current = Array.isArray(list) ? list : []
  const exists = current.some((item) => cleanCode(item.companyCode || item.company_code) === code || item.id === record.id)
  return exists
    ? current.map((item) => (cleanCode(item.companyCode || item.company_code) === code || item.id === record.id ? record : item))
    : [record, ...current]
}

function upsertLicense(list, record) {
  const current = Array.isArray(list) ? list : []
  const exists = current.some((item) => item.id === record.id || cleanCode(item.companyCode || item.company_code) === TRIAL_COMPANY_CODE)
  return exists
    ? current.map((item) => (item.id === record.id || cleanCode(item.companyCode || item.company_code) === TRIAL_COMPANY_CODE ? record : item))
    : [record, ...current]
}

function upsertUser(list, record) {
  const current = Array.isArray(list) ? list : []
  const exists = current.some((item) => String(item.username || item.usuario || '').trim().toLowerCase() === TRIAL_ADMIN_USERNAME)
  return exists
    ? current.map((item) => (String(item.username || item.usuario || '').trim().toLowerCase() === TRIAL_ADMIN_USERNAME ? record : item))
    : [record, ...current]
}

export function buildTrialCompany() {
  return {
    id: TRIAL_COMPANY_ID,
    companyId: TRIAL_COMPANY_ID,
    company_id: TRIAL_COMPANY_ID,
    companyCode: TRIAL_COMPANY_CODE,
    company_code: TRIAL_COMPANY_CODE,
    nombreComercial: 'Empresa de Prueba INVE-FAT',
    nombre_comercial: 'Empresa de Prueba INVE-FAT',
    razonSocial: 'Empresa de Prueba INVE-FAT SRL',
    razon_social: 'Empresa de Prueba INVE-FAT SRL',
    rnc: '000000000',
    telefono: '',
    correo: '',
    direccion: '',
    estado: 'activa',
    plan: 'Desarrollo',
    tipoVersion: 'Cloud',
    modulosActivos: TRIAL_MODULES,
    fechaActivacion: today(),
    fechaVencimiento: oneYearFromToday(),
    maxUsuarios: 999,
    maxSucursales: 999,
    maxAlmacenes: 999,
    firstLoginPending: false,
    onboardingCompleted: true,
    createdBy: 'superadmin',
    updatedAt: nowIso(),
  }
}

export function buildTrialAdmin(company = buildTrialCompany()) {
  return {
    id: TRIAL_ADMIN_USERNAME,
    companyId: company.id,
    company_id: company.id,
    companyCode: TRIAL_COMPANY_CODE,
    company_code: TRIAL_COMPANY_CODE,
    fullName: 'Administrador Principal',
    nombre: 'Administrador Principal',
    username: TRIAL_ADMIN_USERNAME,
    usuario: TRIAL_ADMIN_USERNAME,
    password: TRIAL_ADMIN_PASSWORD,
    password_hash: TRIAL_ADMIN_PASSWORD,
    role: 'administrador',
    rol: 'administrador',
    active: true,
    estado: 'activo',
    isMainAdmin: true,
    mustChangePassword: false,
    email: '',
    phone: '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function buildTrialLicense(company = buildTrialCompany()) {
  return {
    id: 'LIC-PRUEBA',
    companyId: company.id,
    company_id: company.id,
    companyCode: TRIAL_COMPANY_CODE,
    company_code: TRIAL_COMPANY_CODE,
    codigoLicencia: 'LIC-PRUEBA',
    codigo_licencia: 'LIC-PRUEBA',
    planContratado: 'Desarrollo',
    plan_contratado: 'Desarrollo',
    estado: 'activa',
    modulosActivos: TRIAL_MODULES,
    modulos_activos: TRIAL_MODULES,
    fechaActivacion: today(),
    fecha_activacion: today(),
    fechaVencimiento: oneYearFromToday(),
    fecha_vencimiento: oneYearFromToday(),
    maxUsuarios: 999,
    max_usuarios: 999,
    maxSucursales: 999,
    max_sucursales: 999,
    maxAlmacenes: 999,
    max_almacenes: 999,
    tipoVersion: 'Cloud',
    tipo_version: 'Cloud',
    observacion: 'Empresa unica de prueba temporal para estabilizacion.',
    updatedAt: nowIso(),
  }
}

function companyPayload(company) {
  return {
    id: company.id,
    company_id: company.id,
    company_code: company.companyCode,
    nombre_comercial: company.nombreComercial,
    razon_social: company.razonSocial,
    rnc: company.rnc,
    telefono: company.telefono,
    correo: company.correo,
    direccion: company.direccion,
    estado: company.estado,
    plan: company.plan,
    first_login_pending: company.firstLoginPending,
    onboarding_completed: company.onboardingCompleted,
    data: company,
    created_at: company.createdAt || nowIso(),
    updated_at: nowIso(),
  }
}

function adminPayload(admin) {
  return {
    id: admin.id,
    company_id: admin.companyId,
    company_code: admin.companyCode,
    nombre: admin.fullName,
    usuario: admin.username,
    username: admin.username,
    password: admin.password,
    password_hash: admin.password,
    rol: admin.rol,
    role: admin.role,
    estado: admin.estado,
    must_change_password: admin.mustChangePassword,
    correo: admin.email,
    telefono: admin.phone,
    data: admin,
    created_at: admin.createdAt || nowIso(),
    updated_at: nowIso(),
  }
}

function licensePayload(license) {
  return {
    id: license.id,
    company_id: license.companyId,
    company_code: license.companyCode,
    codigo_licencia: license.codigoLicencia,
    plan_contratado: license.planContratado,
    estado: license.estado,
    modulos_activos: TRIAL_MODULES,
    fecha_activacion: license.fechaActivacion,
    fecha_vencimiento: license.fechaVencimiento,
    max_usuarios: license.maxUsuarios,
    max_sucursales: license.maxSucursales,
    max_almacenes: license.maxAlmacenes,
    tipo_version: license.tipoVersion,
    observacion: license.observacion,
    data: license,
    created_at: license.createdAt || nowIso(),
    updated_at: nowIso(),
  }
}

function persistTrialLocal() {
  const company = buildTrialCompany()
  const admin = buildTrialAdmin(company)
  const license = buildTrialLicense(company)
  saveCompanies(upsertByCode(loadCompanies(), company))
  saveCompanyLicenses(upsertLicense(loadCompanyLicenses(), license))
  saveCompanyUsers(company, upsertUser(loadCompanyUsers(company), admin))
  return { company, admin, license }
}

async function upsertTrialSupabase() {
  const company = buildTrialCompany()
  const admin = buildTrialAdmin(company)
  const license = buildTrialLicense(company)

  await supabaseRequest('/companies?on_conflict=id', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
      ...adminHeaders(),
    },
    body: JSON.stringify(companyPayload(company)),
  })

  await supabaseRequest('/company_users?on_conflict=company_id,id', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
      ...adminHeaders(),
    },
    body: JSON.stringify(adminPayload(admin)),
  })

  await supabaseRequest('/company_licenses?on_conflict=id', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
      ...adminHeaders(),
    },
    body: JSON.stringify(licensePayload(license)),
  })

  return { company, admin, license }
}

export async function ensureTrialCompany() {
  const local = persistTrialLocal()
  if (!isSupabaseConfigured()) return { ok: true, source: 'localStorage', ...local }

  try {
    const cloud = await upsertTrialSupabase()
    persistTrialLocal()
    return { ok: true, source: 'Supabase', ...cloud }
  } catch (error) {
    return {
      ok: false,
      source: 'Supabase',
      error: error.message,
      message: `No se pudo asegurar PRUEBA en Supabase. ${error.message}`,
      ...local,
    }
  }
}

export async function diagnoseTrialCompany() {
  const code = TRIAL_COMPANY_CODE
  if (!isSupabaseConfigured()) {
    const company = buildTrialCompany()
    const users = loadCompanyUsers(company)
    const licenses = loadCompanyLicenses()
    const admin = users.find((user) => String(user.username || '').toLowerCase() === TRIAL_ADMIN_USERNAME)
    const license = licenses.find((item) => cleanCode(item.companyCode || item.company_code) === code)
    return {
      ok: Boolean(admin && license),
      source: 'localStorage',
      companyExists: true,
      adminExists: Boolean(admin),
      licenseExists: Boolean(license),
      userActive: Boolean(admin?.active),
      licenseActive: license?.estado === 'activa',
      modulesActive: Array.isArray(license?.modulosActivos) && license.modulosActivos.length === TRIAL_MODULES.length,
      loginShouldWork: Boolean(admin && license),
    }
  }

  try {
    const headers = companyHeaders(code)
    const [companies, users, licenses] = await Promise.all([
      supabaseRequest(`/companies?select=*&company_code=eq.${encodeURIComponent(code)}`, { headers }),
      supabaseRequest(`/company_users?select=*&company_code=eq.${encodeURIComponent(code)}`, { headers }),
      supabaseRequest(`/company_licenses?select=*&company_code=eq.${encodeURIComponent(code)}`, { headers }),
    ])
    const company = Array.isArray(companies) ? companies[0] : null
    const admin = Array.isArray(users)
      ? users.find((user) => String(user.username || user.usuario || user.data?.username || '').toLowerCase() === TRIAL_ADMIN_USERNAME)
      : null
    const license = Array.isArray(licenses) ? licenses.find((item) => item.estado === 'activa') || licenses[0] : null
    const modules = Array.isArray(license?.modulos_activos)
      ? license.modulos_activos
      : Array.isArray(license?.data?.modulosActivos)
        ? license.data.modulosActivos
        : []
    const modulesActive = TRIAL_MODULES.every((moduleId) => modules.includes(moduleId)) && !modules.includes('system')
    const companyIdOk = Boolean(company && admin && license && admin.company_id === company.id && license.company_id === company.id)

    return {
      ok: Boolean(company && admin && license && companyIdOk && modulesActive),
      source: 'Supabase',
      companyExists: Boolean(company),
      adminExists: Boolean(admin),
      licenseExists: Boolean(license),
      userActive: ['activo', 'activa', 'active'].includes(String(admin?.estado || '').toLowerCase()),
      licenseActive: ['activa', 'activo', 'active'].includes(String(license?.estado || '').toLowerCase()),
      modulesActive,
      companyIdOk,
      companyCodeOk: Boolean(company && admin?.company_code === code && license?.company_code === code),
      loginShouldWork: Boolean(company && admin && license && companyIdOk && modulesActive),
    }
  } catch (error) {
    return { ok: false, source: 'Supabase', error: error.message, message: error.message }
  }
}

export function filterVisibleTrialCompanies(companies = []) {
  return (Array.isArray(companies) ? companies : []).filter((company) => cleanCode(company.companyCode || company.company_code) === TRIAL_COMPANY_CODE)
}
