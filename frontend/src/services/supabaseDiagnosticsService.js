import { getSupabaseConfigStatus, isSupabaseConfigured, supabaseRequest } from '../lib/supabaseClient.js'

const TEST_PRODUCT_CODE = 'TEST-SUPABASE-001'
const TEST_COMPANY_A_CODE = 'TEST-COMPANY-A'
const TEST_COMPANY_B_CODE = 'TEST-COMPANY-B'

function nowIso() {
  return new Date().toISOString()
}

function getCompanyByCode(companies = [], code) {
  const cleanCode = String(code || '').trim().toUpperCase()
  return companies.find((company) => String(company.companyCode || '').trim().toUpperCase() === cleanCode) || null
}

function companyHeaders(company) {
  const companyCode = String(company?.companyCode || '').trim().toUpperCase()
  return {
    'x-company-id': companyCode,
    'x-company-code': companyCode,
  }
}

function adminHeaders() {
  return { 'x-user-role': 'superadmin' }
}

function getSupabaseCompanyId(company) {
  return String(company?.companyCode || '').trim().toUpperCase()
}

function buildTestProduct(company, code = TEST_PRODUCT_CODE, name = 'Producto prueba Supabase') {
  const companyId = getSupabaseCompanyId(company)
  return {
    id: code,
    company_id: companyId,
    data: {
      id: code,
      code,
      name,
      nombre: name,
      status: 'active',
      active: true,
      company_id: companyId,
      companyId,
      companyCode: company.companyCode,
      source: 'super-admin-diagnostic',
      updatedAt: nowIso(),
    },
    updated_at: nowIso(),
  }
}

function ok(message, extra = {}) {
  return {
    ok: true,
    checkedAt: nowIso(),
    message,
    ...extra,
  }
}

function fail(message, extra = {}) {
  return {
    ok: false,
    checkedAt: nowIso(),
    message,
    ...extra,
  }
}

function classifySupabaseError(error) {
  const detail = String(error?.detail || error?.message || '')
  const lower = detail.toLowerCase()

  if (
    error?.status === 404
    || lower.includes('does not exist')
    || lower.includes('could not find the table')
    || lower.includes('pgrst205')
    || lower.includes('42p01')
  ) {
    return 'Supabase conectado, pero falta ejecutar el SQL de tablas.'
  }

  if (
    error?.status === 401
    || error?.status === 403
    || lower.includes('row-level security')
    || lower.includes('rls')
    || lower.includes('permission denied')
    || lower.includes('42501')
    || lower.includes('policy')
  ) {
    return 'Error de permisos o politicas RLS en Supabase.'
  }

  return `No se pudo conectar con Supabase: ${error.message}`
}

export function getSupabaseDiagnosticStatus() {
  const config = getSupabaseConfigStatus()
  return {
    ...config,
    mode: config.configured ? 'Supabase' : 'localStorage',
  }
}

export async function testSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    return ok('Supabase no configurado. Revise .env.local y reinicie npm run dev.', {
      configured: false,
      mode: 'localStorage',
    })
  }

  try {
    await supabaseRequest('/companies?select=id&limit=1')
    return ok('Conexion correcta con Supabase.', {
      configured: true,
      mode: 'Supabase',
    })
  } catch (error) {
    return fail(classifySupabaseError(error), {
      configured: true,
      mode: 'localStorage fallback',
      error: error.message,
    })
  }
}

export async function getSupabaseDataFootprint() {
  if (!isSupabaseConfigured()) {
    return ok('Supabase no configurado.', {
      configured: false,
      mode: 'localStorage',
      companies: 0,
      users: 0,
      licenses: 0,
      clean: true,
    })
  }

  try {
    const [companies, users, licenses] = await Promise.all([
      supabaseRequest('/companies?select=id', { headers: adminHeaders() }),
      supabaseRequest('/company_users?select=id', { headers: adminHeaders() }),
      supabaseRequest('/company_licenses?select=id', { headers: adminHeaders() }),
    ])
    const companyCount = Array.isArray(companies) ? companies.length : 0
    const userCount = Array.isArray(users) ? users.length : 0
    const licenseCount = Array.isArray(licenses) ? licenses.length : 0
    const clean = companyCount === 0 && userCount === 0 && licenseCount === 0

    return ok(clean ? 'Supabase sin empresas, usuarios ni licencias.' : 'Supabase contiene datos administrativos.', {
      configured: true,
      mode: 'Supabase',
      companies: companyCount,
      users: userCount,
      licenses: licenseCount,
      clean,
    })
  } catch (error) {
    return fail(classifySupabaseError(error), {
      configured: true,
      mode: 'Supabase',
      companies: null,
      users: null,
      licenses: null,
      clean: false,
      error: error.message,
    })
  }
}

export async function writeSupabaseEmp001Test(companies = []) {
  if (!isSupabaseConfigured()) {
    return ok('Supabase no configurado. Prueba omitida; localStorage sigue activo.', {
      configured: false,
      mode: 'localStorage',
    })
  }

  const company = companies[0] || null
  if (!company) return fail('No hay empresas creadas para ejecutar la prueba.')

  try {
    const rows = await supabaseRequest('/products?on_conflict=company_id,id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
        ...companyHeaders(company),
      },
      body: JSON.stringify(buildTestProduct(company)),
    })

    return ok('Escritura correcta en Supabase.', {
      configured: true,
      mode: 'Supabase',
      companyCode: company.companyCode,
      companyId: getSupabaseCompanyId(company),
      records: Array.isArray(rows) ? rows.length : 0,
    })
  } catch (error) {
    return fail(classifySupabaseError(error), {
      configured: true,
      mode: 'localStorage fallback',
      error: error.message,
    })
  }
}

export async function readSupabaseEmp001Test(companies = []) {
  if (!isSupabaseConfigured()) {
    return ok('Supabase no configurado. Lectura omitida; localStorage sigue activo.', {
      configured: false,
      mode: 'localStorage',
    })
  }

  const company = companies[0] || null
  if (!company) return fail('No hay empresas creadas para ejecutar la lectura.')

  try {
    const rows = await supabaseRequest(`/products?select=id,company_id,data&id=eq.${encodeURIComponent(TEST_PRODUCT_CODE)}&company_id=eq.${encodeURIComponent(getSupabaseCompanyId(company))}`, {
      headers: companyHeaders(company),
    })

    return ok(rows?.length ? 'Lectura correcta desde Supabase.' : 'No se encontro el producto prueba.', {
      configured: true,
      mode: 'Supabase',
      companyCode: company.companyCode,
      companyId: getSupabaseCompanyId(company),
      records: Array.isArray(rows) ? rows.length : 0,
    })
  } catch (error) {
    return fail(classifySupabaseError(error), {
      configured: true,
      mode: 'localStorage fallback',
      error: error.message,
    })
  }
}

export async function testSupabaseIsolation(companies = []) {
  if (!isSupabaseConfigured()) {
    return ok('Supabase no configurado. Aislamiento localStorage permanece activo.', {
      configured: false,
      mode: 'localStorage',
    })
  }

  const emp001 = companies[0] || null
  const emp002 = companies.find((company) => getSupabaseCompanyId(company) !== getSupabaseCompanyId(emp001)) || null
  if (!emp001 || !emp002) return fail('Se necesitan dos empresas creadas para probar aislamiento.')

  try {
    await supabaseRequest('/products?on_conflict=company_id,id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=minimal',
        ...companyHeaders(emp001),
      },
      body: JSON.stringify(buildTestProduct(emp001, TEST_COMPANY_A_CODE, `Producto prueba aislamiento ${emp001.companyCode}`)),
    })

    await supabaseRequest('/products?on_conflict=company_id,id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=minimal',
        ...companyHeaders(emp002),
      },
      body: JSON.stringify(buildTestProduct(emp002, TEST_COMPANY_B_CODE, `Producto prueba aislamiento ${emp002.companyCode}`)),
    })

    const emp001Own = await supabaseRequest(`/products?select=id,company_id&id=eq.${encodeURIComponent(TEST_COMPANY_A_CODE)}&company_id=eq.${encodeURIComponent(getSupabaseCompanyId(emp001))}`, {
      headers: companyHeaders(emp001),
    })
    const emp001TryingEmp002 = await supabaseRequest(`/products?select=id,company_id&company_id=eq.${encodeURIComponent(getSupabaseCompanyId(emp002))}`, {
      headers: companyHeaders(emp001),
    })
    const emp002TryingEmp001 = await supabaseRequest(`/products?select=id,company_id&company_id=eq.${encodeURIComponent(getSupabaseCompanyId(emp001))}`, {
      headers: companyHeaders(emp002),
    })

    const isolated = Array.isArray(emp001Own)
      && emp001Own.length >= 1
      && Array.isArray(emp001TryingEmp002)
      && emp001TryingEmp002.length === 0
      && Array.isArray(emp002TryingEmp001)
      && emp002TryingEmp001.length === 0

    return (isolated ? ok : fail)(isolated
      ? 'Aislamiento correcto.'
      : 'Advertencia: la prueba detecto posible lectura cruzada entre empresas.', {
      configured: true,
      mode: 'Supabase',
      emp001Own: Array.isArray(emp001Own) ? emp001Own.length : 0,
      emp001SeesEmp002: Array.isArray(emp001TryingEmp002) ? emp001TryingEmp002.length : 0,
      emp002SeesEmp001: Array.isArray(emp002TryingEmp001) ? emp002TryingEmp001.length : 0,
    })
  } catch (error) {
    return fail(classifySupabaseError(error), {
      configured: true,
      mode: 'localStorage fallback',
      error: error.message,
    })
  }
}
