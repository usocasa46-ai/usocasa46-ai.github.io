import {
  Ban,
  Edit3,
  Eye,
  FilePlus2,
  FileText,
  Printer,
  Save,
  Search,
  Upload,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import { customersService } from '../../services/customersService.js'
import './SalesCustomersPage.css'

const CUSTOMERS_KEY = 'invefat_customers'
const INVOICES_KEY = 'invefat_sales_invoices'

const defaultCustomer = {
  code: '',
  type: 'Empresa',
  tradeName: '',
  legalName: '',
  fiscalId: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  city: '',
  province: '',
  country: 'Republica Dominicana',
  status: 'Activo',
  paymentCondition: 'Contado',
  creditDays: 0,
  creditLimit: 0,
  seller: 'Administrador',
  priceList: 'General',
  preferredReceiptType: 'Consumidor final',
  authorizedDiscount: 0,
  internalNote: '',
  showFiscalIdOnInvoice: true,
  requiresFiscalReceipt: false,
  invoiceEmail: '',
  mainContact: '',
  balance: 0,
}

function safeParse(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function toNumber(value) {
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function currency(value) {
  return `RD$ ${toNumber(value).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function normalizeCustomer(customer) {
  return {
    ...defaultCustomer,
    ...customer,
    code: customer.code || customer.codigo || customer.customerCode || '',
    tradeName: customer.tradeName || customer.name || customer.nombre || customer.customer || '',
    legalName: customer.legalName || customer.razonSocial || customer.tradeName || customer.name || '',
    fiscalId: customer.fiscalId || customer.document || customer.rnc || customer.identification || '',
    phone: customer.phone || customer.telefono || '',
    address: customer.address || customer.direccion || '',
    paymentCondition: customer.paymentCondition || customer.condicionPago || 'Contado',
    creditDays: toNumber(customer.creditDays || customer.diasCredito),
    creditLimit: toNumber(customer.creditLimit || customer.limiteCredito),
    authorizedDiscount: toNumber(customer.authorizedDiscount || customer.descuentoAutorizado),
    balance: toNumber(customer.balance),
    status: customer.status || customer.estado || 'Activo',
  }
}

function loadCustomers() {
  const customers = safeParse(CUSTOMERS_KEY, [])
  return Array.isArray(customers) ? customers.map(normalizeCustomer) : []
}

function saveCustomers(customers) {
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers))
  void customersService.replaceAll(customers)
}

function loadInvoices() {
  const invoices = safeParse(INVOICES_KEY, [])
  return Array.isArray(invoices) ? invoices : []
}

function nextCustomerCode(customers) {
  const maxNumber = customers.reduce((max, customer) => {
    const parsed = Number.parseInt(String(customer.code || '').replace(/[^\d]/g, ''), 10)
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max
  }, 0)

  return `CLI-${String(maxNumber + 1).padStart(4, '0')}`
}

export default function SalesCustomersPage({ controls, onAction, searchValue = '', onSearchChange }) {
  const [customers, setCustomers] = useState(() => loadCustomers())
  const [invoices] = useState(() => loadInvoices())
  const [form, setForm] = useState(() => ({ ...defaultCustomer, code: nextCustomerCode(loadCustomers()) }))
  const [selectedCode, setSelectedCode] = useState('')
  const [filters, setFilters] = useState({
    code: '',
    name: '',
    fiscalId: '',
    phone: '',
    email: '',
    status: 'Todos',
  })
  const [activeModal, setActiveModal] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isActive = true

    customersService.getAll().then((storedCustomers) => {
      if (!isActive || !Array.isArray(storedCustomers) || storedCustomers.length === 0) return
      const normalizedCustomers = storedCustomers.map(normalizeCustomer)
      setCustomers(normalizedCustomers)
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(normalizedCustomers))
    })

    return () => {
      isActive = false
    }
  }, [])

  const selectedCustomer = useMemo(() => (
    customers.find((customer) => customer.code === selectedCode)
  ), [customers, selectedCode])

  const customerInvoices = useMemo(() => {
    if (!selectedCustomer) return []
    return invoices.filter((invoice) => (
      invoice.customerCode === selectedCustomer.code ||
      invoice.fiscalId === selectedCustomer.fiscalId ||
      invoice.customer === selectedCustomer.tradeName
    ))
  }, [invoices, selectedCustomer])

  const filteredCustomers = useMemo(() => {
    const global = searchValue.trim().toLowerCase()

    return customers.filter((customer) => {
      const matchesGlobal = !global || [
        customer.code,
        customer.tradeName,
        customer.legalName,
        customer.fiscalId,
        customer.phone,
        customer.email,
      ].some((field) => String(field || '').toLowerCase().includes(global))

      const matchesCode = !filters.code || customer.code.toLowerCase().includes(filters.code.toLowerCase())
      const matchesName = !filters.name || `${customer.tradeName} ${customer.legalName}`.toLowerCase().includes(filters.name.toLowerCase())
      const matchesFiscal = !filters.fiscalId || customer.fiscalId.toLowerCase().includes(filters.fiscalId.toLowerCase())
      const matchesPhone = !filters.phone || customer.phone.toLowerCase().includes(filters.phone.toLowerCase())
      const matchesEmail = !filters.email || customer.email.toLowerCase().includes(filters.email.toLowerCase())
      const matchesStatus = filters.status === 'Todos' || customer.status === filters.status

      return matchesGlobal && matchesCode && matchesName && matchesFiscal && matchesPhone && matchesEmail && matchesStatus
    })
  }, [customers, filters, searchValue])

  const accountRows = useMemo(() => {
    return customerInvoices
      .filter((invoice) => invoice.state === 'Pendiente' || toNumber(invoice.totals?.balance) > 0)
      .map((invoice) => ({
        number: invoice.number,
        date: invoice.date,
        dueDate: invoice.dueDate || invoice.date,
        total: toNumber(invoice.totals?.total),
        paid: toNumber(invoice.totals?.paid),
        balance: toNumber(invoice.totals?.balance || invoice.totals?.total),
      }))
  }, [customerInvoices])

  const accountBalance = useMemo(() => (
    accountRows.reduce((sum, row) => sum + toNumber(row.balance), 0)
  ), [accountRows])

  const notify = (text) => {
    setMessage(text)
    onAction?.(text)
  }

  const closePageOrModal = () => {
    if (activeModal) {
      setActiveModal('')
      return
    }

    controls?.onClose?.()
  }

  const pageControls = {
    ...controls,
    onClose: closePageOrModal,
  }

  const updateFilter = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const startNewCustomer = () => {
    setForm({ ...defaultCustomer, code: nextCustomerCode(customers) })
    setSelectedCode('')
    setActiveModal('form')
  }

  const editSelectedCustomer = () => {
    if (!selectedCustomer) {
      notify('Seleccione un cliente para editar.')
      return
    }

    setForm({ ...defaultCustomer, ...selectedCustomer })
    setActiveModal('form')
  }

  const validateCustomer = () => {
    if (!form.code.trim()) return 'El codigo de cliente es obligatorio.'
    if (!form.tradeName.trim()) return 'El nombre comercial es obligatorio.'
    if (!form.fiscalId.trim()) return 'La identificacion fiscal es obligatoria.'

    const duplicatedCode = customers.some((customer) => customer.code === form.code && customer.code !== selectedCode)
    if (duplicatedCode) return 'Ya existe un cliente con ese codigo.'

    const duplicatedFiscalId = customers.some((customer) => (
      customer.fiscalId &&
      customer.fiscalId === form.fiscalId &&
      customer.code !== selectedCode
    ))
    if (duplicatedFiscalId) return 'Ya existe un cliente con ese RNC o identificacion.'

    return ''
  }

  const saveCustomer = () => {
    const error = validateCustomer()
    if (error) {
      notify(error)
      return
    }

    const now = new Date().toISOString()
    const savedCustomer = {
      ...form,
      name: form.tradeName,
      fiscalId: form.fiscalId,
      creditDays: toNumber(form.creditDays),
      creditLimit: toNumber(form.creditLimit),
      authorizedDiscount: toNumber(form.authorizedDiscount),
      balance: toNumber(form.balance),
      updatedAt: now,
      createdAt: form.createdAt || now,
    }

    const exists = customers.some((customer) => customer.code === selectedCode)
    const nextCustomers = exists
      ? customers.map((customer) => (customer.code === selectedCode ? savedCustomer : customer))
      : [savedCustomer, ...customers]

    setCustomers(nextCustomers)
    saveCustomers(nextCustomers)
    setSelectedCode(savedCustomer.code)
    setActiveModal('')
    notify(`Cliente ${savedCustomer.code} guardado correctamente.`)
  }

  const inactiveSelectedCustomer = () => {
    if (!selectedCustomer) {
      notify('Seleccione un cliente para inactivar.')
      return
    }

    const nextCustomers = customers.map((customer) => (
      customer.code === selectedCustomer.code
        ? { ...customer, status: 'Inactivo', updatedAt: new Date().toISOString() }
        : customer
    ))

    setCustomers(nextCustomers)
    saveCustomers(nextCustomers)
    notify(`Cliente ${selectedCustomer.code} inactivado.`)
  }

  const exportCustomers = () => {
    const header = 'codigo,nombre,rnc,telefono,correo,estado,balance'
    const rows = filteredCustomers.map((customer) => [
      customer.code,
      customer.tradeName,
      customer.fiscalId,
      customer.phone,
      customer.email,
      customer.status,
      customer.balance,
    ].map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'clientes-invefat.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const actions = [
    { id: 'new', label: 'Nuevo cliente', icon: FilePlus2, variant: 'primary', onClick: startNewCustomer },
    { id: 'edit', label: 'Editar', icon: Edit3, disabled: !selectedCustomer, onClick: editSelectedCustomer },
    { id: 'inactive', label: 'Inactivar', icon: Ban, variant: 'danger', disabled: !selectedCustomer || selectedCustomer.status === 'Inactivo', onClick: inactiveSelectedCustomer },
    { id: 'history', label: 'Ver historial', icon: Eye, disabled: !selectedCustomer, onClick: () => setActiveModal('history') },
    { id: 'account', label: 'Estado de cuenta', icon: FileText, disabled: !selectedCustomer, onClick: () => setActiveModal('account') },
    { id: 'export', label: 'Exportar', icon: Upload, onClick: exportCustomers },
    { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
    { id: 'close', label: 'Salir', icon: X, onClick: () => controls?.onClose?.() },
  ]

  return (
    <ModulePageLayout
      title="Clientes"
      moduleLabel="Ventas"
      breadcrumb={['Ventas', 'Clientes']}
      description="Consulta, registra y administra los clientes usados en facturacion."
      searchValue={searchValue}
      searchPlaceholder="Buscar cliente activo"
      onSearchChange={onSearchChange}
      actions={actions}
      controls={pageControls}
      windowState={pageControls.windowState}
      onClose={pageControls.onClose}
      onMinimize={pageControls.onMinimize}
      onRestore={pageControls.onRestore}
      onMaximize={pageControls.onMaximize}
    >
      <section className="sales-customers-page">
        {message && <div className="customers-message">{message}</div>}

        <section className="erp-panel customers-filter-panel">
          <div className="customers-compact-search">
            <Search size={16} />
            <input value={filters.code} onChange={(event) => updateFilter('code', event.target.value)} placeholder="Codigo" />
            <input value={filters.name} onChange={(event) => updateFilter('name', event.target.value)} placeholder="Nombre o razon social" />
            <input value={filters.fiscalId} onChange={(event) => updateFilter('fiscalId', event.target.value)} placeholder="RNC / identificacion" />
            <input value={filters.phone} onChange={(event) => updateFilter('phone', event.target.value)} placeholder="Telefono" />
            <input value={filters.email} onChange={(event) => updateFilter('email', event.target.value)} placeholder="Correo" />
            <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
              <option>Todos</option>
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
            <strong>{filteredCustomers.length} clientes</strong>
          </div>
        </section>

        <section className="erp-panel customers-list-panel">
          <div className="customers-panel-heading">
            <div>
              <span>Registro</span>
              <h2>Clientes registrados</h2>
            </div>
            {selectedCustomer && <strong>{selectedCustomer.code}</strong>}
          </div>

          <div className="customers-table-wrap">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Nombre / Razon social</th>
                  <th>RNC / ID</th>
                  <th>Telefono</th>
                  <th>Correo</th>
                  <th>Direccion</th>
                  <th>Estado</th>
                  <th>Balance</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan="9" className="customers-empty-cell">No hay clientes con esos filtros.</td>
                  </tr>
                )}
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.code}
                    className={selectedCode === customer.code ? 'is-selected' : ''}
                    onClick={() => setSelectedCode(customer.code)}
                  >
                    <td>{customer.code}</td>
                    <td>
                      <strong>{customer.tradeName}</strong>
                      <small>{customer.legalName || customer.type}</small>
                    </td>
                    <td>{customer.fiscalId}</td>
                    <td>{customer.phone || 'N/D'}</td>
                    <td>{customer.email || 'N/D'}</td>
                    <td>{customer.address || 'N/D'}</td>
                    <td><span className={`customers-state-badge ${customer.status.toLowerCase()}`}>{customer.status}</span></td>
                    <td>{currency(customer.balance || 0)}</td>
                    <td>
                      <div className="customers-row-actions">
                        <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedCode(customer.code); setForm({ ...defaultCustomer, ...customer }); setActiveModal('form') }}>Editar</button>
                        <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedCode(customer.code); setActiveModal('history') }}>Historial</button>
                        <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedCode(customer.code); setActiveModal('account') }}>Cuenta</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {activeModal === 'form' && (
          <div className="customers-modal-backdrop" role="presentation">
            <section className="customers-modal customers-form-modal" role="dialog" aria-modal="true" aria-label="Formulario de cliente">
              <header>
                <div>
                  <span>{form.code || 'Nuevo'}</span>
                  <h2>{selectedCode ? 'Editar cliente' : 'Nuevo cliente'}</h2>
                </div>
                <button type="button" onClick={() => setActiveModal('')} title="Cerrar">
                  <X size={18} />
                </button>
              </header>

              <div className="customers-modal-body">
                <section className="customers-form-section">
                  <div className="customers-section-title">
                    <span>Datos principales</span>
                    <h3>Identificacion del cliente</h3>
                  </div>
                  <div className="customers-form-grid">
                    <label>Codigo de cliente<input value={form.code} onChange={(event) => updateForm('code', event.target.value)} /></label>
                    <label>Tipo de cliente<select value={form.type} onChange={(event) => updateForm('type', event.target.value)}><option>Persona</option><option>Empresa</option></select></label>
                    <label>Nombre comercial<input value={form.tradeName} onChange={(event) => updateForm('tradeName', event.target.value)} /></label>
                    <label>Razon social<input value={form.legalName} onChange={(event) => updateForm('legalName', event.target.value)} /></label>
                    <label>RNC / Cedula / Identificacion<input value={form.fiscalId} onChange={(event) => updateForm('fiscalId', event.target.value)} /></label>
                    <label>Telefono<input value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} /></label>
                    <label>WhatsApp<input value={form.whatsapp} onChange={(event) => updateForm('whatsapp', event.target.value)} /></label>
                    <label>Correo electronico<input value={form.email} onChange={(event) => updateForm('email', event.target.value)} /></label>
                    <label className="customers-span-2">Direccion<input value={form.address} onChange={(event) => updateForm('address', event.target.value)} /></label>
                    <label>Ciudad<input value={form.city} onChange={(event) => updateForm('city', event.target.value)} /></label>
                    <label>Provincia<input value={form.province} onChange={(event) => updateForm('province', event.target.value)} /></label>
                    <label>Pais<input value={form.country} onChange={(event) => updateForm('country', event.target.value)} /></label>
                    <label>Estado<select value={form.status} onChange={(event) => updateForm('status', event.target.value)}><option>Activo</option><option>Inactivo</option></select></label>
                  </div>
                </section>

                <section className="customers-form-section">
                  <div className="customers-section-title">
                    <span>Datos comerciales</span>
                    <h3>Credito y condiciones</h3>
                  </div>
                  <div className="customers-form-grid">
                    <label>Condicion de pago<select value={form.paymentCondition} onChange={(event) => updateForm('paymentCondition', event.target.value)}><option>Contado</option><option>Credito</option></select></label>
                    <label>Dias de credito<input type="number" min="0" value={form.creditDays} onChange={(event) => updateForm('creditDays', event.target.value)} /></label>
                    <label>Limite de credito<input type="number" min="0" step="0.01" value={form.creditLimit} onChange={(event) => updateForm('creditLimit', event.target.value)} /></label>
                    <label>Vendedor asignado<input value={form.seller} onChange={(event) => updateForm('seller', event.target.value)} /></label>
                    <label>Lista de precios<input value={form.priceList} onChange={(event) => updateForm('priceList', event.target.value)} /></label>
                    <label>Tipo de comprobante<select value={form.preferredReceiptType} onChange={(event) => updateForm('preferredReceiptType', event.target.value)}><option>Consumidor final</option><option>Credito fiscal</option><option>Gubernamental</option><option>Regimen especial</option></select></label>
                    <label>Descuento autorizado %<input type="number" min="0" step="0.01" value={form.authorizedDiscount} onChange={(event) => updateForm('authorizedDiscount', event.target.value)} /></label>
                    <label className="customers-span-2">Nota interna<textarea value={form.internalNote} onChange={(event) => updateForm('internalNote', event.target.value)} /></label>
                  </div>
                </section>

                <section className="customers-form-section">
                  <div className="customers-section-title">
                    <span>Fiscal</span>
                    <h3>Documentos y envio</h3>
                  </div>
                  <div className="customers-form-grid">
                    <label className="customers-check"><input type="checkbox" checked={form.showFiscalIdOnInvoice} onChange={(event) => updateForm('showFiscalIdOnInvoice', event.target.checked)} /> Mostrar RNC en factura</label>
                    <label className="customers-check"><input type="checkbox" checked={form.requiresFiscalReceipt} onChange={(event) => updateForm('requiresFiscalReceipt', event.target.checked)} /> Requiere comprobante fiscal</label>
                    <label>Correo para envio de factura<input value={form.invoiceEmail} onChange={(event) => updateForm('invoiceEmail', event.target.value)} /></label>
                    <label>Contacto principal<input value={form.mainContact} onChange={(event) => updateForm('mainContact', event.target.value)} /></label>
                  </div>
                </section>
              </div>

              <footer>
                <button type="button" onClick={() => setActiveModal('')}>Cancelar</button>
                <button type="button" onClick={() => setActiveModal('')}>Salir</button>
                <button type="button" className="customers-primary-button" onClick={saveCustomer}>
                  <Save size={16} />
                  Guardar cliente
                </button>
              </footer>
            </section>
          </div>
        )}

        {activeModal === 'history' && selectedCustomer && (
          <div className="customers-modal-backdrop" role="presentation">
            <section className="customers-modal" role="dialog" aria-modal="true" aria-label="Historial del cliente">
              <header>
                <div>
                  <span>{selectedCustomer.code}</span>
                  <h2>Historial del cliente</h2>
                </div>
                <button type="button" onClick={() => setActiveModal('')} title="Cerrar"><X size={18} /></button>
              </header>
              <div className="customers-modal-body">
                <div className="customers-modal-summary">
                  <article><span>Cliente</span><strong>{selectedCustomer.tradeName}</strong></article>
                  <article><span>RNC / ID</span><strong>{selectedCustomer.fiscalId}</strong></article>
                  <article><span>Facturas</span><strong>{customerInvoices.length}</strong></article>
                </div>
                <div className="customers-table-wrap">
                  <table className="customers-table">
                    <thead><tr><th>Fecha</th><th>Documento</th><th>Tipo</th><th>Total</th><th>Estado</th></tr></thead>
                    <tbody>
                      {customerInvoices.length === 0 && <tr><td colSpan="5" className="customers-empty-cell">No hay historial registrado para este cliente.</td></tr>}
                      {customerInvoices.map((invoice) => (
                        <tr key={invoice.number}><td>{invoice.date}</td><td>{invoice.number}</td><td>Factura</td><td>{currency(invoice.totals?.total)}</td><td>{invoice.state}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <footer><button type="button" onClick={() => setActiveModal('')}>Cerrar</button></footer>
            </section>
          </div>
        )}

        {activeModal === 'account' && selectedCustomer && (
          <div className="customers-modal-backdrop" role="presentation">
            <section className="customers-modal" role="dialog" aria-modal="true" aria-label="Estado de cuenta">
              <header>
                <div>
                  <span>{selectedCustomer.code}</span>
                  <h2>Estado de cuenta</h2>
                </div>
                <button type="button" onClick={() => setActiveModal('')} title="Cerrar"><X size={18} /></button>
              </header>
              <div className="customers-modal-body">
                <div className="customers-modal-summary">
                  <article><span>Cliente</span><strong>{selectedCustomer.tradeName}</strong></article>
                  <article><span>Balance</span><strong>{currency(accountBalance || selectedCustomer.balance)}</strong></article>
                  <article><span>Pendientes</span><strong>{accountRows.length}</strong></article>
                </div>
                <div className="customers-table-wrap">
                  <table className="customers-table">
                    <thead><tr><th>Factura</th><th>Fecha</th><th>Vencimiento</th><th>Total</th><th>Pagado</th><th>Balance</th></tr></thead>
                    <tbody>
                      {accountRows.length === 0 && <tr><td colSpan="6" className="customers-empty-cell">No hay facturas pendientes para este cliente.</td></tr>}
                      {accountRows.map((row) => (
                        <tr key={row.number}><td>{row.number}</td><td>{row.date}</td><td>{row.dueDate}</td><td>{currency(row.total)}</td><td>{currency(row.paid)}</td><td>{currency(row.balance)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <footer><button type="button" onClick={() => setActiveModal('')}>Cerrar</button></footer>
            </section>
          </div>
        )}
      </section>
    </ModulePageLayout>
  )
}
