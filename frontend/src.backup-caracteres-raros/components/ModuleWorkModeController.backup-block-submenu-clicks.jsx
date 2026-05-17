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

function removeInventoryInlineSubmenu() {
  document.querySelectorAll('.inventory-inline-submenu').forEach((element) => {
    element.remove()
  })
}

function createInventoryInlineSubmenu(clickedModule) {
  removeInventoryInlineSubmenu()

  const submenu = document.createElement('div')
  submenu.className = 'inventory-inline-submenu'

  const header = document.createElement('div')
  header.className = 'inventory-inline-submenu-header'
  header.textContent = 'Submódulos'

  const list = document.createElement('div')
  list.className = 'inventory-inline-submenu-list'

  inventorySubmenuItems.forEach((item) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = item

    button.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()

      /*
        Por ahora estos botones solo son visuales.
        Así evitamos la pantalla en blanco.
        Luego conectamos uno por uno: Productos, Almacenes, Recepción, etc.
      */
    })

    list.appendChild(button)
  })

  submenu.appendChild(header)
  submenu.appendChild(list)

  clickedModule.insertAdjacentElement('afterend', submenu)
}

function clickDashboardButton() {
  document.body.classList.remove('sidebar-collapsed-mode')
  removeInventoryInlineSubmenu()

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
      removeInventoryInlineSubmenu()
      window.dispatchEvent(new Event('invefat:module-work-mode-change'))
    }, 120)
  }, 80)
}

export default function ModuleWorkModeController() {
  const [isModuleMode, setIsModuleMode] = useState(() => {
    return document.body.classList.contains('module-work-mode')
  })

  useEffect(() => {
    const refreshMode = () => {
      setIsModuleMode(document.body.classList.contains('module-work-mode'))
    }

    const enterModuleModeDelayed = () => {
      removeInventoryInlineSubmenu()

      /*
        IMPORTANTE:
        No escondemos sidebar inmediatamente.
        Primero dejamos que React abra el módulo.
        Luego activamos modo página.
      */
      window.setTimeout(() => {
        document.body.classList.add('module-work-mode')
        document.body.classList.add('sidebar-collapsed-mode')
        refreshMode()
        window.dispatchEvent(new Event('invefat:module-work-mode-change'))
      }, 450)
    }

    const exitModuleMode = () => {
      clickDashboardButton()
    }

    const handleSidebarClick = (event) => {
      if (event.target.closest('.inventory-inline-submenu')) {
        return
      }

      const clickedModule = event.target.closest(
        '.sidebar button, .sidebar a, aside button, aside a'
      )

      if (!clickedModule) {
        if (!event.target.closest('.sidebar') && !event.target.closest('aside')) {
          removeInventoryInlineSubmenu()
        }

        return
      }

      const text = normalizeText(clickedModule.textContent)

      if (!text) return

      if (text.includes('dashboard')) {
        removeInventoryInlineSubmenu()
        document.body.classList.remove('module-work-mode')
        document.body.classList.remove('sidebar-collapsed-mode')
        refreshMode()
        return
      }

      if (text.includes('inventario') || text.includes('almacen') || text.includes('almacén')) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation?.()

        const alreadyOpen = clickedModule.nextElementSibling?.classList?.contains('inventory-inline-submenu')

        removeInventoryInlineSubmenu()

        if (!alreadyOpen) {
          createInventoryInlineSubmenu(clickedModule)
        }

        return
      }

      enterModuleModeDelayed()
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return

      if (document.body.classList.contains('module-work-mode')) {
        event.preventDefault()
        exitModuleMode()
        return
      }

      removeInventoryInlineSubmenu()
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
      removeInventoryInlineSubmenu()
    }
  }, [])

  if (!isModuleMode) return null

  return (
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
  )
}