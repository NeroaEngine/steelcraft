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

const crmStyles = {
  shell: { width: 'min(1460px, 100%)', margin: '0 auto', display: 'grid', gap: 18 },
  hero: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, alignItems: 'end', padding: 30 },
  heroTitle: { fontSize: 'clamp(42px, 5vw, 70px)', lineHeight: .92, margin: '10px 0 8px', letterSpacing: '-0.06em' },
  toolbar: { display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) auto auto', gap: 10, alignItems: 'center' },
  summary: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 },
  stat: { padding: 20 },
  layout: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) minmax(420px, .75fr)', gap: 18, alignItems: 'start' },
  card: { padding: 24 },
  table: { display: 'grid', gap: 10, overflowX: 'auto' },
  row: { minWidth: 1040, display: 'grid', gridTemplateColumns: '1.35fr 1fr .9fr .8fr .9fr 1.2fr .8fr .45fr', gap: 12, alignItems: 'center', textAlign: 'left' },
  head: { color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 12, fontWeight: 900, padding: '0 12px' },
  dataRow: { width: '100%', border: '1px solid var(--line)', borderRadius: 18, background: 'var(--surface-alt)', color: 'var(--text)', padding: 16 },
  selected: { borderColor: 'var(--brand-accent)', boxShadow: 'inset 5px 0 0 var(--brand-accent)' },
  form: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 },
  full: { gridColumn: '1 / -1' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18, flexWrap: 'wrap' },
  tools: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16, gridColumn: '1 / -1' }
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
  const [activeId, setActiveId] = useState(1);
  const [query, setQuery] = useState('');
  const [showTools, setShowTools] = useState(false);
  const active = customers.find((customer) => customer.id === activeId) || customers[0];
  const filtered = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return customers;
    return customers.filter((customer) => [customer.company, customer.contact, customer.type, customer.phone, customer.email, customer.status, customer.owner, customer.location].some((value) => value.toLowerCase().includes(clean)));
  }, [query]);

  return <>
    {Header ? <Header id={id} /> : null}
    <section className="live-module-shell canonical-force-live" style={crmStyles.shell}>
      <article className="live-module-card" style={crmStyles.hero}>
        <div>
          <p className="eyebrow">CRM</p>
          <h2 style={crmStyles.heroTitle}>Customers</h2>
          <p>Company records, contacts, account ownership, activity, value, and customer notes.</p>
        </div>
        <div style={crmStyles.toolbar}>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customers, contacts, email, status..." aria-label="Search customers" />
          <button type="button">Add Customer</button>
          <button type="button" onClick={() => setShowTools((value) => !value)}>More</button>
        </div>
        {showTools && <div style={crmStyles.tools}>{crmTools.map((tool) => <button type="button" key={tool}>{tool}</button>)}</div>}
      </article>

      <div style={crmStyles.summary}>
        <article className="live-module-card" style={crmStyles.stat}><span>Total customers</span><h3>{customers.length}</h3></article>
        <article className="live-module-card" style={crmStyles.stat}><span>Active accounts</span><h3>{customers.filter((customer) => customer.status === 'Active').length}</h3></article>
        <article className="live-module-card" style={crmStyles.stat}><span>Open value</span><h3>$289.7k</h3></article>
        <article className="live-module-card" style={crmStyles.stat}><span>Needs review</span><h3>1</h3></article>
      </div>

      <div style={crmStyles.layout}>
        <article className="live-module-card" style={crmStyles.card}>
          <div className="module-head"><h3>Customer List</h3><span>{filtered.length} shown</span></div>
          <div style={crmStyles.table}>
            <div style={{ ...crmStyles.row, ...crmStyles.head }}><span>Company</span><span>Contact</span><span>Type</span><span>Status</span><span>Owner</span><span>Last Activity</span><span>Value</span><span></span></div>
            {filtered.map((customer) => <button type="button" key={customer.id} onClick={() => setActiveId(customer.id)} style={{ ...crmStyles.row, ...crmStyles.dataRow, ...(active.id === customer.id ? crmStyles.selected : {}) }}>
              <strong>{customer.company}</strong><span>{customer.contact}</span><span>{customer.type}</span><b>{customer.status}</b><span>{customer.owner}</span><span>{customer.activity}</span><strong>{customer.value}</strong><b>Open</b>
            </button>)}
          </div>
        </article>

        <aside className="live-module-card" style={crmStyles.card}>
          <p className="eyebrow">Customer Record</p>
          <h3>{active.company}</h3>
          <p>{active.notes}</p>
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
          <div style={crmStyles.actions}><button type="button">Edit Record</button><button type="button">Save</button></div>
        </aside>
      </div>
    </section>
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
