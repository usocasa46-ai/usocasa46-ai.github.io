import { Save } from 'lucide-react'
import { useState } from 'react'
import ModulePageLayout from '../shared/ModulePageLayout.jsx'

export default function SettingsGeneralPage({ controls, onAction, searchValue = '', onSearchChange }) {
  const [currency, setCurrency] = useState('RD$')

  return (
    <ModulePageLayout
      title="Parametros generales"
      moduleLabel="Configuracion"
      description="Base de configuracion del sistema: empresa, moneda, impuestos, numeracion, PDF, identidad visual y parametros operativos."
      breadcrumb={['Configuracion', 'Parametros generales']}
      searchValue={searchValue}
      searchPlaceholder="Buscar parametro de configuracion"
      onSearchChange={onSearchChange}
      actions={[
        { id: 'save', label: 'Guardar configuracion', icon: Save, variant: 'primary', onClick: () => onAction?.('Configuracion guardada') },
      ]}
      statusCards={[
        { label: 'Empresa', value: 'Activa', detail: 'INVE-FAT SYSTEM' },
        { label: 'Moneda', value: currency, detail: 'predeterminada' },
        { label: 'Impuestos', value: 'ITBIS', detail: 'configurable' },
        { label: 'PDF', value: 'Base', detail: 'formato activo' },
      ]}
      sidePanel={(
        <>
          <section className="erp-panel">
            <h3>Estructura lista</h3>
            <ul className="erp-note-list">
              <li>Datos de empresa, sucursales, moneda e impuestos.</li>
              <li>Numeracion de documentos y formatos PDF.</li>
              <li>Logo, colores y parametros generales.</li>
            </ul>
          </section>
          <section className="erp-panel">
            <h3>Credencial de empresa</h3>
            <dl className="erp-detail-list">
              <div className="erp-detail-row"><span>Empresa</span><strong>EMPRESA</strong></div>
              <div className="erp-detail-row"><span>Auditoria</span><strong>Activa</strong></div>
              <div className="erp-detail-row"><span>Sesion</span><strong>Validada</strong></div>
            </dl>
          </section>
        </>
      )}
      {...controls}
    >
      <div className="erp-data-grid">
        <section className="erp-panel">
          <h2>Datos de empresa</h2>
          <div className="erp-form-grid">
            <label>
              Nombre comercial
              <input defaultValue="INVE-FAT SYSTEM" />
            </label>
            <label>
              Razon social
              <input defaultValue="Empresa Principal" />
            </label>
            <label>
              Sucursal predeterminada
              <input defaultValue="Principal" />
            </label>
            <label>
              Moneda
              <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                <option>RD$</option>
                <option>USD</option>
                <option>EUR</option>
              </select>
            </label>
            <label>
              Impuesto principal
              <input defaultValue="ITBIS 18%" />
            </label>
            <label>
              Numeracion
              <input defaultValue="Automatica por documento" />
            </label>
          </div>
        </section>

        <section className="erp-panel">
          <h2>Documento y PDF</h2>
          <div className="erp-form-grid">
            <label>
              Factura
              <input defaultValue="FAC-{000000}" />
            </label>
            <label>
              Orden de compra
              <input defaultValue="OC-{000000}" />
            </label>
            <label>
              Recepcion
              <input defaultValue="REC-{000000}" />
            </label>
            <label>
              Formato PDF
              <select defaultValue="Empresarial">
                <option>Empresarial</option>
                <option>Compacto</option>
                <option>Detallado</option>
              </select>
            </label>
          </div>
        </section>
      </div>
    </ModulePageLayout>
  )
}
