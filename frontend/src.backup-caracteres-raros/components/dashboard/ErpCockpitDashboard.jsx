import { useEffect } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileText,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Truck,
  UserPlus,
  Users,
  Warehouse,
} from 'lucide-react'
import './ErpCockpitDashboard.css'

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function getVisibleClickableElements(root) {
  return Array.from(root.querySelectorAll('button, a, [role="button"], [tabindex]'))
    .filter((element) => {
      const rect = element.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    })
}

function clickElementByText(searchTexts, selectors = ['body']) {
  const targets = Array.isArray(searchTexts) ? searchTexts : [searchTexts]
  const normalizedTargets = targets.map((text) => normalizeText(text))

  const roots = selectors
    .map((selector) => document.querySelector(selector))
    .filter(Boolean)

  if (roots.length === 0) {
    roots.push(document.body)
  }

  for (const root of roots) {
    const elements = getVisibleClickableElements(root)

    const exactMatch = elements.find((element) => {
      const text = normalizeText(element.textContent)
      return normalizedTargets.some((target) => text === target)
    })

    if (exactMatch) {
      exactMatch.click()
      return true
    }

    const partialMatch = elements.find((element) => {
      const text = normalizeText(element.textContent)
      return normalizedTargets.some((target) => text.includes(target))
    })

    if (partialMatch) {
      partialMatch.click()
      return true
    }
  }

  return false
}

function clickStepRepeated(searchTexts, selectors, delay = 350, attempts = 8) {
  let count = 0

  const tryClick = () => {
    count += 1

    const clicked = clickElementByText(searchTexts, selectors)

    if (!clicked && count < attempts) {
      window.setTimeout(tryClick, delay)
    }
  }

  window.setTimeout(tryClick, delay)
}

function openSystemArea(shortcut) {
  document.body.classList.add('module-work-mode')
  document.body.classList.add('sidebar-collapsed-mode')
  const openedMainModule = clickElementByText(shortcut.moduleText, [
    '.sidebar',
    'aside',
    'body',
  ])

  if (!openedMainModule) {
    console.warn(`No se encontro el modulo principal: ${shortcut.title}`)
    return
  }

  if (!shortcut.actionFlow || shortcut.actionFlow.length === 0) {
    return
  }

  shortcut.actionFlow.forEach((step, index) => {
    clickStepRepeated(
      step,
      [
        '.main-panel',
        '.app-main',
        '.main-content',
        '.content',
        'main',
      ],
      420 + index * 380,
      8
    )
  })
}
export default function ErpCockpitDashboard() {
  useEffect(() => {
    document.body.classList.remove('module-work-mode')

    const handleSidebarClick = (event) => {
      const clickedModule = event.target.closest('.sidebar button, .sidebar a, aside button, aside a')

      if (!clickedModule) return

      const text = normalizeText(clickedModule.textContent)

      if (text.includes('dashboard')) {
        document.body.classList.remove('module-work-mode')
        document.body.classList.remove('sidebar-collapsed-mode')
        return
      }

      document.body.classList.add('module-work-mode')
  document.body.classList.add('sidebar-collapsed-mode')
    }

    document.addEventListener('click', handleSidebarClick, true)

    return () => {
      document.removeEventListener('click', handleSidebarClick, true)
    }
  }, [])

  const shortcuts = [
    {
      title: 'Nueva venta',
      subtitle: 'Crear factura',
      icon: ShoppingCart,
      color: 'green',
      moduleText: ['Ventas'],
      actionFlow: [
        ['Factura'],
      ],
    },
    {
      title: 'Nueva compra',
      subtitle: 'Crear compra',
      icon: ShoppingBag,
      color: 'blue',
      moduleText: ['Compras'],
      actionFlow: [
        ['Ordenes de compra', 'ÃƒÆ’Ã¢â‚¬Å“rdenes de compra', 'Compra', 'Compras'],
        ['Nueva orden', 'Crear orden', 'Nueva compra', 'Crear compra', 'Agregar compra'],
      ],
    },
    {
      title: 'Recibir mercancia',
      subtitle: 'Crear recepcion',
      icon: Truck,
      color: 'orange',
      moduleText: ['Inventario', 'Inventario y Almacen', 'Inventario y AlmacÃƒÆ’Ã‚Â©n', 'Compras'],
      actionFlow: [
        ['Recepcion', 'RecepciÃƒÆ’Ã‚Â³n', 'Recibir mercancia', 'Recibir mercancÃƒÆ’Ã‚Â­a'],
        ['Nueva recepcion', 'Nueva recepciÃƒÆ’Ã‚Â³n', 'Crear recepcion', 'Crear recepciÃƒÆ’Ã‚Â³n', 'Registrar entrada', 'Recibir'],
      ],
    },
    {
      title: 'Inventario',
      subtitle: 'Stock y movimientos',
      icon: Warehouse,
      color: 'cyan',
      moduleText: ['Inventario', 'Inventario y Almacen', 'Inventario y AlmacÃƒÆ’Ã‚Â©n'],
    },
    {
      title: 'Cotizacion',
      subtitle: 'Crear cotizacion',
      icon: FileText,
      color: 'blue',
      moduleText: ['Ventas'],
      actionFlow: [
        ['Cotizaciones', 'Cotizacion', 'CotizaciÃƒÆ’Ã‚Â³n'],
        ['Nueva cotizacion', 'Nueva cotizaciÃƒÆ’Ã‚Â³n', 'Crear cotizacion', 'Crear cotizaciÃƒÆ’Ã‚Â³n', 'Agregar cotizacion'],
      ],
    },
    {
      title: 'Reportes',
      subtitle: 'Ver indicadores',
      icon: BarChart3,
      color: 'green',
      moduleText: ['Reportes', 'Reporte'],
    },
  ]

  const previews = [
    {
      title: 'Ventas del dia',
      value: 'RD$ 125,430',
      detail: '+12.5% vs ayer',
      icon: ShoppingCart,
      color: 'green',
      lines: ['18 facturas emitidas', '5 cotizaciones abiertas', '3 ventas pendientes de cobro'],
    },
    {
      title: 'Compras del dia',
      value: 'RD$ 75,230',
      detail: '4 ordenes registradas',
      icon: ShoppingBag,
      color: 'blue',
      lines: ['2 compras recibidas', '1 orden esperando aprobacion', '1 factura pendiente'],
    },
    {
      title: 'Inventario bajo',
      value: '23 productos',
      detail: 'Requieren reposicion',
      icon: Boxes,
      color: 'orange',
      lines: ['Toner HP 85A: critico', 'Papel bond A4: bajo', 'Teclados Logitech: bajo'],
    },
    {
      title: 'Cuentas por cobrar',
      value: 'RD$ 250,000',
      detail: '12 clientes pendientes',
      icon: Users,
      color: 'purple',
      lines: ['3 facturas vencidas', '6 vencen esta semana', 'Cliente ABC con mayor balance'],
    },
    {
      title: 'Cuentas por pagar',
      value: 'RD$ 125,000',
      detail: '8 proveedores pendientes',
      icon: CreditCard,
      color: 'red',
      lines: ['2 pagos vencen hoy', '4 pagos esta semana', 'Proveedor Tech Solutions pendiente'],
    },
    {
      title: 'Flujo de caja',
      value: 'RD$ 80,430',
      detail: '+8.7% vs ayer',
      icon: DollarSign,
      color: 'green',
      lines: ['Ingresos: RD$ 205,430', 'Egresos: RD$ 125,000', 'Balance positivo'],
    },
  ]

  const workPanels = [
    {
      title: 'Alertas y aprobaciones',
      icon: AlertTriangle,
      color: 'orange',
      items: [
        'Orden de compra #OC-2458 pendiente',
        '23 productos con stock bajo',
        '12 facturas por cobrar',
      ],
    },
    {
      title: 'Documentos recientes',
      icon: ClipboardList,
      color: 'blue',
      items: [
        'FV-000245 - Factura de venta',
        'OC-000125 - Orden de compra',
        'RM-000189 - Recepcion de mercancia',
      ],
    },
    {
      title: 'Actividad reciente',
      icon: Receipt,
      color: 'green',
      items: [
        'Factura creada hace 10 minutos',
        'Mercancia recibida en almacen',
        'Producto actualizado por administrador',
      ],
    },
  ]

  return (
    <section className="simple-dashboard">
      <header className="simple-dashboard-header">
        <div>
          <span>Panel principal</span>
          <h1>Bienvenido, Administrador</h1>
          <p>Accesos rapidos visibles y resumen operativo en vista previa.</p>
        </div>

        <div className="simple-dashboard-date">
          <strong>Hoy</strong>
          <span>24 mayo 2025</span>
        </div>
      </header>

      <section className="simple-quick-section">
        <div className="simple-section-title">
          <div>
            <span>Trabajo rapido</span>
            <h2>Accesos rapidos</h2>
          </div>

          <p>Las operaciones principales quedan siempre visibles.</p>
        </div>

        <div className="simple-shortcuts-grid">
          {shortcuts.map((item) => {
            const Icon = item.icon

            return (
              <button
                key={item.title}
                type="button"
                className={`simple-shortcut ${item.color}`}
                onClick={() => openSystemArea(item)}
                title={`Abrir ${item.title}`}
              >
                <span>
                  <Icon size={28} strokeWidth={2.5} />
                </span>

                <strong>{item.title}</strong>
                <small>{item.subtitle}</small>
              </button>
            )
          })}
        </div>
      </section>

      <section className="simple-preview-section">
        <div className="simple-section-title compact">
          <div>
            <span>Resumen</span>
            <h2>Vista previa operativa</h2>
          </div>

          <p>Pasa el puntero por encima para expandir cada bloque.</p>
        </div>

        <div className="simple-preview-grid">
          {previews.map((item) => {
            const Icon = item.icon

            return (
              <article key={item.title} className={`simple-preview-card ${item.color}`}>
                <div className="simple-preview-main">
                  <span className="simple-preview-icon">
                    <Icon size={25} strokeWidth={2.5} />
                  </span>

                  <div>
                    <small>{item.title}</small>
                    <strong>{item.value}</strong>
                    <p>{item.detail}</p>
                  </div>
                </div>

                <div className="simple-preview-expand">
                  {item.lines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="simple-work-grid">
        {workPanels.map((panel) => {
          const Icon = panel.icon

          return (
            <article key={panel.title} className={`simple-work-card ${panel.color}`}>
              <div className="simple-work-head">
                <span>
                  <Icon size={23} strokeWidth={2.5} />
                </span>

                <h3>{panel.title}</h3>
              </div>

              <div className="simple-work-preview">
                {panel.items.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </article>
          )
        })}
      </section>

      <footer className="simple-dashboard-footer">
        <span>INVE-FAT SYSTEM</span>
        <span>Sucursal Principal</span>
        <span>Usuario: Administrador</span>
        <span>ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â© 2025</span>
      </footer>
    </section>
  )
}