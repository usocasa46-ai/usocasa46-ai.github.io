import { isSupabaseConfigured } from '../lib/supabaseClient.js'
import {
  appendSystemAudit,
  COMPANY_KEY_MAP,
  getCompanyData,
  getRawLocalStorageSnapshot,
  loadBackupLog,
  loadCompanies,
  loadCompanyLicenses,
  loadCompanyUsers,
  loadSupportAccess,
  loadSystemAudit,
  loadSystemPlans,
} from './companyStorage.js'

function nowIso() {
  return new Date().toISOString()
}

function safeName(value) {
  return String(value || 'sistema')
    .trim()
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function backupTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0')
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + '_' + [pad(date.getHours()), pad(date.getMinutes())].join('-')
}

function getCompanySnapshot(company) {
  const data = {}
  Object.entries(COMPANY_KEY_MAP).forEach(([baseKey]) => {
    data[baseKey] = getCompanyData(baseKey, [], company.companyCode)
  })

  const rawPrefix = `invefat_${String(company.companyCode || '').trim().toUpperCase()}_`
  const rawLocalStorage = Object.fromEntries(
    Object.entries(getRawLocalStorageSnapshot()).filter(([key]) => key.startsWith(rawPrefix)),
  )

  return {
    company: {
      id: company.id,
      companyCode: company.companyCode,
      nombreComercial: company.nombreComercial,
      razonSocial: company.razonSocial,
      rnc: company.rnc,
      plan: company.plan,
      estado: company.estado,
      modulosActivos: company.modulosActivos,
    },
    users: loadCompanyUsers(company),
    data,
    rawLocalStorage,
  }
}

function buildMetadata({ session, scope, company = null }) {
  const companies = loadCompanies()
  return {
    fechaBackup: nowIso(),
    generadoPor: session?.username || session?.currentUser || 'superadmin',
    versionSistema: 'INVE-FAT SYSTEM',
    modoDatos: isSupabaseConfigured() ? 'Supabase + localStorage fallback' : 'localStorage',
    alcance: scope,
    empresa: company ? {
      id: company.id,
      companyCode: company.companyCode,
      nombreComercial: company.nombreComercial,
    } : null,
    cantidadEmpresas: companies.length,
    advertencia: 'Respaldo generado antes de una accion destructiva. Conserve este archivo en un lugar seguro.',
  }
}

export function createCompleteSystemBackup({ session } = {}) {
  const companies = loadCompanies()
  const payload = {
    metadata: buildMetadata({ session, scope: 'sistema-completo' }),
    global: {
      companies,
      licenses: loadCompanyLicenses(),
      plans: loadSystemPlans(),
      audit: loadSystemAudit(),
      supportAccess: loadSupportAccess(),
      backupsLog: loadBackupLog(),
    },
    companies: companies.map((company) => getCompanySnapshot(company)),
    rawLocalStorage: getRawLocalStorageSnapshot(),
  }

  appendSystemAudit('backup completo generado', {
    usuario: session?.username || 'superadmin',
    descripcion: `${companies.length} empresas incluidas`,
  })

  return {
    filename: `invefat_backup_completo_${backupTimestamp()}.json`,
    payload,
  }
}

export function createSingleCompanyBackup(company, { session } = {}) {
  const payload = {
    metadata: buildMetadata({ session, scope: 'empresa', company }),
    company: getCompanySnapshot(company),
  }

  appendSystemAudit('backup empresa generado', {
    usuario: session?.username || 'superadmin',
    companyCode: company.companyCode,
    descripcion: company.nombreComercial,
  })

  return {
    filename: `invefat_backup_${safeName(company.companyCode)}_${backupTimestamp()}.json`,
    payload,
  }
}

export function markBackupDownloaded({ session, scope, company = null }) {
  appendSystemAudit(scope === 'empresa' ? 'backup empresa descargado' : 'backup completo descargado', {
    usuario: session?.username || 'superadmin',
    companyCode: company?.companyCode || '',
    descripcion: company ? company.nombreComercial : 'Backup completo descargado',
  })
}
