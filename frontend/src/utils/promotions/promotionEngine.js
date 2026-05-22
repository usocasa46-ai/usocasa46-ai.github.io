import {
  normalizePromotion,
  promotionMatchesContext,
  promotionMatchesLine,
} from './promotionValidator.js'

function toNumber(value) {
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function lineBase(line) {
  return toNumber(line.quantity) * toNumber(line.price)
}

function discountPerPaidQuantity(line, paidUnits) {
  return Math.max(Math.min(toNumber(line.quantity) - paidUnits, toNumber(line.quantity)), 0) * toNumber(line.price)
}

function freeUnitsDiscount(line, buyQuantity, freeQuantity) {
  const quantity = Math.floor(toNumber(line.quantity))
  const bundleSize = buyQuantity + freeQuantity
  if (buyQuantity <= 0 || freeQuantity <= 0 || quantity < bundleSize) return 0
  const bundleCount = Math.floor(quantity / bundleSize)
  return bundleCount * freeQuantity * toNumber(line.price)
}

function allocateDiscount(lines, amount) {
  const totalBase = lines.reduce((sum, line) => sum + lineBase(line), 0)
  if (amount <= 0 || totalBase <= 0) return {}

  return Object.fromEntries(lines.map((line) => {
    const allocated = Math.min(lineBase(line), amount * (lineBase(line) / totalBase))
    return [line.id || line.code, allocated]
  }))
}

function calculatePromotionDiscounts(record, lines, context) {
  const promotion = normalizePromotion(record)
  if (!promotionMatchesContext(promotion, context, lines)) return null
  const eligible = lines.filter((line) => lineBase(line) > 0 && promotionMatchesLine(promotion, line))
  if (!eligible.length) return null

  const discounts = {}
  const fixedAmount = promotion.actions.discountAmount
  const percentage = promotion.actions.discountPercent
  const specialPrice = promotion.actions.specialPrice

  if (promotion.type === 'fixed' || (promotion.type === 'coupon' && fixedAmount > 0)) {
    Object.assign(discounts, allocateDiscount(eligible, fixedAmount))
  } else if (promotion.type === 'combo') {
    const comboBase = eligible.reduce((sum, line) => sum + lineBase(line), 0)
    Object.assign(discounts, allocateDiscount(eligible, Math.max(comboBase - promotion.actions.comboPrice, 0)))
  } else {
    eligible.forEach((line) => {
      const id = line.id || line.code
      const base = lineBase(line)
      let amount = 0

      if (promotion.type === 'two-for-one') {
        amount = discountPerPaidQuantity(line, Math.ceil(toNumber(line.quantity) / 2))
      } else if (promotion.type === 'three-for-two') {
        amount = freeUnitsDiscount(line, 2, 1)
      } else if (promotion.type === 'buy-x-get-y') {
        amount = freeUnitsDiscount(line, promotion.actions.buyQuantity, promotion.actions.freeQuantity)
      } else if (promotion.type === 'special-price' && specialPrice > 0) {
        amount = Math.max(toNumber(line.price) - specialPrice, 0) * toNumber(line.quantity)
      } else if (promotion.type === 'quantity' && fixedAmount > 0) {
        amount = fixedAmount * toNumber(line.quantity)
      } else if (promotion.type === 'liquidation' && percentage > 0) {
        amount = base * (percentage / 100)
      } else if (percentage > 0) {
        amount = base * (percentage / 100)
      }

      discounts[id] = Math.min(base, amount)
    })
  }

  const totalDiscount = Object.values(discounts).reduce((sum, amount) => sum + toNumber(amount), 0)
  if (totalDiscount <= 0) return null

  return { promotion, discounts, totalDiscount }
}

function manualDiscountFor(line) {
  if (line.manualDiscount !== undefined) return toNumber(line.manualDiscount)
  return Math.max(toNumber(line.discount) - toNumber(line.promotionDiscount), 0)
}

function cloneForPricing(line) {
  return {
    ...line,
    manualDiscount: manualDiscountFor(line),
    promotionDiscount: 0,
    promotionApplications: [],
  }
}

function selectedApplications(promotions, lines, context) {
  const applications = promotions
    .map((promotion) => calculatePromotionDiscounts(promotion, lines, context))
    .filter(Boolean)
    .sort((left, right) => {
      if (right.promotion.priority !== left.promotion.priority) return right.promotion.priority - left.promotion.priority
      return right.totalDiscount - left.totalDiscount
    })

  return applications.reduce((selected, application) => {
    const hasBlockingPromotion = selected.some((item) => !item.promotion.stackable)
    if (hasBlockingPromotion || (!application.promotion.stackable && selected.length > 0)) return selected
    return [...selected, application]
  }, [])
}

export function collectAppliedPromotions(lines = []) {
  const records = new Map()

  lines.forEach((line) => {
    ;(line.promotionApplications || []).forEach((application) => {
      const current = records.get(application.id) || {
        id: application.id,
        name: application.name,
        type: application.type,
        couponCode: application.couponCode || '',
        discountAmount: 0,
        products: [],
      }
      current.discountAmount += toNumber(application.discountAmount)
      current.products.push({
        code: line.code,
        name: line.name,
        quantity: toNumber(line.quantity),
        discountAmount: toNumber(application.discountAmount),
      })
      records.set(application.id, current)
    })
  })

  return Array.from(records.values()).filter((record) => record.discountAmount > 0)
}

export function applyPromotionsToLines(lines = [], promotions = [], context = {}) {
  const pricedLines = lines.map(cloneForPricing)
  const applications = selectedApplications(promotions.map(normalizePromotion), pricedLines, context)

  applications.forEach(({ promotion, discounts }) => {
    pricedLines.forEach((line) => {
      const id = line.id || line.code
      const amount = Math.min(toNumber(discounts[id]), Math.max(lineBase(line) - line.manualDiscount - line.promotionDiscount, 0))
      if (amount <= 0) return
      line.promotionDiscount += amount
      line.promotionApplications.push({
        id: promotion.id,
        name: promotion.name,
        type: promotion.type,
        couponCode: promotion.couponCode,
        discountAmount: amount,
      })
    })
  })

  const nextLines = pricedLines.map((line) => ({
    ...line,
    discount: Math.min(lineBase(line), line.manualDiscount + line.promotionDiscount),
  }))
  const appliedPromotions = collectAppliedPromotions(nextLines)

  return {
    lines: nextLines,
    appliedPromotions,
    savings: appliedPromotions.reduce((sum, promotion) => sum + promotion.discountAmount, 0),
  }
}

