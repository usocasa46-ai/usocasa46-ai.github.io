import { useEffect, useState } from 'react'

import {
  BarChart3,
  Banknote,
  Bell,
  Bot,
  Box,
  Briefcase,
  Building2,
  Calculator,
  ChevronDown,
  ChevronRight,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  FileSpreadsheet,
  Gauge,
  Heart,
  Home,
  Hotel,
  Menu,
  MessageCircle,
  Moon,
  Sun,
  Package,
  Receipt,
  Pill,
  Plus,
  Printer,
  Search,
  Save,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  Upload,
  User,
  UserPlus,
  Users,
  Utensils,
  Wallet,
  Warehouse,
  Zap,
  X,
  XCircle,
  ClipboardList,
  Boxes,
  ArrowLeftRight,
  ScanBarcode,
  Layers,
  FileBarChart,
} from 'lucide-react'

import * as XLSX from 'xlsx'

import './styles/index.css'

const defaultBusinessSettings = {
  businessName: 'INVE-FAT SYSTEM, SRL',
  businessShortName: 'INVE-FAT',
  systemLabel: 'SYSTEM',
  slogan: 'Soluciones Integrales de Inventario, Facturacion y Punto de Venta',
  rnc: '1-31-12345-6',
  phone: '(809) 555-1234',
  email: 'info@invefatsystem.com',
  address: 'Av. Winston Churchill No. 1099, Santo Domingo, R.D.',
  logo: '',
  invoiceTemplate: 'elegante',
  themeMode: 'light',
  accentColor: '#F97316',
}

function getBusinessSettings() {
  try {
    const savedSettings = localStorage.getItem('invefat-business-settings')

    if (!savedSettings) {
      return defaultBusinessSettings
    }

    return {
      ...defaultBusinessSettings,
      ...JSON.parse(savedSettings),
    }
  } catch (error) {
    return defaultBusinessSettings
  }
}

const defaultSystemUsers = [
  {
    id: 'USR-001',
    name: 'Administrador',
    role: 'Administrador',
    email: 'admin@empresa.com',
    status: 'Activo',
    permissions: {
      dashboard: true,
      inventory: true,
      sales: true,
      purchases: true,
      accounting: true,
      hr: true,
      crm: true,
      production: true,
      projects: true,
      documents: true,
      reports: true,
      admin: true,
    },
  },
  {
    id: 'USR-002',
    name: 'Cajera',
    role: 'Facturacion',
    email: 'caja@empresa.com',
    status: 'Activo',
    permissions: {
      dashboard: true,
      inventory: false,
      sales: true,
      purchases: false,
      accounting: false,
      hr: false,
      crm: true,
      production: false,
      projects: false,
      documents: false,
      reports: false,
      admin: false,
    },
  },
  {
    id: 'USR-003',
    name: 'Almacen',
    role: 'Inventario',
    email: 'almacen@empresa.com',
    status: 'Activo',
    permissions: {
      dashboard: true,
      inventory: true,
      sales: false,
      purchases: true,
      accounting: false,
      hr: false,
      crm: false,
      production: false,
      projects: false,
      documents: false,
      reports: false,
      admin: false,
    },
  },
]

const modules = [
  { id: 'inventory', number: 1, name: 'Inventario y Almacen', icon: Warehouse },
  { id: 'sales', number: 2, name: 'Ventas', icon: ShoppingCart },
  { id: 'purchases', number: 3, name: 'Compras', icon: Store },
  { id: 'accounting', number: 4, name: 'Contabilidad', icon: Wallet },
  { id: 'hr', number: 5, name: 'Recursos Humanos', icon: Users },
  { id: 'crm', number: 6, name: 'CRM', icon: User },
  { id: 'production', number: 7, name: 'Produccion', icon: Building2 },
  { id: 'projects', number: 8, name: 'Proyectos', icon: Briefcase },
  { id: 'documents', number: 9, name: 'Documentos', icon: FileText },
  { id: 'reports', number: 10, name: 'Reportes y BI', icon: BarChart3 },
  { id: 'admin', number: 11, name: 'Administracion', icon: Settings },
  { id: 'ecommerce', number: 12, name: 'Ecommerce', icon: ShoppingCart },
  { id: 'communication', number: 13, name: 'Comunicacion', icon: MessageCircle },
  { id: 'ai', number: 14, name: 'Inteligencia Artificial', icon: Zap },
]
const specialModules = [
  { id: 'restaurant', name: 'Restaurante', icon: Utensils },
  { id: 'hardware', name: 'Ferreteria', icon: Truck },
  { id: 'pharmacy', name: 'Farmacia', icon: Pill },
  { id: 'supermarket', name: 'Supermercado', icon: ShoppingCart },
  { id: 'hotel', name: 'Hotel', icon: Hotel },
]

const kpis = [
  { title: 'Ventas del dia', value: 'RD$ 125,430', change: '+ 12.5%', note: 'vs ayer', icon: ShoppingCart, color: 'green' },
  { title: 'Compras del dia', value: 'RD$ 75,230', change: '- 3.4%', note: 'vs ayer', icon: ShoppingCart, color: 'blue' },
  { title: 'Inventario bajo', value: '23 Productos', change: 'Ver productos', note: '', icon: Package, color: 'orange' },
  { title: 'Cuentas por cobrar', value: 'RD$ 250,000', change: '+ 12 Clientes', note: '', icon: Briefcase, color: 'purple' },
  { title: 'Cuentas por pagar', value: 'RD$ 125,000', change: '+ 8 Proveedores', note: '', icon: CreditCard, color: 'red' },
  { title: 'Flujo de caja', value: 'RD$ 80,430', change: '+ 8.7%', note: 'vs ayer', icon: DollarSign, color: 'green' },
]

const topProducts = [
  { name: 'Laptop HP Pavilion', units: '45 unidades', price: 'RD$ 675,000' },
  { name: 'Mouse Inalambrico Logitech', units: '80 unidades', price: 'RD$ 120,000' },
  { name: 'Teclado Mecanico RGB', units: '35 unidades', price: 'RD$ 175,000' },
  { name: 'Monitor Samsung 24"', units: '20 unidades', price: 'RD$ 260,000' },
  { name: 'Audifonos Sony WH-1000XM4', units: '25 unidades', price: 'RD$ 187,500' },
]

const tasks = [
  { title: 'Aprobar orden de compra #2458', subtitle: 'Proveedor: Suplidores SA', tag: 'Urgente', time: '10:30 AM', color: 'red' },
  { title: 'Revisar inventario almacen principal', subtitle: 'Inventario fisico', tag: 'Media', time: '11:00 AM', color: 'orange' },
  { title: 'Pago de nomina empleados', subtitle: 'Proceso de nomina', tag: 'Importante', time: '12:00 PM', color: 'purple' },
  { title: 'Reunion con equipo de ventas', subtitle: 'Sala de reuniones', tag: 'Media', time: '02:00 PM', color: 'orange' },
  { title: 'Enviar reporte mensual', subtitle: 'Gerencia', tag: 'Baja', time: '04:00 PM', color: 'green' },
]

const quickActions = [
  { name: 'Nueva venta', icon: ShoppingCart, color: 'green' },
  { name: 'Nuevo gasto', icon: CreditCard, color: 'green' },
  { name: 'Nuevo producto', icon: Package, color: 'blue' },
  { name: 'Nuevo cliente', icon: User, color: 'purple' },
  { name: 'Reporte de ventas', icon: BarChart3, color: 'orange' },
  { name: 'Inventario fisico', icon: Box, color: 'brown' },
  { name: 'Nomina', icon: Wallet, color: 'pink' },
  { name: 'Asiento contable', icon: FileText, color: 'cyan' },
]

const systemModules = [
  { name: 'Dashboard', icon: Gauge, color: 'orange' },
  { name: 'Inventario', icon: Package, color: 'orange' },
  { name: 'Ventas', icon: ShoppingCart, color: 'yellow' },
  { name: 'Compras', icon: ShoppingCart, color: 'cyan' },
  { name: 'Contabilidad', icon: Wallet, color: 'amber' },
  { name: 'RRHH', icon: Users, color: 'orange' },
  { name: 'CRM', icon: Heart, color: 'pink' },
  { name: 'Produccion', icon: Building2, color: 'purple' },
  { name: 'Proyectos', icon: Truck, color: 'orange' },
  { name: 'Documentos', icon: FileText, color: 'red' },
  { name: 'Reportes', icon: BarChart3, color: 'green' },
  { name: 'Admin', icon: Settings, color: 'cyan' },
  { name: 'Ecommerce', icon: ShoppingCart, color: 'yellow' },
  { name: 'Comunicacion', icon: MessageCircle, color: 'blue' },
  { name: 'IA', icon: Bot, color: 'purple' },
]

const workspaceModules = {
  accounting: {
    badge: 'Modulo financiero',
    title: 'Contabilidad',
    description: 'Controla asientos, cuentas, conciliaciones, impuestos y estados financieros.',
    icon: Wallet,
    metrics: [
      { label: 'Balance disponible', value: 'RD$ 1,280,450', note: 'Caja y bancos' },
      { label: 'Cuentas por cobrar', value: 'RD$ 250,000', note: '12 clientes' },
      { label: 'Cuentas por pagar', value: 'RD$ 125,000', note: '8 proveedores' },
      { label: 'Asientos del mes', value: '84', note: '17 pendientes' },
    ],
    records: [
      { code: 'ASI-1048', name: 'Venta credito Colegio San Miguel', owner: 'Facturacion', date: '15/05/2026', amount: 'RD$ 18,500', status: 'Registrado' },
      { code: 'ASI-1047', name: 'Compra inventario Suplidores SA', owner: 'Compras', date: '14/05/2026', amount: 'RD$ 75,230', status: 'Revision' },
      { code: 'ASI-1046', name: 'Pago servicios oficina principal', owner: 'Tesoreria', date: '13/05/2026', amount: 'RD$ 9,850', status: 'Conciliado' },
    ],
    actions: ['Nuevo asiento', 'Conciliar banco', 'Registrar pago', 'Estado financiero'],
  },
  hr: {
    badge: 'Talento humano',
    title: 'Recursos Humanos',
    description: 'Gestiona empleados, asistencia, nomina, permisos, vacaciones y expedientes.',
    icon: Users,
    metrics: [
      { label: 'Empleados activos', value: '42', note: '6 departamentos' },
      { label: 'Nomina estimada', value: 'RD$ 785,000', note: 'Proxima quincena' },
      { label: 'Asistencia hoy', value: '95%', note: '2 ausencias' },
      { label: 'Solicitudes abiertas', value: '9', note: 'Permisos y vacaciones' },
    ],
    records: [
      { code: 'EMP-001', name: 'Ana Martinez', owner: 'Ventas', date: 'Activa', amount: 'RD$ 48,000', status: 'Activo' },
      { code: 'EMP-014', name: 'Carlos Pena', owner: 'Almacen', date: 'Vacaciones', amount: 'RD$ 35,000', status: 'Permiso' },
      { code: 'EMP-021', name: 'Maria Gomez', owner: 'Contabilidad', date: 'Activa', amount: 'RD$ 52,000', status: 'Activo' },
    ],
    actions: ['Nuevo empleado', 'Procesar nomina', 'Registrar asistencia', 'Aprobar permiso'],
  },
  crm: {
    badge: 'Relacion comercial',
    title: 'CRM',
    description: 'Administra prospectos, clientes, oportunidades, seguimiento y pipeline comercial.',
    icon: User,
    metrics: [
      { label: 'Clientes activos', value: '128', note: '18 nuevos este mes' },
      { label: 'Oportunidades', value: '34', note: 'RD$ 1.4M estimado' },
      { label: 'Seguimientos hoy', value: '16', note: 'Llamadas y visitas' },
      { label: 'Conversion', value: '27%', note: '+4% vs mes anterior' },
    ],
    records: [
      { code: 'OPP-204', name: 'Distribuidora Gomez', owner: 'Mayorista', date: '15/05/2026', amount: 'RD$ 240,000', status: 'Negociacion' },
      { code: 'CLI-002', name: 'Comercial La Fe', owner: 'Retail', date: '14/05/2026', amount: 'RD$ 80,000', status: 'Activo' },
      { code: 'SEG-118', name: 'Colegio San Miguel', owner: 'Corporativo', date: 'Hoy 3:00 PM', amount: 'RD$ 150,000', status: 'Pendiente' },
    ],
    actions: ['Nuevo cliente', 'Nueva oportunidad', 'Agendar llamada', 'Ver pipeline'],
  },
  production: {
    badge: 'Operacion interna',
    title: 'Produccion',
    description: 'Planifica ordenes de produccion, materiales, capacidad, tiempos y calidad.',
    icon: Building2,
    metrics: [
      { label: 'Ordenes abiertas', value: '18', note: '5 en proceso' },
      { label: 'Eficiencia', value: '86%', note: '+3% esta semana' },
      { label: 'Material reservado', value: 'RD$ 320,500', note: 'Inventario comprometido' },
      { label: 'Calidad aprobada', value: '97%', note: 'Ultimos lotes' },
    ],
    records: [
      { code: 'OP-5021', name: 'Ensamble kit escolar', owner: 'Linea 1', date: '15/05/2026', amount: '450 und.', status: 'En proceso' },
      { code: 'OP-5019', name: 'Empaque productos limpieza', owner: 'Linea 2', date: '14/05/2026', amount: '1,200 und.', status: 'Programado' },
      { code: 'QC-221', name: 'Revision calidad lote A17', owner: 'Calidad', date: 'Hoy', amount: '97%', status: 'Aprobado' },
    ],
    actions: ['Nueva orden', 'Reservar material', 'Registrar avance', 'Control calidad'],
  },
  projects: {
    badge: 'Gestion de trabajo',
    title: 'Proyectos',
    description: 'Organiza tareas, responsables, presupuestos, avances y entregables.',
    icon: Briefcase,
    metrics: [
      { label: 'Proyectos activos', value: '12', note: '3 prioritarios' },
      { label: 'Tareas abiertas', value: '74', note: '21 vencen esta semana' },
      { label: 'Presupuesto usado', value: '64%', note: 'RD$ 920,000' },
      { label: 'Avance promedio', value: '71%', note: '+8% semanal' },
    ],
    records: [
      { code: 'PRO-031', name: 'Implementacion punto de venta', owner: 'Tecnologia', date: '28/05/2026', amount: '72%', status: 'En curso' },
      { code: 'PRO-029', name: 'Conteo fisico almacenes', owner: 'Inventario', date: '20/05/2026', amount: '45%', status: 'Riesgo' },
      { code: 'PRO-026', name: 'Portal de clientes B2B', owner: 'Ecommerce', date: '05/06/2026', amount: '31%', status: 'Planificado' },
    ],
    actions: ['Nuevo proyecto', 'Asignar tarea', 'Ver calendario', 'Reporte avance'],
  },
  documents: {
    badge: 'Archivo digital',
    title: 'Documentos',
    description: 'Centraliza facturas, cotizaciones, contratos, archivos y aprobaciones.',
    icon: FileText,
    metrics: [
      { label: 'Documentos', value: '1,248', note: '126 este mes' },
      { label: 'Pendientes firma', value: '14', note: 'Contratos y ordenes' },
      { label: 'Espacio usado', value: '38%', note: 'Repositorio local' },
      { label: 'Aprobaciones', value: '22', note: 'Flujo documental' },
    ],
    records: [
      { code: 'DOC-884', name: 'Factura FAC-000003', owner: 'Ventas', date: '15/05/2026', amount: 'PDF', status: 'Emitido' },
      { code: 'DOC-883', name: 'Orden de compra #2458', owner: 'Compras', date: '14/05/2026', amount: 'PDF', status: 'Revision' },
      { code: 'DOC-879', name: 'Contrato suplidor logistico', owner: 'Legal', date: '12/05/2026', amount: 'DOCX', status: 'Firma' },
    ],
    actions: ['Subir archivo', 'Crear carpeta', 'Solicitar firma', 'Exportar PDF'],
  },
  reports: {
    badge: 'Analitica ejecutiva',
    title: 'Reportes y BI',
    description: 'Consulta indicadores, reportes, comparativos, exportaciones y tableros.',
    icon: BarChart3,
    metrics: [
      { label: 'Ventas mes', value: 'RD$ 2.8M', note: '+12.5%' },
      { label: 'Margen bruto', value: '31%', note: '+2.1%' },
      { label: 'Rotacion inventario', value: '4.8x', note: 'Ultimos 30 dias' },
      { label: 'Reportes listos', value: '18', note: 'Excel y PDF' },
    ],
    records: [
      { code: 'REP-VENT', name: 'Ventas por producto', owner: 'Comercial', date: 'Hoy', amount: 'Excel', status: 'Listo' },
      { code: 'REP-INV', name: 'Inventario bajo y vencimientos', owner: 'Almacen', date: 'Hoy', amount: 'PDF', status: 'Listo' },
      { code: 'REP-FIN', name: 'Flujo de caja semanal', owner: 'Finanzas', date: 'Ayer', amount: 'Dashboard', status: 'Revision' },
    ],
    actions: ['Nuevo reporte', 'Exportar Excel', 'Programar envio', 'Ver dashboard'],
  },
  ecommerce: {
    badge: 'Canal digital',
    title: 'Ecommerce',
    description: 'Gestiona catalogo web, pedidos, precios, clientes online y despacho.',
    icon: ShoppingCart,
    metrics: [
      { label: 'Pedidos online', value: '38', note: '12 por despachar' },
      { label: 'Ventas web', value: 'RD$ 186,400', note: 'Hoy' },
      { label: 'Productos publicados', value: '312', note: '24 sin foto' },
      { label: 'Carritos abiertos', value: '19', note: 'Seguimiento CRM' },
    ],
    records: [
      { code: 'WEB-1028', name: 'Pedido Comercial La Fe', owner: 'Tienda web', date: 'Hoy', amount: 'RD$ 12,850', status: 'Preparando' },
      { code: 'WEB-1027', name: 'Pedido cliente mostrador', owner: 'Marketplace', date: 'Hoy', amount: 'RD$ 4,300', status: 'Pagado' },
      { code: 'CAT-084', name: 'Actualizar fotos bebidas', owner: 'Catalogo', date: '15/05/2026', amount: '24 items', status: 'Pendiente' },
    ],
    actions: ['Nuevo pedido', 'Publicar producto', 'Actualizar precios', 'Despachar'],
  },
  communication: {
    badge: 'Mensajeria interna',
    title: 'Comunicacion',
    description: 'Coordina mensajes, avisos, reuniones, comunicados y notificaciones.',
    icon: MessageCircle,
    metrics: [
      { label: 'Mensajes hoy', value: '86', note: '12 sin leer' },
      { label: 'Avisos activos', value: '5', note: 'Empresa y equipos' },
      { label: 'Reuniones', value: '7', note: 'Agenda de hoy' },
      { label: 'Tickets internos', value: '11', note: '3 urgentes' },
    ],
    records: [
      { code: 'MSG-501', name: 'Reunion equipo ventas', owner: 'Comercial', date: '2:00 PM', amount: 'Sala 2', status: 'Hoy' },
      { code: 'AVI-144', name: 'Cierre inventario fisico', owner: 'Almacen', date: '15/05/2026', amount: 'Todos', status: 'Activo' },
      { code: 'TK-088', name: 'Soporte impresora facturacion', owner: 'Tecnologia', date: 'Urgente', amount: 'Caja', status: 'Abierto' },
    ],
    actions: ['Nuevo aviso', 'Enviar mensaje', 'Agendar reunion', 'Abrir ticket'],
  },
  ai: {
    badge: 'Asistente inteligente',
    title: 'Inteligencia Artificial',
    description: 'Consulta datos, genera reportes, detecta riesgos y sugiere acciones.',
    icon: Zap,
    metrics: [
      { label: 'Alertas detectadas', value: '9', note: 'Stock y cobros' },
      { label: 'Consultas hoy', value: '24', note: 'Usuarios internos' },
      { label: 'Automatizaciones', value: '6', note: 'Activas' },
      { label: 'Sugerencias', value: '18', note: 'Pendientes de revisar' },
    ],
    records: [
      { code: 'AI-001', name: 'Productos con riesgo de agotarse', owner: 'Inventario', date: 'Hoy', amount: '23 items', status: 'Alerta' },
      { code: 'AI-002', name: 'Clientes con atraso de pago', owner: 'Finanzas', date: 'Hoy', amount: '8 clientes', status: 'Revision' },
      { code: 'AI-003', name: 'Resumen ventas semanal', owner: 'Gerencia', date: 'Listo', amount: 'Reporte', status: 'Generado' },
    ],
    actions: ['Preguntar a IA', 'Generar reporte', 'Analizar stock', 'Crear alerta'],
  },
  restaurant: {
    badge: 'Operacion restaurante',
    title: 'Restaurante',
    description: 'Gestiona mesas, comandas, cocina, delivery, caja y cierre diario.',
    icon: Utensils,
    metrics: [
      { label: 'Mesas ocupadas', value: '12/28', note: 'Servicio activo' },
      { label: 'Comandas abiertas', value: '34', note: '8 en cocina' },
      { label: 'Ventas turno', value: 'RD$ 58,900', note: 'Salon y delivery' },
      { label: 'Tiempo promedio', value: '18 min', note: 'Cocina' },
    ],
    records: [
      { code: 'MESA-08', name: 'Mesa 8 - 4 personas', owner: 'Salon', date: 'Abierta', amount: 'RD$ 3,250', status: 'En proceso' },
      { code: 'CMD-221', name: 'Comanda hamburguesas y bebidas', owner: 'Cocina', date: '12 min', amount: '6 items', status: 'Preparando' },
      { code: 'DEL-044', name: 'Pedido delivery zona norte', owner: 'Delivery', date: 'Hoy', amount: 'RD$ 1,850', status: 'Despacho' },
    ],
    actions: ['Abrir mesa', 'Nueva comanda', 'Enviar cocina', 'Cerrar turno'],
  },
  hardware: {
    badge: 'Operacion ferretera',
    title: 'Ferreteria',
    description: 'Controla cotizaciones, materiales, despacho, medidas, entregas y clientes de obra.',
    icon: Truck,
    metrics: [
      { label: 'Cotizaciones abiertas', value: '19', note: 'Obras y contratistas' },
      { label: 'Despachos hoy', value: '27', note: '5 pendientes' },
      { label: 'Material critico', value: '14', note: 'Stock bajo' },
      { label: 'Ventas mostrador', value: 'RD$ 92,400', note: 'Turno actual' },
    ],
    records: [
      { code: 'COT-F089', name: 'Material electrico edificio Luna', owner: 'Contratista', date: '15/05/2026', amount: 'RD$ 146,000', status: 'Revision' },
      { code: 'DSP-340', name: 'Entrega cemento y varilla', owner: 'Camion 2', date: 'Hoy', amount: 'RD$ 38,500', status: 'Despacho' },
      { code: 'MAT-022', name: 'Pintura blanca cubeta', owner: 'Almacen', date: 'Stock bajo', amount: '8 und.', status: 'Alerta' },
    ],
    actions: ['Nueva cotizacion', 'Despachar', 'Orden de entrega', 'Lista de precios'],
  },
  pharmacy: {
    badge: 'Operacion farmacia',
    title: 'Farmacia',
    description: 'Gestiona medicamentos, lotes, recetas, vencimientos, aseguradoras y dispensacion.',
    icon: Pill,
    metrics: [
      { label: 'Recetas hoy', value: '63', note: '12 pendientes' },
      { label: 'Lotes por vencer', value: '21', note: 'Proximos 60 dias' },
      { label: 'Ventas mostrador', value: 'RD$ 74,250', note: 'Turno actual' },
      { label: 'Aseguradoras', value: '8', note: 'Con autorizaciones' },
    ],
    records: [
      { code: 'RX-204', name: 'Receta paciente mostrador', owner: 'Dispensacion', date: 'Hoy', amount: 'RD$ 1,240', status: 'Pendiente' },
      { code: 'LOT-118', name: 'Acetaminofen 500mg lote A41', owner: 'Inventario', date: '30/06/2026', amount: '85 und.', status: 'Alerta' },
      { code: 'SEG-030', name: 'Autorizacion aseguradora', owner: 'ARS', date: 'Hoy', amount: 'RD$ 3,600', status: 'Revision' },
    ],
    actions: ['Nueva receta', 'Ver vencimientos', 'Autorizar ARS', 'Dispensar'],
  },
  supermarket: {
    badge: 'Operacion supermercado',
    title: 'Supermercado',
    description: 'Administra cajas, gondolas, ofertas, pesaje, reposicion y ventas por turno.',
    icon: ShoppingCart,
    metrics: [
      { label: 'Cajas abiertas', value: '6', note: '2 express' },
      { label: 'Ventas turno', value: 'RD$ 186,900', note: '+9% vs ayer' },
      { label: 'Reposiciones', value: '42', note: 'Gondolas activas' },
      { label: 'Ofertas vigentes', value: '18', note: 'Hasta domingo' },
    ],
    records: [
      { code: 'CAJA-03', name: 'Caja 3 turno tarde', owner: 'Cajero', date: 'Abierta', amount: 'RD$ 42,300', status: 'Activo' },
      { code: 'REP-118', name: 'Reposicion pasillo bebidas', owner: 'Gondola', date: 'Hoy', amount: '32 cajas', status: 'En proceso' },
      { code: 'OFE-027', name: 'Oferta arroz y aceite', owner: 'Mercadeo', date: 'Fin semana', amount: '12 SKU', status: 'Activo' },
    ],
    actions: ['Abrir caja', 'Crear oferta', 'Reposicion', 'Cierre turno'],
  },
  hotel: {
    badge: 'Operacion hotelera',
    title: 'Hotel',
    description: 'Gestiona reservas, habitaciones, check-in, consumos, limpieza y facturacion.',
    icon: Hotel,
    metrics: [
      { label: 'Ocupacion', value: '74%', note: '52 habitaciones' },
      { label: 'Check-in hoy', value: '18', note: '6 pendientes' },
      { label: 'Check-out hoy', value: '11', note: '3 por facturar' },
      { label: 'Ingresos dia', value: 'RD$ 214,700', note: 'Hospedaje y consumos' },
    ],
    records: [
      { code: 'RES-190', name: 'Reserva habitacion 402', owner: 'Recepcion', date: 'Hoy 3:00 PM', amount: 'RD$ 18,000', status: 'Confirmado' },
      { code: 'HAB-218', name: 'Habitacion 218 limpieza', owner: 'Ama de llaves', date: 'Ahora', amount: 'Suite', status: 'En proceso' },
      { code: 'FAC-H77', name: 'Check-out cliente corporativo', owner: 'Facturacion', date: 'Hoy', amount: 'RD$ 26,500', status: 'Pendiente' },
    ],
    actions: ['Nueva reserva', 'Check-in', 'Check-out', 'Asignar limpieza'],
  },
}

const inventoryCards = [
  { title: 'Productos', value: '1,245', text: 'Productos registrados', icon: Package, color: 'orange' },
  { title: 'Categorias', value: '38', text: 'Familias de productos', icon: Layers, color: 'purple' },
  { title: 'Almacenes', value: '4', text: 'Almacenes activos', icon: Warehouse, color: 'blue' },
  { title: 'Stock bajo', value: '23', text: 'Requieren reposicion', icon: Boxes, color: 'red' },
]

const inventoryActions = [
  { name: 'Nuevo producto', icon: Plus, color: 'orange' },
  { name: 'Recepcion de mercancia', icon: ClipboardList, color: 'green' },
  { name: 'Movimiento de producto', icon: ArrowLeftRight, color: 'blue' },
  { name: 'Ajuste de inventario', icon: Settings, color: 'purple' },
  { name: 'Codigo de barras', icon: ScanBarcode, color: 'cyan' },
  { name: 'Reporte de inventario', icon: FileBarChart, color: 'amber' },
]

const inventoryProducts = [
  {
    code: 'PRO-001',
    barcode: '7460010010012',
    name: 'Laptop HP Pavilion',
    category: 'Tecnologia',
    unit: 'Unidad',
    boxQty: 1,
    stock: 45,
    min: 10,
    warehouse: 'Principal',
    expiryDate: 'No aplica',
    status: 'Disponible',
  },
  {
    code: 'PRO-002',
    barcode: '7460010010029',
    name: 'Mouse Inalambrico Logitech',
    category: 'Accesorios',
    unit: 'Unidad',
    boxQty: 1,
    stock: 80,
    min: 20,
    warehouse: 'Principal',
    expiryDate: 'No aplica',
    status: 'Disponible',
  },
  {
    code: 'PRO-003',
    barcode: '7460010010036',
    name: 'Teclado Mecanico RGB',
    category: 'Accesorios',
    unit: 'Unidad',
    boxQty: 1,
    stock: 35,
    min: 15,
    warehouse: 'Principal',
    expiryDate: 'No aplica',
    status: 'Disponible',
  },
  {
    code: 'PRO-004',
    barcode: '7460010010043',
    name: 'Monitor Samsung 24"',
    category: 'Tecnologia',
    unit: 'Unidad',
    boxQty: 1,
    stock: 8,
    min: 12,
    warehouse: 'Almacen 2',
    expiryDate: 'No aplica',
    status: 'Stock bajo',
  },
  {
    code: 'PRO-005',
    barcode: '7460010010050',
    name: 'Audifonos Sony WH-1000XM4',
    category: 'Audio',
    unit: 'Unidad',
    boxQty: 1,
    stock: 25,
    min: 8,
    warehouse: 'Principal',
    expiryDate: 'No aplica',
    status: 'Disponible',
  },
]
function colorClass(color) {
  return `soft-${color}`
}

function Logo() {
  return (
    <div className="brand">
      <div className="logo-mark"><span /></div>
      <div>
        <h1>INVE-FAT SYSTEM</h1>
        <p>ERP Empresarial</p>
      </div>
    </div>
  )
}

function Sidebar({ activeModule, setActiveModule, isMobileOpen, closeMobileMenu }) {
  return (
    <aside className={"sidebar " + (isMobileOpen ? "sidebar-mobile-open" : "")}>
      <div className="sidebar-mobile-top">
        <Logo />
        <button className="sidebar-mobile-close" onClick={closeMobileMenu} aria-label="Cerrar menu">
          <X size={22} />
        </button>
      </div>

      <button
        className={activeModule === 'dashboard' ? 'sidebar-active sidebar-dashboard-fixed' : 'sidebar-item sidebar-dashboard-fixed'}
        onClick={() => { setActiveModule('dashboard'); closeMobileMenu?.() }}
      >
        <span className="sidebar-dashboard-label">
          <Home size={19} />
          Dashboard
        </span>
      </button>

      <div className="sidebar-scroll-area">
        <nav className="sidebar-menu">
          {modules.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={activeModule === item.id ? 'sidebar-active' : 'sidebar-item'}
                onClick={() => { setActiveModule(item.id); closeMobileMenu?.() }}
              >
                <span className="sidebar-label">
                  <Icon size={18} />
                  <span className="sidebar-number">{item.number}</span>
                  <span className="sidebar-name">{item.name}</span>
                </span>
                <ChevronRight size={15} />
              </button>
            )
          })}
        </nav>

        <div className="special-title">
          <span />
          Modulos especiales
          <span />
        </div>

        <div className="special-list">
          {specialModules.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={activeModule === item.id ? 'active' : ''}
                onClick={() => { setActiveModule(item.id); closeMobileMenu?.() }}
              >
                <Icon size={17} />
                {item.name}
              </button>
            )
          })}
        </div>
      </div>

      <button className="config-button" onClick={() => { setActiveModule('admin'); closeMobileMenu?.() }}>
        <Settings size={19} />
        Configurar modulos
      </button>
    </aside>
  )
}

function Navbar({ theme, toggleTheme, onOpenSidebar }) {
  return (
    <header className="topbar">
      <button
        className="menu-button"
        onClick={() => {
          if (window.innerWidth <= 900 && typeof onOpenSidebar === 'function') {
            onOpenSidebar()
            return
          }

          document.body.classList.toggle('sidebar-collapsed-mode')
        }}
        aria-label="Abrir menu"
      >
        <Menu size={24} />
      </button>

      <div className="search-box">
        <input placeholder="Buscar en el sistema..." />
        <Search size={20} />
      </div>

      <div className="top-actions">
        <button className="notification">
          <Bell size={21} />
          <span>5</span>
        </button>

        <button
          className="theme-button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        >
          {theme === 'dark' ? <Sun size={21} /> : <Moon size={21} />}
        </button>

        <div className="divider" />

        <div className="profile">
          <div className="avatar">A</div>
          <div>
            <strong>Administrador</strong>
            <small>Administrador</small>
          </div>
          <ChevronDown size={18} />
        </div>
      </div>
    </header>
  )
}

function KpiCard({ item }) {
  const Icon = item.icon
  const negative = item.change.includes('-')

  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${colorClass(item.color)}`}>
        <Icon size={26} />
      </div>

      <div>
        <p>{item.title}</p>
        <h3>{item.value}</h3>
        <span className={negative ? 'negative' : item.color === 'orange' ? 'orange-text' : 'positive'}>
          {item.change} <small>{item.note}</small>
        </span>
      </div>
    </div>
  )
}

function ProductIcon() {
  return (
    <div className="product-icon">
      <Package size={20} />
    </div>
  )
}

function Dashboard({ setActiveModule }) {
  return (
    <main className="main-content">
      <section className="welcome">
        <h2>Bienvenido, Administrador</h2>
        <p>Aqui tienes el resumen general de tu empresa.</p>
      </section>

      <section className="kpi-grid">
        {kpis.map((item) => (
          <KpiCard key={item.title} item={item} />
        ))}
      </section>

      <section className="main-grid no-chart">
        <div className="card product-card">
          <div className="card-header">
            <h3>Top productos vendidos</h3>
            <a onClick={() => setActiveModule('inventory')}>Ver todos</a>
          </div>

          <div className="product-list">
            {topProducts.map((product, index) => (
              <div key={product.name} className="product-row">
                <span className="number">{index + 1}</span>
                <ProductIcon />
                <div>
                  <strong>{product.name}</strong>
                  <small>{product.units}</small>
                </div>
                <b>{product.price}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="card task-card">
          <div className="card-header">
            <h3>Actividades pendientes</h3>
            <a>Ver todas</a>
          </div>

          <div className="task-list">
            {tasks.map((task) => (
              <div key={task.title} className="task-row">
                <input type="checkbox" />
                <div>
                  <strong>{task.title}</strong>
                  <small>{task.subtitle}</small>
                </div>
                <span className={`tag ${colorClass(task.color)}`}>{task.tag}</span>
                <time>{task.time}</time>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-bottom-grid">
        <div className="card finance-card">
          <div className="card-header">
            <h3>Resumen financiero</h3>
            <button>Este mes</button>
          </div>

          <div className="finance-grid">
            <div className="finance-box soft-green">
              <p>Ingresos</p>
              <h4>RD$ 1,250,000</h4>
              <span>+ 15.3%</span>
            </div>

            <div className="finance-box soft-red">
              <p>Gastos</p>
              <h4>RD$ 850,000</h4>
              <span className="negative">- 8.5%</span>
            </div>

            <div className="finance-box soft-cyan">
              <p>Utilidad neta</p>
              <h4>RD$ 400,000</h4>
              <span>+ 21.8%</span>
            </div>

            <div className="finance-box soft-white">
              <p>Margen de ganancia</p>
              <h4>32%</h4>
              <span>+ 5.2%</span>
            </div>
          </div>
        </div>

        <div className="card quick-card">
          <h3>Accesos rapidos</h3>

          <div className="quick-grid">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button key={action.name} className={colorClass(action.color)}>
                  <Icon size={23} />
                  <span>{action.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="card modules-card">
        <h3>Modulos del sistema</h3>

        <div className="modules-grid">
          {systemModules.map((module) => {
            const Icon = module.icon
            return (
              <button key={module.name} className={colorClass(module.color)}>
                <Icon size={24} />
                <span>{module.name}</span>
              </button>
            )
          })}
        </div>
      </section>
    </main>
  )
}


const advancedInventorySections = [
  {
    id: 'lots',
    tab: 'Lotes y series',
    icon: Layers,
    title: 'Gestion de Lotes y Numeros de Serie',
    description: 'Control de trazabilidad por lote, numero de serie, fecha de vencimiento, proveedor y movimiento.',
    features: ['Lotes activos', 'Series controladas', 'Vencimientos FEFO', 'Trazabilidad completa'],
  },
  {
    id: 'locations',
    tab: 'Multiubicacion',
    icon: Warehouse,
    title: 'Gestion Multialmacen y Multiubicacion',
    description: 'Control de almacenes, zonas, pasillos, racks, niveles y ubicaciones exactas.',
    features: ['Almacenes multiples', 'Ubicaciones internas', 'Transferencias', 'Capacidad por zona'],
  },
  {
    id: 'variants',
    tab: 'Variantes y kits',
    icon: Package,
    title: 'Variantes de Producto y Kits BOM',
    description: 'Gestiona colores, tallas, presentaciones, productos compuestos, combos y kits.',
    features: ['Variantes SKU', 'Kits armados', 'Componentes BOM', 'Disponibilidad por componente'],
  },
  {
    id: 'codes',
    tab: 'Barcode QR RFID',
    icon: Package,
    title: 'Codigos de Barra, QR y RFID',
    description: 'Soporte para escaneo de codigo de barra, generacion QR y preparacion para RFID.',
    features: ['Codigo de barra', 'Codigo QR', 'Etiquetas', 'RFID preparado'],
  },
  {
    id: 'putaway',
    tab: 'Putaway',
    icon: Warehouse,
    title: 'Estrategias de Almacenamiento Putaway',
    description: 'Sugiere ubicaciones de guardado segun categoria, rotacion, volumen y reglas de almacen.',
    features: ['Reglas de guardado', 'Ubicacion sugerida', 'Zonas preferidas', 'Control de capacidad'],
  },
  {
    id: 'dispatch',
    tab: 'FIFO FEFO LIFO',
    icon: ArrowLeftRight,
    title: 'Metodos de Despacho FIFO, FEFO y LIFO',
    description: 'Despacha productos segun primero en entrar, primero en vencer o ultimo recibido.',
    features: ['FIFO', 'FEFO', 'LIFO', 'Alertas de vencimiento'],
  },
  {
    id: 'picking',
    tab: 'Picking',
    icon: ClipboardList,
    title: 'Optimizacion de Rutas de Picking',
    description: 'Organiza rutas de recogida para reducir tiempo, distancia y errores de despacho.',
    features: ['Rutas de picking', 'Asignacion de operarios', 'Ordenes pendientes', 'Exactitud de preparacion'],
  },
  {
    id: 'reorder',
    tab: 'Reposicion',
    icon: Boxes,
    title: 'Puntos de Pedido Automaticos y Stock de Seguridad',
    description: 'Calcula stock minimo, stock de seguridad y sugerencias automaticas de compra.',
    features: ['Stock minimo', 'Stock maximo', 'Punto de pedido', 'Sugerencia de compra'],
  },
  {
    id: 'costs',
    tab: 'Costos',
    icon: Gauge,
    title: 'Calculo de Costos Promedio, FIFO, LIFO y Landed Cost',
    description: 'Control de costos por metodo, capas de inventario y costos adicionales de importacion.',
    features: ['Costo promedio', 'Costo FIFO', 'Costo LIFO', 'Landed cost'],
  },
  {
    id: 'cycle',
    tab: 'Conteo ciclico',
    icon: ClipboardList,
    title: 'Inventarios Ciclicos Cycle Counting',
    description: 'Programa conteos por ubicacion, categoria, rotacion o clasificacion ABC.',
    features: ['Conteos abiertos', 'Diferencias', 'Ajustes', 'Calendario de conteo'],
  },
  {
    id: 'quality',
    tab: 'Calidad',
    icon: Layers,
    title: 'Control de Calidad y Cuarentena',
    description: 'Bloquea productos en inspeccion, retenidos, rechazados o pendientes de liberacion.',
    features: ['Cuarentena', 'Inspeccion', 'Producto aprobado', 'Producto rechazado'],
  },
  {
    id: 'waste',
    tab: 'Mermas y devoluciones',
    icon: ArrowLeftRight,
    title: 'Gestion de Mermas y Devoluciones',
    description: 'Registra averias, vencimientos, perdidas, devoluciones de clientes y proveedores.',
    features: ['Mermas', 'Averias', 'Devoluciones cliente', 'Devoluciones proveedor'],
  },
  {
    id: 'abc',
    tab: 'ABC',
    icon: Gauge,
    title: 'Clasificacion ABC Automatica',
    description: 'Clasifica productos por valor, rotacion, margen, importancia y criticidad.',
    features: ['Clase A', 'Clase B', 'Clase C', 'Recalculo automatico'],
  },
  {
    id: 'kpis',
    tab: 'KPIs',
    icon: Gauge,
    title: 'Dashboard de KPIs',
    description: 'Indicadores de rotacion, exactitud, OTIF, quiebres, cobertura y valor de inventario.',
    features: ['Rotacion', 'Exactitud', 'OTIF', 'Quiebres de stock'],
  },
  {
    id: 'integrations',
    tab: 'API EDI Movil',
    icon: Layers,
    title: 'Integracion API, EDI y App Movil para Operarios',
    description: 'Preparado para integracion con tiendas, proveedores, sistemas externos y app movil.',
    features: ['API', 'EDI', 'App movil', 'Sincronizacion'],
  },
]


function InventoryLotsSeries() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [lots, setLots] = useState([
    {
      productCode: 'PRO-001',
      productName: 'Laptop HP Pavilion',
      lotNumber: 'LOT-2026-001',
      serialNumber: 'SN-HP-0001',
      expirationDate: '2027-05-15',
      supplier: 'Suplidores del Caribe',
      warehouse: 'Almacen Principal',
      location: 'A-01-R01-N02',
      quantity: 15,
      status: 'Disponible',
    },
    {
      productCode: 'PRO-002',
      productName: 'Mouse Inalambrico Logitech',
      lotNumber: 'LOT-2026-002',
      serialNumber: 'SN-MOU-2201',
      expirationDate: '2026-09-30',
      supplier: 'Distribuidora Nacional',
      warehouse: 'Almacen Principal',
      location: 'A-02-R03-N01',
      quantity: 80,
      status: 'Disponible',
    },
    {
      productCode: 'PRO-003',
      productName: 'Monitor Samsung 24"',
      lotNumber: 'LOT-2026-003',
      serialNumber: 'SN-SAM-1209',
      expirationDate: '2026-06-20',
      supplier: 'Importadora La Union',
      warehouse: 'Almacen 2',
      location: 'B-01-R02-N03',
      quantity: 12,
      status: 'Cuarentena',
    },
  ])

  const [newLot, setNewLot] = useState({
    productCode: '',
    productName: '',
    lotNumber: '',
    serialNumber: '',
    expirationDate: '',
    supplier: '',
    warehouse: 'Almacen Principal',
    location: '',
    quantity: '',
    status: 'Disponible',
  })

  const updateLotField = (field, value) => {
    setNewLot((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const resetLotForm = () => {
    setNewLot({
      productCode: '',
      productName: '',
      lotNumber: '',
      serialNumber: '',
      expirationDate: '',
      supplier: '',
      warehouse: 'Almacen Principal',
      location: '',
      quantity: '',
      status: 'Disponible',
    })
  }

  const createLot = (event) => {
    event.preventDefault()

    if (!newLot.productCode || !newLot.productName || !newLot.lotNumber || !newLot.expirationDate || !newLot.quantity) {
      alert('Debes completar codigo, producto, lote, vencimiento y cantidad.')
      return
    }

    const createdLot = {
      ...newLot,
      quantity: Number(newLot.quantity || 0),
    }

    setLots((current) => [createdLot, ...current])
    resetLotForm()
    setShowForm(false)
  }

  const getLotAlert = (expirationDate) => {
    if (!expirationDate) return 'Sin vencimiento'

    const today = new Date()
    const expiration = new Date(expirationDate)
    const daysLeft = Math.ceil((expiration - today) / (1000 * 60 * 60 * 24))

    if (daysLeft < 0) return 'Vencido'
    if (daysLeft <= 30) return 'Vence pronto'
    if (daysLeft <= 90) return 'FEFO'
    return 'Vigente'
  }

  const filteredLots = lots.filter((lot) => {
    const search = searchTerm.toLowerCase()

    return (
      lot.productCode.toLowerCase().includes(search) ||
      lot.productName.toLowerCase().includes(search) ||
      lot.lotNumber.toLowerCase().includes(search) ||
      lot.serialNumber.toLowerCase().includes(search) ||
      lot.supplier.toLowerCase().includes(search) ||
      lot.warehouse.toLowerCase().includes(search) ||
      lot.location.toLowerCase().includes(search) ||
      lot.status.toLowerCase().includes(search)
    )
  })

  const totalLots = lots.length
  const availableLots = lots.filter((lot) => lot.status === 'Disponible').length
  const quarantineLots = lots.filter((lot) => lot.status === 'Cuarentena').length
  const expiringLots = lots.filter((lot) => getLotAlert(lot.expirationDate) === 'Vence pronto' || getLotAlert(lot.expirationDate) === 'Vencido').length

  return (
    <section className="card inventory-lots-card">
      <div className="inventory-advanced-header">
        <div>
          <span>Inventario avanzado</span>
          <h3>Gestion de Lotes y Numeros de Serie</h3>
          <p>Controla trazabilidad por lote, numero de serie, vencimiento, proveedor, almacen, ubicacion y estado de calidad.</p>
        </div>

        <button className="primary-button small" onClick={() => setShowForm(true)}>
          Nuevo lote
        </button>
      </div>

      <div className="lots-kpi-grid">
        <article>
          <span>Total lotes</span>
          <strong>{totalLots}</strong>
          <p>Registrados</p>
        </article>

        <article>
          <span>Disponibles</span>
          <strong>{availableLots}</strong>
          <p>Listos para despacho</p>
        </article>

        <article>
          <span>Cuarentena</span>
          <strong>{quarantineLots}</strong>
          <p>Pendientes de calidad</p>
        </article>

        <article>
          <span>Alertas FEFO</span>
          <strong>{expiringLots}</strong>
          <p>Vencidos o por vencer</p>
        </article>
      </div>

      <div className="lots-toolbar">
        <div className="product-search-box">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por producto, lote, serie, proveedor, almacen o ubicacion..."
          />
        </div>
      </div>

      {showForm && (
        <form className="lot-form-card" onSubmit={createLot}>
          <div className="product-form-header">
            <div>
              <h4>Nuevo lote / serie</h4>
              <p>Registra entrada controlada para trazabilidad y despacho FEFO.</p>
            </div>

            <button type="button" className="close-form-button" onClick={() => setShowForm(false)}>
              Cerrar
            </button>
          </div>

          <div className="lot-form-grid">
            <label>
              Codigo producto
              <input
                value={newLot.productCode}
                onChange={(event) => updateLotField('productCode', event.target.value)}
                placeholder="PRO-000"
              />
            </label>

            <label className="lot-wide-field">
              Producto
              <input
                value={newLot.productName}
                onChange={(event) => updateLotField('productName', event.target.value)}
                placeholder="Nombre del producto"
              />
            </label>

            <label>
              Numero de lote
              <input
                value={newLot.lotNumber}
                onChange={(event) => updateLotField('lotNumber', event.target.value)}
                placeholder="LOT-2026-000"
              />
            </label>

            <label>
              Numero de serie
              <input
                value={newLot.serialNumber}
                onChange={(event) => updateLotField('serialNumber', event.target.value)}
                placeholder="Opcional"
              />
            </label>

            <label>
              Fecha vencimiento
              <input
                type="date"
                value={newLot.expirationDate}
                onChange={(event) => updateLotField('expirationDate', event.target.value)}
              />
            </label>

            <label>
              Proveedor
              <input
                value={newLot.supplier}
                onChange={(event) => updateLotField('supplier', event.target.value)}
                placeholder="Proveedor"
              />
            </label>

            <label>
              Almacen
              <select
                value={newLot.warehouse}
                onChange={(event) => updateLotField('warehouse', event.target.value)}
              >
                <option>Almacen Principal</option>
                <option>Almacen 2</option>
                <option>Almacen 3</option>
                <option>Almacen Cuarentena</option>
              </select>
            </label>

            <label>
              Ubicacion
              <input
                value={newLot.location}
                onChange={(event) => updateLotField('location', event.target.value)}
                placeholder="A-01-R01-N01"
              />
            </label>

            <label>
              Cantidad
              <input
                type="number"
                value={newLot.quantity}
                onChange={(event) => updateLotField('quantity', event.target.value)}
                placeholder="0"
              />
            </label>

            <label>
              Estado
              <select
                value={newLot.status}
                onChange={(event) => updateLotField('status', event.target.value)}
              >
                <option>Disponible</option>
                <option>Cuarentena</option>
                <option>Bloqueado</option>
                <option>Vencido</option>
              </select>
            </label>
          </div>

          <div className="product-form-actions">
            <button type="button" className="secondary-button" onClick={resetLotForm}>
              Limpiar
            </button>

            <button type="submit" className="primary-button small">
              Guardar lote
            </button>
          </div>
        </form>
      )}

      <div className="lots-table">
        <div className="lots-table-head">
          <span>Producto</span>
          <span>Lote</span>
          <span>Serie</span>
          <span>Vencimiento</span>
          <span>FEFO</span>
          <span>Proveedor</span>
          <span>Almacen</span>
          <span>Ubicacion</span>
          <span>Cantidad</span>
          <span>Estado</span>
        </div>

        {filteredLots.map((lot) => {
          const alert = getLotAlert(lot.expirationDate)

          return (
            <div key={`${lot.lotNumber}-${lot.serialNumber}-${lot.productCode}`} className="lots-table-row">
              <div>
                <strong>{lot.productName}</strong>
                <small>{lot.productCode}</small>
              </div>
              <span>{lot.lotNumber}</span>
              <span>{lot.serialNumber || 'Sin serie'}</span>
              <span>{lot.expirationDate || 'Sin fecha'}</span>
              <em className={alert === 'Vencido' ? 'status-low' : alert === 'Vence pronto' ? 'status-low' : 'status-ok'}>
                {alert}
              </em>
              <span>{lot.supplier || 'Sin proveedor'}</span>
              <span>{lot.warehouse}</span>
              <span>{lot.location || 'Sin ubicacion'}</span>
              <b>{lot.quantity}</b>
              <em className={lot.status === 'Disponible' ? 'status-ok' : lot.status === 'Cuarentena' ? 'status-neutral' : 'status-low'}>
                {lot.status}
              </em>
            </div>
          )
        })}

        {filteredLots.length === 0 && (
          <div className="empty-products">
            No hay lotes para mostrar.
          </div>
        )}
      </div>
    </section>
  )
}

function InventoryLocationsWarehouses() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showLocationForm, setShowLocationForm] = useState(false)
  const [showTransferForm, setShowTransferForm] = useState(false)

  const [warehouses] = useState([
    {
      name: 'Almacen Principal',
      code: 'WH-001',
      location: 'Sucursal Central',
      capacity: 1000,
      used: 680,
      status: 'Activo',
    },
    {
      name: 'Almacen 2',
      code: 'WH-002',
      location: 'Zona Norte',
      capacity: 600,
      used: 250,
      status: 'Activo',
    },
    {
      name: 'Almacen 3',
      code: 'WH-003',
      location: 'Zona Este',
      capacity: 400,
      used: 95,
      status: 'Activo',
    },
    {
      name: 'Almacen Cuarentena',
      code: 'WH-QA',
      location: 'Control de calidad',
      capacity: 180,
      used: 42,
      status: 'Restringido',
    },
  ])

  const [locations, setLocations] = useState([
    {
      warehouse: 'Almacen Principal',
      code: 'A-01-R01-N01',
      zone: 'Zona A',
      aisle: '01',
      rack: 'R01',
      level: 'N01',
      position: 'P01',
      capacity: 120,
      used: 80,
      status: 'Disponible',
    },
    {
      warehouse: 'Almacen Principal',
      code: 'A-01-R01-N02',
      zone: 'Zona A',
      aisle: '01',
      rack: 'R01',
      level: 'N02',
      position: 'P02',
      capacity: 120,
      used: 112,
      status: 'Alta ocupacion',
    },
    {
      warehouse: 'Almacen 2',
      code: 'B-02-R03-N01',
      zone: 'Zona B',
      aisle: '02',
      rack: 'R03',
      level: 'N01',
      position: 'P04',
      capacity: 90,
      used: 35,
      status: 'Disponible',
    },
    {
      warehouse: 'Almacen Cuarentena',
      code: 'QA-01-R01-N01',
      zone: 'Cuarentena',
      aisle: '01',
      rack: 'R01',
      level: 'N01',
      position: 'QA01',
      capacity: 60,
      used: 42,
      status: 'Restringido',
    },
  ])

  const [transfers, setTransfers] = useState([
    {
      date: '15/05/2026',
      product: 'Laptop HP Pavilion',
      fromLocation: 'A-01-R01-N01',
      toLocation: 'B-02-R03-N01',
      quantity: 5,
      user: 'Administrador',
      status: 'Completada',
    },
  ])

  const [newLocation, setNewLocation] = useState({
    warehouse: 'Almacen Principal',
    zone: '',
    aisle: '',
    rack: '',
    level: '',
    position: '',
    capacity: '',
    used: '',
    status: 'Disponible',
  })

  const [newTransfer, setNewTransfer] = useState({
    product: '',
    fromLocation: '',
    toLocation: '',
    quantity: '',
    user: 'Administrador',
    status: 'Completada',
  })

  const updateLocationField = (field, value) => {
    setNewLocation((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const updateTransferField = (field, value) => {
    setNewTransfer((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const buildLocationCode = (location) => {
    const zone = location.zone || 'Z'
    const aisle = location.aisle || '00'
    const rack = location.rack || 'R00'
    const level = location.level || 'N00'
    const position = location.position || 'P00'

    return `${zone.replace(/\s/g, '').toUpperCase()}-${aisle}-${rack}-${level}-${position}`
  }

  const resetLocationForm = () => {
    setNewLocation({
      warehouse: 'Almacen Principal',
      zone: '',
      aisle: '',
      rack: '',
      level: '',
      position: '',
      capacity: '',
      used: '',
      status: 'Disponible',
    })
  }

  const resetTransferForm = () => {
    setNewTransfer({
      product: '',
      fromLocation: '',
      toLocation: '',
      quantity: '',
      user: 'Administrador',
      status: 'Completada',
    })
  }

  const createLocation = (event) => {
    event.preventDefault()

    if (!newLocation.zone || !newLocation.aisle || !newLocation.rack || !newLocation.level || !newLocation.position || !newLocation.capacity) {
      alert('Debes completar zona, pasillo, rack, nivel, posicion y capacidad.')
      return
    }

    const createdLocation = {
      ...newLocation,
      code: buildLocationCode(newLocation),
      capacity: Number(newLocation.capacity || 0),
      used: Number(newLocation.used || 0),
    }

    setLocations((current) => [createdLocation, ...current])
    resetLocationForm()
    setShowLocationForm(false)
  }

  const createTransfer = (event) => {
    event.preventDefault()

    if (!newTransfer.product || !newTransfer.fromLocation || !newTransfer.toLocation || !newTransfer.quantity) {
      alert('Debes completar producto, ubicacion origen, ubicacion destino y cantidad.')
      return
    }

    if (newTransfer.fromLocation === newTransfer.toLocation) {
      alert('La ubicacion origen y destino no pueden ser iguales.')
      return
    }

    const createdTransfer = {
      ...newTransfer,
      date: new Date().toLocaleDateString('es-DO'),
      quantity: Number(newTransfer.quantity || 0),
    }

    setTransfers((current) => [createdTransfer, ...current])
    resetTransferForm()
    setShowTransferForm(false)
  }

  const getUsagePercent = (used, capacity) => {
    if (!capacity) return 0
    return Math.min(100, Math.round((Number(used || 0) / Number(capacity || 1)) * 100))
  }

  const filteredLocations = locations.filter((location) => {
    const search = searchTerm.toLowerCase()

    return (
      location.warehouse.toLowerCase().includes(search) ||
      location.code.toLowerCase().includes(search) ||
      location.zone.toLowerCase().includes(search) ||
      location.aisle.toLowerCase().includes(search) ||
      location.rack.toLowerCase().includes(search) ||
      location.level.toLowerCase().includes(search) ||
      location.position.toLowerCase().includes(search) ||
      location.status.toLowerCase().includes(search)
    )
  })

  const totalCapacity = locations.reduce((sum, location) => sum + Number(location.capacity || 0), 0)
  const totalUsed = locations.reduce((sum, location) => sum + Number(location.used || 0), 0)
  const availableSpace = totalCapacity - totalUsed
  const averageUsage = getUsagePercent(totalUsed, totalCapacity)

  return (
    <section className="card inventory-locations-card">
      <div className="inventory-advanced-header">
        <div>
          <span>Inventario avanzado</span>
          <h3>Gestion Multialmacen y Multiubicacion</h3>
          <p>Administra almacenes, zonas, pasillos, racks, niveles, posiciones exactas, capacidad y transferencias internas.</p>
        </div>

        <div className="locations-header-actions">
          <button className="secondary-button" onClick={() => setShowTransferForm(true)}>
            Transferencia
          </button>

          <button className="primary-button small" onClick={() => setShowLocationForm(true)}>
            Nueva ubicacion
          </button>
        </div>
      </div>

      <div className="locations-kpi-grid">
        <article>
          <span>Almacenes</span>
          <strong>{warehouses.length}</strong>
          <p>Registrados</p>
        </article>

        <article>
          <span>Ubicaciones</span>
          <strong>{locations.length}</strong>
          <p>Posiciones internas</p>
        </article>

        <article>
          <span>Uso promedio</span>
          <strong>{averageUsage}%</strong>
          <p>Capacidad utilizada</p>
        </article>

        <article>
          <span>Espacio libre</span>
          <strong>{availableSpace}</strong>
          <p>Unidades disponibles</p>
        </article>
      </div>

      <div className="warehouse-overview-grid">
        {warehouses.map((warehouse) => {
              <p>{warehouse.used} de {warehouse.capacity} ocupados - {percent}%</p>

          return (
            <article key={warehouse.code} className="warehouse-overview-card">
              <div>
                <strong>{warehouse.name}</strong>
                <span>{warehouse.code} - {warehouse.location}</span>
              </div>

              <em className={warehouse.status === 'Activo' ? 'status-ok' : 'status-low'}>
                {warehouse.status}
              </em>

              <div className="warehouse-progress">
                <div style={{ width: `${percent}%` }} />
              </div>

              <p>{warehouse.used} de {warehouse.capacity} ocupados - {percent}%</p>
            </article>
          )
        })}
      </div>

      <div className="locations-toolbar">
        <div className="product-search-box">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por almacen, ubicacion, zona, pasillo, rack, nivel o estado..."
          />
        </div>
      </div>

      {showLocationForm && (
        <form className="location-form-card" onSubmit={createLocation}>
          <div className="product-form-header">
            <div>
              <h4>Nueva ubicacion</h4>
              <p>Crea una posicion exacta dentro de un almacen.</p>
            </div>

            <button type="button" className="close-form-button" onClick={() => setShowLocationForm(false)}>
              Cerrar
            </button>
          </div>

          <div className="location-form-grid">
            <label>
              Almacen
              <select
                value={newLocation.warehouse}
                onChange={(event) => updateLocationField('warehouse', event.target.value)}
              >
                {warehouses.map((warehouse) => (
                  <option key={warehouse.code}>{warehouse.name}</option>
                ))}
              </select>
            </label>

            <label>
              Zona
              <input
                value={newLocation.zone}
                onChange={(event) => updateLocationField('zone', event.target.value)}
                placeholder="Zona A"
              />
            </label>

            <label>
              Pasillo
              <input
                value={newLocation.aisle}
                onChange={(event) => updateLocationField('aisle', event.target.value)}
                placeholder="01"
              />
            </label>

            <label>
              Rack
              <input
                value={newLocation.rack}
                onChange={(event) => updateLocationField('rack', event.target.value)}
                placeholder="R01"
              />
            </label>

            <label>
              Nivel
              <input
                value={newLocation.level}
                onChange={(event) => updateLocationField('level', event.target.value)}
                placeholder="N01"
              />
            </label>

            <label>
              Posicion
              <input
                value={newLocation.position}
                onChange={(event) => updateLocationField('position', event.target.value)}
                placeholder="P01"
              />
            </label>

            <label>
              Capacidad
              <input
                type="number"
                value={newLocation.capacity}
                onChange={(event) => updateLocationField('capacity', event.target.value)}
                placeholder="0"
              />
            </label>

            <label>
              Ocupado
              <input
                type="number"
                value={newLocation.used}
                onChange={(event) => updateLocationField('used', event.target.value)}
                placeholder="0"
              />
            </label>

            <label>
              Estado
              <select
                value={newLocation.status}
                onChange={(event) => updateLocationField('status', event.target.value)}
              >
                <option>Disponible</option>
                <option>Alta ocupacion</option>
                <option>Bloqueado</option>
                <option>Restringido</option>
              </select>
            </label>
          </div>

          <div className="product-form-actions">
            <button type="button" className="secondary-button" onClick={resetLocationForm}>
              Limpiar
            </button>

            <button type="submit" className="primary-button small">
              Guardar ubicacion
            </button>
          </div>
        </form>
      )}

      {showTransferForm && (
        <form className="location-form-card" onSubmit={createTransfer}>
          <div className="product-form-header">
            <div>
              <h4>Transferencia entre ubicaciones</h4>
              <p>Registra un movimiento interno entre posiciones del almacen.</p>
            </div>

            <button type="button" className="close-form-button" onClick={() => setShowTransferForm(false)}>
              Cerrar
            </button>
          </div>

          <div className="location-form-grid">
            <label className="location-wide-field">
              Producto
              <input
                value={newTransfer.product}
                onChange={(event) => updateTransferField('product', event.target.value)}
                placeholder="Nombre del producto"
              />
            </label>

            <label>
              Desde ubicacion
              <select
                value={newTransfer.fromLocation}
                onChange={(event) => updateTransferField('fromLocation', event.target.value)}
              >
                <option value="">Seleccionar</option>
                {locations.map((location) => (
                  <option key={`from-${location.code}`} value={location.code}>{location.code}</option>
                ))}
              </select>
            </label>

            <label>
              Hacia ubicacion
              <select
                value={newTransfer.toLocation}
                onChange={(event) => updateTransferField('toLocation', event.target.value)}
              >
                <option value="">Seleccionar</option>
                {locations.map((location) => (
                  <option key={`to-${location.code}`} value={location.code}>{location.code}</option>
                ))}
              </select>
            </label>

            <label>
              Cantidad
              <input
                type="number"
                value={newTransfer.quantity}
                onChange={(event) => updateTransferField('quantity', event.target.value)}
                placeholder="0"
              />
            </label>
          </div>

          <div className="product-form-actions">
            <button type="button" className="secondary-button" onClick={resetTransferForm}>
              Limpiar
            </button>

            <button type="submit" className="primary-button small">
              Registrar transferencia
            </button>
          </div>
        </form>
      )}

      <div className="locations-table">
        <div className="locations-table-head">
          <span>Almacen</span>
          <span>Ubicacion</span>
          <span>Zona</span>
          <span>Pasillo</span>
          <span>Rack</span>
          <span>Nivel</span>
          <span>Posicion</span>
          <span>Capacidad</span>
          <span>Ocupado</span>
          <span>Uso</span>
          <span>Estado</span>
        </div>

        {filteredLocations.map((location) => {
          const percent = getUsagePercent(location.used, location.capacity)

          return (
            <div key={`${location.warehouse}-${location.code}`} className="locations-table-row">
              <strong>{location.warehouse}</strong>
              <span>{location.code}</span>
              <span>{location.zone}</span>
              <span>{location.aisle}</span>
              <span>{location.rack}</span>
              <span>{location.level}</span>
              <span>{location.position}</span>
              <b>{location.capacity}</b>
              <b>{location.used}</b>
              <span>{percent}%</span>
              <em className={location.status === 'Disponible' ? 'status-ok' : location.status === 'Alta ocupacion' ? 'status-neutral' : 'status-low'}>
                {location.status}
              </em>
            </div>
          )
        })}

        {filteredLocations.length === 0 && (
          <div className="empty-products">
            No hay ubicaciones para mostrar.
          </div>
        )}
      </div>

      <div className="transfers-mini-panel">
        <div className="card-header">
          <h3>Ultimas transferencias internas</h3>
          <button onClick={() => setShowTransferForm(true)}>Nueva</button>
        </div>

        <div className="transfer-list">
  {transfers.map((transfer, index) => (
    <article key={index}>
      <div>
        <strong>{transfer.product}</strong>
        <span>Transferencia interna</span>
      </div>

      <b>{transfer.quantity}</b>
      <em className="status-ok">{transfer.status}</em>
    </article>
  ))}
</div>
      </div>
    </section>
  )
}

function InventoryVariantsKits() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showVariantForm, setShowVariantForm] = useState(false)
  const [showKitForm, setShowKitForm] = useState(false)

  const [variants, setVariants] = useState([
    {
      parentCode: 'PRO-010',
      parentName: 'Camisa Escolar',
      sku: 'CAM-ESC-BLA-S',
      variantName: 'Camisa Escolar Blanca S',
      color: 'Blanco',
      size: 'S',
      presentation: 'Unidad',
      barcode: '7460010100012',
      stock: 45,
      cost: 180,
      price: 350,
      status: 'Activo',
    },
    {
      parentCode: 'PRO-010',
      parentName: 'Camisa Escolar',
      sku: 'CAM-ESC-BLA-M',
      variantName: 'Camisa Escolar Blanca M',
      color: 'Blanco',
      size: 'M',
      presentation: 'Unidad',
      barcode: '7460010100029',
      stock: 32,
      cost: 180,
      price: 350,
      status: 'Activo',
    },
    {
      parentCode: 'PRO-020',
      parentName: 'Caja de Lapices',
      sku: 'LAP-CAJ-12',
      variantName: 'Caja de Lapices 12 unidades',
      color: 'Mixto',
      size: 'N/A',
      presentation: 'Caja x12',
      barcode: '7460010200124',
      stock: 80,
      cost: 95,
      price: 180,
      status: 'Activo',
    },
  ])

  const [kits, setKits] = useState([
    {
      code: 'KIT-ESC-001',
      name: 'Kit Escolar Basico',
      price: 950,
      status: 'Activo',
      components: [
        { code: 'LAP-CAJ-12', name: 'Caja de Lapices 12 unidades', qty: 1, stock: 80, cost: 95 },
        { code: 'CUA-100', name: 'Cuaderno 100 paginas', qty: 5, stock: 120, cost: 35 },
        { code: 'BOR-001', name: 'Borrador Blanco', qty: 2, stock: 200, cost: 8 },
      ],
    },
    {
      code: 'KIT-OFI-001',
      name: 'Kit Oficina Inicial',
      price: 1450,
      status: 'Activo',
      components: [
        { code: 'BOL-AZUL', name: 'Boligrafo Azul', qty: 12, stock: 300, cost: 10 },
        { code: 'NOT-ADH', name: 'Notas Adhesivas', qty: 3, stock: 40, cost: 45 },
        { code: 'CAR-001', name: 'Carpeta Manila', qty: 10, stock: 90, cost: 12 },
      ],
    },
  ])

  const [newVariant, setNewVariant] = useState({
    parentCode: '',
    parentName: '',
    variantName: '',
    color: '',
    size: '',
    presentation: '',
    barcode: '',
    stock: '',
    cost: '',
    price: '',
    status: 'Activo',
  })

  const [newKit, setNewKit] = useState({
    code: '',
    name: '',
    price: '',
    status: 'Activo',
  })

  const [kitComponents, setKitComponents] = useState([
    { code: '', name: '', qty: '', stock: '', cost: '' },
  ])

  const updateVariantField = (field, value) => {
    setNewVariant((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const updateKitField = (field, value) => {
    setNewKit((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const updateKitComponent = (index, field, value) => {
    setKitComponents((current) =>
      current.map((component, componentIndex) =>
        componentIndex === index
          ? { ...component, [field]: value }
          : component
      )
    )
  }

  const addKitComponent = () => {
    setKitComponents((current) => [
      ...current,
      { code: '', name: '', qty: '', stock: '', cost: '' },
    ])
  }

  const removeKitComponent = (index) => {
    setKitComponents((current) => current.filter((_, componentIndex) => componentIndex !== index))
  }

  const createVariantSku = (variant) => {
    const base = variant.parentCode || 'PRO'
    const color = (variant.color || 'GEN').slice(0, 3).toUpperCase()
    const size = (variant.size || 'STD').slice(0, 3).toUpperCase()
    const presentation = (variant.presentation || 'UND').replace(/\s/g, '').slice(0, 3).toUpperCase()

    return `${base}-${color}-${size}-${presentation}`
  }

  const resetVariantForm = () => {
    setNewVariant({
      parentCode: '',
      parentName: '',
      variantName: '',
      color: '',
      size: '',
      presentation: '',
      barcode: '',
      stock: '',
      cost: '',
      price: '',
      status: 'Activo',
    })
  }

  const resetKitForm = () => {
    setNewKit({
      code: '',
      name: '',
      price: '',
      status: 'Activo',
    })

    setKitComponents([
      { code: '', name: '', qty: '', stock: '', cost: '' },
    ])
  }

  const createVariant = (event) => {
    event.preventDefault()

    if (!newVariant.parentCode || !newVariant.parentName || !newVariant.variantName) {
      alert('Debes completar codigo padre, producto padre y nombre de variante.')
      return
    }

    const createdVariant = {
      ...newVariant,
      sku: createVariantSku(newVariant),
      stock: Number(newVariant.stock || 0),
      cost: Number(newVariant.cost || 0),
      price: Number(newVariant.price || 0),
    }

    setVariants((current) => [createdVariant, ...current])
    resetVariantForm()
    setShowVariantForm(false)
  }

  const getKitAvailability = (components) => {
    if (!components.length) return 0

    const availability = components.map((component) => {
      const qty = Number(component.qty || 0)
      const stock = Number(component.stock || 0)

      if (!qty) return 0

      return Math.floor(stock / qty)
    })

    return Math.min(...availability)
  }

  const getKitCost = (components) => {
    return components.reduce((sum, component) => {
      return sum + Number(component.qty || 0) * Number(component.cost || 0)
    }, 0)
  }

  const createKit = (event) => {
    event.preventDefault()

    if (!newKit.code || !newKit.name) {
      alert('Debes completar codigo y nombre del kit.')
      return
    }

    const validComponents = kitComponents.filter((component) => component.code && component.name && component.qty)

    if (!validComponents.length) {
      alert('Debes agregar al menos un componente valido.')
      return
    }

    const createdKit = {
      ...newKit,
      price: Number(newKit.price || 0),
      components: validComponents.map((component) => ({
        ...component,
        qty: Number(component.qty || 0),
        stock: Number(component.stock || 0),
        cost: Number(component.cost || 0),
      })),
    }

    setKits((current) => [createdKit, ...current])
    resetKitForm()
    setShowKitForm(false)
  }

  const filteredVariants = variants.filter((variant) => {
    const search = searchTerm.toLowerCase()

    return (
      variant.parentCode.toLowerCase().includes(search) ||
      variant.parentName.toLowerCase().includes(search) ||
      variant.sku.toLowerCase().includes(search) ||
      variant.variantName.toLowerCase().includes(search) ||
      variant.color.toLowerCase().includes(search) ||
      variant.size.toLowerCase().includes(search) ||
      variant.presentation.toLowerCase().includes(search) ||
      variant.barcode.toLowerCase().includes(search) ||
      variant.status.toLowerCase().includes(search)
    )
  })

  const filteredKits = kits.filter((kit) => {
    const search = searchTerm.toLowerCase()

    return (
      kit.code.toLowerCase().includes(search) ||
      kit.name.toLowerCase().includes(search) ||
      kit.status.toLowerCase().includes(search) ||
      kit.components.some((component) =>
        component.code.toLowerCase().includes(search) ||
        component.name.toLowerCase().includes(search)
      )
    )
  })

  const totalVariants = variants.length
  const activeVariants = variants.filter((variant) => variant.status === 'Activo').length
  const totalKits = kits.length
  const lowAvailabilityKits = kits.filter((kit) => getKitAvailability(kit.components) <= 5).length

  return (
    <section className="card inventory-variants-card">
      <div className="inventory-advanced-header">
        <div>
          <span>Inventario avanzado</span>
          <h3>Variantes de Producto y Kits BOM</h3>
          <p>Gestiona variantes por talla, color, presentacion y kits compuestos con disponibilidad calculada por componentes.</p>
        </div>

        <div className="variants-header-actions">
          <button className="secondary-button" onClick={() => setShowKitForm(true)}>
            Nuevo kit BOM
          </button>

          <button className="primary-button small" onClick={() => setShowVariantForm(true)}>
            Nueva variante
          </button>
        </div>
      </div>

      <div className="variants-kpi-grid">
        <article>
          <span>Variantes</span>
          <strong>{totalVariants}</strong>
          <p>SKU derivados</p>
        </article>

        <article>
          <span>Activas</span>
          <strong>{activeVariants}</strong>
          <p>Disponibles para venta</p>
        </article>

        <article>
          <span>Kits BOM</span>
          <strong>{totalKits}</strong>
          <p>Productos compuestos</p>
        </article>

        <article>
          <span>Kits bajos</span>
          <strong>{lowAvailabilityKits}</strong>
          <p>Necesitan componentes</p>
        </article>
      </div>

      <div className="variants-toolbar">
        <div className="product-search-box">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por SKU, producto, color, talla, kit o componente..."
          />
        </div>
      </div>

      {showVariantForm && (
        <form className="variant-form-card" onSubmit={createVariant}>
          <div className="product-form-header">
            <div>
              <h4>Nueva variante</h4>
              <p>Crea un SKU derivado por color, talla o presentacion.</p>
            </div>

            <button type="button" className="close-form-button" onClick={() => setShowVariantForm(false)}>
              Cerrar
            </button>
          </div>

          <div className="variant-form-grid">
            <label>
              Codigo padre
              <input
                value={newVariant.parentCode}
                onChange={(event) => updateVariantField('parentCode', event.target.value)}
                placeholder="PRO-000"
              />
            </label>

            <label className="variant-wide-field">
              Producto padre
              <input
                value={newVariant.parentName}
                onChange={(event) => updateVariantField('parentName', event.target.value)}
                placeholder="Nombre del producto principal"
              />
            </label>

            <label className="variant-wide-field">
              Nombre variante
              <input
                value={newVariant.variantName}
                onChange={(event) => updateVariantField('variantName', event.target.value)}
                placeholder="Producto + color + talla"
              />
            </label>

            <label>
              Color
              <input
                value={newVariant.color}
                onChange={(event) => updateVariantField('color', event.target.value)}
                placeholder="Blanco"
              />
            </label>

            <label>
              Talla
              <input
                value={newVariant.size}
                onChange={(event) => updateVariantField('size', event.target.value)}
                placeholder="M"
              />
            </label>

            <label>
              Presentacion
              <input
                value={newVariant.presentation}
                onChange={(event) => updateVariantField('presentation', event.target.value)}
                placeholder="Unidad / Caja"
              />
            </label>

            <label>
              Codigo de barra
              <input
                value={newVariant.barcode}
                onChange={(event) => updateVariantField('barcode', event.target.value)}
                placeholder="746..."
              />
            </label>

            <label>
              Stock
              <input
                type="number"
                value={newVariant.stock}
                onChange={(event) => updateVariantField('stock', event.target.value)}
                placeholder="0"
              />
            </label>

            <label>
              Costo
              <input
                type="number"
                value={newVariant.cost}
                onChange={(event) => updateVariantField('cost', event.target.value)}
                placeholder="0.00"
              />
            </label>

            <label>
              Precio
              <input
                type="number"
                value={newVariant.price}
                onChange={(event) => updateVariantField('price', event.target.value)}
                placeholder="0.00"
              />
            </label>

            <label>
              Estado
              <select
                value={newVariant.status}
                onChange={(event) => updateVariantField('status', event.target.value)}
              >
                <option>Activo</option>
                <option>Inactivo</option>
                <option>Bloqueado</option>
              </select>
            </label>
          </div>

          <div className="product-form-actions">
            <button type="button" className="secondary-button" onClick={resetVariantForm}>
              Limpiar
            </button>

            <button type="submit" className="primary-button small">
              Guardar variante
            </button>
          </div>
        </form>
      )}

      {showKitForm && (
        <form className="variant-form-card" onSubmit={createKit}>
          <div className="product-form-header">
            <div>
              <h4>Nuevo kit BOM</h4>
              <p>Crea un producto compuesto y define los componentes necesarios.</p>
            </div>

            <button type="button" className="close-form-button" onClick={() => setShowKitForm(false)}>
              Cerrar
            </button>
          </div>

          <div className="variant-form-grid">
            <label>
              Codigo kit
              <input
                value={newKit.code}
                onChange={(event) => updateKitField('code', event.target.value)}
                placeholder="KIT-000"
              />
            </label>

            <label className="variant-wide-field">
              Nombre kit
              <input
                value={newKit.name}
                onChange={(event) => updateKitField('name', event.target.value)}
                placeholder="Nombre del kit"
              />
            </label>

            <label>
              Precio venta
              <input
                type="number"
                value={newKit.price}
                onChange={(event) => updateKitField('price', event.target.value)}
                placeholder="0.00"
              />
            </label>

            <label>
              Estado
              <select
                value={newKit.status}
                onChange={(event) => updateKitField('status', event.target.value)}
              >
                <option>Activo</option>
                <option>Inactivo</option>
                <option>Bloqueado</option>
              </select>
            </label>
          </div>

          <div className="bom-editor">
            <div className="bom-editor-header">
              <strong>Componentes BOM</strong>
              <button type="button" onClick={addKitComponent}>Agregar componente</button>
            </div>

            {kitComponents.map((component, index) => (
              <div key={`component-${index}`} className="bom-component-row">
                <input
                  value={component.code}
                  onChange={(event) => updateKitComponent(index, 'code', event.target.value)}
                  placeholder="Codigo"
                />
                <input
                  value={component.name}
                  onChange={(event) => updateKitComponent(index, 'name', event.target.value)}
                  placeholder="Componente"
                />
                <input
                  type="number"
                  value={component.qty}
                  onChange={(event) => updateKitComponent(index, 'qty', event.target.value)}
                  placeholder="Cant."
                />
                <input
                  type="number"
                  value={component.stock}
                  onChange={(event) => updateKitComponent(index, 'stock', event.target.value)}
                  placeholder="Stock"
                />
                <input
                  type="number"
                  value={component.cost}
                  onChange={(event) => updateKitComponent(index, 'cost', event.target.value)}
                  placeholder="Costo"
                />

                <button type="button" onClick={() => removeKitComponent(index)}>
                  Quitar
                </button>
              </div>
            ))}
          </div>

          <div className="product-form-actions">
            <button type="button" className="secondary-button" onClick={resetKitForm}>
              Limpiar
            </button>

            <button type="submit" className="primary-button small">
              Guardar kit
            </button>
          </div>
        </form>
      )}

      <div className="variants-layout">
        <div className="variants-section">
          <div className="card-header">
            <h3>Variantes de producto</h3>
            <button onClick={() => setShowVariantForm(true)}>Nueva</button>
          </div>

          <div className="variants-table">
            <div className="variants-table-head">
              <span>SKU</span>
              <span>Variante</span>
              <span>Color</span>
              <span>Talla</span>
              <span>Presentacion</span>
              <span>Stock</span>
              <span>Costo</span>
              <span>Precio</span>
              <span>Estado</span>
            </div>

            {filteredVariants.map((variant) => (
              <div key={`${variant.sku}-${variant.barcode}`} className="variants-table-row">
                <div>
                  <strong>{variant.sku}</strong>
                  <small>{variant.parentName}</small>
                </div>
                <span>{variant.variantName}</span>
                <span>{variant.color || 'N/A'}</span>
                <span>{variant.size || 'N/A'}</span>
                <span>{variant.presentation || 'N/A'}</span>
                <b>{variant.stock}</b>
                <span>RD$ {Number(variant.cost || 0).toLocaleString('es-DO')}</span>
                <span>RD$ {Number(variant.price || 0).toLocaleString('es-DO')}</span>
                <em className={variant.status === 'Activo' ? 'status-ok' : 'status-low'}>
                  {variant.status}
                </em>
              </div>
            ))}

            {filteredVariants.length === 0 && (
              <div className="empty-products">
                No hay variantes para mostrar.
              </div>
            )}
          </div>
        </div>

        <div className="kits-section">
          <div className="card-header">
            <h3>Kits BOM</h3>
            <button onClick={() => setShowKitForm(true)}>Nuevo</button>
          </div>

          <div className="kits-list">
            {filteredKits.map((kit) => {
              const availability = getKitAvailability(kit.components)
              const kitCost = getKitCost(kit.components)
              const margin = Number(kit.price || 0) - kitCost

              return (
                <article key={kit.code} className="kit-card">
                  <div className="kit-card-header">
                    <div>
                      <strong>{kit.name}</strong>
                      <span>{kit.code}</span>
                    </div>

                    <em className={availability > 5 ? 'status-ok' : 'status-low'}>
                      Disponible: {availability}
                    </em>
                  </div>

                  <div className="kit-cost-grid">
                    <div>
                      <span>Costo</span>
                      <strong>RD$ {kitCost.toLocaleString('es-DO')}</strong>
                    </div>
                    <div>
                      <span>Precio</span>
                      <strong>RD$ {Number(kit.price || 0).toLocaleString('es-DO')}</strong>
                    </div>
                    <div>
                      <span>Margen</span>
                      <strong>RD$ {margin.toLocaleString('es-DO')}</strong>
                    </div>
                  </div>

                  <div className="kit-components-list">
                    {kit.components.map((component) => (
                      <div key={`${kit.code}-${component.code}`}>
                        <span>{component.name}</span>
                        <b>{component.qty} und.</b>
                      </div>
                    ))}
                  </div>
                </article>
              )
            })}

            {filteredKits.length === 0 && (
              <div className="empty-products">
                No hay kits para mostrar.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function InventoryCodesRFID() {
  const [searchTerm, setSearchTerm] = useState('')
  const [scanValue, setScanValue] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [codes, setCodes] = useState([
    {
      type: 'Barra',
      code: '7460010100012',
      itemType: 'Producto',
      itemCode: 'CAM-ESC-BLA-S',
      itemName: 'Camisa Escolar Blanca S',
      lot: 'LOT-2026-010',
      location: 'A-01-R01-N01',
      rfid: '',
      status: 'Activo',
    },
    {
      type: 'QR',
      code: 'QR-KIT-ESC-001',
      itemType: 'Kit',
      itemCode: 'KIT-ESC-001',
      itemName: 'Kit Escolar Basico',
      lot: 'N/A',
      location: 'B-02-R03-N01',
      rfid: '',
      status: 'Activo',
    },
    {
      type: 'RFID',
      code: 'RFID-WH-A0101',
      itemType: 'Ubicacion',
      itemCode: 'A-01-R01-N01',
      itemName: 'Ubicacion A-01-R01-N01',
      lot: 'N/A',
      location: 'A-01-R01-N01',
      rfid: 'E2003412012345678901',
      status: 'Preparado',
    },
  ])

  const [newCode, setNewCode] = useState({
    type: 'Barra',
    code: '',
    itemType: 'Producto',
    itemCode: '',
    itemName: '',
    lot: '',
    location: '',
    rfid: '',
    status: 'Activo',
  })

  const updateCodeField = (field, value) => {
    setNewCode((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const resetCodeForm = () => {
    setNewCode({
      type: 'Barra',
      code: '',
      itemType: 'Producto',
      itemCode: '',
      itemName: '',
      lot: '',
      location: '',
      rfid: '',
      status: 'Activo',
    })
  }

  const generateCodeValue = () => {
    const prefix = newCode.type === 'QR' ? 'QR' : newCode.type === 'RFID' ? 'RFID' : 'BAR'
    const item = newCode.itemCode || 'ITEM'
    const random = Date.now().toString().slice(-6)

    updateCodeField('code', `${prefix}-${item}-${random}`)
  }

  const createCode = (event) => {
    event.preventDefault()

    if (!newCode.type || !newCode.code || !newCode.itemCode || !newCode.itemName) {
      alert('Debes completar tipo, codigo, codigo del item y nombre.')
      return
    }

    setCodes((current) => [newCode, ...current])
    resetCodeForm()
    setShowForm(false)
  }

  const handleScan = (event) => {
    event.preventDefault()

    const cleanScan = scanValue.trim().toLowerCase()

    if (!cleanScan) return

    const found = codes.find((item) =>
      item.code.toLowerCase() === cleanScan ||
      item.itemCode.toLowerCase() === cleanScan ||
      item.rfid.toLowerCase() === cleanScan
    )

    if (found) {
      setSearchTerm(found.code)
      alert(`Codigo encontrado: ${found.itemName}`)
    } else {
      alert('Codigo no encontrado.')
    }

    setScanValue('')
  }

  const filteredCodes = codes.filter((item) => {
    const search = searchTerm.toLowerCase()

    return (
      item.type.toLowerCase().includes(search) ||
      item.code.toLowerCase().includes(search) ||
      item.itemType.toLowerCase().includes(search) ||
      item.itemCode.toLowerCase().includes(search) ||
      item.itemName.toLowerCase().includes(search) ||
      item.lot.toLowerCase().includes(search) ||
      item.location.toLowerCase().includes(search) ||
      item.rfid.toLowerCase().includes(search) ||
      item.status.toLowerCase().includes(search)
    )
  })

  const printLabels = () => {
    window.print()
  }

  const getCodeBars = (value) => {
    const text = value || '000000000000'

    return text
      .split('')
      .slice(0, 18)
      .map((char, index) => {
        const width = ((char.charCodeAt(0) + index) % 4) + 1
        return width
      })
  }

  const getQrCells = (value) => {
    const text = value || 'QR'
    const seed = text.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)

    return Array.from({ length: 49 }, (_, index) => {
      return (seed + index * 7 + index) % 3 !== 0
    })
  }

  const totalCodes = codes.length
  const barcodeCount = codes.filter((item) => item.type === 'Barra').length
  const qrCount = codes.filter((item) => item.type === 'QR').length
  const rfidCount = codes.filter((item) => item.type === 'RFID').length

  return (
    <section className="card inventory-codes-card">
      <div className="inventory-advanced-header">
        <div>
          <span>Inventario avanzado</span>
          <h3>Codigos de Barra, QR y RFID</h3>
          <p>Registra, genera, escanea e imprime etiquetas para productos, lotes, ubicaciones y kits.</p>
        </div>

        <div className="codes-header-actions">
          <button className="secondary-button" onClick={printLabels}>
            Imprimir etiquetas
          </button>

          <button className="primary-button small" onClick={() => setShowForm(true)}>
            Nuevo codigo
          </button>
        </div>
      </div>

      <div className="codes-kpi-grid">
        <article>
          <span>Total codigos</span>
          <strong>{totalCodes}</strong>
          <p>Etiquetas registradas</p>
        </article>

        <article>
          <span>Codigo de barra</span>
          <strong>{barcodeCount}</strong>
          <p>Productos escaneables</p>
        </article>

        <article>
          <span>QR</span>
          <strong>{qrCount}</strong>
          <p>Etiquetas digitales</p>
        </article>

        <article>
          <span>RFID</span>
          <strong>{rfidCount}</strong>
          <p>Preparados para lectura</p>
        </article>
      </div>

      <form className="scan-panel" onSubmit={handleScan}>
        <div>
          <strong>Escanear codigo</strong>
          <span>Lee codigo de barra, QR, RFID o escribe manualmente el codigo.</span>
        </div>

        <input
          value={scanValue}
          onChange={(event) => setScanValue(event.target.value)}
          placeholder="Escanea o escribe el codigo..."
          autoFocus
        />

        <button type="submit" className="primary-button small">
          Buscar
        </button>
      </form>

      <div className="codes-toolbar">
        <div className="product-search-box">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por codigo, producto, lote, ubicacion, RFID o estado..."
          />
        </div>
      </div>

      {showForm && (
        <form className="code-form-card" onSubmit={createCode}>
          <div className="product-form-header">
            <div>
              <h4>Nuevo codigo / etiqueta</h4>
              <p>Asocia un codigo a producto, lote, ubicacion o kit.</p>
            </div>

            <button type="button" className="close-form-button" onClick={() => setShowForm(false)}>
              Cerrar
            </button>
          </div>

          <div className="code-form-grid">
            <label>
              Tipo
              <select
                value={newCode.type}
                onChange={(event) => updateCodeField('type', event.target.value)}
              >
                <option>Barra</option>
                <option>QR</option>
                <option>RFID</option>
              </select>
            </label>

            <label className="code-wide-field">
              Codigo
              <div className="code-generate-field">
                <input
                  value={newCode.code}
                  onChange={(event) => updateCodeField('code', event.target.value)}
                  placeholder="Codigo o identificador"
                />

                <button type="button" onClick={generateCodeValue}>
                  Generar
                </button>
              </div>
            </label>

            <label>
              Asociado a
              <select
                value={newCode.itemType}
                onChange={(event) => updateCodeField('itemType', event.target.value)}
              >
                <option>Producto</option>
                <option>Lote</option>
                <option>Ubicacion</option>
                <option>Kit</option>
              </select>
            </label>

            <label>
              Codigo item
              <input
                value={newCode.itemCode}
                onChange={(event) => updateCodeField('itemCode', event.target.value)}
                placeholder="PRO-000 / LOT-000"
              />
            </label>

            <label className="code-wide-field">
              Nombre
              <input
                value={newCode.itemName}
                onChange={(event) => updateCodeField('itemName', event.target.value)}
                placeholder="Nombre del producto, lote, ubicacion o kit"
              />
            </label>

            <label>
              Lote
              <input
                value={newCode.lot}
                onChange={(event) => updateCodeField('lot', event.target.value)}
                placeholder="Opcional"
              />
            </label>

            <label>
              Ubicacion
              <input
                value={newCode.location}
                onChange={(event) => updateCodeField('location', event.target.value)}
                placeholder="A-01-R01-N01"
              />
            </label>

            <label className="code-wide-field">
              RFID tag
              <input
                value={newCode.rfid}
                onChange={(event) => updateCodeField('rfid', event.target.value)}
                placeholder="E200..."
              />
            </label>

            <label>
              Estado
              <select
                value={newCode.status}
                onChange={(event) => updateCodeField('status', event.target.value)}
              >
                <option>Activo</option>
                <option>Preparado</option>
                <option>Inactivo</option>
                <option>Bloqueado</option>
              </select>
            </label>
          </div>

          <div className="product-form-actions">
            <button type="button" className="secondary-button" onClick={resetCodeForm}>
              Limpiar
            </button>

            <button type="submit" className="primary-button small">
              Guardar codigo
            </button>
          </div>
        </form>
      )}

      <div className="label-preview-grid">
        {filteredCodes.map((item) => (
          <article key={`${item.type}-${item.code}-${item.itemCode}`} className="label-card">
            <div className="label-card-top">
              <div>
                <strong>{item.itemName}</strong>
                <span>{item.itemType} - {item.itemCode}</span>
              </div>

              <em className={item.status === 'Activo' ? 'status-ok' : item.status === 'Preparado' ? 'status-neutral' : 'status-low'}>
                {item.status}
              </em>
            </div>

            {item.type === 'Barra' && (
              <div className="barcode-preview">
                {getCodeBars(item.code).map((width, index) => (
                  <i key={`${item.code}-${index}`} style={{ width: `${width}px` }} />
                ))}
              </div>
            )}

            {item.type === 'QR' && (
              <div className="qr-preview">
                {getQrCells(item.code).map((active, index) => (
                  <i key={`${item.code}-${index}`} className={active ? 'active' : ''} />
                ))}
              </div>
            )}

            {item.type === 'RFID' && (
              <div className="rfid-preview">
                <b>RFID</b>
                <span>{item.rfid || item.code}</span>
              </div>
            )}

            <div className="label-code">{item.code}</div>

            <div className="label-meta">
              <span>Lote: {item.lot || 'N/A'}</span>
              <span>Ubicacion: {item.location || 'N/A'}</span>
            </div>
          </article>
        ))}

        {filteredCodes.length === 0 && (
          <div className="empty-products">
            No hay codigos para mostrar.
          </div>
        )}
      </div>
    </section>
  )
}

function InventoryPutawayStrategies() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [showInboundForm, setShowInboundForm] = useState(false)

  const [rules, setRules] = useState([
    {
      name: 'Alta rotacion cerca de despacho',
      productType: 'Alta rotacion',
      preferredWarehouse: 'Almacen Principal',
      preferredZone: 'Zona A',
      minFreePercent: 20,
      condition: 'Disponible',
      priority: 'Alta',
      status: 'Activa',
    },
    {
      name: 'Cuarentena para calidad',
      productType: 'Cuarentena',
      preferredWarehouse: 'Almacen Cuarentena',
      preferredZone: 'Cuarentena',
      minFreePercent: 10,
      condition: 'Restringido',
      priority: 'Critica',
      status: 'Activa',
    },
    {
      name: 'Baja rotacion zona secundaria',
      productType: 'Baja rotacion',
      preferredWarehouse: 'Almacen 2',
      preferredZone: 'Zona B',
      minFreePercent: 30,
      condition: 'Disponible',
      priority: 'Media',
      status: 'Activa',
    },
  ])

  const [locations] = useState([
    {
      code: 'A-01-R01-N01',
      warehouse: 'Almacen Principal',
      zone: 'Zona A',
      capacity: 120,
      used: 80,
      condition: 'Disponible',
      distance: 'Corta',
    },
    {
      code: 'A-01-R01-N02',
      warehouse: 'Almacen Principal',
      zone: 'Zona A',
      capacity: 120,
      used: 112,
      condition: 'Alta ocupacion',
      distance: 'Corta',
    },
    {
      code: 'B-02-R03-N01',
      warehouse: 'Almacen 2',
      zone: 'Zona B',
      capacity: 90,
      used: 35,
      condition: 'Disponible',
      distance: 'Media',
    },
    {
      code: 'QA-01-R01-N01',
      warehouse: 'Almacen Cuarentena',
      zone: 'Cuarentena',
      capacity: 60,
      used: 42,
      condition: 'Restringido',
      distance: 'Media',
    },
  ])

  const [inboundItems, setInboundItems] = useState([
    {
      code: 'ENT-001',
      product: 'Camisa Escolar Blanca M',
      productType: 'Alta rotacion',
      quantity: 25,
      status: 'Pendiente',
      quality: 'Aprobado',
    },
    {
      code: 'ENT-002',
      product: 'Monitor Samsung 24"',
      productType: 'Cuarentena',
      quantity: 8,
      status: 'Pendiente',
      quality: 'Revision',
    },
    {
      code: 'ENT-003',
      product: 'Carpeta Manila',
      productType: 'Baja rotacion',
      quantity: 40,
      status: 'Pendiente',
      quality: 'Aprobado',
    },
  ])

  const [newRule, setNewRule] = useState({
    name: '',
    productType: 'Alta rotacion',
    preferredWarehouse: 'Almacen Principal',
    preferredZone: '',
    minFreePercent: '',
    condition: 'Disponible',
    priority: 'Media',
    status: 'Activa',
  })

  const [newInbound, setNewInbound] = useState({
    code: '',
    product: '',
    productType: 'Alta rotacion',
    quantity: '',
    status: 'Pendiente',
    quality: 'Aprobado',
  })

  const updateRuleField = (field, value) => {
    setNewRule((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const updateInboundField = (field, value) => {
    setNewInbound((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const getFreePercent = (location) => {
    if (!location.capacity) return 0
    return Math.max(0, Math.round(((location.capacity - location.used) / location.capacity) * 100))
  }

  const getAvailableUnits = (location) => {
    return Math.max(0, Number(location.capacity || 0) - Number(location.used || 0))
  }

  const getSuggestionForItem = (item) => {
    const activeRules = rules.filter((rule) => rule.status === 'Activa')

    const matchedRule =
      activeRules.find((rule) => rule.productType === item.productType) ||
      activeRules.find((rule) => rule.productType === 'General')

    const candidateLocations = locations
      .filter((location) => {
        if (!matchedRule) return getAvailableUnits(location) >= Number(item.quantity || 0)

        const sameWarehouse = location.warehouse === matchedRule.preferredWarehouse
        const sameZone = !matchedRule.preferredZone || location.zone.toLowerCase() === matchedRule.preferredZone.toLowerCase()
        const enoughFree = getFreePercent(location) >= Number(matchedRule.minFreePercent || 0)
        const enoughUnits = getAvailableUnits(location) >= Number(item.quantity || 0)
        const conditionOk = matchedRule.condition === 'Cualquier estado' || location.condition === matchedRule.condition

        return sameWarehouse && sameZone && enoughFree && enoughUnits && conditionOk
      })
      .sort((a, b) => getFreePercent(b) - getFreePercent(a))

    const suggestedLocation = candidateLocations[0]

    if (!suggestedLocation) {
      return {
        item,
        rule: matchedRule ? matchedRule.name : 'Sin regla',
        location: 'Sin ubicacion disponible',
        warehouse: 'N/A',
        freePercent: 0,
        availableUnits: 0,
        decision: 'Revisar manualmente',
        priority: matchedRule ? matchedRule.priority : 'Media',
      }
    }

    return {
      item,
      rule: matchedRule ? matchedRule.name : 'Regla automatica',
      location: suggestedLocation.code,
      warehouse: suggestedLocation.warehouse,
      freePercent: getFreePercent(suggestedLocation),
      availableUnits: getAvailableUnits(suggestedLocation),
      decision: 'Ubicacion sugerida',
      priority: matchedRule ? matchedRule.priority : 'Media',
    }
  }

  const suggestions = inboundItems.map((item) => getSuggestionForItem(item))

  const resetRuleForm = () => {
    setNewRule({
      name: '',
      productType: 'Alta rotacion',
      preferredWarehouse: 'Almacen Principal',
      preferredZone: '',
      minFreePercent: '',
      condition: 'Disponible',
      priority: 'Media',
      status: 'Activa',
    })
  }

  const resetInboundForm = () => {
    setNewInbound({
      code: '',
      product: '',
      productType: 'Alta rotacion',
      quantity: '',
      status: 'Pendiente',
      quality: 'Aprobado',
    })
  }

  const createRule = (event) => {
    event.preventDefault()

    if (!newRule.name || !newRule.preferredWarehouse || !newRule.preferredZone) {
      alert('Debes completar nombre, almacen y zona preferida.')
      return
    }

    setRules((current) => [
      {
        ...newRule,
        minFreePercent: Number(newRule.minFreePercent || 0),
      },
      ...current,
    ])

    resetRuleForm()
    setShowRuleForm(false)
  }

  const createInboundItem = (event) => {
    event.preventDefault()

    if (!newInbound.code || !newInbound.product || !newInbound.quantity) {
      alert('Debes completar codigo, producto y cantidad.')
      return
    }

    setInboundItems((current) => [
      {
        ...newInbound,
        quantity: Number(newInbound.quantity || 0),
      },
      ...current,
    ])

    resetInboundForm()
    setShowInboundForm(false)
  }

  const filteredSuggestions = suggestions.filter((suggestion) => {
    const search = searchTerm.toLowerCase()

    return (
      suggestion.item.code.toLowerCase().includes(search) ||
      suggestion.item.product.toLowerCase().includes(search) ||
      suggestion.item.productType.toLowerCase().includes(search) ||
      suggestion.rule.toLowerCase().includes(search) ||
      suggestion.location.toLowerCase().includes(search) ||
      suggestion.warehouse.toLowerCase().includes(search) ||
      suggestion.decision.toLowerCase().includes(search)
    )
  })

  const activeRules = rules.filter((rule) => rule.status === 'Activa').length
  const pendingItems = inboundItems.filter((item) => item.status === 'Pendiente').length
  const automaticSuggestions = suggestions.filter((item) => item.decision === 'Ubicacion sugerida').length
  const manualReview = suggestions.filter((item) => item.decision !== 'Ubicacion sugerida').length

  return (
    <section className="card inventory-putaway-card">
      <div className="inventory-advanced-header">
        <div>
          <span>Inventario avanzado</span>
          <h3>Estrategias de Almacenamiento Putaway</h3>
          <p>Sugiere automaticamente donde guardar mercancia segun reglas de almacen, zona, capacidad, rotacion, calidad y estado.</p>
        </div>

        <div className="putaway-header-actions">
          <button className="secondary-button" onClick={() => setShowInboundForm(true)}>
            Nueva entrada
          </button>

          <button className="primary-button small" onClick={() => setShowRuleForm(true)}>
            Nueva regla
          </button>
        </div>
      </div>

      <div className="putaway-kpi-grid">
        <article>
          <span>Reglas activas</span>
          <strong>{activeRules}</strong>
          <p>Estrategias configuradas</p>
        </article>

        <article>
          <span>Pendientes</span>
          <strong>{pendingItems}</strong>
          <p>Productos por ubicar</p>
        </article>

        <article>
          <span>Sugeridas</span>
          <strong>{automaticSuggestions}</strong>
          <p>Ubicaciones automaticas</p>
        </article>

        <article>
          <span>Revision</span>
          <strong>{manualReview}</strong>
          <p>Requieren decision manual</p>
        </article>
      </div>

      <div className="putaway-toolbar">
        <div className="product-search-box">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por producto, regla, ubicacion, almacen o decision..."
          />
        </div>
      </div>

      {showRuleForm && (
        <form className="putaway-form-card" onSubmit={createRule}>
          <div className="product-form-header">
            <div>
              <h4>Nueva regla Putaway</h4>
              <p>Define donde debe guardarse la mercancia segun tipo, zona y capacidad disponible.</p>
            </div>

            <button type="button" className="close-form-button" onClick={() => setShowRuleForm(false)}>
              Cerrar
            </button>
          </div>

          <div className="putaway-form-grid">
            <label className="putaway-wide-field">
              Nombre regla
              <input
                value={newRule.name}
                onChange={(event) => updateRuleField('name', event.target.value)}
                placeholder="Ej: Alta rotacion cerca de despacho"
              />
            </label>

            <label>
              Tipo producto
              <select
                value={newRule.productType}
                onChange={(event) => updateRuleField('productType', event.target.value)}
              >
                <option>Alta rotacion</option>
                <option>Baja rotacion</option>
                <option>Cuarentena</option>
                <option>General</option>
              </select>
            </label>

            <label>
              Almacen preferido
              <select
                value={newRule.preferredWarehouse}
                onChange={(event) => updateRuleField('preferredWarehouse', event.target.value)}
              >
                <option>Almacen Principal</option>
                <option>Almacen 2</option>
                <option>Almacen 3</option>
                <option>Almacen Cuarentena</option>
              </select>
            </label>

            <label>
              Zona preferida
              <input
                value={newRule.preferredZone}
                onChange={(event) => updateRuleField('preferredZone', event.target.value)}
                placeholder="Zona A"
              />
            </label>

            <label>
              Minimo libre %
              <input
                type="number"
                value={newRule.minFreePercent}
                onChange={(event) => updateRuleField('minFreePercent', event.target.value)}
                placeholder="20"
              />
            </label>

            <label>
              Estado ubicacion
              <select
                value={newRule.condition}
                onChange={(event) => updateRuleField('condition', event.target.value)}
              >
                <option>Disponible</option>
                <option>Restringido</option>
                <option>Alta ocupacion</option>
                <option>Cualquier estado</option>
              </select>
            </label>

            <label>
              Prioridad
              <select
                value={newRule.priority}
                onChange={(event) => updateRuleField('priority', event.target.value)}
              >
                <option>Baja</option>
                <option>Media</option>
                <option>Alta</option>
                <option>Critica</option>
              </select>
            </label>

            <label>
              Estado
              <select
                value={newRule.status}
                onChange={(event) => updateRuleField('status', event.target.value)}
              >
                <option>Activa</option>
                <option>Inactiva</option>
              </select>
            </label>
          </div>

          <div className="product-form-actions">
            <button type="button" className="secondary-button" onClick={resetRuleForm}>
              Limpiar
            </button>

            <button type="submit" className="primary-button small">
              Guardar regla
            </button>
          </div>
        </form>
      )}

      {showInboundForm && (
        <form className="putaway-form-card" onSubmit={createInboundItem}>
          <div className="product-form-header">
            <div>
              <h4>Nueva mercancia pendiente</h4>
              <p>Registra un producto recibido para que el sistema sugiera ubicacion de almacenamiento.</p>
            </div>

            <button type="button" className="close-form-button" onClick={() => setShowInboundForm(false)}>
              Cerrar
            </button>
          </div>

          <div className="putaway-form-grid">
            <label>
              Codigo entrada
              <input
                value={newInbound.code}
                onChange={(event) => updateInboundField('code', event.target.value)}
                placeholder="ENT-000"
              />
            </label>

            <label className="putaway-wide-field">
              Producto
              <input
                value={newInbound.product}
                onChange={(event) => updateInboundField('product', event.target.value)}
                placeholder="Nombre del producto"
              />
            </label>

            <label>
              Tipo producto
              <select
                value={newInbound.productType}
                onChange={(event) => updateInboundField('productType', event.target.value)}
              >
                <option>Alta rotacion</option>
                <option>Baja rotacion</option>
                <option>Cuarentena</option>
                <option>General</option>
              </select>
            </label>

            <label>
              Cantidad
              <input
                type="number"
                value={newInbound.quantity}
                onChange={(event) => updateInboundField('quantity', event.target.value)}
                placeholder="0"
              />
            </label>

            <label>
              Calidad
              <select
                value={newInbound.quality}
                onChange={(event) => updateInboundField('quality', event.target.value)}
              >
                <option>Aprobado</option>
                <option>Revision</option>
                <option>Rechazado</option>
              </select>
            </label>

            <label>
              Estado
              <select
                value={newInbound.status}
                onChange={(event) => updateInboundField('status', event.target.value)}
              >
                <option>Pendiente</option>
                <option>Ubicado</option>
                <option>Bloqueado</option>
              </select>
            </label>
          </div>

          <div className="product-form-actions">
            <button type="button" className="secondary-button" onClick={resetInboundForm}>
              Limpiar
            </button>

            <button type="submit" className="primary-button small">
              Guardar entrada
            </button>
          </div>
        </form>
      )}

      <div className="putaway-layout">
        <div className="putaway-suggestions">
          <div className="card-header">
            <h3>Sugerencias de ubicacion</h3>
            <button onClick={() => setShowInboundForm(true)}>Nueva entrada</button>
          </div>

          <div className="putaway-table">
            <div className="putaway-table-head">
              <span>Entrada</span>
              <span>Producto</span>
              <span>Tipo</span>
              <span>Cantidad</span>
              <span>Regla</span>
              <span>Almacen</span>
              <span>Ubicacion</span>
              <span>Libre</span>
              <span>Decision</span>
            </div>

            {filteredSuggestions.map((suggestion) => (
              <div key={`${suggestion.item.code}-${suggestion.location}`} className="putaway-table-row">
                <strong>{suggestion.item.code}</strong>
                <span>{suggestion.item.product}</span>
                <span>{suggestion.item.productType}</span>
                <b>{suggestion.item.quantity}</b>
                <span>{suggestion.rule}</span>
                <span>{suggestion.warehouse}</span>
                <span>{suggestion.location}</span>
                <span>{suggestion.freePercent}%</span>
                <em className={suggestion.decision === 'Ubicacion sugerida' ? 'status-ok' : 'status-low'}>
                  {suggestion.decision}
                </em>
              </div>
            ))}

            {filteredSuggestions.length === 0 && (
              <div className="empty-products">
                No hay sugerencias para mostrar.
              </div>
            )}
          </div>
        </div>

        <div className="putaway-rules-panel">
          <div className="card-header">
            <h3>Reglas activas</h3>
            <button onClick={() => setShowRuleForm(true)}>Nueva</button>
          </div>

          <div className="putaway-rule-list">
            {rules.map((rule) => (
              <article key={`${rule.name}-${rule.preferredZone}`}>
                <div>
                  <strong>{rule.name}</strong>
                  <span>{rule.productType} - {rule.preferredWarehouse} - {rule.preferredZone}</span>
                </div>

                <div className="putaway-rule-meta">
                  <em className={rule.status === 'Activa' ? 'status-ok' : 'status-low'}>{rule.status}</em>
                  <b>{rule.priority}</b>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function InventoryDispatchMethods() {
  const [searchTerm, setSearchTerm] = useState('')
  const [dispatchMethod, setDispatchMethod] = useState('FEFO')
  const [showOrderForm, setShowOrderForm] = useState(false)

  const [lots, setLots] = useState([
    {
      productCode: 'PRO-001',
      productName: 'Laptop HP Pavilion',
      lotNumber: 'LOT-2026-001',
      receivedDate: '2026-01-10',
      expirationDate: '2027-05-15',
      quantity: 15,
      status: 'Disponible',
      warehouse: 'Almacen Principal',
      location: 'A-01-R01-N01',
    },
    {
      productCode: 'PRO-001',
      productName: 'Laptop HP Pavilion',
      lotNumber: 'LOT-2026-007',
      receivedDate: '2026-04-20',
      expirationDate: '2026-12-20',
      quantity: 9,
      status: 'Disponible',
      warehouse: 'Almacen Principal',
      location: 'A-01-R01-N02',
    },
    {
      productCode: 'PRO-002',
      productName: 'Mouse Inalambrico Logitech',
      lotNumber: 'LOT-2026-002',
      receivedDate: '2026-02-12',
      expirationDate: '2026-09-30',
      quantity: 80,
      status: 'Disponible',
      warehouse: 'Almacen Principal',
      location: 'A-02-R03-N01',
    },
    {
      productCode: 'PRO-003',
      productName: 'Monitor Samsung 24"',
      lotNumber: 'LOT-2026-003',
      receivedDate: '2026-03-05',
      expirationDate: '2026-06-20',
      quantity: 12,
      status: 'Cuarentena',
      warehouse: 'Almacen 2',
      location: 'B-01-R02-N03',
    },
    {
      productCode: 'PRO-020',
      productName: 'Caja de Lapices',
      lotNumber: 'LOT-2026-011',
      receivedDate: '2026-01-25',
      expirationDate: '2028-01-25',
      quantity: 60,
      status: 'Disponible',
      warehouse: 'Almacen 2',
      location: 'B-02-R03-N01',
    },
  ])

  const [orders, setOrders] = useState([
    {
      orderNumber: 'DES-001',
      customer: 'Cliente General',
      productCode: 'PRO-001',
      productName: 'Laptop HP Pavilion',
      quantity: 12,
      method: 'FEFO',
      status: 'Pendiente',
    },
    {
      orderNumber: 'DES-002',
      customer: 'Escuela Central',
      productCode: 'PRO-002',
      productName: 'Mouse Inalambrico Logitech',
      quantity: 20,
      method: 'FIFO',
      status: 'Pendiente',
    },
  ])

  const [newOrder, setNewOrder] = useState({
    orderNumber: '',
    customer: '',
    productCode: '',
    productName: '',
    quantity: '',
    method: 'FEFO',
    status: 'Pendiente',
  })

  const updateOrderField = (field, value) => {
    setNewOrder((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const resetOrderForm = () => {
    setNewOrder({
      orderNumber: '',
      customer: '',
      productCode: '',
      productName: '',
      quantity: '',
      method: 'FEFO',
      status: 'Pendiente',
    })
  }

  const getExpirationAlert = (expirationDate) => {
    const today = new Date()
    const expiration = new Date(expirationDate)
    const daysLeft = Math.ceil((expiration - today) / (1000 * 60 * 60 * 24))

    if (daysLeft < 0) return 'Vencido'
    if (daysLeft <= 30) return 'Vence pronto'
    if (daysLeft <= 90) return 'FEFO'
    return 'Vigente'
  }

  const sortLotsByMethod = (items, method) => {
    const sorted = [...items]

    if (method === 'FIFO') {
      return sorted.sort((a, b) => new Date(a.receivedDate) - new Date(b.receivedDate))
    }

    if (method === 'LIFO') {
      return sorted.sort((a, b) => new Date(b.receivedDate) - new Date(a.receivedDate))
    }

    return sorted.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate))
  }

  const getLotAllocation = (order) => {
    const availableLots = lots.filter((lot) => {
      return (
        lot.productCode === order.productCode &&
        lot.status === 'Disponible' &&
        Number(lot.quantity || 0) > 0 &&
        getExpirationAlert(lot.expirationDate) !== 'Vencido'
      )
    })

    const sortedLots = sortLotsByMethod(availableLots, order.method || dispatchMethod)

    let remaining = Number(order.quantity || 0)

    const allocation = []

    sortedLots.forEach((lot) => {
      if (remaining <= 0) return

      const quantityToDispatch = Math.min(remaining, Number(lot.quantity || 0))

      allocation.push({
        ...lot,
        dispatchQuantity: quantityToDispatch,
        alert: getExpirationAlert(lot.expirationDate),
      })

      remaining -= quantityToDispatch
    })

    return {
      allocation,
      remaining,
      completed: remaining <= 0,
    }
  }

  const createOrder = (event) => {
    event.preventDefault()

    if (!newOrder.orderNumber || !newOrder.customer || !newOrder.productCode || !newOrder.productName || !newOrder.quantity) {
      alert('Debes completar orden, cliente, producto y cantidad.')
      return
    }

    setOrders((current) => [
      {
        ...newOrder,
        quantity: Number(newOrder.quantity || 0),
      },
      ...current,
    ])

    resetOrderForm()
    setShowOrderForm(false)
  }

  const simulateDispatch = (order) => {
    const result = getLotAllocation(order)

    if (!result.completed) {
      alert('No hay stock suficiente disponible para completar esta orden.')
      return
    }

    setLots((currentLots) =>
      currentLots.map((lot) => {
        const usedLot = result.allocation.find((item) => item.lotNumber === lot.lotNumber)

        if (!usedLot) return lot

        return {
          ...lot,
          quantity: Math.max(0, Number(lot.quantity || 0) - Number(usedLot.dispatchQuantity || 0)),
        }
      })
    )

    setOrders((currentOrders) =>
      currentOrders.map((item) =>
        item.orderNumber === order.orderNumber
          ? { ...item, status: 'Despachada' }
          : item
      )
    )

    alert('Despacho simulado correctamente. Se descontaron los lotes recomendados.')
  }

  const filteredOrders = orders.filter((order) => {
    const search = searchTerm.toLowerCase()

    return (
      order.orderNumber.toLowerCase().includes(search) ||
      order.customer.toLowerCase().includes(search) ||
      order.productCode.toLowerCase().includes(search) ||
      order.productName.toLowerCase().includes(search) ||
      order.method.toLowerCase().includes(search) ||
      order.status.toLowerCase().includes(search)
    )
  })

  const pendingOrders = orders.filter((order) => order.status === 'Pendiente').length
  const dispatchedOrders = orders.filter((order) => order.status === 'Despachada').length
  const availableLots = lots.filter((lot) => lot.status === 'Disponible').length
  const blockedLots = lots.filter((lot) => lot.status !== 'Disponible').length

  return (
    <section className="card inventory-dispatch-card">
      <div className="inventory-advanced-header">
        <div>
          <span>Inventario avanzado</span>
          <h3>Metodos de Despacho FIFO, FEFO y LIFO</h3>
          <p>Selecciona automaticamente los lotes correctos para despachar segun entrada, vencimiento o ultimo recibido.</p>
        </div>

        <div className="dispatch-header-actions">
          <select value={dispatchMethod} onChange={(event) => setDispatchMethod(event.target.value)}>
            <option>FEFO</option>
            <option>FIFO</option>
            <option>LIFO</option>
          </select>

          <button className="primary-button small" onClick={() => setShowOrderForm(true)}>
            Nueva orden
          </button>
        </div>
      </div>

      <div className="dispatch-kpi-grid">
        <article>
          <span>Ordenes pendientes</span>
          <strong>{pendingOrders}</strong>
          <p>Listas para evaluar</p>
        </article>

        <article>
          <span>Despachadas</span>
          <strong>{dispatchedOrders}</strong>
          <p>Simuladas correctamente</p>
        </article>

        <article>
          <span>Lotes disponibles</span>
          <strong>{availableLots}</strong>
          <p>Validos para salida</p>
        </article>

        <article>
          <span>Lotes bloqueados</span>
          <strong>{blockedLots}</strong>
          <p>Cuarentena o retenidos</p>
        </article>
      </div>

      <div className="dispatch-toolbar">
        <div className="product-search-box">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por orden, cliente, producto, metodo o estado..."
          />
        </div>
      </div>

      {showOrderForm && (
        <form className="dispatch-form-card" onSubmit={createOrder}>
          <div className="product-form-header">
            <div>
              <h4>Nueva orden de despacho</h4>
              <p>Crea una salida para que el sistema recomiende los lotes correctos.</p>
            </div>

            <button type="button" className="close-form-button" onClick={() => setShowOrderForm(false)}>
              Cerrar
            </button>
          </div>

          <div className="dispatch-form-grid">
            <label>
              Orden
              <input
                value={newOrder.orderNumber}
                onChange={(event) => updateOrderField('orderNumber', event.target.value)}
                placeholder="DES-000"
              />
            </label>

            <label>
              Cliente
              <input
                value={newOrder.customer}
                onChange={(event) => updateOrderField('customer', event.target.value)}
                placeholder="Cliente"
              />
            </label>

            <label>
              Codigo producto
              <input
                value={newOrder.productCode}
                onChange={(event) => updateOrderField('productCode', event.target.value)}
                placeholder="PRO-000"
              />
            </label>

            <label className="dispatch-wide-field">
              Producto
              <input
                value={newOrder.productName}
                onChange={(event) => updateOrderField('productName', event.target.value)}
                placeholder="Nombre del producto"
              />
            </label>

            <label>
              Cantidad
              <input
                type="number"
                value={newOrder.quantity}
                onChange={(event) => updateOrderField('quantity', event.target.value)}
                placeholder="0"
              />
            </label>

            <label>
              Metodo
              <select
                value={newOrder.method}
                onChange={(event) => updateOrderField('method', event.target.value)}
              >
                <option>FEFO</option>
                <option>FIFO</option>
                <option>LIFO</option>
              </select>
            </label>

            <label>
              Estado
              <select
                value={newOrder.status}
                onChange={(event) => updateOrderField('status', event.target.value)}
              >
                <option>Pendiente</option>
                <option>Despachada</option>
                <option>Bloqueada</option>
              </select>
            </label>
          </div>

          <div className="product-form-actions">
            <button type="button" className="secondary-button" onClick={resetOrderForm}>
              Limpiar
            </button>

            <button type="submit" className="primary-button small">
              Guardar orden
            </button>
          </div>
        </form>
      )}

      <div className="dispatch-layout">
        <div className="dispatch-orders-panel">
          <div className="card-header">
            <h3>Ordenes y lotes recomendados</h3>
            <button onClick={() => setShowOrderForm(true)}>Nueva</button>
          </div>

          <div className="dispatch-order-list">
            {filteredOrders.map((order) => {
              const result = getLotAllocation(order)

              return (
                <article key={order.orderNumber} className="dispatch-order-card">
                  <div className="dispatch-order-top">
                    <div>
                      <strong>Orden de despacho</strong>
                      <span>Cliente - Producto</span>
                    </div>

                    <em className={order.status === 'Despachada' ? 'status-ok' : order.status === 'Pendiente' ? 'status-neutral' : 'status-low'}>
                      {order.status}
                    </em>
                  </div>

                  <div className="dispatch-order-meta">
                    <div>
                      <span>Cantidad</span>
                      <strong>{order.quantity}</strong>
                    </div>
                    <div>
                      <span>Metodo</span>
                      <strong>{order.method}</strong>
                    </div>
                    <div>
                      <span>Disponible</span>
                      <strong>{result.completed ? 'Completo' : 'Faltan ' + result.remaining}</strong>
                    </div>
                  </div>

                  <div className="allocation-list">
                    {result.allocation.map((lot) => (
                      <div key={`${order.orderNumber}-${lot.lotNumber}`}>
                        <span>{lot.lotNumber}</span>
                        <b>{lot.dispatchQuantity} und.</b>
                        <small>{lot.location}</small>
                        <em className={lot.alert === 'Vence pronto' || lot.alert === 'FEFO' ? 'status-neutral' : 'status-ok'}>
                          {lot.alert}
                        </em>
                      </div>
                    ))}

                    {result.allocation.length === 0 && (
                      <p>No hay lotes disponibles para esta orden.</p>
                    )}
                  </div>

                  <button
                    className="dispatch-simulate-button"
                    type="button"
                    onClick={() => simulateDispatch(order)}
                    disabled={order.status === 'Despachada'}
                  >
                    Simular despacho
                  </button>
                </article>
              )
            })}

            {filteredOrders.length === 0 && (
              <div className="empty-products">
                No hay ordenes para mostrar.
              </div>
            )}
          </div>
        </div>

        <div className="dispatch-lots-panel">
          <div className="card-header">
            <h3>Lotes disponibles</h3>
            <button>{dispatchMethod}</button>
          </div>

          <div className="dispatch-lots-list">
  {sortLotsByMethod(lots, dispatchMethod).map((lot, index) => (
    <article key={index}>
      <div>
        <strong>Lote disponible</strong>
        <span>Inventario para despacho</span>
      </div>

      <b>Stock</b>
      <em className="status-ok">Disponible</em>
    </article>
  ))}
</div>
        </div>
      </div>
    </section>
  )
}

function InventoryPickingRoutes() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showPickingForm, setShowPickingForm] = useState(false)

  const [operators] = useState([
    { name: 'Carlos Medina', zone: 'Zona A', status: 'Disponible' },
    { name: 'Ana Gomez', zone: 'Zona B', status: 'Disponible' },
    { name: 'Jose Perez', zone: 'Cuarentena', status: 'Ocupado' },
  ])

  const [pickingOrders, setPickingOrders] = useState([
    {
      orderNumber: 'PICK-001',
      dispatchOrder: 'DES-001',
      customer: 'Cliente General',
      operator: 'Carlos Medina',
      priority: 'Alta',
      status: 'Pendiente',
      estimatedTime: 14,
      items: [
        { code: 'PRO-001', name: 'Laptop HP Pavilion', qty: 5, location: 'A-01-R01-N01' },
        { code: 'PRO-002', name: 'Mouse Inalambrico Logitech', qty: 10, location: 'A-02-R03-N01' },
      ],
    },
    {
      orderNumber: 'PICK-002',
      dispatchOrder: 'DES-002',
      customer: 'Escuela Central',
      operator: 'Ana Gomez',
      priority: 'Media',
      status: 'En proceso',
      estimatedTime: 18,
      items: [
        { code: 'PRO-020', name: 'Caja de Lapices', qty: 12, location: 'B-02-R03-N01' },
        { code: 'CUA-100', name: 'Cuaderno 100 paginas', qty: 30, location: 'B-02-R02-N02' },
      ],
    },
  ])

  const [newPicking, setNewPicking] = useState({
    orderNumber: '',
    dispatchOrder: '',
    customer: '',
    operator: 'Carlos Medina',
    priority: 'Media',
    status: 'Pendiente',
    estimatedTime: '',
  })

  const [newPickingItems, setNewPickingItems] = useState([
    { code: '', name: '', qty: '', location: '' },
  ])

  const updatePickingField = (field, value) => {
    setNewPicking((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const updatePickingItem = (index, field, value) => {
    setNewPickingItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      )
    )
  }

  const addPickingItem = () => {
    setNewPickingItems((current) => [
      ...current,
      { code: '', name: '', qty: '', location: '' },
    ])
  }

  const removePickingItem = (index) => {
    setNewPickingItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const resetPickingForm = () => {
    setNewPicking({
      orderNumber: '',
      dispatchOrder: '',
      customer: '',
      operator: 'Carlos Medina',
      priority: 'Media',
      status: 'Pendiente',
      estimatedTime: '',
    })

    setNewPickingItems([
      { code: '', name: '', qty: '', location: '' },
    ])
  }

  const getOptimizedRoute = (items) => {
    return [...items].sort((a, b) => a.location.localeCompare(b.location))
  }

  const getRouteText = (items) => {
    const route = getOptimizedRoute(items)

    if (!route.length) return 'Sin ruta'

    return route.map((item) => item.location).join(' - ')
  }

  const getEstimatedTime = (items) => {
    const route = getOptimizedRoute(items)
    const uniqueLocations = new Set(route.map((item) => item.location)).size
    const totalItems = route.reduce((sum, item) => sum + Number(item.qty || 0), 0)

    return Math.max(6, uniqueLocations * 4 + Math.ceil(totalItems / 10))
  }

  const createPickingOrder = (event) => {
    event.preventDefault()

    if (!newPicking.orderNumber || !newPicking.dispatchOrder || !newPicking.customer) {
      alert('Debes completar numero de picking, orden de despacho y cliente.')
      return
    }

    const validItems = newPickingItems.filter((item) => item.code && item.name && item.qty && item.location)

    if (!validItems.length) {
      alert('Debes agregar al menos un producto valido para recoger.')
      return
    }

    const cleanItems = validItems.map((item) => ({
      ...item,
      qty: Number(item.qty || 0),
    }))

    const createdPicking = {
      ...newPicking,
      estimatedTime: Number(newPicking.estimatedTime || getEstimatedTime(cleanItems)),
      items: cleanItems,
    }

    setPickingOrders((current) => [createdPicking, ...current])
    resetPickingForm()
    setShowPickingForm(false)
  }

  const startPicking = (orderNumber) => {
    setPickingOrders((current) =>
      current.map((order) =>
        order.orderNumber === orderNumber
          ? { ...order, status: 'En proceso' }
          : order
      )
    )
  }

  const completePicking = (orderNumber) => {
    setPickingOrders((current) =>
      current.map((order) =>
        order.orderNumber === orderNumber
          ? { ...order, status: 'Completado' }
          : order
      )
    )

    alert('Picking completado correctamente.')
  }

  const filteredOrders = pickingOrders.filter((order) => {
    const search = searchTerm.toLowerCase()

    return (
      order.orderNumber.toLowerCase().includes(search) ||
      order.dispatchOrder.toLowerCase().includes(search) ||
      order.customer.toLowerCase().includes(search) ||
      order.operator.toLowerCase().includes(search) ||
      order.priority.toLowerCase().includes(search) ||
      order.status.toLowerCase().includes(search) ||
      order.items.some((item) =>
        item.code.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search) ||
        item.location.toLowerCase().includes(search)
      )
    )
  })

  const pendingOrders = pickingOrders.filter((order) => order.status === 'Pendiente').length
  const inProcessOrders = pickingOrders.filter((order) => order.status === 'En proceso').length
  const completedOrders = pickingOrders.filter((order) => order.status === 'Completado').length
  const averageTime = pickingOrders.length
    ? Math.round(pickingOrders.reduce((sum, order) => sum + Number(order.estimatedTime || 0), 0) / pickingOrders.length)
    : 0

  return (
    <section className="card inventory-picking-card">
      <div className="inventory-advanced-header">
        <div>
          <span>Inventario avanzado</span>
          <h3>Optimizacion de Rutas de Picking</h3>
          <p>Organiza ordenes de recogida, asigna operarios, sugiere rutas por ubicacion y controla el avance del picking.</p>
        </div>

        <button className="primary-button small" onClick={() => setShowPickingForm(true)}>
          Nueva orden picking
        </button>
      </div>

      <div className="picking-kpi-grid">
        <article>
          <span>Pendientes</span>
          <strong>{pendingOrders}</strong>
          <p>Ordenes por iniciar</p>
        </article>

        <article>
          <span>En proceso</span>
          <strong>{inProcessOrders}</strong>
          <p>Operarios trabajando</p>
        </article>

        <article>
          <span>Completadas</span>
          <strong>{completedOrders}</strong>
          <p>Ordenes finalizadas</p>
        </article>

        <article>
          <span>Tiempo promedio</span>
          <strong>{averageTime} min</strong>
          <p>Ruta estimada</p>
        </article>
      </div>

      <div className="picking-toolbar">
        <div className="product-search-box">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por picking, despacho, cliente, operario, producto o ubicacion..."
          />
        </div>
      </div>

      {showPickingForm && (
        <form className="picking-form-card" onSubmit={createPickingOrder}>
          <div className="product-form-header">
            <div>
              <h4>Nueva orden de picking</h4>
              <p>Registra productos a recoger y el sistema ordena la ruta por ubicacion.</p>
            </div>

            <button type="button" className="close-form-button" onClick={() => setShowPickingForm(false)}>
              Cerrar
            </button>
          </div>

          <div className="picking-form-grid">
            <label>
              No. Picking
              <input
                value={newPicking.orderNumber}
                onChange={(event) => updatePickingField('orderNumber', event.target.value)}
                placeholder="PICK-000"
              />
            </label>

            <label>
              Orden despacho
              <input
                value={newPicking.dispatchOrder}
                onChange={(event) => updatePickingField('dispatchOrder', event.target.value)}
                placeholder="DES-000"
              />
            </label>

            <label className="picking-wide-field">
              Cliente
              <input
                value={newPicking.customer}
                onChange={(event) => updatePickingField('customer', event.target.value)}
                placeholder="Cliente"
              />
            </label>

            <label>
              Operario
              <select
                value={newPicking.operator}
                onChange={(event) => updatePickingField('operator', event.target.value)}
              >
                {operators.map((operator) => (
                  <option key={operator.name}>{operator.name}</option>
                ))}
              </select>
            </label>

            <label>
              Prioridad
              <select
                value={newPicking.priority}
                onChange={(event) => updatePickingField('priority', event.target.value)}
              >
                <option>Baja</option>
                <option>Media</option>
                <option>Alta</option>
                <option>Urgente</option>
              </select>
            </label>

            <label>
              Estado
              <select
                value={newPicking.status}
                onChange={(event) => updatePickingField('status', event.target.value)}
              >
                <option>Pendiente</option>
                <option>En proceso</option>
                <option>Completado</option>
              </select>
            </label>

            <label>
              Tiempo estimado
              <input
                type="number"
                value={newPicking.estimatedTime}
                onChange={(event) => updatePickingField('estimatedTime', event.target.value)}
                placeholder="Automatico"
              />
            </label>
          </div>

          <div className="picking-items-editor">
            <div className="picking-items-header">
              <strong>Productos a recoger</strong>
              <button type="button" onClick={addPickingItem}>Agregar producto</button>
            </div>

            {newPickingItems.map((item, index) => (
              <div key={`picking-item-${index}`} className="picking-item-row">
                <input
                  value={item.code}
                  onChange={(event) => updatePickingItem(index, 'code', event.target.value)}
                  placeholder="Codigo"
                />
                <input
                  value={item.name}
                  onChange={(event) => updatePickingItem(index, 'name', event.target.value)}
                  placeholder="Producto"
                />
                <input
                  type="number"
                  value={item.qty}
                  onChange={(event) => updatePickingItem(index, 'qty', event.target.value)}
                  placeholder="Cant."
                />
                <input
                  value={item.location}
                  onChange={(event) => updatePickingItem(index, 'location', event.target.value)}
                  placeholder="Ubicacion"
                />

                <button type="button" onClick={() => removePickingItem(index)}>
                  Quitar
                </button>
              </div>
            ))}
          </div>

          <div className="product-form-actions">
            <button type="button" className="secondary-button" onClick={resetPickingForm}>
              Limpiar
            </button>

            <button type="submit" className="primary-button small">
              Guardar picking
            </button>
          </div>
        </form>
      )}

      <div className="picking-layout">
        <div className="picking-orders-panel">
          <div className="card-header">
            <h3>Ordenes de picking</h3>
            <button onClick={() => setShowPickingForm(true)}>Nueva</button>
          </div>

          <div className="picking-order-list">
            {filteredOrders.map((order) => {
              const route = getOptimizedRoute(order.items)

              return (
                <article key={order.orderNumber} className="picking-order-card">
                  <div className="picking-order-top">
                    <div>
                      <strong>Orden de picking</strong>
                      <span>Despacho - Operario</span>
                    </div>

                    <em className={order.status === 'Completado' ? 'status-ok' : order.status === 'En proceso' ? 'status-neutral' : 'status-low'}>
                      {order.status}
                    </em>
                  </div>

                  <div className="picking-order-meta">
                    <div>
                      <span>Prioridad</span>
                      <strong>{order.priority}</strong>
                    </div>

                    <div>
                      <span>Tiempo</span>
                      <strong>{order.estimatedTime} min</strong>
                    </div>

                    <div>
                      <span>Ruta</span>
                      <strong>{route.length} paradas</strong>
                    </div>
                  </div>

                  <div className="picking-route-box">
                    <strong>Ruta sugerida</strong>
                    <p>{getRouteText(order.items)}</p>
                  </div>

                  <div className="picking-items-list">
                    {route.map((item) => (
                      <div key={`${order.orderNumber}-${item.code}-${item.location}`}>
                        <span>{item.location}</span>
                        <strong>{item.name}</strong>
                        <b>{item.qty}</b>
                      </div>
                    ))}
                  </div>

                  <div className="picking-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => startPicking(order.orderNumber)}
                      disabled={order.status !== 'Pendiente'}
                    >
                      Iniciar
                    </button>

                    <button
                      type="button"
                      className="primary-button small"
                      onClick={() => completePicking(order.orderNumber)}
                      disabled={order.status === 'Completado'}
                    >
                      Completar
                    </button>
                  </div>
                </article>
              )
            })}

            {filteredOrders.length === 0 && (
              <div className="empty-products">
                No hay ordenes de picking para mostrar.
              </div>
            )}
          </div>
        </div>

        <div className="picking-operators-panel">
          <div className="card-header">
            <h3>Operarios</h3>
            <button>{operators.length}</button>
          </div>

          <div className="picking-operator-list">
            {operators.map((operator) => (
              <article key={operator.name}>
                <div>
                  <strong>{operator.name}</strong>
                  <span>{operator.zone}</span>
                </div>

                <em className={operator.status === 'Disponible' ? 'status-ok' : 'status-neutral'}>
                  {operator.status}
                </em>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function InventoryReorderSafetyStock() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showRuleForm, setShowRuleForm] = useState(false)

  const [reorderRules, setReorderRules] = useState([
    {
      productCode: 'PRO-001',
      productName: 'Laptop HP Pavilion',
      currentStock: 24,
      dailyDemand: 2,
      leadTimeDays: 7,
      safetyStock: 8,
      minStock: 14,
      maxStock: 60,
      supplier: 'Suplidores del Caribe',
      cost: 28500,
      status: 'Activo',
    },
    {
      productCode: 'PRO-002',
      productName: 'Mouse Inalambrico Logitech',
      currentStock: 18,
      dailyDemand: 5,
      leadTimeDays: 5,
      safetyStock: 12,
      minStock: 25,
      maxStock: 120,
      supplier: 'Distribuidora Nacional',
      cost: 420,
      status: 'Activo',
    },
    {
      productCode: 'PRO-020',
      productName: 'Caja de Lapices',
      currentStock: 80,
      dailyDemand: 8,
      leadTimeDays: 4,
      safetyStock: 20,
      minStock: 52,
      maxStock: 220,
      supplier: 'Papeleria Mayorista RD',
      cost: 95,
      status: 'Activo',
    },
  ])

  const [newRule, setNewRule] = useState({
    productCode: '',
    productName: '',
    currentStock: '',
    dailyDemand: '',
    leadTimeDays: '',
    safetyStock: '',
    minStock: '',
    maxStock: '',
    supplier: '',
    cost: '',
    status: 'Activo',
  })

  const updateRuleField = (field, value) => {
    setNewRule((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const resetRuleForm = () => {
    setNewRule({
      productCode: '',
      productName: '',
      currentStock: '',
      dailyDemand: '',
      leadTimeDays: '',
      safetyStock: '',
      minStock: '',
      maxStock: '',
      supplier: '',
      cost: '',
      status: 'Activo',
    })
  }

  const getReorderPoint = (rule) => {
    return Number(rule.dailyDemand || 0) * Number(rule.leadTimeDays || 0) + Number(rule.safetyStock || 0)
  }

  const getCoverageDays = (rule) => {
    const demand = Number(rule.dailyDemand || 0)
    if (!demand) return 0
    return Math.floor(Number(rule.currentStock || 0) / demand)
  }

  const getSuggestedQty = (rule) => {
    return Math.max(0, Number(rule.maxStock || 0) - Number(rule.currentStock || 0))
  }

  const getPriority = (rule) => {
    const currentStock = Number(rule.currentStock || 0)
    const reorderPoint = getReorderPoint(rule)
    const minStock = Number(rule.minStock || 0)

    if (currentStock <= minStock) return 'Critica'
    if (currentStock <= reorderPoint) return 'Alta'
    if (getCoverageDays(rule) <= 10) return 'Media'
    return 'Normal'
  }

  const getSuggestedOrderValue = (rule) => {
    return getSuggestedQty(rule) * Number(rule.cost || 0)
  }

  const createRule = (event) => {
    event.preventDefault()

    if (!newRule.productCode || !newRule.productName || !newRule.dailyDemand || !newRule.leadTimeDays || !newRule.maxStock) {
      alert('Debes completar codigo, producto, demanda diaria, tiempo entrega y stock maximo.')
      return
    }

    setReorderRules((current) => [
      {
        ...newRule,
        currentStock: Number(newRule.currentStock || 0),
        dailyDemand: Number(newRule.dailyDemand || 0),
        leadTimeDays: Number(newRule.leadTimeDays || 0),
        safetyStock: Number(newRule.safetyStock || 0),
        minStock: Number(newRule.minStock || 0),
        maxStock: Number(newRule.maxStock || 0),
        cost: Number(newRule.cost || 0),
      },
      ...current,
    ])

    resetRuleForm()
    setShowRuleForm(false)
  }

  const generateSuggestedOrder = (rule) => {
    const qty = getSuggestedQty(rule)

    if (qty <= 0) {
      alert('Este producto no requiere reposicion por ahora.')
      return
    }

    alert(`Orden sugerida: ${rule.productName} - Cantidad: ${qty} unidades - Proveedor: ${rule.supplier || 'Sin proveedor'}`)
  }

  const filteredRules = reorderRules.filter((rule) => {
    const search = searchTerm.toLowerCase()

    return (
      rule.productCode.toLowerCase().includes(search) ||
      rule.productName.toLowerCase().includes(search) ||
      rule.supplier.toLowerCase().includes(search) ||
      rule.status.toLowerCase().includes(search) ||
      getPriority(rule).toLowerCase().includes(search)
    )
  })

  const activeRules = reorderRules.filter((rule) => rule.status === 'Activo').length
  const criticalItems = reorderRules.filter((rule) => getPriority(rule) === 'Critica').length
  const highPriorityItems = reorderRules.filter((rule) => getPriority(rule) === 'Alta').length
  const suggestedTotalValue = reorderRules.reduce((sum, rule) => sum + getSuggestedOrderValue(rule), 0)

  return (
    <section className="card inventory-reorder-card">
      <div className="inventory-advanced-header">
        <div>
          <span>Inventario avanzado</span>
          <h3>Puntos de Pedido Automaticos y Stock de Seguridad</h3>
          <p>Calcula punto de pedido, cobertura, stock minimo, stock maximo, stock de seguridad y sugerencias de compra.</p>
        </div>

        <button className="primary-button small" onClick={() => setShowRuleForm(true)}>
          Nueva regla
        </button>
      </div>

      <div className="reorder-kpi-grid">
        <article>
          <span>Reglas activas</span>
          <strong>{activeRules}</strong>
          <p>Productos configurados</p>
        </article>

        <article>
          <span>Criticos</span>
          <strong>{criticalItems}</strong>
          <p>Comprar urgente</p>
        </article>

        <article>
          <span>Alta prioridad</span>
          <strong>{highPriorityItems}</strong>
          <p>Requieren reposicion</p>
        </article>

        <article>
          <span>Valor sugerido</span>
          <strong>RD$ {suggestedTotalValue.toLocaleString('es-DO')}</strong>
          <p>Compra estimada</p>
        </article>
      </div>

      <div className="reorder-toolbar">
        <div className="product-search-box">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por producto, codigo, proveedor, prioridad o estado..."
          />
        </div>
      </div>

      {showRuleForm && (
        <form className="reorder-form-card" onSubmit={createRule}>
          <div className="product-form-header">
            <div>
              <h4>Nueva regla de reposicion</h4>
              <p>Define demanda, tiempo de entrega, stock de seguridad y stock maximo.</p>
            </div>

            <button type="button" className="close-form-button" onClick={() => setShowRuleForm(false)}>
              Cerrar
            </button>
          </div>

          <div className="reorder-form-grid">
            <label>
              Codigo producto
              <input value={newRule.productCode} onChange={(event) => updateRuleField('productCode', event.target.value)} placeholder="PRO-000" />
            </label>

            <label className="reorder-wide-field">
              Producto
              <input value={newRule.productName} onChange={(event) => updateRuleField('productName', event.target.value)} placeholder="Nombre del producto" />
            </label>

            <label>
              Stock actual
              <input type="number" value={newRule.currentStock} onChange={(event) => updateRuleField('currentStock', event.target.value)} placeholder="0" />
            </label>

            <label>
              Demanda diaria
              <input type="number" value={newRule.dailyDemand} onChange={(event) => updateRuleField('dailyDemand', event.target.value)} placeholder="0" />
            </label>

            <label>
              Tiempo entrega dias
              <input type="number" value={newRule.leadTimeDays} onChange={(event) => updateRuleField('leadTimeDays', event.target.value)} placeholder="0" />
            </label>

            <label>
              Stock seguridad
              <input type="number" value={newRule.safetyStock} onChange={(event) => updateRuleField('safetyStock', event.target.value)} placeholder="0" />
            </label>

            <label>
              Stock minimo
              <input type="number" value={newRule.minStock} onChange={(event) => updateRuleField('minStock', event.target.value)} placeholder="0" />
            </label>

            <label>
              Stock maximo
              <input type="number" value={newRule.maxStock} onChange={(event) => updateRuleField('maxStock', event.target.value)} placeholder="0" />
            </label>

            <label className="reorder-wide-field">
              Proveedor sugerido
              <input value={newRule.supplier} onChange={(event) => updateRuleField('supplier', event.target.value)} placeholder="Proveedor" />
            </label>

            <label>
              Costo unitario
              <input type="number" value={newRule.cost} onChange={(event) => updateRuleField('cost', event.target.value)} placeholder="0.00" />
            </label>

            <label>
              Estado
              <select value={newRule.status} onChange={(event) => updateRuleField('status', event.target.value)}>
                <option>Activo</option>
                <option>Inactivo</option>
              </select>
            </label>
          </div>

          <div className="product-form-actions">
            <button type="button" className="secondary-button" onClick={resetRuleForm}>
              Limpiar
            </button>

            <button type="submit" className="primary-button small">
              Guardar regla
            </button>
          </div>
        </form>
      )}

      <div className="reorder-table">
        <div className="reorder-table-head">
          <span>Producto</span>
          <span>Stock</span>
          <span>Demanda</span>
          <span>Lead time</span>
          <span>Seguridad</span>
          <span>Punto pedido</span>
          <span>Cobertura</span>
          <span>Sugerido</span>
          <span>Proveedor</span>
          <span>Prioridad</span>
          <span>Accion</span>
        </div>

        {filteredRules.map((rule) => {
          const reorderPoint = getReorderPoint(rule)
          const coverageDays = getCoverageDays(rule)
          const suggestedQty = getSuggestedQty(rule)
          const priority = getPriority(rule)

          return (
            <div key={`${rule.productCode}-${rule.productName}`} className="reorder-table-row">
              <div>
                <strong>{rule.productName}</strong>
                <small>{rule.productCode}</small>
              </div>
              <b>{rule.currentStock}</b>
              <span>{rule.dailyDemand}/dia</span>
              <span>{rule.leadTimeDays} dias</span>
              <span>{rule.safetyStock}</span>
              <b>{reorderPoint}</b>
              <span>{coverageDays} dias</span>
              <b>{suggestedQty}</b>
              <span>{rule.supplier || 'Sin proveedor'}</span>
              <em className={priority === 'Critica' ? 'status-low' : priority === 'Alta' ? 'status-neutral' : 'status-ok'}>
                {priority}
              </em>
              <button type="button" onClick={() => generateSuggestedOrder(rule)}>
                Generar
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function InventoryAdvancedSection({ section }) {
  const data = advancedInventorySections.find((item) => item.id === section)

  if (!data) return null

  return (
    <section className="card inventory-advanced-card">
      <div className="inventory-advanced-header">
        <div>
          <span>Inventario avanzado</span>
          <h3>{data.title}</h3>
          <p>{data.description}</p>
        </div>

        <button className="secondary-button">Configurar</button>
      </div>

      <div className="inventory-advanced-grid">
        {data.features.map((feature) => (
          <article key={feature} className="inventory-advanced-feature">
            <strong>{feature}</strong>
            <p>Preparado para activar reglas, formularios, reportes y automatizaciones.</p>
          </article>
        ))}
      </div>

      <div className="inventory-advanced-note">
        <strong>Estado:</strong> estructura creada. En las proximas fases conectaremos datos reales y reglas de negocio.
      </div>
    </section>
  )
}
function InventoryModule() {
  const [inventoryView, setInventoryView] = useState('summary')

  const inventoryTabs = [
    { id: 'summary', name: 'Resumen', icon: Gauge },
    { id: 'products', name: 'Productos', icon: Package },
    { id: 'categories', name: 'Categorias', icon: Layers },
    { id: 'warehouses', name: 'Almacenes', icon: Warehouse },
    { id: 'movements', name: 'Movimientos', icon: ArrowLeftRight },
    { id: 'receiving', name: 'Recepcion', icon: ClipboardList },
    ...advancedInventorySections.map((section) => ({ id: section.id, name: section.tab, icon: section.icon })),
  ]

  return (
    <main className="main-content">
      <section className="module-header">
        <div>
          <span className="module-badge">Modulo activo</span>
          <h2>Inventario y Almacen</h2>
          <p>Controla productos, categorias, almacenes, stock, movimientos, ajustes y recepcion de mercancia.</p>
        </div>

        <button className="primary-button">
          <Plus size={18} />
          Nuevo producto
        </button>
      </section>

      <section className="inventory-tabs">
        {inventoryTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={inventoryView === tab.id ? 'inventory-tab active' : 'inventory-tab'}
              onClick={() => setInventoryView(tab.id)}
            >
              <Icon size={18} />
              {tab.name}
            </button>
          )
        })}
      </section>

      {inventoryView === 'summary' && <InventorySummary />}
      {inventoryView === 'products' && <InventoryProducts />}
      {inventoryView === 'categories' && <InventoryCategories />}
      {inventoryView === 'warehouses' && <InventoryWarehouses />}
      {inventoryView === 'movements' && <InventoryMovements />}
      {inventoryView === 'receiving' && <InventoryReceiving />}
      {inventoryView === 'lots' && <InventoryLotsSeries />}
      {inventoryView === 'locations' && <InventoryLocationsWarehouses />}
      {inventoryView === 'variants' && <InventoryVariantsKits />}
      {inventoryView === 'codes' && <InventoryCodesRFID />}
      {inventoryView === 'putaway' && <InventoryPutawayStrategies />}
      {inventoryView === 'dispatch' && <InventoryDispatchMethods />}
      {inventoryView === 'picking' && <InventoryPickingRoutes />}
      {inventoryView === 'reorder' && <InventoryReorderSafetyStock />}
      {advancedInventorySections
        .filter((section) => section.id !== 'lots' && section.id !== 'locations' && section.id !== 'variants' && section.id !== 'codes' && section.id !== 'putaway' && section.id !== 'dispatch' && section.id !== 'picking' && section.id !== 'reorder')
        .map((section) =>
          inventoryView === section.id ? (
            <InventoryAdvancedSection key={section.id} section={section.id} />
          ) : null
        )}
    </main>
  )
}

function InventorySummary() {
  return (
    <>
      <section className="inventory-summary-grid">
        {inventoryCards.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.title} className="card inventory-summary-card">
              <div className={`inventory-card-icon ${colorClass(item.color)}`}>
                <Icon size={25} />
              </div>
              <div>
                <p>{item.title}</p>
                <h3>{item.value}</h3>
                <span>{item.text}</span>
              </div>
            </div>
          )
        })}
      </section>

      <section className="inventory-layout">
        <div className="card inventory-table-card">
          <div className="card-header">
            <h3>Productos recientes</h3>
            <button>Exportar</button>
          </div>

          <InventoryProductTable />
        </div>

        <div className="card inventory-actions-card">
          <h3>Acciones de inventario</h3>

          <div className="inventory-actions-grid">
            {inventoryActions.map((action) => {
              const Icon = action.icon
              return (
                <button key={action.name} className={colorClass(action.color)}>
                  <Icon size={23} />
                  <span>{action.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}

function InventoryProducts() {
  const [products, setProducts] = useState(inventoryProducts)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [newProduct, setNewProduct] = useState({
    code: '',
    barcode: '',
    name: '',
    category: '',
    unit: 'Unidad',
    boxQty: '',
    stock: '',
    min: '',
    warehouse: '',
    expiryDate: '',
    status: 'Disponible',
  })

  const filteredProducts = products.filter((product) => {
    const search = searchTerm.toLowerCase()

    return (
      product.code.toLowerCase().includes(search) ||
      String(product.barcode || '').toLowerCase().includes(search) ||
      product.name.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search) ||
      String(product.unit || '').toLowerCase().includes(search) ||
      String(product.expiryDate || '').toLowerCase().includes(search) ||
      product.warehouse.toLowerCase().includes(search) ||
      product.status.toLowerCase().includes(search)
    )
  })

  const handleInputChange = (field, value) => {
    setNewProduct((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const resetForm = () => {
    setNewProduct({
      code: '',
      barcode: '',
      name: '',
      category: '',
      unit: 'Unidad',
      boxQty: '',
      stock: '',
      min: '',
      warehouse: '',
      expiryDate: '',
      status: 'Disponible',
    })
  }

  const handleCreateProduct = (event) => {
    event.preventDefault()

    if (!newProduct.code || !newProduct.name || !newProduct.category) {
      alert('Debes completar codigo, producto y categoria.')
      return
    }

    const stock = Number(newProduct.stock || 0)
    const min = Number(newProduct.min || 0)

    const productToCreate = {
      code: newProduct.code,
      barcode: newProduct.barcode || 'Sin codigo',
      name: newProduct.name,
      category: newProduct.category,
      unit: newProduct.unit || 'Unidad',
      boxQty: Number(newProduct.boxQty || 1),
      stock,
      min,
      warehouse: newProduct.warehouse || 'Principal',
      expiryDate: newProduct.expiryDate || 'No aplica',
      status: stock <= min ? 'Stock bajo' : newProduct.status,
    }

    setProducts((currentProducts) => [productToCreate, ...currentProducts])
    resetForm()
    setShowForm(false)
  }

  const downloadExcelTemplate = () => {
    const templateData = [
      {
        Codigo: 'PRO-006',
        CodigoBarra: '7460010010067',
        Producto: 'Nombre del producto',
        Categoria: 'Categoria',
        UnidadMedida: 'Unidad',
        CantidadPorCaja: 1,
        Stock: 0,
        Minimo: 0,
        Almacen: 'Principal',
        FechaVencimiento: 'No aplica',
        Estado: 'Disponible',
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos')
    XLSX.writeFile(workbook, 'plantilla_productos_inve_fat.xlsx')
  }

  const importExcelProducts = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    const reader = new FileReader()

    reader.onload = (loadEvent) => {
      try {
        const data = new Uint8Array(loadEvent.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(worksheet)

        const importedProducts = rows
          .map((row, index) => {
            const stock = Number(row.Stock || 0)
            const min = Number(row.Minimo || 0)

            return {
              code: String(row.Codigo || `IMP-${Date.now()}-${index}`),
              barcode: String(row.CodigoBarra || row.Codigo_Barra || row.Barcode || 'Sin codigo'),
              name: String(row.Producto || '').trim(),
              category: String(row.Categoria || 'Sin categoria'),
              unit: String(row.UnidadMedida || row.Unidad || 'Unidad'),
              boxQty: Number(row.CantidadPorCaja || row.Cantidad_Caja || row.PorCaja || 1),
              stock,
              min,
              warehouse: String(row.Almacen || 'Principal'),
              expiryDate: String(row.FechaVencimiento || row.Vencimiento || 'No aplica'),
              status: String(row.Estado || (stock <= min ? 'Stock bajo' : 'Disponible')),
            }
          })
          .filter((product) => product.name)

        if (importedProducts.length === 0) {
          alert('No se encontraron productos validos en el archivo.')
          return
        }

        setProducts((currentProducts) => [...importedProducts, ...currentProducts])
        alert(`Se importaron ${importedProducts.length} productos correctamente.`)
      } catch (error) {
        alert('No se pudo leer el archivo Excel. Verifica que uses la plantilla correcta.')
      }

      event.target.value = ''
    }

    reader.readAsArrayBuffer(file)
  }

  return (
    <section className="card inventory-full-card">
      <div className="inventory-toolbar product-toolbar">
        <div>
          <h3>Productos</h3>
          <p>Gestiona productos individuales o crea productos de forma masiva usando una plantilla Excel.</p>
        </div>

        <div className="inventory-toolbar-actions product-toolbar-actions">
          <div className="product-search-box">
            <Search size={18} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar codigo, barra, producto, categoria, unidad..."
            />
          </div>

          <button className="secondary-button" onClick={downloadExcelTemplate}>
            <Download size={16} />
            Plantilla Excel
          </button>

          <label className="secondary-button import-button">
            <Upload size={16} />
            Importar Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={importExcelProducts}
              hidden
            />
          </label>

          <button className="primary-button small" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Agregar producto
          </button>
        </div>
      </div>

      <div className="bulk-import-info">
        <div className="bulk-import-icon">
          <FileSpreadsheet size={24} />
        </div>

        <div>
          <h4>Creacion masiva desde Excel</h4>
          <p>
            La plantilla incluye codigo de barra, unidad de medida, cantidad por caja y fecha de vencimiento.
          </p>
        </div>
      </div>

      {showForm && (
        <form className="product-form-card" onSubmit={handleCreateProduct}>
          <div className="product-form-header">
            <div>
              <h4>Agregar nuevo producto</h4>
              <p>Completa los datos principales, logistica, unidad y vencimiento del producto.</p>
            </div>

            <button type="button" className="close-form-button" onClick={() => setShowForm(false)}>
              <XCircle size={22} />
            </button>
          </div>

          <div className="product-form-grid product-form-grid-expanded">
            <label>
              Codigo interno
              <input
                value={newProduct.code}
                onChange={(event) => handleInputChange('code', event.target.value)}
                placeholder="Ej: PRO-006"
              />
            </label>

            <label>
              Codigo de barra
              <input
                value={newProduct.barcode}
                onChange={(event) => handleInputChange('barcode', event.target.value)}
                placeholder="Ej: 7460010010067"
              />
            </label>

            <label className="product-name-field">
              Nombre del producto
              <input
                value={newProduct.name}
                onChange={(event) => handleInputChange('name', event.target.value)}
                placeholder="Ej: Monitor Dell 24"
              />
            </label>

            <label>
              Categoria
              <input
                value={newProduct.category}
                onChange={(event) => handleInputChange('category', event.target.value)}
                placeholder="Ej: Tecnologia"
              />
            </label>

            <label>
              Unidad de medida
              <select
                value={newProduct.unit}
                onChange={(event) => handleInputChange('unit', event.target.value)}
              >
                <option>Unidad</option>
                <option>Caja</option>
                <option>Paquete</option>
                <option>Libra</option>
                <option>Kilo</option>
                <option>Galon</option>
                <option>Litro</option>
                <option>Metro</option>
                <option>Docena</option>
                <option>Fardo</option>
              </select>
            </label>

            <label>
              Cantidad por caja
              <input
                type="number"
                value={newProduct.boxQty}
                onChange={(event) => handleInputChange('boxQty', event.target.value)}
                placeholder="Ej: 12"
              />
            </label>

            <label>
              Stock actual
              <input
                type="number"
                value={newProduct.stock}
                onChange={(event) => handleInputChange('stock', event.target.value)}
                placeholder="0"
              />
            </label>

            <label>
              Stock minimo
              <input
                type="number"
                value={newProduct.min}
                onChange={(event) => handleInputChange('min', event.target.value)}
                placeholder="0"
              />
            </label>

            <label>
              Almacen
              <input
                value={newProduct.warehouse}
                onChange={(event) => handleInputChange('warehouse', event.target.value)}
                placeholder="Principal"
              />
            </label>

            <label>
              Fecha de vencimiento
              <input
                type="date"
                value={newProduct.expiryDate}
                onChange={(event) => handleInputChange('expiryDate', event.target.value)}
              />
            </label>

            <label>
              Estado
              <select
                value={newProduct.status}
                onChange={(event) => handleInputChange('status', event.target.value)}
              >
                <option>Disponible</option>
                <option>Stock bajo</option>
                <option>Inactivo</option>
              </select>
            </label>
          </div>

          <div className="product-form-actions">
            <button type="button" className="secondary-button" onClick={resetForm}>
              Limpiar
            </button>

            <button type="submit" className="primary-button small">
              <Save size={16} />
              Guardar producto
            </button>
          </div>
        </form>
      )}

      <div className="product-results">
        <span>
          Mostrando {filteredProducts.length} de {products.length} productos
        </span>
      </div>

      <InventoryProductTable products={filteredProducts} />
    </section>
  )
}

function InventoryProductTable({ products = inventoryProducts }) {
  return (
    <div className="inventory-table product-table-expanded">
      <div className="inventory-table-head">
        <span>Codigo</span>
        <span>Barra</span>
        <span>Producto</span>
        <span>Categoria</span>
        <span>Unidad</span>
        <span>Caja</span>
        <span>Stock</span>
        <span>Minimo</span>
        <span>Vence</span>
        <span>Almacen</span>
        <span>Estado</span>
      </div>

      {products.map((product) => (
        <div key={`${product.code}-${product.name}`} className="inventory-table-row">
          <span>{product.code}</span>
          <span>{product.barcode || 'Sin codigo'}</span>
          <strong>{product.name}</strong>
          <span>{product.category}</span>
          <span>{product.unit || 'Unidad'}</span>
          <span>{product.boxQty || 1}</span>
          <span>{product.stock}</span>
          <span>{product.min}</span>
          <span>{product.expiryDate || 'No aplica'}</span>
          <span>{product.warehouse}</span>
          <b className={product.status === 'Stock bajo' ? 'status-low' : 'status-ok'}>
            {product.status}
          </b>
        </div>
      ))}

      {products.length === 0 && (
        <div className="empty-products">
          No se encontraron productos con esa busqueda.
        </div>
      )}
    </div>
  )
}

function InventoryCategories() {
  const categories = [
    { name: 'Tecnologia', products: 320, color: 'blue' },
    { name: 'Accesorios', products: 480, color: 'orange' },
    { name: 'Audio', products: 155, color: 'purple' },
    { name: 'Oficina', products: 210, color: 'green' },
    { name: 'Ferreteria', products: 80, color: 'amber' },
    { name: 'Limpieza', products: 65, color: 'cyan' },
  ]

  return (
    <section className="card inventory-full-card">
      <div className="inventory-toolbar">
        <div>
          <h3>Categorias</h3>
          <p>Organiza tus productos por familias, departamentos o lineas.</p>
        </div>

        <button className="primary-button small">
          <Plus size={16} />
          Nueva categoria
        </button>
      </div>

      <div className="inventory-category-grid">
        {categories.map((category) => (
          <div key={category.name} className="inventory-category-card">
            <div className={`inventory-card-icon ${colorClass(category.color)}`}>
              <Layers size={24} />
            </div>
            <h4>{category.name}</h4>
            <p>{category.products} productos</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function InventoryWarehouses() {
  const warehouses = [
    { name: 'Almacen Principal', location: 'Sucursal Central', products: 860, status: 'Activo' },
    { name: 'Almacen 2', location: 'Zona Norte', products: 250, status: 'Activo' },
    { name: 'Almacen 3', location: 'Zona Este', products: 95, status: 'Activo' },
    { name: 'Transito', location: 'Mercancia pendiente', products: 40, status: 'Revision' },
  ]

  return (
    <section className="card inventory-full-card">
      <div className="inventory-toolbar">
        <div>
          <h3>Almacenes</h3>
          <p>Controla sucursales, ubicaciones internas y disponibilidad por almacen.</p>
        </div>

        <button className="primary-button small">
          <Plus size={16} />
          Nuevo almacen
        </button>
      </div>

      <div className="warehouse-grid">
        {warehouses.map((warehouse) => (
          <div key={warehouse.name} className="warehouse-card">
            <div className="warehouse-card-top">
              <div className="inventory-card-icon soft-blue">
                <Warehouse size={24} />
              </div>
              <span className={warehouse.status === 'Activo' ? 'status-ok' : 'status-low'}>
                {warehouse.status}
              </span>
            </div>

            <h4>{warehouse.name}</h4>
            <p>{warehouse.location}</p>
            <strong>{warehouse.products} productos</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

function InventoryMovements() {
  const movements = [
    { date: '14/05/2026', type: 'Entrada', product: 'Laptop HP Pavilion', qty: '+15', user: 'Administrador' },
    { date: '14/05/2026', type: 'Salida', product: 'Mouse Inalambrico Logitech', qty: '-8', user: 'Administrador' },
    { date: '13/05/2026', type: 'Ajuste', product: 'Monitor Samsung 24"', qty: '+4', user: 'Supervisor' },
    { date: '13/05/2026', type: 'Transferencia', product: 'Teclado Mecanico RGB', qty: '-10', user: 'Almacen' },
  ]

  return (
    <section className="card inventory-full-card">
      <div className="inventory-toolbar">
        <div>
          <h3>Movimientos de inventario</h3>
          <p>Historial de entradas, salidas, transferencias y ajustes.</p>
        </div>

        <button className="secondary-button">Exportar movimientos</button>
      </div>

      <div className="movement-list">
        {movements.map((movement, index) => (
          <div key={index} className="movement-row">
            <div className={movement.type === 'Salida' ? 'movement-icon out' : 'movement-icon in'}>
              <ArrowLeftRight size={20} />
            </div>

            <div>
              <h4>{movement.product}</h4>
              <p>{movement.type} - {movement.date} - {movement.user}</p>
            </div>

            <strong className={movement.qty.includes('-') ? 'negative' : 'positive'}>
              {movement.qty}
            </strong>
          </div>
        ))}
      </div>
    </section>
  )
}

function InventoryReceiving() {
  return (
    <section className="card inventory-full-card">
      <div className="inventory-toolbar">
        <div>
          <h3>Recepcion de mercancia</h3>
          <p>Registra productos recibidos, cantidades, proveedor, almacen y observaciones.</p>
        </div>

        <button className="primary-button small">
          <Plus size={16} />
          Nueva recepcion
        </button>
      </div>

      <div className="receiving-layout">
        <div className="receiving-form-preview">
          <h4>Formulario de recepcion</h4>

          <div className="form-grid-preview">
            <label>Proveedor</label>
            <div>Seleccionar proveedor</div>

            <label>Almacen destino</label>
            <div>Almacen principal</div>

            <label>No. orden de compra</label>
            <div>OC-000245</div>

            <label>Fecha de recepcion</label>
            <div>14/05/2026</div>
          </div>
        </div>

        <div className="receiving-info-card soft-orange">
          <ClipboardList size={34} />
          <h4>Proxima mejora</h4>
          <p>Aqui crearemos el formulario real para recibir mercancia y generar PDF.</p>
        </div>
      </div>
    </section>
  )
}

function SalesModule() {
  const [salesView, setSalesView] = useState('summary')
  const [searchTerm, setSearchTerm] = useState('')
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)

  const [invoices, setInvoices] = useState([
    {
      number: 'FAC-0001',
      customer: 'Colegio San Miguel',
      date: '14/05/2026',
      total: 18500,
      payment: 'Transferencia',
      status: 'Pagada',
    },
    {
      number: 'FAC-0002',
      customer: 'Comercial La Fe',
      date: '14/05/2026',
      total: 7250,
      payment: 'Efectivo',
      status: 'Pagada',
    },
    {
      number: 'FAC-0003',
      customer: 'Distribuidora Gomez',
      date: '13/05/2026',
      total: 34200,
      payment: 'Credito',
      status: 'Pendiente',
    },
    {
      number: 'FAC-0004',
      customer: 'Ferreteria Central',
      date: '13/05/2026',
      total: 12800,
      payment: 'Tarjeta',
      status: 'Pagada',
    },
  ])

  const [clients, setClients] = useState(salesClientsData)

  const [newInvoice, setNewInvoice] = useState({
    clientCode: '',
    product: '',
    quantity: '',
    price: '',
    payment: 'Efectivo',
    status: 'Pagada',
  })

  const salesTabs = [
    { id: 'summary', name: 'Resumen', icon: Gauge },
    { id: 'invoices', name: 'Facturas', icon: Receipt },
    { id: 'quotes', name: 'Cotizaciones', icon: FileText },
    { id: 'customers', name: 'Clientes', icon: Users },
    { id: 'pos', name: 'POS / Caja', icon: Calculator },
    { id: 'receivables', name: 'Cuentas por cobrar', icon: Wallet },
  ]

  const filteredInvoices = invoices.filter((invoice) => {
    const search = searchTerm.toLowerCase()

    return (
      invoice.number.toLowerCase().includes(search) ||
      invoice.customer.toLowerCase().includes(search) ||
      invoice.date.toLowerCase().includes(search) ||
      invoice.payment.toLowerCase().includes(search) ||
      invoice.status.toLowerCase().includes(search)
    )
  })

  const totalSales = invoices.reduce((sum, invoice) => sum + invoice.total, 0)
  const pendingSales = invoices
    .filter((invoice) => invoice.status === 'Pendiente')
    .reduce((sum, invoice) => sum + invoice.total, 0)

  const handleInvoiceChange = (field, value) => {
    setNewInvoice((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const resetInvoiceForm = () => {
    setNewInvoice({
      clientCode: '',
      product: '',
      quantity: '',
      price: '',
      payment: 'Efectivo',
      status: 'Pagada',
    })
  }

  const handleCreateInvoice = (event) => {
    event.preventDefault()

    const selectedClient = clients.find((client) => client.code === newInvoice.clientCode)

    if (!selectedClient || !newInvoice.product || !newInvoice.quantity || !newInvoice.price) {
      alert('Debes seleccionar cliente, producto, cantidad y precio.')
      return
    }

    const quantity = Number(newInvoice.quantity || 0)
    const price = Number(newInvoice.price || 0)
    const total = quantity * price

    const invoiceToCreate = {
      number: `FAC-${String(invoices.length + 1).padStart(4, '0')}`,
      customerCode: selectedClient.code,
      customer: selectedClient.name,
      customerDocument: selectedClient.document,
      date: new Date().toLocaleDateString('es-DO'),
      total,
      payment: newInvoice.payment,
      status: newInvoice.status,
    }

    setInvoices((current) => [invoiceToCreate, ...current])

    if (newInvoice.status === 'Pendiente') {
      setClients((currentClients) =>
        currentClients.map((client) =>
          client.code === selectedClient.code
            ? { ...client, balance: Number(client.balance || 0) + total }
            : client
        )
      )
    }

    resetInvoiceForm()
    setShowInvoiceForm(false)
  }

  return (
    <main className="main-content">
      <section className="module-header">
        <div>
          <span className="module-badge">Modulo activo</span>
          <h2>Ventas</h2>
          <p>Gestiona facturas, cotizaciones, clientes, POS, pagos y cuentas por cobrar.</p>
        </div>

        <button className="primary-button" onClick={() => setShowInvoiceForm(true)}>
          <Plus size={18} />
          Nueva factura
        </button>
      </section>

      <section className="inventory-tabs sales-tabs">
        {salesTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={salesView === tab.id ? 'inventory-tab active' : 'inventory-tab'}
              onClick={() => setSalesView(tab.id)}
            >
              <Icon size={18} />
              {tab.name}
            </button>
          )
        })}
      </section>

      {salesView === 'summary' && (
        <SalesSummary
          invoices={invoices}
          totalSales={totalSales}
          pendingSales={pendingSales}
          setSalesView={setSalesView}
          setShowInvoiceForm={setShowInvoiceForm}
        />
      )}

      {salesView === 'invoices' && (
        <SalesInvoices
          invoices={filteredInvoices}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showInvoiceForm={showInvoiceForm}
          setShowInvoiceForm={setShowInvoiceForm}
          newInvoice={newInvoice}
          handleInvoiceChange={handleInvoiceChange}
          handleCreateInvoice={handleCreateInvoice}
          resetInvoiceForm={resetInvoiceForm}
        />
      )}

      {salesView === 'quotes' && <SalesSimplePage title="Cotizaciones" text="Aqui crearemos cotizaciones, conversion a factura y PDF para enviar al cliente." icon={FileText} />}
      {salesView === 'customers' && <SalesCustomers clients={clients} setClients={setClients} />}
      {salesView === 'pos' && <SalesSimplePage title="POS / Caja" text="Aqui construiremos el punto de venta rapido con lector de codigo de barra y metodos de pago." icon={Calculator} />}
      {salesView === 'receivables' && <SalesSimplePage title="Cuentas por cobrar" text="Aqui veremos facturas pendientes, vencidas, pagos parciales y estados de cuenta." icon={Wallet} />}
    </main>
  )
}

function SalesSummary({ invoices, clients, totalSales, pendingSales, setSalesView, setShowInvoiceForm }) {
  const paidInvoices = invoices.filter((invoice) => invoice.status === 'Pagada').length
  const pendingInvoices = invoices.filter((invoice) => invoice.status === 'Pendiente').length

  const salesSummaryCards = [
    { title: 'Ventas registradas', value: `RD$ ${totalSales.toLocaleString('es-DO')}`, text: 'Total general', icon: DollarSign, color: 'green' },
    { title: 'Facturas pagadas', value: paidInvoices, text: 'Completadas', icon: Receipt, color: 'blue' },
    { title: 'Pendientes de cobro', value: `RD$ ${pendingSales.toLocaleString('es-DO')}`, text: `${pendingInvoices} facturas`, icon: Wallet, color: 'red' },
    { title: 'Clientes activos', value: clients.filter((client) => client.status === 'Activo').length, text: 'Registrados', icon: Users, color: 'purple' },
  ]

  const salesActions = [
    { name: 'Nueva factura', icon: Receipt, color: 'green', action: () => setShowInvoiceForm(true) },
    { name: 'Nueva cotizacion', icon: FileText, color: 'orange', action: () => setSalesView('quotes') },
    { name: 'Nuevo cliente', icon: UserPlus, color: 'purple', action: () => setSalesView('customers') },
    { name: 'Abrir POS', icon: Calculator, color: 'blue', action: () => setSalesView('pos') },
    { name: 'Cobros pendientes', icon: Wallet, color: 'red', action: () => setSalesView('receivables') },
    { name: 'Imprimir reporte', icon: Printer, color: 'cyan', action: () => alert('Luego activaremos impresion y PDF.') },
  ]

  return (
    <>
      <section className="sales-summary-grid">
        {salesSummaryCards.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.title} className="card inventory-summary-card">
              <div className={`inventory-card-icon ${colorClass(item.color)}`}>
                <Icon size={25} />
              </div>
              <div>
                <p>{item.title}</p>
                <h3>{item.value}</h3>
                <span>{item.text}</span>
              </div>
            </div>
          )
        })}
      </section>

      <section className="sales-layout">
        <div className="card sales-table-card">
          <div className="card-header">
            <h3>Facturas recientes</h3>
            <button onClick={() => setSalesView('invoices')}>Ver facturas</button>
          </div>

          <SalesInvoiceTable invoices={invoices.slice(0, 4)} />
        </div>

        <div className="card sales-actions-card">
          <h3>Acciones de ventas</h3>

          <div className="sales-actions-grid">
            {salesActions.map((action) => {
              const Icon = action.icon
              return (
                <button key={action.name} className={colorClass(action.color)} onClick={action.action}>
                  <Icon size={23} />
                  <span>{action.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}

function SalesInvoices({
  invoices,
  clients,
  searchTerm,
  setSearchTerm,
  showInvoiceForm,
  setShowInvoiceForm,
  newInvoice,
  handleInvoiceChange,
  handleCreateInvoice,
  resetInvoiceForm,
}) {
  const selectedClient = clients.find((client) => client.code === newInvoice.clientCode)

  return (
    <section className="card inventory-full-card">
      <div className="inventory-toolbar product-toolbar">
        <div>
          <h3>Facturas</h3>
          <p>Selecciona un cliente registrado para crearle una factura.</p>
        </div>

        <div className="inventory-toolbar-actions product-toolbar-actions">
          <div className="product-search-box">
            <Search size={18} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar factura, cliente, fecha, estado..."
            />
          </div>

          <button className="secondary-button">
            <Printer size={16} />
            Imprimir
          </button>

          <button className="primary-button small" onClick={() => setShowInvoiceForm(true)}>
            <Plus size={16} />
            Nueva factura
          </button>
        </div>
      </div>

      {showInvoiceForm && (
        <form className="product-form-card" onSubmit={handleCreateInvoice}>
          <div className="product-form-header">
            <div>
              <h4>Nueva factura</h4>
              <p>Selecciona un cliente y registra los datos de la venta.</p>
            </div>

            <button type="button" className="close-form-button" onClick={() => setShowInvoiceForm(false)}>
              <XCircle size={22} />
            </button>
          </div>

          <div className="product-form-grid">
            <label className="client-name-field">
              Cliente
              <select
                value={newInvoice.clientCode}
                onChange={(event) => handleInvoiceChange('clientCode', event.target.value)}
              >
                <option value="">Seleccione un cliente</option>
                {clients.map((client) => (
                  <option key={client.code} value={client.code}>
                    {client.code} - {client.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Producto
              <input
                value={newInvoice.product}
                onChange={(event) => handleInvoiceChange('product', event.target.value)}
                placeholder="Producto vendido"
              />
            </label>

            <label>
              Cantidad
              <input
                type="number"
                value={newInvoice.quantity}
                onChange={(event) => handleInvoiceChange('quantity', event.target.value)}
                placeholder="0"
              />
            </label>

            <label>
              Precio unitario
              <input
                type="number"
                value={newInvoice.price}
                onChange={(event) => handleInvoiceChange('price', event.target.value)}
                placeholder="0"
              />
            </label>

            <label>
              Metodo de pago
              <select
                value={newInvoice.payment}
                onChange={(event) => handleInvoiceChange('payment', event.target.value)}
              >
                <option>Efectivo</option>
                <option>Tarjeta</option>
                <option>Transferencia</option>
                <option>Credito</option>
              </select>
            </label>

            <label>
              Estado
              <select
                value={newInvoice.status}
                onChange={(event) => handleInvoiceChange('status', event.target.value)}
              >
                <option>Pagada</option>
                <option>Pendiente</option>
                <option>Anulada</option>
              </select>
            </label>
          </div>

          {selectedClient && (
            <div className="selected-client-preview">
              <div>
                <span>Cliente seleccionado</span>
                <strong>{selectedClient.name}</strong>
              </div>

              <div>
                <span>RNC / Cedula</span>
                <strong>{selectedClient.document}</strong>
              </div>

              <div>
                <span>Telefono</span>
                <strong>{selectedClient.phone}</strong>
              </div>

              <div>
                <span>Balance pendiente</span>
                <strong className={selectedClient.balance > 0 ? 'negative' : 'positive'}>
                  RD$ {selectedClient.balance.toLocaleString('es-DO')}
                </strong>
              </div>
            </div>
          )}

          <div className="invoice-total-preview">
            <span>Total estimado</span>
            <strong>
              RD$ {(Number(newInvoice.quantity || 0) * Number(newInvoice.price || 0)).toLocaleString('es-DO')}
            </strong>
          </div>

          <div className="product-form-actions">
            <button type="button" className="secondary-button" onClick={resetInvoiceForm}>
              Limpiar
            </button>

            <button type="submit" className="primary-button small">
              <Save size={16} />
              Guardar factura
            </button>
          </div>
        </form>
      )}

      <div className="product-results">
        <span>Mostrando {invoices.length} facturas</span>
      </div>

      <SalesInvoiceTable invoices={invoices} />
    </section>
  )
}

function SalesInvoiceTable({ invoices }) {
  return (
    <div className="sales-table">
      <div className="sales-table-head">
        <span>No. factura</span>
        <span>Cliente</span>
        <span>Fecha</span>
        <span>Total</span>
        <span>Pago</span>
        <span>Estado</span>
        <span>Acciones</span>
      </div>

      {invoices.map((invoice) => (
        <div key={invoice.number} className="sales-table-row">
          <strong>{invoice.number}</strong>
          <span>{invoice.customer}</span>
          <span>{invoice.date}</span>
          <b>RD$ {invoice.total.toLocaleString('es-DO')}</b>
          <span>{invoice.payment}</span>
          <em className={invoice.status === 'Pagada' ? 'status-ok' : invoice.status === 'Pendiente' ? 'status-low' : 'status-neutral'}>
            {invoice.status}
          </em>
          <div className="sales-row-actions">
            <button title="Ver">
              <Eye size={16} />
            </button>
            <button title="Imprimir">
              <Printer size={16} />
            </button>
          </div>
        </div>
      ))}

      {invoices.length === 0 && (
        <div className="empty-products">
          No se encontraron facturas con esa busqueda.
        </div>
      )}
    </div>
  )
}

function SalesCustomers({ clients, setClients }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showClientForm, setShowClientForm] = useState(false)

  const [newClient, setNewClient] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    type: 'Empresa',
    creditLimit: '',
    balance: '',
    status: 'Activo',
  })

  const filteredClients = clients.filter((client) => {
    const search = searchTerm.toLowerCase()

    return (
      client.code.toLowerCase().includes(search) ||
      client.name.toLowerCase().includes(search) ||
      client.document.toLowerCase().includes(search) ||
      client.phone.toLowerCase().includes(search) ||
      client.email.toLowerCase().includes(search) ||
      client.address.toLowerCase().includes(search) ||
      client.type.toLowerCase().includes(search) ||
      client.status.toLowerCase().includes(search)
    )
  })

  const totalClients = clients.length
  const activeClients = clients.filter((client) => client.status === 'Activo').length
  const totalBalance = clients.reduce((sum, client) => sum + client.balance, 0)
  const clientsWithDebt = clients.filter((client) => client.balance > 0).length

  const handleClientChange = (field, value) => {
    setNewClient((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const resetClientForm = () => {
    setNewClient({
      name: '',
      document: '',
      phone: '',
      email: '',
      address: '',
      type: 'Empresa',
      creditLimit: '',
      balance: '',
      status: 'Activo',
    })
  }

  const handleCreateClient = (event) => {
    event.preventDefault()

    if (!newClient.name || !newClient.document || !newClient.phone) {
      alert('Debes completar nombre, RNC/Cedula y telefono.')
      return
    }

    const clientToCreate = {
      code: `CLI-${String(clients.length + 1).padStart(3, '0')}`,
      name: newClient.name,
      document: newClient.document,
      phone: newClient.phone,
      email: newClient.email || 'Sin correo',
      address: newClient.address || 'Sin direccion',
      type: newClient.type,
      creditLimit: Number(newClient.creditLimit || 0),
      balance: Number(newClient.balance || 0),
      status: newClient.status,
    }

    setClients((current) => [clientToCreate, ...current])
    resetClientForm()
    setShowClientForm(false)
  }

  return (
    <section className="card clients-full-card">
      <div className="inventory-toolbar product-toolbar">
        <div>
          <h3>Clientes</h3>
          <p>Los clientes creados aqui aparecen automaticamente al crear una factura.</p>
        </div>

        <div className="inventory-toolbar-actions product-toolbar-actions">
          <div className="product-search-box">
            <Search size={18} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar cliente, RNC, telefono, correo..."
            />
          </div>

          <button className="primary-button small" onClick={() => setShowClientForm(true)}>
            <UserPlus size={16} />
            Agregar cliente
          </button>
        </div>
      </div>

      <section className="clients-summary-grid">
        <div className="client-summary-card soft-blue">
          <Users size={24} />
          <div>
            <p>Total clientes</p>
            <h4>{totalClients}</h4>
          </div>
        </div>

        <div className="client-summary-card soft-green">
          <User size={24} />
          <div>
            <p>Clientes activos</p>
            <h4>{activeClients}</h4>
          </div>
        </div>

        <div className="client-summary-card soft-red">
          <Wallet size={24} />
          <div>
            <p>Balance pendiente</p>
            <h4>RD$ {totalBalance.toLocaleString('es-DO')}</h4>
          </div>
        </div>

        <div className="client-summary-card soft-orange">
          <CreditCard size={24} />
          <div>
            <p>Con deuda</p>
            <h4>{clientsWithDebt}</h4>
          </div>
        </div>
      </section>

      {showClientForm && (
        <form className="product-form-card" onSubmit={handleCreateClient}>
          <div className="product-form-header">
            <div>
              <h4>Agregar nuevo cliente</h4>
              <p>Este cliente quedara disponible para facturacion.</p>
            </div>

            <button type="button" className="close-form-button" onClick={() => setShowClientForm(false)}>
              <XCircle size={22} />
            </button>
          </div>

          <div className="product-form-grid client-form-grid">
            <label className="client-name-field">
              Nombre / Empresa
              <input
                value={newClient.name}
                onChange={(event) => handleClientChange('name', event.target.value)}
                placeholder="Ej: Comercial La Fe"
              />
            </label>

            <label>
              RNC / Cedula
              <input
                value={newClient.document}
                onChange={(event) => handleClientChange('document', event.target.value)}
                placeholder="Ej: 131-4567890-1"
              />
            </label>

            <label>
              Telefono
              <input
                value={newClient.phone}
                onChange={(event) => handleClientChange('phone', event.target.value)}
                placeholder="Ej: 809-000-0000"
              />
            </label>

            <label>
              Correo
              <input
                type="email"
                value={newClient.email}
                onChange={(event) => handleClientChange('email', event.target.value)}
                placeholder="cliente@correo.com"
              />
            </label>

            <label className="client-address-field">
              Direccion
              <input
                value={newClient.address}
                onChange={(event) => handleClientChange('address', event.target.value)}
                placeholder="Direccion del cliente"
              />
            </label>

            <label>
              Tipo de cliente
              <select
                value={newClient.type}
                onChange={(event) => handleClientChange('type', event.target.value)}
              >
                <option>Empresa</option>
                <option>Individual</option>
                <option>Mayorista</option>
                <option>Minorista</option>
                <option>Gobierno</option>
                <option>Escuela</option>
              </select>
            </label>

            <label>
              Limite de credito
              <input
                type="number"
                value={newClient.creditLimit}
                onChange={(event) => handleClientChange('creditLimit', event.target.value)}
                placeholder="0"
              />
            </label>

            <label>
              Balance pendiente
              <input
                type="number"
                value={newClient.balance}
                onChange={(event) => handleClientChange('balance', event.target.value)}
                placeholder="0"
              />
            </label>

            <label>
              Estado
              <select
                value={newClient.status}
                onChange={(event) => handleClientChange('status', event.target.value)}
              >
                <option>Activo</option>
                <option>Inactivo</option>
                <option>Bloqueado</option>
              </select>
            </label>
          </div>

          <div className="product-form-actions">
            <button type="button" className="secondary-button" onClick={resetClientForm}>
              Limpiar
            </button>

            <button type="submit" className="primary-button small">
              <Save size={16} />
              Guardar cliente
            </button>
          </div>
        </form>
      )}

      <div className="product-results">
        <span>Mostrando {filteredClients.length} de {clients.length} clientes</span>
      </div>

      <div className="clients-table">
        <div className="clients-table-head">
          <span>Codigo</span>
          <span>Cliente</span>
          <span>RNC/Cedula</span>
          <span>Telefono</span>
          <span>Correo</span>
          <span>Direccion</span>
          <span>Tipo</span>
          <span>Credito</span>
          <span>Balance</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {filteredClients.map((client) => (
          <div key={client.code} className="clients-table-row">
            <strong>{client.code}</strong>
            <span>{client.name}</span>
            <span>{client.document}</span>
            <span>{client.phone}</span>
            <span>{client.email}</span>
            <span>{client.address}</span>
            <span>{client.type}</span>
            <b>RD$ {client.creditLimit.toLocaleString('es-DO')}</b>
            <b className={client.balance > 0 ? 'negative' : 'positive'}>
              RD$ {client.balance.toLocaleString('es-DO')}
            </b>
            <em className={client.status === 'Activo' ? 'status-ok' : 'status-low'}>
              {client.status}
            </em>
            <div className="sales-row-actions">
              <button title="Ver cliente">
                <Eye size={16} />
              </button>
              <button title="Nueva factura">
                <Receipt size={16} />
              </button>
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="empty-products">
            No se encontraron clientes con esa busqueda.
          </div>
        )}
      </div>
    </section>
  )
}

function SalesSimplePage({ title, text, icon: Icon }) {
  return (
    <section className="card sales-simple-card">
      <div className="sales-simple-icon soft-orange">
        <Icon size={34} />
      </div>

      <h3>{title}</h3>
      <p>{text}</p>

      <button className="primary-button small">
        <Plus size={16} />
        Crear nuevo
      </button>
    </section>
  )
}


function PurchasesModuleSafe() {
  const [view, setView] = useState('summary')
  const [searchTerm, setSearchTerm] = useState('')
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [showSupplierForm, setShowSupplierForm] = useState(false)

  const [suppliers, setSuppliers] = useState([
    {
      code: 'SUP-001',
      name: 'Suplidores del Caribe',
      rnc: '131-2223334-5',
      phone: '809-555-2200',
      email: 'ventas@suplidorescaribe.com',
      address: 'Santo Domingo',
      contact: 'Carlos Perez',
      balance: 45000,
      status: 'Activo',
    },
    {
      code: 'SUP-002',
      name: 'Distribuidora Nacional',
      rnc: '130-9876543-1',
      phone: '809-444-3322',
      email: 'compras@distnacional.com',
      address: 'Santiago',
      contact: 'Maria Gomez',
      balance: 0,
      status: 'Activo',
    },
    {
      code: 'SUP-003',
      name: 'Importadora La Union',
      rnc: '132-4455667-2',
      phone: '829-777-1188',
      email: 'info@importunion.com',
      address: 'La Vega',
      contact: 'Jose Martinez',
      balance: 125000,
      status: 'Activo',
    },
  ])

  const [orders, setOrders] = useState([
    {
      number: 'OC-000001',
      supplierCode: 'SUP-001',
      supplier: 'Suplidores del Caribe',
      date: '14/05/2026',
      product: 'Agua Cristal 16.9 oz',
      quantity: 100,
      cost: 18,
      total: 1800,
      status: 'Pendiente',
      payment: 'Credito',
    },
    {
      number: 'OC-000002',
      supplierCode: 'SUP-003',
      supplier: 'Importadora La Union',
      date: '13/05/2026',
      product: 'Detergente Ace 360 g',
      quantity: 60,
      cost: 65,
      total: 3900,
      status: 'Recibida',
      payment: 'Transferencia',
    },
  ])

  const [newOrder, setNewOrder] = useState({
    supplierCode: '',
    product: '',
    quantity: '',
    cost: '',
    payment: 'Credito',
    status: 'Pendiente',
  })

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    rnc: '',
    phone: '',
    email: '',
    address: '',
    contact: '',
    balance: '',
    status: 'Activo',
  })

  const tabs = [
    { id: 'summary', name: 'Resumen', icon: Store },
    { id: 'orders', name: 'Ordenes de compra', icon: FileText },
    { id: 'suppliers', name: 'Proveedores', icon: Truck },
    { id: 'receiving', name: 'Recepcion', icon: ClipboardList },
    ...advancedInventorySections.map((section) => ({ id: section.id, name: section.tab, icon: section.icon })),
    { id: 'payables', name: 'Cuentas por pagar', icon: Wallet },
  ]

  const filteredOrders = orders.filter((order) => {
    const search = searchTerm.toLowerCase()

    return (
      order.number.toLowerCase().includes(search) ||
      order.supplier.toLowerCase().includes(search) ||
      order.product.toLowerCase().includes(search) ||
      order.status.toLowerCase().includes(search) ||
      order.payment.toLowerCase().includes(search)
    )
  })

  const filteredSuppliers = suppliers.filter((supplier) => {
    const search = searchTerm.toLowerCase()

    return (
      supplier.code.toLowerCase().includes(search) ||
      supplier.name.toLowerCase().includes(search) ||
      supplier.rnc.toLowerCase().includes(search) ||
      supplier.phone.toLowerCase().includes(search) ||
      supplier.email.toLowerCase().includes(search) ||
      supplier.status.toLowerCase().includes(search)
    )
  })

  const totalPurchases = orders.reduce((sum, order) => sum + order.total, 0)
  const pendingOrders = orders.filter((order) => order.status === 'Pendiente').length
  const receivedOrders = orders.filter((order) => order.status === 'Recibida').length
  const accountsPayable = suppliers.reduce((sum, supplier) => sum + Number(supplier.balance || 0), 0)

  const updateOrderField = (field, value) => {
    setNewOrder((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const updateSupplierField = (field, value) => {
    setNewSupplier((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const resetOrder = () => {
    setNewOrder({
      supplierCode: '',
      product: '',
      quantity: '',
      cost: '',
      payment: 'Credito',
      status: 'Pendiente',
    })
  }

  const resetSupplier = () => {
    setNewSupplier({
      name: '',
      rnc: '',
      phone: '',
      email: '',
      address: '',
      contact: '',
      balance: '',
      status: 'Activo',
    })
  }

  const createOrder = (event) => {
    event.preventDefault()

    const selectedSupplier = suppliers.find((supplier) => supplier.code === newOrder.supplierCode)

    if (!selectedSupplier || !newOrder.product || !newOrder.quantity || !newOrder.cost) {
      alert('Debes seleccionar proveedor, producto, cantidad y costo.')
      return
    }

    const quantity = Number(newOrder.quantity || 0)
    const cost = Number(newOrder.cost || 0)
    const total = quantity * cost

    const createdOrder = {
      number: `OC-${String(orders.length + 1).padStart(6, '0')}`,
      supplierCode: selectedSupplier.code,
      supplier: selectedSupplier.name,
      date: new Date().toLocaleDateString('es-DO'),
      product: newOrder.product,
      quantity,
      cost,
      total,
      status: newOrder.status,
      payment: newOrder.payment,
    }

    setOrders((current) => [createdOrder, ...current])

    if (newOrder.payment === 'Credito') {
      setSuppliers((currentSuppliers) =>
        currentSuppliers.map((supplier) =>
          supplier.code === selectedSupplier.code
            ? { ...supplier, balance: Number(supplier.balance || 0) + total }
            : supplier
        )
      )
    }

    resetOrder()
    setShowOrderForm(false)
  }

  const createSupplier = (event) => {
    event.preventDefault()

    if (!newSupplier.name || !newSupplier.rnc || !newSupplier.phone) {
      alert('Debes completar nombre, RNC y telefono.')
      return
    }

    const createdSupplier = {
      code: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
      name: newSupplier.name,
      rnc: newSupplier.rnc,
      phone: newSupplier.phone,
      email: newSupplier.email || 'Sin correo',
      address: newSupplier.address || 'Sin direccion',
      contact: newSupplier.contact || 'Sin contacto',
      balance: Number(newSupplier.balance || 0),
      status: newSupplier.status,
    }

    setSuppliers((current) => [createdSupplier, ...current])
    resetSupplier()
    setShowSupplierForm(false)
  }

  return (
    <main className="main-content">
      <section className="module-header">
        <div>
          <span className="module-badge">Modulo activo</span>
          <h2>Compras</h2>
          <p>Gestiona proveedores, ordenes de compra, recepcion de mercancia y cuentas por pagar.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setView('orders')
            setShowOrderForm(true)
          }}
        >
          <Plus size={18} />
          Nueva orden
        </button>
      </section>

      <section className="inventory-tabs purchases-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={view === tab.id ? 'inventory-tab active' : 'inventory-tab'}
              onClick={() => setView(tab.id)}
            >
              <Icon size={18} />
              {tab.name}
            </button>
          )
        })}
      </section>

      {view === 'summary' && (
        <>
          <section className="purchases-summary-grid">
            <div className="card purchases-summary-card">
              <div className="inventory-card-icon soft-blue">
                <ShoppingCart size={24} />
              </div>
              <div>
                <p>Total comprado</p>
                <h3>RD$ {totalPurchases.toLocaleString('es-DO')}</h3>
                <span>Ordenes registradas</span>
              </div>
            </div>

            <div className="card purchases-summary-card">
              <div className="inventory-card-icon soft-orange">
                <FileText size={24} />
              </div>
              <div>
                <p>Ordenes pendientes</p>
                <h3>{pendingOrders}</h3>
                <span>Esperando recepcion</span>
              </div>
            </div>

            <div className="card purchases-summary-card">
              <div className="inventory-card-icon soft-green">
                <Package size={24} />
              </div>
              <div>
                <p>Ordenes recibidas</p>
                <h3>{receivedOrders}</h3>
                <span>Mercancia recibida</span>
              </div>
            </div>

            <div className="card purchases-summary-card">
              <div className="inventory-card-icon soft-red">
                <Wallet size={24} />
              </div>
              <div>
                <p>Cuentas por pagar</p>
                <h3>RD$ {accountsPayable.toLocaleString('es-DO')}</h3>
                <span>Balance proveedores</span>
              </div>
            </div>
          </section>

          <section className="purchases-layout">
            <div className="card purchases-table-card">
              <div className="card-header">
                <h3>Ordenes recientes</h3>
                <button onClick={() => setView('orders')}>Ver todas</button>
              </div>

              <PurchasesOrderTable orders={orders.slice(0, 5)} />
            </div>

            <div className="card purchases-actions-card">
              <h3>Acciones de compras</h3>

              <button onClick={() => { setView('orders'); setShowOrderForm(true) }}>Nueva orden de compra</button>
              <button onClick={() => { setView('suppliers'); setShowSupplierForm(true) }}>Nuevo proveedor</button>
              <button onClick={() => setView('receiving')}>Recibir mercancia</button>
              <button onClick={() => setView('payables')}>Cuentas por pagar</button>
            </div>
          </section>
        </>
      )}

      {view === 'orders' && (
        <section className="card purchases-full-card">
          <div className="inventory-toolbar product-toolbar">
            <div>
              <h3>Ordenes de compra</h3>
              <p>Crea, consulta y controla las ordenes realizadas a proveedores.</p>
            </div>

            <div className="inventory-toolbar-actions product-toolbar-actions">
              <div className="product-search-box">
                <Search size={18} />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar orden, proveedor, producto..."
                />
              </div>

              <button className="primary-button small" onClick={() => setShowOrderForm(true)}>
                <Plus size={16} />
                Nueva orden
              </button>
            </div>
          </div>

          {showOrderForm && (
            <form className="product-form-card" onSubmit={createOrder}>
              <div className="product-form-header">
                <div>
                  <h4>Nueva orden de compra</h4>
                  <p>Selecciona proveedor y registra el producto solicitado.</p>
                </div>

                <button type="button" className="close-form-button" onClick={() => setShowOrderForm(false)}>
                  <XCircle size={22} />
                </button>
              </div>

              <div className="product-form-grid client-form-grid">
                <label className="client-name-field">
                  Proveedor
                  <select
                    value={newOrder.supplierCode}
                    onChange={(event) => updateOrderField('supplierCode', event.target.value)}
                  >
                    <option value="">Seleccione un proveedor</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.code} value={supplier.code}>
                        {supplier.code} - {supplier.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="client-name-field">
                  Producto solicitado
                  <input
                    value={newOrder.product}
                    onChange={(event) => updateOrderField('product', event.target.value)}
                    placeholder="Nombre del producto"
                  />
                </label>

                <label>
                  Cantidad
                  <input
                    type="number"
                    value={newOrder.quantity}
                    onChange={(event) => updateOrderField('quantity', event.target.value)}
                    placeholder="0"
                  />
                </label>

                <label>
                  Costo unitario
                  <input
                    type="number"
                    value={newOrder.cost}
                    onChange={(event) => updateOrderField('cost', event.target.value)}
                    placeholder="0"
                  />
                </label>

                <label>
                  Metodo de pago
                  <select
                    value={newOrder.payment}
                    onChange={(event) => updateOrderField('payment', event.target.value)}
                  >
                    <option>Credito</option>
                    <option>Efectivo</option>
                    <option>Transferencia</option>
                    <option>Tarjeta</option>
                  </select>
                </label>

                <label>
                  Estado
                  <select
                    value={newOrder.status}
                    onChange={(event) => updateOrderField('status', event.target.value)}
                  >
                    <option>Pendiente</option>
                    <option>Recibida</option>
                    <option>Cancelada</option>
                  </select>
                </label>
              </div>

              <div className="purchase-total-preview">
                <span>Total estimado</span>
                <strong>
                  RD$ {(Number(newOrder.quantity || 0) * Number(newOrder.cost || 0)).toLocaleString('es-DO')}
                </strong>
              </div>

              <div className="product-form-actions">
                <button type="button" className="secondary-button" onClick={resetOrder}>
                  Limpiar
                </button>

                <button type="submit" className="primary-button small">
                  <Save size={16} />
                  Guardar orden
                </button>
              </div>
            </form>
          )}

          <PurchasesOrderTable orders={filteredOrders} />
        </section>
      )}

      {view === 'suppliers' && (
        <section className="card purchases-full-card">
          <div className="inventory-toolbar product-toolbar">
            <div>
              <h3>Proveedores</h3>
              <p>Registra y controla proveedores, contactos, balances y estado.</p>
            </div>

            <div className="inventory-toolbar-actions product-toolbar-actions">
              <div className="product-search-box">
                <Search size={18} />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar proveedor, RNC, telefono..."
                />
              </div>

              <button className="primary-button small" onClick={() => setShowSupplierForm(true)}>
                <Plus size={16} />
                Nuevo proveedor
              </button>
            </div>
          </div>

          {showSupplierForm && (
            <form className="product-form-card" onSubmit={createSupplier}>
              <div className="product-form-header">
                <div>
                  <h4>Nuevo proveedor</h4>
                  <p>Completa los datos principales del proveedor.</p>
                </div>

                <button type="button" className="close-form-button" onClick={() => setShowSupplierForm(false)}>
                  <XCircle size={22} />
                </button>
              </div>

              <div className="product-form-grid client-form-grid">
                <label className="client-name-field">
                  Nombre / Empresa
                  <input
                    value={newSupplier.name}
                    onChange={(event) => updateSupplierField('name', event.target.value)}
                    placeholder="Nombre del proveedor"
                  />
                </label>

                <label>
                  RNC
                  <input
                    value={newSupplier.rnc}
                    onChange={(event) => updateSupplierField('rnc', event.target.value)}
                    placeholder="RNC"
                  />
                </label>

                <label>
                  Telefono
                  <input
                    value={newSupplier.phone}
                    onChange={(event) => updateSupplierField('phone', event.target.value)}
                    placeholder="809-000-0000"
                  />
                </label>

                <label>
                  Correo
                  <input
                    value={newSupplier.email}
                    onChange={(event) => updateSupplierField('email', event.target.value)}
                    placeholder="correo@proveedor.com"
                  />
                </label>

                <label className="client-address-field">
                  Direccion
                  <input
                    value={newSupplier.address}
                    onChange={(event) => updateSupplierField('address', event.target.value)}
                    placeholder="Direccion del proveedor"
                  />
                </label>

                <label>
                  Contacto
                  <input
                    value={newSupplier.contact}
                    onChange={(event) => updateSupplierField('contact', event.target.value)}
                    placeholder="Persona contacto"
                  />
                </label>

                <label>
                  Balance inicial
                  <input
                    type="number"
                    value={newSupplier.balance}
                    onChange={(event) => updateSupplierField('balance', event.target.value)}
                    placeholder="0"
                  />
                </label>

                <label>
                  Estado
                  <select
                    value={newSupplier.status}
                    onChange={(event) => updateSupplierField('status', event.target.value)}
                  >
                    <option>Activo</option>
                    <option>Inactivo</option>
                    <option>Bloqueado</option>
                  </select>
                </label>
              </div>

              <div className="product-form-actions">
                <button type="button" className="secondary-button" onClick={resetSupplier}>
                  Limpiar
                </button>

                <button type="submit" className="primary-button small">
                  <Save size={16} />
                  Guardar proveedor
                </button>
              </div>
            </form>
          )}

          <PurchasesSupplierTable suppliers={filteredSuppliers} />
        </section>
      )}

      {view === 'receiving' && (
        <section className="card purchases-receiving-card">
          <div className="purchase-placeholder-icon soft-green">
            <ClipboardList size={42} />
          </div>

          <h3>Recepcion de mercancia</h3>
          <p>
            En el siguiente paso conectaremos esta pantalla con las ordenes de compra para recibir productos,
            registrar cantidad recibida y aumentar el inventario automaticamente.
          </p>

          <button className="primary-button small" onClick={() => setView('orders')}>
            Ver ordenes pendientes
          </button>
        </section>
      )}

      {view === 'payables' && (
        <section className="card purchases-full-card">
          <div className="inventory-toolbar">
            <div>
              <h3>Cuentas por pagar</h3>
              <p>Balances pendientes por proveedor.</p>
            </div>
          </div>

          <PurchasesSupplierTable suppliers={suppliers.filter((supplier) => supplier.balance > 0)} />
        </section>
      )}
    </main>
  )
}

function PurchasesOrderTable({ orders }) {
  return (
    <div className="purchases-table">
      <div className="purchases-table-head">
        <span>No. Orden</span>
        <span>Proveedor</span>
        <span>Fecha</span>
        <span>Producto</span>
        <span>Cantidad</span>
        <span>Costo</span>
        <span>Total</span>
        <span>Pago</span>
        <span>Estado</span>
        <span>Acciones</span>
      </div>

      {orders.map((order) => (
        <div key={order.number} className="purchases-table-row">
          <strong>{order.number}</strong>
          <span>{order.supplier}</span>
          <span>{order.date}</span>
          <span>{order.product}</span>
          <span>{order.quantity}</span>
          <span>RD$ {order.cost.toLocaleString('es-DO')}</span>
          <b>RD$ {order.total.toLocaleString('es-DO')}</b>
          <span>{order.payment}</span>
          <em className={order.status === 'Recibida' ? 'status-ok' : order.status === 'Pendiente' ? 'status-low' : 'status-neutral'}>
            {order.status}
          </em>
          <div className="sales-row-actions">
            <button title="Ver orden">
              <Eye size={16} />
            </button>
            <button title="Imprimir">
              <Printer size={16} />
            </button>
          </div>
        </div>
      ))}

      {orders.length === 0 && (
        <div className="empty-products">
          No hay ordenes para mostrar.
        </div>
      )}
    </div>
  )
}

function PurchasesSupplierTable({ suppliers }) {
  return (
    <div className="suppliers-table">
      <div className="suppliers-table-head">
        <span>Codigo</span>
        <span>Proveedor</span>
        <span>RNC</span>
        <span>Telefono</span>
        <span>Correo</span>
        <span>Contacto</span>
        <span>Balance</span>
        <span>Estado</span>
        <span>Acciones</span>
      </div>

      {suppliers.map((supplier) => (
        <div key={supplier.code} className="suppliers-table-row">
          <strong>{supplier.code}</strong>
          <span>{supplier.name}</span>
          <span>{supplier.rnc}</span>
          <span>{supplier.phone}</span>
          <span>{supplier.email}</span>
          <span>{supplier.contact}</span>
          <b className={supplier.balance > 0 ? 'negative' : 'positive'}>
            RD$ {supplier.balance.toLocaleString('es-DO')}
          </b>
          <em className={supplier.status === 'Activo' ? 'status-ok' : 'status-low'}>
            {supplier.status}
          </em>
          <div className="sales-row-actions">
            <button title="Ver proveedor">
              <Eye size={16} />
            </button>
            <button title="Nueva orden">
              <FileText size={16} />
            </button>
          </div>
        </div>
      ))}

      {suppliers.length === 0 && (
        <div className="empty-products">
          No hay proveedores para mostrar.
        </div>
      )}
    </div>
  )
}


function SettingsModuleSafe() {
  const [settingsView, setSettingsView] = useState('business')
  const [businessSettings, setBusinessSettings] = useState(() => getBusinessSettings())
  const [users, setUsers] = useState(() => {
    try {
      const savedUsers = localStorage.getItem('invefat-system-users')
      return savedUsers ? JSON.parse(savedUsers) : defaultSystemUsers
    } catch (error) {
      return defaultSystemUsers
    }
  })

  const [newUser, setNewUser] = useState({
    name: '',
    role: 'Facturacion',
    email: '',
    status: 'Activo',
  })

  const settingsTabs = [
    { id: 'business', name: 'Negocio', icon: Building2 },
    { id: 'invoice', name: 'Factura', icon: Receipt },
    { id: 'appearance', name: 'Tema', icon: Moon },
    { id: 'users', name: 'Usuarios y permisos', icon: Users },
  ]

  const permissionModules = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'inventory', name: 'Inventario' },
    { id: 'sales', name: 'Ventas' },
    { id: 'purchases', name: 'Compras' },
    { id: 'accounting', name: 'Contabilidad' },
    { id: 'hr', name: 'Recursos Humanos' },
    { id: 'crm', name: 'CRM' },
    { id: 'production', name: 'Produccion' },
    { id: 'projects', name: 'Proyectos' },
    { id: 'documents', name: 'Documentos' },
    { id: 'reports', name: 'Reportes' },
    { id: 'admin', name: 'Configuracion' },
  ]

  const updateBusinessSetting = (field, value) => {
    setBusinessSettings((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const saveBusinessSettings = () => {
    localStorage.setItem('invefat-business-settings', JSON.stringify(businessSettings))

    if (businessSettings.themeMode === 'dark' || businessSettings.themeMode === 'light') {
      localStorage.setItem('invefat-theme', businessSettings.themeMode)

      const shell = document.querySelector('.app-shell')
      if (shell) {
        shell.classList.toggle('dark-theme', businessSettings.themeMode === 'dark')
      }
    }

    alert('Configuracion guardada correctamente.')
  }

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    const reader = new FileReader()

    reader.onload = (loadEvent) => {
      updateBusinessSetting('logo', loadEvent.target.result)
    }

    reader.readAsDataURL(file)
  }

  const clearLogo = () => {
    updateBusinessSetting('logo', '')
  }

  const updateUserField = (field, value) => {
    setNewUser((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const addUser = (event) => {
    event.preventDefault()

    if (!newUser.name || !newUser.email) {
      alert('Debes completar nombre y correo del usuario.')
      return
    }

    const defaultPermissions = {
      dashboard: true,
      inventory: false,
      sales: newUser.role === 'Facturacion',
      purchases: newUser.role === 'Compras',
      accounting: newUser.role === 'Contabilidad',
      hr: newUser.role === 'Recursos Humanos',
      crm: false,
      production: false,
      projects: false,
      documents: false,
      reports: false,
      admin: newUser.role === 'Administrador',
    }

    const createdUser = {
      id: `USR-${String(users.length + 1).padStart(3, '0')}`,
      ...newUser,
      permissions: newUser.role === 'Administrador'
        ? Object.fromEntries(permissionModules.map((item) => [item.id, true]))
        : defaultPermissions,
    }

    const updatedUsers = [createdUser, ...users]
    setUsers(updatedUsers)
    localStorage.setItem('invefat-system-users', JSON.stringify(updatedUsers))

    setNewUser({
      name: '',
      role: 'Facturacion',
      email: '',
      status: 'Activo',
    })
  }

  const toggleUserPermission = (userId, moduleId) => {
    const updatedUsers = users.map((user) =>
      user.id === userId
        ? {
            ...user,
            permissions: {
              ...user.permissions,
              [moduleId]: !user.permissions?.[moduleId],
            },
          }
        : user
    )

    setUsers(updatedUsers)
    localStorage.setItem('invefat-system-users', JSON.stringify(updatedUsers))
  }

  const saveUsers = () => {
    localStorage.setItem('invefat-system-users', JSON.stringify(users))
    alert('Usuarios y permisos guardados correctamente.')
  }

  return (
    <main className="main-content">
      <section className="module-header">
        <div>
          <span className="module-badge">Modulo activo</span>
          <h2>Configuracion del sistema</h2>
          <p>Personaliza el negocio, factura, logo, tema visual, usuarios y permisos del sistema.</p>
        </div>

        <button className="primary-button" onClick={saveBusinessSettings}>
          <Save size={18} />
          Guardar configuracion
        </button>
      </section>

      <section className="inventory-tabs settings-tabs">
        {settingsTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={settingsView === tab.id ? 'inventory-tab active' : 'inventory-tab'}
              onClick={() => setSettingsView(tab.id)}
            >
              <Icon size={18} />
              {tab.name}
            </button>
          )
        })}
      </section>

      {settingsView === 'business' && (
        <section className="settings-layout">
          <div className="card settings-form-card">
            <div className="settings-card-header">
              <h3>Datos del negocio</h3>
              <p>Estos datos apareceran en tus facturas, cotizaciones y documentos.</p>
            </div>

            <div className="settings-form-grid">
              <label>
                Nombre del negocio
                <input
                  value={businessSettings.businessName}
                  onChange={(event) => updateBusinessSetting('businessName', event.target.value)}
                  placeholder="Nombre completo del negocio"
                />
              </label>

              <label>
                Nombre corto
                <input
                  value={businessSettings.businessShortName}
                  onChange={(event) => updateBusinessSetting('businessShortName', event.target.value)}
                  placeholder="Ej: INVE-FAT"
                />
              </label>

              <label>
                Etiqueta / sistema
                <input
                  value={businessSettings.systemLabel}
                  onChange={(event) => updateBusinessSetting('systemLabel', event.target.value)}
                  placeholder="Ej: SYSTEM"
                />
              </label>

              <label>
                RNC
                <input
                  value={businessSettings.rnc}
                  onChange={(event) => updateBusinessSetting('rnc', event.target.value)}
                  placeholder="RNC del negocio"
                />
              </label>

              <label>
                Telefono
                <input
                  value={businessSettings.phone}
                  onChange={(event) => updateBusinessSetting('phone', event.target.value)}
                  placeholder="Telefono"
                />
              </label>

              <label>
                Correo
                <input
                  value={businessSettings.email}
                  onChange={(event) => updateBusinessSetting('email', event.target.value)}
                  placeholder="Correo"
                />
              </label>

              <label className="settings-wide-field">
                Eslogan / descripcion
                <input
                  value={businessSettings.slogan}
                  onChange={(event) => updateBusinessSetting('slogan', event.target.value)}
                  placeholder="Descripcion del negocio"
                />
              </label>

              <label className="settings-wide-field">
                Direccion
                <input
                  value={businessSettings.address}
                  onChange={(event) => updateBusinessSetting('address', event.target.value)}
                  placeholder="Direccion del negocio"
                />
              </label>
            </div>

            <div className="settings-actions-row">
              <button className="primary-button small" onClick={saveBusinessSettings}>
                <Save size={16} />
                Guardar datos
              </button>
            </div>
          </div>

          <div className="card settings-preview-card">
            <h3>Vista del negocio</h3>

            <div className="business-preview-logo">
              {businessSettings.logo ? (
                <img src={businessSettings.logo} alt="Logo del negocio" />
              ) : (
                <span>{businessSettings.businessShortName.charAt(0) || 'N'}</span>
              )}
            </div>

            <strong>{businessSettings.businessName}</strong>
            <p>{businessSettings.slogan}</p>

            <div className="business-preview-list">
              <span>RNC: {businessSettings.rnc}</span>
              <span>Tel: {businessSettings.phone}</span>
              <span>Email: {businessSettings.email}</span>
              <span>{businessSettings.address}</span>
            </div>
          </div>
        </section>
      )}

      {settingsView === 'invoice' && (
        <section className="settings-layout">
          <div className="card settings-form-card">
            <div className="settings-card-header">
              <h3>Configuracion de factura</h3>
              <p>Sube el logo y elige el modelo visual para tus documentos.</p>
            </div>

            <div className="logo-upload-card">
              <div className="logo-upload-preview">
                {businessSettings.logo ? (
                  <img src={businessSettings.logo} alt="Logo" />
                ) : (
                  <span>{businessSettings.businessShortName.charAt(0) || 'L'}</span>
                )}
              </div>

              <div>
                <h4>Logo del negocio</h4>
                <p>Este logo saldra en la factura profesional y otros documentos.</p>

                <div className="logo-upload-actions">
                  <label className="secondary-button">
                    <Upload size={16} />
                    Subir logo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} hidden />
                  </label>

                  <button className="secondary-button" onClick={clearLogo}>
                    Quitar logo
                  </button>
                </div>
              </div>
            </div>

            <div className="invoice-template-grid">
              <button
                className={businessSettings.invoiceTemplate === 'elegante' ? 'active' : ''}
                onClick={() => updateBusinessSetting('invoiceTemplate', 'elegante')}
              >
                <strong>Elegante</strong>
                <span>Factura profesional con encabezado amplio.</span>
              </button>

              <button
                className={businessSettings.invoiceTemplate === 'moderna' ? 'active' : ''}
                onClick={() => updateBusinessSetting('invoiceTemplate', 'moderna')}
              >
                <strong>Moderna</strong>
                <span>Diseno mas compacto y comercial.</span>
              </button>

              <button
                className={businessSettings.invoiceTemplate === 'simple' ? 'active' : ''}
                onClick={() => updateBusinessSetting('invoiceTemplate', 'simple')}
              >
                <strong>Simple</strong>
                <span>Formato limpio para impresion rapida.</span>
              </button>
            </div>

            <div className="settings-actions-row">
              <button className="primary-button small" onClick={saveBusinessSettings}>
                <Save size={16} />
                Guardar factura
              </button>
            </div>
          </div>

          <div className="card invoice-config-preview">
            <h3>Vista previa de factura</h3>

            <div className="invoice-preview-paper">
              <div className="invoice-preview-top">
                <div className="invoice-preview-logo">
                  {businessSettings.logo ? (
                    <img src={businessSettings.logo} alt="Logo" />
                  ) : (
                    <span>{businessSettings.businessShortName.charAt(0) || 'F'}</span>
                  )}
                </div>

                <div>
                  <strong>{businessSettings.businessName}</strong>
                  <small>{businessSettings.rnc}</small>
                </div>

                <b>FACTURA</b>
              </div>

              <div className="invoice-preview-line" />
              <div className="invoice-preview-row">
                <span>Cliente</span>
                <strong>Cliente Ejemplo</strong>
              </div>

              <div className="invoice-preview-row">
                <span>Total</span>
                <strong>RD$ 0.00</strong>
              </div>
            </div>
          </div>
        </section>
      )}

      {settingsView === 'appearance' && (
        <section className="settings-layout">
          <div className="card settings-form-card">
            <div className="settings-card-header">
              <h3>Apariencia del sistema</h3>
              <p>Cambia el tema visual del sistema para adaptarlo al estilo del negocio.</p>
            </div>

            <div className="theme-choice-grid">
              <button
                className={businessSettings.themeMode === 'light' ? 'active' : ''}
                onClick={() => updateBusinessSetting('themeMode', 'light')}
              >
                <strong>Tema claro</strong>
                <span>Fondo limpio, profesional y luminoso.</span>
              </button>

              <button
                className={businessSettings.themeMode === 'dark' ? 'active' : ''}
                onClick={() => updateBusinessSetting('themeMode', 'dark')}
              >
                <strong>Tema oscuro</strong>
                <span>Ideal para trabajo nocturno o pantallas de caja.</span>
              </button>
            </div>

            <label className="accent-color-field">
              Color principal de accion
              <input
                type="color"
                value={businessSettings.accentColor}
                onChange={(event) => updateBusinessSetting('accentColor', event.target.value)}
              />
            </label>

            <div className="settings-actions-row">
              <button className="primary-button small" onClick={saveBusinessSettings}>
                <Save size={16} />
                Aplicar tema
              </button>
            </div>
          </div>

          <div className="card theme-preview-card">
            <h3>Vista previa</h3>

            <div className="theme-preview-box">
              <div />
              <section>
                <strong>Panel del sistema</strong>
                <span>Inventario - Ventas - Compras</span>
              </section>
              <button style={{ background: businessSettings.accentColor }}>
                Accion
              </button>
            </div>
          </div>
        </section>
      )}

      {settingsView === 'users' && (
        <section className="settings-users-layout">
          <div className="card settings-form-card">
            <div className="settings-card-header">
              <h3>Usuarios del sistema</h3>
              <p>Crea usuarios y define que modulos puede ver o usar cada uno.</p>
            </div>

            <form className="settings-user-form" onSubmit={addUser}>
              <label>
                Nombre
                <input
                  value={newUser.name}
                  onChange={(event) => updateUserField('name', event.target.value)}
                  placeholder="Nombre del usuario"
                />
              </label>

              <label>
                Correo
                <input
                  value={newUser.email}
                  onChange={(event) => updateUserField('email', event.target.value)}
                  placeholder="correo@empresa.com"
                />
              </label>

              <label>
                Rol
                <select
                  value={newUser.role}
                  onChange={(event) => updateUserField('role', event.target.value)}
                >
                  <option>Administrador</option>
                  <option>Facturacion</option>
                  <option>Inventario</option>
                  <option>Compras</option>
                  <option>Contabilidad</option>
                  <option>Recursos Humanos</option>
                </select>
              </label>

              <label>
                Estado
                <select
                  value={newUser.status}
                  onChange={(event) => updateUserField('status', event.target.value)}
                >
                  <option>Activo</option>
                  <option>Inactivo</option>
                </select>
              </label>

              <button className="primary-button small" type="submit">
                <Plus size={16} />
                Agregar usuario
              </button>
            </form>
          </div>

          <div className="card permissions-card">
            <div className="settings-card-header">
              <h3>Permisos por usuario</h3>
              <p>Marca los modulos disponibles para cada usuario.</p>
            </div>

            <div className="permissions-table">
              <div className="permissions-head">
                <span>Usuario</span>
                {permissionModules.map((module) => (
                  <span key={module.id}>{module.name}</span>
                ))}
              </div>

              {users.map((user) => (
                <div key={user.id} className="permissions-row">
                  <div>
                    <strong>{user.name}</strong>
                    <small>{user.role}</small>
                  </div>

                  {permissionModules.map((module) => (
                    <label key={module.id} className="permission-check">
                      <input
                        type="checkbox"
                        checked={Boolean(user.permissions?.[module.id])}
                        onChange={() => toggleUserPermission(user.id, module.id)}
                      />
                      <span />
                    </label>
                  ))}
                </div>
              ))}
            </div>

            <div className="settings-actions-row">
              <button className="primary-button small" onClick={saveUsers}>
                <Save size={16} />
                Guardar permisos
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

function ModulePlaceholder({ activeModule }) {
  const moduleInfo = modules.find((item) => item.id === activeModule)
  const workspace = workspaceModules[activeModule]
  const [searchTerm, setSearchTerm] = useState('')

  if (!workspace) {
    return (
      <main className="main-content">
        <section className="module-header">
          <div>
            <span className="module-badge pending">En preparacion</span>
            <h2>{moduleInfo?.name || 'Modulo'}</h2>
            <p>Este modulo sera activado en el siguiente paso.</p>
          </div>
        </section>
      </main>
    )
  }

  const Icon = workspace.icon
  const search = searchTerm.toLowerCase()
  const filteredRecords = workspace.records.filter((record) =>
    [record.code, record.name, record.owner, record.date, record.amount, record.status]
      .join(' ')
      .toLowerCase()
      .includes(search)
  )

  return (
    <main className="main-content">
      <section className="module-header">
        <div>
          <span className="module-badge">{workspace.badge}</span>
          <h2>{workspace.title}</h2>
          <p>{workspace.description}</p>
        </div>

        <button className="primary-button">
          <Plus size={18} />
          Crear registro
        </button>
      </section>

      <section className="workspace-summary-grid">
        {workspace.metrics.map((metric) => (
          <div className="card workspace-summary-card" key={metric.label}>
            <div className="workspace-card-icon">
              <Icon size={22} />
            </div>
            <div>
              <p>{metric.label}</p>
              <h3>{metric.value}</h3>
              <span>{metric.note}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="workspace-layout">
        <div className="card workspace-table-card">
          <div className="workspace-panel-header">
            <div>
              <h3>Registros principales</h3>
              <p>Busca, revisa estado y da seguimiento a las operaciones del modulo.</p>
            </div>

            <div className="workspace-search">
              <Search size={17} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar registro..."
              />
            </div>
          </div>

          <div className="workspace-table">
            <div className="workspace-table-head">
              <span>Codigo</span>
              <span>Registro</span>
              <span>Area</span>
              <span>Fecha</span>
              <span>Valor</span>
              <span>Estado</span>
            </div>

            {filteredRecords.map((record) => (
              <div className="workspace-table-row" key={record.code}>
                <strong>{record.code}</strong>
                <span>{record.name}</span>
                <span>{record.owner}</span>
                <span>{record.date}</span>
                <b>{record.amount}</b>
                <em className={
                  ['Activo', 'Registrado', 'Conciliado', 'Aprobado', 'Listo', 'Pagado', 'Generado'].includes(record.status)
                    ? 'status-ok'
                    : ['Pendiente', 'Revision', 'Riesgo', 'Alerta', 'Abierto'].includes(record.status)
                      ? 'status-low'
                      : 'status-neutral'
                }>
                  {record.status}
                </em>
              </div>
            ))}

            {filteredRecords.length === 0 && (
              <div className="workspace-empty">
                No se encontraron registros con esa busqueda.
              </div>
            )}
          </div>
        </div>

        <aside className="card workspace-actions-card">
          <h3>Acciones rapidas</h3>
          <div className="workspace-actions-grid">
            {workspace.actions.map((action) => (
              <button key={action}>
                <Icon size={19} />
                {action}
              </button>
            ))}
          </div>

          <div className="workspace-note">
            <strong>Estado operativo</strong>
            <p>Modulo conectado al menu con indicadores, busqueda, registros y acciones base.</p>
          </div>
        </aside>
      </section>
    </main>
  )
}

function Content({ activeModule, setActiveModule }) {
  if (activeModule === 'dashboard') {
    return <Dashboard setActiveModule={setActiveModule} />
  }

  if (activeModule === 'inventory') {
    return <InventoryModule />
  }

  if (activeModule === 'sales') {
    return <SalesModuleSafe />
  }

  if (activeModule === 'purchases') {
    return <PurchasesModuleSafe />
  }

  if (activeModule === 'admin') {
    return <SettingsModuleSafe />
  }

  return <ModulePlaceholder activeModule={activeModule} />
}


function SalesModuleSafe() {
  const [view, setView] = useState('summary')
  const [searchTerm, setSearchTerm] = useState('')
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [showClientForm, setShowClientForm] = useState(false)

  const [clients, setClients] = useState([
    {
      code: 'CLI-001',
      name: 'Colegio San Miguel',
      document: '131-4567890-1',
      phone: '809-555-1200',
      email: 'compras@sanmiguel.com',
      address: 'Santo Domingo',
      type: 'Empresa',
      creditLimit: 150000,
      balance: 18500,
      status: 'Activo',
    },
    {
      code: 'CLI-002',
      name: 'Comercial La Fe',
      document: '001-1234567-8',
      phone: '809-444-8899',
      email: 'ventas@comercial.com',
      address: 'Santiago',
      type: 'Empresa',
      creditLimit: 80000,
      balance: 0,
      status: 'Activo',
    },
    {
      code: 'CLI-003',
      name: 'Distribuidora Gomez',
      document: '130-9876543-2',
      phone: '829-222-7744',
      email: 'info@gomez.com',
      address: 'La Vega',
      type: 'Mayorista',
      creditLimit: 250000,
      balance: 34200,
      status: 'Activo',
    },
  ])

  const [invoices, setInvoices] = useState([
    {
      number: 'FAC-0001',
      customerCode: 'CLI-001',
      customer: 'Colegio San Miguel',
      document: '131-4567890-1',
      date: '14/05/2026',
      total: 18500,
      payment: 'Transferencia',
      status: 'Pagada',
    },
    {
      number: 'FAC-0002',
      customerCode: 'CLI-003',
      customer: 'Distribuidora Gomez',
      document: '130-9876543-2',
      date: '13/05/2026',
      total: 34200,
      payment: 'Credito',
      status: 'Pendiente',
    },
  ])

  const [newInvoice, setNewInvoice] = useState({
    clientCode: '',
    product: '',
    quantity: '',
    price: '',
    payment: 'Efectivo',
    status: 'Pagada',
  })

  const [newClient, setNewClient] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    type: 'Empresa',
    creditLimit: '',
    balance: '',
    status: 'Activo',
  })

  const selectedClient = clients.find((client) => client.code === newInvoice.clientCode)

  const totalSales = invoices.reduce((sum, invoice) => sum + invoice.total, 0)
  const pendingTotal = invoices
    .filter((invoice) => invoice.status === 'Pendiente')
    .reduce((sum, invoice) => sum + invoice.total, 0)

  const filteredInvoices = invoices.filter((invoice) => {
    const search = searchTerm.toLowerCase()

    return (
      invoice.number.toLowerCase().includes(search) ||
      invoice.customer.toLowerCase().includes(search) ||
      invoice.document.toLowerCase().includes(search) ||
      invoice.status.toLowerCase().includes(search) ||
      invoice.payment.toLowerCase().includes(search)
    )
  })

  const filteredClients = clients.filter((client) => {
    const search = searchTerm.toLowerCase()

    return (
      client.code.toLowerCase().includes(search) ||
      client.name.toLowerCase().includes(search) ||
      client.document.toLowerCase().includes(search) ||
      client.phone.toLowerCase().includes(search) ||
      client.email.toLowerCase().includes(search) ||
      client.status.toLowerCase().includes(search)
    )
  })

  const updateInvoiceField = (field, value) => {
    setNewInvoice((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const updateClientField = (field, value) => {
    setNewClient((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const resetInvoice = () => {
    setNewInvoice({
      clientCode: '',
      product: '',
      quantity: '',
      price: '',
      payment: 'Efectivo',
      status: 'Pagada',
    })
  }

  const resetClient = () => {
    setNewClient({
      name: '',
      document: '',
      phone: '',
      email: '',
      address: '',
      type: 'Empresa',
      creditLimit: '',
      balance: '',
      status: 'Activo',
    })
  }

  const createInvoice = (event) => {
    event.preventDefault()

    if (!selectedClient || !newInvoice.product || !newInvoice.quantity || !newInvoice.price) {
      alert('Debes seleccionar cliente, producto, cantidad y precio.')
      return
    }

    const quantity = Number(newInvoice.quantity || 0)
    const price = Number(newInvoice.price || 0)
    const total = quantity * price

    const createdInvoice = {
      number: `FAC-${String(invoices.length + 1).padStart(4, '0')}`,
      customerCode: selectedClient.code,
      customer: selectedClient.name,
      document: selectedClient.document,
      date: new Date().toLocaleDateString('es-DO'),
      total,
      payment: newInvoice.payment,
      status: newInvoice.status,
    }

    setInvoices((current) => [createdInvoice, ...current])

    if (newInvoice.status === 'Pendiente') {
      setClients((currentClients) =>
        currentClients.map((client) =>
          client.code === selectedClient.code
            ? { ...client, balance: Number(client.balance || 0) + total }
            : client
        )
      )
    }

    resetInvoice()
    setShowInvoiceForm(false)
  }

  const createClient = (event) => {
    event.preventDefault()

    if (!newClient.name || !newClient.document || !newClient.phone) {
      alert('Debes completar nombre, RNC/Cedula y telefono.')
      return
    }

    const createdClient = {
      code: `CLI-${String(clients.length + 1).padStart(3, '0')}`,
      name: newClient.name,
      document: newClient.document,
      phone: newClient.phone,
      email: newClient.email || 'Sin correo',
      address: newClient.address || 'Sin direccion',
      type: newClient.type,
      creditLimit: Number(newClient.creditLimit || 0),
      balance: Number(newClient.balance || 0),
      status: newClient.status,
    }

    setClients((current) => [createdClient, ...current])
    resetClient()
    setShowClientForm(false)
  }

  return (
    <main className="main-content">
      <section className="module-header">
        <div>
          <span className="module-badge">Modulo activo</span>
          <h2>Ventas</h2>
          <p>Gestiona facturas, clientes, cotizaciones, POS y cuentas por cobrar.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setView('invoices')
            setShowInvoiceForm(true)
          }}
        >
          Nueva factura
        </button>
      </section>

      <section className="sales-safe-tabs">
        <button className={view === 'summary' ? 'active' : ''} onClick={() => setView('summary')}>Resumen</button>
        <button className={view === 'invoices' ? 'active' : ''} onClick={() => setView('invoices')}>Facturas</button>
        <button className={view === 'customers' ? 'active' : ''} onClick={() => setView('customers')}>Clientes</button>
        <button className={view === 'quotes' ? 'active' : ''} onClick={() => setView('quotes')}>Cotizaciones</button>
        <button className={view === 'pos' ? 'active' : ''} onClick={() => setView('pos')}>POS / Caja</button>
        <button className={view === 'receivables' ? 'active' : ''} onClick={() => setView('receivables')}>Cuentas por cobrar</button>
      </section>

      {view === 'summary' && (
        <>
          <section className="sales-safe-summary">
            <div className="card sales-safe-card">
              <p>Total ventas</p>
              <h3>RD$ {totalSales.toLocaleString('es-DO')}</h3>
              <span>Facturas registradas</span>
            </div>

            <div className="card sales-safe-card">
              <p>Facturas</p>
              <h3>{invoices.length}</h3>
              <span>Documentos creados</span>
            </div>

            <div className="card sales-safe-card">
              <p>Pendiente de cobro</p>
              <h3>RD$ {pendingTotal.toLocaleString('es-DO')}</h3>
              <span>Cuentas por cobrar</span>
            </div>

            <div className="card sales-safe-card">
              <p>Clientes</p>
              <h3>{clients.length}</h3>
              <span>Clientes registrados</span>
            </div>
          </section>

          <section className="sales-safe-layout">
            <div className="card sales-safe-panel">
              <div className="card-header">
                <h3>Facturas recientes</h3>
                <button onClick={() => setView('invoices')}>Ver todas</button>
              </div>

              <SalesSafeInvoiceTable invoices={invoices} />
            </div>

            <div className="card sales-safe-actions">
              <h3>Acciones rapidas</h3>

              <button onClick={() => { setView('invoices'); setShowInvoiceForm(true) }}>Nueva factura</button>
              <button onClick={() => { setView('customers'); setShowClientForm(true) }}>Nuevo cliente</button>
              <button onClick={() => setView('quotes')}>Nueva cotizacion</button>
              <button onClick={() => setView('pos')}>Abrir POS</button>
              <button onClick={() => setView('receivables')}>Cobros pendientes</button>
            </div>
          </section>
        </>
      )}

      {view === 'invoices' && (
        <SalesBillingProV4 clients={clients}
          setClients={setClients}
          invoices={invoices}
          setInvoices={setInvoices}
        />
      )}

      {view === 'customers' && (
        <section className="card sales-safe-full">
          <div className="inventory-toolbar product-toolbar">
            <div>
              <h3>Clientes</h3>
              <p>Los clientes creados aqui aparecen al crear una factura.</p>
            </div>

            <div className="inventory-toolbar-actions product-toolbar-actions">
              <div className="product-search-box">
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar cliente, RNC, telefono..."
                />
              </div>

              <button className="primary-button small" onClick={() => setShowClientForm(true)}>
                Agregar cliente
              </button>
            </div>
          </div>

          {showClientForm && (
            <form className="product-form-card" onSubmit={createClient}>
              <div className="product-form-header">
                <div>
                  <h4>Agregar cliente</h4>
                  <p>Este cliente quedara disponible para facturacion.</p>
                </div>

                <button type="button" className="close-form-button" onClick={() => setShowClientForm(false)}>
                  X
                </button>
              </div>

              <div className="product-form-grid client-form-grid">
                <label className="client-name-field">
                  Nombre / Empresa
                  <input
                    value={newClient.name}
                    onChange={(event) => updateClientField('name', event.target.value)}
                    placeholder="Nombre del cliente"
                  />
                </label>

                <label>
                  RNC / Cedula
                  <input
                    value={newClient.document}
                    onChange={(event) => updateClientField('document', event.target.value)}
                    placeholder="RNC o cedula"
                  />
                </label>

                <label>
                  Telefono
                  <input
                    value={newClient.phone}
                    onChange={(event) => updateClientField('phone', event.target.value)}
                    placeholder="809-000-0000"
                  />
                </label>

                <label>
                  Correo
                  <input
                    value={newClient.email}
                    onChange={(event) => updateClientField('email', event.target.value)}
                    placeholder="correo@cliente.com"
                  />
                </label>

                <label className="client-address-field">
                  Direccion
                  <input
                    value={newClient.address}
                    onChange={(event) => updateClientField('address', event.target.value)}
                    placeholder="Direccion del cliente"
                  />
                </label>

                <label>
                  Tipo
                  <select
                    value={newClient.type}
                    onChange={(event) => updateClientField('type', event.target.value)}
                  >
                    <option>Empresa</option>
                    <option>Individual</option>
                    <option>Mayorista</option>
                    <option>Minorista</option>
                    <option>Escuela</option>
                  </select>
                </label>

                <label>
                  Limite credito
                  <input
                    type="number"
                    value={newClient.creditLimit}
                    onChange={(event) => updateClientField('creditLimit', event.target.value)}
                    placeholder="0"
                  />
                </label>

                <label>
                  Balance
                  <input
                    type="number"
                    value={newClient.balance}
                    onChange={(event) => updateClientField('balance', event.target.value)}
                    placeholder="0"
                  />
                </label>

                <label>
                  Estado
                  <select
                    value={newClient.status}
                    onChange={(event) => updateClientField('status', event.target.value)}
                  >
                    <option>Activo</option>
                    <option>Inactivo</option>
                    <option>Bloqueado</option>
                  </select>
                </label>
              </div>

              <div className="product-form-actions">
                <button type="button" className="secondary-button" onClick={resetClient}>
                  Limpiar
                </button>

                <button type="submit" className="primary-button small">
                  Guardar cliente
                </button>
              </div>
            </form>
          )}

          <SalesSafeClientTable clients={filteredClients} />
        </section>
      )}

      {view === 'quotes' && <SalesQuotesModule clients={clients} />}
      {view === 'pos' && <SalesSafePlaceholder title="POS / Caja" />}
      {view === 'receivables' && <SalesSafePlaceholder title="Cuentas por cobrar" />}
    </main>
  )
}

function SalesBillingPro({ clients, setClients, invoices, setInvoices }) {
  const walkInClient = {
    code: 'CONTADO',
    name: 'Cliente de mostrador',
    document: '000-0000000-0',
    phone: 'N/A',
    balance: 0,
    status: 'Activo',
  }

  const billingProducts = [
    { code: 'AGU001', barcode: '7460001001001', name: 'Agua Cristal 16.9 oz', unit: 'Unidad', price: 25, stock: 120 },
    { code: 'COC002', barcode: '7460001001002', name: 'Coca Cola 20 oz', unit: 'Unidad', price: 50, stock: 85 },
    { code: 'PAP003', barcode: '7460001001003', name: 'Papel Higienico Elite', unit: 'Unidad', price: 120, stock: 42 },
    { code: 'DET004', barcode: '7460001001004', name: 'Detergente Ace 360 g', unit: 'Unidad', price: 85, stock: 64 },
    { code: 'PAN005', barcode: '7460001001005', name: 'Pan de Molde Bimbo', unit: 'Unidad', price: 65, stock: 38 },
    { code: 'LEC006', barcode: '7460001001006', name: 'Leche Rica 1 Litro', unit: 'Unidad', price: 75, stock: 57 },
  ]

  const [selectedClientCode, setSelectedClientCode] = useState('CONTADO')
  const [barcodeValue, setBarcodeValue] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [cart, setCart] = useState([
    { code: 'AGU001', name: 'Agua Cristal 16.9 oz', unit: 'Unidad', qty: 2, price: 25, discount: 0 },
    { code: 'COC002', name: 'Coca Cola 20 oz', unit: 'Unidad', qty: 1, price: 50, discount: 0 },
  ])
  const [paymentMethod, setPaymentMethod] = useState('Efectivo')
  const [cashReceived, setCashReceived] = useState('600')
  const [comment, setComment] = useState('')

  const selectedClient =
    selectedClientCode === 'CONTADO'
      ? walkInClient
      : clients.find((client) => client.code === selectedClientCode) || walkInClient

  const filteredProducts = billingProducts.filter((product) => {
    const search = productSearch.toLowerCase()
    return (
      product.code.toLowerCase().includes(search) ||
      product.barcode.toLowerCase().includes(search) ||
      product.name.toLowerCase().includes(search)
    )
  })

  const subtotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0)
  const discount = cart.reduce((sum, item) => sum + Number(item.discount || 0), 0)
  const taxableAmount = Math.max(subtotal - discount, 0)
  const itbis = taxableAmount * 0.18
  const total = taxableAmount + itbis
  const cashReceivedAmount = Number(cashReceived || 0)
  const change = paymentMethod === 'Efectivo' ? Math.max(cashReceivedAmount - total, 0) : 0

  const addProductToCart = (product) => {
    setCart((current) => {
      const exists = current.find((item) => item.code === product.code)

      if (exists) {
        return current.map((item) =>
          item.code === product.code ? { ...item, qty: item.qty + 1 } : item
        )
      }

      return [
        ...current,
        {
          code: product.code,
          name: product.name,
          unit: product.unit,
          qty: 1,
          price: product.price,
          discount: 0,
        },
      ]
    })
  }

  const addProductByBarcode = () => {
    const value = barcodeValue.trim().toLowerCase()

    if (!value) return

    const foundProduct = billingProducts.find(
      (product) =>
        product.barcode.toLowerCase() === value ||
        product.code.toLowerCase() === value
    )

    if (!foundProduct) {
      alert('Producto no encontrado con ese codigo.')
      return
    }

    addProductToCart(foundProduct)
    setBarcodeValue('')
  }

  const updateCartItem = (code, field, value) => {
    setCart((current) =>
      current.map((item) =>
        item.code === code
          ? {
              ...item,
              [field]: field === 'qty' || field === 'discount' ? Number(value || 0) : value,
            }
          : item
      )
    )
  }

  const increaseQty = (code) => {
    setCart((current) =>
      current.map((item) =>
        item.code === code ? { ...item, qty: item.qty + 1 } : item
      )
    )
  }

  const decreaseQty = (code) => {
    setCart((current) =>
      current.map((item) =>
        item.code === code ? { ...item, qty: Math.max(item.qty - 1, 1) } : item
      )
    )
  }

  const removeItem = (code) => {
    setCart((current) => current.filter((item) => item.code !== code))
  }

  const clearCart = () => {
    setCart([])
    setComment('')
    setCashReceived('')
  }

  const generateInvoice = () => {
    if (cart.length === 0) {
      alert('Debes agregar productos a la factura.')
      return
    }

    const invoiceStatus = paymentMethod === 'Credito' ? 'Pendiente' : 'Pagada'

    const createdInvoice = {
      number: `FAC-${String(invoices.length + 1).padStart(4, '0')}`,
      customerCode: selectedClient.code,
      customer: selectedClient.name,
      document: selectedClient.document,
      date: new Date().toLocaleDateString('es-DO'),
      total,
      payment: paymentMethod,
      status: invoiceStatus,
    }

    setInvoices((current) => [createdInvoice, ...current])

    if (invoiceStatus === 'Pendiente' && selectedClient.code !== 'CONTADO') {
      setClients((currentClients) =>
        currentClients.map((client) =>
          client.code === selectedClient.code
            ? { ...client, balance: Number(client.balance || 0) + total }
            : client
        )
      )
    }

    alert(`Factura ${createdInvoice.number} generada correctamente.`)
    clearCart()
  }

  return (
    <section className="billing-page">
      <div className="billing-main">
        <div className="billing-title">
          <div>
            <h3>Ventas / Facturacion</h3>
            <p>Escanea productos, confirma el pago y genera la factura.</p>
          </div>

          <button className="primary-button small" onClick={generateInvoice}>
            Generar factura
          </button>
        </div>

        <section className="billing-tools">
          <div className="barcode-box">
            <div className="barcode-icon">
              <ScanBarcode size={30} />
            </div>

            <div>
              <strong>Escanear codigo de barra</strong>
              <span>Pasa el codigo por el lector o escribelo manualmente</span>
            </div>

            <input
              value={barcodeValue}
              onChange={(event) => setBarcodeValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addProductByBarcode()
                }
              }}
              placeholder="Codigo..."
            />

            <button onClick={addProductByBarcode}>Agregar</button>
          </div>

          <div className="product-finder">
            <label>Buscar producto por nombre o codigo</label>
            <div>
              <input
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Ej: Coca Cola o COC002"
              />
              <Search size={18} />
            </div>
          </div>
        </section>

        <section className="frequent-products-card">
          <div className="card-header">
            <h3>Productos frecuentes</h3>
            <button>Ver todos</button>
          </div>

          <div className="frequent-products-grid">
            {filteredProducts.map((product) => (
              <button key={product.code} onClick={() => addProductToCart(product)}>
                <span className="product-mini-img">{product.name.charAt(0)}</span>
                <strong>{product.name}</strong>
                <small>{product.code}</small>
                <b>RD$ {product.price.toFixed(2)}</b>
              </button>
            ))}
          </div>
        </section>

        <section className="billing-detail-card">
          <div className="card-header">
            <h3>Detalle de la factura ({cart.length})</h3>
            <button onClick={clearCart}>Limpiar todo</button>
          </div>

          <div className="billing-detail-table">
            <div className="billing-detail-head">
              <span>Codigo</span>
              <span>Producto</span>
              <span>Cantidad</span>
              <span>Precio unit.</span>
              <span>Descuento</span>
              <span>Total</span>
              <span></span>
            </div>

            {cart.map((item) => (
              <div key={item.code} className="billing-detail-row">
                <strong>{item.code}</strong>

                <div>
                  <b>{item.name}</b>
                  <small>{item.unit}</small>
                </div>

                <div className="qty-control">
                  <button onClick={() => decreaseQty(item.code)}>-</button>
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(event) => updateCartItem(item.code, 'qty', event.target.value)}
                  />
                  <button onClick={() => increaseQty(item.code)}>+</button>
                </div>

                <span>RD$ {item.price.toFixed(2)}</span>

                <input
                  className="discount-input"
                  type="number"
                  value={item.discount}
                  onChange={(event) => updateCartItem(item.code, 'discount', event.target.value)}
                />

                <b>RD$ {Math.max(item.qty * item.price - Number(item.discount || 0), 0).toFixed(2)}</b>

                <button className="remove-line" onClick={() => removeItem(item.code)}>X</button>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="empty-cart">
                Escanea o busca productos para agregarlos a la factura.
              </div>
            )}
          </div>

          <div className="billing-footer-actions">
            <button className="secondary-button">Guardar como cotizacion</button>
            <button className="secondary-button">Agregar comentario</button>
          </div>

          <textarea
            className="invoice-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Comentario u observacion de la factura..."
          />
        </section>
      </div>

      <aside className="billing-side">
        <section className="billing-side-card">
          <h3>Cliente</h3>

          <div className="client-select-row">
            <select
              value={selectedClientCode}
              onChange={(event) => setSelectedClientCode(event.target.value)}
            >
              <option value="CONTADO">Cliente de mostrador</option>
              {clients.map((client) => (
                <option key={client.code} value={client.code}>
                  {client.code} - {client.name}
                </option>
              ))}
            </select>

            <button>
              <UserPlus size={18} />
            </button>
          </div>

          <div className="billing-client-card">
            <div className="billing-client-avatar">
              {selectedClient.name.charAt(0)}
            </div>

            <div>
              <strong>{selectedClient.name}</strong>
              <span>RNC/Cedula: {selectedClient.document}</span>
              <span>Tipo: {selectedClient.code === 'CONTADO' ? 'Consumidor final' : selectedClient.type}</span>
            </div>

            <em>{paymentMethod === 'Credito' ? 'Credito' : 'Contado'}</em>
          </div>
        </section>

        <section className="billing-side-card totals-card">
          <div>
            <span>Subtotal</span>
            <strong>RD$ {subtotal.toFixed(2)}</strong>
          </div>

          <div>
            <span>Descuento</span>
            <strong className="negative">- RD$ {discount.toFixed(2)}</strong>
          </div>

          <div>
            <span>ITBIS (18%)</span>
            <strong>RD$ {itbis.toFixed(2)}</strong>
          </div>

          <hr />

          <div className="grand-total">
            <span>Total general</span>
            <strong>RD$ {total.toFixed(2)}</strong>
          </div>
        </section>

        <section className="billing-side-card">
          <h3>Metodo de pago</h3>

          <div className="payment-grid">
            {['Efectivo', 'Tarjeta', 'Transferencia', 'Credito'].map((method) => (
              <button
                key={method}
                className={paymentMethod === method ? 'active' : ''}
                onClick={() => setPaymentMethod(method)}
              >
                {method}
              </button>
            ))}
          </div>

          {paymentMethod === 'Efectivo' && (
            <>
              <label className="cash-input">
                Efectivo recibido
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(event) => setCashReceived(event.target.value)}
                  placeholder="0"
                />
              </label>

              <div className="change-box">
                <span>Cambio</span>
                <strong className={change >= 0 ? 'positive' : 'negative'}>
                  RD$ {change.toFixed(2)}
                </strong>
              </div>
            </>
          )}
        </section>

        <section className="billing-side-card invoice-preview-card">
          <div className="invoice-preview-header">
            <div>
              <h3>FACTURA</h3>
              <span>No. FAC-{String(invoices.length + 1).padStart(6, '0')}</span>
            </div>
            <Receipt size={30} />
          </div>

          <div className="invoice-company">
            <strong>INVE-FAT SYSTEM, SRL</strong>
            <span>Soluciones Integrales de Inventario y Facturacion</span>
            <span>RNC: 1-31-12345-6</span>
          </div>

          <div className="invoice-preview-client">
            <span>Cliente</span>
            <strong>{selectedClient.name}</strong>
            <small>{selectedClient.document}</small>
          </div>

          <div className="invoice-preview-lines">
            {cart.slice(0, 4).map((item) => (
              <div key={item.code}>
                <span>{item.name}</span>
                <b>RD$ {(item.qty * item.price).toFixed(2)}</b>
              </div>
            ))}

            {cart.length > 4 && <small>+ {cart.length - 4} productos mas</small>}
          </div>

          <div className="invoice-preview-total">
            <span>Total general</span>
            <strong>RD$ {total.toFixed(2)}</strong>
          </div>
        </section>

        <button className="generate-invoice-button" onClick={generateInvoice}>
          Generar factura
        </button>

        <div className="billing-bottom-actions">
          <button>Suspender</button>
          <button onClick={() => window.print()}>Imprimir</button>
          <button onClick={clearCart}>Nueva</button>
        </div>
      </aside>
    </section>
  )
}

function SalesBillingProV2({ clients, setClients, invoices, setInvoices }) {
  const walkInClient = {
    code: 'CONTADO',
    name: 'Cliente de mostrador',
    document: '000-0000000-0',
    phone: 'N/A',
    email: 'N/A',
    address: 'N/A',
    type: 'Consumidor final',
    balance: 0,
    status: 'Activo',
  }

  const billingProducts = [
    { code: 'AGU001', barcode: '7460001001001', name: 'Agua Cristal 16.9 oz', unit: 'Unidad', price: 25, stock: 120 },
    { code: 'COC002', barcode: '7460001001002', name: 'Coca Cola 20 oz', unit: 'Unidad', price: 50, stock: 85 },
    { code: 'PAP003', barcode: '7460001001003', name: 'Papel Higienico Elite', unit: 'Unidad', price: 120, stock: 42 },
    { code: 'DET004', barcode: '7460001001004', name: 'Detergente Ace 360 g', unit: 'Unidad', price: 85, stock: 64 },
    { code: 'PAN005', barcode: '7460001001005', name: 'Pan de Molde Bimbo', unit: 'Unidad', price: 65, stock: 38 },
    { code: 'LEC006', barcode: '7460001001006', name: 'Leche Rica 1 Litro', unit: 'Unidad', price: 75, stock: 57 },
  ]

  const [selectedClientCode, setSelectedClientCode] = useState('CONTADO')
  const [barcodeValue, setBarcodeValue] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Efectivo')
  const [cashReceived, setCashReceived] = useState('600')
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState('')
  const [comment, setComment] = useState('Gracias por su preferencia.')

  const [cart, setCart] = useState([
    { code: 'AGU001', name: 'Agua Cristal 16.9 oz', unit: 'Unidad', qty: 2, price: 25, discount: 0 },
    { code: 'COC002', name: 'Coca Cola 20 oz', unit: 'Unidad', qty: 1, price: 50, discount: 0 },
  ])

  const selectedClient =
    selectedClientCode === 'CONTADO'
      ? walkInClient
      : clients.find((client) => client.code === selectedClientCode) || walkInClient

  const invoiceNumber = currentInvoiceNumber || `FAC-${String(invoices.length + 1).padStart(6, '0')}`

  const filteredProducts = billingProducts.filter((product) => {
    const search = productSearch.toLowerCase()

    return (
      product.code.toLowerCase().includes(search) ||
      product.barcode.toLowerCase().includes(search) ||
      product.name.toLowerCase().includes(search)
    )
  })

  const subtotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0)
  const discount = cart.reduce((sum, item) => sum + Number(item.discount || 0), 0)
  const taxableAmount = Math.max(subtotal - discount, 0)
  const itbis = taxableAmount * 0.18
  const total = taxableAmount + itbis
  const paidAmount =
    paymentMethod === 'Credito'
      ? 0
      : paymentMethod === 'Efectivo'
        ? Math.min(Number(cashReceived || 0), total)
        : total
  const pendingAmount = Math.max(total - paidAmount, 0)
  const cashReceivedAmount = Number(cashReceived || 0)
  const change = paymentMethod === 'Efectivo' ? Math.max(cashReceivedAmount - total, 0) : 0

  const issueDate = new Date().toLocaleDateString('es-DO')
  const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('es-DO')

  const addProductToCart = (product) => {
    setCart((current) => {
      const exists = current.find((item) => item.code === product.code)

      if (exists) {
        return current.map((item) =>
          item.code === product.code ? { ...item, qty: item.qty + 1 } : item
        )
      }

      return [
        ...current,
        {
          code: product.code,
          name: product.name,
          unit: product.unit,
          qty: 1,
          price: product.price,
          discount: 0,
        },
      ]
    })
  }

  const addProductByBarcode = () => {
    const value = barcodeValue.trim().toLowerCase()

    if (!value) return

    const foundProduct = billingProducts.find(
      (product) =>
        product.barcode.toLowerCase() === value ||
        product.code.toLowerCase() === value
    )

    if (!foundProduct) {
      alert('Producto no encontrado con ese codigo.')
      return
    }

    addProductToCart(foundProduct)
    setBarcodeValue('')
  }

  const updateCartItem = (code, field, value) => {
    setCart((current) =>
      current.map((item) =>
        item.code === code
          ? {
              ...item,
              [field]: field === 'qty' || field === 'discount' ? Number(value || 0) : value,
            }
          : item
      )
    )
  }

  const increaseQty = (code) => {
    setCart((current) =>
      current.map((item) =>
        item.code === code ? { ...item, qty: item.qty + 1 } : item
      )
    )
  }

  const decreaseQty = (code) => {
    setCart((current) =>
      current.map((item) =>
        item.code === code ? { ...item, qty: Math.max(item.qty - 1, 1) } : item
      )
    )
  }

  const removeItem = (code) => {
    setCart((current) => current.filter((item) => item.code !== code))
  }

  const clearInvoice = () => {
    setCart([])
    setBarcodeValue('')
    setProductSearch('')
    setCashReceived('')
    setComment('Gracias por su preferencia.')
    setCurrentInvoiceNumber('')
  }

  const saveInvoice = () => {
    if (cart.length === 0) {
      alert('Debes agregar productos a la factura.')
      return false
    }

    if (currentInvoiceNumber) {
      return true
    }

    const invoiceStatus = paymentMethod === 'Credito' ? 'Pendiente' : 'Pagada'
    const createdNumber = invoiceNumber

    const createdInvoice = {
      number: createdNumber,
      customerCode: selectedClient.code,
      customer: selectedClient.name,
      document: selectedClient.document,
      date: issueDate,
      total,
      payment: paymentMethod,
      status: invoiceStatus,
    }

    setInvoices((current) => [createdInvoice, ...current])
    setCurrentInvoiceNumber(createdNumber)

    if (invoiceStatus === 'Pendiente' && selectedClient.code !== 'CONTADO') {
      setClients((currentClients) =>
        currentClients.map((client) =>
          client.code === selectedClient.code
            ? { ...client, balance: Number(client.balance || 0) + total }
            : client
        )
      )
    }

    return true
  }

  const generateInvoice = () => {
    if (saveInvoice()) {
      setTimeout(() => window.print(), 150)
    }
  }

  const printInvoice = () => {
    if (saveInvoice()) {
      setTimeout(() => window.print(), 150)
    }
  }

  return (
    <>
      <section className="billing-v2-page">
        <div className="billing-v2-main">
          <div className="billing-v2-header">
            <div>
              <h3>Facturacion rapida</h3>
              <p>Escanea, busca productos, cobra e imprime la factura en una sola pantalla.</p>
            </div>

            <div className="billing-v2-header-actions">
              <button className="secondary-button" onClick={clearInvoice}>
                Nueva factura
              </button>
              <button className="primary-button small" onClick={generateInvoice}>
                Generar factura
              </button>
            </div>
          </div>

          <section className="billing-v2-top">
            <div className="billing-v2-scanner">
              <div className="billing-v2-scanner-icon">
                <ScanBarcode size={32} />
              </div>

              <div>
                <strong>Escanear codigo de barra</strong>
                <span>Coloca el cursor aqui y pasa el producto por el lector</span>
              </div>

              <input
                autoFocus
                value={barcodeValue}
                onChange={(event) => setBarcodeValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addProductByBarcode()
                  }
                }}
                placeholder="Escanear o escribir codigo..."
              />

              <button onClick={addProductByBarcode}>Agregar</button>
            </div>

            <div className="billing-v2-search">
              <label>Buscar producto</label>
              <div>
                <input
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Nombre, codigo o barra..."
                />
                <Search size={18} />
              </div>
            </div>
          </section>

          <section className="billing-v2-products">
            <div className="card-header">
              <h3>Productos frecuentes</h3>
              <span>{filteredProducts.length} productos</span>
            </div>

            <div className="billing-v2-product-grid">
              {filteredProducts.map((product) => (
                <button key={product.code} onClick={() => addProductToCart(product)}>
                  <span>{product.name.charAt(0)}</span>
                  <div>
                    <strong>{product.name}</strong>
                    <b>RD$ {product.price.toFixed(2)}</b>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="billing-v2-detail">
            <div className="card-header">
              <h3>Detalle de la factura ({cart.length})</h3>
              <button onClick={() => setCart([])}>Limpiar productos</button>
            </div>

            <div className="billing-v2-table">
              <div className="billing-v2-table-head">
                <span>Codigo</span>
                <span>Producto</span>
                <span>Cantidad</span>
                <span>Precio</span>
                <span>Desc.</span>
                <span>Total</span>
                <span></span>
              </div>

              {cart.map((item) => (
                <div key={item.code} className="billing-v2-table-row">
                  <strong>{item.code}</strong>

                  <div>
                    <b>{item.name}</b>
                    <small>{item.unit}</small>
                  </div>

                  <div className="qty-control">
                    <button onClick={() => decreaseQty(item.code)}>-</button>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(event) => updateCartItem(item.code, 'qty', event.target.value)}
                    />
                    <button onClick={() => increaseQty(item.code)}>+</button>
                  </div>

                  <span>RD$ {item.price.toFixed(2)}</span>

                  <input
                    className="discount-input"
                    type="number"
                    value={item.discount}
                    onChange={(event) => updateCartItem(item.code, 'discount', event.target.value)}
                  />

                  <b>RD$ {Math.max(item.qty * item.price - Number(item.discount || 0), 0).toFixed(2)}</b>

                  <button className="remove-line" onClick={() => removeItem(item.code)}>X</button>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="empty-cart">
                  Escanea o busca productos para agregarlos a la factura.
                </div>
              )}
            </div>

            <textarea
              className="invoice-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Observacion de la factura..."
            />
          </section>
        </div>

        <aside className="billing-v2-side">
          <section className="billing-v2-side-card">
            <h3>Cliente</h3>

            <div className="client-select-row">
              <select
                value={selectedClientCode}
                onChange={(event) => setSelectedClientCode(event.target.value)}
              >
                <option value="CONTADO">Cliente de mostrador</option>
                {clients.map((client) => (
                  <option key={client.code} value={client.code}>
                    {client.code} - {client.name}
                  </option>
                ))}
              </select>

              <button>
                <UserPlus size={18} />
              </button>
            </div>

            <div className="billing-v2-client">
              <div>{selectedClient.name.charAt(0)}</div>
              <section>
                <strong>{selectedClient.name}</strong>
                <span>RNC/Cedula: {selectedClient.document}</span>
                <span>Tipo: {selectedClient.type || 'Consumidor final'}</span>
              </section>
              <em>{paymentMethod === 'Credito' ? 'Credito' : 'Contado'}</em>
            </div>
          </section>

          <section className="billing-v2-side-card billing-v2-totals">
            <div>
              <span>Subtotal</span>
              <strong>RD$ {subtotal.toFixed(2)}</strong>
            </div>

            <div>
              <span>Descuento</span>
              <strong className="negative">- RD$ {discount.toFixed(2)}</strong>
            </div>

            <div>
              <span>ITBIS (18%)</span>
              <strong>RD$ {itbis.toFixed(2)}</strong>
            </div>

            <hr />

            <div className="billing-v2-grand-total">
              <span>Total general</span>
              <strong>RD$ {total.toFixed(2)}</strong>
            </div>
          </section>

          <section className="billing-v2-side-card">
            <h3>Metodo de pago</h3>

            <div className="payment-grid">
              {['Efectivo', 'Tarjeta', 'Transferencia', 'Credito'].map((method) => (
                <button
                  key={method}
                  className={paymentMethod === method ? 'active' : ''}
                  onClick={() => setPaymentMethod(method)}
                >
                  {method}
                </button>
              ))}
            </div>

            {paymentMethod === 'Efectivo' && (
              <>
                <label className="cash-input">
                  Efectivo recibido
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(event) => setCashReceived(event.target.value)}
                    placeholder="0"
                  />
                </label>

                <div className="change-box">
                  <span>Cambio</span>
                  <strong className={change >= 0 ? 'positive' : 'negative'}>
                    RD$ {change.toFixed(2)}
                  </strong>
                </div>
              </>
            )}
          </section>

          <button className="generate-invoice-button" onClick={generateInvoice}>
            Generar factura
          </button>
        </aside>
      </section>

      <section className="print-invoice-sheet">
        <div className="print-invoice-header">
          <div>
            <div className="print-brand">
              <div className="print-logo-mark">V</div>
              <div>
                <h1>INVE-FAT</h1>
                <span>SYSTEM</span>
              </div>
            </div>

            <h3>INVE-FAT SYSTEM, SRL</h3>
            <p>Soluciones Integrales de Inventario, Facturacion y Punto de Venta</p>
            <p><strong>RNC:</strong> 1-31-12345-6</p>
            <p><strong>Tel:</strong> (809) 555-1234</p>
            <p><strong>Email:</strong> info@invefatsystem.com</p>
            <p>Av. Winston Churchill No. 1099, Santo Domingo, R.D.</p>
          </div>

          <div className="print-invoice-title">
            <h2>FACTURA</h2>
            <strong>No. {invoiceNumber}</strong>

            <div className="print-date-box">
              <p><span>Fecha de emision:</span> {issueDate}</p>
              <p><span>Fecha de vencimiento:</span> {dueDate}</p>
              <p><span>Condicion de pago:</span> {paymentMethod === 'Credito' ? 'Credito a 15 dias' : 'Contado'}</p>
            </div>
          </div>
        </div>

        <div className="print-info-grid">
          <div className="print-info-card">
            <h4>DATOS DEL CLIENTE</h4>
            <p><span>Cliente:</span> <strong>{selectedClient.name}</strong></p>
            <p><span>RNC / Cedula:</span> {selectedClient.document}</p>
            <p><span>Telefono:</span> {selectedClient.phone}</p>
            <p><span>Direccion:</span> {selectedClient.address || 'N/A'}</p>
          </div>

          <div className="print-info-card">
            <h4>INFORMACION DE LA FACTURA</h4>
            <p><span>Vendedor:</span> Administrador</p>
            <p><span>Metodo de pago:</span> {paymentMethod}</p>
            <p><span>Moneda:</span> Pesos Dominicanos (RD$)</p>
            <p><span>Estado:</span> {paymentMethod === 'Credito' ? 'Pendiente' : 'Pagada'}</p>
          </div>
        </div>

        <table className="print-products-table">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Descripcion</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>ITBIS (18%)</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {cart.map((item) => {
              const lineBase = Math.max(item.qty * item.price - Number(item.discount || 0), 0)
              const lineTax = lineBase * 0.18
              const lineTotal = lineBase + lineTax

              return (
                <tr key={item.code}>
                  <td>{item.code}</td>
                  <td>
                    <strong>{item.name}</strong>
                    <span>{item.unit}</span>
                  </td>
                  <td>{item.qty}</td>
                  <td>RD$ {item.price.toFixed(2)}</td>
                  <td>RD$ {lineTax.toFixed(2)}</td>
                  <td><strong>RD$ {lineTotal.toFixed(2)}</strong></td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="print-bottom-grid">
          <div>
            <h4>OBSERVACIONES</h4>
            <div className="print-observations">
              <p>{comment || 'Gracias por su preferencia.'}</p>
              <p>Conserve esta factura para cualquier reclamo.</p>
            </div>
          </div>

          <div className="print-total-box">
            <p><span>Subtotal:</span> <strong>RD$ {subtotal.toFixed(2)}</strong></p>
            <p><span>Descuento:</span> <strong>- RD$ {discount.toFixed(2)}</strong></p>
            <p><span>ITBIS (18%):</span> <strong>RD$ {itbis.toFixed(2)}</strong></p>
            <hr />
            <h3><span>TOTAL GENERAL:</span> RD$ {total.toFixed(2)}</h3>
          </div>
        </div>

        <div className="print-payment-summary">
          <div>
            <h4>RESUMEN DE PAGO</h4>
            <section>
              <p><span>Total General</span><strong>RD$ {total.toFixed(2)}</strong></p>
              <p><span>Pagado</span><strong>RD$ {paidAmount.toFixed(2)}</strong></p>
              <p><span>Pendiente</span><strong>RD$ {pendingAmount.toFixed(2)}</strong></p>
            </section>
          </div>

          <div>
            <h4>Gracias por su confianza</h4>
            <p>Su pago oportuno nos permite seguir ofreciendo un mejor servicio.</p>
          </div>
        </div>

        <footer className="print-footer">
          Esta factura fue generada por <strong>INVE-FAT SYSTEM</strong>
          <br />
          Software de Gestion Empresarial
        </footer>
      </section>
    </>
  )
}

function SalesBillingProV3({ clients, setClients, invoices, setInvoices }) {
  const walkInClient = {
    code: 'CONTADO',
    name: 'Cliente de mostrador',
    document: '000-0000000-0',
    phone: 'N/A',
    email: 'N/A',
    address: 'N/A',
    type: 'Consumidor final',
    balance: 0,
    status: 'Activo',
  }

  const billingProducts = [
    { code: 'AGU001', barcode: '7460001001001', name: 'Agua Cristal 16.9 oz', unit: 'Unidad', price: 25, stock: 120 },
    { code: 'COC002', barcode: '7460001001002', name: 'Coca Cola 20 oz', unit: 'Unidad', price: 50, stock: 85 },
    { code: 'PAP003', barcode: '7460001001003', name: 'Papel Higienico Elite', unit: 'Unidad', price: 120, stock: 42 },
    { code: 'DET004', barcode: '7460001001004', name: 'Detergente Ace 360 g', unit: 'Unidad', price: 85, stock: 64 },
    { code: 'PAN005', barcode: '7460001001005', name: 'Pan de Molde Bimbo', unit: 'Unidad', price: 65, stock: 38 },
    { code: 'LEC006', barcode: '7460001001006', name: 'Leche Rica 1 Litro', unit: 'Unidad', price: 75, stock: 57 },
  ]

  const [billingStarted, setBillingStarted] = useState(false)
  const [invoiceType, setInvoiceType] = useState('consumidor')
  const [selectedClientCode, setSelectedClientCode] = useState('CONTADO')
  const [barcodeValue, setBarcodeValue] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Efectivo')
  const [cashReceived, setCashReceived] = useState('')
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState('')
  const [comment, setComment] = useState('Gracias por su preferencia.')
  const [cart, setCart] = useState([])

  const selectedClient =
    selectedClientCode === 'CONTADO'
      ? walkInClient
      : clients.find((client) => client.code === selectedClientCode) || walkInClient

  const invoiceNumber = currentInvoiceNumber || `FAC-${String(invoices.length + 1).padStart(6, '0')}`
  const ncfPrefix = invoiceType === 'comprobante' ? 'B01' : 'B02'
  const ncfNumber = `${ncfPrefix}${String(invoices.length + 1).padStart(8, '0')}`
  const invoiceTypeLabel = invoiceType === 'comprobante' ? 'Factura con comprobante fiscal' : 'Consumidor final'

  const filteredProducts = billingProducts.filter((product) => {
    const search = productSearch.toLowerCase()

    return (
      product.code.toLowerCase().includes(search) ||
      product.barcode.toLowerCase().includes(search) ||
      product.name.toLowerCase().includes(search)
    )
  })

  const subtotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0)
  const discount = cart.reduce((sum, item) => sum + Number(item.discount || 0), 0)
  const taxableAmount = Math.max(subtotal - discount, 0)
  const itbis = taxableAmount * 0.18
  const total = taxableAmount + itbis
  const paidAmount =
    paymentMethod === 'Credito'
      ? 0
      : paymentMethod === 'Efectivo'
        ? Math.min(Number(cashReceived || 0), total)
        : total
  const pendingAmount = Math.max(total - paidAmount, 0)
  const change = paymentMethod === 'Efectivo' ? Number(cashReceived || 0) - total : 0

  const issueDate = new Date().toLocaleDateString('es-DO')
  const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('es-DO')

  const handleInvoiceTypeChange = (type) => {
    setInvoiceType(type)

    if (type === 'consumidor') {
      setSelectedClientCode('CONTADO')
    }

    if (type === 'comprobante' && selectedClientCode === 'CONTADO' && clients.length > 0) {
      setSelectedClientCode(clients[0].code)
    }
  }

  const startBilling = () => {
    if (invoiceType === 'comprobante' && selectedClientCode === 'CONTADO') {
      alert('Para factura con comprobante debes seleccionar un cliente registrado.')
      return
    }

    setBillingStarted(true)
    setTimeout(() => {
      const input = document.querySelector('.billing-v2-scanner input')
      if (input) input.focus()
    }, 100)
  }

  const goBackToSetup = () => {
    setBillingStarted(false)
  }

  const addProductToCart = (product) => {
    setCart((current) => {
      const exists = current.find((item) => item.code === product.code)

      if (exists) {
        return current.map((item) =>
          item.code === product.code ? { ...item, qty: item.qty + 1 } : item
        )
      }

      return [
        ...current,
        {
          code: product.code,
          name: product.name,
          unit: product.unit,
          qty: 1,
          price: product.price,
          discount: 0,
        },
      ]
    })
  }

  const addProductByBarcode = () => {
    const value = barcodeValue.trim().toLowerCase()

    if (!value) return

    const foundProduct = billingProducts.find(
      (product) =>
        product.barcode.toLowerCase() === value ||
        product.code.toLowerCase() === value
    )

    if (!foundProduct) {
      alert('Producto no encontrado con ese codigo.')
      return
    }

    addProductToCart(foundProduct)
    setBarcodeValue('')
  }

  const updateCartItem = (code, field, value) => {
    setCart((current) =>
      current.map((item) =>
        item.code === code
          ? {
              ...item,
              [field]: field === 'qty' || field === 'discount' ? Number(value || 0) : value,
            }
          : item
      )
    )
  }

  const increaseQty = (code) => {
    setCart((current) =>
      current.map((item) =>
        item.code === code ? { ...item, qty: item.qty + 1 } : item
      )
    )
  }

  const decreaseQty = (code) => {
    setCart((current) =>
      current.map((item) =>
        item.code === code ? { ...item, qty: Math.max(item.qty - 1, 1) } : item
      )
    )
  }

  const removeItem = (code) => {
    setCart((current) => current.filter((item) => item.code !== code))
  }

  const clearInvoice = () => {
    setCart([])
    setBarcodeValue('')
    setProductSearch('')
    setCashReceived('')
    setComment('Gracias por su preferencia.')
    setCurrentInvoiceNumber('')
    setBillingStarted(false)
    setInvoiceType('consumidor')
    setSelectedClientCode('CONTADO')
  }

  const saveInvoice = () => {
    if (cart.length === 0) {
      alert('Debes agregar productos a la factura.')
      return false
    }

    if (invoiceType === 'comprobante' && selectedClientCode === 'CONTADO') {
      alert('Para factura con comprobante debes seleccionar un cliente registrado.')
      return false
    }

    if (currentInvoiceNumber) {
      return true
    }

    const invoiceStatus = paymentMethod === 'Credito' ? 'Pendiente' : 'Pagada'
    const createdNumber = invoiceNumber

    const createdInvoice = {
      number: createdNumber,
      ncf: ncfNumber,
      invoiceType: invoiceTypeLabel,
      customerCode: selectedClient.code,
      customer: selectedClient.name,
      document: selectedClient.document,
      date: issueDate,
      total,
      payment: paymentMethod,
      status: invoiceStatus,
    }

    setInvoices((current) => [createdInvoice, ...current])
    setCurrentInvoiceNumber(createdNumber)

    if (invoiceStatus === 'Pendiente' && selectedClient.code !== 'CONTADO') {
      setClients((currentClients) =>
        currentClients.map((client) =>
          client.code === selectedClient.code
            ? { ...client, balance: Number(client.balance || 0) + total }
            : client
        )
      )
    }

    return true
  }

  const generateInvoice = () => {
    if (saveInvoice()) {
      setTimeout(() => window.print(), 150)
    }
  }

  const printInvoice = () => {
    if (saveInvoice()) {
      setTimeout(() => window.print(), 150)
    }
  }

  if (!billingStarted) {
    return (
      <section className="billing-setup-page">
        <div className="billing-setup-card">
          <div className="billing-setup-header">
            <span>Paso 1 de facturacion</span>
            <h3>Configurar factura</h3>
            <p>Primero selecciona si la factura sera consumidor final o con comprobante. Luego elige el cliente antes de agregar productos.</p>
          </div>

          <div className="invoice-type-grid">
            <button
              className={invoiceType === 'consumidor' ? 'active' : ''}
              onClick={() => handleInvoiceTypeChange('consumidor')}
            >
              <strong>Consumidor final</strong>
              <span>Para ventas rapidas o cliente de mostrador.</span>
              <b>NCF: B02</b>
            </button>

            <button
              className={invoiceType === 'comprobante' ? 'active' : ''}
              onClick={() => handleInvoiceTypeChange('comprobante')}
            >
              <strong>Con comprobante fiscal</strong>
              <span>Para clientes registrados con RNC o cedula.</span>
              <b>NCF: B01</b>
            </button>
          </div>

          <div className="billing-client-setup">
            <label>
              Cliente de la factura
              <select
                value={selectedClientCode}
                onChange={(event) => setSelectedClientCode(event.target.value)}
              >
                {invoiceType === 'consumidor' && (
                  <option value="CONTADO">Cliente de mostrador</option>
                )}

                {clients.map((client) => (
                  <option key={client.code} value={client.code}>
                    {client.code} - {client.name} - {client.document}
                  </option>
                ))}
              </select>
            </label>

            {invoiceType === 'comprobante' && selectedClientCode === 'CONTADO' && (
              <p className="required-client-note">
                Para comprobante fiscal debes seleccionar un cliente registrado.
              </p>
            )}

            <div className="billing-selected-client-review">
              <div>
                <span>Cliente seleccionado</span>
                <strong>{selectedClient.name}</strong>
              </div>

              <div>
                <span>RNC / Cedula</span>
                <strong>{selectedClient.document}</strong>
              </div>

              <div>
                <span>Tipo de factura</span>
                <strong>{invoiceTypeLabel}</strong>
              </div>

              <div>
                <span>NCF</span>
                <strong>{ncfNumber}</strong>
              </div>
            </div>
          </div>

          <div className="billing-setup-actions">
            <button className="secondary-button" onClick={clearInvoice}>
              Cancelar
            </button>

            <button className="primary-button" onClick={startBilling}>
              Continuar a seleccionar productos
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="billing-v2-page">
        <div className="billing-v2-main">
          <div className="billing-v2-header">
            <div>
              <h3>Facturacion rapida</h3>
              <p>Escanea, busca productos, cobra e imprime la factura en una sola pantalla.</p>

              <div className="billing-process-pills">
                <span>{invoiceTypeLabel}</span>
                <span>NCF: {ncfNumber}</span>
                <span>Cliente: {selectedClient.name}</span>
              </div>
            </div>

            <div className="billing-v2-header-actions">
              <button className="secondary-button" onClick={goBackToSetup}>
                Cambiar cliente / comprobante
              </button>
              <button className="secondary-button" onClick={clearInvoice}>
                Nueva factura
              </button>
              <button className="primary-button small" onClick={generateInvoice}>
                Generar factura
              </button>
            </div>
          </div>

          <section className="billing-v2-top">
            <div className="billing-v2-scanner">
              <div className="billing-v2-scanner-icon">
                <ScanBarcode size={32} />
              </div>

              <div>
                <strong>Escanear codigo de barra</strong>
                <span>Coloca el cursor aqui y pasa el producto por el lector</span>
              </div>

              <input
                autoFocus
                value={barcodeValue}
                onChange={(event) => setBarcodeValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addProductByBarcode()
                  }
                }}
                placeholder="Escanear o escribir codigo..."
              />

              <button onClick={addProductByBarcode}>Agregar</button>
            </div>

            <div className="billing-v2-search">
              <label>Buscar producto</label>
              <div>
                <input
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Nombre, codigo o barra..."
                />
                <Search size={18} />
              </div>
            </div>
          </section>

          <section className="billing-v2-products">
            <div className="card-header">
              <h3>Productos frecuentes</h3>
              <span>{filteredProducts.length} productos</span>
            </div>

            <div className="billing-v2-product-grid">
              {filteredProducts.map((product) => (
                <button key={product.code} onClick={() => addProductToCart(product)}>
                  <span>{product.name.charAt(0)}</span>
                  <div>
                    <strong>{product.name}</strong>
                    <b>RD$ {product.price.toFixed(2)}</b>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="billing-v2-detail">
            <div className="card-header">
              <h3>Detalle de la factura ({cart.length})</h3>
              <button onClick={() => setCart([])}>Limpiar productos</button>
            </div>

            <div className="billing-v2-table">
              <div className="billing-v2-table-head">
                <span>Codigo</span>
                <span>Producto</span>
                <span>Cantidad</span>
                <span>Precio</span>
                <span>Desc.</span>
                <span>Total</span>
                <span></span>
              </div>

              {cart.map((item) => (
                <div key={item.code} className="billing-v2-table-row">
                  <strong>{item.code}</strong>

                  <div>
                    <b>{item.name}</b>
                    <small>{item.unit}</small>
                  </div>

                  <div className="qty-control">
                    <button onClick={() => decreaseQty(item.code)}>-</button>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(event) => updateCartItem(item.code, 'qty', event.target.value)}
                    />
                    <button onClick={() => increaseQty(item.code)}>+</button>
                  </div>

                  <span>RD$ {item.price.toFixed(2)}</span>

                  <input
                    className="discount-input"
                    type="number"
                    value={item.discount}
                    onChange={(event) => updateCartItem(item.code, 'discount', event.target.value)}
                  />

                  <b>RD$ {Math.max(item.qty * item.price - Number(item.discount || 0), 0).toFixed(2)}</b>

                  <button className="remove-line" onClick={() => removeItem(item.code)}>X</button>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="empty-cart">
                  Escanea o busca productos para agregarlos a la factura.
                </div>
              )}
            </div>

            <textarea
              className="invoice-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Observacion de la factura..."
            />
          </section>
        </div>

        <aside className="billing-v2-side">
          <section className="billing-v2-side-card">
            <h3>Factura configurada</h3>

            <div className="billing-v2-client">
              <div>{selectedClient.name.charAt(0)}</div>
              <section>
                <strong>{selectedClient.name}</strong>
                <span>RNC/Cedula: {selectedClient.document}</span>
                <span>{invoiceTypeLabel}</span>
                <span>NCF: {ncfNumber}</span>
              </section>
              <em>{paymentMethod === 'Credito' ? 'Credito' : 'Contado'}</em>
            </div>

            <button className="change-setup-button" onClick={goBackToSetup}>
              Cambiar cliente o comprobante
            </button>
          </section>

          <section className="billing-v2-side-card billing-v2-totals">
            <div>
              <span>Subtotal</span>
              <strong>RD$ {subtotal.toFixed(2)}</strong>
            </div>

            <div>
              <span>Descuento</span>
              <strong className="negative">- RD$ {discount.toFixed(2)}</strong>
            </div>

            <div>
              <span>ITBIS (18%)</span>
              <strong>RD$ {itbis.toFixed(2)}</strong>
            </div>

            <hr />

            <div className="billing-v2-grand-total">
              <span>Total general</span>
              <strong>RD$ {total.toFixed(2)}</strong>
            </div>
          </section>

          <section className="billing-v2-side-card">
            <h3>Metodo de pago</h3>

            <div className="payment-grid">
              {['Efectivo', 'Tarjeta', 'Transferencia', 'Credito'].map((method) => (
                <button
                  key={method}
                  className={paymentMethod === method ? 'active' : ''}
                  onClick={() => setPaymentMethod(method)}
                >
                  {method}
                </button>
              ))}
            </div>

            {paymentMethod === 'Efectivo' && (
              <>
                <label className="cash-input">
                  Efectivo recibido
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(event) => setCashReceived(event.target.value)}
                    placeholder="0"
                  />
                </label>

                <div className="change-box">
                  <span>Cambio</span>
                  <strong className={change >= 0 ? 'positive' : 'negative'}>
                    RD$ {change.toFixed(2)}
                  </strong>
                </div>
              </>
            )}
          </section>

          <button className="generate-invoice-button" onClick={generateInvoice}>
            Generar factura
          </button>
        </aside>
      </section>

      <section className="print-invoice-sheet">
        <div className="print-invoice-header">
          <div>
            <div className="print-brand">
              <div className="print-logo-mark">V</div>
              <div>
                <h1>INVE-FAT</h1>
                <span>SYSTEM</span>
              </div>
            </div>

            <h3>INVE-FAT SYSTEM, SRL</h3>
            <p>Soluciones Integrales de Inventario, Facturacion y Punto de Venta</p>
            <p><strong>RNC:</strong> 1-31-12345-6</p>
            <p><strong>Tel:</strong> (809) 555-1234</p>
            <p><strong>Email:</strong> info@invefatsystem.com</p>
            <p>Av. Winston Churchill No. 1099, Santo Domingo, R.D.</p>
          </div>

          <div className="print-invoice-title">
            <h2>FACTURA</h2>
            <strong>No. {invoiceNumber}</strong>
            <strong>NCF: {ncfNumber}</strong>

            <div className="print-date-box">
              <p><span>Fecha de emision:</span> {issueDate}</p>
              <p><span>Fecha de vencimiento:</span> {dueDate}</p>
              <p><span>Tipo:</span> {invoiceTypeLabel}</p>
              <p><span>Condicion de pago:</span> {paymentMethod === 'Credito' ? 'Credito a 15 dias' : 'Contado'}</p>
            </div>
          </div>
        </div>

        <div className="print-info-grid">
          <div className="print-info-card">
            <h4>DATOS DEL CLIENTE</h4>
            <p><span>Cliente:</span> <strong>{selectedClient.name}</strong></p>
            <p><span>RNC / Cedula:</span> {selectedClient.document}</p>
            <p><span>Telefono:</span> {selectedClient.phone}</p>
            <p><span>Direccion:</span> {selectedClient.address || 'N/A'}</p>
          </div>

          <div className="print-info-card">
            <h4>INFORMACION DE LA FACTURA</h4>
            <p><span>Vendedor:</span> Administrador</p>
            <p><span>Metodo de pago:</span> {paymentMethod}</p>
            <p><span>Comprobante:</span> {invoiceTypeLabel}</p>
            <p><span>NCF:</span> {ncfNumber}</p>
            <p><span>Moneda:</span> Pesos Dominicanos (RD$)</p>
          </div>
        </div>

        <table className="print-products-table">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Descripcion</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>ITBIS (18%)</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {cart.map((item) => {
              const lineBase = Math.max(item.qty * item.price - Number(item.discount || 0), 0)
              const lineTax = lineBase * 0.18
              const lineTotal = lineBase + lineTax

              return (
                <tr key={item.code}>
                  <td>{item.code}</td>
                  <td>
                    <strong>{item.name}</strong>
                    <span>{item.unit}</span>
                  </td>
                  <td>{item.qty}</td>
                  <td>RD$ {item.price.toFixed(2)}</td>
                  <td>RD$ {lineTax.toFixed(2)}</td>
                  <td><strong>RD$ {lineTotal.toFixed(2)}</strong></td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="print-bottom-grid">
          <div>
            <h4>OBSERVACIONES</h4>
            <div className="print-observations">
              <p>{comment || 'Gracias por su preferencia.'}</p>
              <p>Conserve esta factura para cualquier reclamo.</p>
            </div>
          </div>

          <div className="print-total-box">
            <p><span>Subtotal:</span> <strong>RD$ {subtotal.toFixed(2)}</strong></p>
            <p><span>Descuento:</span> <strong>- RD$ {discount.toFixed(2)}</strong></p>
            <p><span>ITBIS (18%):</span> <strong>RD$ {itbis.toFixed(2)}</strong></p>
            <hr />
            <h3><span>TOTAL GENERAL:</span> RD$ {total.toFixed(2)}</h3>
          </div>
        </div>

        <div className="print-payment-summary">
          <div>
            <h4>RESUMEN DE PAGO</h4>
            <section>
              <p><span>Total General</span><strong>RD$ {total.toFixed(2)}</strong></p>
              <p><span>Pagado</span><strong>RD$ {paidAmount.toFixed(2)}</strong></p>
              <p><span>Pendiente</span><strong>RD$ {pendingAmount.toFixed(2)}</strong></p>
            </section>
          </div>

          <div>
            <h4>Gracias por su confianza</h4>
            <p>Su pago oportuno nos permite seguir ofreciendo un mejor servicio.</p>
          </div>
        </div>

        <footer className="print-footer">
          Esta factura fue generada por <strong>INVE-FAT SYSTEM</strong>
          <br />
          Software de Gestion Empresarial
        </footer>
      </section>
    </>
  )
}

function SalesBillingProV4({ clients, setClients, invoices, setInvoices }) {
  const businessSettings = getBusinessSettings()

  const walkInClient = {
    code: 'CONTADO',
    name: 'Cliente de mostrador',
    document: '000-0000000-0',
    phone: 'N/A',
    email: 'N/A',
    address: 'N/A',
    type: 'Consumidor final',
    balance: 0,
    status: 'Activo',
  }

  const billingProducts = [
    { code: 'AGU001', barcode: '7460001001001', name: 'Agua Cristal 16.9 oz', unit: 'Unidad', price: 25, stock: 120 },
    { code: 'COC002', barcode: '7460001001002', name: 'Coca Cola 20 oz', unit: 'Unidad', price: 50, stock: 85 },
    { code: 'PAP003', barcode: '7460001001003', name: 'Papel Higienico Elite', unit: 'Unidad', price: 120, stock: 42 },
    { code: 'DET004', barcode: '7460001001004', name: 'Detergente Ace 360 g', unit: 'Unidad', price: 85, stock: 64 },
    { code: 'PAN005', barcode: '7460001001005', name: 'Pan de Molde Bimbo', unit: 'Unidad', price: 65, stock: 38 },
    { code: 'LEC006', barcode: '7460001001006', name: 'Leche Rica 1 Litro', unit: 'Unidad', price: 75, stock: 57 },
  ]

  const [billingStarted, setBillingStarted] = useState(false)
  const [invoiceType, setInvoiceType] = useState('consumidor')
  const [selectedClientCode, setSelectedClientCode] = useState('CONTADO')
  const [barcodeValue, setBarcodeValue] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Efectivo')
  const [cashReceived, setCashReceived] = useState('')
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState('')
  const [currentNcfNumber, setCurrentNcfNumber] = useState('')
  const [comment, setComment] = useState('Gracias por su preferencia.')
  const [cart, setCart] = useState([])

  const selectedClient =
    selectedClientCode === 'CONTADO'
      ? walkInClient
      : clients.find((client) => client.code === selectedClientCode) || walkInClient

  const invoiceNumber = currentInvoiceNumber || `FAC-${String(invoices.length + 1).padStart(6, '0')}`
  const ncfPrefix = invoiceType === 'comprobante' ? 'B01' : 'B02'
  const ncfNumber = currentNcfNumber || `${ncfPrefix}${String(invoices.length + 1).padStart(8, '0')}`
  const invoiceTypeLabel = invoiceType === 'comprobante' ? 'Factura con comprobante fiscal' : 'Consumidor final'

  const billingSearchTerm = barcodeValue.toLowerCase().trim()

  const filteredProducts = billingProducts.filter((product) => {
    if (!billingSearchTerm) return false

    return (
      product.code.toLowerCase().includes(billingSearchTerm) ||
      product.barcode.toLowerCase().includes(billingSearchTerm) ||
      product.name.toLowerCase().includes(billingSearchTerm)
    )
  })

  const subtotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0)
  const discount = cart.reduce((sum, item) => sum + Number(item.discount || 0), 0)
  const taxableAmount = Math.max(subtotal - discount, 0)
  const itbis = taxableAmount * 0.18
  const total = taxableAmount + itbis
  const paidAmount =
    paymentMethod === 'Credito'
      ? 0
      : paymentMethod === 'Efectivo'
        ? Math.min(Number(cashReceived || 0), total)
        : total
  const pendingAmount = Math.max(total - paidAmount, 0)
  const cashReceivedAmount = Number(cashReceived || 0)
  const change = paymentMethod === 'Efectivo' ? Math.max(cashReceivedAmount - total, 0) : 0

  const issueDate = new Date().toLocaleDateString('es-DO')
  const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('es-DO')

  const handleInvoiceTypeChange = (type) => {
    setInvoiceType(type)

    if (type === 'consumidor') {
      setSelectedClientCode('CONTADO')
    }

    if (type === 'comprobante' && selectedClientCode === 'CONTADO' && clients.length > 0) {
      setSelectedClientCode(clients[0].code)
    }
  }

  const startBilling = () => {
    if (invoiceType === 'comprobante' && selectedClientCode === 'CONTADO') {
      alert('Para factura con comprobante debes seleccionar un cliente registrado.')
      return
    }

    setBillingStarted(true)

    setTimeout(() => {
      const input = document.querySelector('.billing-v4-scanner input')
      if (input) input.focus()
    }, 100)
  }

  const goBackToSetup = () => {
    setBillingStarted(false)
  }

  const addProductToCart = (product) => {
    setCart((current) => {
      const exists = current.find((item) => item.code === product.code)

      if (exists) {
        return current.map((item) =>
          item.code === product.code ? { ...item, qty: item.qty + 1 } : item
        )
      }

      return [
        ...current,
        {
          code: product.code,
          name: product.name,
          unit: product.unit,
          qty: 1,
          price: product.price,
          discount: 0,
        },
      ]
    })
  }

  const addProductByBarcode = () => {
    const value = barcodeValue.trim().toLowerCase()

    if (!value) return

    const foundProduct =
      billingProducts.find(
        (product) =>
          product.barcode.toLowerCase() === value ||
          product.code.toLowerCase() === value
      ) || filteredProducts[0]

    if (!foundProduct) {
      alert('Producto no encontrado con ese codigo o nombre.')
      return
    }

    addProductToCart(foundProduct)
    setBarcodeValue('')
  }

  const updateCartItem = (code, field, value) => {
    setCart((current) =>
      current.map((item) =>
        item.code === code
          ? {
              ...item,
              [field]: field === 'qty' || field === 'discount' ? Number(value || 0) : value,
            }
          : item
      )
    )
  }

  const increaseQty = (code) => {
    setCart((current) =>
      current.map((item) =>
        item.code === code ? { ...item, qty: item.qty + 1 } : item
      )
    )
  }

  const decreaseQty = (code) => {
    setCart((current) =>
      current.map((item) =>
        item.code === code ? { ...item, qty: Math.max(item.qty - 1, 1) } : item
      )
    )
  }

  const removeItem = (code) => {
    setCart((current) => current.filter((item) => item.code !== code))
  }

  const clearInvoice = () => {
    setCart([])
    setBarcodeValue('')
    setProductSearch('')
    setCashReceived('')
    setComment('Gracias por su preferencia.')
    setCurrentInvoiceNumber('')
    setCurrentNcfNumber('')
    setBillingStarted(false)
    setInvoiceType('consumidor')
    setSelectedClientCode('CONTADO')
    setPaymentMethod('Efectivo')
  }

  const saveInvoice = () => {
    if (cart.length === 0) {
      alert('Debes agregar productos a la factura.')
      return false
    }

    if (invoiceType === 'comprobante' && selectedClientCode === 'CONTADO') {
      alert('Para factura con comprobante debes seleccionar un cliente registrado.')
      return false
    }

    if (currentInvoiceNumber) {
      return true
    }

    const invoiceStatus = paymentMethod === 'Credito' ? 'Pendiente' : 'Pagada'
    const nextNumber = invoices.length + 1
    const createdNumber = `FAC-${String(nextNumber).padStart(6, '0')}`
    const createdNcf = `${ncfPrefix}${String(nextNumber).padStart(8, '0')}`

    const createdInvoice = {
      number: createdNumber,
      ncf: createdNcf,
      invoiceType: invoiceTypeLabel,
      customerCode: selectedClient.code,
      customer: selectedClient.name,
      document: selectedClient.document,
      date: issueDate,
      total,
      payment: paymentMethod,
      status: invoiceStatus,
    }

    setInvoices((currentInvoices) => {
      const alreadyExists = currentInvoices.some((invoice) => invoice.number === createdNumber)

      if (alreadyExists) {
        return currentInvoices
      }

      return [createdInvoice, ...currentInvoices]
    })

    setCurrentInvoiceNumber(createdNumber)
    setCurrentNcfNumber(createdNcf)

    if (invoiceStatus === 'Pendiente' && selectedClient.code !== 'CONTADO') {
      setClients((currentClients) =>
        currentClients.map((client) =>
          client.code === selectedClient.code
            ? { ...client, balance: Number(client.balance || 0) + total }
            : client
        )
      )
    }

    return true
  }

  const generateInvoice = () => {
    const invoiceSaved = saveInvoice()

    if (!invoiceSaved) return

    let cleaned = false

    const cleanAfterPrint = () => {
      if (cleaned) return

      cleaned = true
      window.removeEventListener('afterprint', cleanAfterPrint)
      clearInvoice()
    }

    window.addEventListener('afterprint', cleanAfterPrint)

    setTimeout(() => {
      window.print()

      setTimeout(() => {
        cleanAfterPrint()
      }, 900)
    }, 500)
  }

  if (!billingStarted) {
    return (
      <section className="billing-setup-page">
        <div className="billing-setup-card">
          <div className="billing-setup-header">
            <span>Paso 1 de facturacion</span>
            <h3>Configurar factura</h3>
            <p>Primero selecciona si la factura sera consumidor final o con comprobante. Luego elige el cliente antes de agregar productos.</p>
          </div>

          <div className="invoice-type-grid">
            <button
              className={invoiceType === 'consumidor' ? 'active' : ''}
              onClick={() => handleInvoiceTypeChange('consumidor')}
            >
              <strong>Consumidor final</strong>
              <span>Para ventas rapidas o cliente de mostrador.</span>
              <b>NCF: B02</b>
            </button>

            <button
              className={invoiceType === 'comprobante' ? 'active' : ''}
              onClick={() => handleInvoiceTypeChange('comprobante')}
            >
              <strong>Con comprobante fiscal</strong>
              <span>Para clientes registrados con RNC o cedula.</span>
              <b>NCF: B01</b>
            </button>
          </div>

          <div className="billing-client-setup">
            <label>
              Cliente de la factura
              <select
                value={selectedClientCode}
                onChange={(event) => setSelectedClientCode(event.target.value)}
              >
                {invoiceType === 'consumidor' && (
                  <option value="CONTADO">Cliente de mostrador</option>
                )}

                {clients.map((client) => (
                  <option key={client.code} value={client.code}>
                    {client.code} - {client.name} - {client.document}
                  </option>
                ))}
              </select>
            </label>

            {invoiceType === 'comprobante' && selectedClientCode === 'CONTADO' && (
              <p className="required-client-note">
                Para comprobante fiscal debes seleccionar un cliente registrado.
              </p>
            )}

            <div className="billing-selected-client-review">
              <div>
                <span>Cliente seleccionado</span>
                <strong>{selectedClient.name}</strong>
              </div>

              <div>
                <span>RNC / Cedula</span>
                <strong>{selectedClient.document}</strong>
              </div>

              <div>
                <span>Tipo de factura</span>
                <strong>{invoiceTypeLabel}</strong>
              </div>

              <div>
                <span>NCF</span>
                <strong>{ncfNumber}</strong>
              </div>
            </div>
          </div>

          <div className="billing-setup-actions">
            <button className="secondary-button" onClick={clearInvoice}>
              Cancelar
            </button>

            <button className="primary-button" onClick={startBilling}>
              Continuar a seleccionar productos
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="billing-v4-page">
        <div className="billing-v4-main">
          <div className="billing-v4-title">
            <div>
              <h3>Facturacion rapida</h3>
              <p>Cliente, comprobante y metodo de pago ya configurados. Ahora escanea o busca productos.</p>
            </div>

            <div className="billing-v4-title-actions">
              <button className="secondary-button" onClick={goBackToSetup}>
                Cambiar cliente / comprobante
              </button>

              <button className="secondary-button" onClick={clearInvoice}>
                Nueva factura
              </button>

              <button className="primary-button small" onClick={generateInvoice}>
                Generar factura
              </button>
            </div>
          </div>

          <section className="billing-v4-header-panel">
            <div className="billing-v4-info-card">
              <span>Cliente</span>
              <strong>{selectedClient.name}</strong>
              <small>RNC/Cedula: {selectedClient.document}</small>
              <small>Telefono: {selectedClient.phone}</small>
            </div>

            <div className="billing-v4-info-card">
              <span>Factura</span>
              <strong>{invoiceNumber}</strong>
              <small>{invoiceTypeLabel}</small>
              <small>NCF: {ncfNumber}</small>
            </div>

            <div className="billing-v4-payment-card">
              <span>Metodo de pago</span>

              <div className="billing-v4-payment-grid">
                {['Efectivo', 'Tarjeta', 'Transferencia', 'Credito'].map((method) => (
                  <button
                    key={method}
                    className={paymentMethod === method ? 'active' : ''}
                    onClick={() => setPaymentMethod(method)}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {paymentMethod === 'Efectivo' && (
                <div className="billing-v4-cash-row">
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(event) => setCashReceived(event.target.value)}
                    placeholder="Efectivo recibido"
                  />

                  <strong className={cashReceivedAmount >= total ? 'positive' : 'negative'}>
                    {cashReceivedAmount >= total ? 'Cambio' : 'Falta'}: RD$ {Math.abs(cashReceivedAmount - total).toFixed(2)}
                  </strong>
                </div>
              )}
            </div>
          </section>

          <section className="billing-v4-product-entry">
            <div className="billing-v4-scanner">
              <div className="billing-v4-scanner-icon">
                <ScanBarcode size={32} />
              </div>

              <div>
                <strong>Escanear o buscar producto</strong>
                <span>Escanea codigo de barra, escribe codigo interno o nombre del producto</span>
              </div>

              <input
                autoFocus
                value={barcodeValue}
                onChange={(event) => setBarcodeValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addProductByBarcode()
                  }
                }}
                placeholder="Escanear codigo, escribir codigo o nombre..."
              />

              <button onClick={addProductByBarcode}>Agregar</button>

              {billingSearchTerm && (
                <div className="billing-v4-scanner-results">
                  {filteredProducts.length === 0 ? (
                    <p>No se encontraron productos.</p>
                  ) : (
                    filteredProducts.map((product) => (
                      <button key={product.code} onClick={() => addProductToCart(product)}>
                        <span>{product.code}</span>
                        <strong>{product.name}</strong>
                        <small>Stock {product.stock}</small>
                        <b>RD$ {product.price.toFixed(2)}</b>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="billing-v4-search-panel">
              <label>Buscar producto</label>

              <div className="billing-v4-search-box">
                <input
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Nombre, codigo o barra..."
                />
                <Search size={18} />
              </div>

              <div className="billing-v4-search-results">
                {productSearch.trim() === '' ? (
                  <p>Escribe el nombre, codigo o barra para buscar productos.</p>
                ) : filteredProducts.length === 0 ? (
                  <p>No se encontraron productos.</p>
                ) : (
                  filteredProducts.map((product) => (
                    <button key={product.code} onClick={() => addProductToCart(product)}>
                      <span>{product.code}</span>
                      <strong>{product.name}</strong>
                      <small>Stock {product.stock}</small>
                      <b>RD$ {product.price.toFixed(2)}</b>
                    </button>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="billing-v2-detail">
            <div className="card-header">
              <h3>Detalle de la factura ({cart.length})</h3>
              <button onClick={() => setCart([])}>Limpiar productos</button>
            </div>

            <div className="billing-v2-table">
              <div className="billing-v2-table-head">
                <span>Codigo</span>
                <span>Producto</span>
                <span>Cantidad</span>
                <span>Precio</span>
                <span>Desc.</span>
                <span>Total</span>
                <span></span>
              </div>

              {cart.map((item) => (
                <div key={item.code} className="billing-v2-table-row">
                  <strong>{item.code}</strong>

                  <div>
                    <b>{item.name}</b>
                    <small>{item.unit}</small>
                  </div>

                  <div className="qty-control">
                    <button onClick={() => decreaseQty(item.code)}>-</button>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(event) => updateCartItem(item.code, 'qty', event.target.value)}
                    />
                    <button onClick={() => increaseQty(item.code)}>+</button>
                  </div>

                  <span>RD$ {item.price.toFixed(2)}</span>

                  <input
                    className="discount-input"
                    type="number"
                    value={item.discount}
                    onChange={(event) => updateCartItem(item.code, 'discount', event.target.value)}
                  />

                  <b>RD$ {Math.max(item.qty * item.price - Number(item.discount || 0), 0).toFixed(2)}</b>

                  <button className="remove-line" onClick={() => removeItem(item.code)}>X</button>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="empty-cart">
                  Escanea o busca productos para agregarlos a la factura.
                </div>
              )}
            </div>

            <textarea
              className="invoice-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Observacion de la factura..."
            />
          </section>
        </div>

        <aside className="billing-v4-side">
          <section className="billing-v2-side-card billing-v2-totals">
            <div>
              <span>Subtotal</span>
              <strong>RD$ {subtotal.toFixed(2)}</strong>
            </div>

            <div>
              <span>Descuento</span>
              <strong className="negative">- RD$ {discount.toFixed(2)}</strong>
            </div>

            <div>
              <span>ITBIS (18%)</span>
              <strong>RD$ {itbis.toFixed(2)}</strong>
            </div>

            <hr />

            <div className="billing-v2-grand-total">
              <span>Total general</span>
              <strong>RD$ {total.toFixed(2)}</strong>
            </div>
          </section>

          <button className="generate-invoice-button" onClick={generateInvoice}>
            Generar factura
          </button>
        </aside>
      </section>

      <section className="print-invoice-sheet">
        <div className="print-invoice-header">
          <div>
            <div className="print-brand">
              <div className="print-logo-mark">
                {businessSettings.logo ? (
                  <img src={businessSettings.logo} alt="Logo" />
                ) : (
                  businessSettings.businessShortName.charAt(0)
                )}
              </div>
              <div>
                <h1>{businessSettings.businessShortName}</h1>
                <span>{businessSettings.systemLabel}</span>
              </div>
            </div>

            <h3>{businessSettings.businessName}</h3>
            <p>{businessSettings.slogan}</p>
            <p><strong>RNC:</strong> {businessSettings.rnc}</p>
            <p><strong>Tel:</strong> {businessSettings.phone}</p>
            <p><strong>Email:</strong> {businessSettings.email}</p>
            <p>{businessSettings.address}</p>
          </div>

          <div className="print-invoice-title">
            <h2>FACTURA</h2>
            <strong>No. {invoiceNumber}</strong>
            <strong>NCF: {ncfNumber}</strong>

            <div className="print-date-box">
              <p><span>Fecha de emision:</span> {issueDate}</p>
              <p><span>Fecha de vencimiento:</span> {dueDate}</p>
              <p><span>Tipo:</span> {invoiceTypeLabel}</p>
              <p><span>Condicion de pago:</span> {paymentMethod === 'Credito' ? 'Credito a 15 dias' : 'Contado'}</p>
            </div>
          </div>
        </div>

        <div className="print-info-grid">
          <div className="print-info-card">
            <h4>DATOS DEL CLIENTE</h4>
            <p><span>Cliente:</span> <strong>{selectedClient.name}</strong></p>
            <p><span>RNC / Cedula:</span> {selectedClient.document}</p>
            <p><span>Telefono:</span> {selectedClient.phone}</p>
            <p><span>Direccion:</span> {selectedClient.address || 'N/A'}</p>
          </div>

          <div className="print-info-card">
            <h4>INFORMACION DE LA FACTURA</h4>
            <p><span>Vendedor:</span> Administrador</p>
            <p><span>Metodo de pago:</span> {paymentMethod}</p>
            <p><span>Comprobante:</span> {invoiceTypeLabel}</p>
            <p><span>NCF:</span> {ncfNumber}</p>
            <p><span>Moneda:</span> Pesos Dominicanos (RD$)</p>
          </div>
        </div>

        <table className="print-products-table">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Descripcion</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>ITBIS (18%)</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {cart.map((item) => {
              const lineBase = Math.max(item.qty * item.price - Number(item.discount || 0), 0)
              const lineTax = lineBase * 0.18
              const lineTotal = lineBase + lineTax

              return (
                <tr key={item.code}>
                  <td>{item.code}</td>
                  <td>
                    <strong>{item.name}</strong>
                    <span>{item.unit}</span>
                  </td>
                  <td>{item.qty}</td>
                  <td>RD$ {item.price.toFixed(2)}</td>
                  <td>RD$ {lineTax.toFixed(2)}</td>
                  <td><strong>RD$ {lineTotal.toFixed(2)}</strong></td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="print-bottom-grid">
          <div>
            <h4>OBSERVACIONES</h4>
            <div className="print-observations">
              <p>{comment || 'Gracias por su preferencia.'}</p>
              <p>Conserve esta factura para cualquier reclamo.</p>
            </div>
          </div>

          <div className="print-total-box">
            <p><span>Subtotal:</span> <strong>RD$ {subtotal.toFixed(2)}</strong></p>
            <p><span>Descuento:</span> <strong>- RD$ {discount.toFixed(2)}</strong></p>
            <p><span>ITBIS (18%):</span> <strong>RD$ {itbis.toFixed(2)}</strong></p>
            <hr />
            <h3><span>TOTAL GENERAL:</span> RD$ {total.toFixed(2)}</h3>
          </div>
        </div>

        <div className="print-payment-summary">
          <div>
            <h4>RESUMEN DE PAGO</h4>
            <section>
              <p><span>Total General</span><strong>RD$ {total.toFixed(2)}</strong></p>
              <p><span>Pagado</span><strong>RD$ {paidAmount.toFixed(2)}</strong></p>
              <p><span>Pendiente</span><strong>RD$ {pendingAmount.toFixed(2)}</strong></p>
            </section>
          </div>

          <div>
            <h4>Gracias por su confianza</h4>
            <p>Su pago oportuno nos permite seguir ofreciendo un mejor servicio.</p>
          </div>
        </div>

        <footer className="print-footer">
          Esta factura fue generada por <strong>{businessSettings.businessShortName}</strong>
          <br />
          Software de Gestion Empresarial
        </footer>
      </section>
    </>
  )
}


function SalesQuotesModule({ clients }) {
  const quoteProducts = [
    { code: 'AGU001', barcode: '7460001001001', name: 'Agua Cristal 16.9 oz', unit: 'Unidad', price: 25, stock: 120 },
    { code: 'COC002', barcode: '7460001001002', name: 'Coca Cola 20 oz', unit: 'Unidad', price: 50, stock: 85 },
    { code: 'PAP003', barcode: '7460001001003', name: 'Papel Higienico Elite', unit: 'Unidad', price: 120, stock: 42 },
    { code: 'DET004', barcode: '7460001001004', name: 'Detergente Ace 360 g', unit: 'Unidad', price: 85, stock: 64 },
    { code: 'PAN005', barcode: '7460001001005', name: 'Pan de Molde Bimbo', unit: 'Unidad', price: 65, stock: 38 },
    { code: 'LEC006', barcode: '7460001001006', name: 'Leche Rica 1 Litro', unit: 'Unidad', price: 75, stock: 57 },
  ]

  const businessSettings = getBusinessSettings()

  const walkInClient = {
    code: 'CONTADO',
    name: 'Cliente de mostrador',
    document: '000-0000000-0',
    phone: 'N/A',
    email: 'N/A',
    address: 'N/A',
  }

  const [quoteStarted, setQuoteStarted] = useState(false)
  const [selectedClientCode, setSelectedClientCode] = useState('CONTADO')
  const [searchValue, setSearchValue] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [quoteNote, setQuoteNote] = useState('Esta cotizacion tiene validez segun la fecha indicada.')
  const [currentQuoteNumber, setCurrentQuoteNumber] = useState('')
  const [quoteItems, setQuoteItems] = useState([])
  const [quotes, setQuotes] = useState([
    {
      number: 'COT-000001',
      customer: 'Colegio San Miguel',
      document: '131-4567890-1',
      date: '14/05/2026',
      validUntil: '29/05/2026',
      total: 18500,
      status: 'Enviada',
    },
    {
      number: 'COT-000002',
      customer: 'Comercial La Fe',
      document: '001-1234567-8',
      date: '13/05/2026',
      validUntil: '28/05/2026',
      total: 7250,
      status: 'Borrador',
    },
  ])

  const selectedClient =
    selectedClientCode === 'CONTADO'
      ? walkInClient
      : clients.find((client) => client.code === selectedClientCode) || walkInClient

  const quoteNumber = currentQuoteNumber || `COT-${String(quotes.length + 1).padStart(6, '0')}`

  const today = new Date().toLocaleDateString('es-DO')
  const defaultValidUntil = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('es-DO')

  const searchTerm = searchValue.toLowerCase().trim()

  const filteredQuoteProducts = quoteProducts.filter((product) => {
    if (!searchTerm) return false

    return (
      product.code.toLowerCase().includes(searchTerm) ||
      product.barcode.toLowerCase().includes(searchTerm) ||
      product.name.toLowerCase().includes(searchTerm)
    )
  })

  const subtotal = quoteItems.reduce((sum, item) => sum + item.qty * item.price, 0)
  const discount = quoteItems.reduce((sum, item) => sum + Number(item.discount || 0), 0)
  const taxableAmount = Math.max(subtotal - discount, 0)
  const itbis = taxableAmount * 0.18
  const total = taxableAmount + itbis

  const addProductToQuote = (product) => {
    setQuoteItems((current) => {
      const exists = current.find((item) => item.code === product.code)

      if (exists) {
        return current.map((item) =>
          item.code === product.code ? { ...item, qty: item.qty + 1 } : item
        )
      }

      return [
        ...current,
        {
          code: product.code,
          name: product.name,
          unit: product.unit,
          qty: 1,
          price: product.price,
          discount: 0,
        },
      ]
    })

    setSearchValue('')

    setTimeout(() => {
      const input = document.querySelector('.quote-product-search input')
      if (input) input.focus()
    }, 50)
  }

  const addProductFromSearch = () => {
    if (!searchTerm) return

    const exactProduct =
      quoteProducts.find(
        (product) =>
          product.code.toLowerCase() === searchTerm ||
          product.barcode.toLowerCase() === searchTerm
      ) || filteredQuoteProducts[0]

    if (!exactProduct) {
      alert('Producto no encontrado.')
      return
    }

    addProductToQuote(exactProduct)
  }

  const updateQuoteItem = (code, field, value) => {
    setQuoteItems((current) =>
      current.map((item) =>
        item.code === code
          ? {
              ...item,
              [field]: field === 'qty' || field === 'discount' ? Number(value || 0) : value,
            }
          : item
      )
    )
  }

  const increaseQuoteQty = (code) => {
    setQuoteItems((current) =>
      current.map((item) =>
        item.code === code ? { ...item, qty: item.qty + 1 } : item
      )
    )
  }

  const decreaseQuoteQty = (code) => {
    setQuoteItems((current) =>
      current.map((item) =>
        item.code === code ? { ...item, qty: Math.max(item.qty - 1, 1) } : item
      )
    )
  }

  const removeQuoteItem = (code) => {
    setQuoteItems((current) => current.filter((item) => item.code !== code))
  }

  const clearQuote = () => {
    setQuoteStarted(false)
    setSelectedClientCode('CONTADO')
    setSearchValue('')
    setQuoteItems([])
    setQuoteNote('Esta cotizacion tiene validez segun la fecha indicada.')
    setValidUntil('')
    setCurrentQuoteNumber('')
  }

  const startQuote = () => {
    setQuoteStarted(true)

    setTimeout(() => {
      const input = document.querySelector('.quote-product-search input')
      if (input) input.focus()
    }, 100)
  }

  const saveQuote = () => {
    if (quoteItems.length === 0) {
      alert('Debes agregar productos a la cotizacion.')
      return false
    }

    if (currentQuoteNumber) {
      return true
    }

    const createdNumber = `COT-${String(quotes.length + 1).padStart(6, '0')}`

    const createdQuote = {
      number: createdNumber,
      customer: selectedClient.name,
      document: selectedClient.document,
      date: today,
      validUntil: validUntil || defaultValidUntil,
      total,
      status: 'Borrador',
    }

    setQuotes((current) => [createdQuote, ...current])
    setCurrentQuoteNumber(createdNumber)

    return true
  }

  const printQuote = () => {
    if (saveQuote()) {
      setTimeout(() => window.print(), 400)
    }
  }

  if (!quoteStarted) {
    return (
      <section className="quotes-page">
        <div className="quotes-header">
          <div>
            <span>Modulo de ventas</span>
            <h3>Cotizaciones</h3>
            <p>Crea cotizaciones profesionales, imprime el documento y luego conviertela en factura.</p>
          </div>

          <button className="primary-button" onClick={startQuote}>
            Nueva cotizacion
          </button>
        </div>

        <section className="quotes-summary-grid">
          <div className="quote-summary-card">
            <p>Total cotizaciones</p>
            <h4>{quotes.length}</h4>
            <span>Registradas</span>
          </div>

          <div className="quote-summary-card">
            <p>Borradores</p>
            <h4>{quotes.filter((quote) => quote.status === 'Borrador').length}</h4>
            <span>Pendientes de enviar</span>
          </div>

          <div className="quote-summary-card">
            <p>Enviadas</p>
            <h4>{quotes.filter((quote) => quote.status === 'Enviada').length}</h4>
            <span>Esperando respuesta</span>
          </div>

          <div className="quote-summary-card">
            <p>Monto cotizado</p>
            <h4>RD$ {quotes.reduce((sum, quote) => sum + quote.total, 0).toLocaleString('es-DO')}</h4>
            <span>Total general</span>
          </div>
        </section>

        <section className="card quotes-list-card">
          <div className="card-header">
            <h3>Listado de cotizaciones</h3>
            <button onClick={startQuote}>Crear cotizacion</button>
          </div>

          <div className="quotes-table">
            <div className="quotes-table-head">
              <span>No. Cotizacion</span>
              <span>Cliente</span>
              <span>RNC/Cedula</span>
              <span>Fecha</span>
              <span>Valida hasta</span>
              <span>Total</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>

            {quotes.map((quote) => (
              <div key={quote.number} className="quotes-table-row">
                <strong>{quote.number}</strong>
                <span>{quote.customer}</span>
                <span>{quote.document}</span>
                <span>{quote.date}</span>
                <span>{quote.validUntil}</span>
                <b>RD$ {quote.total.toLocaleString('es-DO')}</b>
                <em className={quote.status === 'Enviada' ? 'status-ok' : 'status-neutral'}>
                  {quote.status}
                </em>
                <div className="quote-row-actions">
                  <button title="Ver">Ver</button>
                  <button title="Convertir">Facturar</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    )
  }

  return (
    <>
      <section className="quote-create-page">
        <div className="quote-main">
          <div className="quote-create-header">
            <div>
              <h3>Nueva cotizacion</h3>
              <p>Selecciona cliente, agrega productos y genera una cotizacion profesional.</p>
            </div>

            <div className="quote-header-actions">
              <button className="secondary-button" onClick={clearQuote}>
                Cancelar
              </button>

              <button className="secondary-button" onClick={saveQuote}>
                Guardar borrador
              </button>

              <button className="primary-button small" onClick={printQuote}>
                Generar cotizacion
              </button>
            </div>
          </div>

          <section className="quote-top-panel">
            <div className="quote-info-card">
              <span>Cliente</span>

              <select
                value={selectedClientCode}
                onChange={(event) => setSelectedClientCode(event.target.value)}
              >
                <option value="CONTADO">Cliente de mostrador</option>
                {clients.map((client) => (
                  <option key={client.code} value={client.code}>
                    {client.code} - {client.name} - {client.document}
                  </option>
                ))}
              </select>

              <strong>{selectedClient.name}</strong>
              <small>RNC/Cedula: {selectedClient.document}</small>
            </div>

            <div className="quote-info-card">
              <span>Cotizacion</span>
              <strong>{quoteNumber}</strong>
              <small>Fecha: {today}</small>

              <label>
                Valida hasta
                <input
                  type="date"
                  value={validUntil}
                  onChange={(event) => setValidUntil(event.target.value)}
                />
              </label>
            </div>

            <div className="quote-total-card">
              <span>Total cotizado</span>
              <strong>RD$ {total.toFixed(2)}</strong>
              <small>Incluye ITBIS calculado al 18%</small>
            </div>
          </section>

          <section className="quote-product-entry">
            <div className="quote-product-search">
              <div className="quote-search-icon">
                <ScanBarcode size={30} />
              </div>

              <div>
                <strong>Buscar o escanear producto</strong>
                <span>Escribe codigo, codigo de barra o nombre del producto</span>
              </div>

              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addProductFromSearch()
                  }
                }}
                placeholder="Buscar producto..."
              />

              <button onClick={addProductFromSearch}>Agregar</button>

              {searchTerm && (
                <div className="quote-search-results">
                  {filteredQuoteProducts.length === 0 ? (
                    <p>No se encontraron productos.</p>
                  ) : (
                    filteredQuoteProducts.map((product) => (
                      <button key={product.code} onClick={() => addProductToQuote(product)}>
                        <span>{product.code}</span>
                        <strong>{product.name}</strong>
                        <small>Stock {product.stock}</small>
                        <b>RD$ {product.price.toFixed(2)}</b>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="quote-detail-card">
            <div className="card-header">
              <h3>Productos cotizados ({quoteItems.length})</h3>
              <button onClick={() => setQuoteItems([])}>Limpiar productos</button>
            </div>

            <div className="quote-detail-table">
              <div className="quote-detail-head">
                <span>Codigo</span>
                <span>Producto</span>
                <span>Cantidad</span>
                <span>Precio</span>
                <span>Desc.</span>
                <span>Total</span>
                <span></span>
              </div>

              {quoteItems.map((item) => (
                <div key={item.code} className="quote-detail-row">
                  <strong>{item.code}</strong>

                  <div>
                    <b>{item.name}</b>
                    <small>{item.unit}</small>
                  </div>

                  <div className="qty-control">
                    <button onClick={() => decreaseQuoteQty(item.code)}>-</button>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(event) => updateQuoteItem(item.code, 'qty', event.target.value)}
                    />
                    <button onClick={() => increaseQuoteQty(item.code)}>+</button>
                  </div>

                  <span>RD$ {item.price.toFixed(2)}</span>

                  <input
                    className="discount-input"
                    type="number"
                    value={item.discount}
                    onChange={(event) => updateQuoteItem(item.code, 'discount', event.target.value)}
                  />

                  <b>RD$ {Math.max(item.qty * item.price - Number(item.discount || 0), 0).toFixed(2)}</b>

                  <button className="remove-line" onClick={() => removeQuoteItem(item.code)}>X</button>
                </div>
              ))}

              {quoteItems.length === 0 && (
                <div className="empty-cart">
                  Busca o escanea productos para agregarlos a la cotizacion.
                </div>
              )}
            </div>

            <textarea
              className="invoice-comment"
              value={quoteNote}
              onChange={(event) => setQuoteNote(event.target.value)}
              placeholder="Nota u observacion de la cotizacion..."
            />
          </section>
        </div>

        <aside className="quote-side">
          <section className="billing-v2-side-card billing-v2-totals">
            <div>
              <span>Subtotal</span>
              <strong>RD$ {subtotal.toFixed(2)}</strong>
            </div>

            <div>
              <span>Descuento</span>
              <strong className="negative">- RD$ {discount.toFixed(2)}</strong>
            </div>

            <div>
              <span>ITBIS (18%)</span>
              <strong>RD$ {itbis.toFixed(2)}</strong>
            </div>

            <hr />

            <div className="billing-v2-grand-total">
              <span>Total general</span>
              <strong>RD$ {total.toFixed(2)}</strong>
            </div>
          </section>

          <button className="generate-invoice-button" onClick={printQuote}>
            Generar cotizacion
          </button>

          <button className="secondary-button">
            Convertir en factura
          </button>
        </aside>
      </section>

      <section className="print-quote-sheet">
        <div className="print-invoice-header">
          <div>
            <div className="print-brand">
              <div className="print-logo-mark">
                {businessSettings.logo ? (
                  <img src={businessSettings.logo} alt="Logo" />
                ) : (
                  businessSettings.businessShortName.charAt(0)
                )}
              </div>
              <div>
                <h1>{businessSettings.businessShortName}</h1>
                <span>{businessSettings.systemLabel}</span>
              </div>
            </div>

            <h3>{businessSettings.businessName}</h3>
            <p>{businessSettings.slogan}</p>
            <p><strong>RNC:</strong> {businessSettings.rnc}</p>
            <p><strong>Tel:</strong> {businessSettings.phone}</p>
            <p><strong>Email:</strong> {businessSettings.email}</p>
            <p>{businessSettings.address}</p>
          </div>

          <div className="print-invoice-title">
            <h2>COTIZACION</h2>
            <strong>No. {quoteNumber}</strong>

            <div className="print-date-box">
              <p><span>Fecha de emision:</span> {today}</p>
              <p><span>Valida hasta:</span> {validUntil || defaultValidUntil}</p>
              <p><span>Condicion:</span> Sujeto a disponibilidad</p>
            </div>
          </div>
        </div>

        <div className="print-info-grid">
          <div className="print-info-card">
            <h4>DATOS DEL CLIENTE</h4>
            <p><span>Cliente:</span> <strong>{selectedClient.name}</strong></p>
            <p><span>RNC / Cedula:</span> {selectedClient.document}</p>
            <p><span>Telefono:</span> {selectedClient.phone}</p>
            <p><span>Direccion:</span> {selectedClient.address || 'N/A'}</p>
          </div>

          <div className="print-info-card">
            <h4>INFORMACION DE LA COTIZACION</h4>
            <p><span>Vendedor:</span> Administrador</p>
            <p><span>Moneda:</span> Pesos Dominicanos (RD$)</p>
            <p><span>Estado:</span> Borrador</p>
            <p><span>Validez:</span> {validUntil || defaultValidUntil}</p>
          </div>
        </div>

        <table className="print-products-table">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Descripcion</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>ITBIS (18%)</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {quoteItems.map((item) => {
              const lineBase = Math.max(item.qty * item.price - Number(item.discount || 0), 0)
              const lineTax = lineBase * 0.18
              const lineTotal = lineBase + lineTax

              return (
                <tr key={item.code}>
                  <td>{item.code}</td>
                  <td>
                    <strong>{item.name}</strong>
                    <span>{item.unit}</span>
                  </td>
                  <td>{item.qty}</td>
                  <td>RD$ {item.price.toFixed(2)}</td>
                  <td>RD$ {lineTax.toFixed(2)}</td>
                  <td><strong>RD$ {lineTotal.toFixed(2)}</strong></td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="print-bottom-grid">
          <div>
            <h4>OBSERVACIONES</h4>
            <div className="print-observations">
              <p>{quoteNote || 'Esta cotizacion tiene validez segun la fecha indicada.'}</p>
              <p>Los precios pueden variar segun disponibilidad de inventario.</p>
            </div>
          </div>

          <div className="print-total-box">
            <p><span>Subtotal:</span> <strong>RD$ {subtotal.toFixed(2)}</strong></p>
            <p><span>Descuento:</span> <strong>- RD$ {discount.toFixed(2)}</strong></p>
            <p><span>ITBIS (18%):</span> <strong>RD$ {itbis.toFixed(2)}</strong></p>
            <hr />
            <h3><span>TOTAL GENERAL:</span> RD$ {total.toFixed(2)}</h3>
          </div>
        </div>

        <footer className="print-footer">
          Esta cotizacion fue generada por <strong>INVE-FAT SYSTEM</strong>
          <br />
          Software de Gestion Empresarial
        </footer>
      </section>
    </>
  )
}

function SalesSafeInvoiceTable({ invoices }) {
  return (
    <div className="sales-safe-table">
      <div className="sales-safe-table-head">
        <span>No. factura</span>
        <span>Cliente</span>
        <span>RNC/Cedula</span>
        <span>Fecha</span>
        <span>Total</span>
        <span>Pago</span>
        <span>Estado</span>
      </div>

      {invoices.map((invoice) => (
        <div key={invoice.number} className="sales-safe-table-row">
          <strong>{invoice.number}</strong>
          <span>{invoice.customer}</span>
          <span>{invoice.document}</span>
          <span>{invoice.date}</span>
          <b>RD$ {invoice.total.toLocaleString('es-DO')}</b>
          <span>{invoice.payment}</span>
          <em className={invoice.status === 'Pagada' ? 'status-ok' : 'status-low'}>
            {invoice.status}
          </em>
        </div>
      ))}

      {invoices.length === 0 && (
        <div className="empty-products">
          No hay facturas para mostrar.
        </div>
      )}
    </div>
  )
}

function SalesSafeClientTable({ clients }) {
  return (
    <div className="sales-safe-client-table">
      <div className="sales-safe-client-head">
        <span>Codigo</span>
        <span>Cliente</span>
        <span>RNC/Cedula</span>
        <span>Telefono</span>
        <span>Correo</span>
        <span>Tipo</span>
        <span>Credito</span>
        <span>Balance</span>
        <span>Estado</span>
      </div>

      {clients.map((client) => (
        <div key={client.code} className="sales-safe-client-row">
          <strong>{client.code}</strong>
          <span>{client.name}</span>
          <span>{client.document}</span>
          <span>{client.phone}</span>
          <span>{client.email}</span>
          <span>{client.type}</span>
          <b>RD$ {client.creditLimit.toLocaleString('es-DO')}</b>
          <b className={client.balance > 0 ? 'negative' : 'positive'}>
            RD$ {client.balance.toLocaleString('es-DO')}
          </b>
          <em className={client.status === 'Activo' ? 'status-ok' : 'status-low'}>
            {client.status}
          </em>
        </div>
      ))}
    </div>
  )
}

function SalesSafePlaceholder({ title }) {
  return (
    <section className="card sales-safe-placeholder">
      <h3>{title}</h3>
      <p>Esta parte del modulo Ventas sera trabajada en el siguiente paso.</p>
      <button className="primary-button small">Crear nuevo</button>
    </section>
  )
}

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('invefat-theme') || 'light')

  useEffect(() => {
    localStorage.setItem('invefat-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className={'app-shell ' + (theme === 'dark' ? 'dark-theme' : '')}>
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        isMobileOpen={mobileSidebarOpen}
        closeMobileMenu={() => setMobileSidebarOpen(false)}
      />

      {mobileSidebarOpen && (
        <button
          className="mobile-overlay"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Cerrar menu"
        />
      )}

      <div className="workspace">
        <Navbar
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
        />
        <Content activeModule={activeModule} setActiveModule={setActiveModule} />
      </div>
    </div>
  )
}
