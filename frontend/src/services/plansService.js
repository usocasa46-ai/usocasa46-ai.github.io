import { createCollectionClient } from './dataClient.js'

const client = createCollectionClient({
  table: 'system_plans',
  storageKey: 'invefat_system_plans',
  idField: 'id',
  fallback: [],
  companyScoped: false,
})

export const plansService = {
  getAll: () => client.getAll(),
  getById: (id) => client.getById(id),
  create: (record) => client.create(record),
  update: (id, patch) => client.update(id, patch),
  remove: (id) => client.remove(id),
  deactivate: (id) => client.update(id, { status: 'Inactivo', updatedAt: new Date().toISOString() }),
  replaceAll: (records) => client.replaceAll(records),
}
