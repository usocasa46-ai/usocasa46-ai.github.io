import { isSupabaseConfigured, supabaseRequest } from '../lib/supabaseClient.js'

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

export function createCollectionClient({ table, storageKey, idField = 'id', fallback = [] }) {
  const selectByIdPath = (id) => {
    const encoded = encodeURIComponent(id)
    return `/${table}?${idField}=eq.${encoded}`
  }

  return {
    async getAll() {
      return withSupabaseFallback(
        () => supabaseRequest(`/${table}?select=*`),
        () => localCollection(storageKey, fallback),
      )
    },

    async getById(id) {
      return withSupabaseFallback(
        async () => {
          const rows = await supabaseRequest(selectByIdPath(id))
          return Array.isArray(rows) ? rows[0] || null : null
        },
        () => localCollection(storageKey, fallback).find((record) => getRecordId(record, idField) === id) || null,
      )
    },

    async create(record) {
      return withSupabaseFallback(
        async () => {
          const rows = await supabaseRequest(`/${table}`, {
            method: 'POST',
            body: JSON.stringify(record),
          })
          return Array.isArray(rows) ? rows[0] || record : rows || record
        },
        () => {
          const current = localCollection(storageKey, fallback)
          const recordId = getRecordId(record, idField)
          const next = current.some((item) => getRecordId(item, idField) === recordId)
            ? current.map((item) => (getRecordId(item, idField) === recordId ? record : item))
            : [record, ...current]
          saveStorage(storageKey, next)
          return record
        },
      )
    },

    async update(id, patch) {
      return withSupabaseFallback(
        async () => {
          const rows = await supabaseRequest(selectByIdPath(id), {
            method: 'PATCH',
            body: JSON.stringify(patch),
          })
          return Array.isArray(rows) ? rows[0] || patch : rows || patch
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
        () => supabaseRequest(selectByIdPath(id), { method: 'DELETE', prefer: 'return=minimal' }),
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
        await supabaseRequest(`/${table}`, {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify(list),
        })
      } catch (error) {
        console.warn('No se pudo sincronizar con Supabase:', error.message)
      }

      return list
    },
  }
}

export function createDocumentClient({ table, storageKey, id = 'general', fallback = {} }) {
  return {
    async getAll() {
      const value = await this.getById(id)
      return value ? [value] : []
    },

    async getById() {
      return withSupabaseFallback(
        async () => {
          const rows = await supabaseRequest(`/${table}?id=eq.${encodeURIComponent(id)}`)
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
        await supabaseRequest(`/${table}`, {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }),
        })
      } catch (error) {
        console.warn('No se pudo guardar documento en Supabase:', error.message)
      }

      return data
    },

    async remove() {
      localStorage.removeItem(storageKey)
      return withSupabaseFallback(
        () => supabaseRequest(`/${table}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', prefer: 'return=minimal' }),
        () => true,
      )
    },

    async deactivate() {
      return this.update(id, { ...safeParseStorage(storageKey, fallback), active: false })
    },
  }
}
