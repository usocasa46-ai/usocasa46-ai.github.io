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
2. Abrir Supabase SQL Editor.
3. Ejecutar:

```sql
supabase/reset_all_data.sql
```

Este script usa `TRUNCATE`, no borra tablas ni esquema. Deja las tablas vacias y conserva la estructura.

## Advertencia

No ejecute el SQL de reinicio en produccion sin respaldo verificado y autorizacion del Super Admin.
