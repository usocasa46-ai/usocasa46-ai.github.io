-- INVE-FAT SYSTEM - verificacion de columnas core multiempresa.
-- Ejecutar en Supabase SQL Editor para confirmar que companies,
-- company_users y company_licenses estan alineadas con el frontend.

select
  table_name,
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('companies', 'company_users', 'company_licenses')
order by table_name, ordinal_position;

select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('companies', 'company_users', 'company_licenses')
order by tablename, indexname;
