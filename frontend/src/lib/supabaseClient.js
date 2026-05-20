const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '')
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

export function getSupabaseConfigStatus() {
  return {
    configured: isSupabaseConfigured(),
    urlPresent: Boolean(supabaseUrl),
    anonKeyPresent: Boolean(supabaseAnonKey),
  }
}

function normalizePath(path = '') {
  return String(path || '').startsWith('/') ? path : `/${path}`
}

function getSessionHeaders() {
  if (typeof sessionStorage === 'undefined') return {}

  try {
    const session = JSON.parse(sessionStorage.getItem('inveFatSession') || 'null')
    if (!session) return {}

    return {
      'x-company-id': session.currentCompanyId || '',
      'x-company-code': session.currentCompanyCode || '',
      'x-user-role': session.isSuperAdmin ? 'superadmin' : session.currentRole || '',
    }
  } catch {
    return {}
  }
}

export async function supabaseRequest(path, options = {}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no configurado. Usando localStorage como respaldo.')
  }

  const response = await fetch(`${supabaseUrl}/rest/v1${normalizePath(path)}`, {
    ...options,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer || 'return=representation',
      ...getSessionHeaders(),
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Error Supabase ${response.status}`)
  }

  if (response.status === 204) return null

  const text = await response.text()
  return text ? JSON.parse(text) : null
}
