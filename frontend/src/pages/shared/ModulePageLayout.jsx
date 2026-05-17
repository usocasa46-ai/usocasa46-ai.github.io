import { useEffect } from 'react'
import {
  Maximize2,
  Minimize2,
  PanelTopClose,
  RotateCcw,
  Search,
  X,
} from 'lucide-react'
import '../../components/AppWorkspace.css'

export default function ModulePageLayout({
  title,
  moduleLabel,
  description,
  breadcrumb = [],
  searchValue = '',
  searchPlaceholder = 'Buscar en la pagina activa',
  onSearchChange,
  actions = [],
  statusCards = [],
  children,
  sidePanel,
  windowState = 'normal',
  onClose,
  onMinimize,
  onRestore,
  onMaximize,
}) {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== 'Escape' || typeof onClose !== 'function') return
      event.preventDefault()
      onClose()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (windowState === 'minimized') {
    return (
      <section className="erp-minimized-page">
        <div>
          <span>{moduleLabel}</span>
          <strong>{title}</strong>
        </div>
        <button type="button" onClick={onRestore}>
          <RotateCcw size={16} />
          Restaurar
        </button>
      </section>
    )
  }

  return (
    <section className={`erp-module-page ${windowState === 'maximized' ? 'is-maximized' : ''}`}>
      <header className="erp-page-header">
        <div className="erp-page-title-group">
          <nav className="erp-breadcrumb" aria-label="Ruta de pagina">
            {breadcrumb.map((item, index) => (
              <span key={`${item}-${index}`}>
                {item}
                {index < breadcrumb.length - 1 && <b>/</b>}
              </span>
            ))}
          </nav>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>

        <div className="erp-window-controls" aria-label="Controles de pagina">
          <button type="button" onClick={onMinimize} title="Minimizar">
            <Minimize2 size={16} />
          </button>
          <button type="button" onClick={windowState === 'maximized' ? onRestore : onMaximize} title={windowState === 'maximized' ? 'Restaurar' : 'Maximizar'}>
            <Maximize2 size={16} />
          </button>
          <button type="button" onClick={onClose} title="Cerrar pagina">
            <X size={17} />
          </button>
        </div>
      </header>

      <div className="erp-page-toolbar">
        <div className="erp-page-search">
          <Search size={17} />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>

        <div className="erp-page-actions">
          {actions.map((action) => {
            const Icon = action.icon || PanelTopClose
            return (
              <button
                type="button"
                key={action.id || action.label}
                className={action.variant === 'primary' ? 'is-primary' : action.variant === 'danger' ? 'is-danger' : ''}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                <Icon size={16} />
                <span>{action.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {statusCards.length > 0 && (
        <div className="erp-status-strip">
          {statusCards.map((card) => (
            <article key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              {card.detail && <small>{card.detail}</small>}
            </article>
          ))}
        </div>
      )}

      <div className={`erp-page-body ${sidePanel ? 'has-side-panel' : ''}`}>
        <div className="erp-page-content">
          {children}
        </div>
        {sidePanel && (
          <aside className="erp-page-side-panel">
            {sidePanel}
          </aside>
        )}
      </div>
    </section>
  )
}
