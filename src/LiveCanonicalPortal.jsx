import React, { useMemo, useState } from 'react';

const baseSections = {
  admin: [
    ['User control', [['Seth McBride', 'Admin / Owner · all tenant controls', 'Owner'], ['Neroa Developer', 'Developer room and system setup', 'Dev'], ['Accounting User', 'Accounting + Contacts + Employee access', 'Ready']]],
    ['Portal access', [['Canonical core', 'Admin, Accounting, Contacts, HR, Vendor, Customer, Employee', 'Live'], ['Industry pack', 'Sales, Estimating, Projects, Planning, Purchasing', 'Live'], ['Permission map', 'Role-based portal assignment', 'Ready']]],
    ['Tenant setup', [['Start Setup', 'Guided customer/accounting/payroll/banking setup', 'Open'], ['Language', 'User language stored in database', 'Live'], ['Brand handoff', 'Steel Craft brand controls locked by developer', 'Ready']]],
    ['Security + proof', [['Authentication', 'Database-backed login users', 'Live'], ['Neroa Edge', 'Bank-level security foundation lane', 'Planned'], ['Audit trail', 'Admin changes should create proof/audit events', 'Proof']]]
  ],
  contacts: [
    ['CRM hardening checklist', [['Contact intake', 'Create company/person records from real setup, CSV upload, customer portal, vendor portal, or manual admin entry.', 'Required'], ['No fake CRM records', 'The Contacts / CRM lane should not display fake customers, vendors, balances, or duplicate counts.', 'Clean'], ['Approval and ownership', 'Every company/person needs owner, type, source, status, and permission context before it feeds another room.', 'Required']]],
    ['Master records', [['Companies', 'Canonical company record for customer, vendor, contractor, subcontractor, partner, and internal entity.', 'Schema'], ['People', 'Canonical person/contact record with role, email, phone, portal access, and communication preference.', 'Schema'], ['Relationships', 'Links people to companies, projects, quotes, invoices, POs, service tickets, and messages.', 'Schema']]],
    ['Room handoffs', [['Accounting', 'Approved customer/vendor records flow to Accounting only after setup rules are confirmed.', 'Locked'], ['Sales / Estimating', 'Leads, quote contacts, and decision makers link back to CRM identity.', 'Planned'], ['Neroa Connect', 'Messages and threads attach to company/person history with trace refs.', 'Planned']]],
    ['Audit requirements', [['Merge history', 'Duplicate merge must preserve source records and create Scan/Vault/Guard trace.', 'Required'], ['Data changes', 'Email, phone, terms, tax identity, portal access, and ownership changes require audit events.', 'Required'], ['Exports', 'QuickBooks/Foundation/CSV/customer exports must use approved canonical records.', 'Required']]]
  ],
  hr: [
    ['Employee records', [['John Rivera', 'Press Lead · $25/hr', 'Active'], ['Maria Lane', 'Press Operator · $24/hr', 'Active'], ['Noah Ward', 'Runner · $16/hr', 'Active']]],
    ['Onboarding', [['New hire packet', 'W-4, I-9, handbook acknowledgement', 'Ready'], ['Safety checklist', 'Machine and shop safety basics', 'Live'], ['Document folder', 'Employee file storage and signatures', 'Drive']]],
    ['Payroll prep', [['Hourly rates', 'Feed Comptroller labor costing', 'Live'], ['Time approvals', 'Manager review before payroll', 'Gate'], ['Loaded labor', 'Burden estimate for daily report', 'Live']]],
    ['Training + PTO', [['Safety training', '4 assignments due this week', 'Due'], ['PTO requests', '2 requests awaiting approval', 'Pending'], ['Policy signoff', 'Handbook proof events captured', 'Proof']]]
  ],
  vendor: [
    ['Vendor packets', [['Blank Shirt Supply', 'PO-5001 confirm ship date', 'Open'], ['InkPro Distribution', 'Pricing confirmation needed', 'Need'], ['Screen Room Supply', 'Late delivery follow-up', 'Escalate']]],
    ['Upload requests', [['Invoice PDF', 'Route to AP bill', 'AP'], ['Packing slip', 'Attach to receiving', 'Upload'], ['Tax forms', 'Missing from 2 vendors', 'Need']]],
    ['Receiving', [['Dock check-in', '8 deliveries expected today', 'Today'], ['Partial receive', '2 POs short shipped', 'Review'], ['Cost coding', 'Post to job or inventory', 'Code']]],
    ['AP bill links', [['PO to bill', 'Vendor invoice becomes AP bill', 'Live'], ['Payment terms', 'Net terms and due dates controlled', 'Live'], ['Comptroller', 'Prioritize bills against cash', 'Live']]]
  ],
  customer: [
    ['Approvals', [['Photo approval', 'JOB-24018 ready for customer', 'Send'], ['Quote approval', 'SCB-Q-1002 waiting approval', 'Send'], ['Change order', 'Apex Roofing revision', 'Review']]],
    ['Payments', [['Open invoices', 'Past due and current AR', 'Live'], ['Payment link', 'Send through portal', 'Ready'], ['Credit hold', 'Comptroller can recommend hold', 'Policy']]],
    ['Documents', [['Quote PDF', 'Customer-visible approved quote', 'Live'], ['Artwork files', 'Upload and proof assets', 'Live'], ['Closeout packet', 'Delivery docs + invoice + payment', 'Ready']]],
    ['Neroa Connect', [['Customer thread', 'Messages tied to job/account', 'Live'], ['Approval proof', 'Approval captured into Proof', 'Proof'], ['Support', 'Routes to team or AI', 'Live']]]
  ],
  employee: [
    ['Profile', [['Personal info', 'Update contact and emergency info', 'Open'], ['Documents', 'Handbook and forms', 'Open'], ['Manager', 'Route requests to manager', 'Live']]],
    ['PTO', [['Request', 'Submit PTO request', 'Open'], ['Balance', 'Policy and available time', 'View'], ['Approval', 'Manager approval proof', 'Proof']]],
    ['Training', [['Safety training', 'Due this week', 'Due'], ['Machine basics', 'Assigned to press crew', 'Active'], ['Handbook', 'Acknowledgement required', 'Sign']]],
    ['HR help', [['Ask HR', 'Policy or setup question', 'Connect'], ['Support', 'Route to admin if needed', 'Live'], ['Proof', 'Acknowledgements recorded', 'Proof']]]
  ]
};

const canonicalLiveData = {
  admin: { title: 'Admin', intro: 'Tenant controls, users, roles, portal access, language, setup status, security posture, and customer-facing administration.', metrics: [['Users', '6', 'Authenticated roles'], ['Portals', '12', 'Enabled for tenant'], ['Languages', '6', 'Available'], ['Setup', 'Open', 'Comptroller-guided']], actions: ['Invite user', 'Assign portals', 'Start setup', 'Review security'], sections: baseSections.admin, formTitle: 'Admin action' },
  contacts: { title: 'Contacts / CRM', intro: 'Canonical contact and relationship lane. Fake CRM records are removed; this room is parked for hardening master data, approvals, merge rules, and handoffs into Accounting, Sales, Estimating, Vendor, Customer, and Neroa Connect.', metrics: [['Mode', 'Hardening', 'No fake contacts'], ['Companies', '0', 'Waiting for real intake'], ['People', '0', 'Waiting for real intake'], ['Posting handoff', 'Locked', 'Approval required']], actions: ['Define schema', 'Import real list', 'Set merge rules', 'Approve handoffs'], sections: baseSections.contacts, formTitle: 'Create CRM draft' },
  hr: { title: 'HR Portal', intro: 'Employees, onboarding, handbook, training, PTO, payroll prep connection, labor rates, and employee documents.', metrics: [['Employees', '17', 'Active crew'], ['Training', '4', 'Due'], ['PTO', '2', 'Pending'], ['Payroll', '91%', 'Ready']], actions: ['Add employee', 'Assign training', 'Review PTO', 'Open payroll prep'], sections: baseSections.hr, formTitle: 'Add employee' },
  vendor: { title: 'Vendor Portal', intro: 'Vendor packets, PO visibility, due dates, upload slots, receiving status, AP bill connection, and vendor communication.', metrics: [['Packets', '19', 'Open'], ['Uploads', '5', 'Needed'], ['Late', '3', 'Follow-up'], ['AP links', '14', 'Bills ready']], actions: ['Send vendor packet', 'Request upload', 'Confirm due date', 'Open AP bill'], sections: baseSections.vendor, formTitle: 'Create vendor packet' },
  customer: { title: 'Customer Portal', intro: 'Customer approvals, payments, documents, uploads, job status, photo approvals, and customer communication.', metrics: [['Approvals', '11', 'Customer action'], ['Invoices', '$27k', 'Open AR'], ['Uploads', '6', 'Needed'], ['Threads', '22', 'Active']], actions: ['Send approval', 'Request payment', 'Upload document', 'Open customer thread'], sections: baseSections.customer, formTitle: 'Customer request' },
  employee: { title: 'Employee Self-Service', intro: 'Employee profile, PTO requests, handbook acknowledgements, training assignments, documents, and HR help.', metrics: [['Training', '4 due', 'Assignments'], ['PTO', '2', 'Pending'], ['Docs', '12', 'Files'], ['Help', 'Live', 'Neroa']], actions: ['Request PTO', 'Open training', 'Acknowledge handbook', 'Ask HR'], sections: baseSections.employee, formTitle: 'Employee request' }
};

const actionBlueprints = {
  admin: { 'Invite user': ['Create invitation', 'Choose role', 'Send setup link', 'Write audit event'], 'Assign portals': ['Select user', 'Toggle portals', 'Save permission map', 'Write admin proof'], 'Start setup': ['Open setup checklist', 'Confirm tenant info', 'Route to Comptroller', 'Track completion'], 'Review security': ['Check users', 'Review roles', 'Review proof events', 'Flag risks'] },
  contacts: { 'Define schema': ['Create company table', 'Create people table', 'Create relationship table', 'Write audit contract'], 'Import real list': ['Upload CSV/XLSX', 'Map columns', 'Preview records', 'Require approval before import'], 'Set merge rules': ['Detect duplicates', 'Choose winner record', 'Preserve source history', 'Write merge proof'], 'Approve handoffs': ['Approve customer/vendor identity', 'Push to target room', 'Attach trace refs', 'Lock canonical ID'] },
  hr: { 'Add employee': ['Create employee', 'Set role/rate', 'Assign manager', 'Send onboarding'], 'Assign training': ['Pick employee', 'Pick course', 'Set due date', 'Notify employee'], 'Review PTO': ['Open requests', 'Check schedule', 'Approve/deny', 'Write proof'], 'Open payroll prep': ['Review rates', 'Approve timecards', 'Calculate loaded labor', 'Send to Comptroller'] },
  vendor: { 'Send vendor packet': ['Choose vendor', 'Attach PO', 'Set due date', 'Send packet'], 'Request upload': ['Pick document', 'Send upload slot', 'Track receipt', 'Route to AP'], 'Confirm due date': ['Open vendor thread', 'Ask confirmation', 'Update PO', 'Proof response'], 'Open AP bill': ['Match PO', 'Attach invoice', 'Code expense', 'Queue payment'] },
  customer: { 'Send approval': ['Select job', 'Attach photo/quote', 'Send approval', 'Capture proof'], 'Request payment': ['Select invoice', 'Send payment link', 'Track response', 'Update AR'], 'Upload document': ['Open upload slot', 'Classify document', 'Attach to job', 'Write proof'], 'Open customer thread': ['Start thread', 'Link customer/job', 'Route message', 'Track response'] },
  employee: { 'Request PTO': ['Choose dates', 'Check balance', 'Route to manager', 'Track decision'], 'Open training': ['View assignments', 'Start course', 'Mark complete', 'Write proof'], 'Acknowledge handbook': ['Open handbook', 'Sign acknowledgement', 'Save timestamp', 'Write proof'], 'Ask HR': ['Write question', 'Route to HR/Neroa', 'Track answer', 'Attach proof'] }
};

const quickActions = ['Open', 'Approve', 'Route', 'Proof'];

function makeProof(label) {
  let hash = 0;
  String(label || 'proof').split('').forEach((char) => { hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0; });
  return `proof:${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

function Metric({ row }) {
  return <div className="live-module-metric"><strong>{row[0]}</strong><b>{row[1]}</b><span>{row[2]}</span></div>;
}

function ActionPanel({ portalId, activeAction, selectedRow, events, onRunStep, onClose }) {
  const steps = activeAction ? (actionBlueprints[portalId]?.[activeAction] || ['Capture request', 'Route with Neroa', 'Queue approval', 'Write proof']) : [];
  return <aside className="live-module-card live-action-panel">
    <div className="live-action-head"><div><p className="eyebrow">Live action drawer</p><h3>{activeAction || 'Select an action'}</h3></div>{activeAction && <button type="button" onClick={onClose}>Close</button>}</div>
    {selectedRow && <div className="live-module-proof"><strong>Selected record</strong><span>{selectedRow.section}: {selectedRow.row[0]} · {selectedRow.row[1]} · {selectedRow.row[2]}</span></div>}
    <div className="live-module-status-strip">{steps.map((step, index) => <button className="live-module-step live-click-step" type="button" key={step} onClick={() => onRunStep(step)}><b>{index + 1}</b><span>{step}</span></button>)}</div>
    <div className="live-module-proof"><strong>Action log</strong>{events.length ? events.slice(0, 5).map((event) => <span key={event.id}>{event.text}</span>) : <span>Click a button, row, or step to create a local hardening event.</span>}</div>
  </aside>;
}

function LiveSection({ section, draftRows, onRowAction }) {
  const rows = [...section[1], ...draftRows];
  return <article className="live-module-card"><h3>{section[0]}</h3><div className="live-module-list">{rows.map((row) => <div className="live-module-row live-module-row-action" key={`${section[0]}-${row[0]}`}><button type="button" onClick={() => onRowAction(section[0], row, 'Open')}><strong>{row[0]}</strong><span>{row[1]}</span></button><b>{row[2]}</b><div className="live-row-actions">{quickActions.map((action) => <button type="button" key={action} onClick={() => onRowAction(section[0], row, action)}>{action}</button>)}</div></div>)}</div></article>;
}

export function isLiveCanonicalPortal(id) {
  return Boolean(canonicalLiveData[id]);
}

export default function LiveCanonicalPortal({ id, Header }) {
  const data = canonicalLiveData[id];
  const [activeAction, setActiveAction] = useState(data?.actions?.[0] || '');
  const [selectedRow, setSelectedRow] = useState(null);
  const [events, setEvents] = useState([]);
  const [draftRows, setDraftRows] = useState({});
  const [form, setForm] = useState({ name: '', type: 'Customer', email: '', priority: 'Ready', notes: '' });

  const defaultSectionName = data?.sections?.[0]?.[0] || 'Records';
  const panelEvents = useMemo(() => events, [events]);

  if (!data) return null;

  function log(text) {
    setEvents((current) => [{ id: `${Date.now()}-${current.length}`, text }, ...current].slice(0, 12));
  }

  function openAction(action) {
    setActiveAction(action);
    log(`${data.title}: opened ${action}. ${makeProof(`${id}-${action}`)}`);
  }

  function rowAction(sectionName, row, action) {
    setSelectedRow({ section: sectionName, row });
    setActiveAction(action === 'Open' ? `Open ${sectionName}` : `${action} ${row[0]}`);
    log(`${action}: ${row[0]} from ${sectionName}. ${makeProof(`${id}-${sectionName}-${row[0]}-${action}`)}`);
  }

  function runStep(step) {
    log(`Ran step: ${step}. ${makeProof(`${id}-${activeAction}-${step}`)}`);
  }

  function submit(event) {
    event.preventDefault();
    const name = form.name.trim() || `${data.title} draft`;
    const row = [name, `${form.type} · ${form.email || 'email pending'} · ${form.notes || 'ready for Neroa routing'}`, form.priority];
    setDraftRows((current) => ({ ...current, [defaultSectionName]: [...(current[defaultSectionName] || []), row] }));
    setSelectedRow({ section: defaultSectionName, row });
    setActiveAction(`Saved ${name}`);
    log(`Saved draft record: ${name}. ${makeProof(`${id}-${name}-${Date.now()}`)}`);
    setForm({ name: '', type: 'Customer', email: '', priority: 'Ready', notes: '' });
  }

  return <>
    {Header ? <Header id={id} /> : null}
    <section className="live-module-shell canonical-force-live">
      <article className="live-module-card">
        <p className="eyebrow">Canonical live module</p>
        <h2>{data.title}</h2>
        <p>{data.intro}</p>
        <div className="live-module-actions">{data.actions.map((action) => <button type="button" key={action} onClick={() => openAction(action)}>{action}</button>)}</div>
        <div className="live-module-metrics">{data.metrics.map((row) => <Metric row={row} key={row[0]} />)}</div>
      </article>
      <ActionPanel portalId={id} activeAction={activeAction} selectedRow={selectedRow} events={panelEvents} onRunStep={runStep} onClose={() => setActiveAction('')} />
      <div className="live-module-grid">
        {data.sections.map((section) => <LiveSection section={section} draftRows={draftRows[section[0]] || []} onRowAction={rowAction} key={section[0]} />)}
        <article className="live-module-card">
          <h3>{data.formTitle}</h3>
          <form className="live-module-form" onSubmit={submit}>
            <label>Name<input value={form.name} placeholder="Name" onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label>Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Customer</option><option>Vendor</option><option>Contractor</option><option>Internal</option></select></label>
            <label>Email<input value={form.email} placeholder="email@company.com" onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option>Ready</option><option>Needs review</option><option>Proof required</option></select></label>
            <label className="wide">Notes<textarea value={form.notes} placeholder="Notes for Neroa routing" onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
            <button type="submit">Save draft</button>
          </form>
          <div className="live-module-proof"><strong>Proof-ready path</strong><span>Drafts are local UI only until the Contacts / CRM backend schema, approvals, and audit events are hardened.</span></div>
        </article>
      </div>
    </section>
  </>;
}
