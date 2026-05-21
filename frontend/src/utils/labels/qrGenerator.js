function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function hashText(value) {
  return Array.from(String(value || ''))
    .reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 7)
}

function finderPattern(x, y, size) {
  const unit = size
  return `
    <rect x="${x * unit}" y="${y * unit}" width="${7 * unit}" height="${7 * unit}" fill="#0f2742"/>
    <rect x="${(x + 1) * unit}" y="${(y + 1) * unit}" width="${5 * unit}" height="${5 * unit}" fill="#fff"/>
    <rect x="${(x + 2) * unit}" y="${(y + 2) * unit}" width="${3 * unit}" height="${3 * unit}" fill="#0f2742"/>
  `
}

export function buildQrPayload(data = {}) {
  return JSON.stringify({
    company_code: data.companyCode || data.company_code || '',
    product_id: data.productId || data.product_id || data.code || data.id || '',
    codigo: data.code || data.codigo || '',
    nombre: data.name || data.nombre || '',
    ubicacion: data.location || data.ubicacion || '',
    lote: data.lot || data.lote || '',
    type: data.type || 'product',
  })
}

export function buildQrSvg(payload, options = {}) {
  const text = String(payload || '')
  const modules = Number(options.modules || 25)
  const unit = Number(options.unit || 6)
  const quiet = Number(options.quiet || 2)
  const totalModules = modules + quiet * 2
  const size = totalModules * unit
  const seed = hashText(text)
  const cells = []

  for (let y = 0; y < modules; y += 1) {
    for (let x = 0; x < modules; x += 1) {
      const inFinder = (x < 8 && y < 8) || (x > modules - 9 && y < 8) || (x < 8 && y > modules - 9)
      if (inFinder) continue
      const char = text.charCodeAt((x + y * modules) % Math.max(text.length, 1)) || 0
      const value = (seed + x * 17 + y * 29 + char) % 9
      if (value < 4) {
        cells.push(`<rect x="${(x + quiet) * unit}" y="${(y + quiet) * unit}" width="${unit}" height="${unit}" fill="#0f2742"/>`)
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Codigo QR preparado">
    <title>${escapeXml(text)}</title>
    <rect width="${size}" height="${size}" rx="10" fill="#fff"/>
    <g transform="translate(${quiet * unit} ${quiet * unit})">
      ${finderPattern(0, 0, unit)}
      ${finderPattern(modules - 7, 0, unit)}
      ${finderPattern(0, modules - 7, unit)}
    </g>
    ${cells.join('')}
  </svg>`
}

export function qrSvgToDataUri(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function qrDataUri(payload, options = {}) {
  return qrSvgToDataUri(buildQrSvg(payload, options))
}
