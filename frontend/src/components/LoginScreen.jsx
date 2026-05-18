import { useState } from 'react'
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

export default function LoginScreen({ onLogin }) {
  const currentYear = new Date().getFullYear()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: true,
  })

  const [error, setError] = useState('')

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Debes escribir usuario y contrasena.')
      return
    }

    if (typeof onLogin !== 'function') {
      setError('Login no configurado.')
      return
    }

    const result = onLogin({
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
      setFormData({ username: '', password: '', remember: true })
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
            <span>Solo usuarios creados por el Administrador Principal.</span>
          </div>
        </div>

        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card-header">
            <span>Bienvenido</span>
            <h2>Iniciar sesion</h2>
            <p>Ingresa tus credenciales para acceder al sistema.</p>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

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

            <button type="button">
              Olvide mi clave
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
    </main>
  )
}
