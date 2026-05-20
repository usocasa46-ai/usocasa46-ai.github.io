import {
  Database,
  Download,
  Edit3,
  Eye,
  FileUp,
  RefreshCcw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import {
  RNC_FIELD_DEFINITIONS,
  normalizeRnc,
  recordFromCsvValues,
  rncService,
  validateColumnMapping,
  validateRncRecord,
} from '../../services/rncService.js'
import './AccountingModulePages.css'
import './RncRegistryPage.css'

const emptyRecord = {
  rnc: '',
  razonSocial: '',
  actividadEconomica: '',
  fechaInicioOperaciones: '',
  estado: 'ACTIVO',
  regimenPago: '',
  source: 'manual',
}

const RNC_CSV_HEADER = 'RNC,RAZÓN SOCIAL,ACTIVIDAD ECONÓMICA,FECHA DE INICIO OPERACIONES,ESTADO,RÉGIMEN DE PAGO'
const RNC_CSV_HEADER_COMPAT = 'RNC,RAZON SOCIAL,ACTIVIDAD ECONOMICA,FECHA DE INICIO OPERACIONES,ESTADO,REGIMEN DE PAGO'
const RNC_CSV_EXAMPLE = '00300755329,"VIRGINIA SOLEDAD PIMENTEL RAMIREZ","EMPLEADOS (ASALARIADOS)","","SUSPENDIDO","NORMAL"'

function downloadCsv(filename, content) {
  if (typeof document === 'undefined') return
  const payload = String(content || '').startsWith('\uFEFF') ? content : `\uFEFF${content}`
  const blob = new Blob([payload], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function exportCsv(filename, rows) {
  const csvRows = rows.map((row) => [
    row.rnc,
    row.razonSocial,
    row.actividadEconomica,
    row.fechaInicioOperaciones,
    row.estado,
    row.regimenPago,
  ].map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
  downloadCsv(filename, [RNC_CSV_HEADER, ...csvRows].join('\n'))
}

function RncModal({ title, children, onClose, footer }) {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      onClose?.()
    }
    window.addEventListener('keydown', handleEscape, true)
    return () => window.removeEventListener('keydown', handleEscape, true)
  }, [onClose])

  return (
    <div className="rnc-modal-backdrop" role="presentation">
      <section className="rnc-modal" role="dialog" aria-modal="true">
        <header>
          <div>
            <span>Finanzas / Contabilidad</span>
            <h2>{title}</h2>
          </div>
          <button type="button" onClick={onClose} title="Cerrar"><X size={16} /></button>
        </header>
        <div className="rnc-modal-body">{children}</div>
        <footer>{footer}</footer>
      </section>
    </div>
  )
}

export default function RncRegistryPage({ controls, onAction, searchValue = '', onSearchChange }) {
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, lastImport: '', lastErrors: 0 })
  const [rows, setRows] = useState([])
  const [totalRows, setTotalRows] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ query: '', estado: 'Todos', regimenPago: 'Todos', actividadEconomica: '' })
  const [selectedRnc, setSelectedRnc] = useState('')
  const [draft, setDraft] = useState(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [duplicateMode, setDuplicateMode] = useState('update')
  const [clearBeforeImport, setClearBeforeImport] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [columnMapping, setColumnMapping] = useState({})
  const [progress, setProgress] = useState({ processed: 0, imported: 0, updated: 0, valid: 0, errors: 0, skipped: 0, percent: 0, errorRows: [] })
  const [message, setMessage] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const abortRef = useRef(null)
  const pageSize = 50

  const selected = useMemo(() => rows.find((row) => row.rnc === selectedRnc), [rows, selectedRnc])
  const combinedQuery = [filters.query, searchValue].filter(Boolean).join(' ')
  const mappingMissing = useMemo(() => validateColumnMapping(columnMapping), [columnMapping])
  const previewRows = useMemo(() => {
    if (!analysis?.sampleRows?.length) return []
    const initialPreview = new Map((analysis.preview || []).map((row) => [row.row, row]))
    return analysis.sampleRows.map((row) => {
      const record = recordFromCsvValues(row.values, columnMapping)
      const initial = initialPreview.get(row.row)
      const duplicateWarning = initial?.error === 'RNC duplicado en base' && initial?.record?.rnc === record.rnc
      return {
        row: row.row,
        record,
        error: validateRncRecord(record) || (duplicateWarning ? 'RNC duplicado en base' : ''),
      }
    })
  }, [analysis, columnMapping])

  const loadStats = async () => {
    const nextStats = await rncService.getStats()
    setStats(nextStats)
  }

  const loadRows = async (nextPage = page) => {
    const result = await rncService.search(combinedQuery, filters, { page: nextPage, pageSize })
    setRows(result.rows)
    setTotalRows(result.total)
    setPage(result.page)
  }

  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      Promise.all([rncService.getStats(), rncService.search(combinedQuery, filters, { page, pageSize })]).then(([nextStats, result]) => {
        if (!active) return
        setStats(nextStats)
        setRows(result.rows)
        setTotalRows(result.total)
      })
    }, 180)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [combinedQuery, filters, page])

  const notify = (text) => {
    setMessage(text)
    onAction?.(text)
  }

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }))
    setPage(1)
  }

  const openNew = () => {
    setDraft({ ...emptyRecord })
  }

  const openEdit = (record = selected) => {
    if (!record) {
      notify('Seleccione un RNC para editar.')
      return
    }
    setDraft({ ...record })
  }

  const saveDraft = async () => {
    try {
      const saved = await rncService.updateRnc(draft.rnc, draft)
      setSelectedRnc(saved.rnc)
      setDraft(null)
      notify('Registro RNC guardado correctamente.')
      await loadStats()
      await loadRows()
    } catch (error) {
      notify(error.message || 'No se pudo guardar el RNC.')
    }
  }

  const deleteSelected = async (record = selected) => {
    if (!record) {
      notify('Seleccione un RNC para eliminar.')
      return
    }
    if (!window.confirm(`Eliminar el RNC ${record.rnc}?`)) return
    await rncService.deleteRnc(record.rnc)
    setSelectedRnc('')
    notify('Registro RNC eliminado.')
    await loadStats()
    await loadRows()
  }

  const clearBase = async () => {
    if (!window.confirm('Esta accion limpiara toda la base de RNC cargada. Desea continuar?')) return
    await rncService.clearAll()
    setRows([])
    setSelectedRnc('')
    setTotalRows(0)
    await loadStats()
    notify('Base de RNC limpiada correctamente.')
  }

  const exportAll = async () => {
    const allRows = await rncService.exportAll()
    exportCsv('invefat-rnc-registry.csv', allRows)
  }

  const exportTemplate = () => {
    downloadCsv('ejemplo-rnc-invefat.csv', `${RNC_CSV_HEADER}\n${RNC_CSV_EXAMPLE}\n`)
  }

  const resetImportFlow = () => {
    setSelectedFile(null)
    setAnalysis(null)
    setColumnMapping({})
    setProgress({ processed: 0, imported: 0, updated: 0, valid: 0, errors: 0, skipped: 0, percent: 0, errorRows: [] })
    setIsAnalyzing(false)
    setIsImporting(false)
    abortRef.current = null
  }

  const closeUpload = () => {
    abortRef.current?.abort()
    resetImportFlow()
    setUploadOpen(false)
  }

  const analyzeSelectedCsv = async () => {
    if (!selectedFile) {
      notify('Seleccione un archivo CSV.')
      return null
    }
    setIsAnalyzing(true)
    try {
      const result = await rncService.analyzeCsv(selectedFile, { previewSize: 20 })
      setAnalysis(result)
      setColumnMapping(result.mapping)
      if (result.missingRequired?.length) {
        notify(`Revise el mapeo: faltan ${result.missingRequired.join(', ')}.`)
      } else {
        notify('Archivo analizado. Confirme el mapeo antes de importar.')
      }
      return result
    } catch (error) {
      notify(error.message || 'No se pudo analizar el CSV.')
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }

  const importSelectedCsv = async () => {
    if (!selectedFile) {
      notify('Seleccione un archivo CSV.')
      return
    }
    let activeMapping = columnMapping
    if (!analysis) {
      const analyzed = await analyzeSelectedCsv()
      if (!analyzed) return
      activeMapping = analyzed.mapping
    }
    const missing = validateColumnMapping(activeMapping)
    if (missing.length) {
      notify(`No se puede importar. Faltan columnas obligatorias: ${missing.join(', ')}.`)
      return
    }
    abortRef.current = new AbortController()
    setIsImporting(true)
    setProgress({ processed: 0, imported: 0, updated: 0, valid: 0, errors: 0, skipped: 0, percent: 0, errorRows: [] })
    try {
      const result = await rncService.importCsv(selectedFile, {
        duplicateMode,
        clearBeforeImport: clearBeforeImport || duplicateMode === 'replace',
        mapping: activeMapping,
        signal: abortRef.current.signal,
        onProgress: setProgress,
      })
      notify(`Carga finalizada: ${result.imported} importados, ${result.updated} actualizados, ${result.errors} con error.`)
      await loadStats()
      await loadRows(1)
    } catch (error) {
      notify(error.message || 'No se pudo importar el CSV.')
    } finally {
      abortRef.current = null
      setIsImporting(false)
    }
  }

  const statusOptions = ['Todos', 'ACTIVO', 'INACTIVO', 'SUSPENDIDO']
  const regimenOptions = useMemo(() => {
    const values = Array.from(new Set(rows.map((row) => row.regimenPago).filter(Boolean))).slice(0, 12)
    return ['Todos', ...values]
  }, [rows])

  const actions = [
    { id: 'upload', label: 'Cargar CSV', icon: FileUp, variant: 'primary', onClick: () => setUploadOpen(true) },
    { id: 'new', label: 'Nuevo RNC', icon: Upload, onClick: openNew },
    { id: 'edit', label: 'Editar', icon: Edit3, disabled: !selected, onClick: () => openEdit() },
    { id: 'export', label: 'Exportar', icon: Download, onClick: exportAll },
    { id: 'clear', label: 'Limpiar base', icon: Trash2, variant: 'danger', onClick: clearBase },
    { id: 'duplicates', label: duplicateMode === 'skip' ? 'Saltar duplicados' : 'Actualizar duplicados', icon: RefreshCcw, onClick: () => setDuplicateMode((current) => (current === 'update' ? 'skip' : 'update')) },
    { id: 'exit', label: 'Salir', icon: X, onClick: controls?.onClose },
  ]

  return (
    <ModulePageLayout
      title="RNC"
      moduleLabel="Finanzas / Contabilidad"
      breadcrumb={['Finanzas / Contabilidad', 'RNC']}
      description="Base de consulta de contribuyentes para facturacion y reportes fiscales."
      searchValue={searchValue}
      searchPlaceholder="Buscar RNC"
      onSearchChange={onSearchChange}
      actions={actions}
      controls={controls}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      <section className="rnc-page accounting-page">
        {message && <div className="rnc-message">{message}</div>}

        <div className="rnc-stats-grid">
          <article><span>Total RNC cargados</span><strong>{stats.total.toLocaleString('es-DO')}</strong></article>
          <article><span>Activos</span><strong>{stats.active.toLocaleString('es-DO')}</strong></article>
          <article><span>Inactivos</span><strong>{stats.inactive.toLocaleString('es-DO')}</strong></article>
          <article><span>Ultima carga</span><strong>{stats.lastImport ? new Date(stats.lastImport).toLocaleDateString('es-DO') : 'N/D'}</strong></article>
          <article><span>Registros con error</span><strong>{stats.lastErrors || 0}</strong></article>
        </div>

        <section className="accounting-panel rnc-filter-panel">
          <div className="rnc-filter-title">
            <Search size={16} />
            <strong>Consulta de contribuyentes</strong>
          </div>
          <div className="rnc-filter-grid">
            <label>Buscar por RNC o razon social<input value={filters.query} onChange={(event) => updateFilter('query', event.target.value)} placeholder="RNC / razon social / nombre" /></label>
            <label>Actividad economica<input value={filters.actividadEconomica} onChange={(event) => updateFilter('actividadEconomica', event.target.value)} placeholder="Actividad economica" /></label>
            <label>Estado<select value={filters.estado} onChange={(event) => updateFilter('estado', event.target.value)}>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>Regimen de pago<select value={filters.regimenPago} onChange={(event) => updateFilter('regimenPago', event.target.value)}>{regimenOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          </div>
        </section>

        <section className="accounting-panel">
          <div className="rnc-table-heading">
            <div>
              <span>Base DGII</span>
              <h2>Registros RNC</h2>
            </div>
            <strong>{totalRows.toLocaleString('es-DO')} resultado(s)</strong>
          </div>
          <div className="accounting-table-wrap">
            <table className="accounting-table rnc-table">
              <thead>
                <tr><th>RNC</th><th>Razon social</th><th>Actividad economica</th><th>Fecha inicio</th><th>Estado</th><th>Regimen de pago</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {rows.map((record) => (
                  <tr key={record.rnc} className={selectedRnc === record.rnc ? 'is-selected' : ''} onClick={() => setSelectedRnc(record.rnc)}>
                    <td><strong>{record.rnc}</strong></td>
                    <td>{record.razonSocial}</td>
                    <td>{record.actividadEconomica || 'N/D'}</td>
                    <td>{record.fechaInicioOperaciones || 'N/D'}</td>
                    <td><span className={`rnc-status ${String(record.estado || '').toLowerCase().includes('inactivo') || String(record.estado || '').toLowerCase().includes('suspend') ? 'is-inactive' : 'is-active'}`}>{record.estado || 'N/D'}</span></td>
                    <td>{record.regimenPago || 'N/D'}</td>
                    <td>
                      <div className="accounting-table-actions">
                        <button type="button" title="Ver" onClick={(event) => { event.stopPropagation(); setSelectedRnc(record.rnc); openEdit(record) }}><Eye size={15} /></button>
                        <button type="button" title="Editar" onClick={(event) => { event.stopPropagation(); setSelectedRnc(record.rnc); openEdit(record) }}><Edit3 size={15} /></button>
                        <button type="button" className="is-danger" title="Eliminar" onClick={(event) => { event.stopPropagation(); deleteSelected(record) }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan="7" className="accounting-empty">No hay registros RNC para mostrar.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="rnc-pagination">
            <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</button>
            <span>Pagina {page} de {Math.max(1, Math.ceil(totalRows / pageSize))}</span>
            <button type="button" disabled={page >= Math.ceil(totalRows / pageSize)} onClick={() => setPage((current) => current + 1)}>Siguiente</button>
          </div>
        </section>

        {uploadOpen && (
          <RncModal
            title="Carga masiva CSV"
            onClose={closeUpload}
            footer={(
              <>
                <button type="button" onClick={() => abortRef.current?.abort()} disabled={!abortRef.current}>Cancelar carga</button>
                <button type="button" onClick={exportTemplate}>Ejemplo CSV</button>
                <button type="button" onClick={closeUpload}>Cerrar</button>
                <button type="button" onClick={analyzeSelectedCsv} disabled={!selectedFile || isAnalyzing || isImporting}>Analizar archivo</button>
                <button type="button" className="accounting-primary-button" onClick={importSelectedCsv} disabled={!selectedFile || mappingMissing.length > 0 || isAnalyzing || isImporting}><FileUp size={15} /> Importar</button>
              </>
            )}
          >
            <div className="rnc-import-box">
              <div className="rnc-import-steps">
                <span className={selectedFile ? 'is-done' : ''}>1. Subir archivo</span>
                <span className={analysis ? 'is-done' : ''}>2. Detectar columnas</span>
                <span className={analysis && mappingMissing.length === 0 ? 'is-done' : ''}>3. Confirmar mapeo</span>
                <span>4. Importar</span>
              </div>
              <label>Archivo CSV<input type="file" accept=".csv,text/csv" onChange={(event) => {
                setSelectedFile(event.target.files?.[0] || null)
                setAnalysis(null)
                setColumnMapping({})
                setProgress({ processed: 0, imported: 0, updated: 0, valid: 0, errors: 0, skipped: 0, percent: 0, errorRows: [] })
              }} /></label>
              {selectedFile && <p>Archivo seleccionado: <strong>{selectedFile.name}</strong></p>}
              <p>El sistema detecta columnas por nombre, sin exigir orden ni plantilla fija. Acepta acentos, comillas dobles y campos vacios.</p>
              <details>
                <summary>Ver ejemplo compatible</summary>
                <code>{RNC_CSV_HEADER}</code>
                <code>{RNC_CSV_HEADER_COMPAT}</code>
                <code>{RNC_CSV_EXAMPLE}</code>
              </details>
              {analysis && (
                <section className="rnc-mapping-panel">
                  <div>
                    <h3>Mapeo de columnas RNC</h3>
                    <p>Confirme o corrija la columna detectada antes de importar.</p>
                  </div>
                  <div className="rnc-mapping-grid">
                    {RNC_FIELD_DEFINITIONS.map((field) => (
                      <label key={field.key}>
                        {field.label}{field.required ? ' *' : ''}
                        <select value={columnMapping[field.key] ?? -1} onChange={(event) => setColumnMapping((current) => ({ ...current, [field.key]: Number(event.target.value) }))}>
                          <option value={-1}>No importar</option>
                          {analysis.headers.map((header, index) => <option key={`${field.key}-${header}-${index}`} value={index}>{header || `Columna ${index + 1}`}</option>)}
                        </select>
                      </label>
                    ))}
                  </div>
                  {mappingMissing.length > 0 && <div className="rnc-warning">Faltan campos obligatorios: {mappingMissing.join(', ')}.</div>}
                </section>
              )}
              {previewRows.length > 0 && (
                <section className="rnc-preview-panel">
                  <div>
                    <h3>Vista previa</h3>
                    <p>Primeras {previewRows.length} filas interpretadas con el mapeo actual.</p>
                  </div>
                  <div className="rnc-preview-table-wrap">
                    <table className="rnc-preview-table">
                      <thead><tr><th>Fila</th><th>RNC</th><th>Razon social</th><th>Actividad economica</th><th>Fecha inicio</th><th>Estado</th><th>Regimen</th><th>Validacion</th></tr></thead>
                      <tbody>
                        {previewRows.map((row) => (
                          <tr key={row.row} className={row.error ? 'has-error' : ''}>
                            <td>{row.row}</td>
                            <td>{row.record.rnc || 'N/D'}</td>
                            <td>{row.record.razonSocial || 'N/D'}</td>
                            <td>{row.record.actividadEconomica || 'N/D'}</td>
                            <td>{row.record.fechaInicioOperaciones || 'N/D'}</td>
                            <td>{row.record.estado || 'N/D'}</td>
                            <td>{row.record.regimenPago || 'N/D'}</td>
                            <td>{row.error || 'OK'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
              <div className="rnc-duplicate-options">
                <label><input type="radio" name="rnc-duplicates" checked={duplicateMode === 'skip'} onChange={() => setDuplicateMode('skip')} /> Saltar duplicados</label>
                <label><input type="radio" name="rnc-duplicates" checked={duplicateMode === 'update'} onChange={() => setDuplicateMode('update')} /> Actualizar duplicados</label>
                <label><input type="radio" name="rnc-duplicates" checked={duplicateMode === 'replace'} onChange={() => setDuplicateMode('replace')} /> Reemplazar base completa antes de importar</label>
              </div>
              <label className="rnc-check"><input type="checkbox" checked={clearBeforeImport} onChange={(event) => setClearBeforeImport(event.target.checked)} /> Limpiar base antes de importar</label>
              {isAnalyzing && <div className="rnc-processing">Analizando archivo...</div>}
              {isImporting && <div className="rnc-processing">Procesando archivo...</div>}
              <div className="rnc-progress">
                <span style={{ width: `${progress.percent || 0}%` }} />
                <strong>{progress.percent || 0}%</strong>
              </div>
              <div className="rnc-import-summary">
                <article><span>Procesadas</span><strong>{progress.processed}</strong></article>
                <article><span>Importadas</span><strong>{progress.imported}</strong></article>
                <article><span>Actualizadas</span><strong>{progress.updated}</strong></article>
                <article><span>Errores</span><strong>{progress.errors}</strong></article>
                <article><span>Omitidas</span><strong>{progress.skipped}</strong></article>
              </div>
              {progress.errorRows?.length > 0 && (
                <div className="rnc-error-list">
                  {progress.errorRows.map((row) => <p key={`${row.row}-${row.error}`}>Fila {row.row}: {row.error}</p>)}
                </div>
              )}
            </div>
          </RncModal>
        )}

        {draft && (
          <RncModal
            title={draft.rnc ? 'Editar RNC' : 'Nuevo RNC'}
            onClose={() => setDraft(null)}
            footer={(
              <>
                <button type="button" onClick={() => setDraft(null)}>Cancelar</button>
                <button type="button" className="accounting-primary-button" onClick={saveDraft}>Guardar</button>
              </>
            )}
          >
            <div className="rnc-form-grid">
              <label>RNC<input value={draft.rnc} onChange={(event) => setDraft((current) => ({ ...current, rnc: normalizeRnc(event.target.value) }))} /></label>
              <label className="rnc-span-2">Razon social<input value={draft.razonSocial} onChange={(event) => setDraft((current) => ({ ...current, razonSocial: event.target.value }))} /></label>
              <label className="rnc-span-2">Actividad economica<input value={draft.actividadEconomica} onChange={(event) => setDraft((current) => ({ ...current, actividadEconomica: event.target.value }))} /></label>
              <label>Fecha inicio<input value={draft.fechaInicioOperaciones} onChange={(event) => setDraft((current) => ({ ...current, fechaInicioOperaciones: event.target.value }))} /></label>
              <label>Estado<input value={draft.estado} onChange={(event) => setDraft((current) => ({ ...current, estado: event.target.value }))} /></label>
              <label>Regimen de pago<input value={draft.regimenPago} onChange={(event) => setDraft((current) => ({ ...current, regimenPago: event.target.value }))} /></label>
            </div>
          </RncModal>
        )}
      </section>
    </ModulePageLayout>
  )
}
