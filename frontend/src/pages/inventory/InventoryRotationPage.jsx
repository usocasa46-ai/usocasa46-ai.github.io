import { useMemo, useState } from 'react'
import { Download, Printer, RefreshCw, X } from 'lucide-react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'
import { analyzeInventoryRotation } from '../../utils/inventoryRotation.js'
import { cleanText, readStorageArray } from '../../utils/alertsEngine.js'
import './InventoryModulePages.css'

function formatNumber(value) {
  return Number(value || 0).toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function StatusBadge({ value }) {
  const clean = cleanText(value)
  const className = clean.includes('alta') ? 'is-success' : clean.includes('sin') || clean.includes('baja') ? 'is-warning' : 'is-info'
  return <span className={`inventory-badge ${className}`}>{value}</span>
}

export default function InventoryRotationPage({ controls, searchValue = '', onSearchChange }) {
  const [filters, setFilters] = useState({ category: 'Todos', rotation: 'Todos', warehouse: 'Todos', from: '', to: '' })
  const [rows, setRows] = useState(() => analyzeInventoryRotation())
  const categories = Array.from(new Set(rows.map((row) => row.category).filter(Boolean))).sort()
  const warehouses = Array.from(new Set(readStorageArray('invefat_inventory_movements').map((movement) => movement.warehouse).filter(Boolean))).sort()

  const refresh = () => setRows(analyzeInventoryRotation({ from: filters.from, to: filters.to, warehouse: filters.warehouse }))

  const filtered = useMemo(() => {
    const query = cleanText(searchValue)
    return rows.filter((row) => {
      const matchesQuery = !query || [row.code, row.name, row.category, row.rotation].some((value) => cleanText(value).includes(query))
      const matchesCategory = filters.category === 'Todos' || row.category === filters.category
      const matchesRotation = filters.rotation === 'Todos' || row.rotation === filters.rotation
      return matchesQuery && matchesCategory && matchesRotation
    })
  }, [filters.category, filters.rotation, rows, searchValue])

  const exportRows = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'invefat_inventory_rotation.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ModulePageLayout
      title="Rotacion de inventario"
      moduleLabel="Inventario"
      description="Analiza entradas, salidas, dias sin movimiento y recomendaciones de abastecimiento."
      breadcrumb={['Inventario', 'Rotacion de inventario']}
      searchValue={searchValue}
      searchPlaceholder="Buscar producto o categoria"
      onSearchChange={onSearchChange}
      actions={[
        { id: 'refresh', label: 'Actualizar', icon: RefreshCw, onClick: refresh },
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
        <section className="inventory-panel inventory-filter-panel">
          <div className="inventory-panel-heading">
            <div>
              <span>Analisis</span>
              <h2>Filtros de rotacion</h2>
            </div>
          </div>
          <div className="inventory-filter-grid">
            <label>Categoria<select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}><option>Todos</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>Rotacion<select value={filters.rotation} onChange={(event) => setFilters((current) => ({ ...current, rotation: event.target.value }))}><option>Todos</option><option>Alta</option><option>Media</option><option>Baja</option><option>Sin movimiento</option></select></label>
            <label>Almacen<select value={filters.warehouse} onChange={(event) => setFilters((current) => ({ ...current, warehouse: event.target.value }))}><option>Todos</option>{warehouses.map((warehouse) => <option key={warehouse}>{warehouse}</option>)}</select></label>
            <label>Fecha desde<input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></label>
            <label>Fecha hasta<input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></label>
          </div>
        </section>

        <section className="inventory-table-wrap">
          <table className="inventory-table is-wide">
            <thead><tr><th>Producto</th><th>Categoria</th><th>Stock</th><th>Salidas</th><th>Entradas</th><th>Ultimo movimiento</th><th>Dias sin movimiento</th><th>Rotacion</th><th>Recomendacion</th></tr></thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.code}>
                  <td><strong>{row.name}</strong><small>{row.code}</small></td>
                  <td>{row.category || 'N/D'}</td>
                  <td>{formatNumber(row.stock)}</td>
                  <td>{formatNumber(row.outgoing)}</td>
                  <td>{formatNumber(row.incoming)}</td>
                  <td>{row.lastMovement ? String(row.lastMovement).slice(0, 10) : 'N/D'}</td>
                  <td>{row.daysNoMovement ?? 'N/D'}</td>
                  <td><StatusBadge value={row.rotation} /></td>
                  <td>{row.recommendation}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="9" className="inventory-empty-state">No hay datos de rotacion para mostrar.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </ModulePageLayout>
  )
}
