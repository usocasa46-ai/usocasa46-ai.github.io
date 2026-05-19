import { useEffect, useState } from 'react'
import {
  ChevronDown,
  FileText,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Printer,
  Save,
  Search,
  Settings,
  Sun,
  UserRound,
} from 'lucide-react'
import useTheme from '../hooks/useTheme.js'
import NotificationBell from './NotificationBell.jsx'
import './AppWorkspace.css'

const menuGroups = [
  {
    id: 'file',
    label: 'Archivo',
    items: [
      ['new', 'Nuevo'],
      ['open', 'Abrir'],
      ['save', 'Guardar'],
      ['print', 'Imprimir'],
      ['close-page', 'Cerrar pagina actual'],
      ['logout', 'Cerrar sesion'],
    ],
  },
  {
    id: 'edit',
    label: 'Editar',
    items: [
      ['edit-record', 'Editar registro'],
      ['duplicate-record', 'Duplicar'],
      ['delete-record', 'Eliminar'],
      ['clear-form', 'Limpiar formulario'],
    ],
  },
  {
    id: 'view',
    label: 'Ver',
    items: [
      ['fullscreen', 'Pantalla completa'],
      ['toggle-sidebar', 'Mostrar/Ocultar sidebar'],
      ['refresh', 'Refrescar pagina'],
    ],
  },
  {
    id: 'window',
    label: 'Ventana',
    items: [
      ['minimize-page', 'Minimizar pagina'],
      ['restore-page', 'Restaurar tamano'],
      ['close-page', 'Cerrar pagina'],
    ],
  },
  {
    id: 'help',
    label: 'Ayuda',
    items: [
      ['about', 'Acerca del sistema'],
      ['shortcuts', 'Atajos de teclado'],
    ],
  },
]

export default function TopActionBar({
  currentPage,
  currentModule,
  searchValue,
  onSearchChange,
  sidebarCollapsed,
  onToggleSidebar,
  onCommand,
  session,
  onNavigate,
  onOpenAdmin,
  onLogout,
}) {
  const [openMenu, setOpenMenu] = useState(null)
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const { isDark, toggleTheme } = useTheme()

  useEffect(() => {
    const closeMenus = (event) => {
      if (event.target.closest('.erp-top-menu') || event.target.closest('.erp-admin-menu-wrap')) return
      setOpenMenu(null)
      setAdminMenuOpen(false)
    }

    document.addEventListener('click', closeMenus)
    return () => document.removeEventListener('click', closeMenus)
  }, [])

  const runCommand = (command) => {
    setOpenMenu(null)
    setAdminMenuOpen(false)
    onCommand?.(command)
  }

  const runAdminCommand = (command) => {
    setAdminMenuOpen(false)

    if (command === 'logout') {
      onLogout?.()
      return
    }

    onOpenAdmin?.(command)
  }

  return (
    <header className="erp-topbar">
      <div className="erp-top-menu-strip">
        {menuGroups.map((group) => (
          <div className="erp-top-menu" key={group.id}>
            <button
              type="button"
              className={`erp-top-menu-button ${openMenu === group.id ? 'is-open' : ''}`}
              onClick={(event) => {
                event.stopPropagation()
                setOpenMenu((current) => current === group.id ? null : group.id)
              }}
            >
              {group.label}
              <ChevronDown size={14} />
            </button>

            {openMenu === group.id && (
              <div className="erp-top-dropdown">
                {group.items.map(([command, label]) => (
                  <button
                    type="button"
                    key={`${group.id}-${command}`}
                    onClick={() => runCommand(command)}
                    className={command === 'logout' || command === 'delete-record' ? 'is-danger' : ''}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="erp-top-context">
        <button
          type="button"
          className="erp-top-icon"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? 'Mostrar sidebar' : 'Ocultar sidebar'}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>

        <div className="erp-top-search">
          <Search size={16} />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder={`Buscar en ${currentPage?.label || 'pagina activa'}`}
          />
        </div>

        <button type="button" className="erp-top-command" onClick={() => runCommand('new')}>
          <FileText size={16} />
          Nuevo
        </button>
        <button type="button" className="erp-top-command" onClick={() => runCommand('save')}>
          <Save size={16} />
          Guardar
        </button>
        <button type="button" className="erp-top-command" onClick={() => runCommand('print')}>
          <Printer size={16} />
          Imprimir
        </button>
        <button type="button" className="erp-top-command" onClick={() => runCommand('reports')}>
          Reportes
        </button>
        <button type="button" className="erp-top-command" onClick={() => runCommand('config')}>
          <Settings size={16} />
          Config
        </button>

        <button
          type="button"
          className="erp-top-icon erp-theme-toggle"
          onClick={toggleTheme}
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <NotificationBell onNavigate={onNavigate} />

        <div className="erp-admin-menu-wrap">
          <button
            type="button"
            className={`erp-admin-profile ${adminMenuOpen ? 'is-open' : ''}`}
            onClick={(event) => {
              event.stopPropagation()
              setOpenMenu(null)
              setAdminMenuOpen((current) => !current)
            }}
          >
            <span>
              <UserRound size={17} />
            </span>
            <strong>{session?.fullName || 'Administrador'}</strong>
            <small>{currentModule?.label || 'ERP'}</small>
          </button>

          {adminMenuOpen && (
            <div className="erp-admin-dropdown">
              <div className="erp-admin-card">
                <strong>{session?.fullName || 'Administrador'}</strong>
                <span>{session?.role || 'Usuario activo'}</span>
              </div>
              <button type="button" onClick={() => runAdminCommand('create-user')}>
                Crear usuario
              </button>
              <button type="button" onClick={() => runAdminCommand('security-users')}>
                Seguridad / Usuarios
              </button>
              <button type="button" onClick={() => runAdminCommand('settings-general')}>
                Configuracion
              </button>
              <button type="button" onClick={() => runCommand('authorize-support')}>
                Autorizar soporte
              </button>
              <button type="button" className="is-danger" onClick={() => runAdminCommand('logout')}>
                Cerrar sesion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
