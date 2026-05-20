import { calculateElectronicTaxes } from './taxCalculator.js'

const XML_VERSION = 'e-CF-preparacion-1.0'

function clean(value) {
  return String(value ?? '').trim()
}

function escapeXml(value) {
  return clean(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function node(name, value, indent = '    ') {
  return `${indent}<${name}>${escapeXml(value)}</${name}>`
}

function pickCompany(settings = {}) {
  const company = settings.company || settings.companyInfo || settings.business || settings.general || settings
  return {
    rnc: company.rnc || company.fiscalId || company.taxId || settings.rnc || settings.companyRnc || '',
    razonSocial: company.razonSocial || company.legalName || company.nombreComercial || company.name || settings.companyName || 'INVE-FAT SYSTEM',
    direccion: company.direccion || company.address || settings.address || settings.companyAddress || '',
    telefono: company.telefono || company.phone || settings.phone || '',
    correo: company.correo || company.email || settings.email || '',
  }
}

function pickCustomer(invoice = {}) {
  return {
    rnc: invoice.rncCliente || invoice.fiscalId || invoice.customerRnc || invoice.clientRnc || '',
    razonSocial: invoice.razonSocialCliente || invoice.customer || invoice.customerName || invoice.clientName || 'Consumidor Final',
    direccion: invoice.customerAddress || invoice.clientAddress || '',
    telefono: invoice.customerPhone || invoice.clientPhone || '',
  }
}

export function buildEcfXml(invoice = {}, settings = {}, options = {}) {
  const company = pickCompany(settings)
  const customer = pickCustomer(invoice)
  const generatedAt = new Date().toISOString()
  const taxes = calculateElectronicTaxes(invoice)
  const lines = taxes.lines.length > 0 ? taxes.lines : calculateElectronicTaxes({ products: invoice.products || invoice.lines || [] }).lines
  const documentId = options.documentId || invoice.id || invoice.number || `ECF-${Date.now()}`

  const detailXml = lines.map((line, index) => [
    '    <Item>',
    node('NumeroLinea', index + 1, '      '),
    node('CodigoItem', line.code || `ITEM-${index + 1}`, '      '),
    node('DescripcionItem', line.name || line.description || 'Producto', '      '),
    node('CantidadItem', line.quantity, '      '),
    node('UnidadMedida', line.unit || line.unidad || 'UND', '      '),
    node('PrecioUnitario', line.price, '      '),
    node('DescuentoMonto', line.discount, '      '),
    node('ITBISMonto', line.tax, '      '),
    node('MontoItem', line.total, '      '),
    '    </Item>',
  ].join('\n')).join('\n')

  const xmlContent = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<ECFPreparacion version="${XML_VERSION}">`,
    '  <Encabezado>',
    node('TipoECF', invoice.tipoComprobante || invoice.receiptType || invoice.documentType || 'Factura', '    '),
    node('NCF', invoice.ncf || invoice.eNcf || '', '    '),
    node('NumeroFacturaInterno', invoice.number || invoice.invoiceNumber || '', '    '),
    node('FechaEmision', invoice.date || invoice.createdAt || generatedAt, '    '),
    node('FormaPago', invoice.paymentMethod || invoice.payment?.method || invoice.paymentType || '', '    '),
    node('Sucursal', invoice.branch || options.branch || '', '    '),
    node('Almacen', invoice.warehouse || options.warehouse || '', '    '),
    '  </Encabezado>',
    '  <Emisor>',
    node('RNCEmisor', company.rnc, '    '),
    node('RazonSocialEmisor', company.razonSocial, '    '),
    node('DireccionEmisor', company.direccion, '    '),
    node('TelefonoEmisor', company.telefono, '    '),
    node('CorreoEmisor', company.correo, '    '),
    '  </Emisor>',
    '  <Comprador>',
    node('RNCComprador', customer.rnc, '    '),
    node('RazonSocialComprador', customer.razonSocial, '    '),
    node('DireccionComprador', customer.direccion, '    '),
    node('TelefonoComprador', customer.telefono, '    '),
    '  </Comprador>',
    '  <Totales>',
    node('MontoGravadoTotal', taxes.taxable, '    '),
    node('MontoExento', taxes.exempt, '    '),
    node('Subtotal', taxes.subtotal, '    '),
    node('DescuentoTotal', taxes.discount, '    '),
    node('ITBISTotal', taxes.itbis, '    '),
    node('MontoTotal', taxes.total, '    '),
    '  </Totales>',
    '  <DetallesItems>',
    detailXml || '    <Item />',
    '  </DetallesItems>',
    '  <MetadataPreparacion>',
    node('DocumentoId', documentId, '    '),
    node('Usuario', invoice.seller || invoice.cashier || invoice.user || '', '    '),
    node('GeneradoEn', generatedAt, '    '),
    node('Nota', 'XML base de preparacion. Requiere especificacion oficial DGII, firma digital segura y validacion final.', '    '),
    '  </MetadataPreparacion>',
    '</ECFPreparacion>',
  ].join('\n')

  return {
    documentId,
    xmlContent,
    xmlGeneratedAt: generatedAt,
    xmlVersion: XML_VERSION,
  }
}

export { XML_VERSION }
