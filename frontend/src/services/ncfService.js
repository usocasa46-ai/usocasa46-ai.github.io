import { createCollectionClient } from './dataClient.js'

const sequencesClient = createCollectionClient({
  table: 'ncf_sequences',
  storageKey: 'invefat_ncf_sequences',
  idField: 'id',
  fallback: [],
})

const usedClient = createCollectionClient({
  table: 'ncf_used',
  storageKey: 'invefat_ncf_used',
  idField: 'id',
  fallback: [],
})

export const ncfService = {
  sequences: {
    getAll: () => sequencesClient.getAll(),
    getById: (id) => sequencesClient.getById(id),
    create: (record) => sequencesClient.create(record),
    update: (id, patch) => sequencesClient.update(id, patch),
    remove: (id) => sequencesClient.remove(id),
    deactivate: (id) => sequencesClient.deactivate(id),
    replaceAll: (records) => sequencesClient.replaceAll(records),
  },
  used: {
    getAll: () => usedClient.getAll(),
    getById: (id) => usedClient.getById(id),
    create: (record) => usedClient.create(record),
    update: (id, patch) => usedClient.update(id, patch),
    remove: (id) => usedClient.remove(id),
    deactivate: (id) => usedClient.update(id, { estado: 'anulado', updatedAt: new Date().toISOString() }),
    replaceAll: (records) => usedClient.replaceAll(records),
  },
}
