import { Building2, LogOut, Save } from 'lucide-react'
import { useState } from 'react'
import { appendAuditLog } from '../../security/permissions.js'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import './SecurityModule.css'

const COMPANY_KEY = 'invefat_company_credential'
const LEGACY_COMPANIES_KEY = 'inveFatCompanies'

const defaultCredential = {
  companyCode: 'EMPRESA',
  companyKey: '1234',
  requireCredential: false,
  status: 'Activa',
}

function safeParse(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function loadCredential() {
  const saved = safeParse(COMPANY_KEY, null)
  if (saved) return { ...defaultCredential, ...saved }

  const companies = safeParse(LEGACY_COMPANIES_KEY, [])
  const firstCompany = Array.isArray(companies) ? companies[0] : null

  return {
    ...defaultCredential,
    companyCode: firstCompany?.companyCode || defaultCredential.companyCode,
    companyKey: firstCompany?.companyKey || defaultCredential.companyKey,
  }
}

function saveCredential(credential) {
  localStorage.setItem(COMPANY_KEY, JSON.stringify(credential))

  const companies = safeParse(LEGACY_COMPANIES_KEY, [])
  if (Array.isArray(companies) && companies.length > 0) {
    const nextCompanies = companies.map((company, index) => {
      if (index !== 0) return company
      return {
        ...company,
        companyCode: credential.companyCode,
        companyKey: credential.companyKey,
        active: credential.status === 'Activa',
      }
    })
    localStorage.setItem(LEGACY_COMPANIES_KEY, JSON.stringify(nextCompanies))
  }
}

export default function SecurityCompanyCredentialPage({ controls, onAction }) {
  const [credential, setCredential] = useState(() => loadCredential())
  const [message, setMessage] = useState('')

  const updateCredential = (field, value) => {
    setCredential((current) => ({ ...current, [field]: value }))
  }

  const saveCompanyCredential = (event) => {
    event.preventDefault()
    saveCredential(credential)
    appendAuditLog('Cambiar credencial de empresa', {
      module: 'Seguridad',
      submodule: 'Credencial de empresa',
      description: 'Credencial de empresa actualizada',
    })
    setMessage('Credencial de empresa guardada correctamente.')
    onAction?.('Credencial guardada')
  }

  return (
    <ModulePageLayout
      title="Credencial de empresa"
      moduleLabel="Seguridad"
      description="Administra el codigo y la clave base de empresa para futuras validaciones."
      breadcrumb={['Seguridad', 'Credencial de empresa']}
      actions={[
        { id: 'save', label: 'Guardar credencial', icon: Save, variant: 'primary', onClick: saveCompanyCredential },
        { id: 'exit', label: 'Salir', icon: LogOut, onClick: controls?.onClose },
      ]}
      {...controls}
    >
      <div className="security-page security-company-credential-page">
        {message && <div className="security-message">{message}</div>}

        <section className="security-panel">
          <div className="security-panel-heading">
            <div>
              <span>Empresa</span>
              <h2>Credencial principal</h2>
            </div>
            <strong>{credential.status}</strong>
          </div>

          <form className="security-form-grid" onSubmit={saveCompanyCredential}>
            <label>
              Codigo de empresa
              <input value={credential.companyCode} onChange={(event) => updateCredential('companyCode', event.target.value)} />
            </label>
            <label>
              Clave de empresa
              <input value={credential.companyKey} onChange={(event) => updateCredential('companyKey', event.target.value)} />
            </label>
            <label>
              Requerir credencial
              <select value={credential.requireCredential ? 'Si' : 'No'} onChange={(event) => updateCredential('requireCredential', event.target.value === 'Si')}>
                <option>Si</option>
                <option>No</option>
              </select>
            </label>
            <label>
              Estado
              <select value={credential.status} onChange={(event) => updateCredential('status', event.target.value)}>
                <option>Activa</option>
                <option>Inactiva</option>
              </select>
            </label>
            <div className="security-inline-actions security-span-2">
              <button type="submit" className="is-primary">
                <Building2 size={15} />
                Guardar datos
              </button>
            </div>
          </form>
        </section>
      </div>
    </ModulePageLayout>
  )
}
