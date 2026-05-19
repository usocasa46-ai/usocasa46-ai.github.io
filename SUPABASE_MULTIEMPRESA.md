# Supabase multiempresa

Esta fase mantiene `localStorage` como modo de prueba, pero deja preparada la arquitectura para Supabase.

## Reglas principales

- Todas las tablas operativas deben tener `company_id`.
- Cada usuario de empresa pertenece a una sola empresa.
- El Super Admin administra empresas, licencias, planes, soporte y logs tecnicos.
- El Super Admin no consulta datos privados de una empresa salvo que exista soporte autorizado vigente.
- Los datos operativos se filtran siempre por `company_id`.
- Row Level Security debe evitar que una empresa lea o modifique datos de otra.

## Tablas administrativas sugeridas

- `companies`
- `company_licenses`
- `system_plans`
- `company_users`
- `support_access`
- `system_audit_log`

## Tablas operativas

Ejemplos:

- `products.company_id`
- `customers.company_id`
- `invoices.company_id`
- `quotes.company_id`
- `suppliers.company_id`
- `inventory_movements.company_id`
- `settings.company_id`
- `ncf_sequences.company_id`

## RLS sugerido

En produccion, el JWT del usuario debe incluir su `company_id`. Las politicas deben comparar:

```sql
company_id = auth.jwt() ->> 'company_id'
```

Para Super Admin, usar un rol separado y vistas administrativas que no devuelvan datos privados.
