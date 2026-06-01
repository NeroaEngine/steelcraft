import React, { useMemo, useState } from 'react';

const genericModules = {
  admin: { title: 'Admin', intro: 'Tenant controls, users, roles, portal access, setup, security, and audit controls.', metrics: [['Users', '6', 'Authenticated roles'], ['Portals', '12', 'Enabled'], ['Setup', 'Open', 'Guided setup'], ['Audit', 'Ready', 'Proof events']] },
  hr: { title: 'HR Portal', intro: 'Employee records, onboarding, handbook, training, PTO, and employee documents.', metrics: [['Employees', '17', 'Active'], ['Training', '4', 'Due'], ['PTO', '2', 'Pending'], ['Docs', 'Ready', 'Files']] },
  vendor: { title: 'Vendor Portal', intro: 'Vendor packets, PO visibility, due dates, upload slots, receiving status, and vendor communication.', metrics: [['Packets', '19', 'Open'], ['Uploads', '5', 'Needed'], ['Late', '3', 'Follow-up'], ['AP links', '14', 'Ready']] },
  customer: { title: 'Customer Portal', intro: 'Customer approvals, payments, documents, uploads, job status, and customer communication.', metrics: [['Approvals', '11', 'Action'], ['Invoices', '$27k', 'Open'], ['Uploads', '6', 'Needed'], ['Threads', '22', 'Active']] },
  employee: { title: 'Employee Self-Service', intro: 'Employee profile, PTO requests, handbook acknowledgements, training assignments, documents, and HR help.', metrics: [['Training', '4 due', 'Assignments'], ['PTO', '2', 'Pending'], ['Docs', '12', 'Files'], ['Help', 'Live', 'Support']] }
};

const customers = [
  { id: 1, company: 'Acme Steel Supply', contact: 'Jordan Miles', type: 'Customer', phone: '(555) 014-1188', email: 'jordan@acmesteel.com', status: 'Active', owner: 'Sales Team', activity: 'Quote updated today', value: '$84,200', location: 'Pittsburgh, PA', notes: 'Structural steel supply and fabrication support for commercial projects.' },
  { id: 2, company: 'North Ridge Builders', contact: 'Taylor Grant', type: 'General Contractor', phone: '(555) 018-4472', email: 'taylor@northridgebuilders.com', status: 'Prospect', owner: 'Estimating', activity: 'Bid request received', value: '$142,000', location: 'Cleveland, OH', notes: 'Commercial construction projects and subcontractor coordination.' },
  { id: 3, company: 'Summit Industrial', contact: 'Morgan Lee', type: 'Industrial Client', phone: '(555) 016-9090', email: 'morgan@summitindustrial.com', status: 'Active', owner: 'Operations', activity: 'Maintenance scope reviewed', value: '$63,500', location: 'Columbus, OH', notes: 'Plant maintenance, platforms, rails, and miscellaneous metals.' },
  { id: 4, company: 'Keystone Fabrication Group', contact: 'Riley Carter', type: 'Partner', phone: '(555) 011-5528', email: 'riley@keystonefab.com', status: 'On Hold', owner: 'Admin', activity: 'Insurance document pending', value: '$0', location: 'Youngstown, OH', notes: 'Partner record requires paperwork review before new work is assigned.' }
];

const crmTools = ['Lead Inbox', 'Timeline', 'Inbound Leads', 'AI Communication', 'Website Intelligence', 'Website Optimizer', 'CRM Audit', 'Handoffs', 'Master Records'];

const saasButton = {
  border: '0',
  borderRadius: 14,
  padding: '12px 16px',
  background: 'linear-gradient(135deg, var(--brand-accent), #c95d63)',
  color: 'white',
  fontWeight: 900,
  boxShadow: '0 12px 28px rgba(0,0,0,.28)'
};

const ghostButton = {
  border: '1px solid var(--line)',
  borderRadius: 14,
  padding: '12px 16px',
  background: 'rgba(255,255,255,.06)',
  color: 'var(--text)',
  fontWeight: 900
};

const crmStyles = {
  shell: { width: 'min(1320px, 100%)', margin: '0 auto', display: 'grid', gap: 18, justifyItems: 'center' },
  listCard: { width: 'min(1180px, calc(100vw - 90px))', padding: 30, margin: '0 auto' },
  listHeader: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, alignItems: 'start', marginBottom: 20 },
  title: { fontSize: 'clamp(34px, 4vw, 54px)', lineHeight: .95, margin: '8px 0', letterSpacing: '-0.05em' },
  subText: { color: 'var(--muted)', margin: 0, lineHeight: 1.55 },
  headerRight: { display: 'grid', gap: 12, justifyItems: 'end' },
  chips: { display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10 },
  chip: { border: '1px solid var(--line)', borderRadius: 18, padding: '10px 14px', background: 'rgba(255,255,255,.04)', minWidth: 96 },
  chipLabel: { display: 'block', color: 'var(--muted)', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 900 },
  chipValue: { display: 'block', fontSize: 26, fontWeight: 950, marginTop: 4 },
  actions: { display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' },
  search: { width: 330, maxWidth: '100%' },
  tools: { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end', marginBottom: 18 },
  table: { display: 'grid', gap: 10, overflowX: 'auto' },
  row: { minWidth: 1040, display: 'grid', gridTemplateColumns: '1.4fr 1fr .9fr .8fr .9fr 1.1fr .8fr .45fr', gap: 14, alignItems: 'center', textAlign: 'left' },
  head: { color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 12, fontWeight: 900, padding: '0 14px' },
  dataRow: { width: '100%', border: '1px solid var(--line)', borderRadius: 18, background: 'var(--surface-alt)', color: 'var(--text)', padding: 18, boxShadow: '0 14px 34px rgba(0,0,0,.16)' },
  overlay: { position: 'fixed', inset: 0, zIndex: 40, display: 'grid', placeItems: 'start center', padding: '110px 24px 40px', background: 'rgba(0,0,0,.54)', backdropFilter: 'blur(6px)' },
  record: { width: 'min(1040px, calc(100vw - 80px))', padding: 34, borderRadius: 28, boxShadow: '0 28px 90px rgba(0,0,0,.55)' },
  recordHeader: { display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'start', marginBottom: 20 },
  recordTitle: { fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 1, margin: '8px 0', letterSpacing: '-0.05em' },
  form: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 },
  full: { gridColumn: '1 / -1' },
  recordActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, flexWrap: 'wrap' }
};

function Metric({ row }) {
  return <div className="live-module-metric"><strong>{row[0]}</strong><b>{row[1]}</b><span>{row[2]}</span></div>;
}

function SimpleGrid({ title, rows }) {
  return <div className="live-module-grid crm-wide-grid"><article className="live-module-card crm-wide-card"><h3>{title}</h3><div className="live-module-list">{rows.map((row) => <div className="live-module-row" key={row[0]}><div><strong>{row[0]}</strong><span>{row[1]}</span></div><b>{row[2]}</b></div>)}</div></article></div>;
}

function Field({ label, children, full = false }) {
  return <label style={full ? crmStyles.full : undefined}><span>{label}</span>{children}</label>;
}

function ContactsCrm({ Header, id }) {
  const [activeId, setActiveId] = useState(null);
  const [query, setQuery] = useState('');
  const [showTools, setShowTools] = useState(false);
  const active = customers.find((customer) => customer.id === activeId) || null;
  const filtered = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return customers;
    return customers.filter((customer) => [customer.company, customer.contact, customer.type, customer.phone, customer.email, customer.status, customer.owner, customer.location].some((value) => value.toLowerCase().includes(clean)));
  }, [query]);

  return <>
    {Header ? <Header id={id} /> : null}
    <section className="live-module-shell canonical-force-live" style={crmStyles.shell}>
      <article className="live-module-card" style={crmStyles.listCard}>
        <div style={crmStyles.listHeader}>
          <div>
            <p className="eyebrow">CRM</p>
            <h2 style={crmStyles.title}>Customer List</h2>
            <p style={crmStyles.subText}>Search, open, and manage customer records from one clean customer database.</p>
          </div>
          <div style={crmStyles.headerRight}>
            <div style={crmStyles.chips}>
              <div style={crmStyles.chip}><span style={crmStyles.chipLabel}>Total customers</span><strong style={crmStyles.chipValue}>280</strong></div>
              <div style={crmStyles.chip}><span style={crmStyles.chipLabel}>Needs review</span><strong style={crmStyles.chipValue}>1</strong></div>
            </div>
            <div style={crmStyles.actions}>
              <input style={crmStyles.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customers..." aria-label="Search customers" />
              <button type="button" style={saasButton}>Add Customer</button>
              <button type="button" style={ghostButton} onClick={() => setShowTools((value) => !value)}>More</button>
            </div>
          </div>
        </div>

        {showTools && <div style={crmStyles.tools}>{crmTools.map((tool) => <button type="button" style={ghostButton} key={tool}>{tool}</button>)}</div>}

        <div style={crmStyles.table}>
          <div style={{ ...crmStyles.row, ...crmStyles.head }}><span>Company</span><span>Contact</span><span>Type</span><span>Status</span><span>Owner</span><span>Last Activity</span><span>Value</span><span></span></div>
          {filtered.map((customer) => <button type="button" key={customer.id} onClick={() => setActiveId(customer.id)} style={crmStyles.dataRow}>
            <div style={crmStyles.row}>
              <strong>{customer.company}</strong><span>{customer.contact}</span><span>{customer.type}</span><b>{customer.status}</b><span>{customer.owner}</span><span>{customer.activity}</span><strong>{customer.value}</strong><b>Open</b>
            </div>
          </button>)}
        </div>
      </article>
    </section>

    {active && <div style={crmStyles.overlay} onClick={() => setActiveId(null)}>
      <aside className="live-module-card" style={crmStyles.record} onClick={(event) => event.stopPropagation()}>
        <div style={crmStyles.recordHeader}>
          <div>
            <p className="eyebrow">Customer Record</p>
            <h3 style={crmStyles.recordTitle}>{active.company}</h3>
            <p>{active.notes}</p>
          </div>
          <button type="button" style={ghostButton} onClick={() => setActiveId(null)}>Close</button>
        </div>
        <div style={crmStyles.form}>
          <Field label="Company"><input value={active.company} readOnly /></Field>
          <Field label="Primary Contact"><input value={active.contact} readOnly /></Field>
          <Field label="Customer Type"><input value={active.type} readOnly /></Field>
          <Field label="Owner"><input value={active.owner} readOnly /></Field>
          <Field label="Phone"><input value={active.phone} readOnly /></Field>
          <Field label="Email"><input value={active.email} readOnly /></Field>
          <Field label="Location"><input value={active.location} readOnly /></Field>
          <Field label="Open Value"><input value={active.value} readOnly /></Field>
          <Field label="Notes" full><textarea rows="4" value={active.notes} readOnly /></Field>
        </div>
        <div style={crmStyles.recordActions}><button type="button" style={ghostButton}>Edit Record</button><button type="button" style={saasButton}>Save</button></div>
      </aside>
    </div>}
  </>;
}

export function isLiveCanonicalPortal(id) {
  return id === 'contacts' || Boolean(genericModules[id]);
}

export default function LiveCanonicalPortal({ id, Header }) {
  if (id === 'contacts') return <ContactsCrm Header={Header} id={id} />;
  const data = genericModules[id];
  if (!data) return null;
  return <>
    {Header ? <Header id={id} /> : null}
    <section className="live-module-shell canonical-force-live">
      <article className="live-module-card">
        <p className="eyebrow">Canonical live module</p>
        <h2>{data.title}</h2>
        <p>{data.intro}</p>
        <div className="live-module-actions"><button type="button">Open</button><button type="button">Route</button><button type="button">Approve</button><button type="button">Proof</button></div>
        <div className="live-module-metrics">{data.metrics.map((row) => <Metric row={row} key={row[0]} />)}</div>
      </article>
      <SimpleGrid title={`${data.title} workspace`} rows={data.metrics} />
    </section>
  </>;
}
