import { makeId, readArray, toNumber, today, writeStorage } from './accountingEntries.js'

export const NCF_SEQUENCES_KEY = 'invefat_ncf_sequences'

export const defaultNcfSequences = [
  { id: 'NCF-B01', type: 'B01 Credito fiscal', prefix: 'B01', from: 1, to: 99999999, nextNumber: 1, validUntil: '', default: false, status: 'Activo' },
  { id: 'NCF-B02', type: 'B02 Consumidor final', prefix: 'B02', from: 1, to: 99999999, nextNumber: 1, validUntil: '', default: true, status: 'Activo' },
  { id: 'NCF-B14', type: 'B14 Regimen especial', prefix: 'B14', from: 1, to: 99999999, nextNumber: 1, validUntil: '', default: false, status: 'Activo' },
  { id: 'NCF-B15', type: 'B15 Gubernamental', prefix: 'B15', from: 1, to: 99999999, nextNumber: 1, validUntil: '', default: false, status: 'Activo' },
  { id: 'NCF-B04', type: 'B04 Nota de credito', prefix: 'B04', from: 1, to: 99999999, nextNumber: 1, validUntil: '', default: false, status: 'Activo' },
  { id: 'NCF-B03', type: 'B03 Nota de debito', prefix: 'B03', from: 1, to: 99999999, nextNumber: 1, validUntil: '', default: false, status: 'Activo' },
]

export function getNcfSequences() {
  const saved = readArray(NCF_SEQUENCES_KEY)
  if (saved.length > 0) return saved
  writeStorage(NCF_SEQUENCES_KEY, defaultNcfSequences)
  return defaultNcfSequences
}

export function saveNcfSequences(sequences) {
  return writeStorage(NCF_SEQUENCES_KEY, sequences)
}

function formatNcf(sequence, number) {
  return `${sequence.prefix}${String(number).padStart(8, '0')}`
}

export function findNcfSequence(typeOrPrefix = '') {
  const clean = String(typeOrPrefix || '').toLowerCase()
  const sequences = getNcfSequences()
  return sequences.find((sequence) => sequence.status !== 'Inactivo' && (
    String(sequence.type).toLowerCase().includes(clean) ||
    String(sequence.prefix).toLowerCase() === clean
  )) || sequences.find((sequence) => sequence.status !== 'Inactivo' && sequence.default) || sequences.find((sequence) => sequence.status !== 'Inactivo')
}

export function peekNextNcf(typeOrPrefix = '') {
  const sequence = findNcfSequence(typeOrPrefix)
  if (!sequence) return ''
  const next = Math.max(toNumber(sequence.nextNumber), toNumber(sequence.from) || 1)
  if (toNumber(sequence.to) > 0 && next > toNumber(sequence.to)) return ''
  return formatNcf(sequence, next)
}

export function consumeNextNcf(typeOrPrefix = '') {
  const sequences = getNcfSequences()
  const sequence = findNcfSequence(typeOrPrefix)
  if (!sequence) return { ncf: '', validUntil: '', sequence: null }

  const next = Math.max(toNumber(sequence.nextNumber), toNumber(sequence.from) || 1)
  const ncf = formatNcf(sequence, next)
  const updated = sequences.map((item) => (
    item.id === sequence.id
      ? { ...item, nextNumber: next + 1, updatedAt: new Date().toISOString() }
      : item
  ))
  saveNcfSequences(updated)
  return { ncf, validUntil: sequence.validUntil || '', sequence: { ...sequence, nextNumber: next + 1 } }
}

export function createNcfSequence(records, data = {}) {
  return {
    id: data.id || makeId('ncf'),
    type: data.type || 'B02 Consumidor final',
    prefix: data.prefix || 'B02',
    from: toNumber(data.from) || 1,
    to: toNumber(data.to) || 99999999,
    nextNumber: toNumber(data.nextNumber) || 1,
    validUntil: data.validUntil || today(),
    default: Boolean(data.default),
    status: data.status || 'Activo',
    createdAt: data.createdAt || new Date().toISOString(),
  }
}
