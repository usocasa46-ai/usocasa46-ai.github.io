import { createCollectionClient } from './dataClient.js'

const client = createCollectionClient({
  table: 'quotes',
  storageKey: 'invefat_sales_quotes',
  idField: 'number',
  fallback: [],
})

export const quotesService = {
  getAll: () => client.getAll(),
  getById: (id) => client.getById(id),
  create: (record) => client.create(record),
  update: (id, patch) => client.update(id, patch),
  remove: (id) => client.remove(id),
  deactivate: (id) => client.update(id, { state: 'Anulada', updatedAt: new Date().toISOString() }),
  replaceAll: (records) => client.replaceAll(records),
}
