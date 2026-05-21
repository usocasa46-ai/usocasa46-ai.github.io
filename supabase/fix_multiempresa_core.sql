-- INVE-FAT SYSTEM - correccion core multiempresa Supabase.
-- Ejecutar en Supabase SQL Editor cuando existan errores PGRST204
-- por columnas faltantes o cuando se necesite alinear companies,
-- company_users y company_licenses con el frontend.
--
-- Seguro para datos existentes:
-- - NO usa DROP TABLE
-- - NO usa DROP SCHEMA
-- - NO usa TRUNCATE
-- - NO usa DELETE

create table if not exists public.companies (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_users (
  id text not null,
  company_id text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_licenses (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.companies add column if not exists company_id text;
alter table public.companies add column if not exists company_code text;
alter table public.companies add column if not exists nombre_comercial text;
alter table public.companies add column if not exists razon_social text;
alter table public.companies add column if not exists rnc text;
alter table public.companies add column if not exists telefono text;
alter table public.companies add column if not exists correo text;
alter table public.companies add column if not exists direccion text;
alter table public.companies add column if not exists estado text not null default 'activa';
alter table public.companies add column if not exists plan text;
alter table public.companies add column if not exists first_login_pending boolean not null default false;
alter table public.companies add column if not exists onboarding_completed boolean not null default false;
alter table public.companies add column if not exists created_at timestamptz not null default now();
alter table public.companies add column if not exists updated_at timestamptz not null default now();

alter table public.company_users add column if not exists company_id text;
alter table public.company_users add column if not exists company_code text;
alter table public.company_users add column if not exists nombre text;
alter table public.company_users add column if not exists usuario text;
alter table public.company_users add column if not exists username text;
alter table public.company_users add column if not exists password text;
alter table public.company_users add column if not exists password_hash text;
alter table public.company_users add column if not exists rol text;
alter table public.company_users add column if not exists role text;
alter table public.company_users add column if not exists estado text not null default 'activo';
alter table public.company_users add column if not exists must_change_password boolean not null default false;
alter table public.company_users add column if not exists correo text;
alter table public.company_users add column if not exists telefono text;
alter table public.company_users add column if not exists created_at timestamptz not null default now();
alter table public.company_users add column if not exists updated_at timestamptz not null default now();

alter table public.company_licenses add column if not exists company_id text;
alter table public.company_licenses add column if not exists company_code text;
alter table public.company_licenses add column if not exists codigo_licencia text;
alter table public.company_licenses add column if not exists plan_contratado text;
alter table public.company_licenses add column if not exists estado text not null default 'activa';
alter table public.company_licenses add column if not exists modulos_activos jsonb not null default '[]'::jsonb;
alter table public.company_licenses add column if not exists fecha_activacion text;
alter table public.company_licenses add column if not exists fecha_vencimiento text;
alter table public.company_licenses add column if not exists max_usuarios integer not null default 0;
alter table public.company_licenses add column if not exists max_sucursales integer not null default 0;
alter table public.company_licenses add column if not exists max_almacenes integer not null default 0;
alter table public.company_licenses add column if not exists tipo_version text;
alter table public.company_licenses add column if not exists observacion text;
alter table public.company_licenses add column if not exists created_at timestamptz not null default now();
alter table public.company_licenses add column if not exists updated_at timestamptz not null default now();

update public.companies
set
  company_id = coalesce(nullif(company_id, ''), nullif(data ->> 'company_id', ''), nullif(data ->> 'companyId', ''), id),
  company_code = upper(coalesce(nullif(company_code, ''), nullif(data ->> 'company_code', ''), nullif(data ->> 'companyCode', ''), id)),
  nombre_comercial = coalesce(nullif(nombre_comercial, ''), nullif(data ->> 'nombre_comercial', ''), nullif(data ->> 'nombreComercial', '')),
  razon_social = coalesce(nullif(razon_social, ''), nullif(data ->> 'razon_social', ''), nullif(data ->> 'razonSocial', ''), nullif(data ->> 'nombreComercial', '')),
  rnc = coalesce(nullif(rnc, ''), nullif(data ->> 'rnc', '')),
  telefono = coalesce(nullif(telefono, ''), nullif(data ->> 'telefono', '')),
  correo = coalesce(nullif(correo, ''), nullif(data ->> 'correo', '')),
  direccion = coalesce(nullif(direccion, ''), nullif(data ->> 'direccion', '')),
  estado = coalesce(nullif(estado, ''), nullif(data ->> 'estado', ''), 'activa'),
  plan = coalesce(nullif(plan, ''), nullif(data ->> 'plan', ''), 'Demo'),
  data = data || jsonb_build_object(
    'company_id', coalesce(nullif(company_id, ''), nullif(data ->> 'company_id', ''), nullif(data ->> 'companyId', ''), id),
    'companyId', coalesce(nullif(company_id, ''), nullif(data ->> 'company_id', ''), nullif(data ->> 'companyId', ''), id),
    'company_code', upper(coalesce(nullif(company_code, ''), nullif(data ->> 'company_code', ''), nullif(data ->> 'companyCode', ''), id)),
    'companyCode', upper(coalesce(nullif(company_code, ''), nullif(data ->> 'company_code', ''), nullif(data ->> 'companyCode', ''), id))
  ),
  updated_at = now();

update public.company_users user_row
set
  company_id = coalesce(nullif(user_row.company_id, ''), nullif(user_row.data ->> 'company_id', ''), nullif(user_row.data ->> 'companyId', ''), company.id),
  company_code = upper(coalesce(nullif(user_row.company_code, ''), nullif(user_row.data ->> 'company_code', ''), nullif(user_row.data ->> 'companyCode', ''), company.company_code)),
  nombre = coalesce(nullif(user_row.nombre, ''), nullif(user_row.data ->> 'nombre', ''), nullif(user_row.data ->> 'fullName', '')),
  usuario = coalesce(nullif(user_row.usuario, ''), nullif(user_row.data ->> 'usuario', ''), nullif(user_row.data ->> 'username', ''), user_row.id),
  username = coalesce(nullif(user_row.username, ''), nullif(user_row.data ->> 'username', ''), nullif(user_row.data ->> 'usuario', ''), user_row.id),
  password = coalesce(nullif(user_row.password, ''), nullif(user_row.data ->> 'password', '')),
  password_hash = coalesce(nullif(user_row.password_hash, ''), nullif(user_row.data ->> 'password_hash', ''), nullif(user_row.data ->> 'password', '')),
  rol = coalesce(nullif(user_row.rol, ''), nullif(user_row.data ->> 'rol', ''), nullif(user_row.data ->> 'role', ''), 'Usuario'),
  role = coalesce(nullif(user_row.role, ''), nullif(user_row.data ->> 'role', ''), nullif(user_row.data ->> 'rol', ''), 'Usuario'),
  estado = coalesce(nullif(user_row.estado, ''), nullif(user_row.data ->> 'estado', ''), 'activo'),
  correo = coalesce(nullif(user_row.correo, ''), nullif(user_row.data ->> 'correo', ''), nullif(user_row.data ->> 'email', '')),
  telefono = coalesce(nullif(user_row.telefono, ''), nullif(user_row.data ->> 'telefono', ''), nullif(user_row.data ->> 'phone', '')),
  data = user_row.data || jsonb_build_object(
    'company_id', coalesce(nullif(user_row.company_id, ''), nullif(user_row.data ->> 'company_id', ''), nullif(user_row.data ->> 'companyId', ''), company.id),
    'companyId', coalesce(nullif(user_row.company_id, ''), nullif(user_row.data ->> 'company_id', ''), nullif(user_row.data ->> 'companyId', ''), company.id),
    'company_code', upper(coalesce(nullif(user_row.company_code, ''), nullif(user_row.data ->> 'company_code', ''), nullif(user_row.data ->> 'companyCode', ''), company.company_code)),
    'companyCode', upper(coalesce(nullif(user_row.company_code, ''), nullif(user_row.data ->> 'company_code', ''), nullif(user_row.data ->> 'companyCode', ''), company.company_code))
  ),
  updated_at = now()
from public.companies company
where upper(coalesce(nullif(user_row.company_code, ''), nullif(user_row.data ->> 'company_code', ''), nullif(user_row.data ->> 'companyCode', ''), nullif(user_row.company_id, '')))
  = upper(coalesce(company.company_code, company.id));

update public.company_licenses license
set
  company_id = coalesce(nullif(license.company_id, ''), nullif(license.data ->> 'company_id', ''), nullif(license.data ->> 'companyId', ''), company.id),
  company_code = upper(coalesce(nullif(license.company_code, ''), nullif(license.data ->> 'company_code', ''), nullif(license.data ->> 'companyCode', ''), company.company_code)),
  codigo_licencia = coalesce(nullif(license.codigo_licencia, ''), nullif(license.data ->> 'codigo_licencia', ''), nullif(license.data ->> 'codigoLicencia', ''), license.id),
  plan_contratado = coalesce(nullif(license.plan_contratado, ''), nullif(license.data ->> 'plan_contratado', ''), nullif(license.data ->> 'planContratado', ''), 'Demo'),
  estado = coalesce(nullif(license.estado, ''), nullif(license.data ->> 'estado', ''), 'activa'),
  modulos_activos = coalesce(license.modulos_activos, license.data -> 'modulos_activos', license.data -> 'modulosActivos', '[]'::jsonb),
  fecha_activacion = coalesce(nullif(license.fecha_activacion, ''), nullif(license.data ->> 'fecha_activacion', ''), nullif(license.data ->> 'fechaActivacion', '')),
  fecha_vencimiento = coalesce(nullif(license.fecha_vencimiento, ''), nullif(license.data ->> 'fecha_vencimiento', ''), nullif(license.data ->> 'fechaVencimiento', '')),
  tipo_version = coalesce(nullif(license.tipo_version, ''), nullif(license.data ->> 'tipo_version', ''), nullif(license.data ->> 'tipoVersion', ''), 'Cloud'),
  observacion = coalesce(nullif(license.observacion, ''), nullif(license.data ->> 'observacion', '')),
  data = license.data || jsonb_build_object(
    'company_id', coalesce(nullif(license.company_id, ''), nullif(license.data ->> 'company_id', ''), nullif(license.data ->> 'companyId', ''), company.id),
    'companyId', coalesce(nullif(license.company_id, ''), nullif(license.data ->> 'company_id', ''), nullif(license.data ->> 'companyId', ''), company.id),
    'company_code', upper(coalesce(nullif(license.company_code, ''), nullif(license.data ->> 'company_code', ''), nullif(license.data ->> 'companyCode', ''), company.company_code)),
    'companyCode', upper(coalesce(nullif(license.company_code, ''), nullif(license.data ->> 'company_code', ''), nullif(license.data ->> 'companyCode', ''), company.company_code))
  ),
  updated_at = now()
from public.companies company
where upper(coalesce(nullif(license.company_code, ''), nullif(license.data ->> 'company_code', ''), nullif(license.data ->> 'companyCode', ''), nullif(license.company_id, '')))
  = upper(coalesce(company.company_code, company.id));

create unique index if not exists idx_companies_id_unique on public.companies(id);
create unique index if not exists idx_company_users_company_id_id_unique on public.company_users(company_id, id);
create unique index if not exists idx_company_licenses_id_unique on public.company_licenses(id);

create index if not exists idx_companies_company_code on public.companies(company_code);
create index if not exists idx_company_users_company_code on public.company_users(company_code);
create index if not exists idx_company_users_company_id on public.company_users(company_id);
create index if not exists idx_company_licenses_company_code on public.company_licenses(company_code);
create index if not exists idx_company_licenses_company_id on public.company_licenses(company_id);

notify pgrst, 'reload schema';
