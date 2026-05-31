import React, { useEffect, useMemo, useState } from 'react';
import './accountingLayout.css';

const fallbackSummary = { ar_open: '0.00', ap_open: '0.00', cash_received_mtd: '0.00', cash_paid_mtd: '0.00', open_invoice_count: 0, open_bill_count: 0, active_account_count: 0 };
const defaultInvoice = { prefix: 'SCB-INV-', nextNumber: 1001, allowCustomInvoiceNumber: false };
const defaultQuote = { prefix: 'SCB-Q-', nextNumber: 1001, allowCustomQuoteNumber: false };
const defaultTax = { state: 'FL', county: 'Orange', city: 'Orlando', stateRate: 6, countyRate: 0.5, cityRate: 0, defaultTaxable: true };
const sections = [
  ['today', 'Today', 'What needs attention right now'],
  ['money-in', 'Money In', 'Invoices, customer payments, and money owed to us'],
  ['money-out', 'Money Out', 'Vendor bills, checks, and money we owe'],
  ['banking', 'Banking + Cards', 'Bank accounts, debit cards, bank feed, and Neroa Comptroller review'],
  ['reports', 'Reports', 'Profit and loss, balance sheet, cash flow, budget, payroll, tax, AR/AP, and audit reports'],
  ['general-ledger', 'General Ledger', 'Chart of accounts, journal entries, and posting history'],
  ['payroll', 'Payroll Prep', 'Payroll, employees, PTO, tax liabilities, and employee review inputs'],
  ['quickbooks', 'QuickBooks', 'Optional QuickBooks/Foundation/CSV bridge'],
  ['setup', 'Setup', 'Customers, vendors, invoice numbers, tax, and accounting controls']
];
const validSections = new Set(sections.map(([id]) => id));

function pathSection() {
  const section = location.pathname.replace(/\/$/, '').match(/^\/portal\/accounting\/?([^/]*)/)?.[1] || 'today';
  return validSections.has(section) ? section : 'today';
}
function url(section) { return `/portal/accounting/${section}`; }
function meta(section) { return sections.find(([id]) => id === section) || sections[0]; }
function money(value) { return Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' }); }
function n(value) { const parsed = Number(value); return Number.isFinite(parsed) && value !== '' ? parsed : null; }
function dueIn(days) { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }
function taxRate(tax) { return (Number(tax.stateRate || 0) + Number(tax.countyRate || 0) + Number(tax.cityRate || 0)) / 100; }
function formatNumber(settings) { return `${settings.prefix || ''}${String(settings.nextNumber || 1).padStart(4, '0')}`; }

async function json(endpoint, options) {
  const response = await fetch(endpoint, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.error || `Request failed: ${response.status}`);
  return data;
}
async function post(endpoint, payload = {}) {
  return json(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actor: 'accounting', ...payload }) });
}
async function put(endpoint, payload = {}) {
  return json(endpoint, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actor: 'accounting', ...payload }) });
}

function Field({ label, children, hint }) {
  return <label className="brand-field"><span>{label}</span>{children}{hint && <small className="field-hint">{hint}</small>}</label>;
}
function Card({ title, children, description, className = '' }) {
  return <article className={`feature panel accounting-form-card ${className}`}><h2>{title}</h2>{description && <p>{description}</p>}{children}</article>;
}
function FormSection({ title, children }) {
  return <section className="accounting-card-section"><h3>{title}</h3><div className="accounting-card-grid">{children}</div></section>;
}
function Stat({ label, value, detail }) {
  return <article className="accounting-stat panel"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}
function Table({ title, rows = [], empty, className = '' }) {
  return <Card title={title} className={className}>{rows.length ? <div className="accounting-table">{rows.map((row, index) => <div className="accounting-table-row" key={row.id || row.invoice_number || row.bill_number || row.check_number || row.entry_number || row.report_key || index}><strong>{row.invoice_number || row.bill_number || row.check_number || row.entry_number || row.report_name || row.customer_name || row.vendor_name || row.employee_name || row.description || row.title || `#${row.id || index + 1}`}</strong><span>{row.customer_name || row.vendor_name || row.payee_name || row.description || row.status || row.report_description || row.detail || row.match_status || ''}</span><b>{row.total ? money(row.total) : row.amount ? money(row.amount) : row.balance_due ? money(row.balance_due) : row.confidence ? `${row.confidence}%` : row.status || row.report_status || ''}</b></div>)}</div> : <div className="accounting-empty">{empty}</div>}</Card>;
}

function Nav({ active, open }) {
  const [, title, desc] = meta(active);
  return <nav className="accounting-section-nav panel accounting-compact-nav">
    <div className="accounting-room-heading"><p className="eyebrow">Accounting room</p><h1>{title}</h1><p>{desc}</p></div>
    <div className="accounting-nav-row">
      <label><span>Choose room</span><select value={active} onChange={(event) => open(event.target.value)}>{sections.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <div className="accounting-header-actions compact"><button type="button" onClick={() => open('money-in')}>Create invoice</button><button type="button" onClick={() => open('money-out')}>Enter bill</button><button type="button" onClick={() => open('banking')}>Run Comptroller</button></div>
    </div>
  </nav>;
}

function ComptrollerCard({ comptroller, tasks, onSeed, onRun, onCommit, busy }) {
  const summary = comptroller?.dailySummary || comptroller?.latestReport?.raw?.dailySummary || null;
  const banking = comptroller?.banking || null;
  const transactions = banking?.transactions || [];
  const unmatched = transactions.filter((row) => row.match_status === 'unmatched').length;
  const pending = transactions.filter((row) => row.match_status === 'matched_pending_customer_approval').length;
  const review = transactions.filter((row) => row.match_status === 'needs_customer_review').length;
  return <Card title="Neroa Comptroller" description="Load bank activity as unmatched, let Neroa Comptroller match it, then approve/commit before anything posts." className="accounting-ai-worker accounting-full-row">
    <div className="accounting-actions-list"><button type="button" disabled={busy} onClick={onSeed}>Load demo bank data</button><button type="button" disabled={busy} onClick={onRun}>Run Comptroller</button><button type="button" disabled={busy} onClick={onCommit}>Approve / Commit matches</button></div>
    <div className="accounting-stat-grid mini"><Stat label="Unmatched" value={unmatched} detail="Fresh bank entries" /><Stat label="Pending approval" value={pending} detail="Matched by Comptroller" /><Stat label="Needs review" value={review} detail="Lower confidence" /><Stat label="Tasks" value={tasks.length} detail="Worker queue" /></div>
    {summary && <div className="accounting-table"><div className="accounting-table-row"><strong>Cash flow</strong><span>Money in/out from Comptroller report</span><b>{money((summary.sales || 0) - (summary.costOfGoods || 0) - (summary.laborCost || 0) - (summary.otherExpenses || 0) - (summary.fixedCostPerDay || 0))}</b></div><div className="accounting-table-row"><strong>Labor</strong><span>{summary.laborHours || 0} hours</span><b>{money(summary.laborCost || 0)}</b></div><div className="accounting-table-row"><strong>Recommendation</strong><span>{summary.recommendation || 'Run Comptroller to generate recommendation.'}</span><b>AI</b></div></div>}
    <Table title="Comptroller matches / tasks" rows={tasks.slice(0, 12)} empty="Run Comptroller to create match tasks." />
  </Card>;
}

function CustomerForm({ submit, busy, className = '' }) {
  const [form, setForm] = useState({ customerName: '', contactName: '', email: '', phone: '', terms: 'Net 30' });
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  return <Card title="Add customer" description="Only add what you need. You can finish details later." className={className}><form className="accounting-live-form" onSubmit={async (event) => { event.preventDefault(); await submit('/api/accounting/customers', form, 'Customer created.'); setForm({ customerName: '', contactName: '', email: '', phone: '', terms: 'Net 30' }); }}><FormSection title="Customer card"><Field label="Customer name"><input value={form.customerName} onChange={update('customerName')} required /></Field><Field label="Contact"><input value={form.contactName} onChange={update('contactName')} /></Field><Field label="Email"><input value={form.email} onChange={update('email')} /></Field><Field label="Phone"><input value={form.phone} onChange={update('phone')} /></Field></FormSection><button disabled={busy}>Add customer</button></form></Card>;
}
function VendorForm({ submit, busy, className = '' }) {
  const [form, setForm] = useState({ vendorName: '', contactName: '', email: '', phone: '', terms: 'Net 30' });
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  return <Card title="Add vendor" description="Vendors feed bills, checks, debit cards, and payments." className={className}><form className="accounting-live-form" onSubmit={async (event) => { event.preventDefault(); await submit('/api/accounting/vendors', form, 'Vendor created.'); setForm({ vendorName: '', contactName: '', email: '', phone: '', terms: 'Net 30' }); }}><FormSection title="Vendor card"><Field label="Vendor name"><input value={form.vendorName} onChange={update('vendorName')} required /></Field><Field label="Contact"><input value={form.contactName} onChange={update('contactName')} /></Field><Field label="Email"><input value={form.email} onChange={update('email')} /></Field><Field label="Phone"><input value={form.phone} onChange={update('phone')} /></Field></FormSection><button disabled={busy}>Add vendor</button></form></Card>;
}
function InvoiceForm({ customers, submit, busy, invoice, tax, className = '' }) {
  const [form, setForm] = useState({ customerId: '', invoiceNumber: '', invoiceType: 'progress', dueDate: dueIn(30), subtotal: '', taxableAmount: '', nonTaxableAmount: '0', taxable: tax.defaultTaxable, retainage: '0', notes: '' });
  const update = (key) => (event) => setForm({ ...form, [key]: key === 'taxable' ? event.target.checked : event.target.value });
  const subtotal = n(form.subtotal) || 0;
  const taxableAmount = form.taxable ? (n(form.taxableAmount) ?? subtotal) : 0;
  const calcTax = taxableAmount * taxRate(tax);
  const retainage = n(form.retainage) || 0;
  const total = subtotal + calcTax - retainage;
  return <Card title="Create invoice" description="Create the invoice. Neroa handles the proof trail in the background." className={className}><form className="accounting-live-form" onSubmit={async (event) => { event.preventDefault(); await submit('/api/accounting/invoices', { ...form, invoiceNumber: invoice.allowCustomInvoiceNumber && form.invoiceNumber ? form.invoiceNumber : null, customerId: n(form.customerId), subtotal, tax: calcTax, retainage, total, raw: { taxLocation: tax, taxableAmount, nonTaxableAmount: n(form.nonTaxableAmount) || 0 } }, 'Invoice created.'); setForm({ customerId: '', invoiceNumber: '', invoiceType: 'progress', dueDate: dueIn(30), subtotal: '', taxableAmount: '', nonTaxableAmount: '0', taxable: tax.defaultTaxable, retainage: '0', notes: '' }); }}><FormSection title="Customer + invoice"><Field label="Customer"><select value={form.customerId} onChange={update('customerId')}><option value="">Select customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.customer_name}</option>)}</select></Field><Field label="Invoice number"><input value={invoice.allowCustomInvoiceNumber ? form.invoiceNumber : formatNumber(invoice)} onChange={update('invoiceNumber')} readOnly={!invoice.allowCustomInvoiceNumber} /></Field><Field label="Due date"><input type="date" value={form.dueDate} onChange={update('dueDate')} /></Field></FormSection><FormSection title="Amounts"><Field label="Invoice amount"><input type="number" step="0.01" value={form.subtotal} onChange={update('subtotal')} required /></Field><Field label="Taxable"><label className="inline-check"><input type="checkbox" checked={form.taxable} onChange={update('taxable')} /> This invoice has taxable items</label></Field><Field label="Tax"><input value={money(calcTax)} readOnly /></Field><Field label="Retainage"><input type="number" step="0.01" value={form.retainage} onChange={update('retainage')} /></Field><Field label="Invoice total"><input value={money(total)} readOnly /></Field></FormSection><button disabled={busy}>Create invoice</button></form></Card>;
}
function BillForm({ vendors, submit, busy, className = '' }) {
  const [form, setForm] = useState({ vendorId: '', billNumber: '', poNumber: '', dueDate: dueIn(30), subtotal: '', tax: '0', notes: '' });
  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  const total = (n(form.subtotal) || 0) + (n(form.tax) || 0);
  return <Card title="Enter bill" className={className}><form className="accounting-live-form" onSubmit={async (event) => { event.preventDefault(); await submit('/api/accounting/bills', { ...form, vendorId: n(form.vendorId), total }, 'Bill entered.'); setForm({ vendorId: '', billNumber: '', poNumber: '', dueDate: dueIn(30), subtotal: '', tax: '0', notes: '' }); }}><FormSection title="Vendor + bill"><Field label="Vendor"><select value={form.vendorId} onChange={update('vendorId')}><option value="">Select vendor</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.vendor_name}</option>)}</select></Field><Field label="Bill number"><input value={form.billNumber} onChange={update('billNumber')} /></Field><Field label="PO number"><input value={form.poNumber} onChange={update('poNumber')} /></Field><Field label="Due date"><input type="date" value={form.dueDate} onChange={update('dueDate')} /></Field></FormSection><FormSection title="Amounts"><Field label="Amount"><input type="number" step="0.01" value={form.subtotal} onChange={update('subtotal')} required /></Field><Field label="Tax"><input type="number" step="0.01" value={form.tax} onChange={update('tax')} /></Field><Field label="Total"><input value={money(total)} readOnly /></Field></FormSection><button disabled={busy}>Save bill</button></form></Card>;
}

function Today({ summary, invoices, bills, payments, checks, open, comptroller, tasks, onSeed, onRun, onCommit, busy }) {
  return <><section className="accounting-stat-grid"><Stat label="Who owes us" value={money(summary.ar_open)} detail={`${summary.open_invoice_count || 0} open invoices`} /><Stat label="Who we owe" value={money(summary.ap_open)} detail={`${summary.open_bill_count || 0} open bills`} /><Stat label="Cash in MTD" value={money(summary.cash_received_mtd)} detail="Customer deposits" /><Stat label="Checks" value={checks.length} detail="Drafted or printed" /></section><ComptrollerCard comptroller={comptroller} tasks={tasks} onSeed={onSeed} onRun={onRun} onCommit={onCommit} busy={busy} /><section className="accounting-workspace-grid"><button className="feature panel accounting-workflow-card" onClick={() => open('money-in')}><h2>Money In</h2><p>Create invoices, record customer payments, and see who owes us.</p></button><button className="feature panel accounting-workflow-card" onClick={() => open('money-out')}><h2>Money Out</h2><p>Enter bills, write checks, and see who we owe.</p></button><button className="feature panel accounting-workflow-card" onClick={() => open('banking')}><h2>Comptroller</h2><p>Load data, match entries, review confidence, and commit.</p></button><button className="feature panel accounting-workflow-card" onClick={() => open('reports')}><h2>Reports</h2><p>Run cash flow, P&L, budget, payroll, tax, and aging reports.</p></button></section><section className="accounting-data-grid"><Table title="Unpaid invoices" rows={invoices.slice(0, 6)} empty="No invoices yet." /><Table title="Unpaid bills" rows={bills.slice(0, 6)} empty="No bills yet." /><Table title="Recent payments" rows={payments.slice(0, 6)} empty="No payments yet." /></section></>;
}
function Banking({ payments, summary, comptroller, tasks, onSeed, onRun, onCommit, busy }) {
  return <section className="accounting-focus-grid accounting-balanced-grid"><Card title="Banking snapshot"><div className="accounting-stat-grid mini"><Stat label="Cash in MTD" value={money(summary.cash_received_mtd)} detail="Customer deposits" /><Stat label="Cash out MTD" value={money(summary.cash_paid_mtd)} detail="Payments/cards" /></div></Card><ComptrollerCard comptroller={comptroller} tasks={tasks} onSeed={onSeed} onRun={onRun} onCommit={onCommit} busy={busy} /><Table title="Recent cash activity" rows={payments} empty="No payments yet." className="accounting-full-row" /></section>;
}
function Reports({ summary, invoices, bills, open }) {
  const rows = [{ report_name: 'Detailed Cash Flow', report_description: 'Cash in/out, runway, AR/AP pressure, forecast, and recommendation.', report_status: 'Live' }, { report_name: 'Profit and Loss', report_description: 'Income, COGS, expenses, and net income by period.', report_status: 'Live' }, { report_name: 'Balance Sheet', report_description: 'Assets, liabilities, equity, and equation check.', report_status: 'Live' }, { report_name: 'Budget vs Actual', report_description: 'Budget, actual, variance, risk, and AI savings plan.', report_status: 'Live' }, { report_name: 'Payroll / Tax Reports', report_description: 'Payroll, PTO, employees, federal/state/local tax readiness.', report_status: 'Live' }];
  const invoiceTotal = invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const billTotal = bills.reduce((sum, bill) => sum + Number(bill.total || 0), 0);
  return <section className="accounting-report-room"><Card title="Report command center" description="Owner view stays simple. Accountants/admins can drill into the report library." className="accounting-full-row"><div className="accounting-stat-grid mini"><Stat label="Revenue entered" value={money(invoiceTotal)} detail="Invoice total" /><Stat label="Bills entered" value={money(billTotal)} detail="Vendor bills" /><Stat label="Open AR" value={money(summary.ar_open)} detail="Receivables" /><Stat label="Open AP" value={money(summary.ap_open)} detail="Payables" /></div><div className="accounting-actions-list"><button type="button" onClick={() => open('general-ledger')}>Open ledger</button><button type="button" onClick={() => window.open('/api/accounting/reports/catalog', '_blank')}>Open catalog JSON</button></div></Card><Table title="Major reports" rows={rows} empty="No reports configured." className="accounting-full-row" /></section>;
}
function GeneralLedger({ accounts, journalEntries }) {
  return <section className="accounting-focus-grid accounting-balanced-grid"><Table title="Chart of accounts" rows={accounts} empty="No accounts yet." /><Table title="Journal entries" rows={journalEntries} empty="No journal entries yet." /><Card title="Ledger controls"><p>The simple Accounting page sits on top of the real ledger. Posting rules, journal entries, and account activity belong here.</p><div className="accounting-actions-list"><button type="button">New journal entry</button><button type="button">Verify ledger</button><button type="button">Export ledger</button></div></Card></section>;
}
function PayrollPrep({ payrollTax }) {
  const payroll = payrollTax?.payroll || {};
  const pto = payrollTax?.pto || {};
  const employees = payrollTax?.employees || {};
  return <section className="accounting-focus-grid accounting-balanced-grid"><Card title="Payroll / Employee command center"><p>Payroll prep, employee records, PTO, tax liabilities, and review inputs feed Accounting, but time tracking remains its own module.</p><div className="accounting-stat-grid mini"><Stat label="Employees" value={employees.employeeCount || 0} detail="Roster" /><Stat label="Gross pay" value={money(payroll.grossPay || 0)} detail="Current payroll run" /><Stat label="PTO remaining" value={pto.totalRemainingHours || 0} detail="Hours" /><Stat label="Tax liabilities" value={money(payrollTax?.taxes?.totals?.total || 0)} detail="Readiness" /></div></Card><Table title="Payroll actions" rows={[{ title: 'Review payroll run', detail: 'Check overtime, missing punches, tax profile, and manager approvals.', status: 'Review' }, { title: 'Review PTO', detail: 'Pending requests and liability impact.', status: 'PTO' }, { title: 'Review employee reports', detail: 'Attendance and quarterly review inputs.', status: 'HR' }]} empty="No payroll actions." /></section>;
}
function QuickBooks() {
  return <section className="accounting-focus-grid accounting-balanced-grid"><Card title="QuickBooks / Foundation / CSV bridge"><p>Neroa can run the AI workflow while QuickBooks, Foundation, Sage, or CSV remains the accountant-facing destination.</p><div className="accounting-actions-list"><button type="button">Prepare export package</button><button type="button">Map accounts</button><button type="button">Run sync check</button></div></Card><Table title="Sync mappings" rows={[]} empty="No mappings yet." /><Table title="Sync issues" rows={[]} empty="No sync issues." /></section>;
}
function Setup({ customers, vendors, accounts, submit, busy, status, settings, saveSettings }) {
  const saveInvoice = (key, value) => saveSettings({ invoiceNumbering: { ...settings.invoiceNumbering, [key]: value } });
  const saveQuote = (key, value) => saveSettings({ quoteNumbering: { ...settings.quoteNumbering, [key]: value } });
  const saveTax = (key, value) => saveSettings({ taxLocation: { ...settings.taxLocation, [key]: value } });
  return <section className="accounting-focus-grid accounting-balanced-grid"><Card title="Invoice numbers"><div className="accounting-card-grid"><Field label="Prefix"><input value={settings.invoiceNumbering.prefix || ''} onChange={(event) => saveInvoice('prefix', event.target.value)} /></Field><Field label="Next"><input type="number" value={settings.invoiceNumbering.nextNumber || 1} onChange={(event) => saveInvoice('nextNumber', Number(event.target.value || 1))} /></Field><Field label="Preview"><input value={formatNumber(settings.invoiceNumbering)} readOnly /></Field></div></Card><Card title="Quote numbers"><div className="accounting-card-grid"><Field label="Prefix"><input value={settings.quoteNumbering.prefix || ''} onChange={(event) => saveQuote('prefix', event.target.value)} /></Field><Field label="Next"><input type="number" value={settings.quoteNumbering.nextNumber || 1} onChange={(event) => saveQuote('nextNumber', Number(event.target.value || 1))} /></Field><Field label="Preview"><input value={formatNumber(settings.quoteNumbering)} readOnly /></Field></div></Card><Card title="Tax location"><div className="accounting-card-grid"><Field label="State"><input value={settings.taxLocation.state || ''} onChange={(event) => saveTax('state', event.target.value)} /></Field><Field label="County"><input value={settings.taxLocation.county || ''} onChange={(event) => saveTax('county', event.target.value)} /></Field><Field label="City"><input value={settings.taxLocation.city || ''} onChange={(event) => saveTax('city', event.target.value)} /></Field><Field label="Combined rate"><input value={`${(taxRate(settings.taxLocation) * 100).toFixed(3)}%`} readOnly /></Field></div></Card><CustomerForm submit={submit} busy={busy} /><VendorForm submit={submit} busy={busy} /><Table title="Customers" rows={customers} empty="No customers yet." /><Table title="Vendors" rows={vendors} empty="No vendors yet." /><Table title="Chart of accounts" rows={accounts} empty="No accounts yet." /><Card title="Advanced setup"><pre className="accounting-json-preview">{JSON.stringify(status.infrastructure || {}, null, 2)}</pre></Card></section>;
}

export default function AccountingPortal() {
  const [active, setActive] = useState(pathSection);
  const [status, setStatus] = useState({ summary: fallbackSummary, tables: [], ok: false });
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [checks, setChecks] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [settings, setSettings] = useState({ invoiceNumbering: defaultInvoice, quoteNumbering: defaultQuote, taxLocation: defaultTax });
  const [comptroller, setComptroller] = useState(null);
  const [workerTasks, setWorkerTasks] = useState([]);
  const [message, setMessage] = useState({ text: '', busy: false });
  const [error, setError] = useState('');

  function open(section) {
    const safe = validSections.has(section) ? section : 'today';
    history.pushState({}, '', url(safe));
    setActive(safe);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  async function load() {
    const endpoints = ['/api/accounting/status', '/api/accounting/accounts', '/api/accounting/customers', '/api/accounting/vendors', '/api/accounting/invoices', '/api/accounting/bills', '/api/accounting/payments', '/api/accounting/checks', '/api/accounting/settings', '/api/accounting/journal', '/api/accounting/comptroller/today', '/api/accounting/worker/tasks'];
    const responses = await Promise.all(endpoints.map((endpoint) => fetch(endpoint)));
    const data = await Promise.all(responses.map((response) => response.json().catch(() => ({}))));
    const [statusData, accountsData, customersData, vendorsData, invoicesData, billsData, paymentsData, checksData, settingsData, journalData, comptrollerData, tasksData] = data;
    setStatus(statusData.ok ? statusData : { summary: fallbackSummary });
    setAccounts(accountsData.accounts || []);
    setCustomers(customersData.customers || []);
    setVendors(vendorsData.vendors || []);
    setInvoices(invoicesData.invoices || []);
    setBills(billsData.bills || []);
    setPayments(paymentsData.payments || []);
    setChecks(checksData.checks || []);
    setJournalEntries(journalData.journalEntries || []);
    if (settingsData.settings) setSettings(settingsData.settings);
    if (comptrollerData.ok) setComptroller(comptrollerData);
    setWorkerTasks(tasksData.tasks || comptrollerData.tasks || []);
  }

  async function submit(endpoint, payload, success) {
    setMessage({ text: '', busy: true });
    try { await post(endpoint, payload); await load(); setMessage({ text: success, busy: false }); }
    catch (err) { setMessage({ text: err.message || 'Accounting action failed.', busy: false }); }
  }
  async function saveSettings(payload) {
    setMessage({ text: 'Saving settings...', busy: true });
    try { const result = await put('/api/accounting/settings', payload); setSettings(result.settings); setMessage({ text: 'Settings saved to database.', busy: false }); }
    catch (err) { setMessage({ text: err.message || 'Settings failed.', busy: false }); }
  }
  async function runComptrollerAction(kind) {
    const endpoints = { seed: '/api/accounting/banking/demo/seed', run: '/api/accounting/worker/demo/run', commit: '/api/accounting/worker/demo/commit' };
    const labels = { seed: 'Loaded 225 unmatched demo bank entries.', run: 'Neroa Comptroller ran and created match suggestions.', commit: 'Approved matches committed to books.' };
    setMessage({ text: kind === 'run' ? 'Running Neroa Comptroller...' : 'Working...', busy: true });
    try {
      const result = await post(endpoints[kind], {});
      if (result.tasks) setWorkerTasks(result.tasks);
      await load();
      setMessage({ text: labels[kind], busy: false });
      if (kind === 'run' || kind === 'seed') open('banking');
    } catch (err) {
      setMessage({ text: err.message || 'Comptroller action failed.', busy: false });
    }
  }

  useEffect(() => { const sync = () => setActive(pathSection()); window.addEventListener('popstate', sync); return () => window.removeEventListener('popstate', sync); }, []);
  useEffect(() => { let alive = true; load().catch((err) => { if (alive) setError(err.message || 'Accounting data could not be loaded.'); }); return () => { alive = false; }; }, []);

  const summary = status.summary || fallbackSummary;
  const payrollTax = status.payrollTax || {};
  const actions = useMemo(() => ({ onSeed: () => runComptrollerAction('seed'), onRun: () => runComptrollerAction('run'), onCommit: () => runComptrollerAction('commit') }), []);
  let body = null;
  if (active === 'today') body = <Today summary={summary} invoices={invoices} bills={bills} payments={payments} checks={checks} open={open} comptroller={comptroller} tasks={workerTasks} busy={message.busy} {...actions} />;
  else if (active === 'money-in') body = <section className="accounting-page-format"><InvoiceForm className="accounting-primary-card" customers={customers} submit={submit} busy={message.busy} invoice={settings.invoiceNumbering || defaultInvoice} tax={settings.taxLocation || defaultTax} /><aside className="accounting-side-stack"><CustomerForm submit={submit} busy={message.busy} /><Table title="Customer invoices" rows={invoices} empty="No invoices yet." /></aside></section>;
  else if (active === 'money-out') body = <section className="accounting-page-format"><BillForm className="accounting-primary-card" vendors={vendors} submit={submit} busy={message.busy} /><aside className="accounting-side-stack"><VendorForm submit={submit} busy={message.busy} /><Table title="Vendor bills" rows={bills} empty="No bills yet." /><Table title="Checks" rows={checks} empty="No checks yet." /></aside></section>;
  else if (active === 'banking') body = <Banking payments={payments} summary={summary} comptroller={comptroller} tasks={workerTasks} busy={message.busy} {...actions} />;
  else if (active === 'reports') body = <Reports summary={summary} invoices={invoices} bills={bills} open={open} />;
  else if (active === 'general-ledger') body = <GeneralLedger accounts={accounts} journalEntries={journalEntries} />;
  else if (active === 'payroll') body = <PayrollPrep payrollTax={payrollTax} />;
  else if (active === 'quickbooks') body = <QuickBooks />;
  else body = <Setup customers={customers} vendors={vendors} accounts={accounts} submit={submit} busy={message.busy} status={status} settings={settings} saveSettings={saveSettings} />;

  return <><Nav active={active} open={open} />{error && <div className="notice">{error}</div>}{message.text && <div className="notice">{message.text}</div>}{body}</>;
}
