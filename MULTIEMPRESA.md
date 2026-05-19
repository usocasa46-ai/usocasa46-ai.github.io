# Modo multiempresa de prueba

INVE-FAT SYSTEM incluye una primera capa multiempresa para pruebas con `localStorage`.

## Acceso Super Admin

Usa estas credenciales:

```text
Codigo empresa: SYSTEM
Usuario: superadmin
Contrasena: admin123
```

El Super Admin entra al **Panel del Sistema**, no al Dashboard operativo de una empresa.

Puede:

- Crear y editar empresas.
- Activar o suspender empresas.
- Crear un usuario administrador para una empresa.
- Ver plan, estado, modulos activos y cantidad de usuarios.
- Editar licencias.
- Configurar planes.
- Generar respaldos JSON por empresa.
- Ver soporte autorizado.
- Ver logs tecnicos y prueba de aislamiento por conteos.

No puede ver productos, clientes, facturas, compras, contabilidad ni reportes privados de una empresa.

## Empresa demo

Si no existe ninguna empresa, el sistema crea:

```text
Codigo empresa: EMP001
Nombre comercial: Empresa Demo
RNC: 000000000
Estado: activa
Plan: Demo
```

Tambien crea un administrador de prueba dentro de EMP001:

```text
Codigo empresa: EMP001
Usuario: admin
Contrasena: admin123
```

## Crear empresas y administradores

1. Entrar como Super Admin.
2. Pulsar **Nueva empresa**.
3. Completar codigo, nombre comercial, RNC, plan, estado y datos principales.
4. Guardar.
5. En la tabla de empresas, pulsar el icono de crear admin.
6. Crear usuario administrador para esa empresa.
7. Cerrar sesion.
8. Entrar con codigo de empresa + usuario + contrasena.

## Prueba EMP001 / EMP002

1. Entrar como `SYSTEM / superadmin / admin123`.
2. Crear o verificar `EMP001`.
3. Crear `EMP002`.
4. Crear un admin para EMP001.
5. Crear un admin para EMP002.
6. Entrar a EMP001 y crear `Producto A`.
7. Cerrar sesion.
8. Entrar a EMP002 y confirmar que `Producto A` no aparece.
9. Crear `Producto B`.
10. Volver a EMP001 y confirmar que solo aparece `Producto A`.

## Separacion de datos

La sesion guarda:

- `currentCompanyId`
- `currentCompanyCode`
- `currentCompanyName`
- `currentUser`
- `currentRole`

Los datos principales se guardan con claves por empresa. Ejemplo:

```text
invefat_EMP001_products
invefat_EMP002_products
```

La capa `src/services/companyStorage.js` traduce claves conocidas del sistema a claves separadas por empresa.

## Licencias y modulos

Cada empresa tiene una licencia en `invefat_company_licenses`.

Si la licencia queda `vencida` o `suspendida`, los usuarios de esa empresa no pueden iniciar sesion y veran:

```text
Licencia vencida o suspendida. Contacte al administrador del sistema.
```

Los modulos visibles en el sidebar se filtran por la licencia de la empresa.

## Soporte autorizado

Desde el usuario de empresa se puede autorizar soporte desde el menu de usuario. El permiso queda en:

```text
invefat_support_access
```

El Panel Super Admin muestra las autorizaciones vigentes sin abrir datos privados por defecto.

## Preparacion para Supabase

El esquema `supabase/schema.sql` incluye `company_id` en las tablas minimas:

- `products`
- `customers`
- `invoices`
- `quotes`
- `settings`

Cuando Supabase se active, cada consulta debe filtrar por `company_id` para mantener separados los datos de cada empresa.
