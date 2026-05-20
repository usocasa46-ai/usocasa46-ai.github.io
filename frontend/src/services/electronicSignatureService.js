import { nowIso, readStorage, writeStorage } from '../utils/accountingEntries.js'

export const ELECTRONIC_CERTIFICATE_KEY = 'invefat_electronic_certificate'

export function getCertificateConfig() {
  return readStorage(ELECTRONIC_CERTIFICATE_KEY, {
    name: '',
    holder: '',
    holderRnc: '',
    issuer: '',
    issuedAt: '',
    expiresAt: '',
    status: 'pendiente',
    certificateFileName: '',
    privateKeyReference: '',
    observations: '',
    updatedAt: '',
  })
}

export function saveCertificateConfig(config = {}) {
  const safeConfig = {
    ...getCertificateConfig(),
    ...config,
    privateKey: undefined,
    privateKeyContent: undefined,
    certificateContent: undefined,
    updatedAt: nowIso(),
  }
  writeStorage(ELECTRONIC_CERTIFICATE_KEY, safeConfig)
  return safeConfig
}

export function validateCertificateConfig(config = getCertificateConfig()) {
  const errors = []
  const warnings = []
  const today = new Date()
  const expires = config.expiresAt ? new Date(config.expiresAt) : null

  if (!config.name) warnings.push('Nombre de certificado pendiente.')
  if (!config.holderRnc) warnings.push('RNC del titular pendiente.')
  if (!config.expiresAt) warnings.push('Fecha de vencimiento pendiente.')
  if (expires && expires < today) errors.push('El certificado esta vencido.')
  if (!config.privateKeyReference) {
    warnings.push('La llave privada no debe guardarse en frontend. Configure firma segura en backend.')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    status: getCertificateStatus(config),
  }
}

export function prepareDocumentForSigning(document = {}) {
  const validation = validateCertificateConfig()
  return {
    ...document,
    electronicStatus: validation.valid ? 'Pendiente de firma' : 'Error tecnico',
    signingPreparedAt: nowIso(),
    signingMode: 'backend-required',
    signingMessage: validation.valid
      ? 'Documento preparado para firma digital segura en backend.'
      : validation.errors.join(' '),
  }
}

export function markAsSigned(document = {}, signedXmlContent = '') {
  return {
    ...document,
    electronicStatus: 'Firmado',
    signedXmlContent,
    signedAt: nowIso(),
    lastMessage: 'Documento marcado como firmado. Validar firma real en backend antes de produccion.',
  }
}

export function getCertificateStatus(config = getCertificateConfig()) {
  if (!config.expiresAt) return config.status || 'pendiente'
  const now = new Date()
  const expires = new Date(config.expiresAt)
  if (Number.isNaN(expires.getTime())) return config.status || 'pendiente'
  if (expires < now) return 'vencido'
  const days = Math.ceil((expires.getTime() - now.getTime()) / 86400000)
  if (days <= 30) return 'por vencer'
  return config.status || 'activo'
}
