import { Ban, Edit3, Plus, RotateCcw, Save, Upload, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getSupabaseConfigStatus } from '../../lib/supabaseClient.js'
import { downloadBackup, importBackupFile } from '../../services/backupService.js'
import { settingsService } from '../../services/settingsService.js'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import './SettingsGeneralPage.css'

const STORAGE_KEY = 'invefat_company_settings'

const tabs = [
  { id: 'company', label: 'Empresa' },
  { id: 'brand', label: 'Logo y marca' },
  { id: 'documents', label: 'Documentos' },
  { id: 'billing', label: 'Facturacion e impresion' },
  { id: 'branches', label: 'Sucursales' },
  { id: 'warehouses', label: 'Almacenes por sucursal' },
  { id: 'numbering', label: 'Numeracion' },
  { id: 'preferences', label: 'Preferencias generales' },
  { id: 'backup', label: 'Respaldo' },
]

const invoiceModels = [
  'Moderno profesional',
  'Clasico empresarial',
  'Compacto',
  'Detallado',
  'Ticket / POS 80mm',
  'Ticket / POS 58mm',
]

const printFormats = [
  'A4',
  'Carta',
  'Media carta',
  'Ticket 80mm',
  'Ticket 58mm',
]

const defaultWarehouses = [
  { code: 'ALM-01', name: 'Almacen Principal' },
  { code: 'ALM-02', name: 'Almacen Sucursal' },
]

const defaultBranch = {
  code: 'MAT-01',
  name: 'Empresa matriz',
  address: 'Direccion principal',
  phone: '',
  manager: 'Administrador',
  email: '',
  status: 'Activa',
  mainWarehouse: 'ALM-01',
}

const emptyBranch = {
  code: '',
  name: '',
  address: '',
  phone: '',
  manager: '',
  email: '',
  status: 'Activa',
  mainWarehouse: 'ALM-01',
}

const defaultSettings = {
  company: {
    tradeName: 'INVE-FAT SYSTEM',
    legalName: 'Empresa Principal',
    fiscalId: '',
    address: '',
    city: '',
    province: '',
    country: 'Republica Dominicana',
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    businessActivity: '',
    legalRepresentative: '',
    currency: 'RD$',
    defaultTax: 'ITBIS 18%',
    legalNote: 'Gracias por su compra.',
  },
  brand: {
    logo: '',
    primaryColor: '#0f2742',
    secondaryColor: '#eef3f8',
    accentColor: '#f1872d',
  },
  documentOptions: {
    showLogo: true,
    showFiscalId: true,
    showPhone: true,
    showAddress: true,
    showEmail: true,
    showSeller: true,
    showCreatedBy: true,
    showBranch: true,
    showWarehouse: true,
    showLegalNote: true,
    showQr: false,
  },
  billing: {
    invoiceModel: 'Moderno profesional',
    printFormat: 'Carta',
    orientation: 'Vertical',
    fontSize: '12',
    pricesIncludeTax: false,
    showLineDiscount: true,
    showTotals: true,
    showSignature: true,
    showStamp: false,
    showQr: false,
    footerMessage: 'Documento generado por INVE-FAT SYSTEM.',
  },
  fiscal: {
    useNcf: false,
    defaultReceiptType: 'Consumidor final',
    ncfPrefix: 'B02',
    nextNcf: 1,
    ncfLength: 8,
    ncfValidUntil: '',
    showNcf: true,
    showNcfValidUntil: true,
    showPaymentCondition: true,
  },
  branches: [defaultBranch],
  warehouses: defaultWarehouses,
  numbering: {
    invoice: { label: 'Factura', prefix: 'FAC', nextNumber: 1, length: 6, separator: '-' },
    quote: { label: 'Cotizacion', prefix: 'COT', nextNumber: 1, length: 6, separator: '-' },
    purchaseOrder: { label: 'Orden de compra', prefix: 'OC', nextNumber: 1, length: 6, separator: '-' },
    receiving: { label: 'Recepcion de mercancia', prefix: 'REC', nextNumber: 1, length: 6, separator: '-' },
    creditNote: { label: 'Nota de credito', prefix: 'NC', nextNumber: 1, length: 6, separator: '-' },
    inventoryAdjustment: { label: 'Ajuste de inventario', prefix: 'AJU', nextNumber: 1, length: 6, separator: '-' },
    transfer: { label: 'Transferencia', prefix: 'TRA', nextNumber: 1, length: 6, separator: '-' },
  },
  preferences: {
    currency: 'RD$',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12 horas',
    language: 'Espanol',
    timezone: 'America/Santo_Domingo',
    defaultTax: 'ITBIS 18%',
    quantityDecimals: 2,
    priceDecimals: 2,
    costMethod: 'Promedio',
    allowNegativeStock: false,
    confirmBeforeDelete: true,
  },
  transferSetup: {
    enabledForFutureUse: true,
    sourceBranchField: 'originBranch',
    targetBranchField: 'targetBranch',
    sourceWarehouseField: 'originWarehouse',
    targetWarehouseField: 'targetWarehouse',
  },
}

function safeLoadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const parsed = saved ? JSON.parse(saved) : null
    if (parsed && typeof parsed === 'object') {
      const billing = { ...defaultSettings.billing, ...parsed.billing }
      const legacyModelMap = {
        Moderno: 'Moderno profesional',
        Clasico: 'Clasico empresarial',
        'Ticket / POS': 'Ticket / POS 80mm',
        'Carta / A4': 'Moderno profesional',
      }
      billing.invoiceModel = invoiceModels.includes(billing.invoiceModel)
        ? billing.invoiceModel
        : legacyModelMap[billing.invoiceModel] || defaultSettings.billing.invoiceModel
      billing.printFormat = printFormats.includes(billing.printFormat)
        ? billing.printFormat
        : defaultSettings.billing.printFormat

      return {
        ...defaultSettings,
        ...parsed,
        company: { ...defaultSettings.company, ...parsed.company },
        brand: { ...defaultSettings.brand, ...parsed.brand },
        documentOptions: { ...defaultSettings.documentOptions, ...parsed.documentOptions },
        billing,
        fiscal: { ...defaultSettings.fiscal, ...parsed.fiscal },
        preferences: { ...defaultSettings.preferences, ...parsed.preferences },
        numbering: { ...defaultSettings.numbering, ...parsed.numbering },
        branches: Array.isArray(parsed.branches) && parsed.branches.length ? parsed.branches : defaultSettings.branches,
        warehouses: Array.isArray(parsed.warehouses) && parsed.warehouses.length ? parsed.warehouses : defaultSettings.warehouses,
      }
    }
  } catch {
    // Usar valores base si localStorage no contiene JSON valido.
  }

  return defaultSettings
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...settings,
    updatedAt: new Date().toISOString(),
  }))
  void settingsService.update('company_settings', {
    ...settings,
    updatedAt: new Date().toISOString(),
  })
}

function numberingExample(config) {
  const nextNumber = String(Number(config.nextNumber) || 1).padStart(Number(config.length) || 6, '0')
  return `${config.prefix || 'DOC'}${config.separator || '-'}${nextNumber}`
}

export default function SettingsGeneralPage({ controls, onAction, searchValue = '', onSearchChange }) {
  const [settings, setSettings] = useState(() => safeLoadSettings())
  const [activeTab, setActiveTab] = useState('company')
  const [branchForm, setBranchForm] = useState(emptyBranch)
  const [editingBranchCode, setEditingBranchCode] = useState('')
  const [message, setMessage] = useState('')
  const supabaseStatus = getSupabaseConfigStatus()

  const activeBranchCount = useMemo(() => {
    return settings.branches.filter((branch) => branch.status === 'Activa').length
  }, [settings.branches])

  const notify = (text) => {
    setMessage(text)
    onAction?.(text)
  }

  useEffect(() => {
    let isActive = true

    settingsService.getById().then((storedSettings) => {
      if (!isActive || !storedSettings || Object.keys(storedSettings).length === 0) return
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedSettings))
      setSettings(safeLoadSettings())
    })

    return () => {
      isActive = false
    }
  }, [])

  const updateSection = (section, field, value) => {
    setSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }))
  }

  const updateDocumentOption = (field, checked) => {
    updateSection('documentOptions', field, checked)
  }

  const updateFiscal = (field, value) => {
    updateSection('fiscal', field, value)
  }

  const updateNumbering = (key, field, value) => {
    setSettings((current) => ({
      ...current,
      numbering: {
        ...current.numbering,
        [key]: {
          ...current.numbering[key],
          [field]: value,
        },
      },
    }))
  }

  const updateBranchWarehouse = (branchCode, warehouseCode) => {
    setSettings((current) => ({
      ...current,
      branches: current.branches.map((branch) => (
        branch.code === branchCode ? { ...branch, mainWarehouse: warehouseCode } : branch
      )),
    }))
  }

  const validateSettings = () => {
    if (!settings.company.tradeName.trim()) return 'El nombre comercial es obligatorio.'
    if (!settings.branches.some((branch) => branch.status === 'Activa')) return 'Debe existir al menos una sucursal activa.'
    if (settings.branches.some((branch) => !branch.mainWarehouse)) return 'Cada sucursal debe tener un almacen principal.'
    if (!settings.company.fiscalId.trim()) return 'RNC recomendado: puedes guardar luego de completarlo.'
    return ''
  }

  const handleSave = () => {
    const validationMessage = validateSettings()
    if (validationMessage) {
      notify(validationMessage)
      if (!validationMessage.startsWith('RNC recomendado')) return
    }

    saveSettings(settings)
    notify('Configuracion guardada correctamente')
  }

  const handleRestore = () => {
    setSettings(defaultSettings)
    saveSettings(defaultSettings)
    setBranchForm(emptyBranch)
    setEditingBranchCode('')
    notify('Configuracion restaurada')
  }

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => updateSection('brand', 'logo', String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  const handleExportBackup = () => {
    downloadBackup()
    notify('Respaldo JSON exportado correctamente')
  }

  const handleImportBackup = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await importBackupFile(file)
      setSettings(safeLoadSettings())
      notify('Respaldo JSON importado correctamente')
    } catch (error) {
      notify(error.message || 'No se pudo importar el respaldo')
    } finally {
      event.target.value = ''
    }
  }

  const saveBranch = () => {
    if (!branchForm.code.trim() || !branchForm.name.trim() || !branchForm.mainWarehouse) {
      notify('Completa codigo, nombre y almacen principal de la sucursal')
      return
    }

    const duplicate = settings.branches.some((branch) => {
      return branch.code === branchForm.code && branch.code !== editingBranchCode
    })

    if (duplicate) {
      notify('Ya existe una sucursal con ese codigo')
      return
    }

    const exists = settings.branches.some((branch) => branch.code === editingBranchCode)
    const nextBranches = exists
      ? settings.branches.map((branch) => (branch.code === editingBranchCode ? branchForm : branch))
      : [branchForm, ...settings.branches]

    setSettings((current) => ({ ...current, branches: nextBranches }))
    setBranchForm(emptyBranch)
    setEditingBranchCode('')
    notify('Sucursal guardada')
  }

  const editBranch = (branch) => {
    setBranchForm(branch)
    setEditingBranchCode(branch.code)
    setActiveTab('branches')
  }

  const inactivateBranch = (branchCode) => {
    setSettings((current) => ({
      ...current,
      branches: current.branches.map((branch) => (
        branch.code === branchCode ? { ...branch, status: 'Inactiva' } : branch
      )),
    }))
    notify('Sucursal inactivada')
  }

  const renderCompanyTab = () => (
    <section className="erp-panel settings-card">
      <h2>Informacion de empresa</h2>
      <div className="settings-form-grid">
        <label>Nombre comercial<input value={settings.company.tradeName} onChange={(event) => updateSection('company', 'tradeName', event.target.value)} /></label>
        <label>Razon social<input value={settings.company.legalName} onChange={(event) => updateSection('company', 'legalName', event.target.value)} /></label>
        <label>RNC / Identificacion fiscal<input value={settings.company.fiscalId} onChange={(event) => updateSection('company', 'fiscalId', event.target.value)} /></label>
        <label>Telefono<input value={settings.company.phone} onChange={(event) => updateSection('company', 'phone', event.target.value)} /></label>
        <label>WhatsApp<input value={settings.company.whatsapp} onChange={(event) => updateSection('company', 'whatsapp', event.target.value)} /></label>
        <label>Correo electronico<input value={settings.company.email} onChange={(event) => updateSection('company', 'email', event.target.value)} /></label>
        <label>Pagina web<input value={settings.company.website} onChange={(event) => updateSection('company', 'website', event.target.value)} /></label>
        <label>Actividad comercial<input value={settings.company.businessActivity} onChange={(event) => updateSection('company', 'businessActivity', event.target.value)} /></label>
        <label>Representante legal<input value={settings.company.legalRepresentative} onChange={(event) => updateSection('company', 'legalRepresentative', event.target.value)} /></label>
        <label>Moneda principal<select value={settings.company.currency} onChange={(event) => updateSection('company', 'currency', event.target.value)}><option>RD$</option><option>USD</option><option>EUR</option></select></label>
        <label>Impuesto por defecto<select value={settings.company.defaultTax} onChange={(event) => updateSection('company', 'defaultTax', event.target.value)}><option>ITBIS 18%</option><option>Exento</option></select></label>
        <label>Pais<input value={settings.company.country} onChange={(event) => updateSection('company', 'country', event.target.value)} /></label>
        <label className="settings-span-2">Direccion principal<textarea value={settings.company.address} onChange={(event) => updateSection('company', 'address', event.target.value)} /></label>
        <label>Ciudad<input value={settings.company.city} onChange={(event) => updateSection('company', 'city', event.target.value)} /></label>
        <label>Provincia<input value={settings.company.province} onChange={(event) => updateSection('company', 'province', event.target.value)} /></label>
        <label className="settings-span-2">Nota legal para documentos<textarea value={settings.company.legalNote} onChange={(event) => updateSection('company', 'legalNote', event.target.value)} /></label>
      </div>
    </section>
  )

  const renderBrandTab = () => (
    <section className="erp-panel settings-card">
      <h2>Logo y marca</h2>
      <div className="settings-brand-grid">
        <div className="settings-logo-box">
          {settings.brand.logo ? <img src={settings.brand.logo} alt="Logo empresa" /> : <span>Sin logo</span>}
        </div>
        <div className="settings-form-grid">
          <label className="settings-file-button"><Upload size={16} /> Cargar logo<input type="file" accept="image/*" onChange={handleLogoUpload} /></label>
          <button type="button" className="settings-secondary-button" onClick={() => updateSection('brand', 'logo', '')}>Quitar logo</button>
          <label>Color principal<input type="color" value={settings.brand.primaryColor} onChange={(event) => updateSection('brand', 'primaryColor', event.target.value)} /></label>
          <label>Color secundario<input type="color" value={settings.brand.secondaryColor} onChange={(event) => updateSection('brand', 'secondaryColor', event.target.value)} /></label>
          <label>Color de acento<input type="color" value={settings.brand.accentColor} onChange={(event) => updateSection('brand', 'accentColor', event.target.value)} /></label>
        </div>
      </div>
      <div className="settings-document-preview" style={{ borderColor: settings.brand.primaryColor }}>
        <div style={{ background: settings.brand.primaryColor }}>
          {settings.brand.logo ? <img src={settings.brand.logo} alt="Logo preview" /> : <strong>{settings.company.tradeName.slice(0, 2).toUpperCase()}</strong>}
          <span>{settings.company.tradeName}</span>
        </div>
        <p>Vista previa de encabezado para facturas, cotizaciones, ordenes y reportes.</p>
      </div>
    </section>
  )

  const renderDocumentsTab = () => {
    const options = [
      ['showLogo', 'Mostrar logo en documentos'],
      ['showFiscalId', 'Mostrar RNC'],
      ['showPhone', 'Mostrar telefono'],
      ['showAddress', 'Mostrar direccion'],
      ['showEmail', 'Mostrar correo'],
      ['showSeller', 'Mostrar vendedor'],
      ['showCreatedBy', 'Mostrar usuario creador'],
      ['showBranch', 'Mostrar sucursal'],
      ['showWarehouse', 'Mostrar almacen'],
      ['showLegalNote', 'Mostrar nota legal'],
      ['showQr', 'Mostrar codigo QR futuro'],
    ]

    return (
      <section className="erp-panel settings-card">
        <h2>Documentos</h2>
        <div className="settings-check-grid">
          {options.map(([field, label]) => (
            <label key={field}><input type="checkbox" checked={settings.documentOptions[field]} onChange={(event) => updateDocumentOption(field, event.target.checked)} />{label}</label>
          ))}
        </div>
        <div className="settings-note">Aplica a factura, cotizacion, orden de compra, recepcion de mercancia, recibo y reportes.</div>
      </section>
    )
  }

  const renderBillingTab = () => (
    <section className="erp-panel settings-card">
      <div className="settings-card-heading">
        <span>Modelos de factura</span>
        <h2>Facturacion e impresion</h2>
        <p>Define el modelo visual, formato de papel, colores y datos que saldran en factura y cotizacion.</p>
      </div>

      <div className="settings-form-grid">
        <label>Modelo de factura<select value={settings.billing.invoiceModel} onChange={(event) => updateSection('billing', 'invoiceModel', event.target.value)}>{invoiceModels.map((model) => <option key={model}>{model}</option>)}</select></label>
        <label>Formato de impresion<select value={settings.billing.printFormat} onChange={(event) => updateSection('billing', 'printFormat', event.target.value)}>{printFormats.map((format) => <option key={format}>{format}</option>)}</select></label>
        <label>Orientacion<select value={settings.billing.orientation} onChange={(event) => updateSection('billing', 'orientation', event.target.value)}><option>Vertical</option><option>Horizontal</option></select></label>
        <label>Tamano de fuente<input type="number" min="9" max="16" value={settings.billing.fontSize} onChange={(event) => updateSection('billing', 'fontSize', event.target.value)} /></label>
        <label>Color principal<input type="color" value={settings.brand.primaryColor} onChange={(event) => updateSection('brand', 'primaryColor', event.target.value)} /></label>
        <label>Color secundario<input type="color" value={settings.brand.secondaryColor} onChange={(event) => updateSection('brand', 'secondaryColor', event.target.value)} /></label>
        <label>Color de acento<input type="color" value={settings.brand.accentColor} onChange={(event) => updateSection('brand', 'accentColor', event.target.value)} /></label>
        <label className="settings-span-2">Mensaje al pie de factura<textarea value={settings.billing.footerMessage} onChange={(event) => updateSection('billing', 'footerMessage', event.target.value)} /></label>
      </div>

      <div className="settings-subsection-title">Vista previa de modelos</div>
      <div className="settings-model-grid">
        {invoiceModels.map((model) => (
          <button
            type="button"
            key={model}
            className={settings.billing.invoiceModel === model ? 'is-active' : ''}
            onClick={() => updateSection('billing', 'invoiceModel', model)}
          >
            <strong>{model}</strong>
            <span>{settings.billing.printFormat}</span>
            <small style={{ background: settings.brand.primaryColor }} />
          </button>
        ))}
      </div>

      <div className="settings-subsection-title">Datos visibles en documentos</div>
      <div className="settings-check-grid settings-compact-checks">
        {[
          ['documentOptions', 'showLogo', 'Mostrar logo'],
          ['documentOptions', 'showFiscalId', 'Mostrar RNC'],
          ['documentOptions', 'showAddress', 'Mostrar direccion'],
          ['documentOptions', 'showPhone', 'Mostrar telefono'],
          ['documentOptions', 'showEmail', 'Mostrar correo'],
          ['documentOptions', 'showSeller', 'Mostrar vendedor'],
          ['documentOptions', 'showBranch', 'Mostrar sucursal'],
          ['documentOptions', 'showWarehouse', 'Mostrar almacen'],
          ['documentOptions', 'showLegalNote', 'Mostrar nota legal'],
          ['billing', 'showSignature', 'Mostrar firma'],
          ['billing', 'showStamp', 'Mostrar sello'],
          ['documentOptions', 'showQr', 'Mostrar codigo QR futuro'],
        ].map(([section, field, label]) => (
          <label key={`${section}-${field}`}>
            <input
              type="checkbox"
              checked={Boolean(settings[section][field])}
              onChange={(event) => updateSection(section, field, event.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>

      <div className="settings-subsection-title">Calculo e impresion</div>
      <div className="settings-check-grid settings-compact-checks">
        {[
          ['pricesIncludeTax', 'Mostrar precios con impuestos incluidos'],
          ['showLineDiscount', 'Mostrar descuento por linea'],
          ['showTotals', 'Mostrar subtotal, impuesto y total'],
        ].map(([field, label]) => (
          <label key={field}><input type="checkbox" checked={settings.billing[field]} onChange={(event) => updateSection('billing', field, event.target.checked)} />{label}</label>
        ))}
      </div>

      <div className="settings-invoice-preview" style={{ borderLeftColor: settings.brand.accentColor }}>
        <strong>{settings.billing.invoiceModel}</strong>
        <span>{settings.billing.printFormat} - {settings.billing.orientation} - {settings.billing.fontSize}px</span>
        <p>{settings.company.tradeName} / {settings.company.fiscalId || 'RNC pendiente'}</p>
        <p>{settings.billing.footerMessage}</p>
      </div>

      <div className="settings-subsection-title">Configuracion fiscal</div>
      <div className="settings-form-grid settings-fiscal-grid">
        <label>Usar NCF<select value={settings.fiscal.useNcf ? 'Si' : 'No'} onChange={(event) => updateFiscal('useNcf', event.target.value === 'Si')}><option>Si</option><option>No</option></select></label>
        <label>Tipo de comprobante por defecto<select value={settings.fiscal.defaultReceiptType} onChange={(event) => updateFiscal('defaultReceiptType', event.target.value)}><option>Consumidor final</option><option>Credito fiscal</option><option>Gubernamental</option><option>Regimen especial</option><option>Nota de credito</option></select></label>
        <label>Serie / prefijo NCF<input value={settings.fiscal.ncfPrefix} onChange={(event) => updateFiscal('ncfPrefix', event.target.value)} /></label>
        <label>Proximo NCF<input type="number" min="1" value={settings.fiscal.nextNcf} onChange={(event) => updateFiscal('nextNcf', event.target.value)} /></label>
        <label>Longitud NCF<input type="number" min="6" max="12" value={settings.fiscal.ncfLength} onChange={(event) => updateFiscal('ncfLength', event.target.value)} /></label>
        <label>Valido hasta<input type="date" value={settings.fiscal.ncfValidUntil} onChange={(event) => updateFiscal('ncfValidUntil', event.target.value)} /></label>
      </div>
      <div className="settings-check-grid settings-compact-checks">
        <label><input type="checkbox" checked={settings.fiscal.showNcf} onChange={(event) => updateFiscal('showNcf', event.target.checked)} />Mostrar NCF en documentos</label>
        <label><input type="checkbox" checked={settings.fiscal.showNcfValidUntil} onChange={(event) => updateFiscal('showNcfValidUntil', event.target.checked)} />Mostrar fecha valido hasta</label>
        <label><input type="checkbox" checked={settings.fiscal.showPaymentCondition} onChange={(event) => updateFiscal('showPaymentCondition', event.target.checked)} />Mostrar condicion de pago</label>
      </div>
    </section>
  )

  const renderBranchesTab = () => (
    <section className="erp-panel settings-card">
      <h2>Sucursales</h2>
      <div className="settings-form-grid">
        <label>Codigo de sucursal<input value={branchForm.code} onChange={(event) => setBranchForm((current) => ({ ...current, code: event.target.value }))} /></label>
        <label>Nombre de sucursal<input value={branchForm.name} onChange={(event) => setBranchForm((current) => ({ ...current, name: event.target.value }))} /></label>
        <label>Telefono<input value={branchForm.phone} onChange={(event) => setBranchForm((current) => ({ ...current, phone: event.target.value }))} /></label>
        <label>Encargado<input value={branchForm.manager} onChange={(event) => setBranchForm((current) => ({ ...current, manager: event.target.value }))} /></label>
        <label>Correo<input value={branchForm.email} onChange={(event) => setBranchForm((current) => ({ ...current, email: event.target.value }))} /></label>
        <label>Estado<select value={branchForm.status} onChange={(event) => setBranchForm((current) => ({ ...current, status: event.target.value }))}><option>Activa</option><option>Inactiva</option></select></label>
        <label>Almacen principal asignado<select value={branchForm.mainWarehouse} onChange={(event) => setBranchForm((current) => ({ ...current, mainWarehouse: event.target.value }))}>{settings.warehouses.map((warehouse) => <option key={warehouse.code} value={warehouse.code}>{warehouse.code} {warehouse.name}</option>)}</select></label>
        <label className="settings-span-2">Direccion<textarea value={branchForm.address} onChange={(event) => setBranchForm((current) => ({ ...current, address: event.target.value }))} /></label>
      </div>
      <div className="settings-action-row">
        <button type="button" className="settings-primary-button" onClick={saveBranch}><Plus size={15} /> Guardar sucursal</button>
        <button type="button" className="settings-secondary-button" onClick={() => { setBranchForm(emptyBranch); setEditingBranchCode('') }}>Nueva sucursal</button>
      </div>
      <div className="erp-table-wrap">
        <table className="erp-table settings-table">
          <thead><tr><th>Codigo</th><th>Sucursal</th><th>Encargado</th><th>Almacen</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {settings.branches.map((branch) => (
              <tr key={branch.code}>
                <td>{branch.code}</td><td>{branch.name}</td><td>{branch.manager}</td><td>{branch.mainWarehouse}</td><td>{branch.status}</td>
                <td><button type="button" onClick={() => editBranch(branch)}><Edit3 size={14} /></button><button type="button" onClick={() => inactivateBranch(branch.code)}><Ban size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )

  const renderWarehousesTab = () => (
    <section className="erp-panel settings-card">
      <h2>Almacenes por sucursal</h2>
      <div className="settings-note">Estructura preparada para transferencias futuras entre matriz, sucursales y almacenes.</div>
      <div className="erp-table-wrap">
        <table className="erp-table settings-table">
          <thead><tr><th>Sucursal</th><th>Almacen asignado</th><th>Direccion</th><th>Encargado</th><th>Estado</th></tr></thead>
          <tbody>
            {settings.branches.map((branch) => (
              <tr key={branch.code}>
                <td>{branch.name}</td>
                <td><select value={branch.mainWarehouse} onChange={(event) => updateBranchWarehouse(branch.code, event.target.value)}>{settings.warehouses.map((warehouse) => <option key={warehouse.code} value={warehouse.code}>{warehouse.code} {warehouse.name}</option>)}</select></td>
                <td>{branch.address}</td><td>{branch.manager}</td><td>{branch.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )

  const renderNumberingTab = () => (
    <section className="erp-panel settings-card">
      <h2>Numeracion automatica</h2>
      <div className="settings-numbering-grid">
        {Object.entries(settings.numbering).map(([key, config]) => (
          <article key={key}>
            <strong>{config.label}</strong>
            <label>Prefijo<input value={config.prefix} onChange={(event) => updateNumbering(key, 'prefix', event.target.value)} /></label>
            <label>Proximo numero<input type="number" value={config.nextNumber} onChange={(event) => updateNumbering(key, 'nextNumber', event.target.value)} /></label>
            <label>Longitud<input type="number" value={config.length} onChange={(event) => updateNumbering(key, 'length', event.target.value)} /></label>
            <label>Separador<input value={config.separator} onChange={(event) => updateNumbering(key, 'separator', event.target.value)} /></label>
            <span>{numberingExample(config)}</span>
          </article>
        ))}
      </div>
    </section>
  )

  const renderPreferencesTab = () => (
    <section className="erp-panel settings-card">
      <h2>Preferencias generales</h2>
      <div className="settings-form-grid">
        <label>Moneda principal<select value={settings.preferences.currency} onChange={(event) => updateSection('preferences', 'currency', event.target.value)}><option>RD$</option><option>USD</option><option>EUR</option></select></label>
        <label>Formato de fecha<select value={settings.preferences.dateFormat} onChange={(event) => updateSection('preferences', 'dateFormat', event.target.value)}><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select></label>
        <label>Formato de hora<select value={settings.preferences.timeFormat} onChange={(event) => updateSection('preferences', 'timeFormat', event.target.value)}><option>12 horas</option><option>24 horas</option></select></label>
        <label>Idioma<select value={settings.preferences.language} onChange={(event) => updateSection('preferences', 'language', event.target.value)}><option>Espanol</option><option>English</option></select></label>
        <label>Zona horaria<input value={settings.preferences.timezone} onChange={(event) => updateSection('preferences', 'timezone', event.target.value)} /></label>
        <label>Impuesto por defecto<select value={settings.preferences.defaultTax} onChange={(event) => updateSection('preferences', 'defaultTax', event.target.value)}><option>ITBIS 18%</option><option>Exento</option></select></label>
        <label>Decimales en cantidades<input type="number" value={settings.preferences.quantityDecimals} onChange={(event) => updateSection('preferences', 'quantityDecimals', event.target.value)} /></label>
        <label>Decimales en precios<input type="number" value={settings.preferences.priceDecimals} onChange={(event) => updateSection('preferences', 'priceDecimals', event.target.value)} /></label>
        <label>Metodo de costo<select value={settings.preferences.costMethod} onChange={(event) => updateSection('preferences', 'costMethod', event.target.value)}><option>Promedio</option><option>FIFO</option><option>Ultimo costo</option></select></label>
      </div>
      <div className="settings-check-grid settings-compact-checks">
        <label><input type="checkbox" checked={settings.preferences.allowNegativeStock} onChange={(event) => updateSection('preferences', 'allowNegativeStock', event.target.checked)} />Permitir stock negativo</label>
        <label><input type="checkbox" checked={settings.preferences.confirmBeforeDelete} onChange={(event) => updateSection('preferences', 'confirmBeforeDelete', event.target.checked)} />Solicitar confirmacion antes de eliminar</label>
      </div>
    </section>
  )

  const renderBackupTab = () => (
    <section className="erp-panel settings-card">
      <div className="settings-card-heading">
        <span>Respaldo</span>
        <h2>Exportar e importar datos</h2>
        <p>Usa este respaldo temporal mientras configuras Supabase. GitHub guarda el codigo, no los datos operativos.</p>
      </div>

      <div className="settings-backup-grid">
        <article>
          <strong>Persistencia actual</strong>
          <span>{supabaseStatus.configured ? 'Supabase configurado' : 'localStorage como respaldo'}</span>
          <p>Variables: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.</p>
        </article>
        <article>
          <strong>Exportar respaldo JSON</strong>
          <span>Productos, clientes, facturas, cotizaciones, configuracion, usuarios, roles y permisos.</span>
          <button type="button" className="settings-primary-button" onClick={handleExportBackup}>Exportar respaldo</button>
        </article>
        <article>
          <strong>Importar respaldo JSON</strong>
          <span>Reemplaza datos locales con el archivo seleccionado.</span>
          <label className="settings-file-button"><Upload size={16} /> Importar respaldo<input type="file" accept="application/json,.json" onChange={handleImportBackup} /></label>
        </article>
      </div>
    </section>
  )

  const tabContent = {
    company: renderCompanyTab,
    brand: renderBrandTab,
    documents: renderDocumentsTab,
    billing: renderBillingTab,
    branches: renderBranchesTab,
    warehouses: renderWarehousesTab,
    numbering: renderNumberingTab,
    preferences: renderPreferencesTab,
    backup: renderBackupTab,
  }

  return (
    <ModulePageLayout
      title="Parametros generales"
      moduleLabel="Configuracion"
      description="Configura la informacion principal de la empresa, sucursales, documentos e impresion."
      breadcrumb={['Configuracion', 'Parametros generales']}
      searchValue={searchValue}
      searchPlaceholder="Buscar parametro de configuracion"
      onSearchChange={onSearchChange}
      actions={[
        { id: 'save', label: 'Guardar configuracion', icon: Save, variant: 'primary', onClick: handleSave },
        { id: 'restore', label: 'Restaurar', icon: RotateCcw, onClick: handleRestore },
        { id: 'exit', label: 'Salir', icon: X, onClick: controls?.onClose },
      ]}
      statusCards={[
        { label: 'Empresa', value: settings.company.tradeName || 'Sin nombre', detail: settings.company.fiscalId || 'RNC pendiente' },
        { label: 'Sucursales activas', value: String(activeBranchCount), detail: 'operativas' },
        { label: 'Formato', value: settings.billing.printFormat, detail: settings.billing.invoiceModel },
        { label: 'Guardado', value: supabaseStatus.configured ? 'Supabase' : 'Local', detail: supabaseStatus.configured ? 'Base de datos nube' : STORAGE_KEY },
      ]}
      {...controls}
    >
      <div className="settings-general-page">
        {message && <div className="settings-message">{message}</div>}

        <nav className="settings-tabs" aria-label="Secciones de configuracion">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              className={activeTab === tab.id ? 'is-active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {tabContent[activeTab]()}
      </div>
    </ModulePageLayout>
  )
}
