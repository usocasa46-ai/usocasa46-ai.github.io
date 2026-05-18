export const DEFAULT_PAGE_ID = 'dashboard'

export const erpModules = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    type: 'single',
    pageId: 'dashboard',
  },
  {
    id: 'sales',
    label: 'Ventas',
    icon: 'ReceiptText',
    pages: [
      { id: 'sales-invoice', label: 'Factura', keywords: ['factura', 'venta', 'cliente'] },
      { id: 'sales-quotes', label: 'Cotizaciones' },
      { id: 'sales-customer-orders', label: 'Pedidos de clientes' },
      { id: 'sales-customers', label: 'Clientes' },
      { id: 'sales-returns', label: 'Devoluciones de venta' },
      { id: 'sales-credit-notes', label: 'Notas de credito' },
      { id: 'sales-receivables', label: 'Cuentas por cobrar' },
      { id: 'sales-history', label: 'Historial de ventas' },
    ],
  },
  {
    id: 'purchases',
    label: 'Compras',
    icon: 'ShoppingCart',
    pages: [
      { id: 'purchase-requests', label: 'Solicitudes de compra' },
      { id: 'purchase-vendor-quotes', label: 'Cotizaciones proveedor' },
      { id: 'purchase-orders', label: 'Ordenes de compra', keywords: ['orden', 'compra', 'proveedor'] },
      { id: 'purchase-invoices', label: 'Facturas de proveedor' },
      { id: 'purchase-credit-notes', label: 'Notas de credito proveedor' },
      { id: 'purchase-vendors', label: 'Proveedores' },
      { id: 'purchase-payables', label: 'Cuentas por pagar' },
      { id: 'purchase-history', label: 'Historial de compras' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventario',
    icon: 'Boxes',
    pages: [
      { id: 'inventory-products', label: 'Productos', keywords: ['producto', 'stock', 'codigo'] },
      { id: 'inventory-categories', label: 'Categorias' },
      { id: 'inventory-brands', label: 'Marcas' },
      { id: 'inventory-units', label: 'Unidades de medida' },
      { id: 'inventory-price-lists', label: 'Listas de precios' },
      { id: 'inventory-stock', label: 'Stock por producto' },
      { id: 'inventory-kardex', label: 'Kardex / movimientos' },
      { id: 'inventory-adjustments', label: 'Ajustes de inventario' },
      { id: 'inventory-count', label: 'Conteo fisico' },
      { id: 'inventory-lots', label: 'Lotes y series' },
      { id: 'inventory-barcodes', label: 'Codigos de barra / QR' },
      { id: 'inventory-costs', label: 'Costos de inventario' },
    ],
  },
  {
    id: 'warehouse',
    label: 'Almacen',
    icon: 'Warehouse',
    pages: [
      { id: 'warehouse-list', label: 'Almacenes' },
      { id: 'warehouse-locations', label: 'Ubicaciones' },
      { id: 'warehouse-receiving', label: 'Recepcion de mercancia', keywords: ['recepcion', 'orden', 'mercancia'] },
      { id: 'warehouse-dispatch', label: 'Despacho' },
      { id: 'warehouse-transfers', label: 'Transferencias entre almacenes' },
      { id: 'warehouse-picking', label: 'Picking' },
      { id: 'warehouse-putaway', label: 'Putaway' },
      { id: 'warehouse-returns', label: 'Devoluciones al almacen' },
      { id: 'warehouse-waste', label: 'Mermas y averias' },
      { id: 'warehouse-quarantine', label: 'Cuarentena' },
      { id: 'warehouse-quality', label: 'Control de calidad' },
      { id: 'warehouse-routes', label: 'Rutas de despacho' },
    ],
  },
  {
    id: 'finance',
    label: 'Finanzas / Contabilidad',
    icon: 'Landmark',
    pages: [
      { id: 'finance-chart-accounts', label: 'Catalogo de cuentas' },
      { id: 'finance-journal-entries', label: 'Asientos contables' },
      { id: 'finance-general-ledger', label: 'Diario general' },
      { id: 'finance-receivables', label: 'Cuentas por cobrar' },
      { id: 'finance-payables', label: 'Cuentas por pagar' },
      { id: 'finance-banks', label: 'Bancos' },
      { id: 'finance-petty-cash', label: 'Caja chica' },
      { id: 'finance-bank-reconciliation', label: 'Conciliacion bancaria' },
      { id: 'finance-balance-sheet', label: 'Balance general' },
      { id: 'finance-income-statement', label: 'Estado de resultados' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: 'Handshake',
    pages: [
      { id: 'crm-customers', label: 'Clientes' },
      { id: 'crm-prospects', label: 'Prospectos' },
      { id: 'crm-followups', label: 'Seguimientos' },
      { id: 'crm-opportunities', label: 'Oportunidades' },
      { id: 'crm-contact-history', label: 'Historial de contactos' },
    ],
  },
  {
    id: 'hr',
    label: 'Recursos Humanos',
    icon: 'UsersRound',
    pages: [
      { id: 'hr-employees', label: 'Empleados' },
      { id: 'hr-payroll', label: 'Nomina' },
      { id: 'hr-attendance', label: 'Asistencia' },
      { id: 'hr-departments', label: 'Departamentos' },
      { id: 'hr-positions', label: 'Cargos' },
      { id: 'hr-reports', label: 'Reportes RRHH' },
    ],
  },
  {
    id: 'production',
    label: 'Produccion',
    icon: 'Factory',
    pages: [
      { id: 'production-orders', label: 'Ordenes de produccion' },
      { id: 'production-bom', label: 'Recetas / BOM' },
      { id: 'production-processes', label: 'Procesos' },
      { id: 'production-materials', label: 'Materiales' },
      { id: 'production-control', label: 'Control de produccion' },
      { id: 'production-reports', label: 'Reportes de produccion' },
    ],
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: 'BarChart3',
    pages: [
      { id: 'reports-sales', label: 'Reportes de ventas' },
      { id: 'reports-purchases', label: 'Reportes de compras' },
      { id: 'reports-inventory', label: 'Reportes de inventario' },
      { id: 'reports-warehouse', label: 'Reportes de almacen' },
      { id: 'reports-finance', label: 'Reportes financieros' },
      { id: 'reports-customers', label: 'Reportes de clientes' },
      { id: 'reports-vendors', label: 'Reportes de proveedores' },
      { id: 'reports-users', label: 'Reportes de usuarios' },
    ],
  },
  {
    id: 'settings',
    label: 'Configuracion',
    icon: 'Settings',
    pages: [
      { id: 'settings-company', label: 'Datos de empresa' },
      { id: 'settings-branches', label: 'Sucursales' },
      { id: 'settings-currency', label: 'Moneda' },
      { id: 'settings-taxes', label: 'Impuestos' },
      { id: 'settings-document-numbering', label: 'Numeracion de documentos' },
      { id: 'settings-pdf-formats', label: 'Formatos PDF' },
      { id: 'settings-branding', label: 'Logo y colores' },
      { id: 'settings-general', label: 'Parametros generales' },
    ],
  },
  {
    id: 'security',
    label: 'Seguridad',
    icon: 'ShieldCheck',
    pages: [
      { id: 'security-users', label: 'Usuarios', keywords: ['usuario', 'crear usuario', 'administrador'] },
      { id: 'security-roles', label: 'Roles' },
      { id: 'security-permissions', label: 'Permisos' },
      { id: 'security-audit', label: 'Auditoria' },
      { id: 'security-sessions', label: 'Sesiones' },
      { id: 'security-change-password', label: 'Cambiar contrasena' },
      { id: 'security-company-credential', label: 'Credencial de empresa' },
    ],
  },
]

export const quickAccessPages = [
  { id: 'sales-invoice', label: 'Nueva factura', moduleId: 'sales' },
  { id: 'purchase-orders', label: 'Nueva orden de compra', moduleId: 'purchases' },
  { id: 'warehouse-receiving', label: 'Recepcion de mercancia', moduleId: 'warehouse' },
  { id: 'inventory-products', label: 'Productos', moduleId: 'inventory' },
  { id: 'sales-customers', label: 'Clientes', moduleId: 'sales' },
  { id: 'reports-sales', label: 'Reportes', moduleId: 'reports' },
]

export const pageRegistry = erpModules.reduce((registry, module) => {
  if (module.type === 'single') {
    registry[module.pageId] = {
      id: module.pageId,
      label: module.label,
      moduleId: module.id,
      moduleLabel: module.label,
    }
    return registry
  }

  module.pages.forEach((page) => {
    registry[page.id] = {
      ...page,
      moduleId: module.id,
      moduleLabel: module.label,
    }
  })

  return registry
}, {})

export function getPageMeta(pageId) {
  return pageRegistry[pageId] || pageRegistry[DEFAULT_PAGE_ID]
}

export function getModuleByPageId(pageId) {
  const meta = getPageMeta(pageId)
  return erpModules.find((module) => module.id === meta.moduleId) || erpModules[0]
}
