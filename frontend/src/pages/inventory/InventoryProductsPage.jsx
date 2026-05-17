import { Ban, Download, Edit3, FilePlus2, History, PackageSearch, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'

const products = [
  { code: 'PRD-1020', name: 'Aceite premium 1L', category: 'Lubricantes', stock: 148, price: 'RD$ 385.00', status: 'Activo' },
  { code: 'PRD-1104', name: 'Filtro industrial', category: 'Repuestos', stock: 34, price: 'RD$ 890.00', status: 'Activo' },
  { code: 'PRD-1322', name: 'Empaque sellado', category: 'Materiales', stock: 12, price: 'RD$ 125.00', status: 'Bajo stock' },
  { code: 'PRD-1405', name: 'Valvula acero', category: 'Repuestos', stock: 0, price: 'RD$ 760.00', status: 'Sin stock' },
]

function badgeClass(status) {
  if (status === 'Activo') return 'erp-badge is-success'
  if (status === 'Bajo stock') return 'erp-badge is-warning'
  return 'erp-badge is-danger'
}

export default function InventoryProductsPage({ controls, onAction, searchValue = '', onSearchChange }) {
  const search = searchValue
  const setSearch = onSearchChange || (() => {})
  const [categoryFilter, setCategoryFilter] = useState('Todas')

  const filteredProducts = useMemo(() => {
    const text = search.toLowerCase().trim()

    return products.filter((product) => {
      const matchesCategory = categoryFilter === 'Todas' || product.category === categoryFilter
      const matchesText = !text || [product.code, product.name, product.category, product.status].some((value) => value.toLowerCase().includes(text))
      return matchesCategory && matchesText
    })
  }, [search, categoryFilter])

  const notify = (message) => onAction?.(message)

  return (
    <ModulePageLayout
      title="Productos"
      moduleLabel="Inventario"
      description="Catalogo maestro de productos con precios, categorias, stock y acceso directo al Kardex."
      breadcrumb={['Inventario', 'Productos']}
      searchValue={search}
      searchPlaceholder="Buscar por codigo, nombre, categoria o estado"
      onSearchChange={setSearch}
      actions={[
        { id: 'new', label: 'Crear producto', icon: FilePlus2, variant: 'primary', onClick: () => notify('Formulario listo para crear producto') },
        { id: 'save', label: 'Guardar', icon: Save, onClick: () => notify('Producto guardado') },
        { id: 'edit', label: 'Editar', icon: Edit3, onClick: () => notify('Producto listo para edicion') },
        { id: 'inactive', label: 'Inactivar', icon: Ban, variant: 'danger', onClick: () => notify('Producto marcado como inactivo') },
        { id: 'stock', label: 'Ver stock', icon: PackageSearch, onClick: () => notify('Consulta de stock abierta') },
        { id: 'kardex', label: 'Kardex', icon: History, onClick: () => notify('Movimientos Kardex filtrados') },
        { id: 'export', label: 'Exportar', icon: Download, onClick: () => notify('Exportando catalogo de productos') },
      ]}
      statusCards={[
        { label: 'Productos activos', value: '1,248', detail: 'catalogo maestro' },
        { label: 'Bajo stock', value: '18', detail: 'requieren reposicion' },
        { label: 'Sin stock', value: '6', detail: 'bloquean ventas' },
        { label: 'Valor inventario', value: 'RD$ 4.8M', detail: 'costo estimado' },
      ]}
      sidePanel={(
        <>
          <section className="erp-panel">
            <h3>Resumen de stock</h3>
            <dl className="erp-detail-list">
              <div className="erp-detail-row"><span>Disponible</span><strong>148 uds</strong></div>
              <div className="erp-detail-row"><span>Comprometido</span><strong>22 uds</strong></div>
              <div className="erp-detail-row"><span>En compra</span><strong>180 uds</strong></div>
              <div className="erp-detail-row"><span>Minimo</span><strong>40 uds</strong></div>
            </dl>
          </section>
          <section className="erp-panel">
            <h3>Acciones relacionadas</h3>
            <ul className="erp-note-list">
              <li>Ver movimientos Kardex del producto seleccionado.</li>
              <li>Consultar stock por almacen antes de facturar.</li>
              <li>Revisar lista de precios activa.</li>
            </ul>
          </section>
        </>
      )}
      {...controls}
    >
      <div className="erp-data-grid">
        <section className="erp-panel">
          <h2>Filtros de producto</h2>
          <div className="erp-filter-grid">
            <label>
              Codigo
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="PRD-1020" />
            </label>
            <label>
              Nombre
              <input onChange={(event) => setSearch(event.target.value)} placeholder="Nombre del producto" />
            </label>
            <label>
              Categoria
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option>Todas</option>
                <option>Lubricantes</option>
                <option>Repuestos</option>
                <option>Materiales</option>
              </select>
            </label>
            <label>
              Estado
              <select onChange={(event) => setSearch(event.target.value)}>
                <option value="">Todos</option>
                <option>Activo</option>
                <option>Bajo stock</option>
                <option>Sin stock</option>
              </select>
            </label>
          </div>
        </section>

        <section className="erp-panel">
          <h2>Tabla de productos</h2>
          <div className="erp-table-wrap">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Producto</th>
                  <th>Categoria</th>
                  <th>Stock</th>
                  <th>Precio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.code}>
                    <td>{product.code}</td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{product.stock}</td>
                    <td>{product.price}</td>
                    <td><span className={badgeClass(product.status)}>{product.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="erp-panel">
          <h2>Formulario de producto</h2>
          <div className="erp-form-grid">
            <label>
              Codigo
              <input defaultValue="PRD-1020" />
            </label>
            <label>
              Nombre
              <input defaultValue="Aceite premium 1L" />
            </label>
            <label>
              Categoria
              <select defaultValue="Lubricantes">
                <option>Lubricantes</option>
                <option>Repuestos</option>
                <option>Materiales</option>
              </select>
            </label>
            <label>
              Marca
              <input defaultValue="Linea Pro" />
            </label>
            <label>
              Unidad
              <select defaultValue="Unidad">
                <option>Unidad</option>
                <option>Caja</option>
                <option>Galon</option>
              </select>
            </label>
            <label>
              Precio venta
              <input defaultValue="385.00" />
            </label>
            <label>
              Stock minimo
              <input type="number" defaultValue="40" />
            </label>
            <label>
              Codigo de barra
              <input defaultValue="7460001020007" />
            </label>
          </div>
        </section>
      </div>
    </ModulePageLayout>
  )
}
