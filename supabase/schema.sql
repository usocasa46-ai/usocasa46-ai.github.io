-- Esquema minimo para preparar INVE-FAT SYSTEM con Supabase.
-- Las tablas usan una columna JSONB flexible para no romper la estructura actual.

create table if not exists public.products (
  id text primary key,
  company_id text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id text primary key,
  company_id text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id text primary key,
  company_id text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id text primary key,
  company_id text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id text primary key,
  company_id text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists company_id text;
alter table public.customers add column if not exists company_id text;
alter table public.invoices add column if not exists company_id text;
alter table public.quotes add column if not exists company_id text;
alter table public.settings add column if not exists company_id text;

alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.invoices enable row level security;
alter table public.quotes enable row level security;
alter table public.settings enable row level security;

-- Politicas simples para fase inicial con anon key.
-- Ajustar antes de produccion con autenticacion real por usuario/rol.
drop policy if exists "anon_select_products" on public.products;
drop policy if exists "anon_write_products" on public.products;
create policy "anon_select_products" on public.products for select using (true);
create policy "anon_write_products" on public.products for all using (true) with check (true);

drop policy if exists "anon_select_customers" on public.customers;
drop policy if exists "anon_write_customers" on public.customers;
create policy "anon_select_customers" on public.customers for select using (true);
create policy "anon_write_customers" on public.customers for all using (true) with check (true);

drop policy if exists "anon_select_invoices" on public.invoices;
drop policy if exists "anon_write_invoices" on public.invoices;
create policy "anon_select_invoices" on public.invoices for select using (true);
create policy "anon_write_invoices" on public.invoices for all using (true) with check (true);

drop policy if exists "anon_select_quotes" on public.quotes;
drop policy if exists "anon_write_quotes" on public.quotes;
create policy "anon_select_quotes" on public.quotes for select using (true);
create policy "anon_write_quotes" on public.quotes for all using (true) with check (true);

drop policy if exists "anon_select_settings" on public.settings;
drop policy if exists "anon_write_settings" on public.settings;
create policy "anon_select_settings" on public.settings for select using (true);
create policy "anon_write_settings" on public.settings for all using (true) with check (true);
