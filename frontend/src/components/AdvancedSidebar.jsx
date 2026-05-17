import {
  BarChart3,
  Boxes,
  ChevronDown,
  ChevronRight,
  Factory,
  Handshake,
  Landmark,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  UsersRound,
  Warehouse,
} from 'lucide-react'
import { DEFAULT_PAGE_ID } from '../config/modulesMap.js'
import './AppWorkspace.css'

const iconMap = {
  BarChart3,
  Boxes,
  Factory,
  Handshake,
  Landmark,
  LayoutDashboard,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  UsersRound,
  Warehouse,
}

function SidebarIcon({ name }) {
  const Icon = iconMap[name] || LayoutDashboard
  return <Icon size={19} strokeWidth={2.1} aria-hidden="true" />
}

export default function AdvancedSidebar({
  modules,
  currentPageId,
  expandedModules,
  sidebarCollapsed,
  onSelectPage,
  onToggleModule,
  onToggleSidebar,
}) {
  return (
    <aside className={`erp-sidebar ${sidebarCollapsed ? 'is-collapsed' : ''}`}>
      <div className="erp-sidebar-header">
        <button
          type="button"
          className="erp-brand-button"
          onClick={() => onSelectPage(DEFAULT_PAGE_ID)}
          title="Dashboard"
        >
          <span className="erp-brand-mark">IF</span>
          {!sidebarCollapsed && (
            <span className="erp-brand-text">
              <strong>INVE-FAT</strong>
              <small>ERP Cloud</small>
            </span>
          )}
        </button>

        <button
          type="button"
          className="erp-icon-button"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? 'Mostrar sidebar' : 'Ocultar sidebar'}
          aria-label={sidebarCollapsed ? 'Mostrar sidebar' : 'Ocultar sidebar'}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav className="erp-sidebar-nav" aria-label="Modulos principales">
        {modules.map((module) => {
          const pages = module.pages || []
          const isSingle = module.type === 'single'
          const modulePageIds = isSingle ? [module.pageId] : pages.map((page) => page.id)
          const hasActivePage = modulePageIds.includes(currentPageId)
          const isExpanded = expandedModules.includes(module.id)

          if (isSingle) {
            return (
              <button
                type="button"
                key={module.id}
                className={`erp-sidebar-module ${hasActivePage ? 'is-active' : ''}`}
                onClick={() => onSelectPage(module.pageId)}
                title={module.label}
              >
                <SidebarIcon name={module.icon} />
                {!sidebarCollapsed && <span>{module.label}</span>}
              </button>
            )
          }

          return (
            <div className="erp-sidebar-group" key={module.id}>
              <button
                type="button"
                className={`erp-sidebar-module ${hasActivePage ? 'has-active-child' : ''}`}
                onClick={() => onToggleModule(module.id)}
                title={module.label}
                aria-expanded={isExpanded}
              >
                <SidebarIcon name={module.icon} />
                {!sidebarCollapsed && (
                  <>
                    <span>{module.label}</span>
                    {isExpanded ? (
                      <ChevronDown className="erp-module-chevron" size={16} />
                    ) : (
                      <ChevronRight className="erp-module-chevron" size={16} />
                    )}
                  </>
                )}
              </button>

              {!sidebarCollapsed && isExpanded && (
                <div className="erp-sidebar-submodules">
                  {pages.map((page) => (
                    <button
                      type="button"
                      key={page.id}
                      className={`erp-sidebar-submodule ${currentPageId === page.id ? 'is-active' : ''}`}
                      onClick={() => onSelectPage(page.id)}
                    >
                      <span className="erp-submodule-dot" />
                      <span>{page.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
