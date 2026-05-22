import { isSupabaseConfigured, supabaseRequest } from '../lib/supabaseClient.js'
import {
  getCompanyData,
  getCurrentCompanyCode,
  getCurrentCompanyId,
  setCompanyData,
} from './companyStorage.js'
import { collectAppliedPromotions } from '../utils/promotions/promotionEngine.js'
import { normalizePromotion } from '../utils/promotions/promotionValidator.js'

const PROMOTIONS_KEY = 'invefat_promotions'
const USAGE_KEY = 'invefat_promotion_usage'

function toArray(value) {
  return Array.isArray(value) ? value : []
}

function nowIso() {
  return new Date().toISOString()
}

function companyIdentity() {
  const companyCode = getCurrentCompanyCode()
  const companyId = getCurrentCompanyId() || companyCode
  return { companyCode, companyId }
}

function companyPath(table) {
  const { companyCode, companyId } = companyIdentity()
  if (companyCode) return `/${table}?company_code=eq.${encodeURIComponent(companyCode)}&select=*&order=updated_at.desc`
  return `/${table}?company_id=eq.${encodeURIComponent(companyId)}&select=*&order=updated_at.desc`
}

function unwrapRow(row) {
  if (!row) return null
  return {
    ...(row.data || {}),
    ...row,
    companyId: row.company_id || row.data?.companyId || '',
    companyCode: row.company_code || row.data?.companyCode || '',
    createdAt: row.created_at || row.data?.createdAt || '',
    updatedAt: row.updated_at || row.data?.updatedAt || '',
  }
}

function localList(key) {
  return toArray(getCompanyData(key, []))
}

function saveLocal(key, list) {
  setCompanyData(key, toArray(list))
  return toArray(list)
}

async function withPromotionFallback(operation, fallback) {
  if (!isSupabaseConfigured()) return fallback()
  try {
    return await operation()
  } catch (error) {
    console.warn('Promociones usando respaldo local:', error.message)
    return fallback()
  }
}

function promotionPayload(record) {
  const promotion = normalizePromotion(record)
  const { companyCode, companyId } = companyIdentity()
  const data = {
    ...promotion,
    companyId,
    companyCode,
    company_id: companyId,
    company_code: companyCode,
  }

  return {
    id: promotion.id,
    company_id: companyId,
    company_code: companyCode,
    name: promotion.name,
    description: promotion.description,
    type: promotion.type,
    status: promotion.status,
    start_date: promotion.startDate || null,
    end_date: promotion.endDate || null,
    start_time: promotion.startTime || null,
    end_time: promotion.endTime || null,
    priority: promotion.priority,
    stackable: promotion.stackable,
    conditions: promotion.conditions,
    actions: promotion.actions,
    products: promotion.products,
    categories: promotion.categories,
    customers: promotion.customers,
    coupon_code: promotion.couponCode || null,
    max_uses: promotion.maxUses,
    used_count: promotion.usedCount,
    data,
    created_at: promotion.createdAt || nowIso(),
    updated_at: nowIso(),
  }
}

function usagePayload(record) {
  const { companyCode, companyId } = companyIdentity()
  const data = {
    ...record,
    companyId,
    companyCode,
    company_id: companyId,
    company_code: companyCode,
  }
  return {
    id: record.id,
    company_id: companyId,
    company_code: companyCode,
    promotion_id: record.promotionId,
    invoice_id: record.invoiceNumber || record.invoiceId || '',
    customer_id: record.customerId || '',
    source: record.source || '',
    products: record.products || [],
    discount_amount: record.discountAmount || 0,
    total_before: record.totalBefore || 0,
    total_after: record.totalAfter || 0,
    user_id: record.userId || '',
    data,
    created_at: record.createdAt || nowIso(),
    updated_at: nowIso(),
  }
}

async function getPromotions() {
  return withPromotionFallback(
    async () => {
      const rows = await supabaseRequest(companyPath('promotions'))
      return toArray(rows).map(unwrapRow).map(normalizePromotion)
    },
    () => localList(PROMOTIONS_KEY).map(normalizePromotion),
  )
}

async function getUsage() {
  return withPromotionFallback(
    async () => {
      const rows = await supabaseRequest(companyPath('promotion_usage'))
      return toArray(rows).map(unwrapRow)
    },
    () => localList(USAGE_KEY),
  )
}

async function createPromotion(record) {
  const payload = promotionPayload(record)
  return withPromotionFallback(
    async () => {
      const rows = await supabaseRequest('/promotions?on_conflict=company_id,id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(payload),
      })
      return normalizePromotion(unwrapRow(toArray(rows)[0]) || payload.data)
    },
    () => {
      const current = localList(PROMOTIONS_KEY)
      const next = [payload.data, ...current.filter((item) => item.id !== payload.id)]
      saveLocal(PROMOTIONS_KEY, next)
      return normalizePromotion(payload.data)
    },
  )
}

async function updatePromotion(id, patch) {
  const current = await getPromotions()
  const nextPromotion = normalizePromotion({ ...current.find((promotion) => promotion.id === id), ...patch, id, updatedAt: nowIso() })
  const payload = promotionPayload(nextPromotion)
  const { companyCode } = companyIdentity()

  return withPromotionFallback(
    async () => {
      const rows = await supabaseRequest(`/promotions?id=eq.${encodeURIComponent(id)}&company_code=eq.${encodeURIComponent(companyCode)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      return normalizePromotion(unwrapRow(toArray(rows)[0]) || payload.data)
    },
    () => {
      const next = localList(PROMOTIONS_KEY).map((promotion) => promotion.id === id ? payload.data : promotion)
      saveLocal(PROMOTIONS_KEY, next)
      return normalizePromotion(payload.data)
    },
  )
}

async function removePromotion(id) {
  const { companyCode } = companyIdentity()
  return withPromotionFallback(
    () => supabaseRequest(`/promotions?id=eq.${encodeURIComponent(id)}&company_code=eq.${encodeURIComponent(companyCode)}`, {
      method: 'DELETE',
      prefer: 'return=minimal',
    }),
    () => {
      saveLocal(PROMOTIONS_KEY, localList(PROMOTIONS_KEY).filter((promotion) => promotion.id !== id))
      return true
    },
  )
}

async function createUsage(record) {
  const payload = usagePayload(record)
  return withPromotionFallback(
    async () => {
      const rows = await supabaseRequest('/promotion_usage?on_conflict=company_id,id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(payload),
      })
      return unwrapRow(toArray(rows)[0]) || payload.data
    },
    () => {
      const next = [payload.data, ...localList(USAGE_KEY).filter((item) => item.id !== payload.id)]
      saveLocal(USAGE_KEY, next)
      return payload.data
    },
  )
}

async function recordSaleUsage({ invoice, source, userId = '' }) {
  const applications = invoice?.appliedPromotions?.length
    ? invoice.appliedPromotions
    : collectAppliedPromotions(invoice?.lines || [])
  if (!applications.length) return []

  const [usage, promotions] = await Promise.all([getUsage(), getPromotions()])
  const totals = invoice.totals || {}
  const totalBefore = totals.subtotal + (totals.taxTotal || 0)

  const saved = []
  for (const application of applications) {
    const alreadyRecorded = usage.some((record) => (
      String(record.promotionId || record.promotion_id) === String(application.id)
      && String(record.invoiceNumber || record.invoice_id) === String(invoice.number)
      && String(record.source || '') === String(source || '')
    ))
    if (alreadyRecorded) continue

    const record = {
      id: `PROMO-USE-${application.id}-${invoice.number}-${Date.now()}`,
      promotionId: application.id,
      promotionName: application.name,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      customerId: invoice.customerCode || '',
      customer: invoice.customer || 'Consumidor final',
      source,
      products: application.products,
      discountAmount: application.discountAmount,
      totalBefore,
      totalAfter: totals.total || 0,
      userId,
      createdAt: nowIso(),
    }
    saved.push(await createUsage(record))

    const promotion = promotions.find((item) => item.id === application.id)
    if (promotion) {
      await updatePromotion(promotion.id, { usedCount: Number(promotion.usedCount || 0) + 1 })
    }
  }

  return saved
}

export const promotionsService = {
  getAll: getPromotions,
  getUsage,
  create: createPromotion,
  update: updatePromotion,
  remove: removePromotion,
  recordUsage: createUsage,
  recordSaleUsage,
}

