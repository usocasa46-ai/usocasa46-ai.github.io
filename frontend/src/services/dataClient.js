import { isSupabaseConfigured, supabaseRequest } from '../lib/supabaseClient.js'
import {
  getCurrentCompanyCode as getStoredCurrentCompanyCode,
  getCurrentCompanyId as getStoredCurrentCompanyId,
} from './companyStorage.js'

export { isSupabaseConfigured }

export function safeParseStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

export function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  return value
}

function getRecordId(record, idField) {
  return record?.[idField] || record?.id || record?.code || record?.number || record?.username || ''
}

export function getCurrentCompanyId() {
  const companyCode = getStoredCurrentCompanyCode()
  if (companyCode && companyCode !== 'SYSTEM') return companyCode
  const companyId = getStoredCurrentCompanyId()
  return companyId && companyId !== 'SYSTEM' ? companyId : ''
}

export function attachCompanyId(data = {}) {
  const companyId = getCurrentCompanyId()
  if (!companyId || data.company_id || data.companyId) return data
  return { ...data, company_id: companyId, companyId }
}

function withCompanyFilter(path, companyScoped = true) {
  const companyId = getCurrentCompanyId()
  if (!companyScoped || !companyId) return path
  return `${path}${path.includes('?') ? '&' : '?'}company_id=eq.${encodeURIComponent(companyId)}`
}

function unwrapSupabaseRow(row) {
  if (row && typeof row === 'object' && 'data' in row) {
    return {
      id: row.id,
      ...(row.data || {}),
      company_id: row.company_id || row.data?.company_id,
      companyId: row.company_id || row.data?.companyId,
    }
  }

  return row
}

function resolveCompanyId(record, companyScoped) {
  if (record?.company_id) return record.company_id
  if (record?.companyId) return record.companyId
  return companyScoped ? getCurrentCompanyId() || null : null
}

function getConflictTarget(companyScoped) {
  return companyScoped ? 'company_id,id' : 'id'
}

function wrapSupabaseRecord(record, idField = 'id', companyScoped = true) {
  const id = getRecordId(record, idField)
  if (!id) {
    throw new Error('El registro necesita un id, codigo o numero para sincronizar con Supabase.')
  }
  const companyId = resolveCompanyId(record, companyScoped)
  const data = companyId ? { ...record, company_id: companyId, companyId } : record

  return {
    id: String(id),
    company_id: companyId,
    data,
    updated_at: new Date().toISOString(),
  }
}

function localCollection(storageKey, fallback = []) {
  const current = safeParseStorage(storageKey, fallback)
  return Array.isArray(current) ? current : fallback
}

async function withSupabaseFallback(operation, fallback) {
  if (!isSupabaseConfigured()) return fallback()

  try {
    return await operation()
  } catch (error) {
    console.warn('Supabase no disponible, usando localStorage:', error.message)
    return fallback()
  }
}

export async function getRecords(tableName, localStorageKey, options = {}) {
  const { companyScoped = true } = options
  return withSupabaseFallback(
    async () => {
      const rows = await supabaseRequest(withCompanyFilter(`/${tableName}?select=*&order=updated_at.desc`, companyScoped))
      return Array.isArray(rows) ? rows.map(unwrapSupabaseRow) : []
    },
    () => localCollection(localStorageKey, []),
  )
}

export async function getRecordsByCompany(tableName, localStorageKey) {
  return getRecords(tableName, localStorageKey, { companyScoped: true })
}

export async function createRecord(tableName, localStorageKey, data, options = {}) {
  const { companyScoped = true, idField = 'id' } = options
  return withSupabaseFallback(
    async () => {
      const payload = wrapSupabaseRecord(data, idField, companyScoped)
      const rows = await supabaseRequest(`/${tableName}?on_conflict=${getConflictTarget(companyScoped)}`, {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(payload),
      })
      return Array.isArray(rows) ? unwrapSupabaseRow(rows[0]) : data
    },
    () => {
      const current = localCollection(localStorageKey, [])
      const nextRecord = companyScoped ? attachCompanyId(data) : data
      const recordId = getRecordId(nextRecord, idField)
      const next = current.some((item) => getRecordId(item, idField) === recordId)
        ? current.map((item) => (getRecordId(item, idField) === recordId ? nextRecord : item))
        : [nextRecord, ...current]
      saveStorage(localStorageKey, next)
      return nextRecord
    },
  )
}

export async function updateRecord(tableName, localStorageKey, id, data, options = {}) {
  const { companyScoped = true, idField = 'id' } = options
  return withSupabaseFallback(
    async () => {
      const existingRows = await supabaseRequest(withCompanyFilter(`/${tableName}?id=eq.${encodeURIComponent(id)}`, companyScoped))
      const current = Array.isArray(existingRows) && existingRows[0] ? unwrapSupabaseRow(existingRows[0]) : { id }
      const next = companyScoped ? attachCompanyId({ ...current, ...data }) : { ...current, ...data }
      const rows = await supabaseRequest(withCompanyFilter(`/${tableName}?id=eq.${encodeURIComponent(id)}`, companyScoped), {
        method: 'PATCH',
        body: JSON.stringify({ company_id: resolveCompanyId(next, companyScoped), data: next, updated_at: new Date().toISOString() }),
      })
      return Array.isArray(rows) ? unwrapSupabaseRow(rows[0]) : next
    },
    () => {
      const current = localCollection(localStorageKey, [])
      const next = current.map((item) => (getRecordId(item, idField) === id ? { ...item, ...(companyScoped ? attachCompanyId(data) : data) } : item))
      saveStorage(localStorageKey, next)
      return next.find((item) => getRecordId(item, idField) === id) || null
    },
  )
}

export async function deleteRecord(tableName, localStorageKey, id, options = {}) {
  const { companyScoped = true, idField = 'id' } = options
  return withSupabaseFallback(
    () => supabaseRequest(withCompanyFilter(`/${tableName}?id=eq.${encodeURIComponent(id)}`, companyScoped), { method: 'DELETE', prefer: 'return=minimal' }),
    () => {
      const next = localCollection(localStorageKey, []).filter((item) => getRecordId(item, idField) !== id)
      saveStorage(localStorageKey, next)
      return true
    },
  )
}

export function createCollectionClient({ table, storageKey, idField = 'id', fallback = [], companyScoped = true }) {
  return {
    async getAll() {
      return withSupabaseFallback(
        async () => {
          const rows = await supabaseRequest(withCompanyFilter(`/${table}?select=*&order=updated_at.desc`, companyScoped))
          return Array.isArray(rows) ? rows.map(unwrapSupabaseRow) : []
        },
        () => localCollection(storageKey, fallback),
      )
    },

    async getById(id) {
      return withSupabaseFallback(
        async () => {
          const rows = await supabaseRequest(withCompanyFilter(`/${table}?id=eq.${encodeURIComponent(id)}`, companyScoped))
          return Array.isArray(rows) ? unwrapSupabaseRow(rows[0]) || null : null
        },
        () => localCollection(storageKey, fallback).find((record) => getRecordId(record, idField) === id) || null,
      )
    },

    async create(record) {
      return withSupabaseFallback(
        async () => {
          const rows = await supabaseRequest(`/${table}?on_conflict=${getConflictTarget(companyScoped)}`, {
            method: 'POST',
            headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
            body: JSON.stringify(wrapSupabaseRecord(record, idField, companyScoped)),
          })
          return Array.isArray(rows) ? unwrapSupabaseRow(rows[0]) || record : record
        },
        () => {
          const current = localCollection(storageKey, fallback)
          const nextRecord = companyScoped ? attachCompanyId(record) : record
          const recordId = getRecordId(nextRecord, idField)
          const next = current.some((item) => getRecordId(item, idField) === recordId)
            ? current.map((item) => (getRecordId(item, idField) === recordId ? nextRecord : item))
            : [nextRecord, ...current]
          saveStorage(storageKey, next)
          return nextRecord
        },
      )
    },

    async update(id, patch) {
      return withSupabaseFallback(
        async () => {
          const existingRows = await supabaseRequest(withCompanyFilter(`/${table}?id=eq.${encodeURIComponent(id)}`, companyScoped))
          const current = Array.isArray(existingRows) && existingRows[0] ? unwrapSupabaseRow(existingRows[0]) : { [idField]: id }
          const next = companyScoped ? attachCompanyId({ ...current, ...patch }) : { ...current, ...patch }
          const rows = await supabaseRequest(withCompanyFilter(`/${table}?id=eq.${encodeURIComponent(id)}`, companyScoped), {
            method: 'PATCH',
            body: JSON.stringify({ company_id: resolveCompanyId(next, companyScoped), data: next, updated_at: new Date().toISOString() }),
          })
          return Array.isArray(rows) ? unwrapSupabaseRow(rows[0]) || next : next
        },
        () => {
          const current = localCollection(storageKey, fallback)
          const next = current.map((item) => (
            getRecordId(item, idField) === id ? { ...item, ...patch } : item
          ))
          saveStorage(storageKey, next)
          return next.find((item) => getRecordId(item, idField) === id) || null
        },
      )
    },

    async remove(id) {
      return withSupabaseFallback(
        () => supabaseRequest(withCompanyFilter(`/${table}?id=eq.${encodeURIComponent(id)}`, companyScoped), { method: 'DELETE', prefer: 'return=minimal' }),
        () => {
          const next = localCollection(storageKey, fallback).filter((item) => getRecordId(item, idField) !== id)
          saveStorage(storageKey, next)
          return true
        },
      )
    },

    async deactivate(id) {
      return this.update(id, { active: false, status: 'Inactivo', updatedAt: new Date().toISOString() })
    },

    async replaceAll(records) {
      const list = Array.isArray(records) ? records : []
      saveStorage(storageKey, list)

      if (!isSupabaseConfigured()) return list

      try {
        await supabaseRequest(`/${table}?on_conflict=${getConflictTarget(companyScoped)}`, {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify(list.map((record) => wrapSupabaseRecord(record, idField, companyScoped))),
        })
      } catch (error) {
        console.warn('No se pudo sincronizar con Supabase:', error.message)
      }

      return list
    },
  }
}

export function createDocumentClient({ table, storageKey, id = 'general', fallback = {}, companyScoped = true }) {
  return {
    async getAll() {
      const value = await this.getById(id)
      return value ? [value] : []
    },

    async getById() {
      return withSupabaseFallback(
        async () => {
          const rows = await supabaseRequest(withCompanyFilter(`/${table}?id=eq.${encodeURIComponent(id)}`, companyScoped))
          return Array.isArray(rows) && rows[0]?.data ? rows[0].data : fallback
        },
        () => safeParseStorage(storageKey, fallback),
      )
    },

    async create(data) {
      return this.update(id, data)
    },

    async update(_id, data) {
      saveStorage(storageKey, data)

      if (!isSupabaseConfigured()) return data

      try {
        const next = companyScoped ? attachCompanyId(data) : data
        await supabaseRequest(`/${table}?on_conflict=${getConflictTarget(companyScoped)}`, {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({ id, company_id: resolveCompanyId(next, companyScoped), data: next, updated_at: new Date().toISOString() }),
        })
      } catch (error) {
        console.warn('No se pudo guardar documento en Supabase:', error.message)
      }

      return data
    },

    async remove() {
      localStorage.removeItem(storageKey)
      return withSupabaseFallback(
        () => supabaseRequest(withCompanyFilter(`/${table}?id=eq.${encodeURIComponent(id)}`, companyScoped), { method: 'DELETE', prefer: 'return=minimal' }),
        () => true,
      )
    },

    async deactivate() {
      return this.update(id, { ...safeParseStorage(storageKey, fallback), active: false })
    },
  }
}
