import crypto from 'node:crypto';

function receiptId(seed) {
  return `acct-ai:${crypto.createHash('sha256').update(`${seed}:${Date.now()}`).digest('hex').slice(0, 24)}`;
}

function vaultId(seed) {
  return `vault:${crypto.createHash('sha256').update(`vault:${seed}:${Date.now()}`).digest('hex').slice(0, 24)}`;
}

function guardId(seed) {
  return `guard:${crypto.createHash('sha256').update(`guard:${seed}:${Date.now()}`).digest('hex').slice(0, 24)}`;
}

function scanId(seed) {
  return `scan:${crypto.createHash('sha256').update(`scan:${seed}:${Date.now()}`).digest('hex').slice(0, 20)}`;
}

export async function ensureAccountingAiReceiptSchema(db) {
  await db.query(`
    create table if not exists accounting_ai_action_receipts (
      id bigserial primary key,
      tenant_id text not null default 'steelcraft-demo',
      actor text not null default 'neroacomptroller',
      action_type text not null,
      action_label text not null,
      entity_type text,
      entity_id text,
      confidence numeric(5,2),
      status text not null default 'recorded',
      customer_commit_required boolean not null default true,
      customer_committed_at timestamptz,
      receipt_id text not null unique,
      vault_lineage_id text not null,
      guard_receipt_id text not null,
      scan_event_id text not null,
      metadata_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );
  `);
}

export async function recordAccountingAiReceipt(db, payload = {}) {
  await ensureAccountingAiReceiptSchema(db);
  const seed = `${payload.tenantId || 'steelcraft-demo'}:${payload.actionType}:${payload.entityType}:${payload.entityId}:${JSON.stringify(payload.metadata || {})}`;
  const result = await db.query(
    `insert into accounting_ai_action_receipts (tenant_id, actor, action_type, action_label, entity_type, entity_id, confidence, status, customer_commit_required, receipt_id, vault_lineage_id, guard_receipt_id, scan_event_id, metadata_json)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     returning *`,
    [
      payload.tenantId || 'steelcraft-demo',
      payload.actor || 'neroacomptroller',
      payload.actionType || 'accounting_ai_action',
      payload.actionLabel || payload.actionType || 'Accounting AI action',
      payload.entityType || null,
      payload.entityId || null,
      payload.confidence ?? null,
      payload.status || 'recorded',
      payload.customerCommitRequired ?? true,
      receiptId(seed),
      vaultId(seed),
      guardId(seed),
      scanId(seed),
      payload.metadata || {}
    ]
  );
  return result.rows[0];
}

export async function listAccountingAiReceipts(db, limit = 100) {
  await ensureAccountingAiReceiptSchema(db);
  const result = await db.query(`select * from accounting_ai_action_receipts order by created_at desc limit $1`, [limit]);
  return result.rows;
}

export async function markAccountingAiReceiptsCommitted(db, { actor = 'customer', metadata = {} } = {}) {
  await ensureAccountingAiReceiptSchema(db);
  const result = await db.query(
    `update accounting_ai_action_receipts
     set status = 'customer_committed', customer_committed_at = now(), metadata_json = metadata_json || $1::jsonb
     where customer_commit_required = true and customer_committed_at is null
     returning *`,
    [{ committedBy: actor, ...metadata }]
  );
  return result.rows;
}
