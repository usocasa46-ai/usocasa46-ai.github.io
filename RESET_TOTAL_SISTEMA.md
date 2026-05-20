# Reinicio total del sistema

El reinicio total deja INVE-FAT SYSTEM sin empresas, sin EMP001 demo, sin licencias, sin planes, sin usuarios de empresa y sin datos operativos locales.

El unico acceso que permanece es tecnico y no cuenta como empresa:

- Codigo empresa: `SYSTEM`
- Usuario: `superadmin`
- Contrasena: `admin123`

## Reiniciar localStorage desde el panel

1. Entrar como `SYSTEM / superadmin / admin123`.
2. Ir a **Panel del Sistema > Respaldos por empresa**.
3. Pulsar **Poner sistema en cero**.
4. Descargar el backup completo obligatorio.
5. Escribir exactamente:

```text
REINICIAR SISTEMA
```

6. Pulsar **Reiniciar sistema**.
7. El sistema cierra sesion y vuelve al login.
8. Entrar nuevamente como `SYSTEM / superadmin / admin123`.

Resultado esperado:

- Empresas: 0
- Licencias: 0
- Usuarios por empresa: 0
- Respaldos: 0
- Soporte autorizado: 0
- No existe `EMP001` hasta que el Super Admin la cree manualmente.

## Crear empresa desde cero

Despues del reinicio, el Super Admin puede crear una empresa manualmente:

1. Ir a **Empresas**.
2. Pulsar **Crear primera empresa**.
3. Crear `EMP001` u otra empresa.
4. Crear el administrador de empresa.
5. Entrar con codigo de empresa + usuario + contrasena.

La empresa nueva entra limpia, sin productos, clientes, facturas ni datos de otra empresa.

## Limpiar Supabase

El frontend no borra Supabase con la anon public key. Para limpiar datos en nube:

1. Descargar backup completo.
2. Ejecutar el reset local desde el Panel del Sistema.
3. Abrir Supabase SQL Editor.
4. Ejecutar el contenido del archivo:

```sql
supabase/reset_all_data.sql
```

Este script usa un bloque seguro que limpia solo tablas existentes. No borra tablas ni esquema. Deja la nube sin empresas, sin `EMP001`, sin licencias, sin planes, sin usuarios de empresa y sin datos operativos.

Si Supabase queda con datos antiguos y localStorage esta limpio, el Panel del Sistema puede volver a mostrar empresas porque Supabase es la fuente activa. En ese caso ejecute `supabase/reset_all_data.sql` y reinicie la aplicacion.

## Login de empresa nueva

Cuando Supabase esta configurado, el Super Admin guarda la empresa, licencia y usuario administrador tanto en localStorage como en Supabase. El login consulta la misma fuente:

1. Crear empresa manual desde Super Admin.
2. Crear usuario administrador en el formulario.
3. Cerrar sesion.
4. Entrar con codigo de empresa + usuario + contrasena.

Si la empresa no existe, el login debe responder `Empresa no existe.` y no debe crear `EMP001` ni datos demo.

## Advertencia

No ejecute el SQL de reinicio en produccion sin respaldo verificado y autorizacion del Super Admin.
