import { createCollectionClient } from './dataClient.js'
import { isSupabaseConfigured, supabaseRequest } from '../lib/supabaseClient.js'
import {
  COMPANY_LICENSE_MODULES,
  createCompany as createLocalCompany,
  loadCompanies,
} from './companyStorage.js'

const client = createCollectionClient({
  table: 'companies',
  storageKey: 'invefat_companies',
  idField: 'id',
  fallback: [],
  companyScoped: false,
})

export const companiesService = {
  getAll: () => client.getAll(),
  getById: (id) => client.getById(id),
  create: (record) => client.create(record),
  update: (id, patch) => client.update(id, patch),
  remove: (id) => client.remove(id),
  deactivate: (id) => client.update(id, { estado: 'suspendida', updatedAt: new Date().toISOString() }),
  replaceAll: (records) => client.replaceAll(records),
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

function normalizeModules(modules) {
  if (!Array.isArray(modules) || modules.length === 0) return COMPANY_LICENSE_MODULES
  return Array.from(new Set(['dashboard', ...modules.filter((moduleId) => COMPANY_LICENSE_MODULES.includes(moduleId))]))
}

function unwrapCompany(row) {
  if (!row) return null
  const data = row.data || {}
  const code = cleanCode(row.company_code || data.companyCode || data.company_code)
  const id = String(row.id || row.company_id || data.companyId || data.company_id || `COMP-${code}`)
  return {
    ...data,
    ...row,
    id,
    companyId: id,
    company_id: id,
    companyCode: code,
    company_code: code,
    nombreComercial: row.nombre_comercial || data.nombreComercial || data.nombre_comercial || '',
    razonSocial: row.razon_social || data.razonSocial || data.razon_social || row.nombre_comercial || '',
    modulosActivos: normalizeModules(row.modulos_activos || data.modulosActivos || data.modulos_activos),
    firstLoginPending: row.first_login_pending ?? data.firstLoginPending ?? data.first_login_pending ?? true,
    onboardingCompleted: row.onboarding_completed ?? data.onboardingCompleted ?? data.onboarding_completed ?? false,
  }
}

function companyPayload(data) {
  const source = data || {}
  const { admin: _admin, ...companyData } = source
  const code = cleanCode(companyData.companyCode || companyData.company_code)
  const id = String(companyData.id || `COMP-${code}`)
  const createdAt = companyData.createdAt || nowIso()
  const company = {
    ...companyData,
    id,
    companyId: id,
    company_id: id,
    companyCode: code,
    company_code: code,
    nombreComercial: String(companyData.nombreComercial || companyData.nombre_comercial || '').trim(),
    razonSocial: String(companyData.razonSocial || companyData.razon_social || companyData.nombreComercial || '').trim(),
    estado: companyData.estado || 'activa',
    plan: companyData.plan || 'Demo',
    modulosActivos: normalizeModules(companyData.modulosActivos || companyData.modulos_activos),
    firstLoginPending: companyData.firstLoginPending !== false,
    onboardingCompleted: Boolean(companyData.onboardingCompleted),
    createdAt,
    updatedAt: nowIso(),
  }

  return {
    id,
    company_id: id,
    company_code: code,
    nombre_comercial: company.nombreComercial,
    razon_social: company.razonSocial,
    rnc: company.rnc || '',
    telefono: company.telefono || '',
    correo: company.correo || '',
    direccion: company.direccion || '',
    estado: company.estado,
    plan: company.plan,
    first_login_pending: company.firstLoginPending,
    onboarding_completed: company.onboardingCompleted,
    data: company,
    created_at: createdAt,
    updated_at: nowIso(),
  }
}

export async function getCompanyByCode(companyCode) {
  const code = cleanCode(companyCode)
  if (!code) return null

  if (!isSupabaseConfigured()) {
    return loadCompanies().find((company) => cleanCode(company.companyCode) === code) || null
  }

  const rows = await supabaseRequest(`/companies?select=*&company_code=eq.${encodeURIComponent(code)}&limit=1`, {
    headers: adminHeaders(),
  })
  return Array.isArray(rows) && rows[0] ? unwrapCompany(rows[0]) : null
}

export async function createCompany(data) {
  const code = cleanCode(data?.companyCode || data?.company_code)
  if (!code) throw new Error('Codigo de empresa requerido.')

  if (!isSupabaseConfigured()) {
    return createLocalCompany(data)
  }

  const existing = await getCompanyByCode(code)
  if (existing) throw new Error('Ya existe una empresa con ese codigo.')

  const rows = await supabaseRequest('/companies?on_conflict=id', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
      ...adminHeaders(),
    },
    body: JSON.stringify(companyPayload(data)),
  })

  const saved = Array.isArray(rows) && rows[0] ? unwrapCompany(rows[0]) : null
  if (!saved) throw new Error('Supabase no devolvio la empresa creada.')
  return saved
}
