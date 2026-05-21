# Reinicio total del sistema

El reinicio tiene dos niveles:

1. Reinicio local del navegador.
2. Reinicio total de Supabase ejecutando SQL administrativo manual.

El frontend no borra Supabase con anon key. Si Supabase esta conectado, limpiar localStorage no elimina empresas, usuarios ni licencias guardadas en la nube.

El unico acceso tecnico que permanece en el codigo es:

- Codigo empresa: `SYSTEM`
- Usuario: `superadmin`
- Contrasena: `admin123`

`SYSTEM` no es una empresa cliente y no debe aparecer en la lista de empresas.

## Paso 1: descargar backup

1. Entrar como `SYSTEM / superadmin / admin123`.
2. Ir a **Panel del Sistema > Respaldos por empresa**.
3. En **Reinicio del sistema**, descargar el backup completo.
4. Conservar el archivo antes de cualquier reinicio.

## Paso 2: reiniciar datos locales

1. Pulsar **Reiniciar datos locales**.
2. Descargar el backup obligatorio dentro del modal.
3. Escribir exactamente:

```text
REINICIAR SISTEMA
```

4. Pulsar **Reiniciar datos locales**.

Resultado:

- Se limpian claves locales del sistema en `localStorage`.
- Se limpia la sesion en `sessionStorage`.
- Se eliminan bases IndexedDB relacionadas con `invefat`, `INVEFAT`, `inve-fat` o `INVE-FAT` cuando el navegador permite detectarlas.
- Se eliminan caches del sistema si existen en Cache Storage.
- Se cierra sesion.
- El navegador vuelve al login.
- Si Supabase sigue con datos, esos datos no se eliminan.

Mensaje esperado con Supabase activo:

```text
Datos locales limpiados. Datos en Supabase no fueron eliminados.
```

## Paso 3: dejar Supabase en cero

Para limpiar la nube:

1. Abrir Supabase SQL Editor.
2. Ejecutar el contenido de:

```text
supabase/reset_all_data.sql
```

El script:

- Limpia solo datos de tablas existentes.
- No hace `DROP TABLE`.
- No hace `DROP SCHEMA`.
- No recrea `EMP001`.
- No inserta empresas demo.
- No inserta planes demo.
- Termina con `notify pgrst, 'reload schema';`.

## Paso 4: verificar

1. Volver al sistema.
2. Entrar como `SYSTEM / superadmin / admin123`.
3. Ir a **Estado del sistema**.
4. Pulsar **Verificar datos locales**.
5. Confirmar:

- Empresas: 0
- Usuarios por empresa: 0
- Licencias: 0
- localStorage limpio: Si
- sessionStorage limpio: Si
- IndexedDB limpio: Si
- Cache Storage limpio: Si
- Supabase limpio: Si
- No existe `EMP001`
- No hay datos demo

Si el navegador esta limpio pero Supabase todavia tiene empresas, el panel debe advertir:

```text
El navegador esta limpio, pero Supabase aun contiene empresas.
```

Tambien puede mostrar:

```text
El reset local se completo, pero Supabase todavia contiene empresas. Ejecute reset_all_data.sql para limpiar la nube.
```

## Crear empresa desde cero

Despues de limpiar local y Supabase, el Super Admin puede crear una empresa manualmente:

1. Ir a **Empresas**.
2. Pulsar **Crear primera empresa**.
3. Crear `EMP001` u otra empresa solo si se desea.
4. Crear el administrador de empresa.
5. Entrar con codigo empresa + usuario + contrasena.

La empresa nueva debe entrar limpia, sin productos, clientes, facturas ni datos de otra empresa.

## Advertencia

No ejecute el SQL de reinicio en produccion sin respaldo verificado y autorizacion del Super Admin.
