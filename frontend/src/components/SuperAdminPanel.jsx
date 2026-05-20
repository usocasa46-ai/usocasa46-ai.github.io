import {
  Ban,
  CheckCircle2,
  Copy,
  DatabaseBackup,
  Download,
  FileUp,
  KeyRound,
  LogOut,
  Pencil,
  Plus,
  Printer,
  ShieldCheck,
  UserPlus,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { erpModules } from '../config/modulesMap.js'
import {
  createSupportAccess,
  generateCompanyBackup,
  getCompanyLicense,
  getGlobalOperationalStorageWarnings,
  getIsolationResults,
  ALL_COMPANY_MODULES,
  importCompanyBackup,
  isCompanyActive,
  loadBackupLog,
  loadCompanyLicenses,
  loadCompanyUsers,
  loadSupportAccess,
  loadSystemAudit,
  saveCompanyUsers,
} from '../services/companyStorage.js'
import './SuperAdminPanel.css'

const moduleOptions = ALL_COMPANY_MODULES

const sections = [
  ['empresas', 'Empresas'],
  ['licencias', 'Licencias'],
  ['planes', 'Planes'],
  ['modulos', 'Modulos contratados'],
  ['usuarios', 'Usuarios por empresa'],
  ['estado', 'Estado del sistema'],
  ['respaldos', 'Respaldos por empresa'],
  ['soporte', 'Soporte autorizado'],
  ['logs', 'Logs tecnicos'],
  ['aislamiento', 'Prueba de aislamiento'],
]

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
  maxSucursales: 1,
  maxAlmacenes: 2,
  tipoVersion: 'Cloud',
  modulosActivos: ALL_COMPANY_MODULES,
  admin: {
    fullName: '',
    username: 'admin',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  },
}

const moduleLabelById = Object.fromEntries(erpModules.map((module) => [module.id, module.label]))

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function formatBytes(bytes = 0) {
  if (!bytes) return '0 KB'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function formatDateTime(value) {
  if (!value) return 'N/D'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/D'
  return date.toLocaleString('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toggleModule(list = [], moduleId) {
  return list.includes(moduleId)
    ? list.filter((item) => item !== moduleId)
    : [...list, moduleId]
}

function generateSecurePassword() {
  const number = Math.floor(10000 + Math.random() * 89999)
  return `Admin-${number}`
}

function copyText(value) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(value)
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
  return Promise.resolve()
}

export default function SuperAdminPanel({
  session,
  companies = [],
  plans = [],
  onLogout,
  onSaveCompany,
  onSavePlans,
  onUpdateCompanyLicense,
  onCreateCompanyAdmin,
  onToggleCompanyStatus,
}) {
  const [activeSection, setActiveSection] = useState('empresas')
  const [query, setQuery] = useState('')
  const [companyDraft, setCompanyDraft] = useState(null)
  const [adminDraft, setAdminDraft] = useState(null)
  const [licenseDraft, setLicenseDraft] = useState(null)
  const [planDraft, setPlanDraft] = useState(null)
  const [supportDraft, setSupportDraft] = useState(null)
  const [accessSummary, setAccessSummary] = useState(null)
  const [notice, setNotice] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const licenses = useMemo(() => loadCompanyLicenses(), [companies, refreshKey])
  const backups = useMemo(() => loadBackupLog(), [refreshKey])
  const supportAccess = useMemo(() => loadSupportAccess(), [refreshKey])
  const auditLog = useMemo(() => loadSystemAudit(), [refreshKey])
  const isolation = useMemo(() => getIsolationResults(companies), [companies, refreshKey])
  const diagnostics = useMemo(() => {
    const globalStorageWarnings = getGlobalOperationalStorageWarnings()
    const warnings = globalStorageWarnings.map((item) => item.message)
    const errors = []
    const companyIds = new Set(companies.map((company) => company.id))
    const companyCodes = new Set()

    companies.forEach((company) => {
      const code = String(company.companyCode || '').trim().toUpperCase()
      if (!code) {
        errors.push(`Empresa sin codigo interno: ${company.nombreComercial || company.id}`)
      } else if (companyCodes.has(code)) {
        errors.push(`Codigo de empresa duplicado: ${code}`)
      }
      if (code) companyCodes.add(code)

      const license = licenses.find((item) => item.companyId === company.id)
      if (!license) {
        warnings.push(`${code || company.nombreComercial}: sin licencia registrada.`)
      } else {
        const modules = Array.isArray(license.modulosActivos) ? license.modulosActivos : []
        if (!modules.length) errors.push(`${code}: licencia sin modulos activos.`)
        if (['vencida', 'suspendida'].includes(String(license.estado || '').toLowerCase())) {
          warnings.push(`${code}: licencia ${license.estado}.`)
        }
      }

      const users = loadCompanyUsers(company)
      const seenUsers = new Set()
      users.forEach((user) => {
        const username = String(user.username || '').trim().toLowerCase()
        if (!username) return
        if (seenUsers.has(username)) errors.push(`${code}: usuario duplicado dentro de la empresa (${user.username}).`)
        seenUsers.add(username)
      })
    })

    licenses.forEach((license) => {
      if (!license.companyId || !companyIds.has(license.companyId)) {
        errors.push(`Licencia sin empresa valida: ${license.codigoLicencia || license.id}`)
      }
    })

    plans.forEach((plan) => {
      if (!Array.isArray(plan.modules) || plan.modules.length === 0) {
        errors.push(`Plan sin modulos activos: ${plan.name || plan.id}`)
      }
    })

    const isolationByCompany = new Map(isolation.map((item) => [item.companyCode, item]))
    const rows = companies.map((company) => {
      const license = licenses.find((item) => item.companyId === company.id)
      const modules = license?.modulosActivos || company.modulosActivos || []
      const lastBackup = backups.find((backup) => backup.companyId === company.id)
      return {
        company,
        usersCount: loadCompanyUsers(company).length,
        licenseStatus: license?.estado || 'sin licencia',
        activeModulesCount: Array.isArray(modules) ? modules.length : 0,
        modulesTotal: ALL_COMPANY_MODULES.length,
        lastBackup,
        isolation: isolationByCompany.get(company.companyCode)?.status || 'Sin prueba',
      }
    })

    return {
      rows,
      warnings,
      errors,
      globalStorageWarnings,
      status: errors.length ? 'Revisar' : warnings.length ? 'Con advertencias' : 'Correcto',
    }
  }, [companies, licenses, backups, plans, isolation, refreshKey])

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

  const refresh = () => setRefreshKey((current) => current + 1)

  const saveCompany = () => {
    try {
      if (!companyDraft?.companyCode || !companyDraft?.nombreComercial) {
        setNotice('Completa codigo y nombre comercial.')
        return
      }

      if (!companyDraft.id) {
        const admin = companyDraft.admin || {}
        if (!admin.fullName || !admin.username || !admin.password) {
          setNotice('Completa la seccion Administrador de la empresa.')
          return
        }
        if (admin.password !== admin.confirmPassword) {
          setNotice('La contrasena inicial y la confirmacion no coinciden.')
          return
        }
      }

      const result = onSaveCompany?.(companyDraft)
      if (result?.ok === false) {
        setNotice(result.message)
        return
      }
      if (result?.accessSummary) setAccessSummary(result.accessSummary)
      setCompanyDraft(null)
      setNotice('Empresa guardada correctamente.')
      refresh()
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
    refresh()
  }

  const saveLicense = () => {
    if (!licenseDraft?.companyId) {
      setNotice('La licencia debe estar asociada a una empresa.')
      return
    }
    if (!Array.isArray(licenseDraft.modulosActivos) || licenseDraft.modulosActivos.length === 0) {
      setNotice('La licencia debe tener al menos un modulo activo.')
      return
    }
    onUpdateCompanyLicense?.(licenseDraft.companyId, licenseDraft)
    setLicenseDraft(null)
    setNotice('Licencia actualizada.')
    refresh()
  }

  const savePlan = () => {
    if (!planDraft?.name) {
      setNotice('Completa el nombre del plan.')
      return
    }
    if (!Array.isArray(planDraft.modules) || planDraft.modules.length === 0) {
      setNotice('El plan debe tener al menos un modulo activo.')
      return
    }

    const nextPlan = {
      ...planDraft,
      id: planDraft.id || `PLAN-${Date.now()}`,
      status: planDraft.status || 'Activo',
      modules: planDraft.modules || [],
    }
    const nextPlans = plans.some((plan) => plan.id === nextPlan.id)
      ? plans.map((plan) => (plan.id === nextPlan.id ? nextPlan : plan))
      : [nextPlan, ...plans]
    onSavePlans?.(nextPlans)
    setPlanDraft(null)
    setNotice('Plan guardado.')
  }

  const resetAdminPassword = (company, user) => {
    const users = loadCompanyUsers(company)
    const updated = users.map((item) => (item.id === user.id ? { ...item, password: 'admin123' } : item))
    saveCompanyUsers(company, updated)
    setNotice(`Contrasena reiniciada para ${user.username}.`)
    refresh()
  }

  const toggleAdminStatus = (company, user) => {
    const users = loadCompanyUsers(company)
    const updated = users.map((item) => (item.id === user.id ? { ...item, active: !item.active } : item))
    saveCompanyUsers(company, updated)
    setNotice('Estado de usuario actualizado.')
    refresh()
  }

  const exportBackup = (company) => {
    const backup = generateCompanyBackup(company)
    downloadJson(`respaldo-${company.companyCode}.json`, backup)
    setNotice(`Respaldo generado para ${company.companyCode}.`)
    refresh()
  }

  const importBackup = (file, company) => {
    if (!file || !company) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result)
        importCompanyBackup(company, payload)
        setNotice(`Respaldo importado en ${company.companyCode}.`)
        refresh()
      } catch {
        setNotice('No se pudo importar el respaldo JSON.')
      }
    }
    reader.readAsText(file)
  }

  const authorizeSupport = () => {
    const company = companies.find((item) => item.id === supportDraft?.companyId)
    if (!company) return
    createSupportAccess({
      company,
      hours: Number(supportDraft.hours || 1),
      motivo: supportDraft.motivo || 'Soporte tecnico',
      requestedBy: 'Super Admin',
      createdBy: session.username,
    })
    setSupportDraft(null)
    setNotice('Soporte autorizado.')
    refresh()
  }

  const renderCompanies = () => (
    <section className="super-admin-panel">
      <div className="super-admin-toolbar">
        <div>
          <h2>Empresas</h2>
          <p>Administracion de empresas sin abrir datos operativos privados.</p>
        </div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar empresa" />
        <button type="button" className="is-primary" onClick={() => setCompanyDraft(emptyCompany)}>
          <Plus size={16} />
          Nueva empresa
        </button>
      </div>

      <CompanyTable
        companies={filteredCompanies}
        onEdit={setCompanyDraft}
        onAdmin={setAdminDraft}
        onToggle={onToggleCompanyStatus}
        onLicense={(company) => setLicenseDraft(getCompanyLicense(company))}
        onBackup={exportBackup}
      />
    </section>
  )

  const renderLicenses = () => (
    <section className="super-admin-panel">
      <div className="super-admin-toolbar">
        <div>
          <h2>Licencias</h2>
          <p>Bloquea acceso cuando una licencia esta vencida o suspendida.</p>
        </div>
      </div>
      <div className="super-admin-table-wrap">
        <table className="super-admin-table">
          <thead>
            <tr><th>Empresa</th><th>Licencia</th><th>Plan</th><th>Estado</th><th>Version</th><th>Vence</th><th>Usuarios</th><th>Sucursales</th><th>Almacenes</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {licenses.map((license) => (
              <tr key={license.id}>
                <td>{license.companyCode}</td>
                <td>{license.codigoLicencia}</td>
                <td>{license.planContratado}</td>
                <td><span className={`super-admin-status ${license.estado === 'suspendida' || license.estado === 'vencida' ? 'is-paused' : 'is-active'}`}>{license.estado}</span></td>
                <td>{license.tipoVersion}</td>
                <td>{license.fechaVencimiento || 'Sin fecha'}</td>
                <td>{license.maxUsuarios}</td>
                <td>{license.maxSucursales}</td>
                <td>{license.maxAlmacenes}</td>
                <td><button type="button" onClick={() => setLicenseDraft(license)}><Pencil size={15} /> Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )

  const renderPlans = () => (
    <section className="super-admin-panel">
      <div className="super-admin-toolbar">
        <div>
          <h2>Planes</h2>
          <p>Planes configurables y modulos incluidos.</p>
        </div>
        <button type="button" className="is-primary" onClick={() => setPlanDraft({ name: '', status: 'Activo', modules: ['dashboard'], description: '' })}><Plus size={16} /> Nuevo plan</button>
      </div>
      <div className="super-admin-plan-grid">
        {plans.map((plan) => (
          <article key={plan.id}>
            <header><h3>{plan.name}</h3><button type="button" onClick={() => setPlanDraft(plan)}><Pencil size={15} /></button></header>
            <p>{plan.description}</p>
            <span>{plan.status}</span>
            <div>{(plan.modules || []).map((module) => <small key={module}>{module}</small>)}</div>
          </article>
        ))}
      </div>
    </section>
  )

  const renderUsers = () => (
    <section className="super-admin-panel">
      <div className="super-admin-toolbar">
        <div><h2>Usuarios por empresa</h2><p>Solo administradores y conteos, sin datos privados.</p></div>
      </div>
      <div className="super-admin-table-wrap">
        <table className="super-admin-table">
          <thead><tr><th>Empresa</th><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {companies.flatMap((company) => loadCompanyUsers(company).map((user) => (
              <tr key={`${company.id}-${user.id}`}>
                <td>{company.companyCode}</td><td>{user.username}</td><td>{user.fullName}</td><td>{user.role}</td><td>{user.active ? 'Activo' : 'Inactivo'}</td>
                <td>
                  <div className="super-admin-actions">
                    <button type="button" title="Reiniciar contrasena" onClick={() => resetAdminPassword(company, user)}><KeyRound size={15} /></button>
                    <button type="button" title="Activar / inactivar" onClick={() => toggleAdminStatus(company, user)}>{user.active ? <Ban size={15} /> : <CheckCircle2 size={15} />}</button>
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </section>
  )

  const renderBackups = () => (
    <section className="super-admin-panel">
      <div className="super-admin-toolbar">
        <div><h2>Respaldos por empresa</h2><p>Exporta o importa JSON de una sola empresa.</p></div>
      </div>
      <div className="super-admin-card-grid">
        {companies.map((company) => {
          const lastBackup = backups.find((backup) => backup.companyId === company.id)
          return (
            <article key={company.id}>
              <h3>{company.companyCode}</h3>
              <p>{company.nombreComercial}</p>
              <small>Ultimo respaldo: {lastBackup?.fecha || 'N/D'}</small>
              <small>Tamano aprox.: {formatBytes(lastBackup?.bytes)}</small>
              <div className="super-admin-inline-actions">
                <button type="button" onClick={() => exportBackup(company)}><Download size={15} /> Generar respaldo</button>
                <label className="super-admin-file-button"><FileUp size={15} /> Importar JSON<input type="file" accept="application/json,.json" onChange={(event) => importBackup(event.target.files?.[0], company)} /></label>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )

  const renderSupport = () => (
    <section className="super-admin-panel">
      <div className="super-admin-toolbar">
        <div><h2>Acceso de soporte autorizado</h2><p>Soporte solo con autorizacion vigente.</p></div>
        <button type="button" className="is-primary" onClick={() => setSupportDraft({ companyId: companies[0]?.id || '', hours: 1, motivo: '' })}>Autorizar soporte</button>
      </div>
      <div className="super-admin-table-wrap">
        <table className="super-admin-table">
          <thead><tr><th>Empresa</th><th>Inicio</th><th>Fin</th><th>Motivo</th><th>Estado</th><th>Solicitado por</th></tr></thead>
          <tbody>
            {supportAccess.map((record) => <tr key={record.id}><td>{record.empresa}</td><td>{record.fechaInicio}</td><td>{record.fechaFin}</td><td>{record.motivo}</td><td>{record.estado}</td><td>{record.solicitadoPor}</td></tr>)}
            {supportAccess.length === 0 && <tr><td colSpan="6">No hay soporte autorizado activo.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )

  const renderLogs = () => (
    <section className="super-admin-panel">
      <div className="super-admin-toolbar"><div><h2>Logs tecnicos</h2><p>Auditoria multiempresa del sistema.</p></div></div>
      <div className="super-admin-table-wrap">
        <table className="super-admin-table">
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Empresa</th><th>Accion</th><th>Descripcion</th><th>Modulo</th></tr></thead>
          <tbody>{auditLog.slice(0, 80).map((record) => <tr key={record.id}><td>{record.fecha}</td><td>{record.usuario}</td><td>{record.empresa}</td><td>{record.accion}</td><td>{record.descripcion}</td><td>{record.modulo}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  )

  const renderIsolation = () => (
    <section className="super-admin-panel">
      <div className="super-admin-toolbar"><div><h2>Prueba de aislamiento</h2><p>Solo muestra conteos, no datos privados.</p></div></div>
      {diagnostics.globalStorageWarnings?.length > 0 && (
        <div className="super-admin-notice">
          Se detectaron datos operativos globales no aislados. Son datos antiguos y no se cargan en empresas nuevas.
        </div>
      )}
      <div className="super-admin-card-grid">
        {isolation.map((result) => (
          <article key={result.companyCode}>
            <h3>{result.companyCode}</h3>
            <p>{result.companyName}</p>
            <span className="super-admin-status is-active">{result.status}</span>
            {Object.entries(result.counts).map(([key, value]) => <small key={key}>{key}: {value}</small>)}
          </article>
        ))}
      </div>
    </section>
  )

  const renderDiagnostics = () => (
    <section className="super-admin-panel">
      <div className="super-admin-toolbar">
        <div>
          <h2>Estado del sistema / Diagnostico</h2>
          <p>Revision de licencias, modulos, usuarios y aislamiento sin mostrar datos privados.</p>
        </div>
      </div>

      <div className="super-admin-grid">
        <article>
          <h3>Estado general</h3>
          <p>{diagnostics.status}</p>
        </article>
        <article>
          <h3>Empresas</h3>
          <p>{companies.length} registradas.</p>
        </article>
        <article>
          <h3>Auditoria</h3>
          <p>{auditLog.length} eventos registrados.</p>
        </article>
        <article>
          <h3>Advertencias</h3>
          <p>{diagnostics.warnings.length} detectadas.</p>
        </article>
        <article>
          <h3>Errores</h3>
          <p>{diagnostics.errors.length} detectados.</p>
        </article>
        <article>
          <h3>Modulos disponibles</h3>
          <p>{ALL_COMPANY_MODULES.length} en el sistema.</p>
        </article>
      </div>

      <div className="super-admin-table-wrap super-admin-diagnostic-table">
        <table className="super-admin-table">
          <thead>
            <tr><th>Empresa</th><th>Usuarios</th><th>Licencia</th><th>Modulos activos</th><th>Ultimo respaldo</th><th>Aislamiento</th></tr>
          </thead>
          <tbody>
            {diagnostics.rows.map((row) => (
              <tr key={row.company.id}>
                <td>{row.company.companyCode}</td>
                <td>{row.usersCount}</td>
                <td><span className={`super-admin-status ${['activa', 'demo'].includes(String(row.licenseStatus).toLowerCase()) ? 'is-active' : 'is-paused'}`}>{row.licenseStatus}</span></td>
                <td>{row.activeModulesCount} / {row.modulesTotal}</td>
                <td>{formatDateTime(row.lastBackup?.fecha)}</td>
                <td>{row.isolation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="super-admin-diagnostic-lists">
        <article>
          <h3>Advertencias</h3>
          {diagnostics.warnings.length === 0 && <p>No hay advertencias.</p>}
          {diagnostics.warnings.map((item) => <small key={item}>{item}</small>)}
        </article>
        <article>
          <h3>Errores detectados</h3>
          {diagnostics.errors.length === 0 && <p>No hay errores criticos.</p>}
          {diagnostics.errors.map((item) => <small key={item}>{item}</small>)}
        </article>
      </div>
    </section>
  )

  const renderCurrentSection = () => {
    if (activeSection === 'licencias') return renderLicenses()
    if (activeSection === 'planes') return renderPlans()
    if (activeSection === 'modulos') return renderPlans()
    if (activeSection === 'usuarios') return renderUsers()
    if (activeSection === 'respaldos') return renderBackups()
    if (activeSection === 'soporte') return renderSupport()
    if (activeSection === 'logs') return renderLogs()
    if (activeSection === 'aislamiento') return renderIsolation()
    if (activeSection === 'estado') return renderDiagnostics()
    return renderCompanies()
  }

  return (
    <main className="super-admin-shell">
      <header className="super-admin-header">
        <div>
          <span>Panel del Sistema</span>
          <h1>Super Admin</h1>
          <p>Administra empresas, licencias, modulos activos y soporte sin ver datos privados.</p>
        </div>
        <div className="super-admin-session">
          <ShieldCheck size={18} />
          <div><strong>{session.fullName}</strong><small>{session.currentCompanyCode}</small></div>
          <button type="button" onClick={() => onLogout?.()}><LogOut size={16} /> Salir</button>
        </div>
      </header>

      <nav className="super-admin-tabs">
        {sections.map(([id, label]) => <button type="button" key={id} className={activeSection === id ? 'is-active' : ''} onClick={() => setActiveSection(id)}>{label}</button>)}
      </nav>

      <section className="super-admin-kpis">
        <article><span>Empresas</span><strong>{companies.length}</strong></article>
        <article><span>Activas</span><strong>{companies.filter(isCompanyActive).length}</strong></article>
        <article><span>Licencias</span><strong>{licenses.length}</strong></article>
        <article><span>Soporte activo</span><strong>{supportAccess.filter((item) => item.estado === 'activo').length}</strong></article>
      </section>

      {notice && <div className="super-admin-notice">{notice}</div>}

      {renderCurrentSection()}

      {companyDraft && <CompanyModal draft={companyDraft} setDraft={setCompanyDraft} onSave={saveCompany} />}
      {adminDraft && <AdminModal draft={adminDraft} setDraft={setAdminDraft} onSave={saveAdmin} />}
      {licenseDraft && <LicenseModal draft={licenseDraft} setDraft={setLicenseDraft} onSave={saveLicense} plans={plans} />}
      {planDraft && <PlanModal draft={planDraft} setDraft={setPlanDraft} onSave={savePlan} />}
      {accessSummary && <AccessSummaryModal summary={accessSummary} setSummary={setAccessSummary} setNotice={setNotice} />}
      {supportDraft && (
        <SupportModal
          draft={supportDraft}
          setDraft={setSupportDraft}
          onSave={authorizeSupport}
          companies={companies}
        />
      )}
    </main>
  )
}

function CompanyTable({ companies, onEdit, onAdmin, onToggle, onLicense, onBackup }) {
  return (
    <div className="super-admin-table-wrap">
      <table className="super-admin-table">
        <thead>
          <tr><th>Codigo</th><th>Nombre comercial</th><th>RNC</th><th>Plan</th><th>Estado</th><th>Usuarios</th><th>Activacion</th><th>Vencimiento</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {companies.map((company) => {
            const users = loadCompanyUsers(company)
            return (
              <tr key={company.id}>
                <td>{company.companyCode}</td><td>{company.nombreComercial}</td><td>{company.rnc || 'N/D'}</td><td>{company.plan}</td>
                <td><span className={`super-admin-status ${isCompanyActive(company) ? 'is-active' : 'is-paused'}`}>{company.estado}</span></td>
                <td>{users.length} / {company.maxUsuarios || 'N/D'}</td><td>{company.fechaActivacion || 'N/D'}</td><td>{company.fechaVencimiento || 'N/D'}</td>
                <td>
                  <div className="super-admin-actions">
                    <button type="button" title="Editar empresa" onClick={() => onEdit(company)}><Pencil size={15} /></button>
                    <button type="button" title="Crear admin" onClick={() => onAdmin({ companyId: company.id, fullName: '', username: '', password: '' })}><UserPlus size={15} /></button>
                    <button type="button" title="Licencia" onClick={() => onLicense(company)}><KeyRound size={15} /></button>
                    <button type="button" title="Respaldo" onClick={() => onBackup(company)}><DatabaseBackup size={15} /></button>
                    <button type="button" title={isCompanyActive(company) ? 'Suspender' : 'Activar'} onClick={() => onToggle?.(company.id)}>{isCompanyActive(company) ? <Ban size={15} /> : <CheckCircle2 size={15} />}</button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function CompanyModal({ draft, setDraft, onSave }) {
  const updateAdmin = (field, value) => {
    setDraft({
      ...draft,
      admin: {
        ...(draft.admin || {}),
        [field]: value,
      },
    })
  }

  const generatePassword = () => {
    const password = generateSecurePassword()
    setDraft({
      ...draft,
      admin: {
        ...(draft.admin || {}),
        password,
        confirmPassword: password,
      },
    })
  }

  return (
    <div className="super-admin-modal" role="dialog" aria-modal="true">
      <div className="super-admin-card">
        <header><h2>{draft.id ? 'Editar empresa' : 'Nueva empresa'}</h2><button type="button" onClick={() => setDraft(null)}>X</button></header>
        <div className="super-admin-form">
          <label>Codigo empresa<input value={draft.companyCode} onChange={(event) => setDraft({ ...draft, companyCode: event.target.value.toUpperCase() })} disabled={Boolean(draft.id)} /></label>
          <label>Nombre comercial<input value={draft.nombreComercial} onChange={(event) => setDraft({ ...draft, nombreComercial: event.target.value })} /></label>
          <label>Razon social<input value={draft.razonSocial} onChange={(event) => setDraft({ ...draft, razonSocial: event.target.value })} /></label>
          <label>RNC<input value={draft.rnc} onChange={(event) => setDraft({ ...draft, rnc: event.target.value })} /></label>
          <label>Telefono<input value={draft.telefono} onChange={(event) => setDraft({ ...draft, telefono: event.target.value })} /></label>
          <label>Correo<input value={draft.correo} onChange={(event) => setDraft({ ...draft, correo: event.target.value })} /></label>
          <label>Direccion<input value={draft.direccion} onChange={(event) => setDraft({ ...draft, direccion: event.target.value })} /></label>
          <label>Plan<input value={draft.plan} onChange={(event) => setDraft({ ...draft, plan: event.target.value })} /></label>
          <label>Estado<select value={draft.estado} onChange={(event) => setDraft({ ...draft, estado: event.target.value })}><option value="activa">activa</option><option value="inactiva">inactiva</option><option value="suspendida">suspendida</option></select></label>
          <label>Fecha activacion<input type="date" value={draft.fechaActivacion} onChange={(event) => setDraft({ ...draft, fechaActivacion: event.target.value })} /></label>
          <label>Fecha vencimiento<input type="date" value={draft.fechaVencimiento} onChange={(event) => setDraft({ ...draft, fechaVencimiento: event.target.value })} /></label>
          <label>Maximo usuarios<input type="number" min="1" value={draft.maxUsuarios} onChange={(event) => setDraft({ ...draft, maxUsuarios: event.target.value })} /></label>
          {!draft.id && (
            <fieldset className="super-admin-admin-fieldset">
              <legend>Administrador de la empresa</legend>
              <label>Nombre del administrador<input value={draft.admin?.fullName || ''} onChange={(event) => updateAdmin('fullName', event.target.value)} /></label>
              <label>Usuario administrador<input value={draft.admin?.username || ''} onChange={(event) => updateAdmin('username', event.target.value)} /></label>
              <label>Correo<input type="email" value={draft.admin?.email || ''} onChange={(event) => updateAdmin('email', event.target.value)} /></label>
              <label>Telefono<input value={draft.admin?.phone || ''} onChange={(event) => updateAdmin('phone', event.target.value)} /></label>
              <label>Contrasena inicial<input type="text" value={draft.admin?.password || ''} onChange={(event) => updateAdmin('password', event.target.value)} /></label>
              <label>Confirmar contrasena<input type="text" value={draft.admin?.confirmPassword || ''} onChange={(event) => updateAdmin('confirmPassword', event.target.value)} /></label>
              <button type="button" className="super-admin-generate-key" onClick={generatePassword}>Generar clave segura</button>
            </fieldset>
          )}
        </div>
        <footer><button type="button" onClick={() => setDraft(null)}>Cancelar</button><button type="button" className="is-primary" onClick={onSave}>Guardar</button></footer>
      </div>
    </div>
  )
}

function AccessSummaryModal({ summary, setSummary, setNotice }) {
  const credentialsText = [
    'INVE-FAT SYSTEM',
    'Credenciales de acceso',
    '',
    `Codigo empresa: ${summary.companyCode}`,
    `Empresa: ${summary.companyName}`,
    `Usuario: ${summary.username}`,
    `Contrasena temporal: ${summary.password}`,
    `Plan: ${summary.plan}`,
    `Fecha activacion: ${summary.fechaActivacion || 'N/D'}`,
    `Fecha vencimiento: ${summary.fechaVencimiento || 'Sin fecha'}`,
    '',
    'Por seguridad, cambie su contrasena en el primer inicio de sesion.',
  ].join('\n')

  const handleCopy = () => {
    copyText(credentialsText).then(() => setNotice?.('Credenciales copiadas.'))
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=720,height=820')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>Credenciales de acceso</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #10243a; }
            h1 { margin: 0 0 8px; }
            .card { border: 1px solid #d7e1eb; border-radius: 12px; padding: 22px; }
            p { margin: 8px 0; font-size: 15px; }
            strong { display: inline-block; min-width: 170px; }
            .note { margin-top: 20px; padding: 12px; background: #fff7ed; border-radius: 8px; color: #9a3412; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>INVE-FAT SYSTEM</h1>
            <h2>Credenciales de acceso</h2>
            <p><strong>Codigo empresa:</strong> ${summary.companyCode}</p>
            <p><strong>Empresa:</strong> ${summary.companyName}</p>
            <p><strong>Usuario:</strong> ${summary.username}</p>
            <p><strong>Contrasena temporal:</strong> ${summary.password}</p>
            <p><strong>Plan:</strong> ${summary.plan}</p>
            <p><strong>Activacion:</strong> ${summary.fechaActivacion || 'N/D'}</p>
            <p><strong>Vencimiento:</strong> ${summary.fechaVencimiento || 'Sin fecha'}</p>
            <div class="note">Por seguridad, cambie su contrasena en el primer inicio de sesion.</div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className="super-admin-modal" role="dialog" aria-modal="true">
      <div className="super-admin-card is-small">
        <header><h2>Empresa creada correctamente</h2><button type="button" onClick={() => setSummary(null)}>X</button></header>
        <div className="super-admin-access-summary">
          <p>Entrega estas credenciales al cliente para su primera entrada.</p>
          <dl>
            <div><dt>Codigo de empresa</dt><dd>{summary.companyCode}</dd></div>
            <div><dt>Nombre comercial</dt><dd>{summary.companyName}</dd></div>
            <div><dt>Usuario administrador</dt><dd>{summary.username}</dd></div>
            <div><dt>Contrasena inicial</dt><dd>{summary.password}</dd></div>
            <div><dt>Plan</dt><dd>{summary.plan}</dd></div>
            <div><dt>Modulos activos</dt><dd>{(summary.modules || []).map((moduleId) => moduleLabelById[moduleId] || moduleId).join(', ')}</dd></div>
            <div><dt>Activacion</dt><dd>{summary.fechaActivacion || 'N/D'}</dd></div>
            <div><dt>Vencimiento</dt><dd>{summary.fechaVencimiento || 'Sin fecha'}</dd></div>
          </dl>
          <small>Por seguridad, cambie su contrasena en el primer inicio de sesion.</small>
        </div>
        <footer>
          <button type="button" onClick={handleCopy}><Copy size={15} /> Copiar credenciales</button>
          <button type="button" onClick={handlePrint}><Printer size={15} /> Imprimir hoja de acceso</button>
          <button type="button" className="is-primary" onClick={() => setSummary(null)}>Cerrar</button>
        </footer>
      </div>
    </div>
  )
}

function AdminModal({ draft, setDraft, onSave }) {
  return (
    <div className="super-admin-modal" role="dialog" aria-modal="true">
      <div className="super-admin-card is-small">
        <header><h2>Crear admin de empresa</h2><button type="button" onClick={() => setDraft(null)}>X</button></header>
        <div className="super-admin-form">
          <label>Nombre completo<input value={draft.fullName} onChange={(event) => setDraft({ ...draft, fullName: event.target.value })} /></label>
          <label>Usuario<input value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value })} /></label>
          <label>Contrasena<input type="password" value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} /></label>
        </div>
        <footer><button type="button" onClick={() => setDraft(null)}>Cancelar</button><button type="button" className="is-primary" onClick={onSave}>Crear admin</button></footer>
      </div>
    </div>
  )
}

function LicenseModal({ draft, setDraft, onSave, plans }) {
  return (
    <div className="super-admin-modal" role="dialog" aria-modal="true">
      <div className="super-admin-card">
        <header><h2>Licencia de empresa</h2><button type="button" onClick={() => setDraft(null)}>X</button></header>
        <div className="super-admin-form">
          <label>Codigo licencia<input value={draft.codigoLicencia} onChange={(event) => setDraft({ ...draft, codigoLicencia: event.target.value })} /></label>
          <label>Plan<select value={draft.planContratado} onChange={(event) => {
            const plan = plans.find((item) => item.name === event.target.value)
            setDraft({ ...draft, planContratado: event.target.value, modulosActivos: plan?.modules || draft.modulosActivos })
          }}>{plans.map((plan) => <option key={plan.id}>{plan.name}</option>)}</select></label>
          <label>Estado<select value={draft.estado} onChange={(event) => setDraft({ ...draft, estado: event.target.value })}><option value="activa">activa</option><option value="demo">demo</option><option value="vencida">vencida</option><option value="suspendida">suspendida</option></select></label>
          <label>Tipo version<select value={draft.tipoVersion} onChange={(event) => setDraft({ ...draft, tipoVersion: event.target.value })}><option>Cloud</option><option>Escritorio</option><option>Ambas</option></select></label>
          <label>Fecha activacion<input type="date" value={draft.fechaActivacion} onChange={(event) => setDraft({ ...draft, fechaActivacion: event.target.value })} /></label>
          <label>Fecha vencimiento<input type="date" value={draft.fechaVencimiento} onChange={(event) => setDraft({ ...draft, fechaVencimiento: event.target.value })} /></label>
          <label>Max usuarios<input type="number" min="1" value={draft.maxUsuarios} onChange={(event) => setDraft({ ...draft, maxUsuarios: event.target.value })} /></label>
          <label>Max sucursales<input type="number" min="1" value={draft.maxSucursales} onChange={(event) => setDraft({ ...draft, maxSucursales: event.target.value })} /></label>
          <label>Max almacenes<input type="number" min="1" value={draft.maxAlmacenes} onChange={(event) => setDraft({ ...draft, maxAlmacenes: event.target.value })} /></label>
          <label>Observacion<input value={draft.observacion || ''} onChange={(event) => setDraft({ ...draft, observacion: event.target.value })} /></label>
          <div className="super-admin-checks">
            <div className="super-admin-check-actions">
              <button type="button" onClick={() => setDraft({ ...draft, modulosActivos: ALL_COMPANY_MODULES })}>Activar todos los modulos para esta empresa</button>
              <button type="button" onClick={() => {
                const plan = plans.find((item) => item.name === draft.planContratado)
                setDraft({ ...draft, modulosActivos: plan?.modules || ALL_COMPANY_MODULES })
              }}>Restaurar modulos por defecto</button>
            </div>
            {moduleOptions.map((moduleId) => <label key={moduleId}><input type="checkbox" checked={(draft.modulosActivos || []).includes(moduleId)} onChange={() => setDraft({ ...draft, modulosActivos: toggleModule(draft.modulosActivos, moduleId) })} />{moduleId}</label>)}
          </div>
        </div>
        <footer><button type="button" onClick={() => setDraft(null)}>Cancelar</button><button type="button" className="is-primary" onClick={onSave}>Guardar licencia</button></footer>
      </div>
    </div>
  )
}

function PlanModal({ draft, setDraft, onSave }) {
  return (
    <div className="super-admin-modal" role="dialog" aria-modal="true">
      <div className="super-admin-card">
        <header><h2>Plan del sistema</h2><button type="button" onClick={() => setDraft(null)}>X</button></header>
        <div className="super-admin-form">
          <label>Nombre<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
          <label>Estado<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}><option>Activo</option><option>Inactivo</option></select></label>
          <label className="is-wide">Descripcion<input value={draft.description || ''} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
          <div className="super-admin-checks">
            <div className="super-admin-check-actions">
              <button type="button" onClick={() => setDraft({ ...draft, modules: ALL_COMPANY_MODULES })}>Activar todos los modulos</button>
              <button type="button" onClick={() => setDraft({ ...draft, modules: ['dashboard'] })}>Restaurar modulos por defecto</button>
            </div>
            {moduleOptions.map((moduleId) => <label key={moduleId}><input type="checkbox" checked={(draft.modules || []).includes(moduleId)} onChange={() => setDraft({ ...draft, modules: toggleModule(draft.modules, moduleId) })} />{moduleId}</label>)}
          </div>
        </div>
        <footer><button type="button" onClick={() => setDraft(null)}>Cancelar</button><button type="button" className="is-primary" onClick={onSave}>Guardar plan</button></footer>
      </div>
    </div>
  )
}

function SupportModal({ draft, setDraft, onSave, companies }) {
  return (
    <div className="super-admin-modal" role="dialog" aria-modal="true">
      <div className="super-admin-card is-small">
        <header><h2>Autorizar soporte</h2><button type="button" onClick={() => setDraft(null)}>X</button></header>
        <div className="super-admin-form">
          <label>Empresa<select value={draft.companyId} onChange={(event) => setDraft({ ...draft, companyId: event.target.value })}>{companies.map((company) => <option key={company.id} value={company.id}>{company.companyCode}</option>)}</select></label>
          <label>Tiempo<select value={draft.hours} onChange={(event) => setDraft({ ...draft, hours: event.target.value })}><option value="1">1 hora</option><option value="4">4 horas</option><option value="24">24 horas</option></select></label>
          <label className="is-wide">Motivo<input value={draft.motivo} onChange={(event) => setDraft({ ...draft, motivo: event.target.value })} /></label>
        </div>
        <footer><button type="button" onClick={() => setDraft(null)}>Cancelar</button><button type="button" className="is-primary" onClick={onSave}>Autorizar</button></footer>
      </div>
    </div>
  )
}
