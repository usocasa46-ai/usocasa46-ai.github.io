const backupKeys = {
  products: 'inveFatInventoryProducts',
  customers: 'invefat_customers',
  invoices: 'invefat_sales_invoices',
  quotes: 'invefat_sales_quotes',
  settings: 'invefat_company_settings',
  users: 'inveFatUsers',
  usersAlias: 'invefat_users',
  roles: 'invefat_roles',
  rolesAlias: 'inveFatRoles',
  permissions: 'invefat_permissions',
  audit: 'invefat_audit_log',
  branches: 'invefat_branches',
  warehouses: 'invefat_warehouses',
}

function safeParse(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

export function createBackupPayload() {
  const settings = safeParse(backupKeys.settings, {})

  return {
    app: 'INVE-FAT SYSTEM',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      products: safeParse(backupKeys.products, []),
      customers: safeParse(backupKeys.customers, []),
      invoices: safeParse(backupKeys.invoices, []),
      quotes: safeParse(backupKeys.quotes, []),
      settings,
      users: safeParse(backupKeys.users, []),
      roles: safeParse(backupKeys.roles, safeParse(backupKeys.rolesAlias, [])),
      permissions: safeParse(backupKeys.permissions, {}),
      audit: safeParse(backupKeys.audit, []),
      branches: settings.branches || safeParse(backupKeys.branches, []),
      warehouses: settings.warehouses || safeParse(backupKeys.warehouses, []),
    },
  }
}

export function downloadBackup() {
  const payload = createBackupPayload()
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `INVE-FAT-RESPALDO-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return payload
}

export function importBackupPayload(payload) {
  if (!payload || payload.app !== 'INVE-FAT SYSTEM' || !payload.data) {
    throw new Error('El archivo no corresponde a un respaldo valido de INVE-FAT SYSTEM.')
  }

  const { data } = payload

  localStorage.setItem(backupKeys.products, JSON.stringify(data.products || []))
  localStorage.setItem(backupKeys.customers, JSON.stringify(data.customers || []))
  localStorage.setItem(backupKeys.invoices, JSON.stringify(data.invoices || []))
  localStorage.setItem(backupKeys.quotes, JSON.stringify(data.quotes || []))
  localStorage.setItem(backupKeys.settings, JSON.stringify(data.settings || {}))
  localStorage.setItem(backupKeys.users, JSON.stringify(data.users || []))
  localStorage.setItem(backupKeys.usersAlias, JSON.stringify(data.users || []))
  localStorage.setItem(backupKeys.roles, JSON.stringify(data.roles || []))
  localStorage.setItem(backupKeys.rolesAlias, JSON.stringify(data.roles || []))
  localStorage.setItem(backupKeys.permissions, JSON.stringify(data.permissions || {}))
  localStorage.setItem(backupKeys.audit, JSON.stringify(data.audit || []))

  return data
}

export function importBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(importBackupPayload(JSON.parse(String(reader.result || '{}'))))
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de respaldo.'))
    reader.readAsText(file)
  })
}
