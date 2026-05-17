export const SOFTWARE_LICENSES = [
  {
    licenseCode: 'INVE-FAT-DEMO-2026',
    activationKey: '1234-5678',
    plan: 'Demo',
    status: 'active',
    maxUsers: 5,
    expiresAt: null,
  },
  {
    licenseCode: 'INVE-FAT-PRO-2026',
    activationKey: 'PRO-2026',
    plan: 'Profesional',
    status: 'active',
    maxUsers: 25,
    expiresAt: null,
  },
]

function safeParse(value, fallback) {
  try {
    const parsed = value ? JSON.parse(value) : fallback
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export function loadActivatedCompany() {
  return safeParse(localStorage.getItem('inveFatActivatedCompany'), null)
}

export function saveActivatedCompany(company) {
  localStorage.setItem('inveFatActivatedCompany', JSON.stringify({
    ...company,
    activatedAt: company.activatedAt || new Date().toISOString(),
  }))
}

export function clearActivatedCompany() {
  localStorage.removeItem('inveFatActivatedCompany')
}

export function isCompanyActivated() {
  const company = loadActivatedCompany()
  return Boolean(company?.active && company?.companyName)
}

export function validateSoftwareLicense(licenseCode, activationKey) {
  const cleanLicense = String(licenseCode || '').trim().toUpperCase()
  const cleanKey = String(activationKey || '').trim().toUpperCase()

  const foundLicense = SOFTWARE_LICENSES.find((license) => {
    return (
      license.status === 'active' &&
      license.licenseCode.toUpperCase() === cleanLicense &&
      license.activationKey.toUpperCase() === cleanKey
    )
  })

  if (!foundLicense) {
    return {
      ok: false,
      message: 'Licencia o clave de activacion incorrecta.',
    }
  }

  return {
    ok: true,
    license: foundLicense,
  }
}

export function activateCompany({
  companyName,
  businessName,
  rnc,
  licenseCode,
  activationKey,
  adminFullName,
  adminUsername,
  adminPassword,
}) {
  const licenseResult = validateSoftwareLicense(licenseCode, activationKey)

  if (!licenseResult.ok) {
    return licenseResult
  }

  const cleanCompanyName = String(companyName || '').trim()
  const cleanAdminName = String(adminFullName || '').trim()
  const cleanAdminUsername = String(adminUsername || '').trim()
  const cleanAdminPassword = String(adminPassword || '').trim()

  if (!cleanCompanyName) {
    return {
      ok: false,
      message: 'Debes escribir el nombre de la empresa.',
    }
  }

  if (!cleanAdminName || !cleanAdminUsername || !cleanAdminPassword) {
    return {
      ok: false,
      message: 'Debes crear el administrador principal.',
    }
  }

  if (cleanAdminPassword.length < 4) {
    return {
      ok: false,
      message: 'La contrasena del administrador debe tener minimo 4 caracteres.',
    }
  }

  const activatedCompany = {
    id: `COMP-${Date.now()}`,
    companyName: cleanCompanyName,
    businessName: String(businessName || cleanCompanyName).trim(),
    rnc: String(rnc || '').trim(),
    licenseCode: licenseResult.license.licenseCode,
    plan: licenseResult.license.plan,
    maxUsers: licenseResult.license.maxUsers,
    active: true,
    activatedAt: new Date().toISOString(),
  }

  const mainAdmin = {
    id: 'USR-001',
    companyId: activatedCompany.id,
    fullName: cleanAdminName,
    username: cleanAdminUsername,
    password: cleanAdminPassword,
    roleId: 'ROLE-MAIN-ADMIN',
    role: 'Administrador Principal',
    active: true,
    isMainAdmin: true,
    createdAt: new Date().toISOString(),
  }

  saveActivatedCompany(activatedCompany)

  localStorage.setItem('inveFatCompanies', JSON.stringify([
    {
      id: activatedCompany.id,
      name: activatedCompany.companyName,
      businessName: activatedCompany.businessName,
      rnc: activatedCompany.rnc,
      companyCode: activatedCompany.licenseCode,
      companyKey: activationKey,
      active: true,
      createdAt: activatedCompany.activatedAt,
    },
  ]))

  localStorage.setItem('inveFatUsers', JSON.stringify([mainAdmin]))

  localStorage.setItem('inveFatSystemConfig', JSON.stringify({
    companyDisplayName: activatedCompany.companyName,
    businessName: activatedCompany.businessName,
    rnc: activatedCompany.rnc,
    defaultBranch: 'Principal',
    currency: 'RD$',
    requireCompanyActivation: true,
    auditEnabled: true,
    updatedAt: new Date().toISOString(),
  }))

  return {
    ok: true,
    company: activatedCompany,
    admin: mainAdmin,
  }
}