import { useEffect, useState } from 'react'

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const inventorySubmenuItems = [
  'Resumen',
  'Productos',
  'Categorías',
  'Almacenes',
  'Movimientos',
  'Recepción',
  'Lotes y series',
  'Multiubicación',
  'Variantes y kits',
  'Barcode QR RFID',
  'Putaway',
  'FIFO FEFO LIFO',
  'Picking',
  'Reposición',
  'Calidad',
]

function clickDashboardButton() {
  document.body.classList.remove('sidebar-collapsed-mode')

  window.setTimeout(() => {
    const sidebar = document.querySelector('.sidebar') || document.querySelector('aside')
    const root = sidebar || document

    const buttons = Array.from(root.querySelectorAll('button, a, [role="button"]'))

    const dashboardButton = buttons.find((button) => {
      const text = normalizeText(button.textContent)
      return text.includes('dashboard')
    })

    if (dashboardButton) {
      dashboardButton.click()
    }

    window.setTimeout(() => {
      document.body.classList.remove('module-work-mode')
      document.body.classList.remove('sidebar-collapsed-mode')
      window.dispatchEvent(new Event('invefat:module-work-mode-change'))
    }, 120)
  }, 80)
}

export default function ModuleWorkModeController() {
  const [isModuleMode, setIsModuleMode] = useState(() => {
    return document.body.classList.contains('module-work-mode')
  })
  const [showInventorySubmenu, setShowInventorySubmenu] = useState(false)
  const [submenuTop, setSubmenuTop] = useState(210)

  useEffect(() => {
    const refreshMode = () => {
      setIsModuleMode(document.body.classList.contains('module-work-mode'))
    }

    const enterModuleMode = () => {
      setShowInventorySubmenu(false)
      document.body.classList.add('module-work-mode')
      document.body.classList.add('sidebar-collapsed-mode')
      refreshMode()
    }

    const exitModuleMode = () => {
      setShowInventorySubmenu(false)
      clickDashboardButton()
    }

    const handleSidebarClick = (event) => {
      if (event.target.closest('.inventory-sidebar-submenu-panel')) {
        return
      }

      const clickedModule = event.target.closest(
        '.sidebar button, .sidebar a, aside button, aside a'
      )

      if (!clickedModule) {
        if (!event.target.closest('.sidebar') && !event.target.closest('aside')) {
          setShowInventorySubmenu(false)
        }

        return
      }

      const text = normalizeText(clickedModule.textContent)

      if (!text) return

      if (text.includes('dashboard')) {
        setShowInventorySubmenu(false)
        document.body.classList.remove('module-work-mode')
        document.body.classList.remove('sidebar-collapsed-mode')
        refreshMode()
        return
      }

      if (text.includes('inventario') || text.includes('almacen') || text.includes('almacén')) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation?.()

        const rect = clickedModule.getBoundingClientRect()
        const maxTop = Math.max(130, window.innerHeight - 480)
        const nextTop = Math.min(Math.max(rect.bottom + 6, 120), maxTop)

        setSubmenuTop(nextTop)
        setShowInventorySubmenu((current) => !current)
        return
      }

      setShowInventorySubmenu(false)
      enterModuleMode()
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return

      if (document.body.classList.contains('module-work-mode')) {
        event.preventDefault()
        exitModuleMode()
        return
      }

      setShowInventorySubmenu(false)
    }

    const handleExternalChange = () => {
      refreshMode()
    }

    document.addEventListener('click', handleSidebarClick, true)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('invefat:module-work-mode-change', handleExternalChange)

    const observer = new MutationObserver(refreshMode)

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    })

    refreshMode()

    return () => {
      document.removeEventListener('click', handleSidebarClick, true)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('invefat:module-work-mode-change', handleExternalChange)
      observer.disconnect()
    }
  }, [])

  return (
    <>
      {showInventorySubmenu && !isModuleMode && (
        <aside
          className="inventory-sidebar-submenu-panel"
          style={{ top: `${submenuTop}px` }}
        >
          <div className="inventory-sidebar-submenu-header">
            <strong>Inventario y Almacén</strong>

            <button
              type="button"
              onClick={() => setShowInventorySubmenu(false)}
              aria-label="Cerrar submenú"
            >
              ×
            </button>
          </div>

          <div className="inventory-sidebar-submenu-list">
            {inventorySubmenuItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </aside>
      )}

      {isModuleMode && (
        <button
          type="button"
          className="module-exit-button"
          onClick={clickDashboardButton}
          title="Salir del modulo y volver al Dashboard"
          aria-label="Salir del modulo"
        >
          <span>×</span>
          Salir
        </button>
      )}
    </>
  )
}