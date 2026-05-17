import { createCollectionClient, createDocumentClient } from './dataClient.js'

const rolesClient = createCollectionClient({
  table: 'roles',
  storageKey: 'invefat_roles',
  idField: 'id',
  fallback: [],
})

const permissionsClient = createDocumentClient({
  table: 'app_settings',
  storageKey: 'invefat_permissions',
  id: 'permissions',
  fallback: {},
})

const auditClient = createCollectionClient({
  table: 'audit_log',
  storageKey: 'invefat_audit_log',
  idField: 'id',
  fallback: [],
})

export const securityService = {
  roles: {
    getAll: () => rolesClient.getAll(),
    getById: (id) => rolesClient.getById(id),
    create: (record) => rolesClient.create(record),
    update: (id, patch) => rolesClient.update(id, patch),
    remove: (id) => rolesClient.remove(id),
    deactivate: (id) => rolesClient.deactivate(id),
    replaceAll: (records) => rolesClient.replaceAll(records),
  },
  permissions: {
    getAll: () => permissionsClient.getAll(),
    getById: () => permissionsClient.getById(),
    create: (record) => permissionsClient.create(record),
    update: (_id, patch) => permissionsClient.update('permissions', patch),
    remove: () => permissionsClient.remove(),
    deactivate: () => permissionsClient.deactivate(),
    replaceAll: (record) => permissionsClient.update('permissions', record),
  },
  audit: {
    getAll: () => auditClient.getAll(),
    getById: (id) => auditClient.getById(id),
    create: (record) => auditClient.create(record),
    update: (id, patch) => auditClient.update(id, patch),
    remove: (id) => auditClient.remove(id),
    deactivate: (id) => auditClient.deactivate(id),
  },
}
