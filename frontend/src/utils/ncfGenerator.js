import { makeId, readArray, toNumber, today, writeStorage } from './accountingEntries.js'

export const NCF_SEQUENCES_KEY = 'invefat_ncf_sequences'
export const NCF_USED_KEY = 'invefat_ncf_used'

export const ncfReceiptTypes = [
  'B01 Credito fiscal',
  'B02 Consumidor final',
  'B03 Nota de debito',
  'B04 Nota de credito',
  'B14 Regimen especial',
  'B15 Gubernamental',
  'B16 Exportaciones',
  'B17 Pagos al exterior',
]

export const defaultNcfSequences = [
  { id: 'NCF-B01', type: 'B01 Credito fiscal', description: 'Credito fiscal', series: 'B', prefix: 'B01', from: 1, to: 99999999, nextNumber: 1, length: 8, authorizedAt: '', validUntil: '', default: false, useInvoice: true, usePos: true, useCreditNote: false, branchCode: '', notes: '', status: 'Activo' },
  { id: 'NCF-B02', type: 'B02 Consumidor final', description: 'Consumidor final', series: 'B', prefix: 'B02', from: 1, to: 99999999, nextNumber: 1, length: 8, authorizedAt: '', validUntil: '', default: true, useInvoice: true, usePos: true, useCreditNote: false, branchCode: '', notes: '', status: 'Activo' },
  { id: 'NCF-B03', type: 'B03 Nota de debito', description: 'Nota de debito', series: 'B', prefix: 'B03', from: 1, to: 99999999, nextNumber: 1, length: 8, authorizedAt: '', validUntil: '', default: false, useInvoice: false, usePos: false, useCreditNote: false, branchCode: '', notes: '', status: 'Activo' },
  { id: 'NCF-B04', type: 'B04 Nota de credito', description: 'Nota de credito', series: 'B', prefix: 'B04', from: 1, to: 99999999, nextNumber: 1, length: 8, authorizedAt: '', validUntil: '', default: false, useInvoice: false, usePos: false, useCreditNote: true, branchCode: '', notes: '', status: 'Activo' },
  { id: 'NCF-B14', type: 'B14 Regimen especial', description: 'Regimen especial', series: 'B', prefix: 'B14', from: 1, to: 99999999, nextNumber: 1, length: 8, authorizedAt: '', validUntil: '', default: false, useInvoice: true, usePos: true, useCreditNote: false, branchCode: '', notes: '', status: 'Activo' },
  { id: 'NCF-B15', type: 'B15 Gubernamental', description: 'Gubernamental', series: 'B', prefix: 'B15', from: 1, to: 99999999, nextNumber: 1, length: 8, authorizedAt: '', validUntil: '', default: false, useInvoice: true, usePos: true, useCreditNote: false, branchCode: '', notes: '', status: 'Activo' },
  { id: 'NCF-B16', type: 'B16 Exportaciones', description: 'Exportaciones', series: 'B', prefix: 'B16', from: 1, to: 99999999, nextNumber: 1, length: 8, authorizedAt: '', validUntil: '', default: false, useInvoice: true, usePos: false, useCreditNote: false, branchCode: '', notes: '', status: 'Activo' },
  { id: 'NCF-B17', type: 'B17 Pagos al exterior', description: 'Pagos al exterior', series: 'B', prefix: 'B17', from: 1, to: 99999999, nextNumber: 1, length: 8, authorizedAt: '', validUntil: '', default: false, useInvoice: false, usePos: false, useCreditNote: false, branchCode: '', notes: '', status: 'Activo' },
]

function clean(value) {
  return String(value ?? '').toLowerCase().trim()
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value
  if (value === 'Si') return true
  if (value === 'No') return false
  return fallback
}

export function ncfPrefixFromType(typeOrPrefix = '') {
  const raw = String(typeOrPrefix || '').trim()
  const match = raw.match(/B\d{2}/i)
  if (match) return match[0].toUpperCase()

  const text = clean(raw)
  if (text.includes('credito fiscal')) return 'B01'
  if (text.includes('consumidor')) return 'B02'
  if (text.includes('debito')) return 'B03'
  if (text.includes('credito')) return 'B04'
  if (text.includes('regimen')) return 'B14'
  if (text.includes('gubernamental')) return 'B15'
  if (text.includes('export')) return 'B16'
  if (text.includes('exterior')) return 'B17'
  return raw.toUpperCase()
}

export function normalizeNcfSequence(sequence = {}) {
  const prefix = ncfPrefixFromType(sequence.prefix || sequence.type || 'B02') || 'B02'
  const type = sequence.type || ncfReceiptTypes.find((item) => item.startsWith(prefix)) || `${prefix} Comprobante fiscal`
  const from = toNumber(sequence.from ?? sequence.start ?? sequence.initialNumber) || 1
  const to = toNumber(sequence.to ?? sequence.end ?? sequence.finalNumber) || 99999999
  const nextNumber = toNumber(sequence.nextNumber ?? sequence.next ?? sequence.proximo) || from
  const length = toNumber(sequence.length ?? sequence.longitud) || 8

  return {
    id: sequence.id || `NCF-${prefix}-${sequence.branchCode || sequence.branch || 'GENERAL'}`,
    type,
    description: sequence.description || sequence.descripcion || type.replace(prefix, '').trim(),
    series: sequence.series || sequence.serie || prefix.slice(0, 1),
    prefix,
    from,
    to,
    nextNumber,
    length,
    authorizedAt: sequence.authorizedAt || sequence.authorizationDate || sequence.fechaAutorizacion || '',
    validUntil: sequence.validUntil || sequence.ncfValidUntil || sequence.validoHasta || '',
    default: normalizeBoolean(sequence.default, false),
    useInvoice: normalizeBoolean(sequence.useInvoice ?? sequence.usingInvoice, true),
    usePos: normalizeBoolean(sequence.usePos ?? sequence.usingPos, true),
    useCreditNote: normalizeBoolean(sequence.useCreditNote ?? sequence.usingCreditNote, prefix === 'B04'),
    branchCode: sequence.branchCode || sequence.branch || sequence.sucursal || '',
    notes: sequence.notes || sequence.observations || sequence.observaciones || '',
    status: sequence.status || 'Activo',
    createdAt: sequence.createdAt || new Date().toISOString(),
    updatedAt: sequence.updatedAt || '',
  }
}

export function getNcfSequences() {
  const saved = readArray(NCF_SEQUENCES_KEY)
  if (saved.length > 0) return saved.map(normalizeNcfSequence)
  writeStorage(NCF_SEQUENCES_KEY, defaultNcfSequences)
  return defaultNcfSequences.map(normalizeNcfSequence)
}

export function saveNcfSequences(sequences) {
  return writeStorage(NCF_SEQUENCES_KEY, sequences.map(normalizeNcfSequence))
}

export function getUsedNcfs() {
  return readArray(NCF_USED_KEY)
}

export function saveUsedNcfs(records) {
  return writeStorage(NCF_USED_KEY, records)
}

export function formatNcf(sequence, number = sequence?.nextNumber) {
  const normalized = normalizeNcfSequence(sequence)
  return `${normalized.prefix}${String(toNumber(number)).padStart(normalized.length, '0')}`
}

export function validateNcfSequence(sequence = {}) {
  const normalized = normalizeNcfSequence(sequence)
  const errors = []
  const todayTime = new Date(today()).getTime()
  const validUntilTime = normalized.validUntil ? new Date(normalized.validUntil).getTime() : null

  if (!normalized.type) errors.push('Tipo de comprobante obligatorio')
  if (!normalized.prefix) errors.push('Prefijo obligatorio')
  if (normalized.nextNumber > normalized.to) errors.push('Proximo numero mayor al numero final')
  if (normalized.from > normalized.to) errors.push('Numero inicial mayor al numero final')
  if (validUntilTime && validUntilTime < todayTime) errors.push('Secuencia vencida')

  return { valid: errors.length === 0, errors, sequence: normalized }
}

export function getActiveNcfSequence(tipoComprobante = '', sucursal = '') {
  const prefix = ncfPrefixFromType(tipoComprobante)
  const branch = clean(sucursal)
  const candidates = getNcfSequences()
    .filter((sequence) => sequence.status === 'Activo')
    .filter((sequence) => !prefix || sequence.prefix === prefix || clean(sequence.type).includes(clean(tipoComprobante)))
    .filter((sequence) => !branch || !sequence.branchCode || clean(sequence.branchCode) === branch)
    .sort((a, b) => {
      if (a.branchCode && !b.branchCode) return -1
      if (!a.branchCode && b.branchCode) return 1
      if (a.default && !b.default) return -1
      if (!a.default && b.default) return 1
      return a.nextNumber - b.nextNumber
    })

  const sequence = candidates[0] || null
  if (!sequence) return null
  return validateNcfSequence(sequence).valid ? sequence : null
}

export function findNcfSequence(typeOrPrefix = '', sucursal = '') {
  return getActiveNcfSequence(typeOrPrefix, sucursal)
}

export function previewNextNcf(tipoComprobante = '', sucursal = '') {
  const sequence = getActiveNcfSequence(tipoComprobante, sucursal)
  if (!sequence) {
    return { ncf: '', validUntil: '', sequence: null, error: 'No hay secuencia NCF activa y disponible para este tipo de comprobante.' }
  }

  const ncf = formatNcf(sequence, Math.max(sequence.nextNumber, sequence.from))
  return { ncf, validUntil: sequence.validUntil || '', sequence, error: '' }
}

export function peekNextNcf(typeOrPrefix = '', sucursal = '') {
  return previewNextNcf(typeOrPrefix, sucursal).ncf
}

export function markNcfAsUsed(ncf, documentId = '', documentType = '', data = {}) {
  if (!ncf) return null
  const used = getUsedNcfs()
  const existing = used.find((record) => record.ncf === ncf)
  const record = {
    id: existing?.id || makeId('ncf-used'),
    ncf,
    tipoComprobante: data.tipoComprobante || data.receiptType || ncf.slice(0, 3),
    fecha: data.fecha || today(),
    documentoRelacionado: documentId || data.documentId || '',
    moduloOrigen: data.moduloOrigen || data.sourceModule || 'Facturacion',
    clienteProveedor: data.clienteProveedor || data.customer || data.supplier || '',
    total: toNumber(data.total),
    estado: data.estado || existing?.estado || 'usado',
    usuario: data.usuario || data.user || 'Sistema',
    documentType,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const next = existing ? used.map((item) => (item.ncf === ncf ? record : item)) : [record, ...used]
  saveUsedNcfs(next)
  return record
}

export function generateNextNcf(tipoComprobante = '', sucursal = '', data = {}) {
  const preview = previewNextNcf(tipoComprobante, sucursal)
  if (!preview.ncf) return preview

  const used = getUsedNcfs()
  if (used.some((record) => record.ncf === preview.ncf)) {
    return { ncf: '', validUntil: preview.validUntil, sequence: preview.sequence, error: `El NCF ${preview.ncf} ya fue usado.` }
  }

  const sequence = preview.sequence
  const sequences = getNcfSequences()
  const nextNumber = Math.max(sequence.nextNumber, sequence.from) + 1
  const status = nextNumber > sequence.to ? 'Agotada' : sequence.status
  saveNcfSequences(sequences.map((item) => (
    item.id === sequence.id ? { ...item, nextNumber, status, updatedAt: new Date().toISOString() } : item
  )))

  markNcfAsUsed(preview.ncf, data.documentId || data.documentoRelacionado || '', data.documentType || data.tipoDocumento || '', {
    ...data,
    tipoComprobante: sequence.type,
  })

  return { ...preview, sequence: { ...sequence, nextNumber, status } }
}

export function consumeNextNcf(typeOrPrefix = '', sucursal = '', data = {}) {
  return generateNextNcf(typeOrPrefix, sucursal, data)
}

export function getNcfWarnings() {
  const now = new Date(today()).getTime()
  return getNcfSequences().flatMap((sequence) => {
    const remaining = Math.max(toNumber(sequence.to) - toNumber(sequence.nextNumber) + 1, 0)
    const used = Math.max(toNumber(sequence.nextNumber) - toNumber(sequence.from), 0)
    const total = Math.max(toNumber(sequence.to) - toNumber(sequence.from) + 1, 1)
    const percentUsed = Math.min(100, Math.round((used / total) * 100))
    const validTime = sequence.validUntil ? new Date(sequence.validUntil).getTime() : null
    const daysToExpire = validTime ? Math.ceil((validTime - now) / 86400000) : null
    const warnings = []

    if (remaining <= 0 || sequence.status === 'Agotada') {
      warnings.push({ kind: 'agotada', priority: 'critica', message: `La secuencia ${sequence.type} esta agotada.`, remaining, daysToExpire, percentUsed, sequence })
    } else if (remaining < 10) {
      warnings.push({ kind: 'por-agotarse', priority: 'critica', message: `La secuencia ${sequence.type} tiene solo ${remaining} comprobantes disponibles.`, remaining, daysToExpire, percentUsed, sequence })
    } else if (remaining < 20) {
      warnings.push({ kind: 'por-agotarse', priority: 'alta', message: `La secuencia ${sequence.type} tiene solo ${remaining} comprobantes disponibles.`, remaining, daysToExpire, percentUsed, sequence })
    }

    if (daysToExpire !== null && daysToExpire < 0) {
      warnings.push({ kind: 'vencida', priority: 'critica', message: `La secuencia ${sequence.type} vencio el ${sequence.validUntil}.`, remaining, daysToExpire, percentUsed, sequence })
    } else if (daysToExpire !== null && daysToExpire < 15) {
      warnings.push({ kind: 'por-vencer', priority: 'alta', message: `La secuencia ${sequence.type} vence el ${sequence.validUntil}.`, remaining, daysToExpire, percentUsed, sequence })
    }

    return warnings
  })
}

export function createNcfSequence(records, data = {}) {
  const prefix = ncfPrefixFromType(data.prefix || data.type || 'B02') || 'B02'
  const base = normalizeNcfSequence({
    id: data.id || makeId('ncf'),
    type: data.type || ncfReceiptTypes.find((item) => item.startsWith(prefix)) || 'B02 Consumidor final',
    description: data.description || '',
    series: data.series || prefix.slice(0, 1),
    prefix,
    from: data.from || 1,
    to: data.to || 99999999,
    nextNumber: data.nextNumber || data.from || 1,
    length: data.length || 8,
    authorizedAt: data.authorizedAt || '',
    validUntil: data.validUntil || today(),
    default: Boolean(data.default),
    useInvoice: data.useInvoice ?? true,
    usePos: data.usePos ?? true,
    useCreditNote: data.useCreditNote ?? prefix === 'B04',
    branchCode: data.branchCode || '',
    notes: data.notes || '',
    status: data.status || 'Activo',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || '',
  })

  const existingIds = new Set((records || []).map((record) => record.id))
  return existingIds.has(base.id) ? base : { ...base, id: data.id || makeId('ncf') }
}
