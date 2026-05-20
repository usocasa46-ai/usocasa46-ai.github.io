# Supabase multiempresa

Esta fase mantiene `localStorage` como modo de prueba, pero deja preparada la arquitectura para Supabase.

## Configuracion inicial

1. Crear un proyecto en Supabase.
2. Copiar el **Project URL**.
3. Copiar la **anon public key**. No usar `service_role` en el frontend.
4. Crear el archivo `frontend/.env.local`.
5. Agregar:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

6. Ejecutar el SQL `supabase/multiempresa_schema.sql` en el SQL Editor de Supabase.
7. Reiniciar el servidor:

```bash
cd frontend
npm run dev
```

Si falta alguna variable, INVE-FAT SYSTEM sigue usando `localStorage` multiempresa.

## Prueba controlada desde Super Admin

1. Entrar como `SYSTEM / superadmin / admin123`.
2. Ir a **Estado del sistema**.
3. En el bloque **Estado de Supabase**, confirmar:
   - Supabase configurado: `Si` o `No`.
   - Modo actual: `Supabase` o `localStorage`.
   - Ultima prueba de conexion.
   - Estado de conexion.
4. Pulsar **Probar conexion**.
5. Pulsar **Probar escritura EMP001**.
   - Esta prueba crea o actualiza solo el producto tecnico `TEST-SUPABASE-001`.
   - El registro se guarda con `company_id` de EMP001.
6. Pulsar **Probar lectura EMP001**.
7. Pulsar **Probar aislamiento EMP001 / EMP002**.
   - La prueba solo devuelve conteos y resultado.
   - No muestra productos, clientes, facturas ni datos privados.

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

Estas tablas son administradas por Super Admin. No deben exponer productos, clientes, facturas ni datos privados.

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

La capa `frontend/src/services/dataClient.js` agrega `company_id` al guardar datos operativos y filtra por la empresa de la sesion.
Las tablas operativas usan clave compuesta `company_id + id`, porque dos empresas pueden tener el mismo codigo de producto, numero de factura o identificador interno sin mezclar datos.

No hay migracion masiva automatica desde `localStorage` hacia Supabase en esta fase. Primero se prueba escritura, lectura y aislamiento con datos nuevos controlados.

## Servicios preparados

Servicios principales listos para usar Supabase con fallback local:

- `companiesService`
- `licensesService`
- `plansService`
- `usersService`
- `productsService`
- `customersService`
- `invoicesService`
- `quotesService`
- `suppliersService`
- `settingsService`
- `ncfService`
- `inventoryMovementsService`

Si Supabase responde con error o las tablas aun no existen, el `dataClient` vuelve a `localStorage` para no dejar pantallas en blanco.

## Probar EMP001 y EMP002

1. Entrar como `SYSTEM / superadmin / admin123`.
2. Crear o verificar `EMP001`.
3. Crear `EMP002`.
4. Crear un admin por empresa.
5. Entrar a EMP001 y crear un producto.
6. Entrar a EMP002 y confirmar que no aparece el producto de EMP001.
7. Crear una factura en EMP001.
8. Confirmar que EMP002 no ve esa factura.
9. En Supabase, revisar que los registros tengan `company_id`.

## RLS sugerido

El SQL incluye politicas base. Para esta fase de prueba, la app envia `x-company-id` desde la sesion local para que Supabase pueda filtrar por empresa.

En produccion, el JWT del usuario debe incluir su `company_id` y las politicas deben comparar:

```sql
company_id = auth.jwt() ->> 'company_id'
```

Para Super Admin, usar un rol separado y vistas administrativas que no devuelvan datos privados.

Antes de produccion, reemplazar cualquier dependencia de encabezados del cliente por Supabase Auth + JWT claims.

## Sincronizacion local a Supabase

La sincronizacion masiva desde datos locales queda documentada para una fase siguiente. No se agrego un boton a medias para evitar duplicar datos sin una confirmacion completa por empresa.
