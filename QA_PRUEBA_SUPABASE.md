# QA PRUEBA / Supabase

Fecha de control: 2026-05-21

## Login PRUEBA

- Empresa consultada directamente en Supabase: `PRUEBA`.
- Estado de empresa: `activa`.
- Usuario administrador: `admin`.
- Estado del usuario: `activo`.
- Validacion directa de credenciales esperadas: correcta para `PRUEBA / admin / 1234`.
- `company_id` detectado: `COMP-PRUEBA`.
- `company_users.company_id` coincide con `companies.id`: si.
- `company_licenses.company_id` coincide con `companies.id`: si.
- Login UI: la app carga el login correctamente. La escritura automatizada en el navegador integrado de Codex fue bloqueada por la capa de automatizacion del navegador, no por un error visible de la aplicacion.

## Validacion Supabase

- Tabla `companies`: existe un registro para `company_code = PRUEBA`.
- Tabla `company_users`: existe admin activo para `company_code = PRUEBA`.
- Tabla `company_licenses`: existe licencia activa para `company_code = PRUEBA`.
- Modulos activos encontrados:
  - `dashboard`
  - `sales`
  - `purchases`
  - `inventory`
  - `warehouse`
  - `finance`
  - `crm`
  - `hr`
  - `production`
  - `reports`
  - `settings`
  - `security`
- Modulo `system` en licencia de PRUEBA: no.

## Modulos Que Abren / Rutas Registradas

Validacion estatica de navegacion y componentes en `modulesMap` y `AppWorkspace`:

- Dashboard: registrado.
- Inventario / Productos: registrado como `inventory-products`.
- Clientes: registrado como `sales-customers`.
- Factura: registrado como `sales-invoice`.
- Compras: registrado.
- Compras > Analisis de datos: registrado como `purchases-analytics`.
- Almacen: registrado.
- Almacen > Etiquetas y codigos: registrado como `warehouse-labels-codes`.
- Finanzas / Contabilidad: registrado.
- RNC: registrado como `finance-rnc`.
- Reportes: registrado.
- Recursos Humanos: registrado.
- Configuracion: registrado como `settings-general`.
- Seguridad: registrado como `security-users`.

## Modulos Con Errores

- No se detectaron errores de build.
- No se detectaron imports rotos en las rutas principales revisadas.
- No se aplicaron cambios de codigo en POS, reset, login, Super Admin, Supabase core ni creacion de empresas.

## Modulos Pendientes

- Prueba visual manual completa desde navegador real: pendiente por limitacion de escritura del navegador integrado de Codex.
- Recomendado validar manualmente el recorrido completo con `PRUEBA / admin / 1234` en Chrome/Edge:
  - Dashboard
  - Productos
  - Clientes
  - Factura
  - Compras > Analisis de datos
  - Almacen > Etiquetas y codigos
  - RNC
  - Reportes
  - Recursos Humanos
  - Configuracion
  - Seguridad

## Datos Mezclados Encontrados

- No se encontraron datos mezclados durante la consulta directa a Supabase para empresa, usuario y licencia.
- Busqueda rapida en codigo encontro escrituras antiguas a `invefat_customers` desde Factura/Cotizaciones; el sistema tiene scoping de `companyStorage` para claves operativas, por lo que no se cambio en este ciclo para evitar tocar modulos fuera del alcance.

## Resultado De Build

- `npm run build`: correcto.

## Recomendaciones Para El Proximo Ciclo

- Probar manualmente login y navegacion completa desde navegador real con `PRUEBA / admin / 1234`.
- Revisar, en un ciclo separado, las escrituras legacy de clientes en Factura/Cotizaciones si se observa mezcla real de datos.
- Mantener el modulo `system` reservado exclusivamente para `SYSTEM / superadmin`.
