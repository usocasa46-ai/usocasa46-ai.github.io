import { createCollectionClient } from './dataClient.js'

const client = createCollectionClient({
  table: 'companies',
  storageKey: 'invefat_companies',
  idField: 'id',
  fallback: [],
  companyScoped: false,
})

export const companiesService = {
  getAll: () => client.getAll(),
  getById: (id) => client.getById(id),
  create: (record) => client.create(record),
  update: (id, patch) => client.update(id, patch),
  remove: (id) => client.remove(id),
  deactivate: (id) => client.update(id, { estado: 'suspendida', updatedAt: new Date().toISOString() }),
  replaceAll: (records) => client.replaceAll(records),
}
