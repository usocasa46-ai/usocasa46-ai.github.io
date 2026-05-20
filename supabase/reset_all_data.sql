-- INVE-FAT SYSTEM - reinicio total de datos en Supabase.
-- Esto borra todos los datos de prueba de Supabase y deja la base sin empresas.
-- Ejecutar manualmente en Supabase SQL Editor solo despues de descargar backup.
-- Este script NO borra estructura, NO hace DROP TABLE y NO hace DROP SCHEMA.

do $$
declare
  tables_to_clean text[] := array[
    'payroll_email_queue',
    'pay_slips',
    'payrolls',
    'overtime',
    'vacations',
    'employee_absences',
    'attendance',
    'employee_contracts',
    'hr_positions',
    'hr_departments',
    'employees',
    'electronic_archive',
    'electronic_commercial_responses',
    'electronic_received_documents',
    'electronic_documents',
    'electronic_usage',
    'electronic_contingency_queue',
    'dgii_606',
    'dgii_607',
    'rnc_registry',
    'reports',
    'sales_reports',
    'pos_sales',
    'pos_suspended_sales',
    'warehouse_transfers',
    'warehouse_dispatches',
    'warehouse_receipts',
    'warehouse_locations',
    'warehouses',
    'supplier_payments',
    'supplier_credit_notes',
    'supplier_invoices',
    'purchase_orders',
    'purchase_requests',
    'inventory_counts',
    'inventory_adjustments',
    'inventory_movements',
    'ncf_used',
    'ncf_sequences',
    'settings',
    'quotes',
    'invoices',
    'suppliers',
    'customers',
    'products',
    'system_audit_log',
    'support_access',
    'company_users',
    'system_plans',
    'company_licenses',
    'companies'
  ];
  truncate_list text;
begin
  select string_agg(format('%I.%I', schemaname, tablename), ', ')
    into truncate_list
  from pg_tables
  where schemaname = 'public'
    and tablename = any(tables_to_clean);

  if truncate_list is not null then
    execute 'truncate table ' || truncate_list || ' restart identity cascade';
  end if;
end $$;

-- Si en fases futuras se agregan nuevas tablas multiempresa, incluirlas en
-- tables_to_clean antes de ejecutar un reinicio total en produccion.
