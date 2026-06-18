import React, { useMemo, useState } from 'react';

const genericModules = {
  admin: { title: 'Admin', intro: 'Tenant controls, users, roles, portal access, setup, security, and audit controls.', metrics: [['Users', '6', 'Authenticated roles'], ['Portals', '12', 'Enabled'], ['Setup', 'Open', 'Guided setup'], ['Audit', 'Ready', 'Proof events']] },
  hr: { title: 'HR Portal', intro: 'Employee records, onboarding, handbook, training, PTO, and employee documents.', metrics: [['Employees', '17', 'Active'], ['Training', '4', 'Due'], ['PTO', '2', 'Pending'], ['Docs', 'Ready', 'Files']] },
  vendor: { title: 'Vendor Portal', intro: 'Vendor packets, PO visibility, due dates, upload slots, receiving status, and vendor communication.', metrics: [['Packets', '19', 'Open'], ['Uploads', '5', 'Needed'], ['Late', '3', 'Follow-up'], ['AP links', '14', 'Ready']] },
  customer: { title: 'Customer Portal', intro: 'Customer approvals, payments, documents, uploads, job status, and customer communication.', metrics: [['Approvals', '11', 'Action'], ['Invoices', '$27k', 'Open'], ['Uploads', '6', 'Needed'], ['Threads', '22', 'Active']] },
  employee: { title: 'Employee Self-Service', intro: 'Employee profile, PTO requests, handbook acknowledgements, training assignments, documents, and HR help.', metrics: [['Training', '4 due', 'Assignments'], ['PTO', '2', 'Pending'], ['Docs', '12', 'Files'], ['Help', 'Live', 'Support']] }
};

const accountTypeLabels = ['GC/Developers/Owners', 'General Contractors', 'Architect / Engineering Firms', 'Engineers', 'Material Suppliers / Fabricators / Vendors', 'Erectors', 'Testing & Inspection Agencies', 'Insurance / Surety', 'Financial Institutions', 'Logistics / Freight', 'Owner'];
const contactTypeLabels = ['General Contractors', 'Financial', 'Project Owner', 'Suppliers', 'Architect/Engineer', 'No Label', 'Erectors', "Sub-Contractor PM's", 'Inspection & Testing'];

const accounts = [
  { id: 'acc-accutech', name: 'Accu-Tech Construction, Inc.', type: 'General Contractors', domain: 'accutech1.com', industry: 'Construction', description: 'General contractor account from Monday CRM. Contacts include Andy Wilkin and related bid/project contacts.', employees: '', headquarters: '', contacts: ['Andy Wilkin', 'Rachel Angeline', 'Jason Frazier'], salesEstimating: '-', itemId: '1781805791-accutech' },
  { id: 'acc-hammond', name: 'Hammond Contracting, LLC', type: 'General Contractors', domain: '', industry: 'Construction', description: 'General contractor account. Account label is not a contact label.', employees: '', headquarters: '', contacts: ['Justin R. Hammond'], salesEstimating: '-', itemId: '1781805791-hammond' },
  { id: 'acc-rbd', name: 'RBD Design', type: 'Architect / Engineering Firms', domain: '', industry: 'Architecture / Engineering', description: 'Architect / engineering firm account from the CRM accounts board.', employees: '', headquarters: '', contacts: ['Rob Blount'], salesEstimating: '-', itemId: '1781805791-rbd' },
  { id: 'acc-supplier', name: 'Example Material Supplier', type: 'Material Suppliers / Fabricators / Vendors', domain: '', industry: 'Materials', description: 'Supplier/vendor account category shown separately from contact type.', employees: '', headquarters: '', contacts: ['Supplier Contact'], salesEstimating: '-', itemId: '1781805791-supplier' }
];

const contacts = [
  { id: 'con-andy', name: 'Andy Wilkin', firstName: 'Andy', lastName: 'Wilkin', type: 'General Contractors', accountId: 'acc-accutech', linkedAccount: 'Accu-Tech Construction, Inc.', title: '', phone: '', email: 'andy@accutech1.com', comments: '', company: '', salesEstimating: '-', itemId: '1781806557-andy', updates: [
    { kind: 'Email', date: 'Jan 5, 2026, 5:21 PM', from: 'deb.moore@accutech1.com', to: 'alex@steelcraftbuilders.com', subject: 'Re: [EXTERNAL]Re: [EXTERNAL]Tomoka Landfill PEMB RFI', body: 'In association with the estimate provided for the above-referenced project, subcontractors must complete, sign, and return the attached documents for inclusion in Accutech bid submittal.', attachments: ['Volusia Cert Aff Local Business.pdf', 'Volusia Certification Reg Debar.pdf', 'inline images'] },
    { kind: 'Email', date: 'Dec 2, 2025, 3:55 PM', from: 'andy@accutech1.com', to: 'alex@steelcraftbuilders.com', subject: 'Project follow-up', body: 'Email thread attached to this contact record from the Monday activity timeline.', attachments: [] }
  ] },
  { id: 'con-justin', name: 'Justin R. Hammond', firstName: 'Justin', lastName: 'Hammond', type: 'General Contractors', accountId: 'acc-hammond', linkedAccount: 'Hammond Contracting, LLC', title: '', phone: '', email: '', comments: '', company: '', salesEstimating: '-', itemId: '1781806557-justin', updates: [{ kind: 'Note', date: 'Saved', from: 'CRM', to: 'Steel Craft', subject: 'Account relationship', body: 'Contact belongs under Hammond Contracting, LLC.', attachments: [] }] },
  { id: 'con-rob', name: 'Rob Blount', firstName: 'Rob', lastName: 'Blount', type: 'Architect/Engineer', accountId: 'acc-rbd', linkedAccount: 'RBD Design', title: '', phone: '', email: '', comments: '', company: '', salesEstimating: '-', itemId: '1781806557-rob', updates: [{ kind: 'Note', date: 'Saved', from: 'CRM', to: 'Steel Craft', subject: 'Design contact', body: 'Architect / engineering contact record.', attachments: [] }] },
  { id: 'con-supplier', name: 'Supplier Contact', firstName: 'Supplier', lastName: 'Contact', type: 'Suppliers', accountId: 'acc-supplier', linkedAccount: 'Example Material Supplier', title: '', phone: '', email: '', comments: '', company: '', salesEstimating: '-', itemId: '1781806557-supplier', updates: [{ kind: 'Note', date: 'Saved', from: 'CRM', to: 'Steel Craft', subject: 'Supplier contact', body: 'Supplier contact attached to material supplier account.', attachments: [] }] }
];

const colors = {
  'GC/Developers/Owners': '#f6a637',
  'General Contractors': '#4f8ff0',
  'Architect / Engineering Firms': '#5bc3e6',
  'Architect/Engineer': '#5bc3e6',
  Engineers: '#62c6ee',
  'Material Suppliers / Fabricators / Vendors': '#0a7ca4',
  Suppliers: '#9a4ed6',
  Erectors: '#dd79b8',
  'Testing & Inspection Agencies': '#5b8df5',
  'Inspection & Testing': '#5755db',
  'Insurance / Surety': '#c7aa2f',
  Financial: '#9bd717',
  'Financial Institutions': '#ff5a35',
  'Logistics / Freight': '#9656d8',
  Owner: '#f90078',
  'Project Owner': '#06834b',
  'Sub-Contractor PM\'s': '#22508c',
  'No Label': '#bbb'
};

const styles = {
  shell: { width: 'min(1440px, 100%)', margin: '0 auto', display: 'grid', gap: 18 },
  card: { border: '1px solid var(--line)', borderRadius: 24, background: 'var(--card)', padding: 24, boxShadow: '0 18px 48px rgba(0,0,0,.2)' },
  top: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, alignItems: 'start' },
  tabs: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  button: { border: '1px solid var(--line)', borderRadius: 14, padding: '11px 16px', background: 'rgba(255,255,255,.06)', color: 'var(--text)', fontWeight: 900 },
  activeButton: { border: '0', borderRadius: 14, padding: '11px 16px', background: 'var(--brand-accent)', color: '#fff', fontWeight: 950 },
  search: { minWidth: 320 },
  table: { display: 'grid', gap: 8, overflowX: 'auto' },
  accountRow: { minWidth: 1120, display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr .8fr .45fr', gap: 12, alignItems: 'center' },
  contactRow: { minWidth: 1120, display: 'grid', gridTemplateColumns: '1.1fr .9fr 1.2fr .8fr .8fr 1.2fr .45fr', gap: 12, alignItems: 'center' },
  head: { color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 12, fontWeight: 900, padding: '0 12px' },
  dataRow: { width: '100%', border: '1px solid var(--line)', borderRadius: 16, background: 'var(--surface-alt)', color: 'var(--text)', padding: 14, textAlign: 'left' },
  label: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, padding: '8px 12px', color: '#fff', fontWeight: 900, whiteSpace: 'nowrap' },
  overlay: { position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(5px)', display: 'grid', placeItems: 'start center', padding: '55px 24px', overflowY: 'auto' },
  modal: { width: 'min(1500px, calc(100vw - 50px))', borderRadius: 24, border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--text)', boxShadow: '0 30px 90px rgba(0,0,0,.55)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', padding: '22px 26px', borderBottom: '1px solid var(--line)' },
  modalBody: { display: 'grid', gridTemplateColumns: 'minmax(520px, 1fr) 420px', gap: 0, minHeight: 620 },
  timeline: { padding: 24, background: 'rgba(255,255,255,.025)', borderRight: '1px solid var(--line)' },
  side: { padding: 24, display: 'grid', gap: 12, alignContent: 'start' },
  field: { display: 'grid', gap: 6 },
  fieldBox: { border: '1px solid var(--line)', borderRadius: 12, padding: '12px 14px', background: 'rgba(255,255,255,.05)', minHeight: 42 },
  update: { border: '1px solid var(--line)', borderRadius: 18, background: 'var(--surface-alt)', padding: 18, display: 'grid', gap: 10, marginBottom: 16 },
  pills: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  pill: { border: '1px solid var(--line)', borderRadius: 999, padding: '7px 10px', background: 'rgba(255,255,255,.06)', fontSize: 12 }
};

function Metric({ row }) { return <div className="live-module-metric"><strong>{row[0]}</strong><b>{row[1]}</b><span>{row[2]}</span></div>; }
function SimpleGrid({ title, rows }) { return <div className="live-module-grid crm-wide-grid"><article className="live-module-card crm-wide-card"><h3>{title}</h3><div className="live-module-list">{rows.map((row) => <div className="live-module-row" key={row[0]}><div><strong>{row[0]}</strong><span>{row[1]}</span></div><b>{row[2]}</b></div>)}</div></article></div>; }
function Label({ value }) { return <span style={{ ...styles.label, background: colors[value] || '#666' }}>{value || 'No Label'}</span>; }
function FieldView({ label, value }) { return <label style={styles.field}><span>{label}</span><div style={styles.fieldBox}>{value || '-'}</div></label>; }

function ContactModal({ contact, close }) {
  const tabs = ['Overview', 'Updates', 'Files', 'Quotes & Invoices', 'Build Vibe view', 'More'];
  return <div style={styles.overlay} onClick={close}><section style={styles.modal} onClick={(event) => event.stopPropagation()}><header style={styles.modalHeader}><div><p className="eyebrow">Contact record</p><h1 style={{ margin: '4px 0', fontSize: 38 }}>{contact.name}</h1><div style={styles.pills}>{tabs.map((tab) => <span style={styles.pill} key={tab}>{tab}</span>)}</div></div><button type="button" style={styles.button} onClick={close}>Close</button></header><div style={styles.modalBody}><main style={styles.timeline}><div style={{ ...styles.tabs, marginBottom: 18 }}><button style={styles.activeButton}>New email</button><button style={styles.button}>Add activity</button><button style={styles.button}>Summarize</button><button style={styles.button}>Filters</button><input style={{ marginLeft: 'auto', maxWidth: 260 }} placeholder="Search" readOnly /></div>{contact.updates.map((update, index) => <article style={styles.update} key={`${update.subject}-${index}`}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><div><strong>{update.kind}</strong><p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>{update.from} → {update.to}</p></div><span>{update.date}</span></div><h3 style={{ margin: '6px 0' }}>{update.subject}</h3><p style={{ margin: 0, lineHeight: 1.55 }}>{update.body}</p>{update.attachments?.length ? <div style={styles.pills}>{update.attachments.map((file) => <span style={styles.pill} key={file}>📎 {file}</span>)}</div> : null}</article>)}</main><aside style={styles.side}><FieldView label="Name" value={contact.name} /><label style={styles.field}><span>Type</span><Label value={contact.type} /></label><FieldView label="Linked Account (Company)" value={contact.linkedAccount} /><FieldView label="Title" value={contact.title} /><FieldView label="Phone" value={contact.phone} /><FieldView label="Email" value={contact.email} /><FieldView label="Comments" value={contact.comments} /><FieldView label="*Company" value={contact.company} /><FieldView label="*Sales & Estimating" value={contact.salesEstimating} /><FieldView label="First Name" value={contact.firstName} /><FieldView label="Last Name" value={contact.lastName} /></aside></div></section></div>;
}

function AccountModal({ account, close }) {
  const linked = contacts.filter((contact) => contact.accountId === account.id);
  return <div style={styles.overlay} onClick={close}><section style={styles.modal} onClick={(event) => event.stopPropagation()}><header style={styles.modalHeader}><div><p className="eyebrow">Account record</p><h1 style={{ margin: '4px 0', fontSize: 38 }}>{account.name}</h1><Label value={account.type} /></div><button type="button" style={styles.button} onClick={close}>Close</button></header><div style={styles.modalBody}><main style={styles.timeline}><h2>Linked contacts</h2>{linked.map((contact) => <article style={styles.update} key={contact.id}><h3>{contact.name}</h3><p>{contact.title || 'Contact'} · {contact.email || 'No email loaded'}</p><Label value={contact.type} /></article>)}</main><aside style={styles.side}><FieldView label="Name" value={account.name} /><label style={styles.field}><span>Account Type</span><Label value={account.type} /></label><FieldView label="Domain" value={account.domain} /><FieldView label="Industry" value={account.industry} /><FieldView label="Description" value={account.description} /><FieldView label="No. of employees" value={account.employees} /><FieldView label="Headquarters location" value={account.headquarters} /><FieldView label="*Sales & Estimating" value={account.salesEstimating} /><FieldView label="Item ID" value={account.itemId} /></aside></div></section></div>;
}

function ContactsCrm({ Header, id }) {
  const [tab, setTab] = useState('accounts');
  const [query, setQuery] = useState('');
  const [activeAccount, setActiveAccount] = useState(null);
  const [activeContact, setActiveContact] = useState(null);
  const data = tab === 'accounts' ? accounts : contacts;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) => Object.values(row).some((value) => String(Array.isArray(value) ? value.join(' ') : value).toLowerCase().includes(q)));
  }, [query, data]);

  return <>
    {Header ? <Header id={id} /> : null}
    <section className="live-module-shell canonical-force-live" style={styles.shell}><article className="live-module-card" style={styles.card}><div style={styles.top}><div><p className="eyebrow">Steel Craft CRM</p><h2 style={{ fontSize: 46, margin: '6px 0' }}>{tab === 'accounts' ? 'Accounts Board' : 'Contacts Board'}</h2><p>Rebuilt from the Monday flow: accounts are companies, contacts are people, and every contact opens into a Monday-style detail view with updates on the left and fields on the right.</p></div><div style={{ display: 'grid', gap: 12, justifyItems: 'end' }}><div style={styles.tabs}><button type="button" style={tab === 'accounts' ? styles.activeButton : styles.button} onClick={() => setTab('accounts')}>Accounts</button><button type="button" style={tab === 'contacts' ? styles.activeButton : styles.button} onClick={() => setTab('contacts')}>Contacts</button></div><input style={styles.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search CRM board..." /></div></div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '18px 0' }}>{(tab === 'accounts' ? accountTypeLabels : contactTypeLabels).map((label) => <Label key={label} value={label} />)}</div>{tab === 'accounts' ? <div style={styles.table}><div style={{ ...styles.accountRow, ...styles.head }}><span>Account</span><span>Account Type</span><span>Domain</span><span>Industry</span><span>Linked Contacts</span><span>Item ID</span><span></span></div>{filtered.map((account) => <button type="button" key={account.id} style={styles.dataRow} onClick={() => setActiveAccount(account)}><div style={styles.accountRow}><strong>{account.name}</strong><Label value={account.type} /><span>{account.domain || '-'}</span><span>{account.industry || '-'}</span><span>{account.contacts.join(', ') || '-'}</span><span>{account.itemId}</span><b>Open</b></div></button>)}</div> : <div style={styles.table}><div style={{ ...styles.contactRow, ...styles.head }}><span>Contact</span><span>Type</span><span>Linked Account</span><span>Title</span><span>Phone</span><span>Email</span><span></span></div>{filtered.map((contact) => <button type="button" key={contact.id} style={styles.dataRow} onClick={() => setActiveContact(contact)}><div style={styles.contactRow}><strong>{contact.name}</strong><Label value={contact.type} /><span>{contact.linkedAccount}</span><span>{contact.title || '-'}</span><span>{contact.phone || '-'}</span><span>{contact.email || '-'}</span><b>Open</b></div></button>)}</div>}</article></section>{activeAccount && <AccountModal account={activeAccount} close={() => setActiveAccount(null)} />}{activeContact && <ContactModal contact={activeContact} close={() => setActiveContact(null)} />}</>;
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
