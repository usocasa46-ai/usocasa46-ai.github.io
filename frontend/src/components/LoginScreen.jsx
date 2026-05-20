import { useEffect, useState } from 'react'
import './LoginScreen.css'

const loginMenu = [
  { label: 'Archivo', options: ['Iniciar sesion', 'Salir'] },
  { label: 'Editar', options: ['Limpiar formulario'] },
  { label: 'Visualizar datos', options: ['Modo compacto', 'Refrescar'] },
  { label: 'Modulos', options: ['Ventas', 'Compras', 'Inventario', 'Almacen', 'Reportes'] },
  { label: 'Herramientas', options: ['Configuracion local', 'Exportar respaldo', 'Importar respaldo'] },
  { label: 'Ventana', options: ['Pantalla completa'] },
  { label: 'Ayuda', options: ['Acerca del sistema', 'Soporte'] },
]

const PASSWORD_RESET_KEY = 'invefat_password_reset_requests'

function loadPasswordResetRequests() {
  try {
    const saved = localStorage.getItem(PASSWORD_RESET_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function savePasswordResetRequest(request) {
  const current = loadPasswordResetRequests()
  localStorage.setItem(PASSWORD_RESET_KEY, JSON.stringify([request, ...current].slice(0, 500)))
}

function PasswordResetModal({ initialCompanyCode = 'EMP001', onClose }) {
  const [formData, setFormData] = useState({
    companyCode: initialCompanyCode || 'EMP001',
    usuarioOCorreo: '',
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const companyCode = formData.companyCode.trim().toUpperCase()
    const usuarioOCorreo = formData.usuarioOCorreo.trim()

    if (!companyCode) {
      setError('Debe indicar el código de empresa.')
      setMessage('')
      return
    }

    if (!usuarioOCorreo) {
      setError('Debe indicar usuario o correo.')
      setMessage('')
      return
    }

    const id = window.crypto?.randomUUID?.() || `PRR-${Date.now()}`
    savePasswordResetRequest({
      id,
      companyCode,
      usuarioOCorreo,
      fecha: new Date().toISOString(),
      estado: 'pendiente',
      origen: 'login',
    })

    setError('')
    setMessage('Solicitud registrada. Contacte al administrador de su empresa para restablecer la contraseña.')
  }

  return (
    <div
      className="login-recovery-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.()
        }
      }}
    >
      <form
        className="login-recovery-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-recovery-title"
        onSubmit={handleSubmit}
      >
        <header className="login-recovery-header">
          <div>
            <span>Seguridad de acceso</span>
            <h3 id="login-recovery-title">Recuperar contraseña</h3>
          </div>
          <button type="button" className="login-recovery-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>

        <div className="login-recovery-body">
          <p>
            Registra una solicitud para que el administrador de tu empresa pueda restablecer el acceso.
          </p>

          {(error || message) && (
            <div className={error ? 'login-recovery-alert is-error' : 'login-recovery-alert is-success'}>
              {error || message}
            </div>
          )}

          <label>
            Código de empresa
            <input
              value={formData.companyCode}
              onChange={(event) => updateField('companyCode', event.target.value.toUpperCase())}
              placeholder="EMP001"
              autoComplete="organization"
            />
          </label>

          <label>
            Usuario o correo
            <input
              value={formData.usuarioOCorreo}
              onChange={(event) => updateField('usuarioOCorreo', event.target.value)}
              placeholder="usuario@empresa.com"
              autoComplete="username"
            />
          </label>
        </div>

        <footer className="login-recovery-footer">
          <button type="button" className="login-recovery-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="login-recovery-submit">
            Enviar solicitud
          </button>
        </footer>
      </form>
    </div>
  )
}

export default function LoginScreen({ onLogin, notice = '' }) {
  const currentYear = new Date().getFullYear()
  const [formData, setFormData] = useState({
    companyCode: 'EMP001',
    username: '',
    password: '',
    remember: true,
  })

  const [error, setError] = useState('')
  const [passwordResetOpen, setPasswordResetOpen] = useState(false)

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!formData.companyCode.trim() || !formData.username.trim() || !formData.password.trim()) {
      setError('Debes escribir codigo de empresa, usuario y contrasena.')
      return
    }

    if (typeof onLogin !== 'function') {
      setError('Login no configurado.')
      return
    }

    const result = onLogin({
      companyCode: formData.companyCode.trim(),
      username: formData.username.trim(),
      password: formData.password.trim(),
      remember: formData.remember,
    })

    if (result && result.ok === false) {
      setError(result.message || 'Usuario o contrasena incorrectos.')
      return
    }

    setError('')
  }

  const handleMenuAction = (option) => {
    if (option === 'Limpiar formulario') {
      setFormData({ companyCode: 'EMP001', username: '', password: '', remember: true })
      setError('')
      return
    }

    if (option === 'Refrescar') {
      window.location.reload()
      return
    }

    if (option === 'Pantalla completa' && document.fullscreenEnabled) {
      document.documentElement.requestFullscreen?.()
    }
  }

  return (
    <main className="login-screen">
      <nav className="login-menu-bar" aria-label="Menu principal de login">
        {loginMenu.map((menu) => (
          <div className="login-menu-item" key={menu.label}>
            <button type="button">{menu.label}</button>
            <div className="login-menu-dropdown">
              {menu.options.map((option) => (
                <button type="button" key={option} onClick={() => handleMenuAction(option)}>
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <section className="login-shell">
        <div className="login-brand-panel">
          <div className="login-brand-mark">
            IF
          </div>

          <div>
            <span>Sistema empresarial</span>
            <h1>INVE-FAT SYSTEM</h1>
            <p>Inventario, facturacion, compras, ventas y control operativo en una sola plataforma.</p>
          </div>

          <div className="login-status-card">
            <strong>Acceso seguro</strong>
            <span>Ingresa con codigo de empresa, usuario y contrasena.</span>
          </div>
        </div>

        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card-header">
            <span>Bienvenido</span>
            <h2>Iniciar sesion</h2>
            <p>Ingresa tus credenciales para acceder al sistema.</p>
          </div>

          {(notice || error) && (
            <div className="login-error">
              {error || notice}
            </div>
          )}

          <label>
            Codigo de empresa
            <input
              value={formData.companyCode}
              onChange={(event) => updateField('companyCode', event.target.value.toUpperCase())}
              placeholder="EMP001 o SYSTEM"
              autoComplete="organization"
            />
          </label>

          <label>
            Usuario
            <input
              value={formData.username}
              onChange={(event) => updateField('username', event.target.value)}
              placeholder="Usuario"
              autoComplete="username"
            />
          </label>

          <label>
            Contrasena
            <input
              type="password"
              value={formData.password}
              onChange={(event) => updateField('password', event.target.value)}
              placeholder="Contrasena"
              autoComplete="current-password"
            />
          </label>

          <div className="login-options">
            <label className="login-check">
              <input
                type="checkbox"
                checked={formData.remember}
                onChange={(event) => updateField('remember', event.target.checked)}
              />
              Recordarme
            </label>

            <button type="button" onClick={() => setPasswordResetOpen(true)}>
              Olvidé mi clave
            </button>
          </div>

          <button type="submit" className="login-submit">
            Entrar al sistema
          </button>
        </form>
      </section>
      <footer className="login-copyright">
        © {currentYear} INVE-FAT SYSTEM. Todos los derechos reservados. v1.0
      </footer>
      {passwordResetOpen && (
        <PasswordResetModal
          initialCompanyCode={formData.companyCode}
          onClose={() => setPasswordResetOpen(false)}
        />
      )}
    </main>
  )
}
