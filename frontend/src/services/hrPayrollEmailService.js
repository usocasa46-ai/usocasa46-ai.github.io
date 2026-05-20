import { makeId, nowIso, readArray, writeStorage } from '../utils/accountingEntries.js'

const EMAIL_QUEUE_KEY = 'invefat_payroll_email_queue'

export function getPayrollEmailQueue() {
  return readArray(EMAIL_QUEUE_KEY)
}

export function queuePaySlipEmail(employee, payslip) {
  const current = getPayrollEmailQueue()
  const record = {
    id: makeId('payroll-email'),
    employeeId: employee?.id || payslip?.employeeId || '',
    employeeName: payslip?.employeeName || `${employee?.firstName || employee?.name || ''} ${employee?.lastName || ''}`.trim(),
    email: employee?.workEmail || employee?.personalEmail || employee?.email || '',
    payslipId: payslip?.id || '',
    payrollNumber: payslip?.payrollNumber || '',
    period: payslip?.period || '',
    status: 'pendiente',
    message: 'Volante preparado para envio. Configure servicio de correo para envio automatico.',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    error: '',
  }
  writeStorage(EMAIL_QUEUE_KEY, [record, ...current])
  return record
}

export function markEmailAsSent(id) {
  const next = getPayrollEmailQueue().map((item) => (
    item.id === id ? { ...item, status: 'enviado', sentAt: nowIso(), updatedAt: nowIso(), error: '' } : item
  ))
  writeStorage(EMAIL_QUEUE_KEY, next)
  return next.find((item) => item.id === id) || null
}

export function markEmailAsError(id, error) {
  const next = getPayrollEmailQueue().map((item) => (
    item.id === id ? { ...item, status: 'error', error: String(error || ''), updatedAt: nowIso() } : item
  ))
  writeStorage(EMAIL_QUEUE_KEY, next)
  return next.find((item) => item.id === id) || null
}

export function resendPaySlip(id) {
  const next = getPayrollEmailQueue().map((item) => (
    item.id === id ? { ...item, status: 'pendiente', updatedAt: nowIso(), error: '' } : item
  ))
  writeStorage(EMAIL_QUEUE_KEY, next)
  return next.find((item) => item.id === id) || null
}
