import { useState } from 'react'
import './CompanyWelcomeModal.css'

const moduleDescriptions = {
  dashboard: 'Resumen principal del sistema, alertas, accesos rapidos y actividad.',
  system: 'Centro de alertas y notificaciones importantes de la operacion.',
  sales: 'Facturas, cotizaciones, clientes, punto de venta y cuentas por cobrar.',
  inventory: 'Productos, categorias, stock, kardex, ajustes y conteos.',
  purchases: 'Proveedores, ordenes de compra, facturas de proveedor y cuentas por pagar.',
  warehouse: 'Recepcion de mercancia, transferencias, despacho y ubicaciones.',
  finance: 'NCF, DGII 606/607, cuentas, bancos y reportes fiscales.',
  reports: 'Consulta, impresion y exportacion de reportes en Excel.',
  settings: 'Datos de empresa, logo, sucursales, formatos y preferencias.',
  security: 'Usuarios, roles, permisos, auditoria y control de acceso.',
  crm: 'Clientes, prospectos, oportunidades y seguimiento comercial.',
  hr: 'Empleados, asistencia, cargos, nomina y reportes de personal.',
  production: 'Ordenes de produccion, recetas, materiales y control de procesos.',
}

const checklistItems = [
  'Completar datos de empresa',
  'Subir logo',
  'Configurar NCF',
  'Crear almacen principal',
  'Crear usuarios',
  'Crear productos',
  'Crear clientes',
  'Probar una factura',
]

function buildTourSteps(modules = []) {
  const ordered = modules
    .filter((module) => module?.id && moduleDescriptions[module.id])
    .map((module) => ({
      id: module.id,
      title: module.label,
      description: moduleDescriptions[module.id],
    }))

  return ordered.length ? ordered : [{ id: 'dashboard', title: 'Dashboard', description: moduleDescriptions.dashboard }]
}

export default function CompanyWelcomeModal({
  company,
  session,
  modules,
  mustChangePassword,
  onConfigure,
  onFinish,
  onSkip,
}) {
  const steps = buildTourSteps(modules)
  const [currentStep, setCurrentStep] = useState(null)
  const activeModules = modules?.map((module) => module.label).join(', ') || 'Dashboard'

  const finishTour = () => {
    onFinish?.()
  }

  if (currentStep === null) {
    return (
      <div className="company-welcome-backdrop" role="presentation">
        <section className="company-welcome-modal" role="dialog" aria-modal="true" aria-labelledby="company-welcome-title">
          <header>
            <span>Primera entrada</span>
            <h2 id="company-welcome-title">Bienvenido a INVE-FAT SYSTEM</h2>
            <p>
              Su empresa ha sido creada correctamente. Este asistente le ayudara a conocer los modulos
              principales y configurar los datos iniciales.
            </p>
          </header>

          <div className="company-welcome-summary">
            <article><small>Empresa</small><strong>{company?.nombreComercial || session.currentCompanyName}</strong></article>
            <article><small>Plan contratado</small><strong>{company?.plan || 'Demo'}</strong></article>
            <article><small>Usuario administrador</small><strong>{session.fullName || session.username}</strong></article>
            <article><small>Modulos activos</small><strong>{activeModules}</strong></article>
          </div>

          {mustChangePassword && (
            <div className="company-welcome-warning">
              Su usuario tiene una contrasena temporal. Cambiela desde Seguridad &gt; Cambiar contrasena.
            </div>
          )}

          <div className="company-welcome-checklist">
            <h3>Checklist de inicio</h3>
            <ul>
              {checklistItems.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>

          <footer>
            <button type="button" onClick={() => setCurrentStep(0)}>Iniciar recorrido</button>
            <button type="button" onClick={onConfigure}>Configurar empresa ahora</button>
            <button type="button" className="is-muted" onClick={onSkip}>Omitir por ahora</button>
          </footer>
        </section>
      </div>
    )
  }

  const step = steps[currentStep]
  const isLast = currentStep >= steps.length - 1

  return (
    <div className="company-welcome-backdrop" role="presentation">
      <section className="company-welcome-modal is-tour" role="dialog" aria-modal="true" aria-labelledby="company-tour-title">
        <header>
          <span>Recorrido por modulos</span>
          <h2 id="company-tour-title">{step.title}</h2>
          <p>{step.description}</p>
        </header>

        <div className="company-tour-progress">
          <strong>Paso {currentStep + 1} de {steps.length}</strong>
          <div><span style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} /></div>
        </div>

        <footer>
          <button type="button" disabled={currentStep === 0} onClick={() => setCurrentStep((stepIndex) => Math.max(0, stepIndex - 1))}>
            Anterior
          </button>
          <button type="button" className="is-muted" onClick={onSkip}>Saltar recorrido</button>
          {isLast ? (
            <button type="button" onClick={finishTour}>Finalizar</button>
          ) : (
            <button type="button" onClick={() => setCurrentStep((stepIndex) => stepIndex + 1)}>Siguiente</button>
          )}
        </footer>
      </section>
    </div>
  )
}
