const DB_NAME = 'invefat_rnc_registry'
const DB_VERSION = 1
const STORE_NAME = 'rnc_records'
const META_STORE = 'rnc_meta'
const FALLBACK_KEY = 'invefat_rnc_registry_fallback'
const FALLBACK_META_KEY = 'invefat_rnc_registry_meta'

const requiredHeaders = [
  'RNC',
  'RAZON SOCIAL',
  'ACTIVIDAD ECONOMICA',
  'FECHA DE INICIO OPERACIONES',
  'ESTADO',
  'REGIMEN DE PAGO',
]

function canUseIndexedDb() {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined'
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function normalizeText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
}

export function normalizeRnc(value = '') {
  return String(value || '').replace(/\D/g, '').trim()
}

function nowIso() {
  return new Date().toISOString()
}

function makeRncRecord(raw = {}, source = 'manual') {
  const rnc = normalizeRnc(raw.rnc || raw.RNC)
  const razonSocial = String(raw.razonSocial || raw.razon || raw['RAZON SOCIAL'] || raw['RAZÓN SOCIAL'] || '').trim()
  return {
    rnc,
    razonSocial,
    actividadEconomica: String(raw.actividadEconomica || raw['ACTIVIDAD ECONOMICA'] || raw['ACTIVIDAD ECONÓMICA'] || '').trim(),
    fechaInicioOperaciones: String(raw.fechaInicioOperaciones || raw['FECHA DE INICIO OPERACIONES'] || '').trim(),
    estado: String(raw.estado || raw.ESTADO || '').trim(),
    regimenPago: String(raw.regimenPago || raw['REGIMEN DE PAGO'] || raw['RÉGIMEN DE PAGO'] || '').trim(),
    updatedAt: raw.updatedAt || nowIso(),
    source,
  }
}

function safeParse(key, fallback) {
  if (!canUseStorage()) return fallback
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  if (!canUseStorage()) return
  localStorage.setItem(key, JSON.stringify(value))
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Error en IndexedDB'))
  })
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error || new Error('Error en transaccion IndexedDB'))
    tx.onabort = () => reject(tx.error || new Error('Transaccion IndexedDB cancelada'))
  })
}

let dbPromise = null

function openDb() {
  if (!canUseIndexedDb()) return Promise.resolve(null)
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'rnc' })
        store.createIndex('razonSocial', 'razonSocial', { unique: false })
        store.createIndex('actividadEconomica', 'actividadEconomica', { unique: false })
        store.createIndex('estado', 'estado', { unique: false })
        store.createIndex('regimenPago', 'regimenPago', { unique: false })
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('No se pudo abrir IndexedDB'))
  })

  return dbPromise
}

function parseCsvLine(line = '') {
  const result = []
  let current = ''
  let insideQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"' && insideQuotes && next === '"') {
      current += '"'
      index += 1
    } else if (char === '"') {
      insideQuotes = !insideQuotes
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

function buildHeaderMap(headerLine = '') {
  const headers = parseCsvLine(headerLine).map((header) => normalizeText(header.replace(/^\uFEFF/, '')))
  const missing = requiredHeaders.filter((header) => !headers.includes(header))
  if (missing.length) {
    throw new Error('El archivo no contiene el encabezado requerido.')
  }

  return {
    rnc: headers.indexOf('RNC'),
    razonSocial: headers.indexOf('RAZON SOCIAL'),
    actividadEconomica: headers.indexOf('ACTIVIDAD ECONOMICA'),
    fechaInicioOperaciones: headers.indexOf('FECHA DE INICIO OPERACIONES'),
    estado: headers.indexOf('ESTADO'),
    regimenPago: headers.indexOf('REGIMEN DE PAGO'),
  }
}

function recordFromCsvLine(line, headerMap) {
  const values = parseCsvLine(line)
  return makeRncRecord({
    rnc: values[headerMap.rnc],
    razonSocial: values[headerMap.razonSocial],
    actividadEconomica: values[headerMap.actividadEconomica],
    fechaInicioOperaciones: values[headerMap.fechaInicioOperaciones],
    estado: values[headerMap.estado],
    regimenPago: values[headerMap.regimenPago],
  }, 'csv')
}

function validateRecord(record) {
  if (!record.rnc) return 'RNC obligatorio'
  if (!record.razonSocial) return 'Razon social obligatoria'
  return ''
}

async function putBatch(records) {
  if (!records.length) return
  const db = await openDb()
  if (!db) {
    const current = safeParse(FALLBACK_KEY, [])
    const map = new Map(current.map((record) => [record.rnc, record]))
    records.forEach((record) => map.set(record.rnc, record))
    writeStorage(FALLBACK_KEY, Array.from(map.values()))
    return
  }

  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  records.forEach((record) => store.put(record))
  await txDone(tx)
}

async function putMeta(meta) {
  const db = await openDb()
  const payload = { key: 'summary', ...meta, updatedAt: nowIso() }
  if (!db) {
    writeStorage(FALLBACK_META_KEY, payload)
    return
  }
  const tx = db.transaction(META_STORE, 'readwrite')
  tx.objectStore(META_STORE).put(payload)
  await txDone(tx)
}

export async function getMeta() {
  const db = await openDb()
  if (!db) return safeParse(FALLBACK_META_KEY, {})
  const tx = db.transaction(META_STORE, 'readonly')
  return requestToPromise(tx.objectStore(META_STORE).get('summary')).then((meta) => meta || {})
}

async function existsRnc(rnc) {
  if (!rnc) return false
  const existing = await getByRnc(rnc)
  return Boolean(existing)
}

async function eachRecord(callback) {
  const db = await openDb()
  if (!db) {
    const records = safeParse(FALLBACK_KEY, [])
    records.forEach(callback)
    return
  }

  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).openCursor()
    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor) {
        resolve(true)
        return
      }
      callback(cursor.value)
      cursor.continue()
    }
    request.onerror = () => reject(request.error || new Error('No se pudo leer la base RNC'))
  })
}

export async function count() {
  const db = await openDb()
  if (!db) return safeParse(FALLBACK_KEY, []).length
  const tx = db.transaction(STORE_NAME, 'readonly')
  return requestToPromise(tx.objectStore(STORE_NAME).count())
}

export async function getStats() {
  const meta = await getMeta()
  const stats = {
    total: 0,
    active: 0,
    inactive: 0,
    lastImport: meta.lastImport || '',
    lastErrors: meta.lastErrors || 0,
  }

  await eachRecord((record) => {
    stats.total += 1
    const status = normalizeText(record.estado)
    if (status.includes('INACTIVO') || status.includes('SUSPEND')) stats.inactive += 1
    else if (status.includes('ACTIVO')) stats.active += 1
  })

  return stats
}

export async function getByRnc(value) {
  const rnc = normalizeRnc(value)
  if (!rnc) return null
  const db = await openDb()
  if (!db) {
    return safeParse(FALLBACK_KEY, []).find((record) => record.rnc === rnc) || null
  }
  const tx = db.transaction(STORE_NAME, 'readonly')
  return requestToPromise(tx.objectStore(STORE_NAME).get(rnc)).then((record) => record || null)
}

export async function search(query = '', filters = {}, options = {}) {
  const page = Math.max(1, Number(options.page) || 1)
  const pageSize = Math.max(10, Number(options.pageSize) || 50)
  const start = (page - 1) * pageSize
  const cleanQuery = normalizeText(query)
  const cleanRnc = normalizeRnc(query)
  const estado = filters.estado && filters.estado !== 'Todos' ? normalizeText(filters.estado) : ''
  const regimen = filters.regimenPago && filters.regimenPago !== 'Todos' ? normalizeText(filters.regimenPago) : ''
  const actividad = filters.actividadEconomica ? normalizeText(filters.actividadEconomica) : ''
  const rows = []
  let matched = 0

  await eachRecord((record) => {
    const haystack = [
      record.rnc,
      record.razonSocial,
      record.actividadEconomica,
      record.estado,
      record.regimenPago,
    ].map(normalizeText).join(' ')
    const matchesQuery = !cleanQuery || haystack.includes(cleanQuery) || (cleanRnc && record.rnc.includes(cleanRnc))
    const matchesStatus = !estado || normalizeText(record.estado).includes(estado)
    const matchesRegimen = !regimen || normalizeText(record.regimenPago).includes(regimen)
    const matchesActividad = !actividad || normalizeText(record.actividadEconomica).includes(actividad)

    if (!matchesQuery || !matchesStatus || !matchesRegimen || !matchesActividad) return
    if (matched >= start && rows.length < pageSize) rows.push(record)
    matched += 1
  })

  return { rows, total: matched, page, pageSize }
}

export async function getAllPaginated(page = 1, pageSize = 50) {
  return search('', {}, { page, pageSize })
}

export async function updateRnc(rnc, data) {
  const record = makeRncRecord({ ...data, rnc }, data.source || 'manual')
  const error = validateRecord(record)
  if (error) throw new Error(error)
  await putBatch([{ ...record, updatedAt: nowIso() }])
  return record
}

export async function deleteRnc(rncValue) {
  const rnc = normalizeRnc(rncValue)
  const db = await openDb()
  if (!db) {
    writeStorage(FALLBACK_KEY, safeParse(FALLBACK_KEY, []).filter((record) => record.rnc !== rnc))
    return true
  }
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).delete(rnc)
  await txDone(tx)
  return true
}

export async function clearAll() {
  const db = await openDb()
  if (!db) {
    writeStorage(FALLBACK_KEY, [])
    writeStorage(FALLBACK_META_KEY, { lastImport: '', lastErrors: 0 })
    return true
  }
  const tx = db.transaction([STORE_NAME, META_STORE], 'readwrite')
  tx.objectStore(STORE_NAME).clear()
  tx.objectStore(META_STORE).clear()
  await txDone(tx)
  return true
}

function pause() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

export async function importCsv(file, options = {}) {
  if (!file) throw new Error('Seleccione un archivo CSV.')
  const updateDuplicates = options.updateDuplicates !== false
  const clearBeforeImport = Boolean(options.clearBeforeImport)
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => {}
  const signal = options.signal
  const batchSize = Number(options.batchSize) || 500
  const summary = {
    processed: 0,
    imported: 0,
    updated: 0,
    valid: 0,
    errors: 0,
    skipped: 0,
    errorRows: [],
    percent: 0,
  }
  let headerMap = null
  let buffer = ''
  let loaded = 0
  let batch = []

  if (clearBeforeImport) await clearAll()

  const flushBatch = async () => {
    if (!batch.length) return
    await putBatch(batch)
    batch = []
    await pause()
  }

  const handleLine = async (line) => {
    if (signal?.aborted) throw new Error('Importacion cancelada.')
    if (!line.trim()) return
    if (!headerMap) {
      headerMap = buildHeaderMap(line)
      return
    }

    summary.processed += 1
    try {
      const record = recordFromCsvLine(line, headerMap)
      const error = validateRecord(record)
      if (error) throw new Error(error)
      const existed = await existsRnc(record.rnc)
      if (!updateDuplicates && existed) {
        summary.skipped += 1
        return
      }
      batch.push(record)
      summary.valid += 1
      if (existed) summary.updated += 1
      else summary.imported += 1
      if (batch.length >= batchSize) await flushBatch()
    } catch (error) {
      summary.errors += 1
      if (summary.errorRows.length < 30) {
        summary.errorRows.push({ row: summary.processed + 1, error: error.message || 'Fila invalida' })
      }
    }
  }

  if (file.stream) {
    const reader = file.stream().getReader()
    const decoder = new TextDecoder('utf-8')
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      loaded += value.byteLength
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() || ''
      for (const line of lines) await handleLine(line)
      summary.percent = file.size ? Math.min(99, Math.round((loaded / file.size) * 100)) : 0
      onProgress({ ...summary })
    }
    buffer += decoder.decode()
    if (buffer.trim()) await handleLine(buffer)
  } else {
    const text = await file.text()
    const lines = text.split(/\r?\n/)
    for (let index = 0; index < lines.length; index += 1) {
      await handleLine(lines[index])
      loaded = index
      summary.percent = lines.length ? Math.round((loaded / lines.length) * 100) : 0
      if (index % batchSize === 0) onProgress({ ...summary })
    }
  }

  if (!headerMap) throw new Error('El archivo no contiene el encabezado requerido.')
  await flushBatch()
  summary.percent = 100
  await putMeta({
    lastImport: nowIso(),
    lastErrors: summary.errors,
    lastValid: summary.valid,
    lastProcessed: summary.processed,
    lastImported: summary.imported,
    lastUpdated: summary.updated,
  })
  onProgress({ ...summary })
  return summary
}

export async function exportAll() {
  const rows = []
  await eachRecord((record) => rows.push(record))
  return rows
}

export async function enrichDgiiRecordsWithRnc(records = [], type = '607') {
  const idField = type === '606' ? 'rncProveedor' : 'rncCliente'
  const nameField = type === '606' ? 'razonSocialProveedor' : 'razonSocialCliente'

  return Promise.all(records.map(async (record) => {
    const rnc = record[idField]
    if (!rnc) return record
    const match = await getByRnc(rnc)
    if (!match) {
      return {
        ...record,
        estado: record.estado === 'Listo' ? 'Con advertencias' : record.estado,
        errores: [...(record.errores || []), 'RNC no encontrado en base'].filter(Boolean),
      }
    }
    const inactive = normalizeText(match.estado).includes('INACTIVO') || normalizeText(match.estado).includes('SUSPEND')
    return {
      ...record,
      [nameField]: record[nameField] || match.razonSocial,
      actividadEconomica: record.actividadEconomica || match.actividadEconomica,
      estadoRnc: match.estado,
      regimenPagoRnc: match.regimenPago,
      estado: inactive && record.estado === 'Listo' ? 'Con advertencias' : record.estado,
      errores: inactive ? [...(record.errores || []), 'RNC inactivo en base'].filter(Boolean) : (record.errores || []),
    }
  }))
}

export const rncService = {
  importCsv,
  getByRnc,
  search,
  getAllPaginated,
  updateRnc,
  deleteRnc,
  clearAll,
  count,
  getStats,
  exportAll,
}
