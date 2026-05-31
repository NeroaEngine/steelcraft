const DEMO_TENANT = 'steelcraft-demo';
const ENTRY_COUNT = 225;

function todayOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysInCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function txId(name) {
  return `demo_${String(name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function currency(value) {
  return Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function proofAnchor(seed) {
  let hash = 0;
  const text = String(seed || 'neroa-proof');
  for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  return `neroachain:demo:${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

const employees = [
  ['EMP-001', 'John Rivera', 'Press Lead', 25.00], ['EMP-002', 'Maria Lane', 'Press Operator', 24.00], ['EMP-003', 'David Brooks', 'Press Operator', 23.00], ['EMP-004', 'Tina Cole', 'Press Operator', 22.50], ['EMP-005', 'Marcus Green', 'Press Assistant', 22.00], ['EMP-006', 'Avery King', 'Press Assistant', 21.50], ['EMP-007', 'Nina Perez', 'Production Prep', 21.00], ['EMP-008', 'Caleb Scott', 'Production Prep', 20.50], ['EMP-009', 'Riley Stone', 'Quality Control', 20.00], ['EMP-010', 'Olivia Hart', 'Quality Control', 19.50], ['EMP-011', 'Ben Adams', 'Finishing', 19.00], ['EMP-012', 'Maya Reed', 'Finishing', 18.50], ['EMP-013', 'Sam Young', 'Packing', 18.00], ['EMP-014', 'Lexi Moore', 'Packing', 17.50], ['EMP-015', 'Chris Ford', 'Shipping', 17.00], ['EMP-016', 'Ella Price', 'Runner', 16.50], ['EMP-017', 'Noah Ward', 'Runner', 16.00]
];
const customers = ['Atlas Apparel', 'River City Merch', 'Forge Fitness', 'Summit School', 'Northside Church', 'Pine Street Events', 'Apex Roofing', 'Blue Line Electric', 'Bright Path Academy', 'Cedar Creek Outdoors', 'Union Baseball', 'Metro Coffee', 'Harbor Plumbing', 'Oak Grove PTO', 'Wildcat Boosters', 'Stone River Supply', 'Main Street Market', 'Coastal Soccer', 'Vega Motors', 'Iron House Gym'];
const vendors = ['Blank Shirt Supply', 'InkPro Distribution', 'Box + Poly Mailers', 'Screen Room Supply', 'UPS Demo Feed', 'Payroll Clearing', 'Utility Provider', 'Equipment Finance Co', 'Lease Management', 'Insurance Carrier', 'Rent / building', 'Insurance', 'Utilities'];
const fixedCosts = [
  ['Rent / building', 15000], ['Equipment leases', 12000], ['Insurance', 6500], ['Software / phones / internet', 4500], ['Utilities', 5200], ['Vehicles / fuel base', 4800], ['Admin salaries burden', 9000]
];
const monthlyFixedCost = fixedCosts.reduce((sum, item) => sum + item[1], 0);

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
      match_status text not null default 'unmatched',
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
    create table if not exists accounting_daily_match_reports (
      id bigserial primary key,
      worker_run_id bigint references accounting_worker_runs(id) on delete set null,
      tenant_id text not null default 'default',
      report_date date not null default current_date,
      status text not null default 'ready_for_approval',
      matched_count integer not null default 0,
      needs_review_count integer not null default 0,
      average_confidence numeric(5,2) not null default 0,
      brief text,
      email_status text not null default 'not_sent_demo',
      approval_status text not null default 'waiting_customer_approval',
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
}

function demoEntries() {
  const rows = [];
  for (let i = 0; i < ENTRY_COUNT; i += 1) {
    const kind = i % 9;
    const customer = customers[i % customers.length];
    const vendor = vendors[i % vendors.length];
    const employee = employees[i % employees.length];
    const hours = round(5.5 + (i % 6) * 0.75);
    const units = 80 + ((i * 41) % 920);
    const rate = round(0.45 + (i % 8) * 0.08);
    if (kind <= 2) rows.push({ sourceAccount: 'demo_operating_checking', name: `${customer} Customer Deposit`, amount: round(750 + ((i * 137) % 7200)), type: 'credit', category: 'sales', date: todayOffset(0), raw: { customer, invoiceId: `SCB-INV-${1000 + i}`, dueStatus: i % 12 === 0 ? 'past_due' : 'current' } });
    else if (kind <= 4) rows.push({ sourceAccount: 'demo_operating_checking', name: vendor, amount: -round(95 + ((i * 91) % 2400)), type: 'debit', category: 'cogs', date: todayOffset(0), raw: { vendor, billId: `BILL-${2000 + i}`, dueStatus: i % 14 === 0 ? 'past_due' : 'current' } });
    else if (kind <= 6) rows.push({ sourceAccount: 'demo_payroll_checking', name: `${employee[1]} Timecard`, amount: -round(employee[3] * hours), type: 'debit', category: 'labor', date: todayOffset(0), raw: { employeeId: employee[0], employeeName: employee[1], role: employee[2], hours, hourlyRate: employee[3], laborCost: round(employee[3] * hours) } });
    else if (kind === 7) rows.push({ sourceAccount: 'demo_operating_checking', name: `Production batch ${4000 + i}`, amount: round(units * rate), type: 'credit', category: 'production', date: todayOffset(0), raw: { batchId: `PROD-${4000 + i}`, units, valuePerUnit: rate, productionValue: round(units * rate) } });
    else rows.push({ sourceAccount: 'demo_company_card', name: `${vendor} Card Charge`, amount: -round(22 + ((i * 37) % 650)), type: 'debit', category: i % 4 === 0 ? 'uncategorized' : 'expense', date: todayOffset(0), raw: { vendor, dueStatus: 'current' } });
  }
  return rows;
}

export async function seedDemoBankingData(db) {
  await ensureAccountingBankingDemoSchema(db);
  await db.query(`delete from accounting_worker_tasks where worker_run_id in (select id from accounting_worker_runs where tenant_id = $1)`, [DEMO_TENANT]);
  await db.query(`delete from accounting_daily_match_reports where tenant_id = $1`, [DEMO_TENANT]);
  await db.query(`delete from accounting_worker_runs where tenant_id = $1`, [DEMO_TENANT]);
  await db.query(`delete from accounting_bank_transactions where bank_account_id in (select ba.id from accounting_bank_accounts ba join accounting_bank_connections bc on bc.id = ba.bank_connection_id where bc.tenant_id = $1)`, [DEMO_TENANT]);

  const connectionResult = await db.query(
    `insert into accounting_bank_connections (tenant_id, provider, provider_item_id, institution_name, status, last_sync_at, raw)
     values ($1, 'demo', 'demo_steelcraft_bank', 'Neroa Demo Bank', 'active', now(), $2)
     on conflict (tenant_id, provider, provider_item_id) do update set institution_name = excluded.institution_name, status = 'active', last_sync_at = now(), updated_at = now()
     returning *`,
    [DEMO_TENANT, { mode: 'demo', note: 'Safe local test banking feed. Seed starts unmatched like a fresh bank import.' }]
  );
  const connection = connectionResult.rows[0];
  const accounts = [
    ['demo_operating_checking', 'Steel Craft Operating Checking', 'depository', 'checking', '4821', 84325.40, 81970.14],
    ['demo_payroll_checking', 'Steel Craft Payroll Checking', 'depository', 'checking', '1138', 18250.00, 18250.00],
    ['demo_company_card', 'Steel Craft Company Card', 'credit', 'credit_card', '9099', -1240.77, -1240.77]
  ];
  const accountRows = [];
  for (const account of accounts) {
    const result = await db.query(
      `insert into accounting_bank_accounts (bank_connection_id, provider_account_id, account_name, account_type, account_subtype, mask, current_balance, available_balance, raw)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (bank_connection_id, provider_account_id) do update set account_name = excluded.account_name, current_balance = excluded.current_balance, available_balance = excluded.available_balance, updated_at = now()
       returning *`,
      [connection.id, account[0], account[1], account[2], account[3], account[4], account[5], account[6], { demo: true }]
    );
    accountRows.push(result.rows[0]);
  }
  const byProviderId = Object.fromEntries(accountRows.map((account) => [account.provider_account_id, account]));
  for (const row of demoEntries()) {
    const account = byProviderId[row.sourceAccount];
    const anchor = proofAnchor(`${row.name}|${row.amount}|${row.date}|seed`);
    await db.query(
      `insert into accounting_bank_transactions (bank_account_id, provider_transaction_id, posted_date, authorized_date, description, merchant_name, amount, transaction_type, category, match_status, suggested_match, raw)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'unmatched','{}'::jsonb,$10)
       on conflict (provider_transaction_id) do update set posted_date = excluded.posted_date, amount = excluded.amount, match_status = 'unmatched', suggested_match = '{}'::jsonb, raw = excluded.raw, updated_at = now()`,
      [account.id, txId(`${row.sourceAccount}_${row.name}_${row.raw.invoiceId || row.raw.billId || row.raw.employeeId || row.raw.batchId || row.amount}`), row.date, row.date, row.name, row.name, row.amount, row.type, row.category, { ...row.raw, type: row.category, demo: true, proofAnchor: anchor, importedAs: 'unmatched_bank_entry' }]
    );
  }
  return getDemoBankingData(db);
}

export async function getDemoBankingData(db) {
  await ensureAccountingBankingDemoSchema(db);
  const connections = await db.query(`select * from accounting_bank_connections where tenant_id = $1 order by created_at desc`, [DEMO_TENANT]);
  const accounts = await db.query(`select ba.*, bc.institution_name from accounting_bank_accounts ba join accounting_bank_connections bc on bc.id = ba.bank_connection_id where bc.tenant_id = $1 order by ba.account_type, ba.account_name`, [DEMO_TENANT]);
  const transactions = await db.query(`select bt.*, ba.account_name, ba.account_type, ba.mask from accounting_bank_transactions bt join accounting_bank_accounts ba on ba.id = bt.bank_account_id join accounting_bank_connections bc on bc.id = ba.bank_connection_id where bc.tenant_id = $1 order by bt.posted_date desc, bt.id desc limit 250`, [DEMO_TENANT]);
  const reports = await db.query(`select * from accounting_daily_match_reports where tenant_id = $1 order by created_at desc limit 5`, [DEMO_TENANT]);
  const statusCounts = await db.query(`select bt.match_status, count(*)::int as count from accounting_bank_transactions bt join accounting_bank_accounts ba on ba.id = bt.bank_account_id join accounting_bank_connections bc on bc.id = ba.bank_connection_id where bc.tenant_id = $1 group by bt.match_status`, [DEMO_TENANT]);
  return { connections: connections.rows, accounts: accounts.rows, transactions: transactions.rows, reports: reports.rows, statusCounts: statusCounts.rows };
}

function suggestedMatch(tx) {
  const raw = tx.raw || {};
  const category = tx.category || raw.type || 'uncategorized';
  let confidence = 60;
  let matchedTo = 'Unmatched / hold for review';
  let ledgerAccount = 'Uncategorized Expense';
  let action = 'Review before posting.';
  if (category === 'sales') { confidence = raw.dueStatus === 'past_due' ? 96 : 100; ledgerAccount = 'Accounts Receivable'; matchedTo = `${raw.invoiceId || 'Open invoice'} / ${raw.customer || tx.merchant_name}`; action = 'Matched customer deposit to receivable and sales cash flow.'; }
  else if (category === 'cogs') { confidence = raw.dueStatus === 'past_due' ? 88 : 94; ledgerAccount = 'Cost of Goods Sold'; matchedTo = `${raw.billId || 'Vendor bill'} / ${raw.vendor || tx.merchant_name}`; action = 'Matched vendor payment to COGS/materials bill.'; }
  else if (category === 'labor') { confidence = 100; ledgerAccount = 'Direct Labor'; matchedTo = `${raw.employeeName} timecard ${raw.hours} hrs @ ${currency(raw.hourlyRate)}/hr`; action = 'Matched payroll/timecard line to direct labor cost.'; }
  else if (category === 'production') { confidence = 100; ledgerAccount = 'Production Output'; matchedTo = `${raw.batchId} / ${raw.units} units @ ${currency(raw.valuePerUnit)}`; action = 'Matched production batch to daily output.'; }
  else if (category === 'expense') { confidence = 72; ledgerAccount = 'Operating Expense'; matchedTo = raw.vendor || tx.merchant_name; action = 'Suggested operating expense coding. Customer approval recommended.'; }
  const proof = proofAnchor(`${tx.id}|${matchedTo}|${confidence}`);
  return { confidence, matchedTo, ledgerAccount, action, proofAnchor: proof, blockchainStatus: 'anchored_to_demo_chain_pending_real_chain' };
}

function taskForTransaction(tx) {
  const match = suggestedMatch(tx);
  const confidence = Number(match.confidence || 0);
  const priority = confidence >= 95 ? 'ready_100' : confidence >= 75 ? 'review_75_plus' : 'customer_review';
  return {
    taskType: 'daily_bank_match', entityType: 'accounting_bank_transaction', entityId: String(tx.id), priority,
    status: confidence >= 75 ? 'matched_pending_customer_approval' : 'needs_customer_review',
    title: `${confidence}% match: ${tx.merchant_name}`,
    description: `${tx.account_name} ${tx.amount >= 0 ? 'deposit' : 'charge'} for ${currency(tx.amount)} -> ${match.matchedTo}.`,
    action: `${match.action} Suggested account: ${match.ledgerAccount}. Proof: ${match.proofAnchor}.`,
    confidence, raw: { transaction: tx, match, matchedTo: match.matchedTo, proofAnchor: match.proofAnchor }
  };
}

function buildDailySummary(transactions, tasks) {
  const rawRows = transactions.map((tx) => tx.raw || {});
  const sales = round(transactions.filter((tx) => tx.category === 'sales').reduce((s, tx) => s + Number(tx.amount), 0));
  const cogs = round(Math.abs(transactions.filter((tx) => tx.category === 'cogs').reduce((s, tx) => s + Number(tx.amount), 0)));
  const otherExpenses = round(Math.abs(transactions.filter((tx) => ['expense', 'uncategorized'].includes(tx.category)).reduce((s, tx) => s + Number(tx.amount), 0)));
  const laborRows = rawRows.filter((row) => row.type === 'labor');
  const laborCost = round(laborRows.reduce((s, row) => s + Number(row.laborCost || 0), 0));
  const laborHours = round(laborRows.reduce((s, row) => s + Number(row.hours || 0), 0));
  const productionRows = rawRows.filter((row) => row.type === 'production');
  const producedUnits = productionRows.reduce((s, row) => s + Number(row.units || 0), 0);
  const productionValue = round(productionRows.reduce((s, row) => s + Number(row.productionValue || 0), 0));
  const fixedCostPerDay = round(monthlyFixedCost / daysInCurrentMonth());
  const netOperating = round(sales + productionValue - cogs - laborCost - otherExpenses - fixedCostPerDay);
  const cashPosition = round(transactions.reduce((s, tx) => s + Number(tx.amount), 0));
  const pastDueReceivables = rawRows.filter((row) => row.invoiceId && row.dueStatus === 'past_due').map((row) => ({ invoiceId: row.invoiceId, customer: row.customer, recommendedAction: 'Send follow-up collection email?' }));
  const pastDueBills = rawRows.filter((row) => row.billId && row.dueStatus === 'past_due').map((row) => ({ billId: row.billId, vendor: row.vendor, recommendedAction: 'Schedule or hold payment based on cash scenario.' }));
  const highConfidence = tasks.filter((task) => Number(task.confidence) >= 95).length;
  const mediumConfidence = tasks.filter((task) => Number(task.confidence) >= 60 && Number(task.confidence) < 95).length;
  const lowConfidence = tasks.filter((task) => Number(task.confidence) < 60).length;
  return {
    reportDate: today(),
    sales, cogs, laborCost, laborHours, productionValue, producedUnits, otherExpenses,
    fixedCosts: { monthlyFixedCost, daysInMonth: daysInCurrentMonth(), fixedCostPerDay, breakdown: fixedCosts.map(([name, amount]) => ({ name, monthlyAmount: amount, dailyAmount: round(amount / daysInCurrentMonth()) })) },
    dailyResult: { netOperating, status: netOperating >= 0 ? 'profitable_day' : 'loss_day', recommendation: netOperating >= 0 ? `Positive day by ${currency(netOperating)}. Approve high-confidence matches, collect past-due receivables, and watch medium-confidence expenses.` : `Loss day by ${currency(Math.abs(netOperating))}. Review labor scheduling, vendor spend, and pricing before committing matches.` },
    matching: { total: tasks.length, highConfidence, mediumConfidence, lowConfidence, needsCustomerApproval: tasks.length },
    cashFlow: { cashPosition, accountBalanceSignal: cashPosition >= 0 ? 'positive_cash_flow_today' : 'negative_cash_flow_today', scenario: `Today cash moved ${currency(cashPosition)} before pending commitments. Past-due AR count ${pastDueReceivables.length}; past-due bills count ${pastDueBills.length}.` },
    receivables: { pastDue: pastDueReceivables, prompt: pastDueReceivables.length ? 'Would you like me to send another email to these past-due customers?' : 'No past-due receivable follow-up needed in this demo batch.' },
    bills: { pastDue: pastDueBills },
    labor: { rows: laborRows.map((row) => ({ employeeId: row.employeeId, employeeName: row.employeeName, role: row.role, hours: row.hours, hourlyRate: row.hourlyRate, laborCost: row.laborCost })) },
    production: { rows: productionRows.map((row) => ({ batchId: row.batchId, units: row.units, valuePerUnit: row.valuePerUnit, productionValue: row.productionValue })) }
  };
}

export async function runDemoAccountingWorker(db) {
  await ensureAccountingBankingDemoSchema(db);
  let data = await getDemoBankingData(db);
  if (!data.transactions.length) data = await seedDemoBankingData(db);
  const unmatched = data.transactions.filter((tx) => ['unmatched', 'unreviewed'].includes(tx.match_status));
  const runResult = await db.query(`insert into accounting_worker_runs (worker_key, tenant_id, status, started_at, summary, raw) values ('accounting.daily.comptroller.matching.demo.v2', $1, 'running', now(), $2, $3) returning *`, [DEMO_TENANT, 'Running comptroller against unmatched bank feed entries.', { mode: 'demo', unmatchedCount: unmatched.length }]);
  const run = runResult.rows[0];
  const tasks = [];
  for (const tx of unmatched) {
    const task = taskForTransaction(tx);
    await db.query(`update accounting_bank_transactions set match_status = $2, suggested_match = $3, updated_at = now() where id = $1`, [tx.id, task.status, task.raw.match]);
    const result = await db.query(`insert into accounting_worker_tasks (worker_run_id, task_type, entity_type, entity_id, status, priority, title, description, suggested_action, confidence, raw) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *`, [run.id, task.taskType, task.entityType, task.entityId, task.status, task.priority, task.title, task.description, task.action, task.confidence, task.raw]);
    tasks.push(result.rows[0]);
  }
  const avgConfidence = tasks.length ? tasks.reduce((sum, task) => sum + Number(task.confidence || 0), 0) / tasks.length : 0;
  data = await getDemoBankingData(db);
  const dailySummary = buildDailySummary(data.transactions, tasks);
  const brief = `Comptroller matched ${tasks.length} previously unmatched entries. ${dailySummary.matching.highConfidence} are 95-100% confidence, ${dailySummary.matching.mediumConfidence} are medium confidence, and ${dailySummary.matching.lowConfidence} need review. Customer must approve/commit before posting.`;
  const finalRun = await db.query(`update accounting_worker_runs set status = 'completed', finished_at = now(), summary = $1, raw = $3 where id = $2 returning *`, [brief, run.id, { dailySummary, approvalRequired: true }]);
  const report = await db.query(`insert into accounting_daily_match_reports (worker_run_id, tenant_id, report_date, status, matched_count, needs_review_count, average_confidence, brief, email_status, approval_status, raw) values ($1,$2,current_date,'ready_for_customer_commit',$3,$4,$5,$6,'not_sent_demo','waiting_customer_commit',$7) returning *`, [run.id, DEMO_TENANT, tasks.filter((t) => Number(t.confidence) >= 75).length, tasks.filter((t) => Number(t.confidence) < 75).length, avgConfidence, brief, { tasks, dailySummary, proofMode: 'demo_blockchain_anchor_pending_commit' }]);
  return { run: finalRun.rows[0], report: report.rows[0], tasks, dailySummary, banking: await getDemoBankingData(db) };
}

export async function commitDemoAccountingWorkerMatches(db, { actor = 'customer' } = {}) {
  await ensureAccountingBankingDemoSchema(db);
  const result = await db.query(`update accounting_bank_transactions set match_status = 'committed_to_books', updated_at = now() where match_status in ('matched_pending_customer_approval','needs_customer_review') returning *`);
  await db.query(`insert into portal_activity_logs (actor, action, entity_type, metadata) values ($1,$2,$3,$4)`, [actor, 'comptroller_matches_committed', 'accounting_bank_transactions', { committedCount: result.rows.length }]);
  return { committedCount: result.rows.length, committedTransactions: result.rows };
}

export async function listAccountingWorkerTasks(db) {
  await ensureAccountingBankingDemoSchema(db);
  const result = await db.query(`select awt.*, awr.worker_key, awr.summary as run_summary from accounting_worker_tasks awt left join accounting_worker_runs awr on awr.id = awt.worker_run_id order by awt.created_at desc, awt.id desc limit 250`);
  return result.rows;
}
