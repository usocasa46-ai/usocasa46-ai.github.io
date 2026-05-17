import { useMemo, useRef, useState } from 'react'
import AdvancedSidebar from './AdvancedSidebar.jsx'
import TopActionBar from './TopActionBar.jsx'
import { DEFAULT_PAGE_ID, erpModules, getModuleByPageId, getPageMeta } from '../config/modulesMap.js'
import DashboardPage from '../pages/dashboard/DashboardPage.jsx'
import InventoryProductsPage from '../pages/inventory/InventoryProductsPage.jsx'
import PurchaseOrdersPage from '../pages/purchases/PurchaseOrdersPage.jsx'
import SalesCustomersPage from '../pages/sales/SalesCustomersPage.jsx'
import SalesInvoicePage from '../pages/sales/SalesInvoicePage.jsx'
import SecurityAuditPage from '../pages/security/SecurityAuditPage.jsx'
import SecurityChangePasswordPage from '../pages/security/SecurityChangePasswordPage.jsx'
import SecurityCompanyCredentialPage from '../pages/security/SecurityCompanyCredentialPage.jsx'
import SecurityPermissionsPage from '../pages/security/SecurityPermissionsPage.jsx'
import SecurityRolesPage from '../pages/security/SecurityRolesPage.jsx'
import SecuritySessionsPage from '../pages/security/SecuritySessionsPage.jsx'
import SecurityUsersPage from '../pages/security/SecurityUsersPage.jsx'
import SettingsGeneralPage from '../pages/settings/SettingsGeneralPage.jsx'
import WarehouseReceivingPage from '../pages/warehouse/WarehouseReceivingPage.jsx'
import { getVisibleModules } from '../security/permissions.js'
import './AppWorkspace.css'

const pageComponents = {
  'sales-invoice': SalesInvoicePage,
  'sales-customers': SalesCustomersPage,
  'purchase-orders': PurchaseOrdersPage,
  'inventory-products': InventoryProductsPage,
  'warehouse-receiving': WarehouseReceivingPage,
  'security-users': SecurityUsersPage,
  'security-roles': SecurityRolesPage,
  'security-permissions': SecurityPermissionsPage,
  'security-audit': SecurityAuditPage,
  'security-sessions': SecuritySessionsPage,
  'security-change-password': SecurityChangePasswordPage,
  'security-company-credential': SecurityCompanyCredentialPage,
  'settings-general': SettingsGeneralPage,
}

export default function AppWorkspace({
  session,
  users = [],
  onLogout,
  onCreateUser,
  onToggleUserStatus,
  onDeleteUser,
  onReplaceUsers,
}) {
  const [currentPageId, setCurrentPageId] = useState(DEFAULT_PAGE_ID)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [expandedModules, setExpandedModules] = useState([])
  const [pageWindowState, setPageWindowState] = useState('normal')
  const [pageSearches, setPageSearches] = useState({})
  const [notice, setNotice] = useState('')
  const noticeTimer = useRef(null)

  const currentPage = useMemo(() => getPageMeta(currentPageId), [currentPageId])
  const currentModule = useMemo(() => getModuleByPageId(currentPageId), [currentPageId])
  const visibleModules = useMemo(() => getVisibleModules(erpModules, session), [session])

  const selectPage = (pageId) => {
    const meta = getPageMeta(pageId)

    setCurrentPageId(meta.id)
    setPageWindowState('normal')
    setExpandedModules([])
  }

  const toggleModule = (moduleId) => {
    setExpandedModules((current) => {
      if (current.includes(moduleId)) {
        return []
      }

      return [moduleId]
    })
  }

  const closePage = () => {
    setCurrentPageId(DEFAULT_PAGE_ID)
    setPageWindowState('normal')
    setExpandedModules([])
  }

  const showNotice = (message) => {
    setNotice(message)
    window.clearTimeout(noticeTimer.current)
    noticeTimer.current = window.setTimeout(() => setNotice(''), 2600)
  }

  const updateCurrentSearch = (value) => {
    setPageSearches((current) => ({
      ...current,
      [currentPageId]: value,
    }))
  }

  const openRelatedReport = () => {
    const reportPageByModule = {
      sales: 'reports-sales',
      purchases: 'reports-purchases',
      inventory: 'reports-inventory',
      warehouse: 'reports-warehouse',
      finance: 'reports-finance',
      crm: 'reports-customers',
      security: 'reports-users',
    }

    selectPage(reportPageByModule[currentModule.id] || 'reports-sales')
  }

  const runTopCommand = (command) => {
    const label = currentPage.label

    const handlers = {
      new: () => showNotice(`Nuevo registro para ${label}`),
      open: () => showNotice(`Abrir registros de ${label}`),
      save: () => showNotice(`Guardando ${label}`),
      print: () => {
        showNotice(`Preparando impresion de ${label}`)
        window.setTimeout(() => window.print(), 150)
      },
      'close-page': closePage,
      logout: onLogout,
      'edit-record': () => showNotice(`Editar registro en ${label}`),
      'duplicate-record': () => showNotice(`Duplicar registro en ${label}`),
      'delete-record': () => showNotice(`Eliminar registro en ${label}`),
      'clear-form': () => showNotice(`Formulario de ${label} limpio`),
      fullscreen: () => setPageWindowState('maximized'),
      'toggle-sidebar': () => setSidebarCollapsed((current) => !current),
      refresh: () => showNotice(`${label} actualizado`),
      'minimize-page': () => setPageWindowState('minimized'),
      'restore-page': () => setPageWindowState('normal'),
      about: () => showNotice('INVE-FAT SYSTEM ERP Cloud'),
      shortcuts: () => showNotice('ESC cierra la pagina activa. Ctrl+P imprime desde el navegador.'),
      reports: openRelatedReport,
      config: () => selectPage('settings-general'),
    }

    handlers[command]?.()
  }

  const pageControls = {
    windowState: pageWindowState,
    onClose: closePage,
    onMinimize: () => setPageWindowState('minimized'),
    onRestore: () => setPageWindowState('normal'),
    onMaximize: () => setPageWindowState('maximized'),
  }

  const renderWorkspacePage = () => {
    const ActivePage = pageComponents[currentPageId]

    if (ActivePage) {
      return (
        <ActivePage
          controls={pageControls}
          onAction={showNotice}
          searchValue={pageSearches[currentPageId] || ''}
          onSearchChange={updateCurrentSearch}
          session={session}
          users={users}
          onCreateUser={onCreateUser}
          onToggleUserStatus={onToggleUserStatus}
          onDeleteUser={onDeleteUser}
          onReplaceUsers={onReplaceUsers}
        />
      )
    }

    return (
      <section className="erp-safe-placeholder" aria-live="polite">
        <span>{currentModule.label}</span>
        <h1>{currentPage.label}</h1>
        <p>
          Pagina registrada en el mapa oficial. Se muestra una vista segura mientras se migra este
          submodulo a una pantalla independiente completa.
        </p>

        <div className="erp-placeholder-grid">
          <article>
            <strong>Modulo</strong>
            <span>{currentModule.label}</span>
          </article>
          <article>
            <strong>Submodulo</strong>
            <span>{currentPage.label}</span>
          </article>
          <article>
            <strong>Control</strong>
            <button type="button" onClick={closePage}>Cerrar pagina</button>
          </article>
        </div>
      </section>
    )
  }

  return (
    <div className="erp-workspace-shell">
      <AdvancedSidebar
        modules={visibleModules}
        currentPageId={currentPageId}
        expandedModules={expandedModules}
        sidebarCollapsed={sidebarCollapsed}
        onSelectPage={selectPage}
        onToggleModule={toggleModule}
        onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
      />

      <main className="erp-main-shell">
        <TopActionBar
          currentPage={currentPage}
          currentModule={currentModule}
          searchValue={pageSearches[currentPageId] || ''}
          onSearchChange={updateCurrentSearch}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
          onCommand={runTopCommand}
          session={session}
          onOpenAdmin={(target) => {
            if (target === 'settings-general') {
              selectPage('settings-general')
              return
            }

            selectPage('security-users')
          }}
          onLogout={onLogout}
        />
        {notice && <div className="erp-action-toast">{notice}</div>}
        {currentPageId === DEFAULT_PAGE_ID ? (
          <DashboardPage session={session} users={users} onSelectPage={selectPage} />
        ) : renderWorkspacePage()}
      </main>
    </div>
  )
}
