function n(value) {
  return Number(value || 0);
}

function round(value) {
  return Math.round(n(value) * 100) / 100;
}

function pct(actual, budget) {
  if (!n(budget)) return null;
  return round((n(actual) / n(budget)) * 100);
}

function currentMonthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end };
}

function daysBetween(start, end) {
  const a = new Date(start);
  const b = new Date(end);
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

function recommendationForCashFlow(summary) {
  const net = n(summary.netCashFlow);
  const runway = n(summary.cashRunwayDays);
  if (net < 0 && runway < 14) return 'Cash is tight. Hold noncritical payments, collect past-due AR, and require approval before new spend.';
  if (net < 0) return 'Negative cash movement. Review upcoming bills and prioritize AR follow-up before committing discretionary expenses.';
  if (summary.pastDueArCount > 0) return 'Cash is positive, but past-due AR needs collection follow-up to protect runway.';
  return 'Cash movement is healthy. Continue approving high-confidence matches and monitor upcoming AP.';
}

export async function ensureAccountingReportsSchema(db) {
  await db.query(`
    create table if not exists accounting_budget_plans (
      id bigserial primary key,
      tenant_id text not null default 'steelcraft',
      fiscal_year integer not null,
      budget_name text not null,
      status text not null default 'draft',
      ai_strategy jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (tenant_id, fiscal_year, budget_name)
    )
  `);
  await db.query(`
    create table if not exists accounting_budget_lines (
      id bigserial primary key,
      budget_plan_id bigint not null references accounting_budget_plans(id) on delete cascade,
      account_id bigint references accounting_accounts(id) on delete set null,
      room_key text,
      category text not null,
      period_month integer not null check (period_month between 1 and 12),
      budget_amount numeric(14,2) not null default 0,
      ai_savings_target numeric(14,2) not null default 0,
      notes text,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `);
}

export async function seedDefaultBudget(db, { tenantId = 'steelcraft', fiscalYear = new Date().getFullYear() } = {}) {
  await ensureAccountingReportsSchema(db);
  const planResult = await db.query(
    `insert into accounting_budget_plans (tenant_id, fiscal_year, budget_name, status, ai_strategy)
     values ($1,$2,'Operating Budget','active',$3)
     on conflict (tenant_id, fiscal_year, budget_name) do update set status = 'active', ai_strategy = excluded.ai_strategy, updated_at = now()
     returning *`,
    [tenantId, fiscalYear, { mode: 'ai_assisted_budgeting', goal: 'Protect cash runway, reduce waste, and flag overspend before month end.' }]
  );
  const plan = planResult.rows[0];
  const existing = await db.query('select count(*)::int as count from accounting_budget_lines where budget_plan_id = $1', [plan.id]);
  if (existing.rows[0].count === 0) {
    const accounts = await db.query(`select id, account_code, account_name, account_type from accounting_accounts where account_type in ('income','expense') order by account_code`);
    for (const account of accounts.rows) {
      for (let month = 1; month <= 12; month += 1) {
        const base = account.account_type === 'income' ? 85000 : account.account_code === '5300' ? 42000 : account.account_code === '5100' ? 18000 : account.account_code === '5000' ? 26000 : 6500;
        await db.query(
          `insert into accounting_budget_lines (budget_plan_id, account_id, room_key, category, period_month, budget_amount, ai_savings_target, notes, raw)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [plan.id, account.id, account.account_type === 'income' ? 'sales' : 'accounting', account.account_name, month, base, account.account_type === 'expense' ? round(base * 0.04) : 0, 'Seed budget. Customer should tune during setup.', { seeded: true }]
        );
      }
    }
  }
  return plan;
}

async function ledgerByAccount(db, startDate, endDate) {
  const result = await db.query(`
    select aa.id, aa.account_code, aa.account_name, aa.account_type, aa.normal_balance,
           coalesce(sum(ajl.debit),0)::numeric(14,2) as debit,
           coalesce(sum(ajl.credit),0)::numeric(14,2) as credit
    from accounting_accounts aa
    left join accounting_journal_lines ajl on ajl.account_id = aa.id
    left join accounting_journal_entries aje on aje.id = ajl.journal_entry_id and aje.entry_date between $1 and $2 and aje.status = 'posted'
    where aa.is_active
    group by aa.id
    order by aa.account_code
  `, [startDate, endDate]);
  return result.rows.map((row) => {
    const balance = row.normal_balance === 'debit' ? n(row.debit) - n(row.credit) : n(row.credit) - n(row.debit);
    return { ...row, balance: round(balance) };
  });
}

export async function buildProfitAndLossReport(db, { startDate, endDate } = {}) {
  const bounds = currentMonthBounds();
  const start = startDate || bounds.start;
  const end = endDate || bounds.end;
  const ledger = await ledgerByAccount(db, start, end);
  const income = ledger.filter((row) => row.account_type === 'income');
  const expenses = ledger.filter((row) => row.account_type === 'expense');
  const totalIncome = round(income.reduce((sum, row) => sum + n(row.balance), 0));
  const totalExpenses = round(expenses.reduce((sum, row) => sum + n(row.balance), 0));
  const netIncome = round(totalIncome - totalExpenses);
  return { report: 'profit_and_loss', startDate: start, endDate: end, totalIncome, totalExpenses, netIncome, income, expenses, recommendation: netIncome >= 0 ? 'Profitable period. Watch budget variance and collect AR to protect cash.' : 'Loss period. Review labor, COGS, subcontractor costs, and fixed overhead before approving new spend.' };
}

export async function buildBalanceSheetReport(db, { asOfDate } = {}) {
  const end = asOfDate || new Date().toISOString().slice(0, 10);
  const ledger = await ledgerByAccount(db, '1900-01-01', end);
  const assets = ledger.filter((row) => row.account_type === 'asset');
  const liabilities = ledger.filter((row) => row.account_type === 'liability');
  const equity = ledger.filter((row) => row.account_type === 'equity');
  const totalAssets = round(assets.reduce((sum, row) => sum + n(row.balance), 0));
  const totalLiabilities = round(liabilities.reduce((sum, row) => sum + n(row.balance), 0));
  const totalEquity = round(equity.reduce((sum, row) => sum + n(row.balance), 0));
  return { report: 'balance_sheet', asOfDate: end, totalAssets, totalLiabilities, totalEquity, accountingEquationDelta: round(totalAssets - totalLiabilities - totalEquity), assets, liabilities, equity };
}

export async function buildDetailedCashFlowReport(db, { startDate, endDate } = {}) {
  const bounds = currentMonthBounds();
  const start = startDate || bounds.start;
  const end = endDate || bounds.end;
  const days = daysBetween(start, end);
  const payments = await db.query(`select * from accounting_payments where payment_date between $1 and $2 order by payment_date`, [start, end]);
  const invoices = await db.query(`select ai.*, ac.customer_name from accounting_invoices ai left join accounting_customers ac on ac.id = ai.customer_id where ai.status not in ('void','paid') order by ai.due_date nulls last`, []);
  const bills = await db.query(`select ab.*, av.vendor_name from accounting_bills ab left join accounting_vendors av on av.id = ab.vendor_id where ab.status not in ('void','paid') order by ab.due_date nulls last`, []);
  const bank = await db.query(`
    select bt.*, ba.account_name
    from accounting_bank_transactions bt
    join accounting_bank_accounts ba on ba.id = bt.bank_account_id
    join accounting_bank_connections bc on bc.id = ba.bank_connection_id
    where bt.posted_date between $1 and $2
    order by bt.posted_date
  `, [start, end]).catch(() => ({ rows: [] }));

  const cashIn = round(payments.rows.filter((row) => row.payment_direction === 'received').reduce((sum, row) => sum + n(row.amount), 0) + bank.rows.filter((row) => n(row.amount) > 0).reduce((sum, row) => sum + n(row.amount), 0));
  const cashOut = round(payments.rows.filter((row) => row.payment_direction === 'sent').reduce((sum, row) => sum + n(row.amount), 0) + Math.abs(bank.rows.filter((row) => n(row.amount) < 0).reduce((sum, row) => sum + n(row.amount), 0)));
  const netCashFlow = round(cashIn - cashOut);
  const openAr = round(invoices.rows.reduce((sum, row) => sum + n(row.balance_due), 0));
  const openAp = round(bills.rows.reduce((sum, row) => sum + n(row.balance_due), 0));
  const today = new Date().toISOString().slice(0, 10);
  const pastDueAr = invoices.rows.filter((row) => row.due_date && row.due_date < today);
  const pastDueAp = bills.rows.filter((row) => row.due_date && row.due_date < today);
  const dailyBurn = round(cashOut / days);
  const cashRunwayDays = dailyBurn ? round((cashIn + openAr) / dailyBurn) : null;
  const summary = { cashIn, cashOut, netCashFlow, openAr, openAp, pastDueArCount: pastDueAr.length, pastDueApCount: pastDueAp.length, dailyBurn, cashRunwayDays };
  return {
    report: 'detailed_cash_flow', startDate: start, endDate: end, days,
    ...summary,
    recommendation: recommendationForCashFlow(summary),
    moneyIn: payments.rows.filter((row) => row.payment_direction === 'received'),
    moneyOut: payments.rows.filter((row) => row.payment_direction === 'sent'),
    bankActivity: bank.rows,
    receivables: { openTotal: openAr, pastDue: pastDueAr, allOpen: invoices.rows },
    payables: { openTotal: openAp, pastDue: pastDueAp, allOpen: bills.rows },
    forecast: {
      next7Days: { expectedCashIn: round(openAr * 0.18), expectedCashOut: round(openAp * 0.22), projectedNet: round(openAr * 0.18 - openAp * 0.22) },
      next30Days: { expectedCashIn: round(openAr * 0.65), expectedCashOut: round(openAp * 0.72), projectedNet: round(openAr * 0.65 - openAp * 0.72) }
    }
  };
}

export async function buildLaborReport(db, { startDate, endDate } = {}) {
  const bounds = currentMonthBounds();
  const start = startDate || bounds.start;
  const end = endDate || bounds.end;
  const bank = await db.query(`
    select bt.raw
    from accounting_bank_transactions bt
    join accounting_bank_accounts ba on ba.id = bt.bank_account_id
    join accounting_bank_connections bc on bc.id = ba.bank_connection_id
    where bt.posted_date between $1 and $2 and (bt.category = 'labor' or bt.raw->>'type' = 'labor')
  `, [start, end]).catch(() => ({ rows: [] }));
  const rows = bank.rows.map((row) => row.raw || {}).filter((row) => row.employeeName);
  const totalHours = round(rows.reduce((sum, row) => sum + n(row.hours), 0));
  const totalLaborCost = round(rows.reduce((sum, row) => sum + n(row.laborCost), 0));
  const avgRate = totalHours ? round(totalLaborCost / totalHours) : 0;
  return { report: 'labor', startDate: start, endDate: end, totalHours, totalLaborCost, avgRate, rows, recommendation: totalLaborCost ? 'Compare labor cost to production value and schedule. Flag overtime and missed punches before payroll.' : 'No labor rows found for this period. Connect timekeeping or load payroll/labor feed.' };
}

export async function buildBudgetReport(db, { tenantId = 'steelcraft', fiscalYear = new Date().getFullYear() } = {}) {
  await seedDefaultBudget(db, { tenantId, fiscalYear });
  const actuals = await ledgerByAccount(db, `${fiscalYear}-01-01`, `${fiscalYear}-12-31`);
  const budget = await db.query(`
    select abl.*, aa.account_code, aa.account_name, aa.account_type
    from accounting_budget_lines abl
    join accounting_budget_plans abp on abp.id = abl.budget_plan_id
    left join accounting_accounts aa on aa.id = abl.account_id
    where abp.tenant_id = $1 and abp.fiscal_year = $2
    order by abl.period_month, aa.account_code
  `, [tenantId, fiscalYear]);
  const byAccount = new Map(actuals.map((row) => [String(row.id), row]));
  const lines = budget.rows.map((line) => {
    const actual = byAccount.get(String(line.account_id))?.balance || 0;
    return { ...line, actualYtd: round(actual), varianceYtd: round(n(line.budget_amount) * 12 - actual), usedPercent: pct(actual, n(line.budget_amount) * 12) };
  });
  const totalBudget = round(lines.reduce((sum, line) => sum + n(line.budget_amount), 0));
  const totalSavingsTarget = round(lines.reduce((sum, line) => sum + n(line.ai_savings_target), 0));
  const risks = lines.filter((line) => line.usedPercent !== null && line.usedPercent > 90).slice(0, 20);
  return { report: 'budget', tenantId, fiscalYear, totalBudgetMonthlyAcrossLines: totalBudget, totalAiSavingsTargetMonthly: totalSavingsTarget, risks, lines, aiRecommendations: ['Hold noncritical spend where budget usage exceeds 90%.', 'Collect past-due AR before approving discretionary bills.', 'Use Comptroller to suggest vendor consolidation and duplicate expense cleanup.', 'Review fixed costs monthly and convert avoidable fixed costs to variable where possible.'] };
}

export async function buildAccountingCommandCenter(db) {
  const cashFlow = await buildDetailedCashFlowReport(db, {});
  const pnl = await buildProfitAndLossReport(db, {});
  const labor = await buildLaborReport(db, {});
  const budget = await buildBudgetReport(db, {});
  return {
    moneyIn: cashFlow.cashIn,
    moneyOut: cashFlow.cashOut,
    netCashFlow: cashFlow.netCashFlow,
    profitOrLoss: pnl.netIncome,
    cashRecommendation: cashFlow.recommendation,
    laborCost: labor.totalLaborCost,
    laborHours: labor.totalHours,
    budgetRisks: budget.risks.length,
    actions: [
      cashFlow.pastDueArCount ? `Send AR follow-up for ${cashFlow.pastDueArCount} past-due receivables.` : 'No past-due AR follow-up required.',
      cashFlow.pastDueApCount ? `Review ${cashFlow.pastDueApCount} past-due bills before approving checks.` : 'No past-due AP found.',
      budget.risks.length ? `Review ${budget.risks.length} budget risk lines.` : 'Budget is within current guardrails.'
    ],
    reports: { cashFlow, profitAndLoss: pnl, labor, budget }
  };
}
