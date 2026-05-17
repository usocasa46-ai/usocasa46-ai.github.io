import { createCollectionClient } from './dataClient.js'

const client = createCollectionClient({
  table: 'users',
  storageKey: 'inveFatUsers',
  idField: 'username',
  fallback: [],
})

export const usersService = {
  getAll: () => client.getAll(),
  getById: (id) => client.getById(id),
  create: (record) => client.create(record),
  update: (id, patch) => client.update(id, patch),
  remove: (id) => client.remove(id),
  deactivate: (id) => client.deactivate(id),
  replaceAll: (records) => client.replaceAll(records),
}
