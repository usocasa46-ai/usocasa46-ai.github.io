const ACTIVE_LABELS = new Set(['activa', 'activo', 'active', 'programada', 'scheduled'])
const PAUSED_LABELS = new Set(['inactiva', 'inactivo', 'inactive', 'pausada', 'paused'])

export const PROMOTION_TYPES = [
  { id: 'percentage', label: 'Porcentaje de descuento' },
  { id: 'fixed', label: 'Monto fijo de descuento' },
  { id: 'special-price', label: 'Precio especial' },
  { id: 'two-for-one', label: '2x1' },
  { id: 'three-for-two', label: '3x2' },
  { id: 'buy-x-get-y', label: 'Compra X lleva Y' },
  { id: 'combo', label: 'Combo' },
  { id: 'coupon', label: 'Cupon' },
  { id: 'liquidation', label: 'Liquidacion' },
  { id: 'quantity', label: 'Oferta por cantidad' },
]

export const PROMOTION_STATUSES = ['Activa', 'Inactiva', 'Programada', 'Pausada']

function toNumber(value) {
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeCode(value) {
  return String(value || '').trim().toUpperCase()
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

function localDateValue(value) {
  return String(value || '').slice(0, 10)
}

function timeValue(value) {
  return String(value || '').slice(0, 5)
}

function lineBase(line) {
  return toNumber(line.quantity) * toNumber(line.price)
}

export function getPromotionTypeLabel(type) {
  return PROMOTION_TYPES.find((item) => item.id === type)?.label || type || 'Oferta'
}

export function normalizePromotion(record = {}) {
  const conditions = record.conditions && typeof record.conditions === 'object' ? record.conditions : {}
  const actions = record.actions && typeof record.actions === 'object' ? record.actions : {}
  const status = record.status || record.estado || 'Activa'

  return {
    id: record.id || `PROMO-${Date.now()}`,
    name: String(record.name || record.nombre || '').trim(),
    description: String(record.description || record.descripcion || '').trim(),
    type: record.type || record.tipo || 'percentage',
    status,
    startDate: record.startDate || record.start_date || '',
    endDate: record.endDate || record.end_date || '',
    startTime: record.startTime || record.start_time || '',
    endTime: record.endTime || record.end_time || '',
    priority: toNumber(record.priority ?? record.prioridad ?? 10),
    stackable: Boolean(record.stackable ?? record.combinable),
    application: record.application || record.aplicacion || 'all',
    products: normalizeList(record.products || record.productCodes || record.productos),
    categories: normalizeList(record.categories || record.categoryCodes || record.categorias),
    suppliers: normalizeList(record.suppliers || record.supplierCodes || record.proveedores),
    customers: normalizeList(record.customers || record.customerCodes || record.clientes),
    customerGroups: normalizeList(record.customerGroups || record.customer_groups || record.gruposClientes),
    couponCode: normalizeCode(record.couponCode || record.coupon_code || record.codigoCupon),
    maxUses: toNumber(record.maxUses ?? record.max_uses),
    usedCount: toNumber(record.usedCount ?? record.used_count),
    conditions: {
      minimumQuantity: toNumber(conditions.minimumQuantity ?? conditions.cantidadMinima),
      minimumAmount: toNumber(conditions.minimumAmount ?? conditions.montoMinimo),
      minStock: conditions.minStock === '' ? '' : toNumber(conditions.minStock),
      maxStock: conditions.maxStock === '' ? '' : toNumber(conditions.maxStock),
      nearExpiry: Boolean(conditions.nearExpiry),
      expiryDays: toNumber(conditions.expiryDays || 30),
      lowRotation: Boolean(conditions.lowRotation),
      receiptMode: conditions.receiptMode || 'any',
      paymentMethod: conditions.paymentMethod || 'any',
      branch: conditions.branch || '',
      warehouse: conditions.warehouse || '',
      customerCode: conditions.customerCode || '',
      customerGroup: conditions.customerGroup || '',
    },
    actions: {
      discountPercent: toNumber(actions.discountPercent ?? actions.porcentaje),
      discountAmount: toNumber(actions.discountAmount ?? actions.monto),
      specialPrice: toNumber(actions.specialPrice ?? actions.precioFinal),
      buyQuantity: toNumber(actions.buyQuantity ?? actions.compraCantidad),
      freeQuantity: toNumber(actions.freeQuantity ?? actions.cantidadGratis),
      freeProductCode: String(actions.freeProductCode || actions.productoGratis || '').trim(),
      comboPrice: toNumber(actions.comboPrice ?? actions.precioCombo),
      giftLabel: String(actions.giftLabel || actions.regalo || '').trim(),
    },
    createdAt: record.createdAt || record.created_at || new Date().toISOString(),
    updatedAt: record.updatedAt || record.updated_at || new Date().toISOString(),
    companyId: record.companyId || record.company_id || '',
    companyCode: record.companyCode || record.company_code || '',
  }
}

export function getPromotionLifecycleStatus(record, now = new Date()) {
  const promotion = normalizePromotion(record)
  const status = normalizeText(promotion.status)
  const today = now.toISOString().slice(0, 10)
  const currentTime = now.toTimeString().slice(0, 5)

  if (PAUSED_LABELS.has(status)) return promotion.status
  if (promotion.endDate && localDateValue(promotion.endDate) < today) return 'Vencida'
  if (promotion.startDate && localDateValue(promotion.startDate) > today) return 'Programada'
  if (promotion.startTime && timeValue(promotion.startTime) > currentTime) return 'Programada'
  if (promotion.endTime && timeValue(promotion.endTime) < currentTime) return 'Vencida'
  return ACTIVE_LABELS.has(status) ? 'Activa' : promotion.status || 'Inactiva'
}

export function isPromotionActive(record, now = new Date()) {
  const promotion = normalizePromotion(record)
  if (promotion.maxUses > 0 && promotion.usedCount >= promotion.maxUses) return false
  return getPromotionLifecycleStatus(promotion, now) === 'Activa'
}

export function promotionMatchesContext(record, context = {}, lines = []) {
  const promotion = normalizePromotion(record)
  const conditions = promotion.conditions
  const totalQuantity = lines.reduce((sum, line) => sum + toNumber(line.quantity), 0)
  const totalAmount = lines.reduce((sum, line) => sum + lineBase(line), 0)
  const receiptMode = context.fiscalReceipt || context.receiptMode === 'fiscal' ? 'fiscal' : 'consumer'

  if (!isPromotionActive(promotion, context.now || new Date())) return false
  if (promotion.couponCode && normalizeCode(context.couponCode) !== promotion.couponCode) return false
  if (conditions.minimumQuantity > 0 && totalQuantity < conditions.minimumQuantity) return false
  if (conditions.minimumAmount > 0 && totalAmount < conditions.minimumAmount) return false
  if (conditions.receiptMode !== 'any' && conditions.receiptMode !== receiptMode) return false
  if (conditions.paymentMethod !== 'any' && normalizeText(conditions.paymentMethod) !== normalizeText(context.paymentMethod)) return false
  if (conditions.branch && normalizeCode(conditions.branch) !== normalizeCode(context.branch)) return false
  if (conditions.warehouse && normalizeCode(conditions.warehouse) !== normalizeCode(context.warehouse)) return false
  if (conditions.customerCode && normalizeCode(conditions.customerCode) !== normalizeCode(context.customerCode)) return false
  if (conditions.customerGroup && normalizeText(conditions.customerGroup) !== normalizeText(context.customerGroup)) return false
  if (promotion.customers.length > 0 && !promotion.customers.some((code) => normalizeCode(code) === normalizeCode(context.customerCode))) return false
  if (promotion.customerGroups.length > 0 && !promotion.customerGroups.some((group) => normalizeText(group) === normalizeText(context.customerGroup))) return false

  return true
}

export function promotionMatchesLine(record, line = {}) {
  const promotion = normalizePromotion(record)
  const code = normalizeCode(line.code || line.productCode)
  const category = normalizeText(line.category || line.categoria)
  const supplier = normalizeText(line.supplierCode || line.supplierId || line.supplierName || line.supplier)
  const stock = toNumber(line.stock)
  const conditions = promotion.conditions

  if (promotion.products.length > 0 && !promotion.products.some((item) => normalizeCode(item) === code)) return false
  if (promotion.categories.length > 0 && !promotion.categories.some((item) => normalizeText(item) === category)) return false
  if (promotion.suppliers.length > 0 && !promotion.suppliers.some((item) => normalizeText(item) === supplier)) return false
  if (conditions.minStock !== '' && stock < conditions.minStock) return false
  if (conditions.maxStock !== '' && stock > conditions.maxStock) return false

  if (conditions.lowRotation) {
    const rotation = normalizeText(line.rotation || line.rotacion)
    if (!rotation.includes('baja') && !rotation.includes('lento') && !rotation.includes('sin')) return false
  }

  if (conditions.nearExpiry) {
    const expiry = line.expirationDate || line.expiresAt || line.vencimiento || ''
    const expiryDate = expiry ? new Date(expiry) : null
    if (!expiryDate || Number.isNaN(expiryDate.getTime())) return false
    const days = Math.ceil((expiryDate.getTime() - Date.now()) / 86400000)
    if (days < 0 || days > conditions.expiryDays) return false
  }

  return true
}

export function validatePromotionDraft(record) {
  const promotion = normalizePromotion(record)
  const errors = []

  if (!promotion.name) errors.push('Indique el nombre de la oferta.')
  if (!PROMOTION_TYPES.some((item) => item.id === promotion.type)) errors.push('Seleccione un tipo de oferta valido.')
  if (promotion.startDate && promotion.endDate && promotion.startDate > promotion.endDate) errors.push('La fecha final no puede ser anterior a la inicial.')
  if (promotion.startTime && promotion.endTime && promotion.startTime > promotion.endTime) errors.push('La hora final debe ser posterior a la inicial.')
  if (promotion.type === 'coupon' && !promotion.couponCode) errors.push('El cupon necesita un codigo promocional.')

  const hasDiscountAction = promotion.actions.discountPercent > 0
    || promotion.actions.discountAmount > 0
    || promotion.actions.specialPrice > 0
    || promotion.actions.comboPrice > 0
    || promotion.actions.freeQuantity > 0

  if (!hasDiscountAction && !['two-for-one', 'three-for-two'].includes(promotion.type)) {
    errors.push('Configure el resultado economico de la oferta.')
  }

  return errors
}

export function findCouponPromotion(promotions = [], couponCode = '') {
  const code = normalizeCode(couponCode)
  if (!code) return null
  return promotions.map(normalizePromotion).find((promotion) => promotion.couponCode === code) || null
}

export function validateCouponPromotion(promotions = [], couponCode = '', context = {}, lines = []) {
  const promotion = findCouponPromotion(promotions, couponCode)
  if (!promotion) return { ok: false, message: 'Cupon no valido.' }
  if (getPromotionLifecycleStatus(promotion, context.now || new Date()) === 'Vencida') {
    return { ok: false, promotion, message: 'Cupon vencido.' }
  }
  if (!isPromotionActive(promotion, context.now || new Date())) {
    return { ok: false, promotion, message: 'Cupon inactivo.' }
  }
  if (!promotionMatchesContext(promotion, { ...context, couponCode }, lines)) {
    return { ok: false, promotion, message: 'La compra no cumple las condiciones de esta oferta.' }
  }
  if (!lines.some((line) => promotionMatchesLine(promotion, line))) {
    return { ok: false, promotion, message: 'La oferta no aplica a los productos agregados.' }
  }

  return { ok: true, promotion, message: `${promotion.name} aplicado.` }
}

