import {
  Ban,
  CheckCircle2,
  CreditCard,
  Download,
  Edit3,
  Eye,
  FilePlus2,
  Landmark,
  Maximize2,
  Minimize2,
  Printer,
  Save,
  Search,
  Settings,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import {
  ACCOUNTING_KEYS,
  appendJournalEntry,
  calculateEntryTotals,
  createCustomerPaymentEntry,
  createSupplierPaymentEntry,
  currency,
  defaultAccountingSettings,
  defaultChartOfAccounts,
  getAccountingSettings,
  getChartOfAccounts,
  makeId,
  nextDocument,
  nowIso,
  readArray,
  readStorage,
  saveJournalEntries,
  today,
  toNumber,
  writeStorage,
} from '../../utils/accountingEntries.js'
import { buildDgii606, buildDgii607, currentPeriod, DGII_606_KEY, DGII_607_KEY, saveDgii606, saveDgii607 } from '../../utils/dgiiReports.js'
import { createNcfSequence, defaultNcfSequences, getNcfSequences, NCF_SEQUENCES_KEY, saveNcfSequences } from '../../utils/ncfGenerator.js'
import './AccountingModulePages.css'

function cleanText(value) {
  return String(value ?? '').toLowerCase().trim()
}

function exportJson(filename, payload) {
  if (typeof document === 'undefined') return
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function exportCsv(filename, rows) {
  if (typeof document === 'undefined') return
  const headers = Object.keys(rows[0] || { mensaje: '' })
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((key) => `"${String(row[key] ?? '').replaceAll('"', '""')}"`).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function statusClass(status = '') {
  const clean = cleanText(status)
  if (clean.includes('anulad') || clean.includes('inactivo') || clean.includes('error') || clean.includes('venc')) return 'is-danger'
  if (clean.includes('borrador') || clean.includes('pendiente') || clean.includes('parcial')) return 'is-warning'
  if (clean.includes('contabil') || clean.includes('activo') || clean.includes('pagad') || clean.includes('listo') || clean.includes('concili')) return 'is-success'
  return 'is-info'
}

function Badge({ value }) {
  return <span className={`accounting-badge ${statusClass(value)}`}>{value || 'N/D'}</span>
}

function Modal({ title, subtitle, children, onClose, onSave, saveLabel = 'Guardar', wide = false }) {
  const [state, setState] = useState('normal')

  if (state === 'minimized') {
    return (
      <button type="button" className="accounting-minimized-modal" onClick={() => setState('normal')}>
        <span>{title} minimizado</span>
        <strong>Restaurar</strong>
      </button>
    )
  }

  return (
    <div className="accounting-modal-backdrop">
      <section className={`accounting-modal ${wide ? 'is-wide' : ''} ${state === 'maximized' ? 'is-maximized' : ''}`} role="dialog" aria-modal="true">
        <header>
          <div>
            <span>Finanzas / Contabilidad</span>
            <h2>{title}</h2>
            {subtitle && <small>{subtitle}</small>}
          </div>
          <div className="accounting-modal-controls">
            <button type="button" onClick={onClose} title="Cerrar"><X size={15} /></button>
            <button type="button" onClick={() => setState('minimized')} title="Minimizar"><Minimize2 size={15} /></button>
            <button type="button" onClick={() => setState((current) => current === 'maximized' ? 'normal' : 'maximized')} title="Maximizar"><Maximize2 size={15} /></button>
          </div>
        </header>
        <div className="accounting-modal-body">{children}</div>
        <footer>
          <button type="button" onClick={onClose}>Cancelar</button>
          {onSave && <button type="button" className="accounting-primary-button" onClick={onSave}><Save size={16} /> {saveLabel}</button>}
        </footer>
      </section>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', options = [], readOnly = false, span = false }) {
  return (
    <label className={span ? 'accounting-span-2' : ''}>
      {label}
      {type === 'select' ? (
        <select value={value ?? ''} onChange={(event) => onChange(event.target.value)} disabled={readOnly}>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={value ?? ''} onChange={(event) => onChange(event.target.value)} readOnly={readOnly} />
      ) : (
        <input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} readOnly={readOnly} />
      )}
    </label>
  )
}

function FinanceLayout({ title, description, controls, searchValue, onSearchChange, actions, cards = [], children }) {
  return (
    <ModulePageLayout
      title={title}
      moduleLabel="Finanzas / Contabilidad"
      breadcrumb={['Finanzas / Contabilidad', title]}
      description={description}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder={`Buscar en ${title}`}
      actions={actions}
      statusCards={cards}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      <div className="accounting-page">{children}</div>
    </ModulePageLayout>
  )
}

function TableActions({ onView, onEdit, onVoid, onPrint, disableVoid = false }) {
  return (
    <div className="accounting-table-actions">
      {onView && <button type="button" title="Ver" onClick={(event) => { event.stopPropagation(); onView() }}><Eye size={15} /></button>}
      {onEdit && <button type="button" title="Editar" onClick={(event) => { event.stopPropagation(); onEdit() }}><Edit3 size={15} /></button>}
      {onPrint && <button type="button" title="Imprimir" onClick={(event) => { event.stopPropagation(); onPrint() }}><Printer size={15} /></button>}
      {onVoid && <button type="button" className="is-danger" title="Anular / Inactivar" disabled={disableVoid} onClick={(event) => { event.stopPropagation(); onVoid() }}><Ban size={15} /></button>}
    </div>
  )
}

export function ChartOfAccountsPage({ controls, onAction, searchValue, onSearchChange }) {
  const [accounts, setAccounts] = useState(() => getChartOfAccounts())
  const [selectedCode, setSelectedCode] = useState('')
  const [draft, setDraft] = useState(null)
  const selected = accounts.find((account) => account.code === selectedCode)
  const filtered = accounts.filter((account) => !searchValue || [account.code, account.name, account.type, account.status].some((value) => cleanText(value).includes(cleanText(searchValue))))

  const saveAccounts = (next) => {
    setAccounts(next)
    writeStorage(ACCOUNTING_KEYS.chart, next)
  }

  const saveDraft = () => {
    if (!draft.code || !draft.name) {
      onAction?.('Codigo y nombre de cuenta son obligatorios.')
      return
    }
    const normalized = { ...draft, level: toNumber(draft.level) || 1, allowMovement: draft.allowMovement === true || draft.allowMovement === 'Si' }
    const next = accounts.some((account) => account.code === normalized.code)
      ? accounts.map((account) => account.code === normalized.code ? normalized : account)
      : [...accounts, normalized].sort((a, b) => String(a.code).localeCompare(String(b.code)))
    saveAccounts(next)
    setSelectedCode(normalized.code)
    setDraft(null)
    onAction?.(`Cuenta ${normalized.code} guardada.`)
  }

  return (
    <FinanceLayout
      title="Catalogo de cuentas"
      description="Administra el plan de cuentas contable usado por ventas, compras, inventario y bancos."
      controls={controls}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      actions={[
        { id: 'new', label: 'Crear cuenta', icon: FilePlus2, variant: 'primary', onClick: () => setDraft({ code: '', name: '', type: 'Activo', level: 1, parent: '', allowMovement: 'Si', status: 'Activo' }) },
        { id: 'edit', label: 'Editar', icon: Edit3, disabled: !selected, onClick: () => setDraft({ ...selected, allowMovement: selected.allowMovement ? 'Si' : 'No' }) },
        { id: 'inactive', label: 'Inactivar', icon: Ban, disabled: !selected, onClick: () => saveAccounts(accounts.map((account) => account.code === selected.code ? { ...account, status: 'Inactivo' } : account)) },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('catalogo-cuentas.json', accounts) },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
      ]}
      cards={[
        { label: 'Cuentas', value: accounts.length },
        { label: 'Activas', value: accounts.filter((item) => item.status === 'Activo').length },
        { label: 'Movimiento', value: accounts.filter((item) => item.allowMovement).length },
        { label: 'Base', value: defaultChartOfAccounts.length },
      ]}
    >
      <section className="accounting-panel">
        <div className="accounting-table-wrap">
          <table className="accounting-table">
            <thead><tr><th>Codigo</th><th>Cuenta</th><th>Tipo</th><th>Nivel</th><th>Padre</th><th>Movimiento</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map((account) => (
                <tr key={account.code} className={selectedCode === account.code ? 'is-selected' : ''} onClick={() => setSelectedCode(account.code)}>
                  <td><strong>{account.code}</strong></td><td>{account.name}</td><td>{account.type}</td><td>{account.level}</td><td>{account.parent}</td><td>{account.allowMovement ? 'Si' : 'No'}</td><td><Badge value={account.status} /></td>
                  <td><TableActions onEdit={() => setDraft({ ...account, allowMovement: account.allowMovement ? 'Si' : 'No' })} onVoid={() => saveAccounts(accounts.map((item) => item.code === account.code ? { ...item, status: 'Inactivo' } : item))} /></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="8" className="accounting-empty">No hay cuentas para mostrar.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {draft && (
        <Modal title="Cuenta contable" subtitle={draft.code || 'Nueva cuenta'} onClose={() => setDraft(null)} onSave={saveDraft}>
          <div className="accounting-form-grid">
            <Field label="Codigo de cuenta" value={draft.code} onChange={(value) => setDraft((current) => ({ ...current, code: value }))} />
            <Field label="Nombre de cuenta" value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} />
            <Field label="Tipo" type="select" options={['Activo', 'Pasivo', 'Capital', 'Ingreso', 'Costo', 'Gasto']} value={draft.type} onChange={(value) => setDraft((current) => ({ ...current, type: value }))} />
            <Field label="Nivel" type="number" value={draft.level} onChange={(value) => setDraft((current) => ({ ...current, level: value }))} />
            <Field label="Cuenta padre" value={draft.parent} onChange={(value) => setDraft((current) => ({ ...current, parent: value }))} />
            <Field label="Permite movimiento" type="select" options={['Si', 'No']} value={draft.allowMovement} onChange={(value) => setDraft((current) => ({ ...current, allowMovement: value }))} />
            <Field label="Estado" type="select" options={['Activo', 'Inactivo']} value={draft.status} onChange={(value) => setDraft((current) => ({ ...current, status: value }))} />
          </div>
        </Modal>
      )}
    </FinanceLayout>
  )
}

export function JournalEntriesPage({ controls, onAction, searchValue, onSearchChange }) {
  const [entries, setEntries] = useState(() => readArray(ACCOUNTING_KEYS.entries))
  const accounts = getChartOfAccounts()
  const [selectedNumber, setSelectedNumber] = useState('')
  const [draft, setDraft] = useState(null)
  const selected = entries.find((entry) => entry.number === selectedNumber)
  const filtered = entries.filter((entry) => !searchValue || [entry.number, entry.description, entry.sourceModule, entry.sourceDocument, entry.status].some((value) => cleanText(value).includes(cleanText(searchValue))))

  const saveDraft = () => {
    const totals = calculateEntryTotals(draft.lines)
    if (Math.abs(totals.debit - totals.credit) > 0.005) {
      onAction?.('No se puede guardar un asiento descuadrado.')
      return
    }
    const normalized = { ...draft, totals, updatedAt: nowIso() }
    const next = entries.some((entry) => entry.number === normalized.number)
      ? entries.map((entry) => entry.number === normalized.number ? normalized : entry)
      : [normalized, ...entries]
    setEntries(next)
    saveJournalEntries(next)
    setSelectedNumber(normalized.number)
    setDraft(null)
    onAction?.(`Asiento ${normalized.number} guardado.`)
  }

  const addLine = () => setDraft((current) => ({ ...current, lines: [...current.lines, { id: makeId('line'), account: accounts[0]?.code || '', description: '', debit: 0, credit: 0 }] }))
  const updateLine = (lineId, field, value) => setDraft((current) => ({ ...current, lines: current.lines.map((line) => line.id === lineId ? { ...line, [field]: value } : line) }))
  const removeLine = (lineId) => setDraft((current) => ({ ...current, lines: current.lines.filter((line) => line.id !== lineId) }))

  return (
    <FinanceLayout
      title="Asientos contables"
      description="Crea y controla asientos manuales. El sistema valida que debitos y creditos cuadren."
      controls={controls}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      actions={[
        { id: 'new', label: 'Crear asiento', icon: FilePlus2, variant: 'primary', onClick: () => setDraft({ id: makeId('journal'), number: nextDocument(entries, 'ASI'), date: today(), description: '', sourceModule: 'Finanzas', sourceDocument: '', status: 'Borrador', lines: [{ id: makeId('line'), account: accounts[0]?.code || '', description: '', debit: 0, credit: 0 }] }) },
        { id: 'edit', label: 'Editar borrador', icon: Edit3, disabled: !selected || selected.status !== 'Borrador', onClick: () => setDraft(selected) },
        { id: 'void', label: 'Anular', icon: Ban, disabled: !selected || selected.status === 'Anulado', onClick: () => { const next = entries.map((entry) => entry.number === selected.number ? { ...entry, status: 'Anulado' } : entry); setEntries(next); saveJournalEntries(next) } },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('asientos-contables.json', entries) },
      ]}
      cards={[
        { label: 'Asientos', value: entries.length },
        { label: 'Borradores', value: entries.filter((item) => item.status === 'Borrador').length },
        { label: 'Contabilizados', value: entries.filter((item) => item.status === 'Contabilizado').length },
        { label: 'Anulados', value: entries.filter((item) => item.status === 'Anulado').length },
      ]}
    >
      <section className="accounting-panel">
        <div className="accounting-table-wrap">
          <table className="accounting-table">
            <thead><tr><th>Fecha</th><th>Asiento</th><th>Descripcion</th><th>Origen</th><th>Documento</th><th>Debito</th><th>Credito</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map((entry) => {
                const totals = calculateEntryTotals(entry.lines)
                return (
                  <tr key={entry.number} className={selectedNumber === entry.number ? 'is-selected' : ''} onClick={() => setSelectedNumber(entry.number)}>
                    <td>{entry.date}</td><td><strong>{entry.number}</strong></td><td>{entry.description}</td><td>{entry.sourceModule}</td><td>{entry.sourceDocument}</td><td>{currency(totals.debit)}</td><td>{currency(totals.credit)}</td><td><Badge value={entry.status} /></td>
                    <td><TableActions onEdit={entry.status === 'Borrador' ? () => setDraft(entry) : null} onPrint={() => window.print()} onVoid={() => { const next = entries.map((item) => item.number === entry.number ? { ...item, status: 'Anulado' } : item); setEntries(next); saveJournalEntries(next) }} disableVoid={entry.status === 'Anulado'} /></td>
                  </tr>
                )
              })}
              {filtered.length === 0 && <tr><td colSpan="9" className="accounting-empty">No hay asientos para mostrar.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {draft && (
        <Modal title="Asiento contable" subtitle={draft.number} onClose={() => setDraft(null)} onSave={saveDraft} wide>
          <div className="accounting-form-grid">
            <Field label="Numero" value={draft.number} readOnly onChange={() => {}} />
            <Field label="Fecha" type="date" value={draft.date} onChange={(value) => setDraft((current) => ({ ...current, date: value }))} />
            <Field label="Descripcion" value={draft.description} onChange={(value) => setDraft((current) => ({ ...current, description: value }))} span />
            <Field label="Modulo origen" value={draft.sourceModule} onChange={(value) => setDraft((current) => ({ ...current, sourceModule: value }))} />
            <Field label="Documento origen" value={draft.sourceDocument} onChange={(value) => setDraft((current) => ({ ...current, sourceDocument: value }))} />
            <Field label="Estado" type="select" options={['Borrador', 'Contabilizado', 'Anulado']} value={draft.status} onChange={(value) => setDraft((current) => ({ ...current, status: value }))} />
          </div>
          <div className="accounting-line-toolbar">
            <button type="button" onClick={addLine}><FilePlus2 size={15} /> Agregar linea</button>
          </div>
          <div className="accounting-table-wrap">
            <table className="accounting-table">
              <thead><tr><th>Cuenta</th><th>Descripcion</th><th>Debito</th><th>Credito</th><th></th></tr></thead>
              <tbody>
                {draft.lines.map((line) => (
                  <tr key={line.id}>
                    <td><select value={line.account} onChange={(event) => updateLine(line.id, 'account', event.target.value)}>{accounts.map((account) => <option key={account.code} value={account.code}>{account.code} - {account.name}</option>)}</select></td>
                    <td><input value={line.description} onChange={(event) => updateLine(line.id, 'description', event.target.value)} /></td>
                    <td><input type="number" value={line.debit} onChange={(event) => updateLine(line.id, 'debit', event.target.value)} /></td>
                    <td><input type="number" value={line.credit} onChange={(event) => updateLine(line.id, 'credit', event.target.value)} /></td>
                    <td><button type="button" onClick={() => removeLine(line.id)}>Eliminar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <EntryTotals lines={draft.lines} />
        </Modal>
      )}
    </FinanceLayout>
  )
}

function EntryTotals({ lines }) {
  const totals = calculateEntryTotals(lines)
  const balanced = Math.abs(totals.debit - totals.credit) <= 0.005
  return (
    <div className={`accounting-entry-totals ${balanced ? 'is-balanced' : 'is-unbalanced'}`}>
      <span>Debitos: <strong>{currency(totals.debit)}</strong></span>
      <span>Creditos: <strong>{currency(totals.credit)}</strong></span>
      <span>Diferencia: <strong>{currency(totals.debit - totals.credit)}</strong></span>
    </div>
  )
}

export function GeneralLedgerPage({ controls, searchValue, onSearchChange }) {
  const accounts = getChartOfAccounts()
  const entries = readArray(ACCOUNTING_KEYS.entries)
  const rows = entries.flatMap((entry) => (entry.lines || []).map((line) => ({
    id: `${entry.number}-${line.id || line.account}`,
    date: entry.date,
    number: entry.number,
    account: line.account,
    accountName: accounts.find((account) => account.code === line.account)?.name || '',
    description: line.description || entry.description,
    debit: toNumber(line.debit),
    credit: toNumber(line.credit),
    sourceDocument: entry.sourceDocument,
    sourceModule: entry.sourceModule,
    status: entry.status,
    user: entry.user || 'Administrador',
  })))
  const filtered = rows.filter((row) => !searchValue || [row.number, row.account, row.accountName, row.description, row.sourceDocument, row.sourceModule, row.status].some((value) => cleanText(value).includes(cleanText(searchValue))))

  return (
    <FinanceLayout
      title="Diario general"
      description="Consulta todos los movimientos contables por cuenta, documento y modulo origen."
      controls={controls}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      actions={[
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('diario-general.json', rows) },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
      ]}
      cards={[
        { label: 'Lineas', value: rows.length },
        { label: 'Debitos', value: currency(rows.reduce((sum, row) => sum + row.debit, 0)) },
        { label: 'Creditos', value: currency(rows.reduce((sum, row) => sum + row.credit, 0)) },
        { label: 'Asientos', value: entries.length },
      ]}
    >
      <section className="accounting-panel">
        <div className="accounting-table-wrap">
          <table className="accounting-table">
            <thead><tr><th>Fecha</th><th>Asiento</th><th>Cuenta</th><th>Descripcion</th><th>Debito</th><th>Credito</th><th>Documento origen</th><th>Usuario</th></tr></thead>
            <tbody>
              {filtered.map((row) => <tr key={row.id}><td>{row.date}</td><td>{row.number}</td><td><strong>{row.account}</strong><small>{row.accountName}</small></td><td>{row.description}</td><td>{currency(row.debit)}</td><td>{currency(row.credit)}</td><td>{row.sourceDocument}</td><td>{row.user}</td></tr>)}
              {filtered.length === 0 && <tr><td colSpan="8" className="accounting-empty">No hay movimientos contables.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </FinanceLayout>
  )
}

function getSalesReceivables(payments) {
  return readArray(ACCOUNTING_KEYS.salesInvoices).map((invoice) => {
    const total = toNumber(invoice.totals?.total || invoice.total)
    const paid = Math.max(toNumber(invoice.totals?.paid || invoice.paid), payments.filter((payment) => payment.invoiceNumber === invoice.number).reduce((sum, payment) => sum + toNumber(payment.amount), 0))
    const balance = Math.max(total - paid, 0)
    return {
      ...invoice,
      total,
      paid,
      balance,
      dueDate: invoice.dueDate || invoice.expirationDate || '',
      status: balance <= 0 ? 'Pagada' : (invoice.dueDate && new Date(invoice.dueDate).getTime() < Date.now()) ? 'Vencida' : paid > 0 ? 'Parcial' : 'Pendiente',
    }
  }).filter((invoice) => invoice.balance > 0 || ['Credito', 'Pendiente', 'Parcial', 'Vencida'].includes(invoice.paymentMethod || invoice.state || invoice.status))
}

function getSupplierPayables(payments) {
  const supplierInvoices = readArray(ACCOUNTING_KEYS.supplierInvoices)
  const receiptInvoices = readArray(ACCOUNTING_KEYS.warehouseReceipts)
    .filter((receipt) => receipt.hasSupplierInvoice === 'Si' || receipt.supplierNcf)
    .map((receipt) => ({
      ...receipt,
      number: receipt.supplierInvoiceNumber || receipt.number,
      supplierInvoiceNumber: receipt.supplierInvoiceNumber || receipt.number,
      ncf: receipt.supplierNcf,
      total: toNumber(receipt.supplierInvoiceAmount) || (receipt.lines || []).reduce((sum, line) => sum + toNumber(line.total), 0),
      tax: toNumber(receipt.supplierInvoiceTax),
      dueDate: receipt.supplierInvoiceDueDate,
      status: 'Pendiente de pago',
    }))

  return [...supplierInvoices, ...receiptInvoices].map((invoice) => {
    const number = invoice.supplierInvoiceNumber || invoice.number
    const total = toNumber(invoice.total || invoice.totals?.total || invoice.amount)
    const paid = Math.max(toNumber(invoice.paid), payments.filter((payment) => payment.invoiceNumber === number).reduce((sum, payment) => sum + toNumber(payment.amount), 0))
    const balance = Math.max(total - paid, 0)
    return {
      ...invoice,
      supplierInvoiceNumber: number,
      total,
      paid,
      balance,
      status: balance <= 0 ? 'Pagada' : (invoice.dueDate && new Date(invoice.dueDate).getTime() < Date.now()) ? 'Vencida' : paid > 0 ? 'Parcial' : 'Pendiente',
    }
  }).filter((invoice) => invoice.balance > 0 || invoice.status !== 'Pagada')
}

export function FinanceReceivablesPage({ controls, onAction, searchValue, onSearchChange }) {
  const [payments, setPayments] = useState(() => readArray(ACCOUNTING_KEYS.customerPayments))
  const [draft, setDraft] = useState(null)
  const receivables = getSalesReceivables(payments)
  const filtered = receivables.filter((row) => !searchValue || [row.customer, row.number, row.ncf, row.status].some((value) => cleanText(value).includes(cleanText(searchValue))))

  const savePayment = () => {
    if (!draft?.invoiceNumber || toNumber(draft.amount) <= 0) {
      onAction?.('Debe indicar factura y monto.')
      return
    }
    const saved = { ...draft, id: draft.id || makeId('pay'), createdAt: nowIso() }
    const next = [saved, ...payments]
    setPayments(next)
    writeStorage(ACCOUNTING_KEYS.customerPayments, next)
    createCustomerPaymentEntry(saved)
    setDraft(null)
    onAction?.('Cobro registrado y asiento generado.')
  }

  return (
    <FinanceLayout
      title="Cuentas por cobrar"
      description="Lee facturas de venta pendientes y registra cobros con asiento automatico."
      controls={controls}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      actions={[
        { id: 'pay', label: 'Registrar cobro', icon: CreditCard, variant: 'primary', disabled: filtered.length === 0, onClick: () => setDraft({ date: today(), invoiceNumber: filtered[0]?.number || '', customer: filtered[0]?.customer || '', amount: filtered[0]?.balance || 0, method: 'Efectivo', reference: '', observations: '' }) },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('cuentas-por-cobrar-finanzas.json', receivables) },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
      ]}
      cards={[
        { label: 'Pendientes', value: receivables.filter((row) => row.balance > 0).length },
        { label: 'Vencidas', value: receivables.filter((row) => row.status === 'Vencida').length },
        { label: 'Balance', value: currency(receivables.reduce((sum, row) => sum + row.balance, 0)) },
        { label: 'Cobros', value: payments.length },
      ]}
    >
      <section className="accounting-panel">
        <div className="accounting-table-wrap">
          <table className="accounting-table">
            <thead><tr><th>Cliente</th><th>Factura</th><th>NCF</th><th>Fecha</th><th>Vencimiento</th><th>Total</th><th>Pagado</th><th>Balance</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map((row) => <tr key={row.number}><td>{row.customer}</td><td><strong>{row.number}</strong></td><td>{row.ncf || 'N/D'}</td><td>{row.date}</td><td>{row.dueDate || 'N/D'}</td><td>{currency(row.total)}</td><td>{currency(row.paid)}</td><td>{currency(row.balance)}</td><td><Badge value={row.status} /></td><td><TableActions onEdit={() => setDraft({ date: today(), invoiceNumber: row.number, customer: row.customer, amount: row.balance, method: 'Efectivo', reference: '', observations: '' })} onPrint={() => window.print()} /></td></tr>)}
              {filtered.length === 0 && <tr><td colSpan="10" className="accounting-empty">No hay cuentas por cobrar pendientes.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {draft && <PaymentModal title="Registrar cobro" draft={draft} setDraft={setDraft} onClose={() => setDraft(null)} onSave={savePayment} />}
    </FinanceLayout>
  )
}

export function FinancePayablesPage({ controls, onAction, searchValue, onSearchChange }) {
  const [payments, setPayments] = useState(() => readArray(ACCOUNTING_KEYS.supplierPayments))
  const [draft, setDraft] = useState(null)
  const payables = getSupplierPayables(payments)
  const filtered = payables.filter((row) => !searchValue || [row.supplier, row.supplierInvoiceNumber, row.ncf, row.supplierNcf, row.status].some((value) => cleanText(value).includes(cleanText(searchValue))))

  const savePayment = () => {
    if (!draft?.invoiceNumber || toNumber(draft.amount) <= 0) {
      onAction?.('Debe indicar factura y monto.')
      return
    }
    const saved = { ...draft, id: draft.id || makeId('pay'), createdAt: nowIso() }
    const next = [saved, ...payments]
    setPayments(next)
    writeStorage(ACCOUNTING_KEYS.supplierPayments, next)
    createSupplierPaymentEntry(saved)
    setDraft(null)
    onAction?.('Pago registrado y asiento generado.')
  }

  return (
    <FinanceLayout
      title="Cuentas por pagar"
      description="Lee facturas de proveedor y recepciones con factura para registrar pagos."
      controls={controls}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      actions={[
        { id: 'pay', label: 'Registrar pago', icon: CreditCard, variant: 'primary', disabled: filtered.length === 0, onClick: () => setDraft({ date: today(), invoiceNumber: filtered[0]?.supplierInvoiceNumber || '', supplier: filtered[0]?.supplier || '', amount: filtered[0]?.balance || 0, method: 'Transferencia', bank: '', reference: '', observations: '' }) },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('cuentas-por-pagar-finanzas.json', payables) },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
      ]}
      cards={[
        { label: 'Pendientes', value: payables.filter((row) => row.balance > 0).length },
        { label: 'Vencidas', value: payables.filter((row) => row.status === 'Vencida').length },
        { label: 'Balance', value: currency(payables.reduce((sum, row) => sum + row.balance, 0)) },
        { label: 'Pagos', value: payments.length },
      ]}
    >
      <section className="accounting-panel">
        <div className="accounting-table-wrap">
          <table className="accounting-table">
            <thead><tr><th>Proveedor</th><th>Factura proveedor</th><th>NCF proveedor</th><th>Fecha</th><th>Vencimiento</th><th>Total</th><th>Pagado</th><th>Balance</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map((row) => <tr key={`${row.supplierInvoiceNumber}-${row.ncf || row.supplierNcf}`}><td>{row.supplier}</td><td><strong>{row.supplierInvoiceNumber}</strong></td><td>{row.ncf || row.supplierNcf || 'N/D'}</td><td>{row.date || row.supplierInvoiceDate}</td><td>{row.dueDate || row.supplierInvoiceDueDate || 'N/D'}</td><td>{currency(row.total)}</td><td>{currency(row.paid)}</td><td>{currency(row.balance)}</td><td><Badge value={row.status} /></td><td><TableActions onEdit={() => setDraft({ date: today(), invoiceNumber: row.supplierInvoiceNumber, supplier: row.supplier, amount: row.balance, method: 'Transferencia', bank: '', reference: '', observations: '' })} onPrint={() => window.print()} /></td></tr>)}
              {filtered.length === 0 && <tr><td colSpan="10" className="accounting-empty">No hay cuentas por pagar pendientes.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {draft && <PaymentModal title="Registrar pago" draft={draft} setDraft={setDraft} onClose={() => setDraft(null)} onSave={savePayment} supplier />}
    </FinanceLayout>
  )
}

function PaymentModal({ title, draft, setDraft, onClose, onSave, supplier = false }) {
  return (
    <Modal title={title} subtitle={draft.invoiceNumber} onClose={onClose} onSave={onSave}>
      <div className="accounting-form-grid">
        <Field label="Fecha" type="date" value={draft.date} onChange={(value) => setDraft((current) => ({ ...current, date: value }))} />
        <Field label={supplier ? 'Proveedor' : 'Cliente'} value={supplier ? draft.supplier : draft.customer} readOnly onChange={() => {}} />
        <Field label="Factura" value={draft.invoiceNumber} readOnly onChange={() => {}} />
        <Field label="Monto" type="number" value={draft.amount} onChange={(value) => setDraft((current) => ({ ...current, amount: value }))} />
        <Field label="Forma de pago" type="select" options={['Efectivo', 'Transferencia', 'Tarjeta', 'Cheque', 'Otro']} value={draft.method} onChange={(value) => setDraft((current) => ({ ...current, method: value }))} />
        <Field label="Banco / caja" value={draft.bank} onChange={(value) => setDraft((current) => ({ ...current, bank: value }))} />
        <Field label="Referencia" value={draft.reference} onChange={(value) => setDraft((current) => ({ ...current, reference: value }))} />
        <Field label="Observaciones" type="textarea" value={draft.observations} onChange={(value) => setDraft((current) => ({ ...current, observations: value }))} span />
      </div>
    </Modal>
  )
}

function MoneyAccountsPage({ controls, searchValue, onSearchChange, type }) {
  const isBank = type === 'bank'
  const accountKey = isBank ? ACCOUNTING_KEYS.banks : ACCOUNTING_KEYS.cashBoxes
  const movementKey = isBank ? ACCOUNTING_KEYS.bankMovements : ACCOUNTING_KEYS.cashMovements
  const [accounts, setAccounts] = useState(() => readArray(accountKey))
  const [movements, setMovements] = useState(() => readArray(movementKey))
  const [draft, setDraft] = useState(null)
  const [moveDraft, setMoveDraft] = useState(null)
  const [selectedCode, setSelectedCode] = useState('')
  const filtered = accounts.filter((account) => !searchValue || [account.code, account.bank, account.name, account.accountNumber, account.responsible, account.status].some((value) => cleanText(value).includes(cleanText(searchValue))))

  const saveAccounts = (next) => {
    setAccounts(next)
    writeStorage(accountKey, next)
  }
  const saveMovements = (next) => {
    setMovements(next)
    writeStorage(movementKey, next)
  }

  const saveAccount = () => {
    const normalized = { ...draft, balance: toNumber(draft.balance), status: draft.status || 'Activo' }
    const next = accounts.some((item) => item.code === normalized.code)
      ? accounts.map((item) => item.code === normalized.code ? normalized : item)
      : [normalized, ...accounts]
    saveAccounts(next)
    setSelectedCode(normalized.code)
    setDraft(null)
  }

  const saveMovement = () => {
    const target = accounts.find((item) => item.code === moveDraft.accountCode)
    if (!target) return
    const entry = toNumber(moveDraft.entry)
    const exit = toNumber(moveDraft.exit)
    const nextBalance = toNumber(target.balance) + entry - exit
    const movement = { ...moveDraft, id: makeId('money'), balance: nextBalance, createdAt: nowIso() }
    saveMovements([movement, ...movements])
    saveAccounts(accounts.map((item) => item.code === target.code ? { ...item, balance: nextBalance } : item))
    setMoveDraft(null)
  }

  const title = isBank ? 'Bancos' : 'Caja chica'
  return (
    <FinanceLayout
      title={title}
      description={isBank ? 'Gestiona cuentas bancarias, depositos, retiros y transferencias.' : 'Controla cajas chicas, entradas, salidas y gastos menores.'}
      controls={controls}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      actions={[
        { id: 'new', label: isBank ? 'Crear banco' : 'Crear caja', icon: FilePlus2, variant: 'primary', onClick: () => setDraft(isBank ? { code: nextDocument(accounts, 'BAN', 'code'), bank: '', accountNumber: '', accountType: 'Corriente', currency: 'RD$', balance: 0, status: 'Activo' } : { code: nextDocument(accounts, 'CAJ', 'code'), name: '', responsible: 'Administrador', balance: 0, status: 'Activo' }) },
        { id: 'move', label: isBank ? 'Registrar movimiento' : 'Registrar entrada/salida', icon: CreditCard, disabled: accounts.length === 0, onClick: () => setMoveDraft({ date: today(), accountCode: selectedCode || accounts[0]?.code, type: 'Entrada', reference: '', concept: '', entry: 0, exit: 0, observation: '' }) },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson(`${isBank ? 'bancos' : 'caja-chica'}.json`, { accounts, movements }) },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
      ]}
      cards={[
        { label: isBank ? 'Bancos' : 'Cajas', value: accounts.length },
        { label: 'Activos', value: accounts.filter((item) => item.status === 'Activo').length },
        { label: 'Movimientos', value: movements.length },
        { label: 'Balance', value: currency(accounts.reduce((sum, item) => sum + toNumber(item.balance), 0)) },
      ]}
    >
      <section className="accounting-panel">
        <div className="accounting-table-wrap">
          <table className="accounting-table">
            <thead><tr><th>Codigo</th><th>{isBank ? 'Banco' : 'Caja'}</th><th>{isBank ? 'Cuenta' : 'Responsable'}</th><th>Moneda</th><th>Balance</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map((account) => <tr key={account.code} className={selectedCode === account.code ? 'is-selected' : ''} onClick={() => setSelectedCode(account.code)}><td><strong>{account.code}</strong></td><td>{account.bank || account.name}</td><td>{account.accountNumber || account.responsible}</td><td>{account.currency || 'RD$'}</td><td>{currency(account.balance)}</td><td><Badge value={account.status} /></td><td><TableActions onEdit={() => setDraft(account)} onView={() => setMoveDraft({ date: today(), accountCode: account.code, type: 'Entrada', reference: '', concept: '', entry: 0, exit: 0, observation: '' })} /></td></tr>)}
              {filtered.length === 0 && <tr><td colSpan="7" className="accounting-empty">No hay registros.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section className="accounting-panel">
        <h2>Movimientos recientes</h2>
        <div className="accounting-table-wrap">
          <table className="accounting-table">
            <thead><tr><th>Fecha</th><th>Cuenta</th><th>Tipo</th><th>Referencia</th><th>Entrada</th><th>Salida</th><th>Balance</th><th>Observacion</th></tr></thead>
            <tbody>
              {movements.slice(0, 20).map((movement) => <tr key={movement.id}><td>{movement.date}</td><td>{movement.accountCode}</td><td>{movement.type}</td><td>{movement.reference}</td><td>{currency(movement.entry)}</td><td>{currency(movement.exit)}</td><td>{currency(movement.balance)}</td><td>{movement.observation}</td></tr>)}
              {movements.length === 0 && <tr><td colSpan="8" className="accounting-empty">No hay movimientos.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {draft && (
        <Modal title={isBank ? 'Cuenta bancaria' : 'Caja chica'} subtitle={draft.code} onClose={() => setDraft(null)} onSave={saveAccount}>
          <div className="accounting-form-grid">
            <Field label="Codigo" value={draft.code} onChange={(value) => setDraft((current) => ({ ...current, code: value }))} />
            {isBank ? <Field label="Banco" value={draft.bank} onChange={(value) => setDraft((current) => ({ ...current, bank: value }))} /> : <Field label="Nombre" value={draft.name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} />}
            {isBank ? <Field label="Numero de cuenta" value={draft.accountNumber} onChange={(value) => setDraft((current) => ({ ...current, accountNumber: value }))} /> : <Field label="Responsable" value={draft.responsible} onChange={(value) => setDraft((current) => ({ ...current, responsible: value }))} />}
            {isBank && <Field label="Tipo de cuenta" type="select" options={['Corriente', 'Ahorro', 'Credito', 'Inversion']} value={draft.accountType} onChange={(value) => setDraft((current) => ({ ...current, accountType: value }))} />}
            <Field label="Moneda" value={draft.currency || 'RD$'} onChange={(value) => setDraft((current) => ({ ...current, currency: value }))} />
            <Field label="Balance inicial" type="number" value={draft.balance} onChange={(value) => setDraft((current) => ({ ...current, balance: value }))} />
            <Field label="Estado" type="select" options={['Activo', 'Inactivo', 'Cerrado']} value={draft.status} onChange={(value) => setDraft((current) => ({ ...current, status: value }))} />
          </div>
        </Modal>
      )}
      {moveDraft && (
        <Modal title="Movimiento" subtitle={moveDraft.accountCode} onClose={() => setMoveDraft(null)} onSave={saveMovement}>
          <div className="accounting-form-grid">
            <Field label="Cuenta" type="select" options={accounts.map((item) => item.code)} value={moveDraft.accountCode} onChange={(value) => setMoveDraft((current) => ({ ...current, accountCode: value }))} />
            <Field label="Fecha" type="date" value={moveDraft.date} onChange={(value) => setMoveDraft((current) => ({ ...current, date: value }))} />
            <Field label="Tipo" type="select" options={isBank ? ['Deposito', 'Retiro', 'Transferencia'] : ['Entrada', 'Salida', 'Gasto menor', 'Cierre']} value={moveDraft.type} onChange={(value) => setMoveDraft((current) => ({ ...current, type: value }))} />
            <Field label="Referencia" value={moveDraft.reference} onChange={(value) => setMoveDraft((current) => ({ ...current, reference: value }))} />
            <Field label="Entrada" type="number" value={moveDraft.entry} onChange={(value) => setMoveDraft((current) => ({ ...current, entry: value }))} />
            <Field label="Salida" type="number" value={moveDraft.exit} onChange={(value) => setMoveDraft((current) => ({ ...current, exit: value }))} />
            <Field label="Observacion" type="textarea" span value={moveDraft.observation} onChange={(value) => setMoveDraft((current) => ({ ...current, observation: value }))} />
          </div>
        </Modal>
      )}
    </FinanceLayout>
  )
}

export function BanksPage(props) {
  return <MoneyAccountsPage {...props} type="bank" />
}

export function PettyCashPage(props) {
  return <MoneyAccountsPage {...props} type="cash" />
}

export function BankReconciliationPage({ controls, searchValue, onSearchChange, onAction }) {
  const banks = readArray(ACCOUNTING_KEYS.banks)
  const movements = readArray(ACCOUNTING_KEYS.bankMovements)
  const [records, setRecords] = useState(() => readArray('invefat_bank_reconciliations'))
  const [draft, setDraft] = useState(null)
  const bankOptions = banks.map((bank) => bank.code)
  const selectedMovements = movements.filter((movement) => !draft?.bankCode || movement.accountCode === draft.bankCode)
  const systemBalance = selectedMovements.reduce((sum, movement) => sum + toNumber(movement.entry) - toNumber(movement.exit), 0)

  const saveDraft = () => {
    const saved = { ...draft, systemBalance, difference: toNumber(draft.bankStatementBalance) - systemBalance, status: 'Conciliado', updatedAt: nowIso() }
    const next = [saved, ...records.filter((item) => item.id !== saved.id)]
    setRecords(next)
    writeStorage('invefat_bank_reconciliations', next)
    setDraft(null)
    onAction?.('Conciliacion guardada.')
  }

  return (
    <FinanceLayout
      title="Conciliacion bancaria"
      description="Selecciona banco y periodo para marcar movimientos conciliados y revisar diferencias."
      controls={controls}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      actions={[
        { id: 'new', label: 'Nueva conciliacion', icon: FilePlus2, variant: 'primary', disabled: bankOptions.length === 0, onClick: () => setDraft({ id: makeId('rec'), bankCode: bankOptions[0] || '', period: today().slice(0, 7), bankStatementBalance: 0, notes: '', status: 'Borrador' }) },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('conciliaciones-bancarias.json', records) },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
      ]}
      cards={[
        { label: 'Bancos', value: banks.length },
        { label: 'Movimientos', value: movements.length },
        { label: 'Conciliaciones', value: records.length },
        { label: 'Ultima diferencia', value: currency(records[0]?.difference || 0) },
      ]}
    >
      <section className="accounting-panel">
        <div className="accounting-table-wrap">
          <table className="accounting-table">
            <thead><tr><th>Periodo</th><th>Banco</th><th>Balance sistema</th><th>Balance banco</th><th>Diferencia</th><th>Estado</th></tr></thead>
            <tbody>
              {records.map((record) => <tr key={record.id}><td>{record.period}</td><td>{record.bankCode}</td><td>{currency(record.systemBalance)}</td><td>{currency(record.bankStatementBalance)}</td><td>{currency(record.difference)}</td><td><Badge value={record.status} /></td></tr>)}
              {records.length === 0 && <tr><td colSpan="6" className="accounting-empty">No hay conciliaciones.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {draft && (
        <Modal title="Conciliacion bancaria" subtitle={draft.period} onClose={() => setDraft(null)} onSave={saveDraft} wide>
          <div className="accounting-form-grid">
            <Field label="Banco" type="select" options={bankOptions} value={draft.bankCode} onChange={(value) => setDraft((current) => ({ ...current, bankCode: value }))} />
            <Field label="Periodo" type="month" value={draft.period} onChange={(value) => setDraft((current) => ({ ...current, period: value }))} />
            <Field label="Balance banco" type="number" value={draft.bankStatementBalance} onChange={(value) => setDraft((current) => ({ ...current, bankStatementBalance: value }))} />
            <Field label="Notas" type="textarea" span value={draft.notes} onChange={(value) => setDraft((current) => ({ ...current, notes: value }))} />
          </div>
          <div className="accounting-entry-totals">
            <span>Balance sistema <strong>{currency(systemBalance)}</strong></span>
            <span>Diferencia <strong>{currency(toNumber(draft.bankStatementBalance) - systemBalance)}</strong></span>
          </div>
        </Modal>
      )}
    </FinanceLayout>
  )
}

export function BalanceSheetPage({ controls, searchValue, onSearchChange }) {
  const accounts = getChartOfAccounts()
  const entries = readArray(ACCOUNTING_KEYS.entries).filter((entry) => entry.status !== 'Anulado')
  const rows = accounts.map((account) => {
    const totals = entries.flatMap((entry) => entry.lines || []).filter((line) => line.account === account.code).reduce((sum, line) => sum + toNumber(line.debit) - toNumber(line.credit), 0)
    const signed = ['Pasivo', 'Capital'].includes(account.type) ? -totals : totals
    return { ...account, balance: signed }
  })
  const assets = rows.filter((row) => row.type === 'Activo')
  const liabilities = rows.filter((row) => row.type === 'Pasivo')
  const capital = rows.filter((row) => row.type === 'Capital')
  const filtered = rows.filter((row) => ['Activo', 'Pasivo', 'Capital'].includes(row.type) && (!searchValue || [row.code, row.name, row.type].some((value) => cleanText(value).includes(cleanText(searchValue)))))

  return <FinancialStatementPage title="Balance general" description="Reporte basico de activos, pasivos y capital generado desde asientos contables." controls={controls} searchValue={searchValue} onSearchChange={onSearchChange} rows={filtered} cards={[{ label: 'Activos', value: currency(assets.reduce((sum, row) => sum + row.balance, 0)) }, { label: 'Pasivos', value: currency(liabilities.reduce((sum, row) => sum + row.balance, 0)) }, { label: 'Capital', value: currency(capital.reduce((sum, row) => sum + row.balance, 0)) }, { label: 'Cuentas', value: filtered.length }]} />
}

export function IncomeStatementPage({ controls, searchValue, onSearchChange }) {
  const accounts = getChartOfAccounts()
  const entries = readArray(ACCOUNTING_KEYS.entries).filter((entry) => entry.status !== 'Anulado')
  const rows = accounts.map((account) => {
    const raw = entries.flatMap((entry) => entry.lines || []).filter((line) => line.account === account.code).reduce((sum, line) => sum + toNumber(line.credit) - toNumber(line.debit), 0)
    return { ...account, balance: ['Costo', 'Gasto'].includes(account.type) ? -raw : raw }
  }).filter((row) => ['Ingreso', 'Costo', 'Gasto'].includes(row.type))
  const salesTotal = readArray(ACCOUNTING_KEYS.salesInvoices).reduce((sum, invoice) => sum + toNumber(invoice.totals?.total || invoice.total), 0)
  const supplierTotal = readArray(ACCOUNTING_KEYS.supplierInvoices).reduce((sum, invoice) => sum + toNumber(invoice.total || invoice.totals?.total), 0)
  const income = rows.filter((row) => row.type === 'Ingreso').reduce((sum, row) => sum + row.balance, 0) || salesTotal
  const costs = rows.filter((row) => row.type === 'Costo').reduce((sum, row) => sum + row.balance, 0) || supplierTotal
  const expenses = rows.filter((row) => row.type === 'Gasto').reduce((sum, row) => sum + row.balance, 0)
  const filtered = rows.filter((row) => !searchValue || [row.code, row.name, row.type].some((value) => cleanText(value).includes(cleanText(searchValue))))

  return <FinancialStatementPage title="Estado de resultados" description="Reporte basico de ingresos, costos, gastos y utilidad neta." controls={controls} searchValue={searchValue} onSearchChange={onSearchChange} rows={filtered} cards={[{ label: 'Ingresos', value: currency(income) }, { label: 'Costos', value: currency(costs) }, { label: 'Gastos', value: currency(expenses) }, { label: 'Utilidad neta', value: currency(income - costs - expenses) }]} />
}

function FinancialStatementPage({ title, description, controls, searchValue, onSearchChange, rows, cards }) {
  return (
    <FinanceLayout
      title={title}
      description={description}
      controls={controls}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      actions={[
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson(`${title}.json`, rows) },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
      ]}
      cards={cards}
    >
      <section className="accounting-panel">
        <div className="accounting-table-wrap">
          <table className="accounting-table">
            <thead><tr><th>Cuenta</th><th>Nombre</th><th>Tipo</th><th>Balance</th></tr></thead>
            <tbody>
              {rows.map((row) => <tr key={row.code}><td><strong>{row.code}</strong></td><td>{row.name}</td><td>{row.type}</td><td>{currency(row.balance)}</td></tr>)}
              {rows.length === 0 && <tr><td colSpan="4" className="accounting-empty">No hay datos para el reporte.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </FinanceLayout>
  )
}

function DgiiPage({ controls, searchValue, onSearchChange, type }) {
  const is606 = type === '606'
  const storageKey = is606 ? DGII_606_KEY : DGII_607_KEY
  const [period, setPeriod] = useState(currentPeriod())
  const [records, setRecords] = useState(() => readArray(storageKey))
  const [draft, setDraft] = useState(null)

  const generate = () => {
    const next = is606 ? buildDgii606(period) : buildDgii607(period)
    setRecords(next)
    if (is606) saveDgii606(next)
    else saveDgii607(next)
  }

  const filtered = records.filter((record) => !searchValue || Object.values(record).some((value) => cleanText(value).includes(cleanText(searchValue))))

  const updateRecord = () => {
    const next = records.map((record) => record.id === draft.id ? draft : record)
    setRecords(next)
    writeStorage(storageKey, next)
    setDraft(null)
  }

  return (
    <FinanceLayout
      title={is606 ? 'DGII 606 - Compras' : 'DGII 607 - Ventas'}
      description={is606 ? 'Genera base editable del 606 desde facturas de proveedor y recepciones con NCF.' : 'Genera base editable del 607 desde facturas de venta y notas de credito.'}
      controls={controls}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      actions={[
        { id: 'generate', label: `Generar ${type}`, icon: CheckCircle2, variant: 'primary', onClick: generate },
        { id: 'csv', label: 'Exportar CSV', icon: Download, onClick: () => exportCsv(`dgii-${type}.csv`, filtered) },
        { id: 'json', label: 'Exportar JSON', icon: Download, onClick: () => exportJson(`dgii-${type}.json`, filtered) },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
      ]}
      cards={[
        { label: 'Periodo', value: period },
        { label: 'Registros', value: records.length },
        { label: 'Con errores', value: records.filter((row) => row.estado === 'Con errores').length },
        { label: 'Listos', value: records.filter((row) => row.estado === 'Listo').length },
      ]}
    >
      <section className="accounting-panel accounting-period-panel">
        <label>Periodo mes / ano<input type="month" value={`${period.slice(0, 4)}-${period.slice(4, 6)}`} onChange={(event) => setPeriod(event.target.value.replace('-', ''))} /></label>
      </section>
      <section className="accounting-panel">
        <div className="accounting-table-wrap">
          <table className="accounting-table is-dgii">
            <thead>
              {is606 ? <tr><th>Periodo</th><th>RNC proveedor</th><th>Tipo ID</th><th>Tipo bien</th><th>NCF proveedor</th><th>Fecha</th><th>Monto</th><th>ITBIS</th><th>Forma pago</th><th>Estado</th><th>Errores</th><th>Acciones</th></tr> : <tr><th>Periodo</th><th>RNC cliente</th><th>Tipo ID</th><th>NCF emitido</th><th>Tipo ingreso</th><th>Fecha</th><th>Monto</th><th>ITBIS</th><th>Forma pago</th><th>Estado</th><th>Errores</th><th>Acciones</th></tr>}
            </thead>
            <tbody>
              {filtered.map((record) => <tr key={record.id}><td>{record.periodo}</td><td>{is606 ? record.rncProveedor : record.rncCliente}</td><td>{record.tipoIdentificacion}</td><td>{is606 ? record.tipoBienServicio : record.ncfEmitido}</td><td>{is606 ? record.ncfProveedor : record.tipoIngreso}</td><td>{record.fechaComprobante}</td><td>{currency(record.montoFacturado)}</td><td>{currency(record.itbisFacturado)}</td><td>{record.formaPago}</td><td><Badge value={record.estado} /></td><td>{(record.errores || []).join(', ')}</td><td><TableActions onEdit={() => setDraft(record)} /></td></tr>)}
              {filtered.length === 0 && <tr><td colSpan="12" className="accounting-empty">No hay registros. Presione generar para construir el archivo base.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {draft && (
        <Modal title={`Editar DGII ${type}`} subtitle={draft.id} onClose={() => setDraft(null)} onSave={updateRecord} wide>
          <div className="accounting-form-grid">
            {Object.keys(draft).filter((key) => !['id', 'errores'].includes(key)).map((key) => (
              <Field key={key} label={key} value={Array.isArray(draft[key]) ? draft[key].join(', ') : draft[key]} onChange={(value) => setDraft((current) => ({ ...current, [key]: value }))} />
            ))}
          </div>
        </Modal>
      )}
    </FinanceLayout>
  )
}

export function Dgii606Page(props) {
  return <DgiiPage {...props} type="606" />
}

export function Dgii607Page(props) {
  return <DgiiPage {...props} type="607" />
}

export function NcfSequencesPage({ controls, onAction, searchValue, onSearchChange }) {
  const [records, setRecords] = useState(() => getNcfSequences())
  const [selectedId, setSelectedId] = useState('')
  const [draft, setDraft] = useState(null)
  const selected = records.find((record) => record.id === selectedId)
  const filtered = records.filter((record) => !searchValue || [record.type, record.prefix, record.status].some((value) => cleanText(value).includes(cleanText(searchValue))))

  const saveDraft = () => {
    if (!draft.type || !draft.prefix) {
      onAction?.('Tipo y serie son obligatorios.')
      return
    }
    const normalized = createNcfSequence(records, draft)
    const next = records.some((record) => record.id === normalized.id)
      ? records.map((record) => record.id === normalized.id ? normalized : record)
      : [normalized, ...records]
    const withDefault = normalized.default ? next.map((record) => ({ ...record, default: record.id === normalized.id })) : next
    setRecords(withDefault)
    saveNcfSequences(withDefault)
    setSelectedId(normalized.id)
    setDraft(null)
  }

  return (
    <FinanceLayout
      title="Comprobantes fiscales / NCF"
      description="Configura secuencias de NCF para facturas, notas y comprobantes dominicanos."
      controls={controls}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      actions={[
        { id: 'new', label: 'Crear secuencia', icon: FilePlus2, variant: 'primary', onClick: () => setDraft(createNcfSequence(records, { validUntil: today() })) },
        { id: 'edit', label: 'Editar', icon: Edit3, disabled: !selected, onClick: () => setDraft(selected) },
        { id: 'inactive', label: 'Inactivar', icon: Ban, disabled: !selected, onClick: () => { const next = records.map((record) => record.id === selected.id ? { ...record, status: 'Inactivo' } : record); setRecords(next); saveNcfSequences(next) } },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => exportJson('ncf-secuencias.json', records) },
      ]}
      cards={[
        { label: 'Secuencias', value: records.length },
        { label: 'Activas', value: records.filter((item) => item.status === 'Activo').length },
        { label: 'Por defecto', value: records.find((item) => item.default)?.prefix || 'N/D' },
        { label: 'Tipos base', value: defaultNcfSequences.length },
      ]}
    >
      <section className="accounting-panel">
        <div className="accounting-table-wrap">
          <table className="accounting-table">
            <thead><tr><th>Tipo</th><th>Serie</th><th>Desde</th><th>Hasta</th><th>Proximo</th><th>Valido hasta</th><th>Defecto</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map((record) => <tr key={record.id} className={selectedId === record.id ? 'is-selected' : ''} onClick={() => setSelectedId(record.id)}><td>{record.type}</td><td><strong>{record.prefix}</strong></td><td>{record.from}</td><td>{record.to}</td><td>{record.nextNumber}</td><td>{record.validUntil}</td><td>{record.default ? 'Si' : 'No'}</td><td><Badge value={record.status} /></td><td><TableActions onEdit={() => setDraft(record)} onVoid={() => { const next = records.map((item) => item.id === record.id ? { ...item, status: 'Inactivo' } : item); setRecords(next); saveNcfSequences(next) }} /></td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
      {draft && (
        <Modal title="Secuencia NCF" subtitle={draft.prefix} onClose={() => setDraft(null)} onSave={saveDraft}>
          <div className="accounting-form-grid">
            <Field label="Tipo de comprobante" type="select" options={['B01 Credito fiscal', 'B02 Consumidor final', 'B14 Regimen especial', 'B15 Gubernamental', 'B04 Nota de credito', 'B03 Nota de debito']} value={draft.type} onChange={(value) => setDraft((current) => ({ ...current, type: value, prefix: value.split(' ')[0] }))} />
            <Field label="Serie" value={draft.prefix} onChange={(value) => setDraft((current) => ({ ...current, prefix: value }))} />
            <Field label="Desde" type="number" value={draft.from} onChange={(value) => setDraft((current) => ({ ...current, from: value }))} />
            <Field label="Hasta" type="number" value={draft.to} onChange={(value) => setDraft((current) => ({ ...current, to: value }))} />
            <Field label="Proximo numero" type="number" value={draft.nextNumber} onChange={(value) => setDraft((current) => ({ ...current, nextNumber: value }))} />
            <Field label="Valido hasta" type="date" value={draft.validUntil} onChange={(value) => setDraft((current) => ({ ...current, validUntil: value }))} />
            <Field label="Por defecto" type="select" options={['No', 'Si']} value={draft.default ? 'Si' : 'No'} onChange={(value) => setDraft((current) => ({ ...current, default: value === 'Si' }))} />
            <Field label="Estado" type="select" options={['Activo', 'Inactivo']} value={draft.status} onChange={(value) => setDraft((current) => ({ ...current, status: value }))} />
          </div>
        </Modal>
      )}
    </FinanceLayout>
  )
}

export function AccountingSettingsPage({ controls, searchValue, onSearchChange, onAction }) {
  const [settings, setSettings] = useState(() => getAccountingSettings())
  const accounts = getChartOfAccounts()
  const accountOptions = accounts.map((account) => account.code)
  const saveSettings = () => {
    writeStorage(ACCOUNTING_KEYS.settings, settings)
    onAction?.('Configuracion contable guardada.')
  }
  const update = (section, field, value) => setSettings((current) => ({ ...current, [section]: { ...current[section], [field]: value } }))

  return (
    <FinanceLayout
      title="Configuracion contable"
      description="Mapea cuentas contables por modulo para generar asientos automaticos."
      controls={controls}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      actions={[
        { id: 'save', label: 'Guardar configuracion', icon: Save, variant: 'primary', onClick: saveSettings },
        { id: 'restore', label: 'Restaurar base', icon: Settings, onClick: () => setSettings(defaultAccountingSettings) },
      ]}
      cards={[
        { label: 'Cuentas', value: accounts.length },
        { label: 'Ventas', value: Object.keys(settings.sales || {}).length },
        { label: 'Compras', value: Object.keys(settings.purchases || {}).length },
        { label: 'Inventario', value: Object.keys(settings.inventory || {}).length },
      ]}
    >
      <section className="accounting-settings-grid">
        {[
          ['sales', 'Ventas', [['salesAccount', 'Cuenta ventas'], ['taxPayableAccount', 'Cuenta ITBIS por pagar'], ['receivableAccount', 'Cuenta cuentas por cobrar'], ['cashBankAccount', 'Cuenta caja/banco'], ['salesDiscountAccount', 'Cuenta descuento ventas']]],
          ['purchases', 'Compras', [['purchaseInventoryAccount', 'Cuenta compras/inventario'], ['taxCreditAccount', 'Cuenta ITBIS adelantado'], ['payableAccount', 'Cuenta cuentas por pagar'], ['withholdingAccount', 'Cuenta retenciones']]],
          ['inventory', 'Inventario', [['inventoryAccount', 'Cuenta inventario'], ['costOfGoodsAccount', 'Cuenta costo de venta'], ['adjustmentsAccount', 'Cuenta ajustes inventario']]],
        ].map(([section, title, fields]) => (
          <article className="accounting-panel" key={section}>
            <h2>{title}</h2>
            <div className="accounting-form-grid is-single">
              {fields.map(([field, label]) => (
                <Field key={field} label={label} type="select" options={accountOptions} value={settings[section]?.[field] || accountOptions[0] || ''} onChange={(value) => update(section, field, value)} />
              ))}
            </div>
          </article>
        ))}
      </section>
    </FinanceLayout>
  )
}
