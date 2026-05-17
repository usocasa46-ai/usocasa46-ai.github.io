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
  'CategorÃƒÂ­as',
  'Almacenes',
  'Movimientos',
  'RecepciÃƒÂ³n',
  'Lotes y series',
  'MultiubicaciÃƒÂ³n',
  'Variantes y kits',
  'Barcode QR RFID',
  'Putaway',
  'FIFO FEFO LIFO',
  'Picking',
  'ReposiciÃƒÂ³n',
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


function hideInventoryParentChrome() {
  const root =
    document.querySelector('.main-panel') ||
    document.querySelector('.app-main') ||
    document.querySelector('.main-content') ||
    document.querySelector('main') ||
    document.body

  const inventoryTabs = [
    'resumen',
    'productos',
    'categorias',
    'categorías',
    'almacenes',
    'movimientos',
    'recepcion',
    'recepción',
    'lotes y series',
    'multiubicacion',
    'multiubicación',
    'variantes y kits',
    'barcode qr rfid',
    'putaway',
    'fifo fefo lifo',
    'picking',
    'reposicion',
    'reposición',
    'costos',
    'conteo ciclico',
    'conteo cíclico',
    'mermas y devoluciones',
    'abc',
    'kpis',
    'api edi movil',
  ]

  Array.from(root.querySelectorAll('header, section, div')).forEach((element) => {
    const text = normalizeText(element.textContent)

    if (
      text.includes('inventario y almacen') &&
      text.includes('controla productos')
    ) {
      element.classList.add('module-parent-chrome-hidden')
    }
  })

  Array.from(root.querySelectorAll('span, p, h1, h2')).forEach((element) => {
    const text = normalizeText(element.textContent)

    if (
      text === 'modulo activo' ||
      text === 'módulo activo' ||
      text === 'inventario y almacen' ||
      text === 'inventario y almacén' ||
      text.includes('controla productos, categorias') ||
      text.includes('controla productos, categorías')
    ) {
      element.classList.add('module-parent-chrome-hidden')
    }
  })

  Array.from(root.querySelectorAll('button')).forEach((button) => {
    const text = normalizeText(button.textContent)

    if (inventoryTabs.some((tab) => text === tab || text.includes(tab))) {
      button.classList.add('module-parent-chrome-hidden')
    }
  })

  Array.from(root.querySelectorAll('div, nav')).forEach((container) => {
    const buttons = Array.from(container.querySelectorAll('button'))

    if (buttons.length >= 5) {
      const hiddenButtons = buttons.filter((button) =>
        button.classList.contains('module-parent-chrome-hidden')
      )

      if (hiddenButtons.length >= 5) {
        container.classList.add('module-parent-chrome-hidden')
      }
    }
  })
}

function runInventoryParentChromeCleanup() {
  ;[100, 250, 500, 850, 1200, 1800].forEach((delay) => {
    window.setTimeout(hideInventoryParentChrome, delay)
  })
}

function createInventoryInlineSubmenu(clickedModule) {
  removeInventoryInlineSubmenu()

  const submenu = document.createElement('div')
  submenu.className = 'inventory-inline-submenu'

  const header = document.createElement('div')
  header.className = 'inventory-inline-submenu-header'
  header.textContent = 'SubmÃƒÂ³dulos'

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
  document.body.classList.remove('inventory-products-work-mode')
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
      document.body.classList.remove('inventory-products-work-mode')
      removeInventoryInlineSubmenu()

      window.setTimeout(() => {
        document.body.classList.add('module-work-mode')
        document.body.classList.add('sidebar-collapsed-mode')
        refreshMode()
        window.dispatchEvent(new Event('invefat:module-work-mode-change'))
      }, 450)
    }

    const openInventoryProducts = () => {
      document.body.classList.add('inventory-products-work-mode')
      removeInventoryInlineSubmenu()

      ignoreSidebarClickRef.current = true

      const openedInventory = clickElementByText(
        ['Inventario y AlmacÃƒÂ©n', 'Inventario y Almacen', 'Inventario'],
        ['.sidebar', 'aside', 'body']
      )

      window.setTimeout(() => {
        ignoreSidebarClickRef.current = false
      }, 350)

      if (!openedInventory) {
        console.warn('No se encontrÃƒÂ³ Inventario y AlmacÃƒÂ©n.')
        return
      }

      window.setTimeout(() => {
        clickElementByText(
          ['Productos'],
          ['.main-panel', '.app-main', '.main-content', '.content', 'main', 'body']
        )
        runInventoryParentChromeCleanup()
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
        document.body.classList.add('inventory-products-work-mode')
        openInventoryProducts()
        runInventoryParentChromeCleanup()
      }
    }

    const handleSidebarClick = (event) => {
      if (ignoreSidebarClickRef.current) return

      const clickedSubmenuButton = event.target.closest('.inventory-inline-submenu button')

      if (clickedSubmenuButton) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation?.()

        const submenuText = normalizeText(clickedSubmenuButton.textContent)

        if (submenuText.includes('productos')) {
          window.dispatchEvent(new CustomEvent('invefat:open-inventory-submodule', {
            detail: {
              target: 'Productos',
            },
          }))
        }

        return
      }

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
        document.body.classList.remove('inventory-products-work-mode')
        refreshMode()
        return
      }

      if (text.includes('inventario') || text.includes('almacen') || text.includes('almacÃƒÂ©n')) {
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
      <span>Ãƒâ€”</span>
      Salir
    </button>
  )
}