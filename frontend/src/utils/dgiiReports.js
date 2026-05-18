import { readArray, toNumber, today, writeStorage } from './accountingEntries.js'

export const DGII_606_KEY = 'invefat_dgii_606'
export const DGII_607_KEY = 'invefat_dgii_607'

function periodFromDate(dateValue = today()) {
  const clean = String(dateValue || today()).slice(0, 7)
  return clean.replace('-', '')
}

function idType(fiscalId = '') {
  const digits = String(fiscalId || '').replace(/\D/g, '')
  if (digits.length === 9) return '1'
  if (digits.length === 11) return '2'
  return '3'
}

function invoiceTotal(invoice) {
  return toNumber(invoice.total || invoice.amount || invoice.totals?.total)
}

function invoiceTax(invoice) {
  return toNumber(invoice.itbis || invoice.tax || invoice.taxAmount || invoice.totals?.taxTotal)
}

export function buildDgii606(period = periodFromDate()) {
  const supplierInvoices = readArray('invefat_supplier_invoices')
  const receipts = readArray('invefat_warehouse_receipts').filter((receipt) => receipt.hasSupplierInvoice === 'Si' || receipt.supplierNcf)
  const source = [
    ...supplierInvoices.map((invoice) => ({ ...invoice, source: 'Factura proveedor' })),
    ...receipts.map((receipt) => ({ ...receipt, source: 'Recepcion de mercancia' })),
  ]

  return source
    .filter((item) => periodFromDate(item.supplierInvoiceDate || item.date) === period)
    .map((item) => {
      const ncf = item.supplierNcf || item.ncf || ''
      const fiscalId = item.supplierFiscalId || item.fiscalId || item.rnc || ''
      const total = invoiceTotal(item) || toNumber(item.supplierInvoiceAmount)
      const tax = invoiceTax(item) || toNumber(item.supplierInvoiceTax)
      return {
        id: `606-${item.number || item.supplierInvoiceNumber || ncf}`,
        periodo: period,
        rncProveedor: fiscalId,
        tipoIdentificacion: idType(fiscalId),
        tipoBienServicio: item.goodsType || '09',
        ncfProveedor: ncf,
        ncfModificado: item.modifiedNcf || '',
        fechaComprobante: item.supplierInvoiceDate || item.date || '',
        fechaPago: item.paymentDate || '',
        montoFacturado: total,
        itbisFacturado: tax,
        itbisRetenido: toNumber(item.withheldItbis),
        itbisProporcionalidad: toNumber(item.proportionalItbis),
        itbisCosto: toNumber(item.costItbis),
        itbisAdelantar: Math.max(tax - toNumber(item.costItbis), 0),
        retencionRenta: toNumber(item.incomeTaxWithholding),
        tipoRetencion: item.withholdingType || '',
        propinaLegal: toNumber(item.legalTip),
        formaPago: item.paymentMethod || item.supplierPaymentMethod || 'Credito',
        estado: ncf && fiscalId ? 'Listo' : 'Con errores',
        fuente: item.source,
        errores: [
          !ncf ? 'Falta NCF proveedor' : '',
          !fiscalId ? 'Falta RNC proveedor' : '',
        ].filter(Boolean),
      }
    })
}

export function buildDgii607(period = periodFromDate()) {
  const invoices = readArray('invefat_sales_invoices')
  const creditNotes = readArray('invefat_sales_credit_notes')
  const source = [
    ...invoices.map((invoice) => ({ ...invoice, source: 'Factura' })),
    ...creditNotes.map((note) => ({ ...note, source: 'Nota de credito', ncf: note.ncf || note.creditNcf })),
  ]

  return source
    .filter((item) => periodFromDate(item.date) === period)
    .map((item) => {
      const fiscalId = item.fiscalId || item.customerFiscalId || item.customerDocument || ''
      const ncf = item.ncf || ''
      const total = invoiceTotal(item) || toNumber(item.amount)
      const tax = invoiceTax(item)
      return {
        id: `607-${item.number || ncf}`,
        periodo: period,
        rncCliente: fiscalId,
        tipoIdentificacion: idType(fiscalId),
        ncfEmitido: ncf,
        ncfModificado: item.modifiedNcf || item.relatedNcf || '',
        tipoIngreso: item.incomeType || '01',
        fechaComprobante: item.date || '',
        fechaRetencion: item.retentionDate || '',
        montoFacturado: total,
        itbisFacturado: tax,
        itbisRetenidoTerceros: toNumber(item.thirdPartyItbisWithheld),
        itbisPercibido: toNumber(item.perceivedItbis),
        retencionRenta: toNumber(item.incomeTaxWithholding),
        isrPercibido: toNumber(item.perceivedIncomeTax),
        impuestoSelectivo: toNumber(item.selectiveTax),
        otrosImpuestos: toNumber(item.otherTaxes),
        propinaLegal: toNumber(item.legalTip),
        formaPago: item.paymentMethod || 'Contado',
        estado: ncf && fiscalId ? 'Listo' : 'Con errores',
        fuente: item.source,
        errores: [
          !ncf ? 'Falta NCF emitido' : '',
          !fiscalId ? 'Falta RNC cliente' : '',
        ].filter(Boolean),
      }
    })
}

export function saveDgii606(records) {
  return writeStorage(DGII_606_KEY, records)
}

export function saveDgii607(records) {
  return writeStorage(DGII_607_KEY, records)
}

export function currentPeriod() {
  return periodFromDate(today())
}
