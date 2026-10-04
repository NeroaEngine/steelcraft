const proofColumns = `
  add column if not exists dag_event_id text,
  add column if not exists source_repo text,
  add column if not exists source_commit_sha text,
  add column if not exists source_packet_id text,
  add column if not exists source_runner_id text
`;

export async function ensureAccountingDagSchema(db) {
  await db.query(`
    create table if not exists accounting_subscriptions (
      id bigserial primary key,
      customer_id bigint references accounting_customers(id) on delete set null,
      project_id bigint references projects(id) on delete set null,
      subscription_number text unique,
      status text not null default 'active',
      billing_cycle text,
      amount numeric(14,2) not null default 0,
      currency text not null default 'USD',
      start_date date,
      end_date date,
      dag_event_id text,
      source_repo text,
      source_commit_sha text,
      source_packet_id text,
      source_runner_id text,
      raw jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists accounting_credits (
      id bigserial primary key,
      customer_id bigint references accounting_customers(id) on delete set null,
      invoice_id bigint references accounting_invoices(id) on delete set null,
      credit_number text unique,
      credit_date date not null default current_date,
      amount numeric(14,2) not null default 0,
      currency text not null default 'USD',
      reason text,
      status text not null default 'open',
      dag_event_id text,
      source_repo text,
      source_commit_sha text,
      source_packet_id text,
      source_runner_id text,
      raw jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);

  const tables = [
    'accounting_accounts',
    'accounting_customers',
    'accounting_vendors',
    'accounting_invoices',
    'accounting_bills',
    'accounting_payments',
    'accounting_journal_entries',
    'accounting_periods'
  ];

  for (const tableName of tables) {
    await db.query(`alter table ${tableName} ${proofColumns}`);
  }

  await db.query(`
    alter table accounting_invoices add column if not exists currency text not null default 'USD';
    alter table accounting_bills add column if not exists currency text not null default 'USD';
    alter table accounting_payments add column if not exists currency text not null default 'USD';
  `);
}

export async function attachDagEvent(db, tableName, id, dagEventId) {
  if (!dagEventId) return null;
  const allowedTables = new Set([
    'accounting_invoices',
    'accounting_payments',
    'accounting_bills',
    'accounting_journal_entries',
    'accounting_customers',
    'accounting_subscriptions',
    'accounting_credits',
    'accounting_accounts'
  ]);
  if (!allowedTables.has(tableName)) throw new Error(`Invalid accounting table for DAG event: ${tableName}`);
  const result = await db.query(`update ${tableName} set dag_event_id = $1, updated_at = now() where id = $2 returning *`, [dagEventId, id]);
  return result.rows[0] || null;
}
