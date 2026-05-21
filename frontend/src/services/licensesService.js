import { createCollectionClient } from './dataClient.js'
import { isSupabaseConfigured, supabaseRequest } from '../lib/supabaseClient.js'
import {
  COMPANY_LICENSE_MODULES,
  getCompanyLicense,
  upsertCompanyLicense,
} from './companyStorage.js'

const client = createCollectionClient({
  table: 'company_licenses',
  storageKey: 'invefat_company_licenses',
  idField: 'id',
  fallback: [],
  companyScoped: false,
})

export const licensesService = {
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

function companyHeaders(companyCode) {
  const code = cleanCode(companyCode)
  return {
    'x-company-id': code,
    'x-company-code': code,
  }
}

function normalizeModules(modules) {
  if (!Array.isArray(modules) || modules.length === 0) return COMPANY_LICENSE_MODULES
  return Array.from(new Set(['dashboard', ...modules.filter((moduleId) => COMPANY_LICENSE_MODULES.includes(moduleId))]))
}

function unwrapLicense(row, company = null) {
  if (!row) return null
  const data = row.data || {}
  const code = cleanCode(row.company_code || data.companyCode || data.company_code || company?.companyCode)
  const companyId = String(row.company_id || data.companyId || data.company_id || company?.id || '')
  return {
    ...data,
    ...row,
    id: row.id || data.id || `LIC-${code}`,
    companyId,
    company_id: companyId,
    companyCode: code,
    company_code: code,
    codigoLicencia: row.codigo_licencia || data.codigoLicencia || data.codigo_licencia || row.id || `LIC-${code}`,
    planContratado: row.plan_contratado || data.planContratado || data.plan_contratado || company?.plan || 'Demo',
    estado: row.estado || data.estado || 'activa',
    modulosActivos: normalizeModules(row.modulos_activos || data.modulosActivos || data.modulos_activos || company?.modulosActivos),
    fechaActivacion: row.fecha_activacion || data.fechaActivacion || data.fecha_activacion || '',
    fechaVencimiento: row.fecha_vencimiento || data.fechaVencimiento || data.fecha_vencimiento || '',
    maxUsuarios: Number(row.max_usuarios || data.maxUsuarios || data.max_usuarios || company?.maxUsuarios || 0),
    maxSucursales: Number(row.max_sucursales || data.maxSucursales || data.max_sucursales || company?.maxSucursales || 0),
    maxAlmacenes: Number(row.max_almacenes || data.maxAlmacenes || data.max_almacenes || company?.maxAlmacenes || 0),
    tipoVersion: row.tipo_version || data.tipoVersion || data.tipo_version || 'Cloud',
    observacion: row.observacion || data.observacion || '',
  }
}

function licensePayload(company, licenseData = {}) {
  const code = cleanCode(company.companyCode || company.company_code)
  const companyId = String(company.id || company.companyId || company.company_id || '')
  const createdAt = licenseData.createdAt || nowIso()
  const license = {
    ...licenseData,
    id: licenseData.id || `LIC-${code}`,
    companyId,
    company_id: companyId,
    companyCode: code,
    company_code: code,
    codigoLicencia: licenseData.codigoLicencia || licenseData.codigo_licencia || `LIC-${code}-${String(Date.now()).slice(-6)}`,
    planContratado: licenseData.planContratado || licenseData.plan_contratado || company.plan || 'Demo',
    estado: licenseData.estado || 'activa',
    modulosActivos: normalizeModules(licenseData.modulosActivos || licenseData.modulos_activos || company.modulosActivos),
    fechaActivacion: licenseData.fechaActivacion || licenseData.fecha_activacion || company.fechaActivacion || new Date().toISOString().slice(0, 10),
    fechaVencimiento: licenseData.fechaVencimiento || licenseData.fecha_vencimiento || company.fechaVencimiento || '',
    maxUsuarios: Number(licenseData.maxUsuarios || licenseData.max_usuarios || company.maxUsuarios || 5),
    maxSucursales: Number(licenseData.maxSucursales || licenseData.max_sucursales || company.maxSucursales || 1),
    maxAlmacenes: Number(licenseData.maxAlmacenes || licenseData.max_almacenes || company.maxAlmacenes || 2),
    tipoVersion: licenseData.tipoVersion || licenseData.tipo_version || company.tipoVersion || 'Cloud',
    observacion: licenseData.observacion || '',
    createdAt,
    updatedAt: nowIso(),
  }

  return {
    id: license.id,
    company_id: companyId,
    company_code: code,
    codigo_licencia: license.codigoLicencia,
    plan_contratado: license.planContratado,
    estado: license.estado,
    modulos_activos: license.modulosActivos,
    fecha_activacion: license.fechaActivacion,
    fecha_vencimiento: license.fechaVencimiento || null,
    max_usuarios: license.maxUsuarios,
    max_sucursales: license.maxSucursales,
    max_almacenes: license.maxAlmacenes,
    tipo_version: license.tipoVersion,
    observacion: license.observacion,
    data: license,
    created_at: createdAt,
    updated_at: nowIso(),
  }
}

export async function getActiveLicense(companyCode) {
  const code = cleanCode(companyCode)
  if (!code) return null

  if (!isSupabaseConfigured()) {
    return null
  }

  const rows = await supabaseRequest(`/company_licenses?select=*&company_code=eq.${encodeURIComponent(code)}&estado=eq.activa&limit=1`, {
    headers: companyHeaders(code),
  })
  return Array.isArray(rows) && rows[0] ? unwrapLicense(rows[0]) : null
}

export async function createCompanyLicense(company, licenseData = {}) {
  if (!company) throw new Error('Empresa requerida para crear licencia.')

  if (!isSupabaseConfigured()) {
    return upsertCompanyLicense(company, licenseData || getCompanyLicense(company))
  }

  const rows = await supabaseRequest('/company_licenses?on_conflict=id', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
      ...adminHeaders(),
    },
    body: JSON.stringify(licensePayload(company, licenseData)),
  })
  const saved = Array.isArray(rows) && rows[0] ? unwrapLicense(rows[0], company) : null
  if (!saved) throw new Error('Supabase no devolvio la licencia creada.')

  const confirmed = await getActiveLicense(company.companyCode || company.company_code)
  if (!confirmed) {
    throw new Error('No se pudo confirmar la licencia activa en company_licenses despues de guardar.')
  }

  return confirmed
}
