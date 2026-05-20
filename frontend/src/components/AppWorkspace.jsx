import { useEffect, useMemo, useRef, useState } from 'react'
import AdvancedSidebar from './AdvancedSidebar.jsx'
import TopActionBar from './TopActionBar.jsx'
import CompanyWelcomeModal from './onboarding/CompanyWelcomeModal.jsx'
import { DEFAULT_PAGE_ID, erpModules, getModuleByPageId, getPageMeta } from '../config/modulesMap.js'
import AlertsCenterPage from '../pages/alerts/AlertsCenterPage.jsx'
import AccountingSettingsPage from '../pages/accounting/AccountingSettingsPage.jsx'
import BankReconciliationPage from '../pages/accounting/BankReconciliationPage.jsx'
import BalanceSheetPage from '../pages/accounting/BalanceSheetPage.jsx'
import BanksPage from '../pages/accounting/BanksPage.jsx'
import ChartOfAccountsPage from '../pages/accounting/ChartOfAccountsPage.jsx'
import Dgii606Page from '../pages/accounting/Dgii606Page.jsx'
import Dgii607Page from '../pages/accounting/Dgii607Page.jsx'
import ElectronicBillingPage from '../pages/accounting/ElectronicBillingPage.jsx'
import FinanceAccountsPayablePage from '../pages/accounting/AccountsPayablePage.jsx'
import FinanceAccountsReceivablePage from '../pages/accounting/AccountsReceivablePage.jsx'
import GeneralLedgerPage from '../pages/accounting/GeneralLedgerPage.jsx'
import IncomeStatementPage from '../pages/accounting/IncomeStatementPage.jsx'
import JournalEntriesPage from '../pages/accounting/JournalEntriesPage.jsx'
import NcfSequencesPage from '../pages/accounting/NcfSequencesPage.jsx'
import PettyCashPage from '../pages/accounting/PettyCashPage.jsx'
import RncRegistryPage from '../pages/accounting/RncRegistryPage.jsx'
import DashboardPage from '../pages/dashboard/DashboardPage.jsx'
import HrAbsencesPage from '../pages/hr/HrAbsencesPage.jsx'
import HrAttendancePage from '../pages/hr/HrAttendancePage.jsx'
import HrContractsPage from '../pages/hr/HrContractsPage.jsx'
import HrDashboardPage from '../pages/hr/HrDashboardPage.jsx'
import HrDepartmentsPage from '../pages/hr/HrDepartmentsPage.jsx'
import HrEmployeesPage from '../pages/hr/HrEmployeesPage.jsx'
import HrOvertimePage from '../pages/hr/HrOvertimePage.jsx'
import HrPaySlipsPage from '../pages/hr/HrPaySlipsPage.jsx'
import HrPayrollPage from '../pages/hr/HrPayrollPage.jsx'
import HrPayrollSettingsPage from '../pages/hr/HrPayrollSettingsPage.jsx'
import HrPositionsPage from '../pages/hr/HrPositionsPage.jsx'
import HrReportsPage from '../pages/hr/HrReportsPage.jsx'
import HrVacationsPage from '../pages/hr/HrVacationsPage.jsx'
import InventoryAdjustmentsPage from '../pages/inventory/InventoryAdjustmentsPage.jsx'
import InventoryBarcodesPage from '../pages/inventory/InventoryBarcodesPage.jsx'
import InventoryBrandsPage from '../pages/inventory/InventoryBrandsPage.jsx'
import InventoryCategoriesPage from '../pages/inventory/InventoryCategoriesPage.jsx'
import InventoryCostsPage from '../pages/inventory/InventoryCostsPage.jsx'
import InventoryCycleCountPage from '../pages/inventory/InventoryCycleCountPage.jsx'
import InventoryKardexPage from '../pages/inventory/InventoryKardexPage.jsx'
import InventoryLotsPage from '../pages/inventory/InventoryLotsPage.jsx'
import InventoryPhysicalCountPage from '../pages/inventory/InventoryPhysicalCountPage.jsx'
import InventoryPriceListsPage from '../pages/inventory/InventoryPriceListsPage.jsx'
import InventoryProductsPage from '../pages/inventory/InventoryProductsPage.jsx'
import InventoryRotationPage from '../pages/inventory/InventoryRotationPage.jsx'
import InventoryStockPage from '../pages/inventory/InventoryStockPage.jsx'
import InventoryUnitsPage from '../pages/inventory/InventoryUnitsPage.jsx'
import AccountsPayablePage from '../pages/purchases/AccountsPayablePage.jsx'
import PurchaseOrdersPage from '../pages/purchases/PurchaseOrdersPage.jsx'
import PurchaseHistoryPage from '../pages/purchases/PurchaseHistoryPage.jsx'
import PurchaseRequestsPage from '../pages/purchases/PurchaseRequestsPage.jsx'
import SupplierCreditNotesPage from '../pages/purchases/SupplierCreditNotesPage.jsx'
import SupplierInvoicesPage from '../pages/purchases/SupplierInvoicesPage.jsx'
import SupplierQuotesPage from '../pages/purchases/SupplierQuotesPage.jsx'
import SuppliersPage from '../pages/purchases/SuppliersPage.jsx'
import {
  CustomerReportsPage,
  CustomReportsPage,
  DgiiReportsPage,
  FinancialReportsPage,
  InventoryReportsPage,
  PurchaseReportsPage,
  SalesReportsPage,
  SupplierReportsPage,
  UserReportsPage,
  WarehouseReportsPage,
} from '../pages/reports/ReportsModulePages.jsx'
import SalesCustomersPage from '../pages/sales/SalesCustomersPage.jsx'
import SalesCreditNotesPage from '../pages/sales/SalesCreditNotesPage.jsx'
import SalesHistoryPage from '../pages/sales/SalesHistoryPage.jsx'
import SalesInvoicePage from '../pages/sales/SalesInvoicePage.jsx'
import SalesOrdersPage from '../pages/sales/SalesOrdersPage.jsx'
import SalesPosPage from '../pages/sales/SalesPosPage.jsx'
import SalesQuotesPage from '../pages/sales/SalesQuotesPage.jsx'
import AccountsReceivablePage from '../pages/sales/AccountsReceivablePage.jsx'
import SalesReturnsPage from '../pages/sales/SalesReturnsPage.jsx'
import SecurityAuditPage from '../pages/security/SecurityAuditPage.jsx'
import SecurityChangePasswordPage from '../pages/security/SecurityChangePasswordPage.jsx'
import SecurityCompanyCredentialPage from '../pages/security/SecurityCompanyCredentialPage.jsx'
import SecurityPermissionsPage from '../pages/security/SecurityPermissionsPage.jsx'
import SecurityRolesPage from '../pages/security/SecurityRolesPage.jsx'
import SecuritySessionsPage from '../pages/security/SecuritySessionsPage.jsx'
import SecurityUsersPage from '../pages/security/SecurityUsersPage.jsx'
import SettingsGeneralPage from '../pages/settings/SettingsGeneralPage.jsx'
import WarehouseDamagesPage from '../pages/warehouse/WarehouseDamagesPage.jsx'
import WarehouseDispatchPage from '../pages/warehouse/WarehouseDispatchPage.jsx'
import WarehouseListPage from '../pages/warehouse/WarehouseListPage.jsx'
import WarehouseLocationsPage from '../pages/warehouse/WarehouseLocationsPage.jsx'
import WarehousePickingPage from '../pages/warehouse/WarehousePickingPage.jsx'
import WarehousePutawayPage from '../pages/warehouse/WarehousePutawayPage.jsx'
import WarehouseQualityPage from '../pages/warehouse/WarehouseQualityPage.jsx'
import WarehouseQuarantinePage from '../pages/warehouse/WarehouseQuarantinePage.jsx'
import WarehouseReceivingPage from '../pages/warehouse/WarehouseReceivingPage.jsx'
import WarehouseReturnsPage from '../pages/warehouse/WarehouseReturnsPage.jsx'
import WarehouseRoutesPage from '../pages/warehouse/WarehouseRoutesPage.jsx'
import WarehouseTransfersPage from '../pages/warehouse/WarehouseTransfersPage.jsx'
import { getVisibleModules } from '../security/permissions.js'
import { resetInactivityTimer, restoreLastActivePage, saveLastActivePage } from '../security/sessionManager.js'
import {
  appendSystemAudit,
  findCompanyByCode,
  isModuleActiveForCompany,
  updateCompany,
} from '../services/companyStorage.js'
import './AppWorkspace.css'

const pageComponents = {
  'system-alerts': AlertsCenterPage,
  'sales-invoice': SalesInvoicePage,
  'sales-pos': SalesPosPage,
  'sales-quotes': SalesQuotesPage,
  'sales-customer-orders': SalesOrdersPage,
  'sales-customers': SalesCustomersPage,
  'sales-returns': SalesReturnsPage,
  'sales-credit-notes': SalesCreditNotesPage,
  'sales-receivables': AccountsReceivablePage,
  'sales-history': SalesHistoryPage,
  'purchase-requests': PurchaseRequestsPage,
  'purchase-quotes': SupplierQuotesPage,
  'purchase-orders': PurchaseOrdersPage,
  'purchase-invoices': SupplierInvoicesPage,
  'purchase-credit-notes': SupplierCreditNotesPage,
  'purchase-suppliers': SuppliersPage,
  'purchase-payables': AccountsPayablePage,
  'purchase-history': PurchaseHistoryPage,
  'inventory-products': InventoryProductsPage,
  'inventory-categories': InventoryCategoriesPage,
  'inventory-brands': InventoryBrandsPage,
  'inventory-units': InventoryUnitsPage,
  'inventory-price-lists': InventoryPriceListsPage,
  'inventory-stock': InventoryStockPage,
  'inventory-kardex': InventoryKardexPage,
  'inventory-adjustments': InventoryAdjustmentsPage,
  'inventory-rotation': InventoryRotationPage,
  'inventory-cycle-count': InventoryCycleCountPage,
  'inventory-count': InventoryPhysicalCountPage,
  'inventory-lots': InventoryLotsPage,
  'inventory-barcodes': InventoryBarcodesPage,
  'inventory-costs': InventoryCostsPage,
  'warehouse-list': WarehouseListPage,
  'warehouse-locations': WarehouseLocationsPage,
  'warehouse-receiving': WarehouseReceivingPage,
  'warehouse-dispatch': WarehouseDispatchPage,
  'warehouse-transfers': WarehouseTransfersPage,
  'warehouse-picking': WarehousePickingPage,
  'warehouse-putaway': WarehousePutawayPage,
  'warehouse-returns': WarehouseReturnsPage,
  'warehouse-damages': WarehouseDamagesPage,
  'warehouse-quarantine': WarehouseQuarantinePage,
  'warehouse-quality': WarehouseQualityPage,
  'warehouse-routes': WarehouseRoutesPage,
  'finance-chart-accounts': ChartOfAccountsPage,
  'finance-journal-entries': JournalEntriesPage,
  'finance-general-ledger': GeneralLedgerPage,
  'finance-receivables': FinanceAccountsReceivablePage,
  'finance-payables': FinanceAccountsPayablePage,
  'finance-banks': BanksPage,
  'finance-petty-cash': PettyCashPage,
  'finance-bank-reconciliation': BankReconciliationPage,
  'finance-balance-sheet': BalanceSheetPage,
  'finance-income-statement': IncomeStatementPage,
  'finance-dgii-606': Dgii606Page,
  'finance-dgii-607': Dgii607Page,
  'finance-ncf-sequences': NcfSequencesPage,
  'finance-rnc': RncRegistryPage,
  'accounting-electronic-billing': ElectronicBillingPage,
  'finance-accounting-settings': AccountingSettingsPage,
  'reports-sales': SalesReportsPage,
  'reports-purchases': PurchaseReportsPage,
  'reports-inventory': InventoryReportsPage,
  'reports-warehouse': WarehouseReportsPage,
  'reports-finance': FinancialReportsPage,
  'reports-customers': CustomerReportsPage,
  'reports-vendors': SupplierReportsPage,
  'reports-users': UserReportsPage,
  'reports-dgii': DgiiReportsPage,
  'reports-custom': CustomReportsPage,
  'hr-dashboard': HrDashboardPage,
  'hr-employees': HrEmployeesPage,
  'hr-departments': HrDepartmentsPage,
  'hr-positions': HrPositionsPage,
  'hr-contracts': HrContractsPage,
  'hr-attendance': HrAttendancePage,
  'hr-absences': HrAbsencesPage,
  'hr-vacations': HrVacationsPage,
  'hr-overtime': HrOvertimePage,
  'hr-payroll': HrPayrollPage,
  'hr-pay-slips': HrPaySlipsPage,
  'hr-payroll-settings': HrPayrollSettingsPage,
  'hr-reports': HrReportsPage,
  'security-users': SecurityUsersPage,
  'security-roles': SecurityRolesPage,
  'security-permissions': SecurityPermissionsPage,
  'security-audit': SecurityAuditPage,
  'security-sessions': SecuritySessionsPage,
  'security-change-password': SecurityChangePasswordPage,
  'security-company-credential': SecurityCompanyCredentialPage,
  'settings-general': SettingsGeneralPage,
}

const onboardingChecklistItems = [
  'Completar datos de empresa',
  'Subir logo',
  'Configurar NCF',
  'Crear almacen principal',
  'Crear usuarios',
  'Crear productos',
  'Crear clientes',
  'Probar una factura',
]

function ensureOnboardingChecklist(companyCode) {
  if (!companyCode) return
  const key = `invefat_${companyCode}_onboarding_checklist`
  if (localStorage.getItem(key)) return

  localStorage.setItem(key, JSON.stringify(onboardingChecklistItems.map((item) => ({
    id: item.toLowerCase().replace(/\s+/g, '-'),
    label: item,
    estado: 'pendiente',
  }))))
}

export default function AppWorkspace({
  session,
  users = [],
  onLogout,
  onCreateUser,
  onToggleUserStatus,
  onDeleteUser,
  onReplaceUsers,
  onAuthorizeSupport,
}) {
  const [currentPageId, setCurrentPageId] = useState(() => getPageMeta(restoreLastActivePage(DEFAULT_PAGE_ID)).id)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [expandedModules, setExpandedModules] = useState([])
  const [pageWindowState, setPageWindowState] = useState('normal')
  const [pageSearches, setPageSearches] = useState({})
  const [notice, setNotice] = useState('')
  const [showWelcome, setShowWelcome] = useState(false)
  const noticeTimer = useRef(null)

  const currentPage = useMemo(() => getPageMeta(currentPageId), [currentPageId])
  const currentModule = useMemo(() => getModuleByPageId(currentPageId), [currentPageId])
  const visibleModules = useMemo(() => getVisibleModules(erpModules, session), [session])
  const currentCompany = useMemo(() => findCompanyByCode(session?.currentCompanyCode), [session])

  useEffect(() => {
    if (!currentCompany || session?.isSuperAdmin) return
    setShowWelcome(Boolean(currentCompany.firstLoginPending || currentCompany.onboardingCompleted === false))
  }, [currentCompany, session])

  useEffect(() => {
    saveLastActivePage(currentPageId)
  }, [currentPageId])

  useEffect(() => {
    if (currentPageId === DEFAULT_PAGE_ID || isModuleActiveForCompany(currentModule.id, session)) return
    showNotice('Modulo no disponible en su licencia.')
    setCurrentPageId(DEFAULT_PAGE_ID)
  }, [currentModule.id, currentPageId, session])

  const selectPage = (pageId) => {
    const meta = getPageMeta(pageId)
    const targetModule = getModuleByPageId(meta.id)

    resetInactivityTimer()
    if (!isModuleActiveForCompany(targetModule.id, session)) {
      showNotice('Modulo no disponible en su licencia.')
      return
    }
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
    resetInactivityTimer()
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

  const completeOnboarding = ({ skipped = false, configure = false } = {}) => {
    if (!currentCompany) return

    ensureOnboardingChecklist(currentCompany.companyCode)
    updateCompany(currentCompany.id, {
      firstLoginPending: false,
      onboardingCompleted: !skipped && !configure,
      onboardingCompletedAt: !skipped && !configure ? new Date().toISOString() : currentCompany.onboardingCompletedAt,
      onboardingSkippedAt: skipped ? new Date().toISOString() : currentCompany.onboardingSkippedAt,
    })

    appendSystemAudit(configure ? 'Configurar empresa desde bienvenida' : skipped ? 'Omitir recorrido' : 'Completar recorrido', {
      companyCode: currentCompany.companyCode,
      usuario: session.username,
      descripcion: configure ? 'Usuario eligio configurar empresa ahora.' : skipped ? 'Usuario omitio el recorrido inicial.' : 'Usuario completo el recorrido inicial.',
    })

    setShowWelcome(false)
    if (configure) selectPage('settings-general')
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
      'authorize-support': () => {
        const hours = window.prompt('Autorizar soporte por cuantas horas? 1, 4 o 24', '1')
        if (!hours) return
        const motivo = window.prompt('Motivo de soporte autorizado', 'Soporte tecnico') || 'Soporte tecnico'
        const result = onAuthorizeSupport?.({ hours: Number(hours), motivo })
        showNotice(result?.ok === false ? result.message : 'Soporte autorizado para esta empresa.')
      },
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
          onNavigate={selectPage}
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
          onNavigate={selectPage}
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
        {showWelcome && currentCompany && (
          <CompanyWelcomeModal
            company={currentCompany}
            session={session}
            modules={visibleModules}
            mustChangePassword={session.mustChangePassword}
            onConfigure={() => completeOnboarding({ configure: true })}
            onFinish={() => completeOnboarding()}
            onSkip={() => completeOnboarding({ skipped: true })}
          />
        )}
      </main>
    </div>
  )
}
