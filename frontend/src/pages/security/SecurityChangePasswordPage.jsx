import { KeyRound, LogOut, Save } from 'lucide-react'
import { useState } from 'react'
import { appendAuditLog, loadUsers, saveUsers } from '../../security/permissions.js'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import './SecurityModule.css'

export default function SecurityChangePasswordPage({ controls, session, onAction, onReplaceUsers }) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const savePassword = (event) => {
    event.preventDefault()
    const users = loadUsers()
    const currentUser = users.find((user) => user.username === session?.username)

    if (!currentUser) {
      setError('No se encontro el usuario activo.')
      return
    }

    if (currentUser.password !== form.currentPassword) {
      setError('La contrasena actual no coincide.')
      return
    }

    if (!form.newPassword.trim()) {
      setError('La nueva contrasena no puede estar vacia.')
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('La confirmacion no coincide.')
      return
    }

    const nextUsers = users.map((user) => {
      if (user.username !== currentUser.username) return user
      return {
        ...user,
        password: form.newPassword,
        mustChangePassword: false,
        updatedAt: new Date().toISOString(),
      }
    })

    const savedUsers = saveUsers(nextUsers)
    onReplaceUsers?.(savedUsers)
    appendAuditLog('Cambiar contrasena', {
      module: 'Seguridad',
      submodule: 'Cambiar contrasena',
      description: `Usuario ${currentUser.username} cambio su contrasena`,
    })
    setMessage('Contrasena actualizada correctamente.')
    setError('')
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    onAction?.('Contrasena actualizada')
  }

  return (
    <ModulePageLayout
      title="Cambiar contrasena"
      moduleLabel="Seguridad"
      description="Actualiza la clave del usuario activo sin modificar el login general."
      breadcrumb={['Seguridad', 'Cambiar contrasena']}
      actions={[
        { id: 'save', label: 'Guardar cambio', icon: Save, variant: 'primary', onClick: savePassword },
        { id: 'exit', label: 'Salir', icon: LogOut, onClick: controls?.onClose },
      ]}
      {...controls}
    >
      <div className="security-page security-change-password-page">
        {message && <div className="security-message">{message}</div>}
        {error && <div className="security-alert">{error}</div>}

        <section className="security-panel">
          <div className="security-panel-heading">
            <div>
              <span>Clave</span>
              <h2>Actualizar contrasena</h2>
            </div>
            <strong>{session?.username}</strong>
          </div>

          <form className="security-form-grid" onSubmit={savePassword}>
            <label>
              Contrasena actual
              <input type="password" value={form.currentPassword} onChange={(event) => updateForm('currentPassword', event.target.value)} />
            </label>
            <label>
              Nueva contrasena
              <input type="password" value={form.newPassword} onChange={(event) => updateForm('newPassword', event.target.value)} />
            </label>
            <label>
              Confirmar nueva contrasena
              <input type="password" value={form.confirmPassword} onChange={(event) => updateForm('confirmPassword', event.target.value)} />
            </label>
            <div className="security-inline-actions">
              <button type="submit" className="is-primary">
                <KeyRound size={15} />
                Cambiar
              </button>
            </div>
          </form>
        </section>
      </div>
    </ModulePageLayout>
  )
}
