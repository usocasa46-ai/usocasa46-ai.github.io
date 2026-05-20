-- INVE-FAT SYSTEM - esquema base multiempresa para Supabase.
-- Ejecutar manualmente en el SQL Editor de Supabase.
-- La app conserva localStorage como fallback si estas tablas no existen o Supabase no esta configurado.

create or replace function public.invefat_request_header(header_name text)
returns text
language plpgsql
stable
as $$
declare
  headers jsonb;
begin
  begin
    headers := current_setting('request.headers', true)::jsonb;
  exception when others then
    return null;
  end;

  return headers ->> lower(header_name);
end;
$$;

create or replace function public.invefat_request_company_id()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'company_id', ''),
    nullif(public.invefat_request_header('x-company-id'), '')
  );
$$;

create or replace function public.invefat_is_super_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'app_role', '') = 'superadmin'
    or coalesce(auth.jwt() ->> 'role', '') = 'superadmin'
    or public.invefat_request_header('x-user-role') = 'superadmin';
$$;

-- Tablas administrativas. Super Admin administra empresas, licencias, planes y soporte.
create table if not exists public.companies (
  id text primary key,
  company_id text,
  company_code text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_licenses (
  id text primary key,
  company_id text,
  company_code text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_plans (
  id text primary key,
  company_id text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_users (
  id text not null,
  company_id text not null,
  company_code text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, id)
);

create table if not exists public.support_access (
  id text primary key,
  company_id text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_audit_log (
  id text primary key,
  company_id text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compatibilidad para bases creadas antes de normalizar company_id/company_code.
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

update public.companies
set
  company_code = upper(coalesce(nullif(company_code, ''), nullif(data ->> 'company_code', ''), nullif(data ->> 'companyCode', ''), nullif(company_id, ''))),
  company_id = coalesce(nullif(data ->> 'companyId', ''), nullif(data ->> 'company_id', ''), nullif(company_id, ''), id),
  nombre_comercial = coalesce(nullif(nombre_comercial, ''), nullif(data ->> 'nombreComercial', ''), nullif(data ->> 'nombre_comercial', '')),
  razon_social = coalesce(nullif(razon_social, ''), nullif(data ->> 'razonSocial', ''), nullif(data ->> 'razon_social', ''), nullif(data ->> 'nombreComercial', '')),
  rnc = coalesce(nullif(rnc, ''), nullif(data ->> 'rnc', '')),
  telefono = coalesce(nullif(telefono, ''), nullif(data ->> 'telefono', '')),
  correo = coalesce(nullif(correo, ''), nullif(data ->> 'correo', '')),
  direccion = coalesce(nullif(direccion, ''), nullif(data ->> 'direccion', '')),
  estado = coalesce(nullif(estado, ''), nullif(data ->> 'estado', ''), 'activa'),
  plan = coalesce(nullif(plan, ''), nullif(data ->> 'plan', ''), 'Demo'),
  first_login_pending = coalesce(first_login_pending, lower(coalesce(data ->> 'firstLoginPending', data ->> 'first_login_pending', 'false')) in ('true', '1', 'si', 'yes'), false),
  onboarding_completed = coalesce(onboarding_completed, lower(coalesce(data ->> 'onboardingCompleted', data ->> 'onboarding_completed', 'false')) in ('true', '1', 'si', 'yes'), false),
  data = data
    || jsonb_build_object(
      'companyCode', upper(coalesce(nullif(company_code, ''), nullif(data ->> 'company_code', ''), nullif(data ->> 'companyCode', ''), nullif(company_id, ''))),
      'company_code', upper(coalesce(nullif(company_code, ''), nullif(data ->> 'company_code', ''), nullif(data ->> 'companyCode', ''), nullif(company_id, ''))),
      'companyId', coalesce(nullif(data ->> 'companyId', ''), nullif(data ->> 'company_id', ''), nullif(company_id, ''), id),
      'company_id', coalesce(nullif(data ->> 'companyId', ''), nullif(data ->> 'company_id', ''), nullif(company_id, ''), id)
    );

update public.company_licenses license
set
  company_code = upper(coalesce(nullif(license.company_code, ''), nullif(license.data ->> 'company_code', ''), nullif(license.data ->> 'companyCode', ''), nullif(company.company_code, ''), nullif(license.company_id, ''))),
  company_id = coalesce(nullif(license.data ->> 'companyId', ''), nullif(company.id, ''), nullif(license.company_id, '')),
  codigo_licencia = coalesce(nullif(license.codigo_licencia, ''), nullif(license.data ->> 'codigoLicencia', ''), nullif(license.data ->> 'codigo_licencia', ''), license.id),
  plan_contratado = coalesce(nullif(license.plan_contratado, ''), nullif(license.data ->> 'planContratado', ''), nullif(license.data ->> 'plan_contratado', ''), nullif(company.plan, ''), 'Demo'),
  estado = coalesce(nullif(license.estado, ''), nullif(license.data ->> 'estado', ''), 'activa'),
  modulos_activos = coalesce(license.modulos_activos, license.data -> 'modulosActivos', license.data -> 'modulos_activos', '[]'::jsonb),
  fecha_activacion = coalesce(nullif(license.fecha_activacion, ''), nullif(license.data ->> 'fechaActivacion', ''), nullif(license.data ->> 'fecha_activacion', '')),
  fecha_vencimiento = coalesce(nullif(license.fecha_vencimiento, ''), nullif(license.data ->> 'fechaVencimiento', ''), nullif(license.data ->> 'fecha_vencimiento', '')),
  max_usuarios = coalesce(license.max_usuarios, nullif(license.data ->> 'maxUsuarios', '')::integer, nullif(license.data ->> 'max_usuarios', '')::integer, 0),
  max_sucursales = coalesce(license.max_sucursales, nullif(license.data ->> 'maxSucursales', '')::integer, nullif(license.data ->> 'max_sucursales', '')::integer, 0),
  max_almacenes = coalesce(license.max_almacenes, nullif(license.data ->> 'maxAlmacenes', '')::integer, nullif(license.data ->> 'max_almacenes', '')::integer, 0),
  tipo_version = coalesce(nullif(license.tipo_version, ''), nullif(license.data ->> 'tipoVersion', ''), nullif(license.data ->> 'tipo_version', ''), 'Cloud'),
  observacion = coalesce(nullif(license.observacion, ''), nullif(license.data ->> 'observacion', '')),
  data = license.data
    || jsonb_build_object(
      'companyCode', upper(coalesce(nullif(license.company_code, ''), nullif(license.data ->> 'company_code', ''), nullif(license.data ->> 'companyCode', ''), nullif(company.company_code, ''), nullif(license.company_id, ''))),
      'company_code', upper(coalesce(nullif(license.company_code, ''), nullif(license.data ->> 'company_code', ''), nullif(license.data ->> 'companyCode', ''), nullif(company.company_code, ''), nullif(license.company_id, ''))),
      'companyId', coalesce(nullif(license.data ->> 'companyId', ''), nullif(company.id, ''), nullif(license.company_id, '')),
      'company_id', coalesce(nullif(license.data ->> 'companyId', ''), nullif(company.id, ''), nullif(license.company_id, ''))
    )
from public.companies company
where upper(coalesce(nullif(license.company_code, ''), nullif(license.data ->> 'company_code', ''), nullif(license.data ->> 'companyCode', ''), nullif(license.company_id, '')))
  = upper(company.company_code);

update public.company_users user_row
set
  company_code = upper(coalesce(nullif(user_row.company_code, ''), nullif(user_row.data ->> 'company_code', ''), nullif(user_row.data ->> 'companyCode', ''), nullif(company.company_code, ''), nullif(user_row.company_id, ''))),
  company_id = coalesce(nullif(user_row.data ->> 'companyId', ''), nullif(company.id, ''), nullif(user_row.company_id, '')),
  nombre = coalesce(nullif(user_row.nombre, ''), nullif(user_row.data ->> 'fullName', ''), nullif(user_row.data ->> 'nombre', '')),
  usuario = coalesce(nullif(user_row.usuario, ''), nullif(user_row.data ->> 'username', ''), nullif(user_row.data ->> 'usuario', ''), user_row.id),
  username = coalesce(nullif(user_row.username, ''), nullif(user_row.data ->> 'username', ''), nullif(user_row.data ->> 'usuario', ''), user_row.id),
  password = coalesce(nullif(user_row.password, ''), nullif(user_row.data ->> 'password', '')),
  password_hash = coalesce(nullif(user_row.password_hash, ''), nullif(user_row.data ->> 'password_hash', ''), nullif(user_row.data ->> 'password', '')),
  rol = coalesce(nullif(user_row.rol, ''), nullif(user_row.data ->> 'role', ''), nullif(user_row.data ->> 'rol', ''), 'Usuario'),
  role = coalesce(nullif(user_row.role, ''), nullif(user_row.data ->> 'role', ''), nullif(user_row.data ->> 'rol', ''), 'Usuario'),
  estado = coalesce(nullif(user_row.estado, ''), nullif(user_row.data ->> 'estado', ''), case when coalesce((user_row.data ->> 'active')::boolean, true) then 'activo' else 'inactivo' end),
  must_change_password = coalesce(user_row.must_change_password, lower(coalesce(user_row.data ->> 'mustChangePassword', user_row.data ->> 'must_change_password', 'false')) in ('true', '1', 'si', 'yes'), false),
  correo = coalesce(nullif(user_row.correo, ''), nullif(user_row.data ->> 'email', ''), nullif(user_row.data ->> 'correo', '')),
  telefono = coalesce(nullif(user_row.telefono, ''), nullif(user_row.data ->> 'phone', ''), nullif(user_row.data ->> 'telefono', '')),
  data = user_row.data
    || jsonb_build_object(
      'companyCode', upper(coalesce(nullif(user_row.company_code, ''), nullif(user_row.data ->> 'company_code', ''), nullif(user_row.data ->> 'companyCode', ''), nullif(company.company_code, ''), nullif(user_row.company_id, ''))),
      'company_code', upper(coalesce(nullif(user_row.company_code, ''), nullif(user_row.data ->> 'company_code', ''), nullif(user_row.data ->> 'companyCode', ''), nullif(company.company_code, ''), nullif(user_row.company_id, ''))),
      'companyId', coalesce(nullif(user_row.data ->> 'companyId', ''), nullif(company.id, ''), nullif(user_row.company_id, '')),
      'company_id', coalesce(nullif(user_row.data ->> 'companyId', ''), nullif(company.id, ''), nullif(user_row.company_id, ''))
    )
from public.companies company
where upper(coalesce(nullif(user_row.company_code, ''), nullif(user_row.data ->> 'company_code', ''), nullif(user_row.data ->> 'companyCode', ''), nullif(user_row.company_id, '')))
  = upper(company.company_code);

-- Tablas operativas con company_id obligatorio para separar datos por empresa.
create table if not exists public.products (
  id text not null,
  company_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, id)
);

create table if not exists public.customers (
  id text not null,
  company_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, id)
);

create table if not exists public.suppliers (
  id text not null,
  company_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, id)
);

create table if not exists public.invoices (
  id text not null,
  company_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, id)
);

create table if not exists public.quotes (
  id text not null,
  company_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, id)
);

create table if not exists public.settings (
  id text not null,
  company_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, id)
);

create table if not exists public.ncf_sequences (
  id text not null,
  company_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, id)
);

create table if not exists public.ncf_used (
  id text not null,
  company_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, id)
);

create table if not exists public.inventory_movements (
  id text not null,
  company_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, id)
);

create index if not exists idx_company_licenses_company_id on public.company_licenses(company_id);
create index if not exists idx_companies_company_code on public.companies(company_code);
create index if not exists idx_company_licenses_company_code on public.company_licenses(company_code);
create index if not exists idx_company_users_company_id on public.company_users(company_id);
create index if not exists idx_company_users_company_code on public.company_users(company_code);
create index if not exists idx_support_access_company_id on public.support_access(company_id);
create index if not exists idx_products_company_id on public.products(company_id);
create index if not exists idx_customers_company_id on public.customers(company_id);
create index if not exists idx_suppliers_company_id on public.suppliers(company_id);
create index if not exists idx_invoices_company_id on public.invoices(company_id);
create index if not exists idx_quotes_company_id on public.quotes(company_id);
create index if not exists idx_settings_company_id on public.settings(company_id);
create index if not exists idx_ncf_sequences_company_id on public.ncf_sequences(company_id);
create index if not exists idx_ncf_used_company_id on public.ncf_used(company_id);
create index if not exists idx_inventory_movements_company_id on public.inventory_movements(company_id);

alter table public.companies enable row level security;
alter table public.company_licenses enable row level security;
alter table public.system_plans enable row level security;
alter table public.company_users enable row level security;
alter table public.support_access enable row level security;
alter table public.system_audit_log enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.invoices enable row level security;
alter table public.quotes enable row level security;
alter table public.settings enable row level security;
alter table public.ncf_sequences enable row level security;
alter table public.ncf_used enable row level security;
alter table public.inventory_movements enable row level security;

-- Politicas administrativas. En produccion, preferir Supabase Auth con claim app_role = superadmin.
drop policy if exists "super_admin_companies" on public.companies;
create policy "super_admin_companies" on public.companies for all using (public.invefat_is_super_admin()) with check (public.invefat_is_super_admin());

drop policy if exists "company_login_companies" on public.companies;
create policy "company_login_companies" on public.companies
  for select
  using (
    company_code = public.invefat_request_company_id()
    or company_code = public.invefat_request_header('x-company-code')
    or data ->> 'companyCode' = public.invefat_request_company_id()
    or data ->> 'companyCode' = public.invefat_request_header('x-company-code')
    or data ->> 'company_code' = public.invefat_request_company_id()
    or data ->> 'company_code' = public.invefat_request_header('x-company-code')
  );

drop policy if exists "super_admin_company_licenses" on public.company_licenses;
create policy "super_admin_company_licenses" on public.company_licenses for all using (public.invefat_is_super_admin()) with check (public.invefat_is_super_admin());

drop policy if exists "company_login_licenses" on public.company_licenses;
create policy "company_login_licenses" on public.company_licenses
  for select
  using (
    company_code = public.invefat_request_company_id()
    or company_code = public.invefat_request_header('x-company-code')
    or data ->> 'companyCode' = public.invefat_request_company_id()
    or data ->> 'companyCode' = public.invefat_request_header('x-company-code')
    or data ->> 'company_code' = public.invefat_request_company_id()
    or data ->> 'company_code' = public.invefat_request_header('x-company-code')
  );

drop policy if exists "super_admin_system_plans" on public.system_plans;
create policy "super_admin_system_plans" on public.system_plans for all using (public.invefat_is_super_admin()) with check (public.invefat_is_super_admin());

drop policy if exists "super_admin_support_access" on public.support_access;
create policy "super_admin_support_access" on public.support_access for all using (public.invefat_is_super_admin()) with check (public.invefat_is_super_admin());

drop policy if exists "super_admin_system_audit_log" on public.system_audit_log;
create policy "super_admin_system_audit_log" on public.system_audit_log for all using (public.invefat_is_super_admin()) with check (public.invefat_is_super_admin());

-- Usuarios por empresa: Super Admin administra, cada empresa solo ve/escribe los suyos.
drop policy if exists "company_users_by_company" on public.company_users;
create policy "company_users_by_company" on public.company_users
  for all
  using (
    public.invefat_is_super_admin()
    or company_code = public.invefat_request_company_id()
    or company_code = public.invefat_request_header('x-company-code')
    or data ->> 'companyCode' = public.invefat_request_company_id()
    or data ->> 'company_code' = public.invefat_request_header('x-company-code')
  )
  with check (
    public.invefat_is_super_admin()
    or company_code = public.invefat_request_company_id()
    or company_code = public.invefat_request_header('x-company-code')
    or data ->> 'companyCode' = public.invefat_request_company_id()
    or data ->> 'company_code' = public.invefat_request_header('x-company-code')
  );

-- Datos operativos: company_id debe coincidir con la empresa activa.
-- El Panel Super Admin puede ejecutar pruebas controladas enviando x-company-id
-- de la empresa evaluada. Las pruebas solo crean/leen registros tecnicos
-- como TEST-SUPABASE-001 y no exponen datos privados.
drop policy if exists "products_by_company" on public.products;
create policy "products_by_company" on public.products for all using (company_id = public.invefat_request_company_id()) with check (company_id = public.invefat_request_company_id());

drop policy if exists "customers_by_company" on public.customers;
create policy "customers_by_company" on public.customers for all using (company_id = public.invefat_request_company_id()) with check (company_id = public.invefat_request_company_id());

drop policy if exists "suppliers_by_company" on public.suppliers;
create policy "suppliers_by_company" on public.suppliers for all using (company_id = public.invefat_request_company_id()) with check (company_id = public.invefat_request_company_id());

drop policy if exists "invoices_by_company" on public.invoices;
create policy "invoices_by_company" on public.invoices for all using (company_id = public.invefat_request_company_id()) with check (company_id = public.invefat_request_company_id());

drop policy if exists "quotes_by_company" on public.quotes;
create policy "quotes_by_company" on public.quotes for all using (company_id = public.invefat_request_company_id()) with check (company_id = public.invefat_request_company_id());

drop policy if exists "settings_by_company" on public.settings;
create policy "settings_by_company" on public.settings for all using (company_id = public.invefat_request_company_id()) with check (company_id = public.invefat_request_company_id());

drop policy if exists "ncf_sequences_by_company" on public.ncf_sequences;
create policy "ncf_sequences_by_company" on public.ncf_sequences for all using (company_id = public.invefat_request_company_id()) with check (company_id = public.invefat_request_company_id());

drop policy if exists "ncf_used_by_company" on public.ncf_used;
create policy "ncf_used_by_company" on public.ncf_used for all using (company_id = public.invefat_request_company_id()) with check (company_id = public.invefat_request_company_id());

drop policy if exists "inventory_movements_by_company" on public.inventory_movements;
create policy "inventory_movements_by_company" on public.inventory_movements for all using (company_id = public.invefat_request_company_id()) with check (company_id = public.invefat_request_company_id());

-- Nota de seguridad:
-- La app envia x-company-id en modo de prueba porque aun no usa Supabase Auth.
-- Para produccion, mover la identidad al JWT y eliminar la dependencia de encabezados cliente.
notify pgrst, 'reload schema';
