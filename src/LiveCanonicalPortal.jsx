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

const customerActivities = {
  1: [['Email', 'Quote revision sent and stored on customer record.', 'Today'], ['Neroa Meeting', 'Video meeting summary saved with Vault link.', 'Vault'], ['Call', 'Reviewed lead time and material release schedule.', 'Yesterday'], ['Note', 'Prefers email for formal quotes and approvals.', 'Saved']],
  2: [['Email', 'Bid approval email stored under customer file.', 'Today'], ['Meeting', 'Zoom / Google Meet style meeting record saved to Vault.', 'Vault'], ['Text', 'Reminder text queued for project scope confirmation.', 'Scheduled']],
  3: [['Call', 'Maintenance scope reviewed with operations contact.', 'May 28'], ['Email', 'Platform detail questions sent to customer.', 'May 27'], ['Vault', 'Meeting notes, transcript, and next action linked.', 'Stored']],
  4: [['Email', 'Insurance document request sent.', 'Pending'], ['Note', 'Hold new work until paperwork is current.', 'Saved'], ['Follow-up', 'Schedule reminder to check COI status.', 'Next week']]
};

const prospectActivities = {
  101: [['Inbound', 'Facebook Ad captured the request and created a prospect record.', '12 min ago'], ['AI summary', 'AI detected pricing, timeline, and consultation questions.', '10 min ago'], ['Scheduled', 'First response text sequence is ready to send.', 'Next']],
  102: [['Inbound', 'Google Ads form submitted with building dimensions.', '48 min ago'], ['Email', 'Quote intake checklist is drafted but not sent.', 'Pending'], ['Meeting link', 'Neroa Connect calendar link can be sent and saved to Vault.', 'Ready']],
  103: [['Inbound', 'Website form submitted with preferred callback window.', 'Today'], ['Owner alert', 'Estimating should be notified before end of day.', 'Ready'], ['Call', 'Schedule a call and save the result to the record.', 'Next']]
};

const workflowCopy = {
  inbox: { title: 'Lead Inbox', text: 'All new prospect requests land here first. Facebook, Google Ads, website forms, email leads, referrals, and call-ins are normalized into prospect records before they become customers.', rows: [['Facebook Ad', '1 new prospect', 'Auto-routed'], ['Google Ads', '1 follow-up needed', 'Sales Team'], ['Website Form', '1 ready to contact', 'Estimating']] },
  timeline: { title: 'Timeline', text: 'Shows the prospect journey: source captured, AI summary created, owner notified, text/email sent, reply received, meeting booked, vault entry created, and converted to customer.', rows: [['12 min ago', 'Facebook lead captured', 'New'], ['10 min ago', 'AI summarized request', 'Complete'], ['Next', 'Start sequence and book meeting', 'Recommended']] },
  inbound: { title: 'Inbound Leads', text: 'Inbound lead routing identifies where the prospect came from and what information was submitted so the team knows what to do next.', rows: [['Source', 'Facebook, Google, website, email, referral, phone', 'Tracked'], ['Routing', 'Assign owner by source, service, and region', 'Ready'], ['Customer status', 'Stays prospect until converted', 'Clean CRM']] },
  ai: { title: 'AI Communication', text: 'AI drafts the first response, detects urgency, recommends the channel, and can hand the prospect to Neroa Connect for text, call, email, video meeting, or calendar follow-up.', rows: [['Suggested text', 'Hi, this is Steel Craft. We received your request and can help.', 'Draft'], ['Suggested email', 'Quote intake checklist and next-step questions.', 'Draft'], ['Suggested meeting', 'Neroa video, Zoom, or Google Meet link saved back to Vault.', 'Ready']] },
  automate: { title: 'Automate Follow-up', text: 'Build the prospect follow-up sequence here. Neroa Connect can manage text, email, AI calls, video meetings, calendar links, and Vault records.', rows: [['Day 1', 'Send first text and owner notification', 'Text'], ['Day 2', 'Send email with intake questions and booking link', 'Email'], ['Days 3-5', 'Daily text follow-up if no reply', 'Sequence'], ['Every 5 days', 'Long-term nurture until closed or converted', 'Nurture'], ['Meeting booked', 'Save provider, recording/transcript link, summary, and next action to Vault', 'Vault']] },
  activity: { title: 'Activity + Scheduled Follow-up', text: 'Track every contact attempt and schedule the next touch. Phone calls, texts, emails, notes, owner updates, meetings, and Vault links should all write back to the record.', rows: [['Log contact', 'Record a call, text, email, note, or meeting.', 'Manual'], ['Schedule email', 'Pick a date/time and save the email draft.', 'Scheduled'], ['Schedule meeting', 'Use Neroa video, Zoom, Google Meet, or calendar link.', 'Connect'], ['Vault link', 'Store recording, transcript, summary, and next action.', 'Vault'], ['Next touch', 'Set the next follow-up date and assigned owner.', 'Required']] }
};

const actionCopy = {
  addCustomer: ['Add Customer', 'Create a new customer record. Save company, contact, email, phone, owner, notes, and initial activity history.'],
  addProspect: ['Add Prospect', 'Create a new prospect manually or from an inbound source before converting it to a customer.'],
  connect: ['Set up Neroa Connect', 'Connect Neroa video meetings, Twilio, email, calling, calendar, Zoom, Google Meet, and Vault storage so every interaction writes back to the customer file.'],
  textSequence: ['Build Text Sequence', 'Choose first text, follow-up cadence, stop conditions, reply handling, owner notification, and Vault activity logging.'],
  scheduleEmail: ['Schedule Email', 'Draft an email, choose the send date, connect it to this record, and store the sent email in communication history.'],
  scheduleCall: ['Schedule Call', 'Create a call task or AI call, assign an owner, choose a date/time, and log the result back to the record.'],
  calendar: ['Send Calendar / Meeting Link', 'Send a Neroa Connect, Zoom, or Google Meet booking link and store provider, attendees, recording link, transcript, summary, and next action in Vault.'],
  aiCall: ['AI Call Step', 'Configure an AI call attempt, call script, handoff rule, meeting-booking path, and Vault summary.'],
  log: ['Log Activity', 'Add a manual email, call, text, meeting, owner update, Vault link, or note to this record.'],
  save: ['Save Record', 'Save changes to the customer or prospect record and update the activity history.'],
  edit: ['Edit Record', 'Unlock the record fields so a user can update contact details, owner, status, notes, and contact preferences.'],
  convert: ['Convert to Customer', 'Move this prospect into the Customer List while keeping the original source, communication history, automation record, meeting history, and Vault links.'],
  sendText: ['Send Text', 'Open the text composer, send through Twilio/Neroa Connect, and store the message under this record.'],
  sendEmail: ['Send Email', 'Open the email composer, send through connected email, and store the email under this record.'],
  owner: ['Notify Owner', 'Send an internal notification to the assigned owner with the prospect summary and next action.']
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
  overlay: { position: 'fixed', inset: 0, zIndex: 40, display: 'grid', placeItems: 'start center', padding: '80px 24px 40px', background: 'rgba(0,0,0,.54)', backdropFilter: 'blur(6px)', overflowY: 'auto' },
  record: { width: 'min(1120px, calc(100vw - 80px))', padding: 34, borderRadius: 28, boxShadow: '0 28px 90px rgba(0,0,0,.55)' },
  recordHeader: { display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'start', marginBottom: 20 },
  recordTitle: { fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 1, margin: '8px 0', letterSpacing: '-0.05em' },
  form: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 },
  full: { gridColumn: '1 / -1' },
  recordActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, flexWrap: 'wrap' },
  recordGrid: { display: 'grid', gridTemplateColumns: 'minmax(0, .9fr) minmax(360px, .7fr)', gap: 18, alignItems: 'start', marginTop: 18 },
  miniCard: { border: '1px solid var(--line)', borderRadius: 18, padding: 16, background: 'rgba(255,255,255,.04)' },
  textarea: { minHeight: 96 }
};

function Metric({ row }) { return <div className="live-module-metric"><strong>{row[0]}</strong><b>{row[1]}</b><span>{row[2]}</span></div>; }
function SimpleGrid({ title, rows }) { return <div className="live-module-grid crm-wide-grid"><article className="live-module-card crm-wide-card"><h3>{title}</h3><div className="live-module-list">{rows.map((row) => <div className="live-module-row" key={row[0]}><div><strong>{row[0]}</strong><span>{row[1]}</span></div><b>{row[2]}</b></div>)}</div></article></div>; }
function Field({ label, children, full = false }) { return <label style={full ? crmStyles.full : undefined}><span>{label}</span>{children}</label>; }

function ActionPanel({ action, close }) {
  if (!action) return null;
  const [title, text] = actionCopy[action] || ['CRM Action', 'This action opens the matching CRM workflow.'];
  return <div style={crmStyles.overlay} onClick={close}><aside className="live-module-card" style={{ ...crmStyles.record, width: 'min(760px, calc(100vw - 80px))' }} onClick={(event) => event.stopPropagation()}><div style={crmStyles.recordHeader}><div><p className="eyebrow">CRM Action</p><h3 style={crmStyles.recordTitle}>{title}</h3><p>{text}</p></div><button type="button" style={ghostButton} onClick={close}>Close</button></div><div style={crmStyles.form}><Field label="Action status"><input value="Ready to configure" readOnly /></Field><Field label="Destination"><input value="Neroa Connect / CRM history / Vault" readOnly /></Field><Field label="Provider"><select defaultValue="neroa"><option value="neroa">Neroa video</option><option value="zoom">Zoom</option><option value="google-meet">Google Meet</option><option value="twilio">Twilio</option><option value="email">Connected email</option></select></Field><Field label="Vault record"><input value="Create or attach Vault link" readOnly /></Field><Field label="Notes" full><textarea style={crmStyles.textarea} placeholder="Configure this action, add notes, attach meeting links, or connect the required service." /></Field></div><div style={crmStyles.recordActions}><button type="button" style={ghostButton} onClick={close}>Cancel</button><button type="button" style={saasButton} onClick={close}>Save action</button></div></aside></div>;
}

function ActivityPanel({ rows = [], onAction }) {
  return <section style={crmStyles.miniCard}><p className="eyebrow">Communication History</p><h3>Emails, texts, calls, meetings, Vault</h3><p style={crmStyles.subText}>Connected email, Twilio texts, calls, AI calls, Neroa/Zoom/Google Meet meetings, notes, and calendar activity save to this record.</p><div style={crmStyles.panelGrid}>{rows.map((row) => <button type="button" style={{ ...crmStyles.panelRow, color: 'var(--text)', textAlign: 'left' }} key={`${row[0]}-${row[2]}`} onClick={() => onAction(row[0] === 'Vault' || row[2] === 'Vault' || row[2] === 'Stored' ? 'calendar' : 'log')}><strong>{row[0]}</strong><span>{row[1]}</span><b>{row[2]}</b></button>)}</div></section>;
}

function FollowUpPanel({ prospect = false, onAction }) {
  return <section style={crmStyles.miniCard}><p className="eyebrow">Next Touch</p><h3>Log or schedule contact</h3><div style={crmStyles.form}><Field label="Contact type"><select defaultValue="meeting"><option value="call">Phone call</option><option value="text">Text message</option><option value="email">Email</option><option value="note">Note</option><option value="meeting">Meeting</option><option value="ai-call">AI call</option></select></Field><Field label="Date / time"><input placeholder="Tomorrow at 9:00 AM" /></Field><Field label="Assigned owner"><input placeholder="Sales Team" /></Field><Field label="Status"><select defaultValue="scheduled"><option value="logged">Logged</option><option value="scheduled">Scheduled</option><option value="sent">Sent</option><option value="completed">Completed</option></select></Field><Field label="Notes" full><textarea style={crmStyles.textarea} placeholder="What happened, or what should be sent next?" /></Field></div><div style={crmStyles.recordActions}><button type="button" style={ghostButton} onClick={() => onAction('log')}>Log activity</button><button type="button" style={ghostButton} onClick={() => onAction('scheduleEmail')}>Schedule email</button><button type="button" style={ghostButton} onClick={() => onAction('scheduleCall')}>Schedule call</button><button type="button" style={ghostButton} onClick={() => onAction('calendar')}>Schedule meeting</button>{prospect && <button type="button" style={saasButton} onClick={() => onAction('textSequence')}>Start automation</button>}</div></section>;
}

function WorkflowPanel({ mode, onAction }) {
  const data = workflowCopy[mode];
  if (!data) return null;
  return <section style={crmStyles.panel}><p className="eyebrow">Prospect workflow</p><h3>{data.title}</h3><p style={crmStyles.subText}>{data.text}</p><div style={crmStyles.panelGrid}>{data.rows.map((row) => <button type="button" style={{ ...crmStyles.panelRow, color: 'var(--text)', textAlign: 'left' }} key={row[0]} onClick={() => onAction(mode === 'automate' ? 'textSequence' : mode === 'ai' ? 'aiCall' : mode === 'activity' ? 'log' : 'owner')}><strong>{row[0]}</strong><span>{row[1]}</span><b>{row[2]}</b></button>)}</div>{(mode === 'automate' || mode === 'activity') && <div style={crmStyles.recordActions}><button type="button" style={saasButton} onClick={() => onAction('connect')}>Set up Neroa Connect</button><button type="button" style={ghostButton} onClick={() => onAction('textSequence')}>Build text sequence</button><button type="button" style={ghostButton} onClick={() => onAction('scheduleEmail')}>Schedule email</button><button type="button" style={ghostButton} onClick={() => onAction('calendar')}>Meeting link / Vault</button><button type="button" style={ghostButton} onClick={() => onAction('aiCall')}>Create AI call step</button></div>}</section>;
}

function ContactsCrm({ Header, id }) {
  const [tab, setTab] = useState('customers');
  const [activeCustomerId, setActiveCustomerId] = useState(null);
  const [activeProspectId, setActiveProspectId] = useState(null);
  const [query, setQuery] = useState('');
  const [workflow, setWorkflow] = useState('activity');
  const [action, setAction] = useState(null);
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
    <section className="live-module-shell canonical-force-live" style={crmStyles.shell}><article className="live-module-card" style={crmStyles.listCard}>
      <div style={crmStyles.tabs}><button type="button" style={tabButton(tab === 'customers')} onClick={() => { setTab('customers'); setQuery(''); }}>Customer List</button><button type="button" style={tabButton(tab === 'prospects')} onClick={() => { setTab('prospects'); setQuery(''); setWorkflow('activity'); }}>Prospect Customers</button></div>
      <div style={crmStyles.listHeader}><div><p className="eyebrow">CRM</p><h2 style={crmStyles.title}>{tab === 'customers' ? 'Customer List' : 'Prospect Customers'}</h2><p style={crmStyles.subText}>{tab === 'customers' ? 'Search, open, and manage customer records from one clean customer database.' : 'Inbound leads from Facebook, Google, website, email, referral, and calls land here before they become customers.'}</p></div><div style={crmStyles.headerRight}><div style={crmStyles.chips}><div style={crmStyles.chip}><span style={crmStyles.chipLabel}>{tab === 'customers' ? 'Total customers' : 'Open prospects'}</span><strong style={crmStyles.chipValue}>{tab === 'customers' ? '280' : prospects.length}</strong></div><div style={crmStyles.chip}><span style={crmStyles.chipLabel}>Needs review</span><strong style={crmStyles.chipValue}>1</strong></div></div><div style={crmStyles.actions}><input style={crmStyles.search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tab === 'customers' ? 'Search customers...' : 'Search prospects...'} aria-label="Search CRM" /><button type="button" style={saasButton} onClick={() => setAction(tab === 'customers' ? 'addCustomer' : 'addProspect')}>{tab === 'customers' ? 'Add Customer' : 'Add Prospect'}</button></div></div></div>
      {tab === 'prospects' && <><div style={crmStyles.tools}><button type="button" style={tabButton(workflow === 'activity')} onClick={() => setWorkflow('activity')}>Activity</button><button type="button" style={tabButton(workflow === 'automate')} onClick={() => setWorkflow('automate')}>Automate</button><button type="button" style={tabButton(workflow === 'inbox')} onClick={() => setWorkflow('inbox')}>Lead Inbox</button><button type="button" style={tabButton(workflow === 'timeline')} onClick={() => setWorkflow('timeline')}>Timeline</button><button type="button" style={tabButton(workflow === 'inbound')} onClick={() => setWorkflow('inbound')}>Inbound Leads</button><button type="button" style={tabButton(workflow === 'ai')} onClick={() => setWorkflow('ai')}>AI Communication</button></div><WorkflowPanel mode={workflow} onAction={setAction} /></>}
      {tab === 'customers' ? <div style={crmStyles.table}><div style={{ ...crmStyles.row, ...crmStyles.head }}><span>Company</span><span>Contact</span><span>Type</span><span>Status</span><span>Owner</span><span>Last Activity</span><span>Value</span><span></span></div>{filtered.map((customer) => <button type="button" key={customer.id} onClick={() => setActiveCustomerId(customer.id)} style={crmStyles.dataRow}><div style={crmStyles.row}><strong>{customer.company}</strong><span>{customer.contact}</span><span>{customer.type}</span><b>{customer.status}</b><span>{customer.owner}</span><span>{customer.activity}</span><strong>{customer.value}</strong><b>Open</b></div></button>)}</div> : <div style={crmStyles.table}><div style={{ ...crmStyles.prospectRow, ...crmStyles.head }}><span>Prospect</span><span>Source</span><span>Status</span><span>Owner</span><span>Received</span><span>AI next action</span><span></span></div>{filtered.map((prospect) => <button type="button" key={prospect.id} onClick={() => setActiveProspectId(prospect.id)} style={crmStyles.dataRow}><div style={crmStyles.prospectRow}><strong>{prospect.company}</strong><span>{prospect.source}</span><b>{prospect.status}</b><span>{prospect.owner}</span><span>{prospect.received}</span><span>{prospect.action}</span><b>Open</b></div></button>)}</div>}
    </article></section>

    {activeCustomer && <div style={crmStyles.overlay} onClick={() => setActiveCustomerId(null)}><aside className="live-module-card" style={crmStyles.record} onClick={(event) => event.stopPropagation()}><div style={crmStyles.recordHeader}><div><p className="eyebrow">Customer Record</p><h3 style={crmStyles.recordTitle}>{activeCustomer.company}</h3><p>{activeCustomer.notes}</p></div><button type="button" style={ghostButton} onClick={() => setActiveCustomerId(null)}>Close</button></div><div style={crmStyles.recordGrid}><div><div style={crmStyles.form}><Field label="Company"><input value={activeCustomer.company} readOnly /></Field><Field label="Primary Contact"><input value={activeCustomer.contact} readOnly /></Field><Field label="Customer Type"><input value={activeCustomer.type} readOnly /></Field><Field label="Owner"><input value={activeCustomer.owner} readOnly /></Field><Field label="Phone"><input value={activeCustomer.phone} readOnly /></Field><Field label="Email"><input value={activeCustomer.email} readOnly /></Field><Field label="Location"><input value={activeCustomer.location} readOnly /></Field><Field label="Open Value"><input value={activeCustomer.value} readOnly /></Field><Field label="Notes" full><textarea rows="4" value={activeCustomer.notes} readOnly /></Field></div><div style={crmStyles.recordActions}><button type="button" style={ghostButton} onClick={() => setAction('edit')}>Edit Record</button><button type="button" style={saasButton} onClick={() => setAction('save')}>Save</button></div></div><div style={{ display: 'grid', gap: 16 }}><ActivityPanel rows={customerActivities[activeCustomer.id]} onAction={setAction} /><FollowUpPanel onAction={setAction} /></div></div></aside></div>}

    {activeProspect && <div style={crmStyles.overlay} onClick={() => setActiveProspectId(null)}><aside className="live-module-card" style={crmStyles.record} onClick={(event) => event.stopPropagation()}><div style={crmStyles.recordHeader}><div><p className="eyebrow">Prospect Customer</p><h3 style={crmStyles.recordTitle}>{activeProspect.company}</h3><p>{activeProspect.sourceDetail}</p></div><button type="button" style={ghostButton} onClick={() => setActiveProspectId(null)}>Close</button></div><div style={crmStyles.recordGrid}><div><div style={crmStyles.form}><Field label="Prospect Name"><input value={activeProspect.name} readOnly /></Field><Field label="Lead Source"><input value={activeProspect.source} readOnly /></Field><Field label="Phone"><input value={activeProspect.phone} readOnly /></Field><Field label="Email"><input value={activeProspect.email} readOnly /></Field><Field label="Status"><input value={activeProspect.status} readOnly /></Field><Field label="Owner"><input value={activeProspect.owner} readOnly /></Field><Field label="AI Summary" full><textarea rows="4" value={activeProspect.ai} readOnly /></Field></div><div style={crmStyles.recordActions}><button type="button" style={saasButton} onClick={() => setAction('textSequence')}>Automate Follow-up</button><button type="button" style={ghostButton} onClick={() => setAction('sendText')}>Send Text</button><button type="button" style={ghostButton} onClick={() => setAction('sendEmail')}>Send Email</button><button type="button" style={ghostButton} onClick={() => setAction('aiCall')}>AI Call</button><button type="button" style={ghostButton} onClick={() => setAction('calendar')}>Send Calendar Link</button><button type="button" style={saasButton} onClick={() => setAction('convert')}>Convert to Customer</button></div><p style={crmStyles.subText}>Automations run through Neroa Connect: native video, Twilio text/calls, email, Zoom/Google Meet style meeting links, calendar booking, and Vault records.</p></div><div style={{ display: 'grid', gap: 16 }}><ActivityPanel rows={prospectActivities[activeProspect.id]} onAction={setAction} /><FollowUpPanel prospect onAction={setAction} /></div></div></aside></div>}
    <ActionPanel action={action} close={() => setAction(null)} />
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
