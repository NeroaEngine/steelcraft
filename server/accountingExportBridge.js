function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(rows, headers) {
  return [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))].join('\n');
}

export async function ensureAccountingExportBridgeSchema(db) {
  await db.query(`
    create table if not exists accounting_export_packages (
      id bigserial primary key,
      tenant_id text not null default 'steelcraft-demo',
      destination text not null,
      package_type text not null,
      status text not null default 'prepared',
      approval_status text not null default 'waiting_customer_approval',
      row_count integer not null default 0,
      exported_at timestamptz,
      scan_ref text,
      vault_ref text,
      guard_ref text,
      payload jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
}

export async function buildAccountingExportPackage(db, { destination = 'quickbooks_csv', packageType = 'daily_comptroller', tenantId = 'steelcraft-demo' } = {}) {
  await ensureAccountingExportBridgeSchema(db);
  const tx = await db.query(`
    select bt.id, bt.posted_date, bt.description, bt.merchant_name, bt.amount, bt.category, bt.match_status, bt.suggested_match, ba.account_name
    from accounting_bank_transactions bt
    join accounting_bank_accounts ba on ba.id = bt.bank_account_id
    join accounting_bank_connections bc on bc.id = ba.bank_connection_id
    where bc.tenant_id = $1 and bt.match_status in ('committed_to_books','matched_pending_customer_approval','needs_customer_review')
    order by bt.posted_date, bt.id
  `, [tenantId]);

  const rows = tx.rows.map((row) => ({
    Date: row.posted_date,
    Description: row.description,
    Name: row.merchant_name || row.description,
    Account: row.account_name,
    Category: row.suggested_match?.ledgerAccount || row.category || 'Uncategorized',
    Amount: row.amount,
    MatchStatus: row.match_status,
    Confidence: row.suggested_match?.confidence || '',
    Memo: row.suggested_match?.matchedTo || ''
  }));

  const csv = toCsv(rows, ['Date', 'Description', 'Name', 'Account', 'Category', 'Amount', 'MatchStatus', 'Confidence', 'Memo']);
  const result = await db.query(
    `insert into accounting_export_packages (tenant_id, destination, package_type, row_count, payload)
     values ($1,$2,$3,$4,$5)
     returning *`,
    [tenantId, destination, packageType, rows.length, { rows, csv, note: 'Prepared export package. Customer approval required before sending to external accounting system.' }]
  );
  return result.rows[0];
}

export async function listAccountingExportPackages(db, tenantId = 'steelcraft-demo') {
  await ensureAccountingExportBridgeSchema(db);
  const result = await db.query('select id, tenant_id, destination, package_type, status, approval_status, row_count, exported_at, scan_ref, vault_ref, guard_ref, created_at, updated_at from accounting_export_packages where tenant_id = $1 order by created_at desc limit 50', [tenantId]);
  return result.rows;
}

export async function getAccountingExportCsv(db, packageId) {
  await ensureAccountingExportBridgeSchema(db);
  const result = await db.query('select * from accounting_export_packages where id = $1', [packageId]);
  const pkg = result.rows[0];
  if (!pkg) return null;
  return { package: pkg, csv: pkg.payload?.csv || '' };
}

export async function approveAccountingExportPackage(db, packageId, { actor = 'customer' } = {}) {
  await ensureAccountingExportBridgeSchema(db);
  const result = await db.query(
    `update accounting_export_packages
     set approval_status = 'approved', status = 'ready_to_send', updated_at = now(), payload = payload || $2::jsonb
     where id = $1
     returning *`,
    [packageId, { approvedBy: actor, approvedAt: new Date().toISOString() }]
  );
  return result.rows[0] || null;
}
