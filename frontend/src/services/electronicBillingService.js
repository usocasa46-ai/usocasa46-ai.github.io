import {
  makeId,
  nowIso,
  readArray,
  readStorage,
  toNumber,
  today,
  writeStorage,
} from '../utils/accountingEntries.js'
import { getCurrentCompanyCode } from './companyStorage.js'
import { sendElectronicDocument } from './dgiiElectronicService.js'
import { prepareDocumentForSigning, markAsSigned } from './electronicSignatureService.js'
import { buildEcfXml } from '../utils/electronicBilling/ecfXmlBuilder.js'
import { buildPrintedRepresentation } from '../utils/electronicBilling/printedRepresentation.js'
import { validateElectronicDocument } from '../utils/electronicBilling/electronicValidation.js'

export const ELECTRONIC_KEYS = {
  issued: 'invefat_electronic_documents',
  received: 'invefat_electronic_received_documents',
  commercialResponses: 'invefat_electronic_commercial_responses',
  archive: 'invefat_electronic_archive',
  contingencyQueue: 'invefat_electronic_contingency_queue',
  usage: 'invefat_electronic_usage',
  alerts: 'invefat_alerts',
  notifications: 'invefat_notifications',
}

function clean(value) {
  return String(value ?? '').trim()
}

function getMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7)
}

function securityCode(seed = '') {
  const text = `${seed}-${Date.now()}-${Math.random()}`
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash).toString(36).toUpperCase().padStart(8, '0').slice(0, 10)
}

function addYears(dateValue, years) {
  const date = dateValue ? new Date(dateValue) : new Date()
  if (Number.isNaN(date.getTime())) return ''
  date.setFullYear(date.getFullYear() + years)
  return date.toISOString().slice(0, 10)
}

function readUsage() {
  return readStorage(ELECTRONIC_KEYS.usage, {
    monthlyLimit: 0,
    blockAtLimit: false,
    months: {},
  })
}

function saveUsage(usage) {
  return writeStorage(ELECTRONIC_KEYS.usage, usage)
}

function addSystemNotice(priority, title, description, reference = '') {
  const now = nowIso()
  const alert = {
    id: makeId('ecf-alert'),
    fecha: now,
    tipo: 'Facturacion electronica',
    modulo: 'Finanzas / Contabilidad',
    submodulo: 'Facturacion Electronica',
    titulo: title,
    descripcion: description,
    prioridad: priority,
    estado: 'pendiente',
    referencia: reference,
    accionSugerida: 'Ver documento electronico',
    usuario: 'Sistema',
    fechaAtendida: '',
  }
  const notification = {
    id: makeId('ecf-note'),
    title,
    description,
    createdAt: now,
    priority,
    status: 'pendiente',
    module: 'Facturacion Electronica',
    reference,
  }

  writeStorage(ELECTRONIC_KEYS.alerts, [alert, ...readArray(ELECTRONIC_KEYS.alerts)])
  writeStorage(ELECTRONIC_KEYS.notifications, [notification, ...readArray(ELECTRONIC_KEYS.notifications)])
}

export function getIssuedElectronicDocuments() {
  return readArray(ELECTRONIC_KEYS.issued)
}

export function saveIssuedElectronicDocuments(documents = []) {
  return writeStorage(ELECTRONIC_KEYS.issued, documents)
}

export function getReceivedElectronicDocuments() {
  return readArray(ELECTRONIC_KEYS.received)
}

export function saveReceivedElectronicDocuments(documents = []) {
  return writeStorage(ELECTRONIC_KEYS.received, documents)
}

export function getElectronicArchive() {
  return readArray(ELECTRONIC_KEYS.archive)
}

export function getElectronicUsage() {
  return readUsage()
}

export function incrementElectronicUsage(document = {}) {
  const usage = readUsage()
  const month = getMonthKey(new Date(document.date || document.createdAt || Date.now()))
  const current = usage.months?.[month] || { issued: 0, creditNotes: 0, debitNotes: 0, total: 0 }
  const type = clean(document.documentType || document.ecfType).toLowerCase()
  const nextCurrent = {
    ...current,
    issued: current.issued + (type.includes('nota credito') ? 0 : 1),
    creditNotes: current.creditNotes + (type.includes('nota credito') ? 1 : 0),
    debitNotes: current.debitNotes + (type.includes('nota debito') ? 1 : 0),
    total: current.total + 1,
  }
  const nextUsage = {
    ...usage,
    months: {
      ...(usage.months || {}),
      [month]: nextCurrent,
    },
    lastUpdatedAt: nowIso(),
  }
  saveUsage(nextUsage)

  const limit = toNumber(nextUsage.monthlyLimit)
  if (limit > 0) {
    const percent = Math.round((nextCurrent.total / limit) * 100)
    if (percent >= 100) addSystemNotice('critica', 'Limite mensual e-CF agotado', `La empresa alcanzo el ${percent}% del limite mensual de documentos electronicos.`, month)
    else if (percent >= 90) addSystemNotice('alta', 'Limite mensual e-CF al 90%', `La empresa alcanzo el ${percent}% del limite mensual de documentos electronicos.`, month)
    else if (percent >= 80) addSystemNotice('media', 'Limite mensual e-CF al 80%', `La empresa alcanzo el ${percent}% del limite mensual de documentos electronicos.`, month)
  }

  return nextUsage
}

function archiveDocument(document = {}) {
  const archive = getElectronicArchive()
  const record = {
    id: document.archiveId || makeId('ecf-archive'),
    documentId: document.id,
    invoiceNumber: document.invoiceNumber,
    ncf: document.ncf,
    type: document.ecfType,
    xmlOriginal: document.xmlContent || '',
    xmlSigned: document.signedXmlContent || '',
    printedRepresentation: document.printedRepresentation?.htmlContent || '',
    dgiiResponse: document.dgiiResponse || null,
    acknowledgement: document.acknowledgement || null,
    commercialApproval: document.commercialApproval || null,
    finalStatus: document.electronicStatus,
    integrityHash: securityCode(`${document.id}-${document.ncf}`),
    issuedAt: document.date || today(),
    archivedAt: nowIso(),
    retentionUntil: addYears(document.date || today(), 10),
    history: document.history || [],
  }
  const next = [record, ...archive.filter((item) => item.documentId !== document.id)]
  writeStorage(ELECTRONIC_KEYS.archive, next)
  return record
}

export function registerIssuedElectronicDocument(invoice = {}, settings = {}, options = {}) {
  if (!clean(invoice.ncf || invoice.eNcf)) return null

  const documents = getIssuedElectronicDocuments()
  const existing = documents.find((document) => document.invoiceNumber === invoice.number || document.ncf === invoice.ncf)
  const validation = validateElectronicDocument(invoice, settings, documents)
  const documentId = existing?.id || makeId('ecf-issued')
  const xml = validation.valid ? buildEcfXml(invoice, settings, { documentId }) : { xmlContent: '', xmlGeneratedAt: '', xmlVersion: '' }
  const security = existing?.securityCode || securityCode(invoice.ncf || invoice.number)
  const baseDocument = {
    id: documentId,
    companyCode: getCurrentCompanyCode(),
    date: invoice.date || invoice.createdAt || today(),
    companyName: validation.company.razonSocial,
    companyRnc: validation.company.rnc,
    ecfType: invoice.tipoComprobante || invoice.receiptType || options.documentType || 'Factura',
    documentType: options.documentType || 'Factura',
    invoiceNumber: invoice.number || invoice.invoiceNumber,
    ncf: invoice.ncf || invoice.eNcf,
    customer: validation.customer.razonSocial,
    customerRnc: validation.customer.rnc,
    total: validation.totals.total,
    electronicStatus: validation.valid ? 'Pendiente de firma' : 'Error tecnico',
    securityCode: security,
    trackId: existing?.trackId || '',
    attempts: existing?.attempts || 0,
    lastMessage: validation.valid
      ? 'Documento electronico preparado. Pendiente de firma digital segura y envio.'
      : validation.errors.join(' '),
    validationErrors: validation.errors,
    validationWarnings: validation.warnings,
    sourceModule: options.sourceModule || 'Ventas',
    sourceInvoice: invoice,
    xmlContent: xml.xmlContent,
    xmlGeneratedAt: xml.xmlGeneratedAt,
    xmlVersion: xml.xmlVersion,
    createdAt: existing?.createdAt || nowIso(),
    updatedAt: nowIso(),
    history: [
      ...(existing?.history || []),
      { date: nowIso(), action: validation.valid ? 'Preparar e-CF' : 'Validacion con errores', user: invoice.seller || invoice.cashier || 'Sistema' },
    ],
  }
  const printedRepresentation = buildPrintedRepresentation(invoice, settings, baseDocument)
  const document = {
    ...baseDocument,
    printedRepresentation,
    qrData: printedRepresentation.qrData,
  }
  const nextDocuments = [document, ...documents.filter((item) => item.id !== document.id)]
  saveIssuedElectronicDocuments(nextDocuments)
  archiveDocument(document)
  if (!existing) incrementElectronicUsage(document)

  if (validation.valid) {
    addSystemNotice('media', 'Documento e-CF pendiente de firma', `La factura ${document.invoiceNumber} quedo preparada para firma y envio DGII.`, document.invoiceNumber)
  } else {
    addSystemNotice('alta', 'Documento e-CF con errores', `La factura ${document.invoiceNumber} tiene errores para e-CF.`, document.invoiceNumber)
  }
  if (!settings?.electronicBilling?.dgiiConfigured) {
    addSystemNotice('media', 'DGII no configurada', 'Facturacion electronica trabaja en modo preparacion/simulacion.', document.invoiceNumber)
  }

  return document
}

export function generateXmlForDocument(documentId, settings = {}) {
  const documents = getIssuedElectronicDocuments()
  const target = documents.find((document) => document.id === documentId)
  if (!target) return null
  const xml = buildEcfXml(target.sourceInvoice || target, settings, { documentId: target.id })
  const updated = {
    ...target,
    ...xml,
    electronicStatus: 'XML generado',
    lastMessage: 'XML base generado correctamente.',
    updatedAt: nowIso(),
  }
  saveIssuedElectronicDocuments([updated, ...documents.filter((document) => document.id !== documentId)])
  archiveDocument(updated)
  return updated
}

export function prepareSigningForDocument(documentId) {
  const documents = getIssuedElectronicDocuments()
  const target = documents.find((document) => document.id === documentId)
  if (!target) return null
  const updated = prepareDocumentForSigning(target)
  saveIssuedElectronicDocuments([updated, ...documents.filter((document) => document.id !== documentId)])
  return updated
}

export function markDocumentAsSigned(documentId) {
  const documents = getIssuedElectronicDocuments()
  const target = documents.find((document) => document.id === documentId)
  if (!target) return null
  const updated = markAsSigned(target, target.xmlContent)
  saveIssuedElectronicDocuments([updated, ...documents.filter((document) => document.id !== documentId)])
  archiveDocument(updated)
  return updated
}

export async function simulateSendIssuedDocument(documentId) {
  const documents = getIssuedElectronicDocuments()
  const target = documents.find((document) => document.id === documentId)
  if (!target) return null
  const response = await sendElectronicDocument(target)
  const updated = {
    ...target,
    electronicStatus: response.status || 'Enviado a DGII',
    trackId: response.trackId || target.trackId,
    attempts: toNumber(target.attempts) + 1,
    dgiiResponse: response,
    lastMessage: response.message,
    sentAt: response.sentAt || nowIso(),
    updatedAt: nowIso(),
  }
  saveIssuedElectronicDocuments([updated, ...documents.filter((document) => document.id !== documentId)])
  archiveDocument(updated)
  return updated
}

export function registerReceivedElectronicDocument(data = {}) {
  const documents = getReceivedElectronicDocuments()
  const document = {
    id: data.id || makeId('ecf-received'),
    provider: data.provider || '',
    providerRnc: data.providerRnc || '',
    ncf: data.ncf || data.eNcf || '',
    issuedAt: data.issuedAt || today(),
    receivedAt: data.receivedAt || today(),
    total: toNumber(data.total),
    itbis: toNumber(data.itbis),
    receptionStatus: data.receptionStatus || 'Pendiente',
    commercialStatus: data.commercialStatus || 'Pendiente de revision',
    xmlReceived: data.xmlReceived || '',
    acknowledgementStatus: data.acknowledgementStatus || 'Pendiente',
    commercialResponseSent: Boolean(data.commercialResponseSent),
    observations: data.observations || '',
    createdAt: data.createdAt || nowIso(),
    updatedAt: nowIso(),
  }
  saveReceivedElectronicDocuments([document, ...documents.filter((item) => item.id !== document.id)])
  return document
}

export function generateReceiptAcknowledgement(documentId) {
  const documents = getReceivedElectronicDocuments()
  const target = documents.find((document) => document.id === documentId)
  if (!target) return null
  const updated = {
    ...target,
    acknowledgementStatus: 'Acuse generado',
    acknowledgement: {
      id: makeId('acuse'),
      generatedAt: nowIso(),
      status: 'Acuse generado',
      message: 'Acuse preparado en modo simulacion.',
    },
    updatedAt: nowIso(),
  }
  saveReceivedElectronicDocuments([updated, ...documents.filter((document) => document.id !== documentId)])
  return updated
}

export function saveCommercialResponse(response = {}) {
  const responses = readArray(ELECTRONIC_KEYS.commercialResponses)
  const record = {
    id: response.id || makeId('ecf-response'),
    documentId: response.documentId || '',
    provider: response.provider || '',
    amount: toNumber(response.amount),
    status: response.status || 'Pendiente de revision',
    rejectionReason: response.rejectionReason || '',
    responseDate: response.responseDate || today(),
    user: response.user || 'Administrador',
    sent: Boolean(response.sent),
    createdAt: response.createdAt || nowIso(),
    updatedAt: nowIso(),
  }
  writeStorage(ELECTRONIC_KEYS.commercialResponses, [record, ...responses.filter((item) => item.id !== record.id)])
  return record
}

export function getCommercialResponses() {
  return readArray(ELECTRONIC_KEYS.commercialResponses)
}

export function getContingencyQueue() {
  return readArray(ELECTRONIC_KEYS.contingencyQueue)
}

export function activateContingencyMode(reason = '') {
  const queue = getContingencyQueue()
  const marker = {
    id: makeId('contingency'),
    type: 'mode',
    status: 'Modo contingencia activo',
    reason,
    createdAt: nowIso(),
  }
  writeStorage(ELECTRONIC_KEYS.contingencyQueue, [marker, ...queue])
  addSystemNotice('alta', 'Modo contingencia e-CF activo', reason || 'Facturacion electronica operando en contingencia.', marker.id)
  return marker
}

export function queueDocumentForLaterSend(document = {}) {
  const queue = getContingencyQueue()
  const queued = {
    id: makeId('contingency-doc'),
    documentId: document.id,
    invoiceNumber: document.invoiceNumber,
    ncf: document.ncf,
    status: 'Pendiente de sincronizar',
    reason: document.reason || 'Documento pendiente de envio por contingencia.',
    queuedAt: nowIso(),
  }
  writeStorage(ELECTRONIC_KEYS.contingencyQueue, [queued, ...queue])
  return queued
}

export function closeContingencyMode() {
  const queue = getContingencyQueue()
  const closed = queue.map((item) => item.type === 'mode' && item.status === 'Modo contingencia activo'
    ? { ...item, status: 'Cerrado', closedAt: nowIso() }
    : item)
  writeStorage(ELECTRONIC_KEYS.contingencyQueue, closed)
  return closed
}

export function retryPendingDocuments() {
  const queue = getContingencyQueue()
  const updated = queue.map((item) => item.status === 'Pendiente de sincronizar'
    ? { ...item, status: 'Reintento programado', retryAt: nowIso() }
    : item)
  writeStorage(ELECTRONIC_KEYS.contingencyQueue, updated)
  return updated
}
