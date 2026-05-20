import { mergePayrollSettings, toNumber } from './payrollCalculator.js'

function parseDate(value) {
  const date = value ? new Date(`${String(value).slice(0, 10)}T00:00:00`) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

function yearsBetween(from, to = new Date()) {
  const start = parseDate(from)
  if (!start) return 0
  let years = to.getFullYear() - start.getFullYear()
  const monthDiff = to.getMonth() - start.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && to.getDate() < start.getDate())) years -= 1
  return Math.max(years, 0)
}

function monthsBetween(from, to = new Date()) {
  const start = parseDate(from)
  if (!start) return 0
  const months = (to.getFullYear() - start.getFullYear()) * 12 + (to.getMonth() - start.getMonth())
  return Math.max(months, 0)
}

function daysForSeniority(years, settings) {
  const rules = Array.isArray(settings.vacations.rules) ? settings.vacations.rules : []
  const sortedRules = rules
    .map((rule) => ({
      minYears: toNumber(rule.minYears),
      maxYears: toNumber(rule.maxYears),
      days: toNumber(rule.days),
      label: rule.label || 'Regla de vacaciones',
    }))
    .sort((a, b) => a.minYears - b.minYears)

  const match = sortedRules.find((rule) => (
    years >= rule.minYears &&
    (rule.maxYears <= 0 || years <= rule.maxYears)
  ))

  return match?.days || 0
}

export function calculateVacationBalance(employee, vacations = [], rawSettings = {}) {
  const settings = mergePayrollSettings(rawSettings)
  const years = yearsBetween(employee?.hireDate || employee?.fechaIngreso)
  const months = monthsBetween(employee?.hireDate || employee?.fechaIngreso)
  const yearlyDays = daysForSeniority(years, settings)
  const monthlyAccumulation = toNumber(settings.vacations.monthlyAccumulation)
  const accrued = monthlyAccumulation > 0 ? months * monthlyAccumulation : yearlyDays
  const taken = vacations
    .filter((item) => (
      (item.employeeId === employee?.id || item.employeeCode === employee?.code) &&
      ['aprobada', 'disfrutada', 'completada'].includes(String(item.status || item.estado || '').toLowerCase())
    ))
    .reduce((sum, item) => sum + toNumber(item.days || item.dias || item.requestedDays), 0)

  return {
    employeeId: employee?.id,
    employeeCode: employee?.code,
    employeeName: `${employee?.firstName || employee?.name || ''} ${employee?.lastName || ''}`.trim(),
    hireDate: employee?.hireDate || employee?.fechaIngreso || '',
    seniorityYears: years,
    accruedDays: accrued,
    takenDays: taken,
    availableDays: Math.max(accrued - taken, 0),
    ruleDays: yearlyDays,
  }
}
