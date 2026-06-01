import React, { useState } from 'react';

const genericModules = {
  admin: { title: 'Admin', intro: 'Tenant controls, users, roles, portal access, setup, security, and audit controls.', metrics: [['Users', '6', 'Authenticated roles'], ['Portals', '12', 'Enabled'], ['Setup', 'Open', 'Guided setup'], ['Audit', 'Ready', 'Proof events']] },
  hr: { title: 'HR Portal', intro: 'Employee records, onboarding, handbook, training, PTO, and employee documents.', metrics: [['Employees', '17', 'Active'], ['Training', '4', 'Due'], ['PTO', '2', 'Pending'], ['Docs', 'Ready', 'Files']] },
  vendor: { title: 'Vendor Portal', intro: 'Vendor packets, PO visibility, due dates, upload slots, receiving status, and vendor communication.', metrics: [['Packets', '19', 'Open'], ['Uploads', '5', 'Needed'], ['Late', '3', 'Follow-up'], ['AP links', '14', 'Ready']] },
  customer: { title: 'Customer Portal', intro: 'Customer approvals, payments, documents, uploads, job status, and customer communication.', metrics: [['Approvals', '11', 'Action'], ['Invoices', '$27k', 'Open'], ['Uploads', '6', 'Needed'], ['Threads', '22', 'Active']] },
  employee: { title: 'Employee Self-Service', intro: 'Employee profile, PTO requests, handbook acknowledgements, training assignments, documents, and HR help.', metrics: [['Training', '4 due', 'Assignments'], ['PTO', '2', 'Pending'], ['Docs', '12', 'Files'], ['Help', 'Live', 'Support']] }
};

const customers = [
  { id: 1, name: 'Customer A', company: 'Zillow lead', source: 'Zillow', status: 'Hot Lead', lastEvent: 'SMS reply received', owner: 'Sales Team', next: 'Call back now', score: 92, timeline: ['Lead email received', 'Lead parsed', 'Call attempted', 'SMS delivered', 'SMS reply received', 'AI moved lead to Hot Lead'] },
  { id: 2, name: 'Customer B', company: 'Realtor.com lead', source: 'Realtor.com', status: 'Opened Message', lastEvent: 'Email opened', owner: 'Sales Team', next: 'Send follow-up text', score: 74, timeline: ['Lead email received', 'Lead parsed', 'Call attempted', 'SMS delivered', 'Tracked email sent', 'Email opened'] },
  { id: 3, name: 'Customer C', company: 'Website form lead', source: 'Website Form', status: 'Needs Review', lastEvent: 'Missing phone', owner: 'Unassigned', next: 'Review missing phone number', score: 38, timeline: ['Website form received', 'Email captured', 'Tracked email queued', 'AI routed to manual review'] }
];

function Metric({ row }) {
  return <div className="live-module-metric"><strong>{row[0]}</strong><b>{row[1]}</b><span>{row[2]}</span></div>;
}

function SimpleGrid({ title, rows }) {
  return <div className="live-module-grid"><article className="live-module-card"><h3>{title}</h3><div className="live-module-list">{rows.map((row) => <div className="live-module-row" key={row[0]}><div><strong>{row[0]}</strong><span>{row[1]}</span></div><b>{row[2]}</b></div>)}</div></article></div>;
}

function CustomerList({ customers, activeId, setActiveId }) {
  return <article className="live-module-card">
    <h3>Customer list</h3>
    <div className="live-module-list">
      {customers.map((customer) => <div className="live-module-row live-module-row-action" key={customer.id}>
        <button type="button" onClick={() => setActiveId(customer.id)}>
          <strong>{customer.name}</strong>
          <span>{customer.company} - {customer.source} - {customer.owner}</span>
        </button>
        <b>{customer.status}</b>
        <div className="live-row-actions">
          <button type="button" onClick={() => setActiveId(customer.id)}>Open</button>
          <button type="button" onClick={() => setActiveId(customer.id)}>Call</button>
          <button type="button" onClick={() => setActiveId(customer.id)}>Text</button>
          <button type="button" onClick={() => setActiveId(customer.id)}>Route</button>
        </div>
      </div>)}
    </div>
  </article>;
}

function ContactsCrm({ Header, id }) {
  const [activeId, setActiveId] = useState(1);
  const [drawer, setDrawer] = useState('none');
  const active = customers.find((customer) => customer.id === activeId) || customers[0];

  return <>
    {Header ? <Header id={id} /> : null}
    <section className="live-module-shell canonical-force-live">
      <article className="live-module-card">
        <p className="eyebrow">CRM</p>
        <h2>Contacts / CRM</h2>
        <p>Customer and contact list first. Lead inbox, timeline, inbound lead details, and AI communication tracking stay inside the dropdown below.</p>
        <div className="live-module-actions">
          <label style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <strong>Open CRM detail</strong>
            <select value={drawer} onChange={(event) => setDrawer(event.target.value)}>
              <option value="none">Customer list only</option>
              <option value="leadInbox">Lead inbox</option>
              <option value="inboundLead">Selected inbound lead</option>
              <option value="timeline">Lead timeline</option>
              <option value="ai">AI and communication tracking</option>
              <option value="settings">CRM settings</option>
            </select>
          </label>
        </div>
      </article>

      <div className="live-module-grid">
        <CustomerList customers={customers} activeId={activeId} setActiveId={setActiveId} />
      </div>

      {drawer === 'leadInbox' && <SimpleGrid title="Lead inbox" rows={customers.map((customer) => [customer.company, `${customer.source} - ${customer.lastEvent}`, customer.status])} />}
      {drawer === 'inboundLead' && <SimpleGrid title={`Selected inbound lead: ${active.name}`} rows={[[active.company, `${active.source} - ${active.lastEvent}`, active.status], ['Lead score', String(active.score), 'AI priority'], ['Next action', active.next, 'Recommended'], ['Owner', active.owner, 'Assigned']]} />}
      {drawer === 'timeline' && <SimpleGrid title={`Lead timeline: ${active.name}`} rows={active.timeline.map((event, index) => [`Step ${index + 1}`, event, 'Tracked'])} />}
      {drawer === 'ai' && <SimpleGrid title="AI and communication tracking" rows={[['AI summary', `${active.source} lead is in ${active.status}. Latest engagement: ${active.lastEvent}.`, 'Visible'], ['Next action', active.next, 'Recommended'], ['Email tracking', 'Tracks opens and clicks when sent by the system.', 'Tracked'], ['SMS tracking', 'Tracks sent, delivered, failed, replies, and tracked links.', 'Tracked']]} />}
      {drawer === 'settings' && <SimpleGrid title="CRM settings" rows={[['Lead inboxes', 'Configure inbound lead sources.', 'Admin'], ['Communication settings', 'Configure calls, texts, callbacks, and replies.', 'Admin'], ['Email tracking', 'Configure opens, clicks, and bounces.', 'Admin'], ['Schema fields', 'Define contacts, companies, sources, and lead fields.', 'Admin'], ['Merge rules', 'Duplicate detection and canonical contact rules.', 'Admin'], ['Audit requirements', 'Proof, handoffs, and approvals live here.', 'Admin']]} />}
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
