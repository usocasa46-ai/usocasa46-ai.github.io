-- INVE-FAT SYSTEM - reinicio total de datos en Supabase.
-- Ejecutar manualmente en Supabase SQL Editor solo despues de descargar backup.
-- Este script NO borra estructura, NO hace DROP TABLE y deja la base sin empresas.

truncate table
  public.system_audit_log,
  public.support_access,
  public.inventory_movements,
  public.ncf_used,
  public.ncf_sequences,
  public.settings,
  public.quotes,
  public.invoices,
  public.suppliers,
  public.customers,
  public.products,
  public.company_users,
  public.system_plans,
  public.company_licenses,
  public.companies
restart identity;

-- Si en fases futuras se agregan nuevas tablas multiempresa, incluirlas aqui
-- antes de ejecutar un reinicio total en produccion.
