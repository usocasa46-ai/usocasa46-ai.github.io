export const defaultPayrollSettings = {
  general: {
    currency: 'RD$',
    payFrequency: 'mensual',
    semiMonthlyDivisor: 2,
    averageMonthDays: 30,
    workHoursPerDay: 8,
    workDaysPerMonth: 23,
  },
  tss: {
    afpEmployee: 0,
    afpEmployer: 0,
    sfsEmployee: 0,
    sfsEmployer: 0,
    laborRisk: 0,
    infotep: 0,
    otherEmployerContributions: 0,
    employeeCap: 0,
    employerCap: 0,
  },
  isr: {
    enabled: false,
    monthlyExemption: 0,
    brackets: [],
  },
  vacations: {
    rules: [],
    monthlyAccumulation: 0,
    paidVacation: true,
  },
  overtime: {
    types: [
      { name: 'Regular', factor: 1 },
    ],
  },
  discounts: {
    absenceDailyMultiplier: 1,
  },
  bonuses: {
    defaultTaxable: true,
  },
}

export function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export function mergePayrollSettings(settings = {}) {
  return {
    ...defaultPayrollSettings,
    ...settings,
    general: { ...defaultPayrollSettings.general, ...(settings.general || {}) },
    tss: { ...defaultPayrollSettings.tss, ...(settings.tss || {}) },
    isr: { ...defaultPayrollSettings.isr, ...(settings.isr || {}) },
    vacations: { ...defaultPayrollSettings.vacations, ...(settings.vacations || {}) },
    overtime: { ...defaultPayrollSettings.overtime, ...(settings.overtime || {}) },
    discounts: { ...defaultPayrollSettings.discounts, ...(settings.discounts || {}) },
    bonuses: { ...defaultPayrollSettings.bonuses, ...(settings.bonuses || {}) },
  }
}

function capBase(amount, cap) {
  const numericCap = toNumber(cap)
  return numericCap > 0 ? Math.min(toNumber(amount), numericCap) : toNumber(amount)
}

function calcPercent(base, percent) {
  return toNumber(base) * (toNumber(percent) / 100)
}

function payPeriodsForType(type, settings) {
  if (String(type || '').toLowerCase().includes('quinc')) return toNumber(settings.general.semiMonthlyDivisor) || 2
  if (String(type || '').toLowerCase().includes('seman')) return 4
  return 1
}

export function calculatePeriodSalary(monthlySalary, payrollType, settings) {
  const divisor = payPeriodsForType(payrollType, settings)
  return toNumber(monthlySalary) / divisor
}

export function calculateIsr(taxableIncome, settings) {
  if (!settings.isr.enabled) {
    return { amount: 0, details: [{ label: 'ISR', formula: 'ISR desactivado en configuracion', base: taxableIncome, rate: 0, amount: 0 }] }
  }

  const taxableAfterExemption = Math.max(toNumber(taxableIncome) - toNumber(settings.isr.monthlyExemption), 0)
  const sortedBrackets = [...(settings.isr.brackets || [])]
    .map((bracket) => ({
      from: toNumber(bracket.from),
      to: toNumber(bracket.to),
      percent: toNumber(bracket.percent),
      fixedAmount: toNumber(bracket.fixedAmount),
      label: bracket.label || 'Tramo ISR',
    }))
    .sort((a, b) => a.from - b.from)

  const activeBracket = sortedBrackets.find((bracket) => (
    taxableAfterExemption >= bracket.from &&
    (bracket.to <= 0 || taxableAfterExemption <= bracket.to)
  ))

  if (!activeBracket) {
    return { amount: 0, details: [{ label: 'ISR', formula: 'Sin tramo aplicable configurado', base: taxableAfterExemption, rate: 0, amount: 0 }] }
  }

  const excess = Math.max(taxableAfterExemption - activeBracket.from, 0)
  const variableAmount = calcPercent(excess, activeBracket.percent)
  const amount = activeBracket.fixedAmount + variableAmount

  return {
    amount,
    details: [{
      label: activeBracket.label,
      formula: 'Monto fijo + excedente por porcentaje configurado',
      base: excess,
      rate: activeBracket.percent,
      amount,
    }],
  }
}

export function calculateEmployeePayroll({
  employee,
  payrollType = 'mensual',
  settings: rawSettings = {},
  overtime = [],
  absences = [],
  bonuses = [],
  otherDiscounts = [],
} = {}) {
  const settings = mergePayrollSettings(rawSettings)
  const monthlySalary = toNumber(employee?.monthlySalary || employee?.salary || employee?.salarioMensual)
  const salaryPeriod = calculatePeriodSalary(monthlySalary, payrollType, settings)
  const hourlyRate = monthlySalary / Math.max(toNumber(settings.general.workDaysPerMonth) * toNumber(settings.general.workHoursPerDay), 1)
  const dailyRate = monthlySalary / Math.max(toNumber(settings.general.averageMonthDays), 1)

  const overtimeTotal = overtime.reduce((sum, item) => {
    const factor = toNumber(item.factor)
    const hours = toNumber(item.hours || item.cantidadHoras)
    return sum + (hourlyRate * factor * hours)
  }, 0)

  const bonusTotal = bonuses.reduce((sum, item) => sum + toNumber(item.amount || item.monto), 0)
  const unpaidAbsenceDays = absences
    .filter((item) => item.paid === false || item.paid === 'no' || item.pagado === false)
    .reduce((sum, item) => sum + toNumber(item.days || item.dias), 0)
  const absenceDiscount = unpaidAbsenceDays * dailyRate * toNumber(settings.discounts.absenceDailyMultiplier)
  const manualDiscounts = otherDiscounts.reduce((sum, item) => sum + toNumber(item.amount || item.monto), 0)
  const taxableIncome = Math.max(salaryPeriod + overtimeTotal + bonusTotal - absenceDiscount, 0)
  const employeeCapBase = capBase(taxableIncome, settings.tss.employeeCap)
  const employerCapBase = capBase(taxableIncome, settings.tss.employerCap)

  const afpEmployee = calcPercent(employeeCapBase, settings.tss.afpEmployee)
  const sfsEmployee = calcPercent(employeeCapBase, settings.tss.sfsEmployee)
  const afpEmployer = calcPercent(employerCapBase, settings.tss.afpEmployer)
  const sfsEmployer = calcPercent(employerCapBase, settings.tss.sfsEmployer)
  const laborRisk = calcPercent(employerCapBase, settings.tss.laborRisk)
  const infotep = calcPercent(employerCapBase, settings.tss.infotep)
  const otherEmployerContributions = calcPercent(employerCapBase, settings.tss.otherEmployerContributions)
  const isr = calculateIsr(taxableIncome, settings)

  const employeeDeductions = afpEmployee + sfsEmployee + isr.amount + absenceDiscount + manualDiscounts
  const employerContributions = afpEmployer + sfsEmployer + laborRisk + infotep + otherEmployerContributions
  const netPay = Math.max(salaryPeriod + overtimeTotal + bonusTotal - employeeDeductions, 0)

  return {
    employeeId: employee?.id,
    employeeCode: employee?.code,
    employeeName: `${employee?.firstName || employee?.name || ''} ${employee?.lastName || ''}`.trim(),
    department: employee?.department || '',
    position: employee?.position || '',
    monthlySalary,
    salaryPeriod,
    baseSalary: salaryPeriod,
    overtimeTotal,
    bonusTotal,
    taxableIncome,
    afpEmployee,
    sfsEmployee,
    isr: isr.amount,
    absenceDiscount,
    manualDiscounts,
    totalIncome: salaryPeriod + overtimeTotal + bonusTotal,
    totalDeductions: employeeDeductions,
    netPay,
    employerContributions,
    employerDetails: {
      afpEmployer,
      sfsEmployer,
      laborRisk,
      infotep,
      otherEmployerContributions,
    },
    formulas: [
      { label: 'Salario periodo', formula: 'Salario mensual / divisor de frecuencia configurado', base: monthlySalary, rate: payPeriodsForType(payrollType, settings), amount: salaryPeriod },
      { label: 'AFP empleado', formula: 'Base TSS empleado x porcentaje configurado', base: employeeCapBase, rate: settings.tss.afpEmployee, amount: afpEmployee },
      { label: 'SFS empleado', formula: 'Base TSS empleado x porcentaje configurado', base: employeeCapBase, rate: settings.tss.sfsEmployee, amount: sfsEmployee },
      ...isr.details,
      { label: 'Neto a pagar', formula: 'Ingresos - descuentos empleado', base: salaryPeriod + overtimeTotal + bonusTotal, rate: 0, amount: netPay },
    ],
  }
}

export function calculatePayroll({ employees = [], payrollType = 'mensual', settings = {}, overtime = [], absences = [] } = {}) {
  const lines = employees.map((employee) => calculateEmployeePayroll({
    employee,
    payrollType,
    settings,
    overtime: overtime.filter((item) => item.employeeId === employee.id || item.employeeCode === employee.code),
    absences: absences.filter((item) => item.employeeId === employee.id || item.employeeCode === employee.code),
  }))

  return {
    lines,
    totals: lines.reduce((totals, line) => ({
      totalIncome: totals.totalIncome + line.totalIncome,
      totalDeductions: totals.totalDeductions + line.totalDeductions,
      totalNet: totals.totalNet + line.netPay,
      employerContributions: totals.employerContributions + line.employerContributions,
    }), { totalIncome: 0, totalDeductions: 0, totalNet: 0, employerContributions: 0 }),
  }
}
