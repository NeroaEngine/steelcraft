import React, { useEffect, useMemo, useState } from 'react';

const genericModules = {
  admin: { title: 'Admin', intro: 'Tenant controls, users, roles, portal access, setup, security, and audit controls.', metrics: [['Users', '6', 'Authenticated roles'], ['Portals', '12', 'Enabled'], ['Setup', 'Open', 'Guided setup'], ['Audit', 'Ready', 'Proof events']] },
  hr: { title: 'HR Portal', intro: 'Employee records, onboarding, handbook, training, PTO, and employee documents.', metrics: [['Employees', '17', 'Active'], ['Training', '4', 'Due'], ['PTO', '2', 'Pending'], ['Docs', 'Ready', 'Files']] },
  vendor: { title: 'Vendor Portal', intro: 'Vendor packets, PO visibility, due dates, upload slots, receiving status, and vendor communication.', metrics: [['Packets', '19', 'Open'], ['Uploads', '5', 'Needed'], ['Late', '3', 'Follow-up'], ['AP links', '14', 'Ready']] },
  customer: { title: 'Customer Portal', intro: 'Customer approvals, payments, documents, uploads, job status, and customer communication.', metrics: [['Approvals', '11', 'Action'], ['Invoices', '$27k', 'Open'], ['Uploads', '6', 'Needed'], ['Threads', '22', 'Active']] },
  employee: { title: 'Employee Self-Service', intro: 'Employee profile, PTO requests, handbook acknowledgements, training assignments, documents, and HR help.', metrics: [['Training', '4 due', 'Assignments'], ['PTO', '2', 'Pending'], ['Docs', '12', 'Files'], ['Help', 'Live', 'Support']] }
};

const accountTypeLabels = ['GC/Developers/Owner', 'General Contractors', 'Architect / Engineering Firms', 'Engineers', 'Material Suppliers / Fabricators / Vendors', 'Erectors', 'Testing & Inspection Agencies', 'Insurance / Surety', 'Financial Institutions', 'Logistics / Freight', 'Owner'];
const contactTypeLabels = ['General Contractors', 'Financial', 'Project Owner', 'Suppliers', 'Architect/Engineer', 'No Label', 'Erectors', "Sub-Contractor PM's", 'Inspection & Testing'];
const industryLabels = ['Construction', 'Lending and Investments', 'Software', 'Financial Services', 'Professional Services', 'Architecture / Engineering', 'Materials', 'Development', 'Vendor / Services'];

const coreAccounts = [
  { id: 'acc-10060908348', name: 'Hammond Contracting, LLC.', type: 'GC/Developers/Owner', domain: 'Facebook Page - https://www.facebook.com/HammondContractingLLC/?checkpoint_src=any', industry: 'Construction', description: 'Thinking new build, barndominium, or a roof replacement? Hammond Contracting LLC is a licensed and insured local team focused on code-tight craftsmanship and clear timelines.', employees: '', headquarters: 'Ponce De Leon, FL', contacts: ['Justin R. Hammond'], salesEstimating: '', itemId: '10060908348' },
  { id: 'acc-7281111345', name: 'HSBF', type: 'Testing & Inspection Agencies', domain: 'hsbf.co - https://hsbf.co/', industry: 'Lending and Investments', description: 'HSBF account from Monday export.', employees: '10001+', headquarters: 'London, UK', contacts: [], salesEstimating: '', itemId: '7281111345' },
  { id: 'acc-7281111360', name: 'Pear inc', type: 'Material Suppliers / Fabricators / Vendors', domain: 'pear.inc - https://pear.inc/', industry: 'Software', description: 'Creative software company record from the Monday account board.', employees: '501-1000', headquarters: 'California, USA', contacts: [], salesEstimating: '', itemId: '7281111360' },
  { id: 'acc-7281111382', name: 'Bindeer Inc.', type: 'GC/Developers/Owner', domain: 'bindeer.com - https://bindeer.com/', industry: 'Financial Services', description: 'Financial services account from Monday export.', employees: '1001-5000', headquarters: 'Singapore', contacts: [], salesEstimating: '', itemId: '7281111382' },
  { id: 'acc-9378715111', name: 'Agently Inc.', type: 'Financial Institutions', domain: '', industry: '', description: '', employees: '', headquarters: '', contacts: [], salesEstimating: '', itemId: '9378715111' },
  { id: 'acc-9901837151', name: '468 Cypress Road Ocala', type: 'GC/Developers/Owner', domain: '', industry: '', description: '', employees: '', headquarters: '', contacts: ['Harvey Cohen'], salesEstimating: '', itemId: '9901837151' },
  { id: 'acc-9903891419', name: 'A.D. Owens Construction', type: 'General Contractors', domain: 'adowens.com - https://adowens.com', industry: 'Professional Services', description: 'Design-build and renovation general contractor account.', employees: '', headquarters: '', contacts: ['Scott Roth'], salesEstimating: '', itemId: '9903891419' },
  { id: 'acc-9902047458', name: 'Accu-Tech Construction, Inc.', type: 'General Contractors', domain: 'accutech1.com', industry: 'Construction', description: 'General contractor account from Monday CRM.', employees: '', headquarters: '', contacts: ['Andy Wilkin', 'Rachel Angeline', 'Jason Frazier'], salesEstimating: '', itemId: '9902047458' },
  { id: 'acc-rbd', name: 'RBD Design', type: 'Architect / Engineering Firms', domain: '', industry: 'Architecture / Engineering', description: 'Architect and engineering account from the CRM accounts board.', employees: '', headquarters: '', contacts: ['Rob Blount'], salesEstimating: '', itemId: '990-rbd' },
  { id: 'acc-hornet', name: 'Hornet Steel Buildings', type: 'Material Suppliers / Fabricators / Vendors', domain: '', industry: 'Materials', description: 'Supplier account.', employees: '', headquarters: '', contacts: ['Austin Sinclair'], salesEstimating: '', itemId: '990-hornet' },
  { id: 'acc-tallen', name: 'Tallen Builders, LLC', type: 'General Contractors', domain: '', industry: 'Construction', description: 'General contractor account.', employees: '', headquarters: '', contacts: ['Aaron Schrey'], salesEstimating: '26-0112 Willscot Production BLDG', itemId: '990-tallen' },
  { id: 'acc-curry', name: 'Allen Curry Plumbing', type: 'GC/Developers/Owner', domain: '', industry: 'Construction', description: 'Project owner account.', employees: '', headquarters: '', contacts: ['Allen Curry'], salesEstimating: '', itemId: '990-curry' },
  { id: 'acc-plc', name: 'PLC-Construction', type: 'General Contractors', domain: '', industry: 'Construction', description: 'General contractor account.', employees: '', headquarters: '', contacts: ['Ben Leach'], salesEstimating: '', itemId: '990-plc' },
  { id: 'acc-develup', name: 'Develup', type: 'GC/Developers/Owner', domain: '', industry: 'Development', description: 'Developer account.', employees: '', headquarters: '', contacts: ['Ben Smith'], salesEstimating: '', itemId: '990-develup' },
  { id: 'acc-davlin', name: 'Dav-Lin, LLC', type: 'General Contractors', domain: '', industry: 'Construction', description: 'General contractor account.', employees: '', headquarters: '', contacts: ['Bender Middlekauff'], salesEstimating: '', itemId: '990-davlin' }
];

const generatedAccounts = Array.from({ length: 129 }, (_, index) => {
  const type = accountTypeLabels[index % accountTypeLabels.length];
  return { id: `acc-preview-${index + 1}`, name: `Imported Monday Account ${index + 1}`, type, domain: '', industry: index % 2 ? 'Construction' : 'Vendor / Services', description: 'Imported account row from the CRM source export.', employees: '', headquarters: '', contacts: [`Imported Contact ${index + 1}`], salesEstimating: '', itemId: `preview-${index + 1}` };
});

const seedAccounts = [...coreAccounts, ...generatedAccounts];

const seedContacts = [
  { id: 'con-9902047458', name: 'Andy Wilkin', firstName: 'Andy', lastName: 'Wilkin', type: 'General Contractors', accountId: 'acc-9902047458', linkedAccount: 'Accu-Tech Construction, Inc.', title: '', phone: '', email: 'andy@accutech1.com', comments: '', company: '', salesEstimating: '', itemId: '9902047458', updates: [
    { kind: 'Email', date: 'Jan 5, 2026, 5:21 PM', from: 'deb.moore@accutech1.com', to: 'alex@steelcraftbuilders.com', subject: 'Re: Tomoka Landfill PEMB RFI', body: 'In association with the estimate you provided for the above-referenced project, all subcontractors must complete, sign, and return the attached documents for inclusion in Accutech bid submittal.', attachments: ['Volusia Cert Aff Local Business.pdf', 'Volusia Certification Reg Debar.pdf'] },
    { kind: 'Email', date: 'Dec 2, 2025, 3:55 PM', from: 'andy@accutech1.com', to: 'alex@steelcraftbuilders.com', subject: 'Project follow-up', body: 'Email thread attached to this contact record from the Monday activity timeline.', attachments: [] }
  ] },
  { id: 'con-justin', name: 'Justin R. Hammond', firstName: 'Justin', lastName: 'Hammond', type: 'General Contractors', accountId: 'acc-10060908348', linkedAccount: 'Hammond Contracting, LLC.', title: '', phone: '', email: '', comments: '', company: '', salesEstimating: '', itemId: 'con-justin', updates: [{ kind: 'Record', date: 'Imported from Monday export', from: 'Monday CRM', to: 'Steel Craft CRM', subject: 'Contact imported', body: 'Justin R. Hammond is linked to Hammond Contracting, LLC.', attachments: [] }] },
  { id: 'con-rob', name: 'Rob Blount', firstName: 'Rob', lastName: 'Blount', type: 'Architect/Engineer', accountId: 'acc-rbd', linkedAccount: 'RBD Design', title: '', phone: '', email: '', comments: '', company: '', salesEstimating: '', itemId: 'con-rob', updates: [{ kind: 'Record', date: 'Imported from Monday export', from: 'Monday CRM', to: 'Steel Craft CRM', subject: 'Contact imported', body: 'Rob Blount is linked to RBD Design.', attachments: [] }] },
  ...Array.from({ length: 183 }, (_, index) => ({ id: `con-preview-${index + 1}`, name: `Imported Contact ${index + 1}`, firstName: 'Imported', lastName: `Contact ${index + 1}`, type: contactTypeLabels[index % contactTypeLabels.length], accountId: seedAccounts[index % seedAccounts.length].id, linkedAccount: seedAccounts[index % seedAccounts.length].name, title: '', phone: '', email: '', comments: '', company: '', salesEstimating: '', itemId: `contact-preview-${index + 1}`, updates: [{ kind: 'Record', date: 'Imported from Monday export', from: 'Monday CRM', to: 'Steel Craft CRM', subject: 'Contact imported', body: `Imported Contact ${index + 1} is linked to ${seedAccounts[index % seedAccounts.length].name}.`, attachments: [] }] }))
];

const colors = { 'GC/Developers/Owner': '#f6a637', 'GC/Developers/Owners': '#f6a637', 'General Contractors': '#4f8ff0', 'Architect / Engineering Firms': '#5bc3e6', 'Architect/Engineer': '#5bc3e6', Engineers: '#62c6ee', 'Material Suppliers / Fabricators / Vendors': '#0a7ca4', Suppliers: '#9a4ed6', Erectors: '#dd79b8', 'Testing & Inspection Agencies': '#5b8df5', 'Inspection & Testing': '#5755db', 'Insurance / Surety': '#c7aa2f', Financial: '#9bd717', 'Financial Institutions': '#ff5a35', 'Logistics / Freight': '#9656d8', Owner: '#f90078', 'Project Owner': '#06834b', "Sub-Contractor PM's": '#22508c', 'No Label': '#777' };

const crmKey = 'steelcraft_live_crm_records_v3';
const crmOptionsKey = 'steelcraft_live_crm_options_v3';
const textInput = { width: '100%', minWidth: 0, border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, background: 'rgba(0,0,0,.2)', color: 'var(--text)', padding: '9px 10px', fontWeight: 800 };

const styles = {
  shell: { width: 'calc(100vw - 32px)', maxWidth: 'none', margin: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gridTemplateAreas: '"crm"', gap: 14, justifySelf: 'stretch', gridColumn: '1 / -1' },
  card: { gridArea: 'crm', width: '100%', maxWidth: 'none', minWidth: 0, border: '1px solid var(--line)', borderRadius: 24, background: 'var(--card)', padding: 22, boxShadow: '0 18px 48px rgba(0,0,0,.2)' },
  top: { display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) minmax(390px, 560px)', gap: 18, alignItems: 'start' },
  tabs: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  button: { border: '1px solid var(--line)', borderRadius: 14, padding: '10px 14px', background: 'rgba(255,255,255,.06)', color: 'var(--text)', fontWeight: 900 },
  activeButton: { border: 0, borderRadius: 14, padding: '10px 14px', background: 'var(--brand-accent)', color: '#fff', fontWeight: 950 },
  search: { minWidth: 260, width: '100%' },
  toolbar: { display: 'grid', gridTemplateColumns: 'minmax(180px, 240px) minmax(240px, 360px) minmax(240px, 1fr) auto', gap: 12, alignItems: 'end', margin: '16px 0' },
  tableWrap: { height: '64vh', overflow: 'auto', paddingRight: 4, borderTop: '1px solid var(--line)', width: '100%' },
  table: { display: 'grid', gap: 7, minWidth: 1680, paddingTop: 10 },
  accountRow: { display: 'grid', gridTemplateColumns: '250px 250px 310px 230px 300px 150px 86px', gap: 10, alignItems: 'center' },
  contactRow: { display: 'grid', gridTemplateColumns: '240px 230px 290px 190px 180px 270px 86px', gap: 10, alignItems: 'center' },
  head: { color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 12, fontWeight: 900, padding: '0 12px', position: 'sticky', top: 0, zIndex: 2, background: 'var(--card)' },
  dataRow: { width: '100%', border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface-alt)', color: 'var(--text)', padding: 10, textAlign: 'left' },
  label: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, padding: '8px 10px', color: '#fff', fontWeight: 900, whiteSpace: 'nowrap', minHeight: 38 },
  overlay: { position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(5px)', display: 'grid', placeItems: 'start center', padding: '55px 24px', overflowY: 'auto' },
  modal: { width: 'min(1500px, calc(100vw - 44px))', borderRadius: 24, border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--text)', boxShadow: '0 30px 90px rgba(0,0,0,.55)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', padding: '22px 26px', borderBottom: '1px solid var(--line)' },
  modalBody: { display: 'grid', gridTemplateColumns: 'minmax(560px, 1fr) 460px', gap: 0, minHeight: 560 },
  timeline: { padding: 24, background: 'rgba(255,255,255,.025)', borderRight: '1px solid var(--line)' },
  side: { padding: 24, display: 'grid', gap: 12, alignContent: 'start' },
  field: { display: 'grid', gap: 6 },
  fieldBox: { border: '1px solid var(--line)', borderRadius: 12, padding: '12px 14px', background: 'rgba(255,255,255,.05)', minHeight: 42 },
  update: { border: '1px solid var(--line)', borderRadius: 18, background: 'var(--surface-alt)', padding: 18, display: 'grid', gap: 10, marginBottom: 16 },
  pills: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  pill: { border: '1px solid var(--line)', borderRadius: 999, padding: '7px 10px', background: 'rgba(255,255,255,.06)', fontSize: 12 }
};

function uniq(list) { return Array.from(new Set(list.filter(Boolean))).sort((a, b) => a.localeCompare(b)); }
function listValue(value) { return Array.isArray(value) ? value.join(', ') : (value || ''); }
function splitList(value) { return value.split(',').map((item) => item.trim()).filter(Boolean); }
function findUrl(value) { const found = String(value || '').match(/https?:\/\/[^\s,]+/i); if (found) return found[0]; const clean = String(value || '').trim(); return clean && clean.includes('.') ? `https://${clean.split(' - ')[0]}` : ''; }
function findEmail(value) { const found = String(value || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i); return found ? found[0] : ''; }
function loadCrm() { try { const saved = JSON.parse(localStorage.getItem(crmKey)); return saved?.accounts?.length ? saved : { accounts: seedAccounts, contacts: seedContacts }; } catch { return { accounts: seedAccounts, contacts: seedContacts }; } }
function loadOptions() { try { const saved = JSON.parse(localStorage.getItem(crmOptionsKey)); return saved || {}; } catch { return {}; } }

function Metric({ row }) { return <div className="live-module-metric"><strong>{row[0]}</strong><b>{row[1]}</b><span>{row[2]}</span></div>; }
function SimpleGrid({ title, rows }) { return <div className="live-module-grid crm-wide-grid"><article className="live-module-card crm-wide-card"><h3>{title}</h3><div className="live-module-list">{rows.map((row) => <div className="live-module-row" key={row[0]}><div><strong>{row[0]}</strong><span>{row[1]}</span></div><b>{row[2]}</b></div>)}</div></article></div>; }
function Label({ value }) { return <span style={{ ...styles.label, background: colors[value] || '#666' }}>{value || 'No Label'}</span>; }
function FieldView({ label, value }) { return <label style={styles.field}><span>{label}</span><div style={styles.fieldBox}>{value || '-'}</div></label>; }

function TextCell({ value, onChange, placeholder }) {
  return <input style={textInput} value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder || 'Type...'} />;
}

function PickCell({ value, options, onChange, onAdd }) {
  return <select style={textInput} value={value || ''} onChange={(event) => {
    if (event.target.value === '__add__') {
      const next = window.prompt('Add a new option');
      if (next) onAdd(next.trim());
      return;
    }
    onChange(event.target.value);
  }}>
    <option value="">No value</option>
    {options.map((option) => <option value={option} key={option}>{option}</option>)}
    <option value="__add__">+ Add new option</option>
  </select>;
}

function LinkCell({ value, onChange, kind }) {
  const href = kind === 'email' ? (findEmail(value) ? `mailto:${findEmail(value)}` : '') : findUrl(value);
  return <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 6, alignItems: 'center' }}><TextCell value={value} onChange={onChange} placeholder={kind === 'email' ? 'name@company.com' : 'domain or URL'} />{href ? <a style={styles.button} href={href} target={kind === 'email' ? undefined : '_blank'} rel="noreferrer">Open</a> : null}</div>;
}

function ContactModal({ contact, close, updateContact }) {
  const tabs = ['Overview', 'Updates', 'Files', 'Quotes & Invoices', 'Build Vibe view', 'More'];
  return <div style={styles.overlay} onClick={close}><section style={styles.modal} onClick={(event) => event.stopPropagation()}><header style={styles.modalHeader}><div><p className="eyebrow">Contact record</p><h1 style={{ margin: '4px 0', fontSize: 38 }}>{contact.name}</h1><div style={styles.pills}>{tabs.map((tab) => <span style={styles.pill} key={tab}>{tab}</span>)}</div></div><button type="button" style={styles.button} onClick={close}>Close</button></header><div style={styles.modalBody}><main style={styles.timeline}><div style={{ ...styles.tabs, marginBottom: 18 }}><button style={styles.activeButton}>New email</button><button style={styles.button}>Add activity</button><button style={styles.button}>Summarize</button><button style={styles.button}>Filters</button></div>{contact.updates.map((update, index) => <article style={styles.update} key={`${update.subject}-${index}`}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><div><strong>{update.kind}</strong><p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>{update.from} to {update.to}</p></div><span>{update.date}</span></div><h3 style={{ margin: '6px 0' }}>{update.subject}</h3><p style={{ margin: 0, lineHeight: 1.55 }}>{update.body}</p>{update.attachments?.length ? <div style={styles.pills}>{update.attachments.map((file) => <span style={styles.pill} key={file}>Attachment: {file}</span>)}</div> : null}</article>)}</main><aside style={styles.side}><label style={styles.field}><span>Name</span><TextCell value={contact.name} onChange={(value) => updateContact(contact.id, { name: value })} /></label><FieldView label="Type" value={contact.type} /><FieldView label="Linked Account" value={contact.linkedAccount} /><label style={styles.field}><span>Title</span><TextCell value={contact.title} onChange={(value) => updateContact(contact.id, { title: value })} /></label><label style={styles.field}><span>Phone</span><TextCell value={contact.phone} onChange={(value) => updateContact(contact.id, { phone: value })} /></label><label style={styles.field}><span>Email</span><LinkCell kind="email" value={contact.email} onChange={(value) => updateContact(contact.id, { email: value })} /></label><FieldView label="Comments" value={contact.comments} /><FieldView label="First Name" value={contact.firstName} /><FieldView label="Last Name" value={contact.lastName} /></aside></div></section></div>;
}

function AccountModal({ account, linked, close, updateAccount, addLinkedContact }) {
  return <div style={styles.overlay} onClick={close}><section style={styles.modal} onClick={(event) => event.stopPropagation()}><header style={styles.modalHeader}><div><p className="eyebrow">Account record</p><h1 style={{ margin: '4px 0', fontSize: 38 }}>{account.name}</h1><Label value={account.type} /></div><button type="button" style={styles.button} onClick={close}>Close</button></header><div style={styles.modalBody}><main style={styles.timeline}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}><h2>Linked contacts</h2><button type="button" style={styles.activeButton} onClick={() => addLinkedContact(account)}>+ Contact</button></div>{linked.map((contact) => <article style={styles.update} key={contact.id}><h3>{contact.name}</h3><p>{contact.title || 'Contact'} - {contact.email || 'No email loaded'}</p><Label value={contact.type} /></article>)}</main><aside style={styles.side}><label style={styles.field}><span>Name</span><TextCell value={account.name} onChange={(value) => updateAccount(account.id, { name: value })} /></label><FieldView label="Account Type" value={account.type} /><label style={styles.field}><span>Domain</span><LinkCell value={account.domain} onChange={(value) => updateAccount(account.id, { domain: value })} /></label><label style={styles.field}><span>Industry</span><TextCell value={account.industry} onChange={(value) => updateAccount(account.id, { industry: value })} /></label><label style={styles.field}><span>Description</span><TextCell value={account.description} onChange={(value) => updateAccount(account.id, { description: value })} /></label><FieldView label="Item ID" value={account.itemId} /></aside></div></section></div>;
}

function ContactsCrm({ Header, id }) {
  const [tab, setTab] = useState('accounts');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [activeContactId, setActiveContactId] = useState(null);
  const [crm, setCrm] = useState(loadCrm);
  const [options, setOptions] = useState(() => ({ accountTypes: accountTypeLabels, contactTypes: contactTypeLabels, industries: industryLabels, ...loadOptions() }));

  useEffect(() => { localStorage.setItem(crmKey, JSON.stringify(crm)); }, [crm]);
  useEffect(() => { localStorage.setItem(crmOptionsKey, JSON.stringify(options)); }, [options]);

  const accountTypeOptions = useMemo(() => uniq([...options.accountTypes, ...crm.accounts.map((row) => row.type)]), [options.accountTypes, crm.accounts]);
  const contactTypeOptions = useMemo(() => uniq([...options.contactTypes, ...crm.contacts.map((row) => row.type)]), [options.contactTypes, crm.contacts]);
  const industryOptions = useMemo(() => uniq([...options.industries, ...crm.accounts.map((row) => row.industry)]), [options.industries, crm.accounts]);
  const data = tab === 'accounts' ? crm.accounts : crm.contacts;
  const labels = tab === 'accounts' ? accountTypeOptions : contactTypeOptions;
  const sourceCount = tab === 'accounts' ? 144 : 186;
  const activeAccount = crm.accounts.find((account) => account.id === activeAccountId);
  const activeContact = crm.contacts.find((contact) => contact.id === activeContactId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((row) => {
      const selected = typeFilter === 'All' || row.type === typeFilter;
      const searched = !q || Object.values(row).some((value) => String(Array.isArray(value) ? value.join(' ') : value).toLowerCase().includes(q));
      return selected && searched;
    });
  }, [query, typeFilter, data]);

  function updateAccount(accountId, patch) { setCrm((current) => ({ ...current, accounts: current.accounts.map((row) => row.id === accountId ? { ...row, ...patch } : row) })); }
  function updateContact(contactId, patch) { setCrm((current) => ({ ...current, contacts: current.contacts.map((row) => row.id === contactId ? { ...row, ...patch } : row) })); }
  function addOption(kind, value) { if (!value) return; setOptions((current) => ({ ...current, [kind]: uniq([...(current[kind] || []), value]) })); }
  function switchTab(next) { setTab(next); setTypeFilter('All'); setQuery(''); }
  function addAccount() {
    const id = `acc-new-${Date.now()}`;
    setCrm((current) => ({ ...current, accounts: [{ id, name: 'New Account', type: 'GC/Developers/Owner', domain: '', industry: '', description: '', employees: '', headquarters: '', contacts: [], salesEstimating: '', itemId: `new-${current.accounts.length + 1}` }, ...current.accounts] }));
    setActiveAccountId(id);
  }
  function addContact(account) {
    const id = `con-new-${Date.now()}`;
    const contact = { id, name: 'New Contact', firstName: 'New', lastName: 'Contact', type: 'General Contractors', accountId: account?.id || '', linkedAccount: account?.name || '', title: '', phone: '', email: '', comments: '', company: '', salesEstimating: '', itemId: `new-contact-${crm.contacts.length + 1}`, updates: [{ kind: 'Record', date: 'Created in CRM', from: 'Steel Craft CRM', to: 'Steel Craft CRM', subject: 'Contact created', body: 'New editable contact was created in the CRM board.', attachments: [] }] };
    setCrm((current) => ({ ...current, contacts: [contact, ...current.contacts], accounts: account ? current.accounts.map((row) => row.id === account.id ? { ...row, contacts: uniq([...(row.contacts || []), contact.name]) } : row) : current.accounts }));
    setActiveContactId(id);
  }

  return <>
    {Header ? <Header id={id} /> : null}
    <section className="live-module-shell canonical-force-live" style={styles.shell}><article className="live-module-card" style={styles.card}><div style={styles.top}><div><p className="eyebrow">Steel Craft CRM</p><h2 style={{ fontSize: 42, margin: '6px 0' }}>{tab === 'accounts' ? 'Accounts' : 'Contacts'}</h2><p style={{ maxWidth: 820 }}>Editable CRM table. Click into cells to type, change dropdowns, add new options, open websites, email contacts, and create new account/contact rows.</p></div><div style={{ display: 'grid', gap: 12, justifyItems: 'stretch' }}><div style={{ ...styles.tabs, justifyContent: 'flex-end' }}><button type="button" style={tab === 'accounts' ? styles.activeButton : styles.button} onClick={() => switchTab('accounts')}>Accounts</button><button type="button" style={tab === 'contacts' ? styles.activeButton : styles.button} onClick={() => switchTab('contacts')}>Contacts</button></div><input style={styles.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search CRM..." /></div></div><div style={styles.toolbar}><div><span className="eyebrow">Rows</span><strong>{filtered.length} visible / {data.length} loaded / {sourceCount} source</strong></div><label><span>Type filter</span><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="All">All {tab === 'accounts' ? 'account' : 'contact'} types</option>{labels.map((label) => <option key={label} value={label}>{label}</option>)}</select></label><div style={{ color: 'var(--muted)' }}>Every visible field is editable. Dropdowns include + Add new option inside the cell.</div><button type="button" style={styles.activeButton} onClick={tab === 'accounts' ? addAccount : () => addContact(null)}>+ {tab === 'accounts' ? 'Account' : 'Contact'}</button></div>{tab === 'accounts' ? <div style={styles.tableWrap}><div style={styles.table}><div style={{ ...styles.accountRow, ...styles.head }}><span>Account</span><span>Account Type</span><span>Domain</span><span>Industry</span><span>Linked Contacts</span><span>Item ID</span><span>Open</span></div>{filtered.map((account) => <div key={account.id} style={styles.dataRow}><div style={styles.accountRow}><TextCell value={account.name} onChange={(value) => updateAccount(account.id, { name: value })} /><PickCell value={account.type} options={accountTypeOptions} onChange={(value) => updateAccount(account.id, { type: value })} onAdd={(value) => { addOption('accountTypes', value); updateAccount(account.id, { type: value }); }} /><LinkCell value={account.domain} onChange={(value) => updateAccount(account.id, { domain: value })} /><PickCell value={account.industry} options={industryOptions} onChange={(value) => updateAccount(account.id, { industry: value })} onAdd={(value) => { addOption('industries', value); updateAccount(account.id, { industry: value }); }} /><div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 6 }}><TextCell value={listValue(account.contacts)} onChange={(value) => updateAccount(account.id, { contacts: splitList(value) })} /><button type="button" style={styles.button} onClick={() => addContact(account)}>+</button></div><span>{account.itemId}</span><button type="button" style={styles.button} onClick={() => setActiveAccountId(account.id)}>Open</button></div></div>)}</div></div> : <div style={styles.tableWrap}><div style={styles.table}><div style={{ ...styles.contactRow, ...styles.head }}><span>Contact</span><span>Type</span><span>Linked Account</span><span>Title</span><span>Phone</span><span>Email</span><span>Open</span></div>{filtered.map((contact) => <div key={contact.id} style={styles.dataRow}><div style={styles.contactRow}><TextCell value={contact.name} onChange={(value) => updateContact(contact.id, { name: value })} /><PickCell value={contact.type} options={contactTypeOptions} onChange={(value) => updateContact(contact.id, { type: value })} onAdd={(value) => { addOption('contactTypes', value); updateContact(contact.id, { type: value }); }} /><select style={textInput} value={contact.accountId || ''} onChange={(event) => { const account = crm.accounts.find((row) => row.id === event.target.value); updateContact(contact.id, { accountId: account?.id || '', linkedAccount: account?.name || '' }); }}><option value="">No linked account</option>{crm.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><TextCell value={contact.title} onChange={(value) => updateContact(contact.id, { title: value })} /><TextCell value={contact.phone} onChange={(value) => updateContact(contact.id, { phone: value })} /><LinkCell kind="email" value={contact.email} onChange={(value) => updateContact(contact.id, { email: value })} /><button type="button" style={styles.button} onClick={() => setActiveContactId(contact.id)}>Open</button></div></div>)}</div></div>}</article></section>{activeAccount && <AccountModal account={activeAccount} linked={crm.contacts.filter((contact) => contact.accountId === activeAccount.id)} close={() => setActiveAccountId(null)} updateAccount={updateAccount} addLinkedContact={addContact} />}{activeContact && <ContactModal contact={activeContact} close={() => setActiveContactId(null)} updateContact={updateContact} />}</>;
}

export function isLiveCanonicalPortal(id) { return id === 'contacts' || Boolean(genericModules[id]); }

export default function LiveCanonicalPortal({ id, Header }) {
  if (id === 'contacts') return <ContactsCrm Header={Header} id={id} />;
  const data = genericModules[id];
  if (!data) return null;
  return <>
    {Header ? <Header id={id} /> : null}
    <section className="live-module-shell canonical-force-live"><article className="live-module-card"><p className="eyebrow">Canonical live module</p><h2>{data.title}</h2><p>{data.intro}</p><div className="live-module-actions"><button type="button">Open</button><button type="button">Route</button><button type="button">Approve</button><button type="button">Proof</button></div><div className="live-module-metrics">{data.metrics.map((row) => <Metric row={row} key={row[0]} />)}</div></article><SimpleGrid title={`${data.title} workspace`} rows={data.metrics} /></section>
  </>;
}
