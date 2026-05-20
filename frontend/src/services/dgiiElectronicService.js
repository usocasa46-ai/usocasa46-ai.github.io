import { nowIso, readStorage, writeStorage } from '../utils/accountingEntries.js'

export const DGII_ELECTRONIC_CONFIG_KEY = 'invefat_electronic_dgii_config'

export function getDgiiElectronicConfig() {
  return readStorage(DGII_ELECTRONIC_CONFIG_KEY, {
    environment: 'Pruebas',
    receptionUrl: '',
    statusUrl: '',
    acknowledgementUrl: '',
    apiUser: '',
    connectionStatus: 'No configurado',
    lastTestAt: '',
    simulationMode: true,
  })
}

export function saveDgiiElectronicConfig(config = {}) {
  const nextConfig = {
    ...getDgiiElectronicConfig(),
    ...config,
    updatedAt: nowIso(),
  }
  writeStorage(DGII_ELECTRONIC_CONFIG_KEY, nextConfig)
  return nextConfig
}

function shouldSimulate(config = getDgiiElectronicConfig()) {
  return Boolean(config.simulationMode || !config.receptionUrl || !config.statusUrl)
}

export async function testConnection() {
  const config = getDgiiElectronicConfig()
  if (shouldSimulate(config)) {
    const nextConfig = saveDgiiElectronicConfig({
      ...config,
      connectionStatus: 'Modo simulacion',
      lastTestAt: nowIso(),
    })
    return {
      ok: true,
      simulation: true,
      config: nextConfig,
      message: 'DGII no configurado. Modo simulacion activo.',
    }
  }

  const nextConfig = saveDgiiElectronicConfig({
    ...config,
    connectionStatus: 'Pendiente de integracion backend',
    lastTestAt: nowIso(),
  })
  return {
    ok: false,
    simulation: false,
    config: nextConfig,
    message: 'La conexion real DGII debe ejecutarse desde backend seguro.',
  }
}

export async function sendElectronicDocument(document = {}) {
  const config = getDgiiElectronicConfig()
  if (shouldSimulate(config)) {
    return {
      ok: true,
      simulation: true,
      trackId: `SIM-${Date.now()}`,
      status: 'Enviado a DGII',
      message: 'Envio simulado. Configure DGII y backend seguro para envio real.',
      sentAt: nowIso(),
    }
  }

  return {
    ok: false,
    simulation: false,
    status: 'Pendiente de envio',
    message: 'Envio real no implementado en frontend. Use servicio backend autorizado.',
    document,
  }
}

export async function getDocumentStatus(trackId) {
  const config = getDgiiElectronicConfig()
  if (shouldSimulate(config)) {
    return {
      ok: true,
      simulation: true,
      trackId,
      status: 'Aceptado',
      message: 'Consulta simulada de estado DGII.',
      checkedAt: nowIso(),
    }
  }
  return {
    ok: false,
    trackId,
    status: 'Pendiente',
    message: 'Consulta real debe implementarse en backend seguro.',
  }
}

export async function receiveAcknowledgement(document = {}) {
  return {
    ok: true,
    simulation: true,
    documentId: document.id,
    status: 'Acuse generado',
    message: 'Acuse de recibo preparado en modo simulacion.',
    generatedAt: nowIso(),
  }
}

export async function sendCommercialApproval(response = {}) {
  return {
    ok: true,
    simulation: true,
    responseId: response.id,
    status: 'Respondido',
    message: 'Respuesta comercial preparada en modo simulacion.',
    sentAt: nowIso(),
  }
}

export async function retryDocument(document = {}) {
  const result = await sendElectronicDocument(document)
  return {
    ...result,
    retryAt: nowIso(),
  }
}
