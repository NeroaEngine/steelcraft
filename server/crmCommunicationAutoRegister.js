import express from 'express';
import { Pool } from 'pg';
import { ensureCrmCommunicationSchema, getCrmCommunicationReadiness, provisionTenantCommunicationAccount } from './crmCommunicationSchema.js';

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

const STEELCRAFT_BOARD_LABELS = {
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

function getDatabaseUrl() {
  if (!process.env.DATABASE_URL) return null;
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.delete('sslmode');
  return url.toString();
}

const databaseUrl = getDatabaseUrl();
const crmPool = databaseUrl ? new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } }) : null;

function requireCrmDatabase() {
  if (!crmPool) {
    const error = new Error('DATABASE_URL is not configured.');
    error.statusCode = 500;
    throw error;
  }
  return crmPool;
}

function tenantKey(req) {
  return req.params.tenantKey || req.query.tenantKey || req.body?.tenantKey || req.body?.tenant_id || req.body?.tenantId || process.env.STEELCRAFT_TENANT_KEY || 'steelcraft';
}

function providerPlan() {
  return [
    { provider_key: 'neroa_mail', provider_label: 'Neroa Mail', channel: 'email', status: 'planned', account_mode: 'neroa_master', provisioning_scope: 'tenant_subaccount' },
    { provider_key: 'sendgrid', provider_label: 'SendGrid Email Pipe', channel: 'email', status: 'available_pipe', account_mode: 'neroa_master', provisioning_scope: 'tenant_subaccount' },
    { provider_key: 'twilio', provider_label: 'Twilio SMS Pipe', channel: 'sms', status: 'available_pipe', account_mode: 'neroa_master', provisioning_scope: 'tenant_subaccount' },
    { provider_key: 'twilio', provider_label: 'Twilio Voice Pipe', channel: 'voice', status: 'available_pipe', account_mode: 'neroa_master', provisioning_scope: 'tenant_subaccount' },
    { provider_key: 'telnyx', provider_label: 'Telnyx SMS / Voice Pipe', channel: 'sms', status: 'available_pipe', account_mode: 'neroa_master', provisioning_scope: 'tenant_subaccount' },
    { provider_key: 'bandwidth', provider_label: 'Bandwidth Carrier Pipe', channel: 'sms', status: 'future_pipe', account_mode: 'neroa_master', provisioning_scope: 'tenant_subaccount' },
    { provider_key: 'neroa_provider', provider_label: 'Neroa Communications API', channel: 'multi', status: 'level_2_foundation', account_mode: 'neroa_master', provisioning_scope: 'tenant_subaccount' }
  ];
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

async function getSteelcraftSqlAdminStatus(db, tenantId) {
  const existing = await db.query(`select table_name from information_schema.tables where table_schema = 'public' and table_name = any($1) order by table_name`, [STEELCRAFT_BUSINESS_TABLES]);
  const existingNames = existing.rows.map((row) => row.table_name);
  const counts = {};

  for (const tableName of STEELCRAFT_BUSINESS_TABLES) {
    if (!existingNames.includes(tableName)) {
      counts[tableName] = null;
      continue;
    }
    const result = await db.query(`select count(*)::int as count from ${tableName} where tenant_key = $1`, [tenantId]);
    counts[tableName] = result.rows[0]?.count ?? 0;
  }

  return {
    tenantId,
    databaseConnected: true,
    expectedCount: STEELCRAFT_BUSINESS_TABLES.length,
    existingCount: existingNames.length,
    missing: STEELCRAFT_BUSINESS_TABLES.filter((tableName) => !existingNames.includes(tableName)),
    tables: STEELCRAFT_BUSINESS_TABLES.map((tableName) => ({ tableName, label: STEELCRAFT_BOARD_LABELS[tableName] || tableName, exists: existingNames.includes(tableName), rowCount: counts[tableName] })),
    generatedAt: new Date().toISOString()
  };
}

async function seedProviders(db, tenantId) {
  for (const provider of providerPlan()) {
    await db.query(
      `insert into communication_providers (tenant_id, provider_key, provider_label, channel, status, account_mode, provisioning_scope, master_account_ref, config)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (tenant_id, provider_key, channel) do update set provider_label = excluded.provider_label, status = excluded.status, account_mode = excluded.account_mode, provisioning_scope = excluded.provisioning_scope, master_account_ref = excluded.master_account_ref, config = excluded.config, updated_at = now()`,
      [tenantId, provider.provider_key, provider.provider_label, provider.channel, provider.status, provider.account_mode, provider.provisioning_scope, process.env.NEROA_COMMUNICATIONS_MASTER_ACCOUNT_REF || process.env.TWILIO_ACCOUNT_SID || null, { seeded: true, layer: provider.provider_key === 'neroa_provider' ? 'level_2' : 'pipe', customerSees: 'Neroa Communications' }]
    );
  }
}

async function getStatus(db, tenantId) {
  await ensureCrmCommunicationSchema(db);
  await seedProviders(db, tenantId);
  const counts = await db.query(`
    select
      (select count(*)::int from crm_companies where tenant_id = $1) as companies,
      (select count(*)::int from crm_people where tenant_id = $1) as people,
      (select count(*)::int from communication_threads where tenant_id = $1) as threads,
      (select count(*)::int from communication_messages where tenant_id = $1) as messages,
      (select count(*)::int from communication_jobs where tenant_id = $1) as jobs,
      (select count(*)::int from communication_providers where tenant_id = $1) as providers,
      (select count(*)::int from communication_tenant_accounts where tenant_id = $1) as tenant_accounts,
      (select count(*)::int from communication_sender_identities where tenant_id = $1) as sender_identities
  `, [tenantId]);
  const providers = await db.query('select id, provider_key, provider_label, channel, account_mode, provisioning_scope, status, credentials_ref, master_account_ref, tenant_account_ref, config, updated_at from communication_providers where tenant_id = $1 order by provider_key, channel', [tenantId]);
  const tenantAccounts = await db.query('select * from communication_tenant_accounts where tenant_id = $1 order by created_at desc', [tenantId]);
  return { tenantId, readiness: getCrmCommunicationReadiness(), counts: counts.rows[0], providers: providers.rows, tenantAccounts: tenantAccounts.rows };
}

function registerCrmCommunicationRoutes(app) {
  if (app.__neroaCrmCommunicationRoutesRegistered) return;
  app.__neroaCrmCommunicationRoutesRegistered = true;

  app.get('/api/steelcraft/sql-admin/status', async (req, res, next) => {
    try {
      const db = requireCrmDatabase();
      const status = await getSteelcraftSqlAdminStatus(db, tenantKey(req));
      res.json({ ok: true, ...status });
    } catch (error) { next(error); }
  });

  app.post('/api/steelcraft/sql-admin/ensure', async (req, res, next) => {
    try {
      const db = requireCrmDatabase();
      await ensureSteelcraftBusinessSchema(db);
      const status = await getSteelcraftSqlAdminStatus(db, tenantKey(req));
      res.json({ ok: true, ensured: true, ...status });
    } catch (error) { next(error); }
  });

  app.get('/api/crm/communications/status', async (req, res, next) => {
    try {
      const db = requireCrmDatabase();
      const status = await getStatus(db, tenantKey(req));
      res.json({ ok: true, ...status });
    } catch (error) { next(error); }
  });

  app.get('/api/profiles/:tenantKey/crm/communications/status', async (req, res, next) => {
    try {
      const db = requireCrmDatabase();
      const status = await getStatus(db, tenantKey(req));
      res.json({ ok: true, ...status });
    } catch (error) { next(error); }
  });

  app.post('/api/crm/communications/provision', async (req, res, next) => {
    try {
      const db = requireCrmDatabase();
      const tenantId = tenantKey(req);
      const account = await provisionTenantCommunicationAccount(db, {
        tenantId,
        accountName: req.body?.accountName || req.body?.account_name || `${tenantId} Neroa Communications`,
        providerKey: req.body?.providerKey || req.body?.provider_key || 'neroa_provider',
        providerChannel: req.body?.providerChannel || req.body?.provider_channel || 'multi',
        channels: req.body?.channels || ['email', 'sms', 'voice', 'task'],
        actor: req.body?.actor || 'setup',
        raw: req.body || {}
      });
      res.json({ ok: true, tenantId, account, customerExperience: 'Customer is provisioned through Neroa Communications. Provider pipe remains behind Neroa.' });
    } catch (error) { next(error); }
  });

  app.post('/api/profiles/:tenantKey/crm/communications/provision', async (req, res, next) => {
    try {
      const db = requireCrmDatabase();
      const tenantId = tenantKey(req);
      const account = await provisionTenantCommunicationAccount(db, {
        tenantId,
        accountName: req.body?.accountName || req.body?.account_name || `${tenantId} Neroa Communications`,
        providerKey: req.body?.providerKey || req.body?.provider_key || 'neroa_provider',
        providerChannel: req.body?.providerChannel || req.body?.provider_channel || 'multi',
        channels: req.body?.channels || ['email', 'sms', 'voice', 'task'],
        actor: req.body?.actor || 'setup',
        raw: req.body || {}
      });
      res.json({ ok: true, tenantId, account, customerExperience: 'Customer is provisioned through Neroa Communications. Provider pipe remains behind Neroa.' });
    } catch (error) { next(error); }
  });

  app.get('/api/crm/communication-providers', async (req, res, next) => {
    try {
      const db = requireCrmDatabase();
      const tenantId = tenantKey(req);
      await ensureCrmCommunicationSchema(db);
      await seedProviders(db, tenantId);
      const result = await db.query('select * from communication_providers where tenant_id = $1 order by provider_key, channel', [tenantId]);
      res.json({ ok: true, tenantId, providers: result.rows });
    } catch (error) { next(error); }
  });

  app.post('/api/crm/communication-providers', async (req, res, next) => {
    try {
      const db = requireCrmDatabase();
      const tenantId = tenantKey(req);
      await ensureCrmCommunicationSchema(db);
      const providerKey = req.body?.providerKey || req.body?.provider_key || 'neroa_provider';
      const channel = req.body?.channel || 'multi';
      const label = req.body?.providerLabel || req.body?.provider_label || providerKey;
      const status = req.body?.status || 'draft';
      const result = await db.query(
        `insert into communication_providers (tenant_id, provider_key, provider_label, channel, account_mode, provisioning_scope, status, credentials_ref, master_account_ref, tenant_account_ref, config)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         on conflict (tenant_id, provider_key, channel) do update set provider_label = excluded.provider_label, account_mode = excluded.account_mode, provisioning_scope = excluded.provisioning_scope, status = excluded.status, credentials_ref = excluded.credentials_ref, master_account_ref = excluded.master_account_ref, tenant_account_ref = excluded.tenant_account_ref, config = excluded.config, updated_at = now()
         returning *`,
        [tenantId, providerKey, label, channel, req.body?.accountMode || req.body?.account_mode || 'neroa_master', req.body?.provisioningScope || req.body?.provisioning_scope || 'tenant_subaccount', status, req.body?.credentialsRef || req.body?.credentials_ref || null, req.body?.masterAccountRef || req.body?.master_account_ref || null, req.body?.tenantAccountRef || req.body?.tenant_account_ref || null, req.body?.config || {}]
      );
      res.json({ ok: true, tenantId, provider: result.rows[0] });
    } catch (error) { next(error); }
  });

  app.get('/api/crm/communication-jobs', async (req, res, next) => {
    try {
      const db = requireCrmDatabase();
      const tenantId = tenantKey(req);
      await ensureCrmCommunicationSchema(db);
      const result = await db.query('select * from communication_jobs where tenant_id = $1 order by scheduled_at nulls last, created_at desc limit 100', [tenantId]);
      res.json({ ok: true, tenantId, jobs: result.rows });
    } catch (error) { next(error); }
  });

  app.post('/api/crm/communication-jobs', async (req, res, next) => {
    try {
      const db = requireCrmDatabase();
      const tenantId = tenantKey(req);
      await ensureCrmCommunicationSchema(db);
      const result = await db.query(
        `insert into communication_jobs (tenant_id, company_id, person_id, thread_id, job_type, channel, provider_key, scheduled_at, status, approval_required, payload, scan_ref, vault_ref, guard_ref)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         returning *`,
        [
          tenantId,
          req.body?.companyId || req.body?.company_id || null,
          req.body?.personId || req.body?.person_id || null,
          req.body?.threadId || req.body?.thread_id || null,
          req.body?.jobType || req.body?.job_type || 'internal_task',
          req.body?.channel || 'task',
          req.body?.providerKey || req.body?.provider_key || 'neroa_provider',
          req.body?.scheduledAt || req.body?.scheduled_at || null,
          req.body?.status || 'draft',
          req.body?.approvalRequired ?? req.body?.approval_required ?? true,
          req.body?.payload || {},
          req.body?.scanRef || req.body?.scan_ref || null,
          req.body?.vaultRef || req.body?.vault_ref || null,
          req.body?.guardRef || req.body?.guard_ref || null
        ]
      );
      res.json({ ok: true, tenantId, job: result.rows[0] });
    } catch (error) { next(error); }
  });

  app.post('/api/crm/inbound/email', async (req, res, next) => {
    try {
      const db = requireCrmDatabase();
      const tenantId = tenantKey(req);
      await ensureCrmCommunicationSchema(db);
      const subject = req.body?.subject || 'Inbound email';
      const fromEmail = req.body?.from || req.body?.fromEmail || req.body?.email || null;
      const thread = await db.query(
        `insert into communication_threads (tenant_id, room_context, subject, status, intent, priority, raw)
         values ($1,'contacts',$2,'open',$3,$4,$5)
         returning *`,
        [tenantId, subject, req.body?.intent || 'unclassified', req.body?.priority || 'normal', { source: 'crm_inbound_email', fromEmail }]
      );
      const message = await db.query(
        `insert into communication_messages (tenant_id, thread_id, direction, channel, provider_key, subject, body, delivery_status, intent, raw)
         values ($1,$2,'inbound','email',$3,$4,$5,'received',$6,$7)
         returning *`,
        [tenantId, thread.rows[0].id, req.body?.providerKey || req.body?.provider_key || 'neroa_mail', subject, req.body?.body || '', req.body?.intent || 'unclassified', req.body || {}]
      );
      res.json({ ok: true, tenantId, thread: thread.rows[0], message: message.rows[0] });
    } catch (error) { next(error); }
  });
}

const originalListen = express.application.listen;
if (!express.application.__neroaCrmCommunicationAutoRegister) {
  express.application.listen = function patchedListen(...args) {
    registerCrmCommunicationRoutes(this);
    return originalListen.apply(this, args);
  };
  Object.defineProperty(express.application, '__neroaCrmCommunicationAutoRegister', { value: true });
}
