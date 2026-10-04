const DEFAULT_TENANT_ID = 'steelcraft-default';

const moduleTables = [
  'accounting_accounts',
  'accounting_customers',
  'accounting_vendors',
  'accounting_invoices',
  'accounting_invoice_lines',
  'accounting_bills',
  'accounting_bill_lines',
  'accounting_payments',
  'accounting_journal_entries',
  'accounting_journal_lines',
  'accounting_periods',
  'accounting_subscriptions',
  'accounting_credits'
];

export async function ensureAccountingInfrastructure(db) {
  await db.query(`
    create table if not exists accounting_tenant_settings (
      id bigserial primary key,
      tenant_id text not null unique,
      tenant_name text not null,
      base_currency text not null default 'USD',
      fiscal_year_start_month integer not null default 1,
      default_terms text not null default 'Net 30',
      accounting_basis text not null default 'accrual',
      is_module_extractable boolean not null default true,
      status text not null default 'active',
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists accounting_number_sequences (
      id bigserial primary key,
      tenant_id text not null default '${DEFAULT_TENANT_ID}',
      sequence_key text not null,
      prefix text not null,
      next_number bigint not null default 1,
      padding integer not null default 5,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (tenant_id, sequence_key)
    );

    create table if not exists accounting_module_checks (
      id bigserial primary key,
      tenant_id text not null default '${DEFAULT_TENANT_ID}',
      check_key text not null,
      check_status text not null default 'pending',
      detail text,
      metadata jsonb not null default '{}'::jsonb,
      checked_at timestamptz not null default now(),
      unique (tenant_id, check_key)
    );

    create table if not exists accounting_event_outbox (
      id bigserial primary key,
      tenant_id text not null default '${DEFAULT_TENANT_ID}',
      event_type text not null,
      entity_type text not null,
      entity_id text,
      payload jsonb not null default '{}'::jsonb,
      dag_event_id text,
      status text not null default 'pending',
      attempts integer not null default 0,
      last_error text,
      created_at timestamptz not null default now(),
      processed_at timestamptz
    );
  `);

  for (const tableName of moduleTables) {
    await db.query(`alter table ${tableName} add column if not exists tenant_id text not null default '${DEFAULT_TENANT_ID}'`);
  }

  await db.query(`
    insert into accounting_tenant_settings (tenant_id, tenant_name, base_currency, default_terms, accounting_basis, is_module_extractable)
    values ($1, $2, 'USD', 'Net 30', 'accrual', true)
    on conflict (tenant_id) do update set tenant_name = excluded.tenant_name, updated_at = now();

    insert into accounting_number_sequences (tenant_id, sequence_key, prefix, next_number, padding)
    values
      ($1, 'invoice', 'INV', 1, 5),
      ($1, 'bill', 'BILL', 1, 5),
      ($1, 'payment', 'PAY', 1, 5),
      ($1, 'journal', 'JE', 1, 5),
      ($1, 'credit', 'CR', 1, 5)
    on conflict (tenant_id, sequence_key) do nothing;
  `, [DEFAULT_TENANT_ID, 'Steel Craft']);
}

export async function nextAccountingNumber(db, sequenceKey, tenantId = DEFAULT_TENANT_ID) {
  const result = await db.query(
    `update accounting_number_sequences
     set next_number = next_number + 1, updated_at = now()
     where tenant_id = $1 and sequence_key = $2
     returning prefix, next_number - 1 as issued_number, padding`,
    [tenantId, sequenceKey]
  );
  const row = result.rows[0];
  if (!row) throw new Error(`Accounting number sequence not found: ${sequenceKey}`);
  return `${row.prefix}-${String(row.issued_number).padStart(row.padding, '0')}`;
}

export async function getAccountingInfrastructureStatus(db, tenantId = DEFAULT_TENANT_ID) {
  await ensureAccountingInfrastructure(db);
  const tables = await db.query(
    `select table_name from information_schema.tables
     where table_schema = 'public'
       and (table_name like 'accounting_%')
     order by table_name`
  );
  const tenant = await db.query(`select * from accounting_tenant_settings where tenant_id = $1`, [tenantId]);
  const sequences = await db.query(`select sequence_key, prefix, next_number, padding from accounting_number_sequences where tenant_id = $1 order by sequence_key`, [tenantId]);
  const checks = await db.query(`select check_key, check_status, detail, metadata, checked_at from accounting_module_checks where tenant_id = $1 order by check_key`, [tenantId]);
  return {
    tenantId,
    tenant: tenant.rows[0] || null,
    tables: tables.rows.map((row) => row.table_name),
    sequences: sequences.rows,
    checks: checks.rows,
    extractable: true
  };
}

export async function recordAccountingModuleCheck(db, checkKey, checkStatus, detail, metadata = {}, tenantId = DEFAULT_TENANT_ID) {
  await ensureAccountingInfrastructure(db);
  const result = await db.query(
    `insert into accounting_module_checks (tenant_id, check_key, check_status, detail, metadata, checked_at)
     values ($1, $2, $3, $4, $5, now())
     on conflict (tenant_id, check_key) do update set check_status = excluded.check_status, detail = excluded.detail, metadata = excluded.metadata, checked_at = now()
     returning *`,
    [tenantId, checkKey, checkStatus, detail, metadata]
  );
  return result.rows[0];
}

export async function enqueueAccountingEvent(db, event) {
  await ensureAccountingInfrastructure(db);
  const result = await db.query(
    `insert into accounting_event_outbox (tenant_id, event_type, entity_type, entity_id, payload, dag_event_id, status)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [event.tenantId || DEFAULT_TENANT_ID, event.eventType, event.entityType, event.entityId || null, event.payload || {}, event.dagEventId || null, event.status || 'pending']
  );
  return result.rows[0];
}

export { DEFAULT_TENANT_ID };
