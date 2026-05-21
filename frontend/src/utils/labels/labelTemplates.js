export const LABEL_TEMPLATES = [
  { id: 'small-50x30', name: 'Etiqueta 50x30 mm', widthMm: 50, heightMm: 30, columns: 3 },
  { id: 'medium-60x40', name: 'Etiqueta 60x40 mm', widthMm: 60, heightMm: 40, columns: 3 },
  { id: 'large-80x50', name: 'Etiqueta 80x50 mm', widthMm: 80, heightMm: 50, columns: 2 },
  { id: 'letter-sheet', name: 'Hoja carta con multiples etiquetas', widthMm: 66, heightMm: 34, columns: 3 },
  { id: 'thermal-ticket', name: 'Ticket termico', widthMm: 72, heightMm: 38, columns: 1 },
  { id: 'box-large', name: 'Etiqueta de caja grande', widthMm: 100, heightMm: 70, columns: 2 },
]

export const DEFAULT_LABEL_SETTINGS = {
  templateId: 'medium-60x40',
  showLogo: true,
  showPrice: true,
  showQr: true,
  showBarcode: true,
  showLot: false,
  showExpiration: false,
  quantityMode: 'manual',
  manualQuantity: 1,
}

export function getTemplateById(templateId) {
  return LABEL_TEMPLATES.find((template) => template.id === templateId) || LABEL_TEMPLATES[1]
}

export function normalizeLabelSettings(settings = {}) {
  return {
    ...DEFAULT_LABEL_SETTINGS,
    ...(settings || {}),
    manualQuantity: Math.max(1, Number(settings.manualQuantity || DEFAULT_LABEL_SETTINGS.manualQuantity)),
  }
}
