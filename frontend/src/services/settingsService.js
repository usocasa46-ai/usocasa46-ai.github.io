import { createDocumentClient } from './dataClient.js'

const client = createDocumentClient({
  table: 'settings',
  storageKey: 'invefat_company_settings',
  id: 'company_settings',
  fallback: {},
})

export const settingsService = {
  getAll: () => client.getAll(),
  getById: () => client.getById(),
  create: (record) => client.create(record),
  update: (_id, patch) => client.update('company_settings', patch),
  remove: () => client.remove(),
  deactivate: () => client.deactivate(),
  replaceAll: (record) => client.update('company_settings', record),
}
