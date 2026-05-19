-- Esquema administrativo sugerido para modo multiempresa.
-- No se ejecuta automaticamente desde la app.

create table if not exists public.companies (
  id text primary key,
  company_code text not null unique,
  nombre_comercial text not null,
  razon_social text,
  rnc text,
  telefono text,
  correo text,
  direccion text,
  estado text not null default 'activa',
  plan text,
  fecha_activacion date,
  fecha_vencimiento date,
  modulos_activos jsonb not null default '[]'::jsonb,
  max_usuarios integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_licenses (
  id text primary key,
  company_id text not null references public.companies(id),
  codigo_licencia text not null,
  plan_contratado text not null,
  estado text not null default 'activa',
  fecha_activacion date,
  fecha_vencimiento date,
  max_usuarios integer not null default 5,
  max_sucursales integer not null default 1,
  max_almacenes integer not null default 1,
  modulos_activos jsonb not null default '[]'::jsonb,
  tipo_version text not null default 'Cloud',
  observacion text,
  updated_at timestamptz not null default now()
);

create table if not exists public.system_plans (
  id text primary key,
  name text not null,
  status text not null default 'Activo',
  modules jsonb not null default '[]'::jsonb,
  description text
);

create table if not exists public.company_users (
  id text primary key,
  company_id text not null references public.companies(id),
  username text not null,
  full_name text not null,
  role text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(company_id, username)
);

create table if not exists public.support_access (
  id text primary key,
  company_id text not null references public.companies(id),
  superadmin text,
  fecha_inicio timestamptz not null,
  fecha_fin timestamptz not null,
  motivo text,
  estado text not null default 'activo',
  acciones_realizadas jsonb not null default '[]'::jsonb
);

create table if not exists public.system_audit_log (
  id text primary key,
  fecha timestamptz not null default now(),
  usuario text,
  empresa text,
  accion text not null,
  descripcion text,
  ip text,
  modulo text
);
