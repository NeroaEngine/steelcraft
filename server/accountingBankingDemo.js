const DEMO_TENANT = 'steelcraft-demo';

function todayOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function txId(name) {
  return `demo_${String(name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
}

export async function ensureAccountingBankingDemoSchema(db) {
  await db.query(`
    create table if not exists accounting_bank_connections (
      id bigserial primary key,
      tenant_id text not null default 'default',
      provider text not null,
      provider_item_id text not null,
      institution_name text not null,
      status text not null default 'active',
      sync_cursor text,
      last_sync_at timestamptz,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (tenant_id, provider, provider_item_id)
    );

    create table if not exists accounting_bank_accounts (
      id bigserial primary key,
      bank_connection_id bigint not null references accounting_bank_connections(id) on delete cascade,
      provider_account_id text not null,
      account_name text not null,
      account_type text not null,
      account_subtype text,
      mask text,
      current_balance numeric(14,2) not null default 0,
      available_balance numeric(14,2),
      accounting_account_id bigint references accounting_accounts(id),
      status text not null default 'active',
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (bank_connection_id, provider_account_id)
    );

    create table if not exists accounting_bank_transactions (
      id bigserial primary key,
      bank_account_id bigint not null references accounting_bank_accounts(id) on delete cascade,
      provider_transaction_id text not null unique,
      posted_date date not null,
      authorized_date date,
      description text not null,
      merchant_name text,
      amount numeric(14,2) not null,
      pending boolean not null default false,
      transaction_type text not null default 'debit',
      category text,
      match_status text not null default 'unreviewed',
      suggested_match jsonb not null default '{}'::jsonb,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists accounting_worker_runs (
      id bigserial primary key,
      worker_key text not null,
      tenant_id text not null default 'default',
      status text not null default 'completed',
      started_at timestamptz not null default now(),
      finished_at timestamptz,
      summary text,
      raw jsonb not null default '{}'::jsonb
    );

    create table if not exists accounting_worker_tasks (
      id bigserial primary key,
      worker_run_id bigint references accounting_worker_runs(id) on delete cascade,
      task_type text not null,
      entity_type text not null,
      entity_id text,
      status text not null default 'needs_review',
      priority text not null default 'normal',
      title text not null,
      description text,
      suggested_action text,
      confidence numeric(5,2) not null default 0,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
}

export async function seedDemoBankingData(db) {
  await ensureAccountingBankingDemoSchema(db);
  const connectionResult = await db.query(
    `insert into accounting_bank_connections (tenant_id, provider, provider_item_id, institution_name, status, last_sync_at, raw)
     values ($1, 'demo', 'demo_steelcraft_bank', 'Neroa Demo Bank', 'active', now(), $2)
     on conflict (tenant_id, provider, provider_item_id) do update set institution_name = excluded.institution_name, status = 'active', last_sync_at = now(), updated_at = now()
     returning *`,
    [DEMO_TENANT, { mode: 'demo', note: 'Safe local test banking feed. No real bank connection.' }]
  );
  const connection = connectionResult.rows[0];

  const accounts = [
    ['demo_operating_checking', 'Steel Craft Operating Checking', 'depository', 'checking', '4821', 84325.40, 81970.14, 'Primary operating cash account.'],
    ['demo_payroll_checking', 'Steel Craft Payroll Checking', 'depository', 'checking', '1138', 18250.00, 18250.00, 'Payroll funding account.'],
    ['demo_company_card', 'Steel Craft Company Card', 'credit', 'credit_card', '9099', -1240.77, -1240.77, 'Company card test feed.']
  ];
  const accountRows = [];
  for (const account of accounts) {
    const result = await db.query(
      `insert into accounting_bank_accounts (bank_connection_id, provider_account_id, account_name, account_type, account_subtype, mask, current_balance, available_balance, raw)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (bank_connection_id, provider_account_id) do update set account_name = excluded.account_name, current_balance = excluded.current_balance, available_balance = excluded.available_balance, updated_at = now()
       returning *`,
      [connection.id, account[0], account[1], account[2], account[3], account[4], account[5], account[6], { note: account[7] }]
    );
    accountRows.push(result.rows[0]);
  }

  const byProviderId = Object.fromEntries(accountRows.map((account) => [account.provider_account_id, account]));
  const transactions = [
    ['demo_operating_checking', 'Acme Development LLC Deposit', 18500.00, 'credit', 'Customer payment', 'customer_payment', todayOffset(-1), { customer: 'Acme Development LLC', account: 'Accounts Receivable', confidence: 94, action: 'Match deposit to open invoice.' }],
    ['demo_operating_checking', 'ABC Steel Supply', -6420.55, 'debit', 'Material purchase', 'materials', todayOffset(-2), { vendor: 'ABC Steel Supply', account: 'Job Materials', confidence: 91, action: 'Create vendor expense and ask for project.' }],
    ['demo_operating_checking', 'Sunbelt Rentals', -1280.00, 'debit', 'Equipment rental', 'equipment', todayOffset(-3), { vendor: 'Sunbelt Rentals', account: 'Equipment Rental', confidence: 87, action: 'Code to project cost after approval.' }],
    ['demo_operating_checking', 'Florida Department of Revenue', -950.00, 'debit', 'Sales tax payment', 'tax', todayOffset(-5), { vendor: 'Florida Department of Revenue', account: 'Sales Tax Payable', confidence: 89, action: 'Apply against sales tax liability.' }],
    ['demo_payroll_checking', 'Payroll Funding Transfer', -9250.00, 'debit', 'Payroll', 'payroll', todayOffset(-4), { account: 'Payroll Clearing', confidence: 78, action: 'Review payroll run before posting journal entry.' }],
    ['demo_company_card', 'Home Depot', -428.19, 'debit', 'Card charge', 'materials', todayOffset(-1), { vendor: 'Home Depot', account: 'Small Tools and Supplies', confidence: 86, action: 'Approve card expense or assign project.' }],
    ['demo_company_card', 'Shell Oil', -164.32, 'debit', 'Fuel', 'fuel', todayOffset(-2), { vendor: 'Shell Oil', account: 'Vehicle Fuel', confidence: 83, action: 'Approve fuel expense.' }],
    ['demo_company_card', 'Unknown ACH Debit', -775.00, 'debit', 'Unknown', 'uncategorized', todayOffset(-1), { account: 'Uncategorized Expense', confidence: 38, action: 'Needs manual review before posting.' }]
  ];

  for (const tx of transactions) {
    const account = byProviderId[tx[0]];
    await db.query(
      `insert into accounting_bank_transactions (bank_account_id, provider_transaction_id, posted_date, authorized_date, description, merchant_name, amount, transaction_type, category, match_status, suggested_match, raw)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'unreviewed',$10,$11)
       on conflict (provider_transaction_id) do update set posted_date = excluded.posted_date, amount = excluded.amount, suggested_match = excluded.suggested_match, updated_at = now()`,
      [account.id, txId(`${tx[0]}_${tx[1]}`), tx[6], tx[6], tx[1], tx[1], tx[2], tx[3], tx[5], tx[7], { type: tx[4], demo: true }]
    );
  }

  return getDemoBankingData(db);
}

export async function getDemoBankingData(db) {
  await ensureAccountingBankingDemoSchema(db);
  const connections = await db.query(`select * from accounting_bank_connections where tenant_id = $1 order by created_at desc`, [DEMO_TENANT]);
  const accounts = await db.query(`
    select ba.*, bc.institution_name
    from accounting_bank_accounts ba
    join accounting_bank_connections bc on bc.id = ba.bank_connection_id
    where bc.tenant_id = $1
    order by ba.account_type, ba.account_name
  `, [DEMO_TENANT]);
  const transactions = await db.query(`
    select bt.*, ba.account_name, ba.account_type, ba.mask
    from accounting_bank_transactions bt
    join accounting_bank_accounts ba on ba.id = bt.bank_account_id
    join accounting_bank_connections bc on bc.id = ba.bank_connection_id
    where bc.tenant_id = $1
    order by bt.posted_date desc, bt.id desc
    limit 50
  `, [DEMO_TENANT]);
  return { connections: connections.rows, accounts: accounts.rows, transactions: transactions.rows };
}

function taskForTransaction(tx) {
  const suggestion = tx.suggested_match || {};
  const confidence = Number(suggestion.confidence || 0);
  const priority = confidence >= 85 ? 'ready' : confidence >= 70 ? 'normal' : 'high';
  const title = confidence >= 85 ? `Ready to approve: ${tx.merchant_name}` : `Review needed: ${tx.merchant_name}`;
  return {
    taskType: 'bank_transaction_review',
    entityType: 'accounting_bank_transaction',
    entityId: String(tx.id),
    priority,
    title,
    description: `${tx.account_name} ${tx.amount >= 0 ? 'deposit' : 'charge'} for ${Number(tx.amount).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}.`,
    suggestedAction: suggestion.action || 'Review transaction coding.',
    confidence,
    raw: { transaction: tx, suggestion }
  };
}

export async function runDemoAccountingWorker(db) {
  await seedDemoBankingData(db);
  const startedAt = new Date();
  const data = await getDemoBankingData(db);
  const runResult = await db.query(
    `insert into accounting_worker_runs (worker_key, tenant_id, status, started_at, summary, raw)
     values ('accounting.bookkeeper.demo.v1', $1, 'running', $2, $3, $4)
     returning *`,
    [DEMO_TENANT, startedAt, 'Reviewing demo bank feed, cash movement, and bookkeeping matches.', { mode: 'demo', accountCount: data.accounts.length, transactionCount: data.transactions.length }]
  );
  const run = runResult.rows[0];
  const tasks = [];
  for (const tx of data.transactions) {
    const task = taskForTransaction(tx);
    const result = await db.query(
      `insert into accounting_worker_tasks (worker_run_id, task_type, entity_type, entity_id, priority, title, description, suggested_action, confidence, raw)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       returning *`,
      [run.id, task.taskType, task.entityType, task.entityId, task.priority, task.title, task.description, task.suggestedAction, task.confidence, task.raw]
    );
    tasks.push(result.rows[0]);
  }
  const ready = tasks.filter((task) => Number(task.confidence) >= 85).length;
  const needsReview = tasks.length - ready;
  const summary = `${ready} ready to approve, ${needsReview} need review from ${data.transactions.length} demo bank transactions.`;
  const finalRun = await db.query(`update accounting_worker_runs set status = 'completed', finished_at = now(), summary = $1 where id = $2 returning *`, [summary, run.id]);
  return { run: finalRun.rows[0], tasks, banking: data };
}

export async function listAccountingWorkerTasks(db) {
  await ensureAccountingBankingDemoSchema(db);
  const result = await db.query(`
    select awt.*, awr.worker_key, awr.summary as run_summary
    from accounting_worker_tasks awt
    left join accounting_worker_runs awr on awr.id = awt.worker_run_id
    order by awt.created_at desc, awt.id desc
    limit 100
  `);
  return result.rows;
}
