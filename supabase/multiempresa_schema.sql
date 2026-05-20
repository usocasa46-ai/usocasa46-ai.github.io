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
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_licenses (
  id text primary key,
  company_id text,
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
create index if not exists idx_company_users_company_id on public.company_users(company_id);
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
    company_id = public.invefat_request_company_id()
    or data ->> 'companyCode' = public.invefat_request_company_id()
    or data ->> 'companyCode' = public.invefat_request_header('x-company-code')
  );

drop policy if exists "super_admin_company_licenses" on public.company_licenses;
create policy "super_admin_company_licenses" on public.company_licenses for all using (public.invefat_is_super_admin()) with check (public.invefat_is_super_admin());

drop policy if exists "company_login_licenses" on public.company_licenses;
create policy "company_login_licenses" on public.company_licenses
  for select
  using (
    company_id = public.invefat_request_company_id()
    or data ->> 'companyCode' = public.invefat_request_company_id()
    or data ->> 'companyCode' = public.invefat_request_header('x-company-code')
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
  using (public.invefat_is_super_admin() or company_id = public.invefat_request_company_id())
  with check (public.invefat_is_super_admin() or company_id = public.invefat_request_company_id());

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
