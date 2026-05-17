import { useEffect, useState } from 'react'

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

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

  useEffect(() => {
    const refreshMode = () => {
      setIsModuleMode(document.body.classList.contains('module-work-mode'))
    }

    const enterModuleMode = () => {
      document.body.classList.add('module-work-mode')
      document.body.classList.add('sidebar-collapsed-mode')
      refreshMode()
    }

    const exitModuleMode = () => {
      clickDashboardButton()
    }

    const handleSidebarModuleClick = (event) => {
      const clickedModule = event.target.closest(
        '.sidebar button, .sidebar a, aside button, aside a'
      )

      if (!clickedModule) return

      const text = normalizeText(clickedModule.textContent)

      if (!text) return

      if (text.includes('dashboard')) {
        document.body.classList.remove('module-work-mode')
        document.body.classList.remove('sidebar-collapsed-mode')
        refreshMode()
        return
      }

      enterModuleMode()
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return

      if (document.body.classList.contains('module-work-mode')) {
        event.preventDefault()
        exitModuleMode()
      }
    }

    const handleExternalChange = () => {
      refreshMode()
    }

    document.addEventListener('click', handleSidebarModuleClick, true)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('invefat:module-work-mode-change', handleExternalChange)

    const observer = new MutationObserver(refreshMode)

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    })

    refreshMode()

    return () => {
      document.removeEventListener('click', handleSidebarModuleClick, true)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('invefat:module-work-mode-change', handleExternalChange)
      observer.disconnect()
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