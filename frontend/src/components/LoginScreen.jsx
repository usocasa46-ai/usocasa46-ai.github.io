import { useState } from 'react'
import './LoginScreen.css'

export default function LoginScreen({ onLogin }) {
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

    setError('')

    if (typeof onLogin === 'function') {
      onLogin({
        username: formData.username.trim(),
        role: 'Administrador',
      })
    }
  }

  return (
    <main className="login-screen">
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
            <span>Control de usuarios y permisos por modulo.</span>
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
              placeholder="Ejemplo: admin"
              autoComplete="username"
            />
          </label>

          <label>
            Contrasena
            <input
              type="password"
              value={formData.password}
              onChange={(event) => updateField('password', event.target.value)}
              placeholder="Escribe tu contrasena"
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

          <div className="login-demo-note">
            <strong>Modo prueba:</strong> puedes escribir cualquier usuario y contrasena para entrar cuando lo activemos.
          </div>
        </form>
      </section>
    </main>
  )
}