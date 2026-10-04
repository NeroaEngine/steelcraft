import express from 'express';
import { Pool } from 'pg';

const STEELCRAFT_BUSINESS_TABLES = [
  'steelcraft_crm_accounts',
  'steelcraft_crm_contacts',
  'steelcraft_crm_account_contacts',
  'steelcraft_crm_notes',
  'steelcraft_sales_leads',
  'steelcraft_sales_quotes',
  'steelcraft_project_jobs',
  'steelcraft_project_delivery',
  'steelcraft_import_batches',
  'steelcraft_import_rows',
  'steelcraft_audit_log',
  'steelcraft_estimate_working_board',
  'steelcraft_estimate_sheet',
  'steelcraft_quotations'
];

const LABELS = {
  steelcraft_crm_accounts: 'CRM Accounts',
  steelcraft_crm_contacts: 'CRM Contacts',
  steelcraft_crm_account_contacts: 'Account Contact Links',
  steelcraft_crm_notes: 'CRM Notes',
  steelcraft_sales_leads: 'Lead Board',
  steelcraft_sales_quotes: 'Quote / Estimate Board',
  steelcraft_project_jobs: 'Job / Project Board',
  steelcraft_project_delivery: 'Project Delivery',
  steelcraft_import_batches: 'Import Batches',
  steelcraft_import_rows: 'Import Rows',
  steelcraft_audit_log: 'Audit Log',
  steelcraft_estimate_working_board: 'Working Board',
  steelcraft_estimate_sheet: 'Estimate Sheet',
  steelcraft_quotations: 'Quotation'
};

function getDatabaseConfig() {
  if (!process.env.DATABASE_URL) return null;
  const url = new URL(process.env.DATABASE_URL);
  const sslmode = url.searchParams.get('sslmode');
  url.searchParams.delete('sslmode');
  return {
    connectionString: url.toString(),
    ssl: sslmode && sslmode !== 'disable' ? { rejectUnauthorized: false } : false
  };
}

const dbConfig = getDatabaseConfig();
const pool = dbConfig ? new Pool(dbConfig) : null;

function requireDatabase() {
  if (!pool) {
    const error = new Error('DATABASE_URL is not configured.');
    error.statusCode = 500;
    throw error;
  }
  return pool;
}

function tenantKey(req) {
  return req.params.tenantKey || req.query.tenantKey || req.body?.tenantKey || req.body?.tenant_id || req.body?.tenantId || process.env.STEELCRAFT_TENANT_KEY || 'steelcraft';
}

async function ensureSteelcraftBusinessSchema(db) {
  await db.query(`
    create table if not exists steelcraft_crm_accounts (id bigserial primary key, tenant_key text not null default 'steelcraft', account_name text not null, account_type text, industry text, website text, main_email text, main_phone text, billing_email text, billing_phone text, address_line1 text, address_line2 text, city text, state text, postal_code text, status text not null default 'active', notes text, raw jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
    create table if not exists steelcraft_crm_contacts (id bigserial primary key, tenant_key text not null default 'steelcraft', account_id bigint references steelcraft_crm_accounts(id) on delete set null, full_name text not null, first_name text, last_name text, contact_type text, title text, company_name text, email text, phone text, mobile text, website text, address_line1 text, address_line2 text, city text, state text, postal_code text, status text not null default 'active', notes text, raw jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
    create table if not exists steelcraft_crm_account_contacts (id bigserial primary key, tenant_key text not null default 'steelcraft', account_id bigint not null references steelcraft_crm_accounts(id) on delete cascade, contact_id bigint not null references steelcraft_crm_contacts(id) on delete cascade, relationship_type text default 'contact', is_primary boolean not null default false, raw jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (tenant_key, account_id, contact_id, relationship_type));
    create table if not exists steelcraft_crm_notes (id bigserial primary key, tenant_key text not null default 'steelcraft', account_id bigint references steelcraft_crm_accounts(id) on delete cascade, contact_id bigint references steelcraft_crm_contacts(id) on delete cascade, note_type text not null default 'note', subject text, body text not null, actor text, follow_up_at timestamptz, raw jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
    create table if not exists steelcraft_sales_leads (id bigserial primary key, tenant_key text not null default 'steelcraft', account_id bigint references steelcraft_crm_accounts(id) on delete set null, contact_id bigint references steelcraft_crm_contacts(id) on delete set null, lead_name text not null, project_name text, project_address text, city text, state text, postal_code text, stage text not null default 'Lead', sales_rep text, bid_due date, estimated_value numeric(14,2), probability numeric(5,2), notes text, raw jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
    create table if not exists steelcraft_sales_quotes (id bigserial primary key, tenant_key text not null default 'steelcraft', lead_id bigint references steelcraft_sales_leads(id) on delete set null, account_id bigint references steelcraft_crm_accounts(id) on delete set null, contact_id bigint references steelcraft_crm_contacts(id) on delete set null, quote_number text not null, quote_status text not null default 'Estimating', project_name text, project_address text, city text, state text, postal_code text, sales_rep text, estimator text, bid_due date, date_quote_sent date, quote_type text, quote_value numeric(14,2), total_with_alternates numeric(14,2), notes text, raw jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (tenant_key, quote_number));
    create table if not exists steelcraft_project_jobs (id bigserial primary key, tenant_key text not null default 'steelcraft', quote_id bigint references steelcraft_sales_quotes(id) on delete set null, account_id bigint references steelcraft_crm_accounts(id) on delete set null, contact_id bigint references steelcraft_crm_contacts(id) on delete set null, job_number text not null, project_name text not null, project_address text, city text, state text, postal_code text, job_status text not null default 'Awarded', contract_number text, contract_date date, contract_value numeric(14,2), project_manager text, raw jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (tenant_key, job_number));
    create table if not exists steelcraft_project_delivery (id bigserial primary key, tenant_key text not null default 'steelcraft', job_id bigint references steelcraft_project_jobs(id) on delete cascade, delivery_status text not null default 'Pending', project_info jsonb not null default '{}'::jsonb, checklist jsonb not null default '{}'::jsonb, material_sov jsonb not null default '{}'::jsonb, labor_sov jsonb not null default '{}'::jsonb, invoice_data jsonb not null default '{}'::jsonb, change_orders jsonb not null default '[]'::jsonb, raw jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
    create table if not exists steelcraft_import_batches (id bigserial primary key, tenant_key text not null default 'steelcraft', import_type text not null, source_filename text, source_sheet text, status text not null default 'draft', total_rows integer not null default 0, inserted_rows integer not null default 0, updated_rows integer not null default 0, skipped_rows integer not null default 0, error_rows integer not null default 0, duplicate_rows integer not null default 0, actor text, preview jsonb not null default '{}'::jsonb, rollback_snapshot jsonb not null default '{}'::jsonb, raw jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), committed_at timestamptz, rolled_back_at timestamptz);
    create table if not exists steelcraft_import_rows (id bigserial primary key, tenant_key text not null default 'steelcraft', batch_id bigint not null references steelcraft_import_batches(id) on delete cascade, row_number integer, target_table text, target_id bigint, action text, status text not null default 'pending', error_message text, row_hash text, row_data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
    create table if not exists steelcraft_audit_log (id bigserial primary key, tenant_key text not null default 'steelcraft', actor text, action text not null, entity_table text, entity_id text, before_data jsonb, after_data jsonb, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
    create table if not exists steelcraft_estimate_working_board (id bigserial primary key, tenant_key text not null default 'steelcraft', quote_id bigint not null references steelcraft_sales_quotes(id) on delete cascade, project_name text, salesperson_estimator text, email_address text, payment_terms text default 'COD', notes text, project_notes text, furnish_and_erect jsonb not null default '{}'::jsonb, erection_only jsonb not null default '{}'::jsonb, quotation_descriptions jsonb not null default '{}'::jsonb, wind_loads_and_codes jsonb not null default '{}'::jsonb, raw jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (tenant_key, quote_id));
    create table if not exists steelcraft_estimate_sheet (id bigserial primary key, tenant_key text not null default 'steelcraft', quote_id bigint not null references steelcraft_sales_quotes(id) on delete cascade, estimate_number text, estimate_date date, project_name text, estimated_by text, square_feet numeric(14,2), local_tax_rate numeric(8,4), quote_po text, main_lines jsonb not null default '[]'::jsonb, alternates jsonb not null default '[]'::jsonb, deposits jsonb not null default '{}'::jsonb, totals jsonb not null default '{}'::jsonb, raw jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (tenant_key, quote_id));
    create table if not exists steelcraft_quotations (id bigserial primary key, tenant_key text not null default 'steelcraft', quote_id bigint not null references steelcraft_sales_quotes(id) on delete cascade, estimate_sheet_id bigint references steelcraft_estimate_sheet(id) on delete set null, quotation_type text not null default 'F&E Quotation', quotation_number text, revision integer not null default 0, status text not null default 'draft', sent_at timestamptz, expires_at date, customer_payload jsonb not null default '{}'::jsonb, line_items jsonb not null default '[]'::jsonb, alternates jsonb not null default '[]'::jsonb, exclusions jsonb not null default '[]'::jsonb, clarifications jsonb not null default '[]'::jsonb, totals jsonb not null default '{}'::jsonb, raw jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
  `);
}

async function getStatus(db, tenantId) {
  const existing = await db.query('select table_name from information_schema.tables where table_schema = $1 and table_name = any($2) order by table_name', ['public', STEELCRAFT_BUSINESS_TABLES]);
  const existingNames = existing.rows.map((row) => row.table_name);
  const tables = [];

  for (const tableName of STEELCRAFT_BUSINESS_TABLES) {
    let rowCount = null;
    if (existingNames.includes(tableName)) {
      const count = await db.query(`select count(*)::int as count from ${tableName} where tenant_key = $1`, [tenantId]);
      rowCount = count.rows[0]?.count ?? 0;
    }
    tables.push({ tableName, label: LABELS[tableName] || tableName, exists: existingNames.includes(tableName), rowCount });
  }

  return {
    tenantId,
    databaseConnected: true,
    expectedCount: STEELCRAFT_BUSINESS_TABLES.length,
    existingCount: existingNames.length,
    missing: STEELCRAFT_BUSINESS_TABLES.filter((tableName) => !existingNames.includes(tableName)),
    tables,
    generatedAt: new Date().toISOString()
  };
}

function registerSteelcraftSqlAdminRoutes(app) {
  if (app.__steelcraftSqlAdminRoutesRegistered) return;
  app.__steelcraftSqlAdminRoutesRegistered = true;

  app.get('/api/steelcraft/sql-admin/status', async (req, res, next) => {
    try {
      const db = requireDatabase();
      res.json({ ok: true, ...(await getStatus(db, tenantKey(req))) });
    } catch (error) { next(error); }
  });

  app.post('/api/steelcraft/sql-admin/ensure', async (req, res, next) => {
    try {
      const db = requireDatabase();
      await ensureSteelcraftBusinessSchema(db);
      res.json({ ok: true, ensured: true, ...(await getStatus(db, tenantKey(req))) });
    } catch (error) { next(error); }
  });
}

const originalListen = express.application.listen;
if (!express.application.__steelcraftSqlAdminAutoRegister) {
  express.application.listen = function patchedSteelcraftSqlAdminListen(...args) {
    registerSteelcraftSqlAdminRoutes(this);
    return originalListen.apply(this, args);
  };
  Object.defineProperty(express.application, '__steelcraftSqlAdminAutoRegister', { value: true });
}
