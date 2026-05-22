-- Ofertas y promociones para INVE-FAT SYSTEM.
-- Este script crea las tablas necesarias sin borrar datos existentes.

create table if not exists public.promotions (
  id text not null,
  company_id text not null,
  company_code text not null,
  name text not null,
  description text,
  type text not null,
  status text not null default 'Activa',
  start_date date,
  end_date date,
  start_time time,
  end_time time,
  priority integer not null default 10,
  stackable boolean not null default false,
  conditions jsonb not null default '{}'::jsonb,
  actions jsonb not null default '{}'::jsonb,
  products jsonb not null default '[]'::jsonb,
  categories jsonb not null default '[]'::jsonb,
  customers jsonb not null default '[]'::jsonb,
  coupon_code text,
  max_uses integer not null default 0,
  used_count integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, id)
);

create table if not exists public.promotion_usage (
  id text not null,
  company_id text not null,
  company_code text not null,
  promotion_id text not null,
  invoice_id text,
  customer_id text,
  source text,
  products jsonb not null default '[]'::jsonb,
  discount_amount numeric(14, 2) not null default 0,
  total_before numeric(14, 2) not null default 0,
  total_after numeric(14, 2) not null default 0,
  user_id text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, id)
);

create index if not exists promotions_company_code_idx on public.promotions (company_code);
create index if not exists promotions_company_status_idx on public.promotions (company_id, status);
create index if not exists promotions_coupon_code_idx on public.promotions (company_id, coupon_code);
create index if not exists promotion_usage_company_created_idx on public.promotion_usage (company_id, created_at desc);
create index if not exists promotion_usage_promotion_idx on public.promotion_usage (company_id, promotion_id);

-- RLS se mantiene sin activar en este script. Antes de produccion configure politicas
-- por company_id/company_code y permisos para roles autorizados.

notify pgrst, 'reload schema';
