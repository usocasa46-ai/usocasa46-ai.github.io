function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function hashText(value) {
  return Array.from(String(value || ''))
    .reduce((hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) >>> 0, 2166136261)
}

export function generateBarcodeValue(product = {}) {
  const base = String(product.barcode || product.code || product.id || product.name || Date.now()).replace(/\W/g, '').toUpperCase()
  if (base.length >= 8) return base.slice(0, 18)
  const suffix = String(hashText(base)).padStart(10, '0')
  return `${base}${suffix}`.slice(0, 12)
}

export function buildBarcodeSvg(value, options = {}) {
  const text = String(value || '').trim() || 'SIN-CODIGO'
  const width = Number(options.width || 260)
  const height = Number(options.height || 82)
  const barHeight = Number(options.barHeight || 52)
  const seed = hashText(text)
  const modules = []
  let cursor = 14

  for (let index = 0; index < text.length * 5 + 18; index += 1) {
    const bit = (seed + index * 37 + text.charCodeAt(index % text.length)) % 7
    const barWidth = bit % 3 === 0 ? 3 : bit % 2 === 0 ? 2 : 1
    const gap = bit % 4 === 0 ? 2 : 1
    if (bit !== 1) {
      modules.push(`<rect x="${cursor}" y="8" width="${barWidth}" height="${barHeight}" rx="0.4" fill="#0f2742" />`)
    }
    cursor += barWidth + gap
    if (cursor > width - 18) break
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Codigo de barra ${escapeXml(text)}">
    <rect width="${width}" height="${height}" rx="8" fill="#fff"/>
    ${modules.join('')}
    <text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#10243a">${escapeXml(text)}</text>
  </svg>`
}

export function svgToDataUri(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function barcodeDataUri(value, options = {}) {
  return svgToDataUri(buildBarcodeSvg(value, options))
}
