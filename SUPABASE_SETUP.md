# Configuracion Supabase

INVE-FAT SYSTEM puede trabajar con Supabase cuando existan las variables de entorno publicas del proyecto. Si no estan configuradas, el sistema conserva el comportamiento actual usando `localStorage`.

## Pasos

1. Crear un proyecto en Supabase.
2. Entrar en `Project Settings > API`.
3. Copiar `Project URL`.
4. Copiar la clave `anon public`.
5. Crear el archivo `frontend/.env.local`.
6. Agregar:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

7. Reiniciar el servidor:

```bash
npm run dev
```

## Tablas minimas

El archivo `supabase/schema.sql` contiene una estructura flexible inicial para:

- `products`
- `customers`
- `invoices`
- `quotes`
- `settings`

Cada tabla guarda `id`, `data`, `created_at` y `updated_at`, para mantener compatibilidad con la estructura actual del sistema sin migraciones grandes.

## Seguridad

- No colocar `service_role` en el frontend.
- No subir claves reales a GitHub.
- Usar solo `VITE_SUPABASE_ANON_KEY` en el cliente.
