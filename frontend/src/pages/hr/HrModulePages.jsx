import { useMemo, useState } from 'react'
import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  Calculator,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  Mail,
  Pencil,
  Plus,
  Printer,
  RefreshCcw,
  Save,
  Send,
  Settings,
  Trash2,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import { exportToExcel } from '../../utils/exportToExcel.js'
import {
  appendJournalEntry,
  currency,
  makeId,
  nextDocument,
  nowIso,
  readArray,
  readStorage,
  today,
  toNumber,
  writeStorage,
} from '../../utils/accountingEntries.js'
import {
  calculateEmployeePayroll,
  calculatePayroll,
  defaultPayrollSettings,
  mergePayrollSettings,
} from '../../utils/hr/payrollCalculator.js'
import { calculateVacationBalance } from '../../utils/hr/vacationCalculator.js'
import {
  getPayrollEmailQueue,
  queuePaySlipEmail,
  resendPaySlip,
} from '../../services/hrPayrollEmailService.js'
import './HrModulePages.css'

const HR_KEYS = {
  employees: 'invefat_employees',
  departments: 'invefat_hr_departments',
  positions: 'invefat_hr_positions',
  contracts: 'invefat_employee_contracts',
  attendance: 'invefat_attendance',
  absences: 'invefat_employee_absences',
  vacations: 'invefat_vacations',
  overtime: 'invefat_overtime',
  payrolls: 'invefat_payrolls',
  paySlips: 'invefat_pay_slips',
  settings: 'invefat_payroll_settings',
}

const PAYROLL_WARNING = 'Los cálculos de nómina deben ser revisados por el área contable o asesor fiscal antes de pago definitivo.'

function cleanText(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function normalizeStatus(value, fallback = 'Activo') {
  return String(value || fallback).trim()
}

function useStorageArray(key) {
  const [items, setItems] = useState(() => readArray(key))
  const save = (nextItems) => {
    const next = typeof nextItems === 'function' ? nextItems(items) : nextItems
    setItems(writeStorage(key, next))
    return next
  }
  return [items, save]
}

function useStorageObject(key, fallback = {}) {
  const [value, setValue] = useState(() => readStorage(key, fallback))
  const save = (nextValue) => {
    const next = typeof nextValue === 'function' ? nextValue(value) : nextValue
    setValue(writeStorage(key, next))
    return next
  }
  return [value, save]
}

function formatDate(value) {
  return value ? String(value).slice(0, 10) : 'N/D'
}

function daysBetween(from, to) {
  const start = from ? new Date(`${from}T00:00:00`) : null
  const end = to ? new Date(`${to}T00:00:00`) : null
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  return Math.max(Math.round((end - start) / 86400000) + 1, 0)
}

function employeeName(employee) {
  return `${employee?.firstName || employee?.name || ''} ${employee?.lastName || ''}`.trim() || employee?.fullName || 'Empleado'
}

function findEmployee(employees, employeeId) {
  return employees.find((employee) => employee.id === employeeId || employee.code === employeeId) || null
}

function filterRows(rows, search, keys) {
  const query = cleanText(search)
  if (!query) return rows
  return rows.filter((row) => keys.some((key) => cleanText(row[key]).includes(query)))
}

function openPrintWindow(title, html) {
  const popup = window.open('', '_blank', 'width=900,height=720')
  if (!popup) return
  popup.document.write(`<!doctype html><html><head><title>${title}</title><style>
    body{font-family:Arial,sans-serif;color:#102338;margin:24px}
    h1{font-size:22px;margin:0 0 6px}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th,td{border:1px solid #dce5ef;padding:8px;text-align:left;font-size:13px}
    th{background:#f3f7fb}
    .total{font-size:20px;font-weight:800;text-align:right;margin-top:18px}
    .muted{color:#64788c}
  </style></head><body>${html}</body></html>`)
  popup.document.close()
  popup.focus()
  popup.print()
}

function downloadHtml(filename, html) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.html') ? filename : `${filename}.html`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function Modal({ title, children, onClose, footer }) {
  return (
    <div className="hr-modal-backdrop" role="dialog" aria-modal="true">
      <section className="hr-modal">
        <header>
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>
        <div className="hr-modal-body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </section>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', options, textarea, disabled, step, placeholder }) {
  return (
    <label className="hr-field">
      <span>{label}</span>
      {textarea ? (
        <textarea value={value ?? ''} disabled={disabled} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      ) : options ? (
        <select value={value ?? ''} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option key={option.value ?? option} value={option.value ?? option}>{option.label ?? option}</option>
          ))}
        </select>
      ) : (
        <input value={value ?? ''} disabled={disabled} type={type} step={step} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  )
}

function DataTable({ columns, rows, actions, empty = 'No hay registros.' }) {
  return (
    <div className="hr-table-wrap">
      <table className="hr-table">
        <thead>
          <tr>
            {columns.map((column) => <th key={column.key}>{column.label}</th>)}
            {actions && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="hr-empty">{empty}</td></tr>
          ) : rows.map((row) => (
            <tr key={row.id || row.code || row.number}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
              ))}
              {actions && (
                <td>
                  <div className="hr-row-actions">
                    {actions(row).map((action) => {
                      const Icon = action.icon || Eye
                      return (
                        <button key={action.label} type="button" title={action.label} onClick={action.onClick} className={action.variant || ''}>
                          <Icon size={15} />
                          <span>{action.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ value }) {
  const status = String(value || 'Pendiente').toLowerCase()
  return <span className={`hr-badge ${status.includes('activo') || status.includes('aprob') || status.includes('pagad') ? 'ok' : status.includes('anul') || status.includes('rechaz') || status.includes('inactivo') ? 'danger' : 'warn'}`}>{value}</span>
}

function HrShell({ title, description, search, setSearch, actions = [], cards = [], children }) {
  return (
    <ModulePageLayout
      title={title}
      moduleLabel="Recursos Humanos"
      description={description}
      breadcrumb={['Recursos Humanos', title]}
      searchValue={search}
      searchPlaceholder={`Buscar en ${title}`}
      onSearchChange={setSearch}
      actions={actions}
      statusCards={cards}
    >
      <div className="hr-page">
        {children}
      </div>
    </ModulePageLayout>
  )
}

function employeeOptions(employees) {
  return [{ value: '', label: 'Seleccione empleado' }, ...employees.map((employee) => ({
    value: employee.id,
    label: `${employee.code || 'SIN-COD'} - ${employeeName(employee)}`,
  }))]
}

function activeEmployees(employees) {
  return employees.filter((employee) => !['inactivo', 'cancelado'].includes(String(employee.status || '').toLowerCase()))
}

function exportRows(title, rows, columns) {
  exportToExcel({
    filename: `${title}.xlsx`,
    sheetName: title,
    title,
    rows,
    columns,
  })
}

export function HrDashboardPage() {
  const [search, setSearch] = useState('')
  const employees = readArray(HR_KEYS.employees)
  const payrolls = readArray(HR_KEYS.payrolls)
  const vacations = readArray(HR_KEYS.vacations)
  const slips = readArray(HR_KEYS.paySlips)
  const emailQueue = getPayrollEmailQueue()
  const settings = mergePayrollSettings(readStorage(HR_KEYS.settings, {}))
  const balances = employees.map((employee) => calculateVacationBalance(employee, vacations, settings))
  const recentPayrolls = payrolls.slice(0, 5)
  const pendingVacations = vacations.filter((item) => String(item.status || '').toLowerCase().includes('pend'))

  return (
    <HrShell
      title="Panel RRHH"
      description="Resumen operativo de empleados, nomina, vacaciones y volantes."
      search={search}
      setSearch={setSearch}
      cards={[
        { label: 'Empleados activos', value: activeEmployees(employees).length },
        { label: 'Nominas', value: payrolls.length },
        { label: 'Vacaciones pendientes', value: pendingVacations.length },
        { label: 'Volantes', value: slips.length },
      ]}
    >
      <div className="hr-warning">{PAYROLL_WARNING}</div>
      <div className="hr-dashboard-grid">
        <article className="hr-panel">
          <h3><Users size={18} /> Empleados recientes</h3>
          <DataTable
            rows={employees.slice(0, 6)}
            columns={[
              { key: 'code', label: 'Codigo' },
              { key: 'name', label: 'Empleado', render: employeeName },
              { key: 'department', label: 'Departamento' },
              { key: 'status', label: 'Estado', render: (row) => <StatusBadge value={row.status || 'Activo'} /> },
            ]}
          />
        </article>
        <article className="hr-panel">
          <h3><Calculator size={18} /> Nominas recientes</h3>
          <DataTable
            rows={recentPayrolls}
            columns={[
              { key: 'number', label: 'Numero' },
              { key: 'period', label: 'Periodo' },
              { key: 'status', label: 'Estado', render: (row) => <StatusBadge value={row.status} /> },
              { key: 'totalNet', label: 'Neto', render: (row) => currency(row.totals?.totalNet || row.totalNet) },
            ]}
          />
        </article>
        <article className="hr-panel">
          <h3><CalendarDays size={18} /> Vacaciones</h3>
          <DataTable
            rows={balances.slice(0, 6)}
            columns={[
              { key: 'employeeName', label: 'Empleado' },
              { key: 'seniorityYears', label: 'Antig.' },
              { key: 'availableDays', label: 'Disponibles', render: (row) => toNumber(row.availableDays).toFixed(2) },
            ]}
          />
        </article>
        <article className="hr-panel">
          <h3><Mail size={18} /> Correos de volantes</h3>
          <DataTable
            rows={emailQueue.slice(0, 6)}
            columns={[
              { key: 'employeeName', label: 'Empleado' },
              { key: 'payrollNumber', label: 'Nomina' },
              { key: 'status', label: 'Estado', render: (row) => <StatusBadge value={row.status} /> },
            ]}
          />
        </article>
      </div>
    </HrShell>
  )
}

const emptyEmployee = {
  code: '',
  firstName: '',
  lastName: '',
  documentId: '',
  rnc: '',
  birthDate: '',
  sex: '',
  maritalStatus: '',
  phone: '',
  whatsapp: '',
  personalEmail: '',
  workEmail: '',
  address: '',
  department: '',
  position: '',
  hireDate: today(),
  contractType: 'Indefinido',
  monthlySalary: '',
  paymentMethod: 'Transferencia',
  bank: '',
  accountNumber: '',
  status: 'activo',
  photo: '',
  emergencyContact: '',
  observations: '',
}

export function HrEmployeesPage() {
  const [employees, setEmployees] = useStorageArray(HR_KEYS.employees)
  const departments = readArray(HR_KEYS.departments)
  const positions = readArray(HR_KEYS.positions)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const filtered = filterRows(employees, search, ['code', 'firstName', 'lastName', 'documentId', 'department', 'position', 'status'])

  const saveEmployee = () => {
    const form = modal.form
    const normalized = {
      ...form,
      id: form.id || makeId('emp'),
      code: form.code || nextDocument(employees, 'EMP', 'code'),
      monthlySalary: toNumber(form.monthlySalary),
      status: normalizeStatus(form.status, 'activo'),
      updatedAt: nowIso(),
      createdAt: form.createdAt || nowIso(),
    }
    setEmployees((current) => [normalized, ...current.filter((item) => item.id !== normalized.id)])
    setModal(null)
  }

  const updateForm = (key, value) => setModal((current) => ({ ...current, form: { ...current.form, [key]: value } }))

  return (
    <HrShell
      title="Empleados"
      description="Expedientes, datos laborales y conexion con nomina."
      search={search}
      setSearch={setSearch}
      actions={[
        { label: 'Nuevo empleado', icon: Plus, variant: 'primary', onClick: () => setModal({ title: 'Nuevo empleado', form: { ...emptyEmployee } }) },
        { label: 'Exportar', icon: Download, onClick: () => exportRows('Empleados RRHH', filtered, [
          { key: 'code', label: 'Codigo' },
          { key: 'firstName', label: 'Nombre' },
          { key: 'lastName', label: 'Apellido' },
          { key: 'documentId', label: 'Cedula' },
          { key: 'department', label: 'Departamento' },
          { key: 'position', label: 'Puesto' },
          { key: 'monthlySalary', label: 'Salario', render: (row) => currency(row.monthlySalary) },
          { key: 'status', label: 'Estado' },
        ]) },
      ]}
      cards={[
        { label: 'Activos', value: activeEmployees(employees).length },
        { label: 'Total empleados', value: employees.length },
        { label: 'Departamentos', value: departments.length },
        { label: 'Puestos', value: positions.length },
      ]}
    >
      <DataTable
        rows={filtered}
        columns={[
          { key: 'code', label: 'Codigo' },
          { key: 'name', label: 'Empleado', render: employeeName },
          { key: 'documentId', label: 'Cedula' },
          { key: 'department', label: 'Departamento' },
          { key: 'position', label: 'Puesto' },
          { key: 'monthlySalary', label: 'Salario', render: (row) => currency(row.monthlySalary) },
          { key: 'status', label: 'Estado', render: (row) => <StatusBadge value={row.status} /> },
        ]}
        actions={(row) => [
          { label: 'Ver', icon: Eye, onClick: () => setModal({ title: 'Expediente empleado', form: row, readOnly: true }) },
          { label: 'Editar', icon: Pencil, onClick: () => setModal({ title: 'Editar empleado', form: row }) },
          { label: 'Inactivar', icon: XCircle, onClick: () => setEmployees((current) => current.map((item) => item.id === row.id ? { ...item, status: 'inactivo', updatedAt: nowIso() } : item)) },
        ]}
      />

      {modal && (
        <Modal
          title={modal.title}
          onClose={() => setModal(null)}
          footer={!modal.readOnly && (
            <>
              <button type="button" className="hr-btn" onClick={() => setModal(null)}><X size={16} /> Cancelar</button>
              <button type="button" className="hr-btn primary" onClick={saveEmployee}><Save size={16} /> Guardar</button>
            </>
          )}
        >
          <div className="hr-form-grid">
            <Field label="Codigo empleado" value={modal.form.code} disabled={modal.readOnly} placeholder="Automatico" onChange={(value) => updateForm('code', value)} />
            <Field label="Nombre" value={modal.form.firstName} disabled={modal.readOnly} onChange={(value) => updateForm('firstName', value)} />
            <Field label="Apellido" value={modal.form.lastName} disabled={modal.readOnly} onChange={(value) => updateForm('lastName', value)} />
            <Field label="Cedula" value={modal.form.documentId} disabled={modal.readOnly} onChange={(value) => updateForm('documentId', value)} />
            <Field label="RNC si aplica" value={modal.form.rnc} disabled={modal.readOnly} onChange={(value) => updateForm('rnc', value)} />
            <Field label="Fecha nacimiento" type="date" value={modal.form.birthDate} disabled={modal.readOnly} onChange={(value) => updateForm('birthDate', value)} />
            <Field label="Sexo" value={modal.form.sex} disabled={modal.readOnly} options={['', 'Femenino', 'Masculino', 'Otro']} onChange={(value) => updateForm('sex', value)} />
            <Field label="Estado civil" value={modal.form.maritalStatus} disabled={modal.readOnly} options={['', 'Soltero', 'Casado', 'Union libre', 'Otro']} onChange={(value) => updateForm('maritalStatus', value)} />
            <Field label="Telefono" value={modal.form.phone} disabled={modal.readOnly} onChange={(value) => updateForm('phone', value)} />
            <Field label="WhatsApp" value={modal.form.whatsapp} disabled={modal.readOnly} onChange={(value) => updateForm('whatsapp', value)} />
            <Field label="Correo personal" type="email" value={modal.form.personalEmail} disabled={modal.readOnly} onChange={(value) => updateForm('personalEmail', value)} />
            <Field label="Correo laboral" type="email" value={modal.form.workEmail} disabled={modal.readOnly} onChange={(value) => updateForm('workEmail', value)} />
            <Field label="Departamento" value={modal.form.department} disabled={modal.readOnly} options={['', ...departments.map((item) => item.name)]} onChange={(value) => updateForm('department', value)} />
            <Field label="Puesto" value={modal.form.position} disabled={modal.readOnly} options={['', ...positions.map((item) => item.name)]} onChange={(value) => updateForm('position', value)} />
            <Field label="Fecha ingreso" type="date" value={modal.form.hireDate} disabled={modal.readOnly} onChange={(value) => updateForm('hireDate', value)} />
            <Field label="Tipo contrato" value={modal.form.contractType} disabled={modal.readOnly} options={['Indefinido', 'Temporal', 'Por obra', 'Pasantia', 'Otro']} onChange={(value) => updateForm('contractType', value)} />
            <Field label="Salario mensual" type="number" step="0.01" value={modal.form.monthlySalary} disabled={modal.readOnly} onChange={(value) => updateForm('monthlySalary', value)} />
            <Field label="Forma de pago" value={modal.form.paymentMethod} disabled={modal.readOnly} options={['Transferencia', 'Cheque', 'Efectivo', 'Otro']} onChange={(value) => updateForm('paymentMethod', value)} />
            <Field label="Banco" value={modal.form.bank} disabled={modal.readOnly} onChange={(value) => updateForm('bank', value)} />
            <Field label="Numero cuenta" value={modal.form.accountNumber} disabled={modal.readOnly} onChange={(value) => updateForm('accountNumber', value)} />
            <Field label="Estado" value={modal.form.status} disabled={modal.readOnly} options={['activo', 'inactivo', 'suspendido', 'cancelado']} onChange={(value) => updateForm('status', value)} />
            <Field label="Foto URL/base64 opcional" value={modal.form.photo} disabled={modal.readOnly} onChange={(value) => updateForm('photo', value)} />
          </div>
          <div className="hr-form-grid single">
            <Field label="Direccion" textarea value={modal.form.address} disabled={modal.readOnly} onChange={(value) => updateForm('address', value)} />
            <Field label="Contacto de emergencia" textarea value={modal.form.emergencyContact} disabled={modal.readOnly} onChange={(value) => updateForm('emergencyContact', value)} />
            <Field label="Observaciones" textarea value={modal.form.observations} disabled={modal.readOnly} onChange={(value) => updateForm('observations', value)} />
          </div>
        </Modal>
      )}
    </HrShell>
  )
}

function CatalogPage({
  title,
  description,
  storageKey,
  defaultRecord,
  columns,
  fields,
  searchKeys,
  icon: Icon = FileText,
  exportTitle,
}) {
  const [items, setItems] = useStorageArray(storageKey)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const filtered = filterRows(items, search, searchKeys)
  const updateForm = (key, value) => setModal((current) => ({ ...current, form: { ...current.form, [key]: value } }))
  const saveItem = () => {
    const form = modal.form
    const normalized = {
      ...form,
      id: form.id || makeId(title.toLowerCase().replace(/\s+/g, '-')),
      code: form.code || nextDocument(items, title.slice(0, 3).toUpperCase(), 'code'),
      status: normalizeStatus(form.status, 'Activo'),
      updatedAt: nowIso(),
      createdAt: form.createdAt || nowIso(),
    }
    setItems((current) => [normalized, ...current.filter((item) => item.id !== normalized.id)])
    setModal(null)
  }

  return (
    <HrShell
      title={title}
      description={description}
      search={search}
      setSearch={setSearch}
      actions={[
        { label: `Nuevo`, icon: Plus, variant: 'primary', onClick: () => setModal({ title: `Nuevo ${title}`, form: { ...defaultRecord } }) },
        { label: 'Exportar', icon: Download, onClick: () => exportRows(exportTitle || title, filtered, columns) },
      ]}
      cards={[
        { label: 'Total', value: items.length },
        { label: 'Activos', value: items.filter((item) => String(item.status || '').toLowerCase().includes('activo')).length },
      ]}
    >
      <div className="hr-section-title"><Icon size={18} /> {title}</div>
      <DataTable
        rows={filtered}
        columns={columns}
        actions={(row) => [
          { label: 'Editar', icon: Pencil, onClick: () => setModal({ title: `Editar ${title}`, form: row }) },
          { label: 'Inactivar', icon: XCircle, onClick: () => setItems((current) => current.map((item) => item.id === row.id ? { ...item, status: 'Inactivo', updatedAt: nowIso() } : item)) },
        ]}
      />
      {modal && (
        <Modal
          title={modal.title}
          onClose={() => setModal(null)}
          footer={(
            <>
              <button type="button" className="hr-btn" onClick={() => setModal(null)}><X size={16} /> Cancelar</button>
              <button type="button" className="hr-btn primary" onClick={saveItem}><Save size={16} /> Guardar</button>
            </>
          )}
        >
          <div className="hr-form-grid">
            {fields.map((field) => (
              <Field
                key={field.key}
                label={field.label}
                value={modal.form[field.key]}
                type={field.type}
                step={field.step}
                textarea={field.textarea}
                options={field.options}
                onChange={(value) => updateForm(field.key, value)}
              />
            ))}
          </div>
        </Modal>
      )}
    </HrShell>
  )
}

export function HrDepartmentsPage() {
  return (
    <CatalogPage
      title="Departamentos"
      description="Areas internas y responsables de la empresa."
      storageKey={HR_KEYS.departments}
      defaultRecord={{ code: '', name: '', responsible: '', status: 'Activo' }}
      icon={Building2}
      searchKeys={['code', 'name', 'responsible', 'status']}
      columns={[
        { key: 'code', label: 'Codigo' },
        { key: 'name', label: 'Nombre' },
        { key: 'responsible', label: 'Responsable' },
        { key: 'status', label: 'Estado', render: (row) => <StatusBadge value={row.status} /> },
      ]}
      fields={[
        { key: 'code', label: 'Codigo' },
        { key: 'name', label: 'Nombre' },
        { key: 'responsible', label: 'Responsable' },
        { key: 'status', label: 'Estado', options: ['Activo', 'Inactivo'] },
      ]}
    />
  )
}

export function HrPositionsPage() {
  const departments = readArray(HR_KEYS.departments)
  return (
    <CatalogPage
      title="Puestos"
      description="Cargos, descripcion y salario sugerido por puesto."
      storageKey={HR_KEYS.positions}
      defaultRecord={{ code: '', name: '', department: '', description: '', suggestedSalary: '', status: 'Activo' }}
      icon={Briefcase}
      searchKeys={['code', 'name', 'department', 'status']}
      columns={[
        { key: 'code', label: 'Codigo' },
        { key: 'name', label: 'Puesto' },
        { key: 'department', label: 'Departamento' },
        { key: 'suggestedSalary', label: 'Salario sugerido', render: (row) => currency(row.suggestedSalary) },
        { key: 'status', label: 'Estado', render: (row) => <StatusBadge value={row.status} /> },
      ]}
      fields={[
        { key: 'code', label: 'Codigo' },
        { key: 'name', label: 'Nombre' },
        { key: 'department', label: 'Departamento', options: ['', ...departments.map((item) => item.name)] },
        { key: 'suggestedSalary', label: 'Salario sugerido', type: 'number', step: '0.01' },
        { key: 'status', label: 'Estado', options: ['Activo', 'Inactivo'] },
        { key: 'description', label: 'Descripcion', textarea: true },
      ]}
    />
  )
}

export function HrContractsPage() {
  const employees = readArray(HR_KEYS.employees)
  const departments = readArray(HR_KEYS.departments)
  const positions = readArray(HR_KEYS.positions)
  return (
    <CatalogPage
      title="Contratos"
      description="Contratos laborales asociados a empleados."
      storageKey={HR_KEYS.contracts}
      defaultRecord={{ employeeId: '', contractType: 'Indefinido', startDate: today(), endDate: '', monthlySalary: '', workday: '', schedule: '', department: '', position: '', status: 'Activo', observations: '' }}
      icon={FileText}
      searchKeys={['employeeName', 'contractType', 'department', 'position', 'status']}
      columns={[
        { key: 'employeeId', label: 'Empleado', render: (row) => employeeName(findEmployee(employees, row.employeeId)) },
        { key: 'contractType', label: 'Tipo' },
        { key: 'startDate', label: 'Inicio', render: (row) => formatDate(row.startDate) },
        { key: 'endDate', label: 'Fin', render: (row) => formatDate(row.endDate) },
        { key: 'monthlySalary', label: 'Salario', render: (row) => currency(row.monthlySalary) },
        { key: 'status', label: 'Estado', render: (row) => <StatusBadge value={row.status} /> },
      ]}
      fields={[
        { key: 'employeeId', label: 'Empleado', options: employeeOptions(employees) },
        { key: 'contractType', label: 'Tipo contrato', options: ['Indefinido', 'Temporal', 'Por obra', 'Pasantia', 'Otro'] },
        { key: 'startDate', label: 'Fecha inicio', type: 'date' },
        { key: 'endDate', label: 'Fecha fin', type: 'date' },
        { key: 'monthlySalary', label: 'Salario mensual', type: 'number', step: '0.01' },
        { key: 'workday', label: 'Jornada' },
        { key: 'schedule', label: 'Horario' },
        { key: 'department', label: 'Departamento', options: ['', ...departments.map((item) => item.name)] },
        { key: 'position', label: 'Puesto', options: ['', ...positions.map((item) => item.name)] },
        { key: 'status', label: 'Estado', options: ['Activo', 'Finalizado', 'Renovado', 'Anulado'] },
        { key: 'observations', label: 'Observaciones', textarea: true },
      ]}
    />
  )
}

export function HrAttendancePage() {
  const employees = readArray(HR_KEYS.employees)
  return (
    <CatalogPage
      title="Asistencia"
      description="Entradas, salidas, tardanzas y ausencias diarias."
      storageKey={HR_KEYS.attendance}
      defaultRecord={{ employeeId: '', date: today(), checkIn: '', checkOut: '', status: 'presente', workedHours: '', observations: '' }}
      icon={Clock}
      searchKeys={['employeeId', 'date', 'status', 'observations']}
      columns={[
        { key: 'employeeId', label: 'Empleado', render: (row) => employeeName(findEmployee(employees, row.employeeId)) },
        { key: 'date', label: 'Fecha', render: (row) => formatDate(row.date) },
        { key: 'checkIn', label: 'Entrada' },
        { key: 'checkOut', label: 'Salida' },
        { key: 'workedHours', label: 'Horas' },
        { key: 'status', label: 'Estado', render: (row) => <StatusBadge value={row.status} /> },
      ]}
      fields={[
        { key: 'employeeId', label: 'Empleado', options: employeeOptions(employees) },
        { key: 'date', label: 'Fecha', type: 'date' },
        { key: 'checkIn', label: 'Hora entrada', type: 'time' },
        { key: 'checkOut', label: 'Hora salida', type: 'time' },
        { key: 'status', label: 'Estado', options: ['presente', 'ausente', 'tardanza', 'permiso', 'vacaciones', 'dia libre'] },
        { key: 'workedHours', label: 'Horas trabajadas', type: 'number', step: '0.01' },
        { key: 'observations', label: 'Observaciones', textarea: true },
      ]}
    />
  )
}

export function HrAbsencesPage() {
  const employees = readArray(HR_KEYS.employees)
  return (
    <CatalogPage
      title="Permisos y ausencias"
      description="Solicitudes, aprobaciones y descuentos asociados a nomina."
      storageKey={HR_KEYS.absences}
      defaultRecord={{ employeeId: '', type: 'permiso', dateFrom: today(), dateTo: today(), days: 1, paid: 'si', status: 'pendiente', reason: '', document: '' }}
      icon={CalendarDays}
      searchKeys={['employeeId', 'type', 'status', 'reason']}
      columns={[
        { key: 'employeeId', label: 'Empleado', render: (row) => employeeName(findEmployee(employees, row.employeeId)) },
        { key: 'type', label: 'Tipo' },
        { key: 'dateFrom', label: 'Desde', render: (row) => formatDate(row.dateFrom) },
        { key: 'dateTo', label: 'Hasta', render: (row) => formatDate(row.dateTo) },
        { key: 'days', label: 'Dias' },
        { key: 'paid', label: 'Pagado' },
        { key: 'status', label: 'Estado', render: (row) => <StatusBadge value={row.status} /> },
      ]}
      fields={[
        { key: 'employeeId', label: 'Empleado', options: employeeOptions(employees) },
        { key: 'type', label: 'Tipo', options: ['permiso', 'ausencia', 'licencia', 'medico', 'personal', 'otro'] },
        { key: 'dateFrom', label: 'Fecha desde', type: 'date' },
        { key: 'dateTo', label: 'Fecha hasta', type: 'date' },
        { key: 'days', label: 'Dias', type: 'number', step: '0.01' },
        { key: 'paid', label: 'Pagado', options: ['si', 'no'] },
        { key: 'status', label: 'Estado', options: ['pendiente', 'aprobado', 'rechazado', 'registrado'] },
        { key: 'reason', label: 'Motivo', textarea: true },
        { key: 'document', label: 'Documento adjunto opcional' },
      ]}
    />
  )
}

export function HrVacationsPage() {
  const [vacations, setVacations] = useStorageArray(HR_KEYS.vacations)
  const employees = readArray(HR_KEYS.employees)
  const settings = mergePayrollSettings(readStorage(HR_KEYS.settings, {}))
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const balances = employees.map((employee) => calculateVacationBalance(employee, vacations, settings))
  const filtered = filterRows(balances, search, ['employeeCode', 'employeeName'])
  const updateForm = (key, value) => setModal((current) => {
    const form = { ...current.form, [key]: value }
    if (key === 'dateFrom' || key === 'dateTo') form.days = daysBetween(form.dateFrom, form.dateTo)
    return { ...current, form }
  })
  const saveVacation = () => {
    const form = modal.form
    const employee = findEmployee(employees, form.employeeId)
    const record = {
      ...form,
      id: form.id || makeId('vac'),
      employeeCode: employee?.code || '',
      days: toNumber(form.days),
      createdAt: form.createdAt || nowIso(),
      updatedAt: nowIso(),
    }
    setVacations((current) => [record, ...current.filter((item) => item.id !== record.id)])
    setModal(null)
  }

  return (
    <HrShell
      title="Vacaciones"
      description="Balance, solicitudes y registro de vacaciones por empleado."
      search={search}
      setSearch={setSearch}
      actions={[
        { label: 'Solicitar vacaciones', icon: Plus, variant: 'primary', onClick: () => setModal({ form: { employeeId: '', dateFrom: today(), dateTo: today(), days: 1, status: 'pendiente', approvedBy: '', observations: '' } }) },
        { label: 'Exportar', icon: Download, onClick: () => exportRows('Vacaciones RRHH', filtered, [
          { key: 'employeeCode', label: 'Codigo' },
          { key: 'employeeName', label: 'Empleado' },
          { key: 'seniorityYears', label: 'Antiguedad' },
          { key: 'accruedDays', label: 'Acumulados' },
          { key: 'takenDays', label: 'Tomados' },
          { key: 'availableDays', label: 'Disponibles' },
        ]) },
      ]}
      cards={[
        { label: 'Empleados', value: employees.length },
        { label: 'Solicitudes', value: vacations.length },
        { label: 'Pendientes', value: vacations.filter((item) => String(item.status || '').toLowerCase().includes('pend')).length },
      ]}
    >
      <div className="hr-warning">Las reglas de vacaciones se toman desde Configuracion de nomina de la empresa.</div>
      <DataTable
        rows={filtered}
        columns={[
          { key: 'employeeCode', label: 'Codigo' },
          { key: 'employeeName', label: 'Empleado' },
          { key: 'seniorityYears', label: 'Antiguedad' },
          { key: 'accruedDays', label: 'Dias acumulados', render: (row) => toNumber(row.accruedDays).toFixed(2) },
          { key: 'takenDays', label: 'Dias tomados', render: (row) => toNumber(row.takenDays).toFixed(2) },
          { key: 'availableDays', label: 'Disponibles', render: (row) => toNumber(row.availableDays).toFixed(2) },
        ]}
      />
      <div className="hr-panel">
        <h3>Solicitudes registradas</h3>
        <DataTable
          rows={vacations.slice(0, 12)}
          columns={[
            { key: 'employeeId', label: 'Empleado', render: (row) => employeeName(findEmployee(employees, row.employeeId)) },
            { key: 'dateFrom', label: 'Desde', render: (row) => formatDate(row.dateFrom) },
            { key: 'dateTo', label: 'Hasta', render: (row) => formatDate(row.dateTo) },
            { key: 'days', label: 'Dias' },
            { key: 'status', label: 'Estado', render: (row) => <StatusBadge value={row.status} /> },
          ]}
          actions={(row) => [
            { label: 'Aprobar', icon: CheckCircle, onClick: () => setVacations((current) => current.map((item) => item.id === row.id ? { ...item, status: 'aprobada' } : item)) },
            { label: 'Rechazar', icon: XCircle, onClick: () => setVacations((current) => current.map((item) => item.id === row.id ? { ...item, status: 'rechazada' } : item)) },
          ]}
        />
      </div>
      {modal && (
        <Modal
          title="Solicitud de vacaciones"
          onClose={() => setModal(null)}
          footer={(
            <>
              <button type="button" className="hr-btn" onClick={() => setModal(null)}><X size={16} /> Cancelar</button>
              <button type="button" className="hr-btn primary" onClick={saveVacation}><Save size={16} /> Guardar</button>
            </>
          )}
        >
          <div className="hr-form-grid">
            <Field label="Empleado" value={modal.form.employeeId} options={employeeOptions(employees)} onChange={(value) => updateForm('employeeId', value)} />
            <Field label="Fecha desde" type="date" value={modal.form.dateFrom} onChange={(value) => updateForm('dateFrom', value)} />
            <Field label="Fecha hasta" type="date" value={modal.form.dateTo} onChange={(value) => updateForm('dateTo', value)} />
            <Field label="Dias solicitados" type="number" value={modal.form.days} onChange={(value) => updateForm('days', value)} />
            <Field label="Estado" value={modal.form.status} options={['pendiente', 'aprobada', 'rechazada', 'disfrutada']} onChange={(value) => updateForm('status', value)} />
            <Field label="Aprobado por" value={modal.form.approvedBy} onChange={(value) => updateForm('approvedBy', value)} />
            <Field label="Observaciones" textarea value={modal.form.observations} onChange={(value) => updateForm('observations', value)} />
          </div>
        </Modal>
      )}
    </HrShell>
  )
}

export function HrOvertimePage() {
  const employees = readArray(HR_KEYS.employees)
  const settings = mergePayrollSettings(readStorage(HR_KEYS.settings, {}))
  const overtimeTypes = settings.overtime.types?.length ? settings.overtime.types : defaultPayrollSettings.overtime.types
  return (
    <CatalogPage
      title="Horas extras"
      description="Registro, aprobacion e inclusion de horas extras en nomina."
      storageKey={HR_KEYS.overtime}
      defaultRecord={{ employeeId: '', date: today(), type: overtimeTypes[0]?.name || 'Regular', hours: '', factor: overtimeTypes[0]?.factor || 1, amount: '', status: 'pendiente', observations: '' }}
      icon={Clock}
      searchKeys={['employeeId', 'date', 'type', 'status']}
      columns={[
        { key: 'employeeId', label: 'Empleado', render: (row) => employeeName(findEmployee(employees, row.employeeId)) },
        { key: 'date', label: 'Fecha', render: (row) => formatDate(row.date) },
        { key: 'type', label: 'Tipo' },
        { key: 'hours', label: 'Horas' },
        { key: 'factor', label: 'Factor' },
        { key: 'amount', label: 'Monto', render: (row) => currency(row.amount) },
        { key: 'status', label: 'Estado', render: (row) => <StatusBadge value={row.status} /> },
      ]}
      fields={[
        { key: 'employeeId', label: 'Empleado', options: employeeOptions(employees) },
        { key: 'date', label: 'Fecha', type: 'date' },
        { key: 'type', label: 'Tipo hora extra', options: overtimeTypes.map((item) => item.name) },
        { key: 'hours', label: 'Cantidad horas', type: 'number', step: '0.01' },
        { key: 'factor', label: 'Factor / porcentaje', type: 'number', step: '0.01' },
        { key: 'amount', label: 'Monto calculado', type: 'number', step: '0.01' },
        { key: 'status', label: 'Estado', options: ['pendiente', 'aprobado', 'rechazado', 'incluido'] },
        { key: 'observations', label: 'Observaciones', textarea: true },
      ]}
    />
  )
}

function settingsText(value) {
  return JSON.stringify(value || [], null, 2)
}

function parseSettingsText(value, fallback) {
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

export function HrPayrollSettingsPage() {
  const [settings, setSettings] = useStorageObject(HR_KEYS.settings, defaultPayrollSettings)
  const [search, setSearch] = useState('')
  const merged = mergePayrollSettings(settings)
  const [jsonText, setJsonText] = useState({
    isrBrackets: settingsText(merged.isr.brackets),
    vacationRules: settingsText(merged.vacations.rules),
    overtimeTypes: settingsText(merged.overtime.types),
  })
  const updateNested = (section, key, value) => {
    setSettings((current) => ({
      ...mergePayrollSettings(current),
      [section]: {
        ...mergePayrollSettings(current)[section],
        [key]: value,
      },
    }))
  }
  const saveJsonArrays = () => {
    setSettings((current) => {
      const next = mergePayrollSettings(current)
      return {
        ...next,
        isr: { ...next.isr, brackets: parseSettingsText(jsonText.isrBrackets, next.isr.brackets) },
        vacations: { ...next.vacations, rules: parseSettingsText(jsonText.vacationRules, next.vacations.rules) },
        overtime: { ...next.overtime, types: parseSettingsText(jsonText.overtimeTypes, next.overtime.types) },
      }
    })
  }

  return (
    <HrShell
      title="Configuracion de nomina"
      description="Tasas, tramos y reglas editables por empresa. No hay tasas fiscales quemadas en codigo."
      search={search}
      setSearch={setSearch}
      actions={[
        { label: 'Guardar reglas JSON', icon: Save, variant: 'primary', onClick: saveJsonArrays },
        { label: 'Restaurar inicial', icon: RefreshCcw, onClick: () => {
          setSettings(defaultPayrollSettings)
          setJsonText({
            isrBrackets: settingsText(defaultPayrollSettings.isr.brackets),
            vacationRules: settingsText(defaultPayrollSettings.vacations.rules),
            overtimeTypes: settingsText(defaultPayrollSettings.overtime.types),
          })
        } },
      ]}
      cards={[
        { label: 'Frecuencia', value: merged.general.payFrequency },
        { label: 'ISR', value: merged.isr.enabled ? 'Activo' : 'Inactivo' },
        { label: 'Tramos ISR', value: merged.isr.brackets.length },
      ]}
    >
      <div className="hr-warning">{PAYROLL_WARNING}</div>
      <div className="hr-settings-grid">
        <section className="hr-panel">
          <h3><Settings size={18} /> Datos generales</h3>
          <div className="hr-form-grid">
            <Field label="Moneda" value={merged.general.currency} onChange={(value) => updateNested('general', 'currency', value)} />
            <Field label="Frecuencia de pago" value={merged.general.payFrequency} options={['mensual', 'quincenal', 'semanal']} onChange={(value) => updateNested('general', 'payFrequency', value)} />
            <Field label="Divisor quincenal" type="number" value={merged.general.semiMonthlyDivisor} onChange={(value) => updateNested('general', 'semiMonthlyDivisor', toNumber(value))} />
            <Field label="Dias promedio mes" type="number" value={merged.general.averageMonthDays} onChange={(value) => updateNested('general', 'averageMonthDays', toNumber(value))} />
            <Field label="Horas laborales por dia" type="number" value={merged.general.workHoursPerDay} onChange={(value) => updateNested('general', 'workHoursPerDay', toNumber(value))} />
            <Field label="Dias laborales por mes" type="number" value={merged.general.workDaysPerMonth} onChange={(value) => updateNested('general', 'workDaysPerMonth', toNumber(value))} />
          </div>
        </section>
        <section className="hr-panel">
          <h3><Calculator size={18} /> TSS configurable</h3>
          <div className="hr-form-grid">
            <Field label="AFP empleado %" type="number" step="0.01" value={merged.tss.afpEmployee} onChange={(value) => updateNested('tss', 'afpEmployee', toNumber(value))} />
            <Field label="AFP empleador %" type="number" step="0.01" value={merged.tss.afpEmployer} onChange={(value) => updateNested('tss', 'afpEmployer', toNumber(value))} />
            <Field label="SFS empleado %" type="number" step="0.01" value={merged.tss.sfsEmployee} onChange={(value) => updateNested('tss', 'sfsEmployee', toNumber(value))} />
            <Field label="SFS empleador %" type="number" step="0.01" value={merged.tss.sfsEmployer} onChange={(value) => updateNested('tss', 'sfsEmployer', toNumber(value))} />
            <Field label="Riesgo laboral %" type="number" step="0.01" value={merged.tss.laborRisk} onChange={(value) => updateNested('tss', 'laborRisk', toNumber(value))} />
            <Field label="INFOTEP %" type="number" step="0.01" value={merged.tss.infotep} onChange={(value) => updateNested('tss', 'infotep', toNumber(value))} />
            <Field label="Tope empleado" type="number" step="0.01" value={merged.tss.employeeCap} onChange={(value) => updateNested('tss', 'employeeCap', toNumber(value))} />
            <Field label="Tope empleador" type="number" step="0.01" value={merged.tss.employerCap} onChange={(value) => updateNested('tss', 'employerCap', toNumber(value))} />
          </div>
        </section>
        <section className="hr-panel">
          <h3><FileText size={18} /> ISR y reglas</h3>
          <div className="hr-form-grid">
            <Field label="Aplicar ISR" value={merged.isr.enabled ? 'si' : 'no'} options={['si', 'no']} onChange={(value) => updateNested('isr', 'enabled', value === 'si')} />
            <Field label="Exencion mensual" type="number" step="0.01" value={merged.isr.monthlyExemption} onChange={(value) => updateNested('isr', 'monthlyExemption', toNumber(value))} />
            <Field label="Multiplicador ausencias" type="number" step="0.01" value={merged.discounts.absenceDailyMultiplier} onChange={(value) => updateNested('discounts', 'absenceDailyMultiplier', toNumber(value))} />
            <Field label="Vacaciones pagadas" value={merged.vacations.paidVacation ? 'si' : 'no'} options={['si', 'no']} onChange={(value) => updateNested('vacations', 'paidVacation', value === 'si')} />
            <Field label="Acumulacion mensual vacaciones" type="number" step="0.01" value={merged.vacations.monthlyAccumulation} onChange={(value) => updateNested('vacations', 'monthlyAccumulation', toNumber(value))} />
          </div>
        </section>
        <section className="hr-panel">
          <h3>Tramos ISR JSON</h3>
          <textarea className="hr-codebox" value={jsonText.isrBrackets} onChange={(event) => setJsonText((current) => ({ ...current, isrBrackets: event.target.value }))} />
        </section>
        <section className="hr-panel">
          <h3>Reglas vacaciones JSON</h3>
          <textarea className="hr-codebox" value={jsonText.vacationRules} onChange={(event) => setJsonText((current) => ({ ...current, vacationRules: event.target.value }))} />
        </section>
        <section className="hr-panel">
          <h3>Tipos horas extras JSON</h3>
          <textarea className="hr-codebox" value={jsonText.overtimeTypes} onChange={(event) => setJsonText((current) => ({ ...current, overtimeTypes: event.target.value }))} />
        </section>
      </div>
    </HrShell>
  )
}

function createPayrollJournalDraft(payroll) {
  const totalIncome = toNumber(payroll.totals?.totalIncome)
  const totalNet = toNumber(payroll.totals?.totalNet)
  const totalDeductions = toNumber(payroll.totals?.totalDeductions)
  const employer = toNumber(payroll.totals?.employerContributions)
  return appendJournalEntry({
    description: `Nomina ${payroll.number}`,
    sourceModule: 'Recursos Humanos',
    sourceDocument: payroll.number,
    status: 'Borrador',
    lines: [
      { account: 'Gasto de salarios', description: 'Salarios devengados', debit: totalIncome, credit: 0 },
      { account: 'Gasto TSS empleador', description: 'Aportes empleador', debit: employer, credit: 0 },
      { account: 'Nomina por pagar', description: 'Neto a pagar empleados', debit: 0, credit: totalNet },
      { account: 'Retenciones por pagar', description: 'AFP/SFS/ISR y otros descuentos', debit: 0, credit: totalDeductions + employer },
    ],
  })
}

function buildPaySlipHtml(slip) {
  const rows = [
    ['Salario base', currency(slip.baseSalary)],
    ['Horas extras', currency(slip.overtimeTotal)],
    ['Bonificaciones', currency(slip.bonusTotal)],
    ['AFP empleado', currency(slip.afpEmployee)],
    ['SFS empleado', currency(slip.sfsEmployee)],
    ['ISR', currency(slip.isr)],
    ['Otros descuentos / ausencias', currency(toNumber(slip.absenceDiscount) + toNumber(slip.manualDiscounts))],
  ]
  return `
    <h1>INVE-FAT SYSTEM - Volante de pago</h1>
    <p class="muted">Periodo: ${slip.period || ''} | Fecha de pago: ${slip.paymentDate || ''}</p>
    <p><strong>Empleado:</strong> ${slip.employeeName || ''}<br>
    <strong>Cedula:</strong> ${slip.documentId || ''}<br>
    <strong>Departamento:</strong> ${slip.department || ''}<br>
    <strong>Puesto:</strong> ${slip.position || ''}</p>
    <table><tbody>${rows.map(([label, value]) => `<tr><th>${label}</th><td>${value}</td></tr>`).join('')}</tbody></table>
    <div class="total">Neto a pagar: ${currency(slip.netPay)}</div>
    <p class="muted">Generado por INVE-FAT SYSTEM. Este volante debe ser validado por el area responsable.</p>
  `
}

export function HrPayrollPage() {
  const [payrolls, setPayrolls] = useStorageArray(HR_KEYS.payrolls)
  const [paySlips, setPaySlips] = useStorageArray(HR_KEYS.paySlips)
  const employees = readArray(HR_KEYS.employees)
  const overtime = readArray(HR_KEYS.overtime).filter((item) => String(item.status || '').toLowerCase().includes('aprob'))
  const absences = readArray(HR_KEYS.absences).filter((item) => String(item.status || '').toLowerCase().includes('aprob'))
  const settings = mergePayrollSettings(readStorage(HR_KEYS.settings, {}))
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [notice, setNotice] = useState('')
  const filtered = filterRows(payrolls, search, ['number', 'type', 'period', 'status'])

  const calculateAndSave = () => {
    const form = modal.form
    const selectedEmployees = activeEmployees(employees)
    const result = calculatePayroll({ employees: selectedEmployees, payrollType: form.type, settings, overtime, absences })
    const record = {
      id: makeId('payroll'),
      number: nextDocument(payrolls, 'NOM', 'number'),
      type: form.type,
      period: form.period || `${form.startDate} / ${form.endDate}`,
      startDate: form.startDate,
      endDate: form.endDate,
      paymentDate: form.paymentDate,
      status: 'calculada',
      totalIncome: result.totals.totalIncome,
      totalDeductions: result.totals.totalDeductions,
      totalNet: result.totals.totalNet,
      creator: 'Administrador',
      lines: result.lines,
      totals: result.totals,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    setPayrolls((current) => [record, ...current])
    setModal(null)
  }

  const generateSlips = (payroll) => {
    const slips = payroll.lines.map((line) => {
      const employee = findEmployee(employees, line.employeeId)
      return {
        id: makeId('slip'),
        payrollId: payroll.id,
        payrollNumber: payroll.number,
        period: payroll.period,
        paymentDate: payroll.paymentDate,
        employeeId: line.employeeId,
        employeeCode: line.employeeCode,
        employeeName: line.employeeName,
        documentId: employee?.documentId || '',
        department: line.department,
        position: line.position,
        paymentMethod: employee?.paymentMethod || '',
        generatedBy: 'Administrador',
        status: 'generado',
        generatedAt: nowIso(),
        ...line,
      }
    })
    setPaySlips((current) => [...slips, ...current.filter((item) => item.payrollId !== payroll.id)])
    setNotice(`${slips.length} volantes generados.`)
  }

  return (
    <HrShell
      title="Nomina"
      description="Nomina mensual, quincenal y especial con TSS/ISR desde configuracion editable."
      search={search}
      setSearch={setSearch}
      actions={[
        { label: 'Crear nomina', icon: Plus, variant: 'primary', onClick: () => setModal({ form: { type: 'mensual', period: '', startDate: today(), endDate: today(), paymentDate: today() } }) },
        { label: 'Exportar', icon: Download, onClick: () => exportRows('Nominas RRHH', filtered, [
          { key: 'number', label: 'Numero' },
          { key: 'type', label: 'Tipo' },
          { key: 'period', label: 'Periodo' },
          { key: 'status', label: 'Estado' },
          { key: 'totalIncome', label: 'Ingresos', render: (row) => currency(row.totals?.totalIncome || row.totalIncome) },
          { key: 'totalDeductions', label: 'Descuentos', render: (row) => currency(row.totals?.totalDeductions || row.totalDeductions) },
          { key: 'totalNet', label: 'Neto', render: (row) => currency(row.totals?.totalNet || row.totalNet) },
        ]) },
      ]}
      cards={[
        { label: 'Empleados activos', value: activeEmployees(employees).length },
        { label: 'Nominas', value: payrolls.length },
        { label: 'Ultimo neto', value: currency(payrolls[0]?.totals?.totalNet || 0) },
      ]}
    >
      <div className="hr-warning">{PAYROLL_WARNING}</div>
      {notice && <div className="hr-notice">{notice}</div>}
      <DataTable
        rows={filtered}
        columns={[
          { key: 'number', label: 'Numero' },
          { key: 'type', label: 'Tipo' },
          { key: 'period', label: 'Periodo' },
          { key: 'paymentDate', label: 'Pago', render: (row) => formatDate(row.paymentDate) },
          { key: 'status', label: 'Estado', render: (row) => <StatusBadge value={row.status} /> },
          { key: 'totalIncome', label: 'Ingresos', render: (row) => currency(row.totals?.totalIncome || row.totalIncome) },
          { key: 'totalDeductions', label: 'Descuentos', render: (row) => currency(row.totals?.totalDeductions || row.totalDeductions) },
          { key: 'totalNet', label: 'Neto', render: (row) => currency(row.totals?.totalNet || row.totalNet) },
        ]}
        actions={(row) => [
          { label: 'Ver', icon: Eye, onClick: () => setModal({ readOnly: true, payroll: row }) },
          { label: 'Aprobar', icon: CheckCircle, onClick: () => setPayrolls((current) => current.map((item) => item.id === row.id ? { ...item, status: 'aprobada' } : item)) },
          { label: 'Cerrar', icon: Save, onClick: () => setPayrolls((current) => current.map((item) => item.id === row.id ? { ...item, status: 'pagada' } : item)) },
          { label: 'Volantes', icon: FileText, onClick: () => generateSlips(row) },
          { label: 'Asiento', icon: Calculator, onClick: () => { createPayrollJournalDraft(row); setNotice('Asiento contable de nomina creado en borrador.') } },
        ]}
      />

      {modal?.form && (
        <Modal
          title="Crear nomina"
          onClose={() => setModal(null)}
          footer={(
            <>
              <button type="button" className="hr-btn" onClick={() => setModal(null)}><X size={16} /> Cancelar</button>
              <button type="button" className="hr-btn primary" onClick={calculateAndSave}><Calculator size={16} /> Calcular nomina</button>
            </>
          )}
        >
          <div className="hr-form-grid">
            <Field label="Tipo" value={modal.form.type} options={['mensual', 'quincenal', 'especial']} onChange={(value) => setModal((current) => ({ ...current, form: { ...current.form, type: value } }))} />
            <Field label="Periodo" value={modal.form.period} onChange={(value) => setModal((current) => ({ ...current, form: { ...current.form, period: value } }))} />
            <Field label="Fecha inicio" type="date" value={modal.form.startDate} onChange={(value) => setModal((current) => ({ ...current, form: { ...current.form, startDate: value } }))} />
            <Field label="Fecha fin" type="date" value={modal.form.endDate} onChange={(value) => setModal((current) => ({ ...current, form: { ...current.form, endDate: value } }))} />
            <Field label="Fecha pago" type="date" value={modal.form.paymentDate} onChange={(value) => setModal((current) => ({ ...current, form: { ...current.form, paymentDate: value } }))} />
          </div>
          <p className="hr-help">Se calcularan todos los empleados activos. Las tasas y tramos salen de Configuracion de nomina.</p>
        </Modal>
      )}

      {modal?.readOnly && (
        <Modal
          title={`Detalle ${modal.payroll.number}`}
          onClose={() => setModal(null)}
          footer={<button type="button" className="hr-btn" onClick={() => setModal(null)}><X size={16} /> Cerrar</button>}
        >
          <DataTable
            rows={modal.payroll.lines || []}
            columns={[
              { key: 'employeeName', label: 'Empleado' },
              { key: 'baseSalary', label: 'Base', render: (row) => currency(row.baseSalary) },
              { key: 'overtimeTotal', label: 'Extras', render: (row) => currency(row.overtimeTotal) },
              { key: 'afpEmployee', label: 'AFP', render: (row) => currency(row.afpEmployee) },
              { key: 'sfsEmployee', label: 'SFS', render: (row) => currency(row.sfsEmployee) },
              { key: 'isr', label: 'ISR', render: (row) => currency(row.isr) },
              { key: 'netPay', label: 'Neto', render: (row) => currency(row.netPay) },
            ]}
          />
        </Modal>
      )}
    </HrShell>
  )
}

export function HrPaySlipsPage() {
  const [paySlips, setPaySlips] = useStorageArray(HR_KEYS.paySlips)
  const employees = readArray(HR_KEYS.employees)
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')
  const filtered = filterRows(paySlips, search, ['employeeName', 'payrollNumber', 'period', 'status'])

  const sendSlip = (slip) => {
    const employee = findEmployee(employees, slip.employeeId)
    queuePaySlipEmail(employee, slip)
    setPaySlips((current) => current.map((item) => item.id === slip.id ? { ...item, emailStatus: 'pendiente' } : item))
    setNotice('Volante preparado para envio. Configure servicio de correo para envio automatico.')
  }

  return (
    <HrShell
      title="Volantes de pago"
      description="Consulta, impresion y cola de envio de volantes por empleado."
      search={search}
      setSearch={setSearch}
      actions={[
        { label: 'Exportar', icon: Download, onClick: () => exportRows('Volantes de pago', filtered, [
          { key: 'payrollNumber', label: 'Nomina' },
          { key: 'employeeName', label: 'Empleado' },
          { key: 'period', label: 'Periodo' },
          { key: 'netPay', label: 'Neto', render: (row) => currency(row.netPay) },
          { key: 'status', label: 'Estado' },
        ]) },
      ]}
      cards={[
        { label: 'Volantes', value: paySlips.length },
        { label: 'Cola correo', value: getPayrollEmailQueue().length },
      ]}
    >
      {notice && <div className="hr-notice">{notice}</div>}
      <DataTable
        rows={filtered}
        columns={[
          { key: 'payrollNumber', label: 'Nomina' },
          { key: 'employeeName', label: 'Empleado' },
          { key: 'period', label: 'Periodo' },
          { key: 'paymentDate', label: 'Pago', render: (row) => formatDate(row.paymentDate) },
          { key: 'netPay', label: 'Neto', render: (row) => currency(row.netPay) },
          { key: 'emailStatus', label: 'Correo', render: (row) => <StatusBadge value={row.emailStatus || 'sin enviar'} /> },
        ]}
        actions={(row) => [
          { label: 'Imprimir', icon: Printer, onClick: () => openPrintWindow(`Volante ${row.employeeName}`, buildPaySlipHtml(row)) },
          { label: 'Descargar', icon: Download, onClick: () => downloadHtml(`Volante-${row.payrollNumber}-${row.employeeCode}`, buildPaySlipHtml(row)) },
          { label: 'Enviar', icon: Send, onClick: () => sendSlip(row) },
        ]}
      />
    </HrShell>
  )
}

export function HrReportsPage() {
  const [search, setSearch] = useState('')
  const employees = readArray(HR_KEYS.employees)
  const payrolls = readArray(HR_KEYS.payrolls)
  const vacations = readArray(HR_KEYS.vacations)
  const absences = readArray(HR_KEYS.absences)
  const overtime = readArray(HR_KEYS.overtime)
  const paySlips = readArray(HR_KEYS.paySlips)
  const emailQueue = getPayrollEmailQueue()
  const settings = mergePayrollSettings(readStorage(HR_KEYS.settings, {}))
  const balances = employees.map((employee) => calculateVacationBalance(employee, vacations, settings))
  const tssRows = payrolls.flatMap((payroll) => (payroll.lines || []).map((line) => ({
    payroll: payroll.number,
    period: payroll.period,
    employee: line.employeeName,
    afpEmployee: line.afpEmployee,
    sfsEmployee: line.sfsEmployee,
    afpEmployer: line.employerDetails?.afpEmployer,
    sfsEmployer: line.employerDetails?.sfsEmployer,
  })))
  const departmentRows = Object.values(employees.reduce((acc, employee) => {
    const key = employee.department || 'Sin departamento'
    acc[key] ||= { department: key, employees: 0, salary: 0 }
    acc[key].employees += 1
    acc[key].salary += toNumber(employee.monthlySalary)
    return acc
  }, {}))

  return (
    <HrShell
      title="Reportes RRHH"
      description="Reportes de empleados, nomina, TSS, ISR, vacaciones y envios."
      search={search}
      setSearch={setSearch}
      actions={[
        { label: 'Empleados', icon: Download, onClick: () => exportRows('Empleados activos', activeEmployees(employees), [
          { key: 'code', label: 'Codigo' },
          { key: 'firstName', label: 'Nombre' },
          { key: 'lastName', label: 'Apellido' },
          { key: 'department', label: 'Departamento' },
          { key: 'position', label: 'Puesto' },
          { key: 'monthlySalary', label: 'Salario', render: (row) => currency(row.monthlySalary) },
        ]) },
        { label: 'Nomina', icon: Download, onClick: () => exportRows('Nomina por periodo', payrolls, [
          { key: 'number', label: 'Numero' },
          { key: 'period', label: 'Periodo' },
          { key: 'status', label: 'Estado' },
          { key: 'totalNet', label: 'Neto', render: (row) => currency(row.totals?.totalNet || row.totalNet) },
        ]) },
        { label: 'TSS', icon: Download, onClick: () => exportRows('TSS por periodo', tssRows, [
          { key: 'payroll', label: 'Nomina' },
          { key: 'period', label: 'Periodo' },
          { key: 'employee', label: 'Empleado' },
          { key: 'afpEmployee', label: 'AFP empleado', render: (row) => currency(row.afpEmployee) },
          { key: 'sfsEmployee', label: 'SFS empleado', render: (row) => currency(row.sfsEmployee) },
          { key: 'afpEmployer', label: 'AFP empleador', render: (row) => currency(row.afpEmployer) },
          { key: 'sfsEmployer', label: 'SFS empleador', render: (row) => currency(row.sfsEmployer) },
        ]) },
      ]}
      cards={[
        { label: 'Empleados activos', value: activeEmployees(employees).length },
        { label: 'Nominas', value: payrolls.length },
        { label: 'Vacaciones pendientes', value: balances.filter((row) => row.availableDays > 0).length },
        { label: 'Volantes enviados', value: emailQueue.filter((item) => item.status === 'enviado').length },
      ]}
    >
      <div className="hr-dashboard-grid">
        <section className="hr-panel">
          <h3><Users size={18} /> Empleados activos</h3>
          <DataTable rows={filterRows(activeEmployees(employees), search, ['code', 'firstName', 'lastName', 'department', 'position'])} columns={[
            { key: 'code', label: 'Codigo' },
            { key: 'name', label: 'Empleado', render: employeeName },
            { key: 'department', label: 'Departamento' },
            { key: 'position', label: 'Puesto' },
          ]} />
        </section>
        <section className="hr-panel">
          <h3><Calculator size={18} /> Nomina por periodo</h3>
          <DataTable rows={payrolls} columns={[
            { key: 'number', label: 'Numero' },
            { key: 'period', label: 'Periodo' },
            { key: 'status', label: 'Estado', render: (row) => <StatusBadge value={row.status} /> },
            { key: 'totalNet', label: 'Neto', render: (row) => currency(row.totals?.totalNet || row.totalNet) },
          ]} />
        </section>
        <section className="hr-panel">
          <h3><CalendarDays size={18} /> Vacaciones pendientes</h3>
          <DataTable rows={balances} columns={[
            { key: 'employeeName', label: 'Empleado' },
            { key: 'availableDays', label: 'Disponibles', render: (row) => toNumber(row.availableDays).toFixed(2) },
          ]} />
        </section>
        <section className="hr-panel">
          <h3><Clock size={18} /> Ausencias y extras</h3>
          <DataTable rows={[
            { label: 'Ausencias registradas', value: absences.length },
            { label: 'Horas extras', value: overtime.length },
            { label: 'Volantes generados', value: paySlips.length },
          ]} columns={[
            { key: 'label', label: 'Reporte' },
            { key: 'value', label: 'Total' },
          ]} />
        </section>
        <section className="hr-panel wide">
          <h3><BarChart3 size={18} /> Nomina por departamento</h3>
          <DataTable rows={departmentRows} columns={[
            { key: 'department', label: 'Departamento' },
            { key: 'employees', label: 'Empleados' },
            { key: 'salary', label: 'Salario mensual', render: (row) => currency(row.salary) },
          ]} />
        </section>
      </div>
    </HrShell>
  )
}
