import { useEffect, useRef, useState } from 'react'

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
      event.stopImmediatePropagation?.()

      if (item === 'Productos') {
        window.dispatchEvent(new CustomEvent('invefat:open-inventory-submodule', {
          detail: {
            target: 'Productos',
          },
        }))
      }

      return false
    }, true)

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
  const ignoreSidebarClickRef = useRef(false)

  const [isModuleMode, setIsModuleMode] = useState(() => {
    return document.body.classList.contains('module-work-mode')
  })

  useEffect(() => {
    const refreshMode = () => {
      setIsModuleMode(document.body.classList.contains('module-work-mode'))
    }

    const enterModuleModeDelayed = () => {
      removeInventoryInlineSubmenu()

      window.setTimeout(() => {
        document.body.classList.add('module-work-mode')
        document.body.classList.add('sidebar-collapsed-mode')
        refreshMode()
        window.dispatchEvent(new Event('invefat:module-work-mode-change'))
      }, 450)
    }

    const openInventoryProducts = () => {
      removeInventoryInlineSubmenu()

      ignoreSidebarClickRef.current = true

      const openedInventory = clickElementByText(
        ['Inventario y Almacén', 'Inventario y Almacen', 'Inventario'],
        ['.sidebar', 'aside', 'body']
      )

      window.setTimeout(() => {
        ignoreSidebarClickRef.current = false
      }, 350)

      if (!openedInventory) {
        console.warn('No se encontró Inventario y Almacén.')
        return
      }

      window.setTimeout(() => {
        clickElementByText(
          ['Productos'],
          ['.main-panel', '.app-main', '.main-content', '.content', 'main', 'body']
        )
      }, 650)

      window.setTimeout(() => {
        document.body.classList.add('module-work-mode')
        document.body.classList.add('sidebar-collapsed-mode')
        refreshMode()
        window.dispatchEvent(new Event('invefat:module-work-mode-change'))
      }, 1100)
    }

    const exitModuleMode = () => {
      clickDashboardButton()
    }

    const handleOpenInventorySubmodule = (event) => {
      const target = event.detail?.target

      if (target === 'Productos') {
        openInventoryProducts()
      }
    }

    const handleSidebarClick = (event) => {
      if (ignoreSidebarClickRef.current) return

      if (event.target.closest('.inventory-inline-submenu')) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation?.()
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
    window.addEventListener('invefat:open-inventory-submodule', handleOpenInventorySubmodule)

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
      window.removeEventListener('invefat:open-inventory-submodule', handleOpenInventorySubmodule)
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