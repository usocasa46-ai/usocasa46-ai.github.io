import { Bell, CheckCheck, Clock3, Eye, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getAlerts, nowIso, readStorageArray, writeStorageArray } from '../utils/alertsEngine.js'
import './NotificationBell.css'

const NOTIFICATIONS_KEY = 'invefat_notifications'

const pageByAlert = {
  'Stock bajo': 'system-alerts',
  'Stock agotado': 'system-alerts',
  'Producto sin proveedor': 'system-alerts',
  'Producto alta rotacion': 'inventory-rotation',
  'Producto baja rotacion': 'inventory-rotation',
  'Producto sin movimiento': 'inventory-rotation',
  'Producto pendiente de conteo ciclico': 'inventory-cycle-count',
  'Orden de compra pendiente': 'purchase-orders',
  'Recepcion parcial': 'warehouse-receiving',
  'Factura pendiente de pago': 'purchase-payables',
  'Cliente con balance pendiente': 'sales-receivables',
}

function readNotifications() {
  return readStorageArray(NOTIFICATIONS_KEY)
}

function normalizeNotification(item) {
  return {
    id: item.id,
    titulo: item.titulo || item.title || 'Notificacion',
    descripcion: item.descripcion || item.description || '',
    fecha: item.fecha || item.date || nowIso(),
    prioridad: item.prioridad || item.priority || 'media',
    estado: item.estado || item.status || 'pendiente',
    referencia: item.referencia || item.reference || '',
    pageId: item.pageId || pageByAlert[item.tipo] || 'system-alerts',
    tipo: item.tipo || item.type || 'Actividad',
  }
}

function buildNotifications() {
  const saved = readNotifications().map(normalizeNotification)
  const savedById = new Map(saved.map((item) => [item.id, item]))
  const alertNotifications = getAlerts().slice(0, 40).map((alert) => normalizeNotification({
    id: `alert-${alert.id}`,
    titulo: alert.titulo,
    descripcion: alert.descripcion,
    fecha: alert.fecha,
    prioridad: alert.prioridad,
    estado: alert.estado === 'atendida' ? 'atendida' : savedById.get(`alert-${alert.id}`)?.estado || 'pendiente',
    referencia: alert.referencia,
    tipo: alert.tipo,
    pageId: pageByAlert[alert.tipo] || 'system-alerts',
  }))

  const quoteNotifications = readStorageArray('invefat_sales_quotes')
    .filter((quote) => {
      const validUntil = quote.validUntil || quote.expirationDate
      return validUntil && new Date(validUntil).getTime() < Date.now() && !['Convertida a factura', 'Anulada'].includes(quote.state || quote.status)
    })
    .map((quote) => normalizeNotification({
      id: `quote-vencida-${quote.number}`,
      titulo: `Cotizacion ${quote.number} vencida`,
      descripcion: `Cliente: ${quote.customer?.name || quote.customerName || quote.customer || 'N/D'}.`,
      fecha: quote.validUntil || nowIso(),
      prioridad: 'media',
      estado: savedById.get(`quote-vencida-${quote.number}`)?.estado || 'pendiente',
      referencia: quote.number,
      tipo: 'Cotizacion vencida',
      pageId: 'sales-quotes',
    }))

  const invoiceNotifications = readStorageArray('invefat_sales_invoices')
    .filter((invoice) => Number(invoice.balance || invoice.pendingBalance || invoice.totals?.balance || 0) > 0)
    .map((invoice) => normalizeNotification({
      id: `invoice-pendiente-${invoice.number}`,
      titulo: `Factura ${invoice.number} pendiente`,
      descripcion: `Cliente: ${invoice.customer?.name || invoice.customerName || invoice.customer || 'N/D'}.`,
      fecha: invoice.dueDate || invoice.date || nowIso(),
      prioridad: 'alta',
      estado: savedById.get(`invoice-pendiente-${invoice.number}`)?.estado || 'pendiente',
      referencia: invoice.number,
      tipo: 'Cuenta por cobrar',
      pageId: 'sales-receivables',
    }))

  const merged = [...alertNotifications, ...quoteNotifications, ...invoiceNotifications]
    .map((item) => ({ ...(savedById.get(item.id) || {}), ...item }))
    .sort((a, b) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime())

  writeStorageArray(NOTIFICATIONS_KEY, merged)
  return merged
}

export default function NotificationBell({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(() => buildNotifications())
  const wrapRef = useRef(null)

  useEffect(() => {
    const close = (event) => {
      if (wrapRef.current?.contains(event.target)) return
      setOpen(false)
    }

    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  useEffect(() => {
    const refresh = () => setNotifications(buildNotifications())
    window.addEventListener('storage', refresh)
    const timer = window.setInterval(refresh, 30000)
    return () => {
      window.removeEventListener('storage', refresh)
      window.clearInterval(timer)
    }
  }, [])

  const pendingCount = useMemo(() => (
    notifications.filter((item) => item.estado === 'pendiente').length
  ), [notifications])

  const persist = (nextNotifications) => {
    setNotifications(nextNotifications)
    writeStorageArray(NOTIFICATIONS_KEY, nextNotifications)
  }

  const markRead = (id) => {
    persist(notifications.map((item) => (
      item.id === id ? { ...item, estado: 'leida', readAt: nowIso() } : item
    )))
  }

  const markAllRead = () => {
    persist(notifications.map((item) => (
      item.estado === 'pendiente' ? { ...item, estado: 'leida', readAt: nowIso() } : item
    )))
  }

  const openNotification = (item) => {
    markRead(item.id)
    setOpen(false)
    onNavigate?.(item.pageId || 'system-alerts')
  }

  return (
    <div className="notification-bell-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`erp-top-icon notification-bell-button ${open ? 'is-open' : ''}`}
        onClick={(event) => {
          event.stopPropagation()
          setNotifications(buildNotifications())
          setOpen((current) => !current)
        }}
        title="Notificaciones"
        aria-label="Notificaciones"
      >
        <Bell size={17} />
        {pendingCount > 0 && <span className="notification-badge">{pendingCount > 99 ? '99+' : pendingCount}</span>}
      </button>

      {open && (
        <section className="notification-dropdown" aria-label="Centro de notificaciones">
          <header>
            <div>
              <span>Centro de alertas</span>
              <h3>Notificaciones</h3>
            </div>
            <button type="button" onClick={() => setOpen(false)} title="Cerrar">
              <X size={16} />
            </button>
          </header>

          <div className="notification-actions">
            <button type="button" onClick={markAllRead} disabled={pendingCount === 0}>
              <CheckCheck size={15} />
              Marcar todas como leidas
            </button>
          </div>

          <div className="notification-list">
            {notifications.length === 0 && (
              <div className="notification-empty">
                No hay notificaciones pendientes.
              </div>
            )}

            {notifications.slice(0, 12).map((item) => (
              <article className={`notification-item priority-${item.prioridad} state-${item.estado}`} key={item.id}>
                <div className="notification-item-main">
                  <strong>{item.titulo}</strong>
                  <p>{item.descripcion}</p>
                  <small><Clock3 size={13} /> {String(item.fecha || '').slice(0, 16).replace('T', ' ')}</small>
                </div>
                <div className="notification-item-actions">
                  <button type="button" onClick={() => openNotification(item)} title="Ver">
                    <Eye size={15} />
                  </button>
                  <button type="button" onClick={() => markRead(item.id)} title="Marcar como leida" disabled={item.estado !== 'pendiente'}>
                    <CheckCheck size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
