import { getUsedNcfs } from '../ncfGenerator.js'
import { validateElectronicTaxTotals } from './taxCalculator.js'

const REQUIRED_COMPANY_FIELDS = [
  ['rnc', 'RNC de la empresa'],
  ['razonSocial', 'razon social de la empresa'],
  ['direccion', 'direccion de la empresa'],
]

function clean(value) {
  return String(value ?? '').trim()
}

function normalizeRnc(value) {
  return clean(value).replace(/[-\s]/g, '')
}

function pickCompany(settings = {}) {
  const company = settings.company || settings.companyInfo || settings.business || settings.general || settings
  return {
    rnc: company.rnc || company.fiscalId || company.taxId || settings.rnc || settings.companyRnc,
    razonSocial: company.razonSocial || company.legalName || company.nombreComercial || company.name || settings.companyName,
    direccion: company.direccion || company.address || settings.address || settings.companyAddress,
    telefono: company.telefono || company.phone || settings.phone,
  }
}

function pickCustomer(invoice = {}) {
  return {
    name: invoice.customer || invoice.customerName || invoice.razonSocialCliente || invoice.clientName,
    rnc: invoice.rncCliente || invoice.fiscalId || invoice.customerRnc || invoice.clientRnc,
    address: invoice.customerAddress || invoice.clientAddress,
  }
}

function isCreditFiscal(invoice = {}) {
  const type = clean(invoice.tipoComprobante || invoice.receiptType || invoice.receiptName).toUpperCase()
  return type.includes('B01') || type.includes('CREDITO FISCAL') || type.includes('CRÉDITO FISCAL')
}

export function validateElectronicDocument(invoice = {}, settings = {}, existingDocuments = []) {
  const errors = []
  const warnings = []
  const company = pickCompany(settings)
  const customer = pickCustomer(invoice)

  REQUIRED_COMPANY_FIELDS.forEach(([field, label]) => {
    if (!clean(company[field])) errors.push(`Falta ${label}.`)
  })

  if (!clean(invoice.ncf || invoice.eNcf)) {
    errors.push('La factura no tiene NCF/e-NCF asignado.')
  }

  if (!clean(customer.name)) {
    errors.push('La factura no tiene cliente o razon social del cliente.')
  }

  if (isCreditFiscal(invoice) && !normalizeRnc(customer.rnc)) {
    errors.push('El comprobante B01 requiere RNC del cliente.')
  }

  const taxValidation = validateElectronicTaxTotals(invoice)
  errors.push(...taxValidation.errors)
  warnings.push(...taxValidation.warnings)

  const ncf = clean(invoice.ncf || invoice.eNcf)
  if (ncf) {
    const existsInDocuments = existingDocuments.some((document) => clean(document.ncf || document.eNcf) === ncf && clean(document.invoiceNumber) !== clean(invoice.number))
    const existsInUsed = getUsedNcfs().some((record) => clean(record.ncf) === ncf && clean(record.documentId) !== clean(invoice.number))
    if (existsInDocuments || existsInUsed) {
      warnings.push('El NCF ya existe en historial. Verifique que no sea una reemision duplicada.')
    }
  }

  if (!settings?.electronicBilling?.certificateConfigured) {
    warnings.push('Certificado digital no configurado. La firma real debe realizarse en backend seguro.')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    company,
    customer,
    totals: taxValidation.totals,
  }
}

export { normalizeRnc }
