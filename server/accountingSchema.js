import { reserveAccountingNumber } from './accountingSettings.js';

export async function ensureAccountingSchema(db) {
  await db.query(`
    create table if not exists accounting_accounts (
      id bigserial primary key,
      account_code text not null unique,
      account_name text not null,
      account_type text not null,
      normal_balance text not null check (normal_balance in ('debit','credit')),
      is_active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists accounting_customers (
      id bigserial primary key,
      company_id bigint references companies(id) on delete set null,
      customer_name text not null,
      contact_name text,
      email text,
      phone text,
      billing_address text,
      terms text not null default 'Net 30',
      status text not null default 'active',
      raw jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists accounting_vendors (
      id bigserial primary key,
      company_id bigint references companies(id) on delete set null,
      vendor_name text not null,
      contact_name text,
      email text,
      phone text,
      remittance_address text,
      terms text not null default 'Net 30',
      status text not null default 'active',
      raw jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists accounting_invoices (
      id bigserial primary key,
      customer_id bigint references accounting_customers(id) on delete set null,
      project_id bigint references projects(id) on delete set null,
      estimate_id bigint references estimates(id) on delete set null,
      invoice_number text not null unique,
      invoice_type text not null default 'progress',
      status text not null default 'draft',
      issue_date date not null default current_date,
      due_date date,
      subtotal numeric(14,2) not null default 0,
      tax numeric(14,2) not null default 0,
      retainage numeric(14,2) not null default 0,
      total numeric(14,2) not null default 0,
      balance_due numeric(14,2) not null default 0,
      notes text,
      raw jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists accounting_invoice_lines (
      id bigserial primary key,
      invoice_id bigint not null references accounting_invoices(id) on delete cascade,
      account_id bigint references accounting_accounts(id) on delete set null,
      description text not null,
      quantity numeric(14,4) not null default 1,
      unit_price numeric(14,2) not null default 0,
      line_total numeric(14,2) not null default 0,
      sort_order integer not null default 0,
      raw jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists accounting_bills (
      id bigserial primary key,
      vendor_id bigint references accounting_vendors(id) on delete set null,
      project_id bigint references projects(id) on delete set null,
      bill_number text,
      po_number text,
      status text not null default 'draft',
      bill_date date not null default current_date,
      due_date date,
      subtotal numeric(14,2) not null default 0,
      tax numeric(14,2) not null default 0,
      total numeric(14,2) not null default 0,
      balance_due numeric(14,2) not null default 0,
      notes text,
      raw jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists accounting_bill_lines (
      id bigserial primary key,
      bill_id bigint not null references accounting_bills(id) on delete cascade,
      account_id bigint references accounting_accounts(id) on delete set null,
      description text not null,
      quantity numeric(14,4) not null default 1,
      unit_price numeric(14,2) not null default 0,
      line_total numeric(14,2) not null default 0,
      sort_order integer not null default 0,
      raw jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists accounting_payments (
      id bigserial primary key,
      payment_direction text not null check (payment_direction in ('received','sent')),
      customer_id bigint references accounting_customers(id) on delete set null,
      vendor_id bigint references accounting_vendors(id) on delete set null,
      invoice_id bigint references accounting_invoices(id) on delete set null,
      bill_id bigint references accounting_bills(id) on delete set null,
      payment_date date not null default current_date,
      payment_method text,
      reference_number text,
      amount numeric(14,2) not null default 0,
      notes text,
      raw jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists accounting_journal_entries (
      id bigserial primary key,
      entry_number text not null unique,
      entry_date date not null default current_date,
      source text not null default 'manual',
      source_id text,
      description text,
      status text not null default 'posted',
      raw jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists accounting_journal_lines (
      id bigserial primary key,
      journal_entry_id bigint not null references accounting_journal_entries(id) on delete cascade,
      account_id bigint not null references accounting_accounts(id) on delete restrict,
      debit numeric(14,2) not null default 0,
      credit numeric(14,2) not null default 0,
      memo text,
      created_at timestamptz not null default now()
    );

    create table if not exists accounting_periods (
      id bigserial primary key,
      period_name text not null unique,
      start_date date not null,
      end_date date not null,
      status text not null default 'open',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);
}

export async function seedAccountingDefaults(db) {
  await ensureAccountingSchema(db);
  const accounts = [
    ['1000', 'Operating Bank', 'asset', 'debit'], ['1100', 'Accounts Receivable', 'asset', 'debit'], ['1200', 'Retainage Receivable', 'asset', 'debit'], ['1300', 'Inventory / Materials', 'asset', 'debit'], ['2000', 'Accounts Payable', 'liability', 'credit'], ['2100', 'Sales Tax Payable', 'liability', 'credit'], ['2200', 'Customer Deposits', 'liability', 'credit'], ['3000', 'Owner Equity', 'equity', 'credit'], ['4000', 'Project Revenue', 'income', 'credit'], ['4100', 'Change Order Revenue', 'income', 'credit'], ['5000', 'Material Costs', 'expense', 'debit'], ['5100', 'Labor Costs', 'expense', 'debit'], ['5200', 'Equipment / Rental Costs', 'expense', 'debit'], ['5300', 'Subcontractor Costs', 'expense', 'debit'], ['6000', 'Insurance Expense', 'expense', 'debit'], ['6100', 'General & Administrative', 'expense', 'debit']
  ];
  for (const [code, name, type, normal] of accounts) {
    await db.query(`insert into accounting_accounts (account_code, account_name, account_type, normal_balance) values ($1, $2, $3, $4) on conflict (account_code) do update set account_name = excluded.account_name, account_type = excluded.account_type, normal_balance = excluded.normal_balance, updated_at = now()`, [code, name, type, normal]);
  }
  await db.query(`insert into accounting_periods (period_name, start_date, end_date, status) values (to_char(current_date, 'YYYY-MM'), date_trunc('month', current_date)::date, (date_trunc('month', current_date) + interval '1 month - 1 day')::date, 'open') on conflict (period_name) do nothing`);
}

export async function getAccountingSummary(db) {
  await ensureAccountingSchema(db);
  const result = await db.query(`select coalesce((select sum(balance_due) from accounting_invoices where status not in ('void','paid')),0)::numeric(14,2) as ar_open, coalesce((select sum(balance_due) from accounting_bills where status not in ('void','paid')),0)::numeric(14,2) as ap_open, coalesce((select sum(amount) from accounting_payments where payment_direction = 'received' and payment_date >= date_trunc('month', current_date)),0)::numeric(14,2) as cash_received_mtd, coalesce((select sum(amount) from accounting_payments where payment_direction = 'sent' and payment_date >= date_trunc('month', current_date)),0)::numeric(14,2) as cash_paid_mtd, (select count(*) from accounting_invoices where status in ('draft','sent','approved','partially_paid'))::int as open_invoice_count, (select count(*) from accounting_bills where status in ('draft','received','approved','partially_paid'))::int as open_bill_count, (select count(*) from accounting_accounts where is_active)::int as active_account_count`);
  return result.rows[0];
}

export async function listAccountingTables(db) {
  await ensureAccountingSchema(db);
  const tables = await db.query(`select table_name from information_schema.tables where table_schema = 'public' and table_name like 'accounting_%' order by table_name`);
  return tables.rows.map((row) => row.table_name);
}

export async function createAccountingCustomer(db, payload = {}) {
  await ensureAccountingSchema(db);
  const result = await db.query(`insert into accounting_customers (customer_name, contact_name, email, phone, billing_address, terms, status, raw) values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`, [payload.customerName || payload.name || 'New Customer', payload.contactName || null, payload.email || null, payload.phone || null, payload.billingAddress || null, payload.terms || 'Net 30', payload.status || 'active', payload]);
  return result.rows[0];
}

export async function createAccountingVendor(db, payload = {}) {
  await ensureAccountingSchema(db);
  const result = await db.query(`insert into accounting_vendors (vendor_name, contact_name, email, phone, remittance_address, terms, status, raw) values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`, [payload.vendorName || payload.name || 'New Vendor', payload.contactName || null, payload.email || null, payload.phone || null, payload.remittanceAddress || null, payload.terms || 'Net 30', payload.status || 'active', payload]);
  return result.rows[0];
}

export async function createAccountingInvoice(db, payload = {}) {
  await ensureAccountingSchema(db);
  let invoiceNumber = payload.invoiceNumber || null;
  if (!invoiceNumber) {
    const reserved = await reserveAccountingNumber(db, 'invoice', payload.tenantKey || 'steelcraft');
    invoiceNumber = reserved.value;
  }
  const subtotal = Number(payload.subtotal || 0);
  const tax = Number(payload.tax || 0);
  const retainage = Number(payload.retainage || 0);
  const total = Number(payload.total ?? (subtotal + tax - retainage));
  const invoice = await db.query(`insert into accounting_invoices (customer_id, project_id, estimate_id, invoice_number, invoice_type, status, issue_date, due_date, subtotal, tax, retainage, total, balance_due, notes, raw) values ($1,$2,$3,$4,$5,$6,coalesce($7,current_date),$8,$9,$10,$11,$12,$13,$14,$15) returning *`, [payload.customerId || null, payload.projectId || null, payload.estimateId || null, invoiceNumber, payload.invoiceType || 'progress', payload.status || 'sent', payload.issueDate || null, payload.dueDate || null, subtotal, tax, retainage, total, payload.balanceDue ?? total, payload.notes || null, payload]);
  return invoice.rows[0];
}

export async function createAccountingBill(db, payload = {}) {
  await ensureAccountingSchema(db);
  const billNumber = payload.billNumber || `BILL-${Date.now()}`;
  const subtotal = Number(payload.subtotal || payload.amount || 0);
  const tax = Number(payload.tax || 0);
  const total = Number(payload.total ?? (subtotal + tax));
  const result = await db.query(`insert into accounting_bills (vendor_id, project_id, bill_number, po_number, status, bill_date, due_date, subtotal, tax, total, balance_due, notes, raw) values ($1,$2,$3,$4,$5,coalesce($6,current_date),$7,$8,$9,$10,$11,$12,$13) returning *`, [payload.vendorId || null, payload.projectId || null, billNumber, payload.poNumber || null, payload.status || 'received', payload.billDate || null, payload.dueDate || null, subtotal, tax, total, payload.balanceDue ?? total, payload.notes || null, payload]);
  return result.rows[0];
}

export async function createAccountingPayment(db, payload = {}) {
  await ensureAccountingSchema(db);
  const amount = Number(payload.amount || 0);
  const direction = payload.paymentDirection || payload.direction || 'received';
  const result = await db.query(`insert into accounting_payments (payment_direction, customer_id, vendor_id, invoice_id, bill_id, payment_date, payment_method, reference_number, amount, notes, raw) values ($1,$2,$3,$4,$5,coalesce($6,current_date),$7,$8,$9,$10,$11) returning *`, [direction, payload.customerId || null, payload.vendorId || null, payload.invoiceId || null, payload.billId || null, payload.paymentDate || null, payload.paymentMethod || 'manual', payload.referenceNumber || null, amount, payload.notes || null, payload]);
  if (direction === 'received' && payload.invoiceId) await db.query(`update accounting_invoices set balance_due = greatest(balance_due - $1, 0), status = case when greatest(balance_due - $1, 0) = 0 then 'paid' else 'partially_paid' end, updated_at = now() where id = $2`, [amount, payload.invoiceId]);
  if (direction === 'sent' && payload.billId) await db.query(`update accounting_bills set balance_due = greatest(balance_due - $1, 0), status = case when greatest(balance_due - $1, 0) = 0 then 'paid' else 'partially_paid' end, updated_at = now() where id = $2`, [amount, payload.billId]);
  return result.rows[0];
}

export async function createAccountingJournalEntry(db, payload = {}) {
  await ensureAccountingSchema(db);
  const entryNumber = payload.entryNumber || `JE-${Date.now()}`;
  const lines = Array.isArray(payload.lines) && payload.lines.length ? payload.lines : [];
  const entry = await db.query(`insert into accounting_journal_entries (entry_number, entry_date, source, source_id, description, status, raw) values ($1,coalesce($2,current_date),$3,$4,$5,$6,$7) returning *`, [entryNumber, payload.entryDate || null, payload.source || 'manual', payload.sourceId || null, payload.description || 'Manual journal entry', payload.status || 'posted', payload]);
  for (const [index, line] of lines.entries()) {
    if (!line.accountId) continue;
    await db.query(`insert into accounting_journal_lines (journal_entry_id, account_id, debit, credit, memo) values ($1,$2,$3,$4,$5)`, [entry.rows[0].id, line.accountId, Number(line.debit || 0), Number(line.credit || 0), line.memo || `Line ${index + 1}`]);
  }
  return entry.rows[0];
}
