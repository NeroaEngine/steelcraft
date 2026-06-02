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
  { id: 2, company: 'North Ridge Builders', contact: 'Taylor Grant', type: 'General Contractor', phone: '(555) 018-4472', email: 'taylor@northridgebuilders.com', status: 'Active', owner: 'Estimating', activity: 'Bid approved', value: '$142,000', location: 'Cleveland, OH', notes: 'Commercial construction projects and subcontractor coordination.' },
  { id: 3, company: 'Summit Industrial', contact: 'Morgan Lee', type: 'Industrial Client', phone: '(555) 016-9090', email: 'morgan@summitindustrial.com', status: 'Active', owner: 'Operations', activity: 'Maintenance scope reviewed', value: '$63,500', location: 'Columbus, OH', notes: 'Plant maintenance, platforms, rails, and miscellaneous metals.' },
  { id: 4, company: 'Keystone Fabrication Group', contact: 'Riley Carter', type: 'Partner', phone: '(555) 011-5528', email: 'riley@keystonefab.com', status: 'On Hold', owner: 'Admin', activity: 'Insurance document pending', value: '$0', location: 'Youngstown, OH', notes: 'Partner record requires paperwork review before new work is assigned.' }
];

const prospects = [
  { id: 101, name: 'Casey Monroe', company: 'Monroe Warehouse Expansion', source: 'Facebook Ad', sourceDetail: 'Clicked steel building ad and requested pricing for a warehouse expansion.', phone: '(555) 019-2241', email: 'casey@monroewarehouse.com', status: 'New Prospect', owner: 'Unassigned', action: 'Start text follow-up sequence', ai: 'Prospect asked for budget pricing, delivery timing, and next available consultation.', received: '12 min ago' },
  { id: 102, name: 'Dana Brooks', company: 'Brooks Equipment Storage', source: 'Google Ads', sourceDetail: 'Searched metal building contractor near me and submitted a quote form.', phone: '(555) 015-7760', email: 'dana@brooksequipment.com', status: 'Needs Follow Up', owner: 'Sales Team', action: 'Send quote intake email', ai: 'Prospect has site location and rough dimensions but needs scope details confirmed.', received: '48 min ago' },
  { id: 103, name: 'Pat Riley', company: 'Riley Farm Buildings', source: 'Website Form', sourceDetail: 'Submitted contact form from the company website.', phone: '(555) 012-9005', email: 'pat@rileyfarm.com', status: 'Ready to Contact', owner: 'Estimating', action: 'Notify owner and schedule call', ai: 'Prospect needs a small agricultural storage building and wants a callback this week.', received: 'Today' }
];

const workflowCopy = {
  inbox: {
    title: 'Lead Inbox',
    text: 'All new prospect requests land here first. Facebook, Google Ads, website forms, email leads, referrals, and call-ins are normalized into prospect records before they become customers.',
    rows: [['Facebook Ad', '1 new prospect', 'Auto-routed'], ['Google Ads', '1 follow-up needed', 'Sales Team'], ['Website Form', '1 ready to contact', 'Estimating']]
  },
  timeline: {
    title: 'Timeline',
    text: 'Shows the prospect journey: source captured, AI summary created, owner notified, text/email sent, reply received, meeting booked, and converted to customer.',
    rows: [['12 min ago', 'Facebook lead captured', 'New'], ['10 min ago', 'AI summarized request', 'Complete'], ['Next', 'Start text sequence', 'Recommended']]
  },
  inbound: {
    title: 'Inbound Leads',
    text: 'Inbound lead routing identifies where the prospect came from and what information was submitted so the team knows what to do next.',
    rows: [['Source', 'Facebook, Google, website, email, referral, phone', 'Tracked'], ['Routing', 'Assign owner by source, service, and region', 'Ready'], ['Customer status', 'Stays prospect until converted', 'Clean CRM']]
  },
  ai: {
    title: 'AI Communication',
    text: 'AI drafts the first response, detects urgency, recommends the channel, and can hand the prospect to Neroa Connect for text, call, email, or calendar follow-up.',
    rows: [['Suggested text', 'Hi, this is Steel Craft. We received your request and can help.', 'Draft'], ['Suggested email', 'Quote intake checklist and next-step questions.', 'Draft'], ['Suggested call', 'AI call or owner call to book a meeting.', 'Ready']]
  },
  automate: {
    title: 'Automate Follow-up',
    text: 'Build the prospect follow-up sequence here. This is where Neroa Connect, Twilio, email, AI calls, and calendar links become an automated workflow.',
    rows: [['Day 1', 'Send first text and owner notification', 'Text'], ['Day 2', 'Send email with intake questions and booking link', 'Email'], ['Days 3-5', 'Daily text follow-up if no reply', 'Sequence'], ['Every 5 days', 'Long-term nurture until closed or converted', 'Nurture'], ['Read receipt / reply', 'Trigger AI call or meeting link', 'Automation']]
  }
};

const saasButton = { border: '0', borderRadius: 14, padding: '12px 16px', background: 'linear-gradient(135deg, var(--brand-accent), #c95d63)', color: 'white', fontWeight: 900, boxShadow: '0 12px 28px rgba(0,0,0,.28)' };
const ghostButton = { border: '1px solid var(--line)', borderRadius: 14, padding: '12px 16px', background: 'rgba(255,255,255,.06)', color: 'var(--text)', fontWeight: 900 };
const tabButton = (active) => ({ border: '1px solid var(--line)', borderRadius: 999, padding: '12px 18px', background: active ? 'var(--brand-accent)' : 'rgba(255,255,255,.05)', color: 'white', fontWeight: 950, boxShadow: active ? '0 12px 28px rgba(0,0,0,.24)' : 'none' });

const crmStyles = {
  shell: { width: 'min(1320px, 100%)', margin: '0 auto', display: 'grid', gap: 18, justifyItems: 'center' },
  listCard: { width: 'min(1180px, calc(100vw - 90px))', padding: 30, margin: '0 auto' },
  tabs: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 },
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
  tools: { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-start', margin: '4px 0 18px' },
  panel: { border: '1px solid var(--line)', borderRadius: 22, background: 'rgba(255,255,255,.04)', padding: 18, marginBottom: 18 },
  panelGrid: { display: 'grid', gap: 10, marginTop: 14 },
  panelRow: { display: 'grid', gridTemplateColumns: '1fr 1.6fr auto', gap: 12, alignItems: 'center', padding: 12, border: '1px solid var(--line)', borderRadius: 14, background: 'rgba(0,0,0,.12)' },
  table: { display: 'grid', gap: 10, overflowX: 'auto' },
  row: { minWidth: 1040, display: 'grid', gridTemplateColumns: '1.4fr 1fr .9fr .8fr .9fr 1.1fr .8fr .45fr', gap: 14, alignItems: 'center', textAlign: 'left' },
  prospectRow: { minWidth: 1040, display: 'grid', gridTemplateColumns: '1.2fr 1fr .9fr 1fr .9fr 1.2fr .8fr', gap: 14, alignItems: 'center', textAlign: 'left' },
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

function Metric({ row }) { return <div className="live-module-metric"><strong>{row[0]}</strong><b>{row[1]}</b><span>{row[2]}</span></div>; }
function SimpleGrid({ title, rows }) { return <div className="live-module-grid crm-wide-grid"><article className="live-module-card crm-wide-card"><h3>{title}</h3><div className="live-module-list">{rows.map((row) => <div className="live-module-row" key={row[0]}><div><strong>{row[0]}</strong><span>{row[1]}</span></div><b>{row[2]}</b></div>)}</div></article></div>; }
function Field({ label, children, full = false }) { return <label style={full ? crmStyles.full : undefined}><span>{label}</span>{children}</label>; }

function WorkflowPanel({ mode }) {
  const data = workflowCopy[mode];
  if (!data) return null;
  return <section style={crmStyles.panel}>
    <p className="eyebrow">Prospect workflow</p>
    <h3>{data.title}</h3>
    <p style={crmStyles.subText}>{data.text}</p>
    <div style={crmStyles.panelGrid}>{data.rows.map((row) => <div style={crmStyles.panelRow} key={row[0]}><strong>{row[0]}</strong><span>{row[1]}</span><b>{row[2]}</b></div>)}</div>
    {mode === 'automate' && <div style={crmStyles.recordActions}>
      <button type="button" style={saasButton}>Set up Neroa Connect</button>
      <button type="button" style={ghostButton}>Build text sequence</button>
      <button type="button" style={ghostButton}>Add calendar link</button>
      <button type="button" style={ghostButton}>Create AI call step</button>
    </div>}
  </section>;
}

function ContactsCrm({ Header, id }) {
  const [tab, setTab] = useState('customers');
  const [activeCustomerId, setActiveCustomerId] = useState(null);
  const [activeProspectId, setActiveProspectId] = useState(null);
  const [query, setQuery] = useState('');
  const [workflow, setWorkflow] = useState('automate');
  const activeCustomer = customers.find((customer) => customer.id === activeCustomerId) || null;
  const activeProspect = prospects.find((prospect) => prospect.id === activeProspectId) || null;
  const rows = tab === 'customers' ? customers : prospects;
  const filtered = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return rows;
    return rows.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(clean)));
  }, [query, rows]);

  return <>
    {Header ? <Header id={id} /> : null}
    <section className="live-module-shell canonical-force-live" style={crmStyles.shell}>
      <article className="live-module-card" style={crmStyles.listCard}>
        <div style={crmStyles.tabs}>
          <button type="button" style={tabButton(tab === 'customers')} onClick={() => { setTab('customers'); setQuery(''); }}>Customer List</button>
          <button type="button" style={tabButton(tab === 'prospects')} onClick={() => { setTab('prospects'); setQuery(''); setWorkflow('automate'); }}>Prospect Customers</button>
        </div>

        <div style={crmStyles.listHeader}>
          <div>
            <p className="eyebrow">CRM</p>
            <h2 style={crmStyles.title}>{tab === 'customers' ? 'Customer List' : 'Prospect Customers'}</h2>
            <p style={crmStyles.subText}>{tab === 'customers' ? 'Search, open, and manage customer records from one clean customer database.' : 'Inbound leads from Facebook, Google, website, email, referral, and calls land here before they become customers.'}</p>
          </div>
          <div style={crmStyles.headerRight}>
            <div style={crmStyles.chips}>
              <div style={crmStyles.chip}><span style={crmStyles.chipLabel}>{tab === 'customers' ? 'Total customers' : 'Open prospects'}</span><strong style={crmStyles.chipValue}>{tab === 'customers' ? '280' : prospects.length}</strong></div>
              <div style={crmStyles.chip}><span style={crmStyles.chipLabel}>Needs review</span><strong style={crmStyles.chipValue}>1</strong></div>
            </div>
            <div style={crmStyles.actions}>
              <input style={crmStyles.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tab === 'customers' ? 'Search customers...' : 'Search prospects...'} aria-label="Search CRM" />
              <button type="button" style={saasButton}>{tab === 'customers' ? 'Add Customer' : 'Add Prospect'}</button>
            </div>
          </div>
        </div>

        {tab === 'prospects' && <>
          <div style={crmStyles.tools}>
            <button type="button" style={tabButton(workflow === 'automate')} onClick={() => setWorkflow('automate')}>Automate</button>
            <button type="button" style={ghostButton} onClick={() => setWorkflow('inbox')}>Lead Inbox</button>
            <button type="button" style={ghostButton} onClick={() => setWorkflow('timeline')}>Timeline</button>
            <button type="button" style={ghostButton} onClick={() => setWorkflow('inbound')}>Inbound Leads</button>
            <button type="button" style={ghostButton} onClick={() => setWorkflow('ai')}>AI Communication</button>
          </div>
          <WorkflowPanel mode={workflow} />
        </>}

        {tab === 'customers' ? <div style={crmStyles.table}>
          <div style={{ ...crmStyles.row, ...crmStyles.head }}><span>Company</span><span>Contact</span><span>Type</span><span>Status</span><span>Owner</span><span>Last Activity</span><span>Value</span><span></span></div>
          {filtered.map((customer) => <button type="button" key={customer.id} onClick={() => setActiveCustomerId(customer.id)} style={crmStyles.dataRow}><div style={crmStyles.row}><strong>{customer.company}</strong><span>{customer.contact}</span><span>{customer.type}</span><b>{customer.status}</b><span>{customer.owner}</span><span>{customer.activity}</span><strong>{customer.value}</strong><b>Open</b></div></button>)}
        </div> : <div style={crmStyles.table}>
          <div style={{ ...crmStyles.prospectRow, ...crmStyles.head }}><span>Prospect</span><span>Source</span><span>Status</span><span>Owner</span><span>Received</span><span>AI next action</span><span></span></div>
          {filtered.map((prospect) => <button type="button" key={prospect.id} onClick={() => setActiveProspectId(prospect.id)} style={crmStyles.dataRow}><div style={crmStyles.prospectRow}><strong>{prospect.company}</strong><span>{prospect.source}</span><b>{prospect.status}</b><span>{prospect.owner}</span><span>{prospect.received}</span><span>{prospect.action}</span><b>Open</b></div></button>)}
        </div>}
      </article>
    </section>

    {activeCustomer && <div style={crmStyles.overlay} onClick={() => setActiveCustomerId(null)}><aside className="live-module-card" style={crmStyles.record} onClick={(event) => event.stopPropagation()}><div style={crmStyles.recordHeader}><div><p className="eyebrow">Customer Record</p><h3 style={crmStyles.recordTitle}>{activeCustomer.company}</h3><p>{activeCustomer.notes}</p></div><button type="button" style={ghostButton} onClick={() => setActiveCustomerId(null)}>Close</button></div><div style={crmStyles.form}><Field label="Company"><input value={activeCustomer.company} readOnly /></Field><Field label="Primary Contact"><input value={activeCustomer.contact} readOnly /></Field><Field label="Customer Type"><input value={activeCustomer.type} readOnly /></Field><Field label="Owner"><input value={activeCustomer.owner} readOnly /></Field><Field label="Phone"><input value={activeCustomer.phone} readOnly /></Field><Field label="Email"><input value={activeCustomer.email} readOnly /></Field><Field label="Location"><input value={activeCustomer.location} readOnly /></Field><Field label="Open Value"><input value={activeCustomer.value} readOnly /></Field><Field label="Notes" full><textarea rows="4" value={activeCustomer.notes} readOnly /></Field></div><div style={crmStyles.recordActions}><button type="button" style={ghostButton}>Edit Record</button><button type="button" style={saasButton}>Save</button></div></aside></div>}

    {activeProspect && <div style={crmStyles.overlay} onClick={() => setActiveProspectId(null)}><aside className="live-module-card" style={crmStyles.record} onClick={(event) => event.stopPropagation()}><div style={crmStyles.recordHeader}><div><p className="eyebrow">Prospect Customer</p><h3 style={crmStyles.recordTitle}>{activeProspect.company}</h3><p>{activeProspect.sourceDetail}</p></div><button type="button" style={ghostButton} onClick={() => setActiveProspectId(null)}>Close</button></div><div style={crmStyles.form}><Field label="Prospect Name"><input value={activeProspect.name} readOnly /></Field><Field label="Lead Source"><input value={activeProspect.source} readOnly /></Field><Field label="Phone"><input value={activeProspect.phone} readOnly /></Field><Field label="Email"><input value={activeProspect.email} readOnly /></Field><Field label="Status"><input value={activeProspect.status} readOnly /></Field><Field label="Owner"><input value={activeProspect.owner} readOnly /></Field><Field label="AI Summary" full><textarea rows="4" value={activeProspect.ai} readOnly /></Field></div><div style={crmStyles.recordActions}><button type="button" style={saasButton}>Automate Follow-up</button><button type="button" style={ghostButton}>Send Text</button><button type="button" style={ghostButton}>Send Email</button><button type="button" style={ghostButton}>AI Call</button><button type="button" style={ghostButton}>Send Calendar Link</button><button type="button" style={saasButton}>Convert to Customer</button></div><p style={crmStyles.subText}>Automations run through Neroa Connect: Twilio for text/calls, email for follow-up, and calendar links for booking meetings.</p></aside></div>}
  </>;
}

export function isLiveCanonicalPortal(id) { return id === 'contacts' || Boolean(genericModules[id]); }

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
