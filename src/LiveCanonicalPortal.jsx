import React, { useEffect, useMemo, useState } from 'react';

const genericModules = {
  admin: { title: 'Admin', intro: 'Tenant controls, users, roles, portal access, setup, security, and audit controls.', metrics: [['Users', '6', 'Authenticated roles'], ['Portals', '12', 'Enabled'], ['Setup', 'Open', 'Guided setup'], ['Audit', 'Ready', 'Proof events']] },
  hr: { title: 'HR Portal', intro: 'Employee records, onboarding, handbook, training, PTO, and employee documents.', metrics: [['Employees', '17', 'Active'], ['Training', '4', 'Due'], ['PTO', '2', 'Pending'], ['Docs', 'Ready', 'Files']] },
  vendor: { title: 'Vendor Portal', intro: 'Vendor packets, PO visibility, due dates, upload slots, receiving status, and vendor communication.', metrics: [['Packets', '19', 'Open'], ['Uploads', '5', 'Needed'], ['Late', '3', 'Follow-up'], ['AP links', '14', 'Ready']] },
  customer: { title: 'Customer Portal', intro: 'Customer approvals, payments, documents, uploads, job status, and customer communication.', metrics: [['Approvals', '11', 'Action'], ['Invoices', '$27k', 'Open'], ['Uploads', '6', 'Needed'], ['Threads', '22', 'Active']] },
  employee: { title: 'Employee Self-Service', intro: 'Employee profile, PTO requests, handbook acknowledgements, training assignments, documents, and HR help.', metrics: [['Training', '4 due', 'Assignments'], ['PTO', '2', 'Pending'], ['Docs', '12', 'Files'], ['Help', 'Live', 'Support']] }
};

const accountTypeSeeds = ['GC/Developers/Owner', 'General Contractors', 'Architect / Engineering Firms', 'Engineers', 'Material Suppliers / Fabricators / Vendors', 'Erectors', 'Testing & Inspection Agencies', 'Insurance / Surety', 'Financial Institutions', 'Logistics / Freight', 'Owner'];
const contactTypeSeeds = ['General Contractors', 'Financial', 'Project Owner', 'Suppliers', 'Architect/Engineer', 'No Label', 'Erectors', "Sub-Contractor PM's", 'Inspection & Testing'];
const industrySeeds = ['Construction', 'Architecture / Engineering', 'Materials', 'Development', 'Vendor / Services', 'Professional Services', 'Financial Services', 'Software', 'Lending and Investments'];

const realAccounts = [
  ['acc-10060908348', 'Hammond Contracting, LLC.', 'GC/Developers/Owner', 'Facebook Page - https://www.facebook.com/HammondContractingLLC/?checkpoint_src=any', 'Construction', ['Justin R. Hammond'], '10060908348'],
  ['acc-7281111345', 'HSBF', 'Testing & Inspection Agencies', 'hsbf.co - https://hsbf.co/', 'Lending and Investments', [], '7281111345'],
  ['acc-7281111360', 'Pear inc', 'Material Suppliers / Fabricators / Vendors', 'pear.inc - https://pear.inc/', 'Software', [], '7281111360'],
  ['acc-7281111382', 'Bindeer Inc.', 'GC/Developers/Owner', 'bindeer.com - https://bindeer.com/', 'Financial Services', [], '7281111382'],
  ['acc-9378715111', 'Agently Inc.', 'Financial Institutions', '', '', [], '9378715111'],
  ['acc-9901837151', '468 Cypress Road Ocala', 'GC/Developers/Owner', '', '', ['Harvey Cohen'], '9901837151'],
  ['acc-9903891419', 'A.D. Owens Construction', 'General Contractors', 'adowens.com - https://adowens.com', 'Professional Services', ['Scott Roth'], '9903891419'],
  ['acc-9902047458', 'Accu-Tech Construction, Inc.', 'General Contractors', 'accutech1.com', 'Construction', ['Andy Wilkin', 'Rachel Angeline', 'Jason Frazier'], '9902047458'],
  ['acc-rbd', 'RBD Design', 'Architect / Engineering Firms', '', 'Architecture / Engineering', ['Rob Blount'], '990-rbd'],
  ['acc-hornet', 'Hornet Steel Buildings', 'Material Suppliers / Fabricators / Vendors', '', 'Materials', ['Austin Sinclair'], '990-hornet'],
  ['acc-tallen', 'Tallen Builders, LLC', 'General Contractors', '', 'Construction', ['Aaron Schrey'], '990-tallen'],
  ['acc-curry', 'Allen Curry Plumbing', 'GC/Developers/Owner', '', 'Construction', ['Allen Curry'], '990-curry'],
  ['acc-plc', 'PLC-Construction', 'General Contractors', '', 'Construction', ['Ben Leach'], '990-plc'],
  ['acc-develup', 'Develup', 'GC/Developers/Owner', '', 'Development', ['Ben Smith'], '990-develup'],
  ['acc-davlin', 'Dav-Lin, LLC', 'General Contractors', '', 'Construction', ['Bender Middlekauff'], '990-davlin']
].map(([id, name, type, domain, industry, contacts, itemId]) => ({ id, name, type, domain, industry, contacts, itemId, accountEmail: '', gmailLink: '', neroaLink: '', notes: '', description: '', employees: '', headquarters: '', salesEstimating: '' }));

const generatedAccounts = Array.from({ length: 129 }, (_, index) => ({
  id: `acc-preview-${index + 1}`,
  name: `Imported Monday Account ${index + 1}`,
  type: accountTypeSeeds[index % accountTypeSeeds.length],
  domain: '',
  industry: industrySeeds[index % industrySeeds.length],
  contacts: [`Imported Contact ${index + 1}`],
  itemId: `preview-${index + 1}`,
  accountEmail: '',
  gmailLink: '',
  neroaLink: '',
  notes: '',
  description: '',
  employees: '',
  headquarters: '',
  salesEstimating: ''
}));

const seedAccounts = [...realAccounts, ...generatedAccounts];
const seedContacts = [
  { id: 'con-9902047458', name: 'Andy Wilkin', type: 'General Contractors', accountId: 'acc-9902047458', linkedAccount: 'Accu-Tech Construction, Inc.', title: '', phone: '', email: 'andy@accutech1.com', notes: '', itemId: '9902047458' },
  { id: 'con-justin', name: 'Justin R. Hammond', type: 'General Contractors', accountId: 'acc-10060908348', linkedAccount: 'Hammond Contracting, LLC.', title: '', phone: '', email: '', notes: '', itemId: 'con-justin' },
  { id: 'con-rob', name: 'Rob Blount', type: 'Architect/Engineer', accountId: 'acc-rbd', linkedAccount: 'RBD Design', title: '', phone: '', email: '', notes: '', itemId: 'con-rob' },
  ...Array.from({ length: 183 }, (_, index) => {
    const account = seedAccounts[index % seedAccounts.length];
    return { id: `con-preview-${index + 1}`, name: `Imported Contact ${index + 1}`, type: contactTypeSeeds[index % contactTypeSeeds.length], accountId: account.id, linkedAccount: account.name, title: '', phone: '', email: '', notes: '', itemId: `contact-preview-${index + 1}` };
  })
];

const crmKey = 'steelcraft_crm_records_v6';
const oldCrmKeys = ['steelcraft_crm_records_v5', 'steelcraft_live_crm_records_v3'];
const optionsKey = 'steelcraft_crm_options_v5';
const colorKey = 'steelcraft_crm_color_map_v2';
const defaultColors = { 'GC/Developers/Owner': '#f6a637', 'General Contractors': '#4f8ff0', 'Architect / Engineering Firms': '#5bc3e6', 'Architect/Engineer': '#5bc3e6', Engineers: '#62c6ee', 'Material Suppliers / Fabricators / Vendors': '#0a7ca4', Suppliers: '#9a4ed6', Erectors: '#dd79b8', 'Testing & Inspection Agencies': '#5b8df5', 'Inspection & Testing': '#5755db', 'Insurance / Surety': '#c7aa2f', Financial: '#9bd717', 'Financial Institutions': '#ff5a35', 'Logistics / Freight': '#9656d8', Owner: '#f90078', 'Project Owner': '#06834b', "Sub-Contractor PM's": '#22508c', 'No Label': '#777777', Construction: '#3d9f65', 'Architecture / Engineering': '#5bc3e6', Materials: '#0a7ca4', Development: '#f6a637', 'Vendor / Services': '#8667d8', 'Professional Services': '#4f8ff0', 'Financial Services': '#ff5a35', Software: '#62c6ee', 'Lending and Investments': '#9bd717' };

const inputStyle = { width: '100%', minWidth: 0, minHeight: 40, border: '1px solid rgba(255,255,255,.13)', borderRadius: 10, background: 'rgba(0,0,0,.22)', color: 'var(--text)', padding: '8px 10px', fontWeight: 800 };
const styles = {
  shell: { width: 'calc(100vw - 44px)', maxWidth: 'none', margin: 0, display: 'block', justifySelf: 'stretch', gridColumn: '1 / -1' },
  card: { width: '100%', maxWidth: 'none', minWidth: 0, border: '1px solid var(--line)', borderRadius: 22, background: 'var(--card)', padding: 18, boxShadow: '0 18px 48px rgba(0,0,0,.2)', boxSizing: 'border-box' },
  top: { display: 'grid', gridTemplateColumns: 'minmax(420px,1fr) minmax(420px,560px)', gap: 18, alignItems: 'start' },
  tabs: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  button: { border: '1px solid var(--line)', borderRadius: 12, padding: '9px 12px', background: 'rgba(255,255,255,.06)', color: 'var(--text)', fontWeight: 900, whiteSpace: 'nowrap', cursor: 'pointer' },
  activeButton: { border: 0, borderRadius: 12, padding: '9px 12px', background: 'var(--brand-accent)', color: '#fff', fontWeight: 950, whiteSpace: 'nowrap', cursor: 'pointer' },
  toolbar: { display: 'grid', gridTemplateColumns: 'minmax(260px,.55fr) minmax(300px,.75fr) minmax(150px,180px) auto', gap: 18, alignItems: 'end', margin: '18px 0' },
  countCard: { display: 'grid', gap: 2, border: '1px solid var(--line)', borderRadius: 14, background: 'rgba(255,255,255,.035)', padding: '10px 12px' },
  tableWrap: { width: '100%', overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 16, background: 'rgba(255,255,255,.025)' },
  table: { minWidth: 2520, display: 'grid' },
  accountRow: { display: 'grid', gridTemplateColumns: '360px 360px 124px 520px 300px 124px 430px 160px 100px', gap: 0, alignItems: 'stretch' },
  contactRow: { display: 'grid', gridTemplateColumns: '300px 330px 124px 420px 240px 220px 430px 100px', gap: 0, alignItems: 'stretch' },
  headCell: { padding: '10px 12px', borderRight: '1px solid var(--line)', borderBottom: '1px solid var(--line)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 12, fontWeight: 900, background: 'rgba(0,0,0,.22)' },
  cell: { minHeight: 64, padding: 9, borderRight: '1px solid var(--line)', borderBottom: '1px solid var(--line)', display: 'grid', alignItems: 'center' },
  pager: { display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', padding: '12px 0 0' },
  overlay: { position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.55)', display: 'grid', placeItems: 'start center', padding: 32, overflowY: 'auto' },
  modal: { width: 'min(1500px, calc(100vw - 44px))', borderRadius: 22, border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--text)', boxShadow: '0 30px 90px rgba(0,0,0,.55)', padding: 22 },
  modalGrid: { display: 'grid', gridTemplateColumns: 'minmax(520px,1fr) minmax(360px,460px)', gap: 18, alignItems: 'start' },
  panel: { border: '1px solid var(--line)', borderRadius: 16, background: 'rgba(255,255,255,.035)', padding: 14, display: 'grid', gap: 10 },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 },
  colorCell: { display: 'grid', gridTemplateColumns: '42px minmax(0,1fr)', gap: 8, alignItems: 'center' },
  swatch: { width: 42, height: 42, minWidth: 42, border: '1px solid rgba(255,255,255,.22)', borderRadius: 10, padding: 2, background: 'rgba(0,0,0,.25)', cursor: 'pointer' },
  colorLabel: { fontSize: 11, color: 'var(--muted)', lineHeight: 1.1, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.04em' },
  textarea: { ...inputStyle, minHeight: 130, resize: 'vertical', lineHeight: 1.45 },
  linkedRow: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', gap: 8, alignItems: 'center', border: '1px solid var(--line)', borderRadius: 12, padding: 10, background: 'rgba(0,0,0,.18)' }
};

function uniq(values) { return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b)); }
function normalizeCrm(data) { return { accounts: (data?.accounts?.length ? data.accounts : seedAccounts).map((account) => ({ accountEmail: '', gmailLink: '', neroaLink: '', notes: '', contacts: [], ...account })), contacts: (data?.contacts?.length ? data.contacts : seedContacts).map((contact) => ({ notes: '', ...contact })) }; }
function loadCrm() { try { const saved = JSON.parse(localStorage.getItem(crmKey)); if (saved?.accounts?.length) return normalizeCrm(saved); for (const key of oldCrmKeys) { const old = JSON.parse(localStorage.getItem(key)); if (old?.accounts?.length) return normalizeCrm(old); } return normalizeCrm({ accounts: seedAccounts, contacts: seedContacts }); } catch { return normalizeCrm({ accounts: seedAccounts, contacts: seedContacts }); } }
function loadOptions() { try { return JSON.parse(localStorage.getItem(optionsKey)) || {}; } catch { return {}; } }
function loadColors() { try { return { ...defaultColors, ...(JSON.parse(localStorage.getItem(colorKey)) || {}) }; } catch { return defaultColors; } }
function splitNames(value) { return String(value || '').split(',').map((part) => part.trim()).filter(Boolean); }
function names(value) { return Array.isArray(value) ? value.join(', ') : (value || ''); }
function hrefFor(value) { const text = String(value || '').trim(); const url = text.match(/https?:\/\/[^\s,]+/i)?.[0]; if (url) return url; const domain = text.split(' - ')[0]; return domain.includes('.') ? `https://${domain}` : ''; }
function emailFor(value) { return String(value || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || ''; }
function gmailComposeUrl(email, subject) { return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email || '')}&su=${encodeURIComponent(subject || 'Steel Craft CRM')}`; }
function clampPage(page, totalPages) { return Math.min(Math.max(page, 1), Math.max(totalPages, 1)); }
function openExternal(url) { if (url) window.open(url, '_blank', 'noopener,noreferrer'); }
function handoffToNeroa(kind, record) { const payload = { source: 'steelcraft-crm', kind, id: record.id, name: record.name, email: record.accountEmail || record.email || '', notes: record.notes || '', timestamp: new Date().toISOString() }; localStorage.setItem('neroa_connect_context', JSON.stringify(payload)); window.dispatchEvent(new CustomEvent('neroa-connect-context', { detail: payload })); const launcher = document.querySelector('.neroa-safe-launcher'); if (launcher) launcher.click(); else window.alert(`Neroa Connect context saved for ${record.name}.`); }

function Metric({ row }) { return <div className="live-module-metric"><strong>{row[0]}</strong><b>{row[1]}</b><span>{row[2]}</span></div>; }
function SimpleGrid({ title, rows }) { return <div className="live-module-grid crm-wide-grid"><article className="live-module-card crm-wide-card"><h3>{title}</h3><div className="live-module-list">{rows.map((row) => <div className="live-module-row" key={row[0]}><div><strong>{row[0]}</strong><span>{row[1]}</span></div><b>{row[2]}</b></div>)}</div></article></div>; }
function TextCell({ value, onChange, placeholder }) { return <input style={inputStyle} value={value || ''} placeholder={placeholder || ''} onChange={(event) => onChange(event.target.value)} />; }
function TextAreaCell({ value, onChange, placeholder }) { return <textarea style={styles.textarea} value={value || ''} placeholder={placeholder || ''} onChange={(event) => onChange(event.target.value)} />; }
function SelectCell({ value, options, onChange, onAdd, color }) { return <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 62px', gap: 8, alignItems: 'center' }}><select style={{ ...inputStyle, borderColor: color || 'rgba(255,255,255,.13)', boxShadow: color ? `inset 6px 0 0 ${color}` : 'none', paddingLeft: color ? 16 : 10 }} value={value || ''} onChange={(event) => onChange(event.target.value)}><option value="">No value</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select><button type="button" style={styles.button} onClick={() => { const next = window.prompt('Type a new dropdown value'); if (next) onAdd(next.trim()); }}>New</button></div>; }
function ColorCell({ value, color, onColor }) { return <div style={styles.colorCell}><input type="color" style={styles.swatch} value={color || '#777777'} title={`Set color for ${value || 'blank'}`} onChange={(event) => onColor(event.target.value)} /><span style={styles.colorLabel}>Set color</span></div>; }
function LinkCell({ value, onChange, kind }) { const href = kind === 'email' ? (emailFor(value) ? `mailto:${emailFor(value)}` : '') : hrefFor(value); return <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', gap: 6 }}><TextCell value={value} onChange={onChange} placeholder={kind === 'email' ? 'email' : 'domain or URL'} /><button type="button" style={styles.button} onClick={() => { const next = window.prompt(kind === 'email' ? 'Add or edit email' : 'Add or edit link', value || ''); if (next !== null) onChange(next); }}>+ Link</button>{href ? <a style={styles.button} href={href} target={kind === 'email' ? undefined : '_blank'} rel="noreferrer">Open</a> : null}</div>; }
function Head({ columns, rowStyle }) { return <div style={rowStyle}>{columns.map((column) => <div style={styles.headCell} key={column}>{column}</div>)}</div>; }
function Cell({ children }) { return <div style={styles.cell}>{children}</div>; }
function ModalShell({ title, subtitle, close, children }) { return <div style={styles.overlay} onClick={close}><section style={styles.modal} onClick={(event) => event.stopPropagation()}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', marginBottom: 16 }}><div><p className="eyebrow">CRM record</p><h2 style={{ margin: '4px 0' }}>{title}</h2>{subtitle ? <p style={{ color: 'var(--muted)', margin: 0 }}>{subtitle}</p> : null}</div><button type="button" style={styles.button} onClick={close}>Close</button></div>{children}</section></div>; }

function AccountDetail({ account, linkedContacts, accountTypes, industries, colorMap, close, patchAccount, patchContact, addOption, setValueColor, addContact, openContact }) {
  const accountEmail = account.accountEmail || linkedContacts.find((contact) => contact.email)?.email || '';
  const gmailTarget = account.gmailLink || (accountEmail ? gmailComposeUrl(accountEmail, `Steel Craft CRM - ${account.name}`) : '');
  return <ModalShell title={account.name} subtitle="Account workspace with notes, links, Gmail, Neroa Connect, and linked contacts." close={close}>
    <div style={styles.modalGrid}>
      <div style={{ display: 'grid', gap: 14 }}>
        <section style={styles.panel}><h3 style={{ margin: 0 }}>Account fields</h3><div style={styles.detailGrid}><label><span>Account name</span><TextCell value={account.name} onChange={(value) => patchAccount(account.id, { name: value })} /></label><label><span>Account email</span><LinkCell kind="email" value={account.accountEmail || ''} onChange={(value) => patchAccount(account.id, { accountEmail: value })} /></label><label><span>Account type</span><SelectCell value={account.type} options={accountTypes} color={colorMap[account.type]} onChange={(value) => patchAccount(account.id, { type: value })} onAdd={(value) => { addOption('accountTypes', value); patchAccount(account.id, { type: value }); setValueColor(value, '#777777'); }} /></label><label><span>Type color</span><ColorCell value={account.type} color={colorMap[account.type]} onColor={(color) => setValueColor(account.type, color)} /></label><label><span>Industry</span><SelectCell value={account.industry} options={industries} color={colorMap[account.industry]} onChange={(value) => patchAccount(account.id, { industry: value })} onAdd={(value) => { addOption('industries', value); patchAccount(account.id, { industry: value }); setValueColor(value, '#777777'); }} /></label><label><span>Industry color</span><ColorCell value={account.industry} color={colorMap[account.industry]} onColor={(color) => setValueColor(account.industry, color)} /></label></div></section>
        <section style={styles.panel}><h3 style={{ margin: 0 }}>Account links</h3><label><span>Website / domain</span><LinkCell value={account.domain || ''} onChange={(value) => patchAccount(account.id, { domain: value })} /></label><label><span>Gmail thread or compose link</span><LinkCell value={account.gmailLink || ''} onChange={(value) => patchAccount(account.id, { gmailLink: value })} /></label><label><span>Neroa Connect link / reference</span><LinkCell value={account.neroaLink || ''} onChange={(value) => patchAccount(account.id, { neroaLink: value })} /></label><div style={{ ...styles.tabs, marginTop: 4 }}><button type="button" style={styles.activeButton} onClick={() => { if (!accountEmail && !account.gmailLink) { const next = window.prompt('Add an account email for Gmail compose'); if (next) patchAccount(account.id, { accountEmail: next }); return; } openExternal(gmailTarget); }}>Open Gmail</button><button type="button" style={styles.activeButton} onClick={() => handoffToNeroa('account', account)}>Send to Neroa Connect</button></div></section>
        <section style={styles.panel}><h3 style={{ margin: 0 }}>Account notes</h3><TextAreaCell value={account.notes || ''} placeholder="Add account notes, customer history, job context, next steps, or follow-up reminders..." onChange={(value) => patchAccount(account.id, { notes: value })} /></section>
      </div>
      <aside style={styles.panel}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}><h3 style={{ margin: 0 }}>Linked contacts</h3><button type="button" style={styles.activeButton} onClick={() => addContact(account)}>+ Contact</button></div><TextCell value={names(account.contacts)} onChange={(value) => patchAccount(account.id, { contacts: splitNames(value) })} placeholder="Linked contact names" />{linkedContacts.length ? linkedContacts.map((contact) => <div style={styles.linkedRow} key={contact.id}><div><strong>{contact.name}</strong><small style={{ display: 'block', color: 'var(--muted)' }}>{contact.email || contact.type || 'No email loaded'}</small></div><button type="button" style={styles.button} onClick={() => openContact(contact.id)}>Open</button><button type="button" style={styles.button} onClick={() => { if (contact.email) openExternal(gmailComposeUrl(contact.email, `Steel Craft CRM - ${account.name}`)); else { const next = window.prompt(`Add email for ${contact.name}`); if (next) patchContact(contact.id, { email: next }); } }}>Gmail</button></div>) : <p style={{ color: 'var(--muted)' }}>No linked contact records yet. Add names above or create a contact.</p>}</aside>
    </div>
  </ModalShell>;
}

function ContactDetail({ contact, account, contactTypes, colorMap, close, patchContact, addOption, setValueColor }) {
  const gmailTarget = contact.email ? gmailComposeUrl(contact.email, `Steel Craft CRM - ${contact.name}`) : '';
  return <ModalShell title={contact.name} subtitle={account ? `Linked to ${account.name}` : 'Contact workspace'} close={close}>
    <div style={styles.modalGrid}><section style={styles.panel}><h3 style={{ margin: 0 }}>Contact fields</h3><div style={styles.detailGrid}><label><span>Name</span><TextCell value={contact.name} onChange={(value) => patchContact(contact.id, { name: value })} /></label><label><span>Email</span><LinkCell kind="email" value={contact.email || ''} onChange={(value) => patchContact(contact.id, { email: value })} /></label><label><span>Type</span><SelectCell value={contact.type} options={contactTypes} color={colorMap[contact.type]} onChange={(value) => patchContact(contact.id, { type: value })} onAdd={(value) => { addOption('contactTypes', value); patchContact(contact.id, { type: value }); setValueColor(value, '#777777'); }} /></label><label><span>Type color</span><ColorCell value={contact.type} color={colorMap[contact.type]} onColor={(color) => setValueColor(contact.type, color)} /></label><label><span>Title</span><TextCell value={contact.title || ''} onChange={(value) => patchContact(contact.id, { title: value })} /></label><label><span>Phone</span><TextCell value={contact.phone || ''} onChange={(value) => patchContact(contact.id, { phone: value })} /></label></div><label><span>Notes</span><TextAreaCell value={contact.notes || ''} onChange={(value) => patchContact(contact.id, { notes: value })} /></label></section><aside style={styles.panel}><h3 style={{ margin: 0 }}>Actions</h3><button type="button" style={styles.activeButton} onClick={() => { if (gmailTarget) openExternal(gmailTarget); else { const next = window.prompt('Add contact email'); if (next) patchContact(contact.id, { email: next }); } }}>Open Gmail</button><button type="button" style={styles.activeButton} onClick={() => handoffToNeroa('contact', contact)}>Send to Neroa Connect</button></aside></div>
  </ModalShell>;
}

function ContactsCrm({ Header, id }) {
  const [tab, setTab] = useState('accounts');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [active, setActive] = useState(null);
  const [crm, setCrm] = useState(loadCrm);
  const [options, setOptions] = useState(() => ({ accountTypes: accountTypeSeeds, contactTypes: contactTypeSeeds, industries: industrySeeds, ...loadOptions() }));
  const [colorMap, setColorMap] = useState(loadColors);
  useEffect(() => { localStorage.setItem(crmKey, JSON.stringify(crm)); }, [crm]);
  useEffect(() => { localStorage.setItem(optionsKey, JSON.stringify(options)); }, [options]);
  useEffect(() => { localStorage.setItem(colorKey, JSON.stringify(colorMap)); }, [colorMap]);
  useEffect(() => { setPage(1); }, [tab, query, typeFilter, pageSize]);

  const accountTypes = useMemo(() => uniq([...options.accountTypes, ...crm.accounts.map((item) => item.type)]), [options.accountTypes, crm.accounts]);
  const contactTypes = useMemo(() => uniq([...options.contactTypes, ...crm.contacts.map((item) => item.type)]), [options.contactTypes, crm.contacts]);
  const industries = useMemo(() => uniq([...options.industries, ...crm.accounts.map((item) => item.industry)]), [options.industries, crm.accounts]);
  const rows = tab === 'accounts' ? crm.accounts : crm.contacts;
  const labels = tab === 'accounts' ? accountTypes : contactTypes;
  const filtered = useMemo(() => rows.filter((row) => {
    const selected = typeFilter === 'All' || row.type === typeFilter;
    const q = query.trim().toLowerCase();
    const searched = !q || Object.values(row).some((value) => String(Array.isArray(value) ? value.join(' ') : value).toLowerCase().includes(q));
    return selected && searched;
  }), [rows, query, typeFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = clampPage(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = filtered.length ? (safePage - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(safePage * pageSize, filtered.length);

  function patchAccount(accountId, patch) { setCrm((current) => ({ ...current, accounts: current.accounts.map((row) => row.id === accountId ? { ...row, ...patch } : row) })); }
  function patchContact(contactId, patch) { setCrm((current) => ({ ...current, contacts: current.contacts.map((row) => row.id === contactId ? { ...row, ...patch } : row) })); }
  function addOption(kind, value) { if (!value) return; setOptions((current) => ({ ...current, [kind]: uniq([...(current[kind] || []), value]) })); }
  function setValueColor(value, color) { if (!value) return; setColorMap((current) => ({ ...current, [value]: color })); }
  function addAccount() { const id = `acc-new-${Date.now()}`; setCrm((current) => ({ ...current, accounts: [{ id, name: 'New Account', type: 'General Contractors', domain: '', industry: '', contacts: [], accountEmail: '', gmailLink: '', neroaLink: '', notes: '', itemId: `new-${current.accounts.length + 1}` }, ...current.accounts] })); setTab('accounts'); setPage(1); setActive({ kind: 'account', id }); }
  function addContact(account) { const id = `con-new-${Date.now()}`; const next = { id, name: 'New Contact', type: 'General Contractors', accountId: account?.id || '', linkedAccount: account?.name || '', title: '', phone: '', email: '', notes: '', itemId: `new-contact-${crm.contacts.length + 1}` }; setCrm((current) => ({ ...current, contacts: [next, ...current.contacts], accounts: account ? current.accounts.map((row) => row.id === account.id ? { ...row, contacts: uniq([...(row.contacts || []), next.name]) } : row) : current.accounts })); setTab('contacts'); setPage(1); setActive({ kind: 'contact', id }); }
  function switchTab(next) { setTab(next); setTypeFilter('All'); setQuery(''); }

  const activeAccount = active?.kind === 'account' ? crm.accounts.find((row) => row.id === active.id) : null;
  const activeContact = active?.kind === 'contact' ? crm.contacts.find((row) => row.id === active.id) : null;
  const activeContactAccount = activeContact ? crm.accounts.find((row) => row.id === activeContact.accountId) : null;
  const linkedContacts = activeAccount ? crm.contacts.filter((contact) => contact.accountId === activeAccount.id || (activeAccount.contacts || []).includes(contact.name)) : [];

  return <>
    {Header ? <Header id={id} /> : null}
    <section className="live-module-shell canonical-force-live" style={styles.shell}><article className="live-module-card" style={styles.card}>
      <div style={styles.top}><div><p className="eyebrow">Steel Craft CRM</p><h2 style={{ fontSize: 40, margin: '4px 0' }}>{tab === 'accounts' ? 'Accounts' : 'Contacts / Customers'}</h2><p style={{ maxWidth: 760, margin: 0 }}>Open accounts for notes, Gmail, Neroa Connect, links, linked contacts, and follow-up context.</p></div><div style={{ display: 'grid', gap: 10 }}><div style={{ ...styles.tabs, justifyContent: 'flex-end' }}><button type="button" style={tab === 'accounts' ? styles.activeButton : styles.button} onClick={() => switchTab('accounts')}>Accounts</button><button type="button" style={tab === 'contacts' ? styles.activeButton : styles.button} onClick={() => switchTab('contacts')}>Contacts</button></div><input style={inputStyle} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search CRM" /></div></div>
      <div style={styles.toolbar}><div style={styles.countCard}><span className="eyebrow">Showing</span><strong>{rangeStart}-{rangeEnd}</strong><small>{filtered.length} filtered / {rows.length} total</small></div><label><span>Type filter</span><select style={inputStyle} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="All">All {tab === 'accounts' ? 'account' : 'contact'} types</option>{labels.map((label) => <option value={label} key={label}>{label}</option>)}</select></label><label><span>Rows/page</span><select style={inputStyle} value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option><option value={144}>144</option></select></label><button type="button" style={styles.activeButton} onClick={tab === 'accounts' ? addAccount : () => addContact(null)}>+ {tab === 'accounts' ? 'Account' : 'Contact'}</button></div>
      <div style={styles.tableWrap}><div style={styles.table}>{tab === 'accounts' ? <><Head rowStyle={styles.accountRow} columns={['Account', 'Account Type', 'Type Color', 'Domain / Link', 'Industry', 'Ind. Color', 'Linked Contacts', 'Item ID', 'Open']} />{pageRows.map((account) => <div style={styles.accountRow} key={account.id}><Cell><div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 6 }}><TextCell value={account.name} onChange={(value) => patchAccount(account.id, { name: value })} /><button type="button" style={styles.button} onClick={() => setActive({ kind: 'account', id: account.id })}>Open</button></div></Cell><Cell><SelectCell value={account.type} options={accountTypes} color={colorMap[account.type]} onChange={(value) => patchAccount(account.id, { type: value })} onAdd={(value) => { addOption('accountTypes', value); patchAccount(account.id, { type: value }); setValueColor(value, '#777777'); }} /></Cell><Cell><ColorCell value={account.type} color={colorMap[account.type]} onColor={(color) => setValueColor(account.type, color)} /></Cell><Cell><LinkCell value={account.domain} onChange={(value) => patchAccount(account.id, { domain: value })} /></Cell><Cell><SelectCell value={account.industry} options={industries} color={colorMap[account.industry]} onChange={(value) => patchAccount(account.id, { industry: value })} onAdd={(value) => { addOption('industries', value); patchAccount(account.id, { industry: value }); setValueColor(value, '#777777'); }} /></Cell><Cell><ColorCell value={account.industry} color={colorMap[account.industry]} onColor={(color) => setValueColor(account.industry, color)} /></Cell><Cell><div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 6 }}><TextCell value={names(account.contacts)} onChange={(value) => patchAccount(account.id, { contacts: splitNames(value) })} /><button type="button" style={styles.button} onClick={() => addContact(account)}>+</button></div></Cell><Cell><span>{account.itemId}</span></Cell><Cell><button type="button" style={styles.button} onClick={() => setActive({ kind: 'account', id: account.id })}>Open</button></Cell></div>)}</> : <><Head rowStyle={styles.contactRow} columns={['Contact', 'Type', 'Type Color', 'Linked Account', 'Title', 'Phone', 'Email / Link', 'Open']} />{pageRows.map((contact) => <div style={styles.contactRow} key={contact.id}><Cell><TextCell value={contact.name} onChange={(value) => patchContact(contact.id, { name: value })} /></Cell><Cell><SelectCell value={contact.type} options={contactTypes} color={colorMap[contact.type]} onChange={(value) => patchContact(contact.id, { type: value })} onAdd={(value) => { addOption('contactTypes', value); patchContact(contact.id, { type: value }); setValueColor(value, '#777777'); }} /></Cell><Cell><ColorCell value={contact.type} color={colorMap[contact.type]} onColor={(color) => setValueColor(contact.type, color)} /></Cell><Cell><select style={inputStyle} value={contact.accountId || ''} onChange={(event) => { const account = crm.accounts.find((row) => row.id === event.target.value); patchContact(contact.id, { accountId: account?.id || '', linkedAccount: account?.name || '' }); }}><option value="">No linked account</option>{crm.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></Cell><Cell><TextCell value={contact.title} onChange={(value) => patchContact(contact.id, { title: value })} /></Cell><Cell><TextCell value={contact.phone} onChange={(value) => patchContact(contact.id, { phone: value })} /></Cell><Cell><LinkCell kind="email" value={contact.email} onChange={(value) => patchContact(contact.id, { email: value })} /></Cell><Cell><button type="button" style={styles.button} onClick={() => setActive({ kind: 'contact', id: contact.id })}>Open</button></Cell></div>)}</>}</div></div>
      <div style={styles.pager}><button type="button" style={styles.button} disabled={safePage <= 1} onClick={() => setPage(1)}>First</button><button type="button" style={styles.button} disabled={safePage <= 1} onClick={() => setPage((current) => clampPage(current - 1, totalPages))}>Prev</button><strong>Page {safePage} of {totalPages}</strong><button type="button" style={styles.button} disabled={safePage >= totalPages} onClick={() => setPage((current) => clampPage(current + 1, totalPages))}>Next</button><button type="button" style={styles.button} disabled={safePage >= totalPages} onClick={() => setPage(totalPages)}>Last</button></div>
    </article></section>
    {activeAccount ? <AccountDetail account={activeAccount} linkedContacts={linkedContacts} accountTypes={accountTypes} industries={industries} colorMap={colorMap} close={() => setActive(null)} patchAccount={patchAccount} patchContact={patchContact} addOption={addOption} setValueColor={setValueColor} addContact={addContact} openContact={(contactId) => setActive({ kind: 'contact', id: contactId })} /> : null}
    {activeContact ? <ContactDetail contact={activeContact} account={activeContactAccount} contactTypes={contactTypes} colorMap={colorMap} close={() => setActive(null)} patchContact={patchContact} addOption={addOption} setValueColor={setValueColor} /> : null}
  </>;
}

export function isLiveCanonicalPortal(id) { return id === 'contacts' || Boolean(genericModules[id]); }

export default function LiveCanonicalPortal({ id, Header }) {
  if (id === 'contacts') return <ContactsCrm Header={Header} id={id} />;
  const data = genericModules[id];
  if (!data) return null;
  return <>{Header ? <Header id={id} /> : null}<section className="live-module-shell canonical-force-live"><article className="live-module-card"><p className="eyebrow">Canonical live module</p><h2>{data.title}</h2><p>{data.intro}</p><div className="live-module-actions"><button type="button">Open</button><button type="button">Route</button><button type="button">Approve</button><button type="button">Proof</button></div><div className="live-module-metrics">{data.metrics.map((row) => <Metric row={row} key={row[0]} />)}</div></article><SimpleGrid title={`${data.title} workspace`} rows={data.metrics} /></section></>;
}
