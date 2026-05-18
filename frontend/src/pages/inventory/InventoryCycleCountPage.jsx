import { useMemo, useState } from 'react'
import { Ban, CheckCircle2, Download, FilePlus2, Printer, Save, X } from 'lucide-react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import {
  CYCLE_COUNTS_KEY,
  applyCycleCount,
  nextCycleCountNumber,
  selectCycleProducts,
} from '../../utils/cycleCount.js'
import { cleanText, readProducts, readStorageArray, toNumber, writeStorageArray } from '../../utils/alertsEngine.js'
import './InventoryModulePages.css'
import './InventoryCycleCountPage.css'

function formatNumber(value) {
  return Number(value || 0).toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function makeDraft(records) {
  const products = readProducts()
  return {
    id: `cycle-${Date.now()}`,
    number: nextCycleCountNumber(records),
    date: new Date().toISOString().slice(0, 10),
    warehouse: 'ALM-01',
    responsible: 'Administrador',
    criteria: 'Todos',
    criteriaValue: '',
    frequency: 'Mensual',
    status: 'Planificado',
    observations: '',
    lines: products.map((product) => ({
      code: product.code,
      name: product.name,
      category: product.category,
      supplierCode: product.supplierCode,
      supplierName: product.supplierName,
      systemStock: product.stock,
      physicalStock: product.stock,
      lineStatus: 'Pendiente',
    })),
  }
}

function StatusBadge({ value }) {
  return <span className="inventory-badge is-info">{value || 'N/D'}</span>
}

export default function InventoryCycleCountPage({ controls, onAction, searchValue = '', onSearchChange }) {
  const [records, setRecords] = useState(() => readStorageArray(CYCLE_COUNTS_KEY))
  const [selectedNumber, setSelectedNumber] = useState('')
  const [draft, setDraft] = useState(null)
  const [message, setMessage] = useState('')
  const products = readProducts()
  const selected = records.find((record) => record.number === selectedNumber)
  const categories = Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort()
  const suppliers = Array.from(new Set(products.map((product) => product.supplierCode || product.supplierName).filter(Boolean))).sort()

  const filtered = useMemo(() => {
    const query = cleanText(searchValue)
    return records.filter((record) => !query || [record.number, record.warehouse, record.responsible, record.criteria, record.status].some((value) => cleanText(value).includes(query)))
  }, [records, searchValue])

  const saveRecords = (nextRecords) => {
    setRecords(nextRecords)
    writeStorageArray(CYCLE_COUNTS_KEY, nextRecords)
  }

  const refreshLines = () => {
    setDraft((current) => {
      const selectedProducts = selectCycleProducts(current.criteria, current.criteriaValue)
      return {
        ...current,
        lines: selectedProducts.map((product) => ({
          code: product.code,
          name: product.name,
          category: product.category,
          supplierCode: product.supplierCode,
          supplierName: product.supplierName,
          systemStock: product.stock,
          physicalStock: product.stock,
          lineStatus: 'Pendiente',
        })),
      }
    })
  }

  const saveDraft = () => {
    const normalized = {
      ...draft,
      lines: (draft.lines || []).map((line) => ({
        ...line,
        systemStock: toNumber(line.systemStock),
        physicalStock: toNumber(line.physicalStock),
        difference: toNumber(line.physicalStock) - toNumber(line.systemStock),
        lineStatus: toNumber(line.physicalStock) === toNumber(line.systemStock) ? 'Contado' : 'Diferencia',
      })),
      updatedAt: new Date().toISOString(),
    }
    const exists = records.some((record) => record.number === normalized.number)
    const nextRecords = exists
      ? records.map((record) => record.number === normalized.number ? normalized : record)
      : [normalized, ...records]
    saveRecords(nextRecords)
    setSelectedNumber(normalized.number)
    setDraft(null)
    setMessage('Conteo ciclico guardado correctamente.')
  }

  const applySelected = () => {
    if (!selected || ['Ajustado', 'Anulado'].includes(selected.status)) return
    applyCycleCount(selected)
    const nextRecords = records.map((record) => record.number === selected.number ? { ...record, status: 'Ajustado', appliedAt: new Date().toISOString() } : record)
    saveRecords(nextRecords)
    setMessage('Conteo ciclico aplicado y ajuste registrado.')
    onAction?.('Conteo ciclico aplicado')
  }

  const voidSelected = () => {
    if (!selected || selected.status === 'Ajustado') return
    saveRecords(records.map((record) => record.number === selected.number ? { ...record, status: 'Anulado', updatedAt: new Date().toISOString() } : record))
  }

  const exportRows = () => {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'invefat_cycle_counts.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ModulePageLayout
      title="Conteo ciclico"
      moduleLabel="Inventario"
      description="Planifica conteos periodicos por categoria, proveedor, rotacion o stock bajo."
      breadcrumb={['Inventario', 'Conteo ciclico']}
      searchValue={searchValue}
      searchPlaceholder="Buscar conteo ciclico"
      onSearchChange={onSearchChange}
      actions={[
        { id: 'new', label: 'Nuevo plan', icon: FilePlus2, variant: 'primary', onClick: () => setDraft(makeDraft(records)) },
        { id: 'edit', label: 'Editar', icon: Save, disabled: !selected || ['Ajustado', 'Anulado'].includes(selected.status), onClick: () => selected && setDraft({ ...selected }) },
        { id: 'apply', label: 'Aplicar ajuste', icon: CheckCircle2, disabled: !selected || ['Ajustado', 'Anulado'].includes(selected.status), onClick: applySelected },
        { id: 'void', label: 'Anular', icon: Ban, disabled: !selected || selected.status === 'Ajustado' || selected.status === 'Anulado', onClick: voidSelected },
        { id: 'export', label: 'Exportar', icon: Download, onClick: exportRows },
        { id: 'print', label: 'Imprimir', icon: Printer, onClick: () => window.print() },
        { id: 'exit', label: 'Salir', icon: X, onClick: controls?.onClose },
      ]}
      windowState={controls?.windowState}
      onClose={controls?.onClose}
      onMinimize={controls?.onMinimize}
      onRestore={controls?.onRestore}
      onMaximize={controls?.onMaximize}
    >
      <div className="inventory-module-page">
        {message && <div className="inventory-message">{message}</div>}
        <section className="inventory-table-wrap">
          <table className="inventory-table">
            <thead><tr><th>Numero</th><th>Fecha</th><th>Almacen</th><th>Responsable</th><th>Criterio</th><th>Frecuencia</th><th>Lineas</th><th>Diferencias</th><th>Estado</th></tr></thead>
            <tbody>
              {filtered.map((record) => {
                const differences = (record.lines || []).filter((line) => toNumber(line.physicalStock) !== toNumber(line.systemStock)).length
                return (
                  <tr key={record.number} className={selectedNumber === record.number ? 'is-selected' : ''} onClick={() => setSelectedNumber(record.number)}>
                    <td>{record.number}</td>
                    <td>{record.date}</td>
                    <td>{record.warehouse}</td>
                    <td>{record.responsible}</td>
                    <td>{record.criteria}</td>
                    <td>{record.frequency}</td>
                    <td>{record.lines?.length || 0}</td>
                    <td>{differences}</td>
                    <td><StatusBadge value={record.status} /></td>
                  </tr>
                )
              })}
              {filtered.length === 0 && <tr><td colSpan="9" className="inventory-empty-state">No hay conteos ciclicos registrados.</td></tr>}
            </tbody>
          </table>
        </section>

        {draft && (
          <div className="cycle-modal-backdrop">
            <section className="cycle-modal" role="dialog" aria-modal="true">
              <header>
                <div>
                  <span>Inventario</span>
                  <h2>{draft.number}</h2>
                </div>
                <button type="button" title="Cerrar" onClick={() => setDraft(null)}><X size={16} /></button>
              </header>
              <div className="cycle-modal-body">
                <div className="inventory-form-grid">
                  <label>Numero<input value={draft.number} onChange={(event) => setDraft((current) => ({ ...current, number: event.target.value }))} /></label>
                  <label>Fecha<input type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></label>
                  <label>Almacen<input value={draft.warehouse} onChange={(event) => setDraft((current) => ({ ...current, warehouse: event.target.value }))} /></label>
                  <label>Responsable<input value={draft.responsible} onChange={(event) => setDraft((current) => ({ ...current, responsible: event.target.value }))} /></label>
                  <label>Criterio<select value={draft.criteria} onChange={(event) => setDraft((current) => ({ ...current, criteria: event.target.value, criteriaValue: '' }))}><option>Todos</option><option>Categoria</option><option>Proveedor</option><option>Stock bajo</option></select></label>
                  <label>Valor<select value={draft.criteriaValue} onChange={(event) => setDraft((current) => ({ ...current, criteriaValue: event.target.value }))}><option value="">Todos</option>{draft.criteria === 'Categoria' && categories.map((item) => <option key={item}>{item}</option>)}{draft.criteria === 'Proveedor' && suppliers.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label>Frecuencia<select value={draft.frequency} onChange={(event) => setDraft((current) => ({ ...current, frequency: event.target.value }))}><option>Diaria</option><option>Semanal</option><option>Mensual</option><option>Trimestral</option></select></label>
                  <label>Estado<select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}><option>Planificado</option><option>En proceso</option><option>Contado</option><option>Ajustado</option><option>Anulado</option></select></label>
                  <label className="inventory-span-full">Observaciones<textarea value={draft.observations} onChange={(event) => setDraft((current) => ({ ...current, observations: event.target.value }))} /></label>
                </div>
                <button type="button" className="inventory-small-button cycle-refresh-lines" onClick={refreshLines}>Cargar productos por criterio</button>
                <div className="inventory-table-wrap">
                  <table className="inventory-table is-wide">
                    <thead><tr><th>Producto</th><th>Stock sistema</th><th>Cantidad fisica</th><th>Diferencia</th><th>Estado linea</th><th>Accion sugerida</th></tr></thead>
                    <tbody>
                      {(draft.lines || []).map((line) => {
                        const difference = toNumber(line.physicalStock) - toNumber(line.systemStock)
                        return (
                          <tr key={line.code}>
                            <td><strong>{line.name}</strong><small>{line.code}</small></td>
                            <td>{formatNumber(line.systemStock)}</td>
                            <td><input type="number" value={line.physicalStock} onChange={(event) => setDraft((current) => ({ ...current, lines: current.lines.map((row) => row.code === line.code ? { ...row, physicalStock: event.target.value } : row) }))} /></td>
                            <td>{formatNumber(difference)}</td>
                            <td>{difference === 0 ? 'Contado' : 'Diferencia'}</td>
                            <td>{difference === 0 ? 'Sin ajuste' : difference > 0 ? 'Entrada por diferencia' : 'Salida por diferencia'}</td>
                          </tr>
                        )
                      })}
                      {(draft.lines || []).length === 0 && <tr><td colSpan="6" className="inventory-empty-state">No hay productos seleccionados.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              <footer>
                <button type="button" onClick={() => setDraft(null)}>Cancelar</button>
                <button type="button" className="cycle-primary" onClick={saveDraft}><Save size={15} /> Guardar conteo</button>
              </footer>
            </section>
          </div>
        )}
      </div>
    </ModulePageLayout>
  )
}
