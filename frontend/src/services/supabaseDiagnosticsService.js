import { getSupabaseConfigStatus, isSupabaseConfigured, supabaseRequest } from '../lib/supabaseClient.js'

const TEST_PRODUCT_CODE = 'TEST-SUPABASE-001'

function nowIso() {
  return new Date().toISOString()
}

function getCompanyByCode(companies = [], code) {
  const cleanCode = String(code || '').trim().toUpperCase()
  return companies.find((company) => String(company.companyCode || '').trim().toUpperCase() === cleanCode) || null
}

function companyHeaders(company) {
  return {
    'x-company-id': company?.id || '',
    'x-company-code': company?.companyCode || '',
  }
}

function buildTestProduct(company) {
  return {
    id: TEST_PRODUCT_CODE,
    company_id: company.id,
    data: {
      id: TEST_PRODUCT_CODE,
      code: TEST_PRODUCT_CODE,
      name: 'Producto prueba Supabase',
      nombre: 'Producto prueba Supabase',
      status: 'Activo',
      active: true,
      company_id: company.id,
      companyId: company.id,
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

export function getSupabaseDiagnosticStatus() {
  const config = getSupabaseConfigStatus()
  return {
    ...config,
    mode: config.configured ? 'Supabase' : 'localStorage',
  }
}

export async function testSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    return ok('Supabase no configurado. El sistema esta usando localStorage.', {
      configured: false,
      mode: 'localStorage',
    })
  }

  try {
    await supabaseRequest('/companies?select=id&limit=1')
    return ok('Conexion Supabase correcta.', {
      configured: true,
      mode: 'Supabase',
    })
  } catch (error) {
    return fail(`No se pudo conectar con Supabase: ${error.message}`, {
      configured: true,
      mode: 'localStorage fallback',
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

  const company = getCompanyByCode(companies, 'EMP001')
  if (!company) return fail('No existe EMP001 para ejecutar la prueba.')

  try {
    const rows = await supabaseRequest('/products?on_conflict=company_id,id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
        ...companyHeaders(company),
      },
      body: JSON.stringify(buildTestProduct(company)),
    })

    return ok('Producto prueba Supabase guardado para EMP001.', {
      configured: true,
      mode: 'Supabase',
      companyCode: company.companyCode,
      companyId: company.id,
      records: Array.isArray(rows) ? rows.length : 0,
    })
  } catch (error) {
    return fail(`No se pudo escribir producto prueba EMP001: ${error.message}`, {
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

  const company = getCompanyByCode(companies, 'EMP001')
  if (!company) return fail('No existe EMP001 para ejecutar la lectura.')

  try {
    const rows = await supabaseRequest(`/products?select=id,company_id,data&id=eq.${encodeURIComponent(TEST_PRODUCT_CODE)}&company_id=eq.${encodeURIComponent(company.id)}`, {
      headers: companyHeaders(company),
    })

    return ok(rows?.length ? 'Producto prueba EMP001 leido correctamente.' : 'No se encontro producto prueba EMP001.', {
      configured: true,
      mode: 'Supabase',
      companyCode: company.companyCode,
      companyId: company.id,
      records: Array.isArray(rows) ? rows.length : 0,
    })
  } catch (error) {
    return fail(`No se pudo leer producto prueba EMP001: ${error.message}`, {
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

  const emp001 = getCompanyByCode(companies, 'EMP001')
  const emp002 = getCompanyByCode(companies, 'EMP002')
  if (!emp001 || !emp002) return fail('Se necesitan EMP001 y EMP002 para probar aislamiento.')

  try {
    await supabaseRequest('/products?on_conflict=company_id,id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=minimal',
        ...companyHeaders(emp001),
      },
      body: JSON.stringify(buildTestProduct(emp001)),
    })

    await supabaseRequest('/products?on_conflict=company_id,id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=minimal',
        ...companyHeaders(emp002),
      },
      body: JSON.stringify({
        ...buildTestProduct(emp002),
        data: {
          ...buildTestProduct(emp002).data,
          id: `${TEST_PRODUCT_CODE}-EMP002`,
          code: `${TEST_PRODUCT_CODE}-EMP002`,
          name: 'Producto prueba Supabase EMP002',
          nombre: 'Producto prueba Supabase EMP002',
        },
      }),
    })

    const emp001Own = await supabaseRequest(`/products?select=id,company_id&id=eq.${encodeURIComponent(TEST_PRODUCT_CODE)}&company_id=eq.${encodeURIComponent(emp001.id)}`, {
      headers: companyHeaders(emp001),
    })
    const emp001TryingEmp002 = await supabaseRequest(`/products?select=id,company_id&company_id=eq.${encodeURIComponent(emp002.id)}`, {
      headers: companyHeaders(emp001),
    })
    const emp002TryingEmp001 = await supabaseRequest(`/products?select=id,company_id&company_id=eq.${encodeURIComponent(emp001.id)}`, {
      headers: companyHeaders(emp002),
    })

    const isolated = Array.isArray(emp001Own)
      && emp001Own.length >= 1
      && Array.isArray(emp001TryingEmp002)
      && emp001TryingEmp002.length === 0
      && Array.isArray(emp002TryingEmp001)
      && emp002TryingEmp001.length === 0

    return (isolated ? ok : fail)(isolated
      ? 'Aislamiento Supabase correcto entre EMP001 y EMP002.'
      : 'Advertencia: la prueba detecto posible lectura cruzada entre empresas.', {
      configured: true,
      mode: 'Supabase',
      emp001Own: Array.isArray(emp001Own) ? emp001Own.length : 0,
      emp001SeesEmp002: Array.isArray(emp001TryingEmp002) ? emp001TryingEmp002.length : 0,
      emp002SeesEmp001: Array.isArray(emp002TryingEmp001) ? emp002TryingEmp001.length : 0,
    })
  } catch (error) {
    return fail(`No se pudo probar aislamiento Supabase: ${error.message}`, {
      configured: true,
      mode: 'localStorage fallback',
      error: error.message,
    })
  }
}
