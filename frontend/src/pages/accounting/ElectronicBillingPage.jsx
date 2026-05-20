import { useMemo, useState } from 'react'
import {
  Archive,
  CheckCircle,
  Download,
  Eye,
  FileText,
  Inbox,
  PlayCircle,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Send,
  Settings,
  Shield,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import {
  activateContingencyMode,
  closeContingencyMode,
  generateReceiptAcknowledgement,
  generateXmlForDocument,
  getCommercialResponses,
  getContingencyQueue,
  getElectronicArchive,
  getElectronicUsage,
  getIssuedElectronicDocuments,
  getReceivedElectronicDocuments,
  markDocumentAsSigned,
  prepareSigningForDocument,
  registerReceivedElectronicDocument,
  retryPendingDocuments,
  saveCommercialResponse,
  simulateSendIssuedDocument,
} from '../../services/electronicBillingService.js'
import {
  getCertificateConfig,
  getCertificateStatus,
  saveCertificateConfig,
  validateCertificateConfig,
} from '../../services/electronicSignatureService.js'
import {
  getDgiiElectronicConfig,
  saveDgiiElectronicConfig,
  testConnection,
} from '../../services/dgiiElectronicService.js'
import { openPrintedRepresentation } from '../../utils/electronicBilling/printedRepresentation.js'
import { readStorage, today } from '../../utils/accountingEntries.js'
import './ElectronicBillingPage.css'

const tabs = [
  { id: 'issued', label: 'Documentos emitidos', icon: FileText },
  { id: 'received', label: 'Documentos recibidos', icon: Inbox },
  { id: 'certificate', label: 'Certificado digital', icon: Shield },
  { id: 'dgii', label: 'Configuracion DGII', icon: Settings },
  { id: 'acknowledgements', label: 'Acuses de recibo', icon: CheckCircle },
  { id: 'commercial', label: 'Aprobacion comercial', icon: PlayCircle },
  { id: 'printed', label: 'Representacion impresa', icon: Printer },
  { id: 'archive', label: 'Archivo historico', icon: Archive },
  { id: 'contingency', label: 'Contingencia', icon: AlertTriangle },
  { id: 'errors', label: 'Errores y reintentos', icon: RefreshCw },
]

function currency(value) {
  return `RD$ ${Number(value || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function downloadText(filename, content, type = 'text/xml;charset=utf-8') {
  const blob = new Blob([content || ''], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function ElectronicBillingPage() {
  const [activeTab, setActiveTab] = useState('issued')
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [issued, setIssued] = useState(getIssuedElectronicDocuments)
  const [received, setReceived] = useState(getReceivedElectronicDocuments)
  const [archive, setArchive] = useState(getElectronicArchive)
  const [queue, setQueue] = useState(getContingencyQueue)
  const [responses, setResponses] = useState(getCommercialResponses)
  const [usage, setUsage] = useState(getElectronicUsage)
  const [certificate, setCertificate] = useState(getCertificateConfig)
  const [dgiiConfig, setDgiiConfig] = useState(getDgiiElectronicConfig)
  const [selectedDocId, setSelectedDocId] = useState('')
  const [receivedDraft, setReceivedDraft] = useState({
    provider: '',
    providerRnc: '',
    ncf: '',
    issuedAt: today(),
    receivedAt: today(),
    total: '',
    itbis: '',
    observations: '',
  })

  const selectedDoc = issued.find((document) => document.id === selectedDocId) || issued[0]
  const filteredIssued = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return issued
    return issued.filter((document) => [
      document.invoiceNumber,
      document.ncf,
      document.customer,
      document.customerRnc,
      document.electronicStatus,
    ].some((value) => String(value || '').toLowerCase().includes(term)))
  }, [issued, query])
  const filteredReceived = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return received
    return received.filter((document) => [
      document.provider,
      document.providerRnc,
      document.ncf,
      document.commercialStatus,
    ].some((value) => String(value || '').toLowerCase().includes(term)))
  }, [received, query])

  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentUsage = usage.months?.[currentMonth] || { total: 0 }
  const certificateValidation = validateCertificateConfig(certificate)

  const reload = () => {
    setIssued(getIssuedElectronicDocuments())
    setReceived(getReceivedElectronicDocuments())
    setArchive(getElectronicArchive())
    setQueue(getContingencyQueue())
    setResponses(getCommercialResponses())
    setUsage(getElectronicUsage())
  }

  const settings = () => readStorage('invefat_company_settings', {})

  const handleGenerateXml = (documentId) => {
    generateXmlForDocument(documentId, settings())
    reload()
    setMessage('XML base generado correctamente.')
  }

  const handlePrepareSign = (documentId) => {
    prepareSigningForDocument(documentId)
    reload()
    setMessage('Documento preparado para firma digital segura en backend.')
  }

  const handleMarkSigned = (documentId) => {
    markDocumentAsSigned(documentId)
    reload()
    setMessage('Documento marcado como firmado en modo preparacion.')
  }

  const handleSend = async (documentId) => {
    const result = await simulateSendIssuedDocument(documentId)
    reload()
    setMessage(result?.lastMessage || 'Envio simulado registrado.')
  }

  const handleSaveCertificate = () => {
    const saved = saveCertificateConfig(certificate)
    setCertificate(saved)
    setMessage('Configuracion de certificado guardada sin almacenar claves privadas.')
  }

  const handleSaveDgii = () => {
    const saved = saveDgiiElectronicConfig(dgiiConfig)
    setDgiiConfig(saved)
    setMessage('Configuracion DGII guardada. Sin URLs reales se mantiene modo simulacion.')
  }

  const handleTestDgii = async () => {
    const result = await testConnection()
    setDgiiConfig(result.config)
    setMessage(result.message)
  }

  const handleCreateReceived = () => {
    if (!receivedDraft.provider || !receivedDraft.ncf) {
      setMessage('Indique proveedor y e-NCF/NCF recibido.')
      return
    }
    registerReceivedElectronicDocument(receivedDraft)
    setReceivedDraft({
      provider: '',
      providerRnc: '',
      ncf: '',
      issuedAt: today(),
      receivedAt: today(),
      total: '',
      itbis: '',
      observations: '',
    })
    reload()
    setMessage('Documento recibido registrado.')
  }

  const handleCommercialResponse = (document, status) => {
    saveCommercialResponse({
      documentId: document.id,
      provider: document.provider,
      amount: document.total,
      status,
      user: 'Administrador',
    })
    reload()
    setMessage(`Respuesta comercial registrada: ${status}.`)
  }

  const handleAcknowledgement = (documentId) => {
    generateReceiptAcknowledgement(documentId)
    reload()
    setMessage('Acuse de recibo generado en modo simulacion.')
  }

  const renderIssued = () => (
    <div className="ecf-panel">
      <div className="ecf-section-heading">
        <div>
          <h2>Documentos electronicos emitidos</h2>
          <p>Facturas y notas con NCF/e-NCF preparadas para XML, firma, envio y archivo.</p>
        </div>
        <span>{filteredIssued.length} documentos</span>
      </div>
      <div className="ecf-table-wrap">
        <table className="ecf-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo e-CF</th>
              <th>Factura</th>
              <th>NCF/e-NCF</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Intentos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredIssued.map((document) => (
              <tr key={document.id}>
                <td>{document.date}</td>
                <td>{document.ecfType}</td>
                <td>{document.invoiceNumber}</td>
                <td>{document.ncf}</td>
                <td>
                  <strong>{document.customer}</strong>
                  <small>{document.customerRnc || 'Sin RNC'}</small>
                </td>
                <td>{currency(document.total)}</td>
                <td><span className={`ecf-status ${String(document.electronicStatus).toLowerCase().replace(/\s+/g, '-')}`}>{document.electronicStatus}</span></td>
                <td>{document.attempts || 0}</td>
                <td>
                  <div className="ecf-icon-actions">
                    <button type="button" title="Ver" onClick={() => setSelectedDocId(document.id)}><Eye size={15} /></button>
                    <button type="button" title="Generar XML" onClick={() => handleGenerateXml(document.id)}><FileText size={15} /></button>
                    <button type="button" title="Preparar firma" onClick={() => handlePrepareSign(document.id)}><Shield size={15} /></button>
                    <button type="button" title="Marcar firmado" onClick={() => handleMarkSigned(document.id)}><CheckCircle size={15} /></button>
                    <button type="button" title="Enviar simulado" onClick={() => handleSend(document.id)}><Send size={15} /></button>
                    <button type="button" title="Descargar XML" onClick={() => downloadText(`${document.ncf || document.invoiceNumber}.xml`, document.xmlContent)}><Download size={15} /></button>
                    <button type="button" title="Representacion impresa" onClick={() => openPrintedRepresentation(document.printedRepresentation?.htmlContent)}><Printer size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredIssued.length === 0 && (
              <tr><td colSpan="9" className="ecf-empty">No hay documentos electronicos emitidos todavia.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderReceived = () => (
    <div className="ecf-grid-two">
      <div className="ecf-panel">
        <div className="ecf-section-heading">
          <div>
            <h2>Registrar e-CF recibido</h2>
            <p>Preparado para proveedores, DGII 606, cuentas por pagar y acuses.</p>
          </div>
        </div>
        <div className="ecf-form-grid">
          <label>Proveedor<input value={receivedDraft.provider} onChange={(event) => setReceivedDraft({ ...receivedDraft, provider: event.target.value })} /></label>
          <label>RNC proveedor<input value={receivedDraft.providerRnc} onChange={(event) => setReceivedDraft({ ...receivedDraft, providerRnc: event.target.value })} /></label>
          <label>e-NCF / NCF<input value={receivedDraft.ncf} onChange={(event) => setReceivedDraft({ ...receivedDraft, ncf: event.target.value })} /></label>
          <label>Fecha emision<input type="date" value={receivedDraft.issuedAt} onChange={(event) => setReceivedDraft({ ...receivedDraft, issuedAt: event.target.value })} /></label>
          <label>Fecha recepcion<input type="date" value={receivedDraft.receivedAt} onChange={(event) => setReceivedDraft({ ...receivedDraft, receivedAt: event.target.value })} /></label>
          <label>Total<input value={receivedDraft.total} onChange={(event) => setReceivedDraft({ ...receivedDraft, total: event.target.value })} /></label>
          <label>ITBIS<input value={receivedDraft.itbis} onChange={(event) => setReceivedDraft({ ...receivedDraft, itbis: event.target.value })} /></label>
          <label>Observaciones<input value={receivedDraft.observations} onChange={(event) => setReceivedDraft({ ...receivedDraft, observations: event.target.value })} /></label>
        </div>
        <button type="button" className="ecf-primary" onClick={handleCreateReceived}><Plus size={16} />Registrar recibido</button>
      </div>
      <div className="ecf-panel">
        <div className="ecf-section-heading"><h2>Recibidos</h2><span>{filteredReceived.length}</span></div>
        <div className="ecf-table-wrap">
          <table className="ecf-table">
            <thead><tr><th>Proveedor</th><th>NCF</th><th>Total</th><th>Acuse</th><th>Comercial</th><th>Acciones</th></tr></thead>
            <tbody>
              {filteredReceived.map((document) => (
                <tr key={document.id}>
                  <td><strong>{document.provider}</strong><small>{document.providerRnc}</small></td>
                  <td>{document.ncf}</td>
                  <td>{currency(document.total)}</td>
                  <td>{document.acknowledgementStatus}</td>
                  <td>{document.commercialStatus}</td>
                  <td>
                    <div className="ecf-icon-actions">
                      <button type="button" title="Generar acuse" onClick={() => handleAcknowledgement(document.id)}><CheckCircle size={15} /></button>
                      <button type="button" title="Aceptar" onClick={() => handleCommercialResponse(document, 'Aceptado')}><PlayCircle size={15} /></button>
                      <button type="button" title="Rechazar" onClick={() => handleCommercialResponse(document, 'Rechazado')}><XCircle size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReceived.length === 0 && <tr><td colSpan="6" className="ecf-empty">No hay documentos recibidos.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderCertificate = () => (
    <div className="ecf-panel">
      <div className="ecf-warning">
        <Shield size={18} />
        La firma digital real debe ejecutarse en entorno seguro de backend. No guarde llaves privadas reales en localStorage ni en el frontend.
      </div>
      <div className="ecf-form-grid">
        {[
          ['name', 'Nombre del certificado'],
          ['holder', 'Titular'],
          ['holderRnc', 'RNC titular'],
          ['issuer', 'Entidad certificadora'],
          ['issuedAt', 'Fecha emision'],
          ['expiresAt', 'Fecha vencimiento'],
          ['status', 'Estado'],
          ['certificateFileName', 'Archivo certificado (referencia)'],
          ['privateKeyReference', 'Referencia llave privada segura'],
          ['observations', 'Observaciones'],
        ].map(([key, label]) => (
          <label key={key}>{label}
            <input
              type={key.includes('At') ? 'date' : 'text'}
              value={certificate[key] || ''}
              onChange={(event) => setCertificate({ ...certificate, [key]: event.target.value })}
            />
          </label>
        ))}
      </div>
      <div className="ecf-inline-info">
        <span>Estado calculado: <strong>{getCertificateStatus(certificate)}</strong></span>
        <span>Advertencias: <strong>{certificateValidation.warnings.length}</strong></span>
        <span>Errores: <strong>{certificateValidation.errors.length}</strong></span>
      </div>
      <button type="button" className="ecf-primary" onClick={handleSaveCertificate}><Save size={16} />Guardar certificado</button>
    </div>
  )

  const renderDgii = () => (
    <div className="ecf-panel">
      <div className="ecf-warning">
        <Settings size={18} />
        No hay envio real sin credenciales, URLs oficiales y backend seguro. Si faltan URLs, el sistema trabaja en modo simulacion.
      </div>
      <div className="ecf-form-grid">
        <label>Ambiente
          <select value={dgiiConfig.environment} onChange={(event) => setDgiiConfig({ ...dgiiConfig, environment: event.target.value })}>
            <option>Pruebas</option>
            <option>Produccion</option>
          </select>
        </label>
        <label>URL recepcion e-CF<input value={dgiiConfig.receptionUrl || ''} onChange={(event) => setDgiiConfig({ ...dgiiConfig, receptionUrl: event.target.value })} /></label>
        <label>URL consulta estado<input value={dgiiConfig.statusUrl || ''} onChange={(event) => setDgiiConfig({ ...dgiiConfig, statusUrl: event.target.value })} /></label>
        <label>URL recepcion acuse<input value={dgiiConfig.acknowledgementUrl || ''} onChange={(event) => setDgiiConfig({ ...dgiiConfig, acknowledgementUrl: event.target.value })} /></label>
        <label>Usuario API<input value={dgiiConfig.apiUser || ''} onChange={(event) => setDgiiConfig({ ...dgiiConfig, apiUser: event.target.value })} /></label>
        <label>Modo simulacion
          <select value={dgiiConfig.simulationMode ? 'si' : 'no'} onChange={(event) => setDgiiConfig({ ...dgiiConfig, simulationMode: event.target.value === 'si' })}>
            <option value="si">Si</option>
            <option value="no">No</option>
          </select>
        </label>
      </div>
      <div className="ecf-inline-info">
        <span>Estado conexion: <strong>{dgiiConfig.connectionStatus}</strong></span>
        <span>Ultima prueba: <strong>{dgiiConfig.lastTestAt || 'Pendiente'}</strong></span>
      </div>
      <div className="ecf-button-row">
        <button type="button" className="ecf-primary" onClick={handleSaveDgii}><Save size={16} />Guardar configuracion</button>
        <button type="button" onClick={handleTestDgii}><PlayCircle size={16} />Probar conexion</button>
      </div>
    </div>
  )

  const renderPrinted = () => (
    <div className="ecf-panel">
      <div className="ecf-section-heading">
        <div>
          <h2>Representacion impresa</h2>
          <p>Vista preparada con QR/codigo de seguridad. El documento fiscal principal sigue siendo XML.</p>
        </div>
        {selectedDoc && <button type="button" onClick={() => openPrintedRepresentation(selectedDoc.printedRepresentation?.htmlContent)}><Printer size={16} />Abrir RI</button>}
      </div>
      {selectedDoc ? (
        <div className="ecf-preview-box">
          <strong>{selectedDoc.invoiceNumber} - {selectedDoc.ncf}</strong>
          <span>{selectedDoc.customer}</span>
          <span>Codigo seguridad: {selectedDoc.securityCode}</span>
          <code>{selectedDoc.qrData}</code>
        </div>
      ) : (
        <p className="ecf-empty">Seleccione un documento emitido para ver su representacion impresa.</p>
      )}
    </div>
  )

  const renderArchive = () => (
    <div className="ecf-panel">
      <div className="ecf-section-heading"><h2>Archivo historico</h2><span>Retencion preparada por 10 anos</span></div>
      <div className="ecf-table-wrap">
        <table className="ecf-table">
          <thead><tr><th>Factura</th><th>NCF</th><th>Estado final</th><th>Archivado</th><th>Retener hasta</th></tr></thead>
          <tbody>
            {archive.map((item) => (
              <tr key={item.id}><td>{item.invoiceNumber}</td><td>{item.ncf}</td><td>{item.finalStatus}</td><td>{item.archivedAt}</td><td>{item.retentionUntil}</td></tr>
            ))}
            {archive.length === 0 && <tr><td colSpan="5" className="ecf-empty">No hay documentos archivados.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderContingency = () => (
    <div className="ecf-panel">
      <div className="ecf-button-row">
        <button type="button" className="ecf-primary" onClick={() => { activateContingencyMode('Activado manualmente'); reload(); setMessage('Modo contingencia activado.') }}><AlertTriangle size={16} />Activar contingencia</button>
        <button type="button" onClick={() => { closeContingencyMode(); reload(); setMessage('Contingencia cerrada.') }}><CheckCircle size={16} />Cerrar contingencia</button>
        <button type="button" onClick={() => { retryPendingDocuments(); reload(); setMessage('Reintentos programados.') }}><RefreshCw size={16} />Reintentar pendientes</button>
      </div>
      <div className="ecf-table-wrap">
        <table className="ecf-table">
          <thead><tr><th>Tipo</th><th>Documento</th><th>Estado</th><th>Motivo</th><th>Fecha</th></tr></thead>
          <tbody>
            {queue.map((item) => (
              <tr key={item.id}><td>{item.type || 'documento'}</td><td>{item.invoiceNumber || item.documentId || item.id}</td><td>{item.status}</td><td>{item.reason}</td><td>{item.createdAt || item.queuedAt}</td></tr>
            ))}
            {queue.length === 0 && <tr><td colSpan="5" className="ecf-empty">No hay contingencias registradas.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderErrors = () => {
    const problemDocs = issued.filter((document) => ['Rechazado', 'Error tecnico', 'En contingencia'].includes(document.electronicStatus) || document.validationErrors?.length)
    return (
      <div className="ecf-panel">
        <div className="ecf-section-heading"><h2>Errores y reintentos</h2><span>{problemDocs.length} pendientes</span></div>
        <div className="ecf-table-wrap">
          <table className="ecf-table">
            <thead><tr><th>Documento</th><th>Estado</th><th>Mensaje</th><th>Acciones</th></tr></thead>
            <tbody>
              {problemDocs.map((document) => (
                <tr key={document.id}>
                  <td>{document.invoiceNumber}</td>
                  <td>{document.electronicStatus}</td>
                  <td>{document.lastMessage}</td>
                  <td><button type="button" onClick={() => handleSend(document.id)}><RefreshCw size={16} />Reintentar</button></td>
                </tr>
              ))}
              {problemDocs.length === 0 && <tr><td colSpan="4" className="ecf-empty">No hay errores electronicos registrados.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderCurrentTab = () => {
    if (activeTab === 'issued') return renderIssued()
    if (activeTab === 'received') return renderReceived()
    if (activeTab === 'certificate') return renderCertificate()
    if (activeTab === 'dgii') return renderDgii()
    if (activeTab === 'acknowledgements') return (
      <div className="ecf-panel">
        <div className="ecf-section-heading"><h2>Acuses de recibo</h2><span>{received.length}</span></div>
        {renderReceived()}
      </div>
    )
    if (activeTab === 'commercial') return (
      <div className="ecf-panel">
        <div className="ecf-section-heading"><h2>Aprobacion comercial</h2><span>{responses.length} respuestas</span></div>
        <div className="ecf-table-wrap">
          <table className="ecf-table">
            <thead><tr><th>Proveedor</th><th>Monto</th><th>Estado</th><th>Fecha</th><th>Usuario</th></tr></thead>
            <tbody>
              {responses.map((response) => (
                <tr key={response.id}><td>{response.provider}</td><td>{currency(response.amount)}</td><td>{response.status}</td><td>{response.responseDate}</td><td>{response.user}</td></tr>
              ))}
              {responses.length === 0 && <tr><td colSpan="5" className="ecf-empty">No hay respuestas comerciales.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    )
    if (activeTab === 'printed') return renderPrinted()
    if (activeTab === 'archive') return renderArchive()
    if (activeTab === 'contingency') return renderContingency()
    return renderErrors()
  }

  return (
    <ModulePageLayout
      title="Facturacion Electronica e-CF"
      moduleLabel="Finanzas / Contabilidad"
      description="Arquitectura profesional para XML, firma segura, DGII simulado, RI, acuses, contingencia y archivo historico."
      breadcrumb={['Finanzas / Contabilidad', 'Facturacion Electronica e-CF']}
      searchValue={query}
      searchPlaceholder="Buscar por NCF, factura, cliente, proveedor o estado"
      onSearchChange={setQuery}
      statusCards={[
        { label: 'Emitidos', value: issued.length, detail: 'Con NCF/e-NCF preparado' },
        { label: 'Recibidos', value: received.length, detail: 'Proveedores e-CF' },
        { label: 'Uso mensual', value: currentUsage.total || 0, detail: usage.monthlyLimit ? `Limite ${usage.monthlyLimit}` : 'Sin limite activo' },
        { label: 'Certificado', value: getCertificateStatus(certificate), detail: 'Firma real requiere backend' },
      ]}
    >
      <div className="ecf-shell">
        <div className="ecf-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                type="button"
                key={tab.id}
                className={activeTab === tab.id ? 'is-active' : ''}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
        {message && (
          <div className="ecf-message">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage('')}><XCircle size={15} /></button>
          </div>
        )}
        {renderCurrentTab()}
      </div>
    </ModulePageLayout>
  )
}
