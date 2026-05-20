function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function getLines(document = {}) {
  return Array.isArray(document.lines)
    ? document.lines
    : Array.isArray(document.products)
      ? document.products
      : []
}

export function calculateElectronicTaxes(document = {}) {
  const lines = getLines(document)
  const lineDetails = lines.map((line, index) => {
    const quantity = toNumber(line.quantity ?? line.qty ?? line.cantidad)
    const price = toNumber(line.price ?? line.precio)
    const discount = Math.min(toNumber(line.discount ?? line.descuento), quantity * price)
    const taxRate = toNumber(line.taxRate ?? line.tax ?? line.itbisRate ?? line.impuesto)
    const taxable = Math.max(quantity * price - discount, 0)
    const tax = taxable * (taxRate / 100)
    const total = taxable + tax

    return {
      lineNumber: index + 1,
      code: line.code || line.codigo || '',
      name: line.name || line.description || line.descripcion || 'Producto sin descripcion',
      description: line.name || line.description || line.descripcion || 'Producto sin descripcion',
      unit: line.unit || line.unidad || 'UND',
      quantity,
      price,
      discount,
      taxRate,
      taxable,
      tax,
      total,
      exempt: taxRate <= 0,
    }
  })

  const subtotal = lineDetails.reduce((sum, line) => sum + line.quantity * line.price, 0)
  const discount = lineDetails.reduce((sum, line) => sum + line.discount, 0)
  const taxable = lineDetails.reduce((sum, line) => sum + line.taxable, 0)
  const itbis = lineDetails.reduce((sum, line) => sum + line.tax, 0)
  const exempt = lineDetails.filter((line) => line.exempt).reduce((sum, line) => sum + line.taxable, 0)
  const total = taxable + itbis
  const declaredTotal = toNumber(document.totals?.total ?? document.total)
  const declaredItbis = toNumber(document.totals?.taxTotal ?? document.totals?.tax ?? document.tax ?? document.itbis)

  return {
    lines: lineDetails,
    subtotal,
    discount,
    taxable,
    exempt,
    itbis,
    total,
    declaredTotal,
    declaredItbis,
    totalDifference: Math.abs(total - (declaredTotal || total)),
    itbisDifference: Math.abs(itbis - (declaredItbis || itbis)),
  }
}

export function validateElectronicTaxTotals(document = {}) {
  const taxes = calculateElectronicTaxes(document)
  const errors = []

  if (taxes.lines.length === 0) errors.push('El documento no tiene productos.')
  if (taxes.itbis < 0) errors.push('El ITBIS no puede ser negativo.')
  if (taxes.total < 0) errors.push('El total general no puede ser negativo.')
  if (taxes.declaredTotal && taxes.totalDifference > 1) errors.push('Los totales del documento no cuadran con el detalle.')
  if (taxes.declaredItbis && taxes.itbisDifference > 1) errors.push('El ITBIS declarado no cuadra con el detalle.')

  taxes.lines.forEach((line) => {
    if (!line.description || line.description === 'Producto sin descripcion') {
      errors.push(`La linea ${line.lineNumber} no tiene descripcion valida.`)
    }
  })

  return { valid: errors.length === 0, errors, warnings: [], totals: taxes, taxes }
}
