import React, { useState } from 'react';

const genericModules = {
  admin: { title: 'Admin', intro: 'Tenant controls, users, roles, portal access, setup, security, and audit controls.', metrics: [['Users', '6', 'Authenticated roles'], ['Portals', '12', 'Enabled'], ['Setup', 'Open', 'Guided setup'], ['Audit', 'Ready', 'Proof events']] },
  hr: { title: 'HR Portal', intro: 'Employee records, onboarding, handbook, training, PTO, and employee documents.', metrics: [['Employees', '17', 'Active'], ['Training', '4', 'Due'], ['PTO', '2', 'Pending'], ['Docs', 'Ready', 'Files']] },
  vendor: { title: 'Vendor Portal', intro: 'Vendor packets, PO visibility, due dates, upload slots, receiving status, and vendor communication.', metrics: [['Packets', '19', 'Open'], ['Uploads', '5', 'Needed'], ['Late', '3', 'Follow-up'], ['AP links', '14', 'Ready']] },
  customer: { title: 'Customer Portal', intro: 'Customer approvals, payments, documents, uploads, job status, and customer communication.', metrics: [['Approvals', '11', 'Action'], ['Invoices', '$27k', 'Open'], ['Uploads', '6', 'Needed'], ['Threads', '22', 'Active']] },
  employee: { title: 'Employee Self-Service', intro: 'Employee profile, PTO requests, handbook acknowledgements, training assignments, documents, and HR help.', metrics: [['Training', '4 due', 'Assignments'], ['PTO', '2', 'Pending'], ['Docs', '12', 'Files'], ['Help', 'Live', 'Support']] }
};

const crmLeads = [
  { id: 1, label: 'Inbound lead A', stage: 'Hot Lead', source: 'Zillow', event: 'SMS reply received', score: 92, next: 'Call back now', timeline: ['Lead email received', 'Lead parsed', 'Call attempted', 'SMS delivered', 'SMS reply received', 'AI moved lead to Hot Lead'] },
  { id: 2, label: 'Inbound lead B', stage: 'Opened Message', source: 'Realtor.com', event: 'Email opened', score: 74, next: 'Send follow-up text', timeline: ['Lead email received', 'Lead parsed', 'Call attempted', 'SMS delivered', 'Tracked email sent', 'Email opened'] },
  { id: 3, label: 'Inbound lead C', stage: 'Needs Review', source: 'Website Form', event: 'Missing phone', score: 38, next: 'Review missing phone number', timeline: ['Website form received', 'Email captured', 'Tracked email queued', 'AI routed to manual review'] }
];

function Metric({ row }) {
  return <div className="live-module-metric"><strong>{row[0]}</strong><b>{row[1]}</b><span>{row[2]}</span></div>;
}

function SimpleGrid({ title, rows }) {
  return <div className="live-module-grid"><article className="live-module-card"><h3>{title}</h3><div className="live-module-list">{rows.map((row) => <div className="live-module-row" key={row[0]}><div><strong>{row[0]}</strong><span>{row[1]}</span></div><b>{row[2]}</b></div>)}</div></article></div>;
}

function ContactsCrm({ Header, id }) {
  const [tab, setTab] = useState('Dashboard');
  const [activeId, setActiveId] = useState(1);
  const active = crmLeads.find((lead) => lead.id === activeId) || crmLeads[0];
  const hot = crmLeads.filter((lead) => lead.stage === 'Hot Lead').length;
  const opened = crmLeads.filter((lead) => /opened/i.test(lead.event)).length;
  const replies = crmLeads.filter((lead) => /reply/i.test(lead.event)).length;
  const tabs = ['Dashboard', 'Lead Inbox', 'Conversations', 'Pipeline', 'Reports', 'Settings'];

  return <>
    {Header ? <Header id={id} /> : null}
    <section className="live-module-shell canonical-force-live">
      <article className="live-module-card">
        <p className="eyebrow">Live CRM module</p>
        <h2>Contacts / CRM</h2>
        <p>Lead intake, call and text follow-up, tracked email, AI summaries, pipeline routing, conversations, contacts, companies, and follow-up visibility.</p>
        <div className="live-module-actions">{tabs.map((item) => <button type="button" key={item} onClick={() => setTab(item)}>{item}</button>)}</div>
        <div className="live-module-metrics">
          <Metric row={['New leads today', String(crmLeads.length), 'Inbound sources']} />
          <Metric row={['Hot leads', String(hot), 'Replies / answered calls']} />
          <Metric row={['Email opened', String(opened), 'Tracked opens']} />
          <Metric row={['SMS replies', String(replies), 'Two-way conversations']} />
        </div>
      </article>

      {tab === 'Dashboard' && <div className="live-module-grid">
        <article className="live-module-card"><h3>Live lead inbox</h3><div className="live-module-list">{crmLeads.map((lead) => <div className="live-module-row live-module-row-action" key={lead.id}><button type="button" onClick={() => setActiveId(lead.id)}><strong>{lead.label}</strong><span>{lead.source} - {lead.stage}</span></button><b>{lead.event}</b><div className="live-row-actions"><button type="button" onClick={() => setActiveId(lead.id)}>Open</button><button type="button" onClick={() => setActiveId(lead.id)}>Call</button><button type="button" onClick={() => setActiveId(lead.id)}>Text</button><button type="button" onClick={() => setActiveId(lead.id)}>Route</button></div></div>)}</div></article>
        <article className="live-module-card"><h3>{active.label}</h3><div className="live-module-proof"><strong>AI summary</strong><span>{active.source} lead is in {active.stage}. Latest engagement: {active.event}. Recommended next action: {active.next}.</span></div><div className="live-module-metrics"><Metric row={['Stage', active.stage, 'AI routed']} /><Metric row={['Score', String(active.score), 'Lead priority']} /><Metric row={['Source', active.source, 'Lead source']} /><Metric row={['Next', active.next, 'Recommended']} /></div></article>
        <article className="live-module-card"><h3>Lead timeline</h3><div className="live-module-status-strip">{active.timeline.map((event, index) => <button className="live-module-step" type="button" key={event}><b>{index + 1}</b><span>{event}</span></button>)}</div></article>
        <article className="live-module-card"><h3>AI and communication tracking</h3><div className="live-module-proof"><strong>AI role</strong><span>AI parses inbound leads, scores urgency, summarizes activity, recommends next action, and routes pipeline stage.</span></div><div className="live-module-proof"><strong>Tracking note</strong><span>Email can track opens and clicks when sent by the system. SMS tracks sent, delivered, failed, replies, and tracked links.</span></div></article>
      </div>}

      {tab === 'Lead Inbox' && <SimpleGrid title="Inbound lead sources" rows={[['Zillow inbox', 'Parse lead emails and queue fast response.', 'Active'], ['Realtor.com inbox', 'Parse lead emails and capture source.', 'Active'], ['Website forms', 'Capture quote requests and route missing info.', 'Active'], ['Manual entry', 'Create lead from call, referral, or import.', 'Ready']]} />}
      {tab === 'Conversations' && <SimpleGrid title="Communication tracking" rows={[['Call connected', 'Picked up or connected status.', 'Tracked'], ['Call missed', 'No answer, voicemail, failed, or busy.', 'Tracked'], ['SMS delivered', 'Delivery callback.', 'Tracked'], ['SMS replied', 'Inbound reply updates lead stage.', 'Hot'], ['Email opened', 'Open event from tracked email.', 'Tracked'], ['Email clicked', 'Tracked link click event.', 'Engaged']]} />}
      {tab === 'Pipeline' && <SimpleGrid title="Pipeline stages" rows={[['New Lead', 'Received but not yet engaged.', 'Open'], ['Hot Lead', 'Reply or call connected.', 'Priority'], ['Opened Message', 'Email opened or clicked.', 'Engaged'], ['Follow Up', 'Delivered but no reply yet.', 'Due'], ['Appointment Set', 'Meeting booked.', 'Booked'], ['Needs Review', 'Missing contact info or duplicate check.', 'Review']]} />}
      {tab === 'Reports' && <SimpleGrid title="Source performance" rows={[['Zillow', '14 leads', '93% contacted'], ['Realtor.com', '9 leads', '89% contacted'], ['Website Forms', '7 leads', '71% contacted']]} />}
      {tab === 'Settings' && <SimpleGrid title="CRM setup" rows={[['Lead inboxes', 'Configure inbound email sources.', 'Admin'], ['Communication settings', 'Configure calls, texts, callbacks, and replies.', 'Admin'], ['Email tracking', 'Configure tracked opens, clicks, and bounces.', 'Admin'], ['Schema fields', 'Define contacts, companies, sources, and lead fields.', 'Admin'], ['Merge rules', 'Duplicate detection and canonical contact rules.', 'Admin'], ['Audit requirements', 'Proof, handoffs, and approvals live here.', 'Admin']]} />}
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
