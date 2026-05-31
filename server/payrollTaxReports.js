function n(value) {
  return Number(value || 0);
}

function round(value) {
  return Math.round(n(value) * 100) / 100;
}

function currentMonthBounds() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  };
}

export async function ensurePayrollTaxReportsSchema(db) {
  await db.query(`
    create table if not exists payroll_tax_profiles (
      id bigserial primary key,
      tenant_id text not null default 'steelcraft',
      profile_name text not null default 'Default Payroll Tax Profile',
      federal_withholding_rate numeric(8,4) not null default 0.1200,
      social_security_rate numeric(8,4) not null default 0.0620,
      medicare_rate numeric(8,4) not null default 0.0145,
      federal_unemployment_rate numeric(8,4) not null default 0.0060,
      state_code text,
      state_withholding_rate numeric(8,4) not null default 0.0400,
      state_unemployment_rate numeric(8,4) not null default 0.0270,
      local_tax_name text,
      local_tax_rate numeric(8,4) not null default 0,
      status text not null default 'draft',
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (tenant_id, profile_name)
    );

    create table if not exists payroll_runs (
      id bigserial primary key,
      tenant_id text not null default 'steelcraft',
      run_name text not null,
      pay_period_start date not null,
      pay_period_end date not null,
      pay_date date not null default current_date,
      status text not null default 'draft',
      gross_pay numeric(14,2) not null default 0,
      employee_tax_total numeric(14,2) not null default 0,
      employer_tax_total numeric(14,2) not null default 0,
      net_pay numeric(14,2) not null default 0,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists payroll_run_lines (
      id bigserial primary key,
      payroll_run_id bigint not null references payroll_runs(id) on delete cascade,
      employee_id bigint references employees(id) on delete set null,
      employee_name text not null,
      department text,
      role_title text,
      regular_hours numeric(10,2) not null default 0,
      overtime_hours numeric(10,2) not null default 0,
      hourly_rate numeric(10,2) not null default 0,
      gross_pay numeric(14,2) not null default 0,
      employee_federal_tax numeric(14,2) not null default 0,
      employee_state_tax numeric(14,2) not null default 0,
      employee_local_tax numeric(14,2) not null default 0,
      employee_fica_tax numeric(14,2) not null default 0,
      employer_fica_tax numeric(14,2) not null default 0,
      employer_unemployment_tax numeric(14,2) not null default 0,
      net_pay numeric(14,2) not null default 0,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists payroll_tax_liabilities (
      id bigserial primary key,
      payroll_run_id bigint references payroll_runs(id) on delete cascade,
      tenant_id text not null default 'steelcraft',
      tax_type text not null,
      jurisdiction text not null,
      liability_amount numeric(14,2) not null default 0,
      due_date date,
      status text not null default 'accrued',
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
}

async function getTaxProfile(db, tenantId) {
  await ensurePayrollTaxReportsSchema(db);
  const result = await db.query(
    `insert into payroll_tax_profiles (tenant_id, profile_name, state_code, local_tax_name, status, raw)
     values ($1,'Default Payroll Tax Profile','SETUP','Local setup required','draft',$2)
     on conflict (tenant_id, profile_name) do update set updated_at = now()
     returning *`,
    [tenantId, { setupRequired: true, note: 'Customer must verify federal, state, and local tax settings before production payroll.' }]
  );
  return result.rows[0];
}

export async function seedDemoPayrollRun(db, { tenantId = 'steelcraft' } = {}) {
  await ensurePayrollTaxReportsSchema(db);
  const profile = await getTaxProfile(db, tenantId);
  const existing = await db.query(`select * from payroll_runs where tenant_id = $1 order by pay_date desc limit 1`, [tenantId]);
  if (existing.rows[0]) return existing.rows[0];

  const bounds = currentMonthBounds();
  const employees = await db.query(`select * from employees where employment_status = 'active' order by id limit 25`).catch(() => ({ rows: [] }));
  const run = await db.query(
    `insert into payroll_runs (tenant_id, run_name, pay_period_start, pay_period_end, pay_date, status, raw)
     values ($1,$2,$3,$4,current_date,'draft',$5)
     returning *`,
    [tenantId, `Demo Payroll ${bounds.start} - ${bounds.end}`, bounds.start, bounds.end, { demo: true, taxProfileId: profile.id }]
  );
  const payrollRun = run.rows[0];

  const sourceEmployees = employees.rows.length ? employees.rows : [
    { id: null, first_name: 'Office', last_name: 'Admin', department: 'Admin', role_title: 'Admin', raw: { hourlyRate: 28 } },
    { id: null, first_name: 'Project', last_name: 'Manager', department: 'Projects', role_title: 'Project Manager', raw: { hourlyRate: 38 } }
  ];

  let grossTotal = 0;
  let employeeTaxTotal = 0;
  let employerTaxTotal = 0;
  let netPayTotal = 0;
  for (const [index, employee] of sourceEmployees.entries()) {
    const rate = n(employee.raw?.hourlyRate || employee.raw?.hourly_rate || (index % 2 ? 32 : 24));
    const regularHours = 72 + (index % 4) * 4;
    const overtimeHours = index % 5 === 0 ? 4 : 0;
    const gross = round(regularHours * rate + overtimeHours * rate * 1.5);
    const federal = round(gross * n(profile.federal_withholding_rate));
    const state = round(gross * n(profile.state_withholding_rate));
    const local = round(gross * n(profile.local_tax_rate));
    const fica = round(gross * (n(profile.social_security_rate) + n(profile.medicare_rate)));
    const employerFica = fica;
    const unemployment = round(gross * (n(profile.federal_unemployment_rate) + n(profile.state_unemployment_rate)));
    const net = round(gross - federal - state - local - fica);
    grossTotal += gross;
    employeeTaxTotal += federal + state + local + fica;
    employerTaxTotal += employerFica + unemployment;
    netPayTotal += net;
    await db.query(
      `insert into payroll_run_lines (payroll_run_id, employee_id, employee_name, department, role_title, regular_hours, overtime_hours, hourly_rate, gross_pay, employee_federal_tax, employee_state_tax, employee_local_tax, employee_fica_tax, employer_fica_tax, employer_unemployment_tax, net_pay, raw)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [payrollRun.id, employee.id || null, `${employee.first_name || ''} ${employee.last_name || ''}`.trim(), employee.department || null, employee.role_title || null, regularHours, overtimeHours, rate, gross, federal, state, local, fica, employerFica, unemployment, net, { demo: true }]
    );
  }

  await db.query(`update payroll_runs set gross_pay = $1, employee_tax_total = $2, employer_tax_total = $3, net_pay = $4, updated_at = now() where id = $5`, [round(grossTotal), round(employeeTaxTotal), round(employerTaxTotal), round(netPayTotal), payrollRun.id]);
  const liabilities = [
    ['federal_withholding', 'Federal', employeeTaxTotal * 0.48],
    ['fica_employee', 'Federal', employeeTaxTotal * 0.31],
    ['fica_employer', 'Federal', employerTaxTotal * 0.72],
    ['state_withholding', profile.state_code || 'State', employeeTaxTotal * 0.16],
    ['state_unemployment', profile.state_code || 'State', employerTaxTotal * 0.28],
    ['local_tax', profile.local_tax_name || 'Local', employeeTaxTotal * 0.05]
  ];
  for (const [type, jurisdiction, amount] of liabilities) {
    await db.query(
      `insert into payroll_tax_liabilities (payroll_run_id, tenant_id, tax_type, jurisdiction, liability_amount, due_date, status, raw)
       values ($1,$2,$3,$4,$5,current_date + interval '15 days','accrued',$6)`,
      [payrollRun.id, tenantId, type, jurisdiction, round(amount), { demo: true }]
    );
  }
  return (await db.query(`select * from payroll_runs where id = $1`, [payrollRun.id])).rows[0];
}

export async function buildEmployeeRosterReport(db) {
  const result = await db.query(`select id, first_name, last_name, preferred_name, email, phone, role_title, department, employment_status, employment_type, start_date, manager_name from employees order by department, last_name`).catch(() => ({ rows: [] }));
  return { report: 'employee_roster', employeeCount: result.rows.length, activeCount: result.rows.filter((row) => row.employment_status === 'active').length, rows: result.rows };
}

export async function buildPtoReport(db, { year = new Date().getFullYear() } = {}) {
  const result = await db.query(`
    select e.id as employee_id, e.first_name, e.last_name, e.department, e.role_title, pb.year, pb.beginning_hours, pb.accrued_hours, pb.used_hours, pb.remaining_hours, pp.policy_name
    from employees e
    left join pto_balances pb on pb.employee_id = e.id and pb.year = $1
    left join pto_policies pp on pp.id = pb.policy_id
    order by e.department, e.last_name
  `, [year]).catch(() => ({ rows: [] }));
  const pending = await db.query(`select pr.*, e.first_name, e.last_name from pto_requests pr join employees e on e.id = pr.employee_id where pr.status = 'pending' order by pr.start_date`).catch(() => ({ rows: [] }));
  return { report: 'pto', year, totalRemainingHours: round(result.rows.reduce((sum, row) => sum + n(row.remaining_hours), 0)), pendingRequests: pending.rows, rows: result.rows };
}

export async function buildPayrollSummaryReport(db, { tenantId = 'steelcraft' } = {}) {
  const run = await seedDemoPayrollRun(db, { tenantId });
  const lines = await db.query(`select * from payroll_run_lines where payroll_run_id = $1 order by department, employee_name`, [run.id]);
  return { report: 'payroll_summary', run, lineCount: lines.rows.length, grossPay: run.gross_pay, employeeTaxTotal: run.employee_tax_total, employerTaxTotal: run.employer_tax_total, netPay: run.net_pay, rows: lines.rows, recommendation: 'Review overtime, missing punches, and tax profile setup before approving payroll.' };
}

export async function buildTaxLiabilityReport(db, { tenantId = 'steelcraft' } = {}) {
  await seedDemoPayrollRun(db, { tenantId });
  const liabilities = await db.query(`select * from payroll_tax_liabilities where tenant_id = $1 order by due_date, jurisdiction, tax_type`, [tenantId]);
  const totals = liabilities.rows.reduce((acc, row) => {
    acc[row.jurisdiction] = round(n(acc[row.jurisdiction]) + n(row.liability_amount));
    acc.total = round(n(acc.total) + n(row.liability_amount));
    return acc;
  }, { total: 0 });
  return { report: 'payroll_tax_liabilities', tenantId, totals, rows: liabilities.rows, warning: 'Tax reports are readiness reports. Customer/accountant must verify rates, jurisdictions, deposit schedules, and filing requirements before production use.' };
}

export async function buildPayrollTaxCommandCenter(db, { tenantId = 'steelcraft' } = {}) {
  const employees = await buildEmployeeRosterReport(db);
  const pto = await buildPtoReport(db, {});
  const payroll = await buildPayrollSummaryReport(db, { tenantId });
  const taxes = await buildTaxLiabilityReport(db, { tenantId });
  return { report: 'payroll_tax_command_center', employees, pto, payroll, taxes, actions: ['Review pending PTO requests.', 'Verify payroll tax profile before production payroll.', 'Review overtime and exception rows.', 'Confirm tax liabilities with accountant before deposit.'] };
}
