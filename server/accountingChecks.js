export async function ensureAccountingChecksSchema(db) {
  await db.query(`
    create table if not exists accounting_checks (
      id bigserial primary key,
      tenant_id text not null default 'steelcraft-default',
      check_number text not null,
      vendor_id bigint references accounting_vendors(id) on delete set null,
      bill_id bigint references accounting_bills(id) on delete set null,
      project_id bigint references projects(id) on delete set null,
      payee_name text not null,
      check_date date not null default current_date,
      amount numeric(14,2) not null default 0,
      currency text not null default 'USD',
      memo text,
      status text not null default 'draft',
      payment_id bigint references accounting_payments(id) on delete set null,
      dag_event_id text,
      source_repo text,
      source_commit_sha text,
      source_packet_id text,
      source_runner_id text,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (tenant_id, check_number)
    );
  `);

  await db.query(`
    alter table accounting_payments add column if not exists check_id bigint references accounting_checks(id) on delete set null;
  `);
}

export async function listAccountingChecks(db) {
  await ensureAccountingChecksSchema(db);
  const result = await db.query(`
    select ac.*, av.vendor_name, ab.bill_number, p.name as project_name
    from accounting_checks ac
    left join accounting_vendors av on av.id = ac.vendor_id
    left join accounting_bills ab on ab.id = ac.bill_id
    left join projects p on p.id = ac.project_id
    order by ac.created_at desc
    limit 100
  `);
  return result.rows;
}

export async function createAccountingCheck(db, payload = {}) {
  await ensureAccountingChecksSchema(db);
  const amount = Number(payload.amount || 0);
  const checkNumber = payload.checkNumber || `CHK-${Date.now()}`;
  const result = await db.query(
    `insert into accounting_checks (tenant_id, check_number, vendor_id, bill_id, project_id, payee_name, check_date, amount, currency, memo, status, source_repo, source_commit_sha, source_packet_id, source_runner_id, raw)
     values ($1,$2,$3,$4,$5,$6,coalesce($7,current_date),$8,$9,$10,$11,$12,$13,$14,$15,$16)
     returning *`,
    [payload.tenantId || 'steelcraft-default', checkNumber, payload.vendorId || null, payload.billId || null, payload.projectId || null, payload.payeeName || payload.payee || 'Manual Payee', payload.checkDate || null, amount, payload.currency || 'USD', payload.memo || null, payload.status || 'draft', payload.sourceRepo || null, payload.sourceCommitSha || null, payload.sourcePacketId || null, payload.sourceRunnerId || null, payload]
  );
  return result.rows[0];
}

export async function markCheckPrinted(db, checkId, payload = {}) {
  await ensureAccountingChecksSchema(db);
  const result = await db.query(
    `update accounting_checks
     set status = $1,
         updated_at = now(),
         raw = coalesce(raw, '{}'::jsonb) || $2::jsonb
     where id = $3
     returning *`,
    [payload.status || 'printed', { printedAt: new Date().toISOString(), actor: payload.actor || 'accounting' }, checkId]
  );
  return result.rows[0] || null;
}

export async function attachCheckDagEvent(db, checkId, dagEventId) {
  if (!dagEventId) return null;
  const result = await db.query(`update accounting_checks set dag_event_id = $1, updated_at = now() where id = $2 returning *`, [dagEventId, checkId]);
  return result.rows[0] || null;
}
