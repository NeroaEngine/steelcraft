import React, { useEffect, useState } from 'react';
import './accountingLayout.css';

const sections = [
  ['today', 'Today', 'Accounting command center'],
  ['billing', 'Billing', 'Customer invoices, progress billing, and approvals'],
  ['insurance', 'Insurance', 'Certificates, expirations, and compliance tracking'],
  ['purchase-orders', 'Purchase Orders', 'Vendor POs, approvals, receiving, and cost coding'],
  ['receivables', 'Accounts Receivable', 'Customer balances, collections, and payment status'],
  ['payables', 'Accounts Payable', 'Vendor bills, approvals, and scheduled payments'],
  ['sov', 'Schedule of Values', 'Project billing schedule, percent complete, and retainage'],
  ['change-orders', 'Change Orders', 'Pending, approved, billed, and rejected changes'],
  ['reports', 'Reports', 'Financial report library and accounting snapshots'],
  ['comptroller', 'Neroa Comptroller', 'AI matching, review, approval, and posting workflow'],
  ['setup', 'Setup', 'Bank feed, accounting rules, exports, and posting preferences']
];
const validSections = new Set(sections.map(([id]) => id));

const todayStats = [
  ['Open AR', '$184.2k', '18 customer balances'],
  ['Open AP', '$76.8k', '23 vendor bills'],
  ['Pending COs', '$42.5k', '7 need approval'],
  ['SOV billing', '$311k', 'Ready this month']
];
const billingRows = [
  ['SC-INV-1042', 'North Ridge Builders - progress billing package', 'Draft'],
  ['SC-INV-1043', 'Summit Industrial - maintenance platform phase 2', 'Ready'],
  ['SC-INV-1044', 'Acme Steel Supply - material release invoice', 'Review']
];
const insuranceRows = [
  ['Keystone Fabrication Group', 'COI expires in 12 days. Hold new work until updated.', 'Needs review'],
  ['Summit Industrial', 'General liability and workers comp current.', 'Current'],
  ['North Ridge Builders', 'Additional insured certificate requested.', 'Pending']
];
const poRows = [
  ['PO-22018', 'Steel package - Acme Steel Supply - project cost code 4010', 'Approved'],
  ['PO-22019', 'Galvanized embeds - vendor confirmation needed', 'Pending'],
  ['PO-22020', 'Paint and coatings - receiving not complete', 'Receiving']
];
const arRows = [
  ['North Ridge Builders', '$82,400 open. Progress draw due this week.', 'Due'],
  ['Summit Industrial', '$31,500 open. Payment promised Friday.', 'Watch'],
  ['Acme Steel Supply', '$70,300 open. Statement sent.', 'Open']
];
const apRows = [
  ['Central Metals', '$28,900 bill awaiting project manager approval.', 'Approve'],
  ['Rapid Freight', '$6,450 scheduled for payment run.', 'Scheduled'],
  ['Keystone Fabrication', '$0 held pending insurance paperwork.', 'Hold']
];
const sovRows = [
  ['Warehouse expansion', 'Mobilization 100%, steel package 65%, erection 20%.', 'Billable'],
  ['Industrial platform', 'Engineering complete, fabrication 80%, field install pending.', 'Review'],
  ['Storage building', 'Deposit posted, materials not released.', 'Hold']
];
const changeOrderRows = [
  ['CO-118', 'North Ridge Builders - added lintels and field welding.', 'Pending approval'],
  ['CO-119', 'Summit Industrial - stair revision and handrail change.', 'Approved'],
  ['CO-120', 'Acme Steel Supply - expedited delivery request.', 'Price review']
];
const reportRows = [
  ['Cash Position', 'Cash, AR, AP, and short-term exposure snapshot.', 'Available'],
  ['Project Profitability', 'Cost-to-date, billing-to-date, margin, and retainage.', 'Available'],
  ['Aging Summary', 'AR aging, AP aging, collection priority, and vendor pressure.', 'Available'],
  ['Change Order Exposure', 'Pending, approved, billed, and rejected CO value.', 'Available']
];

function pathSection() {
  const section = location.pathname.replace(/\/$/, '').match(/^\/portal\/accounting\/?([^/]*)/)?.[1] || 'today';
  return validSections.has(section) ? section : 'today';
}
function url(section) { return section === 'today' ? '/portal/accounting' : `/portal/accounting/${section}`; }
function meta(section) { return sections.find(([id]) => id === section) || sections[0]; }
function Card({ title, description, children, className = '' }) { return <article className={`feature panel accounting-form-card ${className}`}><h2>{title}</h2>{description && <p>{description}</p>}{children}</article>; }
function Stat({ label, value, detail }) { return <article className="accounting-stat panel"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
function Table({ title, rows = [], empty, className = '' }) { return <Card title={title} className={className}>{rows.length ? <div className="accounting-table">{rows.map((row, index) => <div className="accounting-table-row" key={`${row[0]}-${index}`}><strong>{row[0]}</strong><span>{row[1]}</span><b>{row[2]}</b></div>)}</div> : <div className="accounting-empty">{empty}</div>}</Card>; }

function Nav({ active, open }) {
  const [, title, desc] = meta(active);
  return <nav className="accounting-section-nav panel accounting-compact-nav">
    <div className="accounting-room-heading"><p className="eyebrow">Accounting room</p><h1>{title}</h1><p>{desc}</p></div>
    <div className="accounting-nav-row">
      <label><span>Choose room</span><select value={active} onChange={(event) => open(event.target.value)}>{sections.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <div className="accounting-header-actions compact"><button type="button" onClick={() => open('billing')}>Billing</button><button type="button" onClick={() => open('purchase-orders')}>Purchase Orders</button><button type="button" onClick={() => open('payables')}>Payment Run</button><button type="button" onClick={() => open('comptroller')}>Comptroller</button><button type="button" onClick={() => open('reports')}>Reports</button></div>
    </div>
  </nav>;
}

function Today({ open }) {
  return <>
    <section className="accounting-stat-grid">{todayStats.map(([label, value, detail]) => <Stat key={label} label={label} value={value} detail={detail} />)}</section>
    <section className="accounting-workspace-grid">
      <button className="accounting-workflow-card panel" type="button" onClick={() => open('billing')}><p className="eyebrow">Billing</p><h2>Invoices + draws</h2><p>Progress billing, customer invoices, approvals, retainage, and send status.</p></button>
      <button className="accounting-workflow-card panel" type="button" onClick={() => open('purchase-orders')}><p className="eyebrow">Purchasing</p><h2>PO control</h2><p>Vendor POs, approvals, receiving status, cost codes, and release controls.</p></button>
      <button className="accounting-workflow-card panel" type="button" onClick={() => open('sov')}><p className="eyebrow">Projects</p><h2>Schedule of Values</h2><p>Billing schedule, percent complete, retainage, and monthly draw readiness.</p></button>
      <button className="accounting-workflow-card panel" type="button" onClick={() => open('comptroller')}><p className="eyebrow">AI</p><h2>Neroa Comptroller</h2><p>AI match suggestions move through normal review before posting.</p></button>
    </section>
    <section className="accounting-focus-grid accounting-balanced-grid">
      <Table title="Billing queue" rows={billingRows} empty="No billing items." />
      <Table title="Collections watch" rows={arRows} empty="No AR items." />
      <Table title="Vendor approval queue" rows={apRows} empty="No AP items." />
    </section>
  </>;
}

function Billing() { return <section className="accounting-focus-grid accounting-balanced-grid"><Table title="Customer billing queue" rows={billingRows} empty="No invoices." /><Table title="Schedule of Values ready to bill" rows={sovRows} empty="No SOV rows." /><Card title="Create invoice"><div className="accounting-live-form"><label><span>Customer</span><input placeholder="Select customer" /></label><label><span>Project / Cost code</span><input placeholder="Project or cost code" /></label><label><span>Invoice amount</span><input placeholder="$0.00" /></label><button type="button">Create draft invoice</button></div></Card></section>; }
function Insurance() { return <section className="accounting-focus-grid accounting-balanced-grid"><Table title="Insurance compliance" rows={insuranceRows} empty="No insurance items." /><Card title="Insurance controls" description="Track certificate expirations, additional insured requests, vendor holds, and project release rules." /></section>; }
function PurchaseOrders() { return <section className="accounting-focus-grid accounting-balanced-grid"><Table title="Purchase order queue" rows={poRows} empty="No POs." /><Card title="Create purchase order"><div className="accounting-live-form"><label><span>Vendor</span><input placeholder="Vendor name" /></label><label><span>Project / Cost code</span><input placeholder="Cost code" /></label><label><span>PO amount</span><input placeholder="$0.00" /></label><button type="button">Create PO draft</button></div></Card></section>; }
function Receivables() { return <section className="accounting-focus-grid accounting-balanced-grid"><Table title="Accounts receivable" rows={arRows} empty="No receivables." /><Card title="Collection actions" description="Send statement, schedule follow-up, mark promise-to-pay, or route to owner review." /></section>; }
function Payables() { return <section className="accounting-focus-grid accounting-balanced-grid"><Table title="Accounts payable" rows={apRows} empty="No payables." className="accounting-full-row accounting-expanded-payables" /></section>; }
function ScheduleOfValues() { return <section className="accounting-focus-grid accounting-balanced-grid"><Table title="Schedule of Values" rows={sovRows} empty="No SOV rows." /><Card title="SOV billing controls" description="Track line item percent complete, retainage, approved value, billed-to-date, and ready-to-bill status." /></section>; }
function ChangeOrders() { return <section className="accounting-focus-grid accounting-balanced-grid"><Table title="Change order queue" rows={changeOrderRows} empty="No change orders." /><Card title="Change order controls" description="Pending changes should not hit billing until approved. Approved changes can flow into SOV and invoice draft queues." /></section>; }
function Reports() { return <section className="accounting-report-room"><Card title="Accounting reports" description="Operational report library for accounting and project financial control." className="accounting-full-row"><div className="accounting-table">{reportRows.map(([title, detail, status]) => <div className="accounting-table-row" key={title}><strong>{title}</strong><span>{detail}</span><b>{status}</b></div>)}</div></Card></section>; }

function Comptroller({ open, health }) {
  const rows = [
    ['Bank feed', 'Connect Plaid, bank import, or approved accounting feed before matching.', 'Needs setup'],
    ['AI matching', 'Suggests matches with confidence and clear reason codes.', 'Ready'],
    ['Review workflow', 'User reviews, edits, approves, or rejects each suggested match.', 'Available'],
    ['Posting controls', 'Approved matches can post to books or export to the accounting system.', 'Ready']
  ];
  return <section className="accounting-focus-grid accounting-balanced-grid"><Card title="Neroa Comptroller" description="AI accounting assistant for matching bank entries, bills, invoices, payments, cost codes, and project records."><div className="accounting-stat-grid mini"><Stat label="Mode" value="Review" detail="User controlled" /><Stat label="Matching" value="Ready" detail="Needs feed" /><Stat label="Posting" value="Approval" detail="User confirms" /><Stat label="Backend" value={health?.checks?.database || 'Checking'} detail="Database status" /></div><div className="accounting-actions-list"><button type="button">Review unmatched entries</button><button type="button">Open match suggestions</button><button type="button" onClick={() => open('setup')}>Open setup</button></div></Card><Table title="Comptroller workflow" rows={rows} empty="No workflow items." /></section>;
}
function Setup({ health }) { const rows = [['Connect bank feed', 'Plaid, bank import, or CSV upload creates accounting entries for review.', 'Required'], ['Set matching rules', 'Vendor, customer, project, and account rules with confidence thresholds.', 'Required'], ['Set approval preferences', 'Choose who can approve posting, payments, exports, and syncs.', 'Required'], ['Set posting workflow', 'Choose whether entries post internally, export to QuickBooks/Foundation, or both.', 'Required'], ['Accounting bridge', 'QuickBooks/Foundation/CSV export after user-approved posting.', 'Later']]; return <section className="accounting-focus-grid accounting-balanced-grid"><Table title="Accounting setup" rows={rows} empty="No setup tasks." /><Card title="Backend status"><pre className="accounting-json-preview">{JSON.stringify(health || {}, null, 2)}</pre></Card></section>; }

export default function AccountingPortal() {
  const [active, setActive] = useState(pathSection);
  const [health, setHealth] = useState(null);
  function open(section) { const safe = validSections.has(section) ? section : 'today'; history.pushState({}, '', url(safe)); setActive(safe); window.dispatchEvent(new PopStateEvent('popstate')); }
  useEffect(() => { const sync = () => setActive(pathSection()); window.addEventListener('popstate', sync); return () => window.removeEventListener('popstate', sync); }, []);
  useEffect(() => { let alive = true; fetch('/api/health').then((response) => response.json()).then((data) => { if (alive) setHealth(data); }).catch(() => { if (alive) setHealth({ ok: false, status: 'Backend health unavailable' }); }); return () => { alive = false; }; }, []);

  let body = null;
  if (active === 'today') body = <Today open={open} />;
  else if (active === 'billing') body = <Billing />;
  else if (active === 'insurance') body = <Insurance />;
  else if (active === 'purchase-orders') body = <PurchaseOrders />;
  else if (active === 'receivables') body = <Receivables />;
  else if (active === 'payables') body = <Payables />;
  else if (active === 'sov') body = <ScheduleOfValues />;
  else if (active === 'change-orders') body = <ChangeOrders />;
  else if (active === 'reports') body = <Reports />;
  else if (active === 'comptroller') body = <Comptroller open={open} health={health} />;
  else body = <Setup health={health} />;

  return <><Nav active={active} open={open} />{body}</>;
}
