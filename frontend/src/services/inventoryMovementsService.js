import { createCollectionClient } from './dataClient.js'

const client = createCollectionClient({
  table: 'inventory_movements',
  storageKey: 'invefat_inventory_movements',
  idField: 'id',
  fallback: [],
})

export const inventoryMovementsService = {
  getAll: () => client.getAll(),
  getById: (id) => client.getById(id),
  create: (record) => client.create(record),
  update: (id, patch) => client.update(id, patch),
  remove: (id) => client.remove(id),
  deactivate: (id) => client.update(id, { estado: 'Anulado', updatedAt: new Date().toISOString() }),
  replaceAll: (records) => client.replaceAll(records),
}
