import { createCollectionClient } from './dataClient.js'

const client = createCollectionClient({
  table: 'company_licenses',
  storageKey: 'invefat_company_licenses',
  idField: 'id',
  fallback: [],
  companyScoped: false,
})

export const licensesService = {
  getAll: () => client.getAll(),
  getById: (id) => client.getById(id),
  create: (record) => client.create(record),
  update: (id, patch) => client.update(id, patch),
  remove: (id) => client.remove(id),
  deactivate: (id) => client.update(id, { estado: 'suspendida', updatedAt: new Date().toISOString() }),
  replaceAll: (records) => client.replaceAll(records),
}
