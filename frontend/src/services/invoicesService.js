import { createCollectionClient } from './dataClient.js'

const client = createCollectionClient({
  table: 'invoices',
  storageKey: 'invefat_sales_invoices',
  idField: 'number',
  fallback: [],
})

export const invoicesService = {
  getAll: () => client.getAll(),
  getById: (id) => client.getById(id),
  create: (record) => client.create(record),
  update: (id, patch) => client.update(id, patch),
  remove: (id) => client.remove(id),
  deactivate: (id) => client.update(id, { state: 'Anulada', updatedAt: new Date().toISOString() }),
  replaceAll: (records) => client.replaceAll(records),
}
