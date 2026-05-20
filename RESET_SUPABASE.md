# Reinicio seguro de Supabase

INVE-FAT SYSTEM no elimina tablas de Supabase desde el frontend.

## Regla principal

Antes de reiniciar datos en nube debe existir:

- Respaldo completo descargado.
- Confirmacion fuerte del Super Admin.
- Funcion backend segura o SQL ejecutado manualmente por un administrador autorizado.
- Registro de auditoria.

## Por que no se borra desde frontend

El frontend usa la anon public key. Esa llave no debe tener permisos administrativos para borrar todos los datos de todas las empresas. El reinicio total de Supabase debe ejecutarse desde un entorno seguro, por ejemplo:

- Edge Function protegida.
- Backend privado.
- SQL Editor con usuario administrador.
- Script operativo fuera del navegador.

## Flujo recomendado

1. Entrar como `SYSTEM / superadmin`.
2. Descargar respaldo completo desde el Panel del Sistema.
3. Verificar que el respaldo abre correctamente.
4. Ejecutar SQL controlado o funcion backend segura.
5. Recrear datos minimos:
   - Empresa demo `EMP001`.
   - Licencia demo.
   - Plan demo.
   - Usuario administrador de empresa si aplica.
6. Probar login y aislamiento multiempresa.

## Nota

La opcion del Panel del Sistema reinicia `localStorage` y deja un aviso cuando Supabase esta activo:

`Los datos en Supabase no fueron eliminados porque se requiere operacion administrativa segura.`
