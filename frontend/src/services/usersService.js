import { createCollectionClient } from './dataClient.js'
import { isSupabaseConfigured, supabaseRequest } from '../lib/supabaseClient.js'
import {
  loadCompanyUsers,
  saveCompanyUsers,
} from './companyStorage.js'

const client = createCollectionClient({
  table: 'company_users',
  storageKey: 'inveFatUsers',
  idField: 'username',
  fallback: [],
})

export const usersService = {
  getAll: () => client.getAll(),
  getById: (id) => client.getById(id),
  create: (record) => client.create(record),
  update: (id, patch) => client.update(id, patch),
  remove: (id) => client.remove(id),
  deactivate: (id) => client.deactivate(id),
  replaceAll: (records) => client.replaceAll(records),
}

function nowIso() {
  return new Date().toISOString()
}

function cleanCode(value) {
  return String(value || '').trim().toUpperCase()
}

function cleanText(value) {
  return String(value || '').trim()
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

function unwrapUser(row, company = null) {
  if (!row) return null
  const data = row.data || {}
  const username = cleanText(row.username || row.usuario || data.username || data.usuario || row.id)
  const code = cleanCode(row.company_code || data.companyCode || data.company_code || company?.companyCode)
  const companyId = String(row.company_id || data.companyId || data.company_id || company?.id || '')
  const estado = row.estado || data.estado || (data.active === false ? 'inactivo' : 'activo')
  return {
    ...data,
    ...row,
    id: row.id || username,
    companyId,
    company_id: companyId,
    companyCode: code,
    company_code: code,
    username,
    usuario: username,
    fullName: row.nombre || data.fullName || data.nombre || username,
    nombre: row.nombre || data.nombre || data.fullName || username,
    password: row.password || data.password || row.password_hash || data.password_hash || '',
    role: row.role || row.rol || data.role || data.rol || 'Usuario',
    rol: row.rol || row.role || data.rol || data.role || 'Usuario',
    estado,
    active: !['inactivo', 'inactiva', 'suspendido', 'suspendida'].includes(String(estado || '').toLowerCase()),
    mustChangePassword: row.must_change_password ?? data.mustChangePassword ?? data.must_change_password ?? false,
    email: row.correo || data.email || data.correo || '',
    phone: row.telefono || data.phone || data.telefono || '',
  }
}

function userPayload(company, adminData) {
  const code = cleanCode(company.companyCode || company.company_code)
  const companyId = String(company.id || company.companyId || company.company_id || '')
  const username = cleanText(adminData.username || adminData.usuario)
  const createdAt = adminData.createdAt || nowIso()
  const user = {
    ...adminData,
    id: username,
    companyId,
    company_id: companyId,
    companyCode: code,
    company_code: code,
    username,
    usuario: username,
    fullName: adminData.fullName || adminData.nombre || username,
    nombre: adminData.nombre || adminData.fullName || username,
    password: adminData.password || '',
    role: adminData.role || adminData.rol || 'Administrador Principal',
    rol: adminData.rol || adminData.role || 'Administrador Principal',
    active: adminData.active !== false,
    estado: adminData.estado || (adminData.active === false ? 'inactivo' : 'activo'),
    isMainAdmin: adminData.isMainAdmin !== false,
    mustChangePassword: adminData.mustChangePassword !== false,
    email: adminData.email || adminData.correo || '',
    phone: adminData.phone || adminData.telefono || '',
    createdAt,
    updatedAt: nowIso(),
  }

  return {
    id: username,
    company_id: companyId,
    company_code: code,
    nombre: user.fullName,
    usuario: username,
    username,
    password: user.password,
    password_hash: user.password,
    rol: user.rol,
    role: user.role,
    estado: user.estado,
    must_change_password: user.mustChangePassword,
    correo: user.email,
    telefono: user.phone,
    data: user,
    created_at: createdAt,
    updated_at: nowIso(),
  }
}

export async function getCompanyUser(companyCode, username) {
  const code = cleanCode(companyCode)
  const userName = cleanText(username)
  if (!code || !userName) return null

  if (!isSupabaseConfigured()) {
    return null
  }

  const rows = await supabaseRequest(`/company_users?select=*&company_code=eq.${encodeURIComponent(code)}`, {
    headers: companyHeaders(code),
  })
  const users = Array.isArray(rows) ? rows.map((row) => unwrapUser(row)) : []
  return users.find((user) => (
    String(user.username || user.usuario || '').trim().toLowerCase() === userName.toLowerCase()
  )) || null
}

export async function createCompanyAdmin(company, adminData) {
  if (!company) throw new Error('Empresa requerida para crear administrador.')
  const username = cleanText(adminData?.username || adminData?.usuario)
  const password = cleanText(adminData?.password)
  if (!username || !password) throw new Error('Usuario y contrasena del administrador son requeridos.')

  if (!isSupabaseConfigured()) {
    const current = loadCompanyUsers(company)
    if (current.some((user) => String(user.username || '').toLowerCase() === username.toLowerCase())) {
      throw new Error('Ese usuario ya existe en la empresa.')
    }
    const user = {
      id: username,
      companyId: company.id,
      companyCode: company.companyCode,
      fullName: adminData.fullName || adminData.nombre || username,
      username,
      password,
      role: adminData.role || 'Administrador Principal',
      active: true,
      isMainAdmin: true,
      email: adminData.email || '',
      phone: adminData.phone || '',
      mustChangePassword: adminData.mustChangePassword !== false,
      createdAt: nowIso(),
    }
    saveCompanyUsers(company, [...current, user])
    return user
  }

  const existing = await getCompanyUser(company.companyCode || company.company_code, username)
  if (existing) throw new Error('Ese usuario ya existe en la empresa.')

  const rows = await supabaseRequest('/company_users?on_conflict=company_id,id', {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
      ...adminHeaders(),
    },
    body: JSON.stringify(userPayload(company, adminData)),
  })
  const saved = Array.isArray(rows) && rows[0] ? unwrapUser(rows[0], company) : null
  if (!saved) throw new Error('Supabase no devolvio el administrador creado.')
  return saved
}
