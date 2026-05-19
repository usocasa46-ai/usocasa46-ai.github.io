import { Ban, Building2, CheckCircle2, LogOut, Pencil, Plus, ShieldCheck, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { isCompanyActive, loadCompanyUsers } from '../services/companyStorage.js'
import './SuperAdminPanel.css'

const emptyCompany = {
  companyCode: '',
  nombreComercial: '',
  razonSocial: '',
  rnc: '',
  telefono: '',
  correo: '',
  direccion: '',
  plan: 'Demo',
  estado: 'activa',
  fechaActivacion: new Date().toISOString().slice(0, 10),
  fechaVencimiento: '',
  maxUsuarios: 5,
  modulosActivos: ['dashboard', 'inventory', 'sales', 'purchases', 'warehouse', 'finance', 'reports', 'settings', 'security'],
}

export default function SuperAdminPanel({
  session,
  companies = [],
  onLogout,
  onSaveCompany,
  onCreateCompanyAdmin,
  onToggleCompanyStatus,
}) {
  const [query, setQuery] = useState('')
  const [companyDraft, setCompanyDraft] = useState(null)
  const [adminDraft, setAdminDraft] = useState(null)
  const [notice, setNotice] = useState('')

  const filteredCompanies = useMemo(() => {
    const clean = query.trim().toLowerCase()
    if (!clean) return companies

    return companies.filter((company) => [
      company.companyCode,
      company.nombreComercial,
      company.razonSocial,
      company.rnc,
      company.plan,
      company.estado,
    ].some((value) => String(value || '').toLowerCase().includes(clean)))
  }, [companies, query])

  const saveCompany = () => {
    try {
      if (!companyDraft?.companyCode || !companyDraft?.nombreComercial) {
        setNotice('Completa codigo y nombre comercial.')
        return
      }

      onSaveCompany?.(companyDraft)
      setCompanyDraft(null)
      setNotice('Empresa guardada correctamente.')
    } catch (error) {
      setNotice(error.message || 'No se pudo guardar la empresa.')
    }
  }

  const saveAdmin = () => {
    if (!adminDraft?.fullName || !adminDraft?.username || !adminDraft?.password) {
      setNotice('Completa nombre, usuario y contrasena del admin.')
      return
    }

    const result = onCreateCompanyAdmin?.(adminDraft.companyId, adminDraft)
    if (result?.ok === false) {
      setNotice(result.message)
      return
    }

    setAdminDraft(null)
    setNotice('Administrador de empresa creado.')
  }

  return (
    <main className="super-admin-shell">
      <header className="super-admin-header">
        <div>
          <span>Panel del Sistema</span>
          <h1>Super Admin</h1>
          <p>Administra empresas, licencias, modulos activos y usuarios administradores sin entrar a datos privados.</p>
        </div>
        <div className="super-admin-session">
          <ShieldCheck size={18} />
          <div>
            <strong>{session.fullName}</strong>
            <small>{session.currentCompanyCode}</small>
          </div>
          <button type="button" onClick={() => onLogout?.()}>
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </header>

      <section className="super-admin-kpis">
        <article><span>Empresas</span><strong>{companies.length}</strong></article>
        <article><span>Activas</span><strong>{companies.filter(isCompanyActive).length}</strong></article>
        <article><span>Suspendidas</span><strong>{companies.filter((company) => !isCompanyActive(company)).length}</strong></article>
        <article><span>Planes</span><strong>{new Set(companies.map((company) => company.plan)).size}</strong></article>
      </section>

      <section className="super-admin-panel">
        <div className="super-admin-toolbar">
          <div>
            <h2>Empresas</h2>
            <p>Panel basico para modo multiempresa de prueba.</p>
          </div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar empresa" />
          <button type="button" className="is-primary" onClick={() => setCompanyDraft(emptyCompany)}>
            <Plus size={16} />
            Nueva empresa
          </button>
        </div>

        {notice && <div className="super-admin-notice">{notice}</div>}

        <div className="super-admin-table-wrap">
          <table className="super-admin-table">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Nombre comercial</th>
                <th>RNC</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Usuarios</th>
                <th>Activacion</th>
                <th>Vencimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => {
                const users = loadCompanyUsers(company)
                return (
                  <tr key={company.id}>
                    <td>{company.companyCode}</td>
                    <td>{company.nombreComercial}</td>
                    <td>{company.rnc || 'N/D'}</td>
                    <td>{company.plan}</td>
                    <td><span className={`super-admin-status ${isCompanyActive(company) ? 'is-active' : 'is-paused'}`}>{company.estado}</span></td>
                    <td>{users.length} / {company.maxUsuarios || 'N/D'}</td>
                    <td>{company.fechaActivacion || 'N/D'}</td>
                    <td>{company.fechaVencimiento || 'N/D'}</td>
                    <td>
                      <div className="super-admin-actions">
                        <button type="button" title="Editar empresa" onClick={() => setCompanyDraft(company)}><Pencil size={15} /></button>
                        <button type="button" title="Crear admin" onClick={() => setAdminDraft({ companyId: company.id, fullName: '', username: '', password: '' })}><UserPlus size={15} /></button>
                        <button type="button" title={isCompanyActive(company) ? 'Suspender' : 'Activar'} onClick={() => onToggleCompanyStatus?.(company.id)}>
                          {isCompanyActive(company) ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="super-admin-grid">
        <article>
          <h3>Licencias / Planes</h3>
          <p>Modo demo preparado para planes por empresa, fecha de activacion, vencimiento y usuarios maximos.</p>
        </article>
        <article>
          <h3>Modulos activos</h3>
          <p>Los modulos activos se guardan por empresa para que luego puedan aplicarse a permisos y sidebar.</p>
        </article>
        <article>
          <h3>Estado del sistema</h3>
          <p>LocalStorage multiempresa activo. Supabase queda preparado para usar `company_id` en la siguiente fase.</p>
        </article>
      </section>

      {companyDraft && (
        <div className="super-admin-modal" role="dialog" aria-modal="true">
          <div className="super-admin-card">
            <header>
              <h2>{companyDraft.id ? 'Editar empresa' : 'Nueva empresa'}</h2>
              <button type="button" onClick={() => setCompanyDraft(null)}>X</button>
            </header>
            <div className="super-admin-form">
              <label>Codigo empresa<input value={companyDraft.companyCode} onChange={(event) => setCompanyDraft({ ...companyDraft, companyCode: event.target.value.toUpperCase() })} disabled={Boolean(companyDraft.id)} /></label>
              <label>Nombre comercial<input value={companyDraft.nombreComercial} onChange={(event) => setCompanyDraft({ ...companyDraft, nombreComercial: event.target.value })} /></label>
              <label>Razon social<input value={companyDraft.razonSocial} onChange={(event) => setCompanyDraft({ ...companyDraft, razonSocial: event.target.value })} /></label>
              <label>RNC<input value={companyDraft.rnc} onChange={(event) => setCompanyDraft({ ...companyDraft, rnc: event.target.value })} /></label>
              <label>Telefono<input value={companyDraft.telefono} onChange={(event) => setCompanyDraft({ ...companyDraft, telefono: event.target.value })} /></label>
              <label>Correo<input value={companyDraft.correo} onChange={(event) => setCompanyDraft({ ...companyDraft, correo: event.target.value })} /></label>
              <label>Direccion<input value={companyDraft.direccion} onChange={(event) => setCompanyDraft({ ...companyDraft, direccion: event.target.value })} /></label>
              <label>Plan<input value={companyDraft.plan} onChange={(event) => setCompanyDraft({ ...companyDraft, plan: event.target.value })} /></label>
              <label>Estado<select value={companyDraft.estado} onChange={(event) => setCompanyDraft({ ...companyDraft, estado: event.target.value })}><option value="activa">activa</option><option value="inactiva">inactiva</option><option value="suspendida">suspendida</option></select></label>
              <label>Fecha activacion<input type="date" value={companyDraft.fechaActivacion} onChange={(event) => setCompanyDraft({ ...companyDraft, fechaActivacion: event.target.value })} /></label>
              <label>Fecha vencimiento<input type="date" value={companyDraft.fechaVencimiento} onChange={(event) => setCompanyDraft({ ...companyDraft, fechaVencimiento: event.target.value })} /></label>
              <label>Maximo usuarios<input type="number" min="1" value={companyDraft.maxUsuarios} onChange={(event) => setCompanyDraft({ ...companyDraft, maxUsuarios: event.target.value })} /></label>
            </div>
            <footer>
              <button type="button" onClick={() => setCompanyDraft(null)}>Cancelar</button>
              <button type="button" className="is-primary" onClick={saveCompany}>Guardar</button>
            </footer>
          </div>
        </div>
      )}

      {adminDraft && (
        <div className="super-admin-modal" role="dialog" aria-modal="true">
          <div className="super-admin-card is-small">
            <header>
              <h2>Crear admin de empresa</h2>
              <button type="button" onClick={() => setAdminDraft(null)}>X</button>
            </header>
            <div className="super-admin-form">
              <label>Nombre completo<input value={adminDraft.fullName} onChange={(event) => setAdminDraft({ ...adminDraft, fullName: event.target.value })} /></label>
              <label>Usuario<input value={adminDraft.username} onChange={(event) => setAdminDraft({ ...adminDraft, username: event.target.value })} /></label>
              <label>Contrasena<input type="password" value={adminDraft.password} onChange={(event) => setAdminDraft({ ...adminDraft, password: event.target.value })} /></label>
            </div>
            <footer>
              <button type="button" onClick={() => setAdminDraft(null)}>Cancelar</button>
              <button type="button" className="is-primary" onClick={saveAdmin}>Crear admin</button>
            </footer>
          </div>
        </div>
      )}
    </main>
  )
}
