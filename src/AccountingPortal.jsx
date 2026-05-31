import React, { useEffect, useState } from 'react';
import './accountingLayout.css';

const sections = [
  ['today', 'Today', 'Accounting lane hardening view'],
  ['comptroller', 'Comptroller', 'AI matching, review, approval, and posting control'],
  ['reports', 'Reports', 'Report library will stay behind the Comptroller lane'],
  ['setup', 'Setup', 'Bank feed, accounting rules, exports, and guardrails']
];
const validSections = new Set(sections.map(([id]) => id));

function pathSection() {
  const section = location.pathname.replace(/\/$/, '').match(/^\/portal\/accounting\/?([^/]*)/)?.[1] || 'today';
  return validSections.has(section) ? section : 'today';
}
function url(section) { return `/portal/accounting/${section}`; }
function meta(section) { return sections.find(([id]) => id === section) || sections[0]; }

function Card({ title, description, children, className = '' }) {
  return <article className={`feature panel accounting-form-card ${className}`}><h2>{title}</h2>{description && <p>{description}</p>}{children}</article>;
}
function Stat({ label, value, detail }) {
  return <article className="accounting-stat panel"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}
function Table({ title, rows = [], empty }) {
  return <Card title={title}>{rows.length ? <div className="accounting-table">{rows.map((row, index) => <div className="accounting-table-row" key={row.key || index}><strong>{row.title}</strong><span>{row.detail}</span><b>{row.status}</b></div>)}</div> : <div className="accounting-empty">{empty}</div>}</Card>;
}

function Nav({ active, open }) {
  const [, title, desc] = meta(active);
  return <nav className="accounting-section-nav panel accounting-compact-nav">
    <div className="accounting-room-heading"><p className="eyebrow">Accounting room</p><h1>{title}</h1><p>{desc}</p></div>
    <div className="accounting-nav-row">
      <label><span>Choose room</span><select value={active} onChange={(event) => open(event.target.value)}>{sections.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <div className="accounting-header-actions compact"><button type="button" onClick={() => open('comptroller')}>Open Comptroller</button><button type="button" onClick={() => open('setup')}>Setup lane</button></div>
    </div>
  </nav>;
}

function ComptrollerShell({ open, health }) {
  const statusRows = [
    { key: 'bank-feed', title: 'Bank feed', detail: 'No demo bank data is loaded. Connect Plaid, bank import, or approved production feed before matching.', status: 'Needs setup' },
    { key: 'matching', title: 'Comptroller matching', detail: 'Will stay idle until live entries exist. No fake matches will be created from this screen.', status: 'Idle' },
    { key: 'approval', title: 'Approval gate', detail: 'Matched entries must be reviewed/approved before posting.', status: 'Harden' },
    { key: 'audit', title: 'Audit trail', detail: 'Every Comptroller action should create a Scan/Vault/Guard trace before commit.', status: 'Required' }
  ];

  return <section className="accounting-focus-grid accounting-balanced-grid">
    <Card title="Neroa Comptroller" description="This lane is now clean: no fake accounting numbers, no demo bank load, and no auto-created matches. We can harden the real Comptroller workflow here." className="accounting-full-row">
      <div className="accounting-stat-grid mini">
        <Stat label="Mode" value="Hardening" detail="Safe lane" />
        <Stat label="Demo data" value="Off" detail="Removed from UI" />
        <Stat label="Posting" value="Locked" detail="Approval required" />
        <Stat label="Backend" value={health?.checks?.database || 'Checking'} detail="Database status" />
      </div>
      <div className="accounting-actions-list">
        <button type="button" disabled>Run Comptroller</button>
        <button type="button" disabled>Commit matches</button>
        <button type="button" onClick={() => open('setup')}>Open setup checklist</button>
      </div>
      <p className="accounting-empty">Run and commit are intentionally disabled until the live-bank-feed path and approval guardrails are hardened.</p>
    </Card>
    <Table title="Comptroller readiness" rows={statusRows} empty="No readiness checks yet." />
    <Card title="What we harden next">
      <div className="accounting-table">
        <div className="accounting-table-row"><strong>1. Intake</strong><span>Live bank/Plaid/CSV import creates unmatched entries only.</span><b>Next</b></div>
        <div className="accounting-table-row"><strong>2. Match</strong><span>Comptroller suggests matches with confidence and reason codes.</span><b>Next</b></div>
        <div className="accounting-table-row"><strong>3. Review</strong><span>User approves, rejects, or edits each suggested match.</span><b>Next</b></div>
        <div className="accounting-table-row"><strong>4. Commit</strong><span>Only approved matches post to books and create audit receipts.</span><b>Next</b></div>
      </div>
    </Card>
  </section>;
}

function Today({ open, health }) {
  return <>
    <section className="accounting-stat-grid">
      <Stat label="Accounting lane" value="Clean" detail="No fake figures" />
      <Stat label="Comptroller" value="Idle" detail="Waiting for real feed" />
      <Stat label="Posting" value="Locked" detail="No auto-commit" />
      <Stat label="Health" value={health?.ok ? 'Online' : 'Check'} detail="App status" />
    </section>
    <ComptrollerShell open={open} health={health} />
  </>;
}

function Reports() {
  return <section className="accounting-report-room">
    <Card title="Reports are parked while the lane hardens" description="The report catalog stays part of the roadmap, but fake numbers should not appear in the accounting room. Reports will come back once they are backed by real posted data." className="accounting-full-row">
      <div className="accounting-table">
        <div className="accounting-table-row"><strong>Cash flow</strong><span>Requires real bank entries, AR, AP, payroll, and approved posting.</span><b>Parked</b></div>
        <div className="accounting-table-row"><strong>P&L / Balance Sheet</strong><span>Requires posted journal entries and period controls.</span><b>Parked</b></div>
        <div className="accounting-table-row"><strong>Payroll / Tax</strong><span>Requires real employee/time/payroll setup.</span><b>Parked</b></div>
      </div>
    </Card>
  </section>;
}

function Setup({ health }) {
  const rows = [
    { key: 'connect-bank', title: 'Connect bank feed', detail: 'Plaid, bank import, or customer CSV upload must create unmatched entries only.', status: 'Required' },
    { key: 'rules', title: 'Set matching rules', detail: 'Vendor/customer/project/account rules with confidence thresholds.', status: 'Required' },
    { key: 'guardrails', title: 'Set approval guardrails', detail: 'Human approval before posting, check writing, export, or external sync.', status: 'Required' },
    { key: 'receipts', title: 'Attach audit receipts', detail: 'Scan/Vault/Guard receipt references on every Comptroller action.', status: 'Required' },
    { key: 'export', title: 'Accounting bridge', detail: 'QuickBooks/Foundation/CSV export after approved posting.', status: 'Later' }
  ];
  return <section className="accounting-focus-grid accounting-balanced-grid">
    <Table title="Hardening checklist" rows={rows} empty="No setup tasks." />
    <Card title="Backend status"><pre className="accounting-json-preview">{JSON.stringify(health || {}, null, 2)}</pre></Card>
  </section>;
}

export default function AccountingPortal() {
  const [active, setActive] = useState(pathSection);
  const [health, setHealth] = useState(null);
  const [message, setMessage] = useState('Accounting demo data has been removed from the UI. Comptroller is parked in hardening mode.');

  function open(section) {
    const safe = validSections.has(section) ? section : 'today';
    history.pushState({}, '', url(safe));
    setActive(safe);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  useEffect(() => {
    const sync = () => setActive(pathSection());
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  useEffect(() => {
    let alive = true;
    fetch('/api/health').then((response) => response.json()).then((data) => { if (alive) setHealth(data); }).catch(() => { if (alive) setMessage('Accounting lane is loaded. Backend health could not be checked.'); });
    return () => { alive = false; };
  }, []);

  let body = null;
  if (active === 'today') body = <Today open={open} health={health} />;
  else if (active === 'comptroller') body = <ComptrollerShell open={open} health={health} />;
  else if (active === 'reports') body = <Reports />;
  else body = <Setup health={health} />;

  return <><Nav active={active} open={open} />{message && <div className="notice">{message}</div>}{body}</>;
}
