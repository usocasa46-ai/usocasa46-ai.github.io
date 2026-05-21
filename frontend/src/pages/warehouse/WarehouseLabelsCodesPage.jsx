import { useEffect, useMemo, useState } from 'react'
import {
  Barcode,
  Box,
  Download,
  MapPin,
  Package,
  Printer,
  QrCode,
  RefreshCcw,
  Save,
  Tags,
} from 'lucide-react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import { getRecordsByCompany } from '../../services/dataClient.js'
import { productsService } from '../../services/productsService.js'
import { suppliersService } from '../../services/suppliersService.js'
import { barcodeDataUri, generateBarcodeValue } from '../../utils/labels/barcodeGenerator.js'
import { buildQrPayload, qrDataUri } from '../../utils/labels/qrGenerator.js'
import { DEFAULT_LABEL_SETTINGS, LABEL_TEMPLATES, getTemplateById, normalizeLabelSettings } from '../../utils/labels/labelTemplates.js'
import { downloadHtmlFile, printLabelHtml } from '../../utils/labels/printLabels.js'
import './WarehouseLabelsCodesPage.css'

const DATA_SOURCES = {
  warehouses: ['warehouses', 'invefat_warehouses'],
  locations: ['warehouse_locations', 'invefat_warehouse_locations'],
  purchaseOrders: ['purchase_orders', 'invefat_purchase_orders'],
  warehouseReceipts: ['warehouse_receipts', 'invefat_warehouse_receipts'],
}

const MODES = [
  { id: 'products', label: 'Etiquetas de productos', icon: Package },
  { id: 'barcodes', label: 'Códigos de barra', icon: Barcode },
  { id: 'qr', label: 'Códigos QR', icon: QrCode },
  { id: 'locations', label: 'Ubicaciones', icon: MapPin },
  { id: 'orders', label: 'Contenido de pedido / recepción', icon: Box },
  { id: 'templates', label: 'Plantillas de impresión', icon: Tags },
]

function toArray(value) {
  return Array.isArray(value) ? value : []
}

function toNumber(value) {
  const numericValue = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(numericValue) ? numericValue : 0
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function getSessionCompanyCode() {
  try {
    const session = JSON.parse(sessionStorage.getItem('inveFatSession') || 'null')
    return String(session?.currentCompanyCode || session?.companyCode || '').trim().toUpperCase()
  } catch {
    return ''
  }
}

function settingsKey(companyCode) {
  return `invefat_${companyCode || 'LOCAL'}_label_settings`
}

function loadLocalSettings() {
  try {
    const saved = localStorage.getItem(settingsKey(getSessionCompanyCode()))
    return normalizeLabelSettings(saved ? JSON.parse(saved) : DEFAULT_LABEL_SETTINGS)
  } catch {
    return normalizeLabelSettings(DEFAULT_LABEL_SETTINGS)
  }
}

function saveLocalSettings(settings) {
  localStorage.setItem(settingsKey(getSessionCompanyCode()), JSON.stringify(normalizeLabelSettings(settings)))
}

function productImage(product) {
  return product.image || product.imageUrl || product.productImage || product.imagen || product.photo || ''
}

function normalizeProduct(product) {
  return {
    ...product,
    id: product.id || product.code || product.codigo,
    code: String(product.code || product.codigo || product.id || '').trim(),
    name: String(product.name || product.nombre || product.description || '').trim(),
    barcode: String(product.barcode || product.codigoBarra || '').trim(),
    category: String(product.category || product.categoria || 'Sin categoría').trim(),
    supplierCode: String(product.supplierCode || product.providerCode || '').trim(),
    supplierName: String(product.supplierName || product.providerName || product.supplier || '').trim(),
    warehouse: String(product.warehouse || product.almacen || '').trim(),
    location: String(product.location || product.ubicacion || '').trim(),
    unit: String(product.unit || product.unidad || 'Unidad').trim(),
    presentation: String(product.presentation || product.presentacion || '').trim(),
    price: toNumber(product.price || product.precio),
    stock: toNumber(product.stock || product.existencia),
    createdAt: product.createdAt || product.created_at || product.fechaCreacion || '',
    image: productImage(product),
  }
}

function normalizeLocation(location, warehouseFallback = '') {
  return {
    id: location.id || location.code || location.codigo,
    code: String(location.code || location.codigo || location.id || '').trim(),
    name: String(location.name || location.nombre || location.zone || location.zona || '').trim(),
    warehouse: String(location.warehouse || location.warehouseCode || location.almacen || warehouseFallback || '').trim(),
    description: String(location.description || location.descripcion || '').trim(),
  }
}

function normalizeWarehouseAsLocation(warehouse) {
  return normalizeLocation({
    id: warehouse.id || warehouse.code,
    code: warehouse.code,
    name: warehouse.name || warehouse.nombre,
    warehouse: warehouse.code,
    description: warehouse.address || warehouse.direccion || 'Almacén',
  }, warehouse.code)
}

function linesOf(record) {
  const candidates = [record?.items, record?.lines, record?.products, record?.details, record?.detalle, record?.productos]
  return candidates.find(Array.isArray) || []
}

function formatCurrency(value) {
  return `RD$ ${toNumber(value).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function buildLabelHtml({ selectedProducts, locations, selectedDocument, settings, companyCode }) {
  const template = getTemplateById(settings.templateId)
  const productCards = selectedProducts.flatMap((product) => {
    const quantity = settings.quantityMode === 'stock' ? Math.max(1, Math.round(product.stock)) : Math.max(1, Number(settings.manualQuantity || 1))
    return Array.from({ length: quantity }, () => ({ type: 'product', product }))
  })

  const locationCards = locations.map((location) => ({ type: 'location', location }))
  const documentCards = selectedDocument ? [{ type: 'document', document: selectedDocument }] : []
  const cards = [...productCards, ...locationCards, ...documentCards]

  return cards.map((item) => {
    const width = `${template.widthMm}mm`
    const height = `${template.heightMm}mm`

    if (item.type === 'location') {
      const payload = buildQrPayload({ companyCode, type: 'location', code: item.location.code, name: item.location.name, location: item.location.warehouse })
      return `<article class="print-label-card" style="width:${width};min-height:${height}">
        <strong>${escapeHtml(item.location.code || 'Ubicación')}</strong>
        <small>${escapeHtml(item.location.name || item.location.description || 'Ubicación de almacén')}</small>
        <small>${escapeHtml(item.location.warehouse || 'Almacén')}</small>
        <img alt="QR ubicación" src="${qrDataUri(payload, { unit: 4 })}" style="width:26mm;height:26mm" />
      </article>`
    }

    if (item.type === 'document') {
      const payload = buildQrPayload({ companyCode, type: 'document', code: item.document.number || item.document.id, name: item.document.supplier })
      return `<article class="print-label-card" style="width:${width};min-height:${height}">
        <strong>${escapeHtml(item.document.number || item.document.id || 'Documento')}</strong>
        <small>${escapeHtml(item.document.supplier || 'Proveedor')}</small>
        <small>${escapeHtml(item.document.status || item.document.estado || 'Pendiente')}</small>
        <img alt="QR documento" src="${qrDataUri(payload, { unit: 4 })}" style="width:26mm;height:26mm" />
      </article>`
    }

    const value = item.product.barcode || generateBarcodeValue(item.product)
    const payload = buildQrPayload({ companyCode, ...item.product, productId: item.product.id, location: item.product.location })
    return `<article class="print-label-card" style="width:${width};min-height:${height}">
      ${settings.showLogo ? '<small>INVE-FAT SYSTEM</small>' : ''}
      <strong>${escapeHtml(item.product.name || item.product.code || 'Producto')}</strong>
      <small>${escapeHtml(item.product.code || '')} ${settings.showPrice ? ` | ${escapeHtml(formatCurrency(item.product.price))}` : ''}</small>
      ${settings.showBarcode ? `<img alt="Código de barra" src="${barcodeDataUri(value, { width: 210, height: 60, barHeight: 38 })}" style="height:18mm" />` : ''}
      ${settings.showQr ? `<img alt="QR producto" src="${qrDataUri(payload, { unit: 4 })}" style="width:22mm;height:22mm" />` : ''}
      ${settings.showLot ? '<small>Lote: __________________</small>' : ''}
      ${settings.showExpiration ? '<small>Vence: ____/____/______</small>' : ''}
    </article>`
  }).join('')
}

function EmptyState({ message }) {
  return (
    <div className="warehouse-labels-empty">
      <Tags size={22} />
      <strong>{message}</strong>
      <span>Use los filtros y seleccione registros para generar la vista previa.</span>
    </div>
  )
}

export default function WarehouseLabelsCodesPage({
  controls,
  searchValue = '',
  onSearchChange,
  onAction,
}) {
  const [mode, setMode] = useState('products')
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [locations, setLocations] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [warehouseReceipts, setWarehouseReceipts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [selectedLocations, setSelectedLocations] = useState([])
  const [selectedDocumentId, setSelectedDocumentId] = useState('')
  const [filters, setFilters] = useState({ category: 'Todos', supplier: 'Todos', warehouse: 'Todos', stockLow: false, newOnly: false })
  const [settings, setSettings] = useState(loadLocalSettings)

  const companyCode = getSessionCompanyCode()

  const loadData = async () => {
    setLoading(true)
    try {
      const [productRows, supplierRows, warehouseRows, locationRows, orderRows, receiptRows] = await Promise.all([
        productsService.getAll(),
        suppliersService.getAll(),
        getRecordsByCompany(...DATA_SOURCES.warehouses),
        getRecordsByCompany(...DATA_SOURCES.locations),
        getRecordsByCompany(...DATA_SOURCES.purchaseOrders),
        getRecordsByCompany(...DATA_SOURCES.warehouseReceipts),
      ])
      setProducts(toArray(productRows).map(normalizeProduct))
      setSuppliers(toArray(supplierRows))
      setWarehouses(toArray(warehouseRows))
      setLocations(toArray(locationRows).map((location) => normalizeLocation(location)))
      setPurchaseOrders(toArray(orderRows))
      setWarehouseReceipts(toArray(receiptRows))
    } catch (error) {
      console.error('No se pudieron cargar datos de etiquetas:', error)
      onAction?.('No se pudieron cargar los datos para etiquetas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const allLocations = useMemo(() => {
    if (locations.length) return locations
    return warehouses.map(normalizeWarehouseAsLocation)
  }, [locations, warehouses])

  const productOptions = useMemo(() => {
    const query = String(searchValue || '').toLowerCase().trim()
    return products.filter((product) => {
      const matchSearch = !query || [product.code, product.name, product.barcode].some((value) => String(value || '').toLowerCase().includes(query))
      const matchCategory = filters.category === 'Todos' || product.category === filters.category
      const matchSupplier = filters.supplier === 'Todos' || [product.supplierCode, product.supplierName].includes(filters.supplier)
      const matchWarehouse = filters.warehouse === 'Todos' || product.warehouse === filters.warehouse
      const matchStock = !filters.stockLow || product.stock <= toNumber(product.minStock)
      const matchNew = !filters.newOnly || (product.createdAt && Date.now() - new Date(product.createdAt).getTime() <= 30 * 86400000)
      return matchSearch && matchCategory && matchSupplier && matchWarehouse && matchStock && matchNew
    })
  }, [products, filters, searchValue])

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort()], [products])
  const supplierOptions = useMemo(() => ['Todos', ...Array.from(new Set([
    ...suppliers.map((supplier) => supplier.code || supplier.commercialName || supplier.name),
    ...products.map((product) => product.supplierCode || product.supplierName),
  ].filter(Boolean))).sort()], [products, suppliers])
  const warehouseOptions = useMemo(() => ['Todos', ...Array.from(new Set([
    ...warehouses.map((warehouse) => warehouse.code || warehouse.name),
    ...products.map((product) => product.warehouse),
  ].filter(Boolean))).sort()], [products, warehouses])

  const selectedDocument = useMemo(() => {
    return [...purchaseOrders, ...warehouseReceipts].find((record) => (record.number || record.id) === selectedDocumentId) || null
  }, [purchaseOrders, warehouseReceipts, selectedDocumentId])

  const previewProducts = selectedProducts.length ? selectedProducts : productOptions.slice(0, 6)
  const previewLocations = selectedLocations.length ? selectedLocations : allLocations.slice(0, 4)
  const labelHtml = buildLabelHtml({
    selectedProducts: mode === 'locations' || mode === 'orders' ? [] : previewProducts,
    locations: mode === 'locations' ? previewLocations : [],
    selectedDocument: mode === 'orders' ? selectedDocument : null,
    settings,
    companyCode,
  })

  const toggleProduct = (product) => {
    setSelectedProducts((current) => (
      current.some((item) => item.code === product.code)
        ? current.filter((item) => item.code !== product.code)
        : [...current, product]
    ))
  }

  const toggleLocation = (location) => {
    setSelectedLocations((current) => (
      current.some((item) => item.code === location.code)
        ? current.filter((item) => item.code !== location.code)
        : [...current, location]
    ))
  }

  const saveSettings = () => {
    saveLocalSettings(settings)
    onAction?.('Configuración de etiquetas guardada.')
  }

  const assignBarcode = async (product) => {
    const barcode = generateBarcodeValue(product)
    const nextProduct = { ...product, barcode }
    try {
      await productsService.update(product.code || product.id, nextProduct)
      setProducts((current) => current.map((item) => (item.code === product.code ? normalizeProduct(nextProduct) : item)))
      onAction?.(`Código de barra generado para ${product.name}.`)
    } catch (error) {
      console.error('No se pudo guardar el código de barra:', error)
      onAction?.('No se pudo guardar el código de barra.')
    }
  }

  const handlePrint = () => {
    const printed = printLabelHtml(labelHtml, 'Etiquetas INVE-FAT SYSTEM')
    onAction?.(printed ? 'Vista de impresión abierta.' : 'El navegador bloqueó la ventana de impresión.')
  }

  const handleDownload = () => {
    downloadHtmlFile(labelHtml, `etiquetas-${companyCode || 'empresa'}-${Date.now()}.html`)
  }

  return (
    <ModulePageLayout
      title="Etiquetas y códigos"
      moduleLabel="Almacén"
      description="Genera etiquetas de productos, ubicaciones, códigos de barra, QR y contenido de pedidos para la empresa actual."
      breadcrumb={['Almacén', 'Etiquetas y códigos']}
      searchValue={searchValue}
      searchPlaceholder="Buscar producto, código o barcode"
      onSearchChange={onSearchChange}
      actions={[
        { id: 'refresh', label: loading ? 'Cargando' : 'Actualizar', icon: RefreshCcw, onClick: loadData, disabled: loading },
        { id: 'save', label: 'Guardar plantilla', icon: Save, onClick: saveSettings },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: handlePrint, variant: 'primary' },
      ]}
      statusCards={[
        { label: 'Productos', value: products.length, detail: 'Disponibles para etiquetas' },
        { label: 'Ubicaciones', value: allLocations.length, detail: 'Almacén / racks / zonas' },
        { label: 'Seleccionados', value: selectedProducts.length + selectedLocations.length + (selectedDocument ? 1 : 0), detail: 'En vista previa' },
        { label: 'Plantilla', value: getTemplateById(settings.templateId).name, detail: 'Formato activo' },
      ]}
      {...controls}
    >
      <div className="warehouse-labels-page">
        <section className="warehouse-labels-mode-grid">
          {MODES.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} type="button" className={mode === item.id ? 'is-active' : ''} onClick={() => setMode(item.id)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </section>

        <section className="warehouse-labels-layout">
          <div className="warehouse-labels-left">
            <section className="warehouse-labels-panel">
              <div className="warehouse-labels-heading">
                <div><span>Filtros</span><h2>Selección de etiquetas</h2></div>
                <button type="button" onClick={() => { setSelectedProducts([]); setSelectedLocations([]); setSelectedDocumentId('') }}>Limpiar selección</button>
              </div>

              {(mode === 'products' || mode === 'barcodes' || mode === 'qr') && (
                <>
                  <div className="warehouse-labels-filter-grid">
                    <label>Categoría<select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}>{categories.map((option) => <option key={option}>{option}</option>)}</select></label>
                    <label>Proveedor<select value={filters.supplier} onChange={(event) => setFilters((current) => ({ ...current, supplier: event.target.value }))}>{supplierOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
                    <label>Almacén<select value={filters.warehouse} onChange={(event) => setFilters((current) => ({ ...current, warehouse: event.target.value }))}>{warehouseOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
                    <label className="warehouse-labels-check"><input type="checkbox" checked={filters.stockLow} onChange={(event) => setFilters((current) => ({ ...current, stockLow: event.target.checked }))} /> Stock bajo</label>
                    <label className="warehouse-labels-check"><input type="checkbox" checked={filters.newOnly} onChange={(event) => setFilters((current) => ({ ...current, newOnly: event.target.checked }))} /> Productos nuevos</label>
                  </div>
                  <div className="warehouse-labels-table-wrap">
                    <table className="warehouse-labels-table">
                      <thead><tr><th></th><th>Producto</th><th>Código</th><th>Barcode</th><th>Precio</th><th>Stock</th><th>Acción</th></tr></thead>
                      <tbody>
                        {productOptions.map((product) => (
                          <tr key={product.code || product.id}>
                            <td><input type="checkbox" checked={selectedProducts.some((item) => item.code === product.code)} onChange={() => toggleProduct(product)} /></td>
                            <td><strong>{product.name}</strong><small>{product.category} · {product.supplierName || product.supplierCode || 'Sin proveedor'}</small></td>
                            <td>{product.code || 'N/D'}</td>
                            <td>{product.barcode || <span className="warehouse-labels-muted">Sin barcode</span>}</td>
                            <td>{formatCurrency(product.price)}</td>
                            <td>{product.stock}</td>
                            <td><button type="button" onClick={() => assignBarcode(product)}><Barcode size={15} /> Generar</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!productOptions.length && <EmptyState message="No hay productos disponibles con los filtros actuales." />}
                  </div>
                </>
              )}

              {mode === 'locations' && (
                <div className="warehouse-labels-table-wrap">
                  <table className="warehouse-labels-table">
                    <thead><tr><th></th><th>Código ubicación</th><th>Nombre</th><th>Almacén</th><th>Descripción</th></tr></thead>
                    <tbody>
                      {allLocations.map((location) => (
                        <tr key={location.code || location.id}>
                          <td><input type="checkbox" checked={selectedLocations.some((item) => item.code === location.code)} onChange={() => toggleLocation(location)} /></td>
                          <td><strong>{location.code || 'N/D'}</strong></td>
                          <td>{location.name || 'Ubicación'}</td>
                          <td>{location.warehouse || 'Almacén'}</td>
                          <td>{location.description || 'N/D'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!allLocations.length && <EmptyState message="No hay ubicaciones ni almacenes para generar etiquetas." />}
                </div>
              )}

              {mode === 'orders' && (
                <div className="warehouse-labels-form-grid">
                  <label>Orden o recepción<select value={selectedDocumentId} onChange={(event) => setSelectedDocumentId(event.target.value)}>
                    <option value="">Seleccione documento</option>
                    {purchaseOrders.map((order) => <option key={order.number || order.id} value={order.number || order.id}>Orden {order.number || order.id} - {order.supplier || order.supplierName || 'Proveedor'}</option>)}
                    {warehouseReceipts.map((receipt) => <option key={receipt.number || receipt.id} value={receipt.number || receipt.id}>Recepción {receipt.number || receipt.id} - {receipt.supplier || receipt.supplierName || 'Proveedor'}</option>)}
                  </select></label>
                  {selectedDocument && (
                    <article className="warehouse-labels-document-card">
                      <strong>{selectedDocument.number || selectedDocument.id}</strong>
                      <span>{selectedDocument.supplier || selectedDocument.supplierName || selectedDocument.proveedor || 'Proveedor'}</span>
                      <small>{linesOf(selectedDocument).length} productos · Estado {selectedDocument.status || selectedDocument.estado || 'Pendiente'}</small>
                    </article>
                  )}
                  {!purchaseOrders.length && !warehouseReceipts.length && <EmptyState message="No hay órdenes o recepciones registradas." />}
                </div>
              )}

              {mode === 'templates' && (
                <div className="warehouse-labels-template-grid">
                  {LABEL_TEMPLATES.map((template) => (
                    <button key={template.id} type="button" className={settings.templateId === template.id ? 'is-active' : ''} onClick={() => setSettings((current) => ({ ...current, templateId: template.id }))}>
                      <strong>{template.name}</strong>
                      <span>{template.widthMm}x{template.heightMm} mm · {template.columns} columnas</span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="warehouse-labels-panel">
              <div className="warehouse-labels-heading">
                <div><span>Opciones</span><h2>Plantilla de impresión</h2></div>
              </div>
              <div className="warehouse-labels-options">
                <label>Formato<select value={settings.templateId} onChange={(event) => setSettings((current) => ({ ...current, templateId: event.target.value }))}>{LABEL_TEMPLATES.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
                <label>Cantidad<select value={settings.quantityMode} onChange={(event) => setSettings((current) => ({ ...current, quantityMode: event.target.value }))}><option value="manual">Cantidad manual</option><option value="stock">Según stock</option></select></label>
                <label>Cant. manual<input type="number" min="1" value={settings.manualQuantity} onChange={(event) => setSettings((current) => ({ ...current, manualQuantity: event.target.value }))} /></label>
                <label className="warehouse-labels-check"><input type="checkbox" checked={settings.showLogo} onChange={(event) => setSettings((current) => ({ ...current, showLogo: event.target.checked }))} /> Logo empresa</label>
                <label className="warehouse-labels-check"><input type="checkbox" checked={settings.showPrice} onChange={(event) => setSettings((current) => ({ ...current, showPrice: event.target.checked }))} /> Precio</label>
                <label className="warehouse-labels-check"><input type="checkbox" checked={settings.showQr} onChange={(event) => setSettings((current) => ({ ...current, showQr: event.target.checked }))} /> QR</label>
                <label className="warehouse-labels-check"><input type="checkbox" checked={settings.showBarcode} onChange={(event) => setSettings((current) => ({ ...current, showBarcode: event.target.checked }))} /> Código de barra</label>
                <label className="warehouse-labels-check"><input type="checkbox" checked={settings.showLot} onChange={(event) => setSettings((current) => ({ ...current, showLot: event.target.checked }))} /> Lote</label>
                <label className="warehouse-labels-check"><input type="checkbox" checked={settings.showExpiration} onChange={(event) => setSettings((current) => ({ ...current, showExpiration: event.target.checked }))} /> Vencimiento</label>
              </div>
            </section>
          </div>

          <aside className="warehouse-labels-preview-panel">
            <div className="warehouse-labels-heading">
              <div><span>Vista previa</span><h2>Hoja de etiquetas</h2></div>
              <div className="warehouse-labels-preview-actions">
                <button type="button" onClick={handleDownload}><Download size={16} /> Descargar HTML</button>
                <button type="button" onClick={handlePrint}><Printer size={16} /> Imprimir</button>
              </div>
            </div>
            {labelHtml ? (
              <div className="warehouse-labels-preview-grid" dangerouslySetInnerHTML={{ __html: labelHtml }} />
            ) : (
              <EmptyState message="Seleccione productos, ubicaciones o documentos para generar etiquetas." />
            )}
          </aside>
        </section>
      </div>
    </ModulePageLayout>
  )
}
