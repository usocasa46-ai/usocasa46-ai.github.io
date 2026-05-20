import {
  Banknote,
  CreditCard,
  Download,
  Maximize2,
  Monitor,
  MoreVertical,
  Minus,
  Package,
  Pause,
  Plus,
  Printer,
  ReceiptText,
  RefreshCcw,
  RotateCcw,
  Search,
  Store,
  Tag,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import { invoicesService } from '../../services/invoicesService.js'
import { productsService } from '../../services/productsService.js'
import { normalizeRnc, rncService } from '../../services/rncService.js'
import { registerIssuedElectronicDocument } from '../../services/electronicBillingService.js'
import { createSalesInvoiceEntry, readArray as readAccountingArray, ACCOUNTING_KEYS } from '../../utils/accountingEntries.js'
import { createPdfMetadata, downloadSalesDocumentPdf } from '../../utils/pdf/salesDocumentPdf.js'
import { consumeNextNcf, generateNextNcf, markNcfAsUsed, peekNextNcf, previewNextNcf } from '../../utils/ncfGenerator.js'
import { openThermalTicket } from '../../utils/posThermalPrint.js'
import './SalesPosPage.css'

const PRODUCTS_KEY = 'inveFatInventoryProducts'
const CUSTOMERS_KEYS = ['invefat_customers', 'invefat_sales_customers', 'inveFatCustomers']
const INVOICES_KEY = 'invefat_sales_invoices'
const MOVEMENTS_KEY = 'invefat_inventory_movements'
const REPORTS_KEY = 'invefat_sales_reports'
const SETTINGS_KEY = 'invefat_company_settings'
const POS_SALES_KEY = 'invefat_pos_sales'
const SUSPENDED_KEY = 'invefat_pos_suspended_sales'
const CASH_MOVEMENTS_KEY = 'invefat_cash_movements'
const POS_DISPLAY_KEY = 'invefat_current_pos_sale_display'

const paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia', 'Credito', 'Mixto']
const fiscalReceiptTypes = ['Credito fiscal', 'Consumidor final', 'Regimen especial', 'Gubernamental']

const defaultFiscalReceipt = {
  enabled: false,
  receiptType: 'Credito fiscal',
  fiscalId: '',
  name: '',
  phone: '',
  address: '',
  paymentCondition: 'Contado',
}

const defaultSettings = {
  company: {
    tradeName: 'INVE-FAT SYSTEM',
    legalName: 'Empresa Principal',
    fiscalId: '',
    address: '',
    phone: '',
    whatsapp: '',
    email: '',
    currency: 'RD$',
    legalNote: 'Gracias por su compra.',
  },
  brand: {
    logo: '',
    primaryColor: '#0f2742',
    accentColor: '#f1872d',
  },
  documentOptions: {
    showLogo: true,
    showFiscalId: true,
    showPhone: true,
    showAddress: true,
    showEmail: true,
    showSeller: true,
    showBranch: true,
    showWarehouse: true,
    showLegalNote: true,
  },
  billing: {
    invoiceModel: 'Ticket / POS',
    printFormat: 'Ticket 80mm',
    orientation: 'Vertical',
    fontSize: '10',
    footerMessage: 'Gracias por su compra.',
  },
  fiscal: {
    useNcf: false,
    defaultReceiptType: 'Consumidor final',
    ncfPrefix: 'B02',
    nextNcf: 1,
    ncfLength: 8,
    ncfValidUntil: '',
  },
  branches: [{ code: 'MAT-01', name: 'Empresa matriz', mainWarehouse: 'ALM-01', status: 'Activa' }],
  warehouses: [{ code: 'ALM-01', name: 'Almacen Principal' }],
  numbering: {
    invoice: { prefix: 'FAC', nextNumber: 1, length: 6, separator: '-' },
  },
  preferences: {
    allowNegativeStock: false,
  },
}

const cashCustomer = {
  code: 'CLI-CONTADO',
  name: 'Consumidor final',
  fiscalId: '',
  phone: '',
  email: '',
  address: '',
  paymentCondition: 'Contado',
  creditDays: 0,
  preferredReceiptType: 'Consumidor final',
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function safeParse(key, fallback) {
  if (!canUseStorage()) return fallback
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  if (!canUseStorage()) return
  localStorage.setItem(key, JSON.stringify(value))
}

function readArray(key, fallback = []) {
  const value = safeParse(key, fallback)
  return Array.isArray(value) ? value : fallback
}

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function cleanText(value) {
  return String(value ?? '').trim().toLowerCase()
}

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function currency(value, settings) {
  const symbol = settings?.company?.currency || 'RD$'
  return `${symbol} ${toNumber(value).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatQuantity(value) {
  return toNumber(value).toLocaleString('es-DO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function mergeSettings(saved) {
  if (!saved || typeof saved !== 'object') return defaultSettings
  return {
    ...defaultSettings,
    ...saved,
    company: { ...defaultSettings.company, ...saved.company },
    brand: { ...defaultSettings.brand, ...saved.brand },
    documentOptions: { ...defaultSettings.documentOptions, ...saved.documentOptions },
    billing: { ...defaultSettings.billing, ...saved.billing },
    fiscal: { ...defaultSettings.fiscal, ...saved.fiscal },
    preferences: { ...defaultSettings.preferences, ...saved.preferences },
    numbering: { ...defaultSettings.numbering, ...saved.numbering },
    branches: Array.isArray(saved.branches) && saved.branches.length ? saved.branches : defaultSettings.branches,
    warehouses: Array.isArray(saved.warehouses) && saved.warehouses.length ? saved.warehouses : defaultSettings.warehouses,
  }
}

function loadSettings() {
  return mergeSettings(safeParse(SETTINGS_KEY, null))
}

function normalizeProduct(product) {
  const rawTax = product.tax ?? product.impuesto ?? product.taxRate
  return {
    ...product,
    code: String(product.code || product.codigo || '').trim(),
    name: String(product.name || product.nombre || 'Producto sin nombre').trim(),
    description: String(product.description || product.descripcion || '').trim(),
    category: String(product.category || product.categoria || '').trim() || 'Sin asignar',
    unit: String(product.unit || product.unidad || 'UND').trim(),
    barcode: String(product.barcode || product.codigoBarra || '').trim(),
    image: product.image || product.imageUrl || product.photo || product.productImage || product.imagen || product.logo || '',
    price: toNumber(product.price ?? product.precio),
    cost: toNumber(product.cost ?? product.costo),
    tax: rawTax === undefined || rawTax === null || rawTax === '' ? 0 : toNumber(rawTax),
    stock: toNumber(product.stock),
    minStock: toNumber(product.minStock || product.stockMin || product.stockMinimo),
    supplierCode: String(product.supplierCode || product.providerCode || '').trim(),
    supplierName: String(product.supplierName || product.providerName || product.supplier || '').trim(),
    status: product.status || product.estado || 'Activo',
  }
}

function loadProducts() {
  return readArray(PRODUCTS_KEY).map(normalizeProduct).filter((product) => product.code)
}

function saveProducts(products) {
  writeStorage(PRODUCTS_KEY, products)
  void productsService.replaceAll(products)
}

function normalizeCustomer(customer) {
  return {
    code: String(customer.code || customer.codigo || customer.customerCode || customer.id || '').trim(),
    name: String(customer.name || customer.commercialName || customer.nombre || customer.customer || 'Cliente sin nombre').trim(),
    fiscalId: String(customer.fiscalId || customer.document || customer.rnc || customer.identification || '').trim(),
    phone: String(customer.phone || customer.telefono || '').trim(),
    email: String(customer.email || customer.correo || customer.invoiceEmail || '').trim(),
    address: String(customer.address || customer.direccion || '').trim(),
    paymentCondition: customer.paymentCondition || customer.condition || 'Contado',
    creditDays: toNumber(customer.creditDays || customer.daysCredit || customer.diasCredito),
    creditLimit: toNumber(customer.creditLimit || customer.limiteCredito),
    priceList: customer.priceList || customer.listaPrecio || 'General',
    preferredReceiptType: customer.preferredReceiptType || customer.tipoComprobante || 'Consumidor final',
    status: customer.status || customer.estado || 'Activo',
  }
}

function loadCustomers() {
  const customers = CUSTOMERS_KEYS.flatMap((key) => readArray(key))
    .map(normalizeCustomer)
    .filter((customer) => customer.code && customer.status !== 'Inactivo')
  const byCode = new Map()
  ;[cashCustomer, ...customers].forEach((customer) => byCode.set(customer.code, customer))
  return Array.from(byCode.values())
}

function defaultBranch(settings) {
  return settings.branches.find((branch) => branch.status !== 'Inactiva') || settings.branches[0] || defaultSettings.branches[0]
}

function defaultWarehouse(settings, branchCode) {
  const branch = settings.branches.find((item) => item.code === branchCode) || defaultBranch(settings)
  return branch?.mainWarehouse || settings.warehouses[0]?.code || 'ALM-01'
}

function nextInvoiceNumber(settings, invoices) {
  const config = settings.numbering?.invoice || defaultSettings.numbering.invoice
  const prefix = config.prefix || 'FAC'
  const separator = config.separator || '-'
  const length = Number(config.length) || 6
  const configuredNext = Number(config.nextNumber) || 1
  const maxExisting = invoices.reduce((max, invoice) => {
    const numberPart = String(invoice.number || '').replace(prefix, '').replace(separator, '')
    const parsed = Number.parseInt(numberPart, 10)
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max
  }, 0)
  return `${prefix}${separator}${String(Math.max(configuredNext, maxExisting + 1)).padStart(length, '0')}`
}

function nextNcf(settings, invoices, receiptType) {
  if (!settings.fiscal?.useNcf) return ''
  const type = receiptType || settings.fiscal.defaultReceiptType || settings.fiscal.ncfPrefix || 'Consumidor final'
  return peekNextNcf(type) || ''
}

function mergeFiscalCustomer(current, selectedCustomer) {
  const isCash = selectedCustomer.code === cashCustomer.code
  return {
    ...current,
    fiscalId: isCash ? current.fiscalId : selectedCustomer.fiscalId || current.fiscalId,
    name: isCash ? current.name : selectedCustomer.name || current.name,
    phone: isCash ? current.phone : selectedCustomer.phone || current.phone,
    address: isCash ? current.address : selectedCustomer.address || current.address,
    paymentCondition: selectedCustomer.paymentCondition || current.paymentCondition || 'Contado',
  }
}

function lineBase(line) {
  return toNumber(line.quantity) * toNumber(line.price)
}

function lineDiscount(line) {
  return Math.min(toNumber(line.discount), lineBase(line))
}

function lineTax(line) {
  return Math.max(lineBase(line) - lineDiscount(line), 0) * (toNumber(line.taxRate) / 100)
}

function lineTotal(line) {
  return Math.max(lineBase(line) - lineDiscount(line), 0) + lineTax(line)
}

function calculateTotals(lines = [], payment = {}) {
  const subtotal = lines.reduce((sum, line) => sum + lineBase(line), 0)
  const discountTotal = lines.reduce((sum, line) => sum + lineDiscount(line), 0)
  const taxTotal = lines.reduce((sum, line) => sum + lineTax(line), 0)
  const total = Math.max(subtotal - discountTotal + taxTotal, 0)
  const paid = payment.method === 'Credito'
    ? 0
    : payment.method === 'Efectivo'
      ? toNumber(payment.received)
      : payment.method === 'Mixto'
        ? toNumber(payment.cash) + toNumber(payment.card) + toNumber(payment.transfer)
        : total

  return {
    subtotal,
    discountTotal,
    taxTotal,
    total,
    paid,
    balance: Math.max(total - paid, 0),
    change: ['Efectivo', 'Mixto'].includes(payment.method) ? Math.max(paid - total, 0) : 0,
  }
}

function makeLine(product) {
  return {
    id: makeId('pos-line'),
    code: product.code,
    name: product.name,
    description: product.description,
    unit: product.unit,
    barcode: product.barcode,
    image: product.image,
    stock: product.stock,
    quantity: 1,
    price: product.price,
    discount: 0,
    taxRate: product.tax || 0,
  }
}

function productStockStatus(product) {
  const stock = toNumber(product.stock)
  const minStock = toNumber(product.minStock)

  if (stock <= 0) return { label: 'Sin stock', className: 'is-out' }
  if (minStock > 0 && stock <= minStock) return { label: 'Stock bajo', className: 'is-low' }
  return { label: 'Disponible', className: 'is-ok' }
}

function buildReport(invoice, totals) {
  return {
    id: invoice.id,
    number: invoice.number,
    date: invoice.date,
    customer: invoice.customer,
    products: invoice.lines.map((line) => ({
      code: line.code,
      name: line.name,
      quantity: toNumber(line.quantity),
      subtotal: lineBase(line),
      tax: lineTax(line),
      total: lineTotal(line),
    })),
    subtotal: totals.subtotal,
    tax: totals.taxTotal,
    discount: totals.discountTotal,
    total: totals.total,
    paymentMethod: invoice.paymentMethod,
    seller: invoice.seller,
    branch: invoice.branch,
    warehouse: invoice.warehouse,
    state: invoice.state,
    source: 'POS',
    updatedAt: new Date().toISOString(),
  }
}

function buildPosDisplayPayload({
  settings,
  branch,
  warehouse,
  session,
  customer,
  lines,
  totals,
  payment,
  fiscalReceipt,
  status,
}) {
  return {
    brand: {
      name: settings?.company?.tradeName || settings?.company?.legalName || 'INVE-FAT SYSTEM',
      subtitle: 'ERP Empresarial',
      logo: settings?.brand?.logo || settings?.company?.logo || '',
    },
    caja: 'CA-01',
    branch: branch?.name || branch?.code || 'Sucursal principal',
    warehouse,
    cashier: session?.fullName || session?.username || 'Caja',
    customer: {
      name: fiscalReceipt?.enabled ? fiscalReceipt.name : customer?.name || 'Consumidor final',
      fiscalId: fiscalReceipt?.enabled ? fiscalReceipt.fiscalId : customer?.fiscalId || '',
      receiptType: fiscalReceipt?.enabled ? fiscalReceipt.receiptType : 'Consumidor final',
      fiscalEnabled: Boolean(fiscalReceipt?.enabled),
    },
    lines: lines.map((line) => ({
      id: line.id,
      code: line.code,
      name: line.name,
      image: line.image,
      quantity: toNumber(line.quantity),
      price: toNumber(line.price),
      tax: lineTax(line),
      subtotal: lineTotal(line),
    })),
    totals,
    paymentMethod: payment?.method || 'Efectivo',
    status,
    updatedAt: new Date().toISOString(),
    footer: {
      loyalty: 'Acumula puntos por cada compra.',
      promo: settings?.billing?.footerMessage || 'Pregunta por nuestras ofertas y descuentos especiales.',
      thanks: 'Gracias por preferirnos.',
    },
  }
}

function publishPosDisplay(payload) {
  if (!canUseStorage()) return
  localStorage.setItem(POS_DISPLAY_KEY, JSON.stringify(payload))
}

function openCustomerDisplayWindow() {
  if (typeof window === 'undefined') return null
  const displayWindow = window.open('', 'invefat_pos_customer_display', 'width=1366,height=768')
  if (!displayWindow) return null

  displayWindow.document.write(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>INVE-FAT SYSTEM - Pantalla cliente</title>
  <style>
    :root { --blue:#073246; --blue2:#001f2f; --orange:#ff7a18; --line:#dde5ee; --soft:#f5f7fb; --text:#101d33; --muted:#5c6b80; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: Inter, Arial, sans-serif; background: var(--soft); color: var(--text); overflow: hidden; }
    .client-display { min-height: 100vh; display: grid; grid-template-rows: 88px minmax(0, 1fr) 118px; }
    .top { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 24px; background: linear-gradient(135deg, var(--blue2), var(--blue)); color: #fff; padding: 18px 30px; box-shadow: 0 10px 30px rgba(0,0,0,.14); }
    .brand { display: flex; align-items: center; gap: 14px; }
    .mark { width: 58px; height: 42px; border-radius: 16px; background: linear-gradient(135deg, #ff9e28, var(--orange)); clip-path: polygon(0 20%, 28% 20%, 50% 58%, 75% 20%, 100% 20%, 58% 100%, 42% 100%); }
    .brand strong { display: block; font-size: 26px; line-height: 1; }
    .brand span, .cashbox span { display: block; color: rgba(255,255,255,.78); font-weight: 700; margin-top: 5px; }
    .title { display: flex; align-items: center; gap: 14px; font-size: 34px; font-weight: 950; }
    .cashbox { justify-self: end; border-left: 1px solid rgba(255,255,255,.28); padding-left: 28px; font-size: 20px; font-weight: 900; }
    .content { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(420px, .85fr); gap: 22px; padding: 22px; min-height: 0; }
    .panel { min-height: 0; border: 1px solid var(--line); border-radius: 18px; background: #fff; box-shadow: 0 14px 36px rgba(15,39,66,.08); overflow: hidden; }
    .items { display: grid; grid-template-rows: auto minmax(0,1fr) auto; }
    .table-head, .item { display: grid; grid-template-columns: minmax(0, 1fr) 110px 160px 160px; gap: 16px; align-items: center; }
    .table-head { padding: 20px 24px; border-bottom: 1px solid var(--line); color: #101d33; font-size: 17px; font-weight: 950; text-transform: uppercase; }
    .list { overflow: auto; padding: 0 18px; }
    .item { min-height: 82px; border-bottom: 1px solid #edf1f5; font-size: 18px; font-weight: 800; }
    .product { display: grid; grid-template-columns: 70px minmax(0,1fr); align-items: center; gap: 18px; }
    .product-img { width: 58px; height: 58px; display: grid; place-items: center; border-radius: 14px; background: #eef4f8; color: #7b8ea4; overflow: hidden; }
    .product-img img { width: 100%; height: 100%; object-fit: contain; }
    .product small { display: block; color: var(--muted); font-size: 13px; margin-top: 4px; }
    .qty { justify-self: start; min-width: 50px; border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; text-align: center; background: #fbfcfe; }
    .money { text-align: right; white-space: nowrap; }
    .summary { padding: 20px; display: grid; gap: 20px; align-content: start; }
    .status { display: flex; align-items: center; gap: 18px; border: 1px solid #ffddbd; border-radius: 18px; background: linear-gradient(135deg, #fff6eb, #fff); padding: 22px; }
    .coin { width: 86px; height: 86px; display:grid; place-items:center; border-radius: 50%; background: radial-gradient(circle, #ff8a22, #ffb980); color:#fff; font-size: 38px; font-weight: 950; border: 8px dotted rgba(255,255,255,.7); }
    .status h2 { margin: 0; font-size: 30px; color: #0f2035; text-transform: uppercase; }
    .status p { margin: 7px 0 0; color: #4f6278; font-size: 18px; font-weight: 750; }
    .totals { display: grid; gap: 13px; font-size: 21px; }
    .totals div { display: flex; justify-content: space-between; gap: 16px; }
    .totals .grand { margin-top: 10px; border-top: 1px solid var(--line); padding-top: 26px; align-items: baseline; }
    .totals .grand span { color: #0f2035; font-size: 30px; font-weight: 950; text-transform: uppercase; }
    .totals .grand strong { color: var(--orange); font-size: 46px; }
    .client { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; border: 1px solid var(--line); border-radius: 18px; padding: 18px; }
    .client article { display: grid; gap: 6px; }
    .client span { color: var(--muted); font-size: 13px; font-weight: 900; text-transform: uppercase; }
    .client strong { font-size: 18px; }
    .items-foot { display: flex; justify-content: space-between; padding: 18px 24px; color: var(--muted); font-weight: 850; }
    .footer { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; align-items: center; background: linear-gradient(135deg, var(--blue2), var(--blue)); color: #fff; padding: 20px 34px; }
    .footer article { display: grid; grid-template-columns: 68px 1fr; gap: 15px; align-items: center; border-right: 1px solid rgba(255,255,255,.28); min-height: 70px; }
    .footer article:last-child { border-right: 0; }
    .footer .icon { width: 60px; height: 60px; display:grid; place-items:center; border: 3px solid var(--orange); border-radius: 50%; color: var(--orange); font-size: 30px; }
    .footer strong { color: #ff9d30; font-size: 22px; }
    .footer p { margin: 5px 0 0; color: rgba(255,255,255,.88); font-size: 17px; }
    .empty { height: 100%; display:grid; place-items:center; color: var(--muted); font-size: 22px; font-weight: 850; text-align:center; padding: 40px; }
    @media (max-width: 980px) { body { overflow:auto; } .client-display { grid-template-rows:auto auto auto; } .top, .content, .footer { grid-template-columns: 1fr; } .cashbox { justify-self:start; border-left:0; padding-left:0; } .content { min-height:auto; } }
  </style>
</head>
<body>
  <main class="client-display">
    <header class="top">
      <div class="brand"><div class="mark"></div><div><strong id="brandName">INVE-FAT SYSTEM</strong><span>ERP Empresarial</span></div></div>
      <div class="title"><span class="title-icon">$</span><span>Su compra</span></div>
      <div class="cashbox"><span>Caja activa</span><strong id="cashbox">CA-01</strong></div>
    </header>
    <section class="content">
      <section class="panel items">
        <div class="table-head"><span>Producto</span><span>Cant.</span><span>Precio unit.</span><span>Subtotal</span></div>
        <div class="list" id="items"></div>
        <div class="items-foot"><span id="articleCount">0 Articulos</span><span>Ultima actualizacion: <strong id="updatedAt">--</strong></span></div>
      </section>
      <aside class="panel summary">
        <section class="status"><div class="coin">$</div><div><h2 id="status">Esperando venta</h2><p id="statusText">Agregue productos para iniciar.</p></div></section>
        <section class="totals">
          <div><span>Subtotal</span><strong id="subtotal">RD$ 0.00</strong></div>
          <div><span>ITBIS</span><strong id="tax">RD$ 0.00</strong></div>
          <div><span>Descuento</span><strong id="discount">RD$ 0.00</strong></div>
          <div class="grand"><span>Total</span><strong id="total">RD$ 0.00</strong></div>
        </section>
        <section class="client">
          <article><span>Cliente</span><strong id="customer">Consumidor final</strong><small id="rnc">000-0000000-0</small></article>
          <article><span>Comprobante</span><strong id="receipt">Consumidor final</strong><small id="payment">Efectivo</small></article>
        </section>
      </aside>
    </section>
    <footer class="footer">
      <article><div class="icon">*</div><div><strong>¡Acumula puntos!</strong><p id="loyalty">Por cada compra acumulas beneficios.</p></div></article>
      <article><div class="icon">+</div><div><strong>Promociones exclusivas</strong><p id="promo">Pregunta por nuestras ofertas.</p></div></article>
      <article><div class="icon">&lt;3</div><div><strong>¡Gracias por preferirnos!</strong><p>Vuelve pronto.</p></div></article>
    </footer>
  </main>
  <script>
    const key = ${JSON.stringify(POS_DISPLAY_KEY)};
    const money = (value) => 'RD$ ' + Number(value || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const qty = (value) => Number(value || 0).toLocaleString('es-DO', { maximumFractionDigits: 2 });
    const text = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value || ''; };
    const productImage = (line) => {
      const wrap = document.createElement('div');
      wrap.className = 'product-img';
      if (line.image) {
        const img = document.createElement('img');
        img.src = line.image;
        img.alt = line.name || 'Producto';
        wrap.appendChild(img);
      } else {
        wrap.textContent = '[]';
      }
      return wrap;
    };
    function render() {
      let data = null;
      try { data = JSON.parse(localStorage.getItem(key) || 'null'); } catch (error) { data = null; }
      data = data || { lines: [], totals: {}, customer: {}, brand: { name: 'INVE-FAT SYSTEM' }, caja: 'CA-01', status: 'Esperando venta', updatedAt: new Date().toISOString(), footer: {} };
      text('brandName', data.brand?.name || 'INVE-FAT SYSTEM');
      text('cashbox', data.caja || 'CA-01');
      text('status', data.status || 'Esperando venta');
      text('statusText', data.lines?.length ? 'Revise sus productos y total.' : 'Agregue productos para iniciar.');
      text('subtotal', money(data.totals?.subtotal));
      text('tax', money(data.totals?.taxTotal));
      text('discount', money(data.totals?.discountTotal));
      text('total', money(data.totals?.total));
      text('customer', data.customer?.name || 'Consumidor final');
      text('rnc', data.customer?.fiscalId || '000-0000000-0');
      text('receipt', data.customer?.receiptType || 'Consumidor final');
      text('payment', data.paymentMethod || 'Efectivo');
      text('loyalty', data.footer?.loyalty || 'Por cada compra acumulas beneficios.');
      text('promo', data.footer?.promo || 'Pregunta por nuestras ofertas.');
      text('articleCount', qty((data.lines || []).reduce((sum, line) => sum + Number(line.quantity || 0), 0)) + ' Articulos');
      text('updatedAt', new Date(data.updatedAt || Date.now()).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      const list = document.getElementById('items');
      list.innerHTML = '';
      if (!data.lines?.length) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'Su compra aparecera aqui.';
        list.appendChild(empty);
        return;
      }
      data.lines.forEach((line) => {
        const row = document.createElement('article');
        row.className = 'item';
        const product = document.createElement('div');
        product.className = 'product';
        product.appendChild(productImage(line));
        const info = document.createElement('div');
        const name = document.createElement('strong');
        name.textContent = line.name || 'Producto';
        const code = document.createElement('small');
        code.textContent = line.code || '';
        info.appendChild(name);
        info.appendChild(code);
        product.appendChild(info);
        const quantity = document.createElement('div');
        quantity.className = 'qty';
        quantity.textContent = qty(line.quantity);
        const price = document.createElement('div');
        price.className = 'money';
        price.textContent = money(line.price);
        const subtotal = document.createElement('div');
        subtotal.className = 'money';
        subtotal.textContent = money(line.subtotal);
        row.append(product, quantity, price, subtotal);
        list.appendChild(row);
      });
    }
    window.addEventListener('storage', (event) => { if (event.key === key) render(); });
    setInterval(render, 700);
    render();
  </script>
</body>
</html>`)
  displayWindow.document.close()
  displayWindow.focus()
  return displayWindow
}

export default function SalesPosPage({ controls, onAction, searchValue = '', onSearchChange, session }) {
  const [settings] = useState(() => loadSettings())
  const [products, setProducts] = useState(() => loadProducts())
  const [customers, setCustomers] = useState(() => loadCustomers())
  const [invoices, setInvoices] = useState(() => readArray(INVOICES_KEY))
  const [suspendedSales, setSuspendedSales] = useState(() => readArray(SUSPENDED_KEY))
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [productQuery, setProductQuery] = useState('')
  const [customerQuery, setCustomerQuery] = useState('')
  const [customer, setCustomer] = useState(cashCustomer)
  const [lines, setLines] = useState([])
  const [payment, setPayment] = useState({ method: 'Efectivo', received: '', card: '', transfer: '', reference: '', bank: '' })
  const [fiscalReceipt, setFiscalReceipt] = useState(defaultFiscalReceipt)
  const [rncLookupNote, setRncLookupNote] = useState('')
  const [message, setMessage] = useState('')
  const [completedInvoice, setCompletedInvoice] = useState(null)
  const [showSuspended, setShowSuspended] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    setProducts(loadProducts())
    setCustomers(loadCustomers())
    setInvoices(readArray(INVOICES_KEY))
  }, [])

  const branch = defaultBranch(settings)
  const warehouse = defaultWarehouse(settings, branch.code)
  const totals = useMemo(() => calculateTotals(lines, payment), [lines, payment])
  const categories = useMemo(() => ['Todas', ...Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort()], [products])
  const fiscalPreview = useMemo(() => (
    fiscalReceipt.enabled ? previewNextNcf(fiscalReceipt.receiptType, branch.code) : { ncf: '', validUntil: '', error: '' }
  ), [branch.code, fiscalReceipt.enabled, fiscalReceipt.receiptType])

  const filteredProducts = useMemo(() => {
    const query = cleanText(`${searchValue || ''} ${productQuery}`.trim())
    return products
      .filter((product) => product.status !== 'Inactivo')
      .filter((product) => selectedCategory === 'Todas' || product.category === selectedCategory)
      .filter((product) => !query || [product.code, product.name, product.barcode, product.category].some((field) => cleanText(field).includes(query)))
      .slice(0, 72)
  }, [products, productQuery, searchValue, selectedCategory])

  const filteredCustomers = useMemo(() => {
    const query = cleanText(customerQuery)
    return customers
      .filter((item) => !query || [item.code, item.name, item.fiscalId, item.phone].some((field) => cleanText(field).includes(query)))
      .slice(0, 20)
  }, [customers, customerQuery])
  const itemCount = useMemo(() => lines.reduce((sum, line) => sum + toNumber(line.quantity), 0), [lines])

  useEffect(() => {
    const displayInvoice = completedInvoice
    const displayLines = displayInvoice?.lines || lines
    const displayTotals = displayInvoice?.totals || totals
    const displayCustomer = displayInvoice
      ? {
          ...customer,
          name: displayInvoice.customer || customer.name,
          fiscalId: displayInvoice.fiscalId || customer.fiscalId,
        }
      : customer
    const displayFiscal = displayInvoice
      ? {
          enabled: Boolean(displayInvoice.comprobanteFiscal || displayInvoice.ncf),
          name: displayInvoice.customer,
          fiscalId: displayInvoice.fiscalId,
          receiptType: displayInvoice.receiptType || displayInvoice.tipoComprobante || 'Consumidor final',
        }
      : fiscalReceipt
    const status = displayInvoice
      ? 'Pago completado'
      : lines.length
        ? totals.paid > 0
          ? 'Pago en proceso'
          : 'Esperando pago'
        : 'Esperando venta'

    publishPosDisplay(buildPosDisplayPayload({
      settings,
      branch,
      warehouse,
      session,
      customer: displayCustomer,
      lines: displayLines,
      totals: displayTotals,
      payment,
      fiscalReceipt: displayFiscal,
      status,
    }))
  }, [branch, completedInvoice, customer, fiscalReceipt, lines, payment, session, settings, totals, warehouse])

  const notify = (text) => {
    setMessage(text)
    onAction?.(text)
  }

  const openCustomerDisplay = () => {
    const displayWindow = openCustomerDisplayWindow()
    notify(displayWindow ? 'Pantalla cliente abierta. Puede moverla al segundo monitor.' : 'El navegador bloqueo la pantalla cliente. Permita ventanas emergentes.')
  }

  const resetSale = () => {
    setLines([])
    setPayment({ method: 'Efectivo', received: '', card: '', transfer: '', reference: '', bank: '' })
    setCustomer(cashCustomer)
    setCustomerQuery('')
    setProductQuery('')
    setFiscalReceipt(defaultFiscalReceipt)
    setRncLookupNote('')
    setCompletedInvoice(null)
  }

  const selectCustomer = (code) => {
    const nextCustomer = customers.find((item) => item.code === code) || cashCustomer
    setCustomer(nextCustomer)
    setCustomerQuery(`${nextCustomer.code} - ${nextCustomer.name}${nextCustomer.fiscalId ? ` - ${nextCustomer.fiscalId}` : ''}`)
    setFiscalReceipt((current) => current.enabled ? mergeFiscalCustomer(current, nextCustomer) : current)
    if (nextCustomer.paymentCondition === 'Credito') {
      setPayment((current) => ({ ...current, method: 'Credito' }))
    }
  }

  const toggleFiscalReceipt = (enabled) => {
    setFiscalReceipt((current) => {
      if (!enabled) {
        setRncLookupNote('')
        return { ...defaultFiscalReceipt, enabled: false }
      }
      return mergeFiscalCustomer({ ...current, enabled: true, receiptType: current.receiptType || 'Credito fiscal' }, customer)
    })
  }

  const updateFiscalRnc = (value) => {
    setFiscalReceipt((current) => ({ ...current, fiscalId: value }))
    const rnc = normalizeRnc(value)
    if (rnc.length < 9) {
      setRncLookupNote('')
      return
    }

    void rncService.getByRnc(rnc).then((record) => {
      if (!record) {
        setRncLookupNote('RNC no encontrado en la base.')
        return
      }
      setFiscalReceipt((current) => ({
        ...current,
        fiscalId: record.rnc,
        name: record.razonSocial,
        fiscalActivity: record.actividadEconomica,
        fiscalStatus: record.estado,
        fiscalRegimen: record.regimenPago,
      }))
      setRncLookupNote(`RNC encontrado: ${record.razonSocial}`)
    })
  }

  const updateCustomerQuery = (value) => {
    setCustomerQuery(value)
    const normalized = cleanText(value)
    const match = customers.find((item) => (
      cleanText(item.code) === normalized ||
      cleanText(item.fiscalId) === normalized ||
      cleanText(`${item.code} - ${item.name}`) === normalized ||
      cleanText(`${item.code} - ${item.name} - ${item.fiscalId}`) === normalized
    ))

    if (match) selectCustomer(match.code)
  }

  const updateProductQuery = (value) => {
    setProductQuery(value)
    const normalized = cleanText(value)
    const match = products.find((product) => cleanText(product.code) === normalized || cleanText(product.barcode) === normalized)
    if (match) addProduct(match)
  }

  const addProduct = (product) => {
    if (!product || product.status === 'Inactivo') {
      notify('Producto no disponible para venta.')
      return
    }

    setLines((current) => {
      const existing = current.find((line) => line.code === product.code)
      if (existing) {
        return current.map((line) => line.code === product.code ? { ...line, quantity: toNumber(line.quantity) + 1 } : line)
      }
      return [...current, makeLine(product)]
    })
    setProductQuery('')
  }

  const updateLine = (lineId, field, value) => {
    setLines((current) => current.map((line) => line.id === lineId ? { ...line, [field]: value } : line))
  }

  const changeQty = (lineId, step) => {
    setLines((current) => current.map((line) => {
      if (line.id !== lineId) return line
      return { ...line, quantity: Math.max(1, toNumber(line.quantity) + step) }
    }))
  }

  const removeLine = (lineId) => {
    setLines((current) => current.filter((line) => line.id !== lineId))
  }

  const validateSale = () => {
    if (lines.length === 0) return 'Debe agregar productos al carrito.'
    if (!payment.method) return 'Seleccione una forma de pago.'
    if (payment.method === 'Credito' && customer.code === cashCustomer.code) return 'La venta a credito requiere un cliente registrado.'

    const allowNegativeStock = Boolean(settings.preferences?.allowNegativeStock)
    if (!allowNegativeStock) {
      const badLine = lines.find((line) => {
        const product = products.find((item) => item.code === line.code)
        return product && toNumber(product.stock) < toNumber(line.quantity)
      })
      if (badLine) {
        const product = products.find((item) => item.code === badLine.code)
        return `Stock insuficiente para ${badLine.name}. Disponible: ${formatQuantity(product?.stock || 0)}.`
      }
    }

    if (payment.method === 'Efectivo' && toNumber(payment.received) < totals.total) return 'El monto recibido no cubre el total.'
    if (payment.method === 'Mixto' && totals.paid < totals.total) return 'El pago mixto no cubre el total.'
    if (fiscalReceipt.enabled) {
      if (!String(fiscalReceipt.fiscalId).trim()) return 'El RNC del cliente es obligatorio para comprobante fiscal.'
      if (!String(fiscalReceipt.name).trim()) return 'El nombre o razon social es obligatorio para comprobante fiscal.'
      if (!String(fiscalReceipt.receiptType).trim()) return 'Seleccione el tipo de comprobante fiscal.'
      if (!fiscalPreview.ncf) return fiscalPreview.error || 'No hay secuencia NCF configurada para este tipo de comprobante.'
    }

    return ''
  }

  const applyInventoryExit = (invoice) => {
    const movementDate = new Date().toISOString()
    const movements = readArray(MOVEMENTS_KEY)
    const nextMovements = [...movements]
    const nextProducts = products.map((product) => {
      const line = invoice.lines.find((item) => item.code === product.code)
      if (!line) return product
      const nextStock = toNumber(product.stock) - toNumber(line.quantity)
      nextMovements.push({
        id: makeId('movement'),
        date: movementDate,
        type: 'Salida por venta POS',
        document: invoice.number,
        productCode: line.code,
        productName: line.name,
        warehouse: invoice.warehouse,
        branch: invoice.branch,
        entry: 0,
        exit: toNumber(line.quantity),
        balance: nextStock,
        user: invoice.seller || 'Caja',
        reference: 'Punto de venta',
      })
      return { ...product, stock: nextStock, updatedAt: movementDate }
    })

    setProducts(nextProducts)
    saveProducts(nextProducts)
    writeStorage(MOVEMENTS_KEY, nextMovements)
  }

  const saveReport = (invoice, invoiceTotals) => {
    const reports = readArray(REPORTS_KEY)
    const record = buildReport(invoice, invoiceTotals)
    const nextReports = reports.some((item) => item.number === invoice.number)
      ? reports.map((item) => item.number === invoice.number ? record : item)
      : [record, ...reports]
    writeStorage(REPORTS_KEY, nextReports)
  }

  const saveCashMovement = (invoice, invoiceTotals) => {
    const cashMovements = readArray(CASH_MOVEMENTS_KEY)
    const entryAmount = invoice.paymentMethod === 'Credito' ? 0 : invoiceTotals.total
    const record = {
      id: makeId('cash'),
      date: new Date().toISOString(),
      type: 'Venta POS',
      concept: `Factura ${invoice.number}`,
      invoiceNumber: invoice.number,
      method: invoice.paymentMethod,
      reference: payment.reference || payment.bank || '',
      entry: entryAmount,
      salida: 0,
      balance: 0,
      user: invoice.seller,
    }
    writeStorage(CASH_MOVEMENTS_KEY, [record, ...cashMovements])
  }

  const savePosSale = (invoice) => {
    const sales = readArray(POS_SALES_KEY)
    writeStorage(POS_SALES_KEY, [{ invoiceNumber: invoice.number, id: invoice.id, date: invoice.date, total: invoice.totals.total }, ...sales])
  }

  const collectPaymentSnapshot = () => ({
    method: payment.method,
    received: payment.method === 'Efectivo' ? toNumber(payment.received) : totals.paid,
    cash: toNumber(payment.cash),
    card: toNumber(payment.card),
    transfer: toNumber(payment.transfer),
    reference: payment.reference,
    bank: payment.bank,
  })

  const completeSale = async () => {
    const error = validateSale()
    if (error) {
      notify(error)
      return
    }

    const freshInvoices = readArray(INVOICES_KEY)
    const isFiscalReceipt = Boolean(fiscalReceipt.enabled)
    const receiptType = isFiscalReceipt ? fiscalReceipt.receiptType : 'Consumidor final'
    let ncf = isFiscalReceipt ? '' : nextNcf(settings, freshInvoices, receiptType)
    let ncfValidUntil = settings.fiscal?.ncfValidUntil || ''

    if (isFiscalReceipt) {
      const consumed = generateNextNcf(receiptType, branch.code, {
        documentType: 'Factura POS',
        moduloOrigen: 'Ventas > Punto de venta',
        clienteProveedor: fiscalReceipt.name,
        total: calculateTotals(lines, payment).total,
        usuario: session?.fullName || session?.username || 'Caja',
      })
      if (!consumed.ncf) {
        notify(consumed.error || 'No hay secuencia NCF configurada para este tipo de comprobante.')
        return
      }
      ncf = consumed.ncf
      ncfValidUntil = consumed.validUntil || ncfValidUntil
    } else if (settings.fiscal?.useNcf) {
      const consumed = consumeNextNcf(receiptType)
      if (consumed.ncf) {
        ncf = consumed.ncf
        ncfValidUntil = consumed.validUntil || ncfValidUntil
      }
    }

    const invoiceTotals = calculateTotals(lines, payment)
    const invoiceCustomer = isFiscalReceipt
      ? {
          code: customer.code === cashCustomer.code ? 'CLI-FISCAL-POS' : customer.code,
          name: fiscalReceipt.name.trim(),
          fiscalId: fiscalReceipt.fiscalId.trim(),
          phone: fiscalReceipt.phone,
          email: customer.email,
          address: fiscalReceipt.address,
          paymentCondition: fiscalReceipt.paymentCondition || customer.paymentCondition || 'Contado',
          creditDays: customer.creditDays,
        }
      : customer
    const invoice = {
      id: makeId('invoice'),
      number: nextInvoiceNumber(settings, freshInvoices),
      date: todayDate(),
      customerCode: invoiceCustomer.code,
      customer: invoiceCustomer.name,
      fiscalId: isFiscalReceipt ? invoiceCustomer.fiscalId : '',
      phone: invoiceCustomer.phone,
      email: invoiceCustomer.email,
      invoiceEmail: invoiceCustomer.email,
      address: invoiceCustomer.address,
      seller: session?.fullName || session?.username || 'Caja',
      branch: branch.code,
      warehouse,
      paymentCondition: payment.method === 'Credito' ? 'Credito' : invoiceCustomer.paymentCondition || 'Contado',
      paymentMethod: payment.method,
      paymentDetail: collectPaymentSnapshot(),
      receiptType,
      tipoComprobante: receiptType,
      comprobanteFiscal: isFiscalReceipt,
      ncf,
      ncfValidUntil,
      ncfValidoHasta: ncfValidUntil,
      dueDate: payment.method === 'Credito' ? todayDate() : todayDate(),
      creditDays: payment.method === 'Credito' ? toNumber(invoiceCustomer.creditDays) : 0,
      state: payment.method === 'Credito' ? 'Pendiente' : 'Pagada',
      paidAmount: payment.method === 'Credito' ? 0 : invoiceTotals.paid,
      totals: invoiceTotals,
      lines,
      source: 'POS',
      inventoryApplied: true,
      printFormat: ticketSettings().billing.printFormat,
      thermalTicket: true,
      thermalPrint: {
        format: ticketSettings().billing.printFormat,
        ready: true,
        generatedAt: new Date().toISOString(),
      },
      pdf: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const pdfInfo = createPdfMetadata(invoice, ticketSettings(), 'invoice')
    const savedInvoice = { ...invoice, pdf: pdfInfo }
    const nextInvoices = [savedInvoice, ...freshInvoices]

    applyInventoryExit(savedInvoice)
    setInvoices(nextInvoices)
    writeStorage(INVOICES_KEY, nextInvoices)
    void invoicesService.replaceAll(nextInvoices)
    saveReport(savedInvoice, invoiceTotals)
    saveCashMovement(savedInvoice, invoiceTotals)
    savePosSale(savedInvoice)
    if (savedInvoice.ncf) {
      markNcfAsUsed(savedInvoice.ncf, savedInvoice.number, 'Factura POS', {
        tipoComprobante: savedInvoice.tipoComprobante || savedInvoice.receiptType,
        clienteProveedor: savedInvoice.customer,
        total: savedInvoice.totals.total,
        usuario: savedInvoice.seller,
        moduloOrigen: 'Ventas > Punto de venta',
      })
      registerIssuedElectronicDocument(savedInvoice, ticketSettings(), {
        sourceModule: 'Ventas > Punto de venta',
        documentType: 'Factura POS',
      })
    }
    const existingAccountingEntry = readAccountingArray(ACCOUNTING_KEYS.entries).some((entry) => entry.sourceDocument === savedInvoice.number && entry.sourceModule === 'Ventas')
    if (!existingAccountingEntry) createSalesInvoiceEntry(savedInvoice)
    setCompletedInvoice(savedInvoice)
    setLines([])
    setPayment({ method: 'Efectivo', received: '', card: '', transfer: '', reference: '', bank: '' })
    setFiscalReceipt(defaultFiscalReceipt)
    const ticketWindow = openThermalTicket(savedInvoice, ticketSettings(), { autoPrint: true })
    notify(ticketWindow ? `Venta POS completada: ${savedInvoice.number}. Ticket termico listo.` : `Venta POS completada: ${savedInvoice.number}. Active ventanas emergentes para imprimir el ticket.`)
  }

  const ticketSettings = () => ({
    ...settings,
    billing: {
      ...settings.billing,
      invoiceModel: settings.billing?.invoiceModel || 'Ticket / POS',
      printFormat: String(settings.billing?.printFormat || '').includes('Ticket') ? settings.billing.printFormat : 'Ticket 80mm',
      fontSize: settings.billing?.fontSize || '10',
    },
  })

  const printCompleted = () => {
    if (!completedInvoice) return
    const printedAt = new Date().toISOString()
    const ticketWindow = openThermalTicket(completedInvoice, ticketSettings(), { autoPrint: true })
    const nextInvoices = readArray(INVOICES_KEY).map((item) => item.number === completedInvoice.number ? {
      ...item,
      thermalPrint: {
        ...(item.thermalPrint || {}),
        lastPrintedAt: printedAt,
        format: ticketSettings().billing.printFormat,
      },
    } : item)
    writeStorage(INVOICES_KEY, nextInvoices)
    setInvoices(nextInvoices)
    setCompletedInvoice((current) => current ? {
      ...current,
      thermalPrint: {
        ...(current.thermalPrint || {}),
        lastPrintedAt: printedAt,
        format: ticketSettings().billing.printFormat,
      },
    } : current)
    if (!ticketWindow) notify('Active ventanas emergentes para reimprimir el ticket termico.')
  }

  const downloadCompleted = async () => {
    if (!completedInvoice) return
    await downloadSalesDocumentPdf({ documentData: completedInvoice, settings: ticketSettings(), documentType: 'invoice' })
  }

  const suspendSale = () => {
    if (lines.length === 0) {
      notify('No hay productos para suspender.')
      return
    }
    const record = {
      id: makeId('suspended'),
      date: new Date().toISOString(),
      customer,
      lines,
      payment,
      fiscalReceipt,
      total: totals.total,
      user: session?.fullName || 'Caja',
    }
    const next = [record, ...suspendedSales]
    setSuspendedSales(next)
    writeStorage(SUSPENDED_KEY, next)
    resetSale()
    notify('Venta suspendida correctamente.')
  }

  const recoverSale = (record) => {
    setCustomer(record.customer || cashCustomer)
    setLines(record.lines || [])
    setPayment(record.payment || { method: 'Efectivo', received: '', card: '', transfer: '', reference: '', bank: '' })
    setFiscalReceipt(record.fiscalReceipt || defaultFiscalReceipt)
    const next = suspendedSales.filter((item) => item.id !== record.id)
    setSuspendedSales(next)
    writeStorage(SUSPENDED_KEY, next)
    setShowSuspended(false)
    notify('Venta suspendida recuperada.')
  }

  const toggleFullscreen = () => {
    setFullscreen((current) => !current)
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {})
      return
    }
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {})
    }
  }

  const updatePaymentMethod = (method) => {
    setPayment((current) => ({
      ...current,
      method,
      received: method === 'Efectivo' ? current.received : '',
    }))
  }

  const clearProductFilters = () => {
    setProductQuery('')
    setSelectedCategory('Todas')
    onSearchChange?.('')
  }

  const paymentInputs = (
    <div className="pos-payment-fields">
      {payment.method === 'Efectivo' && (
        <label>Monto recibido<input type="number" min="0" value={payment.received} onChange={(event) => setPayment((current) => ({ ...current, received: event.target.value }))} /></label>
      )}
      {payment.method === 'Tarjeta' && (
        <label>Autorizacion<input value={payment.reference} onChange={(event) => setPayment((current) => ({ ...current, reference: event.target.value }))} /></label>
      )}
      {payment.method === 'Transferencia' && (
        <>
          <label>Banco<input value={payment.bank} onChange={(event) => setPayment((current) => ({ ...current, bank: event.target.value }))} /></label>
          <label>Referencia<input value={payment.reference} onChange={(event) => setPayment((current) => ({ ...current, reference: event.target.value }))} /></label>
        </>
      )}
      {payment.method === 'Mixto' && (
        <>
          <label>Efectivo<input type="number" min="0" value={payment.cash} onChange={(event) => setPayment((current) => ({ ...current, cash: event.target.value }))} /></label>
          <label>Tarjeta<input type="number" min="0" value={payment.card} onChange={(event) => setPayment((current) => ({ ...current, card: event.target.value }))} /></label>
          <label>Transferencia<input type="number" min="0" value={payment.transfer} onChange={(event) => setPayment((current) => ({ ...current, transfer: event.target.value }))} /></label>
          <label>Referencia<input value={payment.reference} onChange={(event) => setPayment((current) => ({ ...current, reference: event.target.value }))} /></label>
        </>
      )}
      {payment.method === 'Credito' && (
        <div className="pos-credit-note">Credito disponible solo para clientes registrados.</div>
      )}
    </div>
  )

  return (
    <ModulePageLayout
      title="Punto de venta"
      moduleLabel="Ventas"
      breadcrumb={['Ventas', 'Punto de venta']}
      description="Caja touch para facturar rapido, descontar inventario y generar tickets."
      searchValue={searchValue}
      searchPlaceholder="Buscar producto en POS"
      onSearchChange={onSearchChange}
      actions={[]}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      <section className={`sales-pos-page ${fullscreen ? 'is-pos-fullscreen' : ''}`}>
        {message && <div className="pos-message">{message}</div>}

        <header className="pos-operator-bar">
          <div className="pos-brand-block">
            <div className="pos-brand-mark" aria-hidden="true" />
            <div>
              <strong>INVE-FAT SYSTEM</strong>
              <span>ERP Empresarial</span>
            </div>
          </div>

          <div className="pos-session-metrics">
            <article>
              <span>Caja activa</span>
              <strong><i />CA-01</strong>
            </article>
            <article>
              <span>Sucursal</span>
              <strong><Store size={16} />{branch.name || branch.code}</strong>
            </article>
            <article>
              <span>Cajero</span>
              <strong><User size={16} />{session?.fullName || session?.username || 'Caja'}</strong>
            </article>
          </div>

          <label className="pos-global-search">
            <Search size={18} />
            <input
              value={productQuery}
              onChange={(event) => updateProductQuery(event.target.value)}
              placeholder="Buscar productos, clientes, facturas..."
              autoComplete="off"
            />
            <kbd>Ctrl + K</kbd>
          </label>

          <div className="pos-quick-actions">
            <button type="button" onClick={suspendSale} disabled={lines.length === 0} title="Suspender venta"><Pause size={18} /><span>Suspender</span></button>
            <button type="button" onClick={resetSale} title="Nueva venta"><Plus size={18} /><span>Nueva venta</span></button>
            <button type="button" onClick={() => notify('Descuento por linea disponible desde el detalle de productos.')} title="Descuento"><Tag size={18} /><span>Descuento</span></button>
            <button type="button" onClick={printCompleted} disabled={!completedInvoice} title="Reimprimir"><Printer size={18} /><span>Reimprimir</span></button>
            <button type="button" onClick={() => notify('Apertura de caja preparada para integracion de efectivo.')} title="Abrir caja"><Banknote size={18} /><span>Abrir caja</span></button>
            <button type="button" onClick={openCustomerDisplay} title="Pantalla cliente"><Monitor size={18} /><span>Pantalla cliente</span></button>
            <button type="button" onClick={toggleFullscreen} title={fullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}><Maximize2 size={18} /><span>{fullscreen ? 'Salir' : 'Pantalla'}</span></button>
            <button type="button" onClick={() => notify('Mas opciones POS preparadas.')} title="Mas opciones"><MoreVertical size={18} /><span>Mas</span></button>
          </div>
        </header>

        <div className="pos-shell">
          <section className="pos-product-zone">
            <div className="pos-search-card">
              <div className="pos-search-header">
                <div>
                  <span>Productos</span>
                  <strong>{filteredProducts.length} encontrados</strong>
                </div>
                <button type="button" onClick={clearProductFilters}>Limpiar filtros</button>
              </div>

              <div className="pos-search-grid">
                <label className="pos-search-field">
                  <Search size={20} />
                  <input
                    value={productQuery}
                    onChange={(event) => updateProductQuery(event.target.value)}
                    placeholder="Buscar por nombre, codigo, barra o categoria"
                    autoComplete="off"
                  />
                </label>
                <label className="pos-category-select">
                  Categoria
                  <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                    {categories.map((category) => <option key={category}>{category}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="pos-category-row">
              {categories.map((category) => (
                <button type="button" key={category} className={selectedCategory === category ? 'is-active' : ''} onClick={() => setSelectedCategory(category)}>
                  {category}
                </button>
              ))}
            </div>

            <div className="pos-products-grid">
              {filteredProducts.map((product) => {
                const stockStatus = productStockStatus(product)
                return (
                  <button type="button" key={product.code} className={`pos-product-card ${stockStatus.className}`} onClick={() => addProduct(product)}>
                    <div className="pos-product-image">
                      {product.image ? <img src={product.image} alt={product.name} /> : <Package size={28} />}
                    </div>
                    <div className="pos-product-info">
                      <strong>{product.name}</strong>
                      <span>{product.code}</span>
                    </div>
                    <div className="pos-product-meta">
                      <strong>{currency(product.price, settings)}</strong>
                      <small>Stock {formatQuantity(product.stock)}</small>
                    </div>
                    <em className={`pos-stock-pill ${stockStatus.className}`}>{stockStatus.label}</em>
                    <span className="pos-add-badge" aria-hidden="true"><Plus size={18} /></span>
                  </button>
                )
              })}
              {filteredProducts.length === 0 && (
                <div className="pos-empty-card">
                  <Package size={30} />
                  <strong>No hay productos encontrados.</strong>
                  <span>Prueba con otro nombre, codigo, barra o categoria.</span>
                </div>
              )}
            </div>
          </section>

          <aside className="pos-cart-zone">
            <div className="pos-cart-list">
              <div className="pos-cart-heading">
                <div>
                  <ReceiptText size={18} />
                  <strong>Detalle de la venta</strong>
                </div>
                <span>{formatQuantity(itemCount)} Articulos</span>
              </div>

              {lines.length === 0 && <div className="pos-empty-cart">Agregue productos para iniciar la venta.</div>}
              {lines.map((line) => (
                <article key={line.id} className="pos-cart-line">
                  <div>
                    <strong>{line.name}</strong>
                    <span>{line.code} | {line.unit}</span>
                  </div>
                  <div className="pos-qty-controls">
                    <button type="button" onClick={() => changeQty(line.id, -1)}><Minus size={16} /></button>
                    <input type="number" min="1" value={line.quantity} onChange={(event) => updateLine(line.id, 'quantity', event.target.value)} />
                    <button type="button" onClick={() => changeQty(line.id, 1)}><Plus size={16} /></button>
                  </div>
                  <div className="pos-line-money">
                    <input type="number" min="0" value={line.price} onChange={(event) => updateLine(line.id, 'price', event.target.value)} title="Precio" />
                    <input type="number" min="0" value={line.discount} onChange={(event) => updateLine(line.id, 'discount', event.target.value)} title="Descuento" />
                    <strong>{currency(lineTotal(line), settings)}</strong>
                  </div>
                  <button type="button" className="pos-remove-line" onClick={() => removeLine(line.id)} title="Eliminar linea">
                    <Trash2 size={17} />
                  </button>
                </article>
              ))}
            </div>

            <div className="pos-checkout-details">
              <div className="pos-customer-card">
                <div>
                  <span>Cliente</span>
                  <strong>{customer.name}</strong>
                  <small>{customer.fiscalId || 'Consumidor final'}</small>
                </div>
                <label>
                  Buscar cliente
                  <input value={customerQuery} onChange={(event) => updateCustomerQuery(event.target.value)} placeholder="Codigo, nombre o RNC" list="pos-customers" />
                </label>
                <select value={customer.code} onChange={(event) => selectCustomer(event.target.value)}>
                  {filteredCustomers.map((item) => <option key={item.code} value={item.code}>{item.code} - {item.name}</option>)}
                </select>
                <datalist id="pos-customers">
                  {filteredCustomers.map((item) => <option key={item.code} value={`${item.code} - ${item.name}`} />)}
                </datalist>
              </div>

              <div className="pos-fiscal-card">
                <div className="pos-fiscal-header">
                  <div>
                    <span>Comprobante</span>
                    <strong>{fiscalReceipt.enabled ? fiscalReceipt.receiptType : 'Consumidor final'}</strong>
                  </div>
                  <div className="pos-fiscal-toggle" role="group" aria-label="Factura con comprobante fiscal">
                    <button type="button" className={!fiscalReceipt.enabled ? 'is-active' : ''} onClick={() => toggleFiscalReceipt(false)} aria-pressed={!fiscalReceipt.enabled}>No</button>
                    <button type="button" className={fiscalReceipt.enabled ? 'is-active' : ''} onClick={() => toggleFiscalReceipt(true)} aria-pressed={fiscalReceipt.enabled}>Si</button>
                  </div>
                </div>

                {!fiscalReceipt.enabled && (
                  <div className="pos-fiscal-note">
                    Venta como consumidor final.
                  </div>
                )}

                {fiscalReceipt.enabled && (
                  <div className="pos-fiscal-grid">
                    <label>
                      RNC cliente
                      <input value={fiscalReceipt.fiscalId} onChange={(event) => updateFiscalRnc(event.target.value)} placeholder="RNC obligatorio" />
                    </label>
                    <label>
                      Razon social
                      <input value={fiscalReceipt.name} onChange={(event) => setFiscalReceipt((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre fiscal" />
                    </label>
                    <label>
                      Tipo
                      <select value={fiscalReceipt.receiptType} onChange={(event) => setFiscalReceipt((current) => ({ ...current, receiptType: event.target.value }))}>
                        {fiscalReceiptTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </label>
                    <label>
                      NCF
                      <input readOnly value={fiscalPreview.ncf || 'Sin secuencia'} />
                    </label>
                    {fiscalPreview.error && <div className="pos-fiscal-warning">{fiscalPreview.error}</div>}
                    {rncLookupNote && <div className="pos-fiscal-warning">{rncLookupNote}</div>}
                  </div>
                )}
              </div>
            </div>

            <div className="pos-payment-panel">
              <div className="pos-payment-methods">
                {paymentMethods.map((method) => (
                  <button type="button" key={method} className={payment.method === method ? 'is-active' : ''} onClick={() => updatePaymentMethod(method)}>
                    {method === 'Efectivo' ? <Banknote size={17} /> : <CreditCard size={17} />}
                    {method}
                  </button>
                ))}
              </div>
              {paymentInputs}
            </div>

            <div className="pos-total-panel">
              <div><span>Subtotal</span><strong>{currency(totals.subtotal, settings)}</strong></div>
              <div><span>Descuento</span><strong>{currency(totals.discountTotal, settings)}</strong></div>
              <div><span>Impuesto</span><strong>{currency(totals.taxTotal, settings)}</strong></div>
              <div><span>Pagado</span><strong>{currency(totals.paid, settings)}</strong></div>
              <div><span>Devuelta</span><strong>{currency(totals.change, settings)}</strong></div>
              <div className="is-grand"><span>Total</span><strong>{currency(totals.total, settings)}</strong></div>
              <button type="button" className="pos-charge-button" onClick={completeSale}>
                <ReceiptText size={22} />
                Cobrar {currency(totals.total, settings)}
              </button>
              <button type="button" className="pos-clear-button" onClick={resetSale} disabled={lines.length === 0}>
                <Trash2 size={17} />
                Limpiar venta
              </button>
            </div>
          </aside>
        </div>

        {showSuspended && (
          <div className="pos-modal-backdrop" role="presentation">
            <section className="pos-modal" role="dialog" aria-modal="true">
              <header>
                <div>
                  <span>Caja</span>
                  <h2>Ventas suspendidas</h2>
                </div>
                <button type="button" onClick={() => setShowSuspended(false)}><X size={18} /></button>
              </header>
              <div className="pos-modal-body">
                {suspendedSales.length === 0 && <div className="pos-empty-card">No hay ventas suspendidas.</div>}
                {suspendedSales.map((sale) => (
                  <article key={sale.id} className="pos-suspended-row">
                    <div>
                      <strong>{sale.customer?.name || 'Consumidor final'}</strong>
                      <span>{new Date(sale.date).toLocaleString('es-DO')} | {sale.lines?.length || 0} producto(s)</span>
                    </div>
                    <strong>{currency(sale.total, settings)}</strong>
                    <button type="button" onClick={() => recoverSale(sale)}>Recuperar</button>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {completedInvoice && (
          <div className="pos-modal-backdrop" role="presentation">
            <section className="pos-modal pos-completed-modal" role="dialog" aria-modal="true">
              <header>
                <div>
                  <span>Venta completada</span>
                  <h2>{completedInvoice.number}</h2>
                </div>
                <button type="button" onClick={() => setCompletedInvoice(null)}><X size={18} /></button>
              </header>
              <div className="pos-modal-body">
                <div className="pos-success-card">
                  <ReceiptText size={42} />
                  <strong>{currency(completedInvoice.totals.total, settings)}</strong>
                  <span>{completedInvoice.customer} | {completedInvoice.paymentMethod}</span>
                  {completedInvoice.ncf && <small>NCF: {completedInvoice.ncf}</small>}
                </div>
              </div>
              <footer>
                <button type="button" onClick={() => setCompletedInvoice(null)}>Cerrar</button>
                <button type="button" onClick={downloadCompleted}><Download size={16} /> Descargar</button>
                <button type="button" onClick={printCompleted}><Printer size={16} /> Imprimir ticket</button>
                <button type="button" className="pos-primary-button" onClick={resetSale}><RefreshCcw size={16} /> Nueva venta</button>
              </footer>
            </section>
          </div>
        )}
      </section>
    </ModulePageLayout>
  )
}
